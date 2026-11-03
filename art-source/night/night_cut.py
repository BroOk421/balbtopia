# Cuts the owner's silhouette sheet (art-source/night/silhouettes_sheet.png: black shapes on a transparent background,
# 1536 x 1024) into the Night Machine's pictures in www/assets/night/ (owner, Nov 4 2026):
#   palm (the coconut tree), grass (the low bare brush), moon (a plain disc).
# (Only the coconut tree is used of the trees, and not the castle / house: the owner's choice, Nov 4 2026.)
# Each shape is cut by its box, shrunk 8x (box filter, alpha cut at 50%: blocky pixel art, drawn without smoothing),
# and painted one flat colour: the moon cream, the rest very dark blue. The grass also gets a soft blue moonlight glow
# picture (grass_glow.png: the same canvas with GLOW_PAD pixels round it; concert.js NIGHT_PAD).
# Run: python3 -I art-source/night/night_cut.py
import os
import numpy as np
from scipy import ndimage as ndi
from PIL import Image, ImageFilter
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, '..', '..', 'www', 'assets', 'night')
os.makedirs(out, exist_ok=True)
sheet = Image.open(os.path.join(here, 'silhouettes_sheet.png')).convert('RGBA').split()[3]
K, GLOW_PAD = 8, 8
# name: (box x0, y0, x1, y1, colour)
PARTS = {
    'palm': ((940, 54, 1254, 468), (5, 14, 36)),
    'moon': ((1258, 95, 1532, 375), (244, 238, 204)),
    'grass': ((474, 812, 900, 998), (8, 22, 52)),
}
GLOW = {}  # no glow any more (owner, Nov 4 2026)
for name, (box, col) in PARTS.items():
    a = sheet.crop(box)
    w, h = max(1, round(a.width / K)), max(1, round(a.height / K))
    a = a.resize((w, h), Image.BOX).point(lambda v: 255 if v >= 128 else 0)
    # drop the bits of a neighbouring shape that fall inside the box: pieces under half of the biggest piece
    # (grass: under 6%, it is several tufts)
    m = np.array(a) > 0
    lab, n = ndi.label(m, structure=np.ones((3, 3)))
    sizes = ndi.sum(m, lab, range(1, n + 1))
    keep = [i + 1 for i, v in enumerate(sizes) if v >= (0.06 if name == 'grass' else 0.5) * max(sizes)]
    a = Image.fromarray(((m & np.isin(lab, keep)) * 255).astype(np.uint8))
    rgba = Image.new('RGBA', (w, h), col + (255,))
    rgba.putalpha(a)
    rgba.save(os.path.join(out, name + '.png'))
    print(name, w, 'x', h)
    if name in GLOW:
        big = Image.new('L', (w + 2 * GLOW_PAD, h + 2 * GLOW_PAD), 0)
        big.paste(a, (GLOW_PAD, GLOW_PAD))
        soft = big.filter(ImageFilter.GaussianBlur(3.2))
        al = np.array(soft).astype(np.float32) / 255
        al = np.clip(al * 1.5, 0, 1) * 0.5  # a soft halo, at most half strong
        g = np.zeros((big.height, big.width, 4), np.uint8)
        g[..., :3] = GLOW[name]
        g[..., 3] = (al * 255).astype(np.uint8)
        Image.fromarray(g, 'RGBA').save(os.path.join(out, name + '_glow.png'))
