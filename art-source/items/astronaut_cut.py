# Astronaut Set (owner, Nov 6 2026): cuts his sheet (astronaut_sheet.png: the suited character + helmet, suit,
# gloves and boots pieces) into www/assets/items/:
#   space_helmet.png  the helmet piece with its open visor filled DARK (the face doesn't show when worn)
#   space_suit_icon.png, space_boots_icon.png  bag / Shop icons of the suit (with its gloves) and the boots
# Run from the repo root: python3 art-source/items/astronaut_cut.py
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage

SRC = 'art-source/items/astronaut_sheet.png'
OUT = 'www/assets/items/'
im = Image.open(SRC).convert('RGBA')


def tight(a):
    ys, xs = np.where(a[:, :, 3] > 100)
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


# ---- helmet: fill the see-through visor hole (not touching the picture's border) with a dark navy glass
h = tight(np.array(im.crop((650, 80, 1150, 480))))
op = h[:, :, 3] > 100
lab, n = ndimage.label(~op)
edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
hole = np.zeros_like(op)
for k in range(1, n + 1):
    if k not in edge and (lab == k).sum() > 500:
        hole |= lab == k
hy, hx = np.where(hole)
y0, y1, x0, x1 = hy.min(), hy.max(), hx.min(), hx.max()
for y, x in zip(hy, hx):
    t = (y - y0) / (y1 - y0)
    h[y, x, :3] = np.array([14, 17, 34]) * (1 - t) + np.array([28, 34, 66]) * t
    h[y, x, 3] = 255
helm = Image.fromarray(h)
d = ImageDraw.Draw(helm)
cell = 8  # the sheet's pixel-art cell
bx, by = int(x0 + 0.14 * (x1 - x0)), int(y0 + 0.18 * (y1 - y0))
for dx, dy in [(0, 2), (1, 1), (2, 0), (3, 0), (5, 0)]:  # a little glint on the glass
    d.rectangle([bx + dx * cell, by + dy * cell, bx + dx * cell + cell - 1, by + dy * cell + cell - 1], fill=(84, 100, 158, 255))
# stored at 2x its size on the body (strip w 151 x h 122 in wear px)
helm = helm.resize((302, 244), Image.LANCZOS)
helm.save(OUT + 'space_helmet.png')

# ---- icons
pieces = im.crop((660, 490, 1160, 1346))
suit = Image.fromarray(tight(np.array(pieces.crop((0, 0, 500, 340)))))
boots = Image.fromarray(tight(np.array(pieces.crop((0, 570, 500, 800)))))
for pic, name in [(suit, 'space_suit_icon'), (boots, 'space_boots_icon')]:
    s = 96 / max(pic.size)
    pic.resize((max(1, round(pic.width * s)), max(1, round(pic.height * s))), Image.LANCZOS).save(OUT + name + '.png')
print('ok', helm.size)
