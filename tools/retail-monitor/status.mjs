import {appendFile} from 'node:fs/promises';
const token=process.env.GITHUB_TOKEN;
if(!token)throw Error('GitHub token missing');
async function main(){
 const r=await fetch('https://api.github.com/repos/Web-Usov/dashboard/contents/data.json?ref=gh-pages',{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('Could not read published data: HTTP '+r.status);
 const file=await r.json();
 const data=JSON.parse(Buffer.from(file.content.replace(/\s/g,''),'base64').toString('utf8'));
 const last=data.checks?.at(-1);
 const at=Date.parse(last?.at||'');
 const outside=Date.now()>Date.parse('2026-11-01T19:59:59.999Z');
 if(!outside&&(!Number.isFinite(at)||Date.now()-at>15*60000))throw Error('Retail JSON snapshot is stale or missing');
 const rows=(data.listings||[]).filter(x=>x.type==='retail'&&x.status==='active'&&x.verifiedAt===last?.at);
 const summary=[
  '## MacBook Pro retail monitor',
  '',
  '| Metric | Result |',
  '|---|---|',
  '| Last check (UTC) | '+(last?.at||'none')+' |',
  '| HTTP-verified prices in this check | '+(last?.count??0)+' |',
  '| Lowest Pro M5 Pro | '+(last?.minProM5Pro??'not verified')+' RUB |',
  '| Check status | '+(last?.status||'unknown')+' |',
  '| Historical snapshots | '+(data.checks?.length??0)+' |',
  '| API (Avito) snapshots | '+(data.avitoChecks?.length??0)+' |',
  '',
  'Source: [gh-pages/data.json](https://github.com/Web-Usov/dashboard/blob/gh-pages/data.json).',
  '',
  ...(rows.length?['### Verified offers',...rows.map(x=>'- '+x.store+': '+x.priceRub+' ₽ — '+x.url)]:['No live shop price confirmed in this attempt; older entries remain preliminary.']),
  ''
 ].join('\n');
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
 console.log(summary);
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
