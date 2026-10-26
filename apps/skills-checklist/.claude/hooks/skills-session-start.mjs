#!/usr/bin/env node
// SessionStart: put the anti-hallucination contract for the Skills Checklist in front of the model.
// Registered at workspace level too, so stay silent for sessions outside apps/skills-checklist.
import fs from 'node:fs';
let cwd = ''; try { cwd = JSON.parse(fs.readFileSync(0, 'utf8')).cwd || ''; } catch {}
if (cwd && !cwd.includes('/apps/skills-checklist')) process.exit(0);
const ctx = `SKILLS CHECKLIST (Prism Skills Tracking) — read apps/skills-checklist/docs/README.md before any design or code.
DESIGN/UX/COPY/CHART/NAV tasks: first read apps/skills-checklist/docs/knowledge/00-design-brief.md, glossary.md and 02-decisions-ledger.md and state that you consulted them (skill skills-design-brief).
Precedence when sources disagree: REQ (docs/source/requirements.extracted.txt) > CALL (vault raw transcript 2026-09-23) > PROTO (Sankalp prototype) > INFER for BEHAVIOUR. For VISUAL LAYOUT / IA / COPY STRUCTURE the prototype is the exact design to build (Romit 2026-10-08), rendered with DS components inside the DS base shell (left nav with brand header, utility bar, page header); see docs/build/prototype-parity.md.
Tag every claim: [REQ SL-01] [OD-07] [PROTO] [CALL 09-23] [INFER]. Untagged claims are wrong.
Hard stops: no shipped skills/taxonomy · no default evaluation model · unconfigured skills cannot be mapped/submitted · completed evaluations are immutable (further attempt, not edit) · mapping is expectation not eligibility · preceptors have NO login · lab evidence never satisfies a clinical-setting minimum · §14 items (remediation, notifications, expiry, encounter linkage, Evaluations migration) are out of scope · never treat an Open Decision (OD-*) as decided.
Before JSX: fill docs/build/02-design-contract-template.md into docs/build/contracts/<surface>.md (skill: skills-surface-contract). Agents: skills-requirements-auditor, skills-ux-critic, skills-pm-challenger. Validate IDs: node apps/skills-checklist/.claude/hooks/check-req-ids.mjs`;
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: ctx } }));
