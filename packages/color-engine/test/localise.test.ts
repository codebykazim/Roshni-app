import { describe, expect, it } from 'vitest';
import {
  BASE_FAMILIES,
  displayName,
  FAMILY_UR,
  hexToRgb,
  MODIFIER_UR,
  nameColour,
  REQUIRED_FAMILIES,
} from '../src';

describe('Urdu colour names', () => {
  it('has an Urdu name for every base colour family', () => {
    for (const family of REQUIRED_FAMILIES) expect(FAMILY_UR[family], family).toBeTruthy();
    expect(REQUIRED_FAMILIES).toHaveLength(BASE_FAMILIES.length);
  });

  it('has an Urdu word for every modifier the namer can produce', () => {
    for (const modifier of ['Light', 'Dark', 'Pale', 'Muted', 'Vivid', 'Greyish', 'Light greyish', 'Dark greyish'] as const) {
      expect(MODIFIER_UR[modifier], modifier).toBeTruthy();
    }
  });

  it('composes modifier + family in Urdu and keeps English as-is', () => {
    const dark = nameColour(hexToRgb('#8B0000'));
    expect(displayName(dark, 'en')).toBe(dark.name);
    const urdu = displayName(dark, 'ur');
    expect(urdu).toContain(FAMILY_UR[dark.family]!);
    if (dark.modifier) expect(urdu.startsWith(MODIFIER_UR[dark.modifier])).toBe(true);
  });

  it('names a plain family with no modifier', () => {
    expect(displayName({ name: 'Black', family: 'Black', modifier: '' }, 'ur')).toBe('کالا');
  });

  it('composes the tinted-neutral names', () => {
    const picked = nameColour(hexToRgb('#C3B0BD'));
    expect(displayName(picked, 'ur')).toBe('ہلکا سرمئی مائل گلابی');
  });

  it('falls back to English for an unknown family', () => {
    expect(displayName({ name: 'Zorple', family: 'Zorple', modifier: '' }, 'ur')).toBe('Zorple');
  });
});
