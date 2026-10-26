# The owner's Diamond / Golden Diaper walk (art-source/character/diaper_owner/diamond_00..07.png, gold_00..07.png:
# 8 walking frames of our porcelain character, 118 x 215, same drawing for both, only the diaper's colours differ)
#  -> www/assets/character/<skin>/diaper_walk_0..7.png  the walking body (diaper area included) for every skin
#     www/assets/character/dmask_walk_0..7.png          masks like mask_walk_* (R = the diaper, G = feet)
#     www/assets/items/diamond_diaper_0..7.png,         the diaper alone (its colours + its outline) per walk frame,
#     www/assets/items/golden_diaper_0..7.png           drawn over the body so one body set serves both diapers
#     www/assets/items/<kind>_diaper_idle.png           the diaper of the best-fitting frame moved onto the standing
#                                                       frame (idle, blinks, punch, tool swing)
# Prints DIAPER_DY: how far each frame's head is moved down from the idle head (the game moves hats / face by it).
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = sys.argv[1]
SRC = ROOT + '/art-source/character/diaper_owner/'
CH = ROOT + '/www/assets/character/'
IT = ROOT + '/www/assets/items/'
SKINS = ['porcelain', 'peach', 'tan', 'honey', 'brown', 'deep']
N = 8
H, W = 215, 118
ys, xs = np.mgrid[0:H, 0:W]

dia = [np.array(Image.open(SRC + 'diamond_%02d.png' % i).convert('RGBA')).astype(int) for i in range(N)]
gold = [np.array(Image.open(SRC + 'gold_%02d.png' % i).convert('RGBA')).astype(int) for i in range(N)]
idle = np.array(Image.open(CH + 'porcelain/idle_open.png').convert('RGBA')).astype(int)

# head bob of every frame against the idle head (rows above the shirt)
dys = []
for a in dia:
    best = min(range(-5, 6), key=lambda d: (np.abs(a - np.roll(idle, d, 0)).sum(2) > 40)[10:100].sum())
    dys.append(best)
print('DIAPER_DY =', dys)


def diaper_mask(a, b):
    # the fill: where the two diapers differ; holes closed; plus the dark outline round it (2 px)
    op = (a[..., 3] > 0) | (b[..., 3] > 0)
    fill = (np.abs(a - b).sum(2) > 24) & op & (ys > 130) & (ys < 200)
    fill = ndimage.binary_closing(fill, iterations=2) & op
    fill = ndimage.binary_fill_holes(fill)
    lum = a[..., :3].mean(2)
    ring = ndimage.binary_dilation(fill, iterations=2) & ~fill & op & (lum < 80)
    return fill, fill | ring


def layer(a, m):
    o = np.zeros((H, W, 4), np.uint8)
    o[m] = a[m]
    return o


masks = []
for i in range(N):
    fill, m = diaper_mask(dia[i], gold[i])
    masks.append((fill, m))
    Image.fromarray(layer(dia[i], m)).save(IT + 'diamond_diaper_%d.png' % i)
    Image.fromarray(layer(gold[i], m)).save(IT + 'golden_diaper_%d.png' % i)
    # mask: R = diaper (so shirts never paint it), G = feet (each foot: the 19 rows above its lowest pixel)
    op = dia[i][..., 3] > 0
    mk = np.zeros((H, W, 4), np.uint8)
    mk[..., 0] = m * 255
    feet = np.zeros((H, W), bool)
    lab, n = ndimage.label(op & (ys >= 180))
    for k in range(1, n + 1):
        part = lab == k
        if part.sum() < 30:
            continue
        cols = np.where(part.any(0))[0]
        bot = np.where(part.any(1))[0].max()
        feet |= op & (ys > bot - 20) & (xs >= cols.min()) & (xs <= cols.max())
    mk[..., 1] = (feet & ~m) * 255
    mk[..., 3] = ((mk[..., 0] > 0) | (mk[..., 1] > 0)) * 255
    Image.fromarray(mk).save(CH + 'dmask_walk_%d.png' % i)

# standing frame: the frame (moved by its bob) whose diaper hides the most of the idle frame's white briefs
il = idle[..., :3].mean(2)
isat = idle[..., :3].max(2) - idle[..., :3].min(2)
briefs = (idle[..., 3] > 0) & (ys >= 148) & (ys <= 180) & (xs > 30) & (xs < 86) & (il > 150) & (isat < 30)
best = None
for i in range(N):
    m = np.roll(masks[i][1], -dys[i], 0)
    left = (briefs & ~m).sum()
    if best is None or left < best[0]:
        best = (left, i)
left, bi = best
print('idle diaper from frame', bi, '- briefs pixels left uncovered:', left)
m = np.roll(masks[bi][1], -dys[bi], 0)
# briefs pixels still showing next to the diaper are covered by the nearest diaper pixel's colour
for name, src in (('diamond', dia), ('golden', gold)):
    a = np.roll(src[bi], -dys[bi], 0)
    o = layer(a, m)
    gap = briefs & ~m
    if gap.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~np.roll(masks[bi][0], -dys[bi], 0), return_indices=True)
        o[gap] = a[iy[gap], ix[gap]]
        o[gap, 3] = 255
    Image.fromarray(o).save(IT + name + '_diaper_idle.png')


# ---------- the walking body per skin (skin pixels scaled like base_cut.py) ----------
def skin_mask(p):
    r, g, b = p[..., 0], p[..., 1], p[..., 2]
    l = 0.3 * r + 0.59 * g + 0.11 * b
    return (p[..., 3] > 0) & (r > g) & (g > b) & (r - b > 45) & (l > 45)


def common(p, msk):
    cols = p[msk][:, :3].astype(int) // 4
    keys, cnt = np.unique(cols[:, 0] * 65536 + cols[:, 1] * 256 + cols[:, 2], return_counts=True)
    k = keys[cnt.argmax()]
    return np.array([k // 65536, (k // 256) % 256, k % 256]) * 4 + 2


face = (slice(10, 70), slice(15, 105))
src_c = common(idle[face], skin_mask(idle[face]))
for s in SKINS:
    ref = np.array(Image.open(CH + s + '/idle_open.png').convert('RGBA')).astype(int)
    f = common(ref[face], skin_mask(ref[face])) / src_c
    for i in range(N):
        o = dia[i].copy()
        sm = skin_mask(o)
        o[..., :3][sm] = np.clip(o[..., :3][sm] * f, 0, 255)
        Image.fromarray(o.astype(np.uint8)).save(CH + s + '/diaper_walk_%d.png' % i)
print('ok')
