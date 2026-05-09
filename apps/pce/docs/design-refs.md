# PCE — Design References

External references and prior art for PCE design work.

## Canonical prototype

- **File:** `apps/pce/prototype/pce-evaluation.html`
- **Local preview:** `python3 -m http.server 8000` from `apps/pce/prototype/`
- **Production preview:** Vercel auto-deploy on `main` (pushes to PR get preview URLs)
- **Engineering handoff:** `apps/pce/prototype/HANDOFF.md`

This is the source of truth for engineering until `apps/pce/admin/` catches up.

## Reference prototypes (do not implement from)

- `apps/pce/prototype/_reference/pce-autopilot.html` — earlier autopilot exploration
- `apps/pce/prototype/_reference/pce-interactive.html` — earlier manual-flow exploration

## Magic Patterns artifacts

(none yet for PCE — prototype was built directly in HTML)

## Figma files

(none yet)

## Prior art / inspiration

| What | Why we looked at it |
|---|---|
| Anthology Course Evaluations | Current incumbent; what we replace |
| EvaluationKIT (Watermark) | Comparable autopilot model |
| Explorance Blue | Reference for question bank structure |

## Related Exxat products

| Product | Overlap with PCE |
|---|---|
| Learning Activities | Site/preceptor feedback (not in PCE Phase 1; combining is Phase 2 cohort correlation) |
| Exam Management | Question bank model is conceptually similar; tagging convention should align |

## Maintenance

- Adding a Magic Patterns / Figma URL: paste it in conversation; the harness will pull context. Confirm and add a row above.
- Deprecating a reference: move to `## Archive` section with a one-line reason.
