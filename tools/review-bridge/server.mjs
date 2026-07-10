#!/usr/bin/env node
/**
 * review-bridge — local companion server for the in-app DevReviewHUD.
 *
 * The browser HUD detects WCAG + DS issues on whatever page you're on and POSTs
 * them here. For each issue this spawns HEADLESS CLAUDE CODE (Sonnet 4.6), which
 * already understands the whole monorepo + the Exxat DS + CLAUDE.md rules, to
 * locate the source component and fix it minimally. Edits land on disk → Vite
 * HMR reloads → you watch the fix get solved live in the browser.
 *
 * Product-agnostic: one bridge serves every app/product in the monorepo. The
 * HUD passes its own product path; Claude edits the right files.
 *
 * Run (from anywhere):   node tools/review-bridge/server.mjs
 * Local-only by design — never deploy this.
 *
 *   GET  /health        → { ok, model }
 *   POST /fix           → NDJSON stream of { phase, ... } events
 *
 * Node built-ins only; no install step.
 */

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');           // monorepo root (/Users/.../Work)
const PORT = Number(process.env.REVIEW_BRIDGE_PORT || 7331);
const MODEL = process.env.REVIEW_BRIDGE_MODEL || 'claude-sonnet-4-6';
const MAX_ISSUES = 10;
const PER_ISSUE_TIMEOUT = 1000 * 60 * 4;               // 4 min/issue

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function buildPrompt(issue, ctx) {
  const lines = [
    `An automated UI reviewer flagged an issue on a live page. Fix the SOURCE that renders it.`,
    ``,
    `Product: ${ctx.product || '(unknown — locate it in the monorepo)'}`,
    `Route: ${ctx.route || '(unknown)'}`,
    `Category: ${issue.kind === 'wcag' ? 'WCAG / accessibility' : 'Design-system conformance'}`,
    `Rule: ${issue.rule}`,
    `Problem: ${issue.detail || ''}`,
    issue.component ? `DS reference: ${issue.component}` : '',
    `Offending selector: ${issue.selector || '(n/a)'}`,
    issue.html ? `Offending markup:\n${issue.html}` : '',
    issue.suggestion ? `Suggested fix: ${issue.suggestion}` : '',
    ``,
    `Instructions:`,
    `- Find the source component/file that renders this element.`,
    `- Make the MINIMAL change needed to resolve only this issue.`,
    `- Follow the Exxat DS rules in CLAUDE.md (DS components, var(--token) colors, no raw <button>, 12px text floor, aria on icons).`,
    `- Do not refactor unrelated code. Do not run the dev server or git commands.`,
    `- End with one line: "FIXED <relative/file/path> — <what changed>" (or "SKIPPED — <reason>" if no safe fix).`,
  ];
  return lines.filter(Boolean).join('\n');
}

function runClaude(prompt) {
  return new Promise((res) => {
    const args = [
      '-p', prompt,
      '--model', MODEL,
      '--permission-mode', 'acceptEdits',
      '--output-format', 'json',
      '--add-dir', ROOT,
    ];
    const child = spawn('claude', args, { cwd: ROOT, env: process.env });
    let out = '', err = '';
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, PER_ISSUE_TIMEOUT);
    child.stdout.on('data', d => (out += d));
    child.stderr.on('data', d => (err += d));
    child.on('error', e => { clearTimeout(timer); res({ ok: false, summary: '', error: String(e) }); });
    child.on('close', () => {
      clearTimeout(timer);
      // --output-format json → a single JSON object with a `result` text field.
      let text = out.trim();
      try {
        const parsed = JSON.parse(out);
        text = (parsed.result ?? parsed.text ?? '').toString();
      } catch { /* keep raw */ }
      const m = text.match(/FIXED\s+(\S+)\s+—\s+(.+)/i) || text.match(/FIXED\s+(\S+)\s+-\s+(.+)/i);
      const skipped = /^\s*SKIPPED/im.test(text);
      const skipMsg = text.match(/SKIPPED\s*[—-]?\s*(.+)/i);
      res({
        ok: !!m && !skipped,
        skipped,
        file: m ? m[1] : undefined,
        summary: skipped ? (skipMsg ? skipMsg[1].trim() : 'already conformant') : (m ? m[2].trim() : (text.split('\n').filter(Boolean).pop() || '').slice(0, 200)),
        error: err && !m && !skipped ? err.slice(0, 300) : undefined,
      });
    });
  });
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, model: MODEL, root: ROOT }));
  }

  if (req.method === 'POST' && req.url === '/fix') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', async () => {
      let payload;
      try { payload = JSON.parse(body); } catch { res.writeHead(400, CORS); return res.end('bad json'); }
      const ctx = { product: payload.product, route: payload.route };
      const issues = Array.isArray(payload.issues) ? payload.issues.slice(0, MAX_ISSUES) : [];

      res.writeHead(200, { ...CORS, 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache' });
      const emit = (o) => res.write(JSON.stringify(o) + '\n');

      emit({ phase: 'start', total: issues.length, model: MODEL });
      for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        const id = issue.id ?? `${issue.kind}:${issue.rule}:${issue.selector}`;
        emit({ phase: 'locating', id, index: i });
        emit({ phase: 'fixing', id, index: i });
        try {
          const r = await runClaude(buildPrompt(issue, ctx));
          emit({ phase: r.skipped ? 'skipped' : r.ok ? 'fixed' : 'failed', id, index: i, file: r.file, summary: r.summary, error: r.error });
        } catch (e) {
          emit({ phase: 'failed', id, index: i, error: String(e) });
        }
      }
      emit({ phase: 'done' });
      res.end();
    });
    return;
  }

  res.writeHead(404, CORS);
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`review-bridge listening on http://127.0.0.1:${PORT}`);
  console.log(`  model: ${MODEL}`);
  console.log(`  root:  ${ROOT}`);
  console.log(`  POST /fix to apply Sonnet fixes; GET /health to check.`);
});
