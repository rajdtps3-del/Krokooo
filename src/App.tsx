import React, { useState } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Header } from './components/Header';
import { VideoGrid } from './components/VideoGrid';
import { LocalCamControls } from './components/LocalCamControls';
import { ChatPanel } from './components/ChatPanel';
import { UserListPanel } from './components/UserListPanel';
import { RoomDirectoryModal } from './components/RoomDirectoryModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { UserProfileModal, PRESET_COLORS } from './components/UserProfileModal';
import { GiftSelectorModal } from './components/GiftSelectorModal';
import { PrivateMessagesModal } from './components/PrivateMessagesModal';
import { SoundboardModal } from './components/SoundboardModal';
import { PollsModal } from './components/PollsModal';
import { KrokoooLogo } from './components/KrokoooLogo';
import { ClientUser, PrivateConversation } from './types';
import {
  Sparkles,
  Compass,
  Palette,
  Video,
  Radio,
  PlusCircle,
  Users,
  Shield,
  Heart,
  Volume2,
} from 'lucide-react';

const CamfrogApp: React.FC = () => {
  const {
    currentRoom,
    currentUser,
    isLocalCamBroadcasting,
    activeGiftEffect,
    pmConversations,
    updateUserProfile,
  } = useSocket();

  // Modal visibility states
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGiftsOpen, setIsGiftsOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isPollsOpen, setIsPollsOpen] = useState(false);
  const [isPMsOpen, setIsPMsOpen] = useState(false);
  const [giftTargetUser, setGiftTargetUser] = useState<ClientUser | null>(null);

  // Multi-colour room accent theme state
  const [themeColor, setThemeColor] = useState<string>('#0891b2'); // Cyber Cyan default
  const [showQuickColorBar, setShowQuickColorBar] = useState(false);

  // Calculate unread PMs
  const unreadPMCount = (Object.values(pmConversations) as PrivateConversation[]).reduce(
    (acc, conv) => acc + (conv.unreadCount || 0),
    0
  );

  const handleSelectUserForPM = (userId: string) => {
    setIsPMsOpen(true);
  };

  const handleOpenGiftsForUser = (user: ClientUser) => {
    setGiftTargetUser(user);
    setIsGiftsOpen(true);
  };

  return (
    <div
      className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none"
      style={{
        // CSS variable for theme accents
        ['--theme-accent' as any]: themeColor,
      }}
    >
      {/* Header Bar */}
      <Header
        onOpenDirectory={() => setIsDirectoryOpen(true)}
        onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenGifts={() => {
          setGiftTargetUser(null);
          setIsGiftsOpen(true);
        }}
        onOpenSoundboard={() => setIsSoundboardOpen(true)}
        onOpenPolls={() => setIsPollsOpen(true)}
        onOpenPMs={() => setIsPMsOpen(true)}
        isCamActive={isLocalCamBroadcasting}
        onToggleCam={() => {}}
        unreadPMCount={unreadPMCount}
      />

      {/* Quick Multi-Colour Bar Notification / Customizer */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickColorBar(!showQuickColorBar)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Toggle Quick Multi-Colour Selector"
          >
            <Palette className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <span className="font-semibold text-[11px]">Multi-Colour Switcher</span>
          </button>

          {showQuickColorBar && (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Accent:</span>
              {PRESET_COLORS.slice(0, 10).map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setThemeColor(color.hex);
                    updateUserProfile({ color: color.hex });
                  }}
                  className="w-4 h-4 rounded-full border border-slate-600 hover:scale-125 transition-transform"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name} - Set as Accent & Nickname Color`}
                />
              ))}

              <button
                onClick={() => {
                  updateUserProfile({ color: 'rainbow' });
                }}
                className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-amber-400 via-green-400 via-blue-500 to-purple-500 hover:scale-125 transition-transform"
                title="Cyber Rainbow - Multi-Colour Gradient"
              />
            </div>
          )}
        </div>

        {currentRoom && (
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>Room: <strong className="text-slate-200">{currentRoom.name}</strong></span>
            </span>
            <span>•</span>
            <span>{currentRoom.camCount} Cams Live</span>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative overflow-hidden">
        {/* Left / Center: Video Stage */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
          {currentRoom ? (
            <>
              {/* Live Multi-Cam Grid */}
              <div className="flex-1 p-2 sm:p-3 overflow-y-auto min-h-0">
                <VideoGrid />
              </div>

              {/* Broadcast Controls Bar */}
              <LocalCamControls />
            </>
          ) : (
            /* Lobby / Welcome Screen */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-4">
                <KrokoooLogo size="xl" />
              </div>
              <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                Connect with people around the world, broadcast your webcam, join multi-user audio
                discussions, and interact with Crocodile Stickers 🐊, virtual gifts, and multi-colour chat.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  id="welcome-browse-rooms-btn"
                  onClick={() => setIsDirectoryOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-950/40 transition"
                >
                  <Compass className="w-4 h-4" />
                  <span>Browse Active Rooms</span>
                </button>
                <button
                  id="welcome-host-room-btn"
                  onClick={() => setIsCreateRoomOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition"
                >
                  <PlusCircle className="w-4 h-4 text-teal-400" />
                  <span>Host Your Own Room</span>
                </button>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition"
                >
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>Multi-Colour Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Chat & User List (when inside a room) */}
        {currentRoom && (
          <div className="flex h-1/2 md:h-full md:w-[620px] lg:w-[680px] shrink-0 border-t md:border-t-0 md:border-l border-slate-800">
            {/* User List Panel */}
            <UserListPanel
              onSelectUserForPM={handleSelectUserForPM}
              onOpenGiftsForUser={handleOpenGiftsForUser}
            />

            {/* Chat Panel */}
            <ChatPanel
              onOpenGifts={() => {
                setGiftTargetUser(null);
                setIsGiftsOpen(true);
              }}
              onSelectUserForPM={handleSelectUserForPM}
            />
          </div>
        )}
      </div>

      {/* Floating Gift Celebration Overlay */}
      {activeGiftEffect && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-900/90 border-2 border-pink-500 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center animate-bounce">
            <span className="text-6xl mb-2">{activeGiftEffect.gift.icon}</span>
            <div className="text-lg font-black text-pink-300">
              {activeGiftEffect.gift.name} Sent!
            </div>
            <p className="text-xs text-slate-200 mt-1">
              <strong className="text-pink-400">{activeGiftEffect.senderName}</strong> rewarded{' '}
              {activeGiftEffect.recipientName ? (
                <strong className="text-cyan-400">@{activeGiftEffect.recipientName}</strong>
              ) : (
                'the entire room!'
              )}
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <RoomDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
      />

      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentThemeColor={themeColor}
        onChangeThemeColor={(col) => setThemeColor(col)}
      />

      <GiftSelectorModal
        isOpen={isGiftsOpen}
        onClose={() => setIsGiftsOpen(false)}
        targetUser={giftTargetUser}
      />

      <PrivateMessagesModal
        isOpen={isPMsOpen}
        onClose={() => setIsPMsOpen(false)}
      />

      <SoundboardModal
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
      />

      <PollsModal
        isOpen={isPollsOpen}
        onClose={() => setIsPollsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <SocketProvider>
      <CamfrogApp />
    </SocketProvider>
  );
}
