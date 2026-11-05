# Cuts the owner's sleeve mockup (Nov 5 2026) into per-frame sleeve masks for the t-shirts with sleeves (tees.js).
# sleeves_sheet_blank.png = the jump / swim frames (peach) laid out by Claude; sleeves_mockup.png = the same sheet with
# the owner's sleeves painted on. Every pixel he changed is kept (his colours: light = sleeve cloth, its shading, dark =
# lines he drew); the rest is see-through. Every skin uses the same frame shapes, so one mask per frame.
# Output: www/assets/character/sleeve_jump_0N.png (198 x 295), sleeve_swim_0N.png (218 x 171).
# Sitting (Nov 5 2026, later): sleeves_sit_blank.png (the sitting picture as the game draws it: sit.png + the standing
# head, peach) and his sleeves_sit_mockup.png -> sleeve_sit_00.png (198 x 215).
# Run from the project root:  python3 art-source/character/sleeves_cut.py
import numpy as np
from PIL import Image

A = 'art-source/character/'
mock = np.asarray(Image.open(A + 'sleeves_mockup.png').convert('RGBA')).astype(int)
blank = np.asarray(Image.open(A + 'sleeves_sheet_blank.png').convert('RGBA')).astype(int)
changed = (np.abs(mock - blank).sum(-1) > 30) & (blank[..., 3] >= 120)  # only on the body
G, L = 10, 16
frames = [('jump', i, G + i * (198 + G), L, 198, 295) for i in range(3)]
frames += [('swim', i, G + i * (218 + G), L + 295 + G + L, 218, 171) for i in range(8)]
for kind, i, x, y, w, h in frames:
    out = np.zeros((h, w, 4), np.uint8)
    m = changed[y:y + h, x:x + w]
    out[m] = mock[y:y + h, x:x + w][m].astype(np.uint8)
    out[m, 3] = 255
    Image.fromarray(out).save(f'www/assets/character/sleeve_{kind}_0{i}.png')
    print(kind, i, int(m.sum()))

sb = np.asarray(Image.open(A + 'sleeves_sit_blank.png').convert('RGBA')).astype(int)
sm = np.asarray(Image.open(A + 'sleeves_sit_mockup.png').convert('RGBA')).astype(int)
m = (np.abs(sm - sb).sum(-1) > 30) & (sb[..., 3] >= 120)
out = np.zeros(sb.shape, np.uint8)
out[m] = sm[m].astype(np.uint8)
out[m, 3] = 255
Image.fromarray(out).save('www/assets/character/sleeve_sit_00.png')
print('sit', 0, int(m.sum()))
