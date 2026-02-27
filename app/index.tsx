import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { onAuthStateChange } from '@/services/auth';
import { getCurrentUser } from '@/services/storage';
import { colors } from '@/theme/colors';
import { useTranslation } from 'react-i18next';
import '../src/i18n';

export default function SplashScreen() {
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const unsubscribe = onAuthStateChange(async (firebaseUser) => {
          if (firebaseUser) {
            const localUser = await getCurrentUser();
            if (!localUser) {
              router.replace('/setup');
            } else {
              router.replace('/(tabs)');
            }
          } else {
            router.replace('/auth');
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/auth');
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Text variant="displayLarge" style={styles.title}>
        MindPing
      </Text>
      <ActivityIndicator size="large" color={colors.accent[500]} style={styles.spinner} />
      <Text variant="bodyMedium" style={styles.subtitle}>
        {t('loading')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[900],
  },
  title: {
    color: colors.accent[500],
    fontWeight: 'bold',
    marginBottom: 32,
  },
  spinner: {
    marginBottom: 16,
  },
  subtitle: {
    color: colors.accent[700],
  },
});
