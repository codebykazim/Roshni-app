import { correctRgb } from '@roshni/color-engine';
import { describe, expect, it } from 'vitest';

import data from '../data/plates.json';
import { unpackRgb } from '../src/colour';
import { digitsMaskForPlate } from './helpers';
import type { PlateSet } from '../src/types';
import { separability, type ClassifiedDot } from '../src/validate';

const set = data as unknown as PlateSet;

describe('daltonization measured with the plates', () => {
  for (const viewer of ['protan', 'deutan'] as const) {
    it(`makes hidden red-green numbers visible to a simulated ${viewer} viewer`, () => {
      let before = 0;
      let after = 0;
      const rg = set.plates.filter((p) => p.kind === 'rg');
      for (const plate of rg) {
        const flags = digitsMaskForPlate(plate);
        const original: ClassifiedDot[] = [];
        const corrected: ClassifiedDot[] = [];
        for (let i = 0; i < flags.length; i++) {
          const rgb = unpackRgb(plate.dots[i * 4 + 3]!);
          original.push({ rgb, figure: flags[i]! });
          corrected.push({ rgb: correctRgb(rgb, viewer), figure: flags[i]! });
        }
        before += separability(original, viewer);
        after += separability(corrected, viewer);
      }
      before /= rg.length;
      after /= rg.length;
      console.log(`${viewer}: separability before ${before.toFixed(3)}, after ${after.toFixed(3)}`);
      expect(after).toBeGreaterThan(before + 0.1);
    });
  }
});
