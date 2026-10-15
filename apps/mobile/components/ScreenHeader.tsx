import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import { Text } from '@/components/AppText';

interface Props {
  title: string;
  subtitle?: string;
  /** Show a back button that returns to the previous screen. */
  back?: boolean;
  right?: ReactNode;
  /** Optional leading element (for example the logo on Home). */
  leading?: ReactNode;
}

export function ScreenHeader({ title, subtitle, back, right, leading }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.iconButton}
        >
          <Ionicons
            name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
            size={24}
            color={colors.white}
          />
        </Pressable>
      ) : (
        leading
      )}
      <View style={styles.titles}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary800,
    paddingHorizontal: space.xl,
    paddingBottom: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  iconButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { flex: 1 },
  title: { color: colors.white, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.primary200, fontSize: 14, marginTop: 2 },
});
