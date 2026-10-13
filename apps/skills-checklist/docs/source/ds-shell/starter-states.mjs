import { chromium } from '/Users/romitsoley/Exxat-DS-Workspace/node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.mjs';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}});
const B='http://127.0.0.1:5199';
const shot=async(n)=>{await p.waitForTimeout(900);await p.screenshot({path:`starter-${n}.png`});console.log('shot',n)};
for (const [n,u] of [['prism-dashboard','/prism/dashboard'],['prism-library','/prism/library/all'],['prism-learning','/prism/learning-activities'],['one','/one/dashboard'],['settings','/settings/profile']]) {
  await p.goto(B+u,{waitUntil:'load'}); await p.waitForTimeout(2500); console.log(n,p.url()); await shot('page-'+n);
}
await p.goto(B+'/prism/dashboard',{waitUntil:'load'}); await p.waitForTimeout(2500);
const info=await p.evaluate(()=>({
 buttons:[...document.querySelectorAll('[data-slot=utility-bar] button, nav[aria-label="Global utilities"] button')].map(e=>(e.getAttribute('aria-label')||e.innerText||'').trim().slice(0,60)),
 nav:[...document.querySelectorAll('nav[aria-label=Application] a, nav[aria-label=Application] button')].map(e=>(e.getAttribute('aria-label')||e.innerText||'').trim().replace(/\s+/g,' ').slice(0,40)+'|'+(e.getAttribute('href')||'')).slice(0,40)}));
console.log(JSON.stringify(info,null,1));
const tryClick=async(rx,n)=>{const bt=p.getByRole('button',{name:rx}).first(); if(await bt.count()){await bt.click({timeout:4000}).catch(e=>console.log('click fail',n)); await shot(n); await p.keyboard.press('Escape'); await p.waitForTimeout(300);} else console.log('absent',n)};
await tryClick(/Current product/i,'product-switcher');
await tryClick(/Expand sidebar|Collapse sidebar|Toggle sidebar/i,'rail-toggle');
await shot('after-toggle');
await b.close();
