# (owner, Nov 21 2026) two more faces, cut like look_cut.py's expressions (only the face pixels, sprite rows 7..22, that
# differ from the standing frame; mirrored to face right, x6, every skin tone):
#   expressions/cry.aseprite (11 frames, 100 ms each: eyes go sad, tears roll down) -> <skin>/expr_cry_00..10.png
#   expressions/omg.png      (his /omg face: big round eyes, an "o" mouth)            -> <skin>/expr_omg.png
#   <skin>/talk_o.png: the "O" mouth of the jump face (blocky_jump_up.png) over the standing mouth, for talking
# Used by js/player/emotes.js (/cry, /omg) and js/render/blockybody.js (drawTalk).
# Run:  python3 art-source/character/expr_cry_omg_cut.py <project root>
import sys, os, struct, zlib
import numpy as np
from PIL import Image

ROOT = sys.argv[1]
HERE = ROOT + '/art-source/character/'
CH = ROOT + '/www/assets/character/'
OLD = HERE + 'old_frames_base_owner/'
SKINS = sorted(d for d in os.listdir(CH) if os.path.exists(CH + d + '/expr_nice.png'))  # the skins that have the faces
S, FW, FH = 6, 118, 215


def read_frames(path):
    """every frame of an RGBA .aseprite, flattened (visible layers), as H x W x 4 arrays"""
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
                flags = struct.unpack_from('<H', b, 0)[0]
                nl = struct.unpack_from('<H', b, 16)[0]
                layers.append((b[18:18 + nl].decode(), bool(flags & 1)))
            elif ctype == 0x2005:
                li, x, y, _, ct = struct.unpack_from('<HhhBH', b, 0)
                if ct == 1:  # linked cel
                    cels[li] = frames[struct.unpack_from('<H', b, 16)[0]][1][li]
                elif ct in (0, 2):
                    w, h = struct.unpack_from('<HH', b, 16)
                    raw = b[20:] if ct == 0 else zlib.decompress(b[20:])
                    layer = np.zeros((H, W, 4), np.uint8)
                    layer[y:y + h, x:x + w] = np.frombuffer(raw, np.uint8)[:w * h * 4].reshape(h, w, 4)
                    cels[li] = layer
            p += csize
        out = np.zeros((H, W, 4), np.uint8)
        for li, (name, vis) in enumerate(layers):
            if vis and li in cels:
                m = cels[li][..., 3] > 0
                out[m] = cels[li][m]
        frames.append((out, cels))
        pos += fsize
    return [f[0] for f in frames]


def fit(spr):
    H0, W0 = spr.shape[:2]
    big = np.array(Image.fromarray(spr).resize((W0 * S, H0 * S), Image.NEAREST))[:, ::-1]
    X_OFF, Y_OFF = (FW - W0 * S) // 2, 214 - H0 * S
    out = np.zeros((FH, FW, 4), np.uint8)
    x0 = max(0, X_OFF)
    sx0 = x0 - X_OFF
    w = min(FW - x0, big.shape[1] - sx0)
    out[Y_OFF:Y_OFF + big.shape[0], x0:x0 + w] = big[:, sx0:sx0 + w]
    out[out[..., 3] == 0] = 0
    out[..., 3] = np.where(out[..., 3] > 0, 255, 0)
    return out


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


look = read_frames(HERE + 'default_look.aseprite')[0]
idle = fit(look)
Y_OFF = 214 - look.shape[0] * S
new_face = (slice(Y_OFF + 9 * S, Y_OFF + 21 * S), slice(20, 100))
old_face = (slice(10, 70), slice(15, 105))
src = common(idle[new_face], skin_mask(idle[new_face]))
old_skin = skin_mask(np.array(Image.open(OLD + 'porcelain/idle_open.png').convert('RGBA'))[old_face])
tone = {s: common(np.array(Image.open(OLD + s + '/idle_open.png').convert('RGBA'))[old_face], old_skin) / src for s in SKINS}


def face_only(full):
    ch = (full != idle).any(axis=2)
    ch[:Y_OFF + 7 * S] = False
    ch[Y_OFF + 23 * S:] = False
    return ch


def save(full, name):
    ch = face_only(full)
    for s in SKINS:
        a = recolor(full, tone[s])
        a[~ch] = 0
        Image.fromarray(a).save(CH + s + '/' + name + '.png')
    return int(ch.sum())


cry = read_frames(HERE + 'expressions/cry.aseprite')
for i, fr in enumerate(cry):
    print('expr_cry_%02d' % i, save(fit(fr), 'expr_cry_%02d' % i), 'px')
omg = np.array(Image.open(HERE + 'expressions/omg.png').convert('RGBA'))
omg[omg[..., 3] < 128] = 0
print('expr_omg', save(fit(omg), 'expr_omg'), 'px')

# talking "O" mouth: per skin, the jump face's mouth area (rows of the mouth, between the nose and the chin) where it
# differs from the standing frame: the O drawn and the standing mouth line covered with skin
MOUTH_ROWS = (Y_OFF + 17 * S, Y_OFF + 22 * S)
for s in SKINS:
    st = np.array(Image.open(CH + s + '/idle_open.png').convert('RGBA'))
    ju = np.array(Image.open(CH + s + '/blocky_jump_up.png').convert('RGBA'))
    ch = (st != ju).any(axis=2)
    ch[:MOUTH_ROWS[0]] = False
    ch[MOUTH_ROWS[1]:] = False
    a = ju.copy()
    a[~ch] = 0
    Image.fromarray(a).save(CH + s + '/talk_o.png')
    print('talk_o', s, int(ch.sum()), 'px')
