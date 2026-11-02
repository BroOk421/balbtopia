# Launcher / web icon (owner, Nov 2 2026): the /facejoke troll face on our peach head over the game's sunset.
# Run: python3 art-source/icon_troll_sunset.py <preview dir>. Writes android mipmaps + www/assets/icon.
import sys
from PIL import Image, ImageDraw
R='/home/claude/work/src/balbtopia/'
A=R+'www/assets/'
OUT=sys.argv[1]
# --- the troll head: our idle peach head + the game's own /facejoke face (coverFace + face_joke.png)
body=Image.open(A+'character/peach/idle_open.png').convert('RGBA')
d=ImageDraw.Draw(body)
d.rectangle([34,38,34+72-1,38+58-1],fill='#f1b585'); d.rectangle([37,96,37+64-1,99],fill='#f1b585')
body.alpha_composite(Image.open(A+'character/face_joke.png').convert('RGBA'))
head=body.crop((0,0,118,109))  # head down to the chin
hb=head.getbbox(); head=head.crop(hb)
# --- sunset: the game's own backdrop layers
sky=Image.open(A+'background/sky.webp').convert('RGBA')
for n in ['sun','clouds','far','big','mid','front']:
    sky.alpha_composite(Image.open(A+f'background/{n}.webp').convert('RGBA'))
def scene(size, box=(930,250,1590,910)):
    # square crop with the sun up right
    crop=sky.crop(box).resize((size,size),Image.LANCZOS)
    return crop
def headlayer(size, frac, dy=0.07):
    # head scaled with whole-pixel steps, centered, lower part
    L=Image.new('RGBA',(size,size))
    s=max(1,round(size*frac/max(head.size)))
    h=head.resize((head.width*s,head.height*s),Image.NEAREST)
    if h.width>size*frac*1.05:
        h=head.resize((round(head.width*size*frac/max(head.size)),round(head.height*size*frac/max(head.size))),Image.NEAREST)
    L.alpha_composite(h,((size-h.width)//2+round(size*0.01),(size-h.height)//2+round(size*dy)))
    return L
def rounded(img,rad):
    m=Image.new('L',img.size,0); ImageDraw.Draw(m).rounded_rectangle([0,0,img.width-1,img.height-1],rad,fill=255)
    o=Image.new('RGBA',img.size); o.paste(img,(0,0),m); return o
def circle(img):
    m=Image.new('L',img.size,0); ImageDraw.Draw(m).ellipse([0,0,img.width-1,img.height-1],fill=255)
    o=Image.new('RGBA',img.size); o.paste(img,(0,0),m); return o
def full(size,frac=0.74):
    big=size*4
    c=scene(big); c.alpha_composite(headlayer(big,frac))
    return c.resize((size,size),Image.LANCZOS) if False else c
# render at high res then downsample for legacy pngs
master=scene(1024); master.alpha_composite(headlayer(1024,0.72))
master.save(OUT+'/master.png')
res=R+'android/app/src/main/res/'
dens={'mdpi':48,'hdpi':72,'xhdpi':96,'xxhdpi':144,'xxxhdpi':192}
for k,s in dens.items():
    m=master.resize((s,s),Image.LANCZOS)
    rounded(m,round(s*0.16)).save(res+f'mipmap-{k}/ic_launcher.png')
    circle(m).save(res+f'mipmap-{k}/ic_launcher_round.png')
    fs=round(s*108/48)
    # adaptive: inner 72/108 visible-safe; foreground head only, background sunset (full layer)
    bgimg=scene(fs*4,(630,90,1620,1080) if False else (800,60,1620,880)).resize((fs,fs),Image.LANCZOS); bgimg.convert('RGB').save(res+f'mipmap-{k}/ic_launcher_background.png')
    fg=headlayer(fs*4,0.72*72/108,0.07*72/108).resize((fs,fs),Image.LANCZOS)
    fg.save(res+f'mipmap-{k}/ic_launcher_foreground.png')
for s in (512,192):
    rounded(master.resize((s,s),Image.LANCZOS),round(s*0.16)).save(A+f'icon/icon{s}.png')
# previews
pv=Image.new('RGBA',(3*300,300),(40,40,40,255))
pv.alpha_composite(rounded(master.resize((280,280),Image.LANCZOS),45),(10,10))
pv.alpha_composite(circle(master.resize((280,280),Image.LANCZOS)),(310,10))
fs=432
ad=Image.open(res+'mipmap-xxxhdpi/ic_launcher_background.png').convert('RGBA'); ad.alpha_composite(Image.open(res+'mipmap-xxxhdpi/ic_launcher_foreground.png'))
ad=ad.crop((72,72,360,360)).resize((280,280),Image.LANCZOS)  # launcher shows ~ center 72dp (+ a bit)
pv.alpha_composite(circle(ad),(610,10))
pv.save(OUT+'/icon_preview.png')
