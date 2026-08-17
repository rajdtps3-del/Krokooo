import React from 'react';
import FUNNY_CROCO_SVG from '../assets/funnyCroco';
import { soundEngine } from '../utils/audio';

interface KrokoooLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  animate?: boolean;
  playFunnySoundOnClick?: boolean;
}

export const KrokoooLogo: React.FC<KrokoooLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  animate = true,
  playFunnySoundOnClick = true,
}) => {
  const sizeMap = {
    sm: { icon: 'w-8 h-8', text: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-base', sub: 'text-[10px]' },
    lg: { icon: 'w-14 h-14', text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 'w-20 h-20', text: 'text-2xl', sub: 'text-sm' },
    '2xl': { icon: 'w-28 h-28', text: 'text-3xl', sub: 'text-base' },
  };

  const { icon, text, sub } = sizeMap[size];

  const handleClick = (e: React.MouseEvent) => {
    if (playFunnySoundOnClick) {
      soundEngine.playSoundEffect('laugh');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`inline-flex items-center gap-3 select-none cursor-pointer group ${className}`}
      title="Krokooo - Click for funny crocodile laugh! 🐊"
    >
      {/* Funny Crocodile Mascot Emblem */}
      <div
        className={`relative ${icon} rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-300 p-0.5 shadow-xl shadow-emerald-950/60 flex items-center justify-center shrink-0 ${
          animate
            ? 'group-hover:scale-110 group-hover:rotate-6 active:scale-95 transition-all duration-300'
            : ''
        }`}
      >
        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden relative border border-emerald-400/30">
          <img
            src={FUNNY_CROCO_SVG}
            alt="Funny Krokooo Crocodile Mascot Logo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-[13px] group-hover:scale-110 transition-transform duration-300"
          />
          {/* Funny Party/Crown Accent Badge */}
          <div className="absolute -bottom-1 -right-1 text-[10px] sm:text-xs drop-shadow-md select-none group-hover:animate-bounce">
            🎉
          </div>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`${text} font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-lime-300 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-yellow-300 transition-all`}
            >
              Krokooo
            </span>
            <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
              Live
            </span>
          </div>
          <span className={`${sub} text-slate-400 font-medium tracking-normal group-hover:text-emerald-300/80 transition-colors`}>
            Video Chat & Rooms 🐊
          </span>
        </div>
      )}
    </div>
  );
};
