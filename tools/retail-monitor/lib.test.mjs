import test from 'node:test';
import assert from 'node:assert/strict';
import {PRODUCTS,parseProduct,mergeRetail} from './lib.mjs';
const hi=PRODUCTS[0],rezon=PRODUCTS[2];
const wrap=(h1,content,store='Самара')=>'<html lang="ru"><head><title>Sample</title></head><body>Ваш город '+store+'<h1>'+h1+'</h1>'+content+' '+('<p>характеристики ноутбука</p>'.repeat(60))+'</body></html>';
test('Hi Store: selects the discounted price rather than old price or cashback',()=>{
 const html=wrap('Apple MacBook Pro 14.2" (M5 Pro, 2026) 24/1Tb SSD (MGDN4) Silver','В наличии Старая цена 282 090₽ Скидка 65 100₽ Цена со скидкой 216 990₽ Варианты цен');
 assert.equal(parseProduct(html,hi).price,216990);
});
test('re:zon: takes first displayed selling price before crossed old price',()=>{
 const html=wrap('Apple MacBook Pro 14″ M5 Pro · 24/1 ТБ · Серебристый','Гарантия 12 месяцев 231 490 ₽ 277 990 ₽ Выгода 46 500 ₽ В корзину');
 assert.equal(parseProduct(html,rezon).price,231490);
});
test('reject wrong model/specs, bot pages, misleading catalog',()=>{
 for(const name of ['Apple MacBook Air M5 Pro 24/1 ТБ','MacBook Pro M5 Pro 16/1 ТБ','MacBook Pro M5 Max 24/1 ТБ','MacBook Pro M5 Pro 24/512GB','MacBook Pro M5 Pro 24/1 ТБ']) {
  const product= name.includes('512')||name.includes('16/')||name.includes('Air')||name.includes('Max')?rezon:hi;
  assert.throws(()=>parseProduct(wrap(name,'Цена со скидкой 210 000₽'),product));
 }
});
test('merge saves real hourly measurements and price changes, preserves Avito data',()=>{
 const base={listings:[{id:'S005',type:'retail',chip:'M5 Pro',title:'MacBook Pro 14″ M5 Pro',ramGb:24,ssdGb:1024,priceRub:225590,status:'preliminary',store:'Hi Store'}, {id:'A12345',type:'used',title:'MacBook Pro M5 Pro'}],checks:[],avitoChecks:[{at:'start',count:1}],events:[],sources:{Avito:{status:'ok'}}};
 const first=mergeRetail(base,[{id:'S005',price:216990,ok:true}],{at:'2026-10-21T14:20:00Z'}).next;
 assert.equal(first.checks.length,1);assert.equal(first.checks[0].minProM5Pro,216990);assert.equal(first.events.length,0);assert.equal(first.listings[0].status,'active');
 assert.deepEqual(first.avitoChecks,base.avitoChecks);assert.equal(first.sources.Avito.status,'ok');
 const second=mergeRetail(first,[{id:'S005',price:215990,ok:true}],{at:'2026-10-21T15:20:00Z'}).next;
 assert.equal(second.checks.length,2);assert.equal(second.events.at(-1).kind,'price-drop');assert.equal(second.events.at(-1).oldPriceRub,216990);
});
test('failed fetch never invents points or mutates displayed prices',()=>{
 const base={listings:[{id:'S005',type:'retail',chip:'M5 Pro',title:'MacBook Pro M5 Pro',ramGb:24,ssdGb:1024,priceRub:225590,store:'Hi Store',status:'preliminary'}],checks:[],events:[]};
 const next=mergeRetail(base,[{id:'S005',ok:false,error:'HTTP 403'}],{at:'2026-10-21T14:00:00Z'}).next;
 assert.equal(next.checks.at(-1).minProM5Pro,null);assert.equal(next.listings[0].status,'preliminary');assert.equal(next.lastSuccessAt,undefined);assert.equal(next.sources['Hi Store'].status,'limited');
});
