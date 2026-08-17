import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ClientUser,
  ChatMessage,
  RoomSummary,
  RoomDetail,
  VirtualGift,
  PrivateConversation,
  RoomPoll,
  UserRole,
  UserStatus,
} from '../types';
import { soundEngine } from '../utils/audio';
import { ICE_SERVERS } from '../utils/webrtc';

interface SocketContextValue {
  isConnected: boolean;
  currentUser: ClientUser | null;
  currentRoom: RoomDetail | null;
  rooms: RoomSummary[];
  roomUsers: ClientUser[];
  messages: ChatMessage[];
  pmConversations: Record<string, PrivateConversation>;
  activePMUser: string | null;
  remoteStreams: Record<string, MediaStream>;
  activeGiftAnimation: {
    gift: VirtualGift;
    senderName: string;
    targetUserName?: string;
  } | null;
  activeGiftEffect: {
    gift: VirtualGift;
    senderName: string;
    targetUserName?: string;
  } | null;
  isLocalCamBroadcasting: boolean;
  currentPoll: RoomPoll | null;
  errorNotification: string | null;
  soundMuted: boolean;
  // Actions
  joinRoom: (roomId: string, password?: string) => void;
  leaveRoom: () => void;
  createRoom: (roomData: {
    name: string;
    category: string;
    topic: string;
    isPasswordProtected: boolean;
    password?: string;
    maxUsers: number;
    camLimit: number;
    openMic: boolean;
  }) => void;
  sendMessage: (text: string, options?: { textColor?: string; isBold?: boolean; isItalic?: boolean }) => void;
  sendWhisper: (targetUserId: string, text: string) => void;
  sendGift: (gift: VirtualGift, targetUserId?: string, targetUserName?: string) => void;
  toggleCam: (hasCam: boolean, hasMic?: boolean) => void;
  toggleMic: (hasMic: boolean) => void;
  raiseHand: () => void;
  muteUser: (targetUserId: string, isMuted: boolean) => void;
  kickUser: (targetUserId: string, reason?: string) => void;
  banUser: (targetUserId: string, reason?: string) => void;
  makeOperator: (targetUserId: string, isOp: boolean) => void;
  updateTopic: (topic: string) => void;
  clearChat: () => void;
  createPoll: (question: string, options: string[]) => void;
  startPoll: (question: string, options: string[]) => void;
  votePoll: (optionId: string) => void;
  closePoll: () => void;
  playSoundEffect: (soundId: string, soundName?: string) => void;
  playSoundFx: (soundId: string) => void;
  updateProfile: (profile: { name?: string; avatar?: string; color?: string; status?: UserStatus }) => void;
  updateUserProfile: (profile: { name?: string; avatar?: string; color?: string; status?: UserStatus }) => void;
  toggleSoundMute: () => void;
  setActivePMUser: (userId: string | null) => void;
  clearError: () => void;
  setLocalMediaStream: (stream: MediaStream | null) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomDetail | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [roomUsers, setRoomUsers] = useState<ClientUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pmConversations, setPmConversations] = useState<Record<string, PrivateConversation>>({});
  const [activePMUser, setActivePMUser] = useState<string | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<{
    gift: VirtualGift;
    senderName: string;
    targetUserName?: string;
  } | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [soundMuted, setSoundMuted] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const reconnectTimeoutRef = useRef<any>(null);

  // Initialize and connect WebSocket
  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (unmounted) return;
          setIsConnected(true);
          console.log('Connected to Camfrog WebSocket server');
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(event.data);
            handleServerMessage(data);
          } catch (e) {
            console.error('Failed to parse server message:', e);
          }
        };

        ws.onclose = () => {
          if (unmounted) return;
          setIsConnected(false);
          console.log('WebSocket closed, attempting reconnect in 2s...');
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        };

        ws.onerror = (err) => {
          console.warn('WebSocket error:', err);
          ws.close();
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
      // Close all peer connections
      (Object.values(peerConnectionsRef.current) as RTCPeerConnection[]).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
    };
  }, []);

  // WebRTC Peer Connection Helper
  const createPeerConnection = useCallback((remoteUserId: string, isInitiator: boolean) => {
    if (peerConnectionsRef.current[remoteUserId]) {
      return peerConnectionsRef.current[remoteUserId];
    }

    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current[remoteUserId] = pc;

      // Add local stream tracks if available
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({
              type: 'signal:send',
              payload: {
                targetUserId: remoteUserId,
                signal: { type: 'candidate', candidate: event.candidate },
              },
            })
          );
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStreams((prev) => ({
            ...prev,
            [remoteUserId]: event.streams[0],
          }));
        }
      };

      if (isInitiator) {
        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(
                JSON.stringify({
                  type: 'signal:send',
                  payload: {
                    targetUserId: remoteUserId,
                    signal: { type: 'offer', sdp: pc.localDescription },
                  },
                })
              );
            }
          })
          .catch((err) => console.warn('WebRTC offer error:', err));
      }

      return pc;
    } catch (err) {
      console.warn('Failed to create RTCPeerConnection:', err);
      return null;
    }
  }, []);

  const handleServerMessage = useCallback(
    (msg: { type: string; payload?: any }) => {
      const { type, payload } = msg;

      switch (type) {
        case 'init:ack': {
          setCurrentUser(payload.user);
          if (payload.rooms) setRooms(payload.rooms);
          break;
        }

        case 'directory:update': {
          if (payload.rooms) setRooms(payload.rooms);
          break;
        }

        case 'user:profile_updated': {
          setCurrentUser(payload.user);
          break;
        }

        case 'room:joined': {
          setCurrentRoom(payload.room);
          setRoomUsers(payload.users || []);
          setMessages(payload.messages || []);
          if (payload.currentUser) setCurrentUser(payload.currentUser);
          soundEngine.playJoinChime();
          break;
        }

        case 'room:left': {
          setCurrentRoom(null);
          setRoomUsers([]);
          setMessages([]);
          // Clean up remote peer streams
          (Object.values(peerConnectionsRef.current) as RTCPeerConnection[]).forEach((pc) => pc.close());
          peerConnectionsRef.current = {};
          setRemoteStreams({});
          break;
        }

        case 'room:user_joined': {
          setRoomUsers(payload.users || []);
          soundEngine.playJoinChime();
          // If local has cam or user has cam, initiate peer connection
          if (currentUser?.hasCam && payload.user?.id) {
            createPeerConnection(payload.user.id, true);
          }
          break;
        }

        case 'room:user_left': {
          setRoomUsers(payload.users || []);
          soundEngine.playLeavePop();
          // Cleanup peer connection
          if (payload.userId && peerConnectionsRef.current[payload.userId]) {
            peerConnectionsRef.current[payload.userId].close();
            delete peerConnectionsRef.current[payload.userId];
            setRemoteStreams((prev) => {
              const updated = { ...prev };
              delete updated[payload.userId];
              return updated;
            });
          }
          break;
        }

        case 'room:user_updated':
        case 'room:role_changed':
        case 'room:user_muted': {
          if (payload.users) setRoomUsers(payload.users);
          if (currentUser && payload.targetUserId === currentUser.id && payload.role) {
            setCurrentUser((prev) => (prev ? { ...prev, role: payload.role } : null));
          }
          if (currentUser && payload.targetUserId === currentUser.id && payload.isMuted !== undefined) {
            setCurrentUser((prev) => (prev ? { ...prev, isMuted: payload.isMuted } : null));
          }
          break;
        }

        case 'cam:status_changed': {
          if (payload.users) setRoomUsers(payload.users);
          // If remote user turned on cam and we aren't connected yet, connect
          if (payload.hasCam && payload.userId !== currentUser?.id) {
            createPeerConnection(payload.userId, true);
          }
          break;
        }

        case 'chat:message': {
          setMessages((prev) => [...prev.slice(-150), payload]);
          if (payload.type === 'chat' || payload.type === 'gift') {
            soundEngine.playMessageChime();
          }
          break;
        }

        case 'chat:whisper': {
          const pm: ChatMessage = payload;
          const partnerId = pm.senderId === currentUser?.id ? pm.recipientId! : pm.senderId;
          const partnerName = pm.senderId === currentUser?.id ? pm.recipientName || 'User' : pm.senderName;

          setPmConversations((prev) => {
            const existing = prev[partnerId] || {
              userId: partnerId,
              userName: partnerName,
              userAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${partnerId}`,
              userRole: 'member',
              userStatus: 'online',
              messages: [],
              unreadCount: 0,
            };
            return {
              ...prev,
              [partnerId]: {
                ...existing,
                userName: partnerName,
                messages: [...existing.messages, pm],
                unreadCount: activePMUser === partnerId ? 0 : existing.unreadCount + 1,
              },
            };
          });

          soundEngine.playMessageChime();
          break;
        }

        case 'chat:cleared': {
          setMessages([]);
          break;
        }

        case 'gift:animation': {
          const { gift, senderName, targetUserName } = payload;
          setActiveGiftAnimation({ gift, senderName, targetUserName });
          soundEngine.playGiftFanfare();

          // Trigger particle confetti
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
            });
          } catch (e) {}

          setTimeout(() => {
            setActiveGiftAnimation(null);
          }, 4500);
          break;
        }

        case 'poll:updated': {
          if (payload.poll) {
            setCurrentRoom((prev) => (prev ? { ...prev, poll: payload.poll } : null));
          }
          break;
        }

        case 'room:topic_updated': {
          if (payload.topic !== undefined) {
            setCurrentRoom((prev) => (prev ? { ...prev, topic: payload.topic } : null));
          }
          break;
        }

        case 'room:sound_played': {
          const { soundId } = payload;
          soundEngine.playSoundEffect(soundId);
          break;
        }

        case 'room:kicked':
        case 'room:banned': {
          setCurrentRoom(null);
          setRoomUsers([]);
          setMessages([]);
          setErrorNotification(payload.message || 'You were removed from the room.');
          break;
        }

        case 'signal:receive': {
          const { senderId, signal } = payload;
          if (!senderId || !signal) return;

          let pc = peerConnectionsRef.current[senderId];
          if (!pc) {
            pc = createPeerConnection(senderId, false)!;
          }

          if (pc) {
            if (signal.type === 'offer') {
              pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => pc.createAnswer())
                .then((answer) => pc.setLocalDescription(answer))
                .then(() => {
                  socketRef.current?.send(
                    JSON.stringify({
                      type: 'signal:send',
                      payload: {
                        targetUserId: senderId,
                        signal: { type: 'answer', sdp: pc.localDescription },
                      },
                    })
                  );
                })
                .catch((e) => console.warn('Failed to handle WebRTC offer:', e));
            } else if (signal.type === 'answer') {
              pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).catch((e) =>
                console.warn('Failed to set remote answer:', e)
              );
            } else if (signal.type === 'candidate' && signal.candidate) {
              pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch((e) =>
                console.warn('Failed to add ICE candidate:', e)
              );
            }
          }
          break;
        }

        case 'error': {
          setErrorNotification(payload.message || 'An error occurred');
          break;
        }

        default:
          break;
      }
    },
    [activePMUser, createPeerConnection, currentUser]
  );

  const sendPayload = (type: string, payload?: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const joinRoom = (roomId: string, password?: string) => {
    sendPayload('room:join', { roomId, password });
  };

  const leaveRoom = () => {
    sendPayload('room:leave');
  };

  const createRoom = (roomData: {
    name: string;
    category: string;
    topic: string;
    isPasswordProtected: boolean;
    password?: string;
    maxUsers: number;
    camLimit: number;
    openMic: boolean;
  }) => {
    sendPayload('room:create', roomData);
  };

  const sendMessage = (
    text: string,
    options?: { textColor?: string; isBold?: boolean; isItalic?: boolean }
  ) => {
    sendPayload('chat:send', { text, ...options });
  };

  const sendWhisper = (targetUserId: string, text: string) => {
    sendPayload('chat:whisper', { targetUserId, text });
  };

  const sendGift = (gift: VirtualGift, targetUserId?: string, targetUserName?: string) => {
    sendPayload('gift:send', { gift, targetUserId, targetUserName });
  };

  const toggleCam = (hasCam: boolean, hasMic?: boolean) => {
    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, hasCam, hasMic: hasMic ?? prev.hasMic } : null));
    }
    sendPayload('cam:toggle', { hasCam, hasMic });
  };

  const toggleMic = (hasMic: boolean) => {
    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, hasMic } : null));
    }
    sendPayload('mic:toggle', { hasMic });
  };

  const raiseHand = () => {
    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, handRaised: !prev.handRaised } : null));
    }
    sendPayload('room:raise_hand');
  };

  const muteUser = (targetUserId: string, isMuted: boolean) => {
    sendPayload('mod:mute_user', { targetUserId, isMuted });
  };

  const kickUser = (targetUserId: string, reason?: string) => {
    sendPayload('mod:kick_user', { targetUserId, reason });
  };

  const banUser = (targetUserId: string, reason?: string) => {
    sendPayload('mod:ban_user', { targetUserId, reason });
  };

  const makeOperator = (targetUserId: string, isOp: boolean) => {
    sendPayload('mod:make_operator', { targetUserId, isOp });
  };

  const updateTopic = (topic: string) => {
    sendPayload('room:update_topic', { topic });
  };

  const clearChat = () => {
    sendPayload('room:clear_chat');
  };

  const createPoll = (question: string, options: string[]) => {
    sendPayload('poll:create', { question, options });
  };

  const votePoll = (optionId: string) => {
    sendPayload('poll:vote', { optionId });
  };

  const closePoll = () => {
    sendPayload('poll:close');
  };

  const playSoundEffect = (soundId: string, soundName?: string) => {
    soundEngine.playSoundEffect(soundId);
    sendPayload('room:sound_effect', { soundId, soundName: soundName || soundId });
  };

  const playSoundFx = (soundId: string) => {
    playSoundEffect(soundId, soundId);
  };

  const updateProfile = (profile: { name?: string; avatar?: string; color?: string; status?: UserStatus }) => {
    // Optimistically update local currentUser so UI reacts instantly
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        ...(profile.name ? { name: profile.name } : {}),
        ...(profile.avatar ? { avatar: profile.avatar } : {}),
        ...(profile.color ? { color: profile.color } : {}),
        ...(profile.status ? { status: profile.status } : {}),
      });
    }
    sendPayload('user:update_profile', profile);
  };

  const updateUserProfile = updateProfile;
  const startPoll = createPoll;
  const isLocalCamBroadcasting = currentUser?.hasCam || false;
  const currentPoll = currentRoom?.activePoll || null;
  const activeGiftEffect = activeGiftAnimation;

  const toggleSoundMute = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    soundEngine.setMuted(next);
  };

  const setLocalMediaStream = (stream: MediaStream | null) => {
    localStreamRef.current = stream;
    // Update active peer connections with new tracks
    if (stream) {
      (Object.values(peerConnectionsRef.current) as RTCPeerConnection[]).forEach((pc) => {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      });
    }
  };

  const clearError = () => {
    setErrorNotification(null);
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        currentUser,
        currentRoom,
        rooms,
        roomUsers,
        messages,
        pmConversations,
        activePMUser,
        remoteStreams,
        activeGiftAnimation,
        activeGiftEffect,
        isLocalCamBroadcasting,
        currentPoll,
        errorNotification,
        soundMuted,
        joinRoom,
        leaveRoom,
        createRoom,
        sendMessage,
        sendWhisper,
        sendGift,
        toggleCam,
        toggleMic,
        raiseHand,
        muteUser,
        kickUser,
        banUser,
        makeOperator,
        updateTopic,
        clearChat,
        createPoll,
        startPoll,
        votePoll,
        closePoll,
        playSoundEffect,
        playSoundFx,
        updateProfile,
        updateUserProfile,
        toggleSoundMute,
        setActivePMUser,
        clearError,
        setLocalMediaStream,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
