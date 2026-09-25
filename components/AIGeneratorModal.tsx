'use client';

import React, { useState } from 'react';
import { X, Sparkles, Loader2, Wand2, Lightbulb } from 'lucide-react';
import { BeatWay } from '@/lib/beatCodeRegistry';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedCode: (way: BeatWay) => void;
  currentCode?: string;
  currentType?: 'canvas' | 'dom';
}

const INSPIRATION_PROMPTS = [
  'Beat-synchronized scene switcher cycling through pictures on kicks with chromatic glitch and zoom slam',
  'Animated 3D wireframe polyhedra that morph topology and invert physics on heavy drops',
  'Function dispatcher repeating kinetic typography bursts and hue shifts at exact song tempo',
  'Floating neon origami cranes that unfold on snares and glow on bass drops',
  'Liquid ferrofluid magnetic spikes flaring in sync with sub-bass frequency bursts',
  'Cyberpunk HUD scanner targeting alien ships that lock on each drum hit',
];

export default function AIGeneratorModal({
  isOpen,
  onClose,
  onApplyGeneratedCode,
  currentCode,
  currentType,
}: AIGeneratorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [targetType, setTargetType] = useState<'canvas' | 'dom'>('canvas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-beat-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           prompt,
           type: targetType,
           currentCode,
           currentType,

        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate code');
      }

       const data = await res.json();
       if (typeof data.code !== 'string' || !data.code.trim()) {
         throw new Error('The AI response did not include executable code.');
       }
       const customWay: BeatWay = {

        id: `custom-ai-${Date.now()}`,
        number: 101,
        title: data.title || 'AI Beat Synthesis',
        category: 'Particles & Physics',
        complexity: 'Advanced',
        description: data.description || prompt,
         type: data.type === 'dom' ? 'dom' : targetType,

        code: data.code,
        tags: ['ai-generated', 'custom'],
      };

      onApplyGeneratedCode(customWay);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with Gemini');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-xl w-full p-5 sm:p-6 text-neutral-100 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                AI Beat Code Synthesizer
              </h3>
              <p className="text-xs text-neutral-400">
                Describe any visual effect to generate beat-reactive code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input prompt */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              What do you want to react to the beat?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Floating neon crystal asteroids that shatter into particles when the kick hits and reform on quiet parts..."
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Mode Selector */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Coding Architecture:</span>
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => setTargetType('canvas')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  targetType === 'canvas'
                    ? 'bg-neutral-800 text-cyan-300 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                HTML5 Canvas 2D
              </button>
              <button
                type="button"
                onClick={() => setTargetType('dom')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  targetType === 'dom'
                    ? 'bg-neutral-800 text-cyan-300 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                HTML / CSS DOM
              </button>
            </div>
          </div>

          {/* Quick inspiration prompts */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 mb-1.5">
              <Lightbulb size={12} className="text-amber-400" />
              <span>Or try an inspiration recipe:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {INSPIRATION_PROMPTS.map((insp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(insp)}
                  className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-neutral-950/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
                >
                  {insp}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-300 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-md"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating Beat Code...</span>
              </>
            ) : (
              <>
                <Wand2 size={14} />
                <span>Generate with Gemini</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
