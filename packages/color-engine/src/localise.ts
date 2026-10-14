import { BASE_FAMILIES, type ColourModifier } from './names';

export type NameLanguage = 'en' | 'ur';

/**
 * Urdu names for each base colour family. These are a first draft and need review by a
 * native speaker before release (see docs/phase-1-build-plan.md, decisions).
 */
export const FAMILY_UR: Record<string, string> = {
  Black: 'کالا',
  White: 'سفید',
  Grey: 'سرمئی',
  Red: 'سرخ',
  Orange: 'نارنجی',
  Yellow: 'پیلا',
  Lime: 'لائم',
  Green: 'ہرا',
  Olive: 'زیتونی',
  Teal: 'سبز نیلا',
  Turquoise: 'فیروزی',
  Cyan: 'سیان',
  Blue: 'نیلا',
  Navy: 'گہرا نیلا',
  Indigo: 'انڈیگو',
  Purple: 'جامنی',
  Magenta: 'ارغوانی',
  Pink: 'گلابی',
  Maroon: 'عنابی',
  Brown: 'بھورا',
  Beige: 'بیج',
  Cream: 'کریمی',
  Gold: 'سنہری',
  Mustard: 'سرسوں جیسا',
  Coral: 'مرجانی',
  Tan: 'ہلکا بھورا',
  Khaki: 'خاکی',
  Peach: 'آڑو جیسا',
  Lavender: 'لیوینڈر',
  Mint: 'پودینی',
  'Sky blue': 'آسمانی',
};

export const MODIFIER_UR: Record<Exclude<ColourModifier, ''>, string> = {
  Light: 'ہلکا',
  Dark: 'گہرا',
  Pale: 'پھیکا',
  Muted: 'مدھم',
  Vivid: 'شوخ',
  Greyish: 'سرمئی مائل',
  'Light greyish': 'ہلکا سرمئی مائل',
  'Dark greyish': 'گہرا سرمئی مائل',
};

export interface NamedColourParts {
  /** English display name, already composed (e.g. "Dark teal") */
  name: string;
  family: string;
  modifier: ColourModifier;
}

/** Name to show or speak in the given language. Falls back to English if a part is unknown. */
export function displayName(colour: NamedColourParts, language: NameLanguage): string {
  if (language === 'en') return colour.name;
  const family = FAMILY_UR[colour.family];
  if (!family) return colour.name;
  if (!colour.modifier) return family;
  const modifier = MODIFIER_UR[colour.modifier];
  return modifier ? `${modifier} ${family}` : family;
}

/** Families that must have an Urdu name; used by tests so a new base colour cannot ship without one. */
export const REQUIRED_FAMILIES: readonly string[] = BASE_FAMILIES;
