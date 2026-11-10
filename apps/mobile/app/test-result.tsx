import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/AppText';
import { DisclaimerNote } from '@/components/DisclaimerNote';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import { getTestResult } from '@/lib/db';

export default function TestResultScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const result = id ? getTestResult(id) : null;
  if (!result) return <Redirect href="/" />;

  const flagged = result.outcome !== 'typical' && result.outcome !== 'retake';
  return (
    <View style={styles.screen}>
      <ScreenHeader back title={t('test.resultTitle')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, flagged ? styles.cardFlag : styles.cardOk]}>
          <Text accessibilityRole="header" style={styles.title}>
            {t(`test.outcome.${result.outcome}.title`)}
          </Text>
          <Text style={styles.body}>{t(`test.outcome.${result.outcome}.body`)}</Text>
          {result.outcome !== 'retake' ? (
            <Text style={styles.score}>
              {t('test.scoreRg', { missed: result.rgMisses, total: result.rgTotal })}
            </Text>
          ) : null}
        </View>

        <Text accessibilityRole="header" style={styles.sub}>
          {t('test.next_steps')}
        </Text>
        <Text style={styles.body}>{t('test.nextStepsBody')}</Text>
        <DisclaimerNote />

        <Pressable accessibilityRole="button" onPress={() => router.replace('/test')} style={styles.primary}>
          <Text style={styles.primaryText}>{t('test.retake')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.secondary}>
          <Text style={styles.secondaryText}>{t('test.done')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },
  card: { borderRadius: radius.card, padding: space.xl, gap: space.sm },
  cardOk: { backgroundColor: colors.greenBg },
  cardFlag: { backgroundColor: colors.primary100 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  body: { color: colors.inkSoft, fontSize: 16, lineHeight: 24 },
  score: { color: colors.ink, fontSize: 14, fontWeight: '600', marginTop: space.sm },
  sub: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  primary: {
    minHeight: TOUCH_TARGET + 8,
    borderRadius: radius.control,
    backgroundColor: colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  secondary: {
    minHeight: TOUCH_TARGET,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.primary300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.primary800, fontSize: 16, fontWeight: '600' },
});
