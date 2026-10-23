# Cuts the owner's two outfits (art-source/items/outfits_sheet.png: Skull Beanie figure, Cat Hoodie figure) into
# wearables in body-sprite px. Fit found by matching outlines against peach/idle_open.png (like align.py):
# beanie figure x35-165 scale 0.975 at (-6,-42), hoodie figure x226-365 scale 0.985 at (-6,-45).
# Run from art-source/items: writes ref_*.png here and the pictures into www/assets/items/.
import numpy as np
from PIL import Image, ImageDraw
src=Image.open('outfits_sheet.png').convert('RGBA')
PAD=60
def place(x0,x1,s,tx,ty):
    fig=src.crop((x0,0,x1,src.height))
    f=fig.resize((round(fig.width*s),round(fig.height*s)),Image.NEAREST)
    can=Image.new('RGBA',(118+2*PAD,215+PAD),(0,0,0,0))
    can.paste(f,(tx+PAD,ty+PAD),f)
    return can
place(35,165,0.975,-6,-42).save('ref_beanie.png')
place(226,365,0.985,-6,-45).save('ref_hoodie.png')
BASE=Image.open('../../www/assets/character/peach/idle_open.png').convert('RGBA')
b=Image.new('RGBA',(118+2*PAD,215+PAD)); b.paste(BASE,(PAD,PAD)); b.save('ref_base.png')
from PIL import Image
PAD=60
OUT='../../www/assets/items/'
def arr(n): return np.asarray(Image.open('ref_%s.png'%n).convert('RGBA')).astype(int)
def skin(a):
    r,g,b=a[...,0],a[...,1],a[...,2]
    return (r-b>40)&(r>=g)&(g-b>12)&(r>120)
def save(a,mask,name,box):
    o=a.copy(); o[~mask]=0
    x0,y0,x1,y1=box  # body coords
    im=Image.fromarray(o.astype(np.uint8)).crop((x0+PAD,y0+PAD,x1+PAD,y1+PAD))
    bb=im.getbbox(); print(name, 'bbox in crop',bb, '-> body x,y', x0+bb[0], y0+bb[1], 'w,h', bb[2]-bb[0], bb[3]-bb[1])
    im.crop(bb).save(OUT+name+'.png')
    return im
H,W=215+PAD,118+2*PAD
Y=(np.arange(H)-PAD)[:,None]*np.ones((1,W)); X=np.ones((H,1))*(np.arange(W)-PAD)[None,:]
for n,face,ylim in [('beanie',(34,98,50,104),84),('hoodie',(34,98,52,104),121)]:
    a=arr(n); al=a[...,3]>0
    fx0,fx1,fy0,fy1=face
    inface=(X>=fx0)&(X<=fx1)&(Y>=fy0)&(Y<=fy1)
    m=al&~skin(a)&~inface&(Y<ylim)
    if n=='hoodie':
        # below the chin only the hood around the neck, not the shirt (that is the torso texture)
        m&=~((Y>=104)&(X>=40)&(X<=90))
    save(a,m,{'beanie':'black_beanie','hoodie':'cat_hood'}[n],(-60,-60,178,ylim))

def full(a,mask,name):
    o=a.copy(); o[~mask]=0
    im=Image.fromarray(o.astype(np.uint8)).crop((PAD,PAD,PAD+118,PAD+215)); im.save(OUT+name+'.png'); return im
for n,name,dec in [('beanie','tex_skull_tee',[(58,120,78,143),(48,103,80,114)]),('hoodie','tex_cat_hoodie',[(52,103,82,118)])]:
    a=arr(n); al=a[...,3]>0
    mx=a[...,:3].max(2); mn=a[...,:3].min(2); L=a[...,:3].mean(2)
    g=al&(mx-mn<40)&(L>70)&~skin(a)
    for x0,y0,x1,y1 in dec: g|=al&(X>=x0)&(X<=x1)&(Y>=y0)&(Y<=y1)&((a[...,0]-a[...,2])<30)
    g&=(Y>=103)&(Y<=162)
    full(a,g,name)
for n,name,ytop in [('beanie','tex_white_sneakers',192),('hoodie','tex_high_tops',181)]:
    a=arr(n); al=a[...,3]>0
    full(a,al&~skin(a)&(Y>=ytop),name)
