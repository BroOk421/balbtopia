# Finds the scale and offset that put a figure from a sprite sheet exactly on our body sprite, by matching
# their dark outlines (face, arms, shirt, pants, shoes) below the hair line.
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from scipy.signal import fftconvolve
OURS = np.asarray(Image.open('/home/claude/work/balbtopia/www/assets/character/porcelain/idle_open.png').convert('RGBA')).astype(float)
def outline(rgba):
    return ((rgba[..., :3].max(2) < 80) & (rgba[..., 3] > 200)).astype(float)
O = nd.gaussian_filter(outline(OURS), 1.2)
def align(fig, y_from_ours=60, scales=np.arange(0.62, 0.84, 0.004), y_to_ours=999):
    """fig: RGBA float array of one figure (its own crop). Returns (s, tx, ty, score): our = s*fig + (tx, ty)."""
    Om = O.copy(); Om[:y_from_ours] = 0; Om[y_to_ours:] = 0  # only the chosen band of our sprite
    best = None
    F0 = outline(fig)
    for s in scales:
        h, w = F0.shape
        F = np.asarray(Image.fromarray((F0 * 255).astype(np.uint8)).resize((max(1, round(w * s)), max(1, round(h * s))), Image.BILINEAR)).astype(float) / 255
        F = nd.gaussian_filter(F, 1.2)
        # correlation of O with F over all shifts
        c = fftconvolve(Om, F[::-1, ::-1], mode='full')
        k = np.unravel_index(np.argmax(c), c.shape)
        score = c[k] / (np.sqrt((F ** 2).sum()) + 1e-6)
        ty = k[0] - (F.shape[0] - 1)
        tx = k[1] - (F.shape[1] - 1)
        if best is None or score > best[3]:
            best = (s, tx, ty, score)
    return best
