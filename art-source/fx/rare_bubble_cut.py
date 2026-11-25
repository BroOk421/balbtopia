# Rare prize bubbles (owner, Nov 25 2026: bubble.aseprite; "many bubbles rising, stars too, just no stroke, and with a
# shadow"): his layers composited with their layer opacity (Layer 2 at 20, Layer 3 at 199 of 255: the white body;
# Layer 5 / 6: the shine), WITHOUT 'Layer 4' (the ring round the edge = the stroke he doesn't want), into
# www/assets/fx/rare_bubble.png (35 x 35) for events/rareprize.js.   Run:  python3 art-source/fx/rare_bubble_cut.py <root>
import sys, os, struct
import numpy as np
from PIL import Image
ROOT = sys.argv[1]
src = open(ROOT + '/art-source/wear/pixelwear_cut.py').read()
sys.argv = [sys.argv[0], ROOT, '__none__']
exec(src[:src.index('ONLY = set(sys.argv[2:])')])
PATH = ROOT + '/art-source/fx/bubble.aseprite'
frames, L = read_frames(PATH)
# layer opacities (read_frames doesn't keep them): the byte after the blend mode in each layer chunk
d = open(PATH, 'rb').read()
op, pos = [], 128
fsize, _, old, _ = struct.unpack_from('<IHHH', d, pos)
n = struct.unpack_from('<I', d, pos + 12)[0] or old
p = pos + 16
for _ in range(n):
    cs, ct = struct.unpack_from('<IH', d, p)
    if ct == 0x2004:
        op.append(d[p + 6 + 12] / 255)
    p += cs
SKIP = {'Layer 4'}
cel = frames[0]
out = np.zeros(cel[L[0][0]].shape, np.float64)  # premultiplied RGBA 0..1
for (name, vis), o in zip(L, op):
    if not vis or name in SKIP or name not in cel:
        continue
    s = cel[name].astype(np.float64) / 255
    a = s[..., 3:4] * o
    out[..., :3] = s[..., :3] * a + out[..., :3] * (1 - a)
    out[..., 3:4] = a + out[..., 3:4] * (1 - a)
rgb = np.where(out[..., 3:4] > 0, out[..., :3] / np.maximum(out[..., 3:4], 1e-6), 0)
img = np.concatenate([rgb, out[..., 3:4]], -1)
os.makedirs(ROOT + '/www/assets/fx', exist_ok=True)
Image.fromarray(np.round(img * 255).astype(np.uint8)).save(ROOT + '/www/assets/fx/rare_bubble.png')
print('rare_bubble.png from', [(nm, round(o, 2)) for (nm, _), o in zip(L, op)], 'skipped', SKIP)
