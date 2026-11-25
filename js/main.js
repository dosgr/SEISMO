"use strict";
const $=id=>document.getElementById(id);
const wheel=$("wheel");
const ctx=wheel.getContext("2d");
const order=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const reds=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const slices=2*Math.PI/37;
let angle=0;
let ball=-Math.PI/2;
let frame=0;
const asset=name=>window.SEISMO_IMAGES?.[name] || new URL("images/"+name,SeismoLocale.root).href;
function node(tag,className,text){
  const e=document.createElement(tag);
  if(className) e.className=className;
  if(text!==undefined) e.textContent=text;
  return e;
}
function wheelDraw(selected=null){
  const size=790, c=size/2, rad=Math.PI*2;
  ctx.clearRect(0,0,size,size);ctx.save();ctx.translate(c,c);
  const rim=ctx.createRadialGradient(0,0,125,0,0,385);
  for(const [stop,color] of [[0,"#1e2518"],[.55,"#47341d"],[.80,"#8d6230"],[.88,"#31291e"],[.93,"#c39a52"],[.98,"#3b3122"],[1,"#e3b866"]]) rim.addColorStop(stop,color);
  const circle=(r,fill,stroke,line=1)=>{ctx.beginPath();ctx.arc(0,0,r,0,rad);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()}};
  circle(377,rim,"#2d2418",7);circle(348,"#161e18","#d2ae64",2);
  ctx.save();ctx.rotate(angle);
  for(let i=0;i<37;i++){
    const n=order[i], a=-Math.PI/2+i*slices;
    ctx.beginPath();ctx.arc(0,0,323,a-slices/2,a+slices/2);ctx.arc(0,0,221,a+slices/2,a-slices/2,true);ctx.closePath();
    ctx.fillStyle=n===0?"#18704d":reds.has(n)?"#9d342d":"#181c19";ctx.fill();ctx.strokeStyle="#b79b5f";ctx.lineWidth=1.6;ctx.stroke();
    if(selected===n){ctx.strokeStyle="#fff1a8";ctx.lineWidth=4;ctx.stroke();}
    ctx.save();ctx.rotate(a+Math.PI/2);ctx.fillStyle="#fff3d3";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="700 25px system-ui";ctx.fillText(n,0,-290);ctx.restore();
  }
  ctx.restore();
  circle(219,"#172821","#ac8b4b",5);circle(197,null,"#46623f",1);circle(182,null,"#62704a",1);
  const hub=ctx.createRadialGradient(-24,-25,12,0,0,148);
  hub.addColorStop(0,"#305747");hub.addColorStop(1,"#0b1915");
  circle(146,hub,"#bd9c54",3);circle(130,null,"#78683f",1);
  ctx.fillStyle="#e8cc8b";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="700 36px Georgia";ctx.fillText("SEISMO",0,-11);
  ctx.fillStyle="#b6be9a";ctx.font="16px system-ui";ctx.fillText("0 – 36",0,33);
  ctx.save();ctx.rotate(ball);ctx.translate(335,0);
  const shine=ctx.createRadialGradient(-3,-3,1,0,0,9);
  shine.addColorStop(0,"#fff");shine.addColorStop(1,"#b2a27b");circle(9,shine,"#faf0ce",1);ctx.restore();ctx.restore();
}
function wave(canvas, values){
  const W=canvas.width,H=canvas.height,c=canvas.getContext("2d");
  c.fillStyle="#0c1b17";c.fillRect(0,0,W,H);
  c.strokeStyle="#274239";c.beginPath();
  for(let n=1;n<8;n++){c.moveTo(W*n/8,0);c.lineTo(W*n/8,H);}
  c.moveTo(0,H/2);c.lineTo(W,H/2);c.stroke();
  const numbers=values.filter(Number.isFinite);
  if(numbers.length===0) return;
  const lo=Math.min(...numbers),hi=Math.max(...numbers);
  const y=v=>hi===lo?H/2:5+(hi-v)/(hi-lo)*(H-10);
  c.strokeStyle="#76dbab";c.lineWidth=1.5;c.beginPath();
  let prev=false;
  values.forEach((v,i)=>{
    if(!Number.isFinite(v)){prev=false;return}
    const x=i*W/Math.max(1,values.length-1);
    if(prev)c.lineTo(x,y(v));else c.moveTo(x,y(v));
    prev=true;
  });
  c.stroke();
}
const artifact=window.SEISMO_ARTIFACT||{};
let archiveData;
async function loadArchive(){
  if(artifact.archive)return artifact.archive;
  archiveData??=fetch(new URL("data/archive-proof.json",SeismoLocale.root)).then(response=>{
    if(!response.ok)throw Error("Αποτυχία λήψης αρχειακού δείγματος.");
    return response.json();
  }).catch(error=>{archiveData=null;throw error;});
  return archiveData;
}

const palette=["#e7c67d","#7bdfac","#68c7e7","#e99b82","#c7a7df"];
const placeImage={"HL.ATH..HHZ":["athens.jpg","Εθνικό Αστεροσκοπείο Αθηνών"],
                  "GE.DSB..HHZ":["ireland.jpg","Περιοχή Δουβλίνου"]};
let config,stationText,round,ongoing=false,localBundle=null,anchor=0;
const telemetry={};
let intensity=0,audio=null,reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
let local;
try{local=JSON.parse(localStorage.getItem("seismo-p3")||"null");}catch(e){local=null;}
if(!local||!Array.isArray(local.history))local={alias:"",balance:100,history:[]};
const save=()=>{try{localStorage.setItem("seismo-p3",JSON.stringify(local));}catch(e){}};
const sleep=ms=>new Promise(done=>setTimeout(done,Math.max(0,ms)));
const externalHttps=value=>{
  try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null;}
  catch(e){return null;}
};
function download(content,filename,mime){
  const url=URL.createObjectURL(new Blob([content],{type:mime}));
  const a=node("a");a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function wallet(){
  $("wallet").textContent=local.balance;
  const out=$("historyRows");
  out.replaceChildren(...local.history.slice(0,25).map(r=>{
    const d=node("div"), label=r.mode==="browser"?"Τοπικός":r.mode==="archive"?"Αρχείο":"Ζωντανός";
    const a=node(r.mode==="server"?"a":"span","",label+" · "+r.start_utc);
    if(r.mode==="server")a.href=new URL("v/"+r.id,SeismoLocale.root);
    d.append(a,node("span","",r.state==="RESULT"?String(r.number):"NO RESULT"));return d;
  }));
}
function settle(r){
  if(local.history.some(x=>x.id===r.id))return;
  const stake=local.pending?.id===r.id?local.pending:null;
  if(stake){
    if(r.state==="NO RESULT")local.balance+=stake.value;
    else if(r.number===stake.pick)local.balance+=stake.value*36;
    delete local.pending;
  }
  local.history.unshift({id:r.id,start_utc:r.start_utc,state:r.state,number:r.number,mode:r.mode});
  local.history=local.history.slice(0,100);
  save();wallet();
}
function map(rows,selected=[]){
  const canvas=$("map"),c=canvas.getContext("2d"),w=canvas.width,h=canvas.height,
    xy=(x,y)=>[(x+180)*w/360,(90-y)*h/180];
  c.clearRect(0,0,w,h);
  c.fillStyle="#23483d";c.strokeStyle="#406451";c.lineWidth=.55;
  for(const ring of window.SEISMO_WORLD||[]){
    c.beginPath();ring.forEach(([x,y],i)=>i?c.lineTo(...xy(x,y)):c.moveTo(...xy(x,y)));
    c.closePath();c.fill();c.stroke();
  }
  const seen=new Set();
  for(const st of rows){
    if(seen.has(st.id))continue;seen.add(st.id);
    const chosen=selected.some(s=>s.id===st.id);
    c.beginPath();c.arc(...xy(st.lon,st.lat),chosen?6:3.5,0,2*Math.PI);
    c.fillStyle=palette[(st.level-1)%5]||palette[0];c.fill();
    if(chosen){c.strokeStyle="#f4fff7";c.lineWidth=2;c.stroke();}
  }
}
function stationCard(st,progress){
  const box=node("div","station"),head=node("div","station-head"), text=node("div");
  const photo=placeImage[st.id];
  if(photo){
    const img=node("img");img.loading="lazy";img.width=61;img.height=42;img.src=asset(photo[0]);img.alt=photo[1];head.append(img);
  }
  const a=node("a","",st.name+" · "+st.id);
  a.href="https://www.openstreetmap.org/?mlat="+st.lat+"&mlon="+st.lon+"#map=12/"+st.lat+"/"+st.lon;
  a.rel="noopener noreferrer";a.target="_blank";
  text.append(a,node("span","",st.country+" · "+st.hz+" Hz · "+st.provider+" · "+st.protocol));
  head.append(text,node("span","level","Επ. "+st.level));box.append(head);
  const live=telemetry.live?.[st.key],values=progress?.wave||live?.values;
  if(values?.length){
    const canvas=node("canvas","wave");canvas.width=580;canvas.height=60;
    canvas.setAttribute("role","img");canvas.setAttribute("aria-label","Κυματομορφή "+st.id);
    box.append(canvas);wave(canvas,values);
  }
  const status=progress?.status||telemetry.health?.[st.key]||{};
  const now=telemetry.server_ms??Date.now();
  const parts=[status.state||"Αναμονή πηγής"];
  if(live)parts.push(new Date(live.last_ms).toISOString(),"ηλικία "+((now-live.last_ms)/1000).toFixed(1)+" s");
  if(progress?.sample_age_ms!=null)parts.push("Ηλικία τελευταίου δείγματος "+(progress.sample_age_ms/1000).toFixed(2)+" s");
  if(progress?.window_delay_ms!=null)parts.push("λήψη μετά το παράθυρο "+(progress.window_delay_ms/1000).toFixed(2)+" s");
  if(status.response_ms!=null)parts.push("απόκριση "+status.response_ms+" ms");
  if(progress?.values_in_window)parts.push(progress.values_in_window+" δείγματα γύρου");
  box.append(node("p","wave-empty",parts.join(" · ")));
  return box;
}
function sources(r=round){
  const all=config?.stations||[];
  const selected=(r?.used||[]).map(k=>all.find(s=>s.key===k)).filter(Boolean);
  const accessible=all.filter(s=>telemetry.live?.[s.key]);
  const unique=[...new Map([...all].reverse().map(s=>[s.id,s])).values()].reverse();
  const running=all.filter(s=>r?.routes?.some(row=>row.key===s.key&&row.values_in_window>0));
  const display=selected.length?selected:running.length?running.slice(0,3):(accessible.length?[...new Map(accessible.map(s=>[s.id,s])).values()]:unique).slice(0,3);
  $("stationList").replaceChildren(...display.map(s=>stationCard(s,r?.routes?.find(z=>z.key===s.key))));
  map(all,selected);
  $("telemetryNote").textContent=selected.length?"Επιλεγμένοι σταθμοί του γύρου":
    "Διαδρομές: "+all.length+" · Έκδοση "+(config?.version||"—")+" · UTC";
  const listed=r?.routes||all.map(s=>({key:s.key,status:telemetry.health?.[s.key]}));
  const log=listed.map(item=>{
    const line=node("div","attempt");
    const st=all.find(s=>s.key===item.key);
    const left=node("span","",item.key.replaceAll("~"," · ")+(st?" · Επ. "+st.level:""));
    const status=item.status||{};
    const selection=r?.used?.includes(item.key)?(st?.level>1?"Εφεδρεία σε χρήση":"Επιλέχθηκε"):item.complete?"Πλήρης υποψήφια":"";
    const right=node("b",item.complete?"good":"",[
      status.state||"Αναμονή",status.response_ms!=null?status.response_ms+" ms":"",
      item.arrival_ms?new Date(item.arrival_ms).toISOString():"",
      item.sample_age_ms!=null?"Ηλικία τελευταίου δείγματος "+(item.sample_age_ms/1000).toFixed(2)+" s":"",
      item.values_in_window?item.values_in_window+" δείγματα":"",selection].filter(Boolean).join(" · "));
    if(item.record_sha256 && r?.mode==="server"){
      const a=node("a",""," miniSEED");a.href=new URL("api/round/"+r.id+"/raw/"+item.record_sha256,SeismoLocale.root);right.append(a);
    }
    if(externalHttps(item.source_url)){
      const a=node("a",""," αρχείο παρόχου");a.href=externalHttps(item.source_url);a.rel="noreferrer";right.append(a);
    }
    line.append(left,right);return line;
  });
  $("attempts").replaceChildren(...log);
}
function stages(index){
  [...$("steps").children].forEach((li,n)=>{li.className=n<index?"done":n===index?"active":"";});
}
function pulse(end){
  if($("fxOff").checked)return;
  if($("haptic").checked && navigator.vibrate){
    try{navigator.vibrate(end?[18,30,15]:12);}catch(error){}
  }
  if($("sound").checked && audio?.state==="running"){
    const tone=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;
    tone.frequency.value=end?245:155;
    gain.gain.setValueAtTime(.05,t);gain.gain.exponentialRampToValueAtTime(.001,t+.13);
    tone.connect(gain);gain.connect(audio.destination);tone.start();tone.stop(t+.14);
  }
}
function tickWheel(origin,seconds){
  const tick=now=>{
    if(!ongoing)return;
    const progress=Math.max(0,Math.min(1,(now-origin)/(seconds*1000)));
    const eased=1-(1-progress)**2;
    $("timer").textContent=Math.ceil((1-progress)*seconds);
    if(!reduced){
      angle=eased*14*Math.PI;ball=-Math.PI/2-eased*20*Math.PI;
      const amount=!$("fxOff").checked&&$("visual").checked?(.18+intensity*.7)*(1-progress):0;
      wheel.style.transform="translate("+Math.sin(now/24)*amount+"px,"+Math.cos(now/29)*amount+"px)";
      wheelDraw();
    }
    if(progress<1)frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
}
function links(r){
  const info=$("roundlink"),actions=$("roundActions");actions.replaceChildren();
  const address=r.mode==="server"?node("a","","Επαλήθευση "+r.id.slice(0,10)):node("span","","Τοπικός γύρος "+r.id.slice(0,10));
  if(r.mode==="server")address.href=new URL("v/"+r.id,SeismoLocale.root);
  info.replaceChildren(address,document.createTextNode(" · "+r.start_utc+" · "+r.duration+" s"));
  if(r.state!=="RESULT"&&r.state!=="NO RESULT")return;
  if(r.mode==="server"){
    for(const [label,path] of [["Αναλυτικό TXT","report.txt"],["Αρχείο επαλήθευσης","bundle.json"],["stations.txt γύρου","stations.txt"]]){
      const a=node("a","",label);a.href=new URL("api/round/"+r.id+"/"+path,SeismoLocale.root);actions.append(a);
    }
  }else{
    const report=node("button","plain","Αναλυτικό TXT");
    const json=node("button","plain","Αρχείο επαλήθευσης");
    report.onclick=()=>{
      const label=SeismoLocale.language==="en"?"SEISMO — Round report":"SEISMO — Αναφορά γύρου";
      const localized={...r,reason:r.reason&&SeismoLocale.translate(r.reason,SeismoLocale.language),
        routes:r.routes.map(route=>({...route,status:{...route.status,
          state:SeismoLocale.translate(route.status.state,SeismoLocale.language)}}))};
      download(label+"\n"+JSON.stringify(localized,null,2),"seismo-"+r.id+".txt","text/plain");
    };
    json.onclick=()=>download(JSON.stringify(localBundle),"seismo-"+r.id+".json","application/json");
    actions.append(report,json);
    for(const row of r.routes||[]){
      if(!row.record_sha256||!localBundle.records[row.record_sha256])continue;
      const button=node("button","plain","miniSEED "+row.key.split("~").at(-1));
      button.onclick=()=>download(SeismoProof.fromBase64(localBundle.records[row.record_sha256]),row.key+".mseed","application/vnd.fdsn.mseed");
      actions.append(button);
    }
  }
}
function finish(r,saveHistory=true){
  round=r;ongoing=false;cancelAnimationFrame(frame);wheel.style.transform="";pulse(true);
  $("timer").textContent="0";$("spin").disabled=false;
  $("duration").disabled=false;$("spinLength").disabled=false;
  $("stage").textContent=r.state==="RESULT"?"Αποτέλεσμα":"NO RESULT";
  $("output").className="output "+(r.state==="RESULT"?"win":"void");
  if(r.state==="RESULT"){
    angle=-order.indexOf(r.number)*slices;ball=-Math.PI/2;wheelDraw(r.number);
    $("output").textContent="Αριθμός "+r.number;
    $("digest").textContent="SHA-256 εισόδου "+r.input_sha256;
    stages(4);
  }else{
    $("output").textContent="NO RESULT";
    $("digest").textContent=r.reason||"Τα δεδομένα του δεσμευμένου παραθύρου ήταν ανεπαρκή.";
    stages(3);wheelDraw();
  }
  if(saveHistory)settle(r);
  links(r);sources(r);$("connections").open=true;
}
function progress(routes){
  round.routes=routes;
  const signal=routes.find(row=>row.wave?.filter(Number.isFinite).length>=3)?.wave;
  if(signal){
    const values=signal.filter(Number.isFinite);
    const avg=values.reduce((sum,x)=>sum+x,0)/values.length;
    const rms=Math.sqrt(values.reduce((sum,x)=>sum+(x-avg)**2,0)/values.length);
    intensity=Math.min(1,Math.log10(1+rms)/4);
  }
  $("stage").textContent=routes.some(row=>row.complete)?"Αξιολόγηση κάλυψης":"Λήψη και εφεδρείες";
  sources();
}
async function spin(){
  if(ongoing||!config)return;
  const stake=Number($("chip").value),pick=Number($("pick").value);
  if(stake>local.balance){$("output").textContent="Δεν επαρκούν οι εικονικές μάρκες.";return;}
  if(!$("fxOff").checked&&$("sound").checked){
    try{audio??=new AudioContext();audio.resume().catch(()=>{});}catch(error){}
  }
  pulse(false);
  const duration=Number($("duration").value),spinSeconds=Number($("spinLength").value);
  anchor=performance.now();
  const now=Date.now(),start=(Math.floor(now/10)+1)*10,reveal=now+spinSeconds*1000;
  const r={id:crypto.randomUUID().replaceAll("-",""),mode:"browser",algorithm:"SEISMO-P4",duration,
     spin_seconds:spinSeconds,accepted_ms:now,start_ms:start,start_utc:new Date(start).toISOString(),
     end_utc:new Date(start+duration*1000).toISOString(),reveal_ms:reveal,freeze_ms:reveal-2000,
     catalog_version:config.version,catalog_sha256:config.sha256};
  round=r;intensity=0;ongoing=true;$("spin").disabled=true;
  $("duration").disabled=true;$("spinLength").disabled=true;
  $("timer").textContent=spinSeconds;$("output").className="output";
  $("output").textContent="Περιστροφή σε εξέλιξη";$("digest").textContent="";
  stages(0);links(r);sources(r);$("connections").open=true;
  local.pending={id:r.id,value:stake,pick,mode:r.mode,when:r.reveal_ms,start_utc:r.start_utc};
  local.balance-=stake;save();wallet();
  tickWheel(anchor,spinSeconds);
  try{
    localBundle=await SeismoLive.evaluate(r,config.stations,progress,anchor);
  }catch(e){
    localBundle={round:{...r,state:"NO RESULT",used:[],routes:[],reason:e.message},records:{}};
  }
  localBundle.stations_txt=stationText;
  await sleep(spinSeconds*1000-(performance.now()-anchor));
  finish(localBundle.round);
}
async function verifyFile(bundle,attachments=new Map()){
  const element=$("proofResult");$("extraProof").replaceChildren();
  const check=await SeismoProof.verify(bundle,attachments);
  if(check.state==="ΕΛΛΙΠΗΣ"){
    element.textContent="Λείπουν πρωτογενή miniSEED για "+check.missing.length+" διαδρομές.";
    for(const st of check.missing){
      const p=node("div","links"),input=node("input");
      const row=bundle.round.routes.find(r=>r.key===st.key);
      input.type="file";
      input.setAttribute("aria-label","miniSEED "+st.id);
      input.onchange=async()=>{
        try{attachments.set(st.key,new Uint8Array(await input.files[0].arrayBuffer()));await verifyFile(bundle,attachments);}
        catch(e){element.textContent=e.message;}
      };
      p.append(node("span","",st.id),input);
      if(externalHttps(row.source_url)){const a=node("a","","Λήψη από πάροχο");a.href=externalHttps(row.source_url);a.rel="noreferrer";p.append(a);}
      $("extraProof").append(p);
    }
  }else{
    element.textContent=check.state==="RESULT"?"Επαληθεύτηκε ο αριθμός "+check.number+" · SHA-256 "+check.input_sha256:
      check.unknown?"NO RESULT · Καταγεγραμμένη λήξη χωρίς απόδειξη κάλυψης.":"NO RESULT · Οι δημοσιευμένες λήψεις δεν επαρκούν.";
  }
}
async function cors(){
  const out=$("transport");$("cors").disabled=true;
  try{
    const archive=await loadArchive();
    const r=archive.round;
    const line=r.routes[0];
    const st=SeismoProof.parseCatalog(archive.stations_txt).rows.find(x=>x.key===line.key);
    const [network,station,loc,channel]=st.id.split(".");
    const q=new URLSearchParams({network,station,location:loc||"--",channel,starttime:r.start_utc,endtime:r.end_utc});
    const t=performance.now(),res=await fetch(st.url+"?"+q,{mode:"cors",signal:AbortSignal.timeout(8000),credentials:"omit",referrerPolicy:"no-referrer"});
    if(res.status!==200)throw Error("HTTP "+res.status);
    const bytes=new Uint8Array(await res.arrayBuffer());
    const clip=SeismoMseed.windowSamples(bytes,st,r.start_ms,r.duration);
    out.textContent=st.id+" · CORS και miniSEED OK · "+clip.count+" δείγματα · "+Math.round(performance.now()-t)+" ms";
  }catch(e){out.textContent="Η απευθείας λήψη δεν ολοκληρώθηκε · "+e.message;}
  setTimeout(()=>$("cors").disabled=false,12000);
}
function wss(provider,button){
  button.disabled=true;
  const out=$("wssStatus");
  out.textContent="Σύνδεση "+provider+"…";
  let socket;
  const endpoint=provider==="EarthScope"?"wss://rtserve.earthscope.org/seedlink":"wss://orfeus-eu.org/websocket/";
  const timer=setTimeout(()=>{
    if(socket&&socket.readyState<2){
      out.textContent=provider+" WSS · λήξη χωρίς απάντηση";
      socket.close();
    }
    button.disabled=false;
  },9500);
  try{
    socket=new WebSocket(endpoint);
    socket.onopen=()=>{if(provider==="EarthScope")socket.send("HELLO");};
    socket.onmessage=event=>{
      const message=String(event.data);
      out.textContent=provider+" WSS · "+(provider==="EarthScope"?message.slice(0,150):"απάντησε ο κατάλογος ροών");
      socket.close();
    };
    socket.onerror=()=>{out.textContent=provider+" WSS · αποτυχία σύνδεσης";};
    socket.onclose=()=>{clearTimeout(timer);setTimeout(()=>button.disabled=false,3500);};
  }catch(e){out.textContent=e.message;clearTimeout(timer);button.disabled=false;}
}

async function useCatalog(text){
  if(!text.startsWith("# SEISMO stations v"))throw Error("Μη έγκυρο αρχείο stations.txt.");
  const parsed=SeismoProof.parseCatalog(text);
  const stations=parsed.rows.filter(s=>s.enabled&&s.browser);
  const keys=new Set();
  for(const s of stations){
    const url=new URL(s.url);
    const valid=s.protocol==="FDSN"?url.protocol==="https:":s.protocol==="WSS"&&url.protocol==="wss:";
    if(!valid||url.username||url.password||url.hash||url.search||keys.has(s.key)||
       !/^[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]*\.[A-Z0-9]{3}$/.test(s.id)||
       !Number.isInteger(s.hz)||s.hz<1||s.hz>1000||!Number.isFinite(s.lat)||!Number.isFinite(s.lon)||
       !Number.isInteger(s.priority)||!Number.isInteger(s.timeout_ms)||s.timeout_ms<350||s.timeout_ms>30000)
      throw Error("Μη έγκυρη ενεργή διαδρομή: "+s.key);
    keys.add(s.key);
  }
  if(!stations.length)throw Error("Δεν υπάρχουν ενεργές διαδρομές browser.");
  stations.sort((a,b)=>a.priority-b.priority||(a.key<b.key?-1:1));
  config={version:parsed.version,sha256:SeismoProof.hex(await SeismoProof.sha(SeismoProof.utf8(text))),stations};
  stationText=text;sources();$("spin").disabled=false;
  $("output").textContent="Έτοιμη · "+stations.length+" διαδρομές browser";
  $("mode").textContent="Απευθείας από τη συσκευή";
}
async function init(){
  wheelDraw();$("spin").disabled=true;
  $("alias").value=local.alias||"";wallet();
  for(let i=0;i<=36;i++)$("pick").append(node("option","",String(i)));
  $("alias").onchange=()=>{local.alias=$("alias").value.trim();save();};
  $("clearSession").onclick=()=>{
    if(ongoing)return;
    local={alias:"",balance:100,history:[]};$("alias").value="";save();wallet();
  };
  for(const id of ["fxOff","visual","haptic","sound"]){
    if(typeof local.effects?.[id]==="boolean")$(id).checked=local.effects[id];
    $(id).onchange=()=>{local.effects={...local.effects,[id]:$(id).checked};save();};
  }
  $("archiveButton").onclick=async()=>{
    try{
      $("archiveResult").textContent="Φόρτωση αρχειακού δείγματος";
      const b=await loadArchive();
      const check=await SeismoProof.verify(b);
      $("archiveResult").textContent="Αριθμός αρχείου "+check.number+" · SHA-256 "+check.input_sha256;
      const r=b.round;
      const cfg=SeismoProof.parseCatalog(b.stations_txt);
      $("archiveCharts").replaceChildren(...r.routes.map(item=>{
        const st=cfg.rows.find(x=>x.key===item.key);
        const raw=SeismoProof.fromBase64(b.records[item.record_sha256]);
        const values=SeismoMseed.windowSamples(raw,st,r.start_ms,r.duration).values;
        return stationCard(st,{wave:Array.from(values),status:{state:"Αρχείο "+r.start_utc}});
      }));
    }catch(e){$("archiveResult").textContent=e.message;}
  };
  $("archiveDownload").onclick=async()=>{
    try{download(JSON.stringify(await loadArchive()),"seismo-archive.json","application/json");}
    catch(error){$("archiveResult").textContent=error.message;}
  };
  $("proofFile").onchange=async()=>{
    try{
      const file=$("proofFile").files[0];
      if(file.size>60*1024*1024)throw Error("Το αρχείο ξεπερνά τα 60 MB.");
      await verifyFile(JSON.parse(await file.text()));
    }catch(e){$("proofResult").textContent=e.message;}
  };
  $("cors").onclick=cors;
  $("wss").onclick=()=>wss("EarthScope",$("wss"));
  $("wssOrfeus").onclick=()=>wss("ORFEUS",$("wssOrfeus"));
  $("spin").onclick=spin;
  $("spinLength").onchange=()=>{
    const value=$("spinLength").value;
    $("spinLabel").textContent=value+" s";
    if(!ongoing)$("timer").textContent=value;
  };
  if(artifact.algorithm)$("algorithm").onclick=e=>{e.preventDefault();download(artifact.algorithm,"ALGORITHM.md","text/plain");};
  if(local.pending?.mode==="browser"){
    settle({...local.pending,mode:"browser",state:"NO RESULT",number:null});
  }
  $("catalogFile").onchange=async()=>{
    if(ongoing)return;
    try{
      const file=$("catalogFile").files[0];
      if(file&&file.size<3000000)await useCatalog(new TextDecoder("utf-8",{ignoreBOM:true}).decode(await file.arrayBuffer()));
    }catch(e){$("output").textContent=e.message;}
  };
  if(!globalThis.crypto?.subtle){$("output").textContent="Το κουμπί SPIN χρειάζεται ασφαλή σύνδεση HTTPS ή localhost.";return;}
  if(location.protocol==="file:"){
    $("catalogPicker").hidden=false;
    $("output").textContent="Επίλεξε stations.txt για ζωντανό SPIN.";
    $("mode").textContent="Αυτόνομο αρχείο";
    return;
  }
  try{
    const response=await fetch(new URL("stations.txt",SeismoLocale.root),{cache:"no-cache",mode:"same-origin",signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error("stations.txt · HTTP "+response.status);
    await useCatalog(new TextDecoder("utf-8",{ignoreBOM:true}).decode(await response.arrayBuffer()));
  }catch(e){$("mode").textContent="Επαλήθευση αρχείων";$("output").textContent=e.message;}
}
init();
