# Fireballs in each flying dragon's colours (owner, Nov 1 2026: "match the fire to their colour"): the Fire
# Dragon's flame_ball.png recoloured by brightness onto a colour ramp per dragon (dark -> bright core), alpha kept.
# usage: python3 dragon_balls.py <www/assets/pets dir>
import sys, numpy as np
from PIL import Image

D = sys.argv[1]
RAMPS = {
    'shadow': ['#1a0630', '#4a1a8a', '#8a4ae0', '#c79aff', '#f4e8ff'],   # purple, like its wings
    'bone': ['#2a1430', '#6a2a6a', '#c04ac0', '#f0b8f0', '#fff4ff'],     # magenta, like its eyes
    'glacier': ['#06204a', '#1a5ab0', '#3aa8f0', '#a8e4ff', '#f4fcff'],  # ice blue
    'pearl': ['#2a2a50', '#7a7ab0', '#b8c4f0', '#e8f0ff', '#ffffff'],    # pearl white / pale blue
    'jade': ['#062a1a', '#147a4a', '#3ad08a', '#b0f4a0', '#f4ffe8'],     # green
}
src = np.asarray(Image.open(f'{D}/flame_ball.png').convert('RGBA')).astype(float)
rgb, a = src[..., :3], src[..., 3]
lum = rgb @ [0.3, 0.55, 0.15]
m = a > 0
lo, hi = np.percentile(lum[m], 2), np.percentile(lum[m], 99.5)
t = np.clip((lum - lo) / max(1, hi - lo), 0, 1) ** 0.6  # (the red flame is bright: keep it vivid)
for name, ramp in RAMPS.items():
    stops = np.array([[int(h[k:k + 2], 16) for k in (1, 3, 5)] for h in ramp], float)
    x = t * (len(stops) - 1)
    i = np.clip(np.floor(x).astype(int), 0, len(stops) - 2)
    f = (x - i)[..., None]
    out = stops[i] * (1 - f) + stops[i + 1] * f
    Image.fromarray(np.dstack([out, a]).astype(np.uint8), 'RGBA').save(f'{D}/flame_ball_{name}.png')
    print(name)
