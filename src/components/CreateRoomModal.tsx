import React, { useState } from 'react';
import { PlusCircle, Lock, Shield, Video, Users, X, Radio } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = ['Community', 'Music', 'Technology', 'Languages', 'Gaming', 'Chill Lounge'];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
  const { createRoom } = useSocket();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Community');
  const [topic, setTopic] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState(40);
  const [camLimit, setCamLimit] = useState(8);
  const [openMic, setOpenMic] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createRoom({
      name: name.trim(),
      category,
      topic: topic.trim(),
      isPasswordProtected,
      password: isPasswordProtected ? password : undefined,
      maxUsers,
      camLimit,
      openMic,
    });

    onClose();
  };

  return (
    <div
      id="create-room-modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Host New Camfrog Room</h2>
              <p className="text-[11px] text-slate-400">Configure your video chat room settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Room Name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Room Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="create-room-name-input"
              type="text"
              required
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acoustic Coffeehouse & Vocals"
              className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 outline-hidden transition"
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-lg px-3 py-2 text-slate-100 outline-hidden"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Max Broadcasters (Cams)</label>
              <select
                value={camLimit}
                onChange={(e) => setCamLimit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-lg px-3 py-2 text-slate-100 outline-hidden"
              >
                <option value={4}>4 Cams</option>
                <option value={6}>6 Cams</option>
                <option value={8}>8 Cams (Recommended)</option>
                <option value={12}>12 Cams (High Capacity)</option>
                <option value={16}>16 Cams</option>
              </select>
            </div>
          </div>

          {/* Room Topic */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Room Topic / MOTD</label>
            <textarea
              rows={2}
              maxLength={150}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Give visitors a welcome note or rules for this room..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 outline-hidden transition resize-none"
            />
          </div>

          {/* Capacity Slider */}
          <div>
            <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
              <span>Audience Capacity: {maxUsers} Users</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={maxUsers}
              onChange={(e) => setMaxUsers(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          {/* Password Protection */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPasswordProtected}
                onChange={(e) => setIsPasswordProtected(e.target.checked)}
                className="rounded accent-teal-500"
              />
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Password Protect Room (Private Room)
              </span>
            </label>

            {isPasswordProtected && (
              <input
                type="password"
                required={isPasswordProtected}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter room password..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 outline-hidden transition"
              />
            )}
          </div>

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
              id="create-room-submit-btn"
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition shadow-md shadow-teal-950/40 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Launch Room</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
