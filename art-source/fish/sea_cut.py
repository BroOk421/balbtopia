# Cuts the owner's sea animal sheets (Nov 3 2026) into the game's swim strips.
#   sea_sheet_big.png   : 7 rows x 4 frames: whale, octopus, squid, ray, shark, dolphin, turtle
#   sea_sheet_small.png : 7 rows x 4 frames: clownfish, dolphin, turtle, jellyfish, seahorse, shark, ray
#   sea_sheet_deep.png  : 6 rows x 6 frames, two rows per animal (12 frames): anglerfish, marlin, flounder
# The sheets are see-through; the soft glow round each animal is half see-through, so only pixels with
# alpha >= 128 are kept (the glow goes). Each animal -> www/assets/fish/<id>.png: its frames (4, or 12) side by side in
# equal cells, every frame centred on its own box, scaled so the widest / tallest frame fits MAX px.
# Run: python3 art-source/fish/sea_cut.py   (from the project folder)
import os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'www', 'assets', 'fish')
MAX = 96
SHEETS = {
    'sea_sheet_big.png': ['whale', 'octopus', 'squid', 'stingray_big', 'shark_big', 'dolphin_big', 'turtle_big'],
    'sea_sheet_small.png': ['clownfish', 'dolphin', 'sea_turtle', 'jellyfish', 'seahorse', 'shark', 'stingray'],
    'sea_sheet_deep.png': ['anglerfish', 'anglerfish', 'marlin', 'marlin', 'flounder', 'flounder'],
}
COLS = {'sea_sheet_deep.png': 6}
# which animals the game uses (the rest are kept out)
# (owner, Nov 3 2026: the whale had no stroke like the others; then: "strokes look ugly, take every animal's stroke
# away") no outline is added any more, and every animal's own dark outline is taken off (`unstroke`)
OUTLINE = {'whale': 1}  # the whale's own stroke is faint: a thin one like the others' (after the game thins them)
USE = {'anglerfish', 'marlin', 'flounder', 'whale', 'octopus', 'squid', 'clownfish', 'dolphin', 'sea_turtle', 'jellyfish', 'seahorse', 'shark', 'stingray'}


def unstroke(f):
    # the dark outline = near-black pixels joined to the outside (see-through) through other near-black pixels;
    # dark spots inside the body (eyes, mouth lines) are not joined to the outside, so they stay
    rgb = f[..., :3].astype(int)
    dark = (rgb.max(-1) < 48) & (f[..., 3] > 0)  # near-black only (the dark blue bodies stay)
    out = f[..., 3] == 0
    pad = np.pad(dark | out, 1, constant_values=True)
    lab, _ = ndimage.label(pad)
    keep = lab[0, 0]  # the outside (the padding is all one piece with it)
    gone = (lab[1:-1, 1:-1] == keep) & dark
    f = f.copy()
    f[gone, 3] = 0
    return f


def cut(path, names, ncol=4):
    im = np.array(Image.open(os.path.join(HERE, path)).convert('RGBA'))
    solid = im[..., 3] >= 128
    lab, n = ndimage.label(solid)
    objs = ndimage.find_objects(lab)
    sizes = ndimage.sum(solid, lab, range(1, n + 1))
    big = [(k + 1, objs[k]) for k in range(n) if sizes[k] > 400]
    # rows by the middle of each piece
    rows = len(names)
    H = im.shape[0]
    cells = {}
    for k, sl in big:
        cy = (sl[0].start + sl[0].stop) / 2
        cx = (sl[1].start + sl[1].stop) / 2
        r = min(rows - 1, int(cy / (H / rows)))
        cells.setdefault(r, []).append((cx, k, sl))
    out = {}
    for r, items in cells.items():
        items.sort()
        # pieces of one animal that are apart (a fin) join the nearest bigger one by x: group into 4 columns
        xs = [c for c, _, _ in items]
        W = im.shape[1]
        # 4 columns: split at the 3 widest gaps between the pieces' middles
        gaps = sorted(range(1, len(items)), key=lambda j: items[j][0] - items[j - 1][0])[-(ncol - 1):]
        cols, c = {}, 0
        for j, (cx, k, sl) in enumerate(items):
            if j in gaps:
                c += 1
            cols.setdefault(c, []).append(k)
        frames = []
        for c in range(ncol):
            ks = cols.get(c, [])
            m = np.isin(lab, ks)
            ys, xs2 = np.where(m)
            y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs2.min(), xs2.max() + 1
            f = im[y0:y1, x0:x1].copy()
            f[..., 3] = np.where(m[y0:y1, x0:x1], 255, 0)
            frames.append(f)  # (build q took the outline off with unstroke(f): owner said it broke them, back to this)
        out.setdefault(names[r], {})[r] = frames
    # an animal on two rows: its frames row after row
    out = {n: [f for r in sorted(rs) for f in rs[r]] for n, rs in out.items()}
    return out


def outline(a, n):
    # grow the picture by n px (room first), paint the new ring dark navy, keep the picture on top
    a = np.pad(a, ((n, n), (n, n), (0, 0)))
    solid = a[..., 3] > 0
    ring = ndimage.binary_dilation(solid, iterations=n) & ~solid
    a[ring] = (14, 20, 40, 255)
    return a


os.makedirs(OUT, exist_ok=True)
for path, names in SHEETS.items():
    for name, frames in cut(path, names, COLS.get(path, 4)).items():
        if name not in USE:
            continue
        fw = max(f.shape[1] for f in frames)
        fh = max(f.shape[0] for f in frames)
        ol = OUTLINE.get(name, 0)
        k = (MAX - 2 * ol) / max(fw, fh)
        cw, ch = max(1, round(fw * k)) + 2 * ol, max(1, round(fh * k)) + 2 * ol
        strip = Image.new('RGBA', (cw * len(frames), ch), (0, 0, 0, 0))
        for i, f in enumerate(frames):
            p = Image.fromarray(f)
            w, h = max(1, round(p.width * k)), max(1, round(p.height * k))
            p = p.resize((w, h), Image.LANCZOS)
            a = np.array(p)
            a[..., 3] = np.where(a[..., 3] >= 110, 255, 0)  # crisp edge again
            if ol:
                a = outline(a, ol)
            h, w = a.shape[:2]
            strip.paste(Image.fromarray(a), (i * cw + (cw - w) // 2, (ch - h) // 2))
        strip.save(os.path.join(OUT, name + '.png'))
        print(name, cw, ch, len(frames))
