# (owner, Nov 21 2026) his Alpine mountain panorama (art-source/background/alpine_source.png: blue-green mountains,
# pines and green hills on a see-through background) -> www/assets/background/alpine_mountains.png, the day / night
# weather's mountains (js/world/daynight.js). Cropped to its content, and at the sides to where the picture has a clean
# straight edge (columns 26 .. 2144), so the mirrored repeats meet without a notch.
# Run:  python3 art-source/background/alpine_cut.py <project root>
import sys
from PIL import Image

ROOT = sys.argv[1]
im = Image.open(ROOT + '/art-source/background/alpine_source.png').convert('RGBA')
out = im.crop((26, 33, 2145, 684))
out.save(ROOT + '/www/assets/background/alpine_mountains.png')
print('alpine_mountains.png', out.size)
