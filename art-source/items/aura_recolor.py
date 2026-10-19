# Recolours the Golden Aura strip into other auras by mapping its brightness onto a colour ramp
# (dark -> mid -> light -> white-hot), keeping the alpha. Usage: python3 recolor.py
import numpy as np
from PIL import Image
src = np.asarray(Image.open('aura_golden.png').convert('RGBA')).astype(float)
rgb, a = src[..., :3], src[..., 3:]
lum = (0.3 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2]) / 255
# golden aura brightness runs about 0.55 (orange edges) .. 1.0 (white streaks): stretch to 0..1
t = np.clip((lum - 0.55) / 0.45, 0, 1)[..., None]
RAMPS = {
  # Dark Diamond: deep purple edges, violet body, lilac light, near-white core (matches the Black Diamond Pickaxe)
  'aura_dark': [(40, 14, 110), (104, 58, 222), (168, 130, 255), (244, 236, 255)],
  # Red: dark crimson edges, red body, orange-red light, pale core
  'aura_red': [(110, 0, 8), (214, 18, 22), (255, 84, 54), (255, 232, 214)],
  # Diamond: deep blue edges, diamond blue body, icy light, white core (matches the Diamond Pickaxe)
  'aura_diamond': [(16, 80, 160), (40, 176, 236), (150, 232, 255), (240, 252, 255)],
  # White: soft grey-blue edges, white body, bright white core
  'aura_white': [(104, 118, 156), (198, 208, 230), (240, 245, 255), (255, 255, 255)],
}
for name, stops in RAMPS.items():
  stops = np.array(stops, float)
  pos = np.array([0, 0.55, 0.88, 1.0])
  out = np.zeros_like(rgb)
  for c in range(3):
    out[..., c] = np.interp(t[..., 0], pos, stops[:, c])
  Image.fromarray(np.dstack([out, a]).astype(np.uint8), 'RGBA').save(name + '.png', optimize=True)
  p = Image.new('RGBA', (1280, 242), (40, 24, 70, 255)); p.alpha_composite(Image.open(name + '.png')); p.save('prev_' + name + '.png')
print('ok')
