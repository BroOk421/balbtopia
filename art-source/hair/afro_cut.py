# Cuts the owner's afro picture (Nov 10 2026, afro_ref.png: the idle character wearing it) into the Afro hair
# -> www/assets/items/hair_afro.png, and prints where it goes on the 118 x 215 body frame.
# His picture is the idle frame drawn bigger: lined up on the eyes (game idle_open.png eye whites x 44-70 and 84-102,
# y 60-84; his picture 582-699 and 760-836, y 502-608), 4.4 picture px per frame px.
from PIL import Image
import numpy as np
from scipy import ndimage

A = np.array(Image.open('afro_ref.png').convert('RGBA')).astype(int)
H, W = A.shape[:2]
r, g, b, a = A[:, :, 0], A[:, :, 1], A[:, :, 2], A[:, :, 3]
op = a > 200
lum = (r + g + b) / 3
dark = op & (lum < 95) & (abs(r - b) < 40)
ys, xs = np.mgrid[0:H, 0:W]
SX, SY, FX, FY, KX, KY = 582, 502, 44, 60, 254 / 58, 106 / 24
# the face: the skin and what's in it (eyes, brows, mouth) are not hair; the hair is the dark mass joined to the top
skin = op & (r > 175) & (r - g > 28) & (g - b > 15)
face = ndimage.binary_fill_holes(ndimage.binary_closing(skin, iterations=6))
cand = dark & ~face & (ys < 720)
lab, n = ndimage.label(cand)
hair = lab == lab[150, 600]
# the face's own black outline along the jaw and cheek (below the hairline, touching the skin): not hair
near = ndimage.binary_dilation(face, iterations=14)
jaw = near & (ys > 600) & (xs > 470)
hair &= ~jaw
hair &= ~((ys > 655) & (xs > 475))  # (the chin outline and the top of the shoulders)
hair = ndimage.binary_opening(hair, iterations=1) | (hair & (ys < 600))
lab, n = ndimage.label(hair)
sizes = ndimage.sum(hair, lab, range(1, n + 1))
hair = np.isin(lab, [k + 1 for k, s in enumerate(sizes) if s > 200])
# SHRINK: the hair can be drawn smaller round the middle of the face (1 = as in his picture); the face is cut out of
# it again where it was (so the face stays clear) with a black edge where the hair meets it
SHRINK, CX, CY = 1.0, 634, 560
hairimg = Image.fromarray(np.where(hair[..., None], A, 0).astype(np.uint8))
sw, sh = round(W * SHRINK), round(H * SHRINK)
small = hairimg.resize((sw, sh), Image.LANCZOS)
canvas = Image.new('RGBA', (W, H))
canvas.paste(small, (round(CX - CX * SHRINK), round(CY - CY * SHRINK)))
B = np.array(canvas).astype(int)
hole = ndimage.binary_dilation(face, iterations=4) & (ys > 330)
# and the game's own face (eyes to the head's right edge, frame x 40-114, y 44-100), so no hair lies over an eye
fxs, fys = FX + (xs - SX) / KX, FY + (ys - SY) / KY
hole |= (fxs > 40) & (fxs < 105) & (fys > 50) & (fys < 100)
B[hole] = 0
edge = ndimage.binary_dilation(hole, iterations=4) & ~hole & (B[..., 3] > 60)
B[edge] = [12, 10, 12, 255]
hair = ndimage.binary_opening(B[..., 3] > 20, iterations=3)  # (no thin drips left where it was cut)
lab, n = ndimage.label(hair)
hair = lab == (np.argmax(ndimage.sum(hair, lab, range(1, n + 1))) + 1)
A = B
# the gaps between the hair and the game's own head (by the ear, owner: "add to it, compare with my picture"): where
# the game head isn't where his picture's head is, the background showed through; filled with the nearest hair
BODY = np.array(Image.open('../../www/assets/character/peach/idle_open.png').convert('RGBA'))[..., 3]
fxs, fys = FX + (xs - SX) / KX, FY + (ys - SY) / KY
bi, bj = np.floor(fxs).astype(int), np.floor(fys).astype(int)
inb = (bi >= 0) & (bi < 118) & (bj >= 0) & (bj < 110)
G = np.zeros_like(hair)
G[inb] = BODY[bj[inb], bi[inb]] > 100
gap = ndimage.binary_fill_holes(hair | G) & ~hair & ~G
# and below the ear, down to the jaw: the hair comes down to the neck there, as in his picture
low = ~G & ~hair & (fxs > -8) & (fxs < 24) & (fys > 80) & (fys < 106)
low &= ndimage.binary_dilation(G, iterations=40) & ndimage.binary_dilation(hair, iterations=40)
gap |= low
_, (iy, ix) = ndimage.distance_transform_edt(~hair, return_indices=True)
A[gap] = A[iy[gap], ix[gap]]
A[gap, 3] = 255
hair = hair | gap
yy, xx = np.nonzero(hair)
x0, y0, x1, y1 = xx.min(), yy.min(), xx.max() + 1, yy.max() + 1
out = A[y0:y1, x0:x1].copy().astype(np.uint8)
out[~hair[y0:y1, x0:x1]] = 0
fx, fy, fw, fh = FX + (x0 - SX) / KX, FY + (y0 - SY) / KY, (x1 - x0) / KX, (y1 - y0) / KY
im = Image.fromarray(out).resize((round(fw * 2), round(fh * 2)), Image.LANCZOS)
im.save('../../www/assets/items/hair_afro.png')
ic = Image.fromarray(out).resize((round(fw), round(fh)), Image.LANCZOS)
ic.save('../../www/assets/items/hair_afro_icon.png')
Image.fromarray(np.where(hair[..., None], A, [255, 0, 255, 255]).astype(np.uint8)).save('/tmp/afro_check.png')
print('hair_afro', im.size, 'at frame', round(fx, 1), round(fy, 1), 'size', round(fw, 1), round(fh, 1))
