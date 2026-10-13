import { chromium } from '/Users/romitsoley/Exxat-DS-Workspace/node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.mjs';
import fs from 'fs';
const S=process.argv[2];
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('file:///Users/romitsoley/Downloads/prism-skills-prototype%201.html'); await p.waitForTimeout(800);
const navs=['Overview','Skills Library','Course Mapping','Review & Approve','Student View','Preceptor Evaluation'];
let out='';
for(const [i,n] of navs.entries()){
  await p.getByText(n,{exact:true}).first().click(); await p.waitForTimeout(600);
  await p.screenshot({path:`${S}/shots/n${i}-${n.replace(/\W+/g,'_')}.png`,fullPage:true});
  const t=await p.innerText('body');
  const c=await p.$$eval('button,a,[role=tab],select,input,textarea',els=>els.map(e=>`${e.tagName}:${(e.innerText||e.getAttribute('aria-label')||e.placeholder||e.value||'').trim().replace(/\s+/g,' ').slice(0,60)}`).filter(x=>x.length>x.indexOf(':')+1));
  out+=`\n\n######## ${n}\n${t}\n--CLICKABLES--\n${c.join(' | ')}`;
}
fs.writeFileSync(S+'/nav-dump.txt',out);
await b.close();
