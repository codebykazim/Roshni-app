import type { SkImage } from '@shopify/react-native-skia';
import { create } from 'zustand';

import type { StoredColour } from '@/lib/db';

export interface CurrentAnalysis {
  /** Database id (every analysis is saved to history as soon as it is made) */
  id: string;
  /** Display copy of the photo */
  uri: string;
  /** Size of the photo as shown (aspect ratio for layout) */
  width: number;
  height: number;
  /** Full-size raster for tap-to-pick. Null when the analysis is reopened from history. */
  full: { image: SkImage; width: number; height: number } | null;
  colours: StoredColour[];
}

interface CurrentAnalysisState {
  current: CurrentAnalysis | null;
  setCurrent: (analysis: CurrentAnalysis | null) => void;
}

/** The analysis just made, kept with its pixels so tap-to-pick works on the Result screen. */
export const useCurrentAnalysis = create<CurrentAnalysisState>((set) => ({
  current: null,
  setCurrent: (current) => set({ current }),
}));
