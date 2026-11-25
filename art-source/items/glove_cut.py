# Boxing Glove (owner, Nov 25 2026: boxing-gloves.aseprite, "I replaced the boxing glove: remove your drawing"): his
# 'gloves' layer cropped to its box into www/assets/items/boxing_glove.png (his pixels, as in his file: he faces left,
# the glove on his back hand, cuff on top). Prints the hand point (the end of his back sleeve, 'sleeve right') inside
# the glove picture: items/glovepunch.js GLOVE_HAND.   Run:  python3 art-source/items/glove_cut.py <project root>
import sys, os
import numpy as np
from PIL import Image
ROOT = sys.argv[1]
src = open(ROOT + '/art-source/wear/pixelwear_cut.py').read()
sys.argv = [sys.argv[0], ROOT, '__none__']
exec(src[:src.index('ONLY = set(sys.argv[2:])')])
frames, L = read_frames(ROOT + '/art-source/items/pixel/boxing-gloves.aseprite')
cel = frames[0]
gl = cel['gloves']
ys, xs = np.nonzero(gl[..., 3] > 0)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
Image.fromarray(gl[y0:y1 + 1, x0:x1 + 1]).save(ROOT + '/www/assets/items/boxing_glove.png')
sy, sx = np.nonzero(cel['sleeve right'][..., 3] > 0)
hx, hy = (sx.min() + sx.max() + 1) / 2, sy.max() + 1  # the bottom middle of the sleeve = the wrist / hand
print('boxing_glove.png', x1 - x0 + 1, 'x', y1 - y0 + 1, 'hand at', hx - x0, hy - y0)
