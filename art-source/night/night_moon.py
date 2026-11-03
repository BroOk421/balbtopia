# The Night Machine's moon (owner, Nov 3 2026): a plain moon, NO face. Pale cream, lit from the upper left, with soft
# grey-cream seas and a few small craters. Output: www/assets/night/moon.png (256 x 256, transparent corners).
# Run: python3 -I art-source/night/night_moon.py
import os
import numpy as np
from PIL import Image, ImageFilter
N, SS = 256, 3
M = N * SS
yy, xx = np.mgrid[0:M, 0:M].astype(np.float32)
c = (M - 1) / 2
R = M / 2 - 3 * SS
dx, dy = (xx - c) / R, (yy - c) / R
r = np.hypot(dx, dy)
inside = r <= 1
# lit from the upper left: a sphere-ish light value 0..1
nz = np.sqrt(np.clip(1 - r ** 2, 0, 1))
light = np.clip(0.55 * nz + 0.45 * (-0.55 * dx - 0.6 * dy + 0.4) * 0.8 + 0.25, 0, 1)
dark, mid, bright = np.array([196, 187, 140]), np.array([236, 228, 186]), np.array([255, 251, 226])
t = light[..., None]
col = np.where(t < 0.55, dark + (mid - dark) * (t / 0.55), mid + (bright - mid) * ((t - 0.55) / 0.45))
rng = np.random.default_rng(7)
# seas: big soft darker patches
seas = np.zeros((M, M), np.float32)
for cx, cy, rad in [(-0.28, -0.22, 0.30), (0.12, -0.38, 0.22), (0.30, 0.05, 0.26), (-0.05, 0.22, 0.28), (-0.42, 0.18, 0.16), (0.2, 0.42, 0.18)]:
    d = np.hypot(dx - cx, dy - cy) / rad
    seas = np.maximum(seas, np.clip(1 - d ** 2, 0, 1) ** 0.6)
col = col - seas[..., None] * np.array([28, 30, 26]) * (0.55 + 0.45 * light[..., None])
# craters: a dark floor with a lit rim on the side facing the light
for _ in range(16):
    a = rng.uniform(0, 6.28); d = rng.uniform(0.05, 0.82)
    cx, cy = np.cos(a) * d, np.sin(a) * d
    rad = rng.uniform(0.035, 0.1)
    q = np.hypot(dx - cx, dy - cy) / rad
    floor = np.clip(1 - q ** 4, 0, 1)
    rim = np.exp(-((q - 1) / 0.22) ** 2) * np.clip(0.5 + 0.9 * (-(dx - cx) * 0.6 - (dy - cy) * 0.6) / rad, 0, 1)
    col = col - floor[..., None] * np.array([34, 36, 32]) + rim[..., None] * np.array([22, 22, 18])
# a soft darker limb
col = col * (1 - 0.18 * np.clip((r - 0.8) / 0.2, 0, 1) ** 1.5)[..., None]
alpha = np.clip((1 - r) * R / SS * 1.0 + 0.5, 0, 1)  # antialiased edge (before downsampling the SS factor helps too)
img = np.dstack([np.clip(col, 0, 255), np.where(inside, 255, 0)]).astype(np.uint8)
im = Image.fromarray(img, 'RGBA').resize((N, N), Image.LANCZOS)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'www', 'assets', 'night', 'moon.png')
im.save(out)
print('saved', out)
