import React, { useState } from 'react';
import { MessageSquare, Send, X, User, Lock, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { PrivateConversation } from '../types';
import { CrocodileStickerPicker } from './CrocodileStickerPicker';
import { renderMessageWithStickers } from './CrocodileStickerBadge';
import { CrocodileSticker } from '../data/stickers';

interface PrivateMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivateMessagesModal: React.FC<PrivateMessagesModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    pmConversations,
    activePMUser,
    setActivePMUser,
    sendWhisper,
    roomUsers,
    playSoundEffect,
  } = useSocket();

  const [messageInput, setMessageInput] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  if (!isOpen) return null;

  const conversationList = Object.values(pmConversations) as PrivateConversation[];
  const activeConversation = activePMUser ? pmConversations[activePMUser] : conversationList[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;

    sendWhisper(activeConversation.userId, messageInput);
    setMessageInput('');
    setShowStickerPicker(false);
  };

  const handleSelectSticker = (sticker: CrocodileSticker) => {
    if (!activeConversation) return;
    if (sticker.soundEffect) {
      playSoundEffect(sticker.soundEffect, sticker.name);
    }
    sendWhisper(activeConversation.userId, sticker.code);
    setShowStickerPicker(false);
  };

  return (
    <div
      id="private-messages-modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Private Messages (PM)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  🐊 Crocodile Stickers Enabled
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">1-on-1 direct instant messaging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Left Conversation List, Right Chat Feed */}
        <div className="flex-1 flex min-h-0">
          {/* Conversation Tabs */}
          <div className="w-1/3 bg-slate-950/70 border-r border-slate-800 overflow-y-auto p-2 space-y-1">
            {conversationList.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">
                No active PMs. Click any user in the room list to start a private chat!
              </div>
            ) : (
              conversationList.map((conv) => {
                const isSelected = activeConversation?.userId === conv.userId;
                return (
                  <div
                    key={conv.userId}
                    onClick={() => setActivePMUser(conv.userId)}
                    className={`p-2.5 rounded-xl cursor-pointer transition flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-slate-800 text-slate-100 border border-slate-700'
                        : 'hover:bg-slate-900 text-slate-400'
                    }`}
                  >
                    <img
                      src={conv.userAvatar}
                      alt={conv.userName}
                      className="w-8 h-8 rounded-full bg-slate-800 object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate text-slate-200">
                          {conv.userName}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        {conv.messages[conv.messages.length - 1]?.text || 'No messages'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900 relative">
            {activeConversation ? (
              <>
                {/* Active Partner Info */}
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={activeConversation.userAvatar}
                      alt={activeConversation.userName}
                      className="w-6 h-6 rounded-full bg-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-bold text-slate-200">
                      {activeConversation.userName}
                    </span>
                  </div>
                  <span className="text-[11px] text-purple-400 flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3" /> Direct PM
                  </span>
                </div>

                {/* Message Log */}
                <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs">
                  {activeConversation.messages.map((msg) => {
                    const isFromMe = msg.senderId === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isFromMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                            isFromMe
                              ? 'bg-blue-600 text-white rounded-br-xs'
                              : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700'
                          }`}
                        >
                          {renderMessageWithStickers(msg.text, isFromMe ? '#ffffff' : '#f1f5f9', false, false, {
                            name: isFromMe ? currentUser?.name : activeConversation.userName,
                            avatar: isFromMe ? currentUser?.avatar : activeConversation.userAvatar,
                            color: isFromMe ? currentUser?.color : activeConversation.userColor,
                            role: isFromMe ? currentUser?.role : undefined,
                            timestamp: msg.timestamp,
                          })}
                        </div>
                        <span className="text-[10px] text-slate-500 px-1 mt-0.5 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Popover sticker picker in PM modal */}
                {showStickerPicker && (
                  <div className="absolute bottom-16 right-4 z-50">
                    <CrocodileStickerPicker
                      isOpen={showStickerPicker}
                      onClose={() => setShowStickerPicker(false)}
                      onSelectSticker={handleSelectSticker}
                    />
                  </div>
                )}

                {/* Send Input & Sticker Button */}
                <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStickerPicker(!showStickerPicker)}
                    className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1 shrink-0"
                    title="Send Krokooo Crocodile Sticker"
                  >
                    <span className="text-base">🐊</span>
                    <span className="hidden sm:inline">Stickers</span>
                  </button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Message @${activeConversation.userName} or pick a 🐊 sticker...`}
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <MessageSquare className="w-10 h-10 text-slate-700 mb-2" />
                <p className="text-xs">Select a conversation or click a user in the room</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

