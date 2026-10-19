# Super Saiyan Hair from the owner's sprite sheet (first row, idle, transparent PNG): each figure's hair and glow
# is cut out (everything above the forehead, plus hair-coloured pixels lower down) and fitted on our head.
import numpy as np, sys
sys.path.insert(0, '/home/claude/work/tools')
from align import align
from PIL import Image
from scipy import ndimage as nd
im = np.asarray(Image.open('sheet.png').convert('RGBA')).astype(float)
ROW = im[0:245].copy()  # the first row
# its label ("IDLE (8 FRAMES)", top left): black box, white text, no colour; the hair glow there stays
lab = ROW[:44, :180]
lab_rgb = lab[..., :3] / 255
lab_sat = (lab_rgb.max(2) - lab_rgb.min(2)) / np.maximum(lab_rgb.max(2), 1e-6)
lab[((lab_sat < 0.35) | (lab_rgb.max(2) < 0.4)) & (lab[..., 3] > 0)] = 0
A = ROW[..., 3] / 255
rgb = ROW[..., :3] / 255
R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
mx, mn = rgb.max(2), rgb.min(2)
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
d = np.maximum(mx - mn, 1e-6)
hue = np.where(mx == R, ((G - B) / d) % 6, np.where(mx == G, (B - R) / d + 2, (R - G) / d + 4)) * 60
skin = (A > 0.8) & (R > 0.75) & (B > 0.4) & (R - B > 0.15) & (R - B < 0.5) & (sat < 0.55) & (hue < 40)
hairc = (sat > 0.45) & (hue > 22) & (hue < 68) & (mx > 0.45)
# figures: columns where the body (opaque, lower part) is
body = (A[120:] > 0.9).sum(0)
cols = np.where(body > 5)[0]
runs = []; s = p = cols[0]
for c in cols[1:]:
    if c > p + 6: runs.append((s, p)); s = c
    p = c
runs.append((s, p))
print(len(runs), runs)
cuts = [0] + [(runs[k][1] + runs[k + 1][0]) // 2 for k in range(len(runs) - 1)] + [ROW.shape[1]]
OUR_EYE, OUR_HEAD, OUR_W = 57, 58.5, 101
frames = []
for k in range(len(runs)):
    x0, x1 = cuts[k], cuts[k + 1]
    sk = skin[:, x0:x1]
    # eye row: row with the most dark opaque pixels between skin, in the upper half
    best = (0, 0, 0, 0)
    for y in range(40, 140):
        xs = np.where(sk[y])[0]
        if len(xs) < 4: continue
        a0, a1 = xs.min(), xs.max()
        dark = ((mx[y, x0 + a0:x0 + a1] < 0.25) & (A[y, x0 + a0:x0 + a1] > 0.8)).sum()
        if dark > best[0]: best = (dark, y, a0, a1)
    _, ey, _, _ = best
    ws = []
    for y in range(ey - 12, ey + 12):
        xs = np.where(sk[y])[0]
        if len(xs) > 3: ws.append((xs.max() - xs.min(), xs.min(), xs.max()))
    w, hx0, hx1 = max(ws)
    # forehead: the top of the skin in the head's middle columns
    mid = sk[:ey, hx0 + w // 4: hx1 - w // 4]
    fy = np.where(mid.any(1))[0].min()
    print(k, 'eye', ey, 'head', hx0, hx1, w, 'forehead', fy)
    frames.append(dict(x0=x0, x1=x1, ey=ey, hc=(hx0 + hx1) / 2, w=w, fy=fy))
# one scale for all frames (they are the same character), from the median head width; the head centre and
# the forehead come from the medians too (measured against each figure's body and eyes), so one odd
# measurement can't throw a frame off
W_REF = float(np.median([f['w'] for f in frames]))
off = float(np.median([f['hc'] - ((runs[k][0] + runs[k][1]) / 2 - f['x0']) for k, f in enumerate(frames)]))
fh = float(np.median([f['ey'] - f['fy'] for f in frames]))
for k, f in enumerate(frames):
    f['hc'] = (runs[k][0] + runs[k][1]) / 2 - f['x0'] + off
    f['fy'] = int(round(f['ey'] - fh))
SCALE = OUR_W / W_REF
print('scale', SCALE)
OX0, OY0, OW, OH = -90, -180, 300, 260
out = []
for f in frames:
    x0, x1 = f['x0'], f['x1']
    a = A[:, x0:x1].copy()
    keep = np.zeros_like(a)
    yy = np.arange(a.shape[0])[:, None]
    above = yy < f['fy'] + 2           # everything above the forehead is hair or glow
    hc = hairc[:, x0:x1]
    # hair-coloured pixels lower down too (the bangs and sides), and the dark lines touching them
    hcz = hc & (yy < f['ey'] + 12)  # the sides come down beside the face to the ear
    near = nd.binary_dilation(hcz, iterations=1) & (mx[:, x0:x1] < 0.35) & (A[:, x0:x1] > 0.5) & (yy < f['ey'] + 10)
    # above the forehead: warm hair/glow colours only (not the black-and-white row label)
    warm = (hue[:, x0:x1] > 12) & (hue[:, x0:x1] < 72) & (sat[:, x0:x1] > 0.25) & ~skin[:, x0:x1]
    # the dark strokes inside the hair are part of it: fill the hair's silhouette
    solid = nd.binary_fill_holes(nd.binary_closing(warm & (a > 0.5), iterations=2)) & (a > 0.3)
    keep = np.where((above & (warm | solid) & ~skin[:, x0:x1]) | hcz | near, a, 0)
    # and only round this figure's head (not the glow of the next one)
    xx = np.arange(a.shape[1])[None, :]
    keep = np.where(np.abs(xx - f['hc']) < W_REF * 1.25, keep, 0)
    keep = np.where(skin[:, x0:x1] & ~above, 0, keep)
    # drop small loose bits below the forehead (bits of face outline)
    lab, n = nd.label(keep > 0.3)
    if n:
        sizes = nd.sum(np.ones_like(keep), lab, range(1, n + 1))
        main = lab == (np.argmax(sizes) + 1)
        small = (lab > 0) & ~main & ~above
        keep = np.where(small, 0, keep)
    rgba = np.dstack([rgb[:, x0:x1], keep])
    # fit: the figure's face (eyes, ears, chin; the hair covers the top of the head) onto ours
    fig = ROW[:, x0:x1].astype(float)
    sc, tx, ty, _ = align(fig, y_from_ours=45, y_to_ours=118, scales=[1.356])  # one size for all frames: eyes-to-feet against the bald figure, 0.689 x 1.968
    print('fit', round(sc, 3), tx, ty)
    pm = rgba.copy(); pm[..., :3] *= pm[..., 3:4]
    imf = Image.fromarray((pm * 255).astype(np.uint8), 'RGBA')
    big = np.asarray(imf.resize((round(imf.width * sc), round(imf.height * sc)), Image.LANCZOS)).astype(float)
    al = np.maximum(big[..., 3:4], 1)
    big[..., :3] = np.clip(big[..., :3] * 255 / al, 0, 255)
    big = Image.fromarray(big.astype(np.uint8), 'RGBA')
    o = Image.new('RGBA', (OW, OH))
    o.alpha_composite(big, (round(tx - OX0), round(ty - OY0)))
    out.append(o)
strip = Image.new('RGBA', (OW * len(out), OH))
for k, o in enumerate(out): strip.paste(o, (k * OW, 0))
strip.save('hair_ssj.png', optimize=True)
bbs = [o.getchannel('A').point(lambda v: 255 if v > 60 else 0).getbbox() for o in out]
print('box', OX0, OY0, OW, OH, 'bboxes', bbs)
bodyim = Image.open('/home/claude/work/balbtopia/www/assets/character/porcelain/idle_open.png').convert('RGBA')
pv = Image.new('RGBA', (OW * 3, 400), (30, 20, 50, 255))
for j, fi in enumerate([0, 4, 8]):
    c = Image.new('RGBA', (OW, 400), (30, 20, 50, 255))
    c.alpha_composite(bodyim, (-OX0, -OY0))
    c.alpha_composite(out[fi])
    pv.paste(c, (j * OW, 0))
pv.save('prev.png')
