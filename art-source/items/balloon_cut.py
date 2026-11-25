# Red Balloon (owner, Nov 25 2026: balloon - Copy.aseprite -> art-source/items/pixel/balloon.aseprite): his 'balloon'
# layer cropped to its box into www/assets/items/balloon.png (1 px = 1 of his pixels; items/balloon.js draws it at
# his body's scale). Prints the knot (where his 'line' layer meets the balloon, from the picture's top-left) and the
# string's colour, which balloon.js has as BALLOON_ART.knot / .line.
#   Run:  python3 art-source/items/balloon_cut.py <project root>
import sys, os
import numpy as np
from PIL import Image
ROOT = sys.argv[1]
src = open(ROOT + '/art-source/wear/pixelwear_cut.py').read()
sys.argv = [sys.argv[0], ROOT, '__none__']
exec(src[:src.index('ONLY = set(sys.argv[2:])')])
frames, L = read_frames(ROOT + '/art-source/items/pixel/balloon.aseprite')
cel = frames[0]
b = cel['balloon']
m = b[..., 3] > 0
ys, xs = np.nonzero(m)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
os.makedirs(ROOT + '/www/assets/items', exist_ok=True)
Image.fromarray(b[y0:y1 + 1, x0:x1 + 1]).save(ROOT + '/www/assets/items/balloon.png')
ln = cel['line']
ly, lx = np.nonzero(ln[..., 3] > 0)
k = ly.argmin()  # the string's top pixel = the knot
col = ln[ly[k], lx[k], :3]
print('balloon.png', x1 - x0 + 1, 'x', y1 - y0 + 1, 'knot', int(lx[k] - x0), int(ly[k] - y0), 'line #%02x%02x%02x' % tuple(col))
# his hand (the string's bottom pixel) from the knot, for reference
k2 = ly.argmax()
print('string from knot to hand:', int(lx[k2] - lx[k]), int(ly[k2] - ly[k]))
