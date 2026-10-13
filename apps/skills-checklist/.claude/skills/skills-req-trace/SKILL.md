---
name: skills-req-trace
description: Keep the Skills Checklist requirements traceability matrix honest — update docs/strategy/04-requirements-traceability.md after a design or build change, re-run the ID validator, and report coverage deltas. Use when a requirement's coverage status changes, when OD decisions land, or when Sankalp revises the requirements document.
---

# Requirements traceability upkeep

- Source of truth: `docs/source/requirements.extracted.txt` (regenerate from the .docx with `docs/source/walkthrough-scripts/docx-extract.py` if Sankalp ships a new version, then diff).
- Matrix: `docs/strategy/04-requirements-traceability.md`. Status key ✅🟡⚪❌⚠️❓.
- After any change: `node apps/skills-checklist/.claude/hooks/check-req-ids.mjs --count` must say "missing from matrix: none"; `node …/check-req-ids.mjs` (no flags) must say all IDs resolve.
- New proposed IDs you invent go into `docs/source/proposed-ids.txt` and are labelled `[INFER]` everywhere.
- When an OD is decided: move it in `05-open-decisions.md` (add decision, date, who), update affected matrix rows (❓ → real status), and write a vault decision note per workspace schema.
- Never change a status to ✅ without a screen/test reference in the Note column.
