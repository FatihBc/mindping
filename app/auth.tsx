import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  HelperText,
  Divider,
  IconButton,
} from 'react-native-paper';
import { router } from 'expo-router';
import { loginUser, registerUser } from '../src/services/auth';
import { colors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';

export default function AuthScreen() {
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Password validation
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    hasNumber: false,
    hasUpper: false,
    hasLower: false,
    hasSpecial: false,
  });

  const validatePassword = (pass: string) => {
    setPasswordValidations({
      minLength: pass.length >= 8,
      hasNumber: /\d/.test(pass),
      hasUpper: /[A-Z]/.test(pass),
      hasLower: /[a-z]/.test(pass),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    });
  };

  const getPasswordStrength = () => {
    const { minLength, hasNumber, hasUpper, hasLower, hasSpecial } = passwordValidations;
    const score = [minLength, hasNumber, hasUpper, hasLower, hasSpecial].filter(Boolean).length;

    if (score <= 2) return { text: 'Zayıf', color: colors.error };
    if (score <= 4) return { text: 'Orta', color: colors.warning };
    return { text: 'Güçlü', color: colors.success };
  };

  const isPasswordValid = () => {
    return Object.values(passwordValidations).every(Boolean);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Email ve şifre zorunludur');
      return;
    }

    if (!isLogin) {
      if (!displayName) {
        Alert.alert('Hata', 'İsim zorunludur');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Hata', 'Şifreler eşleşmiyor');
        return;
      }
      if (!isPasswordValid()) {
        Alert.alert('Hata', 'Şifre tüm kuralları karşılamalıdır');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const result = await loginUser(email, password);
        if (result.success) {
          router.replace('/(tabs)');
        } else {
          Alert.alert('Giriş Hatası', result.error || 'Giriş yapılamadı');
        }
      } else {
        const result = await registerUser(email, password, displayName);
        if (result.success) {
          setRegisteredEmail(email);
          setShowVerifyModal(true);
        } else {
          Alert.alert('Kayıt Hatası', result.error || 'Kayıt yapılamadı');
        }
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.card} elevation={4}>
          <Text variant="headlineMedium" style={styles.title}>
            MindPing
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </Text>

          {!isLogin && (
            <TextInput
              label="İsim"
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
            />
          )}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            label="Şifre"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (!isLogin) validatePassword(text);
            }}
            secureTextEntry={!showPassword}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          {!isLogin && (
            <>
              <TextInput
                label="Şifre Tekrar"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                mode="outlined"
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />

              {/* Password Strength Indicator */}
              <View style={styles.strengthContainer}>
                <Text variant="bodySmall" style={styles.strengthLabel}>
                  Şifre Gücü:{' '}
                  <Text style={{ color: getPasswordStrength().color, fontWeight: 'bold' }}>
                    {getPasswordStrength().text}
                  </Text>
                </Text>
                <View style={styles.strengthBar}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            Object.values(passwordValidations).filter(Boolean).length > i
                              ? getPasswordStrength().color
                              : colors.neutral[200],
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Password Rules */}
              <View style={styles.rulesContainer}>
                <HelperText type="info" style={styles.rulesTitle}>
                  Şifre Kuralları:
                </HelperText>
                {[
                  { key: 'minLength', text: 'En az 8 karakter', valid: passwordValidations.minLength },
                  { key: 'hasNumber', text: 'En az 1 rakam', valid: passwordValidations.hasNumber },
                  { key: 'hasUpper', text: 'En az 1 büyük harf', valid: passwordValidations.hasUpper },
                  { key: 'hasLower', text: 'En az 1 küçük harf', valid: passwordValidations.hasLower },
                  { key: 'hasSpecial', text: 'En az 1 özel karakter (!@#$...)', valid: passwordValidations.hasSpecial },
                ].map((rule) => (
                  <View key={rule.key} style={styles.ruleItem}>
                    <Text
                      style={[
                        styles.ruleDot,
                        { color: rule.valid ? colors.success : colors.neutral[400] },
                      ]}
                    >
                      {rule.valid ? '✓' : '○'}
                    </Text>
                    <Text
                      style={[
                        styles.ruleText,
                        { color: rule.valid ? colors.success : colors.neutral[600] },
                      ]}
                    >
                      {rule.text}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Button
            mode="contained"
            onPress={handleAuth}
            loading={loading}
            disabled={loading || (!isLogin && (!displayName || !email || !password || password !== confirmPassword || !isPasswordValid()))}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </Button>

          <Divider style={styles.divider} />

          <Button
            mode="text"
            onPress={() => {
              setIsLogin(!isLogin);
              setPassword('');
              setConfirmPassword('');
            }}
            style={styles.switchButton}
          >
            {isLogin ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
          </Button>
        </Surface>
      </ScrollView>

      {/* Email Verification Modal */}
      <Modal
        visible={showVerifyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowVerifyModal(false)}>
          <View style={styles.modalOverlay}>
            <Surface style={[styles.modalContent, { backgroundColor: theme.dialogBackground, borderColor: theme.dialogBorder, borderWidth: 2 }]} elevation={5}>
              <IconButton
                icon="email-check"
                size={48}
                iconColor={colors.success}
                style={styles.modalIcon}
              />
              <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.dialogText }]}>
                Email Doğrulama Gerekli
              </Text>
              <Text variant="bodyMedium" style={[styles.modalText, { color: theme.dialogText, opacity: 0.9 }]}>
                {registeredEmail} adresine doğrulama linki gönderildi. Lütfen emailinizi kontrol edin ve doğrulama yapın.
              </Text>
              <Button
                mode="contained"
                onPress={() => {
                  setShowVerifyModal(false);
                  setIsLogin(true);
                }}
                style={styles.modalButton}
              >
                Giriş Sayfasına Git
              </Button>
            </Surface>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[900],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    textAlign: 'center',
    color: colors.primary[600],
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.neutral[600],
    marginBottom: 24,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: colors.primary[600],
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 20,
  },
  switchButton: {
    alignSelf: 'center',
  },
  strengthContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  strengthLabel: {
    marginBottom: 8,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  rulesContainer: {
    backgroundColor: colors.neutral[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  rulesTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  ruleDot: {
    width: 20,
    fontWeight: 'bold',
  },
  ruleText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.neutral[900],
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 24,
    color: colors.neutral[600],
  },
  modalButton: {
    backgroundColor: colors.primary[600],
  },
});
