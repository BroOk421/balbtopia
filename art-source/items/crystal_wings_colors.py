# Red / Green / White / Black Crystal Wings (owner, Nov 7 2026 build r; build s: "too bright, the shading / detail
# doesn't show like on the blue ones"): the blue Crystal Wings recoloured, folded strip (wings_crystal.png, 8 frames)
# and spread picture (wings_crystal_open.png, from wings_open_cut.py).
# Build s method: the HUE is turned (each pixel keeps its own offset from the blue, so the cyan highlights and deep
# shadows stay different colours), then the pixel is scaled so its LUMINANCE equals the blue pixel's (times `k`):
# every shadow, highlight and outline keeps exactly its brightness. White / black are greys (lightly tinted) built
# from that luminance. Writes wings_crystal_<colour>[_open].png. Run from the repo root.
import colorsys
from PIL import Image

BLUE = 0.6  # the blue art's main hue
luma = lambda r, g, b: 0.299 * r + 0.587 * g + 0.114 * b


def to_luma(rgb, Y):
    """scale rgb so its luminance is Y; if a channel would pass 1, mix towards white instead"""
    y0 = luma(*rgb)
    if y0 <= 1e-6:
        return (Y, Y, Y)
    r, g, b = (c * Y / y0 for c in rgb)
    m = max(r, g, b)
    if m > 1:  # keep the luminance, lose some saturation
        t = (m - 1) / max(1e-6, m - Y)
        r, g, b = (c + (Y - c) * t for c in (r, g, b))
    return tuple(max(0, min(1, c)) for c in (r, g, b))


def hue_turn(target, k=1.0, sat=1.0):
    def f(rgb):
        Y = luma(*rgb) * k
        h, s, v = colorsys.rgb_to_hsv(*rgb)
        return to_luma(colorsys.hsv_to_rgb((h - BLUE + target) % 1, min(1, s * sat), v), Y)
    return f


def grey(lift, k, tint):
    def f(rgb):
        Y = min(1, lift + luma(*rgb) * k)
        return tuple(max(0, min(1, Y * t)) for t in tint)
    return f


COLOURS = {
    'red': hue_turn(0.995, 1.0, 1.0),
    'green': hue_turn(0.36, 1.0, 0.95),
    'white': grey(0.24, 0.9, (0.96, 0.98, 1.04)),
    'black': hue_turn(0.76, 0.5, 0.55),
}
for src in ('wings_crystal', 'wings_crystal_open'):
    im = Image.open(f'www/assets/items/{src}.png').convert('RGBA')
    for name, fn in COLOURS.items():
        out = im.copy()
        px = out.load()
        for y in range(out.height):
            for x in range(out.width):
                r, g, b, a = px[x, y]
                if not a:
                    continue
                r2, g2, b2 = fn((r / 255, g / 255, b / 255))
                px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
        dst = src.replace('wings_crystal', 'wings_crystal_' + name)
        out.save(f'www/assets/items/{dst}.png')
        print(dst, out.size)
