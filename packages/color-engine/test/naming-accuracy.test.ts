import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hexToRgb, nameColour } from '../src';

/**
 * Accuracy of colour names against the XKCD Color Survey (CC0): about 950 colours named by
 * hundreds of thousands of people. The last word of each survey name (blue, green, brown…) is
 * treated as the human answer for the colour family.
 */

type Group =
  | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink'
  | 'brown' | 'grey' | 'black' | 'white';

/** Survey word -> the family people mean by it. */
const SURVEY_WORD: Record<string, Group> = {
  red: 'red', maroon: 'red', orange: 'orange', peach: 'orange', yellow: 'yellow', gold: 'yellow',
  green: 'green', lime: 'green', olive: 'green', mint: 'green', teal: 'teal', turquoise: 'teal',
  cyan: 'teal', aqua: 'teal', blue: 'blue', navy: 'blue', purple: 'purple', violet: 'purple',
  lavender: 'purple', magenta: 'pink', pink: 'pink', brown: 'brown', tan: 'brown', beige: 'brown',
  grey: 'grey', gray: 'grey', black: 'black', white: 'white',
};

/** Our family -> [primary, ...also acceptable]. */
const OURS: Record<string, Group[]> = {
  Black: ['black'], White: ['white'], Grey: ['grey'], Red: ['red'], Maroon: ['red', 'brown'],
  Orange: ['orange'], Peach: ['orange', 'pink'], Yellow: ['yellow'], Gold: ['yellow', 'orange'],
  Lime: ['green', 'yellow'], Green: ['green'], Mint: ['green', 'teal'],
  Mustard: ['yellow', 'brown', 'orange'], Coral: ['pink', 'red', 'orange'],
  Olive: ['green', 'yellow', 'brown'], Teal: ['teal', 'green', 'blue'],
  Turquoise: ['teal', 'green', 'blue'], Cyan: ['teal', 'blue'], 'Sky blue': ['blue', 'teal'],
  Blue: ['blue'], Navy: ['blue'], Indigo: ['purple', 'blue'], Purple: ['purple'],
  Lavender: ['purple', 'blue'], Magenta: ['pink', 'purple'], Pink: ['pink'],
  Brown: ['brown', 'orange'], Tan: ['brown', 'orange', 'yellow'], Khaki: ['yellow', 'green', 'brown'],
  Beige: ['brown', 'yellow', 'white'], Cream: ['yellow', 'white'],
};

interface Entry {
  survey: string;
  hex: string;
  expected: Group;
  /** Colours are split in two: anchors are tuned on "train", and "test" is never tuned on. */
  split: 'train' | 'test';
}

/** Words that only qualify lightness; any other word before "grey" makes the name ambiguous. */
const QUALIFIERS = new Set(['dark', 'light', 'pale', 'very', 'medium', 'deep', 'bright', 'dusty', 'dull', 'soft', 'warm', 'cool', 'muted']);

function load(): Entry[] {
  const entries: Entry[] = [];
  let index = 0;
  for (const line of readFileSync(new URL('./data/xkcd-rgb.txt', import.meta.url), 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const [name, hex] = line.split('\t');
    if (!name || !hex) continue;
    const words = name.trim().split(/\s+/);
    const last = words.pop()!;
    const expected = SURVEY_WORD[last];
    index++;
    if (!expected) continue;
    // "reddish grey", "green grey": people mean a tinted grey, so the answer is ambiguous.
    if (expected === 'grey' && words.some((w) => !QUALIFIERS.has(w))) continue;
    entries.push({
      survey: name.trim(),
      hex: hex.trim(),
      expected,
      split: index % 2 === 0 ? 'train' : 'test',
    });
  }
  return entries;
}

function evaluate(entries: Entry[]) {
  let lenient = 0;
  let strict = 0;
  const wrong: string[] = [];
  const confusion = new Map<string, number>();
  for (const e of entries) {
    const ours = nameColour(hexToRgb(e.hex));
    const groups = OURS[ours.family];
    if (!groups) throw new Error(`No group for family ${ours.family}`);
    if (groups.includes(e.expected)) lenient++;
    else {
      wrong.push(`${e.survey} ${e.hex}: survey=${e.expected} ours="${ours.name}"`);
      const key = `${e.expected} -> ${ours.family}`;
      confusion.set(key, (confusion.get(key) ?? 0) + 1);
    }
    if (groups[0] === e.expected) strict++;
  }
  return { total: entries.length, lenient, strict, wrong, confusion };
}

const pct = (n: number, total: number) => `${((n / total) * 100).toFixed(1)}%`;

describe('naming accuracy vs the XKCD colour survey', () => {
  const all = load();
  const train = all.filter((e) => e.split === 'train');
  const test = all.filter((e) => e.split === 'test');

  it('reports accuracy and the commonest mistakes', () => {
    const a = evaluate(all);
    const t = evaluate(test);
    const top = [...a.confusion.entries()].sort((x, y) => y[1] - x[1]).slice(0, 20);
    const lines = [
      `XKCD family accuracy (all ${a.total}): lenient ${pct(a.lenient, a.total)}, strict ${pct(a.strict, a.total)}`,
      `  tuned-on half (${train.length}): lenient ${pct(evaluate(train).lenient, train.length)}`,
      `  held-out half (${test.length}): lenient ${pct(t.lenient, t.total)}, strict ${pct(t.strict, t.total)}`,
      'Top confusions:',
      ...top.map(([k, n]) => `  ${n}x ${k}`),
    ];
    console.log(lines.join('\n'));
    if (process.env.SHOW_WRONG) console.log(a.wrong.join('\n'));
    expect(a.total).toBeGreaterThan(400);
  });

  // Guard rails: accuracy must not drop below what was measured when these were set.
  it('keeps held-out accuracy above the floor', () => {
    const t = evaluate(test);
    // Measured Oct 2026: lenient 95.5%, strict 73.7% on the held-out half.
    expect(t.lenient / t.total).toBeGreaterThanOrEqual(0.94);
    expect(t.strict / t.total).toBeGreaterThanOrEqual(0.72);
  });
});
