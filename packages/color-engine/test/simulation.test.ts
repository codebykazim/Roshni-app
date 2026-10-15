import { describe, expect, it } from 'vitest';
import {
  CVD_TYPES,
  deltaE2000,
  rgbToLab,
  simulateRgb,
  simulationMatrix,
  toColourMatrix4x5,
  type CvdType,
  type RGB,
} from '../src';

const dE = (a: RGB, b: RGB) => deltaE2000(rgbToLab(a), rgbToLab(b));

describe('simulation matrices', () => {
  it('rows of every full-severity matrix sum to 1 (white and greys are preserved)', () => {
    for (const type of CVD_TYPES) {
      const m = simulationMatrix(type, 1);
      for (let row = 0; row < 3; row++) {
        expect(m[row * 3]! + m[row * 3 + 1]! + m[row * 3 + 2]!, `${type} row ${row}`).toBeCloseTo(1, 4);
      }
    }
  });

  it('is the identity at severity 0 for every type', () => {
    for (const type of CVD_TYPES) {
      for (const rgb of [[255, 0, 0], [12, 200, 90], [250, 240, 10], [3, 3, 250]] as RGB[]) {
        expect(simulateRgb(rgb, type, 0)).toEqual([...rgb]);
      }
    }
  });

  it('clamps severity outside 0..1', () => {
    expect(simulationMatrix('protan', 2)).toEqual(simulationMatrix('protan', 1));
    expect(simulationMatrix('protan', -1)).toEqual(simulationMatrix('protan', 0));
  });

  it('leaves greys, black and white unchanged', () => {
    for (const type of CVD_TYPES) {
      for (const v of [0, 64, 128, 200, 255]) {
        const out = simulateRgb([v, v, v], type, 1);
        for (const c of out) expect(Math.abs(c - v)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('builds a 4x5 colour matrix that keeps alpha and has no offsets', () => {
    const m = toColourMatrix4x5(simulationMatrix('deutan', 1));
    expect(m).toHaveLength(20);
    expect([m[3], m[4], m[8], m[9], m[13], m[14]]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(m.slice(15)).toEqual([0, 0, 0, 1, 0]);
  });
});

describe('simulated colour confusion', () => {
  const RED: RGB = [200, 50, 50];
  const GREEN: RGB = [60, 150, 60];

  it('red and green become much closer for protan and deutan viewers', () => {
    const normal = dE(RED, GREEN);
    for (const type of ['protan', 'deutan'] as CvdType[]) {
      const simulated = dE(simulateRgb(RED, type), simulateRgb(GREEN, type));
      expect(simulated, type).toBeLessThan(normal * 0.6);
    }
  });

  it('blue and green become closer for tritan viewers', () => {
    const BLUE: RGB = [40, 90, 220];
    const TEAL: RGB = [40, 170, 150];
    const normal = dE(BLUE, TEAL);
    expect(dE(simulateRgb(BLUE, 'tritan'), simulateRgb(TEAL, 'tritan'))).toBeLessThan(normal * 0.75);
  });

  it('pure red turns dark for protan viewers (reduced long-wavelength sensitivity)', () => {
    const before = rgbToLab([255, 0, 0]).L;
    const after = rgbToLab(simulateRgb([255, 0, 0], 'protan')).L;
    expect(after).toBeLessThan(before - 10); // about 53 -> 40 with the Machado matrix
  });

  it('achromatopsia gives grey with the same lightness', () => {
    for (const rgb of [[200, 50, 50], [60, 150, 60], [40, 90, 220], [250, 220, 20]] as RGB[]) {
      const out = simulateRgb(rgb, 'achromat');
      expect(Math.max(...out) - Math.min(...out)).toBeLessThanOrEqual(1);
      expect(Math.abs(rgbToLab(out).L - rgbToLab(rgb).L)).toBeLessThan(1.5);
    }
  });

  it('a milder severity changes colours less than full severity', () => {
    const full = dE(RED, simulateRgb(RED, 'deutan', 1));
    const half = dE(RED, simulateRgb(RED, 'deutan', 0.5));
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(full);
  });
});
