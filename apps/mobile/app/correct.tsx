import Ionicons from '@expo/vector-icons/Ionicons';
import { CORRECTABLE_TYPES, type CorrectableType } from '@roshni/color-engine';
import type { SkImage } from '@shopify/react-native-skia';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/AppText';
import { CompareView, PhotoView } from '@/components/CompareView';
import { DisclaimerNote } from '@/components/DisclaimerNote';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import { useCurrentAnalysis } from '@/lib/analysis/current';
import { getAnalysis } from '@/lib/db';
import { loadImage } from '@/lib/image/loadPixels';
import { imageFromDataUri, renderCorrected } from '@/lib/image/skiaHelpers';

type ViewMode = 'corrected' | 'original' | 'split';

const VIEWS: readonly ViewMode[] = ['corrected', 'original', 'split'];
const STRENGTHS = [0.25, 0.5, 0.75, 1] as const;
const MAX_IMAGE_HEIGHT = 380;
const STAGE_HEIGHT_SHARE = 0.4;

export default function CorrectScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const current = useCurrentAnalysis((s) => s.current);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [image, setImage] = useState<SkImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<CorrectableType>('deutan');
  const [strength, setStrength] = useState<number>(0.75);
  const [view, setView] = useState<ViewMode>('corrected');

  useEffect(() => {
    if (!id) return;
    if (current?.id === id && current.full) {
      setImage(current.full.image);
      return;
    }
    const saved = getAnalysis(id);
    if (saved) setImage(imageFromDataUri(saved.thumb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function pickPhoto() {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const uri = result.canceled ? null : result.assets[0]?.uri;
    if (!uri) return;
    try {
      setImage((await loadImage(uri)).full.image);
    } catch (e) {
      console.warn('correct load failed', e);
      setError(t('correct.loadError'));
    }
  }

  const corrected = useMemo(
    () => (image ? renderCorrected(image, type, strength) : null),
    [image, type, strength],
  );

  const layout = useMemo(() => {
    if (!image) return null;
    const aspect = image.width() / image.height();
    const maxHeight = Math.min(MAX_IMAGE_HEIGHT, screenHeight * STAGE_HEIGHT_SHARE);
    const width = Math.min(screenWidth - space.xl * 2, maxHeight * aspect);
    return { width, height: width / aspect };
  }, [image, screenWidth, screenHeight]);

  const experimental = (
    <View style={styles.badge} accessible accessibilityLabel={`${t('correct.experimental')}. ${t('correct.experimentalNote')}`}>
      <Ionicons name="flask-outline" size={18} color={colors.primary800} />
      <Text style={styles.badgeText}>
        <Text style={styles.badgeStrong}>{t('correct.experimental')}. </Text>
        {t('correct.experimentalNote')}
      </Text>
    </View>
  );

  if (!image || !layout || !corrected) {
    return (
      <View style={styles.screen}>
        <ScreenHeader back title={t('correct.title')} />
        <ScrollView contentContainerStyle={styles.content}>
          {experimental}
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="color-wand-outline" size={40} color={colors.primary600} />
            </View>
            <Text style={styles.emptyTitle}>{t('correct.choosePhoto')}</Text>
            <Text style={styles.body}>{t('correct.choosePhotoBody')}</Text>
            <Pressable accessibilityRole="button" onPress={pickPhoto} style={styles.primary}>
              <Ionicons name="images-outline" size={20} color={colors.white} />
              <Text style={styles.primaryText}>{t('correct.pick')}</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </ScrollView>
      </View>
    );
  }

  const label = `${t(`correct.${type}`)} · ${Math.round(strength * 100)}%`;
  return (
    <View style={styles.screen}>
      <ScreenHeader back title={t('correct.title')} />

      <View style={styles.stage}>
        {view === 'split' ? (
          <CompareView
            left={image}
            right={corrected}
            leftLabel={t('correct.original')}
            rightLabel={label}
            width={layout.width}
            height={layout.height}
          />
        ) : (
          <PhotoView
            image={view === 'original' ? image : corrected}
            label={view === 'original' ? t('correct.original') : label}
            width={layout.width}
            height={layout.height}
          />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View accessibilityRole="radiogroup" style={styles.segment}>
          {VIEWS.map((v) => {
            const selected = view === v;
            return (
              <Pressable
                key={v}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setView(v)}
                style={[styles.segmentItem, selected && styles.segmentItemSelected]}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {t(`correct.${v}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {view === 'split' ? <Text style={styles.hint}>{t('correct.splitHint')}</Text> : null}

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('correct.type')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CORRECTABLE_TYPES.map((m) => {
            const selected = type === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  setType(m);
                  if (view === 'original') setView('corrected');
                }}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                {selected ? <Ionicons name="checkmark" size={18} color={colors.white} /> : null}
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{t(`correct.${m}`)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.hint}>{t('correct.notSure')}</Text>

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('correct.strength')}
        </Text>
        <View accessibilityRole="radiogroup" style={styles.strengthRow}>
          {STRENGTHS.map((s) => {
            const selected = strength === s;
            return (
              <Pressable
                key={s}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setStrength(s)}
                style={[styles.strength, selected && styles.strengthSelected]}
              >
                <Text style={[styles.strengthText, selected && styles.strengthTextSelected]}>
                  {Math.round(s * 100)}%
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable accessibilityRole="button" onPress={pickPhoto} style={styles.secondary}>
          <Ionicons name="images-outline" size={20} color={colors.primary700} />
          <Text style={styles.secondaryText}>{t('correct.switchPhoto')}</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {experimental}
        <Text style={styles.caption}>{t('correct.caption')}</Text>
        <DisclaimerNote />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  stage: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  content: { padding: space.xl, paddingTop: space.sm, gap: space.md },
  badge: {
    flexDirection: 'row',
    gap: space.sm,
    backgroundColor: colors.primary100,
    borderRadius: radius.control,
    padding: space.md,
  },
  badgeText: { flex: 1, color: colors.primary800, fontSize: 13, lineHeight: 19 },
  badgeStrong: { fontWeight: '800' },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  body: { color: colors.inkSoft, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  error: { color: colors.red, fontSize: 14, textAlign: 'center' },
  hint: { color: colors.inkSoft, fontSize: 13, lineHeight: 19 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: space.sm },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.primary100,
    borderRadius: radius.control,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: TOUCH_TARGET - 4,
    borderRadius: radius.control - 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemSelected: { backgroundColor: colors.primary600 },
  segmentText: { color: colors.primary800, fontSize: 15, fontWeight: '600' },
  segmentTextSelected: { color: colors.white, fontWeight: '800' },
  chips: { gap: space.sm, paddingVertical: 2 },
  chip: {
    minHeight: TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary300,
    backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.primary600, borderColor: colors.primary600 },
  chipText: { color: colors.primary800, fontSize: 15, fontWeight: '600' },
  chipTextSelected: { color: colors.white, fontWeight: '800' },
  strengthRow: { flexDirection: 'row', gap: space.sm },
  strength: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthSelected: { borderColor: colors.primary600, backgroundColor: colors.primary100 },
  strengthText: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  strengthTextSelected: { color: colors.primary800, fontWeight: '800' },
  primary: {
    minHeight: TOUCH_TARGET + 8,
    alignSelf: 'stretch',
    borderRadius: radius.control,
    backgroundColor: colors.primary600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  secondary: {
    minHeight: TOUCH_TARGET + 8,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.primary300,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.sm,
  },
  secondaryText: { color: colors.primary700, fontSize: 17, fontWeight: '700' },
  caption: { color: colors.inkSoft, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
