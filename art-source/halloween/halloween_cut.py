# Cuts the owner's Halloween silhouette sheet (Nov 3 2026, halloween_sheet.png: see-through, black shapes with yellow
# windows, a grim moon, bare trees, grey-black mountains) into the Halloween Machine's backdrop pieces:
# www/assets/halloween/<name>.png (each piece's box from the sheet, scaled by SCALE; the soft glow kept).
# Run: python3 art-source/halloween/halloween_cut.py   (from the project folder)
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'www', 'assets', 'halloween')
SCALE = 0.6
# name: (x0, y0, x1, y1) on the sheet (found from the alpha channel)
BOX = {
    'castle': (13, 6, 604, 500),
    'manor': (621, 4, 1084, 499),
    'moon': (1060, 6, 1512, 462),
    'tree1': (11, 504, 355, 821),
    'tree2': (364, 513, 649, 818),
    'tree3': (613, 507, 855, 818),
    'house1': (879, 522, 1235, 818),
    'house2': (1230, 528, 1529, 814),
    'mountains': (3, 820, 1526, 1014),
}
# (owner, Nov 3 2026) the moon in yellow like the lit windows instead of black: its grey face (bright parts of the
# picture) goes to window yellow, its dark craters / eyes / grin to a deep amber, by brightness (`moon_yellow`)
def moon_yellow(p):
    import numpy as np
    a = np.array(p).astype(float)
    L = a[..., :3].mean(-1)
    t = np.clip(L / 34.0, 0, 1)[..., None]  # the face is about 30-35 grey, the dark parts 0
    dark = np.array([196, 132, 26], float)  # (owner: the dark parts only a little darker than the yellow)
    face = np.array([255, 196, 52], float)
    out = dark + (face - dark) * t
    a[..., :3] = out
    return Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')


os.makedirs(OUT, exist_ok=True)
im = Image.open(os.path.join(HERE, 'halloween_sheet.png')).convert('RGBA')
for name, b in BOX.items():
    p = im.crop(b)
    p = p.resize((round(p.width * SCALE), round(p.height * SCALE)), Image.LANCZOS)
    if name == 'moon':
        p = moon_yellow(p)
    p.save(os.path.join(OUT, name + '.png'))
    print(name, p.size)
