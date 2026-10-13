import {open,main,snap,clk} from './lib.mjs';
const {b,p}=await open();
const step=async(name,fn,n=3800)=>{const before=new Set((await main(p)).split('\n').map(s=>s.trim()));try{await fn();}catch(e){console.log('ERR',name,e.message.split('\n')[0]);}
 const t=(await main(p)).split('\n').map(s=>s.trim()).filter(Boolean);
 console.log(`\n=== ${name} ===\n`+t.filter(l=>!before.has(l)).join('\n').slice(0,n));
 const c=await p.$$eval('button,select,input,textarea',els=>els.filter(e=>e.offsetParent).map(e=>`${e.tagName[0]}${e.type?'.'+e.type:''}:`+(e.innerText||e.getAttribute('aria-label')||e.placeholder||'').trim().replace(/\s+/g,' ').slice(0,30)).filter(x=>x.length>4));
 console.log('CTRL:',c.slice(6,50).join(' | '));
 await snap(p,'L-'+name.replace(/\W+/g,'_'));};
await clk(p,'Preceptor Evaluation');
await step('open-iv-foley',()=>clk(p,'Open link',{nth:1}),5000);
await step('submit-empty',()=>clk(p,'Submit',{exact:false}).catch(()=>{}));
await b.close();
