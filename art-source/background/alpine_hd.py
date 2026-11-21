# (owner, Nov 21 2026: "the background high resolution even at that size") alpine_mountains.png upscaled 4x with
# Real-ESRGAN (RealESRGAN_x4plus for the colours, x4plus_anime_6B for the see-through edge; weights from
# github.com/xinntao/Real-ESRGAN releases), then brought down to 3x (6357 x 1953) and saved as
# www/assets/background/alpine_mountains_hd.webp (js/world/daynight.js A.bg_alpine).
# Run:  python3 alpine_hd.py RealESRGAN_x4plus.pth www/assets/background/alpine_mountains.png alpine_x4.png
#       then: Image.open('alpine_x4.png').resize((6357, 1953), Image.LANCZOS).save('alpine_mountains_hd.webp', quality=92)
# needs: pip install torch spandrel scipy pillow
# Upscale an RGBA picture 4x with a Real-ESRGAN model (tiled, CPU), alpha upscaled through the model too.
# usage: python3 upscale.py model.pth in.png out.png [crop x0,y0,x1,y1]
import sys, numpy as np, torch
from PIL import Image
from scipy import ndimage
from spandrel import ModelLoader

torch.set_num_threads(2)
model = ModelLoader().load_from_file(sys.argv[1]).model.eval()
amodel = ModelLoader().load_from_file(sys.argv[1].replace('x4plus.pth','x4plus_anime_6B.pth')).model.eval()
im = Image.open(sys.argv[2]).convert('RGBA')
if len(sys.argv) > 4:
    im = im.crop(tuple(int(v) for v in sys.argv[4].split(',')))
a = np.asarray(im).astype(np.float32) / 255
rgb, al = a[..., :3].copy(), a[..., 3]
# bleed edge colours into the see-through area so no dark halo creeps in along the outline
mask = al < 0.02
if mask.any():
    _, (iy, ix) = ndimage.distance_transform_edt(mask, return_indices=True)
    rgb = rgb[iy, ix]

def run(x, model=model):  # x: H x W x 3 float -> 4H x 4W x 3
    H, W, _ = x.shape
    T, P = 192, 16
    out = np.zeros((H * 4, W * 4, 3), np.float32)
    for y0 in range(0, H, T):
        for x0 in range(0, W, T):
            ya, yb = max(0, y0 - P), min(H, y0 + T + P)
            xa, xb = max(0, x0 - P), min(W, x0 + T + P)
            t = torch.from_numpy(x[ya:yb, xa:xb].transpose(2, 0, 1)[None].copy())
            with torch.no_grad():
                r = model(t)[0].clamp(0, 1).numpy().transpose(1, 2, 0)
            cy, cx = (y0 - ya) * 4, (x0 - xa) * 4
            h, w = min(T, H - y0) * 4, min(T, W - x0) * 4
            out[y0 * 4:y0 * 4 + h, x0 * 4:x0 * 4 + w] = r[cy:cy + h, cx:cx + w]
        print('row', y0, '/', H, flush=True)
    return out

up = run(rgb)
upa = run(np.repeat(al[..., None], 3, 2), amodel).mean(2)
res = np.dstack([up, upa])
Image.fromarray((res * 255 + 0.5).clip(0, 255).astype(np.uint8), 'RGBA').save(sys.argv[3])
print('saved', sys.argv[3], res.shape)
