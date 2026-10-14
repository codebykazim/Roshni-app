import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/lib/i18n';
import { colors } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
        }}
      />
    </SafeAreaProvider>
  );
}
