import * as Speech from 'expo-speech';

import type { Language } from '@/lib/i18n';

export type SpeakResult = 'ok' | 'no-voice';

const LOCALE: Record<Language, string> = { en: 'en-US', ur: 'ur-PK' };

let voicesPromise: Promise<Speech.Voice[]> | null = null;

function voices(): Promise<Speech.Voice[]> {
  voicesPromise ??= Speech.getAvailableVoicesAsync().catch(() => []);
  return voicesPromise;
}

/** Best installed voice for the language, or undefined when the phone has none. */
export async function findVoice(language: Language): Promise<Speech.Voice | undefined> {
  const all = await voices();
  const matches = all.filter((v) => v.language.toLowerCase().startsWith(language));
  return matches.find((v) => v.quality === Speech.VoiceQuality.Enhanced) ?? matches[0];
}

/**
 * Speak text in the given language. Urdu is refused when no Urdu voice is installed, because
 * the engine would otherwise read Urdu script with an English voice and produce nonsense.
 */
export async function speak(
  text: string,
  language: Language,
  rate: number,
  onDone?: () => void,
): Promise<SpeakResult> {
  const voice = await findVoice(language);
  if (language === 'ur' && !voice) return 'no-voice';
  await Speech.stop();
  Speech.speak(text, {
    language: voice?.language ?? LOCALE[language],
    voice: voice?.identifier,
    rate,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
  return 'ok';
}

export function stopSpeaking(): Promise<void> {
  return Speech.stop();
}
