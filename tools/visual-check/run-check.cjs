const { chromium } = require("playwright");
const BASE = "http://localhost:3017";
const TERM = "term=Fall%202026";
const urls = [
  ['/lab/admin/dashboard?'+TERM+'&variant=A&state=loading', 'dash-A-loading'],
  ['/lab/admin/dashboard?'+TERM+'&variant=A&state=empty', 'dash-A-empty'],
  ['/lab/admin/dashboard?'+TERM+'&variant=A&state=error', 'dash-A-error'],
  ['/lab/admin/dashboard?'+TERM+'&variant=A&state=partial', 'dash-A-partial'],
  ['/lab/admin/dashboard?'+TERM+'&variant=A', 'dash-A-default'],
  ['/lab/admin/dashboard?'+TERM+'&variant=B', 'dash-B'],
  ['/lab/admin/dashboard?'+TERM+'&variant=D', 'dash-D'],
  ['/lab/admin/dashboard?'+TERM+'&variant=F', 'dash-F'],
  ['/lab/admin/dashboard-drill?'+TERM+'&list=students', 'drill-students'],
  ['/lab/admin/dashboard-drill?'+TERM+'&list=students&cond=behind', 'drill-behind'],
  ['/lab/admin/skills-library?'+TERM+'&state=loading', 'library-loading'],
  ['/lab/admin/skills-library?'+TERM+'&state=error', 'library-error'],
  ['/lab/admin/skills-library?'+TERM+'&state=empty', 'library-empty'],
  ['/lab/admin/import-ai-review?'+TERM+'&variant=A', 'import-A'],
  ['/lab/admin/import-ai-review?'+TERM+'&variant=B', 'import-B'],
  ['/lab/admin/configure-skill?'+TERM+'&variant=A', 'cfg-A'],
  ['/lab/admin/configure-skill?'+TERM+'&variant=C', 'cfg-C'],
  ['/lab/evaluator/evaluation-form?'+TERM+'&variant=A', 'eval-A'],
  ['/lab/evaluator/evaluation-form?'+TERM+'&variant=B', 'eval-B'],
  ['/lab/student/home?'+TERM+'&variant=A', 'student-home-A'],
  ['/lab/student/log-skill?'+TERM+'&variant=A', 'student-log-A'],
  ['/lab/reviewer/approvals?'+TERM+'&variant=A', 'reviewer-approvals-A'],
  ['/lab/reviewer/review-item?'+TERM+'&variant=A', 'reviewer-review-A'],
  ['/lab/director/dashboard?'+TERM+'&variant=A', 'director-dash-A'],
  ['/lab/director/reports?'+TERM+'&variant=A', 'director-reports-A'],
  ['/lab/admin/attainment?'+TERM+'&variant=A', 'attainment-A'],
  ['/lab/admin/course-mapping?'+TERM+'&variant=A', 'mapping-A'],
  ['/lab/admin/approvals?'+TERM+'&variant=A', 'admin-approvals-A'],
  ['/lab/admin/settings?'+TERM+'&variant=A', 'settings-A'],
  ['/lab/admin/lists-cohorts?'+TERM+'&variant=A', 'cohorts-A'],
];

const run = async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext();
  const results = [];
  for (const [path, label] of urls) {
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", e => errs.push(e.message.slice(0,60)));
    try {
      await page.goto(BASE+path, { waitUntil: "networkidle", timeout: 12000 });
      await page.waitForTimeout(600);
      const info = await page.evaluate(() => {
        const text = ((document.body&&document.body.innerText)||"" ).trim();
        const hasMain = !!(document.querySelector("[data-page-type],[data-dashboard-lab],[data-import-lab]"));
        return { textLen: text.length, hasMain };
      });
      let verdict = "OK";
      if (info.textLen < 50) verdict = "BLANK";
      else if (errs.length) verdict = "JS-ERR";
      results.push({ label, verdict, textLen: info.textLen, hasMain: info.hasMain, err: errs[0] });
    } catch(e) {
      results.push({ label, verdict: "CRASH", err: e.message.slice(0,60) });
    }
    await page.close();
  }
  await b.close();
  const bad = results.filter(r => r.verdict !== "OK");
  console.log("PROBLEMS ("+bad.length+"):");
  bad.forEach(r => console.log(JSON.stringify(r)));
  console.log("");
  console.log("ALL:");
  results.forEach(r => {
    const line = (r.verdict+"         ").slice(0,10)+" "+(r.label+"                         ").slice(0,28)+" len="+r.textLen+(r.hasMain?"":" NO-MAIN")+(r.err?" ERR:"+r.err:"");
    console.log(line);
  });
};
run().catch(e => { console.error(e.message); process.exit(1); });
