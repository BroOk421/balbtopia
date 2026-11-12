# Cuts the owner's swim ring picture (Nov 12 2026, floaties_ref.png: two idle characters, a cow ring and a duck ring
# round the waist) into the Cow Swim Ring and the Duck Swim Ring -> www/assets/items/floatie_{cow,duck}.png.
# Each ring is cut inside a hand-placed outline (its polygon, in the coordinates of its own half of the picture), keeping
# its colours plus the black outline next to them. The character's back arm hangs in front of the ring in his picture;
# in the game the ring is drawn over the body, so the arm's place is painted over with the ring (outline on top, then
# the ring's colour). Saved at 2x of their place on the 118 x 215 frame (floaties.js FLOAT_AT; numbers printed).
# Run from this folder: python3 floaties_cut.py
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage

OUT = '../../www/assets/items/'
SRC = np.array(Image.open('floaties_ref.png').convert('RGB')).astype(int)
# picture -> frame: the ring is fitted to the game body (its torso is much shorter than in the picture), see floaties.js
K = 4.6  # picture px per frame px
RINGS = {
    'floatie_cow': {
        'half': 0,
        'poly': [(176, 572), (200, 532), (242, 532), (264, 560), (262, 640), (358, 598), (452, 598), (452, 562),
                 (518, 556), (518, 524), (560, 524), (562, 552), (606, 552), (606, 520), (650, 520), (654, 546),
                 (700, 546), (704, 610), (714, 628), (714, 712), (692, 726), (592, 726), (592, 736), (252, 736),
                 (222, 718), (196, 692), (192, 652), (176, 642)],
        'arm': (258, 640, 358, 600, 670),  # x0, ring top at x0, x1, ring top at x1, bottom of the arm's outline
        'fill': (246, 246, 252),
        'shade': (226, 228, 244),
    },
    'floatie_duck': {
        'half': 768,
        'poly': [(62, 600), (84, 552), (114, 532), (152, 542), (168, 578), (166, 614), (272, 604), (356, 604),
                 (364, 578), (378, 556), (396, 544), (424, 540), (432, 512), (496, 512), (510, 532), (516, 546), (566, 556), (596, 590),
                 (606, 700), (574, 728), (484, 728), (474, 744), (148, 744), (116, 740), (78, 728), (56, 700),
                 (56, 640)],
        'arm': (160, 618, 270, 604, 670),
        'fill': (253, 214, 52),
        'tank_x': 432,
        'cut': [(486, 500, 530, 528), (420, 500, 440, 526)],
        'shade': (246, 190, 30),
    },
}
out = {}
for name, R in RINGS.items():
    A = SRC[:, R['half']:R['half'] + 768].copy()
    H, W = A.shape[:2]
    pm = Image.new('L', (W, H), 0)
    ImageDraw.Draw(pm).polygon(R['poly'], fill=255)
    poly = np.array(pm) > 0
    mx = A.max(axis=2)
    ys, xs = np.mgrid[0:H, 0:W]
    mn = A.min(axis=2)
    # the ring's colours: bright, or the cow's neutral grey spots; not the dim brown / yellow glow round them
    col = poly & ((mx >= 150) | ((mx >= 40) & (mx - mn < 14)))
    # not the character's skin over the ring (his shoulder by the horns / feathers)
    skin = (A[:, :, 0] > 200) & (A[:, :, 0] - A[:, :, 1] > 30) & (A[:, :, 2] > 110) & (A[:, :, 1] > 150)
    col &= ~(skin & ((ys < 560) | (ys > 728)))
    if R.get('tank_x'):  # the white tank top beside the duck's head
        col &= ~((mx - mn < 44) & (mn > 160) & (ys < 612) & (xs < R['tank_x']))
    # the arm in front: paint the ring over it (outline along the ring's top, then the ring's colour)
    x0, t0, x1, t1, yb = R['arm']
    top = t0 + (xs - x0) * (t1 - t0) / (x1 - x0)
    arm = (xs >= x0) & (xs <= x1) & (ys >= top) & (ys <= yb) & poly
    A[arm & (ys < top + 14)] = (8, 8, 8)
    A[arm & (ys >= top + 14) & (ys < top + 30)] = R['shade']
    A[arm & (ys >= top + 30)] = R['fill']
    col |= arm
    col &= ~(arm & (ys < top + 14))
    keep = col | (poly & (mx < 40) & ndimage.binary_dilation(col, iterations=16)) | (arm & (ys < top + 14))
    keep = ndimage.binary_fill_holes(keep) & poly
    keep &= ~((xs >= x0) & (xs <= x1) & (ys < top))  # nothing of the arm above the ring's top
    for (cx0, cy0, cx1, cy1) in R.get('cut', []):  # outline bits of the arms beside the head
        keep &= ~((xs >= cx0) & (xs < cx1) & (ys >= cy0) & (ys < cy1) & (mx < 40))
    lab, n = ndimage.label(keep)
    big = max(range(1, n + 1), key=lambda k: (lab == k).sum())
    keep = lab == big
    yy, xx = np.nonzero(keep)
    bx0, by0, bx1, by1 = xx.min(), yy.min(), xx.max() + 1, yy.max() + 1
    pic = np.zeros((by1 - by0, bx1 - bx0, 4), np.uint8)
    pic[:, :, :3] = A[by0:by1, bx0:bx1]
    pic[:, :, 3] = keep[by0:by1, bx0:bx1] * 255
    fw, fh = (bx1 - bx0) / K, (by1 - by0) / K
    im = Image.fromarray(pic).resize((round(fw * 2), round(fh * 2)), Image.LANCZOS)
    im.save(OUT + name + '.png')
    out[name] = (round(fw, 1), round(fh, 1), int(bx0), int(by0))
    print(name, im.size, 'frame size', out[name][:2], 'picture box from', out[name][2:])
print(out)
