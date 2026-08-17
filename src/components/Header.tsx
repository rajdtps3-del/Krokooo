import React, { useState } from 'react';
import {
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Compass,
  PlusCircle,
  MessageSquare,
  Sparkles,
  Music2,
  BarChart2,
  Shield,
  Crown,
  Settings,
  Flame,
  Radio,
  DoorOpen,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { UserStatus } from '../types';
import { KrokoooLogo } from './KrokoooLogo';

interface HeaderProps {
  onOpenDirectory: () => void;
  onOpenCreateRoom: () => void;
  onOpenProfile: () => void;
  onOpenGifts: () => void;
  onOpenSoundboard: () => void;
  onOpenPolls: () => void;
  onOpenPMs: () => void;
  isCamActive: boolean;
  onToggleCam: () => void;
  unreadPMCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDirectory,
  onOpenCreateRoom,
  onOpenProfile,
  onOpenGifts,
  onOpenSoundboard,
  onOpenPolls,
  onOpenPMs,
  isCamActive,
  onToggleCam,
  unreadPMCount,
}) => {
  const {
    currentUser,
    currentRoom,
    leaveRoom,
    soundMuted,
    toggleSoundMute,
    isConnected,
  } = useSocket();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
      case 'host':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Crown className="w-3 h-3 text-amber-400" /> Host
          </span>
        );
      case 'operator':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Shield className="w-3 h-3 text-blue-400" /> Op
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusDot = (status?: UserStatus) => {
    switch (status) {
      case 'busy':
        return 'bg-red-500';
      case 'away':
        return 'bg-amber-500';
      case 'online':
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <header
      id="krokooo-header"
      className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 flex items-center justify-between gap-3 select-none z-30 sticky top-0"
    >
      {/* Brand & Room Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          id="krokooo-brand"
          onClick={onOpenDirectory}
          className="flex items-center cursor-pointer group"
          title="Return to Room Directory"
        >
          <KrokoooLogo size="md" />
        </div>

        {/* Current Room Info Pill */}
        {currentRoom ? (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/70 max-w-md truncate">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200 truncate">{currentRoom.name}</span>
                <span className="text-[10px] px-1.5 rounded bg-slate-700 text-slate-300">
                  {currentRoom.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{currentRoom.topic || 'No topic set'}</p>
            </div>
            <button
              id="header-leave-room-btn"
              onClick={leaveRoom}
              className="ml-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2 py-1 rounded transition-colors flex items-center gap-1 shrink-0"
              title="Leave room and go to lobby"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-400 border border-slate-700/50">
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>In Lobby / Browse Community Rooms</span>
          </div>
        )}
      </div>

      {/* Navigation & Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Cam Broadcast Button */}
        {currentRoom && (
          <button
            id="header-broadcast-cam-btn"
            onClick={onToggleCam}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
              isCamActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
            }`}
            title={isCamActive ? 'Stop Broadcasting Cam' : 'Broadcast Live Cam to Room'}
          >
            {isCamActive ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCamActive ? 'Stop Cam' : 'Broadcast Cam'}</span>
          </button>
        )}

        {/* Room Directory */}
        <button
          id="header-directory-btn"
          onClick={onOpenDirectory}
          className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition-colors flex items-center gap-1.5"
          title="Browse Live Rooms"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Rooms</span>
        </button>

        {/* Create Room Button */}
        <button
          id="header-create-room-btn"
          onClick={onOpenCreateRoom}
          className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-teal-900/40 hover:bg-teal-800/50 text-teal-300 text-xs font-medium border border-teal-700/40 transition-colors flex items-center gap-1.5"
          title="Host Your Own Video Room"
        >
          <PlusCircle className="w-4 h-4 text-teal-400" />
          <span className="hidden sm:inline">Host Room</span>
        </button>

        {/* Gifts Button */}
        {currentRoom && (
          <button
            id="header-gifts-btn"
            onClick={onOpenGifts}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-400 border border-slate-700/60 transition-colors relative"
            title="Send Virtual Gifts & Fanfare"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}

        {/* Soundboard Button */}
        {currentRoom && (
          <button
            id="header-soundboard-btn"
            onClick={onOpenSoundboard}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/60 transition-colors"
            title="Room Soundboard & Hype Effects"
          >
            <Music2 className="w-4 h-4" />
          </button>
        )}

        {/* Polls Button */}
        {currentRoom && (
          <button
            id="header-polls-btn"
            onClick={onOpenPolls}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700/60 transition-colors relative"
            title="Room Polls"
          >
            <BarChart2 className="w-4 h-4" />
            {currentRoom.poll && currentRoom.poll.isOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            )}
          </button>
        )}

        {/* Private Messages */}
        <button
          id="header-pms-btn"
          onClick={onOpenPMs}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors relative"
          title="Direct Private Messages"
        >
          <MessageSquare className="w-4 h-4 text-blue-400" />
          {unreadPMCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold ring-2 ring-slate-900">
              {unreadPMCount}
            </span>
          )}
        </button>

        {/* Sound Alert Mute */}
        <button
          id="header-sound-mute-btn"
          onClick={toggleSoundMute}
          className={`p-2 rounded-lg border transition-colors ${
            soundMuted
              ? 'bg-rose-950/30 border-rose-800/40 text-rose-400'
              : 'bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200'
          }`}
          title={soundMuted ? 'Unmute sound notifications' : 'Mute sound notifications'}
        >
          {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* User Profile Pill */}
        {currentUser && (
          <div
            id="header-profile-pill"
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/80 cursor-pointer transition-colors"
            title="Edit your Nickname, Color & Status"
          >
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full bg-slate-700 object-cover"
                referrerPolicy="no-referrer"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-slate-900 ${getStatusDot(
                  currentUser.status
                )}`}
              />
            </div>
            <div className="flex items-center gap-1.5 max-w-[90px] sm:max-w-[130px] truncate">
              <span
                className="text-xs font-bold truncate"
                style={{ color: currentUser.color || '#3b82f6' }}
              >
                {currentUser.name}
              </span>
              {getRoleBadge(currentUser.role)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
