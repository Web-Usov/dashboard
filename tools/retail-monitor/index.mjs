import {PRODUCTS,parseProduct,mergeRetail} from './lib.mjs';
const repo=process.env.GITHUB_REPOSITORY||'Web-Usov/dashboard';
const token=process.env.GITHUB_TOKEN;
if(repo!=='Web-Usov/dashboard'||!token)throw Error('Invalid repository or GITHUB_TOKEN missing');
const start=Date.parse('2026-10-21T00:00:00+04:00');
const end=Date.parse('2026-11-01T23:59:59+04:00');
const base='https://api.github.com/repos/'+repo;
const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
async function git(path,init={}){
 const r=await fetch(base+path,{...init,headers:{...headers,...init.headers},signal:AbortSignal.timeout(20000)});
 let payload={};try{payload=await r.json()}catch{}
 return {ok:r.ok,status:r.status,body:payload};
}
async function read(){
 const r=await git('/contents/data.json?ref=gh-pages');
 if(!r.ok)throw Error('Cannot read gh-pages data.json, GitHub HTTP '+r.status);
 return {sha:r.body.sha,data:JSON.parse(Buffer.from(r.body.content.replace(/\s/g,''),'base64').toString('utf8'))};
}
async function attempt(product){
 try{
  const r=await fetch(product.url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; MacBookPriceWatch/1.0)','Accept':'text/html,application/xhtml+xml','Accept-Language':'ru-RU,ru;q=0.9'},signal:AbortSignal.timeout(14000),redirect:'follow'});
  if(!r.ok)throw Error('HTTP '+r.status);
  if(new URL(r.url).hostname!==new URL(product.url).hostname)throw Error('Unexpected domain redirect');
  const html=await r.text();
  if(html.length>4000000)throw Error('Page too large');
  const {price}=parseProduct(html,product);
  console.log('Confirmed '+product.id+' '+product.store+': '+price+' RUB');
  return {id:product.id,price,ok:true};
 }catch(e){console.log('Could not confirm '+product.id+' '+product.store+': '+e.message);return{id:product.id,ok:false,error:String(e.message)}}
}
async function update(rows,at){
 for(let trial=0;trial<5;trial++){
  const {data,sha}=await read();
  const {next,summary}=mergeRetail(data,rows,{at});
  const req={message:'data(retail): hourly live product check '+at,branch:'gh-pages',sha,content:Buffer.from(JSON.stringify(next,null,2)+'\n').toString('base64')};
  const r=await git('/contents/data.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(req)});
  if(r.ok){console.log('Published retail snapshot: '+JSON.stringify(summary));return}
  if([409,422].includes(r.status)&&trial<4){console.log('Concurrent write; retrying after reload');await new Promise(r=>setTimeout(r,650*(trial+1)));continue}
  throw Error('Could not save snapshot: GitHub HTTP '+r.status);
 }
}
async function main(){
 const at=new Date().toISOString();
 if(Date.now()<start||Date.now()>end){console.log('Outside scheduled experiment; no collection.');return}
 const rows=await Promise.all(PRODUCTS.map(attempt));
 await update(rows,at);
}
main().catch(e=>{console.error('Retail job failed: '+e.message);process.exitCode=1});
