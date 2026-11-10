import { lchToRgb, packRgb } from './colour';
import { makeNumberMask } from './digits';
import { packDisc, type Circle } from './packing';
import { between, makeRandom, shuffle } from './random';
import { DISTRACTOR_POOL, SINGLE_DISTRACTOR_POOL, type PlateSpec } from './specs';
import type { Plate, PlateKind } from './types';
import { linearToSrgb, rgbToLab, simulationMatrix, srgbToLinear, type Mat3 } from '@roshni/color-engine';
import { margin, meetsRequirement, plateMetrics, type ClassifiedDot } from './validate';

interface Palette {
  hue: number;
  chroma: number;
}

interface Scheme {
  figure: Palette;
  ground: Palette;
  lightMin: number;
  lightMax: number;
}

/** Hue ranges (CIELAB degrees) searched for each kind of plate. */
const SEARCH: Record<PlateKind, { figure: [number, number]; ground: [number, number]; chroma: [number, number] }> = {
  demo: { figure: [225, 265], ground: [60, 95], chroma: [38, 55] },
  rg: { figure: [100, 150], ground: [25, 75], chroma: [38, 62] },
  by: { figure: [210, 275], ground: [120, 185], chroma: [32, 58] },
};

const ATTEMPTS = 8000;
/** Average colour distance (CIELAB) between number and background for normal vision: must be easy to read. */
const MIN_NORMAL_GAP = 28;

function normalGap(dots: readonly ClassifiedDot[]): number {
  const sum: Record<'f' | 'g', [number, number, number]> = { f: [0, 0, 0], g: [0, 0, 0] };
  const n = { f: 0, g: 0 };
  for (const d of dots) {
    const lab = rgbToLab(d.rgb);
    const k = d.figure ? 'f' : 'g';
    sum[k][0] += lab.L;
    sum[k][1] += lab.a;
    sum[k][2] += lab.b;
    n[k]++;
  }
  const mean = (k: 'f' | 'g') => sum[k].map((v) => v / n[k]);
  const f = mean('f');
  const g = mean('g');
  return Math.hypot(f[0]! - g[0]!, f[1]! - g[1]!, f[2]! - g[2]!);
}


type V3 = [number, number, number];

function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/**
 * The direction in linear RGB that the simulation shrinks the most, i.e. the one a viewer with that
 * deficiency is least able to see. Found as the smallest singular vector of the matrix by power
 * iteration on (c*I - M^T M). The matrices are not exactly singular, so this is the best direction
 * rather than a perfect blind spot; plates are still checked against the simulator afterwards.
 */
function nullDirection(m: Mat3): V3 {
  const mtm = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) mtm[i * 3 + j]! += m[k * 3 + i]! * m[k * 3 + j]!;
    }
  }
  const shift = 4;
  let v: V3 = [0.577, 0.577, 0.577];
  for (let iter = 0; iter < 200; iter++) {
    const next: V3 = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      next[i] = shift * v[i]! - (mtm[i * 3]! * v[0] + mtm[i * 3 + 1]! * v[1] + mtm[i * 3 + 2]! * v[2]);
    }
    const len = Math.hypot(...next);
    v = [next[0] / len, next[1] / len, next[2] / len];
  }
  return v;
}

const NULL_PROTAN = nullDirection(simulationMatrix('protan', 1));
const NULL_DEUTAN = nullDirection(simulationMatrix('deutan', 1));
const NULL_TRITAN = nullDirection(simulationMatrix('tritan', 1));

function align(v: V3, to: V3): V3 {
  const dot = v[0] * to[0] + v[1] * to[1] + v[2] * to[2];
  return dot < 0 ? [-v[0], -v[1], -v[2]] : v;
}

interface Confusion {
  by: boolean;
  base: V3;
  step: V3;
}

/**
 * Number and background colours that differ only along a direction the target viewer cannot see:
 * `step` is added to `base` (linear RGB) to get the number's colour. Brightness is varied per dot
 * by scaling, which keeps the difference invisible to that viewer.
 */
function sampleConfusion(rand: () => number, kind: PlateKind): Confusion {
  let dir: V3;
  if (kind === 'by') dir = NULL_TRITAN;
  else {
    // Red-green plates must hide from protan and deutan viewers, so mix both hidden directions.
    const p = align(NULL_PROTAN, NULL_DEUTAN);
    const w = between(rand, 0.3, 0.7);
    dir = [p[0] * w + NULL_DEUTAN[0] * (1 - w), p[1] * w + NULL_DEUTAN[1] * (1 - w), p[2] * w + NULL_DEUTAN[2] * (1 - w)];
  }
  const peak = Math.max(...dir.map(Math.abs));
  const t = between(rand, 0.1, kind === 'by' ? 0.7 : 0.45) * (rand() < 0.5 ? -1 : 1);
  const step = dir.map((v) => (v / peak) * t) as V3;
  const base: V3 = [between(rand, 0.2, 0.75), between(rand, 0.2, 0.75), between(rand, 0.2, 0.75)];
  return { base, step, by: kind === 'by' };
}

function confusionDots(rand: () => number, c: Confusion, figureFlags: boolean[]): ClassifiedDot[] | null {
  const out: ClassifiedDot[] = [];
  for (const figure of figureFlags) {
    const k = c.by ? between(rand, 0.93, 1.07) : between(rand, 0.8, 1.2);
    const lin = c.base.map((v, i) => (v + (figure ? c.step[i]! : 0)) * k);
    if (lin.some((v) => v < 0 || v > 1)) return null;
    const jitter = () => between(rand, -0.015, 0.015);
    const rgb = lin.map((v) => Math.round(linearToSrgb(Math.min(1, Math.max(0, v + jitter()))))) as [number, number, number];
    out.push({ rgb, figure });
  }
  return out;
}

function sampleScheme(rand: () => number, kind: PlateKind): Scheme {
  const range = SEARCH[kind];
  return {
    figure: { hue: between(rand, ...range.figure), chroma: between(rand, ...range.chroma) },
    ground: { hue: between(rand, ...range.ground), chroma: between(rand, ...range.chroma) },
    lightMin: kind === 'demo' ? 30 : between(rand, 48, 60),
    lightMax: kind === 'demo' ? 85 : between(rand, 70, 84),
  };
}

function colourDots(rand: () => number, kind: PlateKind, scheme: Scheme, figureFlags: boolean[]): ClassifiedDot[] {
  return figureFlags.map((figure) => {
    const side = figure ? scheme.figure : scheme.ground;
    // Lightness is random and identical in distribution for both groups, so brightness cannot
    // reveal the number to someone who can only use it.
    const L = kind === 'demo' ? (figure ? between(rand, 30, 48) : between(rand, 68, 85)) : between(rand, scheme.lightMin, scheme.lightMax);
    const rgb = lchToRgb(L, side.chroma + between(rand, -4, 4), side.hue + between(rand, -4, 4));
    return { rgb, figure };
  });
}

function distractors(answer: string, rand: () => number): string[] {
  const pool = (answer.length === 1 ? SINGLE_DISTRACTOR_POOL : DISTRACTOR_POOL).filter((n) => n !== answer);
  return shuffle(rand, pool).slice(0, 3);
}

export interface GenerateResult {
  plate: Plate;
  accepted: boolean;
}

/** Builds one plate: lays out the dots once, then searches for colours that pass validation. */
export function generatePlate(spec: PlateSpec): GenerateResult {
  const rand = makeRandom(spec.seed);
  const circles: Circle[] = packDisc(rand);
  const mask = makeNumberMask(spec.answer);
  const figureFlags = circles.map((c) => mask(c.x, c.y));

  let best: { dots: ClassifiedDot[]; metrics: ReturnType<typeof plateMetrics>; score: number } | null = null;
  for (let attempt = 0; attempt < (spec.kind === 'by' ? ATTEMPTS * 3 : ATTEMPTS); attempt++) {
    let dots: ClassifiedDot[] | null;
    if (spec.kind === 'demo') dots = colourDots(rand, spec.kind, sampleScheme(rand, spec.kind), figureFlags);
    else dots = confusionDots(rand, sampleConfusion(rand, spec.kind), figureFlags);
    if (!dots) continue;
    const metrics = plateMetrics(dots);
    const readable = spec.kind === 'demo' || normalGap(dots) >= (spec.kind === 'by' ? 28 : MIN_NORMAL_GAP);
    const score = margin(spec.kind, metrics) + (meetsRequirement(spec.kind, metrics) && readable ? 1 : 0);
    if (!best || score > best.score) best = { dots, metrics, score };
    if (best.score >= 1.25) break;
  }
  if (!best) throw new Error(`No scheme found for ${spec.id}`);

  const flat: number[] = [];
  circles.forEach((c, i) => {
    flat.push(Math.round(c.x * 1000), Math.round(c.y * 1000), Math.round(c.r * 1000), packRgb(best!.dots[i]!.rgb));
  });

  const round = (n: number) => Math.round(n * 1000) / 1000;
  const metrics = {
    normal: round(best.metrics.normal),
    protan: round(best.metrics.protan),
    deutan: round(best.metrics.deutan),
    tritan: round(best.metrics.tritan),
  };

  return {
    accepted: best.score >= 1,
    plate: {
      id: spec.id,
      kind: spec.kind,
      answer: spec.answer,
      choices: shuffle(rand, [spec.answer, ...distractors(spec.answer, rand)]),
      dots: flat,
      metrics,
      seed: spec.seed,
    },
  };
}
