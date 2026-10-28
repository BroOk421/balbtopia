# Cuts the owner's Fire Dragon idle / roar sheets (2 rows x 6, smooth-upscaled pixel art on a see-through bg with
# a faint glow) back to game pixels, lines every frame up on its feet, and builds one strip:
# frames 0-5 = the old walking frames, 6-17 idle, 18-29 roar.  usage: dragon_cut.py old.png idle.png roar.png out.png
import sys, numpy as np
from PIL import Image
from scipy import ndimage

S = 3.5           # sheet px per game px (the sheets are ~3.5x pixel art; also the old dragon's height)
OLD_W = 128       # old strip frame width
FOOT = 2          # empty rows under the feet

def frames_of(path):
    im = Image.open(path).convert('RGBA')
    a = np.array(im)
    m = a[..., 3] >= 128
    lab, k = ndimage.label(ndimage.binary_dilation(m, iterations=4))
    sizes = ndimage.sum(m, lab, range(1, k + 1))
    keep = np.argsort(sizes)[::-1][:12]
    objs = ndimage.find_objects(lab)
    boxes = []
    for i in keep:
        sl = objs[i]
        boxes.append((sl[0].start, sl[1].start, sl[0].stop, sl[1].stop, i + 1))
    # reading order: rows (by top, split at the sheet's middle), then left to right
    H = a.shape[0]
    boxes.sort(key=lambda b: ((b[0] + b[2]) / 2 > H / 2, b[1]))
    out = []
    for y0, x0, y1, x1, li in boxes:
        c = a[y0:y1, x0:x1].copy()
        mine = (lab[y0:y1, x0:x1] == li) & m[y0:y1, x0:x1]
        c[..., 3] = np.where(mine, 255, 0)
        c[~mine, :3] = 0
        p = Image.fromarray(c, 'RGBA').convert('RGBa')
        w, h = round(c.shape[1] / S), round(c.shape[0] / S)
        p = p.resize((w, h), Image.BOX).convert('RGBA')
        q = np.array(p)
        q[..., 3] = np.where(q[..., 3] >= 128, 255, 0)
        q[q[..., 3] == 0] = 0
        out.append(q)
    return out

def anchor(q):
    ys, xs = np.nonzero(q[..., 3] > 100)
    bot = ys.max()
    feet = xs[ys >= bot - 5]
    return bot, feet.mean()

old = np.array(Image.open(sys.argv[1]).convert('RGBA'))
walk = [old[:, k * OLD_W:(k + 1) * OLD_W] for k in range(10)]
idle = frames_of(sys.argv[2])
roar = frames_of(sys.argv[3])
new = idle + roar

# where the old standing frames' feet are: the walking frames keep their place, the new ones go there too
oa = [anchor(walk[k]) for k in range(6, 10)]
ax_old = np.mean([a[1] for a in oa])
# canvas: wide / tall enough for everything
info = [(q, *anchor(q)) for q in new]
left = max([ax_old] + [ax for q, b, ax in info])
right = max([OLD_W - ax_old] + [q.shape[1] - ax for q, b, ax in info])
top = max([old.shape[0] - FOOT] + [b + 1 for q, b, ax in info])
CW = int(np.ceil(left + right)) + 2
CW += CW % 2
CH = int(top) + FOOT
AX = (CW - (left + right)) / 2 + left
print('canvas', CW, CH, 'anchor x', AX)

def place(q, b, ax):
    c = np.zeros((CH, CW, 4), np.uint8)
    dx = int(round(AX - ax)); dy = (CH - FOOT - 1) - b
    h, w = q.shape[:2]
    c[dy:dy + h, dx:dx + w] = np.where(q[..., 3:4] > 0, q, c[dy:dy + h, dx:dx + w])
    return c

# ---- feet (owner: give the new frames the old red dragon's feet). Same rule as pets.js bigClaws, which made the
# old dragon's feet: a sole row under the foot in a darker shade of the foot (not under the heel), light claws on
# the sole at the toe and 3 px behind it (6 px too on a wide foot), and one poking forward with a dark tip under it.
CLAW = (240, 232, 212); CLAW_DARK = (90, 70, 60)
def claws(q, runs):
    d = q.copy(); h, w = d.shape[:2]; put = []
    for s0, e in runs:
        yb = {}
        for c in range(s0, e + 1):
            ys = np.nonzero(d[:, c, 3] > 100)[0]
            yb[c] = ys.max() if len(ys) else -1
        for c in range(s0 + 1, e + 1):
            if yb[c] < 0: continue
            k = d[yb[c], c]
            put.append((c, yb[c] + 1, (k[0] * .45, k[1] * .4, k[2] * .45), False))
        for c in ([e, e - 3, e - 6] if e - s0 >= 11 else [e, e - 3]):
            if c > s0 and yb[c] >= 0: put.append((c, yb[c] + 1, CLAW, True))
        put.append((e + 1, yb[e], CLAW, False)); put.append((e + 1, yb[e] + 1, CLAW_DARK, False))
    for i, j, c, over in put:
        if i < 0 or i >= w or j < 0 or j >= h or (not over and d[j, i, 3] > 100): continue
        d[j, i, :3] = c; d[j, i, 3] = 255
    return d
def old_runs(q):
    # bigClaws' own search, for the old walking frames
    h, w = q.shape[:2]; yb = [-1] * w; runs = []
    for i in range(int(w * 0.28), int(w * 0.82)):
        ys = np.nonzero(q[:, i, 3] > 100)[0]
        if len(ys): yb[i] = ys.max()
    low = lambda i: h - 9 <= yb[i] < h - 1
    i = 0
    while i < w:
        if not low(i): i += 1; continue
        s0 = i
        while i + 1 < w and low(i + 1) and abs(yb[i + 1] - yb[s0]) <= 1: i += 1
        if 3 <= i - s0 + 1 <= 16: runs.append((s0, i))
        i += 1
    return runs
# the new frames' four feet, in canvas x (the same in every idle / roar frame: they are lined up on the feet)
NEW_FEET = [(50, 65), (67, 72), (74, 86), (88, 99)]

strip = []
for k in range(6):
    walk[k] = claws(walk[k], old_runs(walk[k]))
    q = walk[k]
    ys, xs = np.nonzero(q[..., 3] > 100)
    # same place as the old picture (bottom row of the old sheet = CH - FOOT - 1)
    strip.append(place(q, old.shape[0] - FOOT - 1, ax_old))
for q, b, ax in info:
    strip.append(claws(place(q, b, ax), NEW_FEET))
img = np.concatenate(strip, axis=1)
Image.fromarray(img, 'RGBA').save(sys.argv[4], optimize=True)
print('frames', len(strip), 'size', img.shape[1], img.shape[0])
