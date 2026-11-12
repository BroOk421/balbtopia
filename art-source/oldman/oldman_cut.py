# Cuts the owner's "cool old man" picture (Nov 12 2026, oldman_ref.png: the idle character wearing them) into the
# Silver Wild Hair, the Silver Full Beard (with sideburns and the mustache) and the Boss Shades -> www/assets/items/.
# His picture is the idle frame drawn bigger but not in the same proportions, so it is lined up on the face: the
# eyebrows (picture y 329.5 = frame y 48.9) and the mouth (picture 735, 548 = frame 75.5, 95), the head's right edge
# (picture x 908 = frame 108): frame x = 75.5 + (px - 735) / KX, frame y = 95 + (py - 548) / KY. Each piece is saved
# at 2x frame size; its place on the 118 x 215 frame (= WEAR_ART space) is printed at the end (oldman.js OLDMAN_AT).
# Run from this folder: python3 oldman_cut.py
from PIL import Image
import numpy as np
from scipy import ndimage

OUT = '../../www/assets/items/'
A = np.array(Image.open('oldman_ref.png').convert('RGBA')).astype(int)
H, W = A.shape[:2]
r, g, b, a = A[:, :, 0], A[:, :, 1], A[:, :, 2], A[:, :, 3]
op = a > 128
ys, xs = np.mgrid[0:H, 0:W]
KX, KY, MX, MY, FX, FY = 5.32, 4.74, 735, 548, 75.5, 95
dark = op & (r < 70) & (g < 70) & (b < 70)
whiteish = op & (r > 140) & (g > 140) & (b > 140) & (abs(r - b) < 30) & (abs(r - g) < 22)
skin = op & (r > 190) & (r - g > 25) & (g - b > 12) & ~whiteish


def comp(mask, seeds):
    lab, n = ndimage.label(mask)
    keep = np.zeros_like(mask)
    for (x, y) in seeds:
        if lab[y, x]:
            keep |= lab == lab[y, x]
    return keep


def near(mask, d):
    return ndimage.binary_dilation(mask, iterations=d)


out = {}


def save(mask, name):
    yy, xx = np.nonzero(mask)
    x0, y0, x1, y1 = xx.min(), yy.min(), xx.max() + 1, yy.max() + 1
    pic = A[y0:y1, x0:x1].copy().astype(np.uint8)
    pic[~mask[y0:y1, x0:x1]] = 0
    fx, fy = FX + (x0 - MX) / KX, FY + (y0 - MY) / KY
    fw, fh = (x1 - x0) / KX, (y1 - y0) / KY
    im = Image.fromarray(pic).resize((round(fw * 2), round(fh * 2)), Image.LANCZOS)
    im.save(OUT + name + '.png')
    out[name] = (round(fx, 1), round(fy, 1), round(fw, 1), round(fh, 1))
    print(name, im.size, 'at frame', out[name])


# the shades: the black frame and lenses (holes filled: the lens shine), lens to lens and the arm to the ear
box = (xs >= 440) & (xs < 935) & (ys >= 335) & (ys < 505)
shades = comp(dark & box, [(650, 420), (840, 420)])
shades = ndimage.binary_fill_holes(shades)
save(shades, 'oldman_shades')

# the beard (with the mustache): white / grey hair round the mouth and chin and the sideburn, plus its dark outline
reg = (ys >= 400) & (ys < 735) & (xs >= 400) & (xs < 930)
beard_all = comp(whiteish & reg & ~shades, [(735, 640), (500, 470), (840, 600), (735, 515)])
beard_all |= dark & reg & near(beard_all, 3) & (ys > 470) & ~shades
# not the tank top's neckline under the beard's left side, nor the shine under the lenses (only the sideburn goes up)
beard_all &= ~((xs < 700) & (ys > 652)) & ~((xs >= 600) & (ys < 488)) & ~((xs >= 705) & (xs <= 745) & (ys > 650) & ~whiteish)
lab, n = ndimage.label(beard_all)
for k in range(1, n + 1):
    if (lab == k).sum() < 40:
        beard_all &= lab != k
# (build o, owner: "the beard WITH the mustache") one piece: the beard, sideburns and mustache
save(beard_all, 'oldman_beard')

# the hair: the white / grey ring round the bald top and down the sides, plus its dark outline; not the eyebrows
hreg = (ys < 470)
hair = comp(whiteish & hreg & ~shades, [(420, 200), (600, 60), (860, 200), (330, 350)])
hair |= dark & hreg & near(hair, 3) & ~shades & ~near(skin & (ys > 120), 1)
# (the white eyebrows are drawn by oldman.js right over the character's own, which sit a little lower and wider)
save(hair, 'oldman_hair')
print('OLDMAN_AT =', out)
