import React from 'react';
import { Volume2, Music, Sparkles, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { SoundFx } from '../types';

interface SoundboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOUNDS: { id: string; name: string; icon: string; fx: SoundFx; desc: string }[] = [
  { id: 'applause', name: 'Applause & Cheers', icon: '👏', fx: 'applause', desc: 'Crowd clapping ovation' },
  { id: 'airhorn', name: 'DJ Airhorn', icon: '🎺', fx: 'airhorn', desc: 'Classic party hype airhorn' },
  { id: 'drumroll', name: 'Drumroll', icon: '🥁', fx: 'drumroll', desc: 'Tension & suspense build-up' },
  { id: 'ba-dum-tss', name: 'Ba-Dum-Tss', icon: '🥁', fx: 'ba-dum-tss', desc: 'Rimshot punchline' },
  { id: 'laser', name: 'Laser Beam', icon: '⚡', fx: 'laser', desc: 'Sci-fi blaster effect' },
  { id: 'tada', name: 'Ta-Da Fanfare', icon: '🎉', fx: 'tada', desc: 'Victorious celebration chime' },
  { id: 'bell', name: 'Boxing Bell', icon: '🔔', fx: 'bell', desc: 'Round 1 starting ding' },
  { id: 'laugh', name: 'Sitcom Laugh', icon: '😂', fx: 'laugh', desc: 'Studio audience laughter' },
];

export const SoundboardModal: React.FC<SoundboardModalProps> = ({ isOpen, onClose }) => {
  const { playSoundFx } = useSocket();

  if (!isOpen) return null;

  const handlePlay = (fx: SoundFx) => {
    playSoundFx(fx);
  };

  return (
    <div
      id="soundboard-modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Live Sound Effects Board</h2>
              <p className="text-[11px] text-slate-400">Play instant audio fx to all room listeners</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sound FX Grid */}
        <div className="p-4 grid grid-cols-2 gap-2.5">
          {SOUNDS.map((s) => (
            <button
              key={s.id}
              onClick={() => handlePlay(s.fx)}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-indigo-950/40 border border-slate-700 hover:border-indigo-500/70 transition flex items-center gap-3 text-left group cursor-pointer"
            >
              <span className="text-2xl group-hover:scale-125 transition-transform">{s.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 truncate">
                  {s.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{s.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
