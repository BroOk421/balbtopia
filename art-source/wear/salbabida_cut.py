# Swim rings that FLOAT (owner, Nov 25 2026: blue- / green- / chicken- / monster-salbabida.aseprite, "when worn you float
# on the water; moving, the arms swim"). His 'salbabida' layer of each file, lined up like pixelwear_cut.py (align:
# his body on the game's; mirrored, x6, 40 px room each side) -> www/assets/wear/<id>/ring.png (198 x 215, the frame +
# PAD each side) and icon.png (the ring alone, 1 px, facing right). Drawn by js/wear/salbabida.js.
#   Run:  python3 art-source/wear/salbabida_cut.py <project root>
import sys, os
import numpy as np
from PIL import Image
ROOT = sys.argv[1]
src = open(ROOT + '/art-source/wear/pixelwear_cut.py').read()
sys.argv = [sys.argv[0], ROOT, '__none__']
exec(src[:src.index('ONLY = set(sys.argv[2:])')])
RINGS = {'blue': 'blue_swim_float', 'green': 'green_swim_float', 'chicken': 'chicken_swim_float', 'monster': 'monster_swim_float'}
for name, iid in RINGS.items():
    frames, L = read_frames(SRC + 'salbabida/' + name + '-salbabida.aseprite')
    cels = align(dict(frames[0]), 'salbabida/' + name)
    a = cels['salbabida']
    d = OUT + iid
    os.makedirs(d, exist_ok=True)
    out = fit(a)
    out[out[..., 3] == 0] = 0
    Image.fromarray(out).save(d + '/ring.png')
    ys, xs = np.where(a[..., 3] > 0)
    Image.fromarray(a[ys.min():ys.max() + 1, xs.min():xs.max() + 1][:, ::-1]).save(d + '/icon.png')
    print(iid, out.shape, 'ring rows', ys.min(), ys.max())
