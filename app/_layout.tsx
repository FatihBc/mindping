import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider } from '../src/context/ThemeContext';
import { EditModeProvider } from '../src/context/EditModeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <EditModeProvider>
        <PaperProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="setup" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="add-friend" options={{ presentation: 'modal' }} />
          </Stack>
        </PaperProvider>
      </EditModeProvider>
    </ThemeProvider>
  );
}
