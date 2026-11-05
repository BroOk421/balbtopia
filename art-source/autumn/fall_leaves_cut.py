# Cuts the owner's autumn leaf sheet (fall_leaves_source.png, Nov 5 2026) into one strip of leaves for the Fall
# Machine's falling leaves and the Autumn Wings' jump leaves: www/assets/autumn/fall_leaves.png + printed boxes
# (paste into FALL_LEAF_BOX in autumn.js). Near-white background is keyed out; each leaf = one connected piece.
import sys
from PIL import Image
src = Image.open(sys.argv[1] if len(sys.argv) > 1 else 'art-source/autumn/fall_leaves_source.png').convert('RGBA')
W, H = src.size
px = src.load()
def solid(x, y):
    r, g, b, a = px[x, y]
    return a > 60 and not (r > 235 and g > 225 and b > 215)
seen = [[False] * H for _ in range(W)]
pieces = []
for x0 in range(W):
    for y0 in range(H):
        if seen[x0][y0] or not solid(x0, y0):
            continue
        st = [(x0, y0)]; seen[x0][y0] = True; pts = []
        while st:
            x, y = st.pop(); pts.append((x, y))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    a, b = x + dx, y + dy
                    if 0 <= a < W and 0 <= b < H and not seen[a][b] and solid(a, b):
                        seen[a][b] = True; st.append((a, b))
        if len(pts) > 150:
            pieces.append(pts)
pieces.sort(key=lambda p: (min(q[1] for q in p) // 90, min(q[0] for q in p)))
PAD = 1
out_w = sum(max(q[0] for q in p) - min(q[0] for q in p) + 1 + PAD * 2 for p in pieces)
out_h = max(max(q[1] for q in p) - min(q[1] for q in p) + 1 for p in pieces) + PAD * 2
out = Image.new('RGBA', (out_w, out_h), (0, 0, 0, 0))
o = out.load(); boxes = []; ox = 0
for p in pieces:
    x0 = min(q[0] for q in p); y0 = min(q[1] for q in p)
    w = max(q[0] for q in p) - x0 + 1; h = max(q[1] for q in p) - y0 + 1
    for x, y in p:
        r, g, b, a = px[x, y]
        o[ox + PAD + x - x0, PAD + y - y0] = (r, g, b, 255 if a > 160 else a)
    boxes.append([ox, 0, w + PAD * 2, h + PAD * 2]); ox += w + PAD * 2
out.save('www/assets/autumn/fall_leaves.png')
print(len(boxes), out.size); print(boxes)
