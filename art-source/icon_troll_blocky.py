# Launcher / web icon (owner, Nov 23 2026: "the character's new look, wearing nothing, just the head again, with the
# troll face; the background = the landing page's"). The head = the game's own blocky peach character with the /troll
# face (drawCharacter, joke 'troll', no clothes), cut to its art pixels: art-source/icon/troll_head_blocky.png (20 x 16).
# The background = the top of the Night Machine's sky with the moon at the side and stars (owner's second ask).  Run:  python3 art-source/icon_troll_blocky.py <project root> <preview dir>
# Writes android mipmaps (ic_launcher, _round, adaptive _foreground / _background) and www/assets/icon/icon512 / 192.
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
R = sys.argv[1].rstrip('/') + '/'
OUT = sys.argv[2]
head = Image.open(R + 'art-source/icon/troll_head_blocky.png').convert('RGBA')


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


MOON = Image.open(R + 'www/assets/night/moon.png').convert('RGBA')


def scene(size, moon=(0.86, 0.15)):
    """(owner, Nov 23 2026 later: "no dirt; the Night weather's background, its very top: the moon at the side, and
    stars") the top of the Night Machine's sky (concert.js drawNightBg): deep blue, darkest at the top, twinkling
    stars (the big ones with a little cross), the owner's moon with its soft blue-white glow up at the side"""
    y = np.linspace(0, 1, size)[:, None]
    stops = [(0, '#030816'), (0.55, '#081a46'), (1, '#14388a')]
    col = np.zeros((size, 3))
    for (a, ca), (b, cb) in zip(stops, stops[1:]):
        m = (y[:, 0] >= a) & (y[:, 0] <= b)
        t = ((y[:, 0] - a) / (b - a))[m][:, None]
        col[m] = np.array(hexrgb(ca)) * (1 - t) + np.array(hexrgb(cb)) * t
    im = Image.fromarray(np.repeat(col[:, None, :], size, axis=1).astype(np.uint8)).convert('RGBA')
    d = ImageDraw.Draw(im)
    rnd = np.random.default_rng(7)
    u = size / 256
    for _ in range(60):
        x, yy, r, a = rnd.random() * size, rnd.random() * size * 0.95, rnd.choice([1, 1, 1, 1.5, 2]), 0.4 + 0.6 * rnd.random()
        z = max(1, round(r * u))
        c = (235, 244, 255, int(255 * a))
        d.rectangle([x, yy, x + z - 1, yy + z - 1], fill=c)
        if r >= 2:
            h = (235, 244, 255, int(128 * a))
            d.rectangle([x - z, yy + z * 0.35, x + 2 * z, yy + z * 0.65], fill=h)
            d.rectangle([x + z * 0.35, yy - z, x + z * 0.65, yy + 2 * z], fill=h)
    if moon:
        mh = size * 0.3
        cx, cy = moon[0] * size, moon[1] * size
        g = np.mgrid[0:size, 0:size].astype(float)
        dist = np.sqrt((g[1] - cx) ** 2 + (g[0] - cy) ** 2) / mh
        al = np.interp(dist, [0, 0.4, 0.85, 1.3], [0.45, 0.45, 0.18, 0])
        glow = np.zeros((size, size, 4), np.uint8)
        glow[..., 0], glow[..., 1], glow[..., 2] = 190, 220, 255
        glow[..., 3] = (al * 255).astype(np.uint8)
        im.alpha_composite(Image.fromarray(glow))
        m = MOON.resize((round(mh), round(mh)), Image.LANCZOS)
        im.alpha_composite(m, (round(cx - mh / 2), round(cy - mh / 2)))
    return im


def headlayer(size, frac, dy=0.0):
    L = Image.new('RGBA', (size, size))
    s = max(1, int(size * frac / head.width))
    h = head.resize((head.width * s, head.height * s), Image.NEAREST)
    L.alpha_composite(h, ((size - h.width) // 2, (size - h.height) // 2 - round(size * 0.03) + round(size * dy)))
    return L


def rounded(img, rad):
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, img.width - 1, img.height - 1], rad, fill=255)
    o = Image.new('RGBA', img.size)
    o.paste(img, (0, 0), m)
    return o


def circle(img):
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).ellipse([0, 0, img.width - 1, img.height - 1], fill=255)
    o = Image.new('RGBA', img.size)
    o.paste(img, (0, 0), m)
    return o


master = scene(1024)
master.alpha_composite(headlayer(1024, 0.66, 0.06))
master.save(OUT + '/master.png')
res = R + 'android/app/src/main/res/'
for k, s in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    m = master.resize((s, s), Image.LANCZOS)
    rounded(m, round(s * 0.16)).save(res + f'mipmap-{k}/ic_launcher.png')
    circle(m).save(res + f'mipmap-{k}/ic_launcher_round.png')
    fs = round(s * 108 / 48)
    # adaptive: the launcher shows the middle 72 of 108 dp: the background is the whole scene, the head inside the safe zone
    bg = scene(fs * 4, moon=(0.74, 0.27))  # (the launcher shows the middle 72 of 108 dp: the moon inside it)
    bg.resize((fs, fs), Image.LANCZOS).convert('RGB').save(res + f'mipmap-{k}/ic_launcher_background.png')
    fg = headlayer(fs * 4, 0.66 * 72 / 108, 0.04 * 72 / 108).resize((fs, fs), Image.NEAREST)
    fg.save(res + f'mipmap-{k}/ic_launcher_foreground.png')
for s in (512, 192):
    rounded(master.resize((s, s), Image.LANCZOS), round(s * 0.16)).save(R + f'www/assets/icon/icon{s}.png')
# previews: rounded, round, adaptive (circle mask on the middle 72 dp)
pv = Image.new('RGBA', (3 * 300, 300), (40, 40, 40, 255))
pv.alpha_composite(rounded(master.resize((280, 280), Image.LANCZOS), 45), (10, 10))
pv.alpha_composite(circle(master.resize((280, 280), Image.LANCZOS)), (310, 10))
ad = Image.open(res + 'mipmap-xxxhdpi/ic_launcher_background.png').convert('RGBA')
ad.alpha_composite(Image.open(res + 'mipmap-xxxhdpi/ic_launcher_foreground.png'))
ad = ad.crop((72, 72, 360, 360)).resize((280, 280), Image.LANCZOS)
pv.alpha_composite(circle(ad), (610, 10))
pv.save(OUT + '/icon_preview.png')
print('icon written')
