# (owner, Nov 27 2026) wheelchair / nimbus / parachute .aseprite: the character sitting on a ride. The body in these
# files is the game's own sitting pose (sit_look.aseprite, same silhouette), so the game draws the rider with its
# sitting picture (the wearer's own clothes) and only the RIDE layers come from here, split by his layer order:
#  - a ride layer before every body layer -> back.png (behind the rider)
#  - a ride layer after the head ('shape') -> front.png: the pixels of it still showing in his whole picture (what
#    later body layers, like nimbus' right leg / front sleeve, cover is left out, so the rider's leg shows there)
#  - a ride layer between body layers but before 'shape' (parachute 'line'): where it lies on a body pixel and shows
#    -> front.png, the rest -> back.png (behind the hair)
# Prints the numbers for rides.js ASE_RIDES: the body's place in the file (bx, by: top-left of the 32 x 35 sit body)
# and the lowest drawn row. Usage: python3 art-source/rides/aseride_cut.py <root>
import sys, os, struct, zlib, json
import numpy as np
from PIL import Image

ROOT = sys.argv[1]
SRC = ROOT + '/art-source/rides/'
OUT = ROOT + '/www/assets/rides/'
FILES = {'wheelchair': ['rides'], 'nimbus': ['ride'], 'parachute': ['flying', 'line', 'line2', 'balloon']}
# (owner, Nov 28 2026: "sa nimbus dapat yung hand nasa harap tyaka yung weapon naka overlap sa nimbus") rides whose
# front layer goes UNDER the rider's front sleeve and held weapon (aserides.js `underHand`): his 'sleeve right' is
# left out when working out what of the ride shows, so the broom runs on under the hand
UNDER_HAND = {'nimbus'}
IDS = {'wheelchair': 'ride_wheelchair', 'nimbus': 'ride_nimbus', 'parachute': 'ride_parachute'}


def read(path):
    d = open(path, 'rb').read()
    _, magic, nf, W, H, depth = struct.unpack_from('<IHHHHH', d, 0)
    assert magic == 0xA5E0 and depth == 32, path
    pos, L, cels = 128, [], {}
    fsize, _, old, _ = struct.unpack_from('<IHHH', d, pos)
    n = struct.unpack_from('<I', d, pos + 12)[0] or old
    p = pos + 16
    for _ in range(n):
        cs, ct = struct.unpack_from('<IH', d, p)
        b = d[p + 6:p + cs]
        if ct == 0x2004:
            fl = struct.unpack_from('<H', b, 0)[0]
            op = b[12]
            nl = struct.unpack_from('<H', b, 16)[0]
            L.append((b[18:18 + nl].decode(), bool(fl & 1), op))
        elif ct == 0x2005:
            li, x, y, cop, c = struct.unpack_from('<HhhBH', b, 0)
            if c in (0, 2):
                w, h = struct.unpack_from('<HH', b, 16)
                raw = b[20:] if c == 0 else zlib.decompress(b[20:])
                img = np.frombuffer(raw, np.uint8)[:w * h * 4].reshape(h, w, 4)
                a = np.zeros((H, W, 4), np.uint8)
                x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
                a[y0:y1, x0:x1] = img[y0 - y:y1 - y, x0 - x:x1 - x]
                a[..., 3] = (a[..., 3].astype(int) * cop * L[li][2] // 65025).astype(np.uint8)
                cels[L[li][0]] = a
        p += cs
    return W, H, L, cels


def over(dst, src):
    m = src[..., 3] > 0
    dst[m] = src[m]


sitW, sitH, sitL, sit = read(ROOT + '/art-source/character/sit_look.aseprite')
sitm = np.zeros((35, 32), bool)
for nm, v, _ in sitL:
    if v and nm in sit:
        sitm |= sit[nm][..., 3] > 0
os.makedirs(OUT, exist_ok=True)
meta = {}
for name, ride in FILES.items():
    W, H, L, cels = read(SRC + name + '.aseprite')
    names = [nm for nm, v, _ in L if v and nm in cels]
    body = [nm for nm in names if nm not in ride]
    bm = np.zeros((H, W), bool)
    for nm in body:
        bm |= cels[nm][..., 3] > 0
    # where the sitting body sits in his file
    best = max(((np.sum(bm[y:y + 35, x:x + 32] & sitm) - np.sum(bm[y:y + 35, x:x + 32] ^ sitm), x, y)
                for y in range(H - 34) for x in range(W - 31)))
    _, bx, by = best
    # what is on top at each pixel, layer by layer (his order)
    top = np.full((H, W), -1)
    for i, nm in enumerate(names):
        if name in UNDER_HAND and nm == 'sleeve right':
            continue
        top[cels[nm][..., 3] > 0] = i
    back = np.zeros((H, W, 4), np.uint8)
    front = np.zeros((H, W, 4), np.uint8)
    ishape = names.index('shape')
    for i, nm in enumerate(names):
        if nm not in ride:
            continue
        a = cels[nm]
        m = a[..., 3] > 0
        before = np.zeros((H, W), bool)  # body pixels drawn before this layer
        for nb in names[:i]:
            if nb in body:
                before |= cels[nb][..., 3] > 0
        shows = m & (top == i)
        if not before.any():
            fr = np.zeros_like(m)
        elif i > ishape:
            fr = shows
        else:
            fr = shows & before
        bk = np.zeros_like(m) if (i > ishape and before.any()) else m & ~fr
        over(back, np.where(bk[..., None], a, 0))
        over(front, np.where(fr[..., None], a, 0))
    allm = (back[..., 3] > 0) | (front[..., 3] > 0) | bm
    ys = np.where(allm.any(axis=1))[0]
    Image.fromarray(back).save(OUT + IDS[name] + '_back.png')
    Image.fromarray(front).save(OUT + IDS[name] + '_front.png')
    # (owner: "ilagay mo yung mismong icon nila na buo") the bag icon = his WHOLE picture, rider and ride, as in his file
    ic = np.zeros((H, W, 4), np.uint8)
    for nm in names:
        over(ic, cels[nm])
    yy, xx = np.where(ic[..., 3] > 0)
    # (mirrored like the pixel wear icons: the game shows his pictures turned to face right)
    Image.fromarray(ic[yy.min():yy.max() + 1, xx.min():xx.max() + 1][:, ::-1]).save(OUT + IDS[name] + '_icon.png')
    meta[IDS[name]] = {'w': W, 'h': H, 'bx': int(bx), 'by': int(by), 'low': int(ys.max()), 'high': int(ys.min())}
    print(name, meta[IDS[name]], 'fit', best[0], 'of', sitm.sum())
print(json.dumps(meta))
