# Tyapa the cyborg pet (owner, Oct 28 2026): his two GIFs (96 x 96, facing right; idle 4 frames, walk 6 frames)
# cut into one strip www/assets/pets/cyborg.png of 20 frames of 60 x 61:
#   0-3 idle right, 4-9 walk right, 10-13 idle left, 14-19 walk left (the left ones are the right ones mirrored).
# The crop (x 18-77, y 19-79) is centred on the body (x 48 of the GIF), so a mirrored frame stands on the same spot;
# the robot's lowest pixel is row 77 of the GIF, so the strip has 2 empty rows under the feet; one foot ends 2 rows
# higher than the other (CYBORG.plant in pets.js stands the higher one on the ground).
import os
from PIL import Image, ImageOps, ImageSequence

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'www', 'assets', 'pets', 'cyborg.png')
BOX = (18, 19, 78, 80)


def frames(name):
    im = Image.open(os.path.join(HERE, name))
    return [f.convert('RGBA').crop(BOX) for f in ImageSequence.Iterator(im)]


right = frames('cyborg_idle.gif') + frames('cyborg_walk.gif')
left = [ImageOps.mirror(f) for f in right]
allf = right + left
w, h = allf[0].size
sheet = Image.new('RGBA', (w * len(allf), h))
for k, f in enumerate(allf):
    sheet.paste(f, (k * w, 0))
sheet.save(OUT, optimize=True)
print(OUT, sheet.size, len(allf), 'frames')
