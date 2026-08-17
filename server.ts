import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface ClientUser {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'host' | 'operator' | 'member' | 'guest';
  status: 'online' | 'away' | 'busy';
  color: string;
  hasCam: boolean;
  hasMic: boolean;
  isMuted: boolean;
  handRaised: boolean;
  joinedAt: number;
}

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderColor: string;
  text: string;
  type: 'chat' | 'system' | 'gift' | 'whisper' | 'action';
  gift?: {
    id: string;
    name: string;
    icon: string;
    cost: number;
    targetName?: string;
  };
  recipientId?: string;
  recipientName?: string;
  timestamp: number;
  textColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
}

interface RoomPoll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  voters: Record<string, string>; // userId -> optionId
  creatorId: string;
  creatorName: string;
  createdAt: number;
  isOpen: boolean;
}

interface RoomData {
  id: string;
  name: string;
  category: string;
  topic: string;
  ownerId: string;
  ownerName: string;
  isPasswordProtected: boolean;
  password?: string;
  maxUsers: number;
  camLimit: number;
  openMic: boolean;
  operators: string[]; // user IDs
  bannedUsers: string[]; // user IDs
  mutedUsers: string[]; // user IDs
  createdAt: number;
  messages: ChatMessage[];
  poll?: RoomPoll;
}

// Initial predefined community rooms
const initialRooms: Record<string, RoomData> = {
  'general-lounge': {
    id: 'general-lounge',
    name: 'Global Community Lounge',
    category: 'Community',
    topic: 'Welcome to the main Camfrog global video room! Say hi, turn on your cam, and meet friends worldwide 🌍',
    ownerId: 'system-host-1',
    ownerName: 'CamfrogHost',
    isPasswordProtected: false,
    maxUsers: 100,
    camLimit: 12,
    openMic: true,
    operators: ['system-host-1'],
    bannedUsers: [],
    mutedUsers: [],
    createdAt: Date.now() - 36000000,
    messages: [
      {
        id: 'msg-init-1',
        roomId: 'general-lounge',
        senderId: 'system-host-1',
        senderName: 'CamfrogHost',
        senderRole: 'host',
        senderColor: '#ef4444',
        text: 'Welcome to the room! Please keep conversations friendly and enjoy the live video feeds.',
        type: 'system',
        timestamp: Date.now() - 60000,
      }
    ],
  },
  'music-karaoke': {
    id: 'music-karaoke',
    name: 'Live Music & Acoustic Jam',
    category: 'Music',
    topic: 'Live acoustic sessions, vocals, beatboxing & instrumentals 🎸 Turn on your cam and mic to perform!',
    ownerId: 'system-host-2',
    ownerName: 'AudioMaster',
    isPasswordProtected: false,
    maxUsers: 50,
    camLimit: 8,
    openMic: true,
    operators: ['system-host-2'],
    bannedUsers: [],
    mutedUsers: [],
    createdAt: Date.now() - 25000000,
    messages: [],
  },
  'tech-hangout': {
    id: 'tech-hangout',
    name: 'Tech, Code & AI Hub',
    category: 'Technology',
    topic: 'Discussing latest tech, web development, hardware mods, and AI gadgets 💻',
    ownerId: 'system-host-3',
    ownerName: 'ByteKnight',
    isPasswordProtected: false,
    maxUsers: 50,
    camLimit: 8,
    openMic: true,
    operators: ['system-host-3'],
    bannedUsers: [],
    mutedUsers: [],
    createdAt: Date.now() - 15000000,
    messages: [],
  },
  'language-exchange': {
    id: 'language-exchange',
    name: 'Polyglot & Language Exchange',
    category: 'Languages',
    topic: 'Practice English, Spanish, French, Japanese, and more! Friendly video chat for learners 🗣️',
    ownerId: 'system-host-4',
    ownerName: 'PolyglotPro',
    isPasswordProtected: false,
    maxUsers: 40,
    camLimit: 6,
    openMic: true,
    operators: ['system-host-4'],
    bannedUsers: [],
    mutedUsers: [],
    createdAt: Date.now() - 8000000,
    messages: [],
  },
  'gaming-chill': {
    id: 'gaming-chill',
    name: 'Gamer Lounge & Stream Chat',
    category: 'Gaming',
    topic: 'Casual hangout for gamers, strategy chats, and live clips 🎮',
    ownerId: 'system-host-5',
    ownerName: 'PixelPaladin',
    isPasswordProtected: false,
    maxUsers: 60,
    camLimit: 8,
    openMic: true,
    operators: ['system-host-5'],
    bannedUsers: [],
    mutedUsers: [],
    createdAt: Date.now() - 5000000,
    messages: [],
  },
};

const rooms: Record<string, RoomData> = { ...initialRooms };

interface ClientConnection {
  ws: WebSocket;
  user: ClientUser;
  roomId?: string;
}

const connections = new Map<WebSocket, ClientConnection>();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // API endpoints
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      totalConnections: connections.size,
      totalRooms: Object.keys(rooms).length,
    });
  });

  app.get('/api/rooms', (req, res) => {
    // Return room summaries with live member and cam counts
    const roomList = Object.values(rooms).map((r) => {
      const roomClients = Array.from(connections.values()).filter((c) => c.roomId === r.id);
      const camCount = roomClients.filter((c) => c.user.hasCam).length;
      return {
        id: r.id,
        name: r.name,
        category: r.category,
        topic: r.topic,
        ownerId: r.ownerId,
        ownerName: r.ownerName,
        isPasswordProtected: r.isPasswordProtected,
        maxUsers: r.maxUsers,
        camLimit: r.camLimit,
        openMic: r.openMic,
        userCount: roomClients.length,
        camCount,
        createdAt: r.createdAt,
      };
    });
    res.json(roomList);
  });

  // WebSocket signaling & real-time messaging
  wss.on('connection', (ws: WebSocket) => {
    const defaultUser: ClientUser = {
      id: `user-${Math.random().toString(36).substring(2, 9)}`,
      name: `Guest${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random()}`,
      role: 'member',
      status: 'online',
      color: '#3b82f6',
      hasCam: false,
      hasMic: true,
      isMuted: false,
      handRaised: false,
      joinedAt: Date.now(),
    };

    connections.set(ws, { ws, user: defaultUser });

    // Send initial client identity confirmation
    ws.send(
      JSON.stringify({
        type: 'init:ack',
        payload: {
          user: defaultUser,
          rooms: getRoomSummaries(),
        },
      })
    );

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        handleClientMessage(ws, msg);
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    });

    ws.on('close', () => {
      handleClientDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('WS client error:', err);
      handleClientDisconnect(ws);
    });
  });

  function getRoomSummaries() {
    return Object.values(rooms).map((r) => {
      const roomClients = Array.from(connections.values()).filter((c) => c.roomId === r.id);
      const camCount = roomClients.filter((c) => c.user.hasCam).length;
      return {
        id: r.id,
        name: r.name,
        category: r.category,
        topic: r.topic,
        ownerId: r.ownerId,
        ownerName: r.ownerName,
        isPasswordProtected: r.isPasswordProtected,
        maxUsers: r.maxUsers,
        camLimit: r.camLimit,
        openMic: r.openMic,
        userCount: roomClients.length,
        camCount,
        createdAt: r.createdAt,
      };
    });
  }

  function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
    const payload = JSON.stringify(message);
    connections.forEach((conn, clientWs) => {
      if (conn.roomId === roomId && clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(payload);
      }
    });
  }

  function broadcastToAll(message: any) {
    const payload = JSON.stringify(message);
    connections.forEach((_, clientWs) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(payload);
      }
    });
  }

  function sendToUser(userId: string, message: any) {
    const payload = JSON.stringify(message);
    connections.forEach((conn, clientWs) => {
      if (conn.user.id === userId && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(payload);
      }
    });
  }

  function getRoomUsers(roomId: string): ClientUser[] {
    const users: ClientUser[] = [];
    connections.forEach((conn) => {
      if (conn.roomId === roomId) {
        users.push(conn.user);
      }
    });
    return users;
  }

  function handleClientDisconnect(ws: WebSocket) {
    const client = connections.get(ws);
    if (!client) return;

    const { user, roomId } = client;
    connections.delete(ws);

    if (roomId && rooms[roomId]) {
      const remainingUsers = getRoomUsers(roomId);
      
      // Notify remaining room members
      broadcastToRoom(roomId, {
        type: 'room:user_left',
        payload: {
          userId: user.id,
          userName: user.name,
          users: remainingUsers,
        },
      });

      // Broadcast system message in room chat
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        roomId,
        senderId: 'system',
        senderName: 'System',
        senderRole: 'system',
        senderColor: '#6b7280',
        text: `${user.name} left the room`,
        type: 'system',
        timestamp: Date.now(),
      };
      rooms[roomId].messages.push(sysMsg);
      if (rooms[roomId].messages.length > 200) rooms[roomId].messages.shift();
      broadcastToRoom(roomId, { type: 'chat:message', payload: sysMsg });

      // Update room directory count for all
      broadcastToAll({
        type: 'directory:update',
        payload: { rooms: getRoomSummaries() },
      });
    }
  }

  function handleClientMessage(ws: WebSocket, msg: { type: string; payload?: any }) {
    const client = connections.get(ws);
    if (!client) return;

    const { type, payload } = msg;

    switch (type) {
      case 'user:update_profile': {
        if (!payload) return;
        if (payload.name) client.user.name = payload.name.trim().substring(0, 24);
        if (payload.avatar) client.user.avatar = payload.avatar;
        if (payload.color) client.user.color = payload.color;
        if (payload.status) client.user.status = payload.status;

        ws.send(JSON.stringify({ type: 'user:profile_updated', payload: { user: client.user } }));

        if (client.roomId) {
          broadcastToRoom(client.roomId, {
            type: 'room:user_updated',
            payload: { user: client.user, users: getRoomUsers(client.roomId) },
          });
        }
        break;
      }

      case 'room:create': {
        const { name, category, topic, isPasswordProtected, password, maxUsers, camLimit, openMic } = payload || {};
        if (!name) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Room name is required' } }));
          return;
        }

        const roomId = `room-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        const newRoom: RoomData = {
          id: roomId,
          name: name.trim().substring(0, 40),
          category: category || 'Community',
          topic: topic ? topic.trim().substring(0, 150) : 'Welcome to our room!',
          ownerId: client.user.id,
          ownerName: client.user.name,
          isPasswordProtected: Boolean(isPasswordProtected && password),
          password: isPasswordProtected ? password : undefined,
          maxUsers: Math.min(Math.max(Number(maxUsers) || 30, 2), 100),
          camLimit: Math.min(Math.max(Number(camLimit) || 8, 1), 16),
          openMic: openMic !== undefined ? Boolean(openMic) : true,
          operators: [client.user.id],
          bannedUsers: [],
          mutedUsers: [],
          createdAt: Date.now(),
          messages: [],
        };

        rooms[roomId] = newRoom;

        // Auto join creator as host
        client.user.role = 'host';
        client.roomId = roomId;

        ws.send(
          JSON.stringify({
            type: 'room:joined',
            payload: {
              room: {
                id: newRoom.id,
                name: newRoom.name,
                category: newRoom.category,
                topic: newRoom.topic,
                ownerId: newRoom.ownerId,
                ownerName: newRoom.ownerName,
                isPasswordProtected: newRoom.isPasswordProtected,
                maxUsers: newRoom.maxUsers,
                camLimit: newRoom.camLimit,
                openMic: newRoom.openMic,
                operators: newRoom.operators,
                mutedUsers: newRoom.mutedUsers,
                poll: newRoom.poll,
              },
              users: [client.user],
              messages: newRoom.messages,
              currentUser: client.user,
            },
          })
        );

        broadcastToAll({
          type: 'directory:update',
          payload: { rooms: getRoomSummaries() },
        });
        break;
      }

      case 'room:join': {
        const { roomId, password } = payload || {};
        const room = rooms[roomId];
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Room not found' } }));
          return;
        }

        if (room.bannedUsers.includes(client.user.id)) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'You are banned from this room by the host' } }));
          return;
        }

        if (room.isPasswordProtected && room.password && room.password !== password) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid room password', requiresPassword: true } }));
          return;
        }

        const roomUsers = getRoomUsers(roomId);
        if (roomUsers.length >= room.maxUsers) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Room has reached maximum capacity' } }));
          return;
        }

        // Leave previous room if any
        if (client.roomId && client.roomId !== roomId) {
          const oldRoomId = client.roomId;
          client.roomId = undefined;
          broadcastToRoom(oldRoomId, {
            type: 'room:user_left',
            payload: { userId: client.user.id, userName: client.user.name, users: getRoomUsers(oldRoomId) },
          });
        }

        // Determine user role
        if (room.ownerId === client.user.id) {
          client.user.role = 'host';
        } else if (room.operators.includes(client.user.id)) {
          client.user.role = 'operator';
        } else {
          client.user.role = 'member';
        }

        client.roomId = roomId;
        client.user.isMuted = room.mutedUsers.includes(client.user.id);
        client.user.handRaised = false;

        const updatedUsers = getRoomUsers(roomId);

        // Send room state to the joining user
        ws.send(
          JSON.stringify({
            type: 'room:joined',
            payload: {
              room: {
                id: room.id,
                name: room.name,
                category: room.category,
                topic: room.topic,
                ownerId: room.ownerId,
                ownerName: room.ownerName,
                isPasswordProtected: room.isPasswordProtected,
                maxUsers: room.maxUsers,
                camLimit: room.camLimit,
                openMic: room.openMic,
                operators: room.operators,
                mutedUsers: room.mutedUsers,
                poll: room.poll,
              },
              users: updatedUsers,
              messages: room.messages.slice(-50),
              currentUser: client.user,
            },
          })
        );

        // Notify other room users
        broadcastToRoom(
          roomId,
          {
            type: 'room:user_joined',
            payload: { user: client.user, users: updatedUsers },
          },
          ws
        );

        // Add system message in chat
        const joinMsg: ChatMessage = {
          id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          roomId,
          senderId: 'system',
          senderName: 'System',
          senderRole: 'system',
          senderColor: '#10b981',
          text: `${client.user.name} entered the room`,
          type: 'system',
          timestamp: Date.now(),
        };
        room.messages.push(joinMsg);
        if (room.messages.length > 200) room.messages.shift();
        broadcastToRoom(roomId, { type: 'chat:message', payload: joinMsg });

        // Update directory summary
        broadcastToAll({
          type: 'directory:update',
          payload: { rooms: getRoomSummaries() },
        });
        break;
      }

      case 'room:leave': {
        if (!client.roomId) return;
        const currentRoomId = client.roomId;
        client.roomId = undefined;
        client.user.hasCam = false;
        client.user.handRaised = false;

        const remainingUsers = getRoomUsers(currentRoomId);
        broadcastToRoom(currentRoomId, {
          type: 'room:user_left',
          payload: { userId: client.user.id, userName: client.user.name, users: remainingUsers },
        });

        ws.send(JSON.stringify({ type: 'room:left', payload: { roomId: currentRoomId } }));

        broadcastToAll({
          type: 'directory:update',
          payload: { rooms: getRoomSummaries() },
        });
        break;
      }

      case 'chat:send': {
        const { text, textColor, isBold, isItalic } = payload || {};
        if (!client.roomId || !text || !text.trim()) return;
        const room = rooms[client.roomId];
        if (!room) return;

        if (room.mutedUsers.includes(client.user.id) || client.user.isMuted) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'You are currently muted in this room' } }));
          return;
        }

        const newMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          roomId: client.roomId,
          senderId: client.user.id,
          senderName: client.user.name,
          senderRole: client.user.role,
          senderColor: client.user.color,
          text: text.trim().substring(0, 500),
          type: 'chat',
          textColor: textColor || '#f3f4f6',
          isBold: Boolean(isBold),
          isItalic: Boolean(isItalic),
          timestamp: Date.now(),
        };

        room.messages.push(newMsg);
        if (room.messages.length > 200) room.messages.shift();

        broadcastToRoom(client.roomId, {
          type: 'chat:message',
          payload: newMsg,
        });
        break;
      }

      case 'chat:whisper': {
        // Direct private message inside room
        const { targetUserId, text } = payload || {};
        if (!targetUserId || !text || !text.trim()) return;

        const pmMsg: ChatMessage = {
          id: `pm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          roomId: client.roomId || 'direct',
          senderId: client.user.id,
          senderName: client.user.name,
          senderRole: client.user.role,
          senderColor: client.user.color,
          recipientId: targetUserId,
          text: text.trim().substring(0, 500),
          type: 'whisper',
          timestamp: Date.now(),
        };

        // Send to target and back to sender
        sendToUser(targetUserId, { type: 'chat:whisper', payload: pmMsg });
        ws.send(JSON.stringify({ type: 'chat:whisper', payload: pmMsg }));
        break;
      }

      case 'gift:send': {
        const { gift, targetUserId, targetUserName } = payload || {};
        if (!client.roomId || !gift) return;
        const room = rooms[client.roomId];
        if (!room) return;

        const giftMsg: ChatMessage = {
          id: `gift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          roomId: client.roomId,
          senderId: client.user.id,
          senderName: client.user.name,
          senderRole: client.user.role,
          senderColor: client.user.color,
          text: targetUserName
            ? `sent a ${gift.name} ${gift.icon} to @${targetUserName}!`
            : `sent a ${gift.name} ${gift.icon} to the room! 🎉`,
          type: 'gift',
          gift: {
            ...gift,
            targetName: targetUserName,
          },
          timestamp: Date.now(),
        };

        room.messages.push(giftMsg);
        if (room.messages.length > 200) room.messages.shift();

        broadcastToRoom(client.roomId, {
          type: 'chat:message',
          payload: giftMsg,
        });

        // Trigger celebratory animation across room
        broadcastToRoom(client.roomId, {
          type: 'gift:animation',
          payload: {
            gift,
            senderName: client.user.name,
            targetUserName,
          },
        });
        break;
      }

      case 'cam:toggle': {
        const { hasCam, hasMic } = payload || {};
        if (!client.roomId) return;
        const room = rooms[client.roomId];
        if (!room) return;

        if (hasCam) {
          const currentCamCount = getRoomUsers(client.roomId).filter((u) => u.hasCam).length;
          if (currentCamCount >= room.camLimit && !client.user.hasCam) {
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { message: `Camera broadcast limit (${room.camLimit}) reached for this room.` },
              })
            );
            return;
          }
        }

        client.user.hasCam = Boolean(hasCam);
        if (hasMic !== undefined) client.user.hasMic = Boolean(hasMic);

        const updatedUsers = getRoomUsers(client.roomId);

        broadcastToRoom(client.roomId, {
          type: 'cam:status_changed',
          payload: {
            userId: client.user.id,
            hasCam: client.user.hasCam,
            hasMic: client.user.hasMic,
            users: updatedUsers,
          },
        });

        broadcastToAll({
          type: 'directory:update',
          payload: { rooms: getRoomSummaries() },
        });
        break;
      }

      case 'mic:toggle': {
        const { hasMic } = payload || {};
        if (!client.roomId) return;
        client.user.hasMic = Boolean(hasMic);

        broadcastToRoom(client.roomId, {
          type: 'room:user_updated',
          payload: { user: client.user, users: getRoomUsers(client.roomId) },
        });
        break;
      }

      case 'room:raise_hand': {
        if (!client.roomId) return;
        client.user.handRaised = !client.user.handRaised;

        broadcastToRoom(client.roomId, {
          type: 'room:user_updated',
          payload: { user: client.user, users: getRoomUsers(client.roomId) },
        });
        break;
      }

      // Moderation actions
      case 'mod:mute_user': {
        const { targetUserId, isMuted } = payload || {};
        if (!client.roomId) return;
        const room = rooms[client.roomId];
        if (!room) return;

        // Check if requester has authority
        if (room.ownerId !== client.user.id && !room.operators.includes(client.user.id)) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Operator permissions required' } }));
          return;
        }

        if (isMuted) {
          if (!room.mutedUsers.includes(targetUserId)) room.mutedUsers.push(targetUserId);
        } else {
          room.mutedUsers = room.mutedUsers.filter((id) => id !== targetUserId);
        }

        // Update target connection if connected
        connections.forEach((conn) => {
          if (conn.user.id === targetUserId && conn.roomId === client.roomId) {
            conn.user.isMuted = Boolean(isMuted);
          }
        });

        broadcastToRoom(client.roomId, {
          type: 'room:user_muted',
          payload: {
            targetUserId,
            isMuted: Boolean(isMuted),
            users: getRoomUsers(client.roomId),
          },
        });
        break;
      }

      case 'mod:kick_user': {
        const { targetUserId, reason } = payload || {};
        if (!client.roomId) return;
        const room = rooms[client.roomId];
        if (!room) return;

        if (room.ownerId !== client.user.id && !room.operators.includes(client.user.id)) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Operator permissions required' } }));
          return;
        }

        let kickedName = '';
        connections.forEach((conn, clientWs) => {
          if (conn.user.id === targetUserId && conn.roomId === client.roomId) {
            kickedName = conn.user.name;
            conn.roomId = undefined;
            conn.user.hasCam = false;
            clientWs.send(
              JSON.stringify({
                type: 'room:kicked',
                payload: { message: reason || 'You were removed from the room by an operator' },
              })
            );
          }
        });

        const remainingUsers = getRoomUsers(client.roomId);
        broadcastToRoom(client.roomId, {
          type: 'room:user_left',
          payload: { userId: targetUserId, userName: kickedName, users: remainingUsers },
        });

        const sysMsg: ChatMessage = {
          id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          roomId: client.roomId,
          senderId: 'system',
          senderName: 'System',
          senderRole: 'system',
          senderColor: '#ef4444',
          text: `${kickedName || 'User'} was kicked by ${client.user.name}`,
          type: 'system',
          timestamp: Date.now(),
        };
        room.messages.push(sysMsg);
        broadcastToRoom(client.roomId, { type: 'chat:message', payload: sysMsg });
        break;
      }

      case 'mod:ban_user': {
        const { targetUserId, reason } = payload || {};
        if (!client.roomId) return;
        const room = rooms[client.roomId];
        if (!room) return;

        if (room.ownerId !== client.user.id) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Only room host can ban users' } }));
          return;
        }

        if (!room.bannedUsers.includes(targetUserId)) {
          room.bannedUsers.push(targetUserId);
        }

        let bannedName = '';
        connections.forEach((conn, clientWs) => {
          if (conn.user.id === targetUserId && conn.roomId === client.roomId) {
            bannedName = conn.user.name;
            conn.roomId = undefined;
            conn.user.hasCam = false;
            clientWs.send(
              JSON.stringify({
                type: 'room:banned',
                payload: { message: reason || 'You have been banned from this room by the host' },
              })
            );
          }
        });

        const remainingUsers = getRoomUsers(client.roomId);
        broadcastToRoom(client.roomId, {
          type: 'room:user_left',
          payload: { userId: targetUserId, userName: bannedName, users: remainingUsers },
        });
        break;
      }

      case 'mod:make_operator': {
        const { targetUserId, isOp } = payload || {};
        if (!client.roomId) return;
        const room = rooms[client.roomId];
        if (!room || room.ownerId !== client.user.id) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Only room host can assign operators' } }));
          return;
        }

        if (isOp) {
          if (!room.operators.includes(targetUserId)) room.operators.push(targetUserId);
        } else {
          room.operators = room.operators.filter((id) => id !== targetUserId);
        }

        connections.forEach((conn) => {
          if (conn.user.id === targetUserId && conn.roomId === client.roomId) {
            conn.user.role = isOp ? 'operator' : 'member';
          }
        });

        broadcastToRoom(client.roomId, {
          type: 'room:role_changed',
          payload: {
            targetUserId,
            role: isOp ? 'operator' : 'member',
            users: getRoomUsers(client.roomId),
          },
        });
        break;
      }

      case 'room:update_topic': {
        const { topic } = payload || {};
        if (!client.roomId || topic === undefined) return;
        const room = rooms[client.roomId];
        if (!room) return;

        if (room.ownerId !== client.user.id && !room.operators.includes(client.user.id)) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Operator permissions required' } }));
          return;
        }

        room.topic = topic.trim().substring(0, 200);

        broadcastToRoom(client.roomId, {
          type: 'room:topic_updated',
          payload: { topic: room.topic },
        });

        broadcastToAll({
          type: 'directory:update',
          payload: { rooms: getRoomSummaries() },
        });
        break;
      }

      case 'room:clear_chat': {
        if (!client.roomId) return;
        const room = rooms[client.roomId];
        if (!room) return;

        if (room.ownerId !== client.user.id && !room.operators.includes(client.user.id)) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Operator permissions required' } }));
          return;
        }

        room.messages = [];
        broadcastToRoom(client.roomId, { type: 'chat:cleared' });
        break;
      }

      // Room Polls
      case 'poll:create': {
        const { question, options } = payload || {};
        if (!client.roomId || !question || !options || options.length < 2) return;
        const room = rooms[client.roomId];
        if (!room) return;

        if (room.ownerId !== client.user.id && !room.operators.includes(client.user.id)) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Operator permissions required' } }));
          return;
        }

        const poll: RoomPoll = {
          id: `poll-${Date.now()}`,
          question: question.trim(),
          options: options.map((opt: string, idx: number) => ({
            id: `opt-${idx}`,
            text: opt.trim(),
            votes: 0,
          })),
          voters: {},
          creatorId: client.user.id,
          creatorName: client.user.name,
          createdAt: Date.now(),
          isOpen: true,
        };

        room.poll = poll;
        broadcastToRoom(client.roomId, { type: 'poll:updated', payload: { poll } });
        break;
      }

      case 'poll:vote': {
        const { optionId } = payload || {};
        if (!client.roomId || !optionId) return;
        const room = rooms[client.roomId];
        if (!room || !room.poll || !room.poll.isOpen) return;

        const oldVote = room.poll.voters[client.user.id];
        if (oldVote === optionId) return;

        if (oldVote) {
          const prevOpt = room.poll.options.find((o) => o.id === oldVote);
          if (prevOpt) prevOpt.votes = Math.max(0, prevOpt.votes - 1);
        }

        const newOpt = room.poll.options.find((o) => o.id === optionId);
        if (newOpt) {
          newOpt.votes += 1;
          room.poll.voters[client.user.id] = optionId;
        }

        broadcastToRoom(client.roomId, { type: 'poll:updated', payload: { poll: room.poll } });
        break;
      }

      case 'poll:close': {
        if (!client.roomId) return;
        const room = rooms[client.roomId];
        if (!room || !room.poll) return;

        room.poll.isOpen = false;
        broadcastToRoom(client.roomId, { type: 'poll:updated', payload: { poll: room.poll } });
        break;
      }

      // WebRTC Signaling Relay
      case 'signal:send': {
        const { targetUserId, signal } = payload || {};
        if (!targetUserId || !signal) return;

        sendToUser(targetUserId, {
          type: 'signal:receive',
          payload: {
            senderId: client.user.id,
            senderName: client.user.name,
            signal,
          },
        });
        break;
      }

      // Sound Board Hype Trigger
      case 'room:sound_effect': {
        const { soundId, soundName } = payload || {};
        if (!client.roomId || !soundId) return;

        broadcastToRoom(client.roomId, {
          type: 'room:sound_played',
          payload: {
            soundId,
            soundName,
            senderName: client.user.name,
          },
        });
        break;
      }

      default:
        break;
    }
  }

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Camfrog server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
