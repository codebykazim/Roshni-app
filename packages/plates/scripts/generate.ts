import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generatePlate } from '../src/generate';
import { PLATE_SPECS } from '../src/specs';
import type { PlateSet } from '../src/types';

const here = dirname(fileURLToPath(import.meta.url));
const plates = [];
let rejected = 0;

for (const spec of PLATE_SPECS) {
  const { plate, accepted } = generatePlate(spec);
  const m = plate.metrics;
  console.log(
    `${accepted ? 'ok  ' : 'FAIL'} ${spec.id.padEnd(4)} ${spec.answer.padEnd(3)} normal ${m.normal} protan ${m.protan} deutan ${m.deutan} tritan ${m.tritan} dots ${plate.dots.length / 4}`,
  );
  if (!accepted) rejected++;
  plates.push(plate);
}

const set: PlateSet = {
  version: '0.1.0',
  status: 'Generated and checked against our own colour-vision simulator. Not yet validated with colour-blind people.',
  plates,
};

mkdirSync(join(here, '..', 'data'), { recursive: true });
writeFileSync(join(here, '..', 'data', 'plates.json'), JSON.stringify(set));
console.log(rejected ? `${rejected} plate(s) did not meet the requirement` : 'All plates meet the requirement');
process.exit(rejected ? 1 : 0);
