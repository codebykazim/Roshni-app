import {
  pickColourAt,
  simulationMatrix,
  toColourMatrix4x5,
  type CvdType,
  type PickedColour,
} from '@roshni/color-engine';
import { AlphaType, ColorType, rect, Skia, type SkImage } from '@shopify/react-native-skia';

/** Decode a `data:image/...;base64,` URI (the history thumbnails). */
export function imageFromDataUri(uri: string): SkImage | null {
  const base64 = uri.slice(uri.indexOf(',') + 1);
  return Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(base64));
}

/**
 * The image as someone with the given deficiency may see it. A GPU colour-filter chain, gamma
 * correct: sRGB -> linear, 3x3 simulation matrix, linear -> sRGB. Same maths as `simulateRgb`
 * in the colour engine, which is what the unit tests check.
 */
export function renderSimulated(image: SkImage, type: CvdType, severity: number): SkImage {
  const width = image.width();
  const height = image.height();
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) return image;

  const { ColorFilter } = Skia;
  const filter = ColorFilter.MakeCompose(
    ColorFilter.MakeLinearToSRGBGamma(),
    ColorFilter.MakeCompose(
      ColorFilter.MakeMatrix(toColourMatrix4x5(simulationMatrix(type, severity))),
      ColorFilter.MakeSRGBToLinearGamma(),
    ),
  );
  const paint = Skia.Paint();
  paint.setColorFilter(filter);
  surface.getCanvas().drawImage(image, 0, 0, paint);
  surface.flush();
  const snapshot = surface.makeImageSnapshot();
  // GPU-backed snapshots cannot be drawn on a screen Canvas; copy to a CPU raster.
  return snapshot.makeNonTextureImage() ?? snapshot;
}

/**
 * Colour at the centre of a photo file: the average of a small window. Used by the live camera,
 * which reads the middle of each snapshot. The centre is the same whatever the sensor rotation.
 */
export async function readCentreColour(uri: string, half = 4): Promise<PickedColour | null> {
  const image = Skia.Image.MakeImageFromEncoded(await Skia.Data.fromURI(uri));
  if (!image) return null;
  const size = half * 2 + 1;
  if (image.width() < size || image.height() < size) return null;

  const cx = Math.floor(image.width() / 2);
  const cy = Math.floor(image.height() / 2);
  const surface = Skia.Surface.MakeOffscreen(size, size);
  if (!surface) return null;
  surface
    .getCanvas()
    .drawImageRect(image, rect(cx - half, cy - half, size, size), rect(0, 0, size, size), Skia.Paint());
  surface.flush();
  const pixels = surface.makeImageSnapshot().readPixels(0, 0, {
    width: size,
    height: size,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });
  if (!(pixels instanceof Uint8Array)) return null;
  return pickColourAt(pixels, size, size, half, half, half);
}
