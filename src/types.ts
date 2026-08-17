export type UserRole = 'owner' | 'host' | 'operator' | 'member' | 'guest';
export type UserStatus = 'online' | 'away' | 'busy';

export interface ClientUser {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  color: string;
  hasCam: boolean;
  hasMic: boolean;
  isMuted: boolean;
  handRaised: boolean;
  joinedAt: number;
}

export interface VirtualGift {
  id: string;
  name: string;
  icon: string;
  cost: number;
  effect: 'confetti' | 'hearts' | 'fire' | 'stars' | 'disco';
}

export interface ChatMessage {
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

export interface RoomPollOption {
  id: string;
  text: string;
  votes: number;
}

export interface RoomPoll {
  id: string;
  question: string;
  options: RoomPollOption[];
  voters: Record<string, string>; // userId -> optionId
  creatorId: string;
  creatorName: string;
  createdAt: number;
  isOpen: boolean;
}

export interface RoomSummary {
  id: string;
  name: string;
  category: string;
  topic: string;
  ownerId: string;
  ownerName: string;
  isPasswordProtected: boolean;
  maxUsers: number;
  camLimit: number;
  openMic: boolean;
  userCount: number;
  camCount: number;
  createdAt: number;
}

export interface RoomDetail {
  id: string;
  name: string;
  category: string;
  topic: string;
  ownerId: string;
  ownerName: string;
  isPasswordProtected: boolean;
  maxUsers: number;
  camLimit: number;
  openMic: boolean;
  operators: string[];
  mutedUsers: string[];
  poll?: RoomPoll;
}

export interface PrivateConversation {
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: UserRole;
  userStatus: UserStatus;
  messages: ChatMessage[];
  unreadCount: number;
}

export type VideoFilterType =
  | 'none'
  | 'warm'
  | 'cool'
  | 'studio'
  | 'cyberpunk'
  | 'vintage'
  | 'bw'
  | 'blur';

export type SoundFx =
  | 'applause'
  | 'airhorn'
  | 'drumroll'
  | 'ba-dum-tss'
  | 'laser'
  | 'tada'
  | 'bell'
  | 'laugh';

export interface SoundEffectItem {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface GuestVideoSlot {
  slotNumber: 1 | 2 | 3;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  userColor?: string;
  isOccupied: boolean;
  isMuted?: boolean;
  hasCam?: boolean;
  stream?: MediaStream;
}

export interface PrivateVideoCallSession {
  callId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  partnerColor?: string;
  status: 'calling' | 'incoming' | 'connected' | 'ended';
  isMuted: boolean;
  isVideoOff: boolean;
  startedAt?: number;
}
