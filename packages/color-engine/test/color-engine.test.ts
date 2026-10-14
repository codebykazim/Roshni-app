import { describe, expect, it } from 'vitest';
import {
  deltaE2000,
  extractPalette,
  hexToRgb,
  labToRgb,
  nameColour,
  rgbToHex,
  rgbToLab,
  type RGB,
} from '../src';

/** Build RGBA pixel data from [colour, pixelCount] blocks. */
function image(blocks: [RGB, number][], alpha = 255): Uint8ClampedArray {
  const total = blocks.reduce((n, [, c]) => n + c, 0);
  const data = new Uint8ClampedArray(total * 4);
  let p = 0;
  for (const [[r, g, b], count] of blocks) {
    for (let i = 0; i < count; i++, p++) {
      data[p * 4] = r;
      data[p * 4 + 1] = g;
      data[p * 4 + 2] = b;
      data[p * 4 + 3] = alpha;
    }
  }
  return data;
}

describe('colour conversion', () => {
  it('converts sRGB red to the reference Lab value', () => {
    const lab = rgbToLab([255, 0, 0]);
    expect(lab.L).toBeCloseTo(53.24, 1);
    expect(lab.a).toBeCloseTo(80.09, 1);
    expect(lab.b).toBeCloseTo(67.2, 1);
  });

  it('maps white to L=100 and black to L=0', () => {
    expect(rgbToLab([255, 255, 255]).L).toBeCloseTo(100, 1);
    expect(rgbToLab([0, 0, 0]).L).toBeCloseTo(0, 5);
  });

  it('round-trips RGB through Lab', () => {
    for (const rgb of [[12, 200, 90], [250, 240, 10], [3, 3, 250], [128, 64, 32]] as RGB[]) {
      expect(labToRgb(rgbToLab(rgb))).toEqual([...rgb]);
    }
  });

  it('round-trips hex', () => {
    expect(rgbToHex(hexToRgb('#1e88e5'))).toBe('#1E88E5');
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(() => hexToRgb('nope')).toThrow();
  });
});

describe('CIEDE2000', () => {
  // Reference pairs from Sharma, Wu, Dalal (2005)
  it('matches published test pair 1', () => {
    const d = deltaE2000({ L: 50, a: 2.6772, b: -79.7751 }, { L: 50, a: 0, b: -82.7485 });
    expect(d).toBeCloseTo(2.0425, 3);
  });
  it('matches published test pair 2', () => {
    const d = deltaE2000({ L: 50, a: 3.1571, b: -77.2803 }, { L: 50, a: 0, b: -82.7485 });
    expect(d).toBeCloseTo(2.8615, 3);
  });
  it('is zero for identical colours', () => {
    const lab = rgbToLab([10, 20, 30]);
    expect(deltaE2000(lab, lab)).toBe(0);
  });
});

describe('colour naming', () => {
  it('names neutrals by lightness', () => {
    expect(nameColour([0, 0, 0]).name).toBe('Black');
    expect(nameColour([255, 255, 255]).name).toBe('White');
    expect(nameColour([128, 128, 128]).name).toBe('Grey');
  });

  it('names pure primaries and secondaries into the right family', () => {
    expect(nameColour([255, 0, 0]).family).toBe('Red');
    expect(nameColour([0, 0, 255]).family).toMatch(/Blue|Indigo/);
    expect(nameColour([255, 255, 0]).family).toBe('Yellow');
    expect(nameColour([0, 255, 0]).family).toMatch(/Green|Lime/);
    expect(nameColour([255, 165, 0]).family).toBe('Orange');
    expect(nameColour([255, 0, 255]).family).toMatch(/Magenta|Purple|Pink/);
  });

  it('names golden everyday colours', () => {
    expect(nameColour([141, 90, 43]).family).toBe('Brown'); // wood grain
    expect(nameColour([255, 235, 0]).family).toBe('Yellow'); // yellow poster
    expect(nameColour([0, 128, 128]).family).toMatch(/Teal/);
    expect(nameColour([255, 182, 193]).family).toMatch(/Pink|Peach/);
  });

  it('names muted colours from real photos instead of forcing a bright base colour', () => {
    // From a phone photo of a maroon quilted fabric with a white pattern (Oct 2026 device test)
    expect(nameColour(hexToRgb('#6B1B28')).family).toBe('Maroon');
    expect(nameColour(hexToRgb('#C3B0BD')).name).toBe('Light greyish pink'); // was "Pale lavender"
    expect(nameColour(hexToRgb('#A58090')).name).toBe('Greyish pink');
  });

  it('keeps warm neutrals as beige or grey', () => {
    expect(nameColour(hexToRgb('#D9C3A0')).family).toBe('Beige');
    expect(nameColour(hexToRgb('#B8A99A')).family).toBe('Beige');
    expect(nameColour(hexToRgb('#8A7F80')).name).toBe('Grey');
    expect(nameColour(hexToRgb('#9E8E86')).family).toBe('Grey');
  });

  it('names everyday warm colours as brown, tan or khaki (skin, mud, coffee, wood)', () => {
    // From a phone photo of a hand holding a receipt (Oct 2026): skin was named "Greyish red"
    expect(nameColour(hexToRgb('#A37A6B')).family).toBe('Brown');
    expect(nameColour(hexToRgb('#B08D7A')).family).toBe('Brown');
    expect(nameColour(hexToRgb('#5C4033')).name).toBe('Dark brown');
    expect(nameColour(hexToRgb('#4B3621')).name).toBe('Dark brown');
    expect(nameColour(hexToRgb('#6B5B45')).family).toBe('Brown');
    expect(nameColour(hexToRgb('#C68642')).family).toMatch(/Tan|Brown/);
    expect(nameColour(hexToRgb('#E0AC69')).family).toBe('Tan');
    expect(nameColour(hexToRgb('#C19A6B')).family).toMatch(/Tan|Beige/);
    expect(nameColour(hexToRgb('#BDB76B')).family).toBe('Khaki');
  });

  it('names everyday cool and green colours sensibly', () => {
    expect(nameColour(hexToRgb('#2F5233')).name).toBe('Dark green');
    expect(nameColour(hexToRgb('#4C9A2A')).family).toBe('Green');
    expect(nameColour(hexToRgb('#87CEEB')).family).toBe('Sky blue');
    expect(nameColour(hexToRgb('#CFDCEB')).name).toMatch(/blue/i);
    expect(nameColour(hexToRgb('#504E44')).name).toBe('Dark grey'); // asphalt
  });

  it('adds lightness modifiers', () => {
    expect(nameColour([120, 0, 0]).name.toLowerCase()).toMatch(/dark|maroon/);
    expect(nameColour([255, 150, 150]).name.toLowerCase()).toMatch(/light|pink|pale|coral|salmon/);
  });
});

describe('palette extraction', () => {
  it('finds the dominant colours in order with sensible shares', () => {
    const palette = extractPalette(
      image([
        [[224, 32, 32], 5000],
        [[30, 95, 214], 3000],
        [[255, 214, 0], 2000],
      ]),
    );
    expect(palette).toHaveLength(3);
    expect(nameColour(palette[0]!.rgb).family).toBe('Red');
    expect(palette[0]!.share).toBeCloseTo(0.5, 1);
    expect(nameColour(palette[1]!.rgb).family).toMatch(/Blue/);
    expect(nameColour(palette[2]!.rgb).family).toBe('Yellow');
  });

  it('is repeatable for the same input and seed', () => {
    const data = image([
      [[200, 50, 50], 4000],
      [[50, 200, 50], 3000],
      [[50, 50, 200], 3000],
    ]);
    expect(extractPalette(data, { seed: 7 })).toEqual(extractPalette(data, { seed: 7 }));
  });

  it('ignores transparent pixels', () => {
    const opaque = image([[[255, 0, 0], 1000]]);
    const clear = image([[[0, 0, 255], 1000]], 0);
    const merged = new Uint8ClampedArray(opaque.length + clear.length);
    merged.set(opaque);
    merged.set(clear, opaque.length);
    const palette = extractPalette(merged);
    expect(palette).toHaveLength(1);
    expect(nameColour(palette[0]!.rgb).family).toBe('Red');
  });

  it('returns an empty list for an empty or fully transparent image', () => {
    expect(extractPalette(new Uint8ClampedArray(0))).toEqual([]);
    expect(extractPalette(image([[[1, 2, 3], 50]], 0))).toEqual([]);
  });

  it('keeps a lone dominant colour even when its share is 100%', () => {
    const palette = extractPalette(image([[[0, 128, 128], 2000]]));
    expect(palette).toHaveLength(1);
    expect(palette[0]!.share).toBeCloseTo(1, 5);
  });

  it('does not report a yellow poster with black text as red/purple/orange/teal', () => {
    const palette = extractPalette(
      image([
        [[255, 235, 0], 8500],
        [[10, 10, 10], 1500],
      ]),
    );
    const families = palette.map((c) => nameColour(c.rgb).family);
    expect(families[0]).toBe('Yellow');
    expect(families).not.toContain('Purple');
    expect(families).not.toContain('Teal');
  });

  it('keeps small but very different colours, like black text on a white page', () => {
    // 99.4% white page, 0.6% black text
    const palette = extractPalette(
      image([
        [[252, 251, 254], 9940],
        [[12, 12, 14], 60],
      ]),
    );
    const names = palette.map((c) => nameColour(c.rgb).name);
    expect(names[0]).toBe('White');
    expect(names).toContain('Black');
    const black = palette.find((c) => nameColour(c.rgb).name === 'Black')!;
    expect(black.share).toBeLessThan(0.02);
  });

  it('does not add an accent for a tiny, nearly identical shade', () => {
    const palette = extractPalette(
      image([
        [[252, 251, 254], 9900],
        [[245, 245, 248], 100],
      ]),
    );
    expect(palette).toHaveLength(1);
  });

  it('ignores specks below the accent threshold', () => {
    // 4 black pixels in 10,000 = 0.04%
    const palette = extractPalette(
      image([
        [[252, 251, 254], 9996],
        [[0, 0, 0], 4],
      ]),
    );
    expect(palette).toHaveLength(1);
  });

  it('adds at most two accents', () => {
    const palette = extractPalette(
      image([
        [[252, 251, 254], 9700],
        [[0, 0, 0], 100],
        [[220, 0, 0], 100],
        [[0, 0, 220], 100],
      ]),
    );
    expect(palette.length).toBeLessThanOrEqual(3);
  });

  it('merges a smooth gradient into few colours', () => {
    const blocks: [RGB, number][] = [];
    for (let i = 0; i < 100; i++) blocks.push([[i * 2, 40, 40], 50]);
    const palette = extractPalette(image(blocks));
    expect(palette.length).toBeLessThanOrEqual(6);
    expect(palette.length).toBeGreaterThanOrEqual(1);
  });
});
