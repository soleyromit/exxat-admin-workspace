# Engine tests

The achievement engine lives in `lib/engine/` (pure TypeScript: no React, no I/O, deterministic) and was built test-first.
Oracle: `docs/strategy/02-domain-model-and-achievement-engine.md` §3, §5, §6; `docs/build/contracts/S-09-skill-configure.md` §15b (ENG-1..ENG-11); `docs/ux/05-state-machines.md` SM-02.

| File | Covers |
|---|---|
| `qualify.test.ts` | qualification rule per model, recomputed from the CURRENT rule (SC-03..08, AE-02) |
| `achievement.test.ts` | ENG-1, 2, 5, 6, 7: counting, per-level and per-setting minimums, lab never satisfies a clinical setting, four states, RP-08 filters, SL-11, IV Insertion and Wound Care (DEFECT-07) examples |
| `rule-changes.test.ts` | ENG-3, 4, 9, 10: re-application, rename invariance, removal cascade, model-change rebuild, impact preview |
| `validate.test.ts` | ENG-8, 11: save-blocking validators incl. BL-1 (clinical minimum needs a clinical-valid allowed role) |
| `submission.test.ts` | RV-03, RV-05, SM-02 locks, OD-14 conditional states, derived counted / did-not-meet |
| `explain.test.ts` | SH-03 structured failure reasons (data only, copy lives in docs/ux/09) |
| `properties.test.ts` | seeded invariants: order independence, idempotence, rename invariance, monotonicity, filter equivalence |
| `fixtures.ts` | builders only, no engine logic |

Open decisions the engine leaves OPEN (seams): OD-03 (engine returns four states, display flag is UI), OD-25 (role to evidence-type map is passed in as data),
OD-14 (partial-save states are conditional), OD-16 (who corrects a returned item is not encoded), model-change effect on held evidence (report only).
Run: `pnpm test`.
