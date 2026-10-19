import numpy as np
from PIL import Image
from scipy import ndimage as nd
a=np.asarray(Image.open('sheet.png').convert('RGB')).astype(float)
R,G,B=a[...,0],a[...,1],a[...,2]
sat=(a.max(2)-a.min(2))/np.maximum(a.max(2),1)
# 1) sure-flame seed: very bright red channel and either saturated or near-white
seed=(R>=251)&((sat>0.45)|(G>238))
# 2) estimate the smooth background glow from pixels that are clearly not flame
notf=~nd.binary_dilation(seed,iterations=6)
w=nd.gaussian_filter(notf.astype(float),25)
bg=np.stack([nd.gaussian_filter(a[...,c]*notf,25)/np.maximum(w,1e-3) for c in range(3)],2)
# 3) alpha: how far the pixel is from that background (brighter / more saturated than it)
d=np.sqrt(((a-bg)**2).sum(2))
alpha=np.clip((d-18)/40,0,1)
alpha=np.maximum(alpha,seed*1.0)
alpha=nd.median_filter(alpha,3)
# un-mix the background: colour = (pixel - (1-a)*bg)/a
al=np.maximum(alpha,1e-3)[...,None]
col=np.clip((a-(1-al)*bg)/al,0,255)
out=np.dstack([col,alpha*255]).astype(np.uint8)
Image.fromarray(out,'RGBA').save('keyed.png')
# preview on a dark purple bg and on sky
for name,c in [('dark',(40,24,70)),('sky',(240,120,80))]:
  p=Image.new('RGBA',(1536,1024),c+(255,)); p.alpha_composite(Image.open('keyed.png')); p.convert('RGB').resize((768,512)).save('prev_'+name+'.png')
# fill the inside of each flame evenly with a soft see-through glow (the body stands there)
solid=alpha>0.5
filled=nd.binary_fill_holes(solid)
holes=filled&~solid
inner=np.array([255,236,160],float)
col[holes]=inner
alpha[holes]=np.maximum(alpha[holes],0.82)
out=np.dstack([col,alpha*255]).astype(np.uint8)
im=Image.fromarray(out,'RGBA')
# slice the 4x2 grid into 8 frames with one shared crop box, so the frames line up
cells=[im.crop((cx*384,cy*512,cx*384+384,cy*512+512)) for cy in range(2) for cx in range(4)]
# line every frame up on its bottom and its middle (the rows of the sheet sit at different heights)
bb=[c.getbbox() for c in cells]
H=max(b[3]-b[1] for b in bb); W=max(b[2]-b[0] for b in bb)
print('max size',W,H)
FW=160; FH=round(FW*H/W)
k_=FW/W
strip=Image.new('RGBA',(FW*8,FH))
for k,(c,b) in enumerate(zip(cells,bb)):
  fr=Image.new('RGBA',(W,H))
  cx=(b[0]+b[2])/2
  fr.paste(c.crop(b),(round(W/2-(cx-b[0])),H-(b[3]-b[1])))
  strip.paste(fr.resize((FW,FH),Image.LANCZOS),(k*FW,0))
strip.save('aura_golden.png',optimize=True)
print('frame',FW,FH)
p=Image.new('RGBA',strip.size,(40,24,70,255)); p.alpha_composite(strip); p.save('strip_prev.png')
