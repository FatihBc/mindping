import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Text, Button, Surface } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import {
  getFriends,
  getPingsBetweenUsers,
  getDailyStats,
} from '@/services/storage';
import { Avatar } from '@/components/Avatar';
import type { Friend, Ping } from '@/types/index';
import '../../src/i18n';

// Simple Bar Component
const SimpleBar = ({ value, maxValue, color, label }: { value: number; maxValue: number; color: string; label: string }) => {
  const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <View style={styles.barContainer}>
      <View style={[styles.barBackground, { height: 100 }]}>
        <View style={[styles.barFill, { height, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value > 0 ? value : ''}</Text>
      <Text style={styles.barLabel}>{label}</Text>
    </View>
  );
};

interface DayStats {
  day: string;
  sent: number;
  received: number;
}

export default function FriendStatsScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [stats, setStats] = useState<DayStats[]>([]);
  const [totalSent, setTotalSent] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);

  useEffect(() => {
    const loadFriend = async () => {
      const friends = await getFriends();
      const found = friends.find((f: Friend) => f.id === id);
      if (found) {
        setFriend(found);
        await loadStats(found.id);
      }
    };
    loadFriend();
  }, [id]);

  const loadStats = async (friendId: string) => {
    const days: DayStats[] = [];
    const today = new Date();
    let sentTotal = 0;
    let receivedTotal = 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString(i18n.language, { weekday: 'short' });

      // Get stats from storage
      const dailyStats = await getDailyStats(dateStr);

      // Get pings between users
      const dayStart = new Date(dateStr).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const pings = await getPingsBetweenUsers('self', friendId, dayStart);

      const daySent = pings.filter(
        (p: Ping) => p.senderId === 'self' && p.timestamp >= dayStart && p.timestamp < dayEnd
      ).length;
      const dayReceived = pings.filter(
        (p: Ping) => p.receiverId === 'self' && p.timestamp >= dayStart && p.timestamp < dayEnd
      ).length;

      days.push({
        day: dayName,
        sent: daySent,
        received: dayReceived,
      });

      sentTotal += daySent;
      receivedTotal += dayReceived;
    }

    setStats(days);
    setTotalSent(sentTotal);
    setTotalReceived(receivedTotal);
  };

  const barData = stats.map((s) => ({
    label: s.day,
    value: s.sent,
    frontColor: '#6366f1',
    topLabelComponent: () => (
      <Text style={styles.barLabel}>{s.sent > 0 ? s.sent : ''}</Text>
    ),
  }));

  const receivedBarData = stats.map((s) => ({
    label: s.day,
    value: s.received,
    frontColor: '#10b981',
    topLabelComponent: () => (
      <Text style={styles.barLabel}>{s.received > 0 ? s.received : ''}</Text>
    ),
  }));

  if (!friend) {
    return (
      <View style={styles.container}>
        <Text>{t('friendNotFound')}</Text>
        <Button onPress={() => router.back()}>{t('back')}</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Avatar
          username={friend.username}
          style={friend.avatarStyle}
          size={64}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {friend.displayName}
        </Text>
        <Text variant="bodyMedium" style={styles.username}>
          @{friend.username}
        </Text>
      </Surface>

      <Surface style={styles.statsCard} elevation={1}>
        <Text variant="titleMedium" style={styles.statsTitle}>
          {t('last7Days')}
        </Text>
        <View style={styles.totalsRow}>
          <View style={styles.totalBox}>
            <Text variant="headlineMedium" style={styles.totalSent}>
              {totalSent}
            </Text>
            <Text variant="bodySmall">{t('sent')}</Text>
          </View>
          <View style={styles.totalBox}>
            <Text variant="headlineMedium" style={styles.totalReceived}>
              {totalReceived}
            </Text>
            <Text variant="bodySmall">{t('received')}</Text>
          </View>
        </View>
      </Surface>

      {stats.some((s) => s.sent > 0) && (
        <Surface style={styles.chartCard} elevation={1}>
          <Text variant="bodyMedium" style={styles.chartLabel}>
            {t('sent')} {t('ping')}
          </Text>
          <View style={styles.chartContainer}>
            {stats.map((s, i) => (
              <SimpleBar
                key={i}
                value={s.sent}
                maxValue={Math.max(...stats.map((st) => st.sent), 5)}
                color="#6366f1"
                label={s.day}
              />
            ))}
          </View>
        </Surface>
      )}

      {stats.some((s) => s.received > 0) && (
        <Surface style={styles.chartCard} elevation={1}>
          <Text variant="bodyMedium" style={styles.chartLabel}>
            {t('received')} {t('ping')}
          </Text>
          <View style={styles.chartContainer}>
            {stats.map((s, i) => (
              <SimpleBar
                key={i}
                value={s.received}
                maxValue={Math.max(...stats.map((st) => st.received), 5)}
                color="#10b981"
                label={s.day}
              />
            ))}
          </View>
        </Surface>
      )}

      <Button onPress={() => router.back()} style={styles.backButton}>
        {t('back')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    margin: 16,
    borderRadius: 16,
  },
  name: {
    marginTop: 12,
    marginBottom: 4,
  },
  username: {
    opacity: 0.6,
  },
  statsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  statsTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  totalBox: {
    alignItems: 'center',
  },
  totalSent: {
    color: '#6366f1',
  },
  totalReceived: {
    color: '#10b981',
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  chartLabel: {
    marginBottom: 12,
    opacity: 0.7,
  },
  axisLabel: {
    fontSize: 10,
    opacity: 0.6,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 20,
  },
  barContainer: {
    alignItems: 'center',
    width: 30,
  },
  barBackground: {
    width: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barValue: {
    fontSize: 10,
    marginTop: 4,
    color: '#666',
  },
  backButton: {
    margin: 16,
  },
});
