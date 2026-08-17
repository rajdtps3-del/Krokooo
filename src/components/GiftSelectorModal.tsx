import React from 'react';
import { Gift, Sparkles, Heart, Flame, Star, Disc, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { VirtualGift, ClientUser } from '../types';

interface GiftSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: ClientUser | null;
}

const GIFTS: VirtualGift[] = [
  { id: 'gift-heart', name: 'Love Heart', icon: '💖', cost: 10, effect: 'hearts' },
  { id: 'gift-fire', name: 'Hot Fire', icon: '🔥', cost: 25, effect: 'fire' },
  { id: 'gift-star', name: 'Superstar', icon: '⭐', cost: 50, effect: 'stars' },
  { id: 'gift-diamond', name: 'Diamond Gem', icon: '💎', cost: 100, effect: 'confetti' },
  { id: 'gift-crown', name: 'Golden Crown', icon: '👑', cost: 200, effect: 'disco' },
  { id: 'gift-frog', name: 'Krokooo Mascot', icon: '🐸', cost: 150, effect: 'confetti' },
  { id: 'gift-rocket', name: 'Rocket Boost', icon: '🚀', cost: 300, effect: 'fire' },
  { id: 'gift-party', name: 'Party Popper', icon: '🎉', cost: 40, effect: 'confetti' },
];

export const GiftSelectorModal: React.FC<GiftSelectorModalProps> = ({
  isOpen,
  onClose,
  targetUser,
}) => {
  const { sendGift } = useSocket();

  if (!isOpen) return null;

  const handleSend = (gift: VirtualGift) => {
    sendGift(gift, targetUser?.id, targetUser?.name);
    onClose();
  };

  return (
    <div
      id="gift-selector-modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-pink-950/70 via-purple-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                {targetUser ? `Send Gift to @${targetUser.name}` : 'Send Virtual Gift to Room'}
              </h2>
              <p className="text-[11px] text-pink-300">
                Broadcast celebratory animation & fanfare sounds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gift Grid */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {GIFTS.map((gift) => (
            <button
              key={gift.id}
              onClick={() => handleSend(gift)}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-gradient-to-b hover:from-pink-950/40 hover:to-purple-950/40 border border-slate-700/70 hover:border-pink-500/60 transition group flex flex-col items-center text-center cursor-pointer"
            >
              <span className="text-3xl mb-1 group-hover:scale-125 transition-transform">
                {gift.icon}
              </span>
              <span className="text-xs font-bold text-slate-200 group-hover:text-pink-300">
                {gift.name}
              </span>
              <span className="text-[10px] font-mono text-amber-400 mt-1 font-semibold">
                ✨ {gift.cost} pts
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
