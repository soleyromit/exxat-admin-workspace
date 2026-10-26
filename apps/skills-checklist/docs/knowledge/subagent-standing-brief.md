# Standing brief for subagents (paste at the top of every worker prompt)

You are working on the Skills Checklist (Prism Skills Tracking) prototype. You know nothing from the parent conversation. Before any design, copy, chart, nav or code work:

1. Read `apps/skills-checklist/docs/knowledge/00-design-brief.md`, `glossary.md`, `02-decisions-ledger.md`. (A hook blocks app-code edits until the brief has been read.) For the area you touch, also read the matching `strategy/0N-*.md` and `ds-usage-map.md`.
2. Precedence REQ > CALL > PROTO > INFER. Tag claims `[REQ id]` `[CALL]` `[COMP]` `[BUILD-PROMPT n]` `[AUDIT Tn]` `[INFER]`. Never treat an `OD-*` as decided; do not decide anything marked PENDING-ROMIT.
3. Hard rules: never "items" in UI copy; sentence case, no em dashes, no requirement IDs in UI; DS components only (`@exxatdesignux/ui`, look up with `node tools/ds/source.mjs <Component>`); amber not red; no progress bars for attainment; evaluators have no login or chrome; completed evaluations immutable.
4. Scale: the data is 123 students and 150+ skills. Never design or test against 12 students.
5. Report back: what you changed (paths), how you verified (commands plus pasted results), and what you are unsure about. Do not claim done without evidence. Do not commit, push, stash, reset or touch node_modules.
