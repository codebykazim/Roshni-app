import {
  AlphaType,
  ColorType,
  FilterMode,
  MipmapMode,
  rect,
  Skia,
  type SkImage,
} from '@shopify/react-native-skia';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Longest edge of the copy kept for display and tap-to-pick. */
const DISPLAY_MAX_EDGE = 1024;
/** Longest edge of the pixel buffer given to the palette extractor. */
const ANALYSIS_MAX_EDGE = 384;

export interface LoadedImage {
  /** Re-encoded, size-bounded copy of the photo (orientation baked in). Use this for display. */
  uri: string;
  /** Raster copy at display size. Tap-to-pick reads single pixels from it, so thin text stays sharp. */
  full: { image: SkImage; width: number; height: number };
  /** Size of the analysis buffer below. */
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel, row-major, un-premultiplied. Downscaled for the palette extractor. */
  data: Uint8Array;
}

function readRgba(image: SkImage, width: number, height: number): Uint8Array {
  const pixels = image.readPixels(0, 0, {
    width,
    height,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });
  if (!(pixels instanceof Uint8Array)) throw new Error('Could not read pixels');
  return pixels;
}

/**
 * Turn a picked photo into pixel data.
 *
 * 1. expo-image-manipulator re-encodes the photo at a bounded size. This keeps memory low and
 *    normalises format (HEIC/WEBP/PNG become JPEG) and bakes in EXIF rotation.
 * 2. Skia decodes that copy and draws it once into an offscreen surface. The resulting raster
 *    image (`full`) is kept for tap-to-pick.
 * 3. The raster image is drawn again, downscaled with mipmapped linear filtering so thin features
 *    are averaged instead of skipped, into the buffer used for the palette.
 */
export async function loadImage(sourceUri: string): Promise<LoadedImage> {
  const probe = await ImageManipulator.manipulate(sourceUri).renderAsync();
  const longEdge = Math.max(probe.width, probe.height);

  let working = ImageManipulator.manipulate(probe);
  if (longEdge > DISPLAY_MAX_EDGE) {
    working =
      probe.width >= probe.height
        ? working.resize({ width: DISPLAY_MAX_EDGE, height: null })
        : working.resize({ width: null, height: DISPLAY_MAX_EDGE });
  }
  const saved = await (await working.renderAsync()).saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.92,
  });

  const encoded = await Skia.Data.fromURI(saved.uri);
  const decoded = Skia.Image.MakeImageFromEncoded(encoded);
  if (!decoded) throw new Error('Could not decode image');

  const fullW = decoded.width();
  const fullH = decoded.height();
  const fullSurface = Skia.Surface.MakeOffscreen(fullW, fullH);
  if (!fullSurface) throw new Error('Could not create offscreen surface');
  fullSurface
    .getCanvas()
    .drawImageRect(decoded, rect(0, 0, fullW, fullH), rect(0, 0, fullW, fullH), Skia.Paint());
  fullSurface.flush();
  const fullImage = fullSurface.makeImageSnapshot();

  const scale = Math.min(1, ANALYSIS_MAX_EDGE / Math.max(fullW, fullH));
  const width = Math.max(1, Math.round(fullW * scale));
  const height = Math.max(1, Math.round(fullH * scale));
  const smallSurface = Skia.Surface.MakeOffscreen(width, height);
  if (!smallSurface) throw new Error('Could not create offscreen surface');
  smallSurface
    .getCanvas()
    .drawImageRectOptions(
      fullImage,
      rect(0, 0, fullW, fullH),
      rect(0, 0, width, height),
      FilterMode.Linear,
      MipmapMode.Linear,
      Skia.Paint(),
    );
  smallSurface.flush();
  const data = readRgba(smallSurface.makeImageSnapshot(), width, height);

  return { uri: saved.uri, full: { image: fullImage, width: fullW, height: fullH }, width, height, data };
}
