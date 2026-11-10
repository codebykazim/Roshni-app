import type { PlateKind } from './types';

export interface PlateSpec {
  id: string;
  kind: PlateKind;
  answer: string;
  seed: number;
}

/**
 * The set, in the order the player sees it: a practice plate everyone can read, then red-green
 * plates, (blue-yellow plates are not shipped yet: see ADR 0006). Answers avoid look-alike pairs on purpose.
 */
export const PLATE_SPECS: readonly PlateSpec[] = [
  { id: 'p0', kind: 'demo', answer: '12', seed: 101 },
  { id: 'rg1', kind: 'rg', answer: '29', seed: 211 },
  { id: 'rg2', kind: 'rg', answer: '74', seed: 223 },
  { id: 'rg3', kind: 'rg', answer: '45', seed: 227 },
  { id: 'rg4', kind: 'rg', answer: '3', seed: 229 },
  { id: 'rg5', kind: 'rg', answer: '57', seed: 233 },
  { id: 'rg6', kind: 'rg', answer: '26', seed: 239 },
  { id: 'rg7', kind: 'rg', answer: '8', seed: 241 },
  { id: 'rg8', kind: 'rg', answer: '73', seed: 251 },
];

/** Numbers used as wrong answers; never equal to the plate's own answer. */
export const DISTRACTOR_POOL: readonly string[] = ['12', '29', '74', '45', '57', '26', '73', '16', '38', '42', '35', '68', '91', '83'];
export const SINGLE_DISTRACTOR_POOL: readonly string[] = ['2', '3', '5', '6', '8', '9', '4', '7'];
