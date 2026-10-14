import { analysePixels, type AnalysedColour } from '@roshni/color-engine';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { loadImage, type LoadedImage } from '@/lib/image/loadPixels';

const THUMB_WIDTH = 320;

export interface AnalysisResult {
  uri: string;
  width: number;
  height: number;
  full: LoadedImage['full'];
  colours: AnalysedColour[];
  /** Small JPEG data URI kept in history (full photos are never stored). */
  thumb: string;
}

/** Photo URI in, named palette out. All on the device. */
export async function analyzeImage(sourceUri: string): Promise<AnalysisResult> {
  const { uri, width, height, data, full } = await loadImage(sourceUri);
  const colours = analysePixels(data, { maxSamples: 60000 });

  const small = await (
    await ImageManipulator.manipulate(uri).resize({ width: THUMB_WIDTH, height: null }).renderAsync()
  ).saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });

  return { uri, width, height, full, colours, thumb: `data:image/jpeg;base64,${small.base64 ?? ''}` };
}
