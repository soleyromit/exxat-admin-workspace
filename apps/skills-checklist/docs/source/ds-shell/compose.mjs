import { chromium } from '/Users/romitsoley/Exxat-DS-Workspace/node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.mjs';
import path from 'path';
const D=process.cwd();
const rows=[['PCE (shipped Design OS, compact)','pce-rail-expanded.png','skills-overview.png','Skills (this build)'],];
const html=`<html><body style="margin:0;font:14px Inter,sans-serif;background:#fff"><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:12px;width:4400px">
${[['PCE admin, rail expanded','pce-rail-expanded.png'],['Starter (canonical, generated)','starter-page-prism-learning.png'],['Skills Checklist (this build)','skills-overview.png']].map(([t,f])=>`<figure style="margin:0"><figcaption style="font-weight:600;padding:4px 0">${t}</figcaption><img src="file://${path.join(D,f)}" style="width:100%;border:1px solid #ddd"/></figure>`).join('')}
</div></body></html>`;
import fs from 'fs'; fs.writeFileSync('compose.html',html);
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:4424,height:1000}});
await p.goto('file://'+path.join(D,'compose.html')); await p.waitForTimeout(800); await p.screenshot({path:'compare-three-way.png',fullPage:true}); await b.close(); console.log('ok');
