import {open,main,snap,clk} from './lib.mjs';
const {b,p}=await open();
await clk(p,'Student View');
let prev=new Set((await main(p)).split('\n').map(s=>s.trim()));
const step=async(name,fn,n=5000)=>{try{await fn();}catch(e){console.log('ERR',name,e.message.split('\n')[0]);}
 const t=(await main(p)).split('\n').map(s=>s.trim()).filter(Boolean);
 console.log(`\n=== ${name} ===\n`+t.filter(l=>!prev.has(l)).join('\n').slice(0,n));
 const bt=await p.$$eval('button,select,input,textarea',els=>els.filter(e=>e.offsetParent).map(e=>`${e.tagName[0]}${e.type?'.'+e.type:''}:`+(e.innerText||e.getAttribute('aria-label')||e.placeholder||e.value||'').trim().replace(/\s+/g,' ').slice(0,35)).filter(x=>x.length>4));
 console.log('CTRL:',bt.slice(10,80).join(' | '));
 prev=new Set(t);await snap(p,'J-'+name.replace(/\W+/g,'_'));};
await step('select-two',async()=>{await p.locator('input[aria-label="Select Foley Catheter Insertion"]').check();await p.locator('input[aria-label="Select Medication Administration"]').check();await p.waitForTimeout(400)});
await step('send-dialog',()=>clk(p,'Send for review'));
await step('other-skills-expand',async()=>{await p.keyboard.press('Escape');await p.waitForTimeout(300);});
await b.close();
