import React, { useState } from 'react';
import {
  User,
  Palette,
  Sparkles,
  Camera,
  Check,
  X,
  Volume2,
  Sliders,
  Flame,
  Zap,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeColor: string;
  onChangeThemeColor: (colorHex: string) => void;
}

export const PRESET_COLORS = [
  { name: 'Krokooo Green', hex: '#10b981' },
  { name: 'Electric Cyan', hex: '#06b6d4' },
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Royal Indigo', hex: '#6366f1' },
  { name: 'Neon Purple', hex: '#a855f7' },
  { name: 'Hot Pink', hex: '#ec4899' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Flame Orange', hex: '#f97316' },
  { name: 'Golden Amber', hex: '#f59e0b' },
  { name: 'Lime Glow', hex: '#84cc16' },
  { name: 'Pure White', hex: '#f8fafc' },
  { name: 'Cyber Rainbow', hex: 'rainbow' },
];

export const THEME_PALETTES = [
  { id: 'emerald', name: 'Emerald Oasis', primary: '#059669', bgClass: 'from-emerald-950/40' },
  { id: 'cyan', name: 'Cyber Cyan', primary: '#0891b2', bgClass: 'from-cyan-950/40' },
  { id: 'violet', name: 'Neon Violet', primary: '#7c3aed', bgClass: 'from-purple-950/40' },
  { id: 'rose', name: 'Crimson Velvet', primary: '#e11d48', bgClass: 'from-rose-950/40' },
  { id: 'amber', name: 'Sunset Amber', primary: '#d97706', bgClass: 'from-amber-950/40' },
  { id: 'blue', name: 'Deep Navy', primary: '#2563eb', bgClass: 'from-blue-950/40' },
];

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentThemeColor,
  onChangeThemeColor,
}) => {
  const { currentUser, updateUserProfile } = useSocket();

  const [name, setName] = useState(currentUser?.name || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [selectedColor, setSelectedColor] = useState(currentUser?.color || '#38bdf8');
  const [customHex, setCustomHex] = useState(
    currentUser?.color?.startsWith('#') ? currentUser.color : '#38bdf8'
  );
  const [status, setStatus] = useState<'online' | 'away' | 'busy'>(
    currentUser?.status || 'online'
  );
  const [activeTab, setActiveTab] = useState<'colors' | 'profile' | 'themes'>('colors');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateUserProfile({
      name: name.trim(),
      avatar: avatar.trim(),
      color: selectedColor === 'custom' ? customHex : selectedColor,
      status,
    });

    onClose();
  };

  return (
    <div
      id="user-profile-modal"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Multi-Colour & Profile Studio</h2>
              <p className="text-[11px] text-slate-400">
                Personalize nickname colors, gradients, theme accents & avatar
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('colors')}
            className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'colors'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Nickname Multi-Colour</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'themes'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Room Themes</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Name & Avatar</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Live Preview Box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt={name}
                className="w-11 h-11 rounded-full bg-slate-800 object-cover ring-2 ring-slate-700"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Live Chat Badge Preview
                </div>
                <div className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                  {selectedColor === 'rainbow' ? (
                    <span className="bg-gradient-to-r from-red-400 via-yellow-300 via-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse font-extrabold">
                      {name || 'YourNickname'}
                    </span>
                  ) : (
                    <span
                      style={{
                        color: selectedColor === 'custom' ? customHex : selectedColor,
                      }}
                    >
                      {name || 'YourNickname'}
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {status}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400 font-mono">
              {selectedColor === 'rainbow' ? 'Multi-Colour (Rainbow)' : (selectedColor === 'custom' ? customHex : selectedColor)}
            </div>
          </div>

          {/* TAB: Multi-Colour Palette for Nickname */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-bold mb-2">
                  Select Preset Nickname Colour
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {PRESET_COLORS.map((col) => {
                    const isSelected = selectedColor === col.hex;
                    return (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => {
                          setSelectedColor(col.hex);
                          if (col.hex !== 'rainbow') setCustomHex(col.hex);
                        }}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-left transition ${
                          isSelected
                            ? 'border-cyan-400 bg-slate-800 shadow-md ring-1 ring-cyan-400'
                            : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60'
                        }`}
                      >
                        {col.hex === 'rainbow' ? (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 via-emerald-400 to-indigo-500 shrink-0" />
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full shrink-0 shadow-inner"
                            style={{ backgroundColor: col.hex }}
                          />
                        )}
                        <span className="text-[11px] font-semibold truncate text-slate-200">
                          {col.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Hex Picker */}
              <div className="pt-3 border-t border-slate-800">
                <label className="block text-slate-300 font-bold mb-2">
                  Custom Multi-Colour Hex Picker
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => {
                      setCustomHex(e.target.value);
                      setSelectedColor('custom');
                    }}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={customHex}
                      onChange={(e) => {
                        setCustomHex(e.target.value);
                        setSelectedColor('custom');
                      }}
                      placeholder="#38bdf8"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-slate-100 font-mono outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedColor('custom')}
                    className={`px-3 py-2 rounded-lg font-bold transition ${
                      selectedColor === 'custom'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Apply Hex
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Themes */}
          {activeTab === 'themes' && (
            <div className="space-y-3">
              <label className="block text-slate-300 font-bold mb-1">
                Room Atmosphere & Highlight Multi-Colour
              </label>
              <p className="text-[11px] text-slate-400 mb-3">
                Sets the global room border accents, button glow, and broadcast frames
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {THEME_PALETTES.map((th) => {
                  const isActive = currentThemeColor === th.primary;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => onChangeThemeColor(th.primary)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-left transition ${
                        isActive
                          ? 'border-cyan-400 bg-slate-800 ring-1 ring-cyan-400'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full shadow-md"
                          style={{ backgroundColor: th.primary }}
                        />
                        <span className="font-semibold text-slate-200 text-xs">{th.name}</span>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: Name & Avatar */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Display Nickname</label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-slate-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Status State</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['online', 'away', 'busy'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2 rounded-lg font-semibold capitalize border transition ${
                        status === st
                          ? 'border-cyan-500 bg-slate-800 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-2">
                  Choose Stock Avatar or Enter Custom Image URL
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {DEFAULT_AVATARS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="avatar option"
                      onClick={() => setAvatar(url)}
                      className={`w-14 h-14 rounded-xl object-cover cursor-pointer border-2 transition ${
                        avatar === url ? 'border-cyan-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-slate-100 text-xs outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-md shadow-cyan-950/40 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
