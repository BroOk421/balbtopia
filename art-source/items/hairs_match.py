import numpy as np
from PIL import Image
from scipy.signal import fftconvolve
U = np.asarray(Image.open('crop.png').convert('RGBA')).astype(float)
O = np.asarray(Image.open('/home/claude/work/hair9/sheet.png').convert('RGBA')).astype(float)
def match(x0, y0, x1, y1, scales, win=None):
    """user crop box -> best (scale, ox, oy) so that user pixel (x,y) ~ original (ox + s*(x-x0), oy + s*(y-y0))"""
    u = U[y0:y1, x0:x1]
    m = u[..., 3] >= 200
    best = None
    lum = lambda r: (r[..., 0] * 0.3 + r[..., 1] * 0.59 + r[..., 2] * 0.11) / 255
    wx0, wy0, wx1, wy1 = win or (0, 0, O.shape[1], O.shape[0])
    Ow = O[wy0:wy1, wx0:wx1]
    Ol = lum(Ow) * (Ow[..., 3] > 200)
    Om = (Ow[..., 3] > 200).astype(float)
    for s in scales:
        w, h = round(u.shape[1] * s), round(u.shape[0] * s)
        ui = Image.fromarray(u.astype(np.uint8), 'RGBA').resize((w, h), Image.BILINEAR)
        ua = np.asarray(ui).astype(float)
        mm = (ua[..., 3] > 128).astype(float)
        ul = lum(ua) * mm
        # sum over mask of (O - u)^2 = sum O^2*mm - 2 sum O*ul + sum ul^2 ; minimise over shifts
        t1 = fftconvolve(Ol ** 2, mm[::-1, ::-1], mode='valid')
        t2 = fftconvolve(Ol, ul[::-1, ::-1], mode='valid')
        t3 = (ul ** 2).sum()
        cov = fftconvolve(Om, mm[::-1, ::-1], mode='valid')
        err = (t1 - 2 * t2 + t3) / mm.sum() + (mm.sum() - cov) / mm.sum()  # colour error + uncovered part
        k = np.unravel_index(np.argmin(err), err.shape)
        if best is None or err[k] < best[0]:
            best = (err[k], s, k[1] + wx0, k[0] + wy0)
    return best
if __name__ == '__main__':
    print(match(380, 220, 600, 420, np.arange(0.85, 1.16, 0.01)))
