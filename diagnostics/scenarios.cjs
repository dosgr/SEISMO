const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const scripts=['proof.js','live.js'].map(f=>fs.readFileSync(path.join(root,'src',f),'utf8')).join('\n');
const catalog=fs.readFileSync(path.join(root,'stations.txt'),'utf8');
const fixed=Date.parse('2026-11-27T00:00:00.010Z');
const start=now=>({accepted_ms:now-2,start_ms:now,start_utc:new Date(now).toISOString(),
    end_utc:new Date(now+1000).toISOString(),freeze_ms:now+17998,spin_seconds:20,duration:1});
async function run(){
 const statuses={};
 const ctx=vm.createContext({console,TextEncoder,URL,URLSearchParams,Date,performance,setTimeout,
     AbortSignal, fetch:async url=>({status:statuses[new URL(url).hostname]||204,headers:new Headers({'Retry-After':'180'})})});
 const api=vm.runInContext(scripts+';({live:SeismoLive,proof:SeismoProof})',ctx);
 const all=api.proof.parseCatalog(catalog).rows.filter(r=>r.enabled&&r.browser);
 const primary=all.filter(r=>r.level===1),secondary=all.filter(r=>r.level===2),global=all.filter(r=>r.level===3);
 const selected=(suppliers)=>Array.from(api.proof.pick(all,new Map(suppliers.map(r=>[r.key,true]))));
 for(const n of [3,2,1,0]){
  const sum=selected([...primary.slice(0,n),...global]).filter(x=>x.country_code==='GR').length;assert.equal(sum,n);
  console.log('Ελεγχόμενη κάλυψη, ελληνικοί:',n,'επιλογές');
 }
 assert(selected([...secondary.slice(0,3),...global]).every(x=>x.level===2));
 assert(selected([...primary.slice(0,3),...global]).every(x=>x.level===1));
 assert.equal(selected([]).length,0);
 const duplicate={...primary[0],id:"XX.AAA..HHZ",key:"mirror",provider:"mirror",priority:1011,lat:0,lon:0};
 assert.equal(Array.from(api.proof.pick([primary[0],duplicate,global[0]],new Map([primary[0],duplicate,global[0]].map(r=>[r.key,true])))).length,2);
 statuses['service.earthscope.org']=503;
 statuses['seisdata.epos-france.fr']=429;
 statuses['service.scedc.caltech.edu']=404;
 let now=0;
 const mockFetch=async url=>({status:statuses[new URL(url).hostname]||204,headers:new Headers({'Retry-After':'180'})});
 const c2=vm.createContext({console,TextEncoder,URL,URLSearchParams,Date,
    performance:{now:()=>now},setTimeout:(cb,ms)=>{queueMicrotask(()=>{now=Math.max(now,ms);cb();});return 0;},
    AbortSignal,fetch:mockFetch});
 const l=vm.runInContext(scripts+';SeismoLive',c2);
 const r=start(fixed);
 const run=await l.evaluate(r,all,()=>{},0);
 assert.equal(run.round.state,'NO RESULT');
 assert.equal(run.round.http_requests.length,3);
 assert.deepEqual(Array.from(run.round.http_requests,x=>x.http_status).sort(),[404,429,503]);
 assert(run.round.routes.some(x=>x.status.state.includes('Retry-After')));
 console.log('Αποτυχία παρόχων και HTTP 404/429/503, NO RESULT και προσωρινή παύση: OK');

 for(const host of Object.keys(statuses))delete statuses[host];
 now=0;
 const empty=await vm.runInContext(scripts+';SeismoLive',vm.createContext({console,TextEncoder,URL,URLSearchParams,Date,
    performance:{now:()=>now},setTimeout:(cb,ms)=>{queueMicrotask(()=>{now=Math.max(now,ms);cb();});return 0;},
    AbortSignal,fetch:mockFetch})).evaluate(r,all,()=>{},0);
 assert.equal(empty.round.state,'NO RESULT');
 assert.equal(empty.round.http_requests.length,4);
 assert(empty.round.http_requests.every(x=>x.http_status===204));
 assert(empty.round.http_requests.some(x=>x.level===4));
 console.log('HTTP 204 σε όλους, προσπάθεια επιπέδου 4 και NO RESULT: OK');

 const t=performance.now();
 const prepared=Array.from({length:1000},(_,i)=>api.live.plan(start(fixed+i*10),all).filter(g=>g.send_ms!==null));
 assert(prepared.every(loss=>loss.length===4&&new Set(loss.map(x=>x.host)).size===3));
 console.log('1.000 τοπικά σχέδια, χωρίς δικτυακές λήψεις:',Math.round(performance.now()-t),'ms. Μέγιστο 4.000 πιθανά αιτήματα στο κύμα.');
}
run().catch(err=>{console.error(err);process.exitCode=1;});
