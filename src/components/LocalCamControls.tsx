import React, { useState, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Hand,
  Sliders,
  Sparkles,
  Camera,
  Check,
  ChevronUp,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { VideoFilterType } from '../types';

interface LocalCamControlsProps {
  isCamActive?: boolean;
  isMicActive?: boolean;
  isScreenSharing?: boolean;
  activeFilter?: VideoFilterType;
  audioLevel?: number;
  onToggleCam?: () => void;
  onToggleMic?: () => void;
  onToggleScreenShare?: () => void;
  onFilterChange?: (filter: VideoFilterType) => void;
  videoDevices?: MediaDeviceInfo[];
  audioDevices?: MediaDeviceInfo[];
  selectedVideoDevice?: string;
  selectedAudioDevice?: string;
  onSelectVideoDevice?: (deviceId: string) => void;
  onSelectAudioDevice?: (deviceId: string) => void;
}

const FILTERS: { id: VideoFilterType; label: string; previewColor: string }[] = [
  { id: 'none', label: 'Normal', previewColor: '#64748b' },
  { id: 'warm', label: 'Warm Glow', previewColor: '#f59e0b' },
  { id: 'cool', label: 'Cool Studio', previewColor: '#06b6d4' },
  { id: 'studio', label: 'Studio High-Contrast', previewColor: '#8b5cf6' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', previewColor: '#ec4899' },
  { id: 'vintage', label: 'Vintage Sepia', previewColor: '#d97706' },
  { id: 'bw', label: 'Classic B&W', previewColor: '#94a3b8' },
  { id: 'blur', label: 'Soft Blur', previewColor: '#3b82f6' },
];

export const LocalCamControls: React.FC<LocalCamControlsProps> = ({
  isCamActive: propCamActive,
  isMicActive: propMicActive,
  isScreenSharing = false,
  activeFilter = 'none',
  audioLevel = 0,
  onToggleCam,
  onToggleMic,
  onToggleScreenShare = () => {},
  onFilterChange = (_filter: VideoFilterType) => {},
  videoDevices = [],
  audioDevices = [],
  selectedVideoDevice,
  selectedAudioDevice,
  onSelectVideoDevice = (_deviceId: string) => {},
  onSelectAudioDevice = (_deviceId: string) => {},
}) => {
  const { currentUser, toggleCam, toggleMic, raiseHand } = useSocket();
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  const isCamActive = propCamActive ?? (currentUser?.hasCam || false);
  const isMicActive = propMicActive ?? (currentUser?.hasMic || false);

  const handleToggleCam = onToggleCam || (() => {
    toggleCam(!isCamActive, isMicActive);
  });

  const handleToggleMic = onToggleMic || (() => {
    toggleMic(!isMicActive);
  });

  return (
    <div
      id="local-cam-toolbar"
      className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between gap-3 select-none z-20"
    >
      {/* Broadcaster Quick Status */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isCamActive ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'
            }`}
          />
          <span className="text-xs font-bold text-slate-300 hidden sm:inline">
            {isCamActive ? 'Broadcast Live' : 'Camera Off'}
          </span>
        </div>

        {/* Mic Level Indicator Bar */}
        {isMicActive && isCamActive && (
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <Mic className="w-3 h-3 text-emerald-400 shrink-0" />
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75"
                style={{ width: `${Math.min(100, audioLevel * 2)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Broadcast Control Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Toggle Cam */}
        <button
          id="dock-toggle-cam-btn"
          onClick={handleToggleCam}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
            isCamActive
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
          }`}
          title={isCamActive ? 'Stop Broadcasting Cam' : 'Start Broadcasting Webcam'}
        >
          {isCamActive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          <span className="hidden sm:inline">{isCamActive ? 'Stop Cam' : 'Start Cam'}</span>
        </button>

        {/* Toggle Mic */}
        <button
          id="dock-toggle-mic-btn"
          onClick={handleToggleMic}
          disabled={!isCamActive}
          className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
            !isCamActive
              ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
              : isMicActive
              ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
              : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40'
          }`}
          title={isMicActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          <span className="hidden md:inline">{isMicActive ? 'Mute' : 'Unmute'}</span>
        </button>

        {/* Screen Share */}
        <button
          id="dock-screen-share-btn"
          onClick={onToggleScreenShare}
          className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
            isScreenSharing
              ? 'bg-teal-600 text-white shadow'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <Monitor className="w-4 h-4" />
          <span className="hidden md:inline">
            {isScreenSharing ? 'Stop Share' : 'Screen Share'}
          </span>
        </button>

        {/* Video Filters Menu Dropdown */}
        <div className="relative">
          <button
            id="dock-filters-btn"
            onClick={() => {
              setShowFiltersMenu(!showFiltersMenu);
              setShowDeviceMenu(false);
            }}
            disabled={!isCamActive}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              !isCamActive
                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                : activeFilter !== 'none'
                ? 'bg-purple-900/50 border border-purple-600 text-purple-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Video Filters & Effects"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">Filters</span>
          </button>

          {showFiltersMenu && (
            <div
              id="dock-filters-menu"
              className="absolute bottom-12 right-0 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Video Filters
              </div>
              <div className="space-y-1 mt-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onFilterChange(f.id);
                      setShowFiltersMenu(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                      activeFilter === f.id
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: f.previewColor }}
                      />
                      <span>{f.label}</span>
                    </div>
                    {activeFilter === f.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hardware Device Settings Dropdown */}
        <div className="relative">
          <button
            id="dock-devices-btn"
            onClick={() => {
              setShowDeviceMenu(!showDeviceMenu);
              setShowFiltersMenu(false);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Camera & Audio Settings"
          >
            <Sliders className="w-4 h-4 text-slate-400" />
          </button>

          {showDeviceMenu && (
            <div
              id="dock-devices-menu"
              className="absolute bottom-12 right-0 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2 text-xs"
            >
              <div className="font-bold text-slate-300 pb-2 border-b border-slate-800">
                Media Devices
              </div>

              {/* Cameras */}
              <div className="mt-2">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Camera</label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => onSelectVideoDevice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 outline-hidden"
                >
                  {videoDevices.length === 0 && <option value="">Default Camera</option>}
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.substring(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Microphones */}
              <div className="mt-3">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Microphone
                </label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => onSelectAudioDevice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 outline-hidden"
                >
                  {audioDevices.length === 0 && <option value="">Default Microphone</option>}
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.substring(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Raise Hand Button */}
        <button
          id="dock-raise-hand-btn"
          onClick={raiseHand}
          className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            currentUser?.handRaised
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40 animate-bounce'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title="Raise Hand to speak / request broadcast"
        >
          <Hand className="w-4 h-4" />
          <span className="hidden sm:inline">
            {currentUser?.handRaised ? 'Hand Raised' : 'Raise Hand'}
          </span>
        </button>
      </div>
    </div>
  );
};
