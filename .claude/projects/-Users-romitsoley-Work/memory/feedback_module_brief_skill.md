---
name: feedback-module-brief-skill
description: When starting any new product module — invoke /exxat-module-brief before senior-ux or any wireframe. The skill codifies the 7-step process used for PCE course evaluation brief.
metadata:
  type: feedback
---

Use `/exxat-module-brief` at the start of any new module or feature area on any Exxat product.

**Why:** The PCE course evaluation work (Jun 2026) showed that jumping to surface-level design without first synthesizing the architectural principles from Granola transcripts leads to contradictions (wrong reminder anchor, editable directories, two competing wizards). The module brief process surfaces these before any wireframe is drawn.

**How to apply:** Invoke the skill when the user asks "what does Aarti/Vishaka want for X", "start designing X", "gap analysis on X", or "prep for [client visit] on X module". The skill gates all `exxat-senior-ux` and `exxat-design-contract` work downstream.

**Skill location:** `.claude/skills/exxat-module-brief/SKILL.md` (mirrored to `.cursor/skills/`)

**The 7 steps it runs:**
1. Memory scan — find existing captured decisions
2. Granola pull — raw transcripts via `get_meeting_transcript` (never query summaries)
3. Decision extraction — load-bearing decisions by category
4. Architectural synthesis — 3–5 connecting principles (the "spine")
5. DS component map — `node tools/ds/source.mjs` for every new surface
6. Mobbin — 3+ flow searches before any wireframe
7. Nav delta + CommandPalette + OPEN questions (build blockers)

**Output:** `apps/<product>/docs/research/meetings/YYYY-MM-DD-<module>-brief.md`

**Differs from `exxat-senior-ux`:** That skill is per-surface (one screen). This skill is per-module (a feature area spanning multiple surfaces). Module brief runs first; senior-ux runs per-surface inside the module.
