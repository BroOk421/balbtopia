# Cuts the owner's space sheet (art-source/moon/space_sheet.png: pixel-art planets, galaxy, nebulae, comets and
# sparkles on a transparent background, 1672 x 941) into the MOON world's backdrop pictures in www/assets/moon/
# (owner, Nov 5 2026: "put the attached backgrounds on the moon").
# Each piece of the sheet goes to the box its middle is in (so neighbours never share bits), pieces under KEEP of the
# biggest one are dropped, the faint halo the background removal left is cut (alpha under 60 -> 0), and the
# picture is halved (box filter) so the files stay small. moon.js (MOON_PARTS) draws them.
# Run: python3 -I art-source/moon/moon_cut.py
import os
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, '..', '..', 'www', 'assets', 'moon')
os.makedirs(out, exist_ok=True)
sheet = Image.open(os.path.join(here, 'space_sheet.png')).convert('RGBA')
# name: (x0, y0, x1, y1, keep: pieces at least this part of the biggest one stay)
PARTS = {
    'earth': ((615, 69, 815, 270), 0.5),
    'saturn': ((963, 80, 1200, 244), 0.5),
    'purple': ((368, 49, 608, 288), 0.5),
    'mars': ((820, 98, 972, 250), 0.5),
    'galaxy': ((1171, 8, 1654, 303), 0.004),
    'blackhole': ((16, 420, 364, 621), 0.02),
    'neb1': ((615, 445, 778, 613), 0.02),
    'neb2': ((785, 439, 1061, 639), 0.02),
    'neb3': ((1072, 445, 1373, 626), 0.02),
    'neb4': ((1332, 471, 1657, 629), 0.02),
    'band1': ((22, 586, 682, 813), 0.01),
    'band2': ((642, 622, 1257, 823), 0.01),
    'milky': ((994, 648, 1654, 923), 0.01),
    'cloud1': ((12, 805, 947, 925), 0.01),
    'cloud2': ((1273, 813, 1660, 923), 0.01),
    'comet_blue': ((1189, 318, 1366, 441), 0.3),
    'comet_purple': ((1321, 309, 1499, 443), 0.3),
    'comet_fire': ((1474, 285, 1651, 462), 0.3),
    'spark_blue': ((382, 434, 525, 598), 0.5),
    'spark_white': ((175, 344, 247, 419), 0.5),
    'spark_pink': ((308, 328, 386, 413), 0.5),
    # the five big asteroids: the Moon Rock block (owner: "the asteroid as I gave it, not a square block")
    'rock1': ((629, 330, 722, 424), 0.5),
    'rock2': ((707, 303, 790, 383), 0.5),
    'rock3': ((786, 371, 874, 456), 0.5),
    'rock4': ((896, 276, 988, 357), 0.5),
    'rock5': ((970, 361, 1083, 447), 0.5),
}
# every piece of the sheet (8-connected, alpha 60+) goes to the box its middle is in (the smallest such box), so a
# picture never takes a bit of its neighbour where their boxes overlap; then each picture is cut to what it got
arr = np.array(sheet)
solid = arr[..., 3] >= 60
lab, n = ndi.label(solid, structure=np.ones((3, 3)))
cents = ndi.center_of_mass(solid, lab, range(1, n + 1))
owner = {}
for k, (cy, cx) in enumerate(cents):
    best = None
    for name, ((x0, y0, x1, y1), _) in PARTS.items():
        if x0 <= cx < x1 and y0 <= cy < y1:
            area = (x1 - x0) * (y1 - y0)
            if best is None or area < best[0]:
                best = (area, name)
    if best:
        owner.setdefault(best[1], []).append(k + 1)
sizes = ndi.sum(solid, lab, range(1, n + 1))
for name, (box, keep) in PARTS.items():
    ids = owner.get(name, [])
    big = max(sizes[i - 1] for i in ids)
    ids = [i for i in ids if sizes[i - 1] >= keep * big]
    m = np.isin(lab, ids)
    ys, xs = np.nonzero(m)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    c = arr[y0:y1, x0:x1].copy()
    c[..., 3] = np.where(m[y0:y1, x0:x1], c[..., 3], 0)
    im = Image.fromarray(c, 'RGBA')
    # premultiply before shrinking so the cut edges don't darken, then un-premultiply
    f = np.array(im).astype(np.float32)
    f[..., :3] *= f[..., 3:4] / 255
    small = Image.fromarray(f.astype(np.uint8), 'RGBA').resize((max(1, im.width // 2), max(1, im.height // 2)), Image.BOX)
    s = np.array(small).astype(np.float32)
    al = s[..., 3:4]
    s[..., :3] = np.where(al > 0, np.clip(s[..., :3] * 255 / np.maximum(al, 1), 0, 255), 0)
    Image.fromarray(s.astype(np.uint8), 'RGBA').save(os.path.join(out, name + '.png'), optimize=True)
    print(name, small.width, 'x', small.height)
