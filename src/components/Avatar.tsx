import { View, StyleSheet, Image } from 'react-native';

interface AvatarProps {
  username: string;
  style?: string;
  seed?: string;
  size?: number;
}

export function Avatar({ username, style = 'avataaars', seed, size = 64 }: AvatarProps) {
  const avatarSeed = seed || username;
  const avatarUrl = `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(avatarSeed)}&size=${size * 2}`;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
});
