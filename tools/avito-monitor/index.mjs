import {normalizeListing,mergeAvito,TRACKING_START,TRACKING_END} from './lib.mjs';

const REPO='Web-Usov/dashboard';
const token=process.env.GITHUB_TOKEN;
const apify=process.env.APIFY_TOKEN;
const maxItems=Number(process.env.APIFY_MAX_ITEMS||12);
const GITHUB_API='https://api.github.com/repos/'+REPO;
const ACTOR_API='https://api.apify.com/v2';
const QUERIES=['MacBook Pro M5','MacBook Pro M5 Pro'];

if(process.env.GITHUB_REPOSITORY!==REPO)throw Error('Unexpected GitHub repository');
if(!token||!apify)throw Error('GITHUB_TOKEN and APIFY_TOKEN must be set');
if(!Number.isSafeInteger(maxItems)||maxItems<1||maxItems>12)throw Error('maxItems must be 1..12');

async function github(path,init={}){
 const response=await fetch(GITHUB_API+path,{
  ...init,
  headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28',...init.headers},
  signal:AbortSignal.timeout(30000)
 });
 const body=await response.text();
 let value;try{value=JSON.parse(body)}catch{value={}}
 return {ok:response.ok,status:response.status,value};
}
async function readData(){
 const result=await github('/contents/data.json?ref=gh-pages');
 if(!result.ok||!result.value.sha||!result.value.content)throw Error('Cannot read gh-pages/data.json (HTTP '+result.status+')');
 const data=JSON.parse(Buffer.from(result.value.content.replace(/\s/g,''),'base64').toString('utf8'));
 return {sha:result.value.sha,data};
}
async function assertFreeBudget(){
 const response=await fetch(ACTOR_API+'/users/me/limits',{
  headers:{Authorization:'Bearer '+apify,Accept:'application/json'},
  signal:AbortSignal.timeout(20000)
 });
 if(!response.ok)throw Error('Cannot check Apify budget (HTTP '+response.status+'); no Actor started');
 const parsed=await response.json();
 const used=parsed?.data?.current?.monthlyUsageUsd;
 const maxAllowed=parsed?.data?.limits?.maxMonthlyUsageUsd;
 if(!Number.isFinite(used)||!Number.isFinite(maxAllowed))throw Error('Apify limits response lacks numeric usage; no Actor started');
 const stopAt=Math.min(4,maxAllowed);
 if(used>=stopAt){
  console.log('Apify budget guard: monthly usage $'+used.toFixed(2)+' >= $'+stopAt.toFixed(2)+'; skip paid calls');
  return false;
 }
 console.log('Apify account usage: $'+used.toFixed(3)+'; internal cutoff $'+stopAt.toFixed(2));
 return true;
}
async function scrape(query){
 const response=await fetch(ACTOR_API+'/acts/dami_studio~avito-listings-scraper/run-sync-get-dataset-items?format=json',{
  method:'POST',
  headers:{Authorization:'Bearer '+apify,Accept:'application/json','Content-Type':'application/json'},
  body:JSON.stringify({
   query,region:['samara'],localOnly:true,sellerType:'private',
   sort:'newest',maxItems,flagUnderpriced:false
  }),
  signal:AbortSignal.timeout(250000)
 });
 if(!response.ok){
  const message=(await response.text()).slice(0,160);
  throw Error('Apify Actor HTTP '+response.status+' for '+query+': '+message);
 }
 const items=await response.json();
 if(!Array.isArray(items))throw Error('Apify response is not an array: '+query);
 return items;
}
async function saveListings(items,meta){
 for(let retry=0;retry<5;retry++){
  const {sha,data}=await readData();
  const {data:merged,stats}=mergeAvito(data,items,meta);
  const request={branch:'gh-pages',sha,
   message:'data(avito): verified query '+meta.at,
   content:Buffer.from(JSON.stringify(merged,null,2)+'\n').toString('base64')};
  const result=await github('/contents/data.json',{
   method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)
  });
  if(result.ok){
   console.log('Avito saved: '+stats.matched+' relevant ads, '+stats.added+' new, '+stats.changed+' price changes');
   return;
  }
  if([409,422].includes(result.status)&&retry<4){
   await new Promise(resolve=>setTimeout(resolve,(retry+1)*800));
   continue;
  }
  throw Error('Cannot update data.json: GitHub HTTP '+result.status);
 }
}
async function main(){
 const at=new Date().toISOString();
 if(Date.parse(at)<Date.parse(TRACKING_START)||Date.parse(at)>Date.parse(TRACKING_END)){
  console.log('Outside monitoring period; skip Apify entirely');
  return;
 }
 if(!await assertFreeBudget())return;
 const results=[];
 const errors=[];
 for(const query of QUERIES){
  try{
   const ads=await scrape(query);
   results.push(...ads);
   console.log(query+': '+ads.length+' raw results');
  }catch(error){
   console.error('Avito query error: '+error.message);
   errors.push(query+': '+error.message);
  }
 }
 if(errors.length===QUERIES.length)throw Error('All Apify searches failed; refusing to write misleading empty results');
 const matching=new Map();
 for(const raw of results){
  const listing=normalizeListing(raw,at);
  if(listing)matching.set(listing.id,listing);
 }
 console.log('Total '+results.length+' raw ads; '+matching.size+' strictly eligible Samara MacBook Pro ads');
 await saveListings([...matching.values()],{at,scanned:results.length,errors});
}
main().catch(error=>{console.error('Avito collection failed: '+error.message);process.exitCode=1});
