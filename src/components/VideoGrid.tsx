import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Camera,
  Pin,
  Crown,
  Shield,
  Radio,
  Sparkles,
  UserPlus,
  Tv,
  Users,
  PhoneCall,
  UserCheck,
  LogOut,
  LayoutGrid,
  Sparkle,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { ClientUser, VideoFilterType, GuestVideoSlot } from '../types';
import { getVideoFilterClass } from '../utils/webrtc';

interface VideoGridProps {
  localStream?: MediaStream | null;
  localFilter?: VideoFilterType;
  localAudioLevel?: number;
  onStartCam?: () => void;
  onSnapshot?: (videoEl: HTMLVideoElement, name: string) => void;
  onStartPrivateCall?: (user: { id: string; name: string; avatar: string; color?: string }) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localStream = null,
  localFilter = 'none',
  localAudioLevel = 0,
  onStartCam,
  onSnapshot = (_videoEl: HTMLVideoElement, _name: string) => {},
  onStartPrivateCall,
}) => {
  const { currentUser, currentRoom, roomUsers, remoteStreams, toggleCam } = useSocket();
  const [pinnedUserId, setPinnedUserId] = useState<string | null>(null);
  const [mutedRemoteAudio, setMutedRemoteAudio] = useState<Record<string, boolean>>({});
  const [stageMode, setStageMode] = useState<'grid' | '3guest'>('grid');

  // 3-Guest Video Stage Slots State
  const [guestSlots, setGuestSlots] = useState<GuestVideoSlot[]>([
    { slotNumber: 1, isOccupied: false },
    { slotNumber: 2, isOccupied: false },
    { slotNumber: 3, isOccupied: false },
  ]);

  const handleStartCam = onStartCam || (() => {
    toggleCam(true, true);
  });

  const [simulatedPeers, setSimulatedPeers] = useState<
    Array<{
      id: string;
      name: string;
      color: string;
      role: 'operator' | 'member';
      avatar: string;
      audioLevel: number;
      stream: MediaStream;
    }>
  >([]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Bind local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Find all active broadcasters in the room
  const broadcasters = roomUsers.filter((u) => u.hasCam);

  // Take or vacate a 3-guest slot
  const handleTakeGuestSlot = (slotNum: 1 | 2 | 3) => {
    if (!currentUser) return;
    
    // Check if user already occupies a slot
    const alreadyOccupies = guestSlots.some((s) => s.userId === currentUser.id);

    setGuestSlots((prev) =>
      prev.map((slot) => {
        if (slot.slotNumber === slotNum) {
          if (slot.isOccupied && slot.userId === currentUser.id) {
            // Vacate
            return { slotNumber: slotNum, isOccupied: false };
          }
          // Take slot
          return {
            slotNumber: slotNum,
            isOccupied: true,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            userColor: currentUser.color || '#3b82f6',
            hasCam: currentUser.hasCam,
            isMuted: !currentUser.hasMic,
          };
        } else if (alreadyOccupies && slot.userId === currentUser.id) {
          // Clear previous slot if moving
          return { ...slot, isOccupied: false, userId: undefined, userName: undefined };
        }
        return slot;
      })
    );
  };

  // Helper to fill guest slot with simulated guest for demo
  const handleSimulateGuestSlot = (slotNum: 1 | 2 | 3) => {
    const names = ['KrokooVIP', 'GuestStar', 'ElenaStream', 'MaxVibe', 'SwampKing'];
    const randomName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 90 + 10);
    const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'];
    const accent = colors[Math.floor(Math.random() * colors.length)];

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    let t = 0;

    const drawLoop = () => {
      if (!ctx) return;
      t += 0.04;
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, 640, 480);

      const grad = ctx.createRadialGradient(320, 240, 30, 320, 240, 320);
      grad.addColorStop(0, accent + '55');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Waves
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x < 640; x += 12) {
        const y = 240 + Math.sin(t * 3 + x * 0.02) * 16;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Guest Avatar
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(320, 190, 65 + Math.sin(t * 2) * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(randomName.substring(0, 2).toUpperCase(), 320, 190);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(randomName, 320, 290);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px sans-serif';
      ctx.fillText(`🐊 GUEST PODIUM #${slotNum}`, 320, 315);

      requestAnimationFrame(drawLoop);
    };
    drawLoop();

    const stream = canvas.captureStream(30);

    setGuestSlots((prev) =>
      prev.map((slot) => {
        if (slot.slotNumber === slotNum) {
          return {
            slotNumber: slotNum,
            isOccupied: true,
            userId: `sim-guest-${slotNum}-${Date.now()}`,
            userName: randomName,
            userAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${randomName}`,
            userColor: accent,
            hasCam: true,
            isMuted: false,
            stream,
          };
        }
        return slot;
      })
    );
  };

  const handleVacateGuestSlot = (slotNum: 1 | 2 | 3) => {
    setGuestSlots((prev) =>
      prev.map((slot) => (slot.slotNumber === slotNum ? { slotNumber: slotNum, isOccupied: false } : slot))
    );
  };

  // Helper to add a test peer broadcaster for instant rich multi-cam demo if desired
  const addTestBroadcaster = () => {
    if (!currentRoom) return;
    const names = ['AcousticSam', 'LunaStargazer', 'NeonVibes', 'CodeNinja', 'ElenaSinging', 'RetroGamer'];
    const randomName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100);
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    let t = 0;
    const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
    const accent = colors[Math.floor(Math.random() * colors.length)];

    const draw = () => {
      if (!ctx) return;
      t += 0.04;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 480);

      // Gradient background glow
      const grad = ctx.createRadialGradient(320, 240, 40, 320, 240, 300);
      grad.addColorStop(0, accent + '44');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Waves
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x < 640; x += 10) {
        const y = 240 + Math.sin(t * 3 + x * 0.02) * (20 + Math.sin(t) * 15);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Avatar
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(320, 180, 60 + Math.sin(t * 2) * 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(randomName.substring(0, 2).toUpperCase(), 320, 180);

      // Live tag
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(250, 270, 140, 28, 14);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('🔴 LIVE PEER', 320, 288);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px sans-serif';
      ctx.fillText(randomName, 320, 325);

      requestAnimationFrame(draw);
    };
    draw();

    const stream = canvas.captureStream(30);
    const newPeer = {
      id: `sim-${Date.now()}`,
      name: randomName,
      color: accent,
      role: 'member' as const,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${randomName}`,
      audioLevel: 45,
      stream,
    };
    setSimulatedPeers((prev) => [...prev, newPeer]);
  };

  const removeTestBroadcaster = (id: string) => {
    setSimulatedPeers((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleRemoteAudio = (userId: string) => {
    setMutedRemoteAudio((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleFullscreen = (elId: string) => {
    const el = document.getElementById(elId);
    if (el) {
      if (!document.fullscreenElement) {
        el.requestFullscreen().catch((err) => console.warn(err));
      } else {
        document.exitFullscreen().catch((err) => console.warn(err));
      }
    }
  };

  const totalBroadcastersCount =
    (currentUser?.hasCam ? 1 : 0) +
    broadcasters.filter((u) => u.id !== currentUser?.id).length +
    simulatedPeers.length;

  const camLimit = currentRoom?.camLimit || 8;

  // Determine grid columns
  const getGridColsClass = () => {
    if (pinnedUserId) return 'grid-cols-1 md:grid-cols-3';
    if (totalBroadcastersCount <= 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (totalBroadcastersCount === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (totalBroadcastersCount <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
    if (totalBroadcastersCount <= 6) return 'grid-cols-2 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-2 sm:p-3 overflow-y-auto min-h-0">
      {/* Video Wall Header & Multi-Mode Selector */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800/80 px-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Tv className="w-4 h-4 text-emerald-400" />
            <span>LIVE VIDEO STAGE</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium border border-slate-700/60">
            {stageMode === 'grid' ? `${totalBroadcastersCount} / ${camLimit} Cams Active` : '3-Guest Stage'}
          </span>
          {pinnedUserId && (
            <button
              onClick={() => setPinnedUserId(null)}
              className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
            >
              <Pin className="w-3 h-3 rotate-45" /> Exit Spotlight
            </button>
          )}
        </div>

        {/* Mode switcher & Test controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setStageMode('grid')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                stageMode === 'grid'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Standard Multi-Cam Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Multi-Cam Grid</span>
            </button>
            <button
              onClick={() => setStageMode('3guest')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                stageMode === '3guest'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="3-Guest Video Discussion Stage"
            >
              <Users className="w-3.5 h-3.5" />
              <span>3-Guest Stage</span>
            </button>
          </div>

          <button
            id="video-add-sim-peer-btn"
            onClick={addTestBroadcaster}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/70 transition-colors flex items-center gap-1"
            title="Add a sample broadcaster to test multi-cam room layout"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Add Cam</span>
          </button>
        </div>
      </div>

      {/* STAGE VIEW 1: 3-Guest Video Chat Stage */}
      {stageMode === '3guest' ? (
        <div className="flex-1 flex flex-col gap-3 min-h-0 animate-in fade-in">
          {/* Main Host / Spotlight Broadcast Banner */}
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/50 text-purple-300 font-bold flex items-center gap-1">
                <Users className="w-3 h-3 text-purple-400" /> 3-GUEST VIDEO PODIUM
              </span>
              <span className="text-slate-400 hidden sm:inline">
                Host + 3 Interactive Guest Video Slots for Discussions & Debates
              </span>
            </div>
            <div className="text-[11px] text-teal-400 font-mono">
              Slots Filled: {guestSlots.filter((s) => s.isOccupied).length} / 3
            </div>
          </div>

          {/* 3 Guest Slots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
            {guestSlots.map((slot) => {
              const isOccupiedByMe = slot.isOccupied && slot.userId === currentUser?.id;

              return (
                <div
                  key={slot.slotNumber}
                  className={`relative rounded-2xl overflow-hidden bg-slate-900 border-2 transition-all flex flex-col min-h-[220px] aspect-video ${
                    slot.isOccupied
                      ? 'border-purple-500/60 shadow-lg shadow-purple-950/30'
                      : 'border-dashed border-slate-800 hover:border-purple-500/40 bg-slate-900/40'
                  }`}
                >
                  {slot.isOccupied ? (
                    /* Occupied Guest Cam Slot */
                    <div className="relative w-full h-full bg-slate-950 flex flex-col justify-between overflow-hidden">
                      {/* Video element if simulated or local stream */}
                      {isOccupiedByMe && localStream ? (
                        <video
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform -scale-x-100 absolute inset-0"
                          ref={(el) => {
                            if (el && localStream) el.srcObject = localStream;
                          }}
                        />
                      ) : slot.stream ? (
                        <video
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover absolute inset-0"
                          ref={(el) => {
                            if (el && slot.stream) el.srcObject = slot.stream;
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <img
                            src={slot.userAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest'}
                            alt={slot.userName}
                            className="w-16 h-16 rounded-full bg-slate-800 mb-2 border border-purple-500/40"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-xs font-bold" style={{ color: slot.userColor }}>
                            {slot.userName}
                          </span>
                        </div>
                      )}

                      {/* Guest Slot Badge */}
                      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-900/90 text-white text-[10px] font-bold tracking-wider backdrop-blur-xs shadow">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                        GUEST #{slot.slotNumber}
                      </div>

                      {/* Vacate / PM Buttons */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
                        {!isOccupiedByMe && onStartPrivateCall && slot.userId && (
                          <button
                            onClick={() =>
                              onStartPrivateCall({
                                id: slot.userId!,
                                name: slot.userName || 'Guest',
                                avatar: slot.userAvatar || '',
                                color: slot.userColor,
                              })
                            }
                            className="p-1.5 rounded-lg bg-teal-900/80 hover:bg-teal-800 text-teal-200 text-[10px] font-bold flex items-center gap-1 shadow"
                            title="Start Private Video Call with this guest"
                          >
                            <PhoneCall className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleVacateGuestSlot(slot.slotNumber)}
                          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-900 text-slate-300 hover:text-rose-200 text-[10px] transition"
                          title="Vacate this slot"
                        >
                          <LogOut className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Bottom Info Bar */}
                      <div className="absolute bottom-0 inset-x-0 z-10 px-3 py-1.5 bg-slate-950/90 border-t border-purple-500/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold truncate" style={{ color: slot.userColor }}>
                            {slot.userName} {isOccupiedByMe ? '(You)' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Empty Guest Cam Slot */
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-200">
                        Guest Slot #{slot.slotNumber} Available
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                        Take this camera seat to join the live panel discussion
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTakeGuestSlot(slot.slotNumber)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Take Cam Seat</span>
                        </button>
                        <button
                          onClick={() => handleSimulateGuestSlot(slot.slotNumber)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
                          title="Simulate a guest joining for demo"
                        >
                          + Demo Guest
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* STAGE VIEW 2: Standard Multi-Cam Wall Grid */
        <div className={`grid gap-3 flex-1 ${getGridColsClass()}`}>
          {/* Local Broadcaster Feed */}
          {currentUser?.hasCam && (
            <div
              id="local-broadcaster-card"
              className={`relative rounded-xl overflow-hidden bg-slate-900 border-2 ${
                pinnedUserId === currentUser.id
                  ? 'border-teal-500 md:col-span-2 md:row-span-2 shadow-lg shadow-teal-950/40'
                  : 'border-emerald-500/80 shadow-md shadow-emerald-950/20'
              } flex flex-col group min-h-[200px] aspect-video transition-all`}
            >
              {/* Video Canvas */}
              <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                  style={{ filter: getVideoFilterClass(localFilter) }}
                />

                {/* Local Broadcaster Live Tag */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-bold tracking-wider backdrop-blur-xs shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  YOU (LIVE)
                </div>

                {/* Filter badge if active */}
                {localFilter !== 'none' && (
                  <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] text-cyan-300 uppercase font-semibold border border-cyan-500/30">
                    {localFilter}
                  </div>
                )}

                {/* Audio Level Meter Overlay */}
                <div className="absolute bottom-10 left-3 right-3 flex items-center gap-1">
                  <div className="flex-1 h-1 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                      style={{ width: `${Math.min(100, localAudioLevel * 2)}%` }}
                    />
                  </div>
                </div>

                {/* Card Controls overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 pointer-events-none">
                  <div className="flex justify-end gap-1.5 pointer-events-auto">
                    <button
                      onClick={() =>
                        localVideoRef.current && onSnapshot(localVideoRef.current, currentUser.name)
                      }
                      className="p-1.5 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition"
                      title="Take Snapshot"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setPinnedUserId(pinnedUserId === currentUser.id ? null : currentUser.id)
                      }
                      className="p-1.5 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition"
                      title="Spotlight Cam"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFullscreen('local-broadcaster-card')}
                      className="p-1.5 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition"
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Bar Info */}
              <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="font-bold truncate"
                    style={{ color: currentUser.color || '#3b82f6' }}
                  >
                    {currentUser.name}
                  </span>
                  {currentUser.role === 'host' && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                  {currentUser.role === 'operator' && (
                    <Shield className="w-3 h-3 text-blue-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  {currentUser.hasMic ? (
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Remote Broadcasters */}
          {broadcasters
            .filter((u) => u.id !== currentUser?.id)
            .map((user) => {
              const stream = remoteStreams[user.id];
              const isMuted = mutedRemoteAudio[user.id];

              return (
                <RemoteVideoCard
                  key={user.id}
                  user={user}
                  stream={stream}
                  isPinned={pinnedUserId === user.id}
                  isMuted={isMuted}
                  onToggleMute={() => toggleRemoteAudio(user.id)}
                  onTogglePin={() => setPinnedUserId(pinnedUserId === user.id ? null : user.id)}
                  onSnapshot={(videoEl) => onSnapshot(videoEl, user.name)}
                  onFullscreen={(id) => handleFullscreen(id)}
                  onStartPrivateCall={onStartPrivateCall}
                />
              );
            })}

          {/* Simulated Peer Broadcasters (for testing room layouts) */}
          {simulatedPeers.map((peer) => (
            <SimulatedPeerCard
              key={peer.id}
              peer={peer}
              isPinned={pinnedUserId === peer.id}
              onTogglePin={() => setPinnedUserId(pinnedUserId === peer.id ? null : peer.id)}
              onRemove={() => removeTestBroadcaster(peer.id)}
              onSnapshot={(videoEl) => onSnapshot(videoEl, peer.name)}
              onFullscreen={(id) => handleFullscreen(id)}
              onStartPrivateCall={onStartPrivateCall}
            />
          ))}

          {/* Empty Cam Slots / Call to Action */}
          {!currentUser?.hasCam && (
            <div
              id="empty-cam-slot-card"
              onClick={handleStartCam}
              className="rounded-xl border-2 border-dashed border-slate-800 hover:border-emerald-500/60 bg-slate-900/40 hover:bg-slate-900/80 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group aspect-video min-h-[190px]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center mb-2.5 transition-colors">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                Start Your Broadcast
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                Turn on your webcam to broadcast live to everyone in the room
              </p>
            </div>
          )}

          {/* Placeholder slot if room is empty */}
          {totalBroadcastersCount === 0 && (
            <div className="col-span-full rounded-xl border border-slate-800/80 bg-slate-900/30 p-8 flex flex-col items-center justify-center text-center my-auto">
              <Radio className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-300">No Broadcasters Live Currently</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Be the first to turn on your webcam, or switch to 3-Guest mode for panel discussions!
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleStartCam}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Video className="w-4 h-4" /> Turn on Cam
                </button>
                <button
                  onClick={addTestBroadcaster}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4 text-teal-400" /> Spawn Test Cam
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Sub-component for Remote Peer Video
const RemoteVideoCard: React.FC<{
  user: ClientUser;
  stream?: MediaStream;
  isPinned: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onTogglePin: () => void;
  onSnapshot: (videoEl: HTMLVideoElement) => void;
  onFullscreen: (id: string) => void;
  onStartPrivateCall?: (user: { id: string; name: string; avatar: string; color?: string }) => void;
}> = ({
  user,
  stream,
  isPinned,
  isMuted,
  onToggleMute,
  onTogglePin,
  onSnapshot,
  onFullscreen,
  onStartPrivateCall,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardId = `remote-card-${user.id}`;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      id={cardId}
      className={`relative rounded-xl overflow-hidden bg-slate-900 border ${
        isPinned
          ? 'border-teal-500 md:col-span-2 md:row-span-2 shadow-lg shadow-teal-950/40'
          : 'border-slate-800 shadow'
      } flex flex-col group min-h-[200px] aspect-video transition-all`}
    >
      <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full bg-slate-800 mb-2 border border-slate-700"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs font-semibold text-slate-300">Connecting stream...</span>
          </div>
        )}

        {/* Live Broadcaster tag */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-bold tracking-wider backdrop-blur-xs shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          LIVE
        </div>

        {/* Hover Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 pointer-events-none">
          <div className="flex justify-end gap-1.5 pointer-events-auto">
            {onStartPrivateCall && (
              <button
                onClick={() =>
                  onStartPrivateCall({
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    color: user.color,
                  })
                }
                className="p-1.5 rounded-lg bg-teal-900/80 text-teal-200 hover:bg-teal-800 transition"
                title="Start Private 1-on-1 Video Chat"
              >
                <PhoneCall className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => videoRef.current && onSnapshot(videoRef.current)}
              className="p-1.5 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition"
              title="Snapshot Frame"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onTogglePin}
              className="p-1.5 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition"
              title="Spotlight Cam"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onFullscreen(cardId)}
              className="p-1.5 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-bold truncate" style={{ color: user.color || '#3b82f6' }}>
            {user.name}
          </span>
          {user.role === 'host' && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
          {user.role === 'operator' && <Shield className="w-3 h-3 text-blue-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          {user.hasMic ? (
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <MicOff className="w-3.5 h-3.5 text-rose-400" />
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for Simulated / Test Peer Card
const SimulatedPeerCard: React.FC<{
  peer: {
    id: string;
    name: string;
    color: string;
    role: 'operator' | 'member';
    avatar: string;
    audioLevel: number;
    stream: MediaStream;
  };
  isPinned: boolean;
  onTogglePin: () => void;
  onRemove: () => void;
  onSnapshot: (videoEl: HTMLVideoElement) => void;
  onFullscreen: (id: string) => void;
  onStartPrivateCall?: (user: { id: string; name: string; avatar: string; color?: string }) => void;
}> = ({
  peer,
  isPinned,
  onTogglePin,
  onRemove,
  onSnapshot,
  onFullscreen,
  onStartPrivateCall,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardId = `sim-card-${peer.id}`;

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div
      id={cardId}
      className={`relative rounded-xl overflow-hidden bg-slate-900 border ${
        isPinned
          ? 'border-teal-500 md:col-span-2 md:row-span-2 shadow-lg shadow-teal-950/40'
          : 'border-slate-800 shadow'
      } flex flex-col group min-h-[200px] aspect-video transition-all`}
    >
      <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-bold tracking-wider backdrop-blur-xs shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          LIVE TEST CAM
        </div>

        {/* Hover Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 pointer-events-none">
          <div className="flex justify-end gap-1.5 pointer-events-auto">
            {onStartPrivateCall && (
              <button
                onClick={() =>
                  onStartPrivateCall({
                    id: peer.id,
                    name: peer.name,
                    avatar: peer.avatar,
                    color: peer.color,
                  })
                }
                className="p-1.5 rounded-lg bg-teal-900/80 text-teal-200 hover:bg-teal-800 transition"
                title="Start Private 1-on-1 Video Chat"
              >
                <PhoneCall className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => videoRef.current && onSnapshot(videoRef.current)}
              className="p-1.5 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition"
              title="Snapshot Frame"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onTogglePin}
              className="p-1.5 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition"
              title="Spotlight Cam"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onFullscreen(cardId)}
              className="p-1.5 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg bg-rose-950/80 text-rose-300 hover:bg-rose-900 transition"
              title="Remove Test Broadcaster"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-bold truncate" style={{ color: peer.color }}>
            {peer.name}
          </span>
          <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">Test Peer</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};
