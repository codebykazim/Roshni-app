export * from './types';
export * from './scoring';
export { plateSet } from './data';
export { unpackRgb, rgbToCss } from './colour';

import type { DotView, Plate } from './types';
import { rgbToCss } from './colour';

/** Dots of a stored plate in unit coordinates, ready to draw. */
export function plateDots(plate: Plate): DotView[] {
  const out: DotView[] = [];
  for (let i = 0; i + 3 < plate.dots.length; i += 4) {
    out.push({
      x: plate.dots[i]! / 1000,
      y: plate.dots[i + 1]! / 1000,
      r: plate.dots[i + 2]! / 1000,
      color: rgbToCss(plate.dots[i + 3]!),
    });
  }
  return out;
}
