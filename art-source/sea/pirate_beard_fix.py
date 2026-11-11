# Pirate Beard fix (owner, Nov 11 2026: "raise the pirate beard more, put the mouth in the middle of the beard").
# Takes the beard cut by pirate_cut.py (www/assets/sea/pirate_beard.png), cleans it and opens a mouth hole:
# - keeps only the beard itself: drops the bits the first cut caught from the reference (the ear's brown line, skin
#   pixels, the tank top's grey lines and the head's black outline round it);
# - cuts a rounded MOUTH opening between the mustache and the chin beard, under the mustache's middle parting (the
#   top of the goatee goes), so the game's own mouth shows in the middle of the beard;
# - prints the opening's middle (picture px): wear/pirate.js puts that point on the character's mouth.
# Run from this folder: python3 pirate_beard_fix.py (reads and writes ../../www/assets/sea/pirate_beard.png, keeps a
# copy of the first cut as pirate_beard_cut1.png here the first time).
import os
from PIL import Image
import numpy as np
from scipy import ndimage

SRC = '../../www/assets/sea/pirate_beard.png'
KEEP = 'pirate_beard_cut1.png'
if not os.path.exists(KEEP):
    Image.open(SRC).save(KEEP)
A = np.array(Image.open(KEEP).convert('RGBA')).astype(int)
H, W = A.shape[:2]
r, g, b, a = A[:, :, 0], A[:, :, 1], A[:, :, 2], A[:, :, 3]
ys, xs = np.mgrid[0:H, 0:W]
op = a > 40
skin = op & (r > 170) & (r - b > 40)
grey = op & (abs(r - g) < 16) & (abs(g - b) < 16) & (r > 70)
black = op & (np.maximum(np.maximum(r, g), b) < 12)  # the head's outline: pure black (the beard's darkest brown is warmer)
hair = op & ~skin & ~grey & ~black
# the beard = the big brown piece(s) below the ear line
lab, n = ndimage.label(hair & (ys > 40))
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
beard = np.zeros_like(hair)
for k, s in enumerate(sizes, 1):
    if s > 120:
        beard |= lab == k
# a thin dark edge back round it (1 px of the outline that touches the beard), so it doesn't look cut out
edge = black & ndimage.binary_dilation(beard, iterations=1)
# (only outline pixels hugging the beard: a pixel with fewer than 2 beard pixels round it is a leftover of the head's
# outline, like the long line out to the left and the stroke by the right curl)
near = ndimage.convolve(beard.astype(int), np.ones((3, 3), int), mode='constant')
edge &= near >= 2
keep = beard | edge
# dark strokes one pixel thin sticking out of it (the head's outline caught with the beard) go too
thick = ndimage.binary_opening(keep, structure=np.ones((3, 3), bool))
keep &= thick | ~(op & (np.maximum(np.maximum(r, g), b) < 60))
# the head's right outline beside the mustache's right curl (a 3 px stroke, partly lighter: anti-aliased)
keep[40:67, 189:194] = False
lab, n = ndimage.label(keep)
if n > 1:
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    keep = np.isin(lab, [k for k, s in enumerate(sizes, 1) if s > 40])

# the mouth opening: under the mustache's parting (its lowest point near the middle), the full width of the gap
cols = [x for x in range(100, 175) if beard[:, x].any()]
must_bot = {}
for x in cols:
    run = np.nonzero(beard[45:, x])[0]
    if len(run):
        # first gap below the mustache's first run of brown
        y = 45 + run[0]
        while y < H and beard[y, x]:
            y += 1
        must_bot[x] = y
mx = int(round(np.mean([x for x in must_bot if 125 <= x <= 150])))  # the parting
my_top = must_bot[mx]
HW, HH = 15, 11  # half width, height of the opening (picture px; the game mouth is 12 x 3 frame px = 24 x 6 here)
cy = my_top + HH / 2 - 1
hole = (((xs + 0.5 - mx) / HW) ** 2 + ((ys + 0.5 - cy) / (HH / 2 + 1)) ** 2 <= 1) & (ys >= my_top - 1)
keep &= ~hole
out = A.copy()
out[~keep] = 0
# soften the opening's rim: its edge pixels a little darker (the beard's own shadow)
rim = keep & ndimage.binary_dilation(hole, iterations=1)
out[rim, :3] = (out[rim, :3] * 0.72).astype(int)
Image.fromarray(out.astype(np.uint8)).save(SRC)
print('mouth opening middle (picture px):', mx, round(cy, 1), 'size', W, H)
