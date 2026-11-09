# The Fall Machine's backdrop (owner, Nov 4 2026: "use these clouds and mountains for the autumn weather machine,
# with parallax; keep our sun, not his"): art-source/autumn/fall_backdrop_source.png (his clouds, snowy mountains and
# a sun, on transparent) is split into its pieces (connected parts): the sun is dropped, the mountain range (the one
# piece touching the bottom) goes into fall_mountains.png and every other piece (the clouds; specks under 800 px
# dropped) into fall_clouds.png. Both are laid out on the backdrop's own canvas, 1620 x 971 like the sunset layers
# (the game stretches every layer to that box and tiles it, every other copy mirrored): the clouds in the upper part,
# the mountains with their foot at about the ground line as the camera usually shows it (the picture's bottom sits
# at the screen's bottom; checked in the game), filled below with their foot colour down to the bottom so no gap
# shows when the camera goes deep.
# Run from the project root:  python3 art-source/autumn/fall_backdrop.py
import numpy as np
from PIL import Image
from scipy import ndimage as nd

SRC = 'art-source/autumn/fall_backdrop_source.png'
OUT = 'www/assets/autumn'
W, H = 1620, 971

im = np.asarray(Image.open(SRC).convert('RGBA')).copy()
solid = im[..., 3] > 100
lab, n = nd.label(solid)
objs = nd.find_objects(lab)
sizes = nd.sum(solid, lab, range(1, n + 1))
pieces = [(i + 1, objs[i]) for i in range(n) if sizes[i] > 800]
mountain = max(pieces, key=lambda p: p[1][0].stop)[0]  # reaches lowest
sun = [i for i, o in pieces if i != mountain and o[1].start < 700 and (o[0].stop - o[0].start) > 250][0]  # the tall round one, top left
clouds = [i for i, _ in pieces if i not in (mountain, sun)]


def only(ids):
    out = im.copy()
    keep = np.isin(lab, ids)
    out[..., 3] = np.where(keep, out[..., 3], 0)
    return Image.fromarray(out)


k = W / im.shape[1]
# (owner, later: "make the mountains taller, bigger, the clouds too, and make them SILHOUETTES like the mountains you
# did before") both are drawn bigger (BIG_*: wider than the backdrop, cut to its width: the copies are mirrored, so
# the cut edges still join) and recoloured by brightness onto a few flat autumn tones (the Fall weather's own ramps,
# autumn.js WEATHER_RAMP.fall), so they read as calm silhouettes like the old fall hills
BIG_CLOUDS, BIG_MOUNTAINS = 1.35, 1.5
MOUNT_TOP = 130  # the range's highest peak; its foot then sits about where the ground line usually is (~57% down)
hexc = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
CLOUD_TONES = [hexc(c) for c in ['#f4c094', '#ffe0bc', '#fff3e2']]
MOUNT_TONES = [hexc(c) for c in ['#7e2612', '#a23c18', '#c4582a']]  # three flat tones: a silhouette


def tone(img, tones, lo, hi):
    a = np.asarray(img).copy()
    lum = (a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11) / 255
    t = np.clip((lum - lo) / (hi - lo), 0, 0.999)
    idx = (t * len(tones)).astype(int)
    pal = np.array(tones, np.uint8)
    a[..., :3] = pal[idx]
    return Image.fromarray(a)


def wide(img, f):
    big = img.resize((round(img.width * f), round(img.height * f)), Image.LANCZOS)
    x0 = (big.width - W) // 2
    return big.crop((x0, 0, x0 + W, big.height))


# (owner: "less stroke on the mountains") his dark outline pixels are filled with the nearest lighter pixel's colour
# before the toning, so the range keeps its shapes and shading without the thick dark lines
# (owner, Nov 9 2026: "less stroke on the mountains and clouds of those weathers") `edge`: the outline is kept only
# this many px wide on the outside (a thin line instead of his thick one), and the clouds get the same treatment;
# `dark` is a little higher so the softer outline tones go too
def unstroke(img, dark=0.3, edge=0):
    a = np.asarray(img).copy()
    lum = (a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11) / 255
    solid = a[..., 3] > 110
    stroke = (lum < dark) & solid
    if edge:
        outside = nd.distance_transform_edt(solid)  # px from the nearest see-through pixel
        stroke &= outside > edge
    keep = ~stroke & solid
    _, (iy, ix) = nd.distance_transform_edt(~keep, return_indices=True)
    a[stroke, :3] = a[iy[stroke], ix[stroke], :3]
    return Image.fromarray(a)


cl = only(clouds)
cl = cl.crop((0, 0, cl.width, 460)).resize((W, round(460 * k)), Image.LANCZOS)
cl_plain = unstroke(wide(cl, BIG_CLOUDS), dark=0.62, edge=1.5)
cl = tone(cl_plain, CLOUD_TONES, 0.45, 0.95)


def place_clouds(cl, path):
    a = np.asarray(cl).copy()
    a[..., 3] = np.where(a[..., 3] > 110, 255, 0)
    cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cv.alpha_composite(Image.fromarray(a), (0, 10))
    cv.save(path)


# (owner, later: "his clouds for sunny, snow, sunset and desert too") in his own white / blue for the Sun and Snow
# Machines -> www/assets/background/clouds_plain.png (the sunset and desert use fall_clouds.png as it is)
place_clouds(cl_plain, 'www/assets/background/clouds_plain.png')
a = np.asarray(cl).copy()
a[..., 3] = np.where(a[..., 3] > 110, 255, 0)
cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
cv.alpha_composite(Image.fromarray(a), (0, 10))
cv.save(f'{OUT}/fall_clouds.png')
mt = only([mountain])
y0, y1 = objs[mountain - 1][0].start, objs[mountain - 1][0].stop
x0, x1 = objs[mountain - 1][1].start, objs[mountain - 1][1].stop  # (cropped to the range itself)
mt = mt.crop((x0, y0, x1, y1)).resize((W, round((y1 - y0) * k)), Image.LANCZOS)
mt_plain = unstroke(wide(mt, BIG_MOUNTAINS), dark=0.42, edge=1.5)
mt = tone(mt_plain, MOUNT_TONES, 0.35, 0.95)


def place(mt, path):
    a = np.asarray(mt).copy()
    a[..., 3] = np.where(a[..., 3] > 110, 255, 0)
    mt = Image.fromarray(a)
    cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cv.alpha_composite(mt, (0, MOUNT_TOP))
    a = np.asarray(cv).copy()
    bottoms = [np.nonzero(a[:, x, 3] > 200)[0].max() for x in range(W) if (a[:, x, 3] > 200).any()]
    base = np.median(np.stack([a[b, x] for x, b in zip(range(W), bottoms)]), 0).astype(np.uint8)  # the range's foot colour
    for x in range(W):
        col = np.nonzero(a[:, x, 3] > 200)[0]
        if len(col):
            a[col.max() + 1:, x] = base
    Image.fromarray(a).save(path)


place(mt, f'{OUT}/fall_mountains.png')
# (owner, later: "the mountain in its original colour for the sunset, the Sun Machine and the Snow Machine") the same
# range in his own snowy blues (outline thinned the same way) -> www/assets/background/mountains.png; render.js
# drawBg puts it in place of the hills for those three (`MOUNT_LAY`, autumn.js)
place(mt_plain, 'www/assets/background/mountains.png')
top = MOUNT_TOP
print('sun piece', sun, 'clouds', len(clouds), 'mountains', mt.size, 'top', top)
