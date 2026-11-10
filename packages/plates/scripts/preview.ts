import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { simulateRgb } from '@roshni/color-engine';

import { rgbToCss, unpackRgb } from '../src/colour';
import { plateDots } from '../src/index';
import data from '../data/plates.json';
import type { Plate, PlateSet } from '../src/types';

const here = dirname(fileURLToPath(import.meta.url));
const set = data as unknown as PlateSet;

function svg(plate: Plate, mode: 'normal' | 'protan' | 'deutan' | 'tritan'): string {
  const circles = plateDots(plate)
    .map((d, i) => {
      const packed = plate.dots[i * 4 + 3]!;
      const colour = mode === 'normal' ? d.color : rgbToCss(((s) => (s[0] << 16) | (s[1] << 8) | s[2])(simulateRgb(unpackRgb(packed), mode, 1).map(Math.round) as [number, number, number]));
      return `<circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="${colour}"/>`;
    })
    .join('');
  return `<svg viewBox="-1 -1 2 2" width="200" height="200">${circles}</svg>`;
}

const rows = set.plates
  .map(
    (p) =>
      `<div style="display:flex;gap:8px;align-items:center"><b style="width:60px">${p.id} (${p.answer})</b>${(['normal', 'protan', 'deutan', 'tritan'] as const).map((m) => svg(p, m)).join('')}</div>`,
  )
  .join('');
writeFileSync(join(here, '..', 'data', 'preview.html'), `<body style="font-family:sans-serif;background:#fff">${rows}</body>`);
console.log('wrote data/preview.html');
