import Ionicons from '@expo/vector-icons/Ionicons';
import { Canvas, Image as SkiaImage, type SkImage } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/AppText';
import { colors, radius } from '@/constants/theme';

const CHIP_WIDTH = 112;
const CHIP_GAP = 10;

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

interface PhotoProps {
  image: SkImage;
  width: number;
  height: number;
  /** Small caption on the photo, e.g. "Deuteranopia · 100%" */
  label: string;
}

/** One photo with a caption saying what the viewer is looking at. */
export function PhotoView({ image, width, height, label }: PhotoProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.frame, { width, height }]}
    >
      <Canvas style={{ width, height }}>
        <SkiaImage image={image} x={0} y={0} width={width} height={height} fit="fill" />
      </Canvas>
      <View pointerEvents="none" style={[styles.caption, { left: 8 }]}>
        <Text numberOfLines={1} style={styles.chipText}>
          {label}
        </Text>
      </View>
    </View>
  );
}

interface CompareProps {
  /** Shown on the left of the line */
  left: SkImage;
  /** Shown on the right of the line */
  right: SkImage;
  leftLabel: string;
  rightLabel: string;
  width: number;
  height: number;
}

/**
 * Before/after view: the left photo (original) is to the left of a draggable line, the right
 * photo (simulated) to its right. Dragging the line right shows more of the original; dragging
 * it left shows more of the simulated one. Each label sits against the line, on the side of the
 * photo it names, so it is always clear which side is which. Drag sideways to move the line, tap
 * to jump it; scrolling up and down still scrolls the page. Screen readers can move the line with
 * the increment/decrement actions.
 */
export function CompareView({ left, right, leftLabel, rightLabel, width, height }: CompareProps) {
  const { t } = useTranslation();
  const split = useSharedValue(width / 2);

  useEffect(() => {
    split.value = width / 2;
  }, [width, split]);

  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onUpdate((e) => {
      split.value = clamp(e.x, 0, width);
    });
  const tap = Gesture.Tap().onEnd((e, success) => {
    if (success) split.value = clamp(e.x, 0, width);
  });
  const gesture = Gesture.Race(pan, tap);

  const revealStyle = useAnimatedStyle(() => ({ width: split.value }));
  const dividerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: split.value - 1.5 }] }));
  // Labels travel with the line and fade out when there is no room for them.
  const leftChipStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: split.value - CHIP_GAP - CHIP_WIDTH }],
    opacity: split.value > CHIP_WIDTH + CHIP_GAP * 2 ? 1 : 0,
  }));
  const rightChipStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: split.value + CHIP_GAP }],
    opacity: width - split.value > CHIP_WIDTH + CHIP_GAP * 2 ? 1 : 0,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('simulate.splitHint')}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          const step = width * 0.1;
          split.value = clamp(
            split.value + (event.nativeEvent.actionName === 'increment' ? step : -step),
            0,
            width,
          );
        }}
        style={[styles.frame, { width, height }]}
      >
        {/* Right photo underneath */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Canvas style={{ width, height }}>
            <SkiaImage image={right} x={0} y={0} width={width} height={height} fit="fill" />
          </Canvas>
        </View>

        {/* Left photo on top, revealed up to the line */}
        <Animated.View pointerEvents="none" style={[styles.reveal, { height }, revealStyle]}>
          <Canvas style={{ width, height }}>
            <SkiaImage image={left} x={0} y={0} width={width} height={height} fit="fill" />
          </Canvas>
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.divider, { height }, dividerStyle]}>
          <View style={styles.handle}>
            <Ionicons name="swap-horizontal" size={18} color={colors.primary800} />
          </View>
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.chip, styles.chipLeft, leftChipStyle]}>
          <Text numberOfLines={1} style={styles.chipText}>
            {leftLabel}
          </Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.chip, rightChipStyle]}>
          <Text numberOfLines={1} style={styles.chipText}>
            {rightLabel}
          </Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  frame: { alignSelf: 'center', borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.primary100 },
  reveal: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
  divider: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 3,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary300,
  },
  chip: {
    position: 'absolute',
    left: 0,
    top: 8,
    width: CHIP_WIDTH,
    backgroundColor: 'rgba(20,10,31,0.82)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  chipLeft: {},
  caption: {
    position: 'absolute',
    top: 8,
    maxWidth: '90%',
    backgroundColor: 'rgba(20,10,31,0.82)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  chipText: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
