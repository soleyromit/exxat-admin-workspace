import { chromium } from '/Users/romitsoley/Exxat-DS-Workspace/node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.mjs';
import fs from 'fs';
export const S='/private/tmp/claude-501/-Users-romitsoley-Work-apps-skills-checklist/3c4060af-c99e-4f12-8a44-2640140f4f7f/scratchpad';
export async function open(){const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
 await p.goto('file:///Users/romitsoley/Downloads/prism-skills-prototype%201.html');await p.waitForTimeout(700);return {b,p};}
// text of main content only (strip sidebar)
export async function main(p){return (await p.innerText('body')).split('Preceptor Evaluation\n\nSkills & Competencies').pop();}
export async function snap(p,n){await p.screenshot({path:`${S}/shots/${n}.png`,fullPage:true});}
export async function clk(p,t,o={}){await p.getByText(t,{exact:o.exact??true}).nth(o.nth??0).click();await p.waitForTimeout(500);}
export async function ctrls(p){return p.$$eval('button,select,input,textarea,[role=tab],[role=switch]',els=>els.filter(e=>e.offsetParent).map(e=>`${e.tagName}${e.type?'['+e.type+']':''}:${(e.innerText||e.getAttribute('aria-label')||e.placeholder||e.value||'').trim().replace(/\s+/g,' ').slice(0,50)}`).join(' | '));}
export function log(s){console.log(s);} 
