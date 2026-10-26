# The owner's own /facejoke face (face_joke_owner.png: his drawing on our character's head, big) ->
# www/assets/character/face_joke.png: only the drawing (brows, eyes, nostrils, grinning mouth), 118 x 215 like a
# body frame, transparent elsewhere. The skin under it is filled per skin colour in the game (render.js jokeFace).
# Every pixel is sorted into the drawing's own colours (ink, white, mouth grey, tongue red, else skin); each colour
# is shrunk on its own (area average) so the thin ink lines stay visible, then stacked: mouth, red, white, ink.
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = sys.argv[1]
a = np.array(Image.open(ROOT + '/art-source/character/face_joke_owner.png').convert('RGB')).astype(float)
H, W = a.shape[:2]
PAL = {
    'skin': (248, 200, 168),
    'white': (250, 250, 250),
    'ink': (10, 26, 50),
    'red': (216, 64, 64),
    'grey': (80, 80, 74),
}
names = list(PAL)
d = np.stack([np.linalg.norm(a - np.array(PAL[n]), axis=2) for n in names])
cls = d.argmin(0)
ys, xs = np.mgrid[0:H, 0:W]
# only the face: not the ear / head outline on the left, not the chin outline, not the little "+" on the forehead
face = (xs > 48) & (ys > 50) & (ys < 250) & ~((xs < 64) & (ys > 135))
masks = {n: ((cls == i) & face).astype(float) for i, n in enumerate(names)}
masks['ink'] = nd.binary_dilation(masks['ink'] > 0, iterations=1).astype(float)  # a bit bolder before shrinking

# where it goes on the 118 x 215 frame: the drawing's box (x 50-260, y 62-248) onto x 38-108, y 42-99
X0, Y0, X1, Y1 = 50, 62, 260, 248
FX0, FY0, FX1, FY1 = 38, 42, 108, 99
fw, fh = FX1 - FX0, FY1 - FY0
out = np.zeros((215, 118, 4))


def shrink(m):
    im = Image.fromarray((m[Y0:Y1, X0:X1] * 255).astype(np.uint8))
    return np.array(im.resize((fw, fh), Image.BOX)).astype(float) / 255


for n, boost in (('grey', 1.2), ('red', 1.3), ('white', 1.15), ('ink', 1.9)):
    cov = np.clip(shrink(masks[n]) * boost, 0, 1)
    reg = out[FY0:FY1, FX0:FX1]
    col = np.array(PAL[n], float)
    al = reg[..., 3:4] / 255
    c = cov[..., None]
    newa = c + al * (1 - c)
    reg[..., :3] = np.where(newa > 0, (col * c + reg[..., :3] * al * (1 - c)) / np.maximum(newa, 1e-6), 0)
    reg[..., 3] = newa[..., 0] * 255
out[..., 3][out[..., 3] < 20] = 0
# drop loose specks (pieces under 8 pixels)
lab, n = nd.label(out[..., 3] > 0)
for i in range(1, n + 1):
    if (lab == i).sum() < 8:
        out[lab == i] = 0
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(ROOT + '/www/assets/character/face_joke.png')
print('ok')
