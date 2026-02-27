import { useState, useEffect } from 'react';
import { View, StyleSheet, Vibration } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Text, Button, Surface } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getFriends, incrementSentPings, getCurrentUser, sendPingWithFirebase } from '@/services/storage';
import { sendLocalNotification, requestNotificationPermissions } from '@/services/notifications';
import { Avatar } from '@/components/Avatar';
import type { Friend } from '@/types/index';
import '../../src/i18n';

export default function PingScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [sending, setSending] = useState(false);
  const [lastPing, setLastPing] = useState<number | null>(null);

  useEffect(() => {
    const loadFriend = async () => {
      const friends = await getFriends();
      const found = friends.find((f: Friend) => f.id === id);
      if (found) {
        setFriend(found);
      }
      requestNotificationPermissions();
    };
    loadFriend();
  }, [id]);

  const handlePing = async () => {
    if (!friend) return;

    setSending(true);
    Vibration.vibrate(100);

    try {
      // Get current user
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setSending(false);
        return;
      }

      // Send ping via Firebase
      await sendPingWithFirebase(currentUser.id, friend.id);

      // Update daily stats locally
      const today = new Date().toISOString().split('T')[0];
      await incrementSentPings(today);

      // Show local notification
      await sendLocalNotification(
        t('thinkingOfYou'),
        `${t('pingSentTo')} ${friend.displayName}`
      );

      setLastPing(Date.now());
    } catch (error) {
      console.error('Failed to send ping:', error);
    } finally {
      setSending(false);
    }
  };

  if (!friend) {
    return (
      <View style={styles.container}>
        <Text>{t('friendNotFound')}</Text>
        <Button onPress={() => router.back()}>{t('back')}</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.friendCard} elevation={2}>
        <Avatar
          username={friend.username}
          style={friend.avatarStyle}
          size={80}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {friend.displayName}
        </Text>
        <Text variant="bodyMedium" style={styles.username}>
          @{friend.username}
        </Text>
      </Surface>

      <Surface style={styles.pingSection} elevation={1}>
        <Text variant="titleLarge" style={styles.pingTitle}>
          {t('sendPing')}
        </Text>
        <Text variant="bodyMedium" style={styles.pingDesc}>
          "{t('thinkingOfYou')}" {t('message')}
        </Text>

        <Button
          mode="contained"
          onPress={handlePing}
          loading={sending}
          disabled={sending}
          style={styles.pingButton}
          contentStyle={styles.pingButtonContent}
          labelStyle={styles.pingButtonLabel}
        >
          💖 {t('ping').toUpperCase()}
        </Button>

        {lastPing && (
          <Text variant="bodySmall" style={styles.lastPing}>
            {t('lastPing', { time: new Date(lastPing).toLocaleTimeString() })}
          </Text>
        )}
      </Surface>

      <Button
        mode="outlined"
        onPress={() => router.push(`/friend/${friend.id}`)}
        style={styles.statsButton}
      >
        {t('viewStats')}
      </Button>

      <Button onPress={() => router.back()} style={styles.backButton}>
        {t('back')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  friendCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  name: {
    marginTop: 12,
    marginBottom: 4,
  },
  username: {
    opacity: 0.6,
  },
  pingSection: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  pingTitle: {
    marginBottom: 8,
  },
  pingDesc: {
    marginBottom: 24,
    opacity: 0.7,
  },
  pingButton: {
    width: '100%',
    borderRadius: 50,
    backgroundColor: '#6366f1',
  },
  pingButtonContent: {
    height: 80,
  },
  pingButtonLabel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  lastPing: {
    marginTop: 16,
    opacity: 0.5,
  },
  statsButton: {
    marginTop: 16,
  },
  backButton: {
    marginTop: 8,
  },
});
