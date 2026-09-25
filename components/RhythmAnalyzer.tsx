'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Gauge,
  Clock,
  Music,
  Code2,
  Copy,
  Check,
  Play,
  ArrowRight,
  Flame,
  Zap,
  Sparkles,
  Download,
  Terminal,
} from 'lucide-react';
import { AudioAnalysisReport } from '@/lib/audioAnalyzer';
import { AudioBeatState, getAudioEngine } from '@/lib/audioEngine';
import {
  generateTempoDispatcherCode,
  generateIntensitySequencerCode,
  generateTimelineCueCode,
  generatePictureSwitcherCode,
} from '@/lib/rhythmCodeTemplates';

interface RhythmAnalyzerProps {
  report: AudioAnalysisReport | null;
  isAnalyzing: boolean;
  audioState: AudioBeatState;
  onSendCodeToEditor: (code: string) => void;
  onSwitchToSandbox: () => void;
}

type CodeTab = 'tempo' | 'intensity' | 'timeline' | 'picture';

export default function RhythmAnalyzer({
  report,
  isAnalyzing,
  audioState,
  onSendCodeToEditor,
  onSwitchToSandbox,
}: RhythmAnalyzerProps) {
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>('tempo');
  const [copied, setCopied] = useState<boolean>(false);
  const waveformRef = useRef<HTMLDivElement>(null);

  // Compute generated code based on active tab
  const generatedCode = React.useMemo(() => {
    if (!report) return '// Upload audio or select a groove to analyze rhythm...';
    switch (activeCodeTab) {
      case 'tempo':
        return generateTempoDispatcherCode(report);
      case 'intensity':
        return generateIntensitySequencerCode(report);
      case 'timeline':
        return generateTimelineCueCode(report);
      case 'picture':
        return generatePictureSwitcherCode(report);
      default:
        return generateTempoDispatcherCode(report);
    }
  }, [report, activeCodeTab]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToEditor = () => {
    onSendCodeToEditor(generatedCode);
    onSwitchToSandbox();
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beat-rhythm-${activeCodeTab}-${report?.bpm || 120}bpm.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || !report || report.duration <= 0) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    getAudioEngine().seek(ratio);
  };

  if (isAnalyzing) {
    return (
      <div className="flex-1 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin mb-4" />
        <h3 className="text-base font-semibold text-white">Analyzing Audio Rhythmic Dynamics...</h3>
        <p className="text-xs text-neutral-400 mt-1.5 max-w-sm">
          Decoding waveform buffer, calculating spectral flux, extracting transients, and estimating exact tempo.
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex-1 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center text-center text-neutral-400">
        <Music size={32} className="text-neutral-600 mb-3" />
        <h3 className="text-sm font-semibold text-neutral-200">No Audio Analyzed Yet</h3>
        <p className="text-xs text-neutral-400 mt-1">
          Upload an audio file or select a synth groove from the player above to generate rhythm-synchronized code.
        </p>
      </div>
    );
  }

  const currentPlayProgress = report.duration > 0 ? (audioState.time / report.duration) * 100 : 0;

  return (
    <div className="flex-1 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl flex flex-col overflow-hidden text-neutral-200">
      {/* Top Rhythm Analysis Overview */}
      <div className="p-4 border-b border-neutral-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-cyan-400 font-semibold flex items-center gap-1.5">
                <Activity size={14} />
                <span>Rhythm & Beat Pattern Analysis</span>
              </span>
              <span>·</span>
              <span className="text-xs text-neutral-400 font-mono">{report.fileName}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {report.rhythmPattern}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Confidence: {report.tempoConfidence}%
            </span>
          </div>
        </div>

        {/* 4 Key Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
            <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
              <Gauge size={13} className="text-cyan-400" />
              <span>DETECTED TEMPO</span>
            </div>
            <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">
              {report.bpm} <span className="text-xs font-medium text-neutral-400">BPM</span>
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
              Time Sig: {report.timeSignature}
            </div>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
            <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
              <Clock size={13} className="text-rose-400" />
              <span>BEAT INTERVAL</span>
            </div>
            <div className="text-2xl font-black text-rose-300 mt-1 font-mono">
              {report.beatIntervalMs} <span className="text-xs font-medium text-neutral-400">ms</span>
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
              ~{(60 / report.bpm).toFixed(3)}s per beat
            </div>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
            <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
              <Zap size={13} className="text-amber-400" />
              <span>TOTAL BEATS</span>
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1 font-mono">
              {report.totalBeatsDetected}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
              {report.duration}s total duration
            </div>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
            <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
              <Flame size={13} className="text-purple-400" />
              <span>HEAVY DROPS</span>
            </div>
            <div className="text-2xl font-black text-purple-300 mt-1 font-mono">
              {report.dropCount}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
              Avg Energy: {Math.round(report.averageEnergy * 100)}%
            </div>
          </div>
        </div>

        {/* Interactive Beat Waveform Strip */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>RHYTHMIC TIMELINE & TRANSIENT MAP</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                <span>Downbeat / Bar</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                <span>Accent</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>Drop Peak</span>
              </span>
            </div>
          </div>

          <div
            ref={waveformRef}
            onClick={handleWaveformClick}
            className="relative h-20 bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden cursor-pointer group"
          >
            {/* Waveform Peaks Bars */}
            <div className="absolute inset-0 flex items-end gap-[1px] px-2 py-1">
              {report.waveformPeaks.map((peak, idx) => {
                const h = Math.max(8, peak * 100);
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-neutral-700/60 group-hover:bg-neutral-600/70 rounded-t-[1px] transition-colors"
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>

            {/* Beat Transient Markers */}
            <div className="absolute inset-0 pointer-events-none">
              {report.beats.slice(0, 120).map((b) => {
                const leftPct = (b.time / report.duration) * 100;
                if (leftPct > 100) return null;

                const colorClass =
                  b.isDrop
                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] z-10 w-[2px]'
                    : b.isBarStart
                    ? 'bg-cyan-400 w-[1.5px]'
                    : 'bg-purple-400/70 w-[1px]';

                return (
                  <div
                    key={b.index}
                    className={`absolute bottom-0 top-0 ${colorClass}`}
                    style={{ left: `${leftPct}%` }}
                  />
                );
              })}
            </div>

            {/* Current Audio Playhead */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_#ffffff] z-20 pointer-events-none transition-all duration-75"
              style={{ left: `${currentPlayProgress}%` }}
            >
              <div className="w-2 h-2 -ml-[3px] bg-white rounded-full shadow" />
            </div>
          </div>
        </div>
      </div>

      {/* Code Generation Studio based on Rhythmic Patterns */}
      <div className="flex-1 flex flex-col min-h-[300px] overflow-hidden">
        {/* Tab selection */}
        <div className="p-2.5 border-b border-neutral-800 bg-neutral-950/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveCodeTab('tempo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCodeTab === 'tempo'
                  ? 'bg-neutral-800 text-cyan-300 font-semibold border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              1. Tempo Function Repeater
            </button>

            <button
              onClick={() => setActiveCodeTab('intensity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCodeTab === 'intensity'
                  ? 'bg-neutral-800 text-cyan-300 font-semibold border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              2. Beat Intensity Sequencer
            </button>

            <button
              onClick={() => setActiveCodeTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCodeTab === 'timeline'
                  ? 'bg-neutral-800 text-cyan-300 font-semibold border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              3. Timeline Cue Track
            </button>

            <button
              onClick={() => setActiveCodeTab('picture')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCodeTab === 'picture'
                  ? 'bg-neutral-800 text-cyan-300 font-semibold border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              4. Beat Picture Switcher
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleSendToEditor}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors shadow-md"
              title="Send to Live Sandbox Editor"
            >
              <Code2 size={13} />
              <span>Run in Sandbox</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              title="Download Code"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Code Editor / Preview Box */}
        <div className="flex-1 p-3 bg-neutral-950 font-mono text-xs overflow-auto leading-relaxed scrollbar-thin scrollbar-thumb-neutral-800">
          <pre className="text-cyan-200">{generatedCode}</pre>
        </div>
      </div>
    </div>
  );
}
