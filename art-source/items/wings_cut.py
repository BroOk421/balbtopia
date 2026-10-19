# The owner's 10 wings (2 rows of 5) -> one picture strip each, for the back slot.
# The wing halves are the big pieces; the small loose pieces are particles (sparkles, stars, orbs). Wings with
# particles get FRAMES frames in which every particle twinkles and floats up and down on its own beat.
import json, math
import numpy as np
from PIL import Image
from scipy import ndimage as nd
a = np.asarray(Image.open('sheet.png').convert('RGBA')).astype(float)
H, W, _ = a.shape
A = a[..., 3]
NAMES = ['seraph', 'demon', 'phoenix', 'crystal', 'fairy', 'shadow', 'celestial', 'dragon', 'leaf', 'galaxy']
FRAMES = 8
OUT_W = 240  # width on our body, in body-sprite pixels
rng = np.random.default_rng(7)
meta = {}
solid = A > 110
lab, n = nd.label(solid, structure=np.ones((3, 3)))
sizes = nd.sum(np.ones_like(A), lab, range(1, n + 1))
objs = nd.find_objects(lab)
cw, ch = W / 5, H / 2
for k, name in enumerate(NAMES):
    r, c = divmod(k, 5)
    # pieces whose centre is in this cell
    ids = []
    for i, sl in enumerate(objs):
        cy = (sl[0].start + sl[0].stop) / 2; cx = (sl[1].start + sl[1].stop) / 2
        if c * cw <= cx < (c + 1) * cw and r * ch <= cy < (r + 1) * ch and sizes[i] >= 6:
            ids.append(i + 1)
    big = [i for i in ids if sizes[i - 1] >= 1500]
    small = [i for i in ids if sizes[i - 1] < 1500]
    allm = np.isin(lab, ids)
    ys, xs = np.where(allm)
    y0, y1, x0, x1 = ys.min() - 8, ys.max() + 9, xs.min() - 8, xs.max() + 9
    crop = a[y0:y1, x0:x1].copy()
    L = lab[y0:y1, x0:x1]
    # soft edge kept only right next to a piece (drop the stray glow of the cutout)
    near = nd.binary_dilation(np.isin(L, ids), iterations=2)
    crop[..., 3] = np.where(near, crop[..., 3], 0)
    base = crop.copy()
    pmask = nd.binary_dilation(np.isin(L, small), iterations=2) & ~nd.binary_dilation(np.isin(L, big), iterations=1)
    base[..., 3] = np.where(pmask, 0, base[..., 3])
    nfr = FRAMES if small else 1
    parts = []
    for i in small:
        pl = nd.binary_dilation(L == i, iterations=2) & pmask
        if pl.any(): parts.append((pl, rng.random(), 0.6 + rng.random() * 0.8))
    frames = []
    for f in range(nfr):
        fr = base.copy()
        t = f / nfr
        for pl, ph, amp in parts:
            u = (t + ph) % 1
            al = 0.3 + 0.7 * (0.5 + 0.5 * math.cos(2 * math.pi * u))   # twinkle
            dy = -round(3 * amp * math.sin(2 * math.pi * u))            # float up and down
            layer = np.zeros_like(crop)
            layer[pl] = crop[pl]
            layer[..., 3] *= al
            layer = np.roll(layer, dy, axis=0)
            # over the base
            la = layer[..., 3:4] / 255; ba = fr[..., 3:4] / 255
            oa = la + ba * (1 - la)
            fr[..., :3] = np.where(oa > 0, (layer[..., :3] * la + fr[..., :3] * ba * (1 - la)) / np.maximum(oa, 1e-6), 0)
            fr[..., 3:4] = oa * 255
        frames.append(fr)
    s = OUT_W / crop.shape[1]
    fw, fh = OUT_W, round(crop.shape[0] * s)
    strip = Image.new('RGBA', (fw * nfr, fh))
    for f, fr in enumerate(frames):
        pm = fr.copy(); pm[..., :3] *= pm[..., 3:4] / 255
        im = Image.fromarray(pm.astype(np.uint8), 'RGBA').resize((fw, fh), Image.LANCZOS)
        b = np.asarray(im).astype(float)
        b[..., :3] = np.clip(b[..., :3] * 255 / np.maximum(b[..., 3:4], 1), 0, 255)
        strip.paste(Image.fromarray(b.astype(np.uint8), 'RGBA'), (f * fw, 0))
    strip.save('wings_' + name + '.png', optimize=True)
    meta[name] = dict(frames=nfr, w=fw, h=fh, particles=len(parts))
    print(name, meta[name])
json.dump(meta, open('meta.json', 'w'))
