# The diaper on the jumping pictures (jump.js): each diaper's idle picture (items/<kind>_diaper_idle.png, 118 x 215)
# cut to the diaper, scaled to the jeans' width at the hips of each jump picture (jump_cut.py: 198 x 295) and placed
# just over the jeans' top -> items/<kind>_diaper_jump_0..2.png (198 x 295, same size as the jump pictures).
import sys
import numpy as np
from PIL import Image

ROOT = sys.argv[1]
IT = ROOT + '/www/assets/items/'
CH = ROOT + '/www/assets/character/porcelain/'
for kind in ['golden', 'diamond']:
    d = Image.open(IT + kind + '_diaper_idle.png').convert('RGBA')
    a = np.array(d)
    # only the diaper itself: its biggest piece (the idle picture also has loose dark bits of leg outline)
    from scipy import ndimage as nd
    lab, n = nd.label(a[..., 3] > 0)
    big = 1 + int(np.argmax(nd.sum(a[..., 3] > 0, lab, range(1, n + 1))))
    a[lab != big] = 0
    # and no dark outline bits (they showed as black specks on the jumping legs)
    a[(a[..., :3].astype(int).sum(-1) / 3) < 75] = 0
    d = Image.fromarray(a)
    ys, xs = np.where(a[..., 3] > 0)
    crop = d.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    for f in range(3):
        j = np.array(Image.open(CH + 'jump_%02d.png' % f)).astype(int)
        blue = (j[..., 3] > 0) & (j[..., 2] > j[..., 0] + 18) & (j[..., 2] > j[..., 1])
        rows = np.where(blue.any(1))[0]
        top = rows.min()
        xs6 = np.where(blue[top + 6])[0]
        x0, x1 = xs6.min() - 3, xs6.max() + 3
        w = x1 - x0 + 1
        h = round(crop.height * w / crop.width * 0.95)
        out = Image.new('RGBA', (j.shape[1], j.shape[0]))
        out.alpha_composite(crop.resize((w, h), Image.NEAREST), (int(x0), int(top - 4)))
        out.save(IT + '%s_diaper_jump_%d.png' % (kind, f))
        print(kind, f, x0, top, w, h)
