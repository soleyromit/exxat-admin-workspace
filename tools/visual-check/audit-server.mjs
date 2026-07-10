#!/usr/bin/env node
/**
 * audit-server — exhaustive, parallel, auto-fixing review with a LIVE dashboard.
 *
 * Runs as a background agent (separate tab, never blocks your work):
 *   1. Crawls every route of a product with Playwright.
 *   2. Runs axe-core (WCAG) + an in-DOM DS conformance scan on each page.
 *   3. Screenshots each route; captures DS-reference shots from localhost:4000.
 *   4. (autofix) Spawns headless Claude Code (Sonnet 4.6) to fix each gap and
 *      re-screenshots the route so you see before → after.
 *   5. Streams all progress over SSE to a live dashboard at http://127.0.0.1:7332
 *
 * Local-only. Lives in tools/visual-check because Playwright + chromium are here.
 *
 * Run:   node tools/visual-check/audit-server.mjs
 * Then open http://127.0.0.1:7332 and click "Start audit".
 */

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const PORT = Number(process.env.AUDIT_PORT || 7332);
const MODEL = process.env.AUDIT_MODEL || 'claude-sonnet-4-6';
const SHOT_DIR = '/tmp/visual-check/audit';
await mkdir(SHOT_DIR, { recursive: true });

// ── Product manifests (extend for other apps) ────────────────────────────────
const PRODUCTS = {
  'assessment-taker': {
    product: 'apps/exam-management/assessment-taker',
    baseUrl: process.env.AUDIT_BASE || 'http://localhost:5174',
    routes: [
      '/', '/exam/exam-active-001/setup', '/exam/exam-active-001/submitted',
      '/exam/exam-active-001/results', '/competency', '/history',
      '/resources', '/settings', '/help',
    ],
  },
};
const DS_VIEWER = process.env.DS_VIEWER || 'http://localhost:4000';

// ── In-page DS conformance scan (serialized; runs in the browser) ─────────────
const DS_SCAN = `() => {
  const issues = []; const seen = new Set();
  const sel = (el) => { const t = el.tagName.toLowerCase(); const id = el.id?('#'+el.id):'';
    const c = (typeof el.className==='string'&&el.className)?'.'+el.className.trim().split(/\\s+/).slice(0,2).join('.'):''; return (t+id+c).slice(0,60); };
  const push = (rule, detail, el) => { if (el.closest('[data-dev-hud]')) return; const target = sel(el);
    const k = rule+'|'+target; if (seen.has(k)) return; seen.add(k); issues.push({ kind:'ds', rule, detail, selector: target, html: el.outerHTML.slice(0,200) }); };
  document.querySelectorAll('button').forEach(el => { if (!el.className || (typeof el.className==='string'&&!el.className.trim())) push('raw-button','Unstyled <button> — use DS Button',el); });
  document.querySelectorAll('[style]').forEach(el => { const s = el.getAttribute('style')||'';
    if (/#[0-9a-fA-F]{3,8}\\b/.test(s) || /\\brg(b|ba)\\(/.test(s)) push('hardcoded-color','Hex/rgb in inline style — use var(--token)',el);
    if (s.includes('color-mix(in oklch')) push('banned-color-mix','color-mix(in oklch) banned',el); });
  document.querySelectorAll('*').forEach(el => { if (!el.textContent||!el.textContent.trim()||el.children.length) return;
    const fs = parseFloat(getComputedStyle(el).fontSize); if (fs && fs < 11.5) push('sub-12px-text','Text at '+fs.toFixed(1)+'px — DS min 12px',el); });
  document.querySelectorAll('[class]').forEach(el => { const c = typeof el.className==='string'?el.className:'';
    if (/\\buppercase\\b/.test(c) && /\\btracking-wide\\b/.test(c)) push('banned-uppercase-tracking','uppercase + tracking-wide banned',el); });
  return issues;
}`;

const DS_META = {
  'raw-button': { component: 'Button', ds: '@exxatdesignux/ui', suggestion: 'Use DS Button with variant + size' },
  'hardcoded-color': { component: 'Design tokens', ds: '@exxatdesignux/ui/globals.css', suggestion: 'Replace hex/rgb with var(--token)' },
  'banned-color-mix': { component: 'Active state', ds: 'design-anti-patterns.md', suggestion: 'Use --muted / --border-control-3' },
  'sub-12px-text': { component: 'Typography', ds: 'DS typography — 12px floor', suggestion: 'Use ≥12px' },
  'banned-uppercase-tracking': { component: 'Label', ds: 'design-anti-patterns.md', suggestion: 'Sentence-case label' },
};

// ── SSE plumbing ──────────────────────────────────────────────────────────────
const clients = new Set();
function broadcast(obj) { const line = `data: ${JSON.stringify(obj)}\n\n`; for (const c of clients) { try { c.write(line); } catch {} } }

// ── Claude fix ────────────────────────────────────────────────────────────────
function fixIssue(issue, ctx) {
  return new Promise((res) => {
    const meta = issue.kind === 'ds' ? DS_META[issue.rule] : null;
    const prompt = [
      `An automated reviewer flagged an issue on a live page. Fix the SOURCE that renders it.`,
      `Product: ${ctx.product}`, `Route: ${ctx.route}`,
      `Category: ${issue.kind === 'wcag' ? 'WCAG/accessibility' : 'DS conformance'}`,
      `Rule: ${issue.rule}`, `Problem: ${issue.detail || issue.help || ''}`,
      meta ? `DS reference: ${meta.component} (${meta.ds})` : '',
      `Selector: ${issue.selector || ''}`, issue.html ? `Markup:\n${issue.html}` : '',
      (meta?.suggestion || issue.summary) ? `Fix hint: ${meta?.suggestion || issue.summary}` : '',
      ``,
      `Find the source file, make the MINIMAL fix, follow CLAUDE.md DS rules, no unrelated changes,`,
      `no dev server / git. End with one line: "FIXED <relative/path> — <what>" or "SKIPPED — <reason>".`,
    ].filter(Boolean).join('\n');
    const child = spawn('claude', ['-p', prompt, '--model', MODEL, '--permission-mode', 'acceptEdits', '--add-dir', ROOT, '--output-format', 'json'], { cwd: ROOT, env: process.env });
    let out = ''; const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 1000 * 60 * 4);
    child.stdout.on('data', d => out += d);
    child.on('error', e => { clearTimeout(timer); res({ ok: false, summary: String(e) }); });
    child.on('close', () => { clearTimeout(timer); let text = out.trim();
      try { text = (JSON.parse(out).result ?? '').toString(); } catch {}
      const m = text.match(/FIXED\s+(\S+)\s+[—-]\s+(.+)/i);
      const skipped = /^\s*SKIPPED/im.test(text);
      const skipMsg = text.match(/SKIPPED\s*[—-]?\s*(.+)/i);
      res({ ok: !!m && !skipped, skipped, file: m?.[1], summary: skipped ? (skipMsg ? skipMsg[1].trim() : 'already conformant') : (m ? m[2].trim() : text.split('\n').filter(Boolean).pop()?.slice(0, 160)) });
    });
  });
}

// ── Audit run ─────────────────────────────────────────────────────────────────
let RUNNING = false;
async function runAudit({ productKey = 'assessment-taker', autofix = false, runId }) {
  if (RUNNING) { broadcast({ type: 'log', msg: 'audit already running' }); return; }
  RUNNING = true;
  const cfg = PRODUCTS[productKey];
  const dir = join(SHOT_DIR, runId); await mkdir(dir, { recursive: true });
  const totals = { routes: cfg.routes.length, scanned: 0, found: 0, fixed: 0, failed: 0, skipped: 0 };
  broadcast({ type: 'run-start', product: cfg.product, baseUrl: cfg.baseUrl, routes: cfg.routes, autofix, model: MODEL });

  const browser = await chromium.launch();
  try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // DS reference screenshots from localhost:4000 (best-effort)
  try {
    await page.goto(DS_VIEWER, { waitUntil: 'domcontentloaded', timeout: 4000 });
    const f = `ds-viewer.png`; await page.screenshot({ path: join(dir, f) });
    broadcast({ type: 'ds-shot', label: 'DS library (localhost:4000)', shot: `${runId}/${f}` });
  } catch { broadcast({ type: 'log', msg: 'DS viewer (localhost:4000) not reachable — skipped DS screenshots' }); }

  for (const route of cfg.routes) {
    broadcast({ type: 'route-start', route });
    let axeIssues = [], dsIssues = [], shot = '';
    try {
      await page.goto(cfg.baseUrl + route, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(500);
      const safe = route.replace(/[^a-z0-9]+/gi, '_') || 'root';
      shot = `${runId}/${safe}.png`; await page.screenshot({ path: join(dir, `${safe}.png`) });
      const axe = await new AxeBuilder({ page }).exclude('[data-dev-hud]').analyze();
      axeIssues = axe.violations.map(v => ({ kind: 'wcag', id: 'wcag:' + v.id, rule: v.id, impact: v.impact, detail: v.help, selector: v.nodes[0]?.target?.join(' '), html: v.nodes[0]?.html, summary: v.nodes[0]?.failureSummary, count: v.nodes.length }));
      dsIssues = ((await page.evaluate(DS_SCAN)) || []).map((d, i) => ({ ...d, id: 'ds:' + d.rule + ':' + i, ...(DS_META[d.rule] || {}) }));
    } catch (e) { broadcast({ type: 'log', msg: `route ${route} failed: ${String(e).slice(0, 120)}` }); }

    totals.found += axeIssues.length + dsIssues.length; totals.scanned++;
    broadcast({ type: 'route-issues', route, shot, axe: axeIssues, ds: dsIssues });

    if (autofix) {
      for (const issue of [...axeIssues, ...dsIssues]) {
        broadcast({ type: 'fix-start', route, id: issue.id });
        const r = await fixIssue(issue, { product: cfg.product, route });
        if (r.skipped) totals.skipped++; else if (r.ok) totals.fixed++; else totals.failed++;
        broadcast({ type: 'fix-done', route, id: issue.id, ok: r.ok, skipped: r.skipped, file: r.file, summary: r.summary });
      }
      // re-screenshot after fixes (HMR should have reloaded source)
      try { await page.waitForTimeout(1200); await page.reload({ waitUntil: 'networkidle' });
        const safe = route.replace(/[^a-z0-9]+/gi, '_') || 'root';
        const after = `${runId}/${safe}_after.png`; await page.screenshot({ path: join(dir, `${safe}_after.png`) });
        broadcast({ type: 'route-after', route, shot: after });
      } catch {}
    }
    broadcast({ type: 'route-done', route, totals: { ...totals } });
  }

  } finally {
    // Always close the browser — without this, any throw in the scan/autofix
    // path above orphans the Chromium process (the recurring CPU leak).
    await browser.close();
  }
  broadcast({ type: 'run-done', totals });
  RUNNING = false;
}

// ── Dashboard HTML ────────────────────────────────────────────────────────────
const DASHBOARD = `<!doctype html><html><head><meta charset="utf-8"><title>Live Review Audit</title>
<style>
  :root{--bg:#fafafa;--card:#fff;--bd:#e6e6e6;--mut:#6b7280;--fg:#111;--brand:#c026a6;--ok:#16a34a;--warn:#b45309;--bad:#dc2626}
  *{box-sizing:border-box} body{margin:0;font:13px/1.45 system-ui;background:var(--bg);color:var(--fg)}
  header{position:sticky;top:0;background:var(--card);border-bottom:1px solid var(--bd);padding:12px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;z-index:5}
  h1{font-size:15px;margin:0;font-weight:700} .sub{color:var(--mut);font-size:12px}
  button{font:inherit;font-weight:600;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;background:var(--brand);color:#fff}
  button:disabled{opacity:.5;cursor:default}
  label{font-size:12px;color:var(--mut);display:flex;align-items:center;gap:5px}
  .totals{margin-left:auto;display:flex;gap:14px;font-size:12px} .totals b{font-size:15px}
  .wrap{padding:16px 18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:14px}
  .route{background:var(--card);border:1px solid var(--bd);border-radius:12px;overflow:hidden}
  .route h2{font-size:13px;margin:0;padding:10px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px}
  .route h2 .c{margin-left:auto;font-size:11px;color:var(--mut)}
  .shots{display:flex;gap:6px;padding:8px 10px;background:#f3f4f6}
  .shots figure{margin:0;flex:1} .shots img{width:100%;border:1px solid var(--bd);border-radius:6px;display:block}
  .shots figcaption{font-size:10px;color:var(--mut);text-align:center;margin-top:3px}
  .issues{padding:6px 10px 10px;display:flex;flex-direction:column;gap:5px;max-height:280px;overflow:auto}
  .iss{border-left:2.5px solid var(--warn);padding-left:8px}
  .iss.wcag{border-color:#dc2626}.iss .tag{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em}
  .iss .t{font-size:12px}.iss .sel{font-size:10px;color:var(--mut);word-break:break-all}
  .iss code{background:#f3f4f6;border-radius:4px;padding:0 3px;font-size:10.5px}
  .chip{font-size:9.5px;font-weight:700;border-radius:999px;padding:1px 7px;margin-left:6px}
  .chip.fixing{background:#fce7f6;color:var(--brand)}.chip.fixed{background:#dcfce7;color:var(--ok)}.chip.failed{background:#fee2e2;color:var(--bad)}.chip.skipped{background:#f3f4f6;color:var(--mut)}
  .dsrefs{padding:0 18px} .dsrefs img{max-width:280px;border:1px solid var(--bd);border-radius:8px}
  #log{padding:6px 18px;color:var(--mut);font-size:11px}
</style></head><body>
<header>
  <div><h1>Live Review Audit</h1><div class="sub" id="status">idle — start an audit</div></div>
  <label><input type="checkbox" id="autofix"> auto-fix with Sonnet</label>
  <button id="start">Start audit</button>
  <div class="totals">
    <span>scanned <b id="t-scan">0</b>/<span id="t-routes">0</span></span>
    <span>found <b id="t-found">0</b></span>
    <span style="color:var(--ok)">fixed <b id="t-fixed">0</b></span>
    <span style="color:var(--mut)">already ok <b id="t-skipped">0</b></span>
    <span style="color:var(--bad)">failed <b id="t-failed">0</b></span>
  </div>
</header>
<div id="log"></div>
<div class="dsrefs" id="dsrefs"></div>
<div class="wrap" id="wrap"></div>
<script>
const SHOT = (p) => '/shot/' + p;
const routes = {}; let auto = false;
const $ = (id) => document.getElementById(id);
function setTotals(t){ if(!t) return; $('t-scan').textContent=t.scanned; $('t-found').textContent=t.found; $('t-fixed').textContent=t.fixed; $('t-failed').textContent=t.failed; if($('t-skipped'))$('t-skipped').textContent=t.skipped||0; }
function routeCard(route){
  if(routes[route]) return routes[route];
  const el = document.createElement('div'); el.className='route';
  el.innerHTML = '<h2><span>'+route+'</span><span class="c">scanning…</span></h2><div class="shots"></div><div class="issues"></div>';
  $('wrap').appendChild(el); routes[route]={el, issues:{}}; return routes[route];
}
function issEl(c, iss){
  const d = document.createElement('div'); d.className='iss '+iss.kind; d.id='iss-'+btoa(iss.id).replace(/=/g,'');
  d.innerHTML = '<div><span class="tag" style="color:'+(iss.kind==='wcag'?'#dc2626':'#b45309')+'">'+(iss.impact||iss.rule)+'</span>'
    + '<span class="state"></span></div><div class="t">'+(iss.detail||'')+(iss.component?' · <b>'+iss.component+'</b> '+(iss.ds||''):'')+'</div>'
    + (iss.html?'<div><code>'+iss.html.replace(/</g,'&lt;').slice(0,140)+'</code></div>':'')
    + '<div class="sel">'+(iss.selector||'')+'</div>';
  c.issues.el.appendChild(d); return d;
}
const es = new EventSource('/events');
es.onmessage = (e) => {
  const ev = JSON.parse(e.data);
  if(ev.type==='run-start'){ $('status').textContent = ev.product+' — '+ev.routes.length+' routes'+(ev.autofix?' · auto-fixing with '+ev.model:' · detect only'); $('t-routes').textContent=ev.routes.length; $('start').disabled=true; }
  if(ev.type==='log'){ $('log').textContent = ev.msg; }
  if(ev.type==='ds-shot'){ $('dsrefs').innerHTML += '<figure><img src="'+SHOT(ev.shot)+'"><figcaption>'+ev.label+'</figcaption></figure>'; }
  if(ev.type==='route-start'){ const c=routeCard(ev.route); }
  if(ev.type==='route-issues'){ const c=routeCard(ev.route); c.issues={el:c.el.querySelector('.issues')};
    c.el.querySelector('.shots').innerHTML = ev.shot?'<figure><img src="'+SHOT(ev.shot)+'"><figcaption>before</figcaption></figure>':'';
    c.el.querySelector('.c').textContent=(ev.axe.length+ev.ds.length)+' issues';
    [...ev.axe, ...ev.ds].forEach(iss => issEl(c, iss)); }
  if(ev.type==='fix-start'){ const c=routes[ev.route]; const d=c&&document.getElementById('iss-'+btoa(ev.id).replace(/=/g,'')); if(d) d.querySelector('.state').innerHTML='<span class="chip fixing">Opus fixing…</span>'; }
  if(ev.type==='fix-done'){ const c=routes[ev.route]; const d=c&&document.getElementById('iss-'+btoa(ev.id).replace(/=/g,'')); if(d){ const cls=ev.skipped?'skipped':ev.ok?'fixed':'failed'; const lbl=ev.skipped?'already ok':ev.ok?'fixed ✓':'failed'; d.querySelector('.state').innerHTML='<span class="chip '+cls+'">'+lbl+'</span>'+(ev.ok&&ev.file?' <span class="sel">→ '+ev.file+'</span>':''); } }
  if(ev.type==='route-after'){ const c=routes[ev.route]; if(c) c.el.querySelector('.shots').innerHTML += '<figure><img src="'+SHOT(ev.shot)+'"><figcaption>after</figcaption></figure>'; }
  if(ev.type==='route-done'){ const c=routes[ev.route]; if(c) c.el.querySelector('.c').textContent='done'; setTotals(ev.totals); }
  if(ev.type==='run-done'){ $('status').textContent='audit complete'; $('start').disabled=false; setTotals(ev.totals); }
};
$('start').onclick = () => { for(const k in routes) routes[k].el.remove(), delete routes[k]; $('dsrefs').innerHTML='';
  fetch('/start', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ autofix: $('autofix').checked })}); };
</script></body></html>`;

// ── HTTP server ───────────────────────────────────────────────────────────────
// ── Deep DS review (vision): screenshot the page → Sonnet 4.6 reviews the rendered
// result against the DS for layout/component/pattern issues a DOM scan can't see.
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

function runClaudeDeep(shotPath, ctx) {
  return new Promise((res) => {
    const prompt = [
      `Read the screenshot at ${shotPath}. It is the rendered page "${ctx.route}" of product ${ctx.product}.`,
      `Do a DEEP Exxat design-system conformance review (follow the repo CLAUDE.md + that product's docs/patterns).`,
      `Report ONLY what a DOM/token scan cannot see:`,
      `- COMPONENTS: hand-rolled UI where a DS component exists (tables→DataTable, custom dropdowns→Select, raw dialogs→Dialog/Sheet, ad-hoc cards/headers/toolbars/badges).`,
      `- LAYOUT: spacing/alignment/density problems, cramped or unbalanced regions, broken hierarchy or responsive behaviour.`,
      `- PATTERNS: page-header pattern, toolbar/search placement, empty & loading states, card structure, consistency with sibling pages.`,
      `Ignore trivial token/text-size nits — a separate scan handles those. Only report real, defensible issues.`,
      ctx.autofix
        ? `For each issue: find the source and FIX it minimally per DS rules. No unrelated refactors. Do not run the dev server or git.`
        : `For each issue: name the source file and the fix. Do NOT edit anything.`,
      `Output one block per issue and nothing else:`,
      `FINDING: <one line> | <component or pattern>`,
      ctx.autofix ? `FIXED <relative/path> — <what changed>   (or: SKIPPED — <reason>)` : `FIX <relative/path> — <what to change>`,
    ].join('\n');
    const child = spawn('claude', ['-p', prompt, '--model', MODEL, '--permission-mode', 'acceptEdits', '--add-dir', ROOT, '--output-format', 'json'], { cwd: ROOT, env: process.env });
    let out = ''; const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 1000 * 60 * 12);
    child.stdout.on('data', d => (out += d));
    child.on('error', e => { clearTimeout(timer); res({ text: '', error: String(e) }); });
    child.on('close', () => { clearTimeout(timer); let text = out.trim(); try { text = (JSON.parse(out).result ?? '').toString(); } catch {} res({ text }); });
  });
}

async function deepReview({ baseUrl, route, product, autofix }, emit) {
  const dir = join(SHOT_DIR, 'deep'); await mkdir(dir, { recursive: true });
  const safe = ((product || '') + route).replace(/[^a-z0-9]+/gi, '_').slice(0, 80) || 'page';
  const shot = join(dir, safe + '.png');
  emit({ phase: 'capturing', route });
  const browser = await chromium.launch();
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await page.goto((baseUrl || '') + route, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: shot, fullPage: true });
  } finally { await browser.close(); }
  emit({ phase: 'reviewing' });
  const r = await runClaudeDeep(shot, { route, product, autofix });
  const lines = r.text.split('\n');
  let n = 0;
  for (let i = 0; i < lines.length; i++) {
    const f = lines[i].match(/^\s*FINDING:\s*(.+)/i);
    if (!f) continue;
    n++;
    const ahead = lines.slice(i + 1, i + 4).join(' ');
    const fx = ahead.match(/FIXED\s+(\S+)\s+[—-]\s+([^|]+?)(?:\s*$|FINDING)/i);
    const skipped = /\bSKIPPED\b/i.test(ahead);
    emit({ phase: 'finding', index: n, desc: f[1].trim(), fixed: !!fx && !skipped, file: fx ? fx[1] : undefined, summary: fx ? fx[2].trim() : (skipped ? 'skipped' : undefined) });
  }
  emit({ phase: 'done', total: n, error: r.error });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (url.pathname === '/health') { res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: true, model: MODEL, deep: true })); }
  if (req.method === 'POST' && url.pathname === '/deep-review') {
    let body = ''; req.on('data', c => (body += c)); req.on('end', async () => {
      let o = {}; try { o = JSON.parse(body); } catch {}
      res.writeHead(200, { ...CORS, 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache' });
      const emit = (x) => res.write(JSON.stringify(x) + '\n');
      try { await deepReview({ baseUrl: o.baseUrl, route: o.route || '/', product: o.product, autofix: !!o.autofix }, emit); }
      catch (e) { emit({ phase: 'error', error: String(e) }); }
      res.end();
    });
    return;
  }
  if (url.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(DASHBOARD); }
  if (url.pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
  }
  if (url.pathname.startsWith('/shot/')) {
    const f = join(SHOT_DIR, url.pathname.slice('/shot/'.length));
    if (existsSync(f)) { res.writeHead(200, { 'Content-Type': 'image/png' }); return res.end(await readFile(f)); }
    res.writeHead(404); return res.end();
  }
  if (req.method === 'POST' && url.pathname === '/start') {
    let body = ''; req.on('data', c => body += c); req.on('end', () => {
      let opts = {}; try { opts = JSON.parse(body); } catch {}
      const runId = 'run-' + Math.floor(Math.random() * 1e9).toString(36);
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ runId }));
      runAudit({ autofix: !!opts.autofix, productKey: opts.product || 'assessment-taker', runId }).catch(e => broadcast({ type: 'log', msg: 'audit error: ' + String(e) }));
    });
    return;
  }
  res.writeHead(404); res.end();
});
server.listen(PORT, '127.0.0.1', () => {
  console.log(`audit-server → http://127.0.0.1:${PORT}  (open in a separate tab)`);
  console.log(`  model: ${MODEL} · root: ${ROOT}`);
});
