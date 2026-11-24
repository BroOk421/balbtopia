# (Nov 25 2026) the bare default character (pixelwear.js PXW_BARE): the body frames have a few sando / navy-shorts
# pixels OUTSIDE the bare body (the shorts' outline at the hips): painting skin over them is not enough, so these masks
# are cut out of the frame first (destination-out): assets/wear/bare_chest|bare_legs/erase_idle.png, erase_sit.png.
# Found in the porcelain frames (idle_open.png, sit_look.png): pixels in the old piece's colours (its icon) in its
# rows that the bare piece doesn't cover.   Run after pixelwear_cut.py:  python3 art-source/wear/bare_erase.py <root>
import sys
import numpy as np
from PIL import Image
ROOT = sys.argv[1]
W = ROOT + '/www/assets/'
PAD = 40
for iid, item, rows in (('bare_chest', 'white_sando', (138, 178)), ('bare_legs', 'navy_shorts', (172, 200))):
    ic = np.array(Image.open(W + 'wear/' + item + '/icon.png').convert('RGBA'))
    cols = {tuple(int(v) for v in c[:3]) for c in ic.reshape(-1, 4) if c[3]}
    for pose, fr in (('idle', 'idle_open'), ('sit', 'sit_look')):
        a = np.array(Image.open(W + 'character/porcelain/' + fr + '.png').convert('RGBA'))
        bare = np.array(Image.open(W + 'wear/' + iid + '/' + pose + '_porcelain.png').convert('RGBA'))
        if pose == 'idle':
            bare = bare[:, PAD:PAD + a.shape[1]]
        else:
            bare = bare[:a.shape[0], :a.shape[1]]
        m = np.zeros(a.shape[:2], bool)
        for c in cols:
            m |= (a[..., :3] == c).all(axis=2) & (a[..., 3] > 0)
        m[:rows[0]] = False
        m[rows[1]:] = False
        m &= bare[..., 3] == 0
        out = np.zeros((bare.shape[0], bare.shape[1] + (2 * PAD if pose == 'idle' else 0), 4), np.uint8)
        x0 = PAD if pose == 'idle' else 0
        out[:m.shape[0], x0:x0 + m.shape[1]][m] = 255
        Image.fromarray(out).save(W + 'wear/' + iid + '/erase_' + pose + '.png')
        print(iid, pose, int(m.sum() // 36), 'sprite px')
# (only bare_legs/erase_idle.png had anything: the empty ones were deleted, pixelwear.js PXW_ERASE lists the rest)
