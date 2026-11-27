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
# Run:  python3 art-source/wear/pixelwear_cut.py <project root> [id ...]
# (Nov 23 2026) give ids to cut only those: a full re-run does NOT reproduce every committed picture (some were
# fixed after, e.g. pixelwear_gapfix.py), so cut new items alone. pixelwear_meta.json is merged, not replaced.
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
    # (owner, Nov 23 2026: new.zip "bigotes") mustaches / beards (Mustache slot): each its own visible layer over the face
    'stache/bigote.aseprite': 'handlebar_mustache', 'stache/bigote2.aseprite': 'gentleman_mustache',
    'stache/short-bigote.aseprite': 'button_mustache', 'stache/mashtache.aseprite': 'silver_walrus_mustache',
    'stache/messy.aseprite': 'grandpa_beard', 'stache/full-bigote.aseprite': 'lumberjack_beard',
    # eyeliner (Eyes slot): no layer of its own, his 'eyes' layer is redrawn with dark rims: the pixels that differ
    'eye/eyeliner.aseprite': 'bold_eyeliner',
    # (owner, Nov 25 2026: eye-1.aseprite, "an eye wearable") 7 frames of 100 ms, the eyes glancing round: frame 0 is
    # idle.png, frames 1-6 idle_f1..idle_f6.png (pixelwear.js PXW_ANIM plays them)
    'eye/eye-1.aseprite': 'shifty_eyes',
    # hairs ('hair' layer). Hime Cut = girl-long-hair.aseprite (owner's fixed file, Nov 23 2026; replaced girlhair.aseprite,
    # 3 px different), and the flipped bob came only as a PNG (girl-hair.png, kept as flip-bob.png): a .png is the whole figure, the hair = what differs
    # from the bare body
    'hair/goodboy.aseprite': 'brown_neat_cut', 'hair/black-goodboy.aseprite': 'black_neat_cut',
    'hair/red-goodboy.aseprite': 'red_neat_cut', 'hair/black-long-hair.aseprite': 'black_wolf_cut',
    'hair/black-long-hair-2.aseprite': 'messy_wolf_cut', 'hair/red-long-hair.aseprite': 'red_wolf_cut',
    'hair/emo.aseprite': 'emo_fringe', 'hair/girl-long-hair.aseprite': 'hime_cut', 'hair/flip-bob.png': 'flipped_bob',
    'hair/poka.aseprite': 'cherry_space_buns', 'hair/shaggy.aseprite': 'professor_tufts',
    # (owner, Nov 23 2026 b) white spiky hair, black-lens shades, and a face with no eyes / mouth: 'blank/' = what of
    # the head differs from the bare body (skin over the eyes and mouth), so it is written per skin tone
    'hair/white-hair.aseprite': 'frost_spikes', 'shades/black-shade.aseprite': 'onyx_shades',
    'blank/faceless.aseprite': 'blank_face',
    # (owner, Nov 23 2026 c) a short black rocker mohawk and a big afro
    'hair/rockstar.aseprite': 'rocker_mohawk', 'hair/afro.aseprite': 'fluffy_afro',
    # (owner, Nov 25 2026: new.zip) three jackets with a flared collar and a furry caveman top: their layer is 'shirt'
    # (read as 'tshirt'), the sleeves are the bare arms; and a messy brown mop of hair
    'tshirt/shirt-1.aseprite': 'gold_trim_jacket', 'tshirt/shirt-2.aseprite': 'crimson_trim_jacket',
    'tshirt/shirt-3.aseprite': 'silver_trim_jacket', 'tshirt/shirt-4.aseprite': 'caveman_fur',
    'hair/messy-hair.aseprite': 'messy_mop',
    # (owner, Nov 27 2026: horn-1.aseprite, 10 frames of 100 ms) two blue horns; Nov 28 his new file has no hair
    # ("tinanggal ko yung buhok, yung horn dapat sa hat"): a HAT. Its 'horn', 'fx' (a soft glow, frames 7-9) and
    # 'line' (the shine running up the horns) layers together are ONE picture (COMBINE), every frame its own
    # (idle.png, idle_f1..f9.png: pixelwear.js PXW_ANIM)
    'hat/horn-1.aseprite': 'frost_horns',
    # (owner, Nov 28 2026: devil.aseprite 9 frames, devil2.aseprite 11 frames of 100 ms) two more horn hats like it:
    # 'glow' (a soft glow, the last frames), 'horn', 'line' (the shine) blended (COMBINE)
    'hat/devil.aseprite': 'devil_horns',
    'hat/devil2.aseprite': 'azure_horns',
    # (owner, Nov 25 2026: "the default character has no sando and no shorts: make the blue shorts and the white sando
    # wearables") bare/default_bare.aseprite = his default_look without them. The body frames stay as they were (with
    # them): pixelwear.js paints these two hidden pieces over an EMPTY shirt / pants slot instead (per skin tone):
    #   bare_chest = his bare body where the sando was (+ his sleeves, one lighter pixel each), bare_legs = where the
    #   shorts were. The sando / shorts as items (bare/default_dressed.aseprite = the old default_look): their pictures
    #   are empty (they ARE the body frame), only the icon and the sitting shorts are drawn.
    'bare/default_bare.aseprite#topless': 'bare_chest', 'bare/default_bare.aseprite#bareshorts': 'bare_legs',
    'bare/default_dressed.aseprite#sando': 'white_sando', 'bare/default_dressed.aseprite#shorts': 'navy_shorts',
    # (owner, Nov 26 2026: banana / orange / clown / spartan / gold-spartan / mask / warrior .aseprite; names by Claude)
    # head pieces drawn over the head ('hat' = the last visible non-body layer: banana / orange 'mask2' - their hidden
    # 'mask' is not used -, clown 'hat', the spartans 'helmet', mask 'mask'); some reach past the body's 32 columns
    # (WIDE). The warrior's four layers are four items: helmet, armor (abs: a bare-chest shirt), pants, boots (sandals).
    'hat/banana.aseprite': 'banana_suit', 'hat/orange.aseprite': 'orange_suit', 'hat/clown.aseprite': 'jester_hat',
    'hat/spartan.aseprite': 'spartan_helmet', 'hat/gold-spartan.aseprite': 'golden_spartan_helmet',
    'hat/mask.aseprite': 'smiling_mask',
    'set/warrior.aseprite#helmet': 'warrior_helmet', 'set/warrior.aseprite#armor': 'warrior_abs',
    'set/warrior.aseprite#pants': 'warrior_loincloth', 'set/warrior.aseprite#boots': 'warrior_sandals',
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


def fit(spr, side=(0, 0)):
    """side: (left, right) sprite columns past the body's 32 (the picture is that much wider each side, kept even)"""
    if side != (0, 0):
        # the picture gets sw = max(side) sprite columns more on BOTH sides (so it stays centred on the body: pixelwear.js
        # draws it sw * 6 px further left); mirrored like the rest, so the file's right-hand columns end up on the left
        L_, R_ = side
        sw = max(side)
        H0, W0 = spr.shape[:2]
        extra = max(0, H0 - 35)
        big = np.array(Image.fromarray(spr).resize((W0 * S, H0 * S), Image.NEAREST))[:, ::-1]
        out = np.zeros((FH + extra * S, FW + 2 * PAD + 2 * sw * S, 4), np.uint8)
        X_OFF, Y_OFF = (FW - 32 * S) // 2 + PAD + sw * S - R_ * S, 214 - H0 * S + extra * S
        out[Y_OFF:Y_OFF + big.shape[0], X_OFF:X_OFF + big.shape[1]] = big
        return out
    H0, W0 = spr.shape[:2]
    # (Nov 23 2026: the afro's file is 5 rows taller, the body 5 rows lower) rows over the normal 35 make the picture
    # that much taller at the top (pixelwear.js PXW_TOP draws it that much higher)
    extra = max(0, H0 - 35)
    big = np.array(Image.fromarray(spr).resize((W0 * S, H0 * S), Image.NEAREST))[:, ::-1]
    X_OFF, Y_OFF = (FW - W0 * S) // 2 + PAD, 214 - H0 * S + extra * S
    out = np.zeros((FH + extra * S, FW + 2 * PAD, 4), np.uint8)
    x0 = max(0, X_OFF)
    sx0 = x0 - X_OFF
    w = min(out.shape[1] - x0, big.shape[1] - sx0)
    out[Y_OFF:Y_OFF + big.shape[0], x0:x0 + w] = big[:, sx0:sx0 + w]
    return out


def fitm(m, side=(0, 0)):
    a = np.zeros(m.shape + (4,), np.uint8)
    a[m] = 255
    return fit(a, side)[..., 3] > 0


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


SIDE_MAX = 11  # columns past the body each side a head piece may have (pixelwear.js draws them in its 110 px art pad)
HAT_OPEN = {'banana_suit': 'inside', 'orange_suit': 'inside', 'spartan_helmet': 'inside', 'golden_spartan_helmet': 'inside', 'warrior_helmet': 'inside', 'jester_hat': 'below'}
HAT_EXTRA = {'spartan_helmet': ['sleeve left']}  # head pieces partly drawn on another layer (see the hat branch)
COMBINE = {'frost_horns': ('hornset', ['horn', 'fx', 'line']), 'devil_horns': ('hornset', ['glow', 'horn', 'line']),
           'azure_horns': ('hornset', ['glow', 'horn', 'line'])}  # items made of several of his layers (in his order):
# (the name the blended layer gets, his layers)


def blend(layers):
    """his layers drawn over each other (normal blending: the 'fx' glow is see-through)"""
    out = np.zeros(layers[0].shape, float)
    for l in layers:
        a = l.astype(float) / 255
        al = a[..., 3:]
        out[..., :3] = a[..., :3] * al + out[..., :3] * (1 - al)
        out[..., 3:] = al + out[..., 3:] * (1 - al)
    rgb = np.where(out[..., 3:] > 0, out[..., :3] / np.maximum(out[..., 3:], 1e-6), 0)
    return (np.concatenate([rgb, out[..., 3:]], axis=2) * 255).round().clip(0, 255).astype(np.uint8)


def combine(iid, cels):
    for D in (cels, WIDE):
        if D:
            D[COMBINE[iid][0]] = blend([D[n] for n in COMBINE[iid][1] if n in D])


SIDE = [(0, 0)]  # this item's (left, right) extra columns
WIDE = {}  # the last aligned file's layers with those side columns ('_side': (left, right))


def align(cels, name):
    """(owner, Nov 20 2026: in the scarf files he moved the BODY 4 px left) every layer is moved by how far the file's
    'shape' (the bare body) is from the default body's, so each piece sits on the game's character as in his file"""
    WIDE.clear()
    if 'shape' not in cels:
        return cels
    S, D = cels['shape'][..., 3] > 0, look['shape'][..., 3] > 0
    H0, W0 = D.shape
    if S.shape != D.shape:
        # (Nov 23 2026) a bigger canvas (the afro / bubble gum files are 40 x 40): find where the default 32 x 35 body
        # sits in it, keep that many columns and everything from the top down to the body's bottom (the rows above
        # the normal top stay: room for tall hair, fit() makes the picture taller)
        _, oy, ox = max((np.sum(S[y:y + H0, x:x + W0] & D) - np.sum(S[y:y + H0, x:x + W0] ^ D), y, x)
                        for y in range(S.shape[0] - H0 + 1) for x in range(S.shape[1] - W0 + 1))
        # (Nov 26 2026) then the fine shift as below, and the layers cut ONCE from the file at the final place (the
        # spartans' body was found 3 columns off: shifting after cutting lost their plume / sleeve)
        P = SIDE_MAX + 12
        padded = {k: np.pad(v, ((P, P), (P, P), (0, 0))) for k, v in cels.items()}
        S2 = cels['shape'][oy:oy + H0, ox:ox + W0, 3] > 0
        _, dx, dy = max(((np.sum(shift(S2, dx, dy) & D) - np.sum(shift(S2, dx, dy) ^ D), dx, dy) for dy in range(-8, 9) for dx in range(-10, 11)))
        ox, oy = ox - dx, oy - dy
        X, Y = ox + P, oy + P
        for k, v in padded.items():
            lost = v[:, :X, 3].any() or v[:, X + W0:, 3].any() or v[Y + H0:, :, 3].any()
            if lost:
                print('  ', name, k, 'has pixels outside the body\'s 32 columns / under its feet: cut off')
        # (Nov 26 2026: helmet plumes, a jester hat stick out past the body's 32 columns) up to SIDE_MAX columns each
        # side are kept too, in WIDE (for the pieces drawn over the head: their picture gets that much wider)
        top = max(0, oy)  # rows above the body kept (the file's own)
        WIDE.update({k: v[Y - top:Y + H0, X - SIDE_MAX:X + W0 + SIDE_MAX] for k, v in padded.items()})
        WIDE['_side'] = (SIDE_MAX, SIDE_MAX)
        print('  ', name, 'canvas', 'body at', ox, oy, '->', top, 'rows above the normal top')
        return {k: v[Y - top:Y + H0, X:X + W0] for k, v in padded.items()}
    best = max(((np.sum(shift(S, dx, dy) & D) - np.sum(shift(S, dx, dy) ^ D), dx, dy) for dy in range(-8, 9) for dx in range(-10, 11)))
    _, dx, dy = best
    if dx or dy:
        print('  ', name, 'body moved in the file: shifting the pieces by', dx, dy)
        cels = {k: shift(v, dx, dy) for k, v in cels.items()}
    return cels


def tall_under(a, under):
    """the bare body under a piece from a taller file: empty rows on top"""
    extra = a.shape[0] - under.shape[0]
    return np.concatenate([np.zeros((extra,) + under.shape[1:], under.dtype), under]) if extra > 0 else under


ONLY = set(sys.argv[2:])
meta = json.load(open(ROOT + '/art-source/wear/pixelwear_meta.json')) if ONLY else {}
NEARL, FARL = slice(0, 15), slice(15, 32)  # sprite columns of the two feet (sprite faces left)
for f, iid in ITEMS.items():
    if ONLY and iid not in ONLY:
        continue
    f, part = (f.split('#') + [None])[:2]
    SIDE[0] = (0, 0)
    if f.endswith('.png'):  # a whole figure as a PNG: the piece is what differs from the bare body
        im = np.array(Image.open(SRC + f).convert('RGBA'))
        hp = im.copy()
        hp[(im == body).all(axis=2) | (im[..., 3] == 0)] = 0
        hp[is_skin(hp)] = 0  # (a 1 px sleeve change in his export is not part of the hair)
        cels, L = dict(look), lL + [('hair', True)]
        cels['hair'] = hp
    else:
        frames, L = read_frames(SRC + f)
        cels = align(dict(frames[0]), f)
        if iid in COMBINE:
            combine(iid, cels)
        if 'tshirt' not in cels and 'shirt' in cels and f.startswith('tshirt/'):
            cels['tshirt'] = cels['shirt']  # (Nov 25 2026 files name the layer 'shirt')
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
    elif part == 'sando':
        cat = 'tshirt'
        cels['tshirt'] = cels['sando']
    elif part == 'shorts':
        cat = 'pants'
        cels['pants'] = cels['short']
    elif part == 'bareshorts':  # the bare body where the default shorts were
        cat = 'pants'
        t = cels['shape'].copy()
        t[look['short'][..., 3] == 0] = 0
        cels['pants'] = t
    elif part == 'topless':  # bare chest: the file's body (with the abs) where the sando was; all of it skin
        cat = 'tshirt'
        t = cels['shape'].copy()
        t[look['sando'][..., 3] == 0] = 0
        cels['tshirt'] = t
    elif part == 'armor':  # (Nov 26 2026: warrior.aseprite, owner: "the armor is abs, topless") a shirt: bare chest + it
        cat = 'tshirt'
        cels['tshirt'] = cels['armor']
    elif part == 'boots':  # (warrior.aseprite: sandals)
        cat = 'shoes'
        cels['shoes'] = cels['boots']
    elif part == 'pants':
        cat = 'pants'
    elif part == 'helmet':
        cat = 'hat'
    elif part == 'hood':  # the hood: the mask layer above the shoulders, drawn like a hat
        cat = 'hat'
        m = cels['mask'].copy()
        m[HOOD_ROWS:] = 0
        cels['hood'] = m
    if cat in ('tshirt', 'pants', 'shoes'):  # (a taller file: these only use the body's own 35 rows)
        cels = {k: v[-35:] for k, v in cels.items()}
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
        if part not in ('topless', 'armor'):  # (topless / the warrior's armor: the icon IS the bare chest)
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
        if part == 'bareshorts':
            ps = np.zeros_like(sh)
            ps[legs] = sit['shape'][legs]
            poses['sit'] = (ps, is_skin(ps))
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
    elif cat == 'blank':  # (owner, Nov 23 2026: "just hide the eyes and the mouth"; "the mouth's colour on the eyebrows,
        # whatever the skin") a patch PAINTED ON THE BODY FRAME (pixelwear.js PXW_BODY_FACE), so hair / beard / hats still
        # go over it: the eyes' and mouth's pixels (+1 px round them) in his plain skin, and the eyebrows in the mouth's
        # colour. Every pixel takes the wearer's skin tone (FACT), so the eyebrows match that skin's mouth.
        fl = flat(cels, L)
        eye_m = look['eyes'][..., 3] > 0
        mouth_m = look['mouth'][..., 3] > 0
        brow_m = look['eyebrows'][..., 3] > 0
        hide = eye_m | mouth_m
        grow = hide | brow_m
        g2 = grow.copy()
        g2[1:] |= grow[:-1]; g2[:-1] |= grow[1:]; g2[:, 1:] |= grow[:, :-1]; g2[:, :-1] |= grow[:, 1:]
        skin_m = (hide | (g2 & ~brow_m)) & is_skin(fl)
        a = np.zeros_like(fl)
        a[skin_m] = fl[skin_m]
        mc = look['mouth'][mouth_m][:, :3]
        mouth_col = np.median(mc, axis=0).astype(np.uint8) if len(mc) else np.array([187, 112, 117], np.uint8)
        a[brow_m, :3] = mouth_col
        a[brow_m, 3] = 255
        poses['idle'] = (a, a[..., 3] > 0)
        # the icon: his head as drawn (rows above the neck), the eyebrows in the mouth's colour like in the game
        icon = fl.copy()
        icon[23:] = 0
        icon[brow_m & (icon[..., 3] > 0), :3] = mouth_col
    else:  # shades / hair / hood: drawn by WEAR_ART over the head in every pose (the head is in the same place in all)
        # (hair: the visible layer whose name starts with 'hair': girl-hair uses 'hair2', goodboy-hair 'hair2 Copy')
        lname = ('shades' if cat == 'shades' else 'eyes' if cat == 'eye'
                 else next(n for n, v in L if v and n not in BODY_LAYERS and n in cels) if cat == 'stache'
                 else 'hood' if cat == 'hat' and 'hood' in cels
                 else next(n for n, v in reversed(L) if v and n not in BODY_LAYERS and n in cels) if cat == 'hat' else 'Scarf' if cat == 'scarf'
                 else next(n for n, v in L if v and n.startswith('Cap') and n in cels) if cat == 'cap'
                 else next(n for n, v in L if v and n.startswith('hair') and n in cels))
        if iid in COMBINE:
            lname = COMBINE[iid][0]  # (the blended layer)
        if iid in HAT_EXTRA and lname in WIDE:
            # (Nov 26 2026: spartan.aseprite has its red crest on the 'sleeve left' layer) what those layers have that the
            # bare body's same layer doesn't is part of the piece too
            Hh = WIDE[lname].shape[0]
            for ln in HAT_EXTRA[iid]:
                lw = np.zeros_like(WIDE[ln])
                lw[Hh - 35:, SIDE_MAX:SIDE_MAX + 32] = look[ln]
                ext = WIDE[ln].copy()
                ext[lw[..., 3] > 0] = 0
                m = ext[..., 3] > 0
                WIDE[lname] = WIDE[lname].copy()
                WIDE[lname][m] = ext[m]
            cels[lname] = WIDE[lname][:, SIDE_MAX:SIDE_MAX + 32]
        a, ask = piece(cels[lname], tall_under(cels[lname], body))
        poses['idle'] = (a, ask)
        icon = cels[lname].copy()
        # (Nov 26 2026) a head piece reaching past the body's 32 columns (a helmet's plume, a jester hat): the wider
        # layer (WIDE), with the bare body under it padded by those columns
        if (cat == 'hat' or iid in COMBINE) and lname in WIDE and WIDE['_side'] != (0, 0):
            Lx, Rx = WIDE['_side']
            wl = WIDE[lname]
            if wl[:, :Lx, 3].any() or wl[:, wl.shape[1] - Rx:, 3].any():
                cols = np.where(wl[..., 3].any(axis=0))[0]
                l_, r_ = max(0, Lx - cols.min()), max(0, cols.max() - (Lx + 31))
                wl = wl[:, Lx - l_:Lx + 32 + r_]
                ub = tall_under(wl[:, l_:l_ + 32], body)
                ub = np.concatenate([np.zeros((ub.shape[0], l_, 4), np.uint8), ub, np.zeros((ub.shape[0], r_, 4), np.uint8)], axis=1)
                a, ask = piece(wl, ub)
                poses['idle'] = (a, ask)
                icon = wl.copy()
                SIDE[0] = (int(l_), int(r_))
                print('  ', iid, 'reaches past the body:', l_, 'left,', r_, 'right')
        if iid in COMBINE:
            # (owner, Nov 27 2026: "ilagay mo yung mismong icon nila na buo") the bag icon = his whole first frame,
            # the character with the horns, as in his file (pixelwear.js PXW_OWN_ICON: not the Mannequin's head)
            icon = blend([cels[n] for n, v in L if v and n in cels])
        if iid in COMBINE and len(frames) > 1:  # (frost_horns) every frame, cut to the same columns as frame 0
            l_, r_ = SIDE[0]
            for k in range(1, len(frames)):
                ck = align(dict(frames[k]), f)
                combine(iid, ck)
                if WIDE:
                    Lx = WIDE['_side'][0]
                    wl = WIDE[lname][:, Lx - l_:Lx + 32 + r_]
                    ub = tall_under(wl[:, l_:l_ + 32], body)
                    ub = np.concatenate([np.zeros((ub.shape[0], l_, 4), np.uint8), ub, np.zeros((ub.shape[0], r_, 4), np.uint8)], axis=1)
                    poses['idle_f%d' % k] = piece(wl, ub)
                else:
                    poses['idle_f%d' % k] = piece(ck[lname], tall_under(ck[lname], body))
        if cat == 'eye' and len(frames) > 1:  # an animated eye piece: every frame its own picture
            # (owner, Nov 25 2026 n: "a black rectangle stroke, there shouldn't be one") the WHOLE eyes layer every frame,
            # not only what differs from the body: a part-picture's soft edges (the game draws smoothed) let the body's
            # own pupil show through as a dark outline. His frames all have the body's eye shape, so it covers it.
            full = lambda e: (e.copy(), is_skin(e))
            poses['idle'] = full(cels[lname])
            for k in range(1, len(frames)):
                ck = align(dict(frames[k]), f)
                poses['idle_f%d' % k] = full(ck[lname])
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
    if iid in HAT_OPEN:
        # (owner, Nov 26 2026: "the hair shows only in the open parts, round the face, with these hats") hair_hole.png:
        # where the worn hair may show (pixelwear.js PXW_CAP_HAIR cuts the hair to it, then the hat goes over):
        # 'inside' = in each row, between the piece's left and right edge where it has no pixel (the face opening of
        # the suits / helmets); 'below' = under the piece (the jester hat: the hair round the face under its band)
        hm = cels[lname][-35:][..., 3] > 0
        hole = np.zeros_like(hm)
        if HAT_OPEN[iid] == 'inside':
            for y in range(hm.shape[0]):
                xs = np.where(hm[y])[0]
                if len(xs) >= 2:
                    hole[y, xs.min():xs.max() + 1] = True
            hole &= ~hm
        else:
            ys, xs = np.where(hm)
            for x in range(hm.shape[1]):
                col = np.where(hm[:, x])[0]
                hole[(col.max() + 1 if len(col) else ys.max() + 1):, x] = True
        hr = np.zeros(hm.shape + (4,), np.uint8)
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
    side = SIDE[0]
    for nm, (a, m) in poses.items():
        save_pose(d, nm, fit(a, side) if a.shape[1] != 32 else fit(a), fitm(m, side) if a.shape[1] != 32 else fitm(m), skinned)
    ys, xs = np.where(icon[..., 3] > 0)
    Image.fromarray(icon[ys.min():ys.max() + 1, xs.min():xs.max() + 1][:, ::-1]).save(d + '/icon.png')
    meta[iid] = {'cat': cat, 'sk': skinned, 'poses': sorted(poses)}
    if side != (0, 0):
        meta[iid]['side'] = int(max(side)) * S  # picture px more on each side (pixelwear.js PXW_SIDE)
    top = max(a.shape[0] for a, _ in poses.values()) - 35
    if top > 0:
        meta[iid]['top'] = top * S  # picture px above the normal top (pixelwear.js PXW_TOP)
    print(iid, cat, 'skinned' if skinned else '', sorted(poses))
json.dump(meta, open(ROOT + '/art-source/wear/pixelwear_meta.json', 'w'), indent=1)
