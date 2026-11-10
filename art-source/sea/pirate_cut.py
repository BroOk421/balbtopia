# Cuts the owner's pirate picture (Nov 10 2026, pirate_ref.png: the idle character wearing them) into the Pirate Hat
# (with its red bandana and tails) and the Pirate Beard (beard, sideburns and mustache) -> www/assets/sea/.
# The picture is the game's idle frame drawn bigger, so each piece's place on the 118 x 215 frame (= WEAR_ART space) is
# worked out from the eyes (frame eye whites x 44-104 from y 60, picture 589-836 from y 442): printed at the end.
from PIL import Image
import numpy as np
from scipy import ndimage

OUT = '../../www/assets/sea/'
A = np.array(Image.open('pirate_ref.png').convert('RGBA')).astype(int)
H, W = A.shape[:2]
r, g, b, a = A[:, :, 0], A[:, :, 1], A[:, :, 2], A[:, :, 3]
op = a > 200
skin = op & (r > 175) & (r - g > 28) & (r - g < 85) & (g - b > 15) & (g - b < 62)  # (gold trim has g - b > 62)
white = op & (r > 200) & (g > 200) & (b > 200) & (abs(r - b) < 40)
grey = op & (abs(r - g) < 14) & (abs(g - b) < 14) & (r > 110)
ys, xs = np.mgrid[0:H, 0:W]
SX, SY, FX, FY, KX, KY = 589, 442, 44, 60, 247 / 60, 98 / 23  # picture -> frame


def save(mask, name, scale=2):
    lab, n = ndimage.label(mask)
    keep = np.zeros_like(mask)
    for k in range(1, n + 1):
        if (lab == k).sum() > 25:
            keep |= lab == k
    yy, xx = np.nonzero(keep)
    x0, y0, x1, y1 = xx.min(), yy.min(), xx.max() + 1, yy.max() + 1
    out = A[y0:y1, x0:x1].copy().astype(np.uint8)
    out[~keep[y0:y1, x0:x1]] = 0
    im = Image.fromarray(out)
    # frame px: where it goes and how big
    fx, fy, fw, fh = FX + (x0 - SX) / KX, FY + (y0 - SY) / KY, (x1 - x0) / KX, (y1 - y0) / KY
    im = im.resize((round(fw * scale), round(fh * scale)), Image.LANCZOS)
    im.save(OUT + name + '.png')
    print(name, im.size, 'at frame', round(fx, 1), round(fy, 1), 'size', round(fw, 1), round(fh, 1))


# the hat: everything that isn't skin, joined to its crown, above the bandana's lower edge (its tails on the left go lower)
skull = (xs >= 620) & (xs < 830) & (ys >= 120) & (ys < 290)  # (the skull and bones: bone shades look like skin)
cand = op & (~skin | skull) & (((ys < 428)) | ((xs < 418) & (ys < 620)))
lab, n = ndimage.label(cand)
hat = (lab == lab[180, 600]) | (lab == lab[520, 300])
save(hat, 'pirate_hat')
# the beard: brown / dark pixels round the mouth and chin (and the sideburn), not the eyes, the skin or the tank top
reg = (((xs >= 452) & (xs < 560) & (ys >= 448)) | ((xs >= 560) & (xs < 890) & (ys >= 548))) & (ys < 735)
beard = op & reg & ~skin & ~white & ~grey
save(beard, 'pirate_beard')
