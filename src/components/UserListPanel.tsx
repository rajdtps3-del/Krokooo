import React, { useState } from 'react';
import {
  Users,
  Crown,
  Shield,
  Video,
  Mic,
  MicOff,
  Hand,
  MoreVertical,
  MessageSquare,
  Gift,
  VolumeX,
  Volume2,
  UserX,
  Ban,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { ClientUser } from '../types';

interface UserListPanelProps {
  onSelectUserForPM: (userId: string) => void;
  onOpenGiftsForUser: (user: ClientUser) => void;
}

export const UserListPanel: React.FC<UserListPanelProps> = ({
  onSelectUserForPM,
  onOpenGiftsForUser,
}) => {
  const {
    currentUser,
    currentRoom,
    roomUsers,
    muteUser,
    kickUser,
    banUser,
    makeOperator,
  } = useSocket();

  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  const isHost = currentRoom?.ownerId === currentUser?.id || currentUser?.role === 'host';
  const isOperator = isHost || currentUser?.role === 'operator';

  // Categorize users
  const hosts = roomUsers.filter((u) => u.role === 'host' || u.role === 'owner');
  const operators = roomUsers.filter((u) => u.role === 'operator');
  const broadcasters = roomUsers.filter(
    (u) => u.hasCam && u.role !== 'host' && u.role !== 'owner' && u.role !== 'operator'
  );
  const raisedHands = roomUsers.filter((u) => u.handRaised);
  const members = roomUsers.filter(
    (u) =>
      !u.hasCam &&
      u.role !== 'host' &&
      u.role !== 'owner' &&
      u.role !== 'operator'
  );

  const renderUserItem = (user: ClientUser) => {
    const isSelf = user.id === currentUser?.id;
    const isTargetHost = user.role === 'host' || user.role === 'owner';
    const isTargetOp = user.role === 'operator';

    return (
      <div
        key={user.id}
        className="group relative flex items-center justify-between px-3 py-1.5 hover:bg-slate-800/80 rounded-lg transition text-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-6 h-6 rounded-full bg-slate-700 object-cover"
              referrerPolicy="no-referrer"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-slate-900 ${
                user.status === 'busy'
                  ? 'bg-red-500'
                  : user.status === 'away'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="font-bold truncate"
                style={{ color: user.color || '#3b82f6' }}
              >
                {user.name}
              </span>
              {isSelf && <span className="text-[10px] text-slate-400">(You)</span>}
              {isTargetHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
              {isTargetOp && <Shield className="w-3 h-3 text-blue-400 shrink-0" />}
            </div>
          </div>
        </div>

        {/* Status Indicators & Menu Trigger */}
        <div className="flex items-center gap-1.5 shrink-0">
          {user.handRaised && (
            <span className="p-0.5 rounded bg-amber-500/20 text-amber-300" title="Hand Raised">
              <Hand className="w-3 h-3 text-amber-400 animate-bounce" />
            </span>
          )}
          {user.hasCam && (
            <span className="p-0.5 rounded bg-rose-500/20 text-rose-400" title="Broadcasting Video">
              <Video className="w-3 h-3" />
            </span>
          )}
          {user.isMuted && (
            <span className="p-0.5 rounded bg-slate-800 text-rose-400" title="Muted by Operator">
              <VolumeX className="w-3 h-3" />
            </span>
          )}

          {/* Action Menu */}
          {!isSelf && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuUserId(activeMenuUserId === user.id ? null : user.id);
                }}
                className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition opacity-80 group-hover:opacity-100"
                title="User Options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {activeMenuUserId === user.id && (
                <div
                  className="absolute right-0 top-6 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      onSelectUserForPM(user.id);
                      setActiveMenuUserId(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>Direct Message</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenGiftsForUser(user);
                      setActiveMenuUserId(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Gift className="w-3.5 h-3.5 text-pink-400" />
                    <span>Send Gift</span>
                  </button>

                  {/* Moderator & Host Tools */}
                  {isOperator && !isTargetHost && (
                    <>
                      <div className="my-1 border-t border-slate-800" />

                      {isHost && (
                        <button
                          onClick={() => {
                            makeOperator(user.id, !isTargetOp);
                            setActiveMenuUserId(null);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Shield className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{isTargetOp ? 'Revoke Operator' : 'Make Operator'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          muteUser(user.id, !user.isMuted);
                          setActiveMenuUserId(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                      >
                        {user.isMuted ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Unmute User</span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                            <span>Mute in Chat</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          kickUser(user.id, 'Removed by room operator');
                          setActiveMenuUserId(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-rose-300 hover:bg-rose-950/40 flex items-center gap-2"
                      >
                        <UserX className="w-3.5 h-3.5 text-rose-400" />
                        <span>Kick from Room</span>
                      </button>

                      {isHost && (
                        <button
                          onClick={() => {
                            banUser(user.id, 'Banned by room host');
                            setActiveMenuUserId(null);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-rose-400 hover:bg-rose-950/60 flex items-center gap-2"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-500" />
                          <span>Ban User</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      id="camfrog-userlist-panel"
      className="w-full md:w-64 bg-slate-900/95 border-l border-slate-800 flex flex-col h-full shrink-0 select-none"
    >
      {/* Header */}
      <div className="px-3 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wide">ROOM USERS</span>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
          {roomUsers.length}
        </span>
      </div>

      {/* User Categorized List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Raised Hands Queue */}
        {raisedHands.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 mb-1 flex items-center gap-1">
              <Hand className="w-3 h-3" /> Raised Hands ({raisedHands.length})
            </div>
            <div className="space-y-0.5">{raisedHands.map(renderUserItem)}</div>
          </div>
        )}

        {/* Room Hosts */}
        {hosts.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 mb-1 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Hosts ({hosts.length})
            </div>
            <div className="space-y-0.5">{hosts.map(renderUserItem)}</div>
          </div>
        )}

        {/* Operators */}
        {operators.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Operators ({operators.length})
            </div>
            <div className="space-y-0.5">{operators.map(renderUserItem)}</div>
          </div>
        )}

        {/* Broadcasters */}
        {broadcasters.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 mb-1 flex items-center gap-1">
              <Video className="w-3 h-3" /> Broadcasters ({broadcasters.length})
            </div>
            <div className="space-y-0.5">{broadcasters.map(renderUserItem)}</div>
          </div>
        )}

        {/* Members */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
            Members ({members.length})
          </div>
          <div className="space-y-0.5">{members.map(renderUserItem)}</div>
        </div>
      </div>
    </div>
  );
};
