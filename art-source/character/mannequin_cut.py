# The Mannequin (owner, Nov 21 2026: "the same as the character, with hands, only another colour: gray"):
# his mannequin.aseprite (the default_look body in grays, with a face, sleeves and hands, no clothes) ->
#   www/assets/character/mannequin/idle_open.png    the body WITHOUT sleeves (118 x 215, like <skin>/idle_open.png)
#   www/assets/character/mannequin/sleeve_back.png  / sleeve_front.png (like <skin>/sleeve_*.png)
#   www/assets/character/mannequin/idle_full.png    body + both sleeves hanging (for the Shop / bag icon)
# Fitted exactly like blocky_cut.py (mirrored to face right, x6 whole pixels, feet on row 213, 1 px cut each side), so
# the clothes and the sleeves' shoulders (blockybody.js BLOCKY.back / front) land in the same places as on a player.
# Run:  python3 art-source/character/mannequin_cut.py <project root>
import sys, os, struct, zlib
import numpy as np
from PIL import Image

ROOT = sys.argv[1]
SRC = ROOT + '/art-source/character/mannequin.aseprite'
OUT = ROOT + '/www/assets/character/mannequin/'
os.makedirs(OUT, exist_ok=True)


# ---------- .aseprite reader (RGBA, one frame; the same small reader as blocky_cut.py) ----------
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


layers, (look,) = read_ase(SRC)
H0, W0 = look['shape'].shape[:2]
S, FW, FH = 6, 118, 215
X_OFF = (FW - W0 * S) // 2
Y_OFF = 214 - H0 * S


def over(dst, src):
    m = src[..., 3] > 0
    dst[m] = src[m]
    return dst


def up(a):
    return np.array(Image.fromarray(a).resize((W0 * S, H0 * S), Image.NEAREST))


def frame(big):
    big = big[:, ::-1]  # face right like the other frames
    out = np.zeros((FH, FW, 4), np.uint8)
    x0 = max(0, X_OFF)
    sx0 = x0 - X_OFF
    w = min(FW - x0, big.shape[1] - sx0)
    out[Y_OFF:Y_OFF + big.shape[0], x0:x0 + w] = big[:, sx0:sx0 + w]
    out[out[..., 3] == 0] = 0
    out[..., 3] = np.where(out[..., 3] > 0, 255, 0)
    return out


SLEEVES = ('sleeve left', 'sleeve right')
body = np.zeros((H0, W0, 4), np.uint8)
for l in layers:
    if l not in SLEEVES and l in look:
        over(body, look[l])
Image.fromarray(frame(up(body))).save(OUT + 'idle_open.png')

full = np.zeros((H0, W0, 4), np.uint8)
over(full, look['sleeve left'])  # behind the body
over(full, body)
over(full, look['sleeve right'])  # in front
Image.fromarray(frame(up(full))).save(OUT + 'idle_full.png')


def sleeve_pic(name):
    a = look[name]
    ys, xs = np.where(a[..., 3] > 0)
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1][:, ::-1]  # mirrored: facing right


Image.fromarray(sleeve_pic('sleeve left')).save(OUT + 'sleeve_back.png')
Image.fromarray(sleeve_pic('sleeve right')).save(OUT + 'sleeve_front.png')
print('mannequin ok:', sorted(os.listdir(OUT)))
