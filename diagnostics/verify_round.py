"""Independent SEISMO-P4 reproduction from a browser export (requires ObsPy)."""
import argparse
import base64
import csv
import hashlib
import io
import json
import struct
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import urlopen

from obspy import UTCDateTime, read

def digest(data):
    return hashlib.sha256(data).hexdigest()

def catalog(text):
    return {
        "~".join((r["provider"], r["protocol"], r["id"])):r
        for r in csv.DictReader(io.StringIO(text.split("\n",1)[1]), delimiter="\t")
    }

def data_from_provider(pairs):
    """Make one archive request per independent provider/network/location/channel."""
    groups={}
    for key, url in pairs:
        parts=urlsplit(url)
        if parts.scheme!="https" or parts.username or parts.password:
            raise ValueError("Only explicit HTTPS provider URLs are supported.")
        query=dict(parse_qsl(parts.query))
        station=query.pop("station")
        token=(parts.scheme,parts.netloc,parts.path,tuple(query.items()))
        groups.setdefault(token,[]).append((key,station))
    downloaded={}
    for (scheme,host,path,query), members in groups.items():
        query=[*query,("station",",".join(s for _,s in members))]
        url=urlunsplit((scheme,host,path,urlencode(query),""))
        with urlopen(url,timeout=15) as response:
            data=response.read(800001)
        for key,_ in members:
            downloaded[key]=data
    return downloaded

def samples(data, route, start, seconds):
    hz=int(route["hz"])
    records={}
    for tr in read(io.BytesIO(data),format="MSEED").select(id=route["id"]):
        if tr.stats.sampling_rate!=hz: continue
        offset=(tr.stats.starttime.ns-start)*hz//10**9
        for i,v in enumerate(tr.data):
            idx=offset+i
            if 0<=idx<hz*seconds:
                assert records.get(idx,int(v))==int(v), "Conflicting samples"
                records[idx]=int(v)
    assert len(records)==hz*seconds, f"Incomplete window for {route['id']}"
    return struct.pack(">"+"i"*len(records),*(records[i] for i in range(hz*seconds)))

def verify(bundle, download=False, supplied=None):
    r=bundle["round"]
    text=bundle["stations_txt"]
    assert digest(text.encode())==r["catalog_sha256"]
    assert r["state"]=="RESULT" and r["algorithm"]=="SEISMO-P4"
    start=UTCDateTime(r["start_utc"]).ns
    if r.get("mode")=="browser":
        assert start//10**6==(r["accepted_ms"]//10+1)*10
        assert r["freeze_ms"]==r["accepted_ms"]+r["spin_seconds"]*1000-2000
    seconds=r["duration"]
    routes=catalog(text)
    rows={row["key"]:row for row in r["routes"]}
    all_eligible=sorted((key for key,row in rows.items() if row["complete"]),key=lambda key:(int(routes[key]["priority"]),key))
    selection=[]
    for key in all_eligible:
        station=routes[key]
        if any((station.get("physical_id") or station["id"].split(".")[:2])==(routes[other].get("physical_id") or routes[other]["id"].split(".")[:2]) or
                all(abs(float(station[axis])-float(routes[other][axis]))<.001 for axis in ("latitude","longitude"))
                for other in selection):
            continue
        selection.append(key)
        if len(selection)==3: break
    assert selection==r["used"] and len(selection)==3,"Unexpected station ordering"
    use_provider=[(k,rows[k]["source_url"]) for k in selection if rows[k].get("source_url") and (download or not rows[k].get("record_sha256"))]
    if use_provider and not download and supplied is None:
        raise SystemExit("Missing embedded recordings. Re-run with --provider to request these archival windows.")
    provided=data_from_provider(use_provider) if supplied is None else supplied
    canonical=r["algorithm"].encode()+b"\0"+r["start_utc"].encode()+b"\0"+struct.pack(">I",seconds)
    for key in selection:
        route,row=routes[key],rows[key]
        if key in provided:
            raw=provided[key]
        else:
            fingerprint=row["record_sha256"]
            raw=base64.b64decode(bundle["records"][fingerprint],validate=True)
            assert fingerprint==digest(raw)
        piece=samples(raw,route,start,seconds)
        assert digest(piece)==row["sample_sha256"]
        print(key,len(piece)//4,digest(piece))
        canonical+=route["id"].encode()+b"\0"+struct.pack(">I",int(route["hz"]))+piece
    fingerprint=digest(canonical)
    assert fingerprint==r["input_sha256"]
    for i in range(2**32):
        result=hashlib.sha256(canonical+struct.pack(">I",i)).digest()
        answer=next(((j,v) for j,v in enumerate(result) if v<222),None)
        if answer:
            j,v=answer
            assert (v%37,result.hex(),i,j,v)==(r["number"],r["digest"],r["counter"],r["index"],r["byte"])
            print("RESULT",v%37,"INPUT",fingerprint,"DIGEST",result.hex())
            break

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle",type=Path)
    parser.add_argument("--provider",action="store_true")
    args=parser.parse_args()
    verify(json.loads(args.bundle.read_text()),args.provider)
