import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import {
  Text,
  Button,
  Surface,
  TextInput,
  SegmentedButtons,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { getCurrentUser, addFriend, getFriends } from '@/services/storage';
import type { User } from '@/types/index';
import '../../src/i18n';

type Mode = 'scan' | 'mycode';

export default function AddFriendScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('scan');
  const [scanned, setScanned] = useState(false);
  const [manualUsername, setManualUsername] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const friendData = JSON.parse(data);
      if (friendData.id && friendData.username) {
        const friends = await getFriends();
        const existing = friends.find(f => f.id === friendData.id);
        if (existing) {
          Alert.alert(t('info'), t('alreadyFriend'));
          return;
        }

        await addFriend({
          id: friendData.id,
          username: friendData.username,
          displayName: friendData.displayName || friendData.username,
          avatarStyle: friendData.avatarStyle,
          avatarSeed: friendData.avatarSeed,
          addedAt: Date.now(),
        });

        Alert.alert(t('success'), `${friendData.displayName || friendData.username} ${t('added')}!`, [
          { text: t('ok'), onPress: () => router.back() },
        ]);
      }
    } catch {
      Alert.alert(t('error'), t('invalidQR'));
      setScanned(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualUsername.trim()) return;

    const username = manualUsername.trim().toLowerCase();
    const currentUserData = await getCurrentUser();

    if (currentUserData && username === currentUserData.username) {
      Alert.alert(t('error'), t('cannotAddYourself'));
      return;
    }

    // Check if already friend
    const friends = await getFriends();
    const existing = friends.find(f => f.username.toLowerCase() === username);
    if (existing) {
      Alert.alert(t('info'), t('alreadyFriend'));
      return;
    }

    // Add friend with placeholder data (in real app, would fetch from server)
    await addFriend({
      id: 'user_' + username,
      username: username,
      displayName: username,
      avatarStyle: 'avataaars',
      avatarSeed: username,
      addedAt: Date.now(),
    });

    Alert.alert(t('success'), `${username} ${t('added')}!`, [
      { text: t('ok'), onPress: () => router.back() },
    ]);
  };

  const myQrData = currentUser
    ? JSON.stringify({
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarStyle: currentUser.avatarStyle,
      avatarSeed: currentUser.avatarSeed,
    })
    : '';

  if (!permission?.granted && mode === 'scan') {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          {t('cameraPermissionRequired')}
        </Text>
        <Button onPress={requestPermission} mode="contained">
          {t('grantPermission')}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={mode}
        onValueChange={(v) => {
          setMode(v as Mode);
          setScanned(false);
        }}
        buttons={[
          { value: 'scan', label: 'Tara' },
          { value: 'mycode', label: 'Kodum' },
        ]}
        style={styles.segmented}
      />

      {mode === 'scan' ? (
        <View style={styles.scanContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          <Surface style={styles.overlay} elevation={1}>
            <Text variant="bodyMedium">
              Arkadaşınızın QR kodunu kameraya gösterin
            </Text>
          </Surface>

          <Surface style={styles.manualSection} elevation={1}>
            <Text variant="bodySmall" style={styles.orText}>
              veya kullanıcı adı ile ekle
            </Text>
            <TextInput
              label="Kullanıcı Adı"
              value={manualUsername}
              onChangeText={setManualUsername}
              style={styles.manualInput}
              autoCapitalize="none"
            />
            <Button
              mode="outlined"
              onPress={handleManualAdd}
              disabled={!manualUsername.trim()}
            >
              Ekle
            </Button>
          </Surface>

          {scanned && (
            <Button
              mode="contained"
              onPress={() => setScanned(false)}
              style={styles.scanAgain}
            >
              Tek Tara
            </Button>
          )}
        </View>
      ) : (
        <Surface style={styles.myCodeContainer} elevation={2}>
          <Text variant="titleMedium" style={styles.myCodeTitle}>
            Arkadaşların bu kodu tarasın
          </Text>
          {myQrData ? (
            <View style={styles.qrWrapper}>
              <QRCode value={myQrData} size={200} />
            </View>
          ) : null}
          <Text variant="bodyMedium" style={styles.username}>
            @{currentUser?.username}
          </Text>
        </Surface>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  segmented: {
    marginBottom: 16,
  },
  scanContainer: {
    flex: 1,
  },
  camera: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  overlay: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  manualSection: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  orText: {
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.6,
  },
  manualInput: {
    marginBottom: 12,
  },
  scanAgain: {
    marginTop: 16,
  },
  myCodeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
  },
  myCodeTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  username: {
    marginTop: 24,
    opacity: 0.7,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 16,
  },
});
