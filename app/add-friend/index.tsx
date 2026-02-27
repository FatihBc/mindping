import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import {
  Text,
  Button,
  Surface,
  TextInput,
  SegmentedButtons,
  Appbar,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { getCurrentUser, addFriend, getFriends, findUserByUsername, findUserByFriendCode } from '@/services/storage';
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
    const loadUser = async () => {
      let user = await getCurrentUser();
      if (user) {
        // Generate friendCode if missing (for old users)
        if (!user.friendCode) {
          const generateFriendCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = '';
            for (let i = 0; i < 6; i++) {
              code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
          };
          user = { ...user, friendCode: generateFriendCode() };
          await setCurrentUser(user);
        }
        setCurrentUser(user);
      }
    };
    loadUser();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const friendData = JSON.parse(data);

      // Validate QR data
      if (!friendData.id || !friendData.username) {
        Alert.alert(t('error'), 'Invalid QR code: missing user data');
        setScanned(false);
        return;
      }

      const currentUserData = await getCurrentUser();
      if (currentUserData && friendData.id === currentUserData.id) {
        Alert.alert(t('error'), t('cannotAddYourself'));
        setScanned(false);
        return;
      }

      const friends = await getFriends();
      const existing = friends.find(f => f.id === friendData.id);
      if (existing) {
        Alert.alert(t('info'), t('alreadyFriend'));
        setScanned(false);
        return;
      }

      // Add friend directly from QR data (QR contains all needed info)
      await addFriend({
        id: friendData.id,
        username: friendData.username,
        friendCode: friendData.friendCode || 'UNKNOWN',
        displayName: friendData.displayName || friendData.username,
        avatarStyle: friendData.avatarStyle || 'avataaars',
        avatarSeed: friendData.avatarSeed || friendData.username,
        addedAt: Date.now(),
      });

      Alert.alert(t('success'), `${friendData.displayName || friendData.username} ${t('added')}!`, [
        { text: t('ok'), onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('QR scan error:', error);
      Alert.alert(t('error'), t('invalidQR'));
      setScanned(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualUsername.trim()) return;

    const searchTerm = manualUsername.trim();
    const currentUserData = await getCurrentUser();

    // Check if it's a friend code (6 chars, uppercase letters and numbers)
    const isFriendCode = /^[A-Z0-9]{6}$/.test(searchTerm.toUpperCase());

    let userFromFirebase: User | null = null;

    if (isFriendCode) {
      // Search by friend code
      userFromFirebase = await findUserByFriendCode(searchTerm);
    } else {
      // Search by username
      const username = searchTerm.toLowerCase();
      if (currentUserData && username === currentUserData.username) {
        Alert.alert(t('error'), t('cannotAddYourself'));
        return;
      }
      userFromFirebase = await findUserByUsername(username);
    }

    if (!userFromFirebase) {
      Alert.alert(t('error'), isFriendCode ? 'Friend code not found' : 'User not found');
      return;
    }

    // Check if already friend
    const friends = await getFriends();
    const existing = friends.find(f => f.id === userFromFirebase!.id);
    if (existing) {
      Alert.alert(t('info'), t('alreadyFriend'));
      return;
    }

    // Add friend with real user data from Firebase
    await addFriend({
      id: userFromFirebase.id,
      username: userFromFirebase.username,
      friendCode: userFromFirebase.friendCode,
      displayName: userFromFirebase.displayName || userFromFirebase.username,
      avatarStyle: userFromFirebase.avatarStyle || 'avataaars',
      avatarSeed: userFromFirebase.avatarSeed || userFromFirebase.username,
      addedAt: Date.now(),
    });

    Alert.alert(t('success'), `${userFromFirebase.displayName || userFromFirebase.username} ${t('added')}!`, [
      { text: t('ok'), onPress: () => router.back() },
    ]);
  };

  const myQrData = currentUser
    ? JSON.stringify({
      id: currentUser.id,
      username: currentUser.username,
      friendCode: currentUser.friendCode,
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
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Arkadaş Ekle" />
      </Appbar.Header>

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
              veya kullanıcı adı / arkadaş kodu ile ekle
            </Text>
            <TextInput
              label="Kullanıcı Adı veya Kod (ABC123)"
              value={manualUsername}
              onChangeText={setManualUsername}
              style={styles.manualInput}
              autoCapitalize="characters"
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
          <View style={styles.codeContainer}>
            <Text variant="bodySmall" style={styles.codeLabel}>
              Arkadaş Kodun:
            </Text>
            <Text variant="headlineMedium" style={styles.friendCodeDisplay}>
              {currentUser?.friendCode || '...'}
            </Text>
          </View>
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
  codeContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  codeLabel: {
    opacity: 0.6,
    marginBottom: 4,
  },
  friendCodeDisplay: {
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 16,
  },
});
