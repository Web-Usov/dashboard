import {normalizeListing,mergeAvito,TRACKING_END,TRACKING_START} from './lib.mjs';
const repo=process.env.GITHUB_REPOSITORY||'Web-Usov/dashboard';
const token=process.env.GITHUB_TOKEN;
const apify=process.env.APIFY_TOKEN;
const limit=Number(process.env.APIFY_MAX_ITEMS||12);
if(!Number.isSafeInteger(limit)||limit<1||limit>12)throw Error('APIFY_MAX_ITEMS must be within 1..12 to protect the free budget');
if(repo!=='Web-Usov/dashboard'||!token||!apify)throw Error('Missing token or incorrect repository');
const base='https://api.github.com/repos/'+repo;
async function gh(path,init={}){
 const res=await fetch(base+path,{...init,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28',...init.headers},signal:AbortSignal.timeout(40000)});
 const body=await res.text();let value;try{value=JSON.parse(body)}catch{value={}};
 return {ok:res.ok,status:res.status,value};
}
async function read(){
 const x=await gh('/contents/data.json?ref=gh-pages');
 if(!x.ok)throw Error('Cannot read gh-pages/data.json HTTP '+x.status);
 return {sha:x.value.sha,data:JSON.parse(Buffer.from(String(x.value.content||'').replace(/\n/g,''),'base64').toString('utf8'))};
}
async function publish(ads,meta){
 for(let i=0;i<5;i++){
  const live=await read();const {data,stats}=mergeAvito(live.data,ads,meta);
  const body={branch:'gh-pages',sha:live.sha,message:'data(avito): hourly '+meta.at,content:Buffer.from(JSON.stringify(data,null,2)+'\n').toString('base64')};
  const result=await gh('/contents/data.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(result.ok){console.log('Merged Avito: '+stats.matched+' matching; '+stats.added+' new; '+stats.changed+' prices changed.');return}
  if([409,422].includes(result.status)&&i<4){await new Promise(done=>setTimeout(done,(i+1)*750));continue}
  throw Error('Cannot publish to GitHub: HTTP '+result.status);
 }
}
async function actor(query){
 const url='https://api.apify.com/v2/acts/dami_studio~avito-listings-scraper/run-sync-get-dataset-items?format=json';
 // Matches the Actor's published OpenAPI schema (region is an ARRAY, not city).
 const input={query,region:['samara'],localOnly:true,sellerType:'private',sort:'newest',maxItems:limit,flagUnderpriced:false};
 const res=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+apify,Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(250000)});
 if(!res.ok)throw Error('Apify returned HTTP '+res.status+' for '+query);
 const data=await res.json();
 if(!Array.isArray(data))throw Error('Apify did not return a dataset list for '+query);
 return data;
}
async function ensureFreeBudget(){
 const response=await fetch('https://api.apify.com/v2/users/me/limits',{headers:{Authorization:'Bearer '+apify,Accept:'application/json'},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Cannot verify Apify free budget: HTTP '+response.status+' (no paid Actor run started)');
 const limits=await response.json();
 const used=limits?.data?.current?.monthlyUsageUsd;
 if(typeof used!=='number'||!Number.isFinite(used))throw Error('Apify budget response missing monthly usage (no paid Actor run started)');
 if(used>=4.00){console.log('Apify monthly usage 
 if(Date.parse(at)<Date.parse(TRACKING_START)||Date.parse(at)>Date.parse(TRACKING_END)){console.log('Outside 2026 monitoring period; no API requests.');return}
 if(!await ensureFreeBudget())return;
 const searches=['MacBook Pro M5','MacBook Pro M5 Pro'];
 const results=await Promise.allSettled(searches.map(actor));
 const rows=results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
 const errors=results.filter(r=>r.status==='rejected').map(r=>String(r.reason?.message||r.reason));
 if(errors.length===searches.length)throw Error('Both Apify requests failed: '+errors.join('; '));
 const matches=new Map();
 for(const row of rows){const ad=normalizeListing(row,at);if(ad)matches.set(ad.id,ad)}
 console.log('Received '+rows.length+' results, matched '+matches.size+' local MacBook Pro listings, failed searches '+errors.length);
 await publish([...matches.values()],{at,scanned:rows.length,errors});
}
main().catch(e=>{console.error('Avito monitor failed:',e.message);process.exitCode=1});
+used.toFixed(2)+' reached the $4.00 safety threshold; skipping paid actor calls.');return false}
 console.log('Apify current cycle usage 
 if(Date.parse(at)<Date.parse(TRACKING_START)||Date.parse(at)>Date.parse(TRACKING_END)){console.log('Outside 2026 monitoring period; no API requests.');return}
 const searches=['MacBook Pro M5','MacBook Pro M5 Pro'];
 const results=await Promise.allSettled(searches.map(actor));
 const rows=results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
 const errors=results.filter(r=>r.status==='rejected').map(r=>String(r.reason?.message||r.reason));
 if(errors.length===searches.length)throw Error('Both Apify requests failed: '+errors.join('; '));
 const matches=new Map();
 for(const row of rows){const ad=normalizeListing(row,at);if(ad)matches.set(ad.id,ad)}
 console.log('Received '+rows.length+' results, matched '+matches.size+' local MacBook Pro listings, failed searches '+errors.length);
 await publish([...matches.values()],{at,scanned:rows.length,errors});
}
main().catch(e=>{console.error('Avito monitor failed:',e.message);process.exitCode=1});
+used.toFixed(2)+' of $4.00 internal safety threshold.');
 return true;
}
async function main(){
 const at=new Date().toISOString();
 if(Date.parse(at)<Date.parse(TRACKING_START)||Date.parse(at)>Date.parse(TRACKING_END)){console.log('Outside 2026 monitoring period; no API requests.');return}
 const searches=['MacBook Pro M5','MacBook Pro M5 Pro'];
 const results=await Promise.allSettled(searches.map(actor));
 const rows=results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
 const errors=results.filter(r=>r.status==='rejected').map(r=>String(r.reason?.message||r.reason));
 if(errors.length===searches.length)throw Error('Both Apify requests failed: '+errors.join('; '));
 const matches=new Map();
 for(const row of rows){const ad=normalizeListing(row,at);if(ad)matches.set(ad.id,ad)}
 console.log('Received '+rows.length+' results, matched '+matches.size+' local MacBook Pro listings, failed searches '+errors.length);
 await publish([...matches.values()],{at,scanned:rows.length,errors});
}
main().catch(e=>{console.error('Avito monitor failed:',e.message);process.exitCode=1});
