'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Tv,
  Smartphone,
  Square,
  Expand,
  User,
  Zap,
  Sliders,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Play,
  Sparkles,
  Code2,
} from 'lucide-react';

import { getAudioEngine, AudioBeatState, BeatEvent } from '@/lib/audioEngine';
import { CURATED_PICTURE_PACKS, PictureItem } from '@/lib/picturePacks';
import DancerOverlay from './DancerOverlay';
import VideoExportControl from './VideoExportControl';

interface BeatPictureSwitcherProps {
  audioState: AudioBeatState;
  onOpenCodeEditor?: () => void;
}

export type SwitchRule =
  | 'every-1-beat'
  | 'every-2-beats'
  | 'every-4-beats'
  | 'every-8-beats'
  | 'drop-only'
  | 'random-shuffle';

export type TransitionStyle =
  | 'cut'
  | 'glitch'
  | 'zoom-slam'
  | 'strobe-flash'
  | 'crossfade'
  | 'crt-scan';

export type AspectRatio = '16:9' | '9:16' | '1:1' | 'fill';

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

export default function BeatPictureSwitcher({
  audioState,
  onOpenCodeEditor,
}: BeatPictureSwitcherProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active picture playlist
  const [selectedPackId, setSelectedPackId] = useState<string>('cyberpunk');
  const [activePictures, setActivePictures] = useState<PictureItem[]>(
    CURATED_PICTURE_PACKS[0].pictures
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Synchronization settings
  const [switchRule, setSwitchRule] = useState<SwitchRule>('every-1-beat');
  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>('glitch');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

  // Overlay visual effects
  const [showShockwaves, setShowShockwaves] = useState<boolean>(true);
  const [showSpectrum, setShowSpectrum] = useState<boolean>(true);
  const [showStrobe, setShowStrobe] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [showThumbnailStrip, setShowThumbnailStrip] = useState<boolean>(true);

  // Auto-switch demo (allows scene switching even before playing audio)
  const [autoDemoSwitch, setAutoDemoSwitch] = useState<boolean>(false);

  // Dancer Overlay Guide for Testing
  const [showDancerGuide, setShowDancerGuide] = useState<boolean>(false);
  const [customDancerUrl, setCustomDancerUrl] = useState<string | null>(null);
  const [customDancerType, setCustomDancerType] = useState<'image' | 'video' | null>(null);
  const customDancerUrlRef = useRef<string | null>(null);

  useEffect(() => {
    customDancerUrlRef.current = customDancerUrl;
  }, [customDancerUrl]);

  // Transition trigger state
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [glitchActive, setGlitchActive] = useState<boolean>(false);

  // Canvas for overlay shockwaves & audio waveforms
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const shockwavesRef = useRef<{ r: number; maxR: number; alpha: number; color: string }[]>([]);
  const customObjectUrlsRef = useRef<string[]>([]);
  const exportImageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const latestAudioStateRef = useRef(audioState);
  const latestPictureRef = useRef<PictureItem | null>(null);
  const renderSettingsRef = useRef({
    showShockwaves,
    showSpectrum,
    showStrobe,
    transitionStyle,
    isTransitioning,
    glitchActive,
  });

  const currentPicture = activePictures[currentIndex] || activePictures[0] || null;

  useEffect(() => {
    latestAudioStateRef.current = audioState;
    renderSettingsRef.current = {
      showShockwaves,
      showSpectrum,
      showStrobe,
      transitionStyle,
      isTransitioning,
      glitchActive,
    };
    latestPictureRef.current = currentPicture;
  }, [
    audioState,
    showShockwaves,
    showSpectrum,
    showStrobe,
    transitionStyle,
    isTransitioning,
    glitchActive,
    currentPicture,
  ]);

  // Pack selector handler
  const handlePackChange = (packId: string) => {
    setSelectedPackId(packId);
    const pack = CURATED_PICTURE_PACKS.find((p) => p.id === packId);
    if (pack) {
      setActivePictures(pack.pictures);
      setCurrentIndex(0);
    }
  };

  // Upload Custom Images
  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: PictureItem[] = [];
    Array.from(files).forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      customObjectUrlsRef.current.push(url);
      newItems.push({
        id: `custom-${Date.now()}-${idx}`,
        url,
        title: file.name.replace(/\.[^/.]+$/, ''),
        fallbackGradient: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #030712 100%)',
      });
    });


    setActivePictures((prev) => [...prev, ...newItems]);
    setSelectedPackId('custom');
    setCurrentIndex(activePictures.length);
  };

  useEffect(() => {
    const objectUrls = customObjectUrlsRef.current;
    const imageCache = exportImageCacheRef.current;
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      if (customDancerUrlRef.current) URL.revokeObjectURL(customDancerUrlRef.current);
      imageCache.clear();
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

  const triggerVisualKick = useCallback(() => {
    setIsTransitioning(true);
    setGlitchActive(true);

    const timer = setTimeout(() => {
      setIsTransitioning(false);
      setGlitchActive(false);
    }, 110);

    // Spawn canvas shockwave ring
    if (overlayCanvasRef.current) {
      const cvs = overlayCanvasRef.current;
      shockwavesRef.current.push({
        r: 12,
        maxR: Math.max(cvs.width, cvs.height) * 0.8,
        alpha: 1.0,
        color: ['#06b6d4', '#f43f5e', '#eab308', '#a855f7', '#10b981'][
          Math.floor(Math.random() * 5)
        ],
      });
    }

    return () => clearTimeout(timer);
  }, []);

  const getExportImage = useCallback((url: string) => {
    const cached = exportImageCacheRef.current.get(url);
    if (cached) return cached;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => undefined;
    image.onerror = () => undefined;
    image.src = url;
    exportImageCacheRef.current.set(url, image);
    return image;
  }, []);

  const resizeExportCanvas = useCallback((width: number, height: number) => {
    const canvas = exportCanvasRef.current;
    if (!canvas) return;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }, []);

  const drawExportFrame = useCallback(
    (context: CanvasRenderingContext2D, width: number, height: number) => {
      const picture = latestPictureRef.current;
      const audio = latestAudioStateRef.current;
      const settings = renderSettingsRef.current;
      const fallbackColor = picture?.fallbackGradient?.match(/#[0-9a-f]{6}/i)?.[0] || '#020617';

      context.save();
      context.clearRect(0, 0, width, height);
      context.fillStyle = fallbackColor;
      context.fillRect(0, 0, width, height);

      if (picture) {
        const image = getExportImage(picture.url);
        if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
          context.save();
          const scale = settings.transitionStyle === 'zoom-slam' && settings.isTransitioning ? 1.1 : 1;
          const drawWidth = width * scale;
          const drawHeight = height * scale;
          const offsetX = (width - drawWidth) / 2;
          const offsetY = (height - drawHeight) / 2;
          if (settings.transitionStyle === 'glitch' && settings.glitchActive) {
            context.globalAlpha = 0.88;
            context.filter = 'saturate(1.8) hue-rotate(75deg) contrast(1.35)';
          } else if (settings.transitionStyle === 'strobe-flash' && settings.isTransitioning) {
            context.filter = 'brightness(1.65) contrast(1.3)';
          } else {
            context.filter = 'none';
          }
          context.translate(offsetX, offsetY);
          drawImageCover(context, image, drawWidth, drawHeight);
          context.restore();
        }
      }

      const vignette = context.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.12,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.78
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);

      if (settings.transitionStyle === 'crt-scan') {
        context.fillStyle = 'rgba(0, 0, 0, 0.24)';
        for (let y = 0; y < height; y += 6) context.fillRect(0, y, width, 2);
      }

      if (settings.showSpectrum) {
        const barCount = Math.min(64, Math.max(24, Math.round(width / 24)));
        const barWidth = width / barCount;
        const maxHeight = height * 0.2;
        for (let index = 0; index < barCount; index++) {
          const frequencyIndex = Math.floor((index / barCount) * 128);
          const value = (audio.frequencies[frequencyIndex] || 0) / 255;
          const barHeight = Math.max(3, value * maxHeight * (1 + audio.bass * 0.6));
          context.fillStyle = index < 8
            ? `rgba(244, 63, 94, ${0.5 + value * 0.5})`
            : `rgba(6, 182, 212, ${0.4 + value * 0.5})`;
          context.fillRect(index * barWidth, height - barHeight, Math.max(1, barWidth - 2), barHeight);
        }
      }

      if (settings.showShockwaves) {
        const sourceWidth = overlayCanvasRef.current?.width || width;
        const scale = width / sourceWidth;
        for (const wave of shockwavesRef.current) {
          const radius = wave.r * scale;
          context.save();
          context.beginPath();
          context.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
          context.strokeStyle = wave.color;
          context.lineWidth = 3 + audio.bass * 5;
          context.globalAlpha = wave.alpha;
          context.shadowColor = wave.color;
          context.shadowBlur = 18;
          context.stroke();
          context.restore();
        }
      }

      if (settings.showStrobe && audio.isBeat) {
        context.fillStyle = 'rgba(255, 255, 255, 0.25)';
        context.fillRect(0, 0, width, height);
      }

      context.restore();
    },
    [getExportImage]
  );

  const nextPicture = useCallback(() => {
    if (activePictures.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activePictures.length);
    triggerVisualKick();
  }, [activePictures.length, triggerVisualKick]);

  const prevPicture = useCallback(() => {
    if (activePictures.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + activePictures.length) % activePictures.length);
    triggerVisualKick();
  }, [activePictures.length, triggerVisualKick]);

  const randomPicture = useCallback(() => {
    if (activePictures.length <= 1) return;
    setCurrentIndex((prev) => {
      const next = Math.floor(Math.random() * activePictures.length);
      return next === prev ? (prev + 1) % activePictures.length : next;
    });
    triggerVisualKick();
  }, [activePictures.length, triggerVisualKick]);

  // Direct Audio Beat Listener (Bulletproof - direct connection to AudioEngine)
  useEffect(() => {
    const engine = getAudioEngine();

    const unsubscribe = engine.addBeatListener((event: BeatEvent) => {
      let shouldSwitch = false;

      if (switchRule === 'every-1-beat') {
        shouldSwitch = true;
      } else if (switchRule === 'every-2-beats') {
        shouldSwitch = event.isHalfBar || event.beatCount % 2 === 0;
      } else if (switchRule === 'every-4-beats') {
        shouldSwitch = event.isDownbeat || event.beatCount % 4 === 0;
       } else if (switchRule === 'every-8-beats') {
         shouldSwitch = event.beatCount % 8 === 0;
       } else if (switchRule === 'drop-only') {
         shouldSwitch = event.bass >= 0.9 && event.confidence >= 0.9;
       } else if (switchRule === 'random-shuffle') {

        shouldSwitch = true;
      }

      if (shouldSwitch && activePictures.length > 0) {
        if (switchRule === 'random-shuffle') {
          setCurrentIndex((prev) => {
            const next = Math.floor(Math.random() * activePictures.length);
            return next === prev ? (prev + 1) % activePictures.length : next;
          });
        } else {
          setCurrentIndex((prev) => (prev + 1) % activePictures.length);
        }
        triggerVisualKick();
      }
    });

    return unsubscribe;
  }, [switchRule, activePictures.length, triggerVisualKick]);

  // Demo auto-switch timer when user toggles "Auto Beat Switch Demo"
  useEffect(() => {
    if (!autoDemoSwitch || activePictures.length === 0) return;

    const bpm = audioState.bpm || 124;
    const intervalMs = (60 / bpm) * 1000;

    const timer = setInterval(() => {
      nextPicture();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoDemoSwitch, audioState.bpm, activePictures.length, nextPicture]);

  useEffect(() => {
    let animId: number;

    const renderOverlay = () => {
      const latestAudio = latestAudioStateRef.current;
      const settings = renderSettingsRef.current;
      const cvs = overlayCanvasRef.current;
      if (cvs) {
        const ctx = cvs.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, cvs.width, cvs.height);

          for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
            const sw = shockwavesRef.current[i];
            sw.r += 18 + latestAudio.bass * 20;
            sw.alpha *= 0.9;

            if (settings.showShockwaves) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(cvs.width / 2, cvs.height / 2, sw.r, 0, Math.PI * 2);
              ctx.strokeStyle = sw.color;
              ctx.lineWidth = 3 + latestAudio.bass * 5;
              ctx.globalAlpha = sw.alpha;
              ctx.shadowColor = sw.color;
              ctx.shadowBlur = 18;
              ctx.stroke();
              ctx.restore();
            }

            if (sw.alpha < 0.02 || sw.r > sw.maxR) {
              shockwavesRef.current.splice(i, 1);
            }
          }

          if (settings.showSpectrum) {
            const freqs = latestAudio.frequencies;
            const barCount = 48;
            const barWidth = cvs.width / barCount;
            const maxHeight = cvs.height * 0.2;

            for (let index = 0; index < barCount; index++) {
              const frequencyIndex = Math.floor((index / barCount) * 128);
              const value = (freqs[frequencyIndex] || 0) / 255;
              const barHeight = Math.max(3, value * maxHeight * (1 + latestAudio.bass * 0.6));
              const x = index * barWidth;
              const y = cvs.height - barHeight;
              ctx.fillStyle = index < 8
                ? `rgba(244, 63, 94, ${0.5 + value * 0.5})`
                : `rgba(6, 182, 212, ${0.4 + value * 0.5})`;
              ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
            }
          }
        }
      }

      const exportCanvas = exportCanvasRef.current;
      if (exportCanvas) {
        const exportContext = exportCanvas.getContext('2d');
        if (exportContext) {
          drawExportFrame(exportContext, exportCanvas.width, exportCanvas.height);
        }
      }

      animId = requestAnimationFrame(renderOverlay);
    };

    animId = requestAnimationFrame(renderOverlay);
    return () => cancelAnimationFrame(animId);
  }, [drawExportFrame]);

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      if (overlayCanvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        overlayCanvasRef.current.width = rect.width;
        overlayCanvasRef.current.height = rect.height;
      }
    };
    handleResize();
    resizeExportCanvas(1280, 720);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeExportCanvas]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-neutral-950 flex flex-col overflow-hidden border border-neutral-800 rounded-xl select-none ${
        isFullscreen ? 'rounded-none border-none' : ''
      }`}
    >
      <canvas
        ref={exportCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-[-10000px] top-0 h-px w-px opacity-0"
      />

      {/* Top Header Control Ribbon */}
      <div className="relative z-30 px-3 py-2 flex items-center justify-between gap-2 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-cyan-300 shrink-0">
            <ImageIcon size={13} className="text-cyan-400" />
            <span className="font-bold">SCENE #{currentIndex + 1}</span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400">{activePictures.length}</span>
          </div>

          <span className="hidden sm:inline-block text-xs font-medium text-neutral-300 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800 truncate max-w-xs">
            {currentPicture?.title || 'Beat Scene'}
          </span>
        </div>

        {/* Quick Settings & Controls */}
        <div className="flex items-center gap-1.5">
          {/* Quick Manual Switch Buttons */}
          <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
            <button
              onClick={prevPicture}
              className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition-colors"
              title="Previous Scene (Left Arrow)"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={randomPicture}
              className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-cyan-400 rounded transition-colors"
              title="Shuffle Random Scene"
            >
              <Shuffle size={13} />
            </button>
            <button
              onClick={nextPicture}
              className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition-colors"
              title="Next Scene (Right Arrow)"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Aspect Ratio Selector (Ensures images NEVER stretch) */}
          <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                aspectRatio === '16:9'
                  ? 'bg-neutral-800 text-cyan-300 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="16:9 Widescreen (Stage Display)"
            >
              <Tv size={12} />
              <span className="hidden md:inline">16:9</span>
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                aspectRatio === '9:16'
                  ? 'bg-neutral-800 text-cyan-300 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="9:16 Portrait (TikTok / Reels / Dancer Stage)"
            >
              <Smartphone size={12} />
              <span className="hidden md:inline">9:16</span>
            </button>
            <button
              onClick={() => setAspectRatio('1:1')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                aspectRatio === '1:1'
                  ? 'bg-neutral-800 text-cyan-300 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="1:1 Square"
            >
              <Square size={12} />
            </button>
            <button
              onClick={() => setAspectRatio('fill')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                aspectRatio === 'fill'
                  ? 'bg-neutral-800 text-cyan-300 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Fill Frame"
            >
              <Expand size={12} />
            </button>
          </div>

          <VideoExportControl
            aspectRatio={aspectRatio}
            getCanvas={() => exportCanvasRef.current}
            onCanvasResize={resizeExportCanvas}
            className="shrink-0"
          />

          {onOpenCodeEditor && (
            <button
              type="button"
              onClick={onOpenCodeEditor}
              className="hidden items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white lg:flex"
              title="Open the 100 Ways code lab"
            >
              <Code2 size={13} className="text-rose-400" />
              Code lab
            </button>
          )}

          {/* Dancer Overlay Toggle */}
          <button
            onClick={() => setShowDancerGuide(!showDancerGuide)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg border transition-colors ${
              showDancerGuide
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700'
            }`}
            title="Preview dancer silhouette over beat-switching backdrop"
          >
            <User size={13} />
            <span className="hidden lg:inline">Dancer Guide</span>
          </button>

          {/* Live Beat Pulse Indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono transition-all duration-75 border ${
              audioState.isBeat
                ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.9)] scale-105 font-bold'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800'
            }`}
          >
            <Zap size={11} className={audioState.isBeat ? 'animate-bounce' : ''} />
            <span>{audioState.isBeat ? 'BEAT!' : 'SYNCED'}</span>
          </div>

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showSettingsDrawer
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
            }`}
            title="Beat Switching Rules & FX Controls"
          >
            <Sliders size={14} />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg border border-neutral-700 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Floating Configuration Drawer */}
      {showSettingsDrawer && (
        <div className="relative z-30 mx-3 my-2 p-3 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-xl shadow-2xl text-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Picture Pack Selector */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-300 font-mono">Theme Pack:</span>
              <select
                value={selectedPackId}
                onChange={(e) => handlePackChange(e.target.value)}
                className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-200 focus:outline-none focus:border-cyan-500"
              >
                {CURATED_PICTURE_PACKS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.pictures.length} scenes)
                  </option>
                ))}
                {selectedPackId === 'custom' && <option value="custom">Custom Uploads</option>}
              </select>
            </div>

            {/* Custom Image Upload Button */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleCustomUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded-lg border border-neutral-700 transition-colors"
              >
                <Plus size={14} />
                <span>Upload Custom Scenes</span>
              </button>

              {/* Auto Demo Switch Button */}
              <button
                onClick={() => setAutoDemoSwitch(!autoDemoSwitch)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                  autoDemoSwitch
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800'
                }`}
              >
                <Sparkles size={13} />
                <span>{autoDemoSwitch ? 'Auto-Switch Demo: ON' : 'Auto-Switch Demo: OFF'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-neutral-800">
            {/* Beat Rule Selector */}
            <div>
              <label className="block text-neutral-400 font-mono mb-1">
                Beat Switching Trigger:
              </label>
              <select
                value={switchRule}
                onChange={(e) => setSwitchRule(e.target.value as SwitchRule)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-1.5 text-neutral-200 focus:border-cyan-500"
              >
                <option value="every-1-beat">Every 1 Beat (Kick Transient)</option>
                <option value="every-2-beats">Every 2 Beats (Half-Bar)</option>
                <option value="every-4-beats">Every 4 Beats (1 Full Musical Bar)</option>
                <option value="every-8-beats">Every 8 Beats (2 Musical Bars)</option>
                <option value="drop-only">Heavy Drops & Peak Accents Only</option>
                <option value="random-shuffle">Random Shuffle On Beat</option>
              </select>
            </div>

            {/* Transition FX */}
            <div>
              <label className="block text-neutral-400 font-mono mb-1">
                Visual Transition FX:
              </label>
              <select
                value={transitionStyle}
                onChange={(e) => setTransitionStyle(e.target.value as TransitionStyle)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-1.5 text-neutral-200 focus:border-cyan-500"
              >
                <option value="cut">Instant Hard VJ Cut</option>
                <option value="glitch">Glitch & Invert RGB Slice</option>
                <option value="zoom-slam">Zoom Slam & Scale Punch</option>
                <option value="strobe-flash">Nightclub Strobe Flash</option>
                <option value="crossfade">Smooth Crossfade</option>
                <option value="crt-scan">Retro CRT Wipe Scanlines</option>
              </select>
            </div>

            {/* Layer Toggles */}
            <div className="flex flex-wrap items-center gap-3 pt-2 sm:pt-4">
              <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showShockwaves}
                  onChange={(e) => setShowShockwaves(e.target.checked)}
                  className="accent-cyan-500 rounded"
                />
                <span>Shockwaves</span>
              </label>

              <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSpectrum}
                  onChange={(e) => setShowSpectrum(e.target.checked)}
                  className="accent-cyan-500 rounded"
                />
                <span>Spectrum</span>
              </label>

              <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStrobe}
                  onChange={(e) => setShowStrobe(e.target.checked)}
                  className="accent-cyan-500 rounded"
                />
                <span>Beat Strobe</span>
              </label>

              <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showThumbnailStrip}
                  onChange={(e) => setShowThumbnailStrip(e.target.checked)}
                  className="accent-cyan-500 rounded"
                />
                <span>Filmstrip</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main Visual Stage (Center-aligned with Aspect Ratio framing to prevent stretching) */}
      <div className="flex-1 min-h-0 w-full relative overflow-hidden flex items-center justify-center p-2 bg-neutral-950">
        {/* Aspect-Ratio-Locked Monitor Frame */}
        <div
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
          {/* Background Picture Display with Dynamic Transition FX & Fallback Gradient */}
          <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-950">
            {currentPicture && (
              <div
                className={`w-full h-full bg-cover bg-center transition-all duration-75 ${
                  transitionStyle === 'zoom-slam' && isTransitioning
                    ? 'scale-110 rotate-1 filter brightness-150 contrast-125'
                    : transitionStyle === 'glitch' && glitchActive
                    ? 'scale-105 filter invert-[0.85] saturate-200 hue-rotate-90'
                    : transitionStyle === 'strobe-flash' && isTransitioning
                    ? 'filter brightness-200 contrast-150'
                    : transitionStyle === 'crossfade'
                    ? 'transition-all duration-300'
                    : 'scale-100 rotate-0 filter brightness-100'
                }`}
                style={{
                  backgroundImage: `url('${currentPicture.url}'), ${
                    currentPicture.fallbackGradient ||
                    'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #030712 100%)'
                  }`,
                }}
              />
            )}

            {/* Ambient Dark Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

            {/* CRT Scanline Overlay FX */}
            {transitionStyle === 'crt-scan' && (
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none opacity-60" />
            )}

            {/* White Strobe Flash on Beat Impact */}
            {showStrobe && audioState.isBeat && (
              <div className="absolute inset-0 bg-white/25 pointer-events-none animate-ping" />
            )}
          </div>

          {/* Foreground Canvas for Shockwaves & Waveform */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 z-10 pointer-events-none w-full h-full"
          />

          {/* Dancer Overlay Guide (If enabled) */}
          {showDancerGuide && (
             <DancerOverlay
               audioState={audioState}
               customDancerUrl={customDancerUrl}
               customDancerType={customDancerType}
               onUploadDancer={handleCustomDancerUpload}
               onClearCustomDancer={clearCustomDancer}
               dancerType="silhouette-breakdance"
               aspectRatio={aspectRatio}
             />

          )}

          {/* Prominent Center Play Button when music is paused */}
          {!audioState.isPlaying && (
            <button
              onClick={() => getAudioEngine().togglePlayPause()}
              className="absolute z-20 px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-extrabold text-sm sm:text-base shadow-[0_0_35px_rgba(6,182,212,0.7)] backdrop-blur-md flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group border border-cyan-200/50 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-neutral-950 text-cyan-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Play size={20} className="ml-0.5 fill-current" />
              </div>
              <div className="text-left">
                <div className="leading-tight font-black tracking-wide">START MUSIC & BEATS</div>
                <div className="text-[11px] font-mono text-neutral-900 font-semibold">Click to play sound & sync backgrounds</div>
              </div>
            </button>
          )}

          {/* Manual Arrow Buttons for quick jumping */}
          <button
            onClick={prevPicture}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white/70 hover:text-white flex items-center justify-center transition-opacity opacity-0 hover:opacity-100 backdrop-blur-sm shadow-lg border border-neutral-700"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextPicture}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white/70 hover:text-white flex items-center justify-center transition-opacity opacity-0 hover:opacity-100 backdrop-blur-sm shadow-lg border border-neutral-700"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Bottom Scene Thumbnail Strip (Allows 1-click scene selection) */}
      {showThumbnailStrip && (
        <div className="shrink-0 px-3 py-1.5 bg-neutral-950/90 border-t border-neutral-800/80 flex items-center gap-2 overflow-x-auto z-20">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider shrink-0">
            Scenes:
          </span>
          <div className="flex items-center gap-1.5 min-w-0">
            {activePictures.map((pic, idx) => (
              <button
                key={pic.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  triggerVisualKick();
                }}
                className={`relative w-12 h-8 rounded overflow-hidden shrink-0 border transition-all ${
                  currentIndex === idx
                    ? 'border-cyan-400 ring-2 ring-cyan-500/50 scale-105'
                    : 'border-neutral-800 opacity-60 hover:opacity-100 hover:border-neutral-600'
                }`}
                title={pic.title}
              >
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${pic.url}'), ${
                      pic.fallbackGradient ||
                      'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #030712 100%)'
                    }`,
                  }}
                />
                <span className="absolute bottom-0 right-0 px-1 bg-black/80 text-[8px] font-mono text-white">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
