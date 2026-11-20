# Owner's swim and sit looks (Nov 20 2026, appearance.zip):
#   swim_look.aseprite -> <skin>/swim_face.png  (118 x 215): only the pixels of the face that differ from the
#       standing frame (puffed cheeks, held breath); render.js draws it over the body while swimming (c._swim).
#   sit_look.aseprite  -> <skin>/sit_look.png   (198 x 215 = the 118 frame + SIT_PAD 40 each side): the whole
#       sitting body (short legs hanging, brown shorts, dark shoes, both sleeves); sit_noarm.png the same without
#       the front sleeve (rest.js sitBody: the game draws that sleeve, turned like when standing).
# Same fitting as blocky_cut.py (mirrored to face right, x6, feet on row 213) and the same skin tones.
# Only VISIBLE layers are used (the .aseprite layer flag), so the hidden swim sleeves / sit cheeks are left out.
# Run:  python3 art-source/character/look_cut.py <project root>
import sys, os, struct, zlib
import numpy as np
from PIL import Image

ROOT = sys.argv[1]
HERE = ROOT + '/art-source/character/'
CH = ROOT + '/www/assets/character/'
OLD = HERE + 'old_frames_base_owner/'
SKINS = sorted(d for d in os.listdir(CH) if os.path.exists(CH + d + '/idle_open.png'))


def read_ase(path, only=None, skip=()):
    """first frame of an RGBA .aseprite flattened: visible layers (or only the visible ones named in `only`)"""
    d = open(path, 'rb').read()
    _, magic, nframes, W, H, depth = struct.unpack_from('<IHHHHH', d, 0)
    assert magic == 0xA5E0 and depth == 32, 'expects an RGBA .aseprite'
    pos = 128
    fsize, _, old, _ = struct.unpack_from('<IHHH', d, pos)
    n = struct.unpack_from('<I', d, pos + 12)[0] or old
    p, layers, cels = pos + 16, [], {}
    for _ in range(n):
        csize, ctype = struct.unpack_from('<IH', d, p)
        b = d[p + 6:p + csize]
        if ctype == 0x2004:
            flags = struct.unpack_from('<H', b, 0)[0]
            nl = struct.unpack_from('<H', b, 16)[0]
            layers.append((b[18:18 + nl].decode(), bool(flags & 1)))
        elif ctype == 0x2005:
            li, x, y, _, ct = struct.unpack_from('<HhhBH', b, 0)
            if ct in (0, 2):
                w, h = struct.unpack_from('<HH', b, 16)
                raw = b[20:] if ct == 0 else zlib.decompress(b[20:])
                layer = np.zeros((H, W, 4), np.uint8)
                layer[y:y + h, x:x + w] = np.frombuffer(raw, np.uint8)[:w * h * 4].reshape(h, w, 4)
                cels[layers[li][0]] = layer
        p += csize
    out = np.zeros((H, W, 4), np.uint8)
    for name, vis in layers:
        if vis and name in cels and (only is None or name in only) and name not in skip:
            m = cels[name][..., 3] > 0
            out[m] = cels[name][m]
    return out


S, FW, FH = 6, 118, 215


def fit(spr, pad=0):
    H0, W0 = spr.shape[:2]
    big = np.array(Image.fromarray(spr).resize((W0 * S, H0 * S), Image.NEAREST))[:, ::-1]
    X_OFF, Y_OFF = (FW - W0 * S) // 2 + pad, 214 - H0 * S
    out = np.zeros((FH, FW + 2 * pad, 4), np.uint8)
    x0 = max(0, X_OFF)
    sx0 = x0 - X_OFF
    w = min(out.shape[1] - x0, big.shape[1] - sx0)
    out[Y_OFF:Y_OFF + big.shape[0], x0:x0 + w] = big[:, sx0:sx0 + w]
    out[out[..., 3] == 0] = 0
    out[..., 3] = np.where(out[..., 3] > 0, 255, 0)
    return out


# skin tone factors, exactly as blocky_cut.py works them out
def skin_mask(p):
    r, g, b = p[..., 0].astype(int), p[..., 1].astype(int), p[..., 2].astype(int)
    l = 0.3 * r + 0.59 * g + 0.11 * b
    return (p[..., 3] > 0) & (r > g) & (g > b) & (r - b > 45) & (l > 45)


def common(p, m):
    cols = p[m][:, :3].astype(int) // 4
    keys, cnt = np.unique(cols[:, 0] * 65536 + cols[:, 1] * 256 + cols[:, 2], return_counts=True)
    k = keys[cnt.argmax()]
    return np.array([k // 65536, (k // 256) % 256, k % 256]) * 4 + 2


def recolor(img, f, keep=None):
    o = img.copy()
    m = skin_mask(o)
    if keep is not None:
        m &= ~keep  # clothes in skin-like browns (the sit shorts) keep their colour
    o[..., :3][m] = np.clip(o[..., :3][m] * f, 0, 255)
    return o


look = read_ase(HERE + 'default_look.aseprite')  # (its sleeves are hidden layers: the body alone)
swim = read_ase(HERE + 'swim_look.aseprite')
sit = read_ase(HERE + 'sit_look.aseprite')
idle = fit(look)
Y_OFF = 214 - look.shape[0] * S
new_face = (slice(Y_OFF + 9 * S, Y_OFF + 21 * S), slice(20, 100))
old_face = (slice(10, 70), slice(15, 105))
src = common(idle[new_face], skin_mask(idle[new_face]))
old_por = np.array(Image.open(OLD + 'porcelain/idle_open.png').convert('RGBA'))
old_skin = skin_mask(old_por[old_face])

# swim face: the face rows only (sprite rows 7..22), pixels that differ from the standing body
swim_full = fit(swim)
changed = (swim_full != idle).any(axis=2)
changed[:Y_OFF + 7 * S] = False
changed[Y_OFF + 23 * S:] = False
sit_full = fit(sit, pad=40)
# the same without the front sleeve: when sitting the game draws that sleeve itself (blockybody.js), turned with what
# the hand holds (the fishing rod slanting up, a punch...)
sit_noarm = fit(read_ase(HERE + 'sit_look.aseprite', skip=('sleeve right',)), pad=40)
sit_short = fit(read_ase(HERE + 'sit_look.aseprite', only=('short',)), pad=40)
# the shorts' pixels that are still shown (not covered by a sleeve drawn over them)
sit_cloth = (sit_short[..., 3] > 0) & (sit_short == sit_full).all(axis=2)
for s in SKINS:
    old_open = np.array(Image.open(OLD + s + '/idle_open.png').convert('RGBA'))
    f = common(old_open[old_face], old_skin) / src
    a = recolor(swim_full, f)
    a[~changed] = 0
    Image.fromarray(a).save(CH + s + '/swim_face.png')
    Image.fromarray(recolor(sit_full, f, sit_cloth)).save(CH + s + '/sit_look.png')
    Image.fromarray(recolor(sit_noarm, f, sit_cloth)).save(CH + s + '/sit_noarm.png')
    print(s, 'ok')

# ---- expressions (owner's expressions.zip, Nov 20 2026): dead / nice / sleep / troll faces ----
# <skin>/expr_<name>.png (118 x 215): only the face pixels (sprite rows 7..22) that differ from the standing frame,
# like swim_face.png. Used by emotes.js (/nice, /sleep), render.js (/troll) and the dying body (dead).
for name in ('dead', 'nice', 'sleep', 'troll'):
    full = fit(read_ase(HERE + 'expressions/' + name + '.aseprite'))
    ch = (full != idle).any(axis=2)
    ch[:Y_OFF + 7 * S] = False
    ch[Y_OFF + 23 * S:] = False
    for s in SKINS:
        old_open = np.array(Image.open(OLD + s + '/idle_open.png').convert('RGBA'))
        f = common(old_open[old_face], old_skin) / src
        a = recolor(full, f)
        a[~ch] = 0
        Image.fromarray(a).save(CH + s + '/expr_' + name + '.png')
    print('expr', name, int(ch.sum()), 'px')

# ---- sleeping in a Bed (owner's bedsleep.png, Nov 20 2026: "like this") ----
# His 32 x 35 picture: the head (skin) over his bed. Cut into www/assets/character/bed_back.png (the pillow /
# headboard behind the head: non-skin pixels above the blanket, right of the face) and bed_front.png (the blanket and
# the bed: every non-skin pixel from the blanket's row down), fitted like the body (mirrored, x6, 198 x 215). The game
# draws back, then the character's own head (closed eyes, sleep face, hair / hat) moved BED_HEAD_DX / DY sprite px, cut
# off under the blanket's row, then front (rest.js bedSleep).
BED_BLANKET_ROW = 18  # his picture: the blanket's top row
bs = np.array(Image.open(HERE + 'bed/bedsleep.png').convert('RGBA'))
shape = read_ase(HERE + 'default_look.aseprite', only=('shape',))
skin_cols = {tuple(int(v) for v in c) for c in shape[shape[..., 3] > 0][:, :3]} | {(255, 204, 190)}
is_sk = np.zeros(bs.shape[:2], bool)
for c in skin_cols:
    is_sk |= (bs[..., :3] == c).all(axis=2)
is_sk &= bs[..., 3] > 0
back = bs.copy()
back[BED_BLANKET_ROW:] = 0
back[is_sk] = 0
back[:, :26] = 0  # only the pillow / headboard right of the face
front = bs.copy()
front[:BED_BLANKET_ROW] = 0
front[is_sk] = 0
CHOUT = ROOT + '/www/assets/character/'
Image.fromarray(fit(back, pad=40)).save(CHOUT + 'bed_back.png')
Image.fromarray(fit(front, pad=40)).save(CHOUT + 'bed_front.png')
# (owner: "the other bed the same as the red one") the Hospital Bed: his picture recoloured, the red blanket light blue
# and the wood light gray metal (the Hospital Bed's colours); the white pillow / sheet stay
HOSP = {
    (212, 69, 79): (159, 192, 232), (184, 50, 62): (106, 138, 184), (238, 138, 142): (200, 220, 245),
    (160, 93, 57): (200, 205, 214), (138, 77, 47): (168, 174, 186), (118, 64, 39): (138, 144, 158),
    (98, 52, 31): (112, 118, 132), (79, 42, 25): (90, 96, 110), (62, 33, 20): (70, 74, 86), (36, 18, 10): (40, 44, 54),
}
for nm, pic in (('back', back), ('front', front)):
    h = pic.copy()
    for src_c, dst_c in HOSP.items():
        m = (h[..., :3] == src_c).all(axis=2) & (h[..., 3] > 0)
        h[m, :3] = dst_c
    Image.fromarray(fit(h, pad=40)).save(CHOUT + 'bed_' + nm + '_hospital.png')
print('bed sleep: back', int((back[..., 3] > 0).sum()), 'front', int((front[..., 3] > 0).sum()), 'px')
