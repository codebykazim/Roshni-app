"""Build every app icon asset from the Roshni logo.

Run from apps/mobile (needs Pillow):  python scripts/generate-icons.py

Input:   assets/branding/roshni-logo.jpg  (the full logo: colour-wheel eye, wordmark, tagline)
Output:  assets/images/{icon, android-icon-foreground, android-icon-background,
         android-icon-monochrome, splash-icon, favicon, logo-mark}.png

Only the colour-wheel eye is used. The "Roshni" wordmark and tagline are dropped because the app
already draws its own text.
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = Path('assets/branding/roshni-logo.jpg')
OUT = Path('assets/images')
WHITE = (255, 255, 255)


def channel_min(img):
    r, g, b = img.split()
    return ImageChops.darker(ImageChops.darker(r, g), b)


def channel_max(img):
    r, g, b = img.split()
    return ImageChops.lighter(ImageChops.lighter(r, g), b)


def find_mark(img):
    """Bounding box of the colour wheel plus the sparkles, leaving out the text below."""
    saturation = ImageChops.subtract(channel_max(img), channel_min(img))
    wheel = saturation.point(lambda v: 255 if v > 60 else 0).getbbox()
    if wheel is None:
        raise SystemExit('Could not find the colour wheel in the logo')
    x0, y0, x1, y1 = wheel
    cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2

    # Sparkles: dark pixels just outside the wheel, level with it (the text is below y1).
    darkest = channel_min(img).load()
    sx0, sy0, sx1, sy1 = x1, y0, x1, y1
    for y in range(int(y0 - 5), int(y1 + 5)):
        for x in range(int(cx), int(cx + 1.7 * r)):
            if darkest[x, y] < 150 and (x - cx) ** 2 + (y - cy) ** 2 > (r + 2) ** 2:
                sx0, sy0 = min(sx0, x), min(sy0, y)
                sx1, sy1 = max(sx1, x), max(sy1, y)
    return (x0, min(y0, sy0), max(x1, sx1 + 1), max(y1, sy1 + 1)), (cx, cy, r)


def cut_out(mark):
    """RGBA copy with the white background around the mark made transparent.

    White that is enclosed by the mark (the ring around the pupil, the highlight) stays opaque,
    because only white connected to the outside is removed.
    """
    pad = 6
    canvas = Image.new('RGB', (mark.width + 2 * pad, mark.height + 2 * pad), WHITE)
    canvas.paste(mark, (pad, pad))
    candidate = channel_min(canvas).point(lambda v: 255 if v >= 232 else 0)
    ImageDraw.floodfill(candidate, (0, 0), 128, thresh=0)
    alpha = candidate.point(lambda v: 0 if v == 128 else 255)
    # Trim the light JPEG fringe and soften the edge.
    alpha = alpha.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.8))
    rgba = canvas.convert('RGBA')
    rgba.putalpha(alpha)
    return rgba.crop((pad, pad, pad + mark.width, pad + mark.height))


def light_sparkles(rgba, centre, radius):
    """Copy where everything outside the wheel (the dark sparkles) is white, for dark backgrounds."""
    out = rgba.copy()
    px = out.load()
    cx, cy = centre
    limit = (radius + 3) ** 2
    for y in range(out.height):
        for x in range(out.width):
            if (x - cx) ** 2 + (y - cy) ** 2 > limit:
                r, g, b, a = px[x, y]
                if a:
                    px[x, y] = (255, 255, 255, a)
    return out


def silhouette(mark):
    """Black shape on transparent, for Android's themed (monochrome) icon."""
    pad = 6
    canvas = Image.new('RGB', (mark.width + 2 * pad, mark.height + 2 * pad), WHITE)
    canvas.paste(mark, (pad, pad))
    alpha = channel_min(canvas).point(lambda v: 255 if v < 215 else 0).filter(ImageFilter.GaussianBlur(0.8))
    shape = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    shape.putalpha(alpha)
    return shape.crop((pad, pad, pad + mark.width, pad + mark.height))


def place(mark, size, share, background):
    """Centre `mark` on a square canvas, its longest side being `share` of the canvas."""
    scale = size * share / max(mark.size)
    resized = mark.resize((round(mark.width * scale), round(mark.height * scale)), Image.LANCZOS)
    mode = 'RGBA' if background is None else 'RGB'
    canvas = Image.new(mode, (size, size), (0, 0, 0, 0) if background is None else background)
    pos = ((size - resized.width) // 2, (size - resized.height) // 2)
    if resized.mode == 'RGBA':
        canvas.paste(resized, pos, resized)
    else:
        canvas.paste(resized, pos)
    return canvas


def main():
    img = Image.open(SRC).convert('RGB')
    box, (cx, cy, r) = find_mark(img)
    print(f'logo {img.size}, wheel centre ({cx:.0f}, {cy:.0f}) radius {r:.0f}, mark box {box}')
    mark = img.crop(box)
    mark_rgba = cut_out(mark)

    OUT.mkdir(parents=True, exist_ok=True)
    # iOS and the store listing want an opaque square; Android's adaptive icon crops to a circle
    # or squircle, so its foreground keeps the mark well inside the central safe zone.
    place(mark, 1024, 0.80, WHITE).save(OUT / 'icon.png')
    place(mark_rgba, 1024, 0.56, None).save(OUT / 'android-icon-foreground.png')
    Image.new('RGB', (1024, 1024), WHITE).save(OUT / 'android-icon-background.png')
    place(silhouette(mark), 1024, 0.56, None).save(OUT / 'android-icon-monochrome.png')
    place(mark_rgba, 1024, 0.80, None).save(OUT / 'splash-icon.png')
    place(mark, 196, 0.92, WHITE).save(OUT / 'favicon.png')

    # In-app logo for the purple header: tight crop, transparent, light sparkles, 256 px long side.
    on_dark = light_sparkles(mark_rgba, (cx - box[0], cy - box[1]), r)
    scale = 256 / max(on_dark.size)
    on_dark.resize((round(on_dark.width * scale), round(on_dark.height * scale)), Image.LANCZOS).save(
        OUT / 'logo-mark.png'
    )
    print('written to', OUT)


if __name__ == '__main__':
    main()
