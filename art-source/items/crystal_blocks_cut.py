# Cuts the owner's 12 crystal block pictures (crystal_blocks_source.png, 4 x 3, left part; the background picture on
# the right is left out, owner: "blocks only, no background") into 32 x 32 pixel art and recolours them into the
# game's five crystal colours (asteroids.js CRYSTALS[..].C, darkest .. lightest): the outline -> C[0], the rest by
# brightness (quantiles over all 12) -> C[1] .. C[4], the brightest few % -> white.
# Out: www/assets/items/crystal_blocks_<colour>.png, 12 frames of 32 x 32 side by side. Run: python3 crystal_blocks_cut.py
import os
from collections import Counter
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'www', 'assets', 'items')
COLS = [(70, 331), (373, 605), (651, 884), (917, 1177)]
ROWS = [(68, 313), (332, 567), (588, 831)]
N = 32
PAL = {
    'green': ['#06301a', '#0e6a34', '#1fae55', '#5ee88a', '#c8ffd8'],
    'red': ['#3a060c', '#8a1222', '#d0283a', '#ff6a78', '#ffd0d6'],
    'blue': ['#04163a', '#0c3a8a', '#1f6ee0', '#5ab4ff', '#d0ecff'],
    'white': ['#3a4256', '#8a96b0', '#c8d2e6', '#eef3ff', '#ffffff'],
    'black': ['#050408', '#15101e', '#2a2140', '#4a3a72', '#a890ff'],
}
src = Image.open(os.path.join(HERE, 'crystal_blocks_source.png')).convert('RGBA')
px = src.load()
cells = []
for (y0, y1) in ROWS:
    for (x0, x1) in COLS:
        cw, ch = (x1 - x0 + 1) / N, (y1 - y0 + 1) / N
        cell = []
        for j in range(N):
            row = []
            for i in range(N):
                cnt, n, tot = Counter(), 0, 0
                for y in range(int(y0 + j * ch + 1), int(y0 + (j + 1) * ch - 1)):
                    for x in range(int(x0 + i * cw + 1), int(x0 + (i + 1) * cw - 1)):
                        r, g, b, a = px[x, y]
                        tot += 1
                        if a > 128 and r + g + b < 735:
                            n += 1
                            cnt[(r // 6 * 6, g // 6 * 6, b // 6 * 6)] += 1
                row.append(cnt.most_common(1)[0][0] if tot and n * 2 >= tot else None)
            cell.append(row)
        cells.append(cell)
lum = lambda c: 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
vals = sorted(lum(c) for cell in cells for row in cell for c in row if c and lum(c) >= 45)
q = lambda f: vals[min(len(vals) - 1, int(f * len(vals)))]
cut = [q(0.25), q(0.55), q(0.85), q(0.97)]
def tone(c):
    L = lum(c)
    if L < 45:
        return 0
    for k, t in enumerate(cut):
        if L < t:
            return k + 1
    return 5  # white
hexrgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
# (owner, Nov 9 2026, later: "make the blocks' colours brighter") the tones are shifted up one step: outline C[0],
# then C[2], halfway C[2]-C[3], C[3], C[4], white; a little more saturation on top
import colorsys
def mix(a, b, t=0.5):
    return tuple(round(a[k] + (b[k] - a[k]) * t) for k in range(3))
def sat(c, f=1.25):
    h, l, s_ = colorsys.rgb_to_hls(*(v / 255 for v in c))
    r, g, b = colorsys.hls_to_rgb(h, l, min(1, s_ * f))
    return (round(r * 255), round(g * 255), round(b * 255))
for name, P in PAL.items():
    C = [hexrgb(h) for h in P]
    pal = [C[0]] + [sat(c) for c in (C[2], mix(C[2], C[3]), C[3], C[4])] + [(255, 255, 255)]
    out = Image.new('RGBA', (N * len(cells), N))
    o = out.load()
    for k, cell in enumerate(cells):
        for j in range(N):
            for i in range(N):
                c = cell[j][i]
                if c:
                    o[k * N + i, j] = pal[tone(c)] + (255,)
    out.save(os.path.join(OUT, 'crystal_blocks_' + name + '.png'))
print('ok', len(cells), cut)

# (owner, Nov 9 2026, later: "make backgrounds of them too, the same but dark") the same 12 frames, darkened, with the
# see-through corners filled with the darkest tone so they tile as a wall: crystal_walls_<colour>.png
DARK = 0.42
for name, P in PAL.items():
    blk = Image.open(os.path.join(OUT, 'crystal_blocks_' + name + '.png')).convert('RGBA')
    base = hexrgb(P[0])
    out = Image.new('RGBA', blk.size, base + (255,))
    out.alpha_composite(blk)
    o = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = o[x, y]
            o[x, y] = (int(r * DARK), int(g * DARK), int(b * DARK), 255)
    out.save(os.path.join(OUT, 'crystal_walls_' + name + '.png'))
print('walls ok')
