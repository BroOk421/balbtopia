# Night moon from the owner's cratered yellow moon (moon_ref.png, Nov 4 2026): its yellow is mapped by brightness onto
# a cream ramp (so the craters keep their shading), then shrunk to a pixel-art size. Run AFTER night_cut.py (which
# writes a flat moon.png): python3 -I art-source/night/moon_from_ref.py
import os, numpy as np
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
im = Image.open(os.path.join(here, 'moon_ref.png')).convert('RGBA')
a = np.array(im).astype(float)
al = a[..., 3] > 0
lum = a[..., :3] @ np.array([0.3, 0.59, 0.11])
lo, hi = np.percentile(lum[al], 3), np.percentile(lum[al], 97)
t = (np.clip((lum - lo) / (hi - lo), 0, 1) ** 1.2)[..., None]
dark, light = np.array([208, 204, 170.]), np.array([252, 248, 224.])
rgb = dark + (light - dark) * t
out = np.dstack([rgb, a[..., 3]]).astype(np.uint8)
img = Image.fromarray(out, 'RGBA')
img = img.crop(img.getbbox())  # tight on the disc
W = 256
# smooth like the Halloween moon: a big picture with soft (anti-aliased) edges, not shrunk to chunky pixels
img = img.resize((W, W), Image.LANCZOS)
Image.fromarray(np.array(img), 'RGBA').save(os.path.join(here, '..', '..', 'www', 'assets', 'night', 'moon.png'))
