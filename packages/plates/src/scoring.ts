import type { Plate } from './types';

/** `null` means the player chose "I can't see a number". */
export type Answer = string | null;

export type Outcome = 'typical' | 'red-green' | 'blue-yellow' | 'both' | 'retake';

export interface TestScore {
  outcome: Outcome;
  rgMisses: number;
  rgTotal: number;
  byMisses: number;
  byTotal: number;
  practiceOk: boolean;
}

/** Misses at or above these counts flag a possible difficulty. */
export const RG_FLAG = 3;
export const BY_FLAG = 2;

/**
 * Turns answers into a screening outcome. This is a screening aid: it never names a diagnosis, and
 * it deliberately does not try to tell protan from deutan, which the plates cannot separate
 * reliably.
 */
export function scoreTest(plates: readonly Plate[], answers: Record<string, Answer>): TestScore {
  let rgMisses = 0;
  let rgTotal = 0;
  let byMisses = 0;
  let byTotal = 0;
  let practiceOk = true;

  for (const plate of plates) {
    const correct = answers[plate.id] === plate.answer;
    if (plate.kind === 'demo') practiceOk = correct;
    else if (plate.kind === 'rg') {
      rgTotal++;
      if (!correct) rgMisses++;
    } else {
      byTotal++;
      if (!correct) byMisses++;
    }
  }

  const rg = rgMisses >= RG_FLAG;
  const by = byMisses >= BY_FLAG;
  let outcome: Outcome = 'typical';
  if (!practiceOk) outcome = 'retake';
  else if (rg && by) outcome = 'both';
  else if (rg) outcome = 'red-green';
  else if (by) outcome = 'blue-yellow';

  return { outcome, rgMisses, rgTotal, byMisses, byTotal, practiceOk };
}
