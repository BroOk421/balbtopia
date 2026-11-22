# Owner's pixel clothes (Nov 20 2026, wearables.zip): 32 x 35 .aseprite files drawn on the blocky default body, one
# layer per piece ('tshirt' + its two sleeves, 'pants', 'shoes', 'shades', 'hair'). Only that piece is taken (owner: the
# t-shirt without the shorts, the shorts without the t-shirt), fitted like blocky_cut.py (mirrored, x6, feet on row
# 213) onto a 198 x 215 canvas (the 118 frame + 40 px each side) per pose, into www/assets/wear/<id>/:
#   idle.png            standing / walking / falling / punching (shirt, pants; shoes when both feet are down)
#   walk0.png walk1.png shoes: the near / far foot one row up (walkleft.aseprite)
#   up.png              shoes going up (jump.aseprite: both feet one row up)
#   sit.png             the sitting picture (sit_look): shirt rows above the belt + its sleeves, shorts and shoes
#                       recoloured from the piece's own colours
#   sleeve_back.png sleeve_front.png  shirt sleeves (cut like <skin>/sleeve_*.png; blockybody.js turns them)
#   icon.png            the piece alone at 1 px, facing right (bag / Shop icon)
# A piece pixel that is the same as the bare body under it is left out. Skin pixels that must show where the body
# has something else (the open chest of a polo) make the piece "skinned": its pictures are written per skin tone
# (<pose>_<skin>.png), the skin recoloured like look_cut.py.
# Run:  python3 art-source/wear/pixelwear_cut.py <project root>
import sys, os, json, struct, zlib
import numpy as np
from PIL import Image

ROOT = sys.argv[1]
SRC = ROOT + '/art-source/wear/pixel/'
CHS = ROOT + '/art-source/character/'
CH = ROOT + '/www/assets/character/'
OUT = ROOT + '/www/assets/wear/'
OLD = CHS + 'old_frames_base_owner/'
# (the 'mannequin' folder is the Mannequin's dummy, not a skin tone: it uses porcelain, display.js MANN_SKIN)
SKINS = sorted(d for d in os.listdir(CH) if os.path.exists(CH + d + '/idle_open.png') and d != 'mannequin')

# file -> game id (names / prices / rarity are in www/js/wear/pixelwear.js)
ITEMS = {
    'tshirt/black.aseprite': 'midnight_tee', 'tshirt/brown.aseprite': 'brown_tee', 'tshirt/gray.aseprite': 'gray_tee',
    'tshirt/green.aseprite': 'green_tee', 'tshirt/orange.aseprite': 'orange_tee', 'tshirt/pink.aseprite': 'pink_tee',
    'tshirt/red.aseprite': 'red_tee', 'tshirt/black-smile.aseprite': 'smiley_tee',
    'tshirt/black-polo.aseprite': 'black_button_polo', 'tshirt/white-polo.aseprite': 'white_button_polo',
    'tshirt/black-polo-2.aseprite': 'charcoal_open_shirt', 'tshirt/white-polo-2.aseprite': 'white_open_shirt',
    'tshirt/red-polo.aseprite': 'red_open_shirt',
    'tshirt/black-chinese-polo.aseprite': 'black_kung_fu_shirt', 'tshirt/white-chinese-polo.aseprite': 'white_kung_fu_shirt',
    'pants/black-pants.aseprite': 'black_shorts', 'pants/blue-pants.aseprite': 'blue_shorts',
    'pants/green-pants.aseprite': 'lime_shorts', 'pants/orange-pants.aseprite': 'orange_shorts',
    'pants/red-pants.aseprite': 'red_shorts', 'pants/white-pants.aseprite': 'white_shorts',
    'shoes/assorted-shoes.aseprite': 'retro_sneakers', 'shoes/black-shoes.aseprite': 'black_sneakers',
    'shoes/black-shoes-2.aseprite': 'charcoal_sneakers', 'shoes/assorted-shoes-2.aseprite': 'cloud_sole_sneakers', 'shoes/black-slippers.aseprite': 'black_flip_flops',
    'shoes/gray-slippers.aseprite': 'gray_flip_flops', 'shoes/green-slippers.aseprite': 'green_flip_flops',
    'shoes/orange-slippers.aseprite': 'orange_flip_flops', 'shoes/red-slippers.aseprite': 'red_flip_flops',
    'shades/black-shades.aseprite': 'black_shades', 'shades/green-shades.aseprite': 'green_shades',
    'shades/yellow-shades.aseprite': 'yellow_shades',
    'hair/burst-fade.aseprite': 'burst_fade',
    'hair/burst-fade-2.aseprite': 'wild_fade', 'hair/burst-fade-3.aseprite': 'wild_side_part',
    'hair/burst-fade-red.aseprite': 'red_side_part', 'hair/burst-fade-red-2.aseprite': 'red_wild_fade',
    'hair/girl-hair.aseprite': 'bob_cut', 'hair/goodboy-hair.aseprite': 'good_boy_cut',
    'hair/white-hair.aseprite': 'silver_wild_fade', 'hair/girl-hair-yellow.aseprite': 'golden_bob_cut',
    # set-1 (owner: "the mask and the t-shirt only"): its 'mask' layer's head part = a hood (Head slot, hides the
    # hair); the 'costume' robe + its sleeves + the red line the mask layer draws down the front = a shirt
    'set/set-1.aseprite#hood': 'shadow_hood', 'set/set-1.aseprite#robe': 'shadow_robe',
    # hoodie (owner: "the whole t-shirt, the hood and the sleeves" = ONE shirt item): 'tshirt' + sleeves as a shirt, and
    # its hood ('mask') as hood_idle (hoodie.aseprite: the inner rim cut away where hair shows), hood_nohair
    # (hoodie-nohair.aseprite: with the rim) and hood_hole (the face opening the worn hair shows through: pixelwear.js)
    'hoodie/hoodie.aseprite#hoodie': 'gray_hoodie',
    # scarves (owner's scarf.zip, layer 'Scarf', Neck slot): green-black = the Royal Silk Scarf's new look (+ glow.png)
    'scarf/green-black-scarf.aseprite': 'royal_silk_scarf', 'scarf/black-scarf.aseprite': 'black_silk_scarf',
    'scarf/red-black-scarf.aseprite': 'crimson_silk_scarf',
    # cap (owner's cap.aseprite: its visible cap layer, 'Cap2'; the hidden 'Cap' is not used), Head slot
    'cap/cap.aseprite': 'trucker_cap',
    # (owner, Nov 22 2026) hat/: a piece on its own visible layer over the head ('Bonnet' = a beanie, worn like a hat on
    # the hair; frog's 'Mask' = a hood that hides the hair); bonnet.aseprite's hidden 'Mask' (the frog) is not used
    'hat/bonnet.aseprite': 'black_beanie', 'hat/frog.aseprite': 'frog_hood',
    # topless.aseprite: no sando, the 'shape' layer has abs drawn on the belly = a shirt that is bare skin (per skin tone)
    'tshirt/topless.aseprite#topless': 'six_pack_abs',
}
BODY_LAYERS = {'sleeve left', 'shape', 'short', 'sando', 'sleeve right', 'mouth', 'nose', 'eyes', 'eyebrows'}


def read_frames(path):
    """every frame: {layer: H x W x 4} plus the layer list [(name, visible)]"""
    d = open(path, 'rb').read()
    _, magic, nf, W, H, depth = struct.unpack_from('<IHHHHH', d, 0)
    assert magic == 0xA5E0 and depth == 32, path
    pos, L, frames = 128, [], []
    for _ in range(nf):
        fsize, _, old, _ = struct.unpack_from('<IHHH', d, pos)
        n = struct.unpack_from('<I', d, pos + 12)[0] or old
        p, cels = pos + 16, {}
        for _ in range(n):
            cs, ct = struct.unpack_from('<IH', d, p)
            b = d[p + 6:p + cs]
            if ct == 0x2004:
                fl = struct.unpack_from('<H', b, 0)[0]
                nl = struct.unpack_from('<H', b, 16)[0]
                L.append((b[18:18 + nl].decode(), bool(fl & 1)))
            elif ct == 0x2005:
                li, x, y, _, c = struct.unpack_from('<HhhBH', b, 0)
                if c in (0, 2):
                    w, h = struct.unpack_from('<HH', b, 16)
                    raw = b[20:] if c == 0 else zlib.decompress(b[20:])
                    a = np.zeros((H, W, 4), np.uint8)
                    a[y:y + h, x:x + w] = np.frombuffer(raw, np.uint8)[:w * h * 4].reshape(h, w, 4)
                    cels[L[li][0]] = a
                elif c == 1:
                    cels[L[li][0]] = frames[struct.unpack_from('<H', b, 16)[0]][L[li][0]]
            p += cs
        frames.append(cels)
        pos += fsize
    return frames, L


def flat(cels, L, only=None, skip=()):
    out = None
    for name, vis in L:
        if name not in cels:
            continue
        if out is None:
            out = np.zeros_like(cels[name])
        if (vis if only is None else name in only) and name not in skip:
            m = cels[name][..., 3] > 0
            out[m] = cels[name][m]
    return out


def lay(cels, name):
    return cels[name] if name in cels else None


S, FW, FH, PAD = 6, 118, 215, 40


def fit(spr):
    H0, W0 = spr.shape[:2]
    big = np.array(Image.fromarray(spr).resize((W0 * S, H0 * S), Image.NEAREST))[:, ::-1]
    X_OFF, Y_OFF = (FW - W0 * S) // 2 + PAD, 214 - H0 * S
    out = np.zeros((FH, FW + 2 * PAD, 4), np.uint8)
    x0 = max(0, X_OFF)
    sx0 = x0 - X_OFF
    w = min(out.shape[1] - x0, big.shape[1] - sx0)
    out[Y_OFF:Y_OFF + big.shape[0], x0:x0 + w] = big[:, sx0:sx0 + w]
    return out


def fitm(m):
    a = np.zeros(m.shape + (4,), np.uint8)
    a[m] = 255
    return fit(a)[..., 3] > 0


# ---- the bare body (porcelain) the pieces are drawn on ----
lf, lL = read_frames(CHS + 'default_look.aseprite')
look = lf[0]
body = flat(look, lL)  # visible = no sleeves
SKIN_COLS = set()
for nm in ('shape', 'sleeve left', 'sleeve right'):
    a = look[nm]
    for px in a[a[..., 3] > 0][:, :3]:
        SKIN_COLS.add(tuple(int(v) for v in px))
SKIN_COLS -= {tuple(int(v) for v in px) for px in look['short'][look['short'][..., 3] > 0][:, :3]}
walkf, _ = read_frames(CHS + 'walkleft.aseprite')
sitf, sitL = read_frames(CHS + 'sit_look.aseprite')
sit = sitf[0]
sit_full = flat(sit, sitL, skip=('sleeve right',))  # the game draws the front sleeve itself when sitting


def is_skin(a):
    m = np.zeros(a.shape[:2], bool)
    for c in SKIN_COLS:
        m |= (a[..., :3] == c).all(axis=2)
    return m & (a[..., 3] > 0)


def piece(a, under):
    """keep a piece pixel only where it differs from the bare body; returns (rgba, skin-to-show mask)"""
    a = a.copy()
    same = (a[..., 3] > 0) & (a[..., :3] == under[..., :3]).all(axis=2) & (under[..., 3] > 0)
    a[same] = 0
    return a, is_skin(a)


# skin tone factors (as look_cut.py / blocky_cut.py)
def skin_mask(p):
    r, g, b = p[..., 0].astype(int), p[..., 1].astype(int), p[..., 2].astype(int)
    l = 0.3 * r + 0.59 * g + 0.11 * b
    return (p[..., 3] > 0) & (r > g) & (g > b) & (r - b > 45) & (l > 45)


def common(p, m):
    cols = p[m][:, :3].astype(int) // 4
    keys, cnt = np.unique(cols[:, 0] * 65536 + cols[:, 1] * 256 + cols[:, 2], return_counts=True)
    k = keys[cnt.argmax()]
    return np.array([k // 65536, (k // 256) % 256, k % 256]) * 4 + 2


idle_fr = np.array(Image.open(CH + 'porcelain/idle_open.png').convert('RGBA'))  # only for the face box
Y_OFF0 = 214 - 35 * S
new_face = (slice(Y_OFF0 + 9 * S, Y_OFF0 + 21 * S), slice(20, 100))
old_face = (slice(10, 70), slice(15, 105))
base_idle = fit(body)[:, PAD:PAD + FW]
src = common(base_idle[new_face], skin_mask(base_idle[new_face]))
old_por = np.array(Image.open(OLD + 'porcelain/idle_open.png').convert('RGBA'))
old_skin = skin_mask(old_por[old_face])
FACT = {}
for s in SKINS:
    old_open = np.array(Image.open(OLD + s + '/idle_open.png').convert('RGBA'))
    FACT[s] = common(old_open[old_face], old_skin) / src


def save_pose(dirn, name, rgba, skinm, skinned):
    rgba = rgba.copy()
    rgba[rgba[..., 3] == 0] = 0
    if not skinned:
        Image.fromarray(rgba).save(f'{dirn}/{name}.png')
        return
    for s in SKINS:
        o = rgba.copy()
        o[..., :3][skinm] = np.clip(o[..., :3][skinm] * FACT[s], 0, 255)
        Image.fromarray(o).save(f'{dirn}/{name}_{s}.png')


def shift_feet(a, cols, up=1):
    """move rows >= 32 of these sprite columns up by `up` (a foot lifted); what lands above row 32 is dropped"""
    o = a.copy()
    sub = a[:, cols].copy()
    o[32:, cols] = 0
    for y in range(32 + up, 35):
        o[y - up, cols] = sub[y]
    return o


def sleeve_crop(name):
    a = look[name]
    ys, xs = np.where(a[..., 3] > 0)
    return ys.min(), ys.max() + 1, xs.min(), xs.max() + 1


def rowcol(a, y, skinm):
    """the most common non-skin colour of a sprite row of a piece (None if none)"""
    m = (a[y, :, 3] > 0) & ~skinm[y]
    if not m.any():
        return None
    cols = [tuple(int(v) for v in c) for c in a[y, m, :3]]
    return max(set(cols), key=cols.count)


# set-1's mask layer: rows above this are the hood (its collar reaches row 23 since the owner's update), below the
# robe's red line
HOOD_ROWS = 24
# caps the hair shows only BELOW (pixelwear.js PXW_CAP_HAIR): none now (the Trucker Cap was put back to a normal hat)
CAP_HAIR_HOLE = set()


def shift(a, dx, dy):
    o = np.zeros_like(a)
    H_, W_ = a.shape[:2]
    o[max(0, dy):H_ + min(0, dy), max(0, dx):W_ + min(0, dx)] = a[max(0, -dy):H_ - max(0, dy), max(0, -dx):W_ - max(0, dx)]
    return o


def align(cels, name):
    """(owner, Nov 20 2026: in the scarf files he moved the BODY 4 px left) every layer is moved by how far the file's
    'shape' (the bare body) is from the default body's, so each piece sits on the game's character as in his file"""
    if 'shape' not in cels:
        return cels
    S, D = cels['shape'][..., 3] > 0, look['shape'][..., 3] > 0
    best = max(((np.sum(shift(S, dx, dy) & D) - np.sum(shift(S, dx, dy) ^ D), dx, dy) for dy in range(-8, 9) for dx in range(-10, 11)))
    _, dx, dy = best
    if dx or dy:
        print('  ', name, 'body moved in the file: shifting the pieces by', dx, dy)
        cels = {k: shift(v, dx, dy) for k, v in cels.items()}
    return cels


meta = {}
NEARL, FARL = slice(0, 15), slice(15, 32)  # sprite columns of the two feet (sprite faces left)
for f, iid in ITEMS.items():
    f, part = (f.split('#') + [None])[:2]
    frames, L = read_frames(SRC + f)
    cels = align(dict(frames[0]), f)
    cat = f.split('/')[0]
    if part == 'robe':  # the robe as a shirt: costume + the mask layer's lines under the head
        cat = 'tshirt'
        t = cels['costume'].copy()
        m = cels['mask'].copy()
        m[:HOOD_ROWS] = 0
        t[m[..., 3] > 0] = m[m[..., 3] > 0]
        cels['tshirt'] = t
    elif part == 'hoodie':  # a shirt with a hood the hair shows through (pixelwear.js PXW_HOOD)
        cat = 'tshirt'
        nf, _ = read_frames(SRC + f.replace('.aseprite', '-nohair.aseprite'))
        nohair_hood = align(dict(nf[0]), f)['mask'].copy()
        # the opening: per row, what lies between the hood's left and right side (the ring may be open at the chin)
        solid = cels['mask'][..., 3] > 0
        hole = np.zeros_like(solid)
        for y in range(solid.shape[0]):
            xs = np.where(solid[y])[0]
            if len(xs) >= 2:
                hole[y, xs.min():xs.max() + 1] = True
        hole &= ~solid
        # (owner, Nov 20 2026: "a line shows between the hair and the hoodie") the hood's dark INNER outline next to the
        # opening is part of the opening too: the hair is drawn over the hood there (pixelwear.js draws the hood first),
        # so the hair runs straight into the gray; where there is no hair the outline stays
        near = np.zeros_like(hole)
        near[1:] |= hole[:-1]
        near[:-1] |= hole[1:]
        near[:, 1:] |= hole[:, :-1]
        near[:, :-1] |= hole[:, 1:]
        rgb = cels['mask'][..., :3].astype(int)
        dark = solid & (rgb.sum(axis=2) < 300)
        hole = hole | (near & dark)
        hole_rgba = np.zeros_like(cels['mask'])
        hole_rgba[hole] = 255
    elif part == 'topless':  # bare chest: the file's body (with the abs) where the sando was; all of it skin
        cat = 'tshirt'
        t = cels['shape'].copy()
        t[look['sando'][..., 3] == 0] = 0
        cels['tshirt'] = t
    elif part == 'hood':  # the hood: the mask layer above the shoulders, drawn like a hat
        cat = 'hat'
        m = cels['mask'].copy()
        m[HOOD_ROWS:] = 0
        cels['hood'] = m
    d = OUT + iid
    os.makedirs(d, exist_ok=True)
    for old in os.listdir(d):
        os.remove(d + '/' + old)
    poses = {}
    skinned = False
    if cat == 'tshirt':
        # the shirt replaces the white sando: where the sando shows and the shirt doesn't (a polo's open chest), the
        # bare body (shape layer = skin) is put back
        tsh = cels['tshirt'].copy()
        bare = (look['sando'][..., 3] > 0) & (body == look['sando']).all(axis=2) & (tsh[..., 3] == 0)
        tsh[bare] = look['shape'][bare]
        t, tsk = piece(tsh, body)
        poses['idle'] = (t, tsk)
        # sitting: the shirt above the belt (sprite rows <= 27), its sleeves where the sitting sleeves are
        ts = tsh.copy()
        sbare = (sit['sando'][..., 3] > 0) & (sit_full == sit['sando']).all(axis=2) & (ts[..., 3] == 0)
        ts[sbare] = sit['shape'][sbare]
        ts, tss = piece(ts, sit_full)
        ts[28:] = 0
        tss[28:] = False
        for nm in ('sleeve left',):  # (the front sleeve: sleeve_front.png, drawn with the turned sleeve)
            sl, slk = piece(cels[nm], look[nm])
            m = (sl[..., 3] > 0) & (sit[nm][..., 3] > 0) & (sit_full == sit[nm]).all(axis=2)
            ts[m] = sl[m]
            tss |= slk & m
        poses['sit'] = (ts, tss)
        sleeves = {}
        for nm, out in (('sleeve left', 'sleeve_back'), ('sleeve right', 'sleeve_front')):
            sl, slk = piece(cels[nm], look[nm])
            y0, y1, x0, x1 = sleeve_crop(nm)
            sleeves[out] = (sl[y0:y1, x0:x1][:, ::-1], slk[y0:y1, x0:x1][:, ::-1])
        skinned = any(m.any() for _, m in poses.values()) or any(m.any() for _, m in sleeves.values())
        for nm, (a, m) in sleeves.items():
            save_pose(d, nm, a, m, skinned)
        icon = np.zeros_like(cels['tshirt'])
        for nm in ('sleeve left', 'tshirt', 'sleeve right') + (('mask',) if part == 'hoodie' else ()):  # (from cels: the robe's 'tshirt' is made above; a hoodie's hood too)
            m = cels[nm][..., 3] > 0
            icon[m] = cels[nm][m]
        if part != 'topless':  # (topless: the icon IS the bare chest)
            icon[is_skin(icon)] = 0
    elif cat == 'pants':
        pa = cels['pants'].copy()
        bare = (look['short'][..., 3] > 0) & (body == look['short']).all(axis=2) & (pa[..., 3] == 0)
        pa[bare] = look['shape'][bare]  # the default navy shorts don't peek out from under them
        p_, psk = piece(pa, body)
        poses['idle'] = (p_, psk)
        # sitting: the sitting shorts recoloured from the piece's own colours by brightness (darkest -> darkest)
        pc = sorted({tuple(int(v) for v in c) for c in cels['pants'][cels['pants'][..., 3] > 0][:, :3]}, key=sum)
        sh = sit['short']
        ps = np.zeros_like(sh)
        vis = (sh[..., 3] > 0) & (sit_full == sh).all(axis=2)
        legs = vis.copy()
        legs[32:] = False  # rows 32-34 of the sitting shorts are the shoes
        sc = sorted({tuple(int(v) for v in c) for c in sh[legs][:, :3]}, key=sum)
        for i, c in enumerate(sc):
            m = legs & (sh[..., :3] == c).all(axis=2)
            ps[m] = (*pc[min(len(pc) - 1, round(i * (len(pc) - 1) / max(1, len(sc) - 1)))], 255)
        poses['sit'] = (ps, np.zeros(ps.shape[:2], bool))
        icon = cels['pants'].copy()
    elif cat == 'shoes':
        s_, ssk = piece(cels['shoes'], body)
        poses['idle'] = (s_, ssk)
        for i, w in enumerate((walkf[0], walkf[1])):
            # the lifted foot: the walk file's shape has the foot one row higher there
            lifted_near = (w['shape'][34, NEARL, 3] == 0).all()
            cols = NEARL if lifted_near else FARL
            a = shift_feet(cels['shoes'], cols)
            under = body.copy()
            under[32:] = 0
            under[32:] = w['shape'][32:]
            poses['walk%d' % i] = piece(a, under)
        jf, _ = read_frames(CHS + 'jump.aseprite')
        a = shift_feet(cels['shoes'], slice(0, 32))
        under = body.copy()
        under[32:] = jf[0]['shape'][32:]
        poses['up'] = piece(a, under)
        # sitting: the sitting shoes (shorts layer rows 32-34) in the shoe's colour per row
        sh = sit['short']
        ps = np.zeros_like(sh)
        for y in range(32, 35):
            c = rowcol(cels['shoes'], y, ssk | is_skin(cels['shoes'])) or rowcol(cels['shoes'], 34, ssk)
            m = sh[y, :, 3] > 0
            ps[y, m] = (*c, 255)
        poses['sit'] = (ps, np.zeros(ps.shape[:2], bool))
        icon = cels['shoes'].copy()
        icon[is_skin(icon)] = 0
    else:  # shades / hair / hood: drawn by WEAR_ART over the head in every pose (the head is in the same place in all)
        # (hair: the visible layer whose name starts with 'hair': girl-hair uses 'hair2', goodboy-hair 'hair2 Copy')
        lname = ('shades' if cat == 'shades' else 'hood' if cat == 'hat' and 'hood' in cels
                 else next(n for n, v in reversed(L) if v and n not in BODY_LAYERS and n in cels) if cat == 'hat' else 'Scarf' if cat == 'scarf'
                 else next(n for n, v in L if v and n.startswith('Cap') and n in cels) if cat == 'cap'
                 else next(n for n, v in L if v and n.startswith('hair') and n in cels))
        a, ask = piece(cels[lname], body)
        poses['idle'] = (a, ask)
        icon = cels[lname].copy()
    if part == 'hoodie':
        for nm, a in (('hood_idle', cels['mask']), ('hood_nohair', nohair_hood), ('hood_hole', hole_rgba)):
            save_pose(d, nm, fit(a), np.zeros((FH, FW + 2 * PAD), bool), False)
    if cat == 'cap' and iid in CAP_HAIR_HOLE:
        # (owner, Nov 20 2026: "like the hoodie, but the hair only below the cap") hair_hole.png: where the worn hair may
        # show: under the cap's lowest pixel in each column; beside the cap, only below its bottom row
        cm = cels[lname][..., 3] > 0
        ys, xs = np.where(cm)
        hole = np.zeros_like(cm)
        for x in range(cm.shape[1]):
            col = np.where(cm[:, x])[0]
            hole[(col.max() + 1 if len(col) else ys.max() + 1):, x] = True
        hr = np.zeros(cm.shape + (4,), np.uint8)
        hr[hole] = 255
        save_pose(d, 'hair_hole', fit(hr), np.zeros((FH, FW + 2 * PAD), bool), False)
    if iid == 'royal_silk_scarf':
        # a soft green glow round the scarf (pixelwear.js draws it under the scarf, pulsing), at frame resolution
        from PIL import ImageFilter
        al = Image.fromarray((fit(cels['Scarf'])[..., 3] > 0).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(7))
        a = np.array(al).astype(float) / 255
        gl = np.zeros(a.shape + (4,), np.uint8)
        gl[..., 0], gl[..., 1], gl[..., 2] = 120, 255, 110
        gl[..., 3] = np.clip(a * 1.6 * 255, 0, 255).astype(np.uint8)
        Image.fromarray(gl).save(d + '/glow.png')
    skinned = skinned or any(m.any() for _, m in poses.values())
    for nm, (a, m) in poses.items():
        save_pose(d, nm, fit(a), fitm(m), skinned)
    ys, xs = np.where(icon[..., 3] > 0)
    Image.fromarray(icon[ys.min():ys.max() + 1, xs.min():xs.max() + 1][:, ::-1]).save(d + '/icon.png')
    meta[iid] = {'cat': cat, 'sk': skinned, 'poses': sorted(poses)}
    print(iid, cat, 'skinned' if skinned else '', sorted(poses))
json.dump(meta, open(ROOT + '/art-source/wear/pixelwear_meta.json', 'w'), indent=1)
