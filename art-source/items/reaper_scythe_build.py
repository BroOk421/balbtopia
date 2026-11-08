# Owner's reaper scythe GIF -> frames where the handle (and the blade where it crosses the handle) never moves:
# frame 0 inside a band round the handle's line, each frame's own flames outside it (frames lined up first).
import sys
from PIL import Image
import numpy as np
src, outdir, BAND = sys.argv[1], sys.argv[2], float(sys.argv[3])
im = Image.open(src)
fr = []
for i in range(im.n_frames):
    im.seek(i); fr.append(np.array(im.convert('RGBA')).astype(int))
H, W = fr[0].shape[:2]
dark = lambda a: (a[..., 3] > 128) & (a[..., :3].mean(axis=2) < 110)
reg = (slice(220, H), slice(0, 170))
shifts = []
for a in fr:
    b0 = dark(fr[0])[reg]; best = None
    for dx in range(-12, 13):
        s = np.roll(dark(a), dx, 1)[reg]
        sc = (s & b0).sum() / max(1, (s | b0).sum())
        if best is None or sc > best[0]: best = (sc, dx)
    shifts.append(best[1])
al = [np.roll(a, dx, 1) for a, dx in zip(fr, shifts)]
# handle line from frame 0's dark pixels in the lower left
ys, xs = np.nonzero(dark(fr[0])[220:, :170]); ys = ys + 220
P = np.stack([xs, ys], 1).astype(float); c = P.mean(0)
u, s, vt = np.linalg.svd(P - c); d = vt[0]
yy, xx = np.mgrid[0:H, 0:W]
dist = np.abs((xx - c[0]) * d[1] - (yy - c[1]) * d[0])
band = dist < BAND
# soft edge so the seam doesn't show
wgt = np.clip((BAND + 3 - dist) / 6, 0, 1)[..., None]
# the blade stays still too: frame 0's dark body and its bright yellow-white edge (dilated a little), only the green
# flames come from each frame
f0 = fr[0]
lum = f0[..., :3].mean(axis=2)
core = (f0[..., 3] > 128) & ((lum < 95) | ((f0[..., 0] > 190) & (f0[..., 1] > 200)))
from PIL import ImageFilter
cm = np.array(Image.fromarray((core * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3))) > 0
cw = np.array(Image.fromarray((cm * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1))).astype(float)[..., None] / 255
wgt = np.maximum(wgt, cw * (f0[..., 3:4] > 128))
out = []
for a in al:
    o = a * (1 - wgt) + fr[0] * wgt
    out.append(np.clip(o, 0, 255).astype('uint8'))
for i, o in enumerate(out):
    Image.fromarray(o).save(f'{outdir}/g{i}.png')
print('shifts', shifts, 'line', c, d)

# ---- into the game's scythe picture space: 72 x 72 units (SCY_N), RES canvas px per unit, the grip rings on SCY_GRIP,
# the handle turned to SCY_HANDLE_ANG (scythes.js) ----
import math
RES, N, G = 4, 72, (15.9, 41)
grip = (101.5, 290.3)
s = 0.136
th = math.atan2(-35, 6) - math.atan2(-d[1] if d[1] > 0 else d[1], -d[0] if d[1] > 0 else d[0])
cs, sn = math.cos(-th), math.sin(-th)
# inverse map: canvas px -> source px
a_ = cs / (s * RES); b_ = -sn / (s * RES)
d_ = sn / (s * RES); e_ = cs / (s * RES)
c_ = grip[0] - (a_ * G[0] * RES + b_ * G[1] * RES)
f_ = grip[1] - (d_ * G[0] * RES + e_ * G[1] * RES)
strip = Image.new('RGBA', (N * RES * len(out), N * RES), (0, 0, 0, 0))
for i, o in enumerate(out):
    im2 = Image.fromarray(o).convert('RGBa').transform((N * RES, N * RES), Image.AFFINE, (a_, b_, c_, d_, e_, f_), resample=Image.BICUBIC).convert('RGBA')
    strip.paste(im2, (i * N * RES, 0))
strip.save(f'{outdir}/reaper_scythe.png', optimize=True)
print('turn', th, 'strip', strip.size, 'bbox', strip.crop((0, 0, N * RES, N * RES)).getbbox())
