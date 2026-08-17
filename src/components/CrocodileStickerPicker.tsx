import React, { useState } from 'react';
import { Sparkles, Search, X, Flame, PartyPopper, Smile, Crown } from 'lucide-react';
import { CROCODILE_STICKERS, CrocodileSticker } from '../data/stickers';

interface CrocodileStickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: CrocodileSticker) => void;
}

export const CrocodileStickerPicker: React.FC<CrocodileStickerPickerProps> = ({
  isOpen,
  onClose,
  onSelectSticker,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'moods' | 'party' | 'reactions' | 'vip'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredStickers = CROCODILE_STICKERS.filter((s) => {
    const matchesCategory = activeCategory === 'all' || s.category === activeCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      id="croco-sticker-picker-popover"
      className="absolute bottom-12 left-0 sm:left-auto sm:right-0 w-80 sm:w-96 bg-slate-950 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 flex flex-col max-h-[420px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-b border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-base">
            🐊
          </div>
          <div>
            <h3 className="text-xs font-black text-emerald-300 tracking-wide flex items-center gap-1.5">
              KROKOOO STICKERS
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Animated crocodile expressions & reactions</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crocodile stickers..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-hidden"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-2 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-[11px] font-semibold">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
            activeCategory === 'all'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          All ({CROCODILE_STICKERS.length})
        </button>

        <button
          onClick={() => setActiveCategory('reactions')}
          className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
            activeCategory === 'reactions'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:bg-slate-900'
          }`}
        >
          <Smile className="w-3 h-3 text-cyan-400" />
          Reactions
        </button>

        <button
          onClick={() => setActiveCategory('party')}
          className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
            activeCategory === 'party'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:bg-slate-900'
          }`}
        >
          <PartyPopper className="w-3 h-3 text-amber-400" />
          Party
        </button>

        <button
          onClick={() => setActiveCategory('moods')}
          className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
            activeCategory === 'moods'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:bg-slate-900'
          }`}
        >
          <Flame className="w-3 h-3 text-orange-400" />
          Moods
        </button>

        <button
          onClick={() => setActiveCategory('vip')}
          className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
            activeCategory === 'vip'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:bg-slate-900'
          }`}
        >
          <Crown className="w-3 h-3 text-yellow-400" />
          VIP
        </button>
      </div>

      {/* Sticker Grid */}
      <div className="p-2.5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 min-h-[220px]">
        {filteredStickers.map((sticker) => (
          <button
            key={sticker.id}
            onClick={() => onSelectSticker(sticker)}
            className={`group relative p-2.5 rounded-xl bg-gradient-to-br ${sticker.bgGradient} border ${sticker.borderColor} hover:scale-105 active:scale-95 transition-all text-left flex flex-col items-center justify-between shadow-md hover:shadow-emerald-950/40 cursor-pointer overflow-hidden`}
          >
            {/* Ambient shine */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="text-3xl my-1 group-hover:scale-125 transition-transform duration-200">
              {sticker.emoji}
            </div>

            <div className="w-full text-center mt-1">
              <span className="block text-[11px] font-bold text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                {sticker.name}
              </span>
              <span className="block text-[9px] text-slate-400 truncate leading-tight">
                {sticker.tagline}
              </span>
            </div>
          </button>
        ))}

        {filteredStickers.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs">
            No crocodile stickers found matching "{searchQuery}".
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
        <span>Click any sticker to send directly into chat</span>
        <span className="text-emerald-400 font-mono">🐊 Krokooo Exclusive</span>
      </div>
    </div>
  );
};
