# Cuts the owner's jumping sheet (jump_sheet.png: 4 figures on transparent, jeans + sneakers like the old pictures;
# the 4th is not used, owner) into assets/character/<skin>/jump_0N.png for every skin: 0 crouch (take-off /
# landing), 1 going up, 2 top of the jump.
# Scale: the sheet's head width -> our standing head width (114 px). Placed on a canvas of the standing frame
# (118 x 215) plus PAD on every side but the bottom, the head lined up with the standing head (frames 1-2) or the
# feet on the standing frame's feet (frame 0, crouching: the head goes down). Skin repainted per skin like
# swim_cut.py. Prints per frame: head offset (hdy) and the rows of shirt / jeans / shoes for outfitBody.
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = sys.argv[1]
SRC = ROOT + '/art-source/character/jump_sheet.png'
OUT = ROOT + '/www/assets/character/'
SKINS = ['porcelain', 'peach', 'tan', 'honey', 'brown', 'deep']
PAD = 40
FW, FH = 118, 215

a = np.array(Image.open(SRC).convert('RGBA')).astype(float)
fig = a[..., 3] > 100
lab, n = nd.label(fig)
sizes = nd.sum(fig, lab, range(1, n + 1))
comps = sorted([i + 1 for i, s in enumerate(sizes) if s > 50000], key=lambda k: np.where(lab == k)[1].min())[:3]

idle = np.array(Image.open(OUT + 'porcelain/idle_open.png').convert('RGBA'))
im_ = idle[..., 3] > 0
ys = np.where(im_.any(1))[0]
IDLE_TOP, IDLE_BOT = ys.min(), ys.max()
hx = np.where(im_[40:60].any(0))[0]
IDLE_HC = (hx.min() + hx.max()) / 2
IDLE_HW = hx.max() - hx.min() + 1

def head_box(m):
    ys = np.where(m.any(1))[0]
    top = ys.min()
    # the head's widest rows, but only the run of columns round the head's middle (raised arms beside it are apart)
    row0 = m[top + 2]
    cx = np.where(row0)[0].mean()
    best = None
    for y in range(top + 40, top + 140):
        xs = np.where(m[y])[0]
        # the run containing cx
        runs = np.split(xs, np.where(np.diff(xs) > 1)[0] + 1)
        for r in runs:
            if r.min() <= cx <= r.max():
                w = r.max() - r.min() + 1
                if best is None or w > best[0]:
                    best = (w, r.min(), r.max())
    return top, best

frames = []
heads = []
for k in comps:
    m = lab == k
    top, (w, x0, x1) = head_box(m)
    heads.append((top, w, x0, x1))
S = IDLE_HW / np.median([h[1] for h in heads])
print('scale', S)

W, H = FW + 2 * PAD, FH + PAD + 40
small = []
info = []
for fi, k in enumerate(comps):
    m = lab == k
    ys_, xs_ = np.where(m)
    y0, y1, x0, x1 = ys_.min(), ys_.max(), xs_.min(), xs_.max()
    sub = a[y0:y1 + 1, x0:x1 + 1].copy()
    sub[..., 3] = np.where(m[y0:y1 + 1, x0:x1 + 1], sub[..., 3], 0)
    pm = sub.copy()
    pm[..., :3] *= pm[..., 3:4] / 255
    w, h = max(1, round(sub.shape[1] * S)), max(1, round(sub.shape[0] * S))
    rgb = np.array(Image.fromarray(np.clip(pm[..., :3], 0, 255).astype(np.uint8)).resize((w, h), Image.BOX)).astype(float)
    al = np.array(Image.fromarray(sub[..., 3].astype(np.uint8)).resize((w, h), Image.BOX)).astype(float)
    keep = al >= 110
    o = np.zeros((h, w, 4), np.uint8)
    o[..., :3] = np.clip(rgb / np.maximum(al, 1)[..., None] * 255, 0, 255)
    o[..., 3] = keep * 255
    o[~keep, :3] = 0
    htop, hw, hx0, hx1 = heads[fi]
    hc = ((hx0 + hx1) / 2 - x0) * S  # head middle in the small picture
    if fi == 0:
        # crouch: feet on the standing feet
        oy = PAD + IDLE_BOT - (h - 1)
    else:
        oy = PAD + IDLE_TOP - round((htop - y0) * S)
    ox = round(PAD + IDLE_HC - hc)
    c = np.zeros((H, W, 4), np.uint8)
    yA, xA = max(0, oy), max(0, ox)
    yB, xB = min(H, oy + h), min(W, ox + w)
    c[yA:yB, xA:xB] = o[yA - oy:yB - oy, xA - ox:xB - ox]
    small.append(c)
    # head offset vs standing (sprite px), and rows for outfitBody (frame px of this canvas)
    hdy = (oy + round((htop - y0) * S)) - (PAD + IDLE_TOP)
    p = c.astype(int)
    r, g, b, al2 = p[..., 0], p[..., 1], p[..., 2], p[..., 3] > 0
    L = (r + g + b) / 3
    sat = p[..., :3].max(-1) - p[..., :3].min(-1)
    blue = al2 & (b > r + 18) & (b > g)
    white = al2 & (sat < 28) & (L > 110)
    jy = np.where(blue.any(1))[0]
    jt, jb = int(jy.min()), int(jy.max())
    wy = np.where((white & (np.arange(H)[:, None] > jt + (jb - jt) * 0.4)).any(1))[0]
    feet = int(wy.min()) if len(wy) else jb
    info.append({'hdy': int(hdy), 'shirt': [int(PAD + 95 + hdy), jt + 4], 'pants': [jt - 2, jb + 2], 'feet': feet, 'bt': jt, 'bb': jt + 18})

def skin_mask(p):
    r, g, b = p[..., 0].astype(int), p[..., 1].astype(int), p[..., 2].astype(int)
    l = 0.3 * r + 0.59 * g + 0.11 * b
    return (p[..., 3] > 0) & (r > g) & (g > b) & (r - b > 45) & (l > 45)

def common(p, m):
    cols = p[m][:, :3].astype(int) // 4
    keys, cnt = np.unique(cols[:, 0] * 65536 + cols[:, 1] * 256 + cols[:, 2], return_counts=True)
    k = keys[cnt.argmax()]
    return np.array([k // 65536, (k // 256) % 256, k % 256]) * 4 + 2

allp = np.concatenate([f.reshape(-1, 4) for f in small])[None]
src = common(allp, skin_mask(allp))
for sk in SKINS:
    face = np.array(Image.open(OUT + sk + '/idle_open.png').convert('RGBA'))[10:70, 15:105]
    f = common(face, skin_mask(face)) / src
    for i, fr in enumerate(small):
        o = fr.copy()
        mm = skin_mask(o)
        o[..., :3][mm] = np.clip(o[..., :3][mm] * f, 0, 255)
        Image.fromarray(o).save(OUT + sk + '/jump_%02d.png' % i)
print(json.dumps({'W': W, 'H': H, 'PAD': PAD, 'frames': info}))
