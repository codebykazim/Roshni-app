export interface Circle {
  x: number;
  y: number;
  r: number;
}

export interface PackOptions {
  /** Largest and smallest dot radius, in plate units (the plate has radius 1). */
  rMax: number;
  rMin: number;
  /** Space kept between neighbouring dots. */
  gap: number;
  /** Radius is multiplied by this each round (below 1). */
  shrink: number;
  /** Random placements tried at each radius. */
  tries: number;
  /** Space kept between the outermost dots and the plate's edge. */
  margin: number;
}

export const DEFAULT_PACK: PackOptions = {
  rMax: 0.058,
  rMin: 0.02,
  gap: 0.006,
  shrink: 0.95,
  tries: 1800,
  margin: 0.02,
};

/**
 * Fill a disc with non-overlapping dots of varied size. Big dots go in first, then smaller ones
 * fill the gaps, which gives the uneven mosaic look of a colour-vision plate. Deterministic for a
 * given random generator.
 */
export function packDisc(rand: () => number, options: PackOptions = DEFAULT_PACK): Circle[] {
  const { rMax, rMin, gap, shrink, tries, margin } = options;
  const cell = 2 * rMax + gap;
  const cells = new Map<string, Circle[]>();
  const key = (cx: number, cy: number) => `${cx},${cy}`;
  const circles: Circle[] = [];

  const fits = (x: number, y: number, r: number): boolean => {
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    for (let i = cx - 1; i <= cx + 1; i++) {
      for (let j = cy - 1; j <= cy + 1; j++) {
        const bucket = cells.get(key(i, j));
        if (!bucket) continue;
        for (const c of bucket) {
          const dx = c.x - x;
          const dy = c.y - y;
          const min = c.r + r + gap;
          if (dx * dx + dy * dy < min * min) return false;
        }
      }
    }
    return true;
  };

  for (let r = rMax; r >= rMin; r *= shrink) {
    const reach = 1 - margin - r;
    if (reach <= 0) break;
    for (let t = 0; t < tries; t++) {
      // sqrt keeps the sampling uniform over the disc's area
      const radius = reach * Math.sqrt(rand());
      const angle = rand() * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      if (!fits(x, y, r)) continue;
      const circle = { x, y, r };
      circles.push(circle);
      const k = key(Math.floor(x / cell), Math.floor(y / cell));
      const bucket = cells.get(k);
      if (bucket) bucket.push(circle);
      else cells.set(k, [circle]);
    }
  }
  return circles;
}
