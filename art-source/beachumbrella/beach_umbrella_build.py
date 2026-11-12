# Beach Umbrella block picture (owner, Nov 12 2026, build p: "change the beach umbrella's look to a professional one:
# copy the blue umbrella, but bent") -> www/assets/items/beach_umbrella.png, 128 x 128 (the block's 64-px picture at
# twice the detail). Made from the Blue Umbrella's own open picture (assets/items/umbrella_open.png, the owner's art):
# the canopy and the shaft, the yellow handle left off, the shaft made long enough to stand in the sand, the whole
# umbrella tilted TILT degrees (leaning like a beach umbrella stuck in the sand), standing right on the ground.
# Run from this folder: python3 beach_umbrella_build.py
from PIL import Image, ImageDraw
import numpy as np

TILT = 18  # degrees, leaning left
SRC = np.array(Image.open('../../www/assets/items/umbrella_open.png').convert('RGBA'))
H0 = 80  # rows of the umbrella picture to stand it in: the canopy and the shaft down to the sand
pic = np.zeros((H0, SRC.shape[1], 4), np.uint8)
pic[:45] = SRC[:45]  # canopy and shaft (the handle starts at row 45)
for y in range(45, H0 - 2):
    pic[y] = SRC[40]  # the shaft, made longer
pic[H0 - 2:] = SRC[40]
big = Image.fromarray(pic, 'RGBA').resize((pic.shape[1] * 4, H0 * 4), Image.NEAREST)
# turn it round the shaft's foot (picture x 33, the bottom)
foot = (33 * 4, H0 * 4)
W2 = big.width * 3
canvas = Image.new('RGBA', (W2, W2), (0, 0, 0, 0))
off = (W2 // 2 - foot[0], W2 // 2 - foot[1])
canvas.alpha_composite(big, off)
rot = canvas.rotate(TILT, resample=Image.BICUBIC, center=(W2 // 2, W2 // 2))
# down to the block picture: 1.42 block px a picture px, the foot at (80, 128) of 128 (the ground)
K = 1.42 / 4
small = rot.resize((round(W2 * K), round(W2 * K)), Image.LANCZOS)
out = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
fx, fy = round(W2 // 2 * K), round(W2 // 2 * K)
tmp = Image.new('RGBA', (small.width + 256, small.height + 256), (0, 0, 0, 0))
tmp.alpha_composite(small, (128, 128))
out = tmp.crop((128 + fx - 80, 128 + fy - 128, 128 + fx - 80 + 128, 128 + fy - 128 + 128))
# (owner: "take this [the sand mound] off, put it straight on the ground") the shaft goes down to the tile's bottom
a = np.array(out)
a[:, :, 3] = np.where(a[:, :, 3] > 90, 255, 0)
Image.fromarray(a).save('../../www/assets/items/beach_umbrella.png')
print('saved', out.size)
