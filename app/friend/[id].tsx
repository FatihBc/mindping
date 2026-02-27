import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Text, Surface, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import {
  getFriends,
  getPingsBetweenUsers,
  getCurrentUser,
} from '../../src/services/storage';
import { Avatar } from '../../src/components/Avatar';
import { colors } from '../../src/theme/colors';
import { useTheme } from '../../src/context/ThemeContext';
import type { Friend, Ping } from '../../src/types/index';
import '../../src/i18n';

interface HourlyPing {
  hour: number;
  sent: Ping[];
  received: Ping[];
}

interface DayStats {
  day: string;
  date: string;
  sent: number;
  received: number;
}

export default function FriendDetailScreen() {
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [todaySent, setTodaySent] = useState(0);
  const [todayReceived, setTodayReceived] = useState(0);
  const [hourlyPings, setHourlyPings] = useState<HourlyPing[]>([]);
  const [weekStats, setWeekStats] = useState<DayStats[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const friends = await getFriends();
    const found = friends.find((f: Friend) => f.id === id);
    if (found) {
      setFriend(found);
      await loadTodayStats(found.id);
      await loadWeekStats(found.id);
    }
  };

  const loadTodayStats = async (friendId: string) => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const pings = await getPingsBetweenUsers(currentUser.id, friendId, todayStart);

    const todayPings = pings.filter(
      (p: Ping) => p.timestamp >= todayStart && p.timestamp < todayEnd
    );

    const sent = todayPings.filter((p: Ping) => p.senderId === currentUser.id);
    const received = todayPings.filter((p: Ping) => p.receiverId === currentUser.id);

    setTodaySent(sent.length);
    setTodayReceived(received.length);

    // Group by hour
    const hourlyData: HourlyPing[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = todayStart + hour * 60 * 60 * 1000;
      const hourEnd = hourStart + 60 * 60 * 1000;

      const hourSent = sent.filter(
        (p: Ping) => p.timestamp >= hourStart && p.timestamp < hourEnd
      );
      const hourReceived = received.filter(
        (p: Ping) => p.timestamp >= hourStart && p.timestamp < hourEnd
      );

      hourlyData.push({
        hour,
        sent: hourSent,
        received: hourReceived,
      });
    }

    setHourlyPings(hourlyData);
  };

  const loadWeekStats = async (friendId: string) => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    const days: DayStats[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dateStr = date.toLocaleDateString(i18n.language, { 
        month: 'short', 
        day: 'numeric' 
      });
      const dayName = date.toLocaleDateString(i18n.language, { weekday: 'short' });

      const pings = await getPingsBetweenUsers(currentUser.id, friendId, dayStart);
      const dayPings = pings.filter(
        (p: Ping) => p.timestamp >= dayStart && p.timestamp < dayEnd
      );

      const daySent = dayPings.filter((p: Ping) => p.senderId === currentUser.id).length;
      const dayReceived = dayPings.filter((p: Ping) => p.receiverId === currentUser.id).length;

      days.push({
        day: dayName,
        date: dateStr,
        sent: daySent,
        received: dayReceived,
      });
    }

    setWeekStats(days);
  };

  if (!friend) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Bordo header */}
      <Surface style={[styles.headerCard, { backgroundColor: colors.primary[800] }]} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton
            icon="arrow-left"
            onPress={() => router.back()}
            iconColor="white"
            size={24}
            style={styles.backButton}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>
            {friend.displayName}
          </Text>
        </View>
      </Surface>

      <ScrollView style={styles.scrollContent}>
        {/* Avatar and Ping Button */}
        <Surface style={[styles.actionCard, { backgroundColor: theme.card }]} elevation={1}>
          <Avatar username={friend.username} style={friend.avatarStyle} size={80} />
          <IconButton
            icon="send"
            size={32}
            onPress={() => router.push(`/ping/${friend.id}`)}
            iconColor={isDark ? '#da0000' : '#780000'}
            style={styles.pingButton}
          />
        </Surface>

        {/* Today's Stats and 24-Hour Timeline */}
        <Surface style={[styles.timelineCard, { backgroundColor: theme.card }]} elevation={1}>
          <View style={styles.todayStatsRow}>
            <View style={styles.statBox}>
              <Text variant="headlineMedium" style={{ color: isDark ? '#da0000' : '#780000' }}>
                {todaySent}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                Gönderilen
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="headlineMedium" style={{ color: '#3b82f6' }}>
                {todayReceived}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                Alınan
              </Text>
            </View>
          </View>

          {/* 24-Hour Timeline */}
          <View style={styles.timelineContainer}>
            {/* Sent pings row (top) */}
            <View style={styles.pingsRow}>
              {hourlyPings.map((hourData) => (
                <View key={`sent-${hourData.hour}`} style={styles.hourColumn}>
                  {hourData.sent.map((ping, idx) => (
                    <Text key={`s-${idx}`} style={styles.sentArrow}>
                      ↑
                    </Text>
                  ))}
                </View>
              ))}
            </View>

            {/* Timeline line */}
            <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />

            {/* Received pings row (bottom) */}
            <View style={styles.pingsRow}>
              {hourlyPings.map((hourData) => (
                <View key={`received-${hourData.hour}`} style={styles.hourColumn}>
                  {hourData.received.map((ping, idx) => (
                    <Text key={`r-${idx}`} style={styles.receivedArrow}>
                      ↓
                    </Text>
                  ))}
                </View>
              ))}
            </View>

            {/* Hour labels */}
            <View style={styles.hoursRow}>
              {Array.from({ length: 24 }, (_, i) => (
                <Text
                  key={i}
                  style={[
                    styles.hourLabel,
                    { color: theme.textMuted },
                    i % 3 !== 0 && styles.hourLabelHidden,
                  ]}
                >
                  {i % 3 === 0 ? i : ''}
                </Text>
              ))}
            </View>
          </View>
        </Surface>

        {/* Last 7 Days Stats */}
        <Surface style={[styles.weekCard, { backgroundColor: theme.card }]} elevation={1}>
          <Text variant="titleMedium" style={[styles.weekTitle, { color: theme.text }]}>
            Son 7 Gün
          </Text>
          {weekStats.map((day, index) => (
            <View key={index} style={[styles.dayRow, { borderBottomColor: theme.border }]}>
              <View style={styles.dayInfo}>
                <Text variant="bodyMedium" style={{ color: theme.text }}>
                  {day.day}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                  {day.date}
                </Text>
              </View>
              <View style={styles.dayStats}>
                <View style={styles.dayStat}>
                  <Text style={{ color: isDark ? '#da0000' : '#780000', fontSize: 16, fontWeight: '600' }}>
                    {day.sent}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                    Gönderilen
                  </Text>
                </View>
                <View style={styles.dayStat}>
                  <Text style={{ color: '#3b82f6', fontSize: 16, fontWeight: '600' }}>
                    {day.received}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                    Alınan
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  pingButton: {
    margin: 0,
  },
  timelineCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  todayStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
  },
  timelineContainer: {
    marginTop: 8,
  },
  pingsRow: {
    flexDirection: 'row',
    height: 30,
    justifyContent: 'space-between',
  },
  hourColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentArrow: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  receivedArrow: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timelineLine: {
    height: 2,
    marginVertical: 4,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  hourLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
  },
  hourLabelHidden: {
    opacity: 0,
  },
  weekCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  weekTitle: {
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dayInfo: {
    flex: 1,
  },
  dayStats: {
    flexDirection: 'row',
    gap: 24,
  },
  dayStat: {
    alignItems: 'center',
    minWidth: 60,
  },
});
