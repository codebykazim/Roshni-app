import { hexToRgb, srgbToLinear, type RGB } from './convert';

/** WCAG 2.x relative luminance of an sRGB colour (0 = black, 1 = white). */
export function relativeLuminance(rgb: RGB): number {
  return (
    0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2])
  );
}

/** WCAG contrast ratio between two hex colours, from 1 (identical) to 21 (black on white). */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexToRgb(hexA));
  const b = relativeLuminance(hexToRgb(hexB));
  const [light, dark] = a >= b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

/** WCAG 2.2 AA minimums: 4.5 for normal text, 3 for large text (18pt+, or 14pt bold) and icons. */
export const WCAG_AA_TEXT = 4.5;
export const WCAG_AA_LARGE = 3;
