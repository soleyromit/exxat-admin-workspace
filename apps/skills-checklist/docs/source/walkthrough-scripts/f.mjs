import {open,main,snap,clk} from './lib.mjs';
const {b,p}=await open();
let prev=new Set((await main(p)).split('\n').map(s=>s.trim()));
const step=async(name,fn,n=3500)=>{try{await fn();}catch(e){console.log('ERR',name,e.message.split('\n')[0]);}
 const t=(await main(p)).split('\n').map(s=>s.trim()).filter(Boolean);
 console.log(`\n=== ${name} ===\n`+t.filter(l=>!prev.has(l)).join('\n').slice(0,n));
 const bt=await p.$$eval('button,select,input',els=>els.filter(e=>e.offsetParent).map(e=>(e.innerText||e.getAttribute('aria-label')||e.placeholder||'').trim().replace(/\s+/g,' ').slice(0,35)).filter(Boolean));
 console.log('BTNS:',bt.slice(6,45).join(' | '));
 prev=new Set(t);await snap(p,'F-'+name.replace(/\W+/g,'_'));};
await step('filters',()=>clk(p,'Filters'));
await step('by-skill',()=>clk(p,'By skill'));
await step('by-tag',()=>clk(p,'By tag'));
await clk(p,'By student');
await step('student-drill',()=>clk(p,'Noah Zeller'));
await b.close();
