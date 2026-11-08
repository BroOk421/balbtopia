# Royal Silk Scarf reaper: keep the SCYTHE (and the hand on it) still. The owner's 4 frames each draw the scythe in a
# different place, so while animating it looked like two scythes. Right of a line parallel to the handle (a little left
# of it) every frame takes frame 0's pixels; left of it (the trailing robe and flames) each frame keeps its own, with a
# soft seam. Input / output: the 4-frame strip made by reaper_cut.py.
import sys
from PIL import Image
import numpy as np
src, out, XT, XB, SOFT = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
s = np.array(Image.open(src).convert('RGBA')).astype(float)
H = s.shape[0]; fw = s.shape[1] // 4
yy, xx = np.mgrid[0:H, 0:fw]
line = XT + (XB - XT) * yy / H
w = np.clip((xx - line) / SOFT + 0.5, 0, 1)[..., None]  # 0 left (own frame) .. 1 right (frame 0)
f0 = s[:, :fw]
o = s.copy()
for i in range(4):
    f = s[:, i * fw:(i + 1) * fw]
    # premultiplied blend so the seam has no dark fringe
    a = f[..., 3:4] / 255; a0 = f0[..., 3:4] / 255
    pa = a * (1 - w) + a0 * w
    rgb = (f[..., :3] * a * (1 - w) + f0[..., :3] * a0 * w) / np.maximum(pa, 1e-6)
    o[:, i * fw:(i + 1) * fw, :3] = rgb
    o[:, i * fw:(i + 1) * fw, 3:4] = pa * 255
Image.fromarray(np.clip(o, 0, 255).astype('uint8')).save(out, optimize=True)
