import { useEffect, useState, useCallback } from 'react';
import { listenToIncomingPings, markPingAsRead } from '@/services/firebase-db';
import { addPing, incrementReceivedPings, getCurrentUser } from '@/services/storage';
import type { Ping } from '@/types/index';

export function useIncomingPings() {
  const [unreadPings, setUnreadPings] = useState<Ping[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) {
        setUserId(user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = listenToIncomingPings(userId, async (pings) => {
      setUnreadPings(pings);
      setUnreadCount(pings.length);

      // Save pings locally and update stats (but don't mark as read yet)
      for (const ping of pings) {
        await addPing(ping);

        const today = new Date().toISOString().split('T')[0];
        await incrementReceivedPings(today);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Mark pings from a specific friend as read
  const markFriendPingsAsRead = async (friendId: string) => {
    const pingsToMark = unreadPings.filter(ping => ping.senderId === friendId);
    for (const ping of pingsToMark) {
      await markPingAsRead(ping.id);
    }
    // Update local state
    setUnreadPings(prev => prev.filter(ping => ping.senderId !== friendId));
    setUnreadCount(prev => prev - pingsToMark.length);
  };

  return { unreadPings, unreadCount, markFriendPingsAsRead };
}
