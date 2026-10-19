# Fills small notches ("ukit") in the top outline of the backdrop's mountains and hills: a column whose top edge
# dips below the line through its neighbours is filled up to that line with the colours just under it.
import numpy as np
from PIL import Image
import sys
for name in sys.argv[1:]:
    a = np.asarray(Image.open(name + '.webp').convert('RGBA')).copy()
    A = a[..., 3] > 0
    H, W = A.shape
    top = np.full(W, H)
    for x in range(W):
        ys = np.where(A[:, x])[0]
        if len(ys): top[x] = ys.min()
    fixed = 0
    R = 9
    for x in range(W):
        if top[x] >= H: continue
        l = top[max(0, x - R):x]; r = top[x + 1:x + 1 + R]
        if not len(l) or not len(r): continue
        line = max(l.min(), r.min())   # both sides reach higher than this column: a dip
        if top[x] - line >= 2:
            ty = top[x]
            for y in range(line, ty):
                a[y, x] = a[ty + 1, x]  # the colour just under the edge
            fixed += ty - line
    Image.fromarray(a).save(name + '.webp', lossless=True)
    print(name, 'filled px', fixed)
