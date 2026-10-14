import { rgbToHsl, type RGB } from './convert';
import { nameColour, type ColourModifier, type ColourName } from './names';
import { extractPalette, type PaletteOptions } from './palette';

export interface AnalysedColour {
  hex: string;
  rgb: [number, number, number];
  hsl: { h: number; s: number; l: number };
  /** Fraction of the counted pixels, 0..1 */
  share: number;
  /** Human name with modifier, e.g. "Dark teal" */
  name: string;
  /** Base family, e.g. "Teal" */
  family: string;
  /** Qualifier used to build the name in other languages */
  modifier: ColourModifier;
}

/** Palette + names for RGBA pixel data (typically a downscaled image). */
export function analysePixels(
  rgba: Uint8Array | Uint8ClampedArray,
  options?: PaletteOptions,
): AnalysedColour[] {
  return extractPalette(rgba, options).map((c) => {
    const { name, family, modifier } = nameColour(c.rgb);
    return { hex: c.hex, rgb: c.rgb, hsl: rgbToHsl(c.rgb), share: c.share, name, family, modifier };
  });
}

export interface PickedColour {
  hex: string;
  rgb: [number, number, number];
  name: string;
  family: string;
  modifier: ColourModifier;
}

/**
 * Colour at a point: the average of a (2*radius+1)² neighbourhood, clamped to the image and
 * ignoring transparent pixels. Averaging makes tap-to-pick robust to noise and JPEG artefacts.
 * Returns null when every pixel in the window is transparent.
 */
export function pickColourAt(
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  radius = 2,
): PickedColour | null {
  const cx = Math.min(width - 1, Math.max(0, Math.round(x)));
  const cy = Math.min(height - 1, Math.max(0, Math.round(y)));
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let yy = Math.max(0, cy - radius); yy <= Math.min(height - 1, cy + radius); yy++) {
    for (let xx = Math.max(0, cx - radius); xx <= Math.min(width - 1, cx + radius); xx++) {
      const i = (yy * width + xx) * 4;
      if ((rgba[i + 3] ?? 0) <= 127) continue;
      r += rgba[i] ?? 0;
      g += rgba[i + 1] ?? 0;
      b += rgba[i + 2] ?? 0;
      n++;
    }
  }
  if (n === 0) return null;
  const rgb: RGB = [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  const named: ColourName = nameColour(rgb);
  const hex = `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  return {
    hex,
    rgb: [rgb[0], rgb[1], rgb[2]],
    name: named.name,
    family: named.family,
    modifier: named.modifier,
  };
}
