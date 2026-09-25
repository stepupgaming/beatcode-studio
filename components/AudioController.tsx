'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Upload,
  Radio,
  Mic,
  Volume2,
  VolumeX,
  Sliders,
  Volume1,
} from 'lucide-react';
import {
  getAudioEngine,
  SYNTH_PRESETS,
  AudioBeatState,
} from '@/lib/audioEngine';

interface AudioControllerProps {
  audioState: AudioBeatState;
  onOpenPictureSwitcher?: () => void;
  activeView?: 'pictures' | 'sandbox';
}

export default function AudioController({
  audioState,
  onOpenPictureSwitcher,
  activeView = 'pictures',
}: AudioControllerProps) {
  const engine = getAudioEngine();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<number>(1.15);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [testTonePlayed, setTestTonePlayed] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>(() => engine.getActiveSynthPreset());

  // Sync active preset from engine on external updates
  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      setActivePreset(engine.getActiveSynthPreset());
    });
    return unsubscribe;
  }, [engine]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      engine.loadAudioFile(file);
      e.target.value = '';
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId);
    engine.startSynthPreset(presetId);
  };

  const handleMicToggle = async () => {
    try {
      if (engine.getSourceType() === 'mic') {
        await engine.togglePlayPause();
      } else {
        await engine.startMic();
      }
    } catch (e) {
      alert('Could not access microphone. Please check browser microphone permissions.');
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (isMuted && val > 0) setIsMuted(false);
    engine.setVolume(val);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      engine.setVolume(volume || 0.85);
    } else {
      setIsMuted(true);
      engine.setVolume(0);
    }
  };

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSensitivity(val);
    engine.setSensitivity(val);
  };

  const handlePlayTestSound = async () => {
    await engine.playTestTone();
    setTestTonePlayed(true);
    setTimeout(() => setTestTonePlayed(false), 900);
  };

  const handleUnlockAndPlay = async () => {
    await engine.resumeAudioContext();
    if (!audioState.isPlaying) {
      await engine.togglePlayPause();
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const sourceType = engine.getSourceType();
  const currentName = engine.getFileName();
  const isPlaying = audioState.isPlaying;

  return (
    <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 shrink-0 select-none shadow-lg">
      {/* Sound Waiting Warning / 1-Click Unmute Bar */}
      {audioState.isSuspended && (
        <div className="mb-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded-lg flex items-center justify-between gap-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <VolumeX size={16} className="shrink-0 text-amber-400 animate-pulse" />
            <span className="font-semibold">
              Web Audio requires a user click to play music through speakers.
            </span>
          </div>
          <button
            onClick={handleUnlockAndPlay}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-md text-xs transition-colors shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <Volume2 size={14} />
            <span>Click to Enable Sound 🔊</span>
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Left Section: Play/Pause, Preset Selector & Beat LED */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Main Play / Pause Button with animated ring */}
          <button
            onClick={() => engine.togglePlayPause()}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-all shrink-0 active:scale-95 ${
              audioState.isBeat
                ? 'bg-rose-500 text-white shadow-rose-500/50 ring-4 ring-rose-400/50 scale-105'
                : isPlaying
                ? 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 shadow-cyan-500/40 ring-2 ring-cyan-400/30'
                : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
            }`}
            title={isPlaying ? 'Pause Music' : 'Start Beat Playback'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          {/* Current Source Badge & Track Info */}
          <div className="min-w-0 max-w-[200px] sm:max-w-xs md:max-w-sm">
            <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-1.5 truncate">
              <span className="uppercase text-cyan-400 font-semibold px-1 rounded bg-neutral-950 border border-neutral-800">
                {sourceType}
              </span>
              <span>·</span>
              <span className="text-neutral-300 font-bold">~{audioState.bpm} BPM</span>
              {audioState.isBeat && (
                <span className="text-rose-300 font-extrabold bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/50 animate-pulse text-[9px]">
                  BEAT #{audioState.beatCount}
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-neutral-100 truncate">
              {currentName}
            </div>
          </div>

          {/* Preset Selector Dropdown */}
          <div className="hidden sm:flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <Radio size={13} className="text-cyan-400 ml-1 shrink-0" />
            <select
              value={sourceType === 'synth' || sourceType === 'track' ? activePreset : ''}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
              title="Select Beat Groove Preset"
            >
              {SYNTH_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-neutral-900 text-neutral-100">
                  {p.name} ({p.bpm} BPM)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Test Sound button & File Upload */}
        <div className="flex items-center gap-1.5">
          {/* Test Sound Button (Instant Audio Verification) */}
          <button
            onClick={handlePlayTestSound}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              testTonePlayed
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 scale-105'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
            }`}
            title="Play an instant audio chime to verify speakers"
          >
            <Volume2 size={13} className={testTonePlayed ? 'text-emerald-400' : 'text-neutral-400'} />
            <span className="hidden sm:inline">Test Sound 🔊</span>
          </button>

          {/* File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 transition-colors flex items-center gap-1.5"
            title="Upload custom song or beat (MP3, WAV, AAC)"
          >
            <Upload size={13} />
            <span className="hidden md:inline">Upload Song</span>
          </button>

          {/* Microphone Live Beat Input */}
          <button
            onClick={handleMicToggle}
            className={`p-1.5 rounded-lg border transition-colors ${
              sourceType === 'mic'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
            }`}
            title="Use Live Microphone for Beat Sync"
          >
            <Mic size={14} />
          </button>
        </div>

        {/* Right Section: Volume Slider & Advanced Settings Toggle */}
        <div className="flex items-center gap-2">
          {/* Mute Button & Volume Slider */}
          <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
            <button
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={15} className="text-rose-400" />
              ) : volume < 0.5 ? (
                <Volume1 size={15} className="text-cyan-400" />
              ) : (
                <Volume2 size={15} className="text-cyan-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              title={`Master Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
            <span className="text-[10px] font-mono text-neutral-400 w-7 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showSettings
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
            }`}
            title="Audio Engine Settings"
          >
            <Sliders size={14} />
          </button>
        </div>
      </div>

      {/* Expanded Audio Engine Settings */}
      {showSettings && (
        <div className="mt-2.5 pt-2.5 border-t border-neutral-800 text-xs flex flex-wrap items-center justify-between gap-3 bg-neutral-950/60 p-2.5 rounded-lg">
          {/* Preset descriptions for mobile view */}
          <div className="sm:hidden w-full">
            <label className="block text-[10px] font-mono text-neutral-400 mb-1">
              Select Beat Preset:
            </label>
            <select
              value={sourceType === 'synth' || sourceType === 'track' ? activePreset : ''}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-neutral-200"
            >
              {SYNTH_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.bpm} BPM) - {p.genre}
                </option>
              ))}
            </select>
          </div>

          {/* Beat Sensitivity Slider */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-neutral-400 text-[11px]">Sensitivity:</span>
            <input
              type="range"
              min="0.9"
              max="2.0"
              step="0.05"
              value={sensitivity}
              onChange={handleSensitivityChange}
              className="w-24 accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-cyan-400 text-[11px]">{sensitivity.toFixed(2)}x</span>
          </div>

          {/* Beat Meter Breakdown */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-1">
              <span className="text-rose-400">Sub/Bass:</span>
              <div className="w-12 h-1.5 bg-neutral-800 rounded overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.round(audioState.bass * 100))}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-cyan-400">Energy:</span>
              <div className="w-12 h-1.5 bg-neutral-800 rounded overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.round(audioState.energy * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Active Preset Description */}
          <div className="text-[11px] text-neutral-400 italic">
            {SYNTH_PRESETS.find((p) => p.id === activePreset)?.description}
          </div>
        </div>
      )}
    </div>
  );
}
