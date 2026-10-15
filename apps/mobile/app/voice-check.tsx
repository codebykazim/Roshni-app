import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import { Text } from '@/components/AppText';

/** Spike screen (plan: Days 1-2): which TTS voices does this phone have, and does it speak Urdu? */
export default function VoiceCheckScreen() {
  const { t } = useTranslation();
  const [voices, setVoices] = useState<Speech.Voice[] | null>(null);

  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then(setVoices)
      .catch(() => setVoices([]));
    return () => {
      void Speech.stop();
    };
  }, []);

  const urdu = (voices ?? []).filter((v) => v.language.toLowerCase().startsWith('ur'));
  const english = (voices ?? []).filter((v) => v.language.toLowerCase().startsWith('en'));

  return (
    <View style={styles.screen}>
      <ScreenHeader back title={t('voiceCheck.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body}>{t('voiceCheck.intro')}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t('voiceCheck.voices')}: {voices ? voices.length : '…'}
          </Text>
          {voices ? (
            <>
              <Text style={styles.line}>English: {english.length}</Text>
              <Text style={[styles.line, { fontWeight: '800' }]}>
                {urdu.length > 0 ? `✅ ${t('voiceCheck.urduFound')}` : `❌ ${t('voiceCheck.urduMissing')}`}
              </Text>
              {urdu.map((v) => (
                <Text key={v.identifier} style={styles.small}>
                  {v.name} · {v.language} · {v.quality}
                </Text>
              ))}
            </>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.primary}
          onPress={() => {
            void Speech.stop();
            Speech.speak(t('voiceCheck.englishSample'), { language: 'en-US' });
          }}
        >
          <Text style={styles.primaryText}>{t('voiceCheck.speakEnglish')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.primary}
          onPress={() => {
            void Speech.stop();
            Speech.speak(t('voiceCheck.urduSample'), { language: 'ur-PK' });
          }}
        >
          <Text style={styles.primaryText}>{t('voiceCheck.speakUrdu')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => void Speech.stop()}>
          <Text style={styles.secondaryText}>{t('voiceCheck.stop')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.xl, gap: space.md },
  body: { color: colors.inkSoft, fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: colors.primary100, borderRadius: radius.card, padding: space.lg, gap: 6 },
  cardTitle: { color: colors.primary800, fontSize: 18, fontWeight: '800' },
  line: { color: colors.ink, fontSize: 16 },
  small: { color: colors.inkSoft, fontSize: 13 },
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
  secondaryText: { color: colors.primary700, fontSize: 16, fontWeight: '700' },
});
