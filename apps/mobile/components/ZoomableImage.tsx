import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTranslation } from 'react-i18next';

import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import { useReduceMotion } from '@/lib/a11y/useReduceMotion';

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const STEP = 1.6;
const MARKER = 28;

interface Props {
  uri: string;
  width: number;
  height: number;
  /** Called with a tap position in the photo's own (unzoomed) coordinates, 0..width and 0..height. */
  onTap?: (x: number, y: number) => void;
  /** A dot drawn at a point of the photo, kept the same size whatever the zoom. */
  marker?: { x: number; y: number; color: string } | null;
}

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

/** Largest pan that keeps the photo covering the frame at this scale. */
function limit(scale: number, size: number): number {
  'worklet';
  return ((scale - 1) * size) / 2;
}

/**
 * Photo with pinch-to-zoom, drag to pan, and tap to pick a point. Zoom buttons are provided too,
 * because pinching is not possible for everyone. The gestures are attached to a fixed frame, so
 * tap positions are never affected by the zoom transform.
 */
export function ZoomableImage({ uri, width, height, onTap, marker }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReduceMotion();

  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const pinchScale = useSharedValue(1);
  const pinchTx = useSharedValue(0);
  const pinchTy = useSharedValue(0);
  const panTx = useSharedValue(0);
  const panTy = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      pinchScale.value = scale.value;
      pinchTx.value = tx.value;
      pinchTy.value = ty.value;
    })
    .onUpdate((e) => {
      const next = clamp(pinchScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      const ratio = next / pinchScale.value;
      // Keep the point under the fingers where it is while the scale changes.
      const fx = e.focalX - width / 2;
      const fy = e.focalY - height / 2;
      tx.value = clamp(fx - ratio * (fx - pinchTx.value), -limit(next, width), limit(next, width));
      ty.value = clamp(fy - ratio * (fy - pinchTy.value), -limit(next, height), limit(next, height));
      scale.value = next;
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onStart(() => {
      panTx.value = tx.value;
      panTy.value = ty.value;
    })
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      tx.value = clamp(panTx.value + e.translationX, -limit(scale.value, width), limit(scale.value, width));
      ty.value = clamp(panTy.value + e.translationY, -limit(scale.value, height), limit(scale.value, height));
    });

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e, success) => {
      if (!success || !onTap) return;
      // Undo the zoom: container position -> position in the photo.
      const x = width / 2 + (e.x - width / 2 - tx.value) / scale.value;
      const y = height / 2 + (e.y - height / 2 - ty.value) / scale.value;
      scheduleOnRN(onTap, x, y);
    });

  const gesture = Gesture.Race(tap, Gesture.Simultaneous(pinch, pan));

  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));
  const markerStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 / scale.value }] }));

  function zoomTo(next: number) {
    const target = clamp(next, MIN_SCALE, MAX_SCALE);
    const ratio = target / scale.value;
    const toX = clamp(tx.value * ratio, -limit(target, width), limit(target, width));
    const toY = clamp(ty.value * ratio, -limit(target, height), limit(target, height));
    const duration = reduceMotion ? 0 : 180;
    scale.value = withTiming(target, { duration });
    tx.value = withTiming(toX, { duration });
    ty.value = withTiming(toY, { duration });
  }

  function reset() {
    const duration = reduceMotion ? 0 : 180;
    scale.value = withTiming(1, { duration });
    tx.value = withTiming(0, { duration });
    ty.value = withTiming(0, { duration });
  }

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={t('result.photoLabel')}
          style={[styles.frame, { width, height }]}
        >
          <Animated.View style={[{ width, height }, photoStyle]}>
            <Image source={{ uri }} style={{ width, height }} />
            {marker ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.marker,
                  { left: marker.x - MARKER / 2, top: marker.y - MARKER / 2, backgroundColor: marker.color },
                  markerStyle,
                ]}
              />
            ) : null}
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('result.zoomOut')}
          onPress={() => zoomTo(scale.value / STEP)}
          style={styles.button}
        >
          <Ionicons name="remove" size={24} color={colors.primary700} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('result.zoomReset')}
          onPress={reset}
          style={styles.button}
        >
          <Ionicons name="scan-outline" size={22} color={colors.primary700} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('result.zoomIn')}
          onPress={() => zoomTo(scale.value * STEP)}
          style={styles.button}
        >
          <Ionicons name="add" size={24} color={colors.primary700} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm },
  frame: { overflow: 'hidden', borderRadius: radius.card, backgroundColor: colors.primary100 },
  marker: {
    position: 'absolute',
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    borderWidth: 3,
    borderColor: colors.white,
  },
  controls: { flexDirection: 'row', gap: space.sm },
  button: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.primary300,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
