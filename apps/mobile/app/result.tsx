import Ionicons from '@expo/vector-icons/Ionicons';
import { displayName, type PickedColour } from '@roshni/color-engine';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DisclaimerNote } from '@/components/DisclaimerNote';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ZoomableImage } from '@/components/ZoomableImage';
import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import { useCurrentAnalysis, type CurrentAnalysis } from '@/lib/analysis/current';
import { getAnalysis, setFavourite } from '@/lib/db';
import { pickFromImage } from '@/lib/image/pickPixel';
import { SPEECH_RATE, useSettings } from '@/lib/store/settings';
import { speak, stopSpeaking } from '@/lib/voice/speech';
import { buildSpokenSummary } from '@/lib/voice/summary';
import { Text } from '@/components/AppText';

const MAX_IMAGE_HEIGHT = 380;

export default function ResultScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const current = useCurrentAnalysis((s) => s.current);
  const { language, autoRead, speakOnTap, speechSpeed } = useSettings();
  const { width: screenWidth } = useWindowDimensions();

  // A fresh analysis keeps its pixels (tap-to-pick). One opened from history only has the thumbnail.
  const view: CurrentAnalysis | null = useMemo(() => {
    if (!id) return current;
    if (current?.id === id) return current;
    const saved = getAnalysis(id);
    return saved
      ? {
          id: saved.id,
          uri: saved.thumb,
          width: saved.width,
          height: saved.height,
          full: null,
          colours: saved.colours,
        }
      : null;
  }, [id, current]);

  const [picked, setPicked] = useState<{ colour: PickedColour; x: number; y: number } | null>(null);
  const [favourite, setFavouriteState] = useState(() =>
    view ? (getAnalysis(view.id)?.isFavourite ?? false) : false,
  );
  const [speaking, setSpeaking] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const autoReadDone = useRef(false);

  const rate = SPEECH_RATE[speechSpeed];

  async function say(text: string, markSpeaking: boolean) {
    setVoiceMessage(null);
    if (markSpeaking) setSpeaking(true);
    const result = await speak(text, language, rate, () => setSpeaking(false));
    if (result === 'no-voice') {
      setSpeaking(false);
      setVoiceMessage(t('result.noUrdu'));
    }
  }

  function readAloud() {
    if (!view) return;
    void say(buildSpokenSummary(view.colours, language, t), true);
  }

  async function stop() {
    await stopSpeaking();
    setSpeaking(false);
  }

  // Auto-read once, only for a freshly made analysis (not when reopening history).
  useEffect(() => {
    if (view && autoRead && !id && !autoReadDone.current) {
      autoReadDone.current = true;
      readAloud();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view?.id]);

  useEffect(() => {
    return () => {
      void stopSpeaking();
    };
  }, []);

  if (!view) return <Redirect href="/" />;

  // Fit the photo inside the available box while keeping its aspect ratio, so the touch
  // position maps straight onto the pixel buffer with no letterboxing.
  const aspect = view.width / view.height;
  const maxWidth = screenWidth - space.xl * 2;
  const displayW = Math.min(maxWidth, MAX_IMAGE_HEIGHT * aspect);
  const displayH = displayW / aspect;
  const canPick = view.full !== null;

  /** `x` and `y` are in the displayed photo's own coordinates (the zoom is already undone). */
  function onTap(x: number, y: number) {
    if (!view?.full) return;
    const { image, width, height } = view.full;
    const colour = pickFromImage(image, width, height, (x / displayW) * width, (y / displayH) * height);
    if (!colour) return;
    setPicked({ colour, x, y });
    if (speakOnTap) void say(displayName(colour, language), false);
  }

  function toggleFavourite() {
    const next = !favourite;
    setFavourite(view!.id, next);
    setFavouriteState(next);
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        back
        title={t('result.title')}
        subtitle={t('result.count', { count: view.colours.length })}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={favourite ? t('result.unfavourite') : t('result.favourite')}
            accessibilityState={{ selected: favourite }}
            onPress={toggleFavourite}
            style={styles.headerButton}
          >
            <Ionicons
              name={favourite ? 'heart' : 'heart-outline'}
              size={24}
              color={colors.white}
            />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ZoomableImage
          uri={view.uri}
          width={displayW}
          height={displayH}
          onTap={canPick ? onTap : undefined}
          marker={picked ? { x: picked.x, y: picked.y, color: picked.colour.hex } : null}
        />
        <Text style={styles.hint}>{canPick ? t('result.tapHint') : t('result.savedPhotoNote')}</Text>

        <Pressable
          accessibilityRole="button"
          onPress={speaking ? stop : readAloud}
          style={styles.speakButton}
        >
          <Ionicons name={speaking ? 'stop-circle-outline' : 'volume-high-outline'} size={22} color={colors.white} />
          <Text style={styles.speakText}>{speaking ? t('result.stop') : t('result.speak')}</Text>
        </Pressable>
        {voiceMessage ? (
          <Text accessibilityLiveRegion="polite" style={styles.voiceMessage}>
            {voiceMessage}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/simulate', params: { id: view.id } })}
          style={styles.secondaryButton}
        >
          <Ionicons name="eye-outline" size={20} color={colors.primary700} />
          <Text style={styles.secondaryText}>{t('result.simulate')}</Text>
        </Pressable>

        {picked ? (
          <View
            accessible
            accessibilityLiveRegion="polite"
            accessibilityLabel={`${t('result.picked')}: ${displayName(picked.colour, language)}, ${picked.colour.hex}`}
            style={styles.pickedCard}
          >
            <View style={[styles.swatchLarge, { backgroundColor: picked.colour.hex }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pickedLabel}>{t('result.picked')}</Text>
              <Text style={styles.pickedName}>{displayName(picked.colour, language)}</Text>
              <Text style={styles.hex}>{picked.colour.hex}</Text>
            </View>
          </View>
        ) : null}

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('result.palette')}
        </Text>
        {view.colours.length === 0 ? (
          <Text style={styles.hint}>{t('result.empty')}</Text>
        ) : (
          view.colours.map((c) => {
            const percent = Math.round(c.share * 100);
            const percentLabel = c.share < 0.01 ? '<1%' : `${percent}%`;
            const name = displayName(c, language);
            return (
              <View
                key={c.hex}
                accessible
                accessibilityLabel={`${name}, ${c.hex}, ${t('result.share', { percent: c.share < 0.01 ? '<1' : percent })}`}
                style={styles.row}
              >
                <View style={[styles.swatch, { backgroundColor: c.hex }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.hex}>{c.hex}</Text>
                </View>
                <Text style={styles.percent}>{percentLabel}</Text>
              </View>
            );
          })
        )}
        <DisclaimerNote />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.xl, gap: space.md, alignItems: 'stretch' },
  headerButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { color: colors.inkSoft, fontSize: 14, textAlign: 'center' },
  speakButton: {
    minHeight: TOUCH_TARGET + 8,
    borderRadius: radius.control,
    backgroundColor: colors.primary600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  speakText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  secondaryButton: {
    minHeight: TOUCH_TARGET + 8,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.primary300,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  secondaryText: { color: colors.primary700, fontSize: 17, fontWeight: '700' },
  voiceMessage: { color: colors.red, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  pickedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.primary300,
    padding: space.lg,
  },
  swatchLarge: { width: 64, height: 64, borderRadius: radius.control, borderWidth: 1, borderColor: colors.border },
  pickedLabel: { color: colors.inkSoft, fontSize: 13, fontWeight: '700' },
  pickedName: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  swatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
  name: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  hex: { color: colors.inkSoft, fontSize: 14 },
  percent: { color: colors.primary800, fontSize: 18, fontWeight: '800' },
});
