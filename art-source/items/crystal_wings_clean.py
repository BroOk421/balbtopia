# Crystal Wings without their floating shards (owner, Nov 7 2026 build u: the shards are drawn by code now, rising and
# fading at random spots of the wings, crystalwings.js). Takes frame 0 of each folded 8-frame strip and keeps only the
# big connected shapes (the wings), dropping every small piece (< MIN_AREA px). Writes wings_crystal[_<colour>]_clean.png.
# Run from the repo root (after crystal_wings_colors.py): python3 art-source/items/crystal_wings_clean.py
from PIL import Image
MIN_AREA = 300
for c in ('', '_red', '_green', '_white', '_black'):
    im = Image.open(f'www/assets/items/wings_crystal{c}.png').convert('RGBA')
    fw = im.width // 8
    fr = im.crop((0, 0, fw, im.height))
    W, H = fr.size
    px = fr.load()
    seen = [[False] * H for _ in range(W)]
    keep = set()
    for x0 in range(W):
        for y0 in range(H):
            if seen[x0][y0] or px[x0, y0][3] < 40:
                continue
            comp, stack = [], [(x0, y0)]
            seen[x0][y0] = True
            while stack:
                x, y = stack.pop()
                comp.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1), (x + 1, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1)):
                    if 0 <= nx < W and 0 <= ny < H and not seen[nx][ny] and px[nx, ny][3] >= 40:
                        seen[nx][ny] = True
                        stack.append((nx, ny))
            if len(comp) >= MIN_AREA:
                keep.update(comp)
    for x in range(W):
        for y in range(H):
            if (x, y) not in keep:
                px[x, y] = (0, 0, 0, 0)
    fr.save(f'www/assets/items/wings_crystal{c}_clean.png')
    print(c or 'blue', fr.size, len(keep))
