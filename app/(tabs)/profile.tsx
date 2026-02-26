import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
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
  Menu,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, updateUser, clearAllData } from '@/services/storage';
import { changeLanguage, getAvailableLanguages } from '../../src/i18n';
import { Avatar } from '@/components/Avatar';
import { AVATAR_STYLES } from '@/types/index';
import type { User } from '@/types/index';
import '../../src/i18n';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('avataaars');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const languages = getAvailableLanguages();

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        const currentUser = await getCurrentUser();
        if (currentUser) {
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
    }
  };

  const handleReset = async () => {
    await clearAllData();
    setShowResetDialog(false);
  };

  const handleLanguageChange = async (langCode: string) => {
    await changeLanguage(langCode);
    setShowLanguageDialog(false);
  };

  const currentLang = languages.find((l: { code: string }) => l.code === i18n.language) || languages[0];
  const selectedStyle = AVATAR_STYLES.find(s => s.value === avatarStyle)?.label || 'Avataaars';

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Avatar
          username={user.username}
          style={avatarStyle}
          size={80}
        />
        <Text variant="headlineSmall" style={styles.username}>
          @{user.username}
        </Text>
      </Surface>

      <Surface style={styles.form} elevation={1}>
        <TextInput
          label={t('displayName')}
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
        />

        <Text variant="bodyMedium" style={styles.avatarLabel}>
          {t('chooseAvatar')}
        </Text>

        <Menu
          visible={showAvatarMenu}
          onDismiss={() => setShowAvatarMenu(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setShowAvatarMenu(true)}
              style={styles.styleButton}
            >
              {selectedStyle}
            </Button>
          }
        >
          {AVATAR_STYLES.map((style) => (
            <Menu.Item
              key={style.value}
              onPress={() => {
                setAvatarStyle(style.value);
                setShowAvatarMenu(false);
              }}
              title={style.label}
            />
          ))}
        </Menu>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          disabled={!displayName.trim()}
        >
          {t('save')}
        </Button>
      </Surface>

      <Surface style={styles.languageCard} elevation={1}>
        <List.Item
          title={t('language')}
          description={`${currentLang.flag} ${currentLang.name}`}
          left={(props) => <List.Icon {...props} icon="translate" />}
          onPress={() => setShowLanguageDialog(true)}
        />
      </Surface>

      <Divider style={styles.divider} />

      <Button
        mode="outlined"
        onPress={() => setShowResetDialog(true)}
        textColor="#ef4444"
        style={styles.resetButton}
      >
        {t('resetData')}
      </Button>

      <Portal>
        <Dialog
          visible={showResetDialog}
          onDismiss={() => setShowResetDialog(false)}
        >
          <Dialog.Title>{t('areYouSure')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t('resetConfirm')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowResetDialog(false)}>{t('cancel')}</Button>
            <Button onPress={handleReset} textColor="#ef4444">
              {t('resetData')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showLanguageDialog}
          onDismiss={() => setShowLanguageDialog(false)}
        >
          <Dialog.Title>{t('selectLanguage')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={handleLanguageChange}
              value={i18n.language}
            >
              {languages.map((lang: { code: string; flag: string; name: string }) => (
                <RadioButton.Item
                  key={lang.code}
                  label={`${lang.flag} ${lang.name}`}
                  value={lang.code}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLanguageDialog(false)}>{t('cancel')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    borderRadius: 12,
  },
  username: {
    marginTop: 12,
    opacity: 0.7,
  },
  form: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  input: {
    marginBottom: 16,
  },
  avatarLabel: {
    marginBottom: 12,
  },
  styleButton: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
    marginHorizontal: 16,
  },
  resetButton: {
    marginHorizontal: 16,
  },
  languageCard: {
    marginHorizontal: 16,
    borderRadius: 12,
  },
});
