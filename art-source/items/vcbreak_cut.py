# Void Cleaver break marks (owner, Nov 25 2026: void-cleaver-break-effect.aseprite, 5 frames of 32 x 32): every frame
# flattened, side by side, into www/assets/items/void_cleaver_break.png for items/vcbreak.js.
#   Run:  python3 art-source/items/vcbreak_cut.py <project root>
import sys
import numpy as np
from PIL import Image
ROOT = sys.argv[1]
sys.argv = [sys.argv[0], ROOT]
src = open(ROOT + '/art-source/items/pxsword_cut.py').read()
exec(src[:src.index('ITEMS = [')])
frames, L = read(ROOT + '/art-source/items/held/void-cleaver-break-effect.aseprite')
H, W = frames[0][L[0][0]].shape[:2]
sheet = np.zeros((H, W * len(frames), 4), np.uint8)
for k, f in enumerate(frames):
    for n, vis, op in L:
        if vis and n in f:
            a = f[n]
            m = a[..., 3] > 0
            sheet[:, k * W:(k + 1) * W][m] = a[m]
Image.fromarray(sheet).save(ROOT + '/www/assets/items/void_cleaver_break.png')
print('void_cleaver_break.png', len(frames), 'frames of', W, 'x', H)
