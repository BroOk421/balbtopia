# Cuts the owner's 2x2 reaper sheet into a 4-frame strip, aligned on the dark hood/robe.
import sys
from PIL import Image
import numpy as np
src, out, H = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert('RGBA')
W2, H2 = im.width // 2, im.height // 2
frames = []
for r in range(2):
    for c in range(2):
        f = im.crop((c * W2, r * H2, (c + 1) * W2, (r + 1) * H2))
        a = np.array(f).astype(int)
        a[a[..., 3] < 24] = 0  # drop faint specks
        # whitish fringe pixels left from the white background
        rgb = a[..., :3]; al = a[..., 3]
        white = (rgb.min(axis=2) > 200) & (al < 200)
        a[white] = 0
        f = Image.fromarray(a.astype('uint8'))
        lum = rgb.mean(axis=2)
        dark = (al > 200) & (lum < 70)
        ys, xs = np.nonzero(dark)
        anchor = (np.median(xs), np.median(ys))
        frames.append((f, anchor))
# common anchor -> shift every frame so its dark-centre sits on the same spot
ax = np.mean([a[0] for _, a in frames]); ay = np.mean([a[1] for _, a in frames])
shifted = []
for f, (x, y) in frames:
    c = Image.new('RGBA', f.size, (0, 0, 0, 0))
    c.paste(f, (int(round(ax - x)), int(round(ay - y))), f)
    shifted.append(c)
bb = None
for c in shifted:
    b = c.getbbox()
    bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
pad = 4
bb = (bb[0] - pad, bb[1] - pad, bb[2] + pad, bb[3] + pad)
fw0, fh0 = bb[2] - bb[0], bb[3] - bb[1]
k = H / fh0
fw = int(round(fw0 * k))
strip = Image.new('RGBA', (fw * 4, H), (0, 0, 0, 0))
for i, c in enumerate(shifted):
    strip.paste(c.crop(bb).resize((fw, H), Image.LANCZOS), (i * fw, 0))
strip.save(out, optimize=True)
print('frame', fw, H, 'anchor in frame', (ax - bb[0]) * k, (ay - bb[1]) * k)
