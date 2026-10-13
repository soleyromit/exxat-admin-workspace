import {open,main,snap,clk} from './lib.mjs';
const {b,p}=await open();
const step=async(name,fn,n=3000)=>{const before=new Set((await main(p)).split('\n').map(s=>s.trim()));try{await fn();}catch(e){console.log('ERR',name,e.message.split('\n')[0]);}
 const t=(await main(p)).split('\n').map(s=>s.trim()).filter(Boolean);
 console.log(`\n=== ${name} ===\n`+t.filter(l=>!before.has(l)).join('\n').slice(0,n));
 await snap(p,'M-'+name.replace(/\W+/g,'_'));};
await clk(p,'Preceptor Evaluation');await clk(p,'Open link',{nth:1});
await step('submit-disabled?',async()=>{console.log('disabled:',await p.getByText('Submit evaluation').first().isDisabled());});
await step('answer-and-submit',async()=>{
 await clk(p,'Independent',{nth:0});
 const tas=p.locator('textarea');await tas.nth(0).fill('Good');
 const y=p.getByRole('button',{name:'Yes',exact:true});await y.nth(0).click();await y.nth(1).click();await y.nth(2).click();
 console.log('disabled now:',await p.getByText('Submit evaluation').first().isDisabled());
 await clk(p,'Submit evaluation');});
await clk(p,'Review & Approve');
await step('see-full-responses',()=>clk(p,'See the full responses',{nth:0}));
await b.close();
