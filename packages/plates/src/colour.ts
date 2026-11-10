import { labToRgb } from '@roshni/color-engine';

/** sRGB from lightness, chroma and hue (degrees) in CIELAB. Out-of-gamut colours are clipped. */
export function lchToRgb(L: number, C: number, hueDegrees: number): [number, number, number] {
  const h = (hueDegrees * Math.PI) / 180;
  return labToRgb({ L, a: C * Math.cos(h), b: C * Math.sin(h) });
}

export function packRgb([r, g, b]: readonly [number, number, number]): number {
  return (r << 16) | (g << 8) | b;
}

export function unpackRgb(value: number): [number, number, number] {
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function rgbToCss(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`;
}
