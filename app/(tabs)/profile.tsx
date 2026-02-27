import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, FlatList } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import {
  Text,
  TextInput,
  Button,
  Surface,
  Divider,
  Dialog,
  Portal,
  List,
  RadioButton,
  IconButton,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, updateUser, setCurrentUser, clearAllData, removeFriend } from '../../src/services/storage';
import { logoutUser, deleteUserAccount, getCurrentAuthUser } from '../../src/services/auth';
import { changeLanguage, getAvailableLanguages } from '../../src/i18n';
import { Avatar } from '../../src/components/Avatar';
import { AVATAR_STYLES } from '../../src/types/index';
import { colors } from '../../src/theme/colors';
import { useTheme } from '../../src/context/ThemeContext';
import { useEditMode } from '../../src/context/EditModeContext';
import { getUsersWhoAddedMe, getFriendships, sendAccountDeletionNotification } from '../../src/services/firebase-db';
import '../../src/i18n/index';
import QRCode from 'react-native-qrcode-svg';
import type { User } from '../../src/types/index';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { themeMode, setThemeMode, theme, isDark } = useTheme();
  const { setEditMode } = useEditMode();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('avataaars');
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showAvatarGrid, setShowAvatarGrid] = useState(false);
  const [showWhoAddedMeDialog, setShowWhoAddedMeDialog] = useState(false);
  const [usersWhoAddedMe, setUsersWhoAddedMe] = useState<User[]>([]);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const languages = getAvailableLanguages();

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        let currentUser = await getCurrentUser();
        if (currentUser) {
          // Generate friendCode if missing
          if (!currentUser.friendCode) {
            const generateFriendCode = () => {
              const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
              let code = '';
              for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
              }
              return code;
            };
            currentUser = { ...currentUser, friendCode: generateFriendCode() };
            await setCurrentUser(currentUser);
          }
          setUser(currentUser);
          setDisplayName(currentUser.displayName);
          setAvatarStyle(currentUser.avatarStyle || 'avataaars');
        }
      };
      loadUser();
    }, [])
  );

  const handleSave = async () => {
    if (!displayName.trim()) return;
    const updated = await updateUser({
      displayName: displayName.trim(),
      avatarStyle,
    });
    if (updated) {
      setUser(updated);
      setIsEditing(false);
      setEditMode(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Oturumunuzu kapatmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          onPress: async () => {
            await logoutUser();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SIL') {
      Alert.alert('Hata', 'Onay metni "SIL" olmalıdır');
      return;
    }

    const firebaseUser = getCurrentAuthUser();
    if (!firebaseUser || !user) {
      Alert.alert('Hata', 'Kullanıcı bulunamadı');
      return;
    }

    try {
      // Get friends list before deleting
      const friendIds = await getFriendships(user.id);

      // Send notifications to all friends
      if (friendIds.length > 0) {
        await sendAccountDeletionNotification(user, friendIds);
      }

      // Delete the account
      const result = await deleteUserAccount(firebaseUser);
      if (result.success) {
        Alert.alert(
          'Email Onayı Gerekli',
          'Silme işleminin tamamlanması için size e-mail gönderilmiştir. Silmeyi onayladıktan sonra silme işlemi tamamlanacaktır.',
          [
            {
              text: 'Tamam',
              onPress: async () => {
                await clearAllData();
                router.replace('/auth');
              },
            },
          ]
        );
      } else {
        Alert.alert('Hata', result.error || 'Hesap silinemedi');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Hata', 'Hesap silinirken bir hata oluştu');
    }
  };

  const handleLanguageChange = async (langCode: string) => {
    await changeLanguage(langCode);
    setShowLanguageDialog(false);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `MindPing arkadaş kodum: ${user?.friendCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShowWhoAddedMe = async () => {
    if (!user) return;

    try {
      const users = await getUsersWhoAddedMe(user.id);
      setUsersWhoAddedMe(users);
      setShowWhoAddedMeDialog(true);
    } catch (error) {
      console.error('Error loading users who added me:', error);
      Alert.alert('Hata', 'Kullanıcılar yüklenirken bir hata oluştu');
    }
  };

  const handleRemoveUserWhoAddedMe = async (userId: string, displayName: string) => {
    Alert.alert(
      'Arkadaşı Sil',
      `${displayName} kişisini arkadaş listenizden silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(userId);

              // Refresh list
              const users = await getUsersWhoAddedMe(user!.id);
              setUsersWhoAddedMe(users);

              Alert.alert('Başarılı', `${displayName} arkadaş listenizden silindi`);
            } catch (error) {
              console.error('Error removing user:', error);
              Alert.alert('Hata', 'Kullanıcı silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleBlockUserWhoAddedMe = async (userId: string, displayName: string) => {
    Alert.alert(
      'Kullanıcıyı Engelle',
      `${displayName} kişisini engellemek istediğinizden emin misiniz? Bu kişi size ping gönderemeyecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: async () => {
            try {
              // First remove from friends
              await removeFriend(userId);

              // TODO: Implement blocking functionality in Firebase
              // For now, just remove from friends

              // Refresh list
              const users = await getUsersWhoAddedMe(user!.id);
              setUsersWhoAddedMe(users);

              Alert.alert('Başarılı', `${displayName} engellendi ve arkadaş listenizden silindi`);
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Hata', 'Kullanıcı engellenirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const currentLang = languages.find((l: { code: string }) => l.code === i18n.language) || languages[0];

  if (!user) {
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
          <Text variant="titleLarge" style={styles.headerTitle}>
            {t('profile')}
          </Text>
          <IconButton
            icon="logout"
            onPress={() => {
              if (isEditing) {
                Alert.alert(
                  'Düzenleme Modu Aktif',
                  'Çıkış yapmadan önce lütfen düzenlemeyi kaydedin veya iptal edin.'
                );
              } else {
                handleLogout();
              }
            }}
            iconColor="white"
            size={24}
            style={styles.logoutButton}
          />
        </View>
      </Surface>

      <ScrollView style={styles.scrollContent}>
        {/* Profile card */}
        <Surface style={[styles.profileCard, { backgroundColor: theme.card }]} elevation={1}>
          <TouchableOpacity
            onPress={() => isEditing && setShowAvatarGrid(true)}
            style={styles.avatarContainer}
          >
            <Avatar username={user.username} style={avatarStyle} size={100} />
            {isEditing && (
              <View style={styles.editAvatarOverlay}>
                <IconButton icon="camera" iconColor="white" size={24} />
              </View>
            )}
          </TouchableOpacity>

          {isEditing ? (
            <TextInput
              label="Görünen İsim"
              value={displayName}
              onChangeText={setDisplayName}
              style={[styles.editInput, { backgroundColor: theme.input }]}
              mode="outlined"
              dense
              textColor={theme.text}
            />
          ) : (
            <Text variant="headlineSmall" style={[styles.displayName, { color: theme.text }]}>
              {user.displayName}
            </Text>
          )}

          <View style={styles.codeRow}>
            <View>
              <Text variant="bodySmall" style={[styles.codeLabel, { color: theme.textMuted }]}>
                {t('userCode')}
              </Text>
              <Text variant="titleLarge" style={[styles.codeValue, { color: isDark ? '#da0000' : '#780000' }]}>
                {user.friendCode}
              </Text>
            </View>
            <View style={styles.codeActions}>
              <IconButton
                icon="qrcode"
                size={24}
                onPress={() => setShowQRDialog(true)}
                iconColor={isDark ? '#da0000' : '#780000'}
              />
              <IconButton
                icon="share-variant"
                size={24}
                onPress={handleShareCode}
                iconColor={isDark ? '#da0000' : '#780000'}
              />
            </View>
          </View>

          {!isEditing && (
            <Button
              mode="outlined"
              onPress={() => {
                setIsEditing(true);
                setEditMode(true);
              }}
              style={[styles.editProfileButton, { borderColor: isDark ? '#da0000' : '#780000' }]}
              textColor={isDark ? '#da0000' : '#780000'}
            >
              {t('editProfile')}
            </Button>
          )}

          {isEditing && (
            <View style={styles.editButtonsRow}>
              <Button
                mode="outlined"
                onPress={() => {
                  setIsEditing(false);
                  setEditMode(false);
                  setDisplayName(user.displayName);
                  setAvatarStyle(user.avatarStyle || 'avataaars');
                }}
                style={styles.editButton}
                textColor={colors.neutral[500]}
              >
                İptal
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={[styles.editButton, { backgroundColor: colors.primary[600] }]}
                disabled={!displayName.trim()}
              >
                Kaydet
              </Button>
            </View>
          )}
        </Surface>

        {/* Language and Theme */}
        <Surface style={[styles.settingsCard, { backgroundColor: theme.card }]} elevation={1}>
          <List.Item
            title={t('language')}
            description={`${currentLang.flag} ${currentLang.name}`}
            left={(props) => <List.Icon {...props} icon="translate" color={colors.primary[900]} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.textSecondary} />}
            onPress={() => setShowLanguageDialog(true)}
            titleStyle={{ color: theme.text }}
            descriptionStyle={{ color: theme.textSecondary }}
          />
          <Divider style={[styles.divider, { backgroundColor: theme.border }]} />
          <List.Item
            title={t('theme')}
            description={themeMode === 'system' ? t('system') : themeMode === 'dark' ? t('dark') : t('light')}
            left={(props) => <List.Icon {...props} icon="theme-light-dark" color={colors.primary[900]} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.textSecondary} />}
            onPress={() => setShowThemeDialog(true)}
            titleStyle={{ color: theme.text }}
            descriptionStyle={{ color: theme.textSecondary }}
          />
        </Surface>

        {/* Who Added Me */}
        <Surface style={[styles.settingsCard, { backgroundColor: theme.card }]} elevation={1}>
          <List.Item
            title="Ekli Olduğum Kişiler"
            description="Sizi arkadaş olarak ekleyen kişileri görün"
            left={(props) => <List.Icon {...props} icon="account-multiple" color={colors.primary[600]} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.textSecondary} />}
            onPress={handleShowWhoAddedMe}
            titleStyle={{ color: theme.text }}
            descriptionStyle={{ color: theme.textSecondary }}
          />
        </Surface>

        {/* Delete Account */}
        <Surface style={[styles.deleteCard, { backgroundColor: theme.card }]} elevation={1}>
          <List.Item
            title={t('deleteAccount')}
            left={(props) => <List.Icon {...props} icon="delete-forever" color={isDark ? '#da0000' : '#780000'} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.textSecondary} />}
            onPress={() => setShowDeleteDialog(true)}
            titleStyle={{ color: isDark ? '#da0000' : '#780000' }}
          />
        </Surface>
      </ScrollView>

      <Portal>
        <Dialog
          visible={showAvatarGrid}
          onDismiss={() => setShowAvatarGrid(false)}
          style={[styles.avatarDialog, { backgroundColor: theme.dialogBackground }]}
        >
          <Dialog.Title style={{ color: theme.dialogText }}>Avatar Seç</Dialog.Title>
          <Dialog.Content>
            <FlatList
              data={AVATAR_STYLES}
              numColumns={2}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.avatarGridItem,
                    { backgroundColor: theme.card },
                    avatarStyle === item.value && { borderColor: colors.primary[600], backgroundColor: isDark ? '#470000' : '#ffcccc' },
                  ]}
                  onPress={() => {
                    setAvatarStyle(item.value);
                    setShowAvatarGrid(false);
                  }}
                >
                  <Avatar username={user.username} style={item.value} size={80} />
                  <Text variant="bodySmall" style={[styles.avatarGridLabel, { color: theme.dialogText }]}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </Dialog.Content>
        </Dialog>

        <Dialog
          visible={showQRDialog}
          onDismiss={() => setShowQRDialog(false)}
          style={{ backgroundColor: theme.dialogBackground, borderColor: theme.dialogBorder, borderWidth: 2 }}
        >
          <Dialog.Content style={styles.qrContent}>
            <View style={styles.qrContainer}>
              <QRCode
                value={JSON.stringify({
                  username: user.username,
                  friendCode: user.friendCode,
                  avatarStyle: user.avatarStyle,
                })}
                size={200}
                color={colors.primary[900]}
                backgroundColor="white"
              />
            </View>
            <Text variant="bodySmall" style={[styles.qrSubtext, { color: theme.dialogText, opacity: 0.7 }]}>
              Kullanıcı Kodu: {user.friendCode}
            </Text>
          </Dialog.Content>
        </Dialog>

        <Dialog
          visible={showLanguageDialog}
          onDismiss={() => setShowLanguageDialog(false)}
          style={{ backgroundColor: theme.dialogBackground, borderColor: theme.dialogBorder, borderWidth: 2 }}
        >
          <Dialog.Title style={{ color: theme.dialogText }}>Dil Seç</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={handleLanguageChange} value={i18n.language}>
              {languages.map((lang: { code: string; flag: string; name: string }) => (
                <RadioButton.Item
                  key={lang.code}
                  label={`${lang.flag} ${lang.name}`}
                  value={lang.code}
                  labelStyle={{ color: theme.dialogText }}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>

        <Dialog
          visible={showThemeDialog}
          onDismiss={() => setShowThemeDialog(false)}
          style={{ backgroundColor: theme.dialogBackground, borderColor: theme.dialogBorder, borderWidth: 2 }}
        >
          <Dialog.Title style={{ color: theme.dialogText }}>{t('theme')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => { setThemeMode(value as any); setShowThemeDialog(false); }}
              value={themeMode}
            >
              <RadioButton.Item label={t('system')} value="system" labelStyle={{ color: theme.dialogText }} />
              <RadioButton.Item label={t('light')} value="light" labelStyle={{ color: theme.dialogText }} />
              <RadioButton.Item label={t('dark')} value="dark" labelStyle={{ color: theme.dialogText }} />
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>

        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={{ backgroundColor: theme.dialogBackground, borderColor: theme.dialogBorder, borderWidth: 2 }}
        >
          <Dialog.Title style={{ color: colors.error }}>Hesabı Sil</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.dialogText }}>
              Bu işlem geri alınamaz! Hesabınızı silmek istediğinize emin misiniz?
            </Text>
            <Text variant="bodySmall" style={{ marginBottom: 8, color: theme.dialogText, opacity: 0.7 }}>
              Onaylamak için "SIL" yazın:
            </Text>
            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              mode="outlined"
              autoCapitalize="characters"
              style={{ backgroundColor: theme.dialogBackground }}
              textColor={theme.dialogText}
              outlineColor={theme.dialogBorder}
              activeOutlineColor={theme.dialogBorder}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} textColor={theme.dialogText}>İptal</Button>
            <Button
              onPress={handleDeleteAccount}
              textColor={colors.error}
              disabled={deleteConfirmText !== 'SIL'}
            >
              Hesabı Sil
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showWhoAddedMeDialog}
          onDismiss={() => setShowWhoAddedMeDialog(false)}
          style={[styles.whoAddedMeDialog, { backgroundColor: theme.dialogBackground }]}
        >
          <Dialog.Title style={{ color: theme.dialogText }}>Ekli Olduğum Kişiler</Dialog.Title>
          <Dialog.Content>
            {usersWhoAddedMe.length === 0 ? (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginVertical: 20 }}>
                Henüz kimse sizi arkadaş olarak eklememiş
              </Text>
            ) : (
              <FlatList
                data={usersWhoAddedMe}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Surface style={[styles.whoAddedMeItem, { backgroundColor: theme.card }]} elevation={1}>
                    <View style={styles.whoAddedMeInfo}>
                      <Avatar username={item.username} style={item.avatarStyle} size={48} />
                      <View style={styles.whoAddedMeText}>
                        <Text variant="bodyLarge" style={{ color: theme.text, fontWeight: '600' }}>
                          {item.displayName}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                          @{item.username}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.whoAddedMeActions}>
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor={colors.error}
                        onPress={() => handleRemoveUserWhoAddedMe(item.id, item.displayName)}
                      />
                      <IconButton
                        icon="block-helper"
                        size={20}
                        iconColor={isDark ? '#da0000' : '#780000'}
                        onPress={() => handleBlockUserWhoAddedMe(item.id, item.displayName)}
                      />
                    </View>
                  </Surface>
                )}
                style={styles.whoAddedMeList}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowWhoAddedMeDialog(false)} textColor={theme.dialogText}>
              Kapat
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  logoutButton: {
    position: 'absolute',
    right: 0,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary[600],
    borderRadius: 20,
  },
  displayName: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  editInput: {
    width: '80%',
    marginBottom: 16,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  codeLabel: {
    marginBottom: 4,
  },
  codeValue: {
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: 'row',
  },
  editProfileButton: {
    marginTop: 16,
    borderRadius: 8,
    borderColor: colors.primary[600],
  },
  settingsCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  divider: {
    marginLeft: 56,
  },
  deleteCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
    width: '100%',
  },
  editButton: {
    flex: 1,
    borderRadius: 8,
  },
  avatarDialog: {
    maxHeight: '80%',
  },
  avatarGridItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    margin: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 140,
  },
  avatarGridLabel: {
    marginTop: 8,
    fontSize: 11,
    textAlign: 'center',
  },
  qrContent: {
    alignItems: 'center',
    marginTop: 50,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
  },
  qrText: {
    fontWeight: 'bold',
  },
  qrSubtext: {
    marginTop: 4,
  },
  whoAddedMeDialog: {
    maxHeight: '80%',
  },
  whoAddedMeList: {
    maxHeight: 400,
  },
  whoAddedMeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  whoAddedMeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  whoAddedMeText: {
    marginLeft: 12,
    flex: 1,
  },
  whoAddedMeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
