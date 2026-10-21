import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractSpecs,normalizeListing,mergeAvito} from './lib.mjs';
const at='2026-10-21T15:00:00.000Z';
const ad=(extra={})=>({listingId:'1234567890',title:'Apple MacBook Pro M5 Pro 24/1024',description:'Работает отлично. Батарея 95%, 30 циклов',price:205000,location:'Самара',url:'https://www.avito.ru/samara/noutbuki/macbook_pro_m5_1234567890',sellerType:'private',sellerName:'Иван',...extra});
test('M5 Pro, 24 GB and 1024 GB parsed',()=>{
 const x=extractSpecs(ad());assert.equal(x.family,true);assert.equal(x.chip,'M5 Pro');assert.equal(x.ramGb,24);assert.equal(x.ssdGb,1024);
});
test('accept 36GB RAM 2TB SSD and 24GB/1TB SSD',()=>{
 const x=extractSpecs(ad({title:'MacBook Pro M5 36 ГБ ОЗУ, SSD 2 ТБ',description:''}));
 assert.equal(x.chip,'M5');assert.equal(x.ramGb,36);assert.equal(x.ssdGb,2048);
 const y=extractSpecs(ad({title:'MacBook Pro M5 Pro 24GB/1TB',description:''}));
 assert.equal(y.ramGb,24);assert.equal(y.ssdGb,1024);
});
test('reject Air, Max, insufficient or unknown specs',()=>{
 for(const row of [ad({title:'MacBook Air M5 24/1024'}),ad({title:'MacBook Pro M5 Max 24/1024'}),ad({title:'MacBook Pro M5 Pro 16/1024'}),ad({title:'MacBook Pro M5 Pro 24/512'}),ad({title:'MacBook Pro M5 Pro',description:''})])assert.equal(normalizeListing(row,at),null,row.title);
});
test('reject location mismatches, shops and unsafe URLs',()=>{
 for(const row of [ad({location:'Тольятти'}),ad({location:'Самарская область, Сызрань'}),ad({location:'Москва'}),ad({sellerType:'company'}),ad({url:'https://example.com/1234567890'})])assert.equal(normalizeListing(row,at),null);
});
test('valid price, id, battery and listing details',()=>{
 const x=normalizeListing(ad(),at);assert.equal(x.id,'A1234567890');assert.equal(x.priceRub,205000);assert.equal(x.batteryHealthPercent,95);assert.equal(x.batteryCycles,30);assert.equal(x.status,'active');
});
test('merges Avito but never overwrites retail checks or listings',()=>{
 const shop={id:'S001',type:'retail',title:'MacBook Pro M5',priceRub:220000};
 const base={schemaVersion:1,listings:[shop],events:[{kind:'baseline',at}],checks:[{minProM5:210000,at}],sources:{'Hi Store':{status:'ok'}},checkCount:1};
 const item=normalizeListing(ad(),at),first=mergeAvito(base,[item],{at,scanned:10,errors:[]});
 assert.equal(first.data.listings.length,2);assert.deepEqual(first.data.checks,base.checks);
 assert.equal(first.data.listings[0].priceRub,220000);assert.equal(first.data.avitoChecks[0].minProM5Pro,205000);assert.equal(first.stats.added,1);
 const next=mergeAvito(first.data,[{...item,priceRub:199000}],{at:'2026-10-21T16:00:00.000Z',scanned:10,errors:[]});
 assert.equal(next.stats.changed,1);assert.equal(next.data.events.at(-1).kind,'price-drop');assert.equal(next.data.events.at(-1).oldPriceRub,205000);
});
test('missing capped-search results do not mark previous listings sold',()=>{
 const base={listings:[normalizeListing(ad(),at)],events:[],checks:[],sources:{}};
 const x=mergeAvito(base,[],{at:'2026-10-24T16:00:00.000Z',scanned:0,errors:['timeout']});
 assert.equal(x.data.listings[0].status,'stale');assert.equal(x.data.avitoChecks.at(-1).minProM5Pro,null);assert.equal(x.data.sources.Avito.status,'partial');
});
