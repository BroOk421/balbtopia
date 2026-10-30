# Pixel-art angel wings, drawn on a coarse grid (big pixels) then scaled up with nearest-neighbour.
# Canvas matches the game's wing strips: 240 x 230, placed at x -61, y -19 on the 118x215 body.
import math, sys, os
import numpy as np
from PIL import Image

PX = 5                      # one art pixel = 5 game pixels (bigger, chunkier pixels)
GW, GH = 48, 46             # grid size -> 240 x 230
OUT='cher'
os.makedirs(OUT, exist_ok=True)

def hexc(h):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)

# palettes: outline, deep shadow, shadow, base, light, highlight
PAL = {
    'white':  ['#3b3f5c', '#8f98bd', '#b9c2df', '#e3e8f7', '#f7f9ff', '#ffffff'],
    'gold':   ['#5a3412', '#b86b16', '#e0952a', '#f6c04a', '#ffe08a', '#fff6c8'],
    'pink':   ['#5c2f4c', '#c27aa6', '#e2a3c6', '#f6cde2', '#fde8f2', '#ffffff'],
    'sky':    ['#24365c', '#6f93c9', '#97b8e6', '#c7dcf7', '#e8f2ff', '#ffffff'],
    'pearl':  ['#3d3550', '#9c8fb8', '#c4b8da', '#e9e2f5', '#f8f4ff', '#ffffff'],
    'warm':   ['#4a3a32', '#b3a08c', '#d6c6b2', '#f3e9dc', '#fffaf2', '#ffffff'],
}

class Grid:
    def __init__(s):
        s.c = np.zeros((GH, GW, 4), np.uint8)
        s.z = np.full((GH, GW), -1.0)      # painter order
    def put(s, x, y, col, z=0):
        if 0 <= x < GW and 0 <= y < GH and z >= s.z[y, x]:
            s.c[y, x] = col; s.z[y, x] = z

ROUND = [False]
def feather(g, base, ang, length, width, pal, z, tip=None, sharp=0.55, side=1):
    """A feather from base, pointing at angle ang (deg, 0=right, 90=down), rounded/pointed tip.
    Shaded: the lower/back half darker, a soft lighter stripe on top, a line around it."""
    bx, by = base
    dx, dy = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    nx, ny = -dy, dx                       # normal
    P = [hexc(c) for c in pal]
    T = [hexc(c) for c in tip] if tip else None
    r = int(length + width + 2)
    for y in range(int(by) - r, int(by) + r + 1):
        for x in range(int(bx) - r, int(bx) + r + 1):
            px, py = x + 0.5 - bx, y + 0.5 - by
            t = (px * dx + py * dy) / length
            if t < -0.15 or t > 1.0: continue
            u = (px * nx + py * ny)
            # width profile: full near base, tapering to a point (sharp) or a round tip
            tt = max(t, 0)
            w = width * (1 - tt ** 2.2 * (1 - (1 - sharp) * 0.4)) * (1 if tt < 0.7 else math.sqrt(max(0, (1 - tt) / 0.3)) ** sharp)
            if t < 0: w = width * math.sqrt(max(0, 1 - (t / 0.15) ** 2))
            if ROUND[0] and t >= 0:
                # round end: full width, then a half-circle cap (no pointy tips)
                rem = length * (1 - tt)
                w = width if rem >= width else width * math.sqrt(max(0, 1 - ((width - rem) / width) ** 2))
            if abs(u) > w: continue
            edge = abs(u) > w - 1.0 or t > 1.0 - 1.05 / length
            pal_ = T if (T and t > 0.62) else P
            if edge:
                col = pal_[1]
            else:
                s = u * side / max(w, 0.01)             # -1 .. 1 across
                if s > 0.35: col = pal_[2]
                elif s < -0.45 and t < 0.85: col = pal_[4]
                else: col = pal_[3]
            g.put(x, y, col, z + t * 0.01)

def lerp(a, b, t): return a + (b - a) * t

def wing(g, root, side, spec):
    """One wing: rows of feathers along an arched leading edge. side=+1 right, -1 left."""
    rx, ry = root
    span, lift = spec['span'], spec['lift']
    pal, tip = PAL[spec['pal']], (PAL[spec['tip']] if spec.get('tip') else None)
    # leading edge: quadratic from root, up over the 'elbow', out to the wrist/tip
    def edge(s):
        cx, cy = span * 0.35, -lift * spec.get('arch', 1.25)
        ex, ey = span, -lift * spec.get('end', 1.0)
        x = (1 - s) ** 2 * 0 + 2 * (1 - s) * s * cx + s * s * ex
        y = (1 - s) ** 2 * 0 + 2 * (1 - s) * s * cy + s * s * ey
        r = math.radians(spec.get('rot', 0))
        x, y = x * math.cos(r) + y * math.sin(r), -x * math.sin(r) + y * math.cos(r)
        x *= spec.get('sq', 1.0)
        return rx + side * x, ry + y
    rows = spec['rows']   # list of (count, length_scale, width, zlayer, palette_shift)
    for li, (n, Ls, wd, shade) in enumerate(rows):
        for i in range(n):
            s = lerp(spec.get('s0', 0.05), spec.get('s1', 1.0), i / max(1, n - 1))
            bx, by = edge(s)
            # direction: hangs down near the shoulder, sweeps out to the side at the tip
            a = lerp(spec['a0'], spec['a1'], s ** spec.get('ap', 1.0)) - spec.get('rot', 0)
            if spec.get('sq', 1.0) != 1.0:
                ca, sa = math.cos(math.radians(a)) * spec['sq'], math.sin(math.radians(a))
                a = math.degrees(math.atan2(sa, ca))
            ang = a if side > 0 else 180 - a
            L = Ls * lerp(spec['L0'], spec['L1'], s ** 1.2) * (spec.get('Lshape', lambda s: 1)(s))
            p = pal if shade == 0 else [pal[0]] + pal[1:][:] if shade == 0 else pal
            # outer rows a touch darker so the layers read
            if shade == 1: p = [pal[0], pal[1], pal[1], pal[2], pal[3], pal[4]]
            feather(g, (bx, by), ang, L, wd, p, z=li * 10 + (n - i) * 0.1 if spec.get('outer_on_top') else li * 10 + i * 0.1,
                    tip=(tip if (tip and li == 0) else None), sharp=spec.get('sharp', 0.55), side=side if spec.get('flip_shade') else -side * 0 + 1)
    # the arm / covert blob along the leading edge
    P = [hexc(c) for c in pal]
    for k in range(60):
        s = k / 59
        x, y = edge(s * spec.get('arm', 0.95))
        rad = lerp(spec['arm_w0'], spec['arm_w1'], s)
        for yy in range(int(y - rad - 1), int(y + rad + 2)):
            for xx in range(int(x - rad - 1), int(x + rad + 2)):
                d = math.hypot(xx + 0.5 - x, yy + 0.5 - y)
                if d <= rad:
                    col = P[4] if (yy + 0.5 - y) < -rad * 0.2 else P[3]
                    if d > rad - 0.9 and (yy + 0.5 - y) > 0: col = P[2]
                    g.put(xx, yy, col, 50)

def outline(g, colhex, glow=None):
    a = g.c[..., 3] > 0
    o = np.zeros_like(a)
    o[1:] |= a[:-1]; o[:-1] |= a[1:]; o[:, 1:] |= a[:, :-1]; o[:, :-1] |= a[:, 1:]
    o &= ~a
    g.c[o] = hexc(colhex)
    if glow:
        a2 = g.c[..., 3] > 0
        o2 = np.zeros_like(a2)
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)]:
            o2 |= np.roll(np.roll(a2, dy, 0), dx, 1)
        o2 &= ~a2
        c = hexc(glow); g.c[o2] = (c[0], c[1], c[2], 110)

def sparkle(g, x, y, col, big=False):
    c = hexc(col)
    pts = [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)]
    if big: pts += [(2, 0), (-2, 0), (0, 2), (0, -2)]
    for dx, dy in pts:
        if 0 <= x + dx < GW and 0 <= y + dy < GH and g.c[y + dy, x + dx, 3] == 0:
            g.c[y + dy, x + dx] = c if (dx, dy) != (0, 0) else hexc('#ffffff')

def halo_ring(g, cx, cy, rx, ry, col):
    c = hexc(col); light = hexc('#fffbe0')
    for k in range(200):
        a = 2 * math.pi * k / 200
        x, y = int(round(cx + rx * math.cos(a))), int(round(cy + ry * math.sin(a)))
        if 0 <= x < GW and 0 <= y < GH:
            g.c[y, x] = light if math.sin(a) < -0.3 else c

def save(g, name):
    im = Image.fromarray(g.c, 'RGBA').resize((GW * PX, GH * PX), Image.NEAREST)
    im.save(f'{OUT}/{name}.png')
    return im


def pair(spec, extra=None, outline_col=None, glow=None, roots=((21, 26), (27, 26))):
    g = Grid()
    for side, root in [(-1, roots[0]), (1, roots[1])]:
        wing(g, root, side, spec)
    if ROUND[0]:
        # round off corners of the silhouette: drop cells with 2 or fewer filled neighbours (4-way), twice
        for _ in range(2):
            a = g.c[..., 3] > 0
            n = np.zeros(a.shape, int)
            n[1:] += a[:-1]; n[:-1] += a[1:]; n[:, 1:] += a[:, :-1]; n[:, :-1] += a[:, 1:]
            g.c[a & (n <= 2)] = 0
    outline(g, outline_col or PAL[spec['pal']][0], glow)
    if extra: extra(g)
    return g
