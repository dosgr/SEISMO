"""Build localized static pages and a single-file preview. Run locally, never on the host."""
import base64
import json
from html import escape
from pathlib import Path
import shutil
from urllib.parse import urlsplit
from xml.etree import ElementTree as ET
from lxml import html
from artwork import render

VERSION = "1.1.1"

HERE=Path(__file__).resolve().parent
SRC=HERE/'src'
OUT=HERE/'dist/seismo'
CONFIG=json.loads((HERE/'config.json').read_text())
PATH=CONFIG['path']
if not PATH.startswith('/') or not PATH.endswith('/') or '..' in PATH:
    raise ValueError('path must start and end in /')
if urlsplit(CONFIG['origin']).scheme!='https' or urlsplit(CONFIG['origin']).path not in ('','/'):
    raise ValueError('origin must be an HTTPS origin')
ROOT=CONFIG['origin'].rstrip('/')+PATH
js=['translations.js','map-data.js','mseed.js','proof.js','live.js','i18n.js','main.js','donate.js']
phrases=dict(line.split('|',1) for line in (SRC/'i18n.txt').read_text().splitlines() if line.strip())
science=json.loads((SRC/'content.json').read_text())
for el,en,eld,end in science:
    phrases[el]=en
    phrases[eld]=end
phrases['Συχνές ερωτήσεις και επιστημονική τεκμηρίωση']='FAQ and science notes'

def link_id(identity): return {'@id':identity}
def locales():
    pages={}
    for lang,label,creator,title,description,alt in [
      ('el','Σεισμορουλέτα','Λυκούργος Κεκεμπάνος','Σεισμορουλέτα SEISMO — Ο παλμός της Γης',
       'Δωρεάν επιστημονικό παιχνίδι με πραγματικά σεισμολογικά δεδομένα. Γύρισε τον τροχό 0–36 και επαλήθευσε τον αριθμό με SHA-256.',
       'Η Γη, ο τροχός της Σεισμορουλέτας και μια σεισμική κυματομορφή. Ο παλμός της Γης — Lyk.Gr.'),
      ('en','Seismic Roulette','Lykourgos Kekempanos','SEISMO Seismic Roulette — The Pulse of the Earth',
       'A free science game powered by live seismic data. Spin the 0–36 wheel and verify the number with SHA-256.',
       'Earth, the SEISMO wheel and a seismic waveform. The Pulse of the Earth — Lyk.Gr.')]:
        u=ROOT+('en/' if lang=='en' else '')
        image=ROOT+f'images/social-{lang}.jpg'
        imageId=u+'#image'
        siteId=ROOT+'#website'
        appId=ROOT+'#application'
        person=CONFIG['creator_url']+'#creator'
        contentLicense='https://creativecommons.org/licenses/by-sa/4.0/'
        schema={'@context':'https://schema.org','@graph':[
            {'@type':'WebSite','@id':siteId,'url':ROOT,'name':'SEISMO','inLanguage':['el','en'],
             'creator':link_id(person)},
            {'@type':'WebPage','@id':u+'#page','url':u,'isPartOf':link_id(siteId),'mainEntity':link_id(appId),
             'inLanguage':lang,'name':title,'description':description,'license':contentLicense,
             'primaryImageOfPage':link_id(imageId)},
            {'@type':['WebApplication','SoftwareApplication'],'@id':appId,'name':'SEISMO','alternateName':'Σεισμορουλέτα',
             'url':ROOT,'description':description,'creator':link_id(person),'dateCreated':'2026',
             'applicationCategory':'EducationalApplication','applicationSubCategory':'Seismology',
             'operatingSystem':'Web browser','browserRequirements':'JavaScript; HTTPS for live spins',
             'inLanguage':['el','en'],'countryOfOrigin':{'@type':'Country','name':'Greece'},
             'isAccessibleForFree':True,'offers':{'@type':'Offer','price':0,'priceCurrency':'EUR'},
             'image':link_id(imageId),'license':'https://www.gnu.org/licenses/agpl-3.0.html',
             'subjectOf':{'@type':'SoftwareSourceCode','codeRepository':ROOT+'SEISMO-source.zip',
                          'license':'https://www.gnu.org/licenses/agpl-3.0.html','programmingLanguage':'JavaScript'}},
            {'@type':'Person','@id':person,'name':creator,'alternateName':['Λυκούργος Κεκεμπάνος','Lykourgos Kekempanos','Lyk.Gr'],
             'url':CONFIG['creator_url'],'brand':{'@type':'Brand','name':'Lyk.Gr'}},
            {'@type':'ImageObject','@id':imageId,'contentUrl':image,'url':image,'width':1200,'height':630,'caption':alt,'inLanguage':lang},
        ]}
        pages[lang]=dict(title=title,description=description,canonical=u,image=image,alt=alt,schema=schema,
                         locale='en_GB' if lang=='en' else 'el_GR',altLocale='el_GR' if lang=='en' else 'en_GB',
                         author=creator+' | Lyk.Gr')
    return pages
PAGES=locales()

def head(lang,prefix,standalone):
    p=PAGES[lang]
    e=lambda x:escape(str(x),quote=True)
    def meta(name,key,prop=False):
        return f'<meta {"property" if prop else "name"}="{name}" data-meta="{key}" content="{e(p[key])}">'
    blocks=[
      ('BASIC BROWSER & LANGUAGE SETTINGS',['<meta charset="utf-8">','<meta name="viewport" content="width=device-width, initial-scale=1">',f'<title>{e(p["title"])}</title>']),
      ('SEO & SEARCH ENGINES',[meta('description','description'),meta('author','author'),
        '<meta name="robots" content="index, follow">']+
        ([] if standalone else [
        f'<link rel="canonical" href="{p["canonical"]}">',f'<link rel="alternate" hreflang="el" href="{ROOT}">',
        f'<link rel="alternate" hreflang="en" href="{ROOT}en/">',f'<link rel="alternate" hreflang="x-default" href="{ROOT}">'])+
        ['<!-- Generic robots applies to Googlebot and Bingbot. Meta keywords are omitted. -->']),
      ('OWNERSHIP VERIFICATION',[
        f'<meta name="{name}" content="{e(CONFIG["verification"][key])}">'
        for key,name in [('google','google-site-verification'),('bing','msvalidate.01')]
        if CONFIG['verification'][key] and not standalone] or ['<!-- Optional property verification goes here after launch. -->']),
      ('SPEED & LOADING OPTIMIZATION',['<!-- Critical stylesheet and deferred scripts are same-origin. No provider connection before user action. -->']),
      ('SOCIAL MEDIA — OPEN GRAPH',[meta('og:title','title',True),meta('og:description','description',True),
        '<meta property="og:type" content="website">',meta('og:url','canonical',True),'<meta property="og:site_name" content="SEISMO">',
        meta('og:locale','locale',True),meta('og:locale:alternate','altLocale',True),meta('og:image','image',True),
        meta('og:image:secure_url','image',True),'<meta property="og:image:type" content="image/jpeg">',
        '<meta property="og:image:width" content="1200">','<meta property="og:image:height" content="630">',meta('og:image:alt','alt',True)] if not standalone else []),
      ('SOCIAL MEDIA — X CARDS',['<meta name="twitter:card" content="summary_large_image">',meta('twitter:title','title'),
        meta('twitter:description','description'),meta('twitter:image','image'),meta('twitter:image:alt','alt')] if not standalone else []),
      ('ICONS & FAVICONS',[f'<link rel="icon" href="{prefix}favicons/favicon.ico" sizes="any">',
        f'<link rel="icon" type="image/svg+xml" href="{prefix}favicons/favicon.svg">']+
        [f'<link rel="icon" type="image/png" sizes="{n}x{n}" href="{prefix}favicons/favicon-{n}.png">' for n in (16,32,48,96)]+
        [f'<link rel="apple-touch-icon" href="{prefix}favicons/apple-touch-icon.png" sizes="180x180">'] if not standalone else []),
      ('WEB APP MANIFEST & MOBILE',['<meta name="theme-color" content="#091514">']+
        ([] if standalone else [f'<link rel="manifest" href="{prefix}manifest'+('-en' if lang=='en' else '')+'.json">'])),
      ('EXTERNAL STYLE FILES',[f'<link rel="stylesheet" href="{prefix}css/style.css">',
                               f'<link rel="stylesheet" href="{prefix}css/donate.css">'] if not standalone else []),
      ('INTERNAL CSS',['<style>\n'+(SRC/'style.css').read_text()+'\n'+(SRC/'donate.css').read_text()+'\n</style>'] if standalone else []),
      ('STRUCTURED DATA — SCHEMA.ORG JSON-LD',['<script type="application/ld+json" id="schema">\n'+json.dumps(p["schema"],ensure_ascii=False,indent=2)+'\n</script>'] if not standalone else []),
      ('ACCESSIBILITY',['<meta name="color-scheme" content="dark">','<!-- See the skip link, live regions and keyboard-friendly native controls. -->']),
      ('PROJECT CONFIGURATION & SECURITY',['<!-- Scripts are deferred. The live catalog is external and shared between languages. -->']+
        ([] if standalone else ['<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\'; connect-src \'self\' https: wss:; img-src \'self\' data:; object-src \'none\'; base-uri \'none\'; form-action \'none\'">'])),
      ('LICENSE & AUTHOR INFORMATION',[f'<link rel="license" href="{prefix}LICENSE">','<!-- GNU AGPL v3 code. CC BY-SA 4.0 original content. See NOTICE.md for third-party assets. -->'] if not standalone else []),
    ]
    return '\n'.join(f'  <!-- {i:02d}. {label} -->\n'+'\n'.join('  '+x for x in items) for i,(label,items) in enumerate(blocks,1) if items)

def body(lang,prefix,standalone):
    value=(SRC/'index.html').read_text().split('<body>',1)[1].split('<script src=',1)[0].strip().removesuffix('</body>')
    value=value.replace('href="/"','href="'+prefix+'"',1)
    icon=base64.b64encode((OUT/'favicons/favicon.svg').read_bytes()).decode()
    url='data:image/svg+xml;base64,'+icon if standalone else prefix+'favicons/favicon.svg'
    value=value.replace('<i></i>',f'<img alt="" width="31" height="31" src="{url}">')
    value=value.replace('<span id="mode"', '''<nav class="lang-nav" aria-label="Γλώσσα">
<a data-lang="el" lang="el" hreflang="el" href="__EL__">🇬🇷 EL</a>
<a data-lang="en" lang="en" hreflang="en" href="__EN__">🇬🇧 EN</a></nav><span id="mode"''')
    value=value.replace('__EL__',prefix if not standalone else ROOT).replace('__EN__',prefix+'en/' if not standalone else ROOT+'en/')
    value=value.replace('<main>','''<main id="main">
<noscript><p>Η διαδραστική ρουλέτα χρειάζεται JavaScript. Η περιγραφή και η επιστημονική τεκμηρίωση διαβάζονται παρακάτω.</p></noscript>''')
    value='<a class="jump" href="#main">Παράκαμψη προς το περιεχόμενο</a>\n'+value
    value=value.replace('<h1>Σεισμική Ρουλέτα</h1><p>Η Γη δίνει τα δεδομένα. Τα μαθηματικά δίνουν τον αριθμό.</p>',
           '''<h1><span>Σεισμορουλέτα</span> <span aria-hidden="true">—</span> <span>Ο παλμός της Γης</span></h1>
           <p>Αυτή η ρουλέτα δεν γυρίζει απλώς… ΔΟΝΕΙΤΑΙ!</p>
           <p>Εσύ επιλέγεις τον αριθμό. Η Γη δίνει τα δεδομένα. Τα μαθηματικά καθορίζουν το αποτέλεσμα!</p>
           <p>Γιατί η Γη δεν είναι ακίνητη. Έχει τον δικό της παλμό!</p><p class="tagline" lang="en">Born in Greece, Powered by Earth.</p>''')
    sections=[]
    for i,(el,en,eld,end) in enumerate(science):
        sections.append(f'<{"h2" if i==0 else "h3"}>{escape(el)}</{"h2" if i==0 else "h3"}><p>{escape(eld)}</p>')
    content=('<section class="science" aria-label="Σχετικά με το SEISMO">'
             '<details class="archive info-section" id="experiment"><summary>Το πείραμα</summary><div class="section-copy">'
             +sections[0].split('</h2>',1)[1]+'</div></details>'
             '<details class="archive info-section" id="questions"><summary>Συχνές ερωτήσεις και επιστημονική τεκμηρίωση</summary>'
             '<div class="section-copy">'+''.join(sections[1:])+'</div></details></section>')
    start=value.index('<footer>')
    end=value.index('</footer>',start)+len('</footer>')
    footer=f'''<footer class="site-footer">
<p><span>Ιδέα &amp; δημιουργία: Λυκούργος Κεκεμπάνος</span> | <a href="{CONFIG['creator_url']}">Lyk.Gr</a></p>
<p>Με τη συνδρομή της τεχνητής νοημοσύνης GPT.</p>
<p>(ↄ) <a href="https://en.wikipedia.org/wiki/Copyleft">Copyleft</a> 2026–27 — <a href="https://www.gnu.org/licenses/agpl-3.0.html">AGPL v3</a> / Λυκ · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a></p>
<p><span aria-hidden="true">🔗</span> <a href="https://github.com/dosgr/SEISMO">https://github.com/dosgr/SEISMO</a></p>
</footer>'''
    value=value[:start]+content+value[end:]
    value=value.replace('<details id="credits">','<details class="archive info-section" id="credits">')
    value=value.replace('<summary>Πηγές, άδειες και απόρρητο</summary>','<summary>Πηγές, άδειες και απόρρητο</summary><div class="section-copy">',1)
    closure=value.index('</details>',value.index('id="credits"'))
    value=value[:closure]+('<p>Η AGPL v3 αφορά τον πηγαίο κώδικα. Η CC BY-SA 4.0 αφορά το περιεχόμενο που φέρει αυτή την άδεια. Τα σεισμολογικά δεδομένα τρίτων διατίθενται με τους όρους και τις αναφορές του αντίστοιχου δικτύου και παρόχου.</p>'
       '<p><a href="https://doi.org/10.7914/SN/HT">ΑΠΘ / HT</a> · <a href="https://doi.org/10.15778/RESIF.CL">Κορινθιακός / CL</a> · <a href="https://service.earthscope.org/fdsnws/">EarthScope FDSN</a>.</p>'
       '</div></details>'+(SRC/'donate.html').read_text()+footer)+value[closure+len('</details>'):]
    hostPrefix=ROOT if standalone else prefix
    value=value.replace('href="./stations.txt"',f'href="{hostPrefix}stations.txt"')
    value=value.replace('href="./SEISMO-Phase-4.zip"',f'href="{hostPrefix}SEISMO-source.zip"')
    value=value.replace('id="algorithm" href="#credits"',f'id="algorithm" href="{hostPrefix}ALGORITHM.md"')
    value=value.replace('>GSN / IU</a>.','>GSN / IU</a>, <a href="https://doi.org/10.7914/SN/CI">SCSN / CI</a>.')
    tree=html.fragment_fromstring(value,create_parent='div')
    dynamic={'outcome','mode','output','digest','stage','roundlink','roundActions','historyRows','attempts','telemetryNote','stationList','archiveCharts','archiveResult','proofResult','extraProof','transport','wssStatus'}
    def lookup(text): return phrases.get((text or '').strip())
    def span(raw):
        rendered=html.Element('span',{'data-el':raw.strip(),'data-en':lookup(raw)})
        rendered.text=raw.strip() if lang=='el' else lookup(raw)
        return rendered
    for node in list(tree.iter()):
        if node.get('data-lang')==lang:node.set('aria-current','page')
        if node.tag=='a' and (node.get('href') or '').startswith('https://') and not node.get('data-lang'):
            node.set('target','_blank')
            node.set('rel','noopener noreferrer')
        attributes=[('aria-label','label'),('placeholder','placeholder')]
        if node.get('id')=='support-area' or any(parent.get('id')=='support-area' for parent in node.iterancestors()):
            attributes.extend([('alt','alt'),('title','title')])
        for attr,kind in attributes:
            raw=node.get(attr)
            if lookup(raw):
                node.set(f'data-{kind}-el',raw)
                node.set(f'data-{kind}-en',lookup(raw))
                if lang=='en':node.set(attr,lookup(raw))
        if lookup(node.text) and node.get('id') in dynamic:
            node.set('data-initial-el',node.text)
            if lang=='en':node.text=lookup(node.text)
        elif lookup(node.text):
            raw=node.text
            if len(node):
                item=span(raw);item.tail=' ' if raw[-1:].isspace() else ''
                node.text='';node.insert(0,item)
            else:
                node.set('data-el',raw.strip());node.set('data-en',lookup(raw))
                if lang=='en':node.text=lookup(raw)
        if lookup(node.tail):
            raw=node.tail
            node.tail=' ' if raw[:1].isspace() else ''
            item=span(raw);item.tail=' ' if raw[-1:].isspace() else ''
            node.addnext(item)
    return ''.join(html.tostring(n,encoding='unicode',method='html') for n in tree)

def page(lang,standalone=False):
    prefix='../' if lang=='en' else './'
    scripts=[]
    if standalone:
        embedded={'archive':json.loads((HERE/'evidence/archive-proof.json').read_text()),'algorithm':(HERE/'ALGORITHM.md').read_text()}
        images={name:'data:image/jpeg;base64,'+base64.b64encode((SRC/name).read_bytes()).decode()
                for name in ('athens.jpg','ireland.jpg')}
        scripts.append('window.SEISMO_ARTIFACT='+json.dumps(embedded,ensure_ascii=False)+';\nwindow.SEISMO_IMAGES='+json.dumps(images)+';')
        scripts+=((OUT/'js'/name).read_text() for name in js)
        scripts=['<script>\n'+s.replace('</script','<\\/script')+'\n</script>' for s in scripts]
        scripts.insert(0,f'<script src="{prefix}donate-config.js"></script>')
    else:
        scripts=[f'<script src="{prefix}donate-config.js" defer></script>']
        scripts.extend(f'<script src="{prefix}js/{name}" defer></script>' for name in js)
    return f'<!doctype html>\n<html lang="{lang}" dir="ltr">\n<head>\n'+head(lang,prefix,standalone)+f'\n</head>\n<body data-root="{prefix}" data-standalone="{str(standalone).lower()}">\n'+body(lang,prefix,standalone)+'\n'+'\n'.join(scripts)+'\n</body>\n</html>\n'

def main():
    for folder in ('en','css','js','favicons','images','data'):
        (OUT/folder).mkdir(parents=True,exist_ok=True)
    render(OUT)
    for name in ('stations.txt','LICENSE','NOTICE.md','ALGORITHM.md'):
        shutil.copyfile(HERE/name,OUT/name)
    for name in ('athens.jpg','ireland.jpg','earth.jpg'):shutil.copyfile(SRC/name,OUT/'images'/name)
    shutil.copyfile(HERE/'evidence/archive-proof.json',OUT/'data/archive-proof.json')
    for name in js[1:]:shutil.copyfile(SRC/name,OUT/'js'/name)
    for name in ('style.css','donate.css'):
        shutil.copyfile(SRC/name,OUT/'css'/name)
    shutil.copyfile(HERE/'donate-config.js',OUT/'donate-config.js')
    shutil.copytree(HERE/'assets/support/logos',OUT/'assets/support/logos',dirs_exist_ok=True)
    (OUT/'js/translations.js').write_text('window.SEISMO_LOCALE = '+json.dumps({'phrases':phrases,'pages':PAGES},ensure_ascii=False,indent=2)+';\n')
    for lang,entry in [('el',OUT/'index.html'),('en',OUT/'en/index.html')]:
        entry.write_text(page(lang))
        filename='manifest-en.json' if lang=='en' else 'manifest.json'
        props={'id':'./','scope':'./','start_url':'./en/' if lang=='en' else './','display':'standalone',
               'name':PAGES[lang]['title'],'short_name':'SEISMO','description':PAGES[lang]['description'],'lang':lang,
               'theme_color':'#091514','background_color':'#091514','icons':[
                   {'src':f'favicons/favicon-{n}.png','sizes':f'{n}x{n}','type':'image/png','purpose':'any'} for n in (192,512)]+[
                   {'src':'favicons/maskable-512.png','sizes':'512x512','type':'image/png','purpose':'maskable'}]}
        (OUT/filename).write_text(json.dumps(props,ensure_ascii=False,indent=2)+'\n')
    (HERE/f'SEISMO-v{VERSION}-preview.html').write_text(page('el',True))
    (OUT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+''.join(
      '  <url>\n    <loc>'+p['canonical']+'</loc>\n'+''.join(f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{target}"/>\n' for lang,target in [('el',ROOT),('en',ROOT+'en/'),('x-default',ROOT)])+'  </url>\n'
      for p in PAGES.values())+'</urlset>\n')

if __name__=='__main__':main()
