import {open,main,snap,clk,ctrls} from './lib.mjs';
const {b,p}=await open();
let prev=new Set((await main(p)).split('\n'));
const step=async(name,fn,full)=>{try{await fn();}catch(e){console.log('ERR',name,e.message.split('\n')[0]);}
 const t=(await main(p)).split('\n').map(s=>s.trim()).filter(Boolean);
 console.log(`\n=== ${name} ===\n`+(full?t:t.filter(l=>!prev.has(l))).join('\n').slice(0,4500));
 console.log('CTRL:',(await ctrls(p)).split(' | ').filter(c=>!/Overview|Skills Library:|Course Mapping|Review & Approve|Student View|Preceptor Evaluation/.test(c)).join(' | ').slice(0,1200));
 prev=new Set(t);await snap(p,'B-'+name.replace(/\W+/g,'_'));};
await clk(p,'Skills Library');
prev=new Set((await main(p)).split('\n').map(s=>s.trim()));
await step('import-open',()=>clk(p,'Import'));
await step('import-sample',()=>clk(p,'Paste a sample list'));
await step('import-read',()=>clk(p,'Read the list'));
await b.close();
