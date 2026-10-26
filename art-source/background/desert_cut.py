# Cuts the owner's desert picture (desert_source.png, 1620x971) into backdrop layers for the Desert Machine:
# far (lavender mountains), big (the red rocks, the arch and the sand down to the plain) and front (the sand
# plain). Its own sky, sun and clouds are dropped (the game shows the sunset's sky, sun and clouds behind them,
# owner Oct 26 2026) and so is the ground strip at the bottom (cacti, bushes, rocks, dirt): from row CUT down the
# sand carries on instead.
# Each layer is opaque from its own outline down; below where the next layer starts it is filled with its own
# colours, so nothing of a nearer layer shows when the layers slide apart (parallax).
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = sys.argv[1]
a = np.array(Image.open(ROOT + '/art-source/background/desert_source.png').convert('RGB')).astype(float)
H, W = a.shape[:2]
R, G, B = a[..., 0], a[..., 1], a[..., 2]
CUT = 722  # first row of the ground strip (cactus tops)
FRONT = 700  # where the sand plain layer starts (fades in over FRONT_FADE rows)
FRONT_FADE = 22

# ---- sky (blue), clouds (white) and the sun (top rows) ----
air = (G - R > 30) | ((R > 195) & (G > 210) & (B - G < 35) & (B > 220))
air[:285] = True
land = nd.binary_opening(~air, iterations=1)
top = np.zeros(W, int)
for x in range(W):
    run = np.convolve(land[:, x].astype(int), np.ones(6, int), 'valid')
    top[x] = np.argmax(run >= 6)
top = nd.grey_opening(top, size=7)  # thin bits of cloud touching a mountain

# ---- where the warm red rocks start in each column ----
warm = nd.gaussian_filter(R - B, 3) > 6
btop = np.zeros(W, int)
for x in range(W):
    run = np.convolve(warm[:, x].astype(int), np.ones(14, int), 'valid')
    btop[x] = np.argmax(run >= 13)
btop = np.maximum(nd.grey_closing(btop, size=25), top)

# ---- the picture without the ground strip: the sand plain carries on below CUT ----
pic = a.copy()
# plain sand: the colour of the last sand rows, smoothed sideways, getting a little deeper further down, with soft
# dune ridges (a light line over a shaded one) every few rows; 4 px steps like the picture's own pixels
base = nd.gaussian_filter1d(a[CUT - 20:CUT - 2].mean(0), 40, axis=0)
xs = np.arange(W)
for y in range(CUT - 2, H):
    d = y - (CUT - 2)
    blend = min(1, d / 6)
    col = base * (1 - 0.12 * min(1, d / 160))
    ridge = np.zeros(W)
    for k, (per, ph, amp) in enumerate([(34, 0, 7), (52, 13, 9), (71, 29, 6)]):
        # a gently wavy ridge line every `per` rows
        yy = (d + amp * np.sin(xs / (90 + 30 * k) + ph) + ph) % per
        ridge += np.where(yy < 4, 1.0, 0) - np.where((yy >= 4) & (yy < 12), 0.55, 0)
    col = col * (1 + 0.035 * ridge[:, None])
    col = col[(xs // 4) * 4]  # blocky like the picture's pixels
    pic[y] = pic[y] * (1 - blend) + col * blend

rows = np.arange(H)[:, None]


def save(name, rgb, alpha):
    out = np.zeros((H, W, 4), np.uint8)
    out[..., :3] = np.clip(rgb, 0, 255)
    out[..., 3] = np.clip(alpha * 255, 0, 255)
    Image.fromarray(out).save(ROOT + '/www/assets/background/desert_%s.webp' % name, lossless=True, quality=100, method=6)


# far: everything from the sky line down; under the red rocks it carries on with its own last colour,
# fading into the haze colour
far = pic.copy()
haze = np.median(np.concatenate([a[top[x] + 2:btop[x] - 1, x] for x in range(W) if btop[x] - top[x] > 6]), axis=0)
last = np.full((W, 3), np.nan)
for x in range(W):
    if btop[x] - top[x] > 3:
        last[x] = a[btop[x] - 2, x]
for ch in range(3):
    v = last[:, ch]
    ok = ~np.isnan(v)
    last[:, ch] = np.interp(np.arange(W), np.flatnonzero(ok), v[ok])
for x in range(W):
    y0 = btop[x] - 1
    ys = np.arange(y0, H)
    t = np.clip((ys - y0) / 80, 0, 1)[:, None]
    far[y0:, x] = last[x] * (1 - t) + haze * t
# a little warmer, to sit in the sunset light; the sky-blue edge pixels along the outline take the colour below
SUNSET_HAZE = np.array([214, 140, 170])
for x in range(W):
    for y in range(top[x], top[x] + 4):
        if far[y, x, 2] - far[y, x, 0] > 45:
            far[y, x] = far[top[x] + 4, x]
far = far * 0.65 + SUNSET_HAZE * 0.35
save('far', far, (rows >= top[None, :]).astype(float))

# big: from the red rocks' outline down (a 2 px soft edge), the picture as it is
yy = rows - btop[None, :]
save('big', pic, np.clip((yy + 1) / 2, 0, 1))

# front: the sand plain, fading in from FRONT
save('front', pic, np.clip((rows - FRONT) / FRONT_FADE, 0, 1) * np.ones((1, W)))
print('ok', haze)
