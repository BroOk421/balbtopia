# Ground tiles (owner, Nov 1 2026). Reads the sheets kept in art-source/tiles/before_nov1/ (16 frames of 32 x 32,
# frame = maskOf bits: 1 top, 2 right, 4 bottom, 8 left open) and writes www/assets/tiles/:
#  - dirt_0..2: the pebbles and the holes are taken out; the mottled dirt itself (two tones, small specks) is kept
#    (owner: "don't remove these designs on the dirt"). Grey pebble pixels and the dark holes (with their light rim
#    and shadow) are refilled from the dirt round them.
#  - stone: a boulder drawn like the owner's rock picture (see below); the same in all 16 frames. www/js/world/ground.js
#    draws it on dirt / dark rock / the sky depending on what is next to each tile.
# usage: python3 ground_shapes.py <art-source/tiles dir> <www/assets/tiles dir>
import sys, math, random, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

SRC, OUT = sys.argv[1] + '/before_nov1', sys.argv[2]
N = 32


def frames(name):
    a = np.array(Image.open(f'{SRC}/{name}.png').convert('RGBA'))
    return [a[:, k * N:(k + 1) * N].copy() for k in range(16)]


def save(name, fr):
    Image.fromarray(np.concatenate(fr, axis=1), 'RGBA').save(f'{OUT}/{name}.png')


def band(m):
    """the edge bands of the open sides (outline, light line, shadow), left as they are"""
    b = np.zeros((N, N), bool)
    if m & 1: b[:3] = True
    if m & 4: b[-2:] = True
    if m & 8: b[:, :2] = True
    if m & 2: b[:, -2:] = True
    return b


# ---- dirt: no pebbles / holes, the mottled dirt kept ----
for v in range(3):
    fr = frames(f'dirt_{v}')
    for m, f in enumerate(fr):
        rgb = f[..., :3].astype(int)
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        grey = (r - b < 45) & (r > 60)  # pebbles (dirt is much redder than blue)
        dark = (r + g + b) < 150  # holes
        lab, k = ndimage.label(dark)
        sizes = ndimage.sum(dark, lab, range(1, k + 1)) if k else []
        holes = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 3])
        feat = ndimage.binary_dilation(grey | holes, iterations=1) | grey | holes
        # the hole's light rim sits on top of it: two rows up
        feat |= np.roll(ndimage.binary_dilation(holes, iterations=1), -2, axis=0) & ((r + g + b) > 330)
        feat &= ~band(m)
        out = f.copy()
        ys, xs = np.nonzero(feat)
        for y, x in zip(ys, xs):
            # the most common dirt colour round it (not a feature, not the edge band)
            best, cnt = None, {}
            for rr in (2, 3, 4):
                for dy in range(-rr, rr + 1):
                    for dx in range(-rr, rr + 1):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < N and 0 <= xx < N and not feat[yy, xx] and not band(m)[yy, xx]:
                            c = tuple(f[yy, xx, :3])
                            cnt[c] = cnt.get(c, 0) + 1
                if cnt:
                    break
            if cnt:
                out[y, x, :3] = max(cnt, key=cnt.get)
        fr[m] = out
    save(f'dirt_{v}', fr)

# ---- stone: a boulder (owner's picture of a drawn rock: big flat slabs split by dark cracks, lit from the top
# left, a dark outline round a lumpy shape). Our own drawing in that style: slab polygons (FACES) inside the outline
# (SIL), each slab lighter towards its top-left, a light edge just past each crack, the boulder's top rim lit and its
# underside shaded. Every frame of the sheet is the same boulder: ground.js draws it on what is round it.
def poly_mask(pts):
    im=Image.new('L',(N,N),0); ImageDraw.Draw(im).polygon(pts,fill=255); return np.array(im)>0
SIL=[(7,31),(4,30),(2,28),(1,25),(2,19),(5,14),(8,8),(13,3),(20,2),(25,5),(28,10),(30,16),(31,23),(31,26),(29,29),(26,31)]
FACES=[ # points, shade
 ([(5,14),(8,8),(13,3),(16,9),(13,15),(7,17)],186),
 ([(13,3),(20,2),(25,5),(23,11),(16,9)],168),
 ([(25,5),(28,10),(30,16),(26,18),(23,11)],122),
 ([(16,9),(23,11),(26,18),(20,21),(13,15)],150),
 ([(2,19),(5,14),(7,17),(13,15),(11,23),(4,25),(1,25)],112),
 ([(11,23),(13,15),(20,21),(18,31),(9,31)],130),
 ([(20,21),(26,18),(30,16),(31,23),(31,26),(29,29),(26,31),(18,31)],96),
 ([(1,25),(4,25),(11,23),(9,31),(4,30),(2,28)],106),
]
sil=poly_mask(SIL)
img=np.zeros((N,N,4),np.uint8)
face_id=np.full((N,N),-1)
for k,(pts,sh) in enumerate(FACES):
    m=poly_mask(pts)&sil
    face_id[m&(face_id<0)]=k
# pixels in silhouette without face -> nearest face
if (sil&(face_id<0)).any():
    idx=ndimage.distance_transform_edt(face_id<0,return_distances=False,return_indices=True)
    fi=face_id[idx[0],idx[1]]; face_id=np.where(sil&(face_id<0),fi,face_id)
G=lambda v:(v,v,v+3)
cent={k:np.argwhere(face_id==k).mean(axis=0) for k in range(len(FACES)) if (face_id==k).any()}
outer=sil&~ndimage.binary_erosion(sil,structure=[[0,1,0],[1,1,1],[0,1,0]])
ring2=sil&~ndimage.binary_erosion(sil,structure=[[0,1,0],[1,1,1],[0,1,0]],iterations=2)&~outer
for y in range(N):
    for x in range(N):
        if not sil[y,x]: continue
        k=face_id[y,x]; v=FACES[k][1]
        cy,cx=cent[k]
        v+=int((cy-y)*1.6+(cx-x)*0.8)  # each face: lighter towards its top-left, darker to its bottom-right
        if ring2[y,x]:
            up=not sil[max(0,y-2),x] or not sil[y,max(0,x-2)]
            v+=22 if up and y<20 else -20  # the boulder's lit top rim / shaded underside
        # boundary between faces: dark crack line (right/bottom side of a face edge)
        nb=[face_id[yy,xx] if 0<=yy<N and 0<=xx<N and sil[yy,xx] else -2 for yy,xx in ((y,x+1),(y+1,x),(y,x-1),(y-1,x))]
        if nb[0] not in (k,-2) or nb[1] not in (k,-2): img[y,x]=(*G(70),255); continue
        if nb[2] not in (k,-2) or nb[3] not in (k,-2): v+=26   # lit edge just past a crack (top-left of face)
        img[y,x]=(*G(min(225,v)),255)
# silhouette outline
edge=sil&~ndimage.binary_erosion(sil,structure=[[0,1,0],[1,1,1],[0,1,0]])
img[edge]=(46,46,50,255)
# a few small chips
for (x,y) in []:
    if sil[y,x] and not edge[y,x]: img[y,x,:3]=np.clip(img[y,x,:3].astype(int)-34,0,255)
save('stone', [img.copy() for _ in range(16)])
print('ok')
