const { chromium } = require("playwright");
const BASE = "http://localhost:3017";
const TERM = "term=Fall%202026";

const checks = [
  ["dash-loading-skeleton", "/lab/admin/dashboard?"+TERM+"&variant=A&state=loading",
    "() => !!(document.querySelector('[data-loading],[aria-busy]'))"],
  ["dash-error-card", "/lab/admin/dashboard?"+TERM+"&variant=A&state=error",
    "() => !!(document.querySelector('[data-region=card-error]'))"],
  ["dash-empty-text", "/lab/admin/dashboard?"+TERM+"&variant=A&state=empty",
    "() => (document.body.innerText||'').includes('No students')"],
  ["lib-loading-skeleton", "/lab/admin/skills-library?"+TERM+"&state=loading",
    "() => !!(document.querySelector('[data-loading]'))"],
  ["lib-error-banner", "/lab/admin/skills-library?"+TERM+"&state=error",
    "() => (document.body.innerText||'').includes('did not load')"],
  ["lib-empty-block", "/lab/admin/skills-library?"+TERM+"&state=empty",
    "() => !!(document.querySelector('[data-region=empty]'))"],
  ["drill-drill-attr", "/lab/admin/dashboard-drill?"+TERM+"&list=students&cond=behind",
    "() => !!(document.querySelector('[data-drill]'))"],
  ["import-A-dropzone", "/lab/admin/import-ai-review?"+TERM+"&variant=A",
    "() => !!(document.querySelector('[data-dropzone]'))"],
  ["cfg-loading", "/lab/admin/configure-skill?"+TERM+"&variant=A",
    "() => !!(document.querySelector('[aria-busy]')) || (document.body.innerText||'').length > 100"],
  ["eval-A-form", "/lab/evaluator/evaluation-form?"+TERM+"&variant=A",
    "() => (document.body.innerText||'').length > 200"],
  ["reviewer-error-branch", "/lab/reviewer/review-item?"+TERM+"&variant=A",
    "() => (document.body.innerText||'').length > 200"],
  ["director-dash-A", "/lab/director/dashboard?"+TERM+"&variant=A",
    "() => (document.body.innerText||'').length > 200"],
];

const run = async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext();
  for (const [name, path, checkSrc] of checks) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message.slice(0,60)));
    try {
      await page.goto(BASE+path, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(600);
      const fn = new Function('return ('+checkSrc+')');
      const result = await page.evaluate(fn());
      const flag = errs.length ? ' JS-ERR:'+errs[0] : '';
      console.log((result ? 'PASS' : 'FAIL')+' '+name+flag);
    } catch(e) {
      console.log('ERR  '+name+' '+e.message.slice(0,50));
    }
    await page.close();
  }
  await b.close();
};
run().catch(e => { console.error(e.message); process.exit(1); });
