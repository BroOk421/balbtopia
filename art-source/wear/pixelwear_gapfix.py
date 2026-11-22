# Fill 1-px see-through gaps between the body frame's edge and a worn picture (the body lost its outline column
# at frame x 118 / -1 when the 120 px sprite was put in the 118 px frame): the gap pixel takes the picture's
# neighbour colour on the far side.
import sys, os, numpy as np
from PIL import Image
W = sys.argv[1]; fix = len(sys.argv) > 2
body = np.array(Image.open(W + 'character/porcelain/idle_open.png').convert('RGBA'))
B = np.zeros((215, 198, 4), np.uint8); B[:, 40:158] = body
for d in sorted(os.listdir(W + 'wear')):
    for f in os.listdir(W + 'wear/' + d):
        if not f.startswith(('idle', 'hood')) or not f.endswith('.png'): continue
        p = W + 'wear/' + d + '/' + f
        a = np.array(Image.open(p).convert('RGBA'))
        if a.shape[:2] != (215, 198): continue
        n = 0
        for x, nb in ((158, 159), (39, 38)):
            for y in range(215):
                if a[y, x, 3] == 0 and a[y, nb, 3] > 0 and B[y, x - (1 if x == 158 else -1), 3] > 0:
                    n += 1
                    if fix: a[y, x] = a[y, nb]
        if n:
            print(d, f, n)
            if fix: Image.fromarray(a).save(p)
