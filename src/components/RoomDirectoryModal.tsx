import React, { useState } from 'react';
import {
  Compass,
  Search,
  Users,
  Video,
  Lock,
  PlusCircle,
  Sparkles,
  Flame,
  Radio,
  X,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { RoomSummary } from '../types';
import { KrokoooLogo } from './KrokoooLogo';

interface RoomDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateRoom: () => void;
}

const CATEGORIES = ['All', 'Community', 'Music', 'Technology', 'Languages', 'Gaming'];

export const RoomDirectoryModal: React.FC<RoomDirectoryModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateRoom,
}) => {
  const { rooms, joinRoom, currentRoom } = useSocket();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [passwordInput, setPasswordInput] = useState<Record<string, string>>({});
  const [pendingPasswordRoomId, setPendingPasswordRoomId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredRooms = rooms.filter((r) => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleJoin = (room: RoomSummary) => {
    if (room.isPasswordProtected) {
      setPendingPasswordRoomId(room.id);
      return;
    }
    joinRoom(room.id);
    onClose();
  };

  const handlePasswordSubmit = (roomId: string) => {
    const pwd = passwordInput[roomId] || '';
    joinRoom(roomId, pwd);
    setPendingPasswordRoomId(null);
    onClose();
  };

  return (
    <div
      id="room-directory-modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KrokoooLogo size="md" showText={false} />
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Krokooo Room Directory</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Rooms
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Explore live video chat rooms, meet broadcasters, and join conversations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="directory-create-room-btn"
              onClick={() => {
                onClose();
                onOpenCreateRoom();
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow shadow-teal-950/40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Host Room</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="room-directory-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms or topics..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-teal-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-hidden transition"
            />
          </div>
        </div>

        {/* Room Grid */}
        <div className="flex-1 p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs">No active rooms found matching your search</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isCurrent = currentRoom?.id === room.id;
              const isPendingPassword = pendingPasswordRoomId === room.id;

              return (
                <div
                  key={room.id}
                  className={`p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border transition flex flex-col justify-between ${
                    isCurrent
                      ? 'border-teal-500/80 shadow-md shadow-teal-950/20'
                      : 'border-slate-700/60'
                  }`}
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                          {room.category}
                        </span>
                        {room.isPasswordProtected && (
                          <span
                            className="p-1 rounded bg-amber-500/20 text-amber-300"
                            title="Password Protected Room"
                          >
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {room.userCount}/{room.maxUsers}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Video className="w-3.5 h-3.5" />
                          <span className="font-bold">{room.camCount} Cams</span>
                        </div>
                      </div>
                    </div>

                    {/* Room Name */}
                    <h3 className="text-sm font-bold text-slate-100 tracking-tight mb-1">
                      {room.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {room.topic || 'Welcome to our room!'}
                    </p>
                  </div>

                  {/* Password Form or Join Button */}
                  <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500">
                      Host: <span className="text-slate-300 font-semibold">{room.ownerName}</span>
                    </div>

                    {isPendingPassword ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="password"
                          placeholder="Room password..."
                          value={passwordInput[room.id] || ''}
                          onChange={(e) =>
                            setPasswordInput({ ...passwordInput, [room.id]: e.target.value })
                          }
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white outline-hidden w-28"
                        />
                        <button
                          onClick={() => handlePasswordSubmit(room.id)}
                          className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
                        >
                          Join
                        </button>
                        <button
                          onClick={() => setPendingPasswordRoomId(null)}
                          className="text-slate-400 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoin(room)}
                        disabled={isCurrent}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-slate-700 text-teal-300 cursor-default'
                            : 'bg-teal-600 hover:bg-teal-500 text-white shadow'
                        }`}
                      >
                        {isCurrent ? 'Inside Room' : 'Join Room'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
