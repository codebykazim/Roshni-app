import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors, space } from '@/constants/theme';
import { Text } from '@/components/AppText';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to the home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  link: { marginTop: space.lg, paddingVertical: space.lg },
  linkText: { fontSize: 16, color: colors.primary700 },
});
