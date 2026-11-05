import numpy as np, sys
from PIL import Image
from scipy import ndimage as nd
U='/mnt/user-data/attachments/2dca67fc-2648-5d0b-b63d-bf8a6f679acd/'
def dark(a, alpha=None):
    L=a[...,:3].mean(-1); m=L<60
    if alpha is not None: m&=alpha
    return m
def align(ref_path, img, region=None, scales=np.arange(0.25,3.6,0.01)):
    r=np.asarray(Image.open(ref_path).convert('RGBA')).astype(int)
    D=dark(r, r[...,3]>=120)
    T=dark(img)
    best=(-1,)
    for s in scales:
        h=int(round(r.shape[0]*s)); w=int(round(r.shape[1]*s))
        if h<10 or w<10: continue
        Ds=np.asarray(Image.fromarray((D*255).astype(np.uint8)).resize((w,h),Image.NEAREST))>127
        # correlate via FFT
        H=T.shape[0]+h; W=T.shape[1]+w
        fa=np.fft.rfft2(T.astype(float),(H,W)); fb=np.fft.rfft2(Ds[::-1,::-1].astype(float),(H,W))
        cc=np.fft.irfft2(fa*fb,(H,W))
        k=np.unravel_index(np.argmax(cc),cc.shape); v=cc[k]/ (Ds.sum()+T.sum()) * 2
        if v>best[0]: best=(v,s,k[1]-w+1,k[0]-h+1)
    return best
for name, ref, crop in [('e0a153ce','rf_idle_hp.png',None),('0f6d6251','rf_j0_navy.png',None),('4f92caaa','rf_j1_raw.png',(0,0,145,193)),('4f92caaa','rf_j2_raw.png',(145,0,290,193))]:
    im=Image.open(U+name+'-image.png').convert('RGBA')
    if crop: im=im.crop(crop)
    a=np.asarray(im).astype(int)
    print(name, ref, align(ref, a))
