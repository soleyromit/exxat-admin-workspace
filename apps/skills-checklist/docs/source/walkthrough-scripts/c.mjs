import {open,main,snap,clk,ctrls} from './lib.mjs';
const {b,p}=await open();
let prev=new Set();
const step=async(name,fn,full)=>{try{await fn();}catch(e){console.log('ERR',name,e.message.split('\n')[0]);}
 const t=(await main(p)).split('\n').map(s=>s.trim()).filter(Boolean);
 console.log(`\n=== ${name} ===\n`+(full?t:t.filter(l=>!prev.has(l))).join('\n').slice(0,5000));
 const inputs=await p.$$eval('input,select,textarea',els=>els.filter(e=>e.offsetParent).map(e=>`${e.tagName}[${e.type}] "${(e.getAttribute('aria-label')||e.placeholder||'')}" = ${e.type==='checkbox'||e.type==='radio'?e.checked:(e.value||'').slice(0,40)}`));
 console.log('INPUTS:',inputs.slice(0,40).join(' ; '));
 prev=new Set(t);await snap(p,'C-'+name.replace(/\W+/g,'_'));};
await clk(p,'Skills Library'); prev=new Set((await main(p)).split('\n').map(s=>s.trim()));
await clk(p,'Import');await clk(p,'Paste a sample list');await clk(p,'Read the list');await clk(p,'Create 8 skills');
await step('after-create',async()=>{},true);
await step('filter-needs-config',async()=>{await p.selectOption('select >> nth=2','Needs configuration');await p.waitForTimeout(400)});
await step('edit-first-unconfigured',()=>clk(p,'Edit'));
await b.close();
