# Open (spread) Demon / Dragon Wings from the owner's pictures (Nov 7 2026): the haze round them is dropped (alpha
# below 128), cropped to the wings, scaled so the wings are as tall as the folded strips (H body px),
# alpha made hard again. Writes www/assets/items/wings_<name>_open.png.
# (build o: + Galaxy, Phoenix, Shadow Wings; each as tall as its own folded strip in wear.js)
# Run from the repo root: python3 art-source/items/wings_open_cut.py
from PIL import Image
HEIGHT = {'demon': 215, 'dragon': 215, 'galaxy': 241, 'phoenix': 232, 'shadow': 253, 'crystal': 248}  # crystal: build r
for name, H in HEIGHT.items():
    im = Image.open(f'art-source/items/wings_{name}_open_src.png').convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 128:
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (r, g, b, 255)
    im = im.crop(im.getbbox())
    w = round(im.width * H / im.height)
    small = im.resize((w, H), Image.BOX)
    sp = small.load()
    for y in range(small.height):
        for x in range(small.width):
            r, g, b, a = sp[x, y]
            sp[x, y] = (min(255, r * 255 // a), min(255, g * 255 // a), min(255, b * 255 // a), 255) if a >= 110 else (0, 0, 0, 0)
    small.save(f'www/assets/items/wings_{name}_open.png')
    print(name, small.size)
