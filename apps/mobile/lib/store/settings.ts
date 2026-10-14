import i18n, { detectLanguage, setLanguage, type Language } from '@/lib/i18n';
import { getSetting, setSetting } from '@/lib/db';
import { create } from 'zustand';

export type SpeechSpeed = 'slow' | 'normal' | 'fast';
export const SPEECH_RATE: Record<SpeechSpeed, number> = { slow: 0.8, normal: 1.0, fast: 1.25 };

interface SettingsState {
  language: Language;
  /** True after a language switch that needs an app restart to flip layout direction. */
  needsRestart: boolean;
  /** Read the result aloud as soon as it appears. */
  autoRead: boolean;
  /** Speak the colour name when the user taps a point on the photo. */
  speakOnTap: boolean;
  speechSpeed: SpeechSpeed;
  changeLanguage: (language: Language) => void;
  setAutoRead: (value: boolean) => void;
  setSpeakOnTap: (value: boolean) => void;
  setSpeechSpeed: (value: SpeechSpeed) => void;
}

function loadLanguage(): Language {
  const saved = getSetting('language');
  return saved === 'en' || saved === 'ur' ? saved : detectLanguage();
}

function loadSpeed(): SpeechSpeed {
  const saved = getSetting('speechSpeed');
  return saved === 'slow' || saved === 'fast' ? saved : 'normal';
}

const initialLanguage = loadLanguage();
// The native layout direction survives restarts; only the translations need re-applying here.
if (i18n.language !== initialLanguage) void i18n.changeLanguage(initialLanguage);

export const useSettings = create<SettingsState>((set) => ({
  language: initialLanguage,
  needsRestart: false,
  autoRead: getSetting('autoRead') === '1',
  speakOnTap: getSetting('speakOnTap') !== '0',
  speechSpeed: loadSpeed(),
  changeLanguage: (language) => {
    const { directionChanged } = setLanguage(language);
    setSetting('language', language);
    set({ language, needsRestart: directionChanged });
  },
  setAutoRead: (value) => {
    setSetting('autoRead', value ? '1' : '0');
    set({ autoRead: value });
  },
  setSpeakOnTap: (value) => {
    setSetting('speakOnTap', value ? '1' : '0');
    set({ speakOnTap: value });
  },
  setSpeechSpeed: (value) => {
    setSetting('speechSpeed', value);
    set({ speechSpeed: value });
  },
}));
