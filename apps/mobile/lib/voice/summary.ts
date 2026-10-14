import { displayName } from '@roshni/color-engine';
import type { TFunction } from 'i18next';

import type { Language } from '@/lib/i18n';
import type { StoredColour } from '@/lib/db';

/** The most colours read aloud in one go; the full list stays on screen. */
export const MAX_SPOKEN_COLOURS = 5;

/** "The image contains 3 colors: Maroon, 67 percent; …" in the app language. */
export function buildSpokenSummary(colours: StoredColour[], language: Language, t: TFunction): string {
  const top = colours.slice(0, MAX_SPOKEN_COLOURS);
  if (top.length === 0) return t('result.empty', { lng: language });
  const list = top
    .map((c) =>
      t('voice.item', {
        lng: language,
        name: displayName(c, language),
        percent: Math.round(c.share * 100),
      }),
    )
    .join(t('voice.separator', { lng: language }));
  return t('voice.summary', { lng: language, count: top.length, list });
}
