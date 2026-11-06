---
name: skills-surface-contract
description: Gate before ANY JSX/TSX/CSS for apps/skills-checklist — produces and validates a per-surface Design Contract (requirements IDs, ODs and seams, journey why/so-what, states, DS mapping, a11y, acceptance tests) wearing UX, UI, interaction, PM and strategist hats. Use when starting, redesigning, or reviewing a Skills Checklist screen. The PreToolUse hook blocks app code until a contract exists in docs/build/contracts/.
---

# Surface contract (hard gate)

Order: `skills-module-context` → this skill → (Romit confirms) → `ds-adoption-reviewer` → build → `ds-conformance-reviewer` + `state-review` + `verification-reviewer`.

## Steps
1. **Pick the surface** and its journey stage (docs/journeys). State persona + RBAC row (exxat-domain-context).
2. **List requirement IDs** it must satisfy; open `docs/strategy/04` for current prototype status; open `docs/source/requirements.extracted.txt` for exact text. Every ID must exist (hook enforces).
3. **List open decisions** it touches (docs/strategy/05) and the seam you'll use. If an OD blocks the wave, stop and ask Romit **in plain chat** (never AskUserQuestion) with a recommendation first.
4. **Wear five hats** and write one line each:
   - *PM*: job, decision enabled, what we are NOT doing (§14, OD).
   - *Strategist*: what this does for adoption/differentiation; risk if wrong.
   - *UX*: IA, flow, progressive disclosure, density (admin dense, student mobile-first, preceptor one screen).
   - *Interaction*: every state (L E Er V S Su D P Bl) from docs/strategy/06, keyboard path, focus, validation timing.
   - *UI*: DS components via `node tools/ds/source.mjs <C>`; tokens only; no raw table/button; no toast (LocalBanner); sentence case; professional copy.
5. **Prototype reference**: name screen(s) in docs/source/screens and what to keep vs NOT copy.
6. **Mobbin**: run searches by job type (needs authenticated Mobbin MCP). If unavailable, say so — do not invent references.
7. **Write the contract** as a DRAFT to `docs/build/contracts/_draft-<S-id>-<surface>.md` from `docs/build/02-design-contract-template.md`. The code-gate hook ignores `_draft-` files. Only after Romit confirms, rename it (drop the `_draft-` prefix) — that is the unlock.
8. **Spawn** `skills-requirements-auditor` (claims vs source) and `skills-ux-critic` (multi-hat critique) on the contract. Paste their literal verdicts.
9. **Check it:** `node .claude/hooks/skills-contract-check.mjs <contract>` must print VALID. Paste the output. A page contract needs the single job, primary action, a table of every other action with where it lives and why, each task as entry, steps, finish, landing, states, what must not be on the page, and task test IDs.
10. End with: *Contract written to <path> — review or confirm.* Do not edit app code before confirmation.

## Admin pages: the map is the spec
Section D of `docs/build/2026-11-04-admin-workflow-map.md` is the page spec for Library, Edit panel, Bulk edit, Add, Evaluation settings, Per-skill settings, Categories and tags, Skill lists, Assign and Course mapping. Do not rewrite it in the contract. Add `Page spec: docs/build/2026-11-04-admin-workflow-map.md#D<n>`, the section F task IDs, and only what `node .claude/hooks/skills-contract-check.mjs --needs` lists. The gate rejects restatement. File-to-page mapping: `docs/build/contracts/_page-registry.json`.

## After the build
Done means `docs/build/done-definition.md`, not a passing contract.

## Reject the contract if
A state is "TBD" · an OD is treated as decided · the only reference is the prototype · acceptance tests missing · copy uses colloquialisms or em-dashes · two filled primary CTAs.
