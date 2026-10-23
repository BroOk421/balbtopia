# Cuts the owner's outfit pieces (outfit_pieces.png: Black Beanie, Skull Tee, Cat Ear Hoodie with its hood) into
# www/assets/items/. outfit_pieces_worn.png is his picture of them worn on OUR body at 1:1 (game sprite, idle frame):
# each piece was found there pixel for pixel, and that body sits at (18, 41) (left figure) / (208, 41) (right figure),
# so a piece's top-left in body-sprite px = its place in the worn picture minus that. Run from art-source/items.
import numpy as np
from PIL import Image
from scipy import ndimage as nd
A = np.asarray(Image.open('outfit_pieces.png').convert('RGBA'))
lab, n = nd.label(A[..., 3] > 0)
# piece: (box in outfit_pieces.png, its top-left in the worn picture, body origin in the worn picture)
PIECES = {
    'black_beanie': ((2, 26, 132, 117), (10, 28), (18, 41)),
    'skull_tee': ((39, 140, 97, 200), (47, 142), (18, 41)),
    'cat_ear_hoodie': ((193, 16, 332, 208), (201, 18), (208, 41)),
}
for name, ((x0, y0, x1, y1), (wx, wy), (bx, by)) in PIECES.items():
    sub = A[y0:y1, x0:x1].copy()
    ids = np.unique(lab[y0:y1, x0:x1][sub[..., 3] > 0])
    keep = np.isin(lab[y0:y1, x0:x1], ids)
    sub[~keep] = 0
    Image.fromarray(sub).save('../../www/assets/items/%s.png' % name)
    print(name, 'body x, y =', wx - bx, wy - by, ' w, h =', x1 - x0, y1 - y0)
