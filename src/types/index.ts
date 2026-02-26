export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarStyle?: string;
  avatarSeed?: string;
  language?: string;
  createdAt: number;
}

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarStyle?: string;
  avatarSeed?: string;
  addedAt: number;
  lastPingAt?: number;
}

export interface Ping {
  id: string;
  senderId: string;
  receiverId: string;
  timestamp: number;
  read?: boolean;
}

export interface DailyStats {
  date: string;
  sent: number;
  received: number;
}

export interface FriendStats {
  friendId: string;
  last7Days: DailyStats[];
}

export const AVATAR_STYLES = [
  { value: 'adventurer', label: 'Adventurer' },
  { value: 'avataaars', label: 'Avataaars' },
  { value: 'big-ears', label: 'Big Ears' },
  { value: 'bottts', label: 'Bottts' },
  { value: 'fun-emoji', label: 'Fun Emoji' },
  { value: 'lorelei', label: 'Lorelei' },
  { value: 'micah', label: 'Micah' },
  { value: 'notionists', label: 'Notionists' },
  { value: 'open-peeps', label: 'Open Peeps' },
  { value: 'pixel-art', label: 'Pixel Art' },
];
