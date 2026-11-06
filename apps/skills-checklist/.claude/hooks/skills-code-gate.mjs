#!/usr/bin/env node
// PreToolUse(Write|Edit): block product code under apps/skills-checklist/{admin,student} until a design contract allows it.
// A file that belongs to a page in docs/build/contracts/_page-registry.json needs that page's contract, confirmed (no _draft- prefix)
// and complete (skills-contract-check.mjs). Any other code file needs at least one confirmed contract to exist, as before, so older
// contracts are not blocked until their page is registered and being changed. Docs and .claude edits are always allowed.
// The app root comes from the edited file's own path, not this script's location, so worktree edits are gated against their own docs.
import fs from 'node:fs';
import path from 'node:path';
import { entriesForFile, pageErrors, readRegistry } from './skills-contract-check.mjs';

let raw = ''; try { raw = fs.readFileSync(0, 'utf8'); } catch {}
let fp = ''; try { fp = JSON.parse(raw).tool_input?.file_path || ''; } catch {}
const m = fp.match(/^(.*\/apps\/skills-checklist)\/(admin|student)\//);
if (!m || !/\.(tsx?|jsx?|css)$/.test(fp)) process.exit(0);
const ROOT = m[1];
const rel = path.relative(ROOT, fp);

let registry;
try { registry = readRegistry(ROOT); } catch (e) {
  console.error(`BLOCKED: docs/build/contracts/_page-registry.json does not parse: ${e.message}`);
  process.exit(2);
}
const pages = entriesForFile(registry, rel);
if (pages.length) {
  const failures = pages.map((p) => ({ p, errs: pageErrors(ROOT, p) })).filter((x) => x.errs.length);
  if (!failures.length) process.exit(0);
  const lines = failures.flatMap(({ p, errs }) => [`${p.id} ${p.page} (docs/build/contracts/${p.contract}):`, ...errs.map((e) => `  - ${e}`)]);
  console.error(`BLOCKED: ${rel} belongs to a page whose contract is not valid.\n${lines.join('\n')}\nFill docs/build/02-design-contract-template.md, get Romit's confirmation, then edit code. Check with: node .claude/hooks/skills-contract-check.mjs <contract>`);
  process.exit(2);
}

const dir = path.join(ROOT, 'docs', 'build', 'contracts');
const has = fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith('.md') && !f.startsWith('_'));
if (has) process.exit(0);
console.error(`BLOCKED: no design contract in docs/build/contracts/. Use the skills-surface-contract skill, fill docs/build/02-design-contract-template.md, get Romit's confirmation, then edit code. (${rel})`);
process.exit(2);
