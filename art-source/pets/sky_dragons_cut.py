# Flying dragon pets (owner, Nov 1 2026): cuts the owner's two sheets of flying dragons (3 wing-beat frames each,
# upscaled pixel art; the PNGs are see-through, the glow round the dragons is half see-through) back to their own
# pixels (the dragon = alpha >= 128, exactly the owner's pixels and outline), lines the frames up on the head, and
# builds one strip per dragon for www/assets/pets/<id>.png (pets.js sky pets; they were rides for a while):
#   frames 0-8  = wing beat: each of the 3 frames 3 times (owner: "duplicate each para maging 3 frames")
#   frames 9-11 = breathing fire: the others get their mouth opened from frame 0 (jaw turned down in 3 steps)
# The Shadow Dragon's roar is the owner's roar picture at its OWN pixels (7 sheet px a pixel, finer than the
# sheet's 5), 3 frames in www/assets/pets/shadow_dragon_roar.png; pets.js draws it at its own scale, lined up on the
# eye (owner: it must look exactly like his picture; the first cut resampled it coarser and added an outline).
# Prints each dragon's numbers (strip px) for pets.js (PETS).
# usage: python3 sky_dragons_cut.py <art-source/pets dir> <www/assets/pets dir>
import sys, json, math, numpy as np
from collections import deque
from PIL import Image
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]


def down(im, box, step):
    """sheet px -> art px: the median of the middle of every block, on the grid phase whose blocks are the most even.
    Returns the colours and the mask (alpha >= 128: the glow round the dragons is only half see-through)"""
    a = np.asarray(im.convert('RGBA').crop(box)).astype(np.int32)
    H, W, _ = a.shape
    best = (1e9, 0, 0)
    if step == int(step):
        s = int(step)
        for px in range(s):
            for py in range(s):
                nx, ny = (W - px) // s, (H - py) // s
                sub = a[py:py + ny * s, px:px + nx * s].reshape(ny, s, nx, s, 4)
                v = sub.std(axis=(1, 3)).mean()
                if v < best[0]:
                    best = (v, px, py)
    _, px, py = best
    xs = np.arange(px + step / 2, W - step / 2, step)
    ys = np.arange(py + step / 2, H - step / 2, step)
    out = np.zeros((len(ys), len(xs), 4), np.int32)
    r = max(1, int(step * 0.3))
    for j, y in enumerate(ys):
        for i, x in enumerate(xs):
            out[j, i] = np.median(a[int(y) - r:int(y) + r + 1, int(x) - r:int(x) + r + 1].reshape(-1, 4), axis=0)
    m = out[..., 3] >= 128
    lab, k = ndimage.label(m)
    if k:  # specks
        sz = ndimage.sum(m, lab, range(1, k + 1))
        m = np.isin(lab, [i + 1 for i, v in enumerate(sz) if v >= 6])
    return out[..., :3], m


def key(a, T):
    """the background: flood fill from the edges through neighbours that differ less than T (the glow is smooth,
    the dragon's outline is a sharp edge)"""
    H, W, _ = a.shape
    bg = np.zeros((H, W), bool)
    q = deque()
    for i in range(W):
        for j in (0, H - 1):
            bg[j, i] = True
            q.append((j, i))
    for j in range(H):
        for i in (0, W - 1):
            bg[j, i] = True
            q.append((j, i))
    while q:
        j, i = q.popleft()
        for dj, di in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            y, x = j + dj, i + di
            if 0 <= y < H and 0 <= x < W and not bg[y, x] and np.abs(a[y, x] - a[j, i]).sum() < T:
                bg[y, x] = True
                q.append((y, x))
    m = ~bg
    # specks left from the glow
    lab, k = ndimage.label(m)
    if k:
        sizes = ndimage.sum(m, lab, range(1, k + 1))
        for n, sz in enumerate(sizes):
            if sz < 6:
                m[lab == n + 1] = False
    return m


def rgba(a, m):
    return np.dstack([np.clip(a, 0, 255), m * 255]).astype(np.uint8)


def add_outline(f, col=(14, 9, 20)):
    """the dark sheet's outline is as dark as its background, so it goes with it: put a 1 px outline back"""
    m = f[..., 3] > 0
    ring = ndimage.binary_dilation(m, structure=[[0, 1, 0], [1, 1, 1], [0, 1, 0]]) & ~m
    f = f.copy()
    f[ring] = (*col, 255)
    return f


def snout(f):
    m = f[..., 3] > 0
    xs = np.nonzero(m.any(axis=0))[0]
    x = xs.max()
    ys = np.nonzero(m[:, x])[0]
    return x, float(ys.mean())


def eye(f, hue, back=30, up=None):
    """the eye: the pixels nearest the eye colour in the front `back` columns (and, with `up`, rows from `up` above
    the snout tip to 2 under it: the blue dragons have blue spikes too)"""
    m = f[..., 3] > 0
    x1, y1 = snout(f)
    c = f[..., :3].astype(np.int32)
    d = np.abs(c - np.array(hue)).sum(axis=2)
    d[~m] = 9999
    d[:, : max(0, x1 - back)] = 9999
    if up is not None:
        d[: max(0, int(y1) - up)] = 9999
        d[int(y1) + 3:] = 9999
    ys, xs = np.nonzero(d <= d.min() + 40)
    return float(xs.mean()), float(ys.mean())


def place(frames, anchors, pad=2):
    """one canvas for all frames, each moved so its anchor lands on the same spot"""
    ax = max(a[0] for a in anchors)
    ay = max(a[1] for a in anchors)
    offs = [(int(round(ax - a[0])), int(round(ay - a[1]))) for a in anchors]
    W = max(f.shape[1] + o[0] for f, o in zip(frames, offs))
    H = max(f.shape[0] + o[1] for f, o in zip(frames, offs))
    big = np.zeros((len(frames), H, W, 4), np.uint8)
    for n, (f, (dx, dy)) in enumerate(zip(frames, offs)):
        big[n, dy:dy + f.shape[0], dx:dx + f.shape[1]] = f
    m = big[..., 3].max(axis=0) > 0
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min() - pad, ys.max() + pad + 1, xs.min() - pad, xs.max() + pad + 1
    out = np.zeros((len(frames), y1 - y0, x1 - x0, 4), np.uint8)
    sy0, sx0 = max(0, y0), max(0, x0)
    out[:, sy0 - y0:sy0 - y0 + min(H, y1) - sy0, sx0 - x0:sx0 - x0 + min(W, x1) - sx0] = big[:, sy0:min(H, y1), sx0:min(W, x1)]
    return out, (ax - x0, ay - y0), offs, (x0, y0)


def open_jaw(f, hue, ang, mouth=(70, 14, 30), inside=(150, 40, 60)):
    """frame 0 with the mouth open: the lower jaw (the head's rows under the snout tip, in front of the eye) turned
    down round a hinge behind the eye; the gap is the mouth (dark, a lighter tongue line), outlined"""
    m = f[..., 3] > 0
    sx, sy = snout(f)
    ex, ey = eye(f, hue, 14, 9)
    hy = int(round(sy))  # the mouth line: under the snout tip's row
    hx = int(round(ex)) - 1  # the hinge, under the eye
    H, W = m.shape
    jaw = np.zeros_like(m)
    jaw[hy + 1:min(H, hy + 5), hx:] = m[hy + 1:min(H, hy + 5), hx:]
    # only what hangs together with the front of the head (not the neck / legs under it)
    lab, _ = ndimage.label(jaw)
    tips = set(lab[hy + 1:min(H, hy + 5), max(hx, sx - 4):sx + 1].ravel().tolist()) - {0}
    jaw = np.isin(lab, list(tips)) if tips else jaw
    hy += 1
    out = f.copy()
    out[jaw] = 0
    pad = 8
    big = np.zeros((H + pad, W, 4), np.uint8)
    big[:H] = out
    c, s = math.cos(ang), math.sin(ang)
    # the mouth: the wedge between the mouth line and the turned jaw's top
    jx = np.nonzero(jaw.any(axis=0))[0]
    if len(jx):
        for x in range(hx, jx.max() + 1):
            dx = x - hx
            ytop = hy + dx * math.tan(ang)
            for y in range(hy, int(ytop) + 1):
                if 0 <= y < H + pad and not big[y, x, 3]:
                    big[y, x] = (*mouth, 255)
            yt = int(round(hy + dx * math.tan(ang) * 0.55))
            if dx > 2 and 0 <= yt < H + pad and tuple(big[yt, x, :3]) == mouth:
                big[yt, x] = (*inside, 255)
    # the jaw itself, turned (inverse mapping, nearest pixel)
    ys, xs = np.nonzero(jaw)
    if len(xs):
        for y in range(hy, H + pad):
            for x in range(hx, W):
                rx, ry = x - hx, y - hy
                ox = int(round(hx + rx * c + ry * s))
                oy = int(round(hy - rx * s + ry * c))
                if 0 <= oy < H and 0 <= ox < W and jaw[oy, ox]:
                    big[y, x] = f[oy, ox]
    # outline the mouth where it meets the air
    mm = np.all(big[..., :3] == mouth, axis=2) & (big[..., 3] > 0)
    air = big[..., 3] == 0
    edge = ndimage.binary_dilation(mm, structure=[[0, 1, 0], [1, 1, 1], [0, 1, 0]]) & air
    big[edge] = (16, 10, 18, 255)
    return big, (hx, hy)


def strip(frames):
    n, H, W, _ = frames.shape
    s = np.zeros((H, W * n, 4), np.uint8)
    for k in range(n):
        s[:, k * W:(k + 1) * W] = frames[k]
    return s


info = {}
# ---- the four on the first sheet: rows bone, glacier (ice blue), pearl (white), jade (green); 3 columns ----
sheet = Image.open(f'{SRC}/sky_dragons_sheet.png')
ROWS = [0, 250, 512, 760, 1024]
EYES = {'bone_dragon': (200, 40, 200), 'glacier_dragon': (60, 150, 230), 'pearl_dragon': (60, 150, 230), 'jade_dragon': (60, 150, 230)}
for r, pid in enumerate(['bone_dragon', 'glacier_dragon', 'pearl_dragon', 'jade_dragon']):
    fl = []
    for c in range(3):
        a, m = down(sheet, (c * 512, ROWS[r], c * 512 + 512, ROWS[r + 1]), 4)
        fl.append(rgba(a, m))
    roar = [open_jaw(fl[0], EYES[pid], math.radians(d))[0] for d in (12, 20, 26)]
    frames = [fl[0]] * 3 + [fl[1]] * 3 + [fl[2]] * 3 + roar
    anchors = [snout(f) for f in fl]
    anchors = [anchors[0]] * 3 + [anchors[1]] * 3 + [anchors[2]] * 3 + [anchors[0]] * 3  # the roars are frame 0
    out, (ax, ay), offs, _ = place(frames, anchors)
    hinge = open_jaw(fl[0], EYES[pid], 0.5)[1]
    info[pid] = {'w': out.shape[2], 'h': out.shape[1], 'mouth': [round(ax + 1), round(ay + 3)], 'len': int((out[0, ..., 3] > 0).any(axis=0).sum())}
    Image.fromarray(strip(out), 'RGBA').save(f'{OUT}/{pid}.png')

# ---- the Shadow Dragon: its own sheet (3 frames) and the roar picture ----
sh = Image.open(f'{SRC}/shadow_dragon_sheet.png')
fl = []
for box in [(0, 260, 530, 740), (520, 260, 1040, 740), (1030, 260, 1536, 740)]:
    a, m = down(sh, box, 5)
    fl.append(rgba(a, m))
RED = (230, 40, 70)
anchors = [eye(f, RED) for f in fl]
frames = [fl[0]] * 3 + [fl[1]] * 3 + [fl[2]] * 3 + [fl[0]] * 3  # (9-11 unused: its roar has its own picture)
out, (ax, ay), offs, _ = place(frames, [anchors[0]] * 3 + [anchors[1]] * 3 + [anchors[2]] * 3 + [anchors[0]] * 3)
Image.fromarray(strip(out), 'RGBA').save(f'{OUT}/shadow_dragon.png')
ro = Image.open(f'{SRC}/shadow_dragon_roar.png')
a, m = down(ro, (0, 0, 1536, 1024), 7)
roar = rgba(a, m)
ys, xs = np.nonzero(m)
roar = roar[ys.min() - 1:ys.max() + 2, xs.min() - 1:xs.max() + 2]
rout = np.stack([roar] * 3)
Image.fromarray(strip(rout), 'RGBA').save(f'{OUT}/shadow_dragon_roar.png')
re = eye(roar, RED)
rs = snout(roar)
info['shadow_dragon'] = {'w': out.shape[2], 'h': out.shape[1], 'eye': [round(ax, 1), round(ay, 1)], 'len': int((out[0, ..., 3] > 0).any(axis=0).sum()),
                         'roar': {'w': roar.shape[1], 'h': roar.shape[0], 'eye': [round(re[0], 1), round(re[1], 1)], 'snout': [int(rs[0]), round(rs[1], 1)],
                                  'len': int((roar[..., 3] > 0).any(axis=0).sum())}}
print(json.dumps(info))
