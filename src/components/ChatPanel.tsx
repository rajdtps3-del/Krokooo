import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  Gift,
  Crown,
  Shield,
  Trash2,
  Bold,
  Italic,
  Palette,
  Sparkles,
  Lock,
  MessageCircle,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { CrocodileStickerPicker } from './CrocodileStickerPicker';
import { renderMessageWithStickers } from './CrocodileStickerBadge';
import { CrocodileSticker } from '../data/stickers';

interface ChatPanelProps {
  onOpenGifts: () => void;
  onSelectUserForPM: (userId: string) => void;
}

const EMOJIS = [
  '😀', '😂', '😎', '😍', '🥳', '🔥', '👏', '🎉', '🐊', '❤️',
  '💎', '👑', '🚀', '🌟', '🎵', '✨', '☕', '🌹', '💯', '👋'
];

const TEXT_COLORS = [
  '#f3f4f6', // Light gray default
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#a855f7', // Purple
];

export const ChatPanel: React.FC<ChatPanelProps> = ({ onOpenGifts, onSelectUserForPM }) => {
  const { currentUser, currentRoom, messages, sendMessage, clearChat, playSoundEffect } = useSocket();

  const [inputVal, setInputVal] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#f3f4f6');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    sendMessage(inputVal, {
      textColor: selectedColor,
      isBold,
      isItalic,
    });
    setInputVal('');
    setShowEmojiPicker(false);
    setShowStickerPicker(false);
  };

  const handleAddEmoji = (emoji: string) => {
    setInputVal((prev) => prev + emoji);
  };

  const handleSelectSticker = (sticker: CrocodileSticker) => {
    if (sticker.soundEffect) {
      playSoundEffect(sticker.soundEffect, sticker.name);
    }
    sendMessage(sticker.code, {
      textColor: selectedColor,
      isBold: false,
      isItalic: false,
    });
    setShowStickerPicker(false);
  };

  const isOperator =
    currentUser?.role === 'host' ||
    currentUser?.role === 'operator' ||
    currentRoom?.ownerId === currentUser?.id;

  return (
    <div
      id="krokooo-chat-panel"
      className="w-full md:w-80 lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0 select-none z-10 relative"
    >
      {/* Chat Title & Op Controls */}
      <div className="px-3 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wide">KROKOOO CHAT</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
            {messages.length}
          </span>
        </div>

        {isOperator && (
          <button
            id="chat-clear-btn"
            onClick={clearChat}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition text-[11px] flex items-center gap-1"
            title="Clear Room Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[10px]">Clear</span>
          </button>
        )}
      </div>

      {/* Message Feed Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 select-text font-sans text-xs">
        {messages.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-xs">
            No messages yet. Send a Crocodile sticker to say hello! 🐊👋
          </div>
        )}

        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className="py-1 px-2.5 rounded bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>{msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'gift') {
            return (
              <div
                key={msg.id}
                className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-pink-950/60 via-purple-950/60 to-slate-900 border border-pink-500/40 text-xs text-pink-200 shadow-md shadow-pink-950/20"
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                  <span style={{ color: msg.senderColor }}>{msg.senderName}</span>
                  <span className="text-slate-300 font-normal">{msg.text}</span>
                </div>
              </div>
            );
          }

          if (msg.type === 'whisper') {
            return (
              <div
                key={msg.id}
                className="py-1.5 px-2.5 rounded bg-purple-950/40 border border-purple-800/50 text-xs text-purple-200"
              >
                <div className="flex items-center gap-1.5 font-semibold text-[11px] text-purple-300 mb-0.5">
                  <Lock className="w-3 h-3 text-purple-400" />
                  <span>Whisper from {msg.senderName}:</span>
                </div>
                <div>
                  {renderMessageWithStickers(msg.text, '#e9d5ff', false, false, {
                    name: msg.senderName,
                    avatar: msg.senderAvatar || '🐊',
                    color: msg.senderColor,
                    role: msg.senderRole,
                    timestamp: msg.timestamp,
                  })}
                </div>
              </div>
            );
          }

          // Standard Chat Message
          const isStickerOnly = /^\[krokooo:[a-z0-9-]+\]$/.test(msg.text.trim());

          return (
            <div key={msg.id} className="group relative flex items-start gap-2 leading-relaxed py-0.5 px-1 rounded-lg hover:bg-slate-800/30 transition-colors">
              <div className="shrink-0 mt-0.5">
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                {!isStickerOnly && (
                  <span
                    onClick={() => onSelectUserForPM(msg.senderId)}
                    className="font-bold cursor-pointer hover:underline inline-flex items-center gap-1 mr-1.5"
                    style={{ color: msg.senderColor || '#3b82f6' }}
                    title="Click to whisper or view user"
                  >
                    {msg.senderRole === 'host' && <Crown className="w-3 h-3 text-amber-400 inline" />}
                    {msg.senderRole === 'operator' && (
                      <Shield className="w-3 h-3 text-blue-400 inline" />
                    )}
                    {msg.senderName}:
                  </span>
                )}

                {renderMessageWithStickers(msg.text, msg.textColor, msg.isBold, msg.isItalic, {
                  name: msg.senderName,
                  avatar: msg.senderAvatar || '🐊',
                  color: msg.senderColor,
                  role: msg.senderRole,
                  timestamp: msg.timestamp,
                })}
              </div>

              {/* Hover Quick Croco Reaction Button */}
              <button
                onClick={() => {
                  handleSelectSticker({
                    id: 'croco-thumbsup',
                    name: 'Krokooo Approved',
                    code: '[krokooo:croco-thumbsup]',
                    category: 'reactions',
                    tagline: '100% Swamp Verified 👍',
                    emoji: '🐊👍',
                    bgGradient: 'from-emerald-950 via-teal-950 to-slate-900',
                    borderColor: 'border-emerald-400',
                    soundEffect: 'tada',
                  });
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-slate-800 hover:bg-emerald-950/80 text-slate-400 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/40 text-[10px] shrink-0"
                title="React with Krokooo 👍"
              >
                🐊👍
              </button>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Croco Expressions Bar */}
      <div className="px-2 py-1 bg-slate-950/90 border-t border-slate-800/70 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
          <span>🐊</span>
          <span className="hidden sm:inline">Krokooo:</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSelectSticker({
              id: 'croco-wave',
              name: 'Krokooo Hello',
              code: '[krokooo:croco-wave]',
              category: 'reactions',
              tagline: 'Krokooo says Hi! 👋',
              emoji: '🐊👋',
              bgGradient: 'from-emerald-950 via-teal-900 to-slate-900',
              borderColor: 'border-emerald-500/60',
              soundEffect: 'tada',
            })}
            className="px-1.5 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium transition shrink-0"
            title="Send Krokooo Wave"
          >
            👋 Hi!
          </button>

          <button
            onClick={() => handleSelectSticker({
              id: 'croco-cool',
              name: 'Cool Shades Krokooo',
              code: '[krokooo:croco-cool]',
              category: 'moods',
              tagline: 'Too Cool for the Swamp 😎',
              emoji: '🐊🕶️',
              bgGradient: 'from-cyan-950 via-teal-950 to-slate-900',
              borderColor: 'border-cyan-500/60',
              soundEffect: 'laser',
            })}
            className="px-1.5 py-0.5 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-medium transition shrink-0"
            title="Send Cool Krokooo"
          >
            🕶️ Cool
          </button>

          <button
            onClick={() => handleSelectSticker({
              id: 'croco-party',
              name: 'Party Crocodile',
              code: '[krokooo:croco-party]',
              category: 'party',
              tagline: 'Swamp Party Time! 🎉',
              emoji: '🐊🥳',
              bgGradient: 'from-amber-950 via-orange-950 to-slate-900',
              borderColor: 'border-amber-500/60',
              soundEffect: 'applause',
            })}
            className="px-1.5 py-0.5 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[10px] font-medium transition shrink-0"
            title="Send Party Croco"
          >
            🎉 Party!
          </button>

          <button
            onClick={() => handleSelectSticker({
              id: 'croco-love',
              name: 'Krokooo Love',
              code: '[krokooo:croco-love]',
              category: 'moods',
              tagline: 'Big Crocodile Love ❤️',
              emoji: '🐊💖',
              bgGradient: 'from-pink-950 via-rose-950 to-slate-900',
              borderColor: 'border-pink-500/60',
              soundEffect: 'bell',
            })}
            className="px-1.5 py-0.5 rounded bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 text-pink-300 text-[10px] font-medium transition shrink-0"
            title="Send Krokooo Love"
          >
            💖 Love
          </button>

          <button
            onClick={() => handleSelectSticker({
              id: 'croco-fire',
              name: 'Fire Krokooo',
              code: '[krokooo:croco-fire]',
              category: 'moods',
              tagline: 'Swamp is Lit! 🔥',
              emoji: '🐊🔥',
              bgGradient: 'from-orange-950 via-red-950 to-slate-900',
              borderColor: 'border-orange-500/60',
              soundEffect: 'airhorn',
            })}
            className="px-1.5 py-0.5 rounded bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/30 text-orange-300 text-[10px] font-medium transition shrink-0"
            title="Send Lit Croco"
          >
            🔥 Lit!
          </button>
        </div>
      </div>

      {/* Input Formatting Bar & Input Area */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 relative">
        {/* Crocodile Sticker Picker Popover */}
        <CrocodileStickerPicker
          isOpen={showStickerPicker}
          onClose={() => setShowStickerPicker(false)}
          onSelectSticker={handleSelectSticker}
        />

        {/* Style Tools */}
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-900">
          <div className="flex items-center gap-1">
            {/* Crocodile Stickers Button */}
            <button
              id="croco-stickers-btn"
              onClick={() => {
                setShowStickerPicker(!showStickerPicker);
                setShowEmojiPicker(false);
                setShowColorPicker(false);
              }}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                showStickerPicker
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950/50'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
              }`}
              title="Krokooo Crocodile Stickers"
            >
              <span className="text-sm">🐊</span>
              <span>Stickers</span>
            </button>

            {/* Bold */}
            <button
              onClick={() => setIsBold(!isBold)}
              className={`p-1 rounded ${
                isBold ? 'bg-slate-700 text-teal-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Bold Text"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
              onClick={() => setIsItalic(!isItalic)}
              className={`p-1 rounded ${
                isItalic
                  ? 'bg-slate-700 text-teal-400 italic'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Italic Text"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Color Picker */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowStickerPicker(false);
                  setShowEmojiPicker(false);
                }}
                className="p-1 rounded text-slate-400 hover:bg-slate-800 flex items-center gap-1"
                title="Message Font Color"
              >
                <Palette className="w-3.5 h-3.5" />
                <span
                  className="w-2.5 h-2.5 rounded-full border border-slate-700"
                  style={{ backgroundColor: selectedColor }}
                />
              </button>

              {showColorPicker && (
                <div className="absolute bottom-7 left-0 bg-slate-900 border border-slate-700 rounded-lg p-1.5 shadow-xl grid grid-cols-5 gap-1.5 z-50">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedColor(c);
                        setShowColorPicker(false);
                      }}
                      className="w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Emoji Picker Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowStickerPicker(false);
                  setShowColorPicker(false);
                }}
                className="p-1 rounded text-slate-400 hover:bg-slate-800"
                title="Insert Emoji"
              >
                <Smile className="w-3.5 h-3.5 text-amber-400" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-8 left-0 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl grid grid-cols-5 gap-1.5 z-50 w-48">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAddEmoji(emoji)}
                      className="text-base hover:bg-slate-800 p-1 rounded transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Gift Icon */}
          <button
            onClick={onOpenGifts}
            className="text-[11px] font-semibold text-pink-400 hover:text-pink-300 hover:bg-pink-950/40 px-2 py-0.5 rounded transition flex items-center gap-1"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Gift</span>
          </button>
        </div>

        {/* Input & Send Form */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            id="chat-message-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              currentUser?.isMuted
                ? 'You are muted in this room'
                : 'Message or send a 🐊 sticker...'
            }
            disabled={currentUser?.isMuted}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-hidden transition"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputVal.trim() || currentUser?.isMuted}
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition shadow shadow-emerald-950/40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

