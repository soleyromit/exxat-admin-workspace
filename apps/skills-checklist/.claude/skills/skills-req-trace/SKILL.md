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

## Run it against the lab screens (per screen, per variant)

The matrix above says whether a requirement is covered somewhere; it does not say whether every lab screen and every variant carries it. Run this pass before designing or changing a lab screen, and again before claiming it done:

1. Find the screen and its variants in `admin/lib/lab/screens.json` (file per variant) and the sets in `admin/lib/lab/flows.json`.
2. List the requirement IDs the screen must satisfy, each quoted from `docs/source/requirements.extracted.txt`. Use `docs/knowledge/req-coverage-lab.md` (and `.json`) as the per-screen checklist once it exists; do not rewrite that file from here unless asked.
3. For each ID and each variant (compact ones such as inline rows, one page or many at once included), check that the field, filter, state or action is visible or one click away: open the variant at runtime, or cite the `file:line` that renders it.
4. Paste the block: `| ID | Variant | MET / PARTIAL / MISSING | Evidence (runtime or file:line) |`. Any MISSING blocks done; a PARTIAL needs a reason and a follow-up.
5. Once `node scripts/lab-req-gate.mjs` exists (run from `apps/skills-checklist/admin`), run it and paste its output; until then the manual block is required.
6. Run `node apps/skills-checklist/.claude/hooks/check-req-ids.mjs` so every ID you cite resolves.
