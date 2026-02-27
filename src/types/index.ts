export interface User {
  id: string;
  username: string;
  friendCode: string;  // Unique code for adding friends
  displayName: string;
  avatarStyle?: string;
  avatarSeed?: string;
  language?: string;
  pushToken?: string;  // Expo push notification token
  createdAt: number;
}

export interface Friend {
  id: string;
  username: string;
  friendCode: string;
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

export interface Notification {
  id: string;
  type: 'account_deleted';
  userId: string; // User who will receive this notification
  deletedUserId: string; // User who deleted their account
  deletedUsername: string;
  deletedDisplayName: string;
  timestamp: number;
  read: boolean;
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
  { value: 'adventurer-neutral', label: 'Adventurer Neutral' },
  { value: 'avataaars', label: 'Avataaars' },
  { value: 'avataaars-neutral', label: 'Avataaars Neutral' },
  { value: 'big-ears', label: 'Big Ears' },
  { value: 'big-ears-neutral', label: 'Big Ears Neutral' },
  { value: 'big-smile', label: 'Big Smile' },
  { value: 'bottts', label: 'Bottts' },
  { value: 'bottts-neutral', label: 'Bottts Neutral' },
  { value: 'croodles', label: 'Croodles' },
  { value: 'croodles-neutral', label: 'Croodles Neutral' },
  { value: 'fun-emoji', label: 'Fun Emoji' },
  { value: 'icons', label: 'Icons' },
  { value: 'identicon', label: 'Identicon' },
  { value: 'lorelei', label: 'Lorelei' },
  { value: 'lorelei-neutral', label: 'Lorelei Neutral' },
  { value: 'micah', label: 'Micah' },
  { value: 'miniavs', label: 'Miniavs' },
  { value: 'notionists', label: 'Notionists' },
  { value: 'notionists-neutral', label: 'Notionists Neutral' },
  { value: 'open-peeps', label: 'Open Peeps' },
  { value: 'personas', label: 'Personas' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'pixel-art-neutral', label: 'Pixel Art Neutral' },
  { value: 'rings', label: 'Rings' },
  { value: 'shapes', label: 'Shapes' },
  { value: 'thumbs', label: 'Thumbs' },
];
