import {open,main,snap,clk} from './lib.mjs';
const {b,p}=await open();
let prev=new Set((await main(p)).split('\n').map(s=>s.trim()));
const step=async(name,fn,n=3500)=>{try{await fn();}catch(e){console.log('ERR',name,e.message.split('\n')[0]);}
 const t=(await main(p)).split('\n').map(s=>s.trim()).filter(Boolean);
 console.log(`\n=== ${name} ===\n`+t.filter(l=>!prev.has(l)).join('\n').slice(0,n));
 prev=new Set(t);await snap(p,'H-'+name.replace(/\W+/g,'_'));};
await clk(p,'Noah Zeller');await clk(p,'IV Insertion',{nth:0});
await step('view-form',()=>clk(p,'View form',{nth:0}));
await p.keyboard.press('Escape');await p.waitForTimeout(300);
await clk(p,'Close').catch(()=>{});
await step('open-filters',()=>clk(p,'Filters'));
const sel=async(i,v)=>{await p.selectOption(`select >> nth=${i}`,{label:v});await p.waitForTimeout(300);};
const info=await p.$$eval('select',els=>els.map((e,i)=>i+':'+[...e.options].map(o=>o.text).slice(0,3).join('/')));console.log(info.join('\n'));
await step('impossible-combo',async()=>{await sel(4,'Mercy Home Health').catch(e=>console.log(e.message.slice(0,80)));await sel(5,'Emergency').catch(e=>console.log(e.message.slice(0,80)));});
await b.close();
