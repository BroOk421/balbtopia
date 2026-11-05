# The Moon backdrop's fixed planet (owner, Nov 6 2026: "make the Earth another planet, fixed on the screen"):
# a teal ice giant painted pixel by pixel in the same style as the sheet's planets: wavy bands, a big pale storm,
# light from the top left, a dark limb and a thin outline. Writes www/assets/moon/alien.png (108 x 108).
# Run from the repo root: python3 art-source/moon/alien_planet.py
import math, random
from PIL import Image

N = 108
R = N / 2 - 1.5
cx = cy = N / 2
random.seed(7)
# colour ramp, dark -> light
RAMP = [(10, 34, 52), (14, 62, 84), (20, 98, 116), (32, 138, 146), (64, 178, 170), (128, 214, 196), (206, 244, 226)]
BAND = [(22, 70, 96), (190, 232, 212)]  # dark band tint, cream band tint
OUT = (8, 22, 40)


def noise(x, y, s):
    # cheap smooth value noise
    xi, yi = math.floor(x), math.floor(y)
    def h(a, b):
        n = (a * 374761393 + b * 668265263 + s * 982451653) & 0xFFFFFFFF
        n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
        return (n & 0xFFFF) / 0xFFFF
    fx, fy = x - xi, y - yi
    u, v = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a = h(xi, yi) * (1 - u) + h(xi + 1, yi) * u
    b = h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u
    return a * (1 - v) + b * v


def mix(a, b, t):
    return tuple(round(a[k] + (b[k] - a[k]) * t) for k in range(3))


im = Image.new('RGBA', (N, N), (0, 0, 0, 0))
for j in range(N):
    for i in range(N):
        dx, dy = (i + 0.5 - cx) / R, (j + 0.5 - cy) / R
        d = dx * dx + dy * dy
        if d > 1:
            continue
        dz = math.sqrt(1 - d)
        # light from the top left
        lit = max(0, -0.55 * dx - 0.6 * dy + 0.58 * dz)
        lit = 0.18 + 0.9 * lit
        # bands: latitude on the sphere, bent by noise, tilted a little
        lat = math.asin(max(-1, min(1, dy * 0.96 + dx * 0.18)))
        lon = math.atan2(dx, dz)
        w = lat * 5.2 + 0.55 * math.sin(lon * 3 + lat * 4) + 0.9 * (noise(lon * 3 + 9, lat * 9, 3) - 0.5)
        band = 0.5 + 0.5 * math.sin(w * 2.1)
        k = lit * (len(RAMP) - 1)
        base = mix(RAMP[int(k)], RAMP[min(len(RAMP) - 1, int(k) + 1)], k - int(k))
        c = mix(base, BAND[0], 0.35) if band < 0.32 else mix(base, BAND[1], 0.28) if band > 0.8 else base
        # the big storm: a pale oval with a darker eye
        sx, sy = (dx - 0.28) / 0.3, (dy - 0.22) / 0.16
        sd = sx * sx + sy * sy
        if sd < 1 and dz > 0.3:
            c = mix(c, (236, 250, 238), 0.55 * (1 - sd) * lit + 0.12)
            if sd < 0.22:
                c = mix(c, (40, 110, 130), 0.4)
        # dark limb, then a thin outline
        if d > 0.82:
            c = mix(c, RAMP[0], (d - 0.82) / 0.18 * 0.7)
        if d > 0.955:
            c = OUT
        # pixel-art steps: quantise a little
        c = tuple(v // 6 * 6 for v in c)
        im.putpixel((i, j), c + (255,))
im.save('www/assets/moon/alien.png')
print('wrote www/assets/moon/alien.png', im.size)
