import { describe, expect, it } from 'vitest';
import {
  CORRECTABLE_TYPES,
  correctRgb,
  correctionMatrix,
  deltaE2000,
  rgbToLab,
  simulateRgb,
  type RGB,
} from '../src';

const dE = (a: RGB, b: RGB) => deltaE2000(rgbToLab(a), rgbToLab(b));

describe('daltonization', () => {
  it('is the identity at strength 0', () => {
    for (const type of CORRECTABLE_TYPES) {
      expect(correctionMatrix(type, 0)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    }
  });

  it('leaves greys, black and white unchanged', () => {
    for (const type of CORRECTABLE_TYPES) {
      for (const v of [0, 90, 180, 255]) {
        const out = correctRgb([v, v, v], type);
        out.forEach((c) => expect(Math.abs(c - v)).toBeLessThanOrEqual(1));
      }
    }
  });

  // Colours a red-green deficient viewer confuses: the corrected pair should be easier to tell
  // apart *as that viewer sees it* than the original pair was.
  const confusable: [RGB, RGB][] = [
    [[200, 60, 50], [90, 150, 60]],
    [[180, 90, 40], [110, 140, 50]],
    [[220, 80, 120], [100, 120, 110]],
    [[150, 60, 60], [70, 100, 60]],
    [[230, 150, 130], [150, 190, 130]],
  ];

  for (const type of ['protan', 'deutan'] as const) {
    it(`makes confusable red-green pairs easier to separate for ${type}`, () => {
      let before = 0;
      let after = 0;
      for (const [a, b] of confusable) {
        before += dE(simulateRgb(a, type), simulateRgb(b, type));
        after += dE(simulateRgb(correctRgb(a, type), type), simulateRgb(correctRgb(b, type), type));
      }
      expect(after).toBeGreaterThan(before * 1.3);
    });
  }
});
