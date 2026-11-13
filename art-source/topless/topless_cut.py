# The owner's "topless with a tribal tattoo" picture (Nov 13 2026, topless_ref.png: the idle character, no tank top,
# abs and a black tribal tattoo over the chest and both shoulders) -> www/assets/items/topless_tattoo.png, a 118 x 215
# picture on the idle frame (wear/topless.js):
#   - the TATTOO: opaque near-black pixels (alpha 255) where the tattoo is; his body lines inside the outline (alpha 253);
#   - the BODY SHADING (abs, chest, nipples), alpha 254: rgb = his colour / his base skin colour (252, 194, 160) per
#     channel, / 1.25 (so 0..1.25 fits 0..255); the game multiplies the wearer's skin by it, so every skin gets them.
# His picture is the idle frame drawn bigger, not in the same proportions, so it is lined up on the torso: the neck
# line (picture y 600 = frame y 109, where the tank top starts), the briefs' waistband (picture y 860 = frame 149),
# the abs' middle (picture x 600 = frame 58.5), the torso's sides (picture 493 / 705 = frame 38 / 79):
# frame x = 58.5 + (px - 600) / KX, frame y = 109 + (py - 600) / KY. The tattoo pieces are the dark patches inside his
# outline (the outline, chin line, the arm / torso lines and the briefs' lines left out), by their number below.
# Run from this folder: python3 topless_cut.py
from PIL import Image
import numpy as np
from scipy import ndimage

KX, KY, MX, MY, FX, FY = 5.2, 6.5, 600, 600, 58.5, 109
BASE = np.array([252, 194, 160], float)
A = np.array(Image.open('topless_ref.png').convert('RGBA')).astype(float)
H, W = A.shape[:2]
alpha = A[:, :, 3]
rgb = A[:, :, :3]
s = rgb.sum(2)
sil = ndimage.binary_fill_holes(alpha > 128)
inner = ndimage.binary_erosion(sil, iterations=22)
dark = (s < 230) & (alpha > 128)
lab, n = ndimage.label(dark & inner)
# keep the tattoo pieces: dark patches inside the outline between the chin line and the briefs, not the long
# arm / torso / briefs lines (one big patch) nor the chin line
ink = np.zeros((H, W), bool)
for i in range(1, n + 1):
    m = lab == i
    ys, xs = np.nonzero(m)
    if len(ys) < 100 or ys.min() > 820 or ys.max() < 580:
        continue
    if ys.min() < 605:  # the chin / neck line
        continue
    if len(ys) > 10000:  # the arm / torso / briefs lines
        continue
    ink |= m
print('tattoo px', ink.sum())
# skin (for the shading): opaque, not dark, warm
skin = sil & (alpha > 128) & ~dark & (rgb[:, :, 0] > 150) & (rgb[:, :, 0] - rgb[:, :, 2] > 40)

FW, FH = 118, 215
out = np.zeros((FH, FW, 4), np.uint8)
for fy in range(100, 175):
    for fx in range(0, FW):
        # the block of his picture this frame pixel covers
        x0 = int(MX + (fx - FX) * KX)
        x1 = int(MX + (fx + 1 - FX) * KX)
        y0 = int(MY + (fy - FY) * KY)
        y1 = int(MY + (fy + 1 - FY) * KY)
        if x1 <= 0 or y1 <= 0 or x0 >= W or y0 >= H:
            continue
        x0, y0 = max(0, x0), max(0, y0)
        bi = ink[y0:y1, x0:x1]
        if bi.size and bi.mean() >= 0.2:
            out[fy, fx] = (28, 20, 20, 255)
            continue
        # his outline lines inside the body (the chest / arm lines, the waist) where they fall on the bare top
        bd = (dark & sil & ~ink)[y0:y1, x0:x1]
        if bd.size and bd.mean() >= 0.5 and 112 <= fy <= 150:
            out[fy, fx] = (18, 12, 12, 253)
            continue
        bs = skin[y0:y1, x0:x1]
        if bs.size and bs.mean() >= 0.6 and fy <= 150:
            c = rgb[y0:y1, x0:x1][bs].mean(0)
            ratio = np.clip(1 + (c / BASE - 1) * 1.35, 0.4, 1.2)  # (a little more contrast: the abs show at this size)
            out[fy, fx] = (*(ratio / 1.25 * 255).astype(np.uint8), 254)
Image.fromarray(out, 'RGBA').save('../../www/assets/items/topless_tattoo.png')
print('saved')
