type Pt = readonly [number, number];
type Stroke = readonly Pt[];

/** One glyph is drawn in a box 0.7 wide and 1 tall (x to the right, y downward). */
export const GLYPH_WIDTH = 0.7;
const GLYPH_GAP = 0.2;

function ellipse(cx: number, cy: number, rx: number, ry: number, steps = 18): Stroke {
  const points: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    points.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  return points;
}

const SIX: Stroke = [
  [0.58, 0.06], [0.36, 0.0], [0.14, 0.18], [0.06, 0.52], [0.1, 0.84],
  [0.3, 1.0], [0.5, 0.98], [0.64, 0.8], [0.6, 0.6], [0.44, 0.5], [0.24, 0.52], [0.08, 0.66],
];

/**
 * A tiny stroke font for the digits 0-9. Plates need only a thick, simple, readable shape, so a
 * handful of polylines per digit is enough, and it avoids depending on any font renderer.
 */
const GLYPHS: Record<string, readonly Stroke[]> = {
  '0': [ellipse(0.35, 0.5, 0.3, 0.5, 20)],
  '1': [[[0.16, 0.24], [0.42, 0.0], [0.42, 1.0]]],
  '2': [[[0.06, 0.22], [0.16, 0.06], [0.36, 0.0], [0.56, 0.06], [0.64, 0.24], [0.54, 0.44], [0.06, 1.0], [0.68, 1.0]]],
  '3': [
    [[0.06, 0.1], [0.2, 0.02], [0.4, 0.0], [0.6, 0.08], [0.62, 0.28], [0.46, 0.45], [0.3, 0.5]],
    [[0.3, 0.5], [0.5, 0.52], [0.68, 0.68], [0.65, 0.88], [0.45, 0.98], [0.25, 1.0], [0.05, 0.9]],
  ],
  '4': [[[0.55, 0.0], [0.0, 0.68], [0.7, 0.68]], [[0.55, 0.0], [0.55, 1.0]]],
  '5': [[[0.62, 0.0], [0.12, 0.0], [0.07, 0.45], [0.3, 0.38], [0.5, 0.42], [0.65, 0.6], [0.62, 0.85], [0.45, 0.98], [0.25, 1.0], [0.05, 0.9]]],
  '6': [SIX],
  '7': [[[0.02, 0.0], [0.68, 0.0], [0.26, 1.0]]],
  '8': [ellipse(0.35, 0.27, 0.26, 0.25), ellipse(0.35, 0.74, 0.3, 0.26)],
  // 9 is a 6 turned upside down
  '9': [SIX.map(([x, y]): Pt => [GLYPH_WIDTH - x, 1 - y])],
};

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Line segments for a number, in "text units" where the digits are 1 tall, centred on the origin. */
export function textSegments(text: string): { segments: Segment[]; width: number } {
  const count = text.length;
  const width = count * GLYPH_WIDTH + (count - 1) * GLYPH_GAP;
  const segments: Segment[] = [];
  [...text].forEach((ch, index) => {
    const strokes = GLYPHS[ch];
    if (!strokes) throw new Error(`No glyph for "${ch}"`);
    const dx = index * (GLYPH_WIDTH + GLYPH_GAP) - width / 2;
    for (const stroke of strokes) {
      for (let i = 0; i + 1 < stroke.length; i++) {
        const a = stroke[i]!;
        const b = stroke[i + 1]!;
        segments.push({ x1: a[0] + dx, y1: a[1] - 0.5, x2: b[0] + dx, y2: b[1] - 0.5 });
      }
    }
  });
  return { segments, width };
}

function distanceToSegment(px: number, py: number, s: Segment): number {
  const vx = s.x2 - s.x1;
  const vy = s.y2 - s.y1;
  const lengthSq = vx * vx + vy * vy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - s.x1) * vx + (py - s.y1) * vy) / lengthSq));
  const dx = px - (s.x1 + t * vx);
  const dy = py - (s.y1 + t * vy);
  return Math.sqrt(dx * dx + dy * dy);
}

export interface MaskOptions {
  /** Height of the digits as a fraction of the plate's radius (the plate spans -1..1). */
  height?: number;
  /** Stroke thickness, relative to the digit height. */
  stroke?: number;
}

/**
 * Returns a function telling whether a plate point (x, y in -1..1) falls inside the number's
 * strokes. Used to decide which dots belong to the hidden number.
 */
export function makeNumberMask(text: string, options: MaskOptions = {}): (x: number, y: number) => boolean {
  const { segments, width } = textSegments(text);
  // Two-digit numbers are wider, so they get a slightly smaller height to stay inside the disc.
  const height = options.height ?? (text.length === 1 ? 1.25 : 1.0);
  const half = (options.stroke ?? 0.28) / 2;
  // Keep the whole text inside the plate even if a caller asks for a very large height.
  const scale = Math.min(height, 1.7 / width);
  return (x, y) => {
    const u = x / scale;
    const v = y / scale;
    for (const s of segments) {
      if (distanceToSegment(u, v, s) <= half) return true;
    }
    return false;
  };
}
