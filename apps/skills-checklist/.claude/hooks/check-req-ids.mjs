#!/usr/bin/env node
// Anti-hallucination guard for the Skills Checklist doc pack.
//
// Modes
//   node check-req-ids.mjs               -> scan all docs/**/*.md (excluding docs/source), exit 1 on unknown IDs
//   node check-req-ids.mjs --count       -> traceability coverage: every REQ ID present? status tallies
//   node check-req-ids.mjs <file...>     -> scan given files
//   (hook)  PostToolUse JSON on stdin    -> scan the edited file if it is under docs/ ; exit 2 + stderr on unknown IDs
//
// Valid IDs   = IDs that appear as a standalone table-cell line in docs/source/requirements.extracted.txt
// Allowed IDs = docs/source/proposed-ids.txt (IDs we proposed ourselves, e.g. OD-14+) — never treated as REQ.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOCS = path.join(ROOT, 'docs');
const ID_RE = /\b(SL|IM|SC|CM|ST|EV|AR|RV|SH|RP|AE|OD)-(\d{2})\b/g;

const read = (p) => fs.readFileSync(p, 'utf8');
const srcPath = path.join(DOCS, 'source', 'requirements.extracted.txt');
if (!fs.existsSync(srcPath)) { console.error('missing', srcPath); process.exit(0); }

const valid = new Set();
for (const line of read(srcPath).split('\n')) {
  const m = line.replace(/^\s*\d+\t/, '').trim().match(/^((SL|IM|SC|CM|ST|EV|AR|RV|SH|RP|AE|OD)-\d{2})$/);
  if (m) valid.add(m[1]);
}
const propPath = path.join(DOCS, 'source', 'proposed-ids.txt');
const proposed = new Set(fs.existsSync(propPath) ? read(propPath).split(/\s+/).filter(Boolean) : []);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'source') walk(p, out); }
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function scan(files) {
  const bad = [];
  for (const f of files) {
    read(f).split('\n').forEach((line, i) => {
      for (const m of line.matchAll(ID_RE)) {
        const id = `${m[1]}-${m[2]}`;
        if (!valid.has(id) && !proposed.has(id)) bad.push(`${path.relative(ROOT, f)}:${i + 1}  ${id}`);
      }
    });
  }
  return bad;
}

function count() {
  const f = path.join(DOCS, 'strategy', '04-requirements-traceability.md');
  const txt = read(f);
  const seen = new Map();
  const tally = { '✅': 0, '🟡': 0, '⚪': 0, '❌': 0, '⚠️': 0, '❓': 0 };
  for (const line of txt.split('\n')) {
    const cells = line.split('|').map((s) => s.trim());
    const id = cells[1];
    if (!/^(SL|IM|SC|CM|ST|EV|AR|RV|SH|RP|AE)-\d{2}$/.test(id || '')) continue;
    const status = cells.find((c, i) => i > 1 && /^(✅|🟡|⚪|❌|⚠️|❓)/.test(c));
    seen.set(id, status);
    if (status) tally[status.slice(0, status.startsWith('⚠') ? 2 : 1 + (status.codePointAt(0) > 0xffff ? 1 : 0))]++;
  }
  const reqIds = [...valid].filter((i) => !i.startsWith('OD-'));
  const missing = reqIds.filter((i) => !seen.has(i));
  console.log('REQ ids in source :', reqIds.length);
  console.log('rows in matrix    :', seen.size);
  console.log('missing from matrix:', missing.length ? missing.join(', ') : 'none');
  console.log('status tally      :', JSON.stringify(tally));
  process.exit(missing.length ? 1 : 0);
}

const args = process.argv.slice(2);
if (args.includes('--count')) count();

let files;
if (args.length) files = args.map((a) => path.resolve(a));
else if (!process.stdin.isTTY) {
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch {}
  let fp = '';
  try { const j = JSON.parse(raw || '{}'); fp = j.tool_input?.file_path || j.tool_response?.filePath || ''; } catch {}
  if (fp && fp.startsWith(DOCS) && fp.endsWith('.md') && !fp.startsWith(path.join(DOCS, 'source'))) files = [fp];
  else if (fp) process.exit(0);
}
if (!files) files = walk(DOCS);

const bad = scan(files.filter((f) => fs.existsSync(f)));
if (bad.length) {
  const hook = !process.stdin.isTTY && !args.length;
  console[hook ? 'error' : 'log'](
    `UNKNOWN requirement IDs (not in docs/source/requirements.extracted.txt nor proposed-ids.txt):\n  ` + bad.join('\n  ') +
    `\nFix: correct the ID, or if it is YOUR proposal add it to docs/source/proposed-ids.txt and label it [INFER].`
  );
  process.exit(hook ? 2 : 1);
}
if (!process.stdin.isTTY && !args.length) process.exit(0);
console.log(`OK — ${files.length} file(s), all requirement IDs resolve.`);
