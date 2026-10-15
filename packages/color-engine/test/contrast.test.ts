import { describe, expect, it } from 'vitest';
import { colors } from '../../../apps/mobile/constants/theme';
import { contrastRatio, WCAG_AA_LARGE, WCAG_AA_TEXT } from '../src';

describe('contrastRatio', () => {
  it('matches WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    // #767676 is the lightest grey that passes AA on white; #777777 just fails.
    expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeLessThan(4.5);
    expect(contrastRatio('#9CA3AF', '#FFFFFF')).toBeLessThan(3); // old inactive tab grey
  });

  it('is symmetric', () => {
    expect(contrastRatio('#7C3AED', '#FFFFFF')).toBeCloseTo(contrastRatio('#FFFFFF', '#7C3AED'), 10);
  });
});

/**
 * Every text/background pair the app actually draws, checked against WCAG AA so a token change
 * cannot silently make text hard to read.
 */
describe('app colour tokens meet WCAG AA', () => {
  const textPairs: [string, string, string][] = [
    ['body text on page', colors.ink, colors.surface],
    ['secondary text on page', colors.inkSoft, colors.surface],
    ['secondary text on white cards', colors.inkSoft, colors.white],
    ['secondary text on lilac cards', colors.inkSoft, colors.primary100],
    ['text on tinted tip card', colors.primary800, colors.primary50],
    ['text on lilac about card', colors.primary800, colors.primary100],
    ['white on header', colors.white, colors.primary800],
    ['header subtitle', colors.primary200, colors.primary800],
    ['white on primary buttons', colors.white, colors.primary600],
    ['hero subtitle', colors.primary100, colors.primary600],
    ['purple text on white button', colors.primary700, colors.white],
    ['active tab label', colors.primary600, colors.white],
    ['inactive tab label', colors.mutedText, colors.white],
    ['white on dark test card', colors.white, colors.night],
    ['subtitle on dark test card', colors.primary300, colors.night],
    ['error text on page', colors.red, colors.surface],
    ['error text on white', colors.red, colors.white],
    ['disclaimer text', '#1E3A8A', colors.blueBg],
    ['selected row text', colors.primary800, colors.primary100],
  ];

  for (const [name, fg, bg] of textPairs) {
    it(`${name} (${fg} on ${bg})`, () => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    });
  }

  const iconPairs: [string, string, string][] = [
    ['tab icon, selected', colors.primary600, colors.white],
    ['tab icon, unselected', colors.mutedText, colors.white],
    ['icons on lilac', colors.primary600, colors.primary100],
    ['blue icon on blue tile', colors.blue, colors.blueBg],
    ['red icon on red tile', colors.red, colors.redBg],
    ['green icon on green tile', colors.green, colors.greenBg],
  ];
  for (const [name, fg, bg] of iconPairs) {
    it(`${name} (${fg} on ${bg}) at least 3:1`, () => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
    });
  }
});
