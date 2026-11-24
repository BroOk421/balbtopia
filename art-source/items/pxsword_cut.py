# The owner's pixel swords (Nov 25 2026, new.zip: sword.aseprite, sword-effect.aseprite, bigsword.aseprite): the blocky
# character holding them, 6 frames of 100 ms each. Every visible layer that is not the body is put together per frame
# (layer order and layer opacity as in his file), cut to the box all frames share and laid in a row:
# www/assets/items/held_<id>.png (frame k at x = k * w). Prints where the picture's top-left is from the shoulder that
# holds it (items/pxswords.js PXS.at), in his file's own direction (he faces left; the game mirrors it like rodknife.js).
#   sword.aseprite         -> silver_blade      (front hand; only 'sword' is visible)
#   sword-effect.aseprite  -> prism_blade       (front hand; 'effects' + 'sword' + 'another aura': the colours cycle)
#   bigsword.aseprite      -> void_cleaver  (BACK hand raised straight up, the sword lying behind the head, under
#                                                the body, with its blue glow and sparks)
# Run:  python3 art-source/items/pxsword_cut.py <project root>
import sys, struct, zlib, os
import numpy as np
from PIL import Image

ROOT = sys.argv[1] if len(sys.argv) > 1 else '../..'
HERE = os.path.join(ROOT, 'art-source/items/held/')
OUT = os.path.join(ROOT, 'www/assets/items/')
BODY = {'sleeve left', 'shape', 'short', 'sando', 'shirt', 'sleeve right', 'mouth', 'nose', 'eyes', 'eyebrows', 'hair', 'pants', 'shoes', 'shades'}


def read(path):
    """frames [{layer: H x W x 4}], layers [(name, visible, opacity)] (cels may reach past the canvas: clipped)"""
    d = open(path, 'rb').read()
    _, magic, nf, W, H, depth = struct.unpack_from('<IHHHHH', d, 0)
    assert magic == 0xA5E0 and depth == 32, path
    pos, L, frames = 128, [], []
    for _ in range(nf):
        fsize, _, old, _ = struct.unpack_from('<IHHH', d, pos)
        n = struct.unpack_from('<I', d, pos + 12)[0] or old
        p, cels = pos + 16, {}
        for _ in range(n):
            cs, ct = struct.unpack_from('<IH', d, p)
            b = d[p + 6:p + cs]
            if ct == 0x2004:
                fl = struct.unpack_from('<H', b, 0)[0]
                nl = struct.unpack_from('<H', b, 16)[0]
                L.append((b[18:18 + nl].decode(), bool(fl & 1), b[12]))
            elif ct == 0x2005:
                li, x, y, op, c = struct.unpack_from('<HhhBH', b, 0)
                if c in (0, 2):
                    w, h = struct.unpack_from('<HH', b, 16)
                    raw = b[20:] if c == 0 else zlib.decompress(b[20:])
                    src = np.frombuffer(raw, np.uint8)[:w * h * 4].reshape(h, w, 4)
                    a = np.zeros((H, W, 4), np.uint8)
                    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
                    if x1 > x0 and y1 > y0:
                        a[y0:y1, x0:x1] = src[y0 - y:y1 - y, x0 - x:x1 - x]
                    a = a.astype(float)
                    a[..., 3] *= op / 255
                    cels[L[li][0]] = a
                elif c == 1:
                    cels[L[li][0]] = frames[struct.unpack_from('<H', b, 16)[0]][L[li][0]]
            p += cs
        frames.append(cels)
        pos += fsize
    return frames, L


def over(dst, src, alpha):
    """src (H x W x 4 floats, alpha 0..255) over dst, src's alpha times `alpha`"""
    sa = src[..., 3:4] / 255 * alpha
    da = dst[..., 3:4] / 255
    oa = sa + da * (1 - sa)
    rgb = np.where(oa > 0, (src[..., :3] * sa + dst[..., :3] * da * (1 - sa)) / np.maximum(oa, 1e-6), 0)
    return np.concatenate([rgb, oa * 255], axis=2)


ITEMS = [('sword.aseprite', 'silver_blade', 'front'), ('sword-effect.aseprite', 'prism_blade', 'front'),
         ('bigsword.aseprite', 'void_cleaver', 'back')]
for f, iid, arm in ITEMS:
    frames, L = read(HERE + f)
    pics = []
    for cels in frames:
        a = np.zeros(cels['shape'].shape, float)
        for name, vis, op in L:
            if vis and name not in BODY and name in cels:
                a = over(a, cels[name], op / 255)
        pics.append(np.clip(np.round(a), 0, 255).astype(np.uint8))
    ys, xs = np.where(np.any([p[..., 3] > 0 for p in pics], axis=0))
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    w, h = x1 - x0, y1 - y0
    strip = np.zeros((h, w * len(pics), 4), np.uint8)
    for k, p in enumerate(pics):
        strip[:, k * w:(k + 1) * w] = p[y0:y1, x0:x1]
    strip[strip[..., 3] == 0] = 0
    Image.fromarray(strip).save(OUT + 'held_' + iid + '.png')
    # the shoulder in his file: the bare body's left column + 14.83 (front) / 3.83 (back), its top row + 16.5
    # (the game's BLOCKY.front [29, 145] / back [95, 145] in the 118 x 215 frame, his body drawn mirrored at x6)
    sy, sx = np.where(frames[0]['shape'][..., 3] > 0)
    shx = sx.min() + (14.83 if arm == 'front' else 3.83)
    shy = sy.min() + 16.5
    print(iid, arm, 'frames', len(pics), 'size', w, h, 'at', round(x0 - shx, 2), round(y0 - shy, 2))
