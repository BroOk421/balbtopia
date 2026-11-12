# The owner's Mega Water Gun picture (Nov 12 2026, megagun_ref.png: a purple / pink blaster on green, barrel to the
# right) -> www/assets/items/mega_water_gun.png: the hand-tool picture the game draws (like asteroids.js gunSprite64,
# but 128 x 128 = twice the detail, drawn the same size): turned so the barrel points up-right, the grip's middle on
# the hand spot, a dark 2 px outline round it ("give it a stroke"). Run from this folder: python3 megagun_cut.py
from PIL import Image
import numpy as np

A = np.array(Image.open('megagun_ref.png').convert('RGBA')).astype(int)
H, W = A.shape[:2]
bgc = A[2, 2, :3]
d = np.abs(A[:, :, :3] - bgc).sum(2)
# the green background and the green-tinted edge pixels out
greenish = (A[:, :, 1] >= A[:, :, 0]) & (A[:, :, 1] >= A[:, :, 2]) & (A[:, :, 1] > 60)
solid = (d > 120) & ~greenish
HAND = (33, 43)  # the grip's middle in his picture
DARK = 0.8  # (owner: "a little darker, the water gun too")
N = 128
K2 = 2  # 128 px = 2 x the 64-px gun pictures
GRIP = (7 * 4, 25 * 4)
SHIFT = (-1.5 * K2, 7 * K2)
r2 = 0.5 ** 0.5
out = np.zeros((N, N, 4), np.uint8)
filled = np.zeros((N, N), bool)
for y in range(N):
    for x in range(N):
        dx, dy = x + 0.5 - GRIP[0], y + 0.5 - GRIP[1]
        u = dx * r2 - dy * r2
        v = dx * r2 + dy * r2
        ix, iy = int(np.floor(HAND[0] + u)), int(np.floor(HAND[1] + v))
        if 0 <= ix < W and 0 <= iy < H and solid[iy, ix]:
            out[y, x] = (*(A[iy, ix, :3] * DARK).astype(np.uint8), 255)
            filled[y, x] = True
# the stroke: a dark outline round it, 2 px (1 px of the 64-px pictures)
K = (0x14, 0x10, 0x1c, 255)
edge = filled.copy()
for _ in range(2):
    grow = edge.copy()
    for y in range(N):
        for x in range(N):
            if edge[y, x]:
                continue
            for ax, ay in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + ax, y + ay
                if 0 <= nx < N and 0 <= ny < N and edge[ny, nx]:
                    grow[y, x] = True
                    out[y, x] = K
                    break
    edge = grow
Image.fromarray(out, 'RGBA').save('../../www/assets/items/mega_water_gun.png')
print('saved', filled.sum(), 'px')
