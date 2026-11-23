# Cleans the aura strips (owner, Nov 23 2026: "clean the aura a bit, it's still messy"): per frame, only the flame
# itself is kept: the soft smoky haze round it (alpha < HAZE) and every bit not joined to the biggest piece (the
# floating sparks / dots) are taken out; small holes inside the flame are filled from their neighbours. Then (owner:
# "that stroke, can you remove it, the mess") the swirl strokes across the flame are painted over with the flame round
# them. All five strips are recolours of the golden one (same shapes), so the stroke mask is found once per frame on
# the GOLDEN original, where strokes are near-white: blue >= SEED starts a stroke, it grows into touching pixels with
# blue >= GROW (the pale rim), then 2 px more; the same mask is used on every colour, so the white aura's strokes go
# too. Then (owner's recording, Nov 23: erasing the pale outer layer by hand, "remove that in all") the pale rim
# round the flame tongues is cut away (rim_mask, again from the golden frame, same cut on every colour). Masked pixels take the smooth (Gaussian-weighted) colour of the unmasked flame round them.
# Originals: art-source/items/aura_before_clean/aura_*.png.  Run:  python3 art-source/items/aura_clean.py <project root>
import sys, numpy as np
from PIL import Image
from scipy import ndimage
ROOT = sys.argv[1]
HAZE = 170
SEED, GROW = 215, 165
PALE, RIM = 80, 10
g = np.array(Image.open(f'{ROOT}/art-source/items/aura_before_clean/aura_golden.png').convert('RGBA')).astype(int)


def stroke_mask(gf, keep):
    seed = keep & (gf[..., 2] >= SEED)
    grow = keep & (gf[..., 2] >= GROW)
    lab, cnt = ndimage.label(grow, structure=np.ones((3, 3)))
    hit = np.unique(lab[seed])
    m = np.isin(lab, hit[hit > 0])
    return ndimage.binary_dilation(m, structure=np.ones((3, 3)), iterations=2) & keep


def inpaint(f, m):
    # normalised Gaussian fill: the smooth flame colour round the stroke, no streaks copied along it
    f = f.astype(float)
    ok = (~m & (f[..., 3] > 0)).astype(float)
    for sg in (2.5, 5, 10):
        w = ndimage.gaussian_filter(ok, sg)
        fill = np.stack([ndimage.gaussian_filter(f[..., ch] * ok, sg) for ch in range(3)], -1)
        do = m & (w > 0.05)
        f[do, :3] = fill[do] / w[do, None]
        m = m & ~do
        if not m.any():
            break
    return f.round().clip(0, 255).astype(np.uint8)


def rim_mask(gf):
    # the pale outer layer round the flame tongues: pale (blue >= PALE) pixels reachable from outside within RIM steps
    op = gf[..., 3] > 0
    pale = op & (gf[..., 2] >= PALE)
    gone = np.zeros_like(op)
    for _ in range(RIM):
        grow = ndimage.binary_dilation(~op | gone, structure=np.ones((3, 3))) & pale & ~gone
        if not grow.any():
            break
        gone |= grow
    keep = op & ~gone
    lab, n = ndimage.label(keep, structure=np.ones((3, 3)))
    if n:
        keep = lab == (int(np.argmax(ndimage.sum(keep, lab, range(1, n + 1)))) + 1)
    return ~keep


GOLD = {}
for n in ('golden', 'red', 'dark', 'diamond', 'white'):
    a = np.array(Image.open(f'{ROOT}/art-source/items/aura_before_clean/aura_{n}.png').convert('RGBA'))
    FW = a.shape[1] // 8
    out = np.zeros_like(a)
    for k in range(8):
        f = a[:, k * FW:(k + 1) * FW].copy()
        solid = f[..., 3] >= HAZE
        lab, cnt = ndimage.label(solid)
        if cnt:
            sizes = ndimage.sum(solid, lab, range(1, cnt + 1))
            keep = lab == (int(np.argmax(sizes)) + 1)
        else:
            keep = solid
        keep = ndimage.binary_fill_holes(keep)
        # holes that were see-through: take the nearest kept colour, fully opaque
        holes = keep & (f[..., 3] < HAZE)
        if holes.any():
            idx = ndimage.distance_transform_edt(~(keep & ~holes), return_distances=False, return_indices=True)
            f[holes] = f[idx[0][holes], idx[1][holes]]
        f[keep, 3] = np.maximum(f[keep, 3], 255)
        f[~keep] = 0
        # the swirl strokes, found on the golden frame
        f = inpaint(f, stroke_mask(g[:, k * FW:(k + 1) * FW], keep))
        if n == 'golden':
            GOLD[k] = rim_mask(f.astype(int))
        f[GOLD[k]] = 0
        out[:, k * FW:(k + 1) * FW] = f
    Image.fromarray(out).save(f'{ROOT}/www/assets/items/aura_{n}.png', optimize=True)
    print(n, 'cleaned')
