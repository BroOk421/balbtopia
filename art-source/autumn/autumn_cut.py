# Cuts the owner's autumn pieces out of his sheet (art-source/autumn/autumn_sheet.png, Nov 4 2026: headband, a pair
# of wings, cape front, scattered leaves) by keying off the dark glowing background: the background is smooth, so a
# heavy median blur estimates it; a pixel is part of a piece when it differs from that estimate a lot, or is the dark
# outline. Each piece = the big connected parts inside its box, holes filled. Output: the pieces at the sheet's own
# size in art-source/autumn/cut/, and at the character's size (body px) in www/assets/autumn/*_s.png (used by the game). Run from the project root:  python3 art-source/autumn/autumn_cut.py
import os
import numpy as np
from PIL import Image
from scipy import ndimage as nd

SRC = 'art-source/autumn/autumn_sheet.png'
OUT = 'www/assets/autumn'
CUT = 'art-source/autumn/cut'
BOX = {  # x0, y0, x1, y1 on the sheet
    'headband': (830, 10, 1390, 215),
    'wing_l': (750, 195, 1112, 485),
    'wing_r': (1130, 195, 1500, 485),
    'cape': (1310, 725, 1520, 960),
}
os.makedirs(OUT, exist_ok=True)
os.makedirs(CUT, exist_ok=True)
im = np.asarray(Image.open(SRC).convert('RGB')).astype(np.int32)
lum = im[..., 0] * 0.3 + im[..., 1] * 0.59 + im[..., 2] * 0.11
bg = np.stack([nd.median_filter(im[..., c], size=61) for c in range(3)], -1)
diff = np.abs(im - bg).sum(-1)
fg = (diff > 70) | (lum < 16)
for name, (x0, y0, x1, y1) in BOX.items():
    m = fg[y0:y1, x0:x1].copy()
    m = nd.binary_closing(m, iterations=2)
    lab, n = nd.label(m)
    sizes = nd.sum(m, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 1500])
    keep = nd.binary_fill_holes(keep)
    rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    rgba[..., :3] = im[y0:y1, x0:x1]
    rgba[..., 3] = keep * 255
    ys, xs = np.nonzero(keep)
    pic = Image.fromarray(rgba).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    pic.save(f'{CUT}/{name}.png')
    print(name, pic.size)


# ---- the pieces at the character's own size (body px, 1:1 in the game; placed like the owner's mockup) ----
def scaled(name, w, h=None):
    pic = Image.open(f'{CUT}/{name}.png').convert('RGBA')
    h = h or round(pic.height * w / pic.width)
    small = pic.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
    a = np.asarray(small).copy()
    a[..., 3] = np.where(a[..., 3] > 110, 255, 0)  # hard pixel edges
    return Image.fromarray(a)


hb = scaled('headband', 150)
hb.save(f'{OUT}/headband_s.png')
cape = scaled('cape', 136, 122)  # wider than the body, a little squat so it ends at the feet
cape.save(f'{OUT}/cape_s.png')
wl, wr = scaled('wing_l', 129), scaled('wing_r', 129)
both = Image.new('RGBA', (316, max(wl.height, wr.height)), (0, 0, 0, 0))
both.alpha_composite(wl, (0, 0))
both.alpha_composite(wr, (316 - wr.width, 0))
both.save(f'{OUT}/wings_s.png')
print('scaled: headband', hb.size, 'cape', cape.size, 'wings', both.size)


# ---- the owner's RAISED wings pose (art-source/autumn/wing_high.ase, Aseprite: one frame, one layer, one compressed
# cel), used as the "up" frame of the Autumn Wings' beat (autumn.js). Read with a small Aseprite reader (no library),
# scaled like the wings above (129 / 357 of the sheet's), alpha made hard. ----
import struct
import zlib


def ase_cel(path):
    d = open(path, 'rb').read()
    pos = 128
    nch = struct.unpack('<I', d[pos + 12:pos + 16])[0] or struct.unpack('<H', d[pos + 6:pos + 8])[0]
    p = pos + 16
    for _ in range(nch):
        csize, ctype = struct.unpack('<IH', d[p:p + 6])
        if ctype == 0x2005:
            w, h = struct.unpack('<HH', d[p + 22:p + 26])
            return Image.frombytes('RGBA', (w, h), zlib.decompress(d[p + 26:p + csize]))
        p += csize


hi = ase_cel('art-source/autumn/wing_high.ase')
hi.save(f'{CUT}/wing_high.png')
k = 129 / 357
hs = hi.convert('RGBa').resize((round(hi.width * k), round(hi.height * k)), Image.LANCZOS).convert('RGBA')
a = np.asarray(hs).copy()
a[..., 3] = np.where(a[..., 3] > 110, 255, 0)
Image.fromarray(a).save(f'{OUT}/wings_hi_s.png')
print('raised wings', hi.size, '->', hs.size)
