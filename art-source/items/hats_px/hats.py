# Pixel-art hats on the body's own pixel grid: 1 art cell = 5 body px, cell (i, j) covers body px (2+5i, 2+5j).
# Shapes are rasterised on cell centres, shaded per layer (light from the top left), then the whole hat gets the
# game's dark outline. Output: 338x325 art-canvas PNGs (body at 110,110), one per frame, plus cells.json for the game.
import math, json, os, sys
import numpy as np
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
os.makedirs(OUT, exist_ok=True)
K = '#120c0c'
I0, J0, NI, NJ = -22, -22, 67, 65          # cell range kept (covers the whole art canvas)

def hx(h, a=255):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

class Hat:
    def __init__(s):
        s.col = {}          # (i,j) -> rgba
        s.solid = set()     # cells that get the outline
        s.layers = []
    # ---- shapes -> cell sets
    @staticmethod
    def rect(i0, j0, i1, j1): return {(i, j) for i in range(i0, i1 + 1) for j in range(j0, j1 + 1)}
    @staticmethod
    def ell(cx, cy, rx, ry, jmax=None, jmin=None):
        out = set()
        for i in range(int(cx - rx) - 1, int(cx + rx) + 2):
            for j in range(int(cy - ry) - 1, int(cy + ry) + 2):
                if ((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2 <= 1.0 and (jmax is None or j <= jmax) and (jmin is None or j >= jmin):
                    out.add((i, j))
        return out
    @staticmethod
    def poly(pts):
        out = set()
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        for i in range(int(min(xs)) - 1, int(max(xs)) + 2):
            for j in range(int(min(ys)) - 1, int(max(ys)) + 2):
                x, y = i, j; inside = False
                for k in range(len(pts)):
                    (x1, y1), (x2, y2) = pts[k], pts[k - 1]
                    if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1): inside = not inside
                if inside: out.add((i, j))
        return out
    # ---- painting
    def layer(s, cells, pal, solid=True, alpha=255, light=True):
        """pal = [shadow, base, light] (+ optional highlight). Edges facing up/left get light, down/right shadow."""
        cells = set(cells)
        for (i, j) in cells:
            up = (i, j - 1) in cells; lf = (i - 1, j) in cells
            dn = (i, j + 1) in cells; rt = (i + 1, j) in cells
            c = pal[1]
            if light and (not up or not lf): c = pal[2]
            if not dn or not rt: c = pal[0]
            if light and len(pal) > 3 and not up and not lf: c = pal[3]
            s.col[(i, j)] = hx(c, alpha)
            if solid: s.solid.add((i, j))
            else: s.solid.discard((i, j))
        return cells
    def fill(s, cells, c, alpha=255, solid=True):
        for p in cells:
            s.col[p] = hx(c, alpha)
            if solid: s.solid.add(p)
    def px(s, pts, c, alpha=255):
        for p in pts: s.col[p] = hx(c, alpha); s.solid.add(p)
    def outline(s, col=K, extra=()):
        o = set()
        for (i, j) in s.solid:
            for d in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                q = (i + d[0], j + d[1])
                if q not in s.solid and q not in s.col: o.add(q)
        for q in o: s.col[q] = hx(col)
        return o
    def glow(s, cells, c, alpha):
        for p in cells:
            if p not in s.col: s.col[p] = hx(c, alpha)
    def image(s):
        im = np.zeros((325, 338, 4), np.uint8)
        for (i, j), c in s.col.items():
            x, y = 112 + 5 * i, 112 + 5 * j
            if 0 <= x and x + 5 <= 338 and 0 <= y and y + 5 <= 325: im[y:y + 5, x:x + 5] = c
        return Image.fromarray(im, 'RGBA')
    def cells(s):
        return [[i, j, '#%02x%02x%02x' % c[:3], c[3]] for (i, j), c in sorted(s.col.items())]

H = {}
# ------------------------------------------------------------------ Top Hat
def top_hat(f=0):
    h = Hat()
    h.layer(h.ell(11, 0.6, 9.8, 1.7), ['#0b0a0e', '#1f1d26', '#3a3746', '#55516a'])          # brim
    crown = h.rect(6, -10, 16, -1)
    h.layer(crown, ['#0e0d12', '#22202a', '#34313f'])
    h.fill({(7, j) for j in range(-9, -3)}, '#4a4658')                                       # shine stripe
    h.fill({(8, j) for j in range(-9, -3)}, '#34313f')
    h.layer(h.rect(6, -4, 16, -2), ['#8a1218', '#c8232b', '#ef4a4f'])                          # red band
    h.px([(10, -4), (11, -4), (12, -4), (10, -3), (12, -3), (10, -2), (11, -2), (12, -2)], '#f5c542')  # buckle
    h.px([(11, -3)], '#7a4d0a')
    h.outline(); return h
# ------------------------------------------------------------------ Santa Hat
def santa_hat(f=0):
    h = Hat()
    cone = h.poly([(2.5, 1), (20.5, 1), (20, -4), (17.5, -8.5), (14, -10), (9, -8), (5, -4)])
    flop = h.poly([(15, -10.2), (19, -10.5), (22.5, -8), (24, -5.5), (22, -5), (19.5, -7)])
    h.layer(cone | flop, ['#8e1414', '#d22626', '#f25454', '#ff8a7a'])
    h.fill({(15, -5), (16, -4), (17, -3), (16, -6), (13, -2), (14, -1)}, '#a81b1b')         # fold creases
    h.layer(h.ell(23.5, -4.2, 2.4, 2.4), ['#c9cfdc', '#f4f6fb', '#ffffff'])                    # pom-pom
    band = h.rect(2, 0, 20, 2) | {(1, 1), (21, 1)}
    h.layer(band, ['#c3c9d6', '#eef1f7', '#ffffff'])
    h.fill({(4, 1), (8, 2), (12, 1), (16, 2), (19, 1), (6, 0), (14, 0)}, '#d6dbe5')           # fur tufts
    h.outline(); return h
# ------------------------------------------------------------------ Ski Cap
def ski_cap(f=0):
    h = Hat()
    dome = h.ell(11, 1.5, 9.6, 9.2, jmax=0)
    h.layer(dome, ['#1d3d8f', '#2f5fcf', '#5b8ef0', '#8db4ff'])
    for i in range(3, 20, 3):                                                               # knit ribs
        h.fill({(i, j) for j in range(-8, 1) if (i, j) in dome and (i, j - 1) in dome}, '#2650b0')
    for (i, j) in list(dome):                                                               # a white zig-zag stripe
        if j == -4 and i % 2 == 0 or j == -3 and i % 2 == 1: h.fill({(i, j)}, '#e8eefc')
    h.layer(h.rect(2, 0, 20, 2), ['#b8c3d8', '#e9eef7', '#ffffff'])                             # cuff
    h.fill({(i, 1) for i in range(3, 20, 2)}, '#cdd5e4')
    h.layer(h.ell(11, -8.6, 2.5, 2.3), ['#c9cfdc', '#f4f6fb', '#ffffff'])                       # pom-pom
    h.fill({(10, -9), (12, -8)}, '#dfe3ec')
    h.outline(); return h
# ------------------------------------------------------------------ Rooster Hat
def rooster_hat(f=0):
    h = Hat()
    comb = h.poly([(6, -3), (7, -8), (9, -5), (11, -9.5), (13, -5), (15, -8), (16.5, -3)])
    h.layer(comb, ['#a3131a', '#e0262e', '#ff5a5a'])
    head = h.ell(11.5, 3, 10.5, 7.2, jmax=2)
    h.layer(head, ['#b9bfcc', '#eceff5', '#ffffff'])
    for j in (-1, 1):                                                                       # feather scallops
        for i in range(2, 22):
            if (i, j) in head and (i + (j > 0)) % 3 == 0: h.fill({(i, j), (i + 1, j)}, '#cfd4df')
    h.layer(h.poly([(20.5, -0.5), (25.5, 0.6), (20.5, 1.8)]), ['#c27a06', '#f5a50f', '#ffd25a'])  # beak
    h.layer(h.ell(21, 3.4, 1.0, 1.6), ['#a3131a', '#e0262e', '#ff5a5a'])                          # wattle
    h.px([(18, -2)], '#120c0c'); h.px([(17, -2)], '#ffffff')                                  # eye
    h.outline(); return h
# ------------------------------------------------------------------ Baseball Cap
def baseball_cap(f=0):
    h = Hat()
    h.layer(h.poly([(16, 0.5), (26, 0.8), (26.5, 2.4), (16, 2.4)]), ['#7d1212', '#a91c1c', '#c83a3a'])  # visor
    dome = h.ell(11, 2, 9.6, 7.6, jmax=1)
    h.layer(dome, ['#8e1414', '#d22626', '#f25454', '#ff8a7a'])
    for (i, j) in dome:                                                                     # panel seams
        if i in (7, 15) and j < 0 and (i, j - 1) in dome: h.fill({(i, j)}, '#a81b1b')
    h.px([(10, -6), (11, -6), (12, -6)], '#ffffff'); h.px([(11, -7)], '#e7e9f0')            # button
    h.fill({(i, 1) for i in range(2, 21)} & dome, '#a81b1b')                                # sweatband edge
    h.outline(); return h
# ------------------------------------------------------------------ Bowler (Old-Timey Hat)
def old_timey_hat(f=0):
    h = Hat()
    h.layer(h.ell(11, 1, 10, 1.6), ['#3e2610', '#6b4420', '#8f6034'])                         # brim
    dome = h.ell(11, 0, 7, 6.6, jmax=0)
    h.layer(dome, ['#4a2e14', '#7a4f26', '#a06a38', '#c38a52'])
    h.layer(h.rect(4, -1, 18, 0) & dome, ['#24160a', '#35210f', '#4a2e16'])                  # band
    h.px([(7, -1)], '#8f6034')                                                              # little bow
    h.outline(); return h
# ------------------------------------------------------------------ Frog Hat
def froghat(f=0):
    h = Hat()
    body = h.ell(11, 3.5, 10.3, 7, jmax=2)
    h.layer(body, ['#2d7a22', '#4caf35', '#79d65a', '#a6ef86'])
    for cx in (5.5, 16.5):
        e = h.ell(cx, -3.2, 2.9, 2.7)
        h.layer(e, ['#2d7a22', '#4caf35', '#79d65a'])
        h.fill(h.ell(cx + 0.3, -3, 1.8, 1.7), '#ffffff')
        h.px([(int(cx) + 1, -3), (int(cx) + 1, -2)], '#120c0c')
        h.px([(int(cx), -4)], '#ffffff')
    h.fill({(i, 1) for i in range(5, 18)}, '#2d7a22')                                       # mouth line
    h.fill({(4, 1), (18, 1)}, '#2d7a22'); h.fill({(3, 0), (19, 0)}, '#2d7a22')
    h.fill({(7, -1), (15, -1)}, '#f28aa0')                                                  # cheeks
    h.outline(); return h
# ------------------------------------------------------------------ Fire Head (4 frames)
def hot_head(f=0):
    h = Hat()
    ph = f * 1.7
    def heights(scale, off):
        return {i: off + scale * (5.5 + 2.6 * math.sin(i * 1.3 + ph) + 1.8 * math.sin(i * 0.55 - ph * 1.3) + (2 if 6 <= i <= 16 else 0))
                for i in range(1, 23)}
    def flame(hs, i0, i1, jb):
        cells = set()
        for i in range(i0, i1 + 1):
            top = jb - int(round(hs[i]))
            for j in range(top, jb + 1): cells.add((i, j))
        return cells
    outer = flame(heights(1.0, 1.5), 1, 21, 3)
    mid = flame(heights(0.7, 0), 3, 19, 3)
    core = flame(heights(0.38, 0), 6, 16, 3)
    h.layer(outer, ['#9e1608', '#e0300f', '#ff5a1f'])
    h.layer(mid, ['#e0500f', '#ff8a1a', '#ffb13a'], light=False)
    h.layer(core, ['#ffc23a', '#ffe36a', '#fff6c0'], light=False)
    h.outline('#5a0d04')
    for k in range(3):                                                                      # rising sparks
        i = 4 + (k * 7 + f * 3) % 15; j = -9 - ((f + k * 2) % 4) * 2
        if (i, j) not in h.col: h.col[(i, j)] = hx('#ffd23f')
    return h
# ------------------------------------------------------------------ Green Visor (see-through)
def gamblers_visor(f=0):
    h = Hat()
    band = h.rect(0, 4, 21, 5)
    h.layer(band, ['#1d6b2c', '#2f9c40', '#5fd36f'], alpha=200)
    brim = h.poly([(19.5, 3.6), (28.5, 5.2), (28.5, 7.2), (19.5, 6.2)])
    h.layer(brim, ['#1a5f27', '#2c8f3b', '#58c868'], alpha=170)
    h.fill({(i, 5) for i in range(1, 21, 4)}, '#e9f7a8', alpha=220)                       # stitch dots
    h.outline('#0e3a16'); return h
# ------------------------------------------------------------------ TV Head
def tv_head(f=0):
    h = Hat()
    for (a, b) in [((6, -3), (3, -9)), ((16, -3), (19, -9))]:                               # antennas
        n = 7
        for k in range(n):
            t = k / (n - 1); h.px([(round(a[0] + (b[0] - a[0]) * t), round(a[1] + (b[1] - a[1]) * t))], '#9aa0ad')
        h.layer(h.ell(b[0], b[1] - 0.6, 1.1, 1.1), ['#6b7280', '#c9ced8', '#ffffff'])
    box = h.rect(-1, -2, 23, 20)
    h.layer(box, ['#4b505c', '#7d8392', '#a7adbb', '#c9ced8'])
    h.fill(h.rect(0, -1, 18, 19) - h.rect(1, 0, 17, 18), '#3a3e48')                        # screen bezel
    scr = h.rect(1, 0, 17, 18)
    h.layer(scr, ['#1b8fa3', '#38c2d6', '#7fe6f2'], light=True)
    for j in range(1, 18, 3): h.fill({(i, j) for i in range(1, 18)}, '#30b2c6')           # scanlines
    h.fill({(3, 2), (4, 2), (3, 3)}, '#b6f6ff')                                             # glare
    h.px([(5, 6), (6, 6), (5, 7), (6, 7), (12, 6), (13, 6), (12, 7), (13, 7)], '#120c0c')   # face
    h.px([(6, 6), (13, 6)], '#ffffff')
    h.px([(i, 13) for i in range(6, 14)], '#120c0c')
    h.layer(h.rect(20, 1, 21, 2), ['#b88a10', '#f5c542', '#ffe58a'])                         # knobs
    h.layer(h.rect(20, 4, 21, 5), ['#a3131a', '#e0262e', '#ff5a5a'])
    h.fill({(20, j) for j in range(8, 18, 2)} | {(21, j) for j in range(8, 18, 2)}, '#3a3e48')  # speaker grill
    h.outline(); return h
# ------------------------------------------------------------------ Red Riding Hood
def red_riding_hood(f=0):
    h = Hat()
    outer = h.ell(11.5, 11, 13.6, 14, jmax=12)
    inner = h.ell(11.8, 12.2, 10.6, 11.4)
    hood = outer - inner
    h.layer(hood, ['#8e1414', '#c92424', '#ea4a44', '#ff7a6e'])
    lining = {p for p in hood if any((p[0] + dx, p[1] + dy) in inner for dx, dy in [(1, 0), (-1, 0), (0, 1)])}
    h.fill(lining, '#5a0c10')
    h.fill({(i, j) for (i, j) in hood if (i + j) % 7 == 0 and (i, j) not in lining and j < 6}, '#a81b1b')  # cloth folds
    h.outline(); return h
# ------------------------------------------------------------------ Bridal Veil
def bridal_veil(f=0):
    h = Hat()
    veil = h.poly([(1.5, 1), (8.5, 1), (6.5, 34), (-2.5, 34)])
    h.layer(veil, ['#b8c0d4', '#eef1f8', '#ffffff'], alpha=150)
    for j in range(3, 34, 4):
        for (i, jj) in veil:
            if jj == j and (i + j) % 3 == 0: h.col[(i, jj)] = hx('#ffffff', 190)
    h.fill({(i, 33) for i in range(-2, 7)}, '#ffffff', alpha=200)                         # lace hem
    tiara = h.rect(3, 0, 19, 0) | h.rect(2, 1, 4, 1) | h.rect(18, 1, 20, 1)
    h.layer(tiara, ['#9aa3b8', '#e4e8f0', '#ffffff'])
    for i in range(5, 18, 3): h.px([(i, 0)], '#ffffff')
    for i in range(6, 18, 3): h.px([(i, 0)], '#c9d6ff')                                    # pearls
    fl = {(11, -2), (10, -1), (12, -1), (11, 0), (9, -2), (13, -2), (11, -3)}
    h.layer(fl, ['#d5d9e3', '#ffffff', '#ffffff']); h.px([(11, -1)], '#f5c542')             # flower
    h.outline('#5b6377'); return h
# ------------------------------------------------------------------ Halo (new hat, glowing, 6 frames)
def halo(f=0):
    h = Hat()
    cx, cy = 11, -6.0
    bob = [0, 0, -1, -1, 0, 0][f]                                                           # floats up and down a bit
    ring = h.ell(cx, cy + bob, 7.6, 2.7) - h.ell(cx, cy + bob, 5.2, 1.4)
    front = {(i, j) for (i, j) in ring if j >= cy + bob}
    h.layer(ring, ['#ffd400', '#fff200', '#fffa70', '#ffffd8'])
    h.fill({p for p in front if p[1] == max(q[1] for q in front if q[0] == p[0])}, '#ffe000')  # under side a bit darker
    h.outline('#d9a800')
    pulse = [0.55, 0.75, 1.0, 0.75, 0.55, 0.4][f]
    g1 = h.ell(cx, cy + bob, 9.4, 3.8) - h.ell(cx, cy + bob, 3.6, 0.2)
    g2 = h.ell(cx, cy + bob, 11.0, 5.0) - h.ell(cx, cy + bob, 2.0, 0.1)
    h.glow(g1, '#fffb8c', int(200 * pulse))
    h.glow(g2, '#fff36a', int(110 * pulse))
    sp = [(3, -9), (19, -8), (16, -11), (5, -3)][f % 4]                                    # a twinkle
    for d in [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)]:
        q = (sp[0] + d[0], sp[1] + d[1] + bob)
        h.col[q] = hx('#ffffff' if d == (0, 0) else '#fff45c', 255 if d == (0, 0) else 200)
    return h

HATS = {'top_hat': (top_hat, 1), 'santa_hat': (santa_hat, 1), 'ski_cap': (ski_cap, 1), 'rooster_hat': (rooster_hat, 1),
        'baseball_cap': (baseball_cap, 1), 'old_timey_hat': (old_timey_hat, 1), 'froghat': (froghat, 1),
        'hot_head': (hot_head, 4), 'gamblers_visor': (gamblers_visor, 1), 'tv_head': (tv_head, 1),
        'red_riding_hood': (red_riding_hood, 1), 'bridal_veil': (bridal_veil, 1), 'halo': (halo, 6)}
data = {}
# sit the caps down onto the head (their bottom edge covers the top of the head)
SHIFT = {k: 3 for k in ['top_hat', 'santa_hat', 'ski_cap', 'rooster_hat', 'baseball_cap', 'old_timey_hat', 'froghat', 'hot_head', 'halo']}  # halo: lower, under the name tag
for name, (fn, n) in HATS.items():
    data[name] = []
    for f in range(n):
        h = fn(f)
        dy = SHIFT.get(name, 0)
        h.col = {(i, j + dy): c for (i, j), c in h.col.items()}
        h.image().save(f'{OUT}/{name}.png' if f == 0 else f'{OUT}/{name}_{f}.png')
        if f == 0 and n > 1: h.image().save(f'{OUT}/{name}_0.png')
        data[name].append(h.cells())
json.dump(data, open(f'{OUT}/cells.json', 'w'))
print('ok', {k: len(v) for k, v in data.items()})
