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
import type { User, Friend, Ping } from '@/types/index';

const USERS_COLLECTION = 'users';
const PINGS_COLLECTION = 'pings';
const FRIENDSHIPS_COLLECTION = 'friendships';

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

// Ping Operations
export const sendPing = async (
  senderId: string,
  receiverId: string
): Promise<string> => {
  const pingData = {
    senderId,
    receiverId,
    timestamp: Date.now(),
    read: false,
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, PINGS_COLLECTION), pingData);
  return docRef.id;
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
  const q = query(
    collection(db, PINGS_COLLECTION),
    where('receiverId', '==', userId),
    where('read', '==', false),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const pings: Ping[] = [];
    snapshot.forEach((doc) => {
      pings.push({ id: doc.id, ...doc.data() } as Ping);
    });
    callback(pings);
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
