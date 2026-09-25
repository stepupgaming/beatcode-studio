'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, Film, LoaderCircle, MonitorUp, Square, X } from 'lucide-react';
import { getAudioEngine } from '@/lib/audioEngine';
import {
  combineMediaStreams,
  downloadBlob,
  getRecordingBitrate,
  getSupportedVideoMimeType,
  getVideoExportDimensions,
  getVideoExtension,
  VideoExportAspectRatio,
  VideoExportQuality,
} from '@/lib/videoExport';

interface VideoExportControlProps {
  aspectRatio: VideoExportAspectRatio;
  captureMode?: 'canvas' | 'screen';
  getCanvas?: () => HTMLCanvasElement | null;
  onCanvasResize?: (width: number, height: number) => void;
  className?: string;
}

type FrameRate = 30 | 60;
type DurationLimit = 0 | 30 | 60 | 300;

function formatElapsedTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export default function VideoExportControl({
  aspectRatio,
  captureMode = 'canvas',
  getCanvas,
  onCanvasResize,
  className = '',
}: VideoExportControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quality, setQuality] = useState<VideoExportQuality>('720p');
  const [fps, setFps] = useState<FrameRate>(30);
  const [durationLimit, setDurationLimit] = useState<DurationLimit>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!isRecording) return;

    const interval = window.setInterval(() => {
      const nextElapsed = (performance.now() - startedAtRef.current) / 1000;
      setElapsed(nextElapsed);
      if (durationLimit > 0 && nextElapsed >= durationLimit && recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    }, 200);

    return () => window.clearInterval(interval);
  }, [durationLimit, isRecording]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isRecording) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, isRecording]);

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  };

  const startRecording = async () => {
    if (isRecording) return;

    setError(null);
    setElapsed(0);

    const mimeType = getSupportedVideoMimeType();
    if (!mimeType) {
      setError('This browser does not support in-browser video recording.');
      return;
    }

    if (typeof MediaStream === 'undefined') {
      setError('This browser does not expose the MediaStream recording API.');
      return;
    }

    let videoStream: MediaStream | null = null;
    let audioStream: MediaStream | null = null;

    try {
      const engine = getAudioEngine();
      await engine.resumeAudioContext();
      if (!engine.getIsPlaying()) await engine.togglePlayPause();
      const requestedDimensions = getVideoExportDimensions(aspectRatio, quality);

      if (captureMode === 'canvas') {
        const canvas = getCanvas?.();
        if (!canvas || typeof canvas.captureStream !== 'function') {
          throw new Error('The visual stage is not ready yet. Try again in a moment.');
        }

        onCanvasResize?.(requestedDimensions.width, requestedDimensions.height);
        videoStream = canvas.captureStream(fps);
        audioStream = engine.getRecordingStream();
      } else {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error('Screen recording is not supported in this browser.');
        }

        videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: fps },
          audio: true,
        });
        audioStream = videoStream.getAudioTracks().length
          ? null
          : engine.getRecordingStream();
      }

      const stream = combineMediaStreams(videoStream, audioStream);
      streamRef.current = stream;

      const videoTrack = videoStream.getVideoTracks()[0];
      const trackSettings = videoTrack?.getSettings();
      const width = trackSettings?.width || requestedDimensions.width;
      const height = trackSettings?.height || requestedDimensions.height;
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: getRecordingBitrate(width, height, fps),
      });

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        if (!mountedRef.current) return;
        setError('Recording stopped because the browser returned an encoder error.');
        setIsRecording(false);
        releaseStream();
      };
      recorder.onstop = () => {
        if (!mountedRef.current) return;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size > 0) {
          const extension = getVideoExtension(mimeType);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          downloadBlob(blob, `beatcode-stage-${timestamp}.${extension}`);
        } else {
          setError('No video data was produced. Please try a shorter recording.');
        }
        chunksRef.current = [];
        setElapsed(0);
        setIsRecording(false);
        releaseStream();
        if (blob.size > 0) setIsOpen(false);
      };

      recorderRef.current = recorder;
      startedAtRef.current = performance.now();
      recorder.start(250);
      setIsRecording(true);

      videoTrack?.addEventListener(
        'ended',
        () => {
          if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
        },
        { once: true }
      );
    } catch (recordingError) {
      videoStream?.getTracks().forEach((track) => track.stop());
      audioStream?.getTracks().forEach((track) => track.stop());
      setError(recordingError instanceof Error ? recordingError.message : 'Unable to start recording.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
  };

  const isCanvasCapture = captureMode === 'canvas';

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        disabled={isRecording}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          isRecording
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
            : 'bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border-neutral-700'
        }`}
        title={isCanvasCapture ? 'Export the visual stage as a video' : 'Record the current stage with browser capture'}
      >
        {isRecording ? <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> : isCanvasCapture ? <Film size={13} /> : <MonitorUp size={13} />}
        <span className="hidden sm:inline">{isRecording ? 'Recording' : isCanvasCapture ? 'Export video' : 'Record stage'}</span>
        <span className="sm:hidden">{isRecording ? 'REC' : isCanvasCapture ? 'Video' : 'Record'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-neutral-700 bg-neutral-950/95 p-3 text-xs text-neutral-200 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <Film size={14} className="text-cyan-400" />
                {isCanvasCapture ? 'Export stage video' : 'Record stage'}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                {isCanvasCapture
                  ? 'A clean canvas render with the selected audio track.'
                  : 'Choose this tab or the visual stage in the browser capture dialog.'}
              </p>
            </div>
            {!isRecording && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-neutral-500 hover:bg-neutral-800 hover:text-white"
                title="Close export panel"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {isRecording ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-2 font-mono text-rose-200">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
                  Recording
                </span>
                <span>{formatElapsedTime(elapsed)}</span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-3 py-2 font-semibold text-white transition-colors hover:bg-rose-400"
              >
                <Square size={14} fill="currentColor" />
                Stop &amp; download
              </button>
              <p className="text-center text-[10px] text-neutral-500">The download starts when recording stops.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-neutral-500">Resolution</span>
                <select
                  value={quality}
                  onChange={(event) => setQuality(event.target.value as VideoExportQuality)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-200 outline-none focus:border-cyan-500"
                >
                  <option value="720p">HD · 720p</option>
                  <option value="1080p">Full HD · 1080p</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-neutral-500">Frame rate</span>
                <select
                  value={fps}
                  onChange={(event) => setFps(Number(event.target.value) as FrameRate)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-200 outline-none focus:border-cyan-500"
                >
                  <option value={30}>30 fps · smooth</option>
                  <option value={60}>60 fps · maximum</option>
                </select>
               </label>
               <label className="block">
                 <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-neutral-500">Auto-stop</span>
                 <select
                   value={durationLimit}
                   onChange={(event) => setDurationLimit(Number(event.target.value) as DurationLimit)}
                   className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-200 outline-none focus:border-cyan-500"
                 >
                   <option value={0}>Manual stop</option>
                   <option value={30}>30 seconds</option>
                   <option value={60}>1 minute</option>
                   <option value={300}>5 minutes</option>
                 </select>
               </label>
               <button
                 type="button"
                 onClick={startRecording}

                className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 font-semibold text-neutral-950 transition-colors hover:bg-cyan-400"
              >
                <Download size={14} />
                Start recording
              </button>
              <p className="text-center text-[10px] leading-relaxed text-neutral-500">
                {isCanvasCapture
                  ? 'The visual and audio stay in your browser; nothing is uploaded.'
                  : 'The browser may ask for screen-capture permission.'}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-950/40 px-2.5 py-2 text-[11px] leading-relaxed text-rose-200">
              <LoaderCircle size={13} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
