# Cuts the owner's Octopus Beard and shipwreck pictures (Nov 10 2026) into the game's assets/sea/ pictures.
# kraken_beard_sheet.png: the 4 animation frames on the bottom row -> assets/sea/kraken_beard.png (4 frames side by
#   side, all the same size, lined up on the octopus's head: its dark middle, so it doesn't jump between frames).
# shipwreck_sheet.png: the ship, the right-hand torn flag on its mast, and four corals -> assets/sea/*.png.
# Run from this folder: python3 sea_cut.py
from PIL import Image
import numpy as np
from scipy import ndimage

OUT = '../../www/assets/sea/'


def parts(im, box, keep):
    """the pieces (alpha > 40, not grown) inside box whose centre passes keep(cx, cy), cut out and trimmed"""
    A = np.array(im)
    x0, y0, x1, y1 = box
    sub = A[y0:y1, x0:x1].copy()
    m = sub[:, :, 3] > 40
    lab, n = ndimage.label(m)
    ok = np.zeros_like(m)
    for k in range(1, n + 1):
        ys, xs = np.nonzero(lab == k)
        if len(xs) < 30:
            continue
        if keep(x0 + xs.mean(), y0 + ys.mean()):
            ok |= lab == k
    sub[~ok] = 0
    ys, xs = np.nonzero(ok)
    return Image.fromarray(sub[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1])


def half(img, k=0.5):
    return img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)


# ---- the octopus: frames left to right on the bottom row ----
K = Image.open('kraken_beard_sheet.png').convert('RGBA')
boxes = [(20, 730, 370, 1000), (390, 725, 750, 1000), (780, 710, 1145, 1000), (1148, 695, 1525, 1015)]
frames = [parts(K, b, lambda cx, cy: True) for b in boxes]
# line them up on the octopus's HEAD (owner: "it moves up and down: fix it at the top of the mouth"): the head is the
# big dark mass in the middle; its top = the first row where the dark pixels fill a good part of a band round the
# frame's middle (a tentacle curling up above it is too thin to count); x = the middle of the dark pixels just under it
anch = []
for f in frames:
    a = np.array(f).astype(int)
    dark = (a[:, :, 3] > 120) & (a[:, :, :3].sum(2) < 170)
    W0 = a.shape[1]
    band = dark[:, int(W0 * 0.3): int(W0 * 0.7)]
    rows = band.sum(1) > band.shape[1] * 0.35
    top = int(np.argmax(rows))
    ys, xs = np.nonzero(dark[top: top + 30, int(W0 * 0.2): int(W0 * 0.8)])
    anch.append((xs.mean() + int(W0 * 0.2), top))
L = max(ax for ax, _ in anch)
R = max(f.width - ax for f, (ax, _) in zip(frames, anch))
T = max(ay for _, ay in anch)
B = max(f.height - ay for f, (_, ay) in zip(frames, anch))
W, H = int(L + R) + 2, int(T + B) + 2
strip = Image.new('RGBA', (W * 4, H))
for k, (f, (ax, ay)) in enumerate(zip(frames, anch)):
    strip.alpha_composite(f, (k * W + int(L - ax), int(T - ay)))
strip = half(strip, 0.5)
strip.save(OUT + 'kraken_beard.png')
print('kraken', strip.size, 'frame', strip.width // 4, strip.height, 'head anchor', round(L * 0.5), round(T * 0.5))

# ---- the shipwreck sheet ----
S = Image.open('shipwreck_sheet.png').convert('RGBA')
ship = parts(S, (0, 0, 840, 570), lambda cx, cy: cx < 770)
half(ship).save(OUT + 'shipwreck.png')
flag = parts(S, (1268, 0, 1536, 392), lambda cx, cy: cx > 1290)
half(flag).save(OUT + 'ship_flag.png')
for name, box in [('coral_orange', (141, 817, 252, 910)), ('coral_pink', (263, 834, 335, 910)), ('coral_teal', (353, 900, 438, 1005)), ('coral_purple', (273, 915, 355, 1004))]:
    c = parts(S, box, lambda cx, cy, b=box: b[0] + 8 < cx < b[2] - 8 or True)
    # (only the biggest piece: a neighbour's edge can poke into the box)
    a = np.array(c)
    lab, n = ndimage.label(a[:, :, 3] > 40)
    if n > 1:
        big = 1 + np.argmax([(lab == k).sum() for k in range(1, n + 1)])
        a[lab != big] = 0
        ys, xs = np.nonzero(a[:, :, 3] > 0)
        c = Image.fromarray(a[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1])
    half(c, 0.6).save(OUT + name + '.png')
for n in ['shipwreck', 'ship_flag', 'coral_orange', 'coral_pink', 'coral_teal', 'coral_purple']:
    print(n, Image.open(OUT + n + '.png').size)
