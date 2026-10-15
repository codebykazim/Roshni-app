import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import type { Language } from '@/lib/i18n';
import { useSettings } from '@/lib/store/settings';

const STEPS = 2;

/** First-run flow: choose a language, then see what the app asks for and the safety notice. */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const { language, changeLanguage, needsRestart, completeOnboarding } = useSettings();

  const titles = [t('onboarding.languageTitle'), t('onboarding.readyTitle')];

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: t('profile.english') },
    { code: 'ur', label: t('profile.urdu') },
  ];

  function finish() {
    completeOnboarding();
    router.replace('/');
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={titles[step] ?? ''}
        subtitle={t('onboarding.step', { current: step + 1, total: STEPS })}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 ? (
          <>
            <Text style={styles.body}>{t('onboarding.languageBody')}</Text>
            <View style={styles.languageRow}>
              {languages.map((o) => {
                const selected = language === o.code;
                return (
                  <Pressable
                    key={o.code}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => changeLanguage(o.code)}
                    style={[styles.language, selected && styles.languageSelected]}
                  >
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary600} />
                    ) : null}
                    <Text style={[styles.languageText, selected && styles.languageTextSelected]}>
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {needsRestart ? <Text style={styles.note}>{t('profile.restartNote')}</Text> : null}
          </>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Ionicons name="camera-outline" size={22} color={colors.primary700} />
                <Text style={styles.cardTitle}>{t('onboarding.permissionsTitle')}</Text>
              </View>
              <Text style={styles.cardBody}>{t('onboarding.permissionsBody')}</Text>
            </View>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {t('disclaimer.title')}
            </Text>
            <Text style={styles.body}>{t('profile.disclaimer')}</Text>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => (step < STEPS - 1 ? setStep(step + 1) : finish())}
          style={styles.primary}
        >
          <Text style={styles.primaryText}>
            {step < STEPS - 1 ? t('onboarding.next') : t('onboarding.start')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.xl, gap: space.lg },
  body: { color: colors.inkSoft, fontSize: 16, lineHeight: 24 },
  note: { color: colors.inkSoft, fontSize: 14 },
  languageRow: { gap: space.md },
  language: {
    minHeight: TOUCH_TARGET + 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  languageSelected: { borderColor: colors.primary600, backgroundColor: colors.primary100 },
  languageText: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  languageTextSelected: { color: colors.primary800 },
  card: { backgroundColor: colors.primary100, borderRadius: radius.card, padding: space.xl, gap: space.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  cardTitle: { color: colors.primary800, fontSize: 18, fontWeight: '800' },
  cardBody: { color: colors.primary800, fontSize: 15, lineHeight: 23 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: space.sm },
  footer: { padding: space.xl },
  primary: {
    minHeight: TOUCH_TARGET + 8,
    borderRadius: radius.control,
    backgroundColor: colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});
