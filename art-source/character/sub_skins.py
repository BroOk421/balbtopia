# Subscriber skins (owner, Nov 2 2026): red, white, green, violet, orange.
# Every character picture of the porcelain skin is recoloured: the skin pixels (the pixels that differ between the
# porcelain and deep pictures, i.e. skin, its shading, outline, brows and lips) take the target colour scaled by how
# light the porcelain pixel is compared with the porcelain face colour; lighter than the face -> towards white.
# Usage: python3 sub_skins.py <www/assets/character> [preview.png]
import sys, os
import numpy as np
from PIL import Image

BASE = np.array([0xfd, 0xcf, 0xac], float)  # porcelain face (SWATCH.porcelain)
TARGETS = {
    'red': '#e2564c',
    'white': '#f4f1ec',
    'green': '#68bf57',
    'violet': '#a47bdd',
    'orange': '#f39340',
}
LUM = np.array([0.299, 0.587, 0.114])


def hexrgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)


def recolor_px(rgb, target):
    """rgb: (n,3) porcelain skin pixels -> (n,3) in the target colour"""
    t = (rgb @ LUM) / (BASE @ LUM)
    out = target[None, :] * np.minimum(t, 1)[:, None]
    hi = np.clip((t - 1) * 4.0, 0, 0.75)[:, None]  # lighter than the face: blend towards white
    out = out * (1 - hi) + 255 * hi
    return np.clip(np.rint(out), 0, 255)


def recolor_file(src_p, src_d, target):
    a = np.array(Image.open(src_p).convert('RGBA')).astype(float)
    b = np.array(Image.open(src_d).convert('RGBA')).astype(float)
    m = (np.abs(a[..., :3] - b[..., :3]).sum(-1) > 6) & (a[..., 3] > 0)
    out = a.copy()
    out[m, :3] = recolor_px(a[m, :3], target)
    return Image.fromarray(out.astype(np.uint8), 'RGBA')


def main():
    root = sys.argv[1]
    files = sorted(f for f in os.listdir(os.path.join(root, 'porcelain')) if f.endswith('.png'))
    for name, h in TARGETS.items():
        d = os.path.join(root, name)
        os.makedirs(d, exist_ok=True)
        for f in files:
            recolor_file(os.path.join(root, 'porcelain', f), os.path.join(root, 'deep', f), hexrgb(h)).save(os.path.join(d, f), optimize=True)
    # the colours the game needs (ARM_COLOR / FACE_COLOR / SWATCH), from the porcelain ones
    arm = {'skin': '#f3c3a1', 'shade': '#c29c80', 'light': '#f7d8c1', 'dark': '#967863'}
    face = ['#fccdab', '#3b2119', '#925b3f']
    for name, h in TARGETS.items():
        T = hexrgb(h)
        conv = lambda c: '#%02x%02x%02x' % tuple(int(v) for v in recolor_px(hexrgb(c)[None, :], T)[0])
        print(name, 'swatch', conv('#fdcfac'), 'arm', {k: conv(v) for k, v in arm.items()}, 'face', [conv(c) for c in face])


if __name__ == '__main__':
    main()
