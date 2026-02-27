import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
  Text,
  Button,
  Surface,
  TextInput,
  SegmentedButtons,
  IconButton,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { getCurrentUser, addFriend, getFriends, findUserByUsername, findUserByFriendCode } from '@/services/storage';
import { colors } from '../../../src/theme/colors';
import { useTheme } from '../../../src/context/ThemeContext';
import type { User } from '@/types/index';
import '../../../src/i18n';

type Mode = 'scan' | 'mycode';

export default function AddFriendScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Surface style={[styles.headerCard, { backgroundColor: colors.primary[800] }]} elevation={2}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Arkadaş Ekle
          </Text>
        </Surface>
        <View style={styles.content}>
          <Text style={[styles.permissionText, { color: theme.text }]}>
            {t('cameraPermissionRequired')}
          </Text>
          <Button
            onPress={requestPermission}
            mode="contained"
            buttonColor={isDark ? '#da0000' : '#780000'}
          >
            {t('grantPermission')}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Burgundy Header */}
      <Surface style={[styles.headerCard, { backgroundColor: colors.primary[800] }]} elevation={2}>
        <Text variant="titleLarge" style={styles.headerTitle}>
          Arkadaş Ekle
        </Text>
      </Surface>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <SegmentedButtons
          value={mode}
          onValueChange={(v) => {
            setMode(v as Mode);
            setScanned(false);
          }}
          buttons={[
            { value: 'scan', label: 'Tara', style: { backgroundColor: mode === 'scan' ? '#ffcccc' : 'transparent' } },
            { value: 'mycode', label: 'Kodum', style: { backgroundColor: mode === 'mycode' ? '#ffcccc' : 'transparent' } },
          ]}
          style={styles.segmented}
        />

        {mode === 'scan' ? (
          <View style={styles.scanContainer}>
            {permission?.granted && (
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
              />
            )}
            <Surface style={[styles.overlay, { backgroundColor: theme.card }]} elevation={1}>
              <Text variant="bodyMedium" style={{ color: theme.text }}>
                Arkadaşınızın QR kodunu kameraya gösterin
              </Text>
            </Surface>

            <Surface style={[styles.manualSection, { backgroundColor: theme.card }]} elevation={1}>
              <Text variant="bodySmall" style={[styles.orText, { color: theme.textSecondary }]}>
                veya kullanıcı adı / arkadaş kodu ile ekle
              </Text>
              <TextInput
                label="Kullanıcı Adı veya Kod (ABC123)"
                value={manualUsername}
                onChangeText={setManualUsername}
                autoCapitalize="characters"
                textColor={theme.text}
                mode="outlined"
                outlineColor="#ffcccc"
                activeOutlineColor="#ffcccc"
                style={[styles.manualInput, { backgroundColor: '#ffcccc' }]}
              />
              <Button
                mode="contained"
                onPress={handleManualAdd}
                disabled={!manualUsername.trim()}
                buttonColor={isDark ? '#da0000' : '#780000'}
              >
                Ekle
              </Button>
            </Surface>

            {scanned && (
              <Button
                mode="contained"
                onPress={() => setScanned(false)}
                style={styles.scanAgain}
                buttonColor={isDark ? '#da0000' : '#780000'}
              >
                Tekrar Tara
              </Button>
            )}
          </View>
        ) : (
          <Surface style={[styles.myCodeContainer, { backgroundColor: theme.card }]} elevation={2}>
            <Text variant="titleMedium" style={[styles.myCodeTitle, { color: theme.text }]}>
              Arkadaşınız sizi eklemek için bu kodu tarayabilir
            </Text>
            {myQrData ? (
              <View style={styles.qrWrapper}>
                <QRCode value={myQrData} size={200} />
              </View>
            ) : null}
            <View style={styles.codeContainer}>
              <Text variant="bodySmall" style={[styles.codeLabel, { color: theme.textSecondary }]}>
                Arkadaş Kodun:
              </Text>
              <Text variant="headlineMedium" style={[styles.friendCodeDisplay, { color: isDark ? '#da0000' : '#780000' }]}>
                {currentUser?.friendCode || '...'}
              </Text>
            </View>
          </Surface>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
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
