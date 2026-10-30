# Bat-style wings: Devil Wings (+ Tiny) and Vampire Wings (+ Tiny: black bones, red skin).
# Same canvas as the other wing strips (48x46 cells of 5 px = 240x230, at x -61, y -19 on the body),
# level with the shoulders. Each wing set has an idle cycle (slow, while worn) and a flap cycle (jumping).
import math, os
import numpy as np
from PIL import Image

PX, GW, GH = 5, 48, 46
OUT = 'bats'; os.makedirs(OUT, exist_ok=True)
def hx(h, a=255): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)] + [a], np.uint8)

STYLE = {
    # membrane [shadow, base, light, rim], bone [dark, base, light], outline
    'vampire': dict(mem=['#6e0a16', '#b3121f', '#e0303a', '#ff5a5a'], bone=['#050405', '#141114', '#3a3340'], out='#0a0506'),
    'devil':   dict(mem=['#1a0d22', '#341a44', '#4e2a63', '#d0283a'], bone=['#5a0a10', '#a5141f', '#e0363c'], out='#0a0508'),
}

def pip(x, y, poly):
    ins = False
    for k in range(len(poly)):
        (x1, y1), (x2, y2) = poly[k], poly[k - 1]
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1): ins = not ins
    return ins

def seg_d(px, py, a, b):
    ax, ay = a; bx, by = b
    vx, vy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy + 1e-9)))
    return math.hypot(px - ax - t * vx, py - ay - t * vy), t

def wing_cells(k, rot, sq, side, root):
    """One bat wing in grid cells: returns dict cell -> ('mem', panel) | ('bone', t)"""
    def P(x, y):   # local (x out, y down) * size, rotated up by rot, squeezed sideways -> grid
        x, y = x * k, y * k
        r = math.radians(rot)
        x, y = x * math.cos(r) + y * math.sin(r), -x * math.sin(r) + y * math.cos(r)
        return root[0] + side * x * sq, root[1] + y
    W = (7.5, -11.0)                                        # wrist, up high
    tips = [(17.5, -14.5), (20.5, -5.5), (17.5, 3.0), (10.0, 7.5)]
    back = (2.0, 5.0)
    # membrane outline: root, wrist, first tip, scallops between tips, back to the body
    pts = [(0, 0), W, tips[0]]
    chain = tips + [back]
    for a, b in zip(chain, chain[1:]):
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        # pull the middle in toward the wrist: a curved notch between the fingers
        dx, dy = W[0] - mx, W[1] - my; L = math.hypot(dx, dy)
        d = 0.34 * math.hypot(b[0] - a[0], b[1] - a[1])
        c = (mx + dx / L * d * 2, my + dy / L * d * 2)
        for s in [0.2, 0.4, 0.6, 0.8]:
            x = (1 - s) ** 2 * a[0] + 2 * (1 - s) * s * c[0] + s * s * b[0]
            y = (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * c[1] + s * s * b[1]
            pts.append((x, y))
        pts.append(b)
    poly = [P(*p) for p in pts]
    bones = [((0, 0), W, 1.15)] + [(W, t, 0.75) for t in tips]
    bones = [(P(*a), P(*b), w) for a, b, w in bones]
    claw = [P(W[0] - 0.4, W[1] - 1.0), P(W[0] - 1.6, W[1] - 2.6)]
    tipsP = [P(*t) for t in tips]
    out = {}
    for j in range(GH):
        for i in range(GW):
            x, y = i + 0.5, j + 0.5
            best = None
            for bi, (a, b, w) in enumerate(bones):
                d, t = seg_d(x, y, a, b)
                if d <= w * max(0.75, k ** 0.5) * (1.0 - 0.35 * t if bi else 1.0):
                    best = ('bone', bi)
                    break
            if best: out[(i, j)] = best; continue
            if pip(x, y, poly):
                # which panel between fingers (angle round the wrist)
                wx, wy = P(*W)
                ang = math.atan2(y - wy, (x - wx) * side)
                pan = sum(1 for t in tipsP if math.atan2(t[1] - wy, (t[0] - wx) * side) < ang)
                out[(i, j)] = ('mem', pan)
    for c in claw:
        out[(int(c[0]), int(c[1]))] = ('claw', 0)
    return out

def render(style, k, rot, sq, roots):
    S = STYLE[style]
    img = np.zeros((GH, GW, 4), np.uint8)
    for side, root in [(-1, roots[0]), (1, roots[1])]:
        cells = wing_cells(k, rot, sq, side, root)
        for (i, j), (kind, v) in cells.items():
            if not (0 <= i < GW and 0 <= j < GH): continue
            if kind == 'mem':
                up = cells.get((i, j - 1)); dn = cells.get((i, j + 1))
                c = S['mem'][1]
                if dn is None: c = S['mem'][3] if style == 'devil' else S['mem'][0]   # lower rim
                elif up and up[0] == 'bone': c = S['mem'][2]                        # light just under a bone
                elif dn and dn[0] == 'bone': c = S['mem'][0]                        # shade just above a bone
                else: c = S['mem'][1] if v % 2 == 0 else S['mem'][0]           # panels alternate light / dark
                img[j, i] = hx(c)
            elif kind == 'bone':
                up = cells.get((i, j - 1))
                img[j, i] = hx(S['bone'][2] if (up is None or up[0] != 'bone') else S['bone'][1])
            else:
                img[j, i] = hx('#e8e2d8' if style == 'vampire' else '#f0d070')
    a = img[..., 3] > 0
    o = np.zeros_like(a)
    o[1:] |= a[:-1]; o[:-1] |= a[1:]; o[:, 1:] |= a[:, :-1]; o[:, :-1] |= a[:, 1:]
    o &= ~a
    img[o] = hx(S['out'])
    return Image.fromarray(img, 'RGBA').resize((GW * PX, GH * PX), Image.NEAREST)

# idle while worn: a slow, small beat; flap while jumping: big beats
IDLE = [(0, 1.0), (3, 0.98), (6, 0.96), (3, 0.98), (0, 1.0), (-3, 1.0)]
FLAP = [(0, 1.0), (16, 0.94), (30, 0.86), (10, 0.92), (-16, 0.95), (-6, 0.98)]
SETS = {'tiny_devil': ('devil', 0.62, 28.5), 'devil': ('devil', 1.0, 28.0),
        'tiny_vampire': ('vampire', 0.62, 28.5), 'vampire': ('vampire', 1.0, 28.0)}
for name, (style, k, ry) in SETS.items():
    roots = ((21.5, ry), (26.5, ry))
    fr = [render(style, k, r, s, roots) for r, s in FLAP]   # one flap loop, standing and jumping
    for i, f in enumerate(fr): f.save(f'{OUT}/{name}_{i}.png')
    strip = Image.new('RGBA', (GW * PX * len(fr), GH * PX))
    for i, f in enumerate(fr): strip.paste(f, (i * GW * PX, 0))
    strip.save(f'{OUT}/wings_{name}.png')
print('ok')
