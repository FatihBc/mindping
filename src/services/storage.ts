import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Friend, Ping, DailyStats, FriendStats } from '../types';
import {
  createOrUpdateUser,
  sendPing as sendPingToFirebase,
  createFriendship,
  getUserByUsername,
} from './firebase-db';

const KEYS = {
  CURRENT_USER: 'current_user',
  FRIENDS: 'friends',
  PINGS: 'pings',
  STATS: 'stats',
};

// User
export const getCurrentUser = async (): Promise<User | null> => {
  const data = await AsyncStorage.getItem(KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  // Sync to Firebase
  try {
    await createOrUpdateUser(user);
  } catch (error) {
    console.warn('Failed to sync user to Firebase:', error);
  }
};

export const updateUser = async (updates: Partial<User>): Promise<User | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const updated = { ...user, ...updates };
  await setCurrentUser(updated);
  return updated;
};

// Friends
export const getFriends = async (): Promise<Friend[]> => {
  const data = await AsyncStorage.getItem(KEYS.FRIENDS);
  return data ? JSON.parse(data) : [];
};

export const addFriend = async (friend: Friend): Promise<void> => {
  const friends = await getFriends();
  if (friends.find((f: Friend) => f.id === friend.id)) return;
  await AsyncStorage.setItem(KEYS.FRIENDS, JSON.stringify([...friends, friend]));
  // Sync to Firebase
  try {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await createFriendship(currentUser.id, friend.id);
    }
  } catch (error) {
    console.warn('Failed to sync friendship to Firebase:', error);
  }
};

export const removeFriend = async (friendId: string): Promise<void> => {
  const friends = await getFriends();
  await AsyncStorage.setItem(
    KEYS.FRIENDS,
    JSON.stringify(friends.filter(f => f.id !== friendId))
  );
};

export const updateFriend = async (friendId: string, updates: Partial<Friend>): Promise<void> => {
  const friends = await getFriends();
  const updated = friends.map(f =>
    f.id === friendId ? { ...f, ...updates } : f
  );
  await AsyncStorage.setItem(KEYS.FRIENDS, JSON.stringify(updated));
};

// Pings
export const getPings = async (): Promise<Ping[]> => {
  const data = await AsyncStorage.getItem(KEYS.PINGS);
  return data ? JSON.parse(data) : [];
};

export const addPing = async (ping: Ping): Promise<void> => {
  const pings = await getPings();
  await AsyncStorage.setItem(KEYS.PINGS, JSON.stringify([...pings, ping]));
};

export const getPingsBetweenUsers = async (
  userId1: string,
  userId2: string,
  since: number
): Promise<Ping[]> => {
  const pings = await getPings();
  return pings.filter(
    p =>
      p.timestamp >= since &&
      ((p.senderId === userId1 && p.receiverId === userId2) ||
        (p.senderId === userId2 && p.receiverId === userId1))
  );
};

// Stats
export const getDailyStats = async (date: string): Promise<DailyStats> => {
  const key = `${KEYS.STATS}_${date}`;
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : { date, sent: 0, received: 0 };
};

export const incrementSentPings = async (date: string): Promise<void> => {
  const stats = await getDailyStats(date);
  await AsyncStorage.setItem(
    `${KEYS.STATS}_${date}`,
    JSON.stringify({ ...stats, sent: stats.sent + 1 })
  );
};

export const incrementReceivedPings = async (date: string): Promise<void> => {
  const stats = await getDailyStats(date);
  await AsyncStorage.setItem(
    `${KEYS.STATS}_${date}`,
    JSON.stringify({ ...stats, received: stats.received + 1 })
  );
};

export const getLast7DaysStats = async (friendId?: string): Promise<DailyStats[]> => {
  const stats: DailyStats[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime());
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    stats.push(await getDailyStats(dateStr));
  }

  return stats;
};

export const getFriendStats = async (friendId: string): Promise<FriendStats> => {
  return {
    friendId,
    last7Days: await getLast7DaysStats(friendId),
  };
};

// Helper
export const clearAllData = async (): Promise<void> => {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys);
};

// Find user by username from Firebase
export const findUserByUsername = async (username: string): Promise<User | null> => {
  try {
    return await getUserByUsername(username);
  } catch (error) {
    console.warn('Failed to find user:', error);
    return null;
  }
};

// Send ping with Firebase sync
export const sendPingWithFirebase = async (
  senderId: string,
  receiverId: string
): Promise<string | null> => {
  try {
    // Send to Firebase
    const pingId = await sendPingToFirebase(senderId, receiverId);

    // Also save locally
    const ping: Ping = {
      id: pingId,
      senderId,
      receiverId,
      timestamp: Date.now(),
      read: false,
    };
    await addPing(ping);

    return pingId;
  } catch (error) {
    console.warn('Failed to send ping to Firebase:', error);
    // Fallback to local only
    const ping: Ping = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      senderId,
      receiverId,
      timestamp: Date.now(),
      read: false,
    };
    await addPing(ping);
    return null;
  }
};
