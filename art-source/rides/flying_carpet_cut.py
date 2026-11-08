import sys
from PIL import Image
import numpy as np
from collections import deque
src=sys.argv[1]; out=sys.argv[2]; S=float(sys.argv[3])  # source px per art px
im=np.array(Image.open(src).convert('RGBA')).astype(float)
H,W=im.shape[:2]
rgb=im[...,:3]
white=(rgb.min(-1)>200)&(np.abs(rgb.max(-1)-rgb.min(-1))<40) | (im[...,3]<20)
# flood fill background from border through whitish pixels
bg=np.zeros((H,W),bool); q=deque()
for x in range(W):
    for y in (0,H-1):
        if white[y,x]: bg[y,x]=True;q.append((y,x))
for y in range(H):
    for x in (0,W-1):
        if white[y,x] and not bg[y,x]: bg[y,x]=True;q.append((y,x))
while q:
    y,x=q.popleft()
    for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
        ny,nx=y+dy,x+dx
        if 0<=ny<H and 0<=nx<W and not bg[ny,nx] and white[ny,nx]:
            bg[ny,nx]=True;q.append((ny,nx))
# also treat light pinkish fringe adjacent to bg as bg (blend with white)
fg=~bg
boxes=[(77,95,670,190),(745,95,1340,190),(77,254,670,370),(745,254,1340,370)]
frames=[]
for (x0,y0,x1,y1) in boxes:
    m=fg[y0-4:y1+4,x0-4:x1+4]; ys,xs=np.nonzero(m)
    bx0,by0,bx1,by1=xs.min()+x0-4,ys.min()+y0-4,xs.max()+x0-3,ys.max()+y0-3
    sub=fg[by0:by1,bx0:bx1]
    widths=sub.sum(1)
    body=np.nonzero(widths>0.8*widths.max())[0]
    cy=by0+(body.min()+body.max()+1)/2
    cx=(bx0+bx1)/2
    frames.append(dict(b=(bx0,by0,bx1,by1),cx=cx,cy=cy,bt=by0+body.min(),bb=by0+body.max()+1))
    print((bx0,by0,bx1,by1),'body rows',by0+body.min(),by0+body.max()+1,'cx',cx,'cy',cy)
# common canvas in source px around (cx,cy)
L=max(max(f['cx']-f['b'][0],f['b'][2]-f['cx']) for f in frames)+S
U=max(f['cy']-f['b'][1] for f in frames)+S
D=max(f['b'][3]-f['cy'] for f in frames)+S
ow=int(np.ceil(2*L/S)); oh=int(np.ceil((U+D)/S))
# keep the body centre on a pixel boundary
print('out',ow,oh)
strip=np.zeros((oh,ow*4,4),np.uint8)
for n,f in enumerate(frames):
    ox=f['cx']-ow*S/2; oy=f['cy']-round(U/S)*S
    for j in range(oh):
        for i in range(ow):
            xa=ox+i*S; ya=oy+j*S
            xs0,xs1=int(round(xa)),int(round(xa+S)); ys0,ys1=int(round(ya)),int(round(ya+S))
            xs0=max(xs0,0);ys0=max(ys0,0);xs1=min(xs1,W);ys1=min(ys1,H)
            if xs1<=xs0 or ys1<=ys0: continue
            mm=fg[ys0:ys1,xs0:xs1]
            a=mm.mean()
            if a<0.5: continue
            # inner pixels (skip a margin so the blur between art pixels counts less)
            c=rgb[ys0:ys1,xs0:xs1][mm]
            # take median for crisper colours
            col=np.median(c,axis=0)
            strip[j,n*ow+i]=[*col.astype(int),255]
    print('frame',n,'centre row',round(U/S))
Image.fromarray(strip).save(out)
