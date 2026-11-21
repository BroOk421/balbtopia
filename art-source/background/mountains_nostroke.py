# (owner, Nov 21 2026: "remove the mountains' strokes") the blue day mountains (assets/background/mountains.png, used by
# the day / night weather and the Sun / Snow Machines) without their dark outline: every dark stroke pixel (L < 82)
# and the 3 px rim round the sky are filled from their inner neighbours, growing inwards. Reads the original
# (art-source/background/mountains_stroked.png), so it can be run again.
# Run:  python3 art-source/background/mountains_nostroke.py <project root>   (needs numpy, scipy, Pillow)
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = sys.argv[1]
a = np.array(Image.open(ROOT + '/art-source/background/mountains_stroked.png').convert('RGBA')).astype(np.float32)
H, W = a.shape[:2]
FLAT = 554  # from this row down the picture is one flat colour (the foot): not touched
op = a[..., 3] > 0
L = 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]
bad = op & (L < 82)
rim = op & (ndimage.distance_transform_cdt(op, metric='chessboard') <= 3)
bad |= rim & (L < 150)
bad[FLAT:] = False
rgb = a[..., :3].copy()
good = op & ~bad
for _ in range(12):
    if not bad.any():
        break
    acc = np.zeros_like(rgb)
    n = np.zeros((H, W), np.float32)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dy or dx:
                sg = np.roll(np.roll(good, dy, 0), dx, 1)
                acc += np.roll(np.roll(rgb, dy, 0), dx, 1) * sg[..., None]
                n += sg
    fill = bad & (n > 0)
    rgb[fill] = acc[fill] / n[fill][:, None]
    good |= fill
    bad &= ~fill
a[..., :3] = rgb
Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(ROOT + '/www/assets/background/mountains.png')
print('mountains.png: strokes removed')
