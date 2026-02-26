import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { TextInput, Button, Text, Surface, Menu } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, setCurrentUser } from '@/services/storage';
import { AVATAR_STYLES } from '@/types/index';
import { Avatar } from '@/components/Avatar';
import '../src/i18n';

const EMOJIS = ['🙂', '😊', '🤗', '😎', '🤩', '🥰', '🤔', '🤠', '👻', '👽'];

export default function SetupScreen() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🙂');
  const [avatarStyle, setAvatarStyle] = useState('avataaars');
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        router.replace('/(tabs)');
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const { t } = useTranslation();

  const handleCreateProfile = async () => {
    if (!username.trim() || !displayName.trim()) return;

    const newUser = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      username: username.trim().toLowerCase(),
      displayName: displayName.trim(),
      emoji: selectedEmoji,
      avatarStyle,
      avatarSeed: username.trim().toLowerCase(),
      createdAt: Date.now(),
    };

    await setCurrentUser(newUser);
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  const selectedStyle = AVATAR_STYLES.find(s => s.value === avatarStyle)?.label || 'Avataaars';

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.surface} elevation={2}>
        <Text variant="headlineMedium" style={styles.title}>
          {t('welcome')}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {t('setupProfile')}
        </Text>

        <View style={styles.avatarPreview}>
          <Avatar
            username={username || 'user'}
            style={avatarStyle}
            size={100}
          />
        </View>

        <TextInput
          label={t('username')}
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

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
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
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
                setMenuVisible(false);
              }}
              title={style.label}
            />
          ))}
        </Menu>

        <Button
          mode="contained"
          onPress={handleCreateProfile}
          style={styles.button}
          disabled={!username.trim() || !displayName.trim()}
        >
          {t('getStarted')}
        </Button>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  avatarLabel: {
    marginBottom: 12,
  },
  styleButton: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
});
