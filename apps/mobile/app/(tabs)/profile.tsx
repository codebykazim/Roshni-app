import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import type { Language } from '@/lib/i18n';
import { useSettings, type SpeechSpeed } from '@/lib/store/settings';
import { Text } from '@/components/AppText';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const {
    language,
    changeLanguage,
    needsRestart,
    autoRead,
    setAutoRead,
    speakOnTap,
    setSpeakOnTap,
    speechSpeed,
    setSpeechSpeed,
  } = useSettings();

  const speeds: { code: SpeechSpeed; label: string }[] = [
    { code: 'slow', label: t('profile.slow') },
    { code: 'normal', label: t('profile.normal') },
    { code: 'fast', label: t('profile.fast') },
  ];

  const options: { code: Language; label: string }[] = [
    { code: 'en', label: t('profile.english') },
    { code: 'ur', label: t('profile.urdu') },
  ];

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.about}>
          <View style={styles.aboutHead}>
            <Ionicons name="eye-outline" size={22} color={colors.primary700} />
            <Text style={styles.aboutTitle}>{t('profile.aboutTitle')}</Text>
          </View>
          <Text style={styles.aboutBody}>{t('profile.aboutBody')}</Text>
          <Text style={styles.version}>Version 0.1.0</Text>
        </View>

        <Text accessibilityRole="header" style={styles.label}>
          {t('profile.language')}
        </Text>
        <View style={styles.segment}>
          {options.map((o) => {
            const selected = language === o.code;
            return (
              <Pressable
                key={o.code}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => changeLanguage(o.code)}
                style={[styles.segmentItem, selected && styles.segmentSelected]}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {needsRestart ? <Text style={styles.note}>{t('profile.restartNote')}</Text> : null}

        <Text accessibilityRole="header" style={styles.label}>
          {t('profile.voiceSection')}
        </Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>{t('profile.autoRead')}</Text>
          <Switch
            accessibilityLabel={t('profile.autoRead')}
            value={autoRead}
            onValueChange={setAutoRead}
            trackColor={{ true: colors.primary600, false: colors.border }}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>{t('profile.speakOnTap')}</Text>
          <Switch
            accessibilityLabel={t('profile.speakOnTap')}
            value={speakOnTap}
            onValueChange={setSpeakOnTap}
            trackColor={{ true: colors.primary600, false: colors.border }}
          />
        </View>
        <Text style={styles.subLabel}>{t('profile.speed')}</Text>
        <View style={styles.segment}>
          {speeds.map((o) => {
            const selected = speechSpeed === o.code;
            return (
              <Pressable
                key={o.code}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setSpeechSpeed(o.code)}
                style={[styles.segmentItem, selected && styles.segmentSelected]}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={20} color={colors.blue} />
          <Text style={styles.disclaimerText}>{t('profile.disclaimer')}</Text>
        </View>

        <Text accessibilityRole="header" style={styles.label}>
          {t('profile.developer')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/voice-check')}
          style={styles.row}
        >
          <Ionicons name="mic-outline" size={22} color={colors.primary700} />
          <Text style={styles.rowText}>{t('profile.voiceCheck')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.xl, gap: space.md, paddingBottom: space.xxl },
  about: { backgroundColor: colors.primary100, borderRadius: radius.card, padding: space.xl, gap: space.sm },
  aboutHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  aboutTitle: { color: colors.primary800, fontSize: 18, fontWeight: '800' },
  aboutBody: { color: colors.primary800, fontSize: 15, lineHeight: 23 },
  version: { color: colors.primary700, fontSize: 13 },
  label: { color: colors.inkSoft, fontSize: 13, fontWeight: '700', marginTop: space.md, letterSpacing: 0.5 },
  segment: { flexDirection: 'row', gap: space.sm },
  segmentItem: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: { borderColor: colors.primary600, backgroundColor: colors.primary100 },
  segmentText: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  segmentTextSelected: { color: colors.primary800, fontWeight: '800' },
  note: { color: colors.inkSoft, fontSize: 14 },
  subLabel: { color: colors.inkSoft, fontSize: 14, marginTop: space.sm },
  toggleRow: {
    minHeight: TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    backgroundColor: colors.white,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  toggleText: { flex: 1, color: colors.ink, fontSize: 16 },
  disclaimer: {
    flexDirection: 'row',
    gap: space.sm,
    backgroundColor: colors.blueBg,
    borderRadius: radius.card,
    padding: space.lg,
    marginTop: space.md,
  },
  disclaimerText: { flex: 1, color: '#1E3A8A', fontSize: 14, lineHeight: 21 },
  row: {
    minHeight: TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.white,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
  },
  rowText: { color: colors.ink, fontSize: 16, fontWeight: '600' },
});
