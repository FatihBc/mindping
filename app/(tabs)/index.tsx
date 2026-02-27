import { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  List,
  FAB,
  Text,
  Surface,
  IconButton,
  Badge,
  Appbar,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getFriends, getCurrentUser, removeFriend, updateFriends, savePing, getPingsBetweenUsers } from '../../src/services/storage';
import { logoutUser, deleteUserAccount, getCurrentAuthUser, resendEmailVerification } from '../../src/services/auth';
import { changeLanguage, getAvailableLanguages } from '../../src/i18n';
import { Avatar } from '../../src/components/Avatar';
import { useIncomingPings } from '../../src/hooks/useIncomingPings';
import { colors } from '../../src/theme/colors';
import { useTheme } from '../../src/context/ThemeContext';
import type { Friend, User } from '../../src/types/index';
import '../../src/i18n/index';

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { unreadPings, unreadCount, markFriendPingsAsRead } = useIncomingPings();

  // Calculate ping count per friend
  const getPingCountForFriend = (friendId: string) => {
    return unreadPings.filter(ping => ping.senderId === friendId).length;
  };

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

  const handleMoveFriend = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === friends.length - 1) return;

    const newFriends = [...friends];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap friends
    [newFriends[index], newFriends[targetIndex]] = [newFriends[targetIndex], newFriends[index]];

    setFriends(newFriends);
    await updateFriends(newFriends);
  };

  const handleDeleteFriend = async (friendId: string, friendName: string) => {
    Alert.alert(
      'Arkadaşı Sil',
      `${friendName} arkadaş listenizden silinecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await removeFriend(friendId);
            loadData();
          },
        },
      ]
    );
  };

  const handleSendPing = async (friend: Friend) => {
    if (!currentUser) return;

    // Check last ping time (30 minute cooldown)
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    const recentPings = await getPingsBetweenUsers(currentUser.id, friend.id, thirtyMinutesAgo);
    const lastSentPing = recentPings
      .filter((p: any) => p.senderId === currentUser.id)
      .sort((a: any, b: any) => b.timestamp - a.timestamp)[0];

    if (lastSentPing) {
      const minutesLeft = Math.ceil((lastSentPing.timestamp + 30 * 60 * 1000 - Date.now()) / 60000);
      Alert.alert(
        'Çok Erken! ⏰',
        `${friend.displayName} kişisine ${minutesLeft} dakika sonra tekrar ping gönderebilirsiniz.`,
        [{ text: 'Tamam' }]
      );
      return;
    }

    const ping = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: friend.id,
      timestamp: Date.now(),
      message: 'Aklımdasın',
    };

    await savePing(ping);

    Alert.alert(
      'Ping Gönderildi! 💌',
      `${friend.displayName} kişisine ping gönderildi.`,
      [{ text: 'Tamam' }]
    );
  };

  const renderFriend = ({ item, index }: { item: Friend; index: number }) => {
    const pingCount = getPingCountForFriend(item.id);
    return (
      <Surface style={[styles.friendCard, { backgroundColor: theme.card }]} elevation={1}>
        <List.Item
          title={item.displayName}
          titleStyle={{ color: theme.text }}
          left={() => (
            <Avatar
              username={item.username}
              style={item.avatarStyle}
              size={48}
            />
          )}
          right={() => (
            <View style={styles.actions}>
              {pingCount > 0 && !isEditMode && (
                <Badge style={styles.pingBadge}>{pingCount}</Badge>
              )}
              {isEditMode ? (
                <>
                  <IconButton
                    icon="chevron-up"
                    size={20}
                    disabled={index === 0}
                    onPress={() => handleMoveFriend(index, 'up')}
                    iconColor={colors.primary[600]}
                  />
                  <IconButton
                    icon="chevron-down"
                    size={20}
                    disabled={index === friends.length - 1}
                    onPress={() => handleMoveFriend(index, 'down')}
                    iconColor={colors.primary[600]}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor={colors.error}
                    onPress={() => handleDeleteFriend(item.id, item.displayName)}
                  />
                </>
              ) : (
                <>
                  <IconButton
                    icon="send"
                    size={24}
                    onPress={() => handleSendPing(item)}
                    iconColor={colors.primary[600]}
                  />
                </>
              )}
            </View>
          )}
          onPress={() => {
            if (!isEditMode) {
              markFriendPingsAsRead(item.id);
              router.push(`/friend/${item.id}`);
            }
          }}
        />
      </Surface>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Bordo header */}
      <Surface style={[styles.headerCard, { backgroundColor: colors.primary[800] }]} elevation={2}>
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            {t('friends')}
          </Text>
        </View>
      </Surface>

      {unreadCount > 0 && (
        <Surface style={[styles.notificationBanner, { backgroundColor: colors.primary[600] }]} elevation={2}>
          <Text variant="bodyMedium" style={styles.notificationText}>
            {`🔔 ${unreadCount} yeni dürtme!`}
          </Text>
        </Surface>
      )}

      <View style={styles.myFriendsRow}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
          {t('myFriends')} ({friends.length})
        </Text>
        <IconButton
          icon={isEditMode ? 'check' : 'pencil'}
          size={24}
          onPress={() => setIsEditMode(!isEditMode)}
          iconColor={colors.primary[600]}
        />
      </View>
      {isEditMode && (
        <Text variant="bodySmall" style={[styles.editHint, { color: theme.textMuted }]}>
          Sıralamak için yukarı/aşağı okları kullanın
        </Text>
      )}

      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {t('noFriends')}
          </Text>
        }
      />

      {!isEditMode && (
        <FAB
          icon="qrcode-scan"
          style={[styles.fab, { backgroundColor: colors.primary[600] }]}
          onPress={() => router.push('/add-friend')}
          label={t('addFriend')}
        />
      )}
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
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  myFriendsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  editHint: {
    fontStyle: 'italic',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  notificationBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  notificationText: {
    color: 'white',
    textAlign: 'center',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  friendCard: {
    marginBottom: 12,
    borderRadius: 16,
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pingBadge: {
    backgroundColor: colors.error,
    marginRight: 8,
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
  },
});
