export type RGB = readonly [number, number, number];

export interface Lab {
  L: number;
  a: number;
  b: number;
}

export interface Lch {
  L: number;
  C: number;
  h: number;
}

// D65 reference white
const WHITE = { x: 0.95047, y: 1.0, z: 1.08883 } as const;
const EPSILON = 216 / 24389;
const KAPPA = 24389 / 27;

export function srgbToLinear(value8: number): number {
  const c = value8 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(linear: number): number {
  const c = Math.min(1, Math.max(0, linear));
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(v * 255);
}

function labF(t: number): number {
  return t > EPSILON ? Math.cbrt(t) : (KAPPA * t + 16) / 116;
}

function labFInv(f: number): number {
  const f3 = f * f * f;
  return f3 > EPSILON ? f3 : (116 * f - 16) / KAPPA;
}

export function rgbToLab([r8, g8, b8]: RGB): Lab {
  const r = srgbToLinear(r8);
  const g = srgbToLinear(g8);
  const b = srgbToLinear(b8);
  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;
  const fx = labF(x / WHITE.x);
  const fy = labF(y / WHITE.y);
  const fz = labF(z / WHITE.z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export function labToRgb({ L, a, b }: Lab): [number, number, number] {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const x = labFInv(fx) * WHITE.x;
  const y = labFInv(fy) * WHITE.y;
  const z = labFInv(fz) * WHITE.z;
  const r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const g = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
  return [linearToSrgb(r), linearToSrgb(g), linearToSrgb(bl)];
}

export function labToLch({ L, a, b }: Lab): Lch {
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

export function rgbToHex([r, g, b]: RGB): string {
  const part = (n: number) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Invalid hex colour: ${hex}`);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHsl([r8, g8, b8]: RGB): { h: number; s: number; l: number } {
  const r = r8 / 255;
  const g = g8 / 255;
  const b = b8 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}
