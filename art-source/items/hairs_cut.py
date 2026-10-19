# Cuts the 9 hairstyles out of the owner's sheet (10 figures: the first is bald) and fits them on our head.
# Every figure is the same body, so: line each figure up with the bald one, and the hair is every solid
# pixel that the bald figure doesn't have (or has in another colour). The faint glow round the figures
# (the "white" left over) is dropped by only taking solid pixels.
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from scipy.signal import fftconvolve
a = np.asarray(Image.open('sheet.png').convert('RGBA')).astype(float)
a = np.pad(a, ((0, 0), (0, 160), (0, 0)))  # room right of the last figure
H, W, _ = a.shape
A = a[..., 3]
SOLID = A >= 235
def outline(r):
    return ((r[..., :3].max(2) < 80) & (r[..., 3] > 200)).astype(float)
# bodies (pants/shoes columns)
body = (A[400:500] > 240).sum(0)
cols = np.where(body > 5)[0]
runs = []; s = p = cols[0]
for c in cols[1:]:
    if c > p + 6: runs.append((s, p)); s = c
    p = c
runs.append((s, p))
# a long-haired figure's run is wide (hair beside the body): use the shoes row for the body centre
def body_cx(r0, r1):
    sub = A[520:545, r0 - 10:r1 + 10] > 240
    xs = np.where(sub.any(0))[0]
    return r0 - 10 + (xs.min() + xs.max()) / 2
centres = [body_cx(*r) for r in runs]
# the bald figure (0): crop and its fit on our head (found by tools/align.py on the head band)
BX, BY = 20, 230
S, TX, TY = 0.689, -7, -13
bald = a.copy()
# shift of every figure against the bald one: correlate outlines of the face and body
ref_band = (slice(330, 560),)
def shift_of(k):
    cx = centres[k] - centres[0]
    x0 = int(round(centres[0] - 100)); x1 = x0 + 200
    R = outline(a[330:560, x0:x1])
    best = None
    for dy in range(-6, 7):
        for dx in range(int(cx) - 8, int(cx) + 9):
            F = outline(a[330 + dy:560 + dy, x0 + dx:x1 + dx])
            sc = (nd.gaussian_filter(R, 1) * F).sum()
            if best is None or sc > best[0]: best = (sc, dx, dy)
    return best[1], best[2]
# rows of the bald figure's eyebrows and eyes (sheet y)
EYE_BAND = (322, 384)
# the bald figure's eyes and eyebrows, sheet x0, y0, x1, y1 (eye whites at x 95-185, y 336-367)
EYE_BOX = (88, 322, 192, 374)
# output canvas in body-sprite pixels
OX0, OY0, OW, OH = -70, -60, 260, 300
NAMES = ['messy_black', 'silver', 'brown_spike', 'black_bun', 'long_black', 'pink_bun', 'blonde_band', 'black_bob', 'red_ponytail']
meta = {}
for k in range(1, len(runs)):
    dx, dy = shift_of(k)
    x0 = int(round(centres[0] - 110)); x1 = x0 + 220
    y0, y1 = 150, 600
    fig = a[y0 + dy:y1 + dy, x0 + dx:x1 + dx]
    bal = a[y0:y1, x0:x1]
    fsolid = fig[..., 3] >= 235
    bsolid = bal[..., 3] >= 200
    strict = np.abs(fig[..., :3] - bal[..., :3]).sum(2)
    hair = fsolid & (~bsolid | (strict > 70))
    # clean: drop thin seams along the face outline and small specks
    hair = nd.binary_opening(hair, iterations=1)
    # in the band of the eyebrows and eyes: pieces that don't join the hair above the band are bits of
    # the face (eyes, lashes, eyebrows), not hair
    band = np.zeros_like(hair)
    band[EYE_BAND[0] - y0:EYE_BAND[1] - y0, :] = True
    inb, nb = nd.label(hair & band)
    above_band = np.zeros_like(hair); above_band[:EYE_BAND[0] - y0, :] = True
    outside = nd.binary_dilation(hair & above_band, iterations=1)  # hair always comes down from above
    for i in range(1, nb + 1):
        piece = inb == i
        if not (piece & outside).any():
            hair &= ~piece
    # the eyes and eyebrows (the bald figure's eye box, a little bigger): no eye whites, no pupils or eye lines,
    # and only colours the hair itself has (taken from the hair outside the bald head)
    from scipy.spatial import cKDTree
    # sure hair: outside the bald head, and the top of the head (well above the eyebrows)
    toprow = np.zeros_like(hair); toprow[:EYE_BAND[0] - y0 - 18, :] = True
    sure = (fsolid & ~nd.binary_dilation(bsolid, iterations=2)) | (hair & toprow)
    pal = cKDTree(fig[sure][:, :3]) if sure.any() else None
    eb = np.zeros_like(hair)
    eb[EYE_BOX[1] - y0:EYE_BOX[3] - y0, EYE_BOX[0] - x0:EYE_BOX[2] - x0] = True
    cand = hair & eb
    cc = fig[cand][:, :3]
    white = cc.min(1) > 215
    dark = cc.max(1) < 70
    near_hair = pal.query(cc)[0] < 28 if pal is not None else np.zeros(len(cc), bool)
    drop = white | dark | ~near_hair
    hair[cand] = ~drop
    # no skin: on the bald head, a pixel closer to the bald figure's skin colours than to the hair's own colours
    # is part of the face (forehead, ears, cheeks), not hair
    bskin = bsolid & (bal[..., 0] > 150) & (bal[..., 0] - bal[..., 2] > 30) & (bal[..., :3].max(2) - bal[..., :3].min(2) > 25)
    skin_pal = cKDTree(np.unique((bal[bskin][:, :3] // 4).astype(int), axis=0) * 4 + 2)
    on = hair & bsolid
    cc = fig[on][:, :3]
    dh = pal.query(cc)[0] if pal is not None else np.full(len(cc), 1e9)
    ds = skin_pal.query(cc)[0]
    hair[on] = ~((ds < dh) & (ds < 22))  # only clearly skin-coloured pixels are dropped
    # dark face lines (eyebrows, the face outline): on the bald head, a dark pixel stays only right next to the
    # hair's own (not dark) colours
    darkpx = fig[..., :3].max(2) < 95
    if pal is not None:
        # dark hair (black hair) is hair: only dark pixels unlike the hair's own colours are face lines
        dk = darkpx & hair
        dd = np.zeros(fig.shape[:2])
        dd[dk] = pal.query(fig[dk][:, :3])[0]
        darkpx = dk & (dd > 22)
    lit = hair & ~darkpx
    hair &= ~(darkpx & bsolid & ~nd.binary_dilation(lit, iterations=2))
    lab, n = nd.label(hair)
    sizes = nd.sum(np.ones_like(hair, float), lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz >= 60])
    # only pieces touching (or right next to) the main hair: not bits of the next figure's hair
    main = lab == (int(np.argmax(sizes)) + 1)
    near = nd.binary_dilation(main, iterations=5)
    ok = [i for i in range(1, n + 1) if (near & (lab == i)).any()]
    keep &= np.isin(lab, ok)
    # fill small holes inside the hair (shine pixels that match the bald figure)
    # fill small holes inside the hair (not the face: that is a big hole)
    holes = nd.binary_fill_holes(keep) & ~keep
    hl, hn = nd.label(holes)
    if hn:
        hs = nd.sum(np.ones_like(holes, float), hl, range(1, hn + 1))
        keep |= np.isin(hl, [i + 1 for i, z in enumerate(hs) if z < 40]) & fsolid
        # any hole wholly above the eyebrows is inside the hair (the top of the head), not the face
        top = EYE_BAND[0] - y0 - 4
        for i, sl in enumerate(nd.find_objects(hl)):
            if sl is not None and sl[0].stop <= top:
                keep |= (hl == i + 1) & fsolid
    # the icon: the same hair, with every gap inside it (down to the eyebrows) filled from the picture, so it looks
    # whole on its own (on the head these gaps show our own face, as they should)
    brow = EYE_BAND[0] - y0
    ic = keep.copy()
    for yy_ in range(0, brow):
        xs = np.where(keep[yy_])[0]
        if len(xs) > 1:
            ic[yy_, xs.min():xs.max() + 1] |= fsolid[yy_, xs.min():xs.max() + 1]
    colsk = keep[:brow].any(0)
    for xx_ in np.where(colsk)[0]:
        ys = np.where(keep[:brow, xx_])[0]
        ic[ys.min():brow, xx_] &= True
    ic = ic & (keep | (np.arange(ic.shape[0])[:, None] < brow))
    icon_rgba = fig.copy()
    icon_rgba[..., 3] = np.where(ic, 255, 0)
    rgba = fig.copy()
    rgba[..., 3] = np.where(keep, 255, 0)
    # premultiply, scale, unpremultiply (clean edges)
    pm = rgba.copy(); pm[..., :3] *= pm[..., 3:4] / 255
    im = Image.fromarray(pm.astype(np.uint8), 'RGBA')
    big = np.asarray(im.resize((round(im.width * S), round(im.height * S)), Image.LANCZOS)).astype(float)
    al = np.maximum(big[..., 3:4], 1)
    big[..., :3] = np.clip(big[..., :3] * 255 / al, 0, 255)
    big = Image.fromarray(big.astype(np.uint8), 'RGBA')
    out = Image.new('RGBA', (OW, OH))
    # sheet (x0, y0) of the bald frame maps to our sprite at S*(x0-BX)+TX, S*(y0-BY)+TY
    px = S * (x0 - BX) + TX - OX0
    py = S * (y0 - BY) + TY - OY0
    out.alpha_composite(big, (round(px), round(py)))
    bb = out.getbbox()
    out = out.crop(bb)
    name = NAMES[k - 1]
    out.save('hair_' + name + '.png', optimize=True)
    # the icon, cut and placed the same way
    pm2 = icon_rgba.copy(); pm2[..., :3] *= pm2[..., 3:4] / 255
    b2 = np.asarray(Image.fromarray(pm2.astype(np.uint8), 'RGBA').resize((round(icon_rgba.shape[1] * S), round(icon_rgba.shape[0] * S)), Image.LANCZOS)).astype(float)
    b2[..., :3] = np.clip(b2[..., :3] * 255 / np.maximum(b2[..., 3:4], 1), 0, 255)
    o2 = Image.new('RGBA', (OW, OH)); o2.alpha_composite(Image.fromarray(b2.astype(np.uint8), 'RGBA'), (round(px), round(py)))
    o2 = o2.crop(bb)
    ib = o2.getbbox(); o2 = o2.crop(ib)
    sq = max(o2.size); ico = Image.new('RGBA', (sq, sq)); ico.alpha_composite(o2, ((sq - o2.width) // 2, (sq - o2.height) // 2))
    ico.resize((64, 64), Image.LANCZOS).save('hair_' + name + '_icon.png', optimize=True)
    meta[name] = dict(x=bb[0] + OX0, y=bb[1] + OY0, w=bb[2] - bb[0], h=bb[3] - bb[1])
    print(name, 'shift', dx, dy, meta[name])
json.dump(meta, open('meta.json', 'w'))
