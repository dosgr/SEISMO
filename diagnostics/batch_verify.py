"""One bounded retrospective HTTPS download to check several EarthScope HT/HL rounds."""
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen, Request
import json
from verify_round import verify

p=Path(__file__).resolve().parent
bundles=[json.loads(x.read_text()) for x in sorted(p.glob('live-?.json'))]
rounds=[b['round'] for b in bundles]
keys=sorted({key for r in rounds for key in r['used']})
assert keys and all(k.startswith('earth~FDSN~H') and k.endswith('..HHZ') for k in keys)
ids=[k.split('~')[-1].split('.') for k in keys]
args=dict(network=','.join(sorted({i[0] for i in ids})),station=','.join(sorted({i[1] for i in ids})),location='--',channel='HHZ',
          starttime=min(r['start_utc'] for r in rounds),endtime=max(r['end_utc'] for r in rounds),nodata=204)
url='https://service.earthscope.org/fdsnws/dataselect/1/query?'+urlencode(args)
print(url,flush=True)
with urlopen(Request(url,headers={'User-Agent':'SEISMO independent verification/1.1'}),timeout=17) as response:
    raw=response.read(800001)
    print('HTTP',response.status,'bytes',len(raw),flush=True)
assert 0<len(raw)<=800000
for bundle in bundles:
    print(bundle['round']['start_utc'],flush=True)
    verify(bundle,supplied={k:raw for k in keys})
