import { describe, expect, it } from 'vitest';

import data from '../data/plates.json';
import { makeNumberMask } from '../src/digits';
import { plateDots, scoreTest, type PlateSet } from '../src/index';
import { PLATE_SPECS } from '../src/specs';
import { HIDDEN_MAX, VISIBLE_MIN } from '../src/validate';

const set = data as unknown as PlateSet;

describe('stored plate set', () => {
  it('has one plate per spec, practice plate first', () => {
    expect(set.plates.map((p) => p.id)).toEqual(PLATE_SPECS.map((s) => s.id));
    expect(set.plates[0]!.kind).toBe('demo');
  });

  it('every plate offers its answer among four distinct choices', () => {
    for (const p of set.plates) {
      expect(p.choices).toHaveLength(4);
      expect(new Set(p.choices).size).toBe(4);
      expect(p.choices).toContain(p.answer);
    }
  });

  it('keeps dots inside the disc and without overlap', () => {
    for (const p of set.plates) {
      const dots = plateDots(p);
      expect(dots.length).toBeGreaterThan(200);
      for (const d of dots) expect(Math.hypot(d.x, d.y) + d.r).toBeLessThanOrEqual(1.001);
      let overlaps = 0;
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i]!;
          const b = dots[j]!;
          if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 0.004) overlaps++;
        }
      }
      expect(overlaps).toBe(0);
    }
  });

  it('is clear to normal vision and hidden from the viewers it targets', () => {
    for (const p of set.plates) {
      expect(p.metrics.normal).toBeGreaterThanOrEqual(VISIBLE_MIN);
      if (p.kind === 'rg') {
        expect(p.metrics.protan).toBeLessThanOrEqual(HIDDEN_MAX.rg);
        expect(p.metrics.deutan).toBeLessThanOrEqual(HIDDEN_MAX.rg);
      }
      if (p.kind === 'demo') expect(p.metrics.deutan).toBeGreaterThanOrEqual(VISIBLE_MIN);
    }
  });
});

describe('number mask', () => {
  it('marks some points as inside and the plate edge as outside', () => {
    const mask = makeNumberMask('8');
    expect(mask(0, -0.6)).toBe(true);
    expect(mask(0.98, 0)).toBe(false);
  });

  it('supports every digit', () => {
    for (const d of '0123456789') expect(() => makeNumberMask(d)).not.toThrow();
  });
});

describe('scoring', () => {
  const plates = set.plates;
  const allRight = Object.fromEntries(plates.map((p) => [p.id, p.answer]));

  it('reports typical when everything is read correctly', () => {
    expect(scoreTest(plates, allRight).outcome).toBe('typical');
  });

  it('asks for a retake when the practice plate is missed', () => {
    expect(scoreTest(plates, { ...allRight, p0: null }).outcome).toBe('retake');
  });

  it('flags red-green after three misses but not after two', () => {
    const rg = plates.filter((p) => p.kind === 'rg');
    const miss = (n: number) => ({ ...allRight, ...Object.fromEntries(rg.slice(0, n).map((p) => [p.id, null])) });
    expect(scoreTest(plates, miss(2)).outcome).toBe('typical');
    expect(scoreTest(plates, miss(3)).outcome).toBe('red-green');
  });
});
