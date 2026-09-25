'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  AlertCircle,
  Zap,
  User,
  Tv,
  Smartphone,
  Square,
} from 'lucide-react';
import { AudioBeatState, getAudioEngine } from '@/lib/audioEngine';
import DancerOverlay from './DancerOverlay';
import VideoExportControl from './VideoExportControl';

export type AspectRatio = '16:9' | '9:16' | '1:1' | 'fill';
export type AutoSwitchInterval = 'every-1-beat' | 'every-2-beats' | 'every-4-beats' | 'every-8-beats' | 'drop-only';

interface BeatCodeSandboxProps {
  code: string;
  type: 'dom' | 'canvas';
  audioState: AudioBeatState;
  title: string;
  wayNumber?: number;
  // Auto-switch beat visualizer props
  autoSwitchEnabled?: boolean;
  onToggleAutoSwitch?: () => void;
  autoSwitchInterval?: AutoSwitchInterval;
  onAutoSwitchIntervalChange?: (interval: AutoSwitchInterval) => void;
  onNextVisualizer?: () => void;
}

export default function BeatCodeSandbox({
  code,
  type,
  audioState,
  title,
  wayNumber,
  autoSwitchEnabled = false,
  onToggleAutoSwitch,
  autoSwitchInterval = 'every-4-beats',
  onAutoSwitchIntervalChange,
  onNextVisualizer,
}: BeatCodeSandboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const domContainerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const runtimeErrorRef = useRef<string | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

  // Dancer preview guide state
  const [showDancerGuide, setShowDancerGuide] = useState<boolean>(false);
  const [customDancerUrl, setCustomDancerUrl] = useState<string | null>(null);
  const [customDancerType, setCustomDancerType] = useState<'image' | 'video' | null>(null);
  const [dancerType, setDancerType] = useState<'silhouette-breakdance' | 'silhouette-pop' | 'silhouette-hiphop'>('silhouette-breakdance');

  const customDancerUrlRef = useRef<string | null>(null);


  useEffect(() => {
    customDancerUrlRef.current = customDancerUrl;
  }, [customDancerUrl]);

  useEffect(() => {
    return () => {
      if (customDancerUrlRef.current) URL.revokeObjectURL(customDancerUrlRef.current);
    };
  }, []);

  const clearCustomDancer = useCallback(() => {
    if (customDancerUrl) URL.revokeObjectURL(customDancerUrl);
    setCustomDancerUrl(null);
    setCustomDancerType(null);
  }, [customDancerUrl]);

  const handleCustomDancerUpload = useCallback((url: string, kind: 'image' | 'video') => {
    if (customDancerUrl) URL.revokeObjectURL(customDancerUrl);
    setCustomDancerUrl(url);
    setCustomDancerType(kind);
  }, [customDancerUrl]);

  // Sandboxed user state persisted across animation frames
  const userStateRef = useRef<Record<string, any>>({});
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(0);
  const latestAudioStateRef = useRef(audioState);

  useEffect(() => {
    latestAudioStateRef.current = audioState;
  }, [audioState]);

  // Auto-switch visualizer listener using direct beat listener
  useEffect(() => {
    if (!autoSwitchEnabled || !onNextVisualizer) return;
    const engine = getAudioEngine();
    const unsubscribe = engine.addBeatListener((event) => {
      let shouldSwitch = false;
      if (autoSwitchInterval === 'every-1-beat') shouldSwitch = true;
      else if (autoSwitchInterval === 'every-2-beats') shouldSwitch = event.isHalfBar || event.beatCount % 2 === 0;
      else if (autoSwitchInterval === 'every-4-beats') shouldSwitch = event.isDownbeat || event.beatCount % 4 === 0;
      else if (autoSwitchInterval === 'every-8-beats') shouldSwitch = event.beatCount % 8 === 0;
      else if (autoSwitchInterval === 'drop-only') shouldSwitch = event.bass >= 0.9;

      if (shouldSwitch) {
        onNextVisualizer();
      }
    });
    return unsubscribe;
  }, [autoSwitchEnabled, autoSwitchInterval, onNextVisualizer]);

  // Compile function cleanly in useMemo
  const { compiledFn, compileError } = React.useMemo(() => {
    try {
      if (type === 'canvas') {
        const wrapped = `
          ${code}
          if (typeof render === 'function') return render;
          throw new Error('Code must define a "render(ctx, width, height, audioState, state)" function');
        `;
        const fn = new Function(wrapped)();
        return { compiledFn: fn, compileError: null };
      } else {
        const wrapped = `
          ${code}
          if (typeof updateDOM === 'function') return updateDOM;
          throw new Error('Code must define an "updateDOM(container, audioState, state)" function');
        `;
        const fn = new Function(wrapped)();
        return { compiledFn: fn, compileError: null };
      }
    } catch (err: any) {
      return { compiledFn: null, compileError: err.message || 'Syntax error in beat code' };
    }
  }, [code, type]);

  // Reset sandbox user state and DOM when code or type changes
  useEffect(() => {
    userStateRef.current = {};
    if (domContainerRef.current) {
      domContainerRef.current.innerHTML = '';
    }
  }, [code, type]);

  // Main Render Loop
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      frameCountRef.current++;
      if (lastFpsTimeRef.current === 0) {
        lastFpsTimeRef.current = now;
      } else if (now - lastFpsTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      if (compiledFn) {
        const currentAudioState = latestAudioStateRef.current;
        let frameSucceeded = false;
        try {
          if (type === 'canvas' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const width = canvas.width;
              const height = canvas.height;
              compiledFn(ctx, width, height, currentAudioState, userStateRef.current);
              frameSucceeded = true;
            }
          } else if (type === 'dom' && domContainerRef.current) {
            compiledFn(domContainerRef.current, currentAudioState, userStateRef.current);
            frameSucceeded = true;
          }
        } catch (err: any) {
          const message = err.message || 'Runtime execution error';
          runtimeErrorRef.current = message;
          setRuntimeError(message);
        }

        if (frameSucceeded && runtimeErrorRef.current) {
          runtimeErrorRef.current = null;
          setRuntimeError(null);
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [type, compiledFn]);

  const activeError = compileError || runtimeError;

  // Resize canvas according to frame dimensions (guarantees no stretching!)
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && frameRef.current) {
        const rect = frameRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          canvasRef.current.width = Math.floor(rect.width);
          canvasRef.current.height = Math.floor(rect.height);
        }
      }
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (frameRef.current) ro.observe(frameRef.current);
    window.addEventListener('resize', handleResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [aspectRatio, isFullscreen]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-neutral-950 flex flex-col overflow-hidden border border-neutral-800 rounded-xl select-none ${
        isFullscreen ? 'rounded-none border-none' : ''
      }`}
    >
      {/* Top Toolbar: Aspect Ratio & Controls */}
      <div className="shrink-0 z-30 px-3 py-2 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {wayNumber !== undefined && (
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
              #{String(wayNumber).padStart(3, '0')}
            </span>
          )}
          <span className="text-xs font-semibold text-neutral-200 truncate max-w-[160px] sm:max-w-xs">
            {title}
          </span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
            {type}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 3 Aspect Ratio Selectors: 16:9, 9:16, 1:1 */}
          <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                aspectRatio === '16:9'
                  ? 'bg-neutral-800 text-cyan-300 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="16:9 Landscape (Stage Display / YouTube)"
            >
              <Tv size={13} />
              <span>16:9</span>
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                aspectRatio === '9:16'
                  ? 'bg-neutral-800 text-cyan-300 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="9:16 Vertical Portrait (TikTok / Reels / Dancer Mobile)"
            >
              <Smartphone size={13} />
              <span>9:16</span>
            </button>
            <button
              onClick={() => setAspectRatio('1:1')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                aspectRatio === '1:1'
                  ? 'bg-neutral-800 text-cyan-300 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="1:1 Square (Instagram Feed / Album Art)"
            >
              <Square size={13} />
              <span>1:1</span>
            </button>
          </div>

          <VideoExportControl
            aspectRatio={aspectRatio}
            captureMode={type === 'canvas' ? 'canvas' : 'screen'}
            getCanvas={type === 'canvas' ? () => canvasRef.current : undefined}
            className="shrink-0"
          />

          {/* Dancer Overlay Toggle */}
          <button
            onClick={() => setShowDancerGuide(!showDancerGuide)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
              showDancerGuide
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700'
            }`}
            title="Toggle dancer overlay guide for testing backgrounds"
          >
            <User size={13} />
            <span className="hidden sm:inline">Dancer Guide</span>
          </button>

          {/* Auto-Switch Visualizer Button */}
          {onToggleAutoSwitch && (
            <button
              onClick={onToggleAutoSwitch}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                autoSwitchEnabled
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700'
              }`}
              title="Auto-switch visualizer backgrounds on the beat!"
            >
              <Zap size={13} />
              <span className="hidden sm:inline">Auto-Switch</span>
            </button>
          )}

          {onToggleAutoSwitch && onAutoSwitchIntervalChange && (
            <select
              value={autoSwitchInterval}
              onChange={(event) => onAutoSwitchIntervalChange(event.target.value as AutoSwitchInterval)}
              className="hidden rounded-lg border border-neutral-700 bg-neutral-950 px-1.5 py-1 text-[10px] text-neutral-300 outline-none focus:border-cyan-500 md:block"
              title="Auto-switch timing"
            >
              <option value="every-1-beat">1 beat</option>
              <option value="every-2-beats">2 beats</option>
              <option value="every-4-beats">4 beats</option>
              <option value="every-8-beats">8 beats</option>
              <option value="drop-only">Drops</option>
            </select>
          )}

          {/* Live Beat Indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono transition-all duration-75 border ${
              audioState.isBeat
                ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.8)] scale-105'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${audioState.isBeat ? 'bg-white' : 'bg-neutral-600'}`} />
            <span>{audioState.isBeat ? 'BEAT' : `${fps} FPS`}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg border border-neutral-700 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Execution Error Banner */}
      {activeError && (
        <div className="z-30 m-2 flex items-center gap-2.5 bg-rose-950/90 border border-rose-700/60 backdrop-blur-md text-rose-200 text-xs px-3 py-2 rounded-lg">
          <AlertCircle size={15} className="text-rose-400 shrink-0" />
          <div className="truncate flex-1">
            <span className="font-semibold">Code Error: </span>
            <span>{activeError}</span>
          </div>
        </div>
      )}

      {/* Main Stage: Flex center containing the aspect ratio frame */}
      <div className="flex-1 min-h-0 w-full h-full relative overflow-hidden flex items-center justify-center p-2 sm:p-3 bg-neutral-950/90">
        {/* Aspect Ratio Bounded Frame */}
        <div
          ref={frameRef}
          className={`relative overflow-hidden bg-black rounded-lg shadow-2xl transition-all duration-150 flex items-center justify-center ${
            aspectRatio === '16:9'
              ? 'aspect-video max-w-full max-h-full w-full border border-neutral-800'
              : aspectRatio === '9:16'
              ? 'aspect-[9/16] max-h-full max-w-full h-full border border-neutral-800'
              : aspectRatio === '1:1'
              ? 'aspect-square max-h-full max-w-full h-full border border-neutral-800'
              : 'w-full h-full'
          }`}
        >
          {type === 'canvas' ? (
            <canvas
              ref={canvasRef}
              className="w-full h-full block cursor-crosshair touch-none"
            />
          ) : (
            <div
              ref={domContainerRef}
              className="w-full h-full relative overflow-hidden"
            />
          )}

          {/* Optional Dancer Overlay Guide */}
          {showDancerGuide && (
            <DancerOverlay
                audioState={audioState}
                customDancerUrl={customDancerUrl}
                customDancerType={customDancerType}
                onUploadDancer={handleCustomDancerUpload}
                onClearCustomDancer={clearCustomDancer}
                dancerType={dancerType}

               aspectRatio={aspectRatio}

            />
          )}
        </div>
      </div>

      {/* Bottom Subtle Overlay with Energy Bars */}
      <div className="shrink-0 px-3 py-1.5 border-t border-neutral-850 bg-neutral-950/80 flex items-center justify-between text-[11px] font-mono text-neutral-400">
        <div className="flex items-center gap-3">
          <span>BASS: {Math.round(audioState.bass * 100)}%</span>
          <span>·</span>
          <span>MID: {Math.round(audioState.mid * 100)}%</span>
          <span>·</span>
          <span>TREBLE: {Math.round(audioState.treble * 100)}%</span>
        </div>

        <div className="flex items-center gap-2">
          {showDancerGuide && (
            <div className="flex items-center gap-1.5 text-cyan-300">
              <span>Pose:</span>
              <select
                value={dancerType}
                onChange={(e) => setDancerType(e.target.value as any)}
                className="bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-[10px] text-cyan-300"
              >
                <option value="silhouette-breakdance">Breakdance</option>
                <option value="silhouette-pop">Pop Dance</option>
                <option value="silhouette-hiphop">Hiphop</option>
              </select>
            </div>
          )}
          <span>BEATS: {audioState.beatCount}</span>
        </div>
      </div>
    </div>
  );
}
