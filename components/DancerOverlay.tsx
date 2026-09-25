'use client';

import React, { useRef, useState } from 'react';
import {
  Upload,
  X,
  Sliders,
  Sparkles,
  Move,
  Maximize2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { AudioBeatState } from '@/lib/audioEngine';

export type AspectRatio = '16:9' | '9:16' | '1:1' | 'fill';

interface DancerOverlayProps {
  audioState: AudioBeatState;
  customDancerUrl: string | null;
  customDancerType?: 'image' | 'video' | null;
  onUploadDancer: (url: string, kind: 'image' | 'video') => void;
  onClearCustomDancer: () => void;
  dancerType?: 'silhouette-breakdance' | 'silhouette-pop' | 'silhouette-hiphop';
  aspectRatio?: AspectRatio;
}

export default function DancerOverlay({
  audioState,
  customDancerUrl,
  customDancerType: customDancerTypeProp,
  onUploadDancer,
  onClearCustomDancer,
  dancerType = 'silhouette-hiphop',
  aspectRatio = '16:9',
}: DancerOverlayProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local pose state if user toggles between poses
  const [activePose, setActivePose] = useState<
    'silhouette-breakdance' | 'silhouette-pop' | 'silhouette-hiphop'
  >(dancerType);
  const [localCustomDancerType, setLocalCustomDancerType] = useState<'image' | 'video' | null>(null);
  const customDancerType = customDancerTypeProp || localCustomDancerType;

  // Position & sizing controls for perfect stage alignment
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.0);
  const [verticalOffset, setVerticalOffset] = useState<number>(0); // in pixels
  const [dancerOpacity, setDancerOpacity] = useState<number>(0.95);
  const [showControls, setShowControls] = useState<boolean>(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const kind = file.type.startsWith('video/') ? 'video' : 'image';
      const url = URL.createObjectURL(file);
      setLocalCustomDancerType(kind);
      onUploadDancer(url, kind);
    }
  };

  // Beat reaction kick
  const beatScale = audioState.isBeat ? 1.04 : 1.0 + audioState.bass * 0.02;
  const beatBounce = audioState.isBeat ? -6 : 0;

  // Adaptive sizing tailored specifically to each Aspect Ratio so dancer NEVER crops
  const getAspectRatioSizing = () => {
    switch (aspectRatio) {
      case '16:9':
        // Landscape: Wide stage - Dancer fits comfortably with balanced headroom & footroom
        return {
          containerClass: 'h-[78%] max-w-[50%]',
          svgWidth: 'w-auto h-full',
          label: '16:9 Stage',
        };
      case '9:16':
        // Vertical Portrait (TikTok / Reels): Dancer occupies full vertical glory without clipping
        return {
          containerClass: 'h-[74%] max-w-[85%]',
          svgWidth: 'w-auto h-full',
          label: '9:16 Reels/TikTok',
        };
      case '1:1':
        // Square: Balanced square framing
        return {
          containerClass: 'h-[75%] max-w-[65%]',
          svgWidth: 'w-auto h-full',
          label: '1:1 Square',
        };
      case 'fill':
      default:
        return {
          containerClass: 'h-[78%] max-w-[60%]',
          svgWidth: 'w-auto h-full',
          label: 'Fill Frame',
        };
    }
  };

  const arConfig = getAspectRatioSizing();

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20 overflow-hidden select-none">
      {/* Floating Dancer Guide Control Dock (Bottom Center / Right) */}
      <div className="absolute bottom-3 right-3 pointer-events-auto z-30 flex items-center gap-1.5 bg-neutral-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/15 text-xs text-neutral-200 shadow-2xl">
        <input
          ref={fileInputRef}
          type="file"
           accept="image/*,video/*"

          className="hidden"
          onChange={handleFile}
        />

        {/* Upload Person / WebM button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors text-[11px] font-semibold"
          title="Upload your own transparent PNG / WebM dancer video"
        >
          <Upload size={12} className="text-cyan-400" />
          <span>{customDancerUrl ? 'Change Dancer' : 'Upload Person / WebM'}</span>
        </button>

        {customDancerUrl && (
          <button
            onClick={onClearCustomDancer}
            className="p-1 hover:text-rose-400 text-neutral-400 rounded-md hover:bg-neutral-800 transition-colors"
            title="Remove custom dancer and return to silhouette"
          >
            <X size={13} />
          </button>
        )}

        {/* Controls Drawer Toggle */}
        <button
          onClick={() => setShowControls(!showControls)}
          className={`p-1 rounded-md border transition-colors ${
            showControls
              ? 'bg-neutral-800 text-cyan-300 border-neutral-600'
              : 'text-neutral-400 hover:text-white border-neutral-800 hover:bg-neutral-800'
          }`}
          title="Adjust dancer scale, position & pose"
        >
          <Sliders size={13} />
        </button>
      </div>

      {/* Expanded Dancer Adjustment Panel */}
      {showControls && (
        <div className="absolute bottom-12 right-3 pointer-events-auto z-30 p-3 bg-neutral-950/95 backdrop-blur-xl border border-neutral-700 rounded-xl shadow-2xl text-xs space-y-2.5 w-64 text-neutral-300">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 font-mono text-[11px] text-cyan-400 font-semibold">
            <span>DANCER GUIDE SETTINGS</span>
            <span className="text-neutral-400 font-normal">[{arConfig.label}]</span>
          </div>

          {/* Pose Selector (for silhouette mode) */}
          {!customDancerUrl && (
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                Dancer Pose:
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setActivePose('silhouette-hiphop')}
                  className={`px-1.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                    activePose === 'silhouette-hiphop'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  Hip-Hop
                </button>
                <button
                  onClick={() => setActivePose('silhouette-breakdance')}
                  className={`px-1.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                    activePose === 'silhouette-breakdance'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  Breakdance
                </button>
                <button
                  onClick={() => setActivePose('silhouette-pop')}
                  className={`px-1.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                    activePose === 'silhouette-pop'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  Pop / Club
                </button>
              </div>
            </div>
          )}

          {/* Scale Slider */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-400 font-mono">Scale:</span>
            <input
              type="range"
              min="0.5"
              max="1.3"
              step="0.05"
              value={scaleMultiplier}
              onChange={(e) => setScaleMultiplier(parseFloat(e.target.value))}
              className="w-28 accent-cyan-500 h-1 bg-neutral-800 rounded"
            />
            <span className="text-[10px] font-mono text-cyan-400 w-8 text-right">
              {Math.round(scaleMultiplier * 100)}%
            </span>
          </div>

          {/* Vertical Y-Offset Slider */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-400 font-mono">Position Y:</span>
            <input
              type="range"
              min="-80"
              max="80"
              step="2"
              value={verticalOffset}
              onChange={(e) => setVerticalOffset(parseInt(e.target.value))}
              className="w-28 accent-cyan-500 h-1 bg-neutral-800 rounded"
            />
            <span className="text-[10px] font-mono text-cyan-400 w-8 text-right">
              {verticalOffset}px
            </span>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-400 font-mono">Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={dancerOpacity}
              onChange={(e) => setDancerOpacity(parseFloat(e.target.value))}
              className="w-28 accent-cyan-500 h-1 bg-neutral-800 rounded"
            />
            <span className="text-[10px] font-mono text-cyan-400 w-8 text-right">
              {Math.round(dancerOpacity * 100)}%
            </span>
          </div>

          {/* Reset button */}
          <button
            onClick={() => {
              setScaleMultiplier(1.0);
              setVerticalOffset(0);
              setDancerOpacity(0.95);
            }}
            className="w-full mt-1 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 flex items-center justify-center gap-1 text-[10px] transition-colors"
          >
            <RefreshCw size={10} />
            <span>Reset Position & Scale</span>
          </button>
        </div>
      )}

      {/* Main Center Stage Dancer Subject (Scaled & Contained to current Aspect Ratio) */}
      <div
        className={`relative flex flex-col items-center justify-end ${arConfig.containerClass} transition-all duration-150`}
        style={{
          transform: `scale(${scaleMultiplier * beatScale}) translateY(${verticalOffset + beatBounce}px)`,
          opacity: dancerOpacity,
          transformOrigin: 'bottom center',
        }}
      >
        {customDancerUrl ? (
          // Custom uploaded dancer (Transparent WebM video or PNG)
          <div className="relative w-full h-full flex items-end justify-center">
            {customDancerType === 'video' ? (
              <video
                src={customDancerUrl}
                autoPlay
                loop
                muted
                playsInline
                className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)]"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={customDancerUrl}
                alt="Custom Dancer Subject"
                className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)]"
              />
            )}
          </div>
        ) : (
          // High-Fidelity Vector Dancer Silhouette with Rim Lighting & Ground Reflection
          <div className="relative w-full h-full flex flex-col items-center justify-end">
            <svg
              className={`${arConfig.svgWidth} transition-all duration-75 drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]`}
              viewBox="0 0 400 580"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Stage Ground Shadow Gradient */}
                <radialGradient
                  id="groundShadowGrad"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <stop offset="0%" stopColor="#000000" stopOpacity="0.75" />
                  <stop offset="60%" stopColor="#000000" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>

                {/* Sleek Silhouette Body Gradient */}
                <linearGradient id="dancerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>

                {/* Beat Pulse Glow Filter */}
                <filter id="beatGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow
                    dx="0"
                    dy="0"
                    stdDeviation={audioState.isBeat ? '8' : '3'}
                    floodColor={audioState.isBeat ? '#06b6d4' : '#38bdf8'}
                    floodOpacity={audioState.isBeat ? '0.85' : '0.25'}
                  />
                </filter>
              </defs>

              {/* Stage Floor Reflection / Contact Shadow */}
              <ellipse
                cx="200"
                cy="545"
                rx={audioState.isBeat ? '135' : '120'}
                ry="14"
                fill="url(#groundShadowGrad)"
              />

              {/* Dancer Silhouette Group with Responsive Rim Lighting */}
              <g
                filter="url(#beatGlow)"
                className="transition-all duration-75"
              >
                {activePose === 'silhouette-hiphop' && (
                  // Dynamic Street / Hip-Hop Dancer Pose
                  <g
                    fill="url(#dancerGrad)"
                    stroke={audioState.isBeat ? '#22d3ee' : '#38bdf8'}
                    strokeWidth={audioState.isBeat ? '2.5' : '1.2'}
                    strokeLinejoin="round"
                  >
                    {/* Head with tilted cap */}
                    <circle cx="200" cy="80" r="28" />
                    {/* Cap visor profile */}
                    <path d="M185 75 Q160 76 150 78 Q170 86 185 84 Z" />

                    {/* Neck */}
                    <path d="M192 108 L208 108 L205 125 L195 125 Z" />

                    {/* Torso & Hoodie in confident street lean */}
                    <path d="M165 125 C145 135 130 160 120 195 C115 210 124 218 135 212 C146 205 152 185 158 175 L152 280 C152 295 165 305 180 305 L220 305 C235 305 248 295 248 280 L242 175 C248 185 254 205 265 212 C276 218 285 210 280 195 C270 160 255 135 235 125 C225 120 210 118 200 118 C190 118 175 120 165 125 Z" />

                    {/* Left Arm gestured out with rhythm */}
                    <path d="M135 140 C110 155 85 180 65 215 C58 228 72 238 84 228 C100 200 118 178 138 165 Z" />
                    {/* Left Hand */}
                    <circle cx="68" cy="222" r="10" />

                    {/* Right Arm popping to the beat */}
                    <path d="M265 140 C290 155 315 180 335 215 C342 228 328 238 316 228 C300 200 282 178 262 165 Z" />
                    {/* Right Hand */}
                    <circle cx="332" cy="222" r="10" />

                    {/* Baggy Street Pants & Bent Knees stance */}
                    <path d="M168 305 L150 405 C145 435 135 470 125 505 C120 520 135 532 150 526 C168 518 182 465 190 415 L196 345 L204 345 L210 415 C218 465 232 518 250 526 C265 532 280 520 275 505 C265 470 255 435 250 405 L232 305 Z" />

                    {/* Left Sneaker firmly grounded */}
                    <path d="M125 510 C110 515 95 530 90 538 C88 544 94 548 102 548 L152 548 C158 548 162 542 160 535 C155 522 142 512 125 510 Z" />

                    {/* Right Sneaker firmly grounded */}
                    <path d="M275 510 C290 515 305 530 310 538 C312 544 306 548 298 548 L248 548 C242 548 238 542 240 535 C245 522 258 512 275 510 Z" />
                  </g>
                )}

                {activePose === 'silhouette-breakdance' && (
                  // High-energy B-Boy / B-Girl Freeze Pose
                  <g
                    fill="url(#dancerGrad)"
                    stroke={audioState.isBeat ? '#f43f5e' : '#fb7185'}
                    strokeWidth={audioState.isBeat ? '2.5' : '1.2'}
                    strokeLinejoin="round"
                  >
                    {/* Head tilted in freeze */}
                    <circle cx="180" cy="110" r="26" />

                    {/* Torso angled in powerful freeze */}
                    <path d="M160 145 C140 160 120 195 110 235 C105 255 125 265 138 250 C150 235 162 205 170 185 L165 275 C165 295 185 305 205 300 L235 285 C250 278 258 260 254 245 L240 165 C230 150 210 140 190 140 Z" />

                    {/* Ground Support Arm (Planted on stage) */}
                    <path d="M130 185 L95 275 C90 288 105 298 118 288 L148 205 Z" />
                    <circle cx="90" cy="295" r="14" />

                    {/* Air Freeze Extended Arm */}
                    <path d="M225 155 L290 105 C305 95 320 110 310 125 L245 185 Z" />
                    <circle cx="310" cy="100" r="12" />

                    {/* Air-Kicked Left Leg */}
                    <path d="M185 295 L145 375 C130 405 105 435 75 460 C60 472 75 492 92 482 C125 460 155 425 175 385 L205 315 Z" />
                    <path d="M72 470 L50 488 C45 494 50 502 58 502 L95 495 Z" />

                    {/* Ground Balancing Right Leg */}
                    <path d="M225 290 L240 380 C245 420 248 465 245 505 C244 522 260 535 275 528 C290 520 295 480 290 440 L280 360 L248 280 Z" />
                    <path d="M245 510 C240 525 230 538 220 545 C215 548 220 552 228 552 L285 550 C292 550 295 542 292 535 Z" />
                  </g>
                )}

                {activePose === 'silhouette-pop' && (
                  // Sleek Pop / House Club Dancer Groove Pose
                  <g
                    fill="url(#dancerGrad)"
                    stroke={audioState.isBeat ? '#a855f7' : '#c084fc'}
                    strokeWidth={audioState.isBeat ? '2.5' : '1.2'}
                    strokeLinejoin="round"
                  >
                    {/* Head with headphone silhouette */}
                    <circle cx="200" cy="75" r="26" />
                    {/* Headphones arch */}
                    <path
                      d="M172 75 C172 58 184 45 200 45 C216 45 228 58 228 75"
                      strokeWidth="3.5"
                      fill="none"
                    />
                    <rect x="168" y="68" width="8" height="16" rx="4" />
                    <rect x="224" y="68" width="8" height="16" rx="4" />

                    {/* Sleek Torso */}
                    <path d="M180 115 C160 130 148 165 142 205 C140 220 152 230 162 222 C172 215 178 195 182 180 L178 285 C178 300 190 310 205 310 C220 310 232 300 232 285 L228 180 C232 195 238 215 248 222 C258 230 270 220 268 205 C262 165 250 130 230 115 Z" />

                    {/* Left Arm raised to the beat */}
                    <path d="M170 125 C145 105 125 75 110 45 C102 32 118 20 128 32 C145 60 165 92 188 115 Z" />
                    <circle cx="108" cy="38" r="10" />

                    {/* Right Arm groove angle */}
                    <path d="M230 125 C255 140 280 165 300 195 C308 208 295 220 282 210 C265 185 248 160 228 140 Z" />
                    <circle cx="295" cy="205" r="10" />

                    {/* Legs with dance bounce */}
                    <path d="M182 310 L168 410 C160 445 152 485 145 520 C142 534 158 545 170 538 C185 528 195 480 200 430 L205 350 L210 430 C215 480 225 528 240 538 C252 545 268 534 265 520 C258 485 250 445 242 410 L228 310 Z" />

                    {/* Shoes */}
                    <path d="M142 522 C130 528 118 538 114 544 C112 548 116 552 122 552 L172 552 C178 552 182 546 178 540 Z" />
                    <path d="M268 522 C280 528 292 538 296 544 C298 548 294 552 288 552 L238 552 C232 552 228 546 232 540 Z" />
                  </g>
                )}
              </g>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
