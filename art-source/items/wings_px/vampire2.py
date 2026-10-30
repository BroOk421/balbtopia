# Vampire Wings (+ Tiny), v2: the owner's own sample wing (sampled into its pixel grid, ref_grid.txt), recoloured:
# its bright/red structure becomes black bone, its dark skin becomes red. Left wing from the sample, right = mirror.
# Animated by turning the cell grid round the shoulder (nearest cell), same 48x46 canvas as the other wings.
import math, os
import numpy as np
from PIL import Image

PX, GW, GH = 5, 48, 46
OUT = 'vamp2'; os.makedirs(OUT, exist_ok=True)
def hx(h, a=255): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)] + [a], np.uint8)
rows = open('ref_grid.txt').read().split('\n')
G = [r[:15] for r in rows]                     # left wing, 15 x 24
GH_, GW_ = len(G), 15
COL = {'5': '#4a3c46',   # bone highlight
       '4': '#18121a',   # bone
       '3': '#e4313b',   # skin right next to a bone (bright red)
       '2': '#b5161f',   # skin
       '1': '#6c0e17'}   # skin in shadow
OUTL = '#050304'
AX, AY = 14.5, 8.5                             # shoulder end of the arm bone, in sample cells

def render(scale, rot, sq, roots):
    img = np.zeros((GH, GW, 4), np.uint8)
    r = math.radians(rot)
    for side, (rx, ry) in [(-1, roots[0]), (1, roots[1])]:
        for j in range(GH):
            for i in range(GW):
                u = ((i + 0.5 - rx) * side) / sq          # outward
                v = j + 0.5 - ry                           # down
                x = u * math.cos(r) - v * math.sin(r)      # undo the turn
                y = u * math.sin(r) + v * math.cos(r)
                gx, gy = AX - x / scale, AY + y / scale
                gi, gj = int(math.floor(gx)), int(math.floor(gy))
                if 0 <= gi < GW_ and 0 <= gj < GH_ and G[gj][gi] != '.':
                    img[j, i] = hx(COL[G[gj][gi]])
    a = img[..., 3] > 0
    o = np.zeros_like(a)
    o[1:] |= a[:-1]; o[:-1] |= a[1:]; o[:, 1:] |= a[:, :-1]; o[:, :-1] |= a[:, 1:]
    o &= ~a
    img[o] = hx(OUTL)
    return Image.fromarray(img, 'RGBA').resize((GW * PX, GH * PX), Image.NEAREST)

IDLE = [(0, 1.0), (3, 0.98), (6, 0.96), (3, 0.98), (0, 1.0), (-3, 1.0)]
FLAP = [(0, 1.0), (16, 0.94), (28, 0.86), (10, 0.92), (-14, 0.95), (-5, 0.98)]
# the arm's inner end sits behind the shoulder; the big one is the sample 1:1, the tiny one smaller
SETS = {'vampire': (1.0, ((19.0, 27.0), (29.0, 27.0))), 'tiny_vampire': (0.66, ((20.0, 28.0), (28.0, 28.0)))}
for name, (sc, roots) in SETS.items():
    fr = [render(sc, r, s, roots) for r, s in FLAP]   # same flap standing and jumping (owner)
    for i, f in enumerate(fr): f.save(f'{OUT}/{name}_{i}.png')
    strip = Image.new('RGBA', (GW * PX * len(fr), GH * PX))
    for i, f in enumerate(fr): strip.paste(f, (i * GW * PX, 0))
    strip.save(f'{OUT}/wings_{name}.png')
print('ok')
