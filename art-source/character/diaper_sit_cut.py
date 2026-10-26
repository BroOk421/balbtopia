# The diaper on the SITTING picture (198 x 215, rest.js): the owner drew no sitting diaper, so his standing diaper's
# own pixels (items/<kind>_diaper_idle.png) are stretched over a puffy mound under the shirt, between the arms and
# behind the feet. Front parts of the sitting picture (arms / hands, the flip-flop soles) are left see-through, so
# the body drawn underneath shows there and the diaper looks tucked behind them.
#   input:  art-source/character/sit_briefs_porcelain.png (the sitting body as the game draws it, no pants)
#   output: www/assets/items/<kind>_diaper_sit.png
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = sys.argv[1]
sit = np.array(Image.open(ROOT + '/art-source/character/sit_briefs_porcelain.png').convert('RGBA')).astype(int)
H, W = sit.shape[:2]
ys, xs = np.mgrid[0:H, 0:W]
lum = sit[..., :3].sum(2)
dark = (sit[..., 3] > 100) & (lum < 200)
skin = (sit[..., 3] > 100) & (sit[..., 0] > sit[..., 1]) & (sit[..., 1] > sit[..., 2]) & (sit[..., 0] - sit[..., 2] > 30)

# the mound: a band under the shirt, rounding down between the feet
CX, TOP, BOT = 106, 135, 158
band = (ys >= TOP) & (ys <= 141) & (xs >= 84) & (xs <= 124)
bowl = ((xs - CX) / 22.5) ** 2 + ((ys - 139) / (BOT - 139)) ** 2 <= 1
shape = (band | (bowl & (ys >= 139)))
# the white briefs peeking out by the left hand
white = (sit[..., 3] > 100) & (np.abs(sit[..., 0] - sit[..., 2]) < 25) & (lum > 500)
shape |= ndimage.binary_dilation(white & (ys >= 142) & (ys <= 153) & (xs >= 74) & (xs <= 88), iterations=1) & ~dark
# in front: the hands / arms at the sides, the soles of the feet (and their outlines)
front = (skin & ((xs <= 84) | ((xs >= 121) & (ys < 147))))
front |= dark & (ys >= 142) & ((xs <= 112) | (xs >= 129))
front = ndimage.binary_dilation(front & ~dark, iterations=1) & dark | front
vis = shape & ~front
edge = vis & ~ndimage.binary_erosion(shape, iterations=2)

for kind in ('diamond', 'golden'):
    src = np.array(Image.open(ROOT + '/www/assets/items/%s_diaper_idle.png' % kind).convert('RGBA')).astype(int)
    # the diaper's fill on the standing frame: bright pixels (no outline)
    sx0, sx1, sy0, sy1 = 30, 86, 142, 168
    out = np.zeros((H, W, 4), np.uint8)
    yy, xx = np.where(vis)
    u = ((xx - 76) / (128 - 76)).clip(0, 1)
    v = (yy - TOP) / (BOT - TOP)
    px = np.clip((sx0 + u * (sx1 - sx0)).round().astype(int), 0, src.shape[1] - 1)
    py = np.clip((sy0 + v * (sy1 - sy0)).round().astype(int), 0, src.shape[0] - 1)
    col = src[py, px]
    # outline pixels of the source would draw dark specks inside: take the nearest bright pixel instead
    bright = (src[..., 3] > 0) & (src[..., :3].sum(2) > 330)
    _, (iy, ix) = ndimage.distance_transform_edt(~bright, return_indices=True)
    col = src[iy[py, px], ix[py, px]]
    out[yy, xx, :3] = col[:, :3]
    out[yy, xx, 3] = 255
    # soft shade towards the bottom, dark outline round the mound
    sh = (0.82 + 0.18 * (1 - v)).clip(0.75, 1)[:, None]
    out[yy, xx, :3] = (out[yy, xx, :3] * sh).astype(np.uint8)
    out[edge] = (18, 12, 12, 255)
    Image.fromarray(out).save(ROOT + '/www/assets/items/%s_diaper_sit.png' % kind)
print('ok')
