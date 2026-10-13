#!/usr/bin/env node
// PreToolUse(Write|Edit): block product code under apps/skills-checklist/{admin,student} until at least one
// confirmed design contract exists in docs/build/contracts/. Docs and .claude edits are always allowed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
let raw = ''; try { raw = fs.readFileSync(0, 'utf8'); } catch {}
let fp = ''; try { fp = JSON.parse(raw).tool_input?.file_path || ''; } catch {}
const inApp = ['admin', 'student'].some((d) => fp.startsWith(path.join(ROOT, d) + path.sep));
if (!inApp || !/\.(tsx?|jsx?|css)$/.test(fp)) process.exit(0);
const dir = path.join(ROOT, 'docs', 'build', 'contracts');
const has = fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith('.md') && !f.startsWith('_'));
if (has) process.exit(0);
console.error(`BLOCKED: no design contract in docs/build/contracts/. Use the skills-surface-contract skill, fill docs/build/02-design-contract-template.md, get Romit's confirmation, then edit code. (${path.relative(ROOT, fp)})`);
process.exit(2);
