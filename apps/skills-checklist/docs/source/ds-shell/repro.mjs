import { chromium } from '/Users/romitsoley/Exxat-DS-Workspace/node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.mjs';
const B='http://localhost:3095';
const b=await chromium.launch();
for (const [name,steps] of [['search-only',async p=>{await p.getByRole('button',{name:'Search'}).click()}],['askleo-then-search',async p=>{await p.getByRole('button',{name:/Ask Leo/i}).first().click();await p.keyboard.press('Escape');await p.waitForTimeout(500);await p.getByRole('button',{name:'Search'}).click()}],['cmdk',async p=>{await p.keyboard.press('Control+k')}]]) {
  const p=await b.newPage({viewport:{width:1440,height:900}}); const errs=[];
  p.on('pageerror',e=>errs.push('pageerror: '+String(e).split('\n')[0].slice(0,300))); p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().split('\n')[0].slice(0,300))});
  await p.goto(B+'/overview',{waitUntil:'load'}); await p.waitForTimeout(2500);
  await steps(p).catch(e=>errs.push('step: '+e.message.split('\n')[0])); await p.waitForTimeout(1200);
  console.log(name, errs.length?JSON.stringify(errs.slice(0,3)):'OK', 'dialog:', await p.getByRole('dialog').count());
  await p.close();
}
await b.close();
