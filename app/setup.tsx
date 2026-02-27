import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { TextInput, Button, Text, Surface, Menu, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, setCurrentUser } from '../src/services/storage';
import { getCurrentAuthUser } from '../src/services/auth';
import { AVATAR_STYLES } from '../src/types/index';
import { Avatar } from '../src/components/Avatar';
import { colors } from '../src/theme/colors';
import '../src/i18n/index';

export default function SetupScreen() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('avataaars');
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Pre-fill display name from Firebase auth if available
    const firebaseUser = getCurrentAuthUser();
    if (firebaseUser?.displayName) {
      setDisplayName(firebaseUser.displayName);
    }
  }, []);

  const handleCreateProfile = async () => {
    if (!username.trim() || !displayName.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı ve isim zorunludur');
      return;
    }

    setLoading(true);

    // Generate unique friend code (e.g., "X7K9M2")
    const generateFriendCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const firebaseUser = getCurrentAuthUser();

    const newUser = {
      id: firebaseUser?.uid || Math.random().toString(36).substring(2) + Date.now().toString(36),
      email: firebaseUser?.email || '',
      username: username.trim().toLowerCase(),
      friendCode: generateFriendCode(),
      displayName: displayName.trim(),
      avatarStyle,
      avatarSeed: username.trim().toLowerCase(),
      createdAt: Date.now(),
    };

    await setCurrentUser(newUser);
    setLoading(false);
    router.replace('/(tabs)');
  };

  const selectedStyle = AVATAR_STYLES.find(s => s.value === avatarStyle)?.label || 'Avataaars';

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.surface} elevation={2}>
        <Text variant="headlineMedium" style={styles.title}>
          {t('welcome')}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Profilini oluştur
        </Text>

        <View style={styles.avatarPreview}>
          <Avatar
            username={username || 'user'}
            style={avatarStyle}
            size={120}
          />
        </View>

        <TextInput
          label={t('username')}
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          mode="outlined"
          left={<TextInput.Icon icon="account" />}
        />

        <TextInput
          label={t('displayName')}
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="card-account-details" />}
        />

        <Text variant="bodyMedium" style={styles.avatarLabel}>
          Avatar Stili
        </Text>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={styles.styleButton}
              icon="palette"
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
          loading={loading}
          disabled={!username.trim() || !displayName.trim() || loading}
          contentStyle={styles.buttonContent}
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
    backgroundColor: colors.neutral[50],
  },
  surface: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: colors.primary[600],
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: colors.neutral[500],
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  avatarLabel: {
    marginBottom: 12,
    color: colors.neutral[700],
  },
  styleButton: {
    marginBottom: 24,
    borderColor: colors.primary[300],
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.primary[600],
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
