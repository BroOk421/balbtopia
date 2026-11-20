# Simpler ground tiles (owner, Nov 20 2026, with a reference screenshot): dirt = two soft brown tones in wavy
# horizontal bands, a thin dark edge only on open sides, and a GREEN grass cap with drips where the top is open;
# Cave Background = flat dark brown with a lattice of darker dots; lava = the same wavy bands in orange (4 frames,
# the waves drift sideways), a bright crust line on an open top.
# Sheets: 16 frames of 32 x 32, frame = mask bits 1 top, 2 right, 4 bottom, 8 left open (like ground_shapes.py).
# The tiles before this are kept in art-source/tiles/before_nov20/.
# usage: python3 art-source/tiles/simple_ground.py <www/assets/tiles dir>
import sys, math
import numpy as np
from PIL import Image

OUT = sys.argv[1]
N = 32


def waves(light, dark, phase=0.0):
    """two tones in wavy horizontal bands; repeats every 32 px both ways, so tiles join seamlessly"""
    a = np.zeros((N, N, 4), np.uint8)
    for y in range(N):
        for x in range(N):
            w = 2.2 * math.sin(2 * math.pi * (x + phase) / N) + 1.2 * math.sin(4 * math.pi * (x + phase) / N + 1.3)
            v = (y + w) % 16
            a[y, x] = (*(dark if v >= 9 else light), 255)
    return a


# grass cap: rows of solid green, then drips of a fixed length per column (the same in every tile, so tops join)
DRIP = [2, 3, 1, 0, 2, 4, 3, 1, 1, 2, 0, 1, 3, 5, 4, 2, 1, 0, 2, 3, 2, 1, 4, 3, 1, 0, 1, 2, 3, 2, 0, 1]
G_OUT, G_DARK, G_MID, G_LIGHT = (38, 84, 34), (58, 128, 44), (86, 168, 56), (136, 210, 84)
CAP = 5  # solid rows of grass


def grass(a, m):
    for x in range(N):
        bot = CAP + DRIP[x]
        for y in range(bot):
            a[y, x, :3] = G_MID
        a[1, x, :3] = G_LIGHT
        a[2, x, :3] = G_LIGHT if x % 5 else G_MID
        a[bot - 1, x, :3] = G_DARK  # shaded drip tip
        a[bot, x, :3] = np.clip(a[bot, x, :3].astype(int) - 22, 0, 255)  # a little shadow on the dirt under it
        a[0, x, :3] = G_OUT
    if m & 8:
        a[:CAP + DRIP[0], 0, :3] = G_OUT
    if m & 2:
        a[:CAP + DRIP[-1], N - 1, :3] = G_OUT


def edges(a, m, out, shade, top_cap=False):
    # open sides: a dark edge (and a shaded row above an open bottom / inside an open right side)
    if m & 4:
        a[N - 1, :, :3] = out
        a[N - 2, :, :3] = shade
    if m & 8:
        a[:, 0, :3] = out
    if m & 2:
        a[:, N - 1, :3] = out
        a[:, N - 2, :3] = np.clip(a[:, N - 2, :3].astype(int) - 14, 0, 255)
    if m & 1 and not top_cap:
        a[0, :, :3] = out


def save(name, frames):
    Image.fromarray(np.concatenate(frames, axis=1), 'RGBA').save(f'{OUT}/{name}.png')


# ---- dirt (3 picture variants: the same waves, a different pair of tiny dark specks) ----
D_LIGHT, D_DARK, D_OUT, D_SHADE = (116, 74, 49), (98, 60, 42), (56, 31, 30), (80, 47, 37)
SPECKS = [[(7, 20), (23, 11)], [(14, 25), (26, 18)], [(4, 13), (19, 27)]]
for v in range(3):
    fr = []
    for m in range(16):
        a = waves(D_LIGHT, D_DARK)
        for (x, y) in SPECKS[v]:
            a[y, x, :3] = D_OUT
        edges(a, m, D_OUT, D_SHADE, top_cap=bool(m & 1))
        if m & 1:
            grass(a, m)
        fr.append(a)
    save(f'dirt_{v}', fr)

# ---- cave background: flat dark brown, darker round dots on a diamond lattice (repeats every 32 px) ----
C_BASE, C_DOT = (44, 29, 31), (34, 22, 27)
c = np.zeros((N, N, 3), np.uint8)
c[:] = C_BASE
DOT = [(dx, dy) for dx in range(-1, 3) for dy in range(-1, 3) if not (dx in (-1, 2) and dy in (-1, 2))]  # 4 x 4, corners off
for gy in range(0, N, 8):
    for gx in range(0, N, 8):
        cx, cy = gx + (4 if (gy // 8) % 2 else 0) + 2, gy + 4
        for dx, dy in DOT:
            c[(cy + dy) % N, (cx + dx) % N] = C_DOT
Image.fromarray(c, 'RGB').save(f'{OUT}/cave.png')

# ---- lava: orange waves drifting sideways over 4 frames, glowing crust line on an open top ----
L_LIGHT, L_DARK, L_OUT, L_SHADE = (246, 128, 34), (222, 82, 24), (90, 20, 10), (150, 36, 12)
L_TOP1, L_TOP2 = (255, 224, 110), (255, 170, 52)
for f in range(4):
    fr = []
    for m in range(16):
        a = waves(L_LIGHT, L_DARK, phase=f * 8)[..., :3].copy()
        a4 = np.dstack([a, np.full((N, N), 255, np.uint8)])
        edges(a4, m, L_OUT, L_SHADE, top_cap=bool(m & 1))
        if m & 1:
            a4[0, :, :3] = L_OUT
            a4[1, :, :3] = L_TOP1
            a4[2, :, :3] = L_TOP2
            if m & 8:
                a4[:3, 0, :3] = L_OUT
            if m & 2:
                a4[:3, N - 1, :3] = L_OUT
        fr.append(a4[..., :3])
    Image.fromarray(np.concatenate(fr, axis=1), 'RGB').save(f'{OUT}/lava_{f}.png')
print('ok')
