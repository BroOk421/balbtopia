import struct, zlib, sys
from PIL import Image
def read(path):
    d=open(path,'rb').read()
    size,magic,frames,W,H,depth=struct.unpack_from('<IHHHHH',d,0)
    assert magic==0xA5E0, hex(magic)
    pal={}
    off=128; layers=[]; cels=[]
    for fi in range(frames):
        fsize,fmagic,oldn,dur=struct.unpack_from('<IHHH',d,off)
        newn=struct.unpack_from('<I',d,off+12)[0]
        n=newn or oldn
        p=off+16
        for _ in range(n):
            csize,ctype=struct.unpack_from('<IH',d,p); body=d[p+6:p+csize]
            if ctype==0x2004:
                flags,ltype,child,_,_,blend,opac=struct.unpack_from('<HHHHHHB',body,0)
                nl=struct.unpack_from('<H',body,16)[0]; name=body[18:18+nl].decode()
                layers.append(name)
            elif ctype==0x2005:
                li,x,y,op,ct=struct.unpack_from('<HhhBH',body,0)
                if ct in (0,2):
                    w,h=struct.unpack_from('<HH',body,16)
                    raw=body[20:] if ct==0 else zlib.decompress(body[20:])
                    cels.append((fi,li,x,y,w,h,raw,op))
            elif ctype==0x2019:
                nsz,first,last=struct.unpack_from('<III',body,0)
                q=20
                for i in range(first,last+1):
                    fl,r,g,b,a=struct.unpack_from('<HBBBB',body,q); q+=6
                    if fl&1:
                        nl=struct.unpack_from('<H',body,q)[0]; q+=2+nl
                    pal[i]=(r,g,b,a)
            p+=csize
        off+=fsize
    return W,H,depth,layers,cels,pal,frames
def layer_images(path):
    W,H,depth,layers,cels,pal,frames=read(path)
    out={}
    for fi,li,x,y,w,h,raw,op in cels:
        im=Image.new('RGBA',(W,H),(0,0,0,0))
        if depth==32: c=Image.frombytes('RGBA',(w,h),raw)
        elif depth==8:
            c=Image.new('RGBA',(w,h)); px=c.load()
            for j in range(h):
                for i in range(w):
                    k=raw[j*w+i]; px[i,j]=pal.get(k,(0,0,0,0)) if k!=0 else (0,0,0,0)
        else:
            c=Image.new('RGBA',(w,h)); px=c.load()
            for j in range(h):
                for i in range(w):
                    v,a=raw[(j*w+i)*2],raw[(j*w+i)*2+1]; px[i,j]=(v,v,v,a)
        im.alpha_composite(c,(x,y))
        out[(fi,layers[li])]=im
    return W,H,layers,out,frames
# ---- cut the held pictures (Nov 20 2026, build u): python3 held_cut.py <balbtopia root> ----
if __name__ == '__main__':
    import os
    root = sys.argv[1] if len(sys.argv) > 1 else '../../..'
    here = os.path.dirname(os.path.abspath(__file__))
    OUT = os.path.join(root, 'www/assets/items/')
    W, H, layers, out, fr = layer_images(os.path.join(here, 'held/rod.aseprite'))
    rod = out[(0, 'rod')]; r = rod.crop(rod.getbbox()); r.save(OUT + 'held_rod.png')
    print('rod top-left', rod.getbbox()[:2], '(rodknife.js HELD.at = that - (40, 20.5))')
    a=(112,79,64);b=(82,58,47);c=(163,146,75);d=(153,136,66);e=(194,190,189);f=(143,136,133);g=(153,139,79);h=(235,199,48)
    def recol(m, fn=None):
        im = r.copy(); px = im.load(); src = r.load()
        for y in range(im.height):
            for x in range(im.width):
                p = src[x, y]
                if p[3] == 0: continue
                n = fn(x, y, p[:3]) if fn else None
                px[x, y] = (n or m.get(p[:3], p[:3])) + (255,)
        return im
    recol({a:(232,176,40),b:(168,112,16),c:(255,236,150),d:(255,200,48),g:(255,240,160),e:(255,248,220),f:(200,150,40),h:(232,48,62)}).save(OUT + 'held_rod_golden.png')
    RB = [(232,48,62),(242,144,42),(255,210,63),(74,192,74),(58,138,232),(138,74,216)]
    recol({a:(226,206,168),b:(160,128,88),c:(255,244,168),d:(242,180,30),e:(255,248,220),f:(138,80,6),g:(255,240,160),h:(58,138,232)},
          lambda x, y, k: RB[(x // 5) % 6] if (k in (e, g) and x < 27) else None).save(OUT + 'held_rod_noah.png')
    W, H, layers, out2, fr = layer_images(os.path.join(here, 'held/knife.aseprite'))
    k = out2[(0, 'knife')]; px = k.load()
    for y in range(H):
        for x in range(0, 20): px[x, y] = (0, 0, 0, 0)  # stray rod pixels left of the blade
    k.crop(k.getbbox()).save(OUT + 'held_knife.png'); print('knife top-left', k.getbbox()[:2])
    Image.open(os.path.join(here, 'held/knife.png')).convert('RGBA').save(OUT + 'knife_icon.png')
