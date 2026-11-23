# Masks for the Mannequin (Nov 23 2026): where the default tank top ('sando') and shorts ('short') of the bare body are,
# in the same frame as the pixel clothes' pictures (198 x 215, 40 px room each side). A pixel shirt's picture leaves out
# the pixels that are the same as the tank top under it (pixelwear_cut.py piece()), so on the gray Mannequin
# (display.js mannBody, pixelwear.js pxwWornMask) the tank top's place counts as "worn" whenever a pixel shirt is on;
# the same for shorts.  Run:  python3 art-source/wear/mann_masks.py <project root>
import sys, numpy as np
from PIL import Image
src = open(__file__.replace('mann_masks.py', 'pixelwear_cut.py')).read()
src = src[:src.index('for f, iid in ITEMS.items():')]
ns = {'__file__': __file__}
exec(compile(src, 'pixelwear_cut.py', 'exec'), ns)
out = ns['ROOT'] + '/www/assets/character/mannequin/'
for layer, name in (('sando', 'mask_shirt'), ('short', 'mask_pants')):
    a = ns['fit'](ns['look'][layer])
    m = np.zeros_like(a)
    m[a[..., 3] > 0] = (255, 255, 255, 255)
    Image.fromarray(m).save(out + name + '.png')
    print(name, a.shape, int((a[..., 3] > 0).sum()))
