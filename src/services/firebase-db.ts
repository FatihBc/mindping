import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, Friend, Ping, Notification } from '@/types/index';

const USERS_COLLECTION = 'users';
const PINGS_COLLECTION = 'pings';
const FRIENDSHIPS_COLLECTION = 'friendships';
const NOTIFICATIONS_COLLECTION = 'notifications';

// User Operations
export const createOrUpdateUser = async (user: User): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, user.id);
  await setDoc(userRef, {
    ...user,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return snapshot.data() as User;
  }
  return null;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('username', '==', username.toLowerCase())
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0].data() as User;
  }
  return null;
};

export const getUserByFriendCode = async (friendCode: string): Promise<User | null> => {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('friendCode', '==', friendCode.toUpperCase())
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0].data() as User;
  }
  return null;
};

// Ping Operations
export const sendPing = async (
  senderId: string,
  receiverId: string
): Promise<string> => {
  console.log('Firebase sendPing called:', { senderId, receiverId });
  const pingData = {
    senderId,
    receiverId,
    timestamp: Date.now(),
    read: false,
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, PINGS_COLLECTION), pingData);
    console.log('Firebase ping sent, ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Firebase sendPing error:', error);
    throw error;
  }
};

export const markPingAsRead = async (pingId: string): Promise<void> => {
  const pingRef = doc(db, PINGS_COLLECTION, pingId);
  await updateDoc(pingRef, { read: true });
};

// Realtime Listeners
export const listenToIncomingPings = (
  userId: string,
  callback: (pings: Ping[]) => void
) => {
  console.log('Setting up incoming pings listener for userId:', userId);
  const q = query(
    collection(db, PINGS_COLLECTION),
    where('receiverId', '==', userId),
    where('read', '==', false),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    console.log('Incoming pings snapshot received, count:', snapshot.size);
    const pings: Ping[] = [];
    snapshot.forEach((doc) => {
      pings.push({ id: doc.id, ...doc.data() } as Ping);
    });
    console.log('Pings in snapshot:', pings);
    callback(pings);
  }, (error) => {
    console.error('Error in listenToIncomingPings:', error);
  });
};

export const listenToPingCount = (
  userId: string,
  callback: (count: number) => void
) => {
  const q = query(
    collection(db, PINGS_COLLECTION),
    where('receiverId', '==', userId),
    where('read', '==', false)
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  });
};

// Get ping history between two users
export const getPingsBetweenUsers = async (
  userId1: string,
  userId2: string,
  since: number
): Promise<Ping[]> => {
  const q = query(
    collection(db, PINGS_COLLECTION),
    where('timestamp', '>=', since),
    orderBy('timestamp', 'desc')
  );

  const snapshot = await getDocs(q);
  const pings: Ping[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (
      (data.senderId === userId1 && data.receiverId === userId2) ||
      (data.senderId === userId2 && data.receiverId === userId1)
    ) {
      pings.push({ id: doc.id, ...data } as Ping);
    }
  });

  return pings;
};

// Friendship Operations
export const createFriendship = async (
  userId: string,
  friendId: string
): Promise<void> => {
  const friendshipId = [userId, friendId].sort().join('_');
  const friendshipRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId);

  await setDoc(friendshipRef, {
    userId,
    friendId,
    createdAt: serverTimestamp(),
  });
};

export const getFriendships = async (userId: string): Promise<string[]> => {
  const q1 = query(
    collection(db, FRIENDSHIPS_COLLECTION),
    where('userId', '==', userId)
  );
  const q2 = query(
    collection(db, FRIENDSHIPS_COLLECTION),
    where('friendId', '==', userId)
  );

  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const friendIds = new Set<string>();
  snapshot1.forEach((doc) => friendIds.add(doc.data().friendId));
  snapshot2.forEach((doc) => friendIds.add(doc.data().userId));

  return Array.from(friendIds);
};

// Notification Operations
export const sendAccountDeletionNotification = async (
  deletedUser: User,
  friendIds: string[]
): Promise<void> => {
  const timestamp = Date.now();
  const notifications = friendIds.map((friendId) => ({
    type: 'account_deleted' as const,
    userId: friendId,
    deletedUserId: deletedUser.id,
    deletedUsername: deletedUser.username,
    deletedDisplayName: deletedUser.displayName,
    timestamp,
    read: false,
    createdAt: serverTimestamp(),
  }));

  const promises = notifications.map((notification) =>
    addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification)
  );

  await Promise.all(promises);
};

export const getUnreadNotifications = async (userId: string): Promise<Notification[]> => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    where('read', '==', false),
    orderBy('timestamp', 'desc')
  );

  const snapshot = await getDocs(q);
  const notifications: Notification[] = [];
  snapshot.forEach((doc) => {
    notifications.push({ id: doc.id, ...doc.data() } as Notification);
  });

  return notifications;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(notificationRef, { read: true });
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  await deleteDoc(notificationRef);
};

export const listenToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    where('read', '==', false),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = [];
    snapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as Notification);
    });
    callback(notifications);
  });
};

// Get users who have added the current user as friend
export const getUsersWhoAddedMe = async (userId: string): Promise<User[]> => {
  const friendIds = await getFriendships(userId);

  if (friendIds.length === 0) {
    return [];
  }

  const users: User[] = [];
  for (const friendId of friendIds) {
    const user = await getUserById(friendId);
    if (user) {
      users.push(user);
    }
  }

  return users;
};
