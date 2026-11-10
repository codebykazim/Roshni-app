import { plateSet, scoreTest, type Answer } from '@roshni/plates';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/AppText';
import { PlateView } from '@/components/PlateView';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import { insertTestResult } from '@/lib/db';

export default function ColourTestScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const plates = plateSet.plates;
  // -1 shows the introduction; 0..n-1 are the plates.
  const [index, setIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const size = Math.min(width - space.xl * 2, 340);

  const answer = (plateId: string, value: Answer) => {
    const next = { ...answers, [plateId]: value };
    setAnswers(next);
    if (index + 1 < plates.length) {
      setIndex(index + 1);
      return;
    }
    const score = scoreTest(plates, next);
    const saved = insertTestResult({
      plateSetVersion: plateSet.version,
      outcome: score.outcome,
      rgMisses: score.rgMisses,
      rgTotal: score.rgTotal,
      answers: next,
    });
    router.replace({ pathname: '/test-result', params: { id: saved.id } });
  };

  if (index < 0) {
    return (
      <View style={styles.screen}>
        <ScreenHeader back title={t('test.title')} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.lead}>{t('test.intro')}</Text>
          <Text style={styles.body}>{t('test.tips')}</Text>
          <Text style={styles.note}>{t('test.notDiagnosis')}</Text>
          <Pressable accessibilityRole="button" onPress={() => setIndex(0)} style={styles.primary}>
            <Text style={styles.primaryText}>{t('test.start')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const plate = plates[index]!;
  return (
    <View style={styles.screen}>
      <ScreenHeader
        back
        title={plate.kind === 'demo' ? t('test.practice') : t('test.title')}
        subtitle={t('test.plateOf', { current: index + 1, total: plates.length })}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.plate}>
          <PlateView plate={plate} size={size} />
        </View>
        <Text accessibilityRole="header" style={styles.question}>
          {t('test.question')}
        </Text>
        <View style={styles.choices}>
          {plate.choices.map((choice) => (
            <Pressable
              key={choice}
              accessibilityRole="button"
              onPress={() => answer(plate.id, choice)}
              style={styles.choice}
            >
              <Text style={styles.choiceText}>{choice}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={() => answer(plate.id, null)} style={styles.secondary}>
          <Text style={styles.secondaryText}>{t('test.cantSee')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },
  lead: { color: colors.ink, fontSize: 20, fontWeight: '700', lineHeight: 28 },
  body: { color: colors.inkSoft, fontSize: 16, lineHeight: 24 },
  note: { color: colors.primary800, fontSize: 14, lineHeight: 20 },
  primary: {
    minHeight: TOUCH_TARGET + 8,
    borderRadius: radius.control,
    backgroundColor: colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
  },
  primaryText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  plate: { alignItems: 'center' },
  question: { color: colors.ink, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  choice: {
    width: '47%',
    flexGrow: 1,
    minHeight: TOUCH_TARGET + 12,
    borderRadius: radius.control,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: { color: colors.primary800, fontSize: 26, fontWeight: '800' },
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
