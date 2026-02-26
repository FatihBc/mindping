import { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  List,
  FAB,
  Text,
  Surface,
  IconButton,
  Badge,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getFriends, getCurrentUser } from '@/services/storage';
import { Avatar } from '@/components/Avatar';
import { useIncomingPings } from '@/hooks/useIncomingPings';
import type { Friend, User } from '@/types/index';
import '../../src/i18n';

export default function FriendsScreen() {
  const { t } = useTranslation();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { unreadCount } = useIncomingPings();

  const loadData = async () => {
    setFriends(await getFriends());
    setCurrentUser(await getCurrentUser());
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <Surface style={styles.friendCard} elevation={1}>
      <List.Item
        title={item.displayName}
        description={`@${item.username}`}
        left={() => (
          <Avatar
            username={item.username}
            style={item.avatarStyle}
            size={48}
          />
        )}
        right={() => (
          <IconButton
            icon="send"
            size={24}
            onPress={() => router.push(`/ping/${item.id}`)}
          />
        )}
        onPress={() => router.push(`/friend/${item.id}`)}
      />
    </Surface>
  );

  return (
    <View style={styles.container}>
      {currentUser && (
        <Surface style={styles.myCard} elevation={2}>
          <List.Item
            title={t('myCode')}
            description={`@${currentUser.username}`}
            left={() => (
              <Avatar
                username={currentUser.username}
                style={currentUser.avatarStyle}
                size={48}
              />
            )}
            right={() => <IconButton icon="qrcode" size={28} />}
            onPress={() => router.push('/my-qr')}
          />
        </Surface>
      )}

      {unreadCount > 0 && (
        <Surface style={styles.notificationBanner} elevation={2}>
          <Text variant="bodyMedium" style={styles.notificationText}>
            🔔 {unreadCount} yeni dürtme!
          </Text>
        </Surface>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        {t('myFriends')}
      </Text>

      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {t('noFriends')}
          </Text>
        }
      />

      <FAB
        icon="qrcode-scan"
        style={styles.fab}
        onPress={() => router.push('/add-friend')}
        label={t('addFriend')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  myCard: {
    margin: 16,
    borderRadius: 12,
  },
  notificationBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  notificationText: {
    color: 'white',
    textAlign: 'center',
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  friendCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6366f1',
  },
});
