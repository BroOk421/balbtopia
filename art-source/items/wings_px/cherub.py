# Cherub angel wings (owner picked design 7 of round 1): Tiny Angel Wings and a bit bigger Angel Wings,
# both level with the shoulders, each with flap frames (frame 0 = resting open, used on the ground).
import json
from cherlib import *
import cherlib
cherlib.ROUND[0] = False  # owner liked the earlier (not rounded) ends better
CHER = dict(span=15, lift=11, arch=1.45, end=0.35, a0=110, a1=38, L0=10, L1=11, sharp=0.15, arm_w0=2.6, arm_w1=2.2,
            rows=[(7, 1.0, 2.6, 1), (6, 0.66, 2.6, 0), (5, 0.36, 2.4, 0)], pal='white')
def scaled(k):
    d = dict(CHER)
    d.update(span=CHER['span'] * k, lift=CHER['lift'] * k * 0.6, L0=CHER['L0'] * k, L1=CHER['L1'] * k,
             arm_w0=max(1.6, CHER['arm_w0'] * k), arm_w1=max(1.4, CHER['arm_w1'] * k),
             rows=[(max(4, round(n * (0.75 + 0.25 * k))), Ls, max(1.7, w * k ** 0.5), sh) for n, Ls, w, sh in CHER['rows']])
    return d
# flap cycle (degrees up, sideways squeeze): rest, up, top, down, bottom, back
# one flap cycle, played all the time (standing and jumping), owner's choice
FLAP = [(0, 1.0), (14, 0.95), (26, 0.88), (8, 0.92), (-14, 0.95), (-5, 0.98)]
SETS = {'tiny_angel': (0.6, 30.5), 'angel': (1.15, 28.0)}   # size, shoulder row on the 48x46 grid (y = -19 + 5*row body px)
meta = {}
for name, (k, ry) in SETS.items():
    base = scaled(k)
    if name == 'tiny3f':
        # same look as the Angel Wings, only 3 bigger feathers in each row so 3 show
        base['rows'] = [(3, 1.0, 2.5, 1), (3, 0.66, 2.5, 0), (2, 0.36, 2.3, 0)]
    frames = []
    for rot, sq in FLAP:
        g = pair(dict(base, rot=rot, sq=sq), roots=((21.5, ry), (26.5, ry)))
        frames.append(Image.fromarray(g.c, 'RGBA').resize((GW * PX, GH * PX), Image.NEAREST))
    strip = Image.new('RGBA', (GW * PX * len(frames), GH * PX))
    for i, f in enumerate(frames): strip.paste(f, (i * GW * PX, 0)); f.save(f'{OUT}/{name}_{i}.png')
    strip.save(f'{OUT}/wings_{name}.png')
    meta[name] = len(frames)
print(meta)
