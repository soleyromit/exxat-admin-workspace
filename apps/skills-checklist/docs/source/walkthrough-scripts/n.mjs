import {open,main,snap,clk} from './lib.mjs';
const {b,p}=await open();
const step=async(name,fn,n=1800)=>{const before=new Set((await main(p)).split('\n').map(s=>s.trim()));try{await fn();}catch(e){console.log('ERR',name,e.message.split('\n')[0]);}
 const t=(await main(p)).split('\n').map(s=>s.trim()).filter(Boolean);
 console.log(`\n=== ${name} ===\n`+t.filter(l=>!before.has(l)).join('\n').slice(0,n));await snap(p,'N-'+name.replace(/\W+/g,'_'));};
await clk(p,'Course Mapping');
await step('open-offering-with-no-cohort',()=>clk(p,'NURS 301 — Adult Health I',{nth:1}));
await step('toggle-map-sterile',async()=>{await p.locator('input[aria-label="Map Medication Administration"]').check();});
await step('mandatory-btn',()=>clk(p,'Mandatory',{nth:0}));
await clk(p,'Review & Approve');
await step('return',async()=>{await p.getByRole('button',{name:'Return to preceptor'}).first().click();});
await step('approve',async()=>{await p.getByRole('button',{name:'Approve'}).first().click();});
await clk(p,'Overview');
await step('export',()=>clk(p,'Export'));
await b.close();
