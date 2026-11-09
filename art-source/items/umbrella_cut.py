# Cuts the owner's umbrella picture (umbrella_source.png: closed on the left, open on the right, transparent
# background, upscaled pixel art at about CELL source px per art pixel) into two small pixel pictures:
# www/assets/items/umbrella_closed.png and umbrella_open.png. Each art pixel = the most common colour of its cell
# (transparent when less than half the cell is opaque). Run: python3 umbrella_cut.py
import os
from collections import Counter
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'www', 'assets', 'items')
CELL = 13.2
src = Image.open(os.path.join(HERE, 'umbrella_source.png')).convert('RGBA')
W, H = src.size
px = src.load()
# the two pieces: columns with something opaque, split at the empty gap
cols = [x for x in range(W) if any(px[x, y][3] > 128 for y in range(0, H, 2))]
pieces, start, prev = [], cols[0], cols[0]
for x in cols[1:]:
    if x > prev + 20:
        pieces.append((start, prev))
        start = x
    prev = x
pieces.append((start, prev))
for name, (x0, x1) in zip(['umbrella_closed', 'umbrella_open'], pieces):
    rows = [y for y in range(H) if any(px[x, y][3] > 128 for x in range(x0, x1 + 1, 2))]
    y0, y1 = rows[0], rows[-1]
    w = round((x1 - x0 + 1) / CELL)
    h = round((y1 - y0 + 1) / CELL)
    out = Image.new('RGBA', (w, h))
    o = out.load()
    for j in range(h):
        for i in range(w):
            cnt, n, tot = Counter(), 0, 0
            for y in range(int(y0 + j * CELL + 2), int(y0 + (j + 1) * CELL - 2)):
                for x in range(int(x0 + i * CELL + 2), int(x0 + (i + 1) * CELL - 2)):
                    r, g, b, a = px[x, y]
                    tot += 1
                    if a > 128:
                        n += 1
                        cnt[(r // 8 * 8, g // 8 * 8, b // 8 * 8)] += 1
            if tot and n * 2 >= tot:
                c = cnt.most_common(1)[0][0]
                o[i, j] = (c[0], c[1], c[2], 255)
    out.save(os.path.join(OUT, name + '.png'))
    print(name, out.size)
