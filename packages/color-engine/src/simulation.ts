import { linearToSrgb, srgbToLinear, type RGB } from './convert';

export type CvdType = 'protan' | 'deutan' | 'tritan' | 'achromat';

/** Row-major 3x3 matrix acting on linear RGB. */
export type Mat3 = readonly [number, number, number, number, number, number, number, number, number];

const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

/**
 * Full-severity dichromacy matrices from Machado, Oliveira and Fernandes (2009), "A
 * Physiologically-based Model for Simulation of Color Vision Deficiency". They operate on linear
 * RGB. Each row sums to 1, so white and greys are unchanged.
 */
const FULL: Record<'protan' | 'deutan' | 'tritan', Mat3> = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
};

/** Rec. 709 luminance weights (linear RGB): what a person with no cone-based colour vision keeps. */
const LUMA: Mat3 = [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722];

export const CVD_TYPES: readonly CvdType[] = ['protan', 'deutan', 'tritan', 'achromat'];

function clampSeverity(severity: number): number {
  return Math.min(1, Math.max(0, severity));
}

/**
 * Matrix for a CVD type at a severity from 0 (normal vision) to 1 (full). Intermediate severities
 * blend linearly between the identity and the full matrix, an approximation of anomalous
 * trichromacy.
 */
export function simulationMatrix(type: CvdType, severity = 1): Mat3 {
  const s = clampSeverity(severity);
  const full = type === 'achromat' ? LUMA : FULL[type];
  return full.map((v, i) => IDENTITY[i]! * (1 - s) + v * s) as unknown as Mat3;
}

/** How a colour looks to someone with the given deficiency. Gamma-correct. */
export function simulateRgb(rgb: RGB, type: CvdType, severity = 1): [number, number, number] {
  const m = simulationMatrix(type, severity);
  const r = srgbToLinear(rgb[0]);
  const g = srgbToLinear(rgb[1]);
  const b = srgbToLinear(rgb[2]);
  return [
    linearToSrgb(m[0] * r + m[1] * g + m[2] * b),
    linearToSrgb(m[3] * r + m[4] * g + m[5] * b),
    linearToSrgb(m[6] * r + m[7] * g + m[8] * b),
  ];
}

/**
 * The 4x5 colour matrix (row-major, offsets in the last column) a GPU colour filter expects, for
 * a 3x3 matrix applied to linear RGB. Alpha is untouched.
 */
export function toColourMatrix4x5(m: Mat3): number[] {
  return [
    m[0], m[1], m[2], 0, 0,
    m[3], m[4], m[5], 0, 0,
    m[6], m[7], m[8], 0, 0,
    0, 0, 0, 1, 0,
  ];
}
