import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEditMode } from '../../src/context/EditModeContext';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { isEditMode } = useEditMode();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#ffffff',
        headerShown: true,
        tabBarStyle: isEditMode
          ? { display: 'none' }
          : {
            backgroundColor: '#470000',
            borderTopWidth: 0,
          },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('friends'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (isEditMode) {
              e.preventDefault();
              Alert.alert(
                'Düzenleme Modu Aktif',
                'Sekme değiştirmeden önce lütfen düzenlemeyi kaydedin veya iptal edin.'
              );
            }
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
