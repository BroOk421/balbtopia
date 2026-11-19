# Owner's new default character (Nov 19 2026): the blocky 32 x 35 sprite in default_look.aseprite (bald head,
# white sando, navy shorts) -> the standing body frames of every skin, replacing the base_owner.png ones:
#   assets/character/<skin>/idle_open|half|closed.png, punch_body.png, walk_stride_00..11.png   (118 x 215)
#   assets/character/mask_idle.png, mask_punch.png, mask_walk_00..11.png  (R = legs / shorts, G = feet)
# Run:  python3 art-source/character/blocky_cut.py <project root>
#
# Fitting: the sprite faces LEFT, our frames face RIGHT, so it is mirrored. Scaled x6 (whole pixels, nearest), its
# feet on row 213; at x6 it is 120 px wide, so one column of outline-pixel is lost on each side of the 118 frame.
# Walking: the legs come from walkleft.aseprite (its two leg poses, rows 32-34). Build b: the frames have NO sleeves;
# the sleeves are saved alone (<skin>/sleeve_back.png, sleeve_front.png) and js/render/blockybody.js turns them per
# pose. Jump faces from jump.aseprite -> <skin>/blocky_jump_up.png, blocky_jump_down.png.
# Blinks: eyelids drawn over the eyes layer. Skins: skin pixels scaled so their most common colour equals the old
# frame's face colour (like base_cut.py). The frames this replaces are kept in old_frames_base_owner/.
import sys, os, math, struct, zlib
import numpy as np
from PIL import Image

ROOT = sys.argv[1]
HERE = ROOT + '/art-source/character/'
CH = ROOT + '/www/assets/character/'
OLD = HERE + 'old_frames_base_owner/'
SKINS = sorted(d for d in os.listdir(CH) if os.path.exists(CH + d + '/idle_open.png'))
FILES = ['idle_open', 'idle_half', 'idle_closed', 'punch_body'] + ['walk_stride_%02d' % i for i in range(12)]
MASKS = ['mask_idle', 'mask_punch'] + ['mask_walk_%02d' % i for i in range(12)]
os.makedirs(OLD, exist_ok=True)
for s in SKINS:
    os.makedirs(OLD + s, exist_ok=True)
    for f in FILES:
        if not os.path.exists(OLD + s + '/' + f + '.png'):
            Image.open(CH + s + '/' + f + '.png').save(OLD + s + '/' + f + '.png')
for f in MASKS:
    if not os.path.exists(OLD + f + '.png'):
        Image.open(CH + f + '.png').save(OLD + f + '.png')


# ---------- .aseprite reader (RGBA files, compressed / linked cels) ----------
def read_ase(path):
    d = open(path, 'rb').read()
    _, magic, nframes, W, H, depth = struct.unpack_from('<IHHHHH', d, 0)
    assert magic == 0xA5E0 and depth == 32, 'expects an RGBA .aseprite'
    pos, layers, frames = 128, [], []
    for _ in range(nframes):
        fsize, _, old, _ = struct.unpack_from('<IHHH', d, pos)
        n = struct.unpack_from('<I', d, pos + 12)[0] or old
        p, cels = pos + 16, {}
        for _ in range(n):
            csize, ctype = struct.unpack_from('<IH', d, p)
            b = d[p + 6:p + csize]
            if ctype == 0x2004:
                nl = struct.unpack_from('<H', b, 16)[0]
                layers.append(b[18:18 + nl].decode())
            elif ctype == 0x2005:
                li, x, y, _, ct = struct.unpack_from('<HhhBH', b, 0)
                if ct in (0, 2):
                    w, h = struct.unpack_from('<HH', b, 16)
                    raw = b[20:] if ct == 0 else zlib.decompress(b[20:])
                    layer = np.zeros((H, W, 4), np.uint8)
                    layer[y:y + h, x:x + w] = np.frombuffer(raw, np.uint8)[:w * h * 4].reshape(h, w, 4)
                    cels[layers[li]] = layer
                elif ct == 1:
                    cels[layers[li]] = frames[struct.unpack_from('<H', b, 16)[0]][layers[li]]
            p += csize
        frames.append(cels)
        pos += fsize
    return layers, frames


layers, (look,) = read_ase(HERE + 'default_look.aseprite')
_, walk = read_ase(HERE + 'walkleft.aseprite')
H0, W0 = look['shape'].shape[:2]


def over(dst, src):
    m = src[..., 3] > 0
    dst[m] = src[m]
    return dst


BODY_LAYERS = [l for l in layers if l not in ('sleeve left', 'sleeve right')]


def body(leg_frame=None):
    b = np.zeros((H0, W0, 4), np.uint8)
    for l in BODY_LAYERS:
        over(b, look[l])
    if leg_frame is not None:  # the walk file's leg pose (only rows 32-34 differ)
        b[32:] = walk[leg_frame]['shape'][32:]
    return b


# ---------- scale, rotate sleeves, mirror ----------
S = 6
FW, FH = 118, 215
X_OFF = (FW - W0 * S) // 2  # -1: the sprite's 120 px sit centred, 1 px cut each side
Y_OFF = 214 - H0 * S  # feet (sprite row 34) end on row 213


def up(a):
    return np.array(Image.fromarray(a).resize((W0 * S, H0 * S), Image.NEAREST))


def sleeve(name, ang):
    """The sleeve layer scaled up and turned by ang radians round the shoulder (top middle of the sleeve);
    positive = the hand forward (to the left, the way the sprite faces)."""
    a = look[name]
    ys, xs = np.where(a[..., 3] > 0)
    px, py = (xs.min() + xs.max() + 1) / 2 * S, (ys.min() + 0.5) * S
    im = Image.fromarray(up(a))
    if abs(ang) > 1e-6:
        im = im.rotate(-math.degrees(ang), resample=Image.NEAREST, center=(px, py))
    return np.array(im)


def compose(b, aBack=0, aFront=0, sleeves=False):
    # sleeves=False (what the game uses): the body alone; blockybody.js draws both sleeves, turned per pose
    big = np.zeros((H0 * S, W0 * S, 4), np.uint8)
    if sleeves:
        over(big, sleeve('sleeve left', aBack))  # behind the body
    over(big, up(b))
    if sleeves:
        over(big, sleeve('sleeve right', aFront))  # in front
    big = big[:, ::-1]  # face right like the other frames
    out = np.zeros((FH, FW, 4), np.uint8)
    x0 = max(0, X_OFF)
    sx0 = x0 - X_OFF
    w = min(FW - x0, big.shape[1] - sx0)
    out[Y_OFF:Y_OFF + big.shape[0], x0:x0 + w] = big[:, sx0:sx0 + w]
    out[out[..., 3] == 0] = 0
    out[..., 3] = np.where(out[..., 3] > 0, 255, 0)
    return out


# Every body frame is WITHOUT its two sleeves (Nov 19 2026 b, owner: cutting the punching arm out of the body left
# bits behind): the game draws the sleeves itself (<skin>/sleeve_back.png, sleeve_front.png), so they can swing
# when walking, go up when jumping and turn for a punch.
idle = compose(body())
punch = idle.copy()
walks = [compose(body(0 if i < 6 else 1)) for i in range(12)]  # legs: walk frame 0, then frame 1 (one step each)
# jumping faces (jump.aseprite): wide eyes looking up (going up, frame 0) or down (falling, frame 1), a small o mouth
_, jumpf = read_ase(HERE + 'jump.aseprite')


def jump_body(fr):
    b = np.zeros((H0, W0, 4), np.uint8)
    for l in BODY_LAYERS:
        # face from the jump file, and its shape too (going up the feet are tucked in a row; falling: normal legs)
        src_l = jumpf[fr][l] if l in ('eyes', 'mouth', 'eyebrows', 'shape') and l in jumpf[fr] else look[l]
        over(b, src_l)
    return b


jumps = [compose(jump_body(0)), compose(jump_body(1))]


# ---------- masks for pants / shoes (R legs + shorts, G feet) ----------
def leg_mask(leg_frame=None):
    m = np.zeros((H0, W0, 4), np.uint8)
    short = look['short'][..., 3] > 0
    legs = body(leg_frame)
    feet = np.zeros((H0, W0), bool)
    feet[33:] = legs[33:, :, 3] > 0
    shin = np.zeros((H0, W0), bool)
    shin[32] = legs[32, :, 3] > 0
    m[..., 0] = (short | shin) * 255
    m[..., 1] = feet * 255
    m[..., 3] = (short | shin | feet) * 255
    big = up(m)[:, ::-1]
    out = np.zeros((FH, FW, 4), np.uint8)
    x0, sx0 = max(0, X_OFF), max(0, X_OFF) - X_OFF
    w = min(FW - x0, big.shape[1] - sx0)
    out[Y_OFF:Y_OFF + big.shape[0], x0:x0 + w] = big[:, sx0:sx0 + w]
    return out


Image.fromarray(leg_mask()).save(CH + 'mask_idle.png')
Image.fromarray(leg_mask()).save(CH + 'mask_punch.png')
for i in range(12):
    Image.fromarray(leg_mask(0 if i < 6 else 1)).save(CH + 'mask_walk_%02d.png' % i)

# ---------- blinks (eye area of the eyes layer, in frame pixels) ----------
eyes_src = look['eyes'][..., 3] > 0
eye_big = np.zeros((FH, FW), bool)
e = np.array(Image.fromarray((eyes_src * 255).astype(np.uint8)).resize((W0 * S, H0 * S), Image.NEAREST))[:, ::-1] > 0
x0, sx0 = max(0, X_OFF), max(0, X_OFF) - X_OFF
w = min(FW - x0, e.shape[1] - sx0)
eye_big[Y_OFF:Y_OFF + e.shape[0], x0:x0 + w] = e[:, sx0:sx0 + w]
brow = look['eyebrows'][look['eyebrows'][..., 3] > 0][0][:3]  # eyelid line colour


def skin_mask(p):
    r, g, b = p[..., 0].astype(int), p[..., 1].astype(int), p[..., 2].astype(int)
    l = 0.3 * r + 0.59 * g + 0.11 * b
    return (p[..., 3] > 0) & (r > g) & (g > b) & (r - b > 45) & (l > 45)


def common(p, m):
    cols = p[m][:, :3].astype(int) // 4
    keys, cnt = np.unique(cols[:, 0] * 65536 + cols[:, 1] * 256 + cols[:, 2], return_counts=True)
    k = keys[cnt.argmax()]
    return np.array([k // 65536, (k // 256) % 256, k % 256]) * 4 + 2


def recolor(img, f):
    o = img.copy()
    m = skin_mask(o)
    o[..., :3][m] = np.clip(o[..., :3][m] * f, 0, 255)
    return o


new_face = (slice(Y_OFF + 9 * S, Y_OFF + 21 * S), slice(20, 100))
old_face = (slice(10, 70), slice(15, 105))
src = common(idle[new_face], skin_mask(idle[new_face]))
ys_, xs_ = np.mgrid[0:FH, 0:FW]


def blink(o, fr):
    sk = common(o[new_face], skin_mask(idle)[new_face])  # skin pixels found on the uncoloured frame
    b = o.copy()
    lab = eye_big.copy()
    # each eye separately: split at the gap between them
    cols = np.where(lab.any(axis=0))[0]
    groups, start = [], cols[0]
    for a_, b_ in zip(cols, cols[1:]):
        if b_ != a_ + 1:
            groups.append((start, a_))
            start = b_
    groups.append((start, cols[-1]))
    for l, r in groups:
        m = lab & (xs_ >= l) & (xs_ <= r)
        yy = np.where(m.any(axis=1))[0]
        t, bt = yy.min(), yy.max()
        cut = (t + bt + 1) // 2 if fr == 'half' else bt + 1
        area = m & (ys_ < cut)
        b[area, :3] = sk
        line = cut if fr == 'half' else (t + bt) // 2 + S // 2
        line = min(line, bt)
        for yl in range(line, min(line + S // 2, bt + 1)):
            row = m[yl] | m[max(t, yl - 1)]
            b[yl, row, :3] = brow
    return b


# skin pixels of the old frames: found on the porcelain one (other skins, e.g. green, fail the colour test)
old_por = np.array(Image.open(OLD + 'porcelain/idle_open.png').convert('RGBA'))
old_skin = skin_mask(old_por[old_face])
for s in SKINS:
    old_open = np.array(Image.open(OLD + s + '/idle_open.png').convert('RGBA'))
    f = common(old_open[old_face], old_skin) / src
    o = recolor(idle, f)
    Image.fromarray(o).save(CH + s + '/idle_open.png')
    Image.fromarray(blink(o, 'half')).save(CH + s + '/idle_half.png')
    Image.fromarray(blink(o, 'closed')).save(CH + s + '/idle_closed.png')
    Image.fromarray(recolor(punch, f)).save(CH + s + '/punch_body.png')
    for i, wf in enumerate(walks):
        Image.fromarray(recolor(wf, f)).save(CH + s + '/walk_stride_%02d.png' % i)
    print(s, 'ok')


# ---------- angry face overlay and the punching arm (used by js/render/blockybody.js) ----------
# angry (sprite pixels, the sprite facing left): calm brows gone, brows slanting down to the middle, a lid line over
# the top row of each eye, the smile turned into a frown. Saved as only the pixels that change.
def angry_body():
    b = body()
    B = look['shape'][9, 10].copy()  # face colour
    D = look['eyebrows'][10, 7].copy()  # brow colour
    G = b[19, 10].copy()  # mouth colour
    b[10, 7:11] = B
    b[10, 14:19] = B
    for x, y in ((7, 10), (8, 10), (9, 11), (10, 11), (11, 11), (13, 11), (14, 11), (15, 11), (16, 10), (17, 10), (18, 10)):
        b[y, x] = D
    b[12, 6:12] = D
    b[12, 13:19] = D
    b[18, 16] = B
    b[19, 11:15] = B
    b[18, 11:15] = G
    b[19, 10] = G
    b[19, 15] = G
    return b


ang_full = compose(angry_body(), 0, 0)
changed = (ang_full != idle).any(axis=2)


def sleeve_pic(name):
    a = look[name]
    ys2, xs2 = np.where(a[..., 3] > 0)
    return a[ys2.min():ys2.max() + 1, xs2.min():xs2.max() + 1][:, ::-1]  # mirrored: facing right


for name in ('sleeve left', 'sleeve right'):  # their shoulders in the frame, for blockybody.js BLOCKY
    a = look[name]
    ys2, xs2 = np.where(a[..., 3] > 0)
    print(name, 'shoulder x', X_OFF + W0 * S - (xs2.min() + xs2.max() + 1) / 2 * S, 'y', Y_OFF + (ys2.min() + 0.5) * S)
for s in SKINS:
    old_open = np.array(Image.open(OLD + s + '/idle_open.png').convert('RGBA'))
    f = common(old_open[old_face], old_skin) / src
    a = recolor(ang_full, f)
    a[~changed] = 0
    Image.fromarray(a).save(CH + s + '/angry_face.png')
    Image.fromarray(recolor(sleeve_pic('sleeve left'), f)).save(CH + s + '/sleeve_back.png')
    Image.fromarray(recolor(sleeve_pic('sleeve right'), f)).save(CH + s + '/sleeve_front.png')
    Image.fromarray(recolor(jumps[0], f)).save(CH + s + '/blocky_jump_up.png')
    Image.fromarray(recolor(jumps[1], f)).save(CH + s + '/blocky_jump_down.png')
    if os.path.exists(CH + s + '/arm_front.png'):
        os.remove(CH + s + '/arm_front.png')
print('angry face, sleeves, jump faces ok')
