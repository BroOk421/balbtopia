# Cuts the owner's swimming sheet (swim_sheet.png: 8 frames, 4 x 2, on a dark glowing background) into
# assets/character/<skin>/swim_0N.png for every skin.
# Keying: the figure = its light / blue inside plus the black outline round it (dark pixels next to the inside).
# Frames are lined up on the head (top + right edge), scaled so the head is as wide as our standing head
# (113 px), and repainted per skin like sitBody does (skin pixels scaled so their most common colour equals the
# standing face's most common colour).
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = sys.argv[1]  # the repo root
SRC = ROOT + '/art-source/character/swim_sheet.png'
OUT = ROOT + '/www/assets/character/'
SKINS = ['porcelain', 'peach', 'tan', 'honey', 'brown', 'deep']

a = np.array(Image.open(SRC).convert('RGB')).astype(int)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
lum = 0.3 * R + 0.59 * G + 0.11 * B
inner = (lum > 105) | ((B > R + 25) & (B > 70))
inner = nd.binary_opening(inner, iterations=2)
fig = inner | ((lum < 40) & nd.binary_dilation(inner, iterations=14))
fig = nd.binary_fill_holes(fig)
fig = nd.binary_opening(fig, iterations=2)
lab, n = nd.label(fig)
sizes = nd.sum(fig, lab, range(1, n + 1))
comps = [i + 1 for i, s in enumerate(sizes) if s > 20000]
boxes = []
for k in comps:
    ys, xs = np.where(lab == k)
    boxes.append((k, xs.min(), xs.max(), ys.min(), ys.max()))
# reading order: top row left to right, then bottom row
boxes.sort(key=lambda b: (b[3] > 500, b[1]))
assert len(boxes) == 8, len(boxes)

S = 113 / 196  # our head width / the sheet's head width
frames = []
for k, x0, x1, y0, y1 in boxes:
    m = lab == k
    rows = m[y0 + 50:y0 + 100]
    hx = np.where(rows.any(0))[0].max()  # head's right edge
    rgba = np.zeros((y1 - y0 + 1, x1 - x0 + 1, 4), float)
    sub = m[y0:y1 + 1, x0:x1 + 1]
    rgba[..., :3] = a[y0:y1 + 1, x0:x1 + 1] * sub[..., None]
    rgba[..., 3] = sub * 255
    frames.append((rgba, hx - x0, 0))  # anchor: head right edge, head top

# common canvas: every frame placed so its anchor lands on the same point
L = max(f[1] for f in frames)
Rt = max(f[0].shape[1] - f[1] for f in frames)
H = max(f[0].shape[0] for f in frames)
W0 = L + Rt + 8
H0 = H + 8
big = []
for rgba, ax, ay in frames:
    c = np.zeros((H0, W0, 4), float)
    ox, oy = L - ax + 4, 4
    c[oy:oy + rgba.shape[0], ox:ox + rgba.shape[1]] = rgba
    big.append(c)
w, h = round(W0 * S), round(H0 * S)


def shrink(c):
    # premultiplied box shrink, then a hard alpha edge like our other frames
    im = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8), 'RGBA')
    pm = c.copy()
    pm[..., :3] *= pm[..., 3:4] / 255
    rgb = np.array(Image.fromarray(np.clip(pm[..., :3], 0, 255).astype(np.uint8)).resize((w, h), Image.BOX)).astype(float)
    al = np.array(Image.fromarray(c[..., 3].astype(np.uint8)).resize((w, h), Image.BOX)).astype(float)
    out = np.zeros((h, w, 4), np.uint8)
    keep = al >= 110
    out[..., :3] = np.clip(rgb / np.maximum(al, 1)[..., None] * 255, 0, 255)
    out[..., 3] = keep * 255
    out[~keep, :3] = 0
    return out


small = [shrink(c) for c in big]


def skin_mask(p):
    r, g, b = p[..., 0].astype(int), p[..., 1].astype(int), p[..., 2].astype(int)
    l = 0.3 * r + 0.59 * g + 0.11 * b
    return (p[..., 3] > 0) & (r > g) & (g > b) & (r - b > 45) & (l > 45)


def common(p, m):
    cols = p[m][:, :3].astype(int) // 4
    keys, cnt = np.unique(cols[:, 0] * 65536 + cols[:, 1] * 256 + cols[:, 2], return_counts=True)
    k = keys[cnt.argmax()]
    return np.array([k // 65536, (k // 256) % 256, k % 256]) * 4 + 2


src_common = common(np.concatenate([f.reshape(-1, 4) for f in small])[None], skin_mask(np.concatenate([f.reshape(-1, 4) for f in small])[None]))
print('sheet skin', src_common)
for sk in SKINS:
    face = np.array(Image.open(OUT + sk + '/idle_open.png').convert('RGBA'))[10:70, 15:105]
    tgt = common(face, skin_mask(face))
    f = tgt / src_common
    for i, fr in enumerate(small):
        o = fr.copy()
        m = skin_mask(o)
        o[..., :3][m] = np.clip(o[..., :3][m] * f, 0, 255)
        Image.fromarray(o).save(OUT + sk + '/swim_%02d.png' % i)
    print(sk, tgt)

# where the head is on a swim frame: its top and right edge (to move hats / hair / face items there)
f0 = small[0][..., 3] > 0
ys = np.where(f0.any(1))[0]
top = ys.min()
hr = np.where(f0[top + 30:top + 58].any(0))[0].max()
print(json.dumps({'w': w, 'h': h, 'headTop': int(top), 'headRight': int(hr)}))
