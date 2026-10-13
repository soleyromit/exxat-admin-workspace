import {open,main,snap,clk} from './lib.mjs';
const {b,p}=await open();
await clk(p,'Student View');
let prev=new Set((await main(p)).split('\n').map(s=>s.trim()));
const step=async(name,fn,n=3500)=>{try{await fn();}catch(e){console.log('ERR',name,e.message.split('\n')[0]);}
 const t=(await main(p)).split('\n').map(s=>s.trim()).filter(Boolean);
 console.log(`\n=== ${name} ===\n`+t.filter(l=>!prev.has(l)).join('\n').slice(0,n));
 prev=new Set(t);await snap(p,'K-'+name.replace(/\W+/g,'_'));};
await p.locator('input[aria-label="Select Foley Catheter Insertion"]').check();
await clk(p,'Send for review');
await step('lab-toggle',()=>clk(p,'Lab / Simulation'));
const sels=await p.$$eval('select',els=>els.filter(e=>e.offsetParent).map(e=>[...e.options].map(o=>o.text).join(' / ')));console.log('SELECTS',sels);
await step('fill+send',async()=>{
  const d=p.locator('input[type=date]').first(); await d.fill('2026-09-01');
  const ta=p.locator('textarea').first(); if(await ta.count()) await ta.fill('Test');
  await p.waitForTimeout(300);
  console.log('send disabled?',await p.getByText('Send request').first().isDisabled());
  await clk(p,'Send request');
});
await b.close();
