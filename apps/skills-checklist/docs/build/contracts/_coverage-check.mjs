#!/usr/bin/env node
// CONTRACT-DOC coverage only: it reads the contract markdown and never the vitest files. For real test-level coverage run
// `pnpm coverage:req` in apps/skills-checklist/admin (scripts/req-test-coverage.mjs).
// Reports, per draft contract, every requirement ID listed in its "Requirements" section (§5) that has no
// mention in its "Acceptance tests" section (§15). A mention may be a test row or an explicit "tested in S-xx".
// Usage: node docs/build/contracts/_coverage-check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const ID = /\b(SL|IM|SC|CM|ST|EV|AR|RV|SH|RP|AE)-(\d{2})\b/g;
const section = (txt, n) => {
  const m = txt.match(new RegExp(`^## ${n}\\. .*$`, 'm'));
  if (!m) return '';
  const rest = txt.slice(m.index + m[0].length);
  const e = rest.search(/^## \d+\. /m);
  return e < 0 ? rest : rest.slice(0, e);
};
let total = 0, uncovered = 0;
for (const f of fs.readdirSync(dir).filter((x) => /^(_draft-)?S-.*\.md$/.test(x)).sort()) {
  const t = fs.readFileSync(path.join(dir, f), 'utf8');
  const req = new Set([...section(t, 5).matchAll(ID)].map((m) => m[0]));
  const tests = section(t, 15);
  const miss = [...req].filter((id) => !new RegExp(`\\b${id}\\b`).test(tests));
  total += req.size; uncovered += miss.length;
  console.log(`${f.replace(/^_draft-/, '').replace('.md', '').padEnd(44)} ids=${String(req.size).padStart(2)} uncovered=${miss.length}${miss.length ? '  -> ' + miss.join(', ') : ''}`);
}
console.log(`TOTAL ids=${total} uncovered=${uncovered}`);
process.exit(uncovered ? 1 : 0);
