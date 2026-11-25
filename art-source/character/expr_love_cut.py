# /love face (owner, Nov 25 2026: expressions/heart-eye.aseprite: heart eyes, his mouth; the eyes and eyebrows layers
# hidden in his file). Cut like expr_cry_omg_cut.py (only the face pixels that differ from the standing frame,
# mirrored to face right, x6, every skin tone) -> <skin>/expr_love.png. Also one of his hearts (the left one of the
# 'hearts' layer, as it is) -> www/assets/fx/love_heart.png: the little hearts floating up (player/emotes.js).
#   Run:  python3 art-source/character/expr_love_cut.py <project root>
import sys
import numpy as np
from PIL import Image
ROOT = sys.argv[1]
src = open(ROOT + '/art-source/character/expr_cry_omg_cut.py').read()
exec(src[:src.index("cry = read_frames(")])
love = read_frames(HERE + 'expressions/heart-eye.aseprite')[0]
# (owner, Nov 25 2026: "raise the two eyebrows by 1") his hidden 'eyebrows' layer, ONE pixel higher, over the face
# (just above the heart eyes)
_s = open(ROOT + '/art-source/items/pxsword_cut.py').read()
_g = {'sys': sys, '__name__': 'pxs'}
_argv, sys.argv = sys.argv, [sys.argv[0], ROOT]
exec(_s[:_s.index('ITEMS = [')], _g)
sys.argv = _argv
_cels = _g['read'](HERE + 'expressions/heart-eye.aseprite')[0][0]
brow = np.zeros_like(_cels['eyebrows'])
brow[:-1] = _cels['eyebrows'][1:]
love = love.copy()
love[brow[..., 3] > 0] = brow[brow[..., 3] > 0]
print('expr_love', save(fit(love), 'expr_love'), 'px')
# the left heart of the hearts layer (his pixels)
import struct, zlib
d = open(HERE + 'expressions/heart-eye.aseprite', 'rb').read()
_, _, _, W, H, _ = struct.unpack_from('<IHHHHH', d, 0)
pos = 128
fsize, _, old, _ = struct.unpack_from('<IHHH', d, pos)
n = struct.unpack_from('<I', d, pos + 12)[0] or old
p, names, hearts = pos + 16, [], None
for _ in range(n):
    cs, ct = struct.unpack_from('<IH', d, p)
    b = d[p + 6:p + cs]
    if ct == 0x2004:
        nl = struct.unpack_from('<H', b, 16)[0]
        names.append(b[18:18 + nl].decode())
    elif ct == 0x2005:
        li, x, y, _, typ = struct.unpack_from('<HhhBH', b, 0)
        if names[li] == 'hearts':
            w, h = struct.unpack_from('<HH', b, 16)
            raw = zlib.decompress(b[20:]) if typ == 2 else b[20:]
            hearts = np.zeros((H, W, 4), np.uint8)
            hearts[y:y + h, x:x + w] = np.frombuffer(raw, np.uint8)[:w * h * 4].reshape(h, w, 4)
    p += cs
m = hearts[..., 3] > 0
cols = np.nonzero(m.any(0))[0]
# split at the first empty column between the two hearts
gap = [c for c in range(cols.min(), cols.max()) if not m[:, c].any()]
right = gap[0] if gap else (cols.min() + cols.max()) // 2
left = hearts[:, cols.min():right]
ys = np.nonzero(left[..., 3].any(1))[0]
Image.fromarray(left[ys.min():ys.max() + 1]).save(ROOT + '/www/assets/fx/love_heart.png')
print('love_heart.png', left.shape[1], 'x', ys.max() - ys.min() + 1)
# (owner, Nov 25 2026: "the hearts in the eyes should pump") the hearts on their own, at frame size (mirrored, x6 like
# the faces) -> www/assets/fx/love_eyes.png, and every skin's expr_love.png WITHOUT them: emotes.js draws the face,
# then each heart scaled round its own middle with the heartbeat (always >= its size: the eyes stay covered)
hf = fit(hearts)
Image.fromarray(hf).save(ROOT + '/www/assets/fx/love_eyes.png')
hm = hf[..., 3] > 0
for sk in SKINS:
    a = np.array(Image.open(CH + sk + '/expr_love.png').convert('RGBA'))
    a[hm] = 0
    Image.fromarray(a).save(CH + sk + '/expr_love.png')
print('love_eyes.png; hearts taken out of expr_love.png')
