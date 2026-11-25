"""Δημιουργία των σηματοδοτημένων assets από την εικονογράφηση του SEISMO."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT=Path(__file__).resolve().parent
SVG='<circle cx="64" cy="64" r="50" fill="#143831" stroke="#ebc77d" stroke-width="6"/><ellipse cx="64" cy="64" rx="25" ry="49" fill="none" stroke="#548a78" stroke-width="2"/><path d="M16 64h96 M27 41h74 M27 87h74" stroke="#548a78" stroke-width="2"/><path d="M15 64h26l8-10 9 22 11-39 11 31 7-4h26" fill="none" stroke="#d0fff0" stroke-width="4" stroke-linejoin="round"/>'
INK='#eaf4ed'
BRASS='#ebc77d'

def render(out):
    fav=out/'favicons'
    images=out/'images'
    fav.mkdir(exist_ok=True,parents=True)
    images.mkdir(exist_ok=True,parents=True)
    (fav/'favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="27" fill="#0b211c"/>'+SVG+'</svg>')
    for lang,label in [('el','ΣΕΙΣΜΟΡΟΥΛΕΤΑ'),('en','SEISMO')]:
        (images/f'logo-{lang}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 128" role="img" aria-label="{label}"><g>{SVG}</g><text x="133" y="76" font-family="system-ui,sans-serif" font-size="53" font-weight="750" fill="{BRASS}">{label}</text><text x="135" y="100" font-family="system-ui,sans-serif" font-size="17" fill="#aed0c0">Lyk.Gr</text></svg>')
    icon=Image.new('RGB',(512,512),'#0b211c')
    d=ImageDraw.Draw(icon)
    d.ellipse((56,56,456,456),fill='#143831',outline=BRASS,width=24)
    d.ellipse((156,64,356,448),outline='#548a78',width=8)
    for y,a,b in [(164,108,404),(256,64,448),(348,108,404)]:
        d.line((a,y,b,y),fill='#548a78',width=8)
    d.line([(62,256),(162,256),(196,216),(232,304),(276,148),(318,272),(348,256),(450,256)],
           fill='#d0fff0',width=16,joint='curve')
    for size in (16,32,48,96,192,512):
        icon.resize((size,size),Image.Resampling.LANCZOS).save(fav/f'favicon-{size}.png',optimize=True)
    icon.save(fav/'favicon.ico',sizes=[(16,16),(32,32),(48,48)])
    icon.resize((180,180),Image.Resampling.LANCZOS).save(fav/'apple-touch-icon.png')
    mask=Image.new('RGB',(512,512),'#0b211c')
    mask.paste(icon.resize((392,392),Image.Resampling.LANCZOS),(60,60))
    mask.save(fav/'maskable-512.png',optimize=True)

    base=ImageOps.fit(Image.open(ROOT/'src/social-art.png').convert('RGB'),(1200,630),centering=(.5,.47))
    shade=Image.new('RGBA',base.size)
    layer=ImageDraw.Draw(shade)
    for x in range(720):
        layer.line((x,0,x,629),fill=(3,19,16,int(187*(1-x/720)**.9)))
    base=Image.alpha_composite(base.convert('RGBA'),shade)
    bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    regular='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    def font(size,weight=regular):return ImageFont.truetype(weight,size)
    for lang,title,subtitle in [
        ('el','Ο παλμός\nτης Γης','The Pulse of the Earth'),
        ('en','The Pulse\nof the Earth','Ο παλμός της Γης')]:
        image=base.copy()
        draw=ImageDraw.Draw(image)
        for y in range(9):
            draw.rectangle((65,70+y*4,118,73+y*4),fill=('#327dc4' if y%2==0 else INK))
        draw.rectangle((65,70,85,89),fill='#327dc4')
        draw.line((65,79,85,79),fill=INK,width=4);draw.line((75,70,75,89),fill=INK,width=4)
        draw.text((135,68),'S E I S M O',font=font(27,bold),fill=BRASS)
        draw.multiline_text((60,159),title,font=font(74,bold),fill=INK,spacing=0)
        draw.text((65,343),subtitle,font=font(27),fill='#b9d9cb')
        draw.line((65,410,146,410),fill=BRASS,width=3)
        draw.text((65,434),'Born in Greece, Powered by Earth.',font=font(23),fill=INK)
        draw.text((65,550),'Lyk.Gr',font=font(25,bold),fill=BRASS)
        image.convert('RGB').save(images/f'social-{lang}.jpg',quality=89,optimize=True,progressive=True)
