import React from 'react';
import { CROCODILE_STICKERS, CrocodileSticker } from '../data/stickers';
import { Sparkles, Volume2, ShieldCheck, Crown } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import FUNNY_CROCO_SVG from '../assets/funnyCroco';

interface CrocodileStickerBadgeProps {
  code: string;
  senderName?: string;
  senderAvatar?: string;
  senderColor?: string;
  senderRole?: string;
  timestamp?: number;
  interactive?: boolean;
}

export const CrocodileStickerBadge: React.FC<CrocodileStickerBadgeProps> = ({
  code,
  senderName,
  senderAvatar,
  senderColor,
  senderRole,
  timestamp,
  interactive = true,
}) => {
  const sticker = CROCODILE_STICKERS.find(
    (s) => s.code === code || s.id === code.replace(/\[krokooo:|\]/g, '')
  );

  if (!sticker) {
    return <span className="text-emerald-400 font-mono">{code}</span>;
  }

  const handlePlaySound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sticker.soundEffect) {
      soundEngine.playSoundEffect(sticker.soundEffect);
    }
  };

  return (
    <div
      className={`my-1.5 inline-flex flex-col rounded-2xl bg-gradient-to-br ${sticker.bgGradient} border ${sticker.borderColor} shadow-xl shadow-black/50 overflow-hidden select-none max-w-sm transition-all ${
        interactive ? 'hover:scale-[1.02] hover:shadow-emerald-950/60' : ''
      }`}
    >
      {/* Sender Header Banner (if sender information is provided) */}
      {senderName && (
        <div className="px-3 py-1.5 bg-black/40 border-b border-white/10 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base leading-none shrink-0">{senderAvatar || '🐊'}</span>
            <span
              className="font-bold truncate"
              style={{ color: senderColor || '#34d399' }}
            >
              {senderName}
            </span>
            {senderRole === 'host' && (
              <Crown className="w-3 h-3 text-yellow-400 shrink-0" title="Room Host" />
            )}
            {senderRole === 'operator' && (
              <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" title="Operator" />
            )}
            {senderRole === 'vip' && (
              <Sparkles className="w-3 h-3 text-purple-400 shrink-0" title="VIP" />
            )}
          </div>
          {timestamp && (
            <span className="text-[10px] text-slate-400 font-mono shrink-0">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      {/* Main Sticker Card Body */}
      <div className="p-3 flex items-center gap-3">
        {/* Animated Crocodile Emoji / Mascot Illustration */}
        <div className="relative group/emoji cursor-pointer shrink-0" onClick={handlePlaySound}>
          {sticker.id === 'croco-mascot' ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-400 shadow-md animate-bounce duration-1000 group-hover/emoji:scale-125 transition-transform">
              <img
                src={FUNNY_CROCO_SVG}
                alt="Funny Krokooo Mascot"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="text-3xl sm:text-4xl animate-bounce duration-1000 shrink-0 drop-shadow-lg transition-transform hover:scale-125">
              {sticker.emoji}
            </div>
          )}
          {sticker.soundEffect && (
            <div className="absolute -bottom-1 -right-1 bg-black/70 rounded-full p-0.5 border border-emerald-500/40 text-emerald-300 opacity-80 group-hover/emoji:opacity-100">
              <Volume2 className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        {/* Sticker Titles & Action */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-black text-slate-100 tracking-tight truncate">
              {sticker.name}
            </span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-emerald-300 shrink-0">
              {sticker.category}
            </span>
          </div>
          <p className="text-[11px] text-emerald-200/90 font-medium leading-snug mt-0.5">
            {sticker.tagline}
          </p>
        </div>
      </div>
    </div>
  );
};

export function renderMessageWithStickers(
  text: string,
  textColor?: string,
  isBold?: boolean,
  isItalic?: boolean,
  senderDetails?: {
    name?: string;
    avatar?: string;
    color?: string;
    role?: string;
    timestamp?: number;
  }
): React.ReactNode {
  const stickerRegex = /\[krokooo:[a-z0-9-]+\]/g;
  const parts = text.split(stickerRegex);
  const matches = text.match(stickerRegex);

  if (!matches) {
    return (
      <span
        className={`${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''} break-words`}
        style={{ color: textColor || '#f3f4f6' }}
      >
        {text}
      </span>
    );
  }

  const result: React.ReactNode[] = [];
  parts.forEach((part, index) => {
    if (part) {
      result.push(
        <span
          key={`text-${index}`}
          className={`${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''} break-words`}
          style={{ color: textColor || '#f3f4f6' }}
        >
          {part}
        </span>
      );
    }
    if (matches[index]) {
      result.push(
        <div key={`sticker-${index}`} className="block my-1">
          <CrocodileStickerBadge
            code={matches[index]}
            senderName={senderDetails?.name}
            senderAvatar={senderDetails?.avatar}
            senderColor={senderDetails?.color}
            senderRole={senderDetails?.role}
            timestamp={senderDetails?.timestamp}
          />
        </div>
      );
    }
  });

  return <>{result}</>;
}
