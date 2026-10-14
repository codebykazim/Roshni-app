import { labToRgb, rgbToHex, rgbToLab, type Lab } from './convert';
import { deltaE2000, deltaE76 } from './deltaE';

export interface PaletteColour {
  hex: string;
  rgb: [number, number, number];
  lab: Lab;
  /** Fraction of the counted pixels, 0..1 */
  share: number;
}

export interface PaletteOptions {
  /** Number of k-means clusters before merging. Default 10. */
  k?: number;
  /** Maximum colours returned. Default 6. */
  maxColours?: number;
  /** Drop colours below this share. Default 0.02 (2%). */
  minShare?: number;
  /** Merge clusters closer than this CIEDE2000 distance. Default 10. */
  mergeDeltaE?: number;
  /**
   * Small but very different colours (for example black text on a white page) are kept as
   * "accents" when they cover at least this share. Default 0.003 (0.3%).
   */
  accentMinShare?: number;
  /** An accent must differ from every kept colour by at least this CIEDE2000 distance. Default 35. */
  accentMinDeltaE?: number;
  /** Maximum accent colours added after the dominant ones. Default 2. */
  maxAccents?: number;
  /** Cap on the pixels sampled (stride sampling). Default 20000. */
  maxSamples?: number;
  /** Seed so results are repeatable. Default 1. */
  seed?: number;
  /** Alpha at or below this value is ignored. Default 127. */
  alphaCutoff?: number;
}

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Extract the dominant colours from RGBA pixel data (e.g. from a downscaled image).
 * Runs in CIELAB so clusters follow perceived difference, not raw RGB distance.
 */
export function extractPalette(
  rgba: Uint8Array | Uint8ClampedArray,
  options: PaletteOptions = {},
): PaletteColour[] {
  const k = options.k ?? 10;
  const maxColours = options.maxColours ?? 6;
  const minShare = options.minShare ?? 0.02;
  const mergeDeltaE = options.mergeDeltaE ?? 10;
  const accentMinShare = options.accentMinShare ?? 0.003;
  const accentMinDeltaE = options.accentMinDeltaE ?? 35;
  const maxAccents = options.maxAccents ?? 2;
  const maxSamples = options.maxSamples ?? 20000;
  const alphaCutoff = options.alphaCutoff ?? 127;
  const rand = mulberry32(options.seed ?? 1);

  const totalPixels = Math.floor(rgba.length / 4);
  const stride = Math.max(1, Math.floor(totalPixels / maxSamples));

  // Collect opaque pixels as Lab. Cache per unique RGB to avoid repeated conversion.
  const cache = new Map<number, Lab>();
  const samples: Lab[] = [];
  for (let p = 0; p < totalPixels; p += stride) {
    const i = p * 4;
    if ((rgba[i + 3] ?? 0) <= alphaCutoff) continue;
    const r = rgba[i] ?? 0;
    const g = rgba[i + 1] ?? 0;
    const b = rgba[i + 2] ?? 0;
    const key = (r << 16) | (g << 8) | b;
    let lab = cache.get(key);
    if (!lab) {
      lab = rgbToLab([r, g, b]);
      cache.set(key, lab);
    }
    samples.push(lab);
  }
  if (samples.length === 0) return [];

  const clusterCount = Math.min(k, samples.length);

  // k-means++ initialisation
  const centroids: Lab[] = [samples[Math.floor(rand() * samples.length)]!];
  const minDist = new Float64Array(samples.length).fill(Infinity);
  while (centroids.length < clusterCount) {
    const last = centroids[centroids.length - 1]!;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      const d = deltaE76(samples[i]!, last);
      const d2 = d * d;
      if (d2 < minDist[i]!) minDist[i] = d2;
      sum += minDist[i]!;
    }
    if (sum === 0) break; // all remaining samples coincide with a centroid
    let target = rand() * sum;
    let chosen = samples.length - 1;
    for (let i = 0; i < samples.length; i++) {
      target -= minDist[i]!;
      if (target <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push(samples[chosen]!);
  }

  // Lloyd iterations
  const assign = new Int32Array(samples.length);
  for (let iter = 0; iter < 20; iter++) {
    let moved = false;
    for (let i = 0; i < samples.length; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = deltaE76(samples[i]!, centroids[c]!);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (assign[i] !== best) {
        assign[i] = best;
        moved = true;
      }
    }
    const sums = centroids.map(() => ({ L: 0, a: 0, b: 0, n: 0 }));
    for (let i = 0; i < samples.length; i++) {
      const s = sums[assign[i]!]!;
      const lab = samples[i]!;
      s.L += lab.L;
      s.a += lab.a;
      s.b += lab.b;
      s.n += 1;
    }
    sums.forEach((s, c) => {
      if (s.n > 0) centroids[c] = { L: s.L / s.n, a: s.a / s.n, b: s.b / s.n };
    });
    if (!moved) break;
  }

  const counts = new Array<number>(centroids.length).fill(0);
  for (let i = 0; i < samples.length; i++) counts[assign[i]!] = (counts[assign[i]!] ?? 0) + 1;

  // Merge perceptually close clusters (weighted mean), largest first
  let clusters = centroids
    .map((lab, i) => ({ lab, n: counts[i] ?? 0 }))
    .filter((c) => c.n > 0)
    .sort((x, y) => y.n - x.n);

  const merged: { lab: Lab; n: number }[] = [];
  for (const c of clusters) {
    const near = merged.find((m) => deltaE2000(m.lab, c.lab) < mergeDeltaE);
    if (near) {
      const total = near.n + c.n;
      near.lab = {
        L: (near.lab.L * near.n + c.lab.L * c.n) / total,
        a: (near.lab.a * near.n + c.lab.a * c.n) / total,
        b: (near.lab.b * near.n + c.lab.b * c.n) / total,
      };
      near.n = total;
    } else {
      merged.push({ ...c });
    }
  }
  clusters = merged.sort((x, y) => y.n - x.n);

  const total = samples.length;
  const toColour = (c: { lab: Lab; n: number }): PaletteColour => {
    const rgb = labToRgb(c.lab);
    return { hex: rgbToHex(rgb), rgb, lab: c.lab, share: c.n / total };
  };

  // Dominant colours: by share, largest first. The largest is always kept.
  const result: PaletteColour[] = [];
  const rest: { lab: Lab; n: number }[] = [];
  for (const c of clusters) {
    const share = c.n / total;
    if (result.length < maxColours && (share >= minShare || result.length === 0)) {
      result.push(toColour(c));
    } else {
      rest.push(c);
    }
  }

  // Accents: tiny but unmistakably different colours that area-based ranking would drop.
  const accents = rest
    .filter((c) => c.n / total >= accentMinShare)
    .map((c) => ({ c, d: Math.min(...result.map((m) => deltaE2000(m.lab, c.lab))) }))
    .filter((x) => x.d >= accentMinDeltaE)
    .sort((x, y) => y.d - x.d)
    .slice(0, maxAccents)
    .map((x) => toColour(x.c))
    .sort((x, y) => y.share - x.share);

  return [...result, ...accents];
}
