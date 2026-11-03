# Removes the stray floating bits (leftovers of neighbouring pictures cut from the owner's sheet: twigs, bats, thin
# slivers) from every www/assets/halloween/*.png: only the biggest connected piece of each picture is kept.
# Originals are in art-source/halloween/before_clean/. Run: python3 -I art-source/halloween/halloween_clean.py
import glob, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'www', 'assets', 'halloween')
for f in sorted(glob.glob(os.path.join(root, '*.png'))):
    im = Image.open(f).convert('RGBA')
    px = np.array(im)
    lab, n = ndi.label(px[:, :, 3] > 0, structure=np.ones((3, 3)))
    if n <= 1:
        continue
    sizes = ndi.sum(px[:, :, 3] > 0, lab, range(1, n + 1))
    keep = 1 + int(np.argmax(sizes))
    px[lab != keep] = 0
    Image.fromarray(px).save(f)
    print(os.path.basename(f), 'removed', n - 1, 'stray pieces')
