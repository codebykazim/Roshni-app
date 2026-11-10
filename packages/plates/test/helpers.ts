import { makeNumberMask } from '../src/digits';
import type { Plate } from '../src/types';

/** Which dots of a stored plate belong to its hidden number. */
export function digitsMaskForPlate(plate: Plate): boolean[] {
  const mask = makeNumberMask(plate.answer);
  const flags: boolean[] = [];
  for (let i = 0; i + 3 < plate.dots.length; i += 4) {
    flags.push(mask(plate.dots[i]! / 1000, plate.dots[i + 1]! / 1000));
  }
  return flags;
}
