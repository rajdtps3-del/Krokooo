import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  PhoneCall,
  Lock,
  Sparkles,
  Maximize2,
  Minimize2,
  Camera,
  Heart,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PrivateVideoCallSession } from '../types';
import { useSocket } from '../context/SocketContext';
import { soundEngine } from '../utils/audio';

interface PrivateVideoChatModalProps {
  session: PrivateVideoCallSession;
  onEndCall: () => void;
  onAcceptCall?: () => void;
  onDeclineCall?: () => void;
}

export const PrivateVideoChatModal: React.FC<PrivateVideoChatModalProps> = ({
  session,
  onEndCall,
  onAcceptCall,
  onDeclineCall,
}) => {
  const { currentUser, remoteStreams } = useSocket();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [filterEffect, setFilterEffect] = useState<'none' | 'warm' | 'cyberpunk' | 'studio'>('none');
  const [sentHeart, setSentHeart] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Call duration counter
  useEffect(() => {
    if (session.status !== 'connected') return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session.status]);

  // Acquire or simulate private webcam stream for local caller
  useEffect(() => {
    let active = true;

    async function initLocalMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        // Fallback: Generate canvas animated video stream for sandbox preview
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        let frame = 0;

        const drawLoop = () => {
          if (!active || !ctx) return;
          frame += 0.05;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 640, 480);

          // Subtle background glow
          const grad = ctx.createRadialGradient(320, 240, 30, 320, 240, 300);
          grad.addColorStop(0, '#0d948833');
          grad.addColorStop(1, '#020617');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 640, 480);

          // Avatar / Visualizer
          ctx.fillStyle = currentUser?.color || '#14b8a6';
          ctx.beginPath();
          ctx.arc(320, 210, 65 + Math.sin(frame * 2) * 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((currentUser?.name || 'ME').substring(0, 2).toUpperCase(), 320, 210);

          ctx.fillStyle = '#99f6e4';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(currentUser?.name || 'You (Private Feed)', 320, 305);

          requestAnimationFrame(drawLoop);
        };
        drawLoop();

        const canvasStream = canvas.captureStream(30);
        localStreamRef.current = canvasStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = canvasStream;
        }
      }
    }

    initLocalMedia();

    // Create simulated remote partner stream if no active WebRTC stream
    const partnerCanvas = document.createElement('canvas');
    partnerCanvas.width = 640;
    partnerCanvas.height = 480;
    const pCtx = partnerCanvas.getContext('2d');
    let pFrame = 0;

    const partnerLoop = () => {
      if (!active || !pCtx) return;
      pFrame += 0.04;
      pCtx.fillStyle = '#090d16';
      pCtx.fillRect(0, 0, 640, 480);

      const pGrad = pCtx.createRadialGradient(320, 240, 50, 320, 240, 320);
      pGrad.addColorStop(0, (session.partnerColor || '#a855f7') + '44');
      pGrad.addColorStop(1, '#020617');
      pCtx.fillStyle = pGrad;
      pCtx.fillRect(0, 0, 640, 480);

      // Waves
      pCtx.strokeStyle = session.partnerColor || '#a855f7';
      pCtx.lineWidth = 2.5;
      pCtx.beginPath();
      for (let x = 0; x < 640; x += 12) {
        const y = 240 + Math.sin(pFrame * 3 + x * 0.02) * 18;
        if (x === 0) pCtx.moveTo(x, y);
        else pCtx.lineTo(x, y);
      }
      pCtx.stroke();

      // Remote Avatar
      pCtx.fillStyle = session.partnerColor || '#a855f7';
      pCtx.beginPath();
      pCtx.arc(320, 190, 70 + Math.sin(pFrame * 1.5) * 5, 0, Math.PI * 2);
      pCtx.fill();

      pCtx.fillStyle = '#ffffff';
      pCtx.font = 'bold 36px sans-serif';
      pCtx.textAlign = 'center';
      pCtx.textBaseline = 'middle';
      pCtx.fillText(session.partnerName.substring(0, 2).toUpperCase(), 320, 190);

      pCtx.fillStyle = '#e2e8f0';
      pCtx.font = 'bold 18px sans-serif';
      pCtx.fillText(session.partnerName, 320, 290);

      pCtx.fillStyle = '#a78bfa';
      pCtx.font = '12px sans-serif';
      pCtx.fillText('🔒 Encrypted 1-on-1 Video Stream', 320, 315);

      requestAnimationFrame(partnerLoop);
    };
    partnerLoop();

    const remoteStream = remoteStreams[session.partnerId] || partnerCanvas.captureStream(30);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [session.partnerId, session.partnerName, session.partnerColor, currentUser, remoteStreams]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    }
    setIsVideoOff(!isVideoOff);
  };

  const handleSendHeart = () => {
    setSentHeart(true);
    soundEngine.playSoundEffect('bell');
    setTimeout(() => setSentHeart(false), 2000);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const getFilterStyle = () => {
    switch (filterEffect) {
      case 'warm':
        return 'sepia(30%) saturate(140%) hue-rotate(-10deg)';
      case 'cyberpunk':
        return 'contrast(130%) hue-rotate(180deg) saturate(180%)';
      case 'studio':
        return 'contrast(115%) brightness(110%) saturate(120%)';
      default:
        return 'none';
    }
  };

  return (
    <div
      id="private-video-chat-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className={`bg-slate-900 border border-teal-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all ${
          isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-4xl h-[85vh] max-h-[720px]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={session.partnerAvatar}
                alt={session.partnerName}
                className="w-8 h-8 rounded-full bg-slate-800 object-cover border border-purple-500/40"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100" style={{ color: session.partnerColor }}>
                  {session.partnerName}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-[10px] text-purple-300 font-medium flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> PVT 1-on-1 Cam
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {session.status === 'connected' ? (
                  <span className="text-teal-400">Connected • {formatTime(callDuration)}</span>
                ) : (
                  <span className="text-amber-400 animate-pulse">Connecting video signal...</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onEndCall}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Private</span>
            </button>
          </div>
        </div>

        {/* Video Canvas Stage */}
        <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center">
          {/* Main Remote Partner Video */}
          <div className="w-full h-full relative flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={isSpeakerMuted}
              className="w-full h-full object-cover"
            />

            {/* Remote Info Banner Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/75 border border-purple-500/30 backdrop-blur-xs text-xs text-purple-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold">{session.partnerName}</span>
              <span className="text-[10px] text-slate-400">HD 720p</span>
            </div>

            {/* Floating Heart Animation */}
            {sentHeart && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-bounce">
                <span className="text-7xl">🐊💖</span>
              </div>
            )}
          </div>

          {/* Picture-in-Picture: Local User Feed */}
          <div
            className="absolute bottom-4 right-4 w-44 sm:w-56 aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-teal-500/80 shadow-2xl z-20 group"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
              style={{ filter: getFilterStyle() }}
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400 text-xs">
                <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                <span>Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-teal-300">
              YOU {isMuted ? '• Muted' : ''}
            </div>
          </div>
        </div>

        {/* Bottom Call Control Toolbar */}
        <div className="px-4 py-3 bg-slate-950/95 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          {/* Quick Filter Selection */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Visuals:</span>
            {(['none', 'warm', 'cyberpunk', 'studio'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterEffect(mode)}
                className={`px-2 py-1 rounded-lg text-[10px] uppercase font-bold transition ${
                  filterEffect === mode
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Core Call Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className={`p-2.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs ${
                isMuted
                  ? 'bg-rose-900/80 text-rose-300 border border-rose-600/50 hover:bg-rose-800'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              <span className="hidden sm:inline">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={toggleVideo}
              className={`p-2.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs ${
                isVideoOff
                  ? 'bg-rose-900/80 text-rose-300 border border-rose-600/50 hover:bg-rose-800'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoOff ? <VideoOff className="w-4 h-4 text-rose-400" /> : <Video className="w-4 h-4 text-teal-400" />}
              <span className="hidden sm:inline">{isVideoOff ? 'Cam On' : 'Cam Off'}</span>
            </button>

            <button
              onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
              className={`p-2.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs ${
                isSpeakerMuted ? 'bg-amber-900/80 text-amber-300' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Partner Audio'}
            >
              {isSpeakerMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
            </button>

            <button
              onClick={handleSendHeart}
              className="p-2.5 rounded-xl bg-pink-950/80 hover:bg-pink-900 text-pink-300 border border-pink-700/40 transition flex items-center gap-1.5 text-xs font-bold"
              title="Send Crocodile Love Reaction"
            >
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
              <span className="hidden sm:inline">Krokooo Love</span>
            </button>

            <button
              onClick={onEndCall}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 text-xs shadow-lg shadow-rose-950/50 transition"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Hang Up</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
