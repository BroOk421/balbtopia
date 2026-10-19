# Mouths from the owner's talking sheet (4 rows x 5): only the mouth pixels of each frame, scaled from his head width
# to ours, saved centred in small cells; the game draws them over our own mouth.
import json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
a = np.asarray(Image.open('sheet.png').convert('RGB')).astype(int)
H, W, _ = a.shape
R, G, B = a[..., 0], a[..., 1], a[..., 2]
skin = (R > 215) & (G > 150) & (G < 215) & (B > 100) & (B < 175) & (R - B > 60)
lab, n = nd.label(nd.binary_closing(skin, iterations=2))
sizes = nd.sum(skin, lab, range(1, n + 1))
objs = nd.find_objects(lab)
heads = []
for i, sl in enumerate(objs):
    if sizes[i] < 6000: continue
    y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
    if (y1 - y0) < 80: continue
    heads.append((y0, y1, x0, x1, i + 1))
heads.sort(key=lambda h: (round(h[0] / 200), h[2]))
print(len(heads))
OUT = []
for (y0, y1, x0, x1, li) in heads:
    m = nd.binary_fill_holes(lab == li)
    hw = x1 - x0
    # mouth: non-skin pixels inside the filled head, in the lower part, below the eyes
    yy = np.arange(H)[:, None]
    inside = m & ~skin & (yy > y0 + (y1 - y0) * 0.62)
    # the face's own outline is at the edges: keep a margin from the head edge
    inside &= nd.binary_erosion(m, iterations=8)
    ml, mn = nd.label(inside)
    if not mn: OUT.append(None); continue
    sz = nd.sum(inside, ml, range(1, mn + 1))
    # the biggest piece near the face's middle-right (character looks right)
    k = int(np.argmax(sz)) + 1
    piece = nd.binary_dilation(ml == k, iterations=1) & ~skin
    ys, xs = np.where(piece)
    OUT.append(dict(box=[int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1], hw=int(hw), head=[x0, y0, x1, y1],
                    cx=float(xs.mean()), cy=float(ys.mean())))
    print((x0, y0), 'hw', hw, 'mouth', OUT[-1]['box'])
json.dump(OUT, open('mouths.json', 'w'))
