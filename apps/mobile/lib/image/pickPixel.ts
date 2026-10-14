import { pickColourAt, type PickedColour } from '@roshni/color-engine';
import { AlphaType, ColorType, type SkImage } from '@shopify/react-native-skia';

/**
 * Colour at a point of the full-size image: the average of a small (2*radius+1)² window.
 * A radius of 1 (3x3 pixels) keeps thin strokes, such as text, close to their true colour.
 * `x` and `y` are in the image's own pixel coordinates.
 */
export function pickFromImage(
  image: SkImage,
  width: number,
  height: number,
  x: number,
  y: number,
  radius = 1,
): PickedColour | null {
  const size = radius * 2 + 1;
  if (width < size || height < size) return null;
  const cx = Math.min(width - 1 - radius, Math.max(radius, Math.round(x)));
  const cy = Math.min(height - 1 - radius, Math.max(radius, Math.round(y)));
  const pixels = image.readPixels(cx - radius, cy - radius, {
    width: size,
    height: size,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });
  if (!(pixels instanceof Uint8Array)) return null;
  return pickColourAt(pixels, size, size, radius, radius, radius);
}
