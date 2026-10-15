import { StyleSheet, Text as RNText, type TextProps } from 'react-native';

import { useSettings } from '@/lib/store/settings';

/** Font family names registered in the root layout (from @expo-google-fonts/noto-nastaliq-urdu). */
export const URDU_FONT_REGULAR = 'NotoNastaliqUrdu_400Regular';
export const URDU_FONT_BOLD = 'NotoNastaliqUrdu_700Bold';

/** Nastaliq has tall ascenders and long descenders; the line box must be roomy or text is clipped. */
const URDU_LINE_HEIGHT = 1.9;

/**
 * Drop-in replacement for React Native's Text. In Urdu it uses the bundled Noto Nastaliq Urdu font
 * so the app looks the same on every phone, with the extra line height that script needs.
 * In English it is the plain system Text.
 */
export function Text({ style, ...rest }: TextProps) {
  const language = useSettings((s) => s.language);
  if (language !== 'ur') return <RNText style={style} {...rest} />;

  const flat = StyleSheet.flatten(style) ?? {};
  const weight = flat.fontWeight;
  const bold = weight === 'bold' || (typeof weight === 'string' && Number(weight) >= 600);
  const fontSize = typeof flat.fontSize === 'number' ? flat.fontSize : 14;
  const lineHeight = Math.max(typeof flat.lineHeight === 'number' ? flat.lineHeight : 0, fontSize * URDU_LINE_HEIGHT);

  return (
    <RNText
      {...rest}
      style={[
        style,
        { fontFamily: bold ? URDU_FONT_BOLD : URDU_FONT_REGULAR, fontWeight: 'normal', lineHeight },
      ]}
    />
  );
}
