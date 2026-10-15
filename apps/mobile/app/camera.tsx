import Ionicons from '@expo/vector-icons/Ionicons';
import { displayName, nameColour, type PickedColour } from '@roshni/color-engine';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { File } from 'expo-file-system';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DisclaimerNote } from '@/components/DisclaimerNote';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import { analyseAndSave } from '@/lib/analysis/analyseAndSave';
import { useCurrentAnalysis } from '@/lib/analysis/current';
import { readCentreColour } from '@/lib/image/skiaHelpers';
import { SPEECH_RATE, useSettings } from '@/lib/store/settings';
import { speak, stopSpeaking } from '@/lib/voice/speech';
import { Text } from '@/components/AppText';

/** Readings averaged to keep the label steady. */
const SMOOTHING = 3;
/** The same name for this long counts as "stable" and is spoken (when auto-read is on). */
const STABLE_MS = 900;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/**
 * Live colour reader. Uses repeated low-resolution snapshots of the camera and names the colour at
 * the centre circle, about once a second. This works in Expo Go; a frame-processor version
 * (react-native-vision-camera, development build) can later raise this to 8-10 readings a second.
 */
export default function CameraScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { language, autoRead, speechSpeed } = useSettings();
  const setCurrent = useCurrentAnalysis((s) => s.setCurrent);

  const cameraRef = useRef<CameraView>(null);
  const capturing = useRef(false);
  const recent = useRef<PickedColour[]>([]);
  const stableSince = useRef<number | null>(null);
  const lastKey = useRef('');
  const lastSpokenKey = useRef('');
  const warned = useRef(false);

  const [focused, setFocused] = useState(true);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [torch, setTorch] = useState(false);
  const [reading, setReading] = useState<PickedColour | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        void stopSpeaking();
      };
    }, []),
  );

  const say = useCallback(
    async (colour: PickedColour) => {
      const result = await speak(displayName(colour, language), language, SPEECH_RATE[speechSpeed]);
      setMessage(result === 'no-voice' ? t('result.noUrdu') : null);
    },
    [language, speechSpeed, t],
  );

  // Keep the latest `say` and `autoRead` available to the long-running loop below.
  const sayRef = useRef(say);
  sayRef.current = say;
  const autoReadRef = useRef(autoRead);
  autoReadRef.current = autoRead;

  useEffect(() => {
    if (!permission?.granted || !ready || !focused) return;
    let alive = true;

    async function loop() {
      while (alive) {
        if (!capturing.current && cameraRef.current) {
          try {
            const photo = await cameraRef.current.takePictureAsync({
              quality: 0.2,
              skipProcessing: true,
              shutterSound: false,
            });
            if (!photo?.uri) throw new Error('The camera returned no photo');
            const colour = await readCentreColour(photo.uri);
            try {
              new File(photo.uri).delete();
            } catch {
              // The OS clears the cache anyway.
            }
            if (colour && alive) onReading(colour);
          } catch (error) {
            // Log the first failure only; a failing loop would otherwise flood the console.
            if (!warned.current) {
              warned.current = true;
              console.warn('camera reading failed', error);
            }
            await sleep(500);
          }
        }
        await sleep(120);
      }
    }

    function onReading(colour: PickedColour) {
      recent.current = [...recent.current, colour].slice(-SMOOTHING);
      const rgb = [0, 1, 2].map((i) => median(recent.current.map((c) => c.rgb[i] ?? 0))) as [
        number,
        number,
        number,
      ];
      const named = nameColour(rgb);
      const hex = `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
      const smoothed: PickedColour = { hex, rgb, ...named };
      setReading(smoothed);

      const key = `${named.family}|${named.modifier}`;
      const now = Date.now();
      if (key !== lastKey.current) {
        lastKey.current = key;
        stableSince.current = now;
      } else if (
        stableSince.current !== null &&
        now - stableSince.current >= STABLE_MS &&
        autoReadRef.current &&
        key !== lastSpokenKey.current
      ) {
        lastSpokenKey.current = key;
        void sayRef.current(smoothed);
      }
    }

    void loop();
    return () => {
      alive = false;
    };
  }, [permission?.granted, ready, focused, facing]);

  async function capture() {
    if (!cameraRef.current || capturing.current) return;
    capturing.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      setCurrent(await analyseAndSave(photo.uri, 'live'));
      router.push('/result');
    } catch (error) {
      console.warn('capture failed', error);
      setMessage(t('upload.error'));
    } finally {
      capturing.current = false;
      setBusy(false);
    }
  }

  function flip() {
    setReady(false);
    setReading(null);
    recent.current = [];
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  }

  if (!permission) {
    return (
      <View style={styles.screen}>
        <ScreenHeader back title={t('camera.title')} />
        <ActivityIndicator style={{ marginTop: space.xxl }} color={colors.primary600} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <ScreenHeader back title={t('camera.title')} />
        <View style={styles.permission}>
          <Ionicons name="camera-outline" size={56} color={colors.primary600} />
          <Text style={styles.permissionTitle}>{t('camera.permissionTitle')}</Text>
          <Text style={styles.permissionBody}>{t('camera.permissionBody')}</Text>
          <Pressable accessibilityRole="button" onPress={requestPermission} style={styles.primary}>
            <Text style={styles.primaryText}>{t('camera.allow')}</Text>
          </Pressable>
          {!permission.canAskAgain ? (
            <Text style={styles.permissionBody}>{t('upload.cameraDenied')}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader back title={t('camera.title')} subtitle={t('camera.updateNote')} />
      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={torch}
          animateShutter={false}
          active={focused}
          onCameraReady={() => setReady(true)}
        />
        <View pointerEvents="none" style={styles.reticleWrap}>
          <View style={styles.reticleOuter}>
            <View style={styles.reticleInner} />
          </View>
        </View>
        <Text maxFontSizeMultiplier={1.3} style={styles.hint}>{t('camera.hint')}</Text>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + space.md }]}>
        <View
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={reading ? `${displayName(reading, language)}, ${reading.hex}` : t('camera.reading')}
          style={styles.reading}
        >
          <View style={[styles.swatch, { backgroundColor: reading?.hex ?? colors.primary100 }]} />
          <View style={{ flex: 1 }}>
            <Text maxFontSizeMultiplier={1.3} style={styles.name}>{reading ? displayName(reading, language) : t('camera.reading')}</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.hex}>{reading?.hex ?? ' '}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('camera.speak')}
            disabled={!reading}
            onPress={() => reading && void say(reading)}
            style={[styles.iconButton, !reading && { opacity: 0.4 }]}
          >
            <Ionicons name="volume-high-outline" size={24} color={colors.primary700} />
          </Pressable>
        </View>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('camera.flip')}
            onPress={flip}
            style={styles.iconButton}
          >
            <Ionicons name="camera-reverse-outline" size={24} color={colors.primary700} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={busy ? t('upload.analysing') : t('camera.capture')}
            disabled={busy}
            onPress={capture}
            style={[styles.capture, busy && { opacity: 0.6 }]}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="scan-outline" size={22} color={colors.white} />
                <Text maxFontSizeMultiplier={1.3} style={styles.captureText}>{t('camera.capture')}</Text>
              </>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={torch ? t('camera.torchOff') : t('camera.torchOn')}
            accessibilityState={{ selected: torch }}
            onPress={() => setTorch((v) => !v)}
            style={[styles.iconButton, torch && styles.iconButtonOn]}
          >
            <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={24} color={colors.primary700} />
          </Pressable>
        </View>
        <DisclaimerNote />
      </View>
    </View>
  );
}

const RETICLE = 56;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  reticleWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  reticleOuter: {
    width: RETICLE,
    height: RETICLE,
    borderRadius: RETICLE / 2,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleInner: {
    width: RETICLE - 14,
    height: RETICLE - 14,
    borderRadius: (RETICLE - 14) / 2,
    borderWidth: 2,
    borderColor: '#000',
  },
  hint: {
    position: 'absolute',
    bottom: space.md,
    alignSelf: 'center',
    color: colors.white,
    backgroundColor: 'rgba(20,10,31,0.72)',
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    fontSize: 13,
    overflow: 'hidden',
  },
  panel: { backgroundColor: colors.surface, padding: space.lg, gap: space.md },
  reading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.primary300,
    padding: space.md,
  },
  swatch: { width: 56, height: 56, borderRadius: radius.control, borderWidth: 1, borderColor: colors.border },
  name: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  hex: { color: colors.inkSoft, fontSize: 14 },
  message: { color: colors.red, fontSize: 13, lineHeight: 19 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  iconButton: {
    width: TOUCH_TARGET + 4,
    height: TOUCH_TARGET + 4,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.primary300,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonOn: { backgroundColor: colors.primary100, borderColor: colors.primary600 },
  capture: {
    flex: 1,
    minHeight: TOUCH_TARGET + 4,
    borderRadius: radius.control,
    backgroundColor: colors.primary600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  captureText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.md },
  permissionTitle: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  permissionBody: { color: colors.inkSoft, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  primary: {
    minHeight: TOUCH_TARGET + 8,
    alignSelf: 'stretch',
    borderRadius: radius.control,
    backgroundColor: colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});
