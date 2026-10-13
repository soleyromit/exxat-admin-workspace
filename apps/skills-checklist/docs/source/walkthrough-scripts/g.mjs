import {open,main,snap,clk} from './lib.mjs';
const {b,p}=await open();
let prev=new Set((await main(p)).split('\n').map(s=>s.trim()));
const step=async(name,fn,n=4000)=>{try{await fn();}catch(e){console.log('ERR',name,e.message.split('\n')[0]);}
 const t=(await main(p)).split('\n').map(s=>s.trim()).filter(Boolean);
 console.log(`\n=== ${name} ===\n`+t.filter(l=>!prev.has(l)).join('\n').slice(0,n));
 const bt=await p.$$eval('button,select,input,textarea',els=>els.filter(e=>e.offsetParent).map(e=>(e.innerText||e.getAttribute('aria-label')||e.placeholder||'').trim().replace(/\s+/g,' ').slice(0,35)).filter(Boolean));
 console.log('BTNS:',bt.slice(6,60).join(' | '));
 prev=new Set(t);await snap(p,'G-'+name.replace(/\W+/g,'_'));};
await clk(p,'Noah Zeller');
await step('skill-evidence',()=>clk(p,'IV Insertion',{nth:0}));
await step('filter-location-setting',async()=>{await clk(p,'Filters');
 await p.selectOption('select >> nth=5','Mercy Home Health').catch(()=>{});await p.waitForTimeout(300);
 const sels=await p.$$('select');const ls=await Promise.all(sels.map(s=>s.evaluate(e=>[...e.options].map(o=>o.text).join('/').slice(0,40))));console.log(ls);});
await b.close();
