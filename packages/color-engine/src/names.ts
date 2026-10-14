import { hexToRgb, labToLch, rgbToLab, type Lab, type RGB } from './convert';
import { deltaE2000 } from './deltaE';

export type ColourModifier =
  | ''
  | 'Light'
  | 'Dark'
  | 'Pale'
  | 'Muted'
  | 'Vivid'
  | 'Greyish'
  | 'Light greyish'
  | 'Dark greyish';

interface BaseColour {
  /** English name shown for a match, e.g. "Dark purple" */
  name: string;
  hex: string;
  /** Family used for translation and grouping. Defaults to `name`. */
  family?: string;
  /**
   * Fixed qualifier for anchors that are a specific shade of a family (Dark purple, Vivid orange).
   * When set, no lightness modifier is computed for a match with this anchor.
   */
  modifier?: ColourModifier;
}

/**
 * Anchor colours. The nearest one (CIEDE2000) gives the name. Plain anchors sit at a typical
 * lightness and get a Light / Dark / Pale / Vivid modifier from the sample; shade anchors carry
 * their own modifier. Accuracy is measured against the XKCD colour survey
 * (test/naming-accuracy.test.ts); add anchors where that test and real photos show mistakes.
 */
export const BASE_COLOURS: readonly BaseColour[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Red', hex: '#E02020' },
  { name: 'Orange', hex: '#FF9800' },
  { name: 'Dark orange', hex: '#C65102', family: 'Orange', modifier: 'Dark' },
  { name: 'Vivid orange', hex: '#FF5B00', family: 'Orange', modifier: 'Vivid' },
  { name: 'Yellow', hex: '#FFD600' },
  { name: 'Lime', hex: '#A4D400' },
  { name: 'Green', hex: '#2E9E3E' },
  { name: 'Dark green', hex: '#2F5233', family: 'Green', modifier: 'Dark' },
  { name: 'Olive', hex: '#7A7A22' },
  { name: 'Teal', hex: '#00897B' },
  { name: 'Dark teal', hex: '#045C5A', family: 'Teal', modifier: 'Dark' },
  { name: 'Turquoise', hex: '#30D5C8' },
  { name: 'Light turquoise', hex: '#7BF2DA', family: 'Turquoise', modifier: 'Light' },
  { name: 'Pale turquoise', hex: '#C3FBF4', family: 'Turquoise', modifier: 'Pale' },
  { name: 'Cyan', hex: '#00BCD4' },
  { name: 'Blue', hex: '#1E5FD6' },
  { name: 'Navy', hex: '#1A237E' },
  { name: 'Dark navy', hex: '#020035', family: 'Navy', modifier: 'Dark' },
  { name: 'Indigo', hex: '#4B3FBF' },
  { name: 'Vivid indigo', hex: '#5B21E6', family: 'Indigo', modifier: 'Vivid' },
  { name: 'Purple', hex: '#7B2CBF' },
  { name: 'Dark purple', hex: '#35063E', family: 'Purple', modifier: 'Dark' },
  { name: 'Magenta', hex: '#D500A8' },
  { name: 'Light magenta', hex: '#DD85D7', family: 'Magenta', modifier: 'Light' },
  { name: 'Dark magenta', hex: '#960056', family: 'Magenta', modifier: 'Dark' },
  { name: 'Pink', hex: '#F48FB1' },
  { name: 'Vivid pink', hex: '#FF2D6F', family: 'Pink', modifier: 'Vivid' },
  { name: 'Coral', hex: '#FF6F61' },
  { name: 'Maroon', hex: '#7B1F2E' },
  { name: 'Brown', hex: '#8D5A2B' },
  { name: 'Brown', hex: '#B25F03' },
  { name: 'Beige', hex: '#D9C3A0' },
  { name: 'Cream', hex: '#F5F0DC' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Mustard', hex: '#B79400' },
  { name: 'Tan', hex: '#D0A06A' },
  { name: 'Tan', hex: '#D1B26F' },
  { name: 'Khaki', hex: '#BDB76B' },
  { name: 'Peach', hex: '#FFCBA4' },
  { name: 'Lavender', hex: '#B39DDB' },
  { name: 'Mint', hex: '#98E3C0' },
  { name: 'Sky blue', hex: '#6EC6F5' },
];

/** Distinct families, for translation coverage. */
export const BASE_FAMILIES: readonly string[] = [
  ...new Set(BASE_COLOURS.map((c) => c.family ?? c.name)),
];

// Colours whose names already encode lightness; skip the Light/Dark modifier for these.
const NO_LIGHTNESS_MODIFIER = new Set([
  'Black',
  'White',
  'Navy',
  'Maroon',
  'Cream',
  'Beige',
  'Peach',
  'Lavender',
  'Mint',
  'Sky blue',
  'Pink',
  'Gold',
  'Mustard',
  'Coral',
  'Tan',
  'Khaki',
  'Olive',
  'Brown',
]);

const ANCHORS = BASE_COLOURS.map((c) => {
  const lab = rgbToLab(hexToRgb(c.hex));
  return {
    name: c.name,
    family: c.family ?? c.name,
    fixedModifier: c.modifier,
    lab,
    lch: labToLch(lab),
  };
});

export interface ColourName {
  /** English name with modifier, e.g. "Dark teal" */
  name: string;
  /** Base family, e.g. "Teal". Use with `modifier` to build a name in another language */
  family: string;
  /** Lightness / saturation qualifier, or '' when the family alone is the name */
  modifier: ColourModifier;
  /** CIEDE2000 distance to the matched base colour (lower is a closer match) */
  distance: number;
}

/** Neutral colours are named by lightness only; hue is meaningless at low chroma. */
function neutralName(L: number): ColourName {
  if (L < 14) return { name: 'Black', family: 'Black', modifier: '', distance: 0 };
  if (L >= 90) return { name: 'White', family: 'White', modifier: '', distance: 0 };
  if (L < 38) return { name: 'Dark grey', family: 'Grey', modifier: 'Dark', distance: 0 };
  if (L < 68) return { name: 'Grey', family: 'Grey', modifier: '', distance: 0 };
  return { name: 'Light grey', family: 'Grey', modifier: 'Light', distance: 0 };
}

// Hue families used to describe a muted colour that no base colour matches well.
// Magenta is listed so rosy-mauve hues (around 330-350 degrees) read as pink, not purple.
const TINT_FAMILIES = ['Red', 'Orange', 'Yellow', 'Green', 'Teal', 'Blue', 'Indigo', 'Purple', 'Magenta', 'Pink'];
const TINT_LABEL: Record<string, string> = { Magenta: 'Pink' };
const TINT_ANCHORS = ANCHORS.filter(
  (a) => a.fixedModifier === undefined && TINT_FAMILIES.includes(a.name),
);

/** Muted colours above this chroma that match no base colour within this distance get a tint name. */
const TINT_MAX_CHROMA = 22;
const TINT_MIN_DISTANCE = 12;
/** A colour closest to grey but with at least this chroma is "greyish <hue>", not plain grey. */
const GREY_TINT_MIN_CHROMA = 14;

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Warm, muted, not-light colours (skin, mud, coffee, dusty wood) are brown in everyday speech,
 * even though in a colour wheel they sit between red, orange and yellow.
 */
function warmMutedName(lch: { L: number; C: number; h: number }): ColourName | null {
  if (lch.h < 30 || lch.h > 100 || lch.C < 12 || lch.C > 35 || lch.L >= 66) return null;
  if (lch.L < 32) return { name: 'Dark brown', family: 'Brown', modifier: 'Dark', distance: 0 };
  if (lch.L < 50) return { name: 'Brown', family: 'Brown', modifier: '', distance: 0 };
  return { name: 'Light brown', family: 'Brown', modifier: 'Light', distance: 0 };
}

function tintName(lch: { L: number; h: number }, distance: number): ColourName {
  let tint = TINT_ANCHORS[0]!;
  for (const a of TINT_ANCHORS) {
    if (hueDistance(lch.h, a.lch.h) < hueDistance(lch.h, tint.lch.h)) tint = a;
  }
  const prefix: ColourModifier =
    lch.L >= 72 ? 'Light greyish' : lch.L < 35 ? 'Dark greyish' : 'Greyish';
  const label = TINT_LABEL[tint.name] ?? tint.name;
  return { name: `${prefix} ${label.toLowerCase()}`, family: label, modifier: prefix, distance };
}

export function nameColourFromLab(lab: Lab): ColourName {
  const lch = labToLch(lab);

  if (lch.C < 7) return neutralName(lch.L);
  // Almost-black with a trace of colour (very dark brown, very dark red) reads as black.
  if (lch.L < 12 && lch.C < 22) return neutralName(0);

  const warm = warmMutedName(lch);
  if (warm) return warm;

  let best = ANCHORS[0]!;
  let bestD = Infinity;
  for (const anchor of ANCHORS) {
    if (anchor.name === 'Black' || anchor.name === 'White') continue;
    const d = deltaE2000(lab, anchor.lab);
    if (d < bestD) {
      bestD = d;
      best = anchor;
    }
  }

  // Closest base colour is the grey anchor: neutral, unless there is a clear tint.
  if (best.name === 'Grey') {
    return lch.C >= GREY_TINT_MIN_CHROMA
      ? tintName(lch, bestD)
      : { ...neutralName(lch.L), distance: bestD };
  }

  // Muted colour with no good base match (for example a dusty pink): "Greyish pink".
  if (lch.C < TINT_MAX_CHROMA && bestD >= TINT_MIN_DISTANCE) return tintName(lch, bestD);

  // Shade anchors (Dark purple, Vivid orange…) already say what they are.
  if (best.fixedModifier !== undefined) {
    return { name: best.name, family: best.family, modifier: best.fixedModifier, distance: bestD };
  }

  let modifier: ColourModifier = '';
  if (!NO_LIGHTNESS_MODIFIER.has(best.name)) {
    if (lch.L - best.lch.L > 14) modifier = 'Light';
    else if (best.lch.L - lch.L > 14) modifier = 'Dark';
  }
  if (!modifier) {
    if (lch.C < best.lch.C * 0.45 && lch.L > 55) modifier = 'Pale';
    else if (lch.C < best.lch.C * 0.45) modifier = 'Muted';
    else if (lch.C > best.lch.C * 1.35 && lch.L > 35 && lch.L < 85) modifier = 'Vivid';
  }

  const name = modifier ? `${modifier} ${best.name.toLowerCase()}` : best.name;
  return { name, family: best.family, modifier, distance: bestD };
}

export function nameColour(rgb: RGB): ColourName {
  return nameColourFromLab(rgbToLab(rgb));
}
