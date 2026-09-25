'use client';

import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Layers,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import { getAudioEngine, AudioBeatState } from '@/lib/audioEngine';
import { getWay, BeatWay } from '@/lib/beatCodeRegistry';
import BeatCodeSandbox, { AutoSwitchInterval } from '@/components/BeatCodeSandbox';
import AudioController from '@/components/AudioController';
import WaysDirectory from '@/components/WaysDirectory';
import CodeEditor from '@/components/CodeEditor';
import AIGeneratorModal from '@/components/AIGeneratorModal';
import BeatPictureSwitcher from '@/components/BeatPictureSwitcher';

export default function BeatCodeStudio() {
  // Default to the Picture Deck (VJ Scene Switcher) as requested for ultimate beat switching backgrounds
  const [studioMode, setStudioMode] = useState<'pictures' | 'sandbox'>('pictures');
  const [currentWayNumber, setCurrentWayNumber] = useState<number>(1);
  const [activeWay, setActiveWay] = useState<BeatWay>(() => getWay(1));
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [showCatalogMobile, setShowCatalogMobile] = useState<boolean>(false);
  const [editorResetVersion, setEditorResetVersion] = useState(0);

  // Auto-switch visualizer mode in 100 Ways
  const [autoSwitchWays, setAutoSwitchWays] = useState<boolean>(false);
  const [autoSwitchInterval, setAutoSwitchInterval] = useState<AutoSwitchInterval>('every-4-beats');

  // Audio state
  const [audioState, setAudioState] = useState<AudioBeatState>({
    isBeat: false,
    beatCount: 0,
    beatConfidence: 0,
    energy: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    bpm: 124,
    time: 0,
    duration: 0,
    isPlaying: false,
    isSuspended: false,
    frequencies: new Uint8Array(256),
    waveform: new Uint8Array(256),
  });

  // Switch to a specific way
  const handleSelectWay = useCallback((wayNumber: number) => {
    setCurrentWayNumber(wayNumber);
    const way = getWay(wayNumber);
    setActiveWay(way);
    setShowCatalogMobile(false);
  }, []);

  // When user edits code in editor
  const handleCodeChange = useCallback((newCode: string) => {
    setActiveWay((prev) => ({
      ...prev,
      code: newCode,
    }));
  }, []);

  // Reset code to pristine preset
  const handleResetCode = useCallback(() => {
    const fresh = getWay(currentWayNumber);
    setActiveWay(fresh);
    setEditorResetVersion((version) => version + 1);
  }, [currentWayNumber]);

  // Apply custom AI generated way
  const handleApplyGeneratedCode = useCallback((generatedWay: BeatWay) => {
    setActiveWay(generatedWay);
    setCurrentWayNumber(generatedWay.number);
  }, []);

  // Next visualizer for auto-switch
  const handleNextWay = useCallback(() => {
    setCurrentWayNumber((prev) => {
      const next = prev < 100 ? prev + 1 : 1;
      setActiveWay(getWay(next));
      return next;
    });
  }, []);

  // Web Audio frame polling loop with 30fps UI state throttle (prevents React reconciliation jank)
  useEffect(() => {
    const engine = getAudioEngine();
    let animId: number;
    let lastUiUpdate = 0;

    const loop = (timestamp: number) => {
      const state = engine.updateBeatFrame();
      if (timestamp - lastUiUpdate >= 32) {
        lastUiUpdate = timestamp;
        setAudioState(state);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
     const onKeyDown = (e: KeyboardEvent) => {
       if (e.repeat) return;
       if (

        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        getAudioEngine().togglePlayPause();
      } else if (e.key === '[') {
        const prev = currentWayNumber > 1 ? currentWayNumber - 1 : 100;
        handleSelectWay(prev);
      } else if (e.key === ']') {
        const next = currentWayNumber < 100 ? currentWayNumber + 1 : 1;
        handleSelectWay(next);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentWayNumber, handleSelectWay]);

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-neutral-950 text-neutral-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Pinned Top Bar (Compact & Sleek) */}
      <header className="shrink-0 flex items-center justify-between px-3 sm:px-5 py-2 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md z-40">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-500 to-rose-500 flex items-center justify-center text-neutral-950 font-black text-xs shadow-md">
               BC

            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
               <span className="font-extrabold tracking-tight">BeatCode Studio</span>

              <span className="hidden md:inline text-[10px] text-neutral-400 font-normal font-mono border-l border-neutral-800 pl-2">
                Ultimate Beat-Driven Backgrounds
              </span>
            </div>
          </Link>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-neutral-900/90 p-0.5 rounded-xl border border-neutral-800 text-xs">
          <button
            onClick={() => setStudioMode('pictures')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium ${
              studioMode === 'pictures'
                ? 'bg-neutral-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon size={13} className={studioMode === 'pictures' ? 'text-cyan-400' : ''} />
            <span>Picture Deck (VJ)</span>
          </button>

          <button
            onClick={() => setStudioMode('sandbox')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium ${
              studioMode === 'sandbox'
                ? 'bg-neutral-800 text-rose-300 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers size={13} className={studioMode === 'sandbox' ? 'text-rose-400' : ''} />
            <span>100 Beat Ways</span>
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-1.5">
          {studioMode === 'sandbox' && (
            <button
              onClick={() => setShowCatalogMobile(!showCatalogMobile)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <Layers size={13} />
              <span>Catalog</span>
            </button>
          )}

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all shadow-md active:scale-95"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">AI Beat Code</span>
            <span className="sm:hidden">AI</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body (Fixed Viewport - No Outer Window Scroll) */}
      <main className="flex-1 min-h-0 flex flex-col p-2 sm:p-3 gap-2 overflow-hidden max-w-[1920px] w-full mx-auto">
        {/* Pinned Audio Cockpit */}
        <AudioController
          audioState={audioState}
          activeView={studioMode}
          onOpenPictureSwitcher={() => setStudioMode('pictures')}
        />

        {/* View Mode 1: Beat-Synchronized Picture Deck (VJ Backdrop Studio) */}
        {studioMode === 'pictures' && (
          <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
             <BeatPictureSwitcher
               audioState={audioState}
               onOpenCodeEditor={() => setStudioMode('sandbox')}
             />

          </div>
        )}

        {/* View Mode 2: 100 Beat Ways (Each panel scrolls independently!) */}
        {studioMode === 'sandbox' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2 overflow-hidden">
            {/* Left Panel: 100 Ways Catalog (Scrolls internally) */}
            <div
              className={`lg:col-span-3 h-full min-h-0 overflow-y-auto rounded-xl ${
                showCatalogMobile ? 'block' : 'hidden lg:block'
              }`}
            >
              <WaysDirectory
                currentWayNumber={currentWayNumber}
                onSelectWay={handleSelectWay}
                onOpenAIGenerator={() => setIsAiModalOpen(true)}
              />
            </div>

            {/* Center Panel: Live Aspect-Ratio Sandbox Stage */}
            <div className="lg:col-span-5 h-full min-h-0 flex flex-col overflow-hidden">
               <BeatCodeSandbox
                 code={activeWay.code}
                 type={activeWay.type}
                 audioState={audioState}
                 title={activeWay.title}
                 wayNumber={activeWay.number}
                 autoSwitchEnabled={autoSwitchWays}
                 onToggleAutoSwitch={() => setAutoSwitchWays(!autoSwitchWays)}
                 autoSwitchInterval={autoSwitchInterval}
                 onAutoSwitchIntervalChange={setAutoSwitchInterval}
                 onNextVisualizer={handleNextWay}
               />

            </div>

            {/* Right Panel: Code Inspector & Controls (Scrolls internally) */}
            <div className="lg:col-span-4 h-full min-h-0 flex flex-col overflow-hidden">
               <CodeEditor
                 key={`${activeWay.id}-${editorResetVersion}`}
                 currentWay={activeWay}
                 onCodeChange={handleCodeChange}
                 onResetCode={handleResetCode}
               />

            </div>
          </div>
        )}
      </main>

      {/* AI Code Generator Modal */}
       <AIGeneratorModal
         isOpen={isAiModalOpen}
         onClose={() => setIsAiModalOpen(false)}
         onApplyGeneratedCode={handleApplyGeneratedCode}
         currentCode={activeWay.code}
         currentType={activeWay.type}
       />

    </div>
  );
}
