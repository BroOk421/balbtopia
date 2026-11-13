# The owner's animated Christmas lights (Nov 13 2026, xmas_lights_ref.gif: 8 frames x 180 ms, a dark green wire
# hung between two peaks with 7 bulbs red / yellow / green / blue / red / yellow / red, the bulbs dimming in turn)
# -> www/assets/items/christmas_lights.png: the 8 frames cut to the string (picture x 22-362, y 220-334) at half
# size, stacked top to bottom (170 x 57 each). xmaslights.js draws one frame across a tile's top.
# Run from this folder: python3 xmas_cut.py
from PIL import Image, ImageSequence

im = Image.open('xmas_lights_ref.gif')
BOX = (22, 220, 362, 334)
W, H = (BOX[2] - BOX[0]) // 2, (BOX[3] - BOX[1]) // 2
frames = [f.convert('RGBA').crop(BOX).resize((W, H), Image.LANCZOS) for f in ImageSequence.Iterator(im)]
sheet = Image.new('RGBA', (W, H * len(frames)))
for i, f in enumerate(frames):
    sheet.paste(f, (0, H * i))
sheet.save('../../www/assets/items/christmas_lights.png')
print(len(frames), 'frames', W, 'x', H)
