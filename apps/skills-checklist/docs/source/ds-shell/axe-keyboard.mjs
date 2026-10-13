import { chromium } from '/Users/romitsoley/Exxat-DS-Workspace/node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.mjs';
import fs from 'fs';
const AXE=fs.readFileSync('/Users/romitsoley/Work/apps/skills-checklist/admin/node_modules/axe-core/axe.min.js','utf8');
const B='http://localhost:3095';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,160))); p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160))});
const axe=async(name,ctx='nav[aria-label="Global utilities"], nav[aria-label="Application"], [role=menu], [role=dialog], [data-radix-popper-content-wrapper]')=>{
  await p.evaluate(AXE);
  const r=await p.evaluate(async(c)=>{const res=await window.axe.run(document.querySelector('body'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}});return res.violations.map(v=>v.id+' x'+v.nodes.length+' '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' | '))},ctx);
  console.log('AXE',name,r.length?JSON.stringify(r):'0 violations (contrast on)');
};
const go=async(u)=>{await p.goto(B+u,{waitUntil:'load'});await p.waitForTimeout(2200)};
await go('/overview'); await axe('overview chrome');
for (const [n,sel] of [['product switcher',/Current product/i],['scope switcher',/Sample University/i],['profile menu',/Sample user, open profile/i],['notifications',/Notifications/i],['help',/^Help/i]]) {
  await p.getByRole('button',{name:sel}).click(); await p.waitForTimeout(500); await axe(n); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
}
await p.getByRole('button',{name:/Ask Leo/i}).first().click(); await p.waitForTimeout(500); await axe('ask leo dialog'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await p.getByRole('button',{name:'Search'}).click(); await p.waitForTimeout(500); await axe('command menu'); await p.keyboard.press('Escape');
await go('/student'); await axe('student view chrome');
await go('/preceptor'); await axe('evaluator view chrome');
// keyboard walk
await go('/overview');
const order=[]; await p.keyboard.press('Tab');
for(let i=0;i<14;i++){ order.push(await p.evaluate(()=>{const e=document.activeElement;return (e.getAttribute('aria-label')||e.innerText||e.tagName).trim().replace(/\s+/g,' ').slice(0,50)})); await p.keyboard.press('Tab'); }
console.log('TABORDER', JSON.stringify(order));
await p.keyboard.press('Control+b'); await p.waitForTimeout(500); console.log('ctrl+b toggles sidebar state:', await p.evaluate(()=>document.querySelector('[data-state]')?.getAttribute('data-state')));
await p.keyboard.press('Control+k'); await p.waitForTimeout(500); console.log('ctrl+k opens dialog:', await p.getByRole('dialog').count()); await p.keyboard.press('Escape');
console.log('ERRORS',errs.length,JSON.stringify(errs.slice(0,3)));
await b.close();
