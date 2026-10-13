import { chromium } from '/Users/romitsoley/Exxat-DS-Workspace/node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.mjs';
import fs from 'fs';
const B='http://localhost:3095';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1440,height:900}}); const p=await ctx.newPage();
const errs=[]; p.on('console',m=>{if(['error','warning'].includes(m.type())) errs.push(m.type()+': '+m.text().slice(0,160))}); p.on('pageerror',e=>errs.push('pageerror: '+String(e).slice(0,160)));
const shot=async(n)=>{await p.waitForTimeout(700);await p.screenshot({path:`skills-${n}.png`});console.log('shot',n)};
await p.goto(B+'/overview',{waitUntil:'load'}); await p.waitForTimeout(2500); await shot('overview');
const info=await p.evaluate(()=>({bar:[...document.querySelectorAll('nav[aria-label="Global utilities"] button, nav[aria-label="Global utilities"] a')].map(e=>(e.getAttribute('aria-label')||e.innerText||'').trim().slice(0,60)),
 nav:[...document.querySelectorAll('nav[aria-label=Application] a')].map(e=>e.innerText.trim()+'|'+e.getAttribute('href')),
 groupLabels:[...document.querySelectorAll('nav[aria-label=Application] [data-sidebar=group-label]')].map(e=>e.innerText)}));
console.log(JSON.stringify(info));
await p.getByRole('button',{name:/Current product/i}).click(); await shot('product-switcher'); await p.keyboard.press('Escape');
await p.getByRole('button',{name:/Sample University/i}).click(); await shot('scope-switcher'); await p.keyboard.press('Escape');
await p.getByRole('button',{name:/Sample user, open profile/i}).click(); await shot('profile-menu'); await p.keyboard.press('Escape');
await p.getByRole('button',{name:/Notifications/i}).click(); await shot('notifications'); await p.keyboard.press('Escape');
await p.getByRole('button',{name:/^Help/i}).click(); await shot('help'); await p.keyboard.press('Escape');
await p.getByRole('button',{name:/Ask Leo/i}).first().click(); await shot('ask-leo'); await p.keyboard.press('Escape');
await p.getByRole('button',{name:'Search'}).click(); await shot('command-menu'); await p.keyboard.press('Escape');
// rail collapse via toggle
await p.getByRole('button',{name:/Toggle sidebar/i}).click(); await shot('rail-collapsed'); await p.getByRole('button',{name:/Toggle sidebar/i}).click();
await p.goto(B+'/library/skills',{waitUntil:'load'}); await p.waitForTimeout(2000); await shot('library');
await p.goto(B+'/student',{waitUntil:'load'}); await p.waitForTimeout(2500); await shot('student-view');
await p.goto(B+'/preceptor',{waitUntil:'load'}); await p.waitForTimeout(2000); await shot('preceptor-view');
const p2=await b.newPage({viewport:{width:1024,height:768}}); await p2.goto(B+'/overview',{waitUntil:'load'}); await p2.waitForTimeout(2500); await p2.screenshot({path:'skills-overview-1024.png'});
const p3=await b.newPage({viewport:{width:390,height:844}}); await p3.goto(B+'/overview',{waitUntil:'load'}); await p3.waitForTimeout(2500); await p3.screenshot({path:'skills-overview-390.png'});
console.log('overflow390', await p3.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth));
console.log('CONSOLE', errs.length, JSON.stringify(errs.slice(0,6)));
await b.close();
