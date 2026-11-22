# Ear = mouth colour on every non-porcelain skin. The ear pixels are the shape layer's (187,112,117), the same colour as
# the eyebrows, which fails the cut scripts' skin test (g < b), so the ear stayed pink on every skin.
# Ear = a component (8-connected) of that exact colour that is about as tall as it is wide (brows are flat bars).
import os, sys, numpy as np
from PIL import Image
from scipy import ndimage
CH = sys.argv[1]
DRY = len(sys.argv) > 2
EAR = (187, 112, 117)
por = np.array(Image.open(CH + 'porcelain/idle_open.png').convert('RGBA'))
mpos = np.zeros(por.shape[:2], bool)
mpos[112:124, 20:100] = (por[112:124, 20:100, :3] == (193, 133, 116)).all(-1)
skins = [d for d in sorted(os.listdir(CH)) if os.path.isdir(CH + d) and os.path.exists(CH + d + '/idle_open.png') and d != 'porcelain']
out = {}
for s in skins:
    a = np.array(Image.open(CH + s + '/idle_open.png').convert('RGBA'))
    cols, cnt = np.unique(a[mpos][:, :3], axis=0, return_counts=True)
    mouth = cols[cnt.argmax()]
    out[s] = mouth.tolist()
    n_files = n_px = 0
    for root, _, files in os.walk(CH + s):
        for f in files:
            if not f.endswith('.png'):
                continue
            p = os.path.join(root, f)
            im = Image.open(p)
            mode = im.mode
            a = np.array(im.convert('RGBA'))
            m = (a[..., :3] == EAR).all(-1) & (a[..., 3] > 0)
            if not m.any():
                continue
            lab, k = ndimage.label(m, structure=np.ones((3, 3)))
            ear = np.zeros_like(m)
            for i, sl in enumerate(ndimage.find_objects(lab), 1):
                h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
                if h >= 0.8 * w and h >= 3:
                    ear[sl] |= lab[sl] == i
            if ear.any():
                a[ear, :3] = mouth
                n_files += 1
                n_px += int(ear.sum())
                if not DRY:
                    Image.fromarray(a).save(p)
    print(s, 'mouth', mouth.tolist(), 'files', n_files, 'px', n_px)
