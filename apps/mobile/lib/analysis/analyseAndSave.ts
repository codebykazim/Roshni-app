import { insertAnalysis, type AnalysisSource } from '@/lib/db';

import { analyzeImage } from './analyzeImage';
import type { CurrentAnalysis } from './current';

/** Analyse a photo on the device, save it to history, and return it ready for the Result screen. */
export async function analyseAndSave(uri: string, source: AnalysisSource): Promise<CurrentAnalysis> {
  const result = await analyzeImage(uri);
  const saved = insertAnalysis({ source, ...result });
  return {
    id: saved.id,
    uri: result.uri,
    width: result.width,
    height: result.height,
    full: result.full,
    colours: saved.colours,
  };
}
