import numpy as np, json
from PIL import Image
from scipy import ndimage as nd
U='/mnt/user-data/attachments/2dca67fc-2648-5d0b-b63d-bf8a6f679acd/'
jobs=[('idle','e0a153ce','rf_idle_hp.png',None,1.80,10,-7),('j0','0f6d6251','rf_j0_navy.png',None,0.42,1,-16),('j1','4f92caaa','rf_j1_raw.png',(0,0,145,193),0.62,23,7),('j2','4f92caaa','rf_j2_raw.png',(145,0,290,193),0.62,8,7)]
res={}
for name,f,ref,crop,s,dx,dy in jobs:
    im=Image.open(U+f+'-image.png').convert('RGBA')
    if crop: im=im.crop(crop)
    a=np.asarray(im).astype(int); L=a[...,:3].mean(-1)
    r=np.asarray(Image.open(ref).convert('RGBA')).astype(int)
    H,W=r.shape[:2]
    rs=np.asarray(Image.open(ref).convert('RGBA').resize((int(round(W*s)),int(round(H*s))),Image.NEAREST)).astype(int)
    canvas=np.zeros(a.shape[:2]+(4,),int)
    y0,x0=max(0,dy),max(0,dx); y1=min(a.shape[0],dy+rs.shape[0]); x1=min(a.shape[1],dx+rs.shape[1])
    canvas[y0:y1,x0:x1]=rs[y0-dy:y1-dy,x0-dx:x1-dx]
    refdark=(canvas[...,3]>=120)&(canvas[...,:3].mean(-1)<70)
    refdark=nd.binary_dilation(refdark,iterations=1 if s<1 else 2)
    theirs=(L<55)&~refdark&(canvas[...,3]>=120)
    lab,n=nd.label(theirs); sizes=nd.sum(theirs,lab,range(1,n+1))
    keep=np.isin(lab,[i+1 for i,v in enumerate(sizes) if v>=2])
    ys,xs=np.nonzero(keep)
    pts=sorted(set((int(x),int(y)) for x,y in zip(((xs-dx)/s).round(),((ys-dy)/s).round())))
    res[name]={'pts':pts,'s':s}
    print(name,len(xs),'bbox frame', (min(p[0] for p in pts),min(p[1] for p in pts),max(p[0] for p in pts),max(p[1] for p in pts)) if pts else None)
    # debug view
    v=np.where(keep[...,None],np.array([255,0,0,255]),np.where(canvas[...,3:4]>=120,canvas,np.array([40,40,60,255])))
    Image.fromarray(v.astype(np.uint8)).resize((a.shape[1]*3,a.shape[0]*3),Image.NEAREST).save(f'ex_{name}.png')
json.dump(res,open('bandpts.json','w'))
