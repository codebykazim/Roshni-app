import { linearToSrgb, srgbToLinear, type RGB } from './convert';
import { simulationMatrix, type CvdType, type Mat3 } from './simulation';

/** Types a correction exists for. Total colour blindness (achromatopsia) has no colour to recover. */
export type CorrectableType = Exclude<CvdType, 'achromat'>;
export const CORRECTABLE_TYPES: readonly CorrectableType[] = ['protan', 'deutan', 'tritan'];

/**
 * Where the colour information a viewer loses is moved to. Red-green deficiencies lose red-green
 * contrast, so it is re-expressed as green and blue shifts; blue-yellow loses blue, which is
 * re-expressed in red and green. Rows are the output channel (R, G, B). The 0.7 factor follows the
 * widely used daltonization recipe of Fidaner, Lin and Ozguc (2005).
 */
const SHIFT: Record<CorrectableType, Mat3> = {
  protan: [0, 0, 0, 0.7, 1, 0, 0.7, 0, 1],
  deutan: [0, 0, 0, 0.7, 1, 0, 0.7, 0, 1],
  tritan: [1, 0, 0.7, 0, 1, 0.7, 0, 0, 0],
};

function mul(a: Mat3, b: Mat3): Mat3 {
  const out = new Array<number>(9).fill(0);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) out[i * 3 + j]! += a[i * 3 + k]! * b[k * 3 + j]!;
    }
  }
  return out as unknown as Mat3;
}

const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

/**
 * Daltonization as one matrix on linear RGB: C = I + strength * Shift * (I - Sim).
 * `I - Sim` is the colour the viewer cannot perceive; Shift moves it into channels they can.
 * Greys are unchanged (the simulation keeps them), and strength 0 is the identity.
 */
export function correctionMatrix(type: CorrectableType, strength = 1, severity = 1): Mat3 {
  const s = Math.min(1, Math.max(0, strength));
  const lost = simulationMatrix(type, severity).map((v, i) => IDENTITY[i]! - v) as unknown as Mat3;
  const shifted = mul(SHIFT[type], lost);
  return shifted.map((v, i) => IDENTITY[i]! + s * v) as unknown as Mat3;
}

/** A colour after correction. Gamma-correct, clipped to the sRGB gamut. */
export function correctRgb(rgb: RGB, type: CorrectableType, strength = 1, severity = 1): [number, number, number] {
  const m = correctionMatrix(type, strength, severity);
  const r = srgbToLinear(rgb[0]);
  const g = srgbToLinear(rgb[1]);
  const b = srgbToLinear(rgb[2]);
  return [
    linearToSrgb(m[0] * r + m[1] * g + m[2] * b),
    linearToSrgb(m[3] * r + m[4] * g + m[5] * b),
    linearToSrgb(m[6] * r + m[7] * g + m[8] * b),
  ];
}
