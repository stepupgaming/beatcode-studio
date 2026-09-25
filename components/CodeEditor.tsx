'use client';

import React, { useState } from 'react';
import {
  Play,
  Copy,
  Check,
  Download,
  Code2,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { BeatWay } from '@/lib/beatCodeRegistry';

interface CodeEditorProps {
  currentWay: BeatWay;
  onCodeChange: (newCode: string) => void;
  onResetCode: () => void;
}

export default function CodeEditor({
  currentWay,
  onCodeChange,
  onResetCode,
}: CodeEditorProps) {
  // Initialized directly with currentWay.code since parent passes key={activeWay.id}
  const [localCode, setLocalCode] = useState(currentWay.code);
  const [copied, setCopied] = useState(false);
  const [autoRun, setAutoRun] = useState(true);
  const [activeTab, setActiveTab] = useState<'editor' | 'explain'>('editor');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {


    const val = e.target.value;
    setLocalCode(val);
    if (autoRun) {
      onCodeChange(val);
    }
  };

  const handleManualRun = () => {
    onCodeChange(localCode);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const isCanvas = currentWay.type === 'canvas';
    const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${currentWay.title} - Beat-Driven Code</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #000; font-family: monospace; }
    #container { width: 100vw; height: 100vh; position: relative; }
    #ui {
      position: absolute; top: 16px; left: 16px; z-index: 100;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
      padding: 12px 18px; border-radius: 12px; color: #fff;
      border: 1px solid rgba(255,255,255,0.15);
    }
    button, input { margin-top: 8px; cursor: pointer; padding: 6px 12px; border-radius: 6px; }
  </style>
</head>
<body>
  <div id="ui">
    <h3>${currentWay.title}</h3>
    <p>Beat-driven code running standalone</p>
    <input type="file" id="audioUpload" accept="audio/*">
    <button id="playBtn">Play Built-in Synth Beat</button>
  </div>
  <div id="container">
    ${isCanvas ? '<canvas id="cvs"></canvas>' : '<div id="domTarget" style="width:100%;height:100%;"></div>'}
  </div>

  <script>
    // Audio engine & beat detector
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let ctx = null, analyser = null, synthTimer = null;
    let audioState = { isBeat: false, beatCount: 0, energy: 0, bass: 0, mid: 0, treble: 0, bpm: 128, time: 0, frequencies: new Uint8Array(256) };
    let state = {};

    function initAudio() {
      if (!ctx) {
        ctx = new AudioContext();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    }

    // Procedural beat synth
    let step = 0;
    document.getElementById('playBtn').onclick = () => {
      initAudio();
      if (synthTimer) { clearInterval(synthTimer); synthTimer = null; return; }
      synthTimer = setInterval(() => {
        const t = ctx.currentTime;
        if (step % 4 === 0) { // Kick
          const osc = ctx.createOscillator(), g = ctx.createGain();
          osc.frequency.setValueAtTime(140, t);
          osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);
          g.gain.setValueAtTime(1, t);
          g.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
          osc.connect(g); g.connect(analyser);
          osc.start(t); osc.stop(t + 0.3);
        }
        step++;
      }, (60 / 128 / 4) * 1000);
    };

    document.getElementById('audioUpload').onchange = (e) => {
      initAudio();
      const file = e.target.files[0];
      if (!file) return;
      const audio = new Audio(URL.createObjectURL(file));
      audio.loop = true;
      const src = ctx.createMediaElementSource(audio);
      src.connect(analyser);
      audio.play();
    };

    // User's Beat Code
    ${localCode}

    // Animation Loop
    const freqData = new Uint8Array(256);
    let lastBeat = 0;
    function loop() {
      if (analyser) {
        analyser.getByteFrequencyData(freqData);
        let bSum = 0; for (let i=0; i<=6; i++) bSum += freqData[i];
        const bass = bSum / (7 * 255);
        const now = performance.now() / 1000;
        const isBeat = bass > 0.4 && (now - lastBeat > 0.22);
        if (isBeat) { lastBeat = now; audioState.beatCount++; }
        audioState.isBeat = isBeat;
        audioState.bass = bass;
        audioState.energy = bass;
      }
      ${
        isCanvas
          ? `
        const cvs = document.getElementById('cvs');
        cvs.width = window.innerWidth; cvs.height = window.innerHeight;
        render(cvs.getContext('2d'), cvs.width, cvs.height, audioState, state);
      `
          : `
        updateDOM(document.getElementById('domTarget'), audioState, state);
      `
      }
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`;

    const blob = new Blob([standaloneHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beat-code-way-${String(currentWay.number).padStart(3, '0')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl flex flex-col h-full overflow-hidden text-neutral-200">
      {/* Tab bar & Actions */}
      <div className="p-2.5 border-b border-neutral-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'editor'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Code2 size={14} className="text-cyan-400" />
            <span>Beat Code</span>
          </button>
          <button
            onClick={() => setActiveTab('explain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'explain'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <HelpCircle size={14} className="text-cyan-400" />
            <span>How It Works</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer mr-1">
            <input
              type="checkbox"
              checked={autoRun}
              onChange={(e) => setAutoRun(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span>Auto-Run</span>
          </label>

          {!autoRun && (
            <button
              onClick={handleManualRun}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
            >
              <Play size={12} />
              <span>Run</span>
            </button>
          )}

          <button
            onClick={onResetCode}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            title="Reset to original preset code"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition-colors"
            title="Copy code to clipboard"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 text-neutral-400 hover:text-cyan-400 hover:bg-neutral-800 rounded-lg transition-colors"
            title="Download standalone runnable HTML"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      {activeTab === 'editor' ? (
        <div className="flex-1 p-2 relative bg-neutral-950 font-mono text-xs overflow-hidden flex flex-col">
          <textarea
            value={localCode}
            onChange={handleTextChange}
            spellCheck={false}
            className="w-full flex-1 bg-transparent text-cyan-200 resize-none focus:outline-none leading-relaxed p-2 font-mono scrollbar-thin scrollbar-thumb-neutral-800"
          />
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
            <span>
              Runtime: {currentWay.type === 'canvas' ? 'render(ctx, w, h, audioState, state)' : 'updateDOM(container, audioState, state)'}
            </span>
            <span className="font-mono">Editable in real-time</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 bg-neutral-950/60 overflow-y-auto space-y-4 text-xs leading-relaxed text-neutral-300">
          <div>
            <h4 className="text-sm font-semibold text-neutral-100 mb-1">
              Mechanics of #{String(currentWay.number).padStart(3, '0')}: {currentWay.title}
            </h4>
            <p className="text-neutral-400">{currentWay.description}</p>
          </div>

          <div className="space-y-2 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
            <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <span>Key Audio Hook:</span>
            </div>
            <code className="block bg-neutral-950 p-2 rounded text-rose-300 font-mono">
              if (audioState.isBeat) &#123; /* Triggers on kick / bass transient */ &#125;
            </code>
            <p className="text-neutral-400 text-[11px]">
              <code className="text-cyan-300">audioState.isBeat</code> evaluates to <code className="text-emerald-400">true</code> on the exact frame an onset transient is detected in the low-frequency spectrum.
            </p>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-semibold text-neutral-200">Available Sandbox Properties:</h5>
            <ul className="list-disc list-inside space-y-1 text-neutral-400 font-mono text-[11px]">
              <li><span className="text-cyan-300">audioState.isBeat</span>: boolean (onset pulse)</li>
              <li><span className="text-cyan-300">audioState.beatCount</span>: integer counter</li>
              <li><span className="text-cyan-300">audioState.bass</span>: 0.0 - 1.0 (sub kick energy)</li>
              <li><span className="text-cyan-300">audioState.mid</span>: 0.0 - 1.0 (snare / vocal presence)</li>
              <li><span className="text-cyan-300">audioState.treble</span>: 0.0 - 1.0 (hi-hats / cymbals)</li>
              <li><span className="text-cyan-300">audioState.energy</span>: 0.0 - 1.0 (overall RMS)</li>
              <li><span className="text-cyan-300">state</span>: Persistent user object between frames</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
