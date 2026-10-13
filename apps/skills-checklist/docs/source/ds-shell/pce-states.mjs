import { chromium } from '/Users/romitsoley/Exxat-DS-Workspace/node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.mjs';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}});
const B='http://localhost:3005';
const shot=async(n)=>{await p.waitForTimeout(700);await p.screenshot({path:`pce-${n}.png`});console.log('shot',n)};
for (const [n,u] of [['surveys','/surveys'],['results','/results'],['directory','/directory/courses'],['admin','/admin'],['templates','/templates']]) {
  await p.goto(B+u,{waitUntil:'load'}); await p.waitForTimeout(2500); console.log(n,p.url()); await shot('page-'+n);
}
await p.goto(B+'/surveys',{waitUntil:'load'}); await p.waitForTimeout(2500);
// expanded rail
await p.getByRole('button',{name:/Expand sidebar/i}).first().click(); await shot('rail-expanded');
const nav=await p.evaluate(()=>[...document.querySelectorAll('nav[aria-label=Application] a, nav[aria-label=Application] button')].map(e=>(e.getAttribute('aria-label')||e.innerText||'').trim().replace(/\s+/g,' ').slice(0,40)+'|'+(e.getAttribute('href')||'')));
console.log('NAV',JSON.stringify(nav));
await p.getByRole('button',{name:/Collapse sidebar/i}).first().click().catch(()=>{});
// product switcher
await p.getByRole('button',{name:/Current product/i}).click(); await shot('product-switcher');
const prod=await p.evaluate(()=>[...document.querySelectorAll('[role=menu] *, [role=dialog] *')].filter(e=>e.children.length===0&&e.innerText&&e.innerText.trim()).map(e=>e.innerText.trim()).slice(0,40));
console.log('PRODUCTS',JSON.stringify(prod));
await p.keyboard.press('Escape');
// school switcher
await p.getByRole('button',{name:/Johns Hopkins/i}).click(); await shot('school-switcher');
await p.keyboard.press('Escape');
// profile
await p.getByRole('button',{name:/open profile/i}).click(); await shot('profile-menu');
const prof=await p.evaluate(()=>[...document.querySelectorAll('[role=menu] *')].filter(e=>e.children.length===0&&e.innerText&&e.innerText.trim()).map(e=>e.innerText.trim()).slice(0,30));
console.log('PROFILE',JSON.stringify(prof));
await p.keyboard.press('Escape');
// notifications / whats new / help
for (const [n,rx] of [['notifications',/Notifications/i],['whatsnew',/What's new/i],['help',/Help/i],['search',/^Search$/i]]) {
  const bt=p.getByRole('button',{name:rx}).first();
  if (await bt.count()) { await bt.click(); await shot(n); await p.keyboard.press('Escape'); await p.waitForTimeout(300);} }
await p.getByRole('button',{name:/Ask Leo/i}).first().click(); await shot('ask-leo'); await p.keyboard.press('Escape');
await b.close();
