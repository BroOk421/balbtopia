# Bubble Gum (owner, Nov 23 2026: bubblegum.aseprite + bubblegum-icon.png): the 'bubblegum' layer (the blown bubble
# in front of the face) put on the game's 198 x 215 grid like the pixel wear (pixelwear_cut.py's align / fit), into
# www/assets/wear/bubble_gum/bubble.png; the bag icon = his icon picture. The layer's opacity in his file
# (bubblegum.js BUBBLE_ALPHA).   Run:  python3 art-source/wear/bubblegum_cut.py <project root>
import sys, os, shutil
import numpy as np
from PIL import Image
ROOT = sys.argv[1]
src = open(ROOT + '/art-source/wear/pixelwear_cut.py').read()
sys.argv = [sys.argv[0], ROOT, '__none__']
exec(src[:src.index('ONLY = set(sys.argv[2:])')])
frames, L = read_frames(ROOT + '/art-source/wear/pixel/gum/bubblegum.aseprite')
cels = align(dict(frames[0]), 'gum/bubblegum.aseprite')
b = cels['bubblegum']
extra = b.shape[0] - 35
assert not b[:extra, :, 3].any(), 'the bubble reaches above the normal top'
b = b[extra:]
out = ROOT + '/www/assets/wear/bubble_gum'
os.makedirs(out, exist_ok=True)
Image.fromarray(fit(b)).save(out + '/bubble.png')
shutil.copy(ROOT + '/art-source/wear/pixel/gum/bubblegum-icon.png', out + '/icon.png')
print('bubble_gum: bubble.png, icon.png')
# (owner, Nov 25 2026: new.zip bubblegumpop.aseprite) the popped gum stuck on the mouth: its 'bubble' layer, the same
# way, into pop.png (bubblegum.js draws it from the pop until you land)
frames, L = read_frames(ROOT + '/art-source/wear/pixel/gum/bubblegumpop.aseprite')
cels = align(dict(frames[0]), 'gum/bubblegumpop.aseprite')
b = cels['bubble']
extra = b.shape[0] - 35
assert not b[:extra, :, 3].any(), 'the pop reaches above the normal top'
Image.fromarray(fit(b[extra:])).save(out + '/pop.png')
print('bubble_gum: pop.png')
