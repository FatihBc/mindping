import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Text, Button, Surface } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { getCurrentUser } from '@/services/storage';
import type { User } from '@/types/index';
import '../src/i18n';

export default function MyQRScreen() {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  const qrData = currentUser
    ? JSON.stringify({
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarStyle: currentUser.avatarStyle,
      avatarSeed: currentUser.avatarSeed,
    })
    : '';

  return (
    <View style={styles.container}>
      <Surface style={styles.card} elevation={2}>
        <Text variant="headlineMedium" style={styles.title}>
          {t('friendCode')}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {t('myCodeDesc')}
        </Text>

        {qrData ? (
          <View style={styles.qrWrapper}>
            <QRCode value={qrData} size={250} />
          </View>
        ) : null}

        {currentUser && (
          <>
            <Text variant="titleMedium" style={styles.name}>
              {currentUser.displayName}
            </Text>
            <Text variant="bodyMedium" style={styles.username}>
              @{currentUser.username}
            </Text>
          </>
        )}
      </Surface>

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
    justifyContent: 'center',
  },
  card: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 24,
  },
  name: {
    marginBottom: 4,
  },
  username: {
    opacity: 0.6,
  },
  backButton: {
    marginTop: 24,
  },
});
