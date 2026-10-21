/** Avito -> MacBook Pro Watch. Strict matching; no dependencies. */
export const TRACKING_START='2026-10-21T13:00:00.000Z';
export const TRACKING_END='2026-11-01T19:59:59.999Z';
const clean=v=>String(v??'').normalize('NFKC').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).toLowerCase().replace(/ё/g,'е');
export function flattenParams(v){
 if(v==null)return '';
 if(typeof v==='string'||typeof v==='number')return String(v);
 if(Array.isArray(v))return v.map(flattenParams).join(' ');
 if(typeof v==='object')return Object.entries(v).map(([k,x])=>k+' '+flattenParams(x)).join(' ');
 return '';
}
export function extractSpecs(ad){
 const title=clean(ad.title), text=norm([title,ad.description,flattenParams(ad.params)].join(' '));
 const family=/(?:mac\s*book|мак\s*бук)\s*pro\b|macbookpro|макбук\s*про/i.test(text);
 const max=/\bm\s*5\s*max\b|м\s*5\s*макс/i.test(text);
 const chip=max?null:/\bm\s*5\s*pro\b|м\s*5\s*про/i.test(text)?'M5 Pro':/\bm\s*5\b|м\s*5\b/i.test(text)?'M5':null;
 const ramPatterns=[
  /(?:ram|озу|оперативн\w*\s*памят\w*|памят[ьи])\s*[:=\-]?\s*(\d{2,3})\s*(?:gb|гб)/gi,
  /\b(\d{2,3})\s*(?:gb|гб)\s*(?:ram|озу|оперативн\w*)/gi,
  /\b(\d{2,3})\s*(?:gb|гб)\s*[/+\-]\s*(?:\d{3,4}\s*(?:gb|гб)?|[1-9]\s*(?:tb|тб))/gi,
  /\b(\d{2,3})\s*[/+]\s*(?:1024|2048|4096|1\s*(?:tb|тб)|2\s*(?:tb|тб))/gi
 ];
 const rams=ramPatterns.flatMap(re=>[...text.matchAll(re)].map(m=>Number(m[1]))).filter(n=>n>=8&&n<=192);
 const ssd=[];
 const push=(num,unit)=>{const n=Number(num.replace(',','.'))*(unit==='tb'||unit==='тб'?1024:1);if(n>=256&&n<=8192)ssd.push(Math.round(n))};
 for(const m of text.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(tb|тб|gb|гб)\s*(?:ssd|ссд|накопител\w*|диск\w*)?/gi))push(m[1],m[2]);
 for(const m of text.matchAll(/(?:ssd|ссд|накопител\w*|диск\w*)\s*[:=\-]?\s*(\d+(?:[.,]\d+)?)\s*(tb|тб|gb|гб)/gi))push(m[1],m[2]);
 for(const m of text.matchAll(/\b(?:\d{2,3})\s*(?:gb|гб)?\s*[/+\-]\s*(1024|2048|4096|1\s*(?:tb|тб)|2\s*(?:tb|тб))/gi)){
  const n=m[1].replace(/\s/g,'');ssd.push(/tb|тб/i.test(n)?Number(n[0])*1024:Number(n));
 }
 return {family,chip,ramGb:rams.length?Math.max(...rams):null,ssdGb:ssd.length?Math.max(...ssd):null,title};
}
export function normalizeListing(ad,at=new Date().toISOString()){
 if(!ad||typeof ad!=='object')return null;
 const x=extractSpecs(ad);
 if(!x.family||!['M5','M5 Pro'].includes(x.chip)||x.ramGb<24||x.ssdGb<1024||ad.isNew===true)return null;
 if(/company|business|shop|dealer|компан|магазин/i.test(norm(ad.sellerType||ad.sellerTypeText)))return null;
 const city=clean(ad.addressLocality||ad.location||'');
 if(!/самар[аыуеой]|\bsamara\b/i.test(city)||/сызран|тольятти|новокуйбышевск|чапаевск/i.test(city))return null;
 let url;try{url=new URL(String(ad.url||''))}catch{return null}
 if(!['avito.ru','www.avito.ru'].includes(url.hostname)||!['https:','http:'].includes(url.protocol))return null;
 url.protocol='https:';url.search='';url.hash='';
 const provided=clean(ad.listingId||ad.id||'');
 const id=/^\d{6,16}$/.test(provided)?provided:url.pathname.match(/_(\d{7,13})(?:\/)?$/)?.[1];
 if(!id)return null;
 const price=typeof ad.price==='number'?ad.price:Number(String(ad.price||'').replace(/[^\d]/g,''));
 if(!Number.isFinite(price)||price<1000||price>2000000)return null;
 const description=clean(ad.description);
 const battery=[...description.matchAll(/(?:аккумулятор|батарея|battery|состояние\s*акб)\D{0,18}(\d{2,3})\s*%/gi)].map(m=>Number(m[1]));
 const cycles=[...description.matchAll(/(?:циклов|цикла|cycles?)\D{0,8}(\d{1,4})|(\d{1,4})\s*(?:циклов|цикла|cycles?)/gi)].map(m=>Number(m[1]||m[2]));
 const notes=[...(battery.length?['АКБ '+battery[0]+'% (по объявлению)']:[]),...(cycles.length?['Циклов '+cycles[0]+' (по объявлению)']:[]),...(description?[description.slice(0,210)]:[])];
 return {id:'A'+id,type:'used',source:'Avito',title:x.title,chip:x.chip,ramGb:x.ramGb,ssdGb:x.ssdGb,priceRub:Math.round(price),cardPriceRub:null,paymentLabel:'Цена в объявлении',condition:'Б/у',store:clean(ad.sellerName)||'Частный продавец Avito',location:city,url:url.toString(),status:'active',firstSeenAt:at,lastSeenAt:at,verifiedAt:at,publishedAt:ad.publishedAt||null,notes:notes.join(' · ').slice(0,480),...(battery.length?{batteryHealthPercent:battery[0]}:{}),...(cycles.length?{batteryCycles:cycles[0]}:{})};
}
export function mergeAvito(base,ads,meta={}){
 const at=meta.at||new Date().toISOString();
 if(!base||!Array.isArray(base.listings)||!Array.isArray(base.events))throw Error('Invalid gh-pages data.json');
 const d=structuredClone(base);
 d.avitoChecks||=[];d.sources||={};
 // Never overwrite or delete retail offerings recorded by the other collector.
 const incoming=new Map(ads.map(x=>[x.id,x]));
 let added=0,changed=0;
 for(const item of incoming.values()){
  const old=d.listings.find(x=>x.id===item.id);
  if(old){
   if(old.priceRub!==item.priceRub){d.events.push({at,kind:item.priceRub<old.priceRub?'price-drop':'price-rise',id:item.id,oldPriceRub:old.priceRub,newPriceRub:item.priceRub,text:'Avito: '+item.title+', '+old.priceRub+' → '+item.priceRub+' ₽'});changed++}
   Object.assign(old,item,{firstSeenAt:old.firstSeenAt||at});
  }else{d.listings.push(item);d.events.push({at,kind:'new',id:item.id,text:'Avito: новое объявление '+item.title+' — '+item.priceRub+' ₽'});added++}
 }
 // An ad absent from a capped search is NOT proven sold.
 const cutoff=Date.parse(at)-48*3600000;
 for(const x of d.listings)if(x.type==='used'&&!incoming.has(x.id)&&Date.parse(x.lastSeenAt||x.verifiedAt||0)<cutoff&&x.status==='active')x.status='stale';
 const p1=[...incoming.values()].filter(x=>x.chip==='M5').map(x=>x.priceRub);
 const p2=[...incoming.values()].filter(x=>x.chip==='M5 Pro').map(x=>x.priceRub);
 d.avitoChecks.push({at,minProM5:p1.length?Math.min(...p1):null,minProM5Pro:p2.length?Math.min(...p2):null,count:incoming.size,scanned:meta.scanned??0,status:meta.errors?.length?'partial':'ok'});
 d.sources.Avito={status:meta.errors?.length?'partial':'ok',message:'Apify: найдено '+incoming.size+', просмотрено '+(meta.scanned??0)+'; новых '+added+', изменений цен '+changed+(meta.errors?.length?', ошибки: '+meta.errors.length:''),checkedAt:at};
 d.avitoLastCheckAt=at;d.avitoCheckCount=(d.avitoCheckCount||0)+1;
 if(!meta.errors?.length||meta.errors.length<2)d.avitoLastSuccessAt=at;
 return {data:d,stats:{added,changed,matched:incoming.size}};
}