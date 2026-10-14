import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IconName, inactive: IconName) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={26} color={color} />
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary600,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border, height: 64 },
        tabBarItemStyle: { paddingVertical: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home'), tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: t('tabs.history'), tabBarIcon: tabIcon('time', 'time-outline') }}
      />
      <Tabs.Screen
        name="favorites"
        options={{ title: t('tabs.favorites'), tabBarIcon: tabIcon('heart', 'heart-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
