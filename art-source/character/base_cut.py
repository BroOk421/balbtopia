# The owner's new default character (base_owner.png: our bald character in a white tank top, white briefs and black
# flip-flops, 1194 x 1317) -> the standing body frames of every skin, replacing the old jeans + sneakers ones:
#   assets/character/<skin>/idle_open|half|closed.png, punch_body.png, walk_stride_00..11.png   (118 x 215)
#   assets/character/mask_idle.png, mask_punch.png, mask_walk_00..11.png  (R = legs / briefs, G = feet: where pants
#   and shoes are painted by outfitBody; the same for every skin)
# Fitting: the head (x 290-905, rows 81-650) onto our head (x 2-116, rows 2-108), the body below scaled to reach
# the feet at row 213. Walking: the legs swing from the hips (row LEG_TOP) by a shear, the foot that moves forward
# lifts a little, the body bobs like the old walk (WALK_BOB.stride / 2), the arms swing a little the other way.
# Blinks: the eye pixels that differ between our old open / half / closed frames are copied in. Skins: skin pixels
# scaled so their most common colour equals the old frame's (like sit / swim).
import sys, os, math
import numpy as np
from PIL import Image

ROOT = sys.argv[1]
CH = ROOT + '/www/assets/character/'
OLD = ROOT + '/art-source/character/old_frames/'  # the old frames, kept for the blink eyes and skin colours
SKINS = ['porcelain', 'peach', 'tan', 'honey', 'brown', 'deep']
os.makedirs(OLD, exist_ok=True)
for s in SKINS:
    os.makedirs(OLD + s, exist_ok=True)
    for f in ['idle_open', 'idle_half', 'idle_closed', 'punch_body'] + ['walk_stride_%02d' % i for i in range(12)]:
        if not os.path.exists(OLD + s + '/' + f + '.png'):
            Image.open(CH + s + '/' + f + '.png').save(OLD + s + '/' + f + '.png')

# ---------- fit the owner's picture onto our 118 x 215 frame ----------
A = np.array(Image.open(ROOT + '/art-source/character/base_owner.png').convert('RGBA')).astype(float)
pm = A.copy()
pm[..., :3] *= pm[..., 3:4] / 255
X0, X1, HT, CHN, FT = 290, 906, 81, 650, 1265


def res(y0, y1, h):
    im = Image.fromarray(np.clip(pm[y0:y1, X0:X1], 0, 255).astype(np.uint8), 'RGBA')
    return np.array(im.resize((114, h), Image.BOX)).astype(float)


acc = np.zeros((215, 118, 4))
acc[2:108, 2:116] = res(HT, CHN, 106)
acc[108:214, 2:116] = res(CHN, FT, 106)
al = acc[..., 3]
base = np.zeros((215, 118, 4), np.uint8)
keep = al >= 110
base[..., :3] = np.clip(acc[..., :3] / np.maximum(al, 1)[..., None] * 255, 0, 255)
base[..., 3] = keep * 255
base[~keep, :3] = 0

# ---------- regions ----------
H, W = 215, 118
ys, xs = np.mgrid[0:H, 0:W]
op = base[..., 3] > 0
LEG_TOP, FOOT_TOP, BRIEF_TOP, HAND_BOTTOM = 170, 194, 152, 166
# the hands' bottom outlines reach a few rows below HAND_BOTTOM at the sides
back_arm = op & (ys >= 110) & (((ys < HAND_BOTTOM) & (xs < 31)) | ((ys < HAND_BOTTOM + 1) & (xs < 29)))
front_arm = op & (ys >= 109) & (((ys < HAND_BOTTOM) & (xs >= 82)) | ((ys < HAND_BOTTOM + 4) & (xs >= 86)))
legs = op & ~back_arm & ~front_arm & (((ys >= BRIEF_TOP) & (ys < HAND_BOTTOM) & (xs >= 34) & (xs <= 79)) | ((ys >= HAND_BOTTOM) & (ys < FOOT_TOP)))
feet = op & (ys >= FOOT_TOP)
SPLIT = 53  # back leg left of it, front leg right of it (below LEG_TOP)
mask_base = np.zeros((H, W, 4), np.uint8)
mask_base[..., 0] = legs * 255
mask_base[..., 1] = feet * 255
mask_base[..., 3] = (legs | feet) * 255


def warp(img, dxL, dxR, liftL, liftR, bob, armB, armF):
    """img: H x W x 4 (picture or mask). Returns the walking frame."""
    out = np.zeros_like(img)
    # body above the legs, moved down by bob (positive = lower); arms cut out and drawn sheared
    body = img.copy()
    body[back_arm | front_arm] = 0
    body[ys >= LEG_TOP] = 0

    def put(dst, src_layer, mask_fn):
        for y in range(H):
            for x in range(W):
                v = mask_fn(x, y)
                if v is None:
                    continue
                sx, sy = v
                if 0 <= sx < W and 0 <= sy < H and src_layer[sy, sx, 3] > 0:
                    dst[y, x] = src_layer[sy, sx]

    def arm_layer(m, amp):
        layer = np.zeros_like(img)
        layer[m] = img[m]
        res_ = np.zeros_like(img)
        for y in range(H):
            sy = y - bob
            if not (0 <= sy < H):
                continue
            k = max(0, (sy - 112) / (HAND_BOTTOM - 112))
            d = int(round(amp * k))
            for x in range(W):
                sx = x - d
                if 0 <= sx < W and layer[sy, sx, 3] > 0:
                    res_[y, x] = layer[sy, sx]
        return res_

    def leg_layer(side, dx, lift):
        layer = np.zeros_like(img)
        m = (ys >= LEG_TOP) & ((xs < SPLIT) if side == 0 else (xs >= SPLIT))
        layer[m] = img[m]
        res_ = np.zeros_like(img)
        top = LEG_TOP + bob
        bot = 213 - lift
        for y in range(H):
            if y < top or y > bot:
                continue
            s = (y - top) / max(1, bot - top)
            sy = int(round(LEG_TOP + s * (213 - LEG_TOP)))
            d = dx * s
            for x in range(W):
                sx = int(round(x - d))
                if 0 <= sx < W and 0 <= sy < H and layer[sy, sx, 3] > 0:
                    res_[y, x] = layer[sy, sx]
        return res_

    def shift(layer, dy):
        r = np.zeros_like(layer)
        if dy >= 0:
            r[dy:] = layer[: H - dy]
        else:
            r[:dy] = layer[-dy:]
        return r

    layers = [arm_layer(back_arm, armB), leg_layer(0, dxL, liftL), shift(body, bob), leg_layer(1, dxR, liftR), arm_layer(front_arm, armF)]
    for l in layers:
        m = l[..., 3] > 0
        out[m] = l[m]
    # thin gaps the cuts open (between an arm and the body, between the legs near the hips): runs of up to 3
    # see-through pixels with the body on both sides take the colour on their left
    for y in range(100, 200):
        row = out[y]
        x = 0
        while x < W:
            if row[x, 3] == 0 and x > 0 and row[x - 1, 3] > 0:
                e = x
                while e < W and row[e, 3] == 0:
                    e += 1
                if e < W and e - x <= 3:
                    a_, b_ = row[x - 1], row[e]
                    # never smear a dark outline across: take the lighter side, or leave a real gap
                    if a_[:3].sum() < 180 and b_[:3].sum() < 180:
                        pass
                    else:
                        row[x:e] = a_ if a_[:3].sum() >= b_[:3].sum() else b_
                x = e
            else:
                x += 1
    return out


# the old walk's bob (render.js WALK_BOB.stride): the frames' body moves down by these / 2 (rounded)
BOB = [3, 4, 1, -3, -4, -1, 3, 4, 1, -3, -4, -1]
STRIDE, LIFT, ARM = 8, 3, 3
walk_px, walk_mask = [], []
for i in range(12):
    t = 2 * math.pi * (i - 1) / 12  # legs furthest apart at frames 1 and 7, like the old bob
    dxB = STRIDE * math.cos(t)  # back leg forward (+x) at frame 1
    vB = -math.sin(t)  # its speed: lifting while it swings forward
    bob = int(round(BOB[i] / 2))
    args = (dxB, -dxB, int(round(LIFT * max(0, vB))), int(round(LIFT * max(0, -vB))), bob, -ARM * math.cos(t), ARM * math.cos(t))
    walk_px.append(warp(base, *args))
    walk_mask.append(warp(mask_base, *args))

# punching: the front arm is drawn by the game, so it is cut off the body
punch = base.copy()
punch[front_arm] = 0
mask_punch = mask_base.copy()

Image.fromarray(mask_base).save(CH + 'mask_idle.png')
Image.fromarray(mask_punch).save(CH + 'mask_punch.png')
for i, m in enumerate(walk_mask):
    Image.fromarray(m).save(CH + 'mask_walk_%02d.png' % i)


# ---------- per skin ----------
def skin_mask(p):
    r, g, b = p[..., 0].astype(int), p[..., 1].astype(int), p[..., 2].astype(int)
    l = 0.3 * r + 0.59 * g + 0.11 * b
    return (p[..., 3] > 0) & (r > g) & (g > b) & (r - b > 45) & (l > 45)


def common(p, m):
    cols = p[m][:, :3].astype(int) // 4
    keys, cnt = np.unique(cols[:, 0] * 65536 + cols[:, 1] * 256 + cols[:, 2], return_counts=True)
    k = keys[cnt.argmax()]
    return np.array([k // 65536, (k // 256) % 256, k % 256]) * 4 + 2


face_box = (slice(10, 70), slice(15, 105))
src = common(base[face_box], skin_mask(base[face_box]))


def recolor(img, f):
    o = img.copy()
    m = skin_mask(o)
    o[..., :3][m] = np.clip(o[..., :3][m] * f, 0, 255)
    return o


for s in SKINS:
    old_open = np.array(Image.open(OLD + s + '/idle_open.png').convert('RGBA'))
    f = common(old_open[face_box], skin_mask(old_open[face_box])) / src
    o = recolor(base, f)
    Image.fromarray(o).save(CH + s + '/idle_open.png')
    # blinks: eyelids over the open eyes. half: the top half of each eye is skin with a dark lid line across its
    # middle; closed: the whole eye is skin with a dark line low across it (the old frames' look)
    sk = common(o[face_box], skin_mask(o[face_box]))
    eye = (ys >= 52) & (ys < 86) & (xs >= 36) & (xs < 108) & (o[..., 3] > 0) & ~skin_mask(o)
    for fr in ('half', 'closed'):
        b = o.copy()
        for x0, x1 in ((36, 76), (76, 108)):
            m = eye & (xs >= x0) & (xs < x1)
            yy, xx = np.where(m)
            if not len(yy):
                continue
            t, bt, l, r = yy.min(), yy.max(), xx.min(), xx.max()
            cut = (t + bt) // 2 if fr == 'half' else bt + 1
            box = (ys >= t) & (ys <= bt) & (xs >= l) & (xs <= r)
            area = box & (ys < cut)
            b[area, :3] = sk
            b[area, 3] = 255
            line = cut if fr == 'half' else int(t + (bt - t) * 0.7)
            for yl in (line - 1, line, line + 1):
                b[yl, l:r + 1, :3] = (18, 12, 12)
                b[yl, l:r + 1, 3] = 255
        Image.fromarray(b).save(CH + s + '/idle_' + fr + '.png')
    Image.fromarray(recolor(punch, f)).save(CH + s + '/punch_body.png')
    for i, w in enumerate(walk_px):
        Image.fromarray(recolor(w, f)).save(CH + s + '/walk_stride_%02d.png' % i)
    print(s, 'ok')
