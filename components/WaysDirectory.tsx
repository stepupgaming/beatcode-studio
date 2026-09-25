'use client';

import React, { useState, useMemo } from 'react';
import { Search, Shuffle, ArrowLeft, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { ALL_100_WAYS_METADATA, BeatWay } from '@/lib/beatCodeRegistry';

interface WaysDirectoryProps {
  currentWayNumber: number;
  onSelectWay: (wayNumber: number) => void;
  onOpenAIGenerator: () => void;
}

const CATEGORIES = [
  'All 100 Ways',
  'DOM & Backgrounds',
  'Canvas 2D Geometry',
  'Particles & Physics',
  'Vector & Morphing',
  'Math & Fractals',
  'Typography & ASCII',
  'Retro & Shaders',
];

export default function WaysDirectory({
  currentWayNumber,
  onSelectWay,
  onOpenAIGenerator,
}: WaysDirectoryProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All 100 Ways');
  const [complexityFilter, setComplexityFilter] = useState<string>('all');

  const filteredWays = useMemo(() => {
    return ALL_100_WAYS_METADATA.filter((item) => {
      const matchesSearch =
        search === '' ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
        String(item.number).includes(search);

      const matchesCat =
        selectedCategory === 'All 100 Ways' || item.category === selectedCategory;

      const matchesComplexity =
        complexityFilter === 'all' || item.complexity.toLowerCase() === complexityFilter;

      return matchesSearch && matchesCat && matchesComplexity;
    });
  }, [search, selectedCategory, complexityFilter]);

  const handleRandom = () => {
    const randomNum = Math.floor(Math.random() * 100) + 1;
    onSelectWay(randomNum);
  };

  const handlePrev = () => {
    const prev = currentWayNumber > 1 ? currentWayNumber - 1 : 100;
    onSelectWay(prev);
  };

  const handleNext = () => {
    const next = currentWayNumber < 100 ? currentWayNumber + 1 : 1;
    onSelectWay(next);
  };

  return (
    <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl flex flex-col h-full overflow-hidden text-neutral-200">
      {/* Header with Search & Quick Actions */}
      <div className="p-3 border-b border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-sm text-neutral-100">
            <Layers size={16} className="text-cyan-400" />
            <span>100 Beat-Driven Ways</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
              title="Previous Way ([)"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="text-xs font-mono px-1.5 py-0.5 bg-neutral-800 rounded text-cyan-400 font-semibold">
              #{String(currentWayNumber).padStart(3, '0')}
            </span>
            <button
              onClick={handleNext}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
              title="Next Way (])"
            >
              <ArrowRight size={16} />
            </button>
            <button
              onClick={handleRandom}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded border border-neutral-700 transition-colors ml-1"
              title="Jump to Random Beat Technique"
            >
              <Shuffle size={12} />
              <span>Random</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 100 ways (e.g. background, shockwave, glitch)..."
            className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Category Scroll Filter */}
         <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
           {CATEGORIES.map((cat) => (
             <button
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`px-2 py-1 rounded-md whitespace-nowrap text-[11px] font-medium transition-colors ${
                 selectedCategory === cat
                   ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                   : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
               }`}
             >
               {cat}
             </button>
           ))}
         </div>

         <label className="flex items-center justify-between gap-2 text-[11px] text-neutral-500">
           <span className="font-mono uppercase tracking-wider">Complexity</span>
           <select
             value={complexityFilter}
             onChange={(event) => setComplexityFilter(event.target.value)}
             className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-neutral-300 outline-none focus:border-cyan-500"
           >
             <option value="all">All levels</option>
             <option value="beginner">Beginner</option>
             <option value="intermediate">Intermediate</option>
             <option value="advanced">Advanced</option>
           </select>
         </label>

      </div>

      {/* List of Ways */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-neutral-800/40">
        {/* Special quick link for Way #1 */}
        {currentWayNumber !== 1 && (
          <div
            onClick={() => onSelectWay(1)}
            className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 hover:bg-cyan-900/40 cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <span>Way #001: Background Flash (Classic)</span>
              </div>
              <p className="text-[11px] text-cyan-200/70 mt-0.5 line-clamp-1">
                The most basic beat-reactive code: background switches on every hit.
              </p>
            </div>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              DOM
            </span>
          </div>
        )}

        {filteredWays.map((way) => {
          const isActive = way.number === currentWayNumber;
          return (
            <div
              key={way.id}
              onClick={() => onSelectWay(way.number)}
              className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? 'bg-neutral-800 border border-cyan-500/50 shadow-sm'
                  : 'hover:bg-neutral-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <span
                      className={`font-mono font-bold ${
                        isActive ? 'text-cyan-400' : 'text-neutral-400'
                      }`}
                    >
                      #{String(way.number).padStart(3, '0')}
                    </span>
                    <span
                      className={`truncate ${
                        isActive ? 'text-white font-semibold' : 'text-neutral-200'
                      }`}
                    >
                      {way.title.replace(/^\d+\.\s*/, '')}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                    {way.description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      way.type === 'canvas'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    }`}
                  >
                    {way.type}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {way.complexity}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredWays.length === 0 && (
          <div className="p-8 text-center text-neutral-500 text-xs">
            No ways found matching &ldquo;{search}&rdquo;.
          </div>
        )}
      </div>

      {/* AI Generate Prompt Footer */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/60">
        <button
          onClick={onOpenAIGenerator}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg shadow-md transition-all active:scale-[0.99]"
        >
          <Sparkles size={14} />
          <span>AI Beat Code Generator</span>
        </button>
      </div>
    </div>
  );
}
