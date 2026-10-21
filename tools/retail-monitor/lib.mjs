// Retail MacBook Pro 24+ GB / 1+ TB price extraction.
// Deliberately conservative: never treat a listing-page price as a product price.
export const PRODUCTS=[
 {id:'S007',store:'Hi Store',url:'https://hi-stores.ru/catalog/macbook/macbook_pro/macbook-pro-14-2025/apple-macbook-pro-14-m5-2025-24gb-1tb-ssd-silver-mde64/',chip:'M5',code:'MDE64'},
 {id:'S005',store:'Hi Store',url:'https://hi-stores.ru/catalog/macbook/macbook_pro/macbook-pro-14-2026/apple-macbook-pro-14-m5-pro-15c-cpu-16c-gpu-2026-24-1tb-ssd-silver/',chip:'M5 Pro',code:'MGDN4'},
 {id:'S008',store:'Hi Store',url:'https://hi-stores.ru/catalog/macbook/macbook_pro/macbook-pro-14-2026/apple-macbook-pro-14-m5-pro-15c-cpu-16c-gpu-2026-24-1tb-ssd-space-black/',chip:'M5 Pro',code:'MGDR4'},
 {id:'S006',store:'ре:зон',url:'https://rezon.store/catalog/mac/macbook-pro-14-m5-pro/apple-macbook-pro-14-inch-m5-pro-24-1tb-silver/',chip:'M5 Pro',code:null}
];
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
function decode(s){return s.replace(/&nbsp;|&#160;|&#xA0;/gi,' ').replace(/&quot;/gi,'"').replace(/&amp;/gi,'&').replace(/&#8381;|&#x20bd;/gi,'₽');}
function textify(html){return clean(decode(html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ').replace(/<!--[\s\S]*?-->/g,' ').replace(/<[^>]*>/g,' ').replace(/\u00a0/g,' ')));}
const priceOf=s=>Number(String(s).replace(/[^\d]/g,''));
export function parseProduct(html,product){
 if(typeof html!=='string'||html.length<1000)throw Error('HTML empty or blocked');
 if(/(?:captcha|access denied|доступ ограничен|подтвердите, что вы не робот)/i.test(html.slice(0,3000)))throw Error('Anti-bot challenge');
 const h1=/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
 if(!h1)throw Error('No product H1');
 const title=textify(h1[1]);
 const chipOk=product.chip==='M5 Pro'?/\bM5\s*Pro\b/i.test(title):/\bM5\b/i.test(title)&&!/\bM5\s*(?:Pro|Max)\b/i.test(title);
 if(!/macbook\s*pro/i.test(title)||/\bair\b/i.test(title)||!chipOk||!/(?:24\s*[/\\]\s*1\s*(?:TB|ТБ)|24\s*(?:GB|ГБ).{0,25}1\s*(?:TB|ТБ))/i.test(title))throw Error('Wrong product configuration in H1: '+title.slice(0,120));
 if(product.code&&!title.toUpperCase().includes(product.code))throw Error('Product SKU mismatch');
 if(product.url.includes('hi-stores.ru')&&!/(?:Ваш город|Цены и наличие указаны для).{0,150}Самар|в Самаре/i.test(textify(html).slice(0,4000)))throw Error('Samara storefront not confirmed');
 const remainder=textify(html.slice(h1.index+h1[0].length,h1.index+h1[0].length+85000));
 const section=remainder.slice(0,6000);
 // Hi Store explicitly labels the discounted selling price; ignore old price / cashback.
 const labeled=/Цена со скидкой\s*:?\s*(\d[\d ]{4,11})\s*₽/i.exec(section);
 let price=labeled?priceOf(labeled[1]):null;
 if(!price){
  // For re:zon the first price between product H1 and "В корзину" is the current price.
  const top=section.split(/В корзину|Добавить к сравнению/i)[0].slice(0,1700);
  const matches=[...top.matchAll(/(\d{2,3}(?:\s*\d{3}){1,2})\s*₽/g)].map(m=>priceOf(m[1]));
  price=matches.find(p=>p>=100000&&p<=700000)||null;
 }
 if(!Number.isInteger(price)||price<100000||price>700000)throw Error('No reliable selling price near product header');
 return {price,title,source:'live-product-html'};
}
export function mergeRetail(data,results,{at=new Date().toISOString()}={}){
 if(!Array.isArray(data?.listings)||!Array.isArray(data?.checks))throw Error('Invalid existing data');
 const next=structuredClone(data),observed=[],errors=[];
 next.sources??={};next.events??=[];
 for(const row of results){
  const item=next.listings.find(x=>x.id===row.id&&x.type==='retail');
  if(!item){errors.push('Unknown retail listing id '+row.id);continue}
  if(!row.ok){
   next.sources[item.store]={status:'limited',checkedAt:at,message:'Не удалось проверить карточку товара: '+String(row.error||'unknown').slice(0,100)};
   errors.push(item.id);
   continue;
  }
  const product=PRODUCTS.find(x=>x.id===row.id);
  if(!product||item.chip!==product.chip||!/MacBook Pro/i.test(item.title)||item.ramGb<24||item.ssdGb<1024){errors.push('Spec conflict '+row.id);continue}
  const old=item.priceRub;
  if(Math.abs(row.price-old)/old>.5){errors.push('Unreasonable price jump '+row.id);continue}
  if(item.status==='active'&&old!==row.price){
   next.events.push({at,kind:row.price<old?'price-drop':'price-rise',id:item.id,oldPriceRub:old,newPriceRub:row.price,text:item.store+': '+item.title+' '+old+' → '+row.price+' ₽'});
  }
  item.priceRub=row.price;item.verifiedAt=at;item.lastSeenAt=at;item.status='active';item.url=product.url;item.notes='Цена считана напрямую с карточки товара; наличие для самовывоза уточнить у продавца.';
  next.sources[item.store]={status:'ok',checkedAt:at,message:'Последняя проверка карточки: '+new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Samara',hour:'2-digit',minute:'2-digit'}).format(new Date(at))+'; цена опубликована на сайте'};
  observed.push(item);
 }
 const m5=observed.filter(x=>x.chip==='M5').map(x=>x.priceRub),pro=observed.filter(x=>x.chip==='M5 Pro').map(x=>x.priceRub);
 next.checks.push({at,minProM5:m5.length?Math.min(...m5):null,minProM5Pro:pro.length?Math.min(...pro):null,count:observed.length,status:observed.length?(errors.length?'partial':'ok'):'unavailable',note:'Автоматический HTTP-обход карточек продавцов; '+observed.length+' цен подтверждено, '+errors.length+' ошибок.'});
 next.lastCheckAt=at;next.checkCount=(next.checkCount||0)+1;
 if(observed.length)next.lastSuccessAt=at;
 next.retailAutomated={lastAttemptAt:at,lastSuccessAt:observed.length?at:(next.retailAutomated?.lastSuccessAt||null),ok:observed.length,failed:errors.length};
 return {next,summary:{verified:observed.length,failed:errors.length}};
}
