import { rgbToLab, simulateRgb, type Lab, type RGB } from '@roshni/color-engine';

import type { PlateKind, Viewer } from './types';

export interface ClassifiedDot {
  rgb: RGB;
  /** True when the dot belongs to the hidden number. */
  figure: boolean;
}

const VIEWERS: readonly Viewer[] = ['normal', 'protan', 'deutan', 'tritan'];

function viewLab(rgb: RGB, viewer: Viewer): Lab {
  return rgbToLab(viewer === 'normal' ? rgb : simulateRgb(rgb, viewer, 1));
}

/**
 * How well a viewer could separate the number's dots from the background using colour alone:
 * the balanced accuracy of a nearest-average-colour classifier, in CIELAB, after simulating what
 * that viewer sees. 1 means the number stands out clearly; 0.5 means it is no better than chance.
 */
export function separability(dots: readonly ClassifiedDot[], viewer: Viewer): number {
  const labs = dots.map((d) => viewLab(d.rgb, viewer));
  const mean = (wantFigure: boolean): Lab => {
    let L = 0;
    let a = 0;
    let b = 0;
    let n = 0;
    labs.forEach((lab, i) => {
      if (dots[i]!.figure !== wantFigure) return;
      L += lab.L;
      a += lab.a;
      b += lab.b;
      n++;
    });
    return { L: L / n, a: a / n, b: b / n };
  };
  const figure = mean(true);
  const ground = mean(false);
  const dist = (p: Lab, q: Lab) => (p.L - q.L) ** 2 + (p.a - q.a) ** 2 + (p.b - q.b) ** 2;

  let figureHits = 0;
  let figureTotal = 0;
  let groundHits = 0;
  let groundTotal = 0;
  labs.forEach((lab, i) => {
    const nearFigure = dist(lab, figure) < dist(lab, ground);
    if (dots[i]!.figure) {
      figureTotal++;
      if (nearFigure) figureHits++;
    } else {
      groundTotal++;
      if (!nearFigure) groundHits++;
    }
  });
  return (figureHits / figureTotal + groundHits / groundTotal) / 2;
}

export function plateMetrics(dots: readonly ClassifiedDot[]): Record<Viewer, number> {
  const out = {} as Record<Viewer, number>;
  for (const viewer of VIEWERS) out[viewer] = separability(dots, viewer);
  return out;
}

/** The number must be clear to people who see colour normally. */
export const VISIBLE_MIN = 0.95;
/**
 * For a viewer the plate should hide the number from, the classifier must stay near chance. The
 * blue-yellow limit is looser: the tritan simulation matrix is not a true blind spot, so a stronger
 * plate cannot be hidden as well. Tritan deficiency is also rare, so these plates are secondary.
 */
export const HIDDEN_MAX: Record<PlateKind, number> = { demo: 1, rg: 0.7, by: 0.8 };

export interface Requirement {
  visible: readonly Viewer[];
  hidden: readonly Viewer[];
}

/** What each kind of plate must achieve to be accepted into the set. */
export const REQUIREMENTS: Record<PlateKind, Requirement> = {
  // The practice plate: everyone must be able to read it.
  demo: { visible: ['normal', 'protan', 'deutan', 'tritan'], hidden: [] },
  // Red-green plates: clear to normal vision, hidden from protan and deutan viewers.
  rg: { visible: ['normal'], hidden: ['protan', 'deutan'] },
  // Blue-yellow plates: clear to normal vision, hidden from tritan viewers.
  by: { visible: ['normal'], hidden: ['tritan'] },
};

export function meetsRequirement(kind: PlateKind, metrics: Record<Viewer, number>): boolean {
  const need = REQUIREMENTS[kind];
  return (
    need.visible.every((v) => metrics[v] >= VISIBLE_MIN) &&
    need.hidden.every((v) => metrics[v] <= HIDDEN_MAX[kind])
  );
}

/** Higher is better: the gap between the weakest "visible" viewer and the strongest "hidden" one. */
export function margin(kind: PlateKind, metrics: Record<Viewer, number>): number {
  const need = REQUIREMENTS[kind];
  const weakestVisible = Math.min(...need.visible.map((v) => metrics[v]));
  const strongestHidden = need.hidden.length ? Math.max(...need.hidden.map((v) => metrics[v])) : 0.5;
  return weakestVisible - strongestHidden;
}
