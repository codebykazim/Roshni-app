import { describe, expect, it } from 'vitest';
import { analysePixels, pickColourAt } from '../src';

/** width x height image filled by a function of (x, y). */
function make(width: number, height: number, fill: (x: number, y: number) => [number, number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = fill(x, y);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  return data;
}

describe('analysePixels', () => {
  it('returns names, hex, hsl and shares for each dominant colour', () => {
    // Left half yellow, right half blue
    const img = make(40, 20, (x) => (x < 20 ? [255, 235, 0, 255] : [30, 95, 214, 255]));
    const result = analysePixels(img);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.family).sort()).toEqual(['Blue', 'Yellow']);
    for (const c of result) {
      expect(c.hex).toMatch(/^#[0-9A-F]{6}$/);
      expect(c.share).toBeCloseTo(0.5, 1);
      expect(c.hsl.s).toBeGreaterThan(0.5);
    }
  });
});

describe('pickColourAt', () => {
  const img = make(10, 10, (x) => (x < 5 ? [224, 32, 32, 255] : [30, 95, 214, 255]));

  it('names the colour under the point', () => {
    expect(pickColourAt(img, 10, 10, 1, 5)?.family).toBe('Red');
    expect(pickColourAt(img, 10, 10, 8, 5)?.family).toBe('Blue');
  });

  it('clamps points outside the image', () => {
    expect(pickColourAt(img, 10, 10, -20, -20)?.family).toBe('Red');
    expect(pickColourAt(img, 10, 10, 99, 99)?.family).toBe('Blue');
  });

  it('averages the neighbourhood across an edge', () => {
    const picked = pickColourAt(img, 10, 10, 4.5, 5, 2);
    expect(picked).not.toBeNull();
    // Mix of red and blue pixels: neither pure red nor pure blue
    expect(picked!.rgb[0]).toBeGreaterThan(30);
    expect(picked!.rgb[2]).toBeGreaterThan(32);
  });

  it('returns null when the window is fully transparent', () => {
    const clear = make(4, 4, () => [10, 10, 10, 0]);
    expect(pickColourAt(clear, 4, 4, 2, 2)).toBeNull();
  });
});
