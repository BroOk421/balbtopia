# Cuts the owner's watch / wristband lines for the jumping and swimming frames (Nov 5 2026). He drew dark lines on a
# copy of the jump / swim sheet (wrist_owner_jump_swim.png, same layout as sleeves_sheet_blank.png); every DARK pixel
# he changed is the band. Output: www/assets/character/wrist_jump_0N.png / wrist_swim_0N.png (white = band).
# Run from the project root:  python3 art-source/character/wrist_cut.py
import numpy as np
from PIL import Image

A = 'art-source/character/'
m = np.asarray(Image.open(A + 'wrist_owner_jump_swim.png').convert('RGBA')).astype(int)
b = np.asarray(Image.open(A + 'sleeves_sheet_blank.png').convert('RGBA')).astype(int)
band = (np.abs(m - b).sum(-1) > 30) & (b[..., 3] >= 120) & (m[..., :3].mean(-1) < 80)
G, L = 10, 16
frames = [('jump', i, G + i * (198 + G), L, 198, 295) for i in range(3)]
frames += [('swim', i, G + i * (218 + G), L + 295 + G + L, 218, 171) for i in range(8)]
for kind, i, x, y, w, h in frames:
    c = band[y:y + h, x:x + w]
    out = np.zeros((h, w, 4), np.uint8)
    out[c] = (255, 255, 255, 255)
    Image.fromarray(out).save(f'www/assets/character/wrist_{kind}_0{i}.png')
    print(kind, i, int(c.sum()))
