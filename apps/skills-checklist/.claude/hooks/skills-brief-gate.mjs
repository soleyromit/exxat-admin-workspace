#!/usr/bin/env node
// PreToolUse(Write|Edit|MultiEdit): block Skills Checklist app code edits until docs/knowledge/00-design-brief.md
// has been read in the last 6 hours (stamp written by skills-brief-mark.mjs). Subagents share the stamp, so brief them to read it.
// Bypass for a deliberate non-design change: SKILLS_BRIEF_GATE=off.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
if (process.env.SKILLS_BRIEF_GATE === 'off') process.exit(0);
let fp = ''; try { fp = JSON.parse(fs.readFileSync(0, 'utf8')).tool_input?.file_path || ''; } catch {}
const inApp = /\/apps\/skills-checklist\/(admin|student)\/(components|lib|app)\//.test(fp) && /\.(tsx?|css)$/.test(fp) && !/\.test\.tsx?$/.test(fp);
if (!inApp) process.exit(0);
let fresh = false;
try { fresh = Date.now() - Number(fs.readFileSync(path.join(os.tmpdir(), 'skills-checklist-brief-read.stamp'), 'utf8')) < 6 * 3600 * 1000; } catch {}
if (fresh) process.exit(0);
console.error('BLOCKED: read apps/skills-checklist/docs/knowledge/00-design-brief.md (then glossary.md and 02-decisions-ledger.md) before editing Skills Checklist app code, and state that you consulted them. Skill: skills-design-brief.');
process.exit(2);
