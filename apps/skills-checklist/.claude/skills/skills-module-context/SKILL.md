---
name: skills-module-context
description: Load FIRST on any task in apps/skills-checklist (Prism Skills Tracking) — design, copy, code, review, or "what does the prototype/requirements say". Establishes source precedence (REQ > CALL > PROTO > INFER), the do-not-assume list, and where each fact lives, so nothing is hallucinated. Triggers on skills checklist, skills tracking, skills library, achievement criteria, evaluation model, preceptor evaluation, Sankalp prototype, SL-/IM-/SC-/CM-/ST-/EV-/AR-/RV-/SH-/RP-/AE-/OD- IDs.
---

# Skills Tracking — module context gate

Before answering or designing anything in this product:

1. Read `apps/skills-checklist/docs/README.md` (index, tags, 10 easy-to-get-wrong facts).
2. Open only what the task needs:
   - *Why / so-what / strategy* → `docs/strategy/01-problem-and-why.md`
   - *Rules, states, engine* → `docs/strategy/02-domain-model-and-achievement-engine.md`
   - *Who does what* → `docs/journeys/01|02|03-*.md`
   - *What the prototype really does* → `docs/strategy/03-prototype-walkthrough.md` + `docs/source/screens/`
   - *Is requirement X covered?* → `docs/strategy/04-requirements-traceability.md`
   - *Is X decided?* → `docs/strategy/05-open-decisions.md`
   - *States, a11y, privacy* → `docs/strategy/06-states-and-edge-cases.md`
   - *Known defects / contradictions / do-not-assume* → `docs/strategy/07-gaps-contradictions-defects.md`
3. Ground truth lives in `docs/source/requirements.extracted.txt`. Quote the ID, never paraphrase from memory.
4. Precedence: **REQ > CALL (vault raw transcript) > PROTO > INFER.** The prototype is illustration; Sankalp said not to go by its design.
5. Tag every factual claim `[REQ id]`, `[OD-n]`, `[PROTO]`, `[CALL 09-23]`, `[CALL 03-05]`, `[INFER]`. Untagged = unverified.
6. Never treat an `OD-*` as decided. Build the seam named in `05-open-decisions.md`.
7. Raw vault transcripts: `~/Documents/research-repos/Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md`. Pull raw, not summaries.

## Hard stops
No shipped skills/taxonomy · no default model · unconfigured skills can't be mapped/submitted · completed evaluations immutable · mapping ≠ eligibility · preceptors have no login · lab never satisfies clinical-setting minimum · §14 is out of scope · no QR codes / heatmaps / learning-contract linkage in v1.

## When you finish
Run `node apps/skills-checklist/.claude/hooks/check-req-ids.mjs` (IDs resolve) and, for UI work, hand off to `skills-surface-contract`.
