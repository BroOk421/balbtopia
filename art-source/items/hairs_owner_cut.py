# The owner's own hair crops (same 2172x724 sheet as the figures, only the hair left). Each hair is placed on our
# head with the fit found for the bald figure: scale 0.689, bald crop (20, 230) -> our (-7, -13), after moving
# the figure onto the bald one (its shift along the row, found by hairs_cut.py).
import json, sys
sys.path.insert(0, '.')
from match import match
import numpy as np
from PIL import Image
from scipy import ndimage as nd
a = np.asarray(Image.open('crop.png').convert('RGBA')).astype(float)
a = np.pad(a, ((0, 0), (0, 200), (0, 0)))
S, BX, BY, TX, TY = 0.689, 20, 230, -7, -13
SHIFTS = [213, 434, 654, 876, 1108, 1343, 1555, 1763, 1973]   # figure k's x offset from the bald one (dy 0)
BALD_CX = 111                                                  # the bald figure's body centre on the sheet
# the red ponytail matched too small (long loose strands); search near the others' size
FIX = {'red_ponytail': (0.9, 1986, 204)}
SCALES = {'red_ponytail': np.arange(0.875, 0.935, 0.005)}
NAMES = ['messy_black', 'silver', 'brown_spike', 'black_bun', 'long_black', 'pink_bun', 'blonde_band', 'black_bob', 'red_ponytail']
solid = a[..., 3] >= 200
lab, n = nd.label(solid, structure=np.ones((3, 3)))
cent = nd.center_of_mass(solid, lab, range(1, n + 1))
size = nd.sum(solid, lab, range(1, n + 1))
meta = {}
for k, name in enumerate(NAMES):
    cx = BALD_CX + SHIFTS[k]
    ids = [i + 1 for i, (cy_, cx_) in enumerate(cent) if abs(cx_ - cx) < 120 and size[i] >= 20]
    m = np.isin(lab, ids)
    # only pieces joined to (or right by) the main hair: no stray specks
    big_id = max(ids, key=lambda i: size[i - 1])
    near = nd.binary_dilation(lab == big_id, iterations=6)
    m = np.isin(lab, [i for i in ids if (near & (lab == i)).any()])
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    # where this hair sits on the original sheet (its size and place there), by matching its colours
    err, sc, mx, my = match(x0, y0, x1, y1, SCALES.get(name, np.arange(0.84, 0.97, 0.005)), win=(max(0, int(cx - 200)), 120, int(cx + 200), 640))
    if name in FIX: sc, mx, my = FIX[name]  # placed by eye on the head (the colour match slides along the long strands)
    print(name, 'match scale', round(sc, 3), 'at', mx, my, 'err', round(err, 4))
    crop = a[y0:y1, x0:x1].copy()
    crop[..., 3] = np.where(m[y0:y1, x0:x1], 255, 0)
    im = Image.fromarray(crop.astype(np.uint8), 'RGBA')
    # premultiplied resize for clean edges
    pm = crop.copy(); pm[..., :3] *= pm[..., 3:4] / 255
    big = np.asarray(Image.fromarray(pm.astype(np.uint8), 'RGBA').resize((round(im.width * S * sc), round(im.height * S * sc)), Image.LANCZOS)).astype(float)
    big[..., :3] = np.clip(big[..., :3] * 255 / np.maximum(big[..., 3:4], 1), 0, 255)
    out = Image.fromarray(big.astype(np.uint8), 'RGBA')
    # where the crop's top-left lands on our body sprite (sheet -> bald coords -> ours)
    ox = S * (mx - SHIFTS[k] - BX) + TX
    oy = S * (my - BY) + TY
    out.save('hair_' + name + '.png', optimize=True)
    sq = max(out.size); ico = Image.new('RGBA', (sq, sq)); ico.alpha_composite(out, ((sq - out.width) // 2, (sq - out.height) // 2))
    ico.resize((64, 64), Image.LANCZOS).save('hair_' + name + '_icon.png', optimize=True)
    meta[name] = dict(x=round(ox), y=round(oy), w=out.width, h=out.height)
    print(name, meta[name])
json.dump(meta, open('meta.json', 'w'))
