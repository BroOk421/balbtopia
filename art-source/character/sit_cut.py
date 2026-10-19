# The owner's sitting pose (bottom-left figure of his sheet) -> a sitting body sprite on our 118x215 frame, with the
# head exactly where our standing sprite has it (so hair, hats and face items fit as usual).
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
sys.path.insert(0, '/home/claude/work/hair10')
a = np.asarray(Image.open('sheet.png').convert('RGBA')).astype(float)
crop = a[600:1000, 0:205].copy()
solid = crop[..., 3] >= 160
lab, n = nd.label(solid)
sizes = nd.sum(solid, lab, range(1, n + 1))
fig = lab == (np.argmax(sizes) + 1)
fig = nd.binary_fill_holes(fig)
crop[..., 3] = np.where(fig, 255, 0)
ys, xs = np.where(fig)
crop = crop[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
F = crop
R, G, B = F[..., 0], F[..., 1], F[..., 2]
skin = (F[..., 3] > 0) & (R > 200) & (B > 100) & (R - B > 40) & (R - B < 140) & (G < R)
# head: the widest skin row in the top part, and the eye row (most dark pixels inside the skin)
best = (0, 0)
for y in range(F.shape[0] // 2):
    xs_ = np.where(skin[y])[0]
    if len(xs_) > 3 and xs_.max() - xs_.min() > best[0]: best = (xs_.max() - xs_.min(), y)
hw, hy = best
ey = max(range(F.shape[0] // 2), key=lambda y: ((F[y, :, :3].max(1) < 70) & (F[y, :, 3] > 0)).sum())
row = np.where(skin[hy])[0]; hcx = (row.min() + row.max()) / 2
print('fig', F.shape, 'head w', hw, 'at y', hy, 'eye y', ey, 'head cx', hcx)
# fit the head onto ours by matching outlines (eyes, ears, head shape) in the head band
sys.path.insert(0, '/home/claude/work/tools')
from align import align
s, ax, ay, _ = align(F, y_from_ours=0, y_to_ours=100, scales=np.arange(0.6, 0.85, 0.003))
print('head fit', round(s, 3), ax, ay)
im = Image.fromarray(F.astype(np.uint8), 'RGBA')
im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
b = np.asarray(im).copy(); b[..., 3] = np.where(b[..., 3] > 110, 255, 0); im = Image.fromarray(b, 'RGBA')
ox, oy = ax, ay
H = max(215, oy + im.height)
W = max(118, ox + im.width) - min(0, ox)
out = Image.new('RGBA', (118 + 2 * 40, H))      # a little extra room on both sides for the legs
out.alpha_composite(im, (ox + 40, oy))
out.save('sit_body.png')
# rows of the shirt / pants / shoes on this sprite, for the clothes repaint
o = np.asarray(out).astype(int)
blue = (o[..., 2] > o[..., 0] + 18) & (o[..., 2] > o[..., 1]) & (o[..., 3] > 0)
white = (o[..., :3].max(2) - o[..., :3].min(2) < 28) & (o[..., :3].mean(2) > 110) & (o[..., 3] > 0)
by = np.where(blue.any(1))[0]
wy = np.where(white.any(1))[0]
print(json.dumps({'size': out.size, 'pad': 40, 'pantsTop': int(by.min()), 'bottom': int(np.where(o[..., 3].any(1))[0].max()), 'whiteRows': [int(wy.min()), int(wy.max())]}))
