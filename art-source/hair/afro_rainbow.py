# The Rainbow Afro (owner, Nov 10 2026: "make an afro in rainbow colours"): the Afro picture (afro_cut.py output)
# recoloured in rainbow arcs round the face (between the face and the hair's outer edge), red outside to violet inside, keeping its own light and shade (each
# pixel's brightness picks dark .. light of its colour); the black outline at its edge stays.
# -> www/assets/items/hair_afro_rainbow.png (+ _icon). Same size and place as the Afro.
from PIL import Image
import numpy as np
from scipy import ndimage
import colorsys

for name in ('hair_afro', 'hair_afro_icon'):
    im = Image.open('../../www/assets/items/' + name + '.png').convert('RGBA')
    A = np.array(im).astype(float)
    H, W = A.shape[:2]
    a = A[..., 3] > 100
    L = A[..., :3].mean(2)
    # the outline: the hair's own edge (2 px at the big picture's scale, 1 at the icon's)
    edge = a & ~ndimage.binary_erosion(a, iterations=2 if W > 300 else 1)
    # the face's middle on this picture (frame x 75, y 72 on a picture from frame -51.9, -48 that is 197.5 x 156.9)
    cx, cy = (75 + 51.9) / 197.5 * W, (72 + 48) / 156.9 * H
    ys, xs = np.mgrid[0:H, 0:W]
    # the face opening: empty space with hair above it, to its left and to its right (it only opens downwards)
    up = np.maximum.accumulate(a, axis=0)
    left = np.maximum.accumulate(a, axis=1)
    right = np.maximum.accumulate(a[:, ::-1], axis=1)[:, ::-1]
    face = ~a & up & left & right
    outside = ~a & ~face
    dface = ndimage.distance_transform_edt(~face)
    dout = ndimage.distance_transform_edt(~outside)
    u = np.clip(dface / np.maximum(1e-6, dface + dout), 0, 1)  # 0 by the face (violet) .. 1 at the outer edge (red)
    u = u ** 0.7  # (a wider red and orange outside)
    hue = (1 - u) * 0.78  # red 0 .. violet 0.78
    n = np.clip((L - 4) / 56, 0, 1)  # its shade: 0 dark .. 1 light
    out = A.copy()
    for j in range(H):
        for i in range(W):
            if not a[j, i] or edge[j, i]:
                continue
            v = 0.42 + 0.58 * n[j, i]
            s = 0.95 - 0.35 * n[j, i] ** 2
            r, g, b = colorsys.hsv_to_rgb(hue[j, i], s, v)
            out[j, i, :3] = (r * 255, g * 255, b * 255)
    for j, i in zip(*np.nonzero(edge)):
        out[j, i, :3] = (18, 14, 22)
    Image.fromarray(out.astype(np.uint8)).save('../../www/assets/items/' + name.replace('afro', 'afro_rainbow') + '.png')
    print(name, W, H)
