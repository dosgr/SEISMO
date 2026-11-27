"use strict";
const SeismoLocale=(()=>{
  const {phrases,pages}=window.SEISMO_LOCALE;
  const dynamicSelector="#outcome,#mode,#output,#digest,#stage,#roundlink,#roundActions,#historyRows,#attempts,#telemetryNote,#stationList,#archiveCharts,#archiveResult,#proofResult,#extraProof,#transport,#wssStatus";
  const memorized=new WeakMap();
  const root=new URL(document.body.dataset.root,location.href);
  const standalone=document.body.dataset.standalone==="true";
  let lang=document.documentElement.lang;
  const pairs=Object.entries(phrases).sort((a,b)=>b[0].length-a[0].length);
  const escaped=str=>str.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const pattern=new RegExp(pairs.map(([el])=>escaped(el)).join("|"),"g");
  const translate=(value,target="en")=>target==="en"?value.replace(pattern,match=>phrases[match]):value;

  function renderText(node){
    const raw=node.data;
    const previous=memorized.get(node);
    const initial=node.parentElement?.dataset.initialEl;
    const original=previous?.display===raw?previous.original:initial&&phrases[initial]===raw?initial:raw;
    const display=translate(original,lang);
    memorized.set(node,{original,display});
    if(display!==raw)node.data=display;
  }
  function renderDynamic(area){
    if(area.nodeType===Node.TEXT_NODE){renderText(area);return;}
    if(area.nodeType!==Node.ELEMENT_NODE)return;
    const walker=document.createTreeWalker(area,NodeFilter.SHOW_TEXT);
    while(walker.nextNode())renderText(walker.currentNode);
    for(const target of area.querySelectorAll("[aria-label],img[alt]")){
      for(const name of ["aria-label","alt"]){
        if(!target.hasAttribute(name))continue;
        const key="original"+(name==="alt"?"Alt":"Aria");
        target.dataset[key]??=target.getAttribute(name);
        target.setAttribute(name,translate(target.dataset[key],lang));
      }
    }
  }
  function apply(next,changeUrl){
    lang=next;
    document.documentElement.lang=lang;
    for(const element of document.querySelectorAll("[data-el][data-en]"))
      element.textContent=element.dataset[lang];
    for(const element of document.querySelectorAll("[data-label-el],[data-placeholder-el]")){
      if(element.dataset.labelEl)element.setAttribute("aria-label",element.dataset[lang==="en"?"labelEn":"labelEl"]);
      if(element.dataset.placeholderEl)element.placeholder=element.dataset[lang==="en"?"placeholderEn":"placeholderEl"];
    }
    for(const attribute of ["alt","title"]){
      for(const element of document.querySelectorAll(`#support-area [data-${attribute}-el]`))
        element.setAttribute(attribute,element.getAttribute(`data-${attribute}-${lang}`));
    }
    for(const element of document.querySelectorAll(dynamicSelector))renderDynamic(element);
    const page=pages[lang];
    document.title=page.title;
    for(const element of document.querySelectorAll("[data-meta]"))element.content=page[element.dataset.meta];
    const canonical=document.querySelector('[rel="canonical"]');
    if(canonical)canonical.href=page.canonical;
    const manifest=document.querySelector('link[rel="manifest"]');
    if(manifest)manifest.href=new URL(lang==="en"?"manifest-en.json":"manifest.json",root);
    const schema=document.getElementById("schema");
    if(schema)schema.textContent=JSON.stringify(page.schema);
    for(const link of document.querySelectorAll("[data-lang]")){
      if(link.dataset.lang===lang)link.setAttribute("aria-current","page");
      else link.removeAttribute("aria-current");
      if(!standalone)link.href=new URL(link.dataset.lang==="en"?"en/":"./",root);
    }
    if(changeUrl){
      try{localStorage.setItem("seismo-language",lang);}catch(error){}
      if(!standalone){
        const dest=new URL(lang==="en"?"en/":"./",root);
        dest.hash=location.hash;dest.search=location.search;
        if(dest.href!==location.href)history.pushState({}, "",dest);
      }
    }
  }
  function init(){
    if(!standalone){
      // Resolve local links against the entry page before changing its history URL.
      const entry=new URL(location.href);
      for(const element of document.querySelectorAll("[href],[src]")){
        for(const attr of ["href","src"]){
          const value=element.getAttribute(attr);
          if(value?.startsWith("./")||value?.startsWith("../"))
            element.setAttribute(attr,new URL(value,entry));
        }
      }
    }
    if(standalone){
      try{if(localStorage.getItem("seismo-language")==="en")lang="en";}catch(error){}
    }
    apply(lang,false);
    document.querySelectorAll("[data-lang]").forEach(link=>link.addEventListener("click",event=>{
      if(event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      if(!standalone&&new URL(link.href).origin!==location.origin)return;
      event.preventDefault();
      apply(link.dataset.lang,true);
    }));
    addEventListener("popstate",()=>{
      if(!standalone)apply(location.pathname.startsWith(new URL("en/",root).pathname)?"en":"el",false);
    });
    const observer=new MutationObserver(changes=>{
      const areas=new Set();
      for(const change of changes){
        const element=change.target.nodeType===Node.TEXT_NODE?change.target.parentElement:change.target;
        const area=element?.closest(dynamicSelector);
        if(area)areas.add(area);
      }
      areas.forEach(renderDynamic);
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  init();
  return {root,translate,get language(){return lang;}};
})();
