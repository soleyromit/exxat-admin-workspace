# Build notes, builder B2: configure and publish (sets 1, 2, 3) and rule change impact

**Date:** 2026-10-26. **Spec:** `02-skill-setup-content-and-ui-strategy.md` section 4, `01-layout-patterns.md` (T2, T3, L1 to L12), `03-lab-architecture.md` sections 5 and 7. **Consulted:** `../../00-design-brief.md`, `../../glossary.md`, `../../02-decisions-ledger.md` (D-X1, D-X6, AE-02 open), strategy 02, 03, 07.

## What changed

| Route | Before | After |
|---|---|---|
| `/lab/admin/configure-skill?variant=A` (set 1) | 6 steps, vertical stepper + form + live panel (3 columns), dashed lab toolbar, Next mid-page | `WizardPage` width `form` (720), 5 steps Model, Outcomes (Questions or Levels by model), Rule, Who signs, Check; one column; live rule sentence, today's count, amber "n students change" jump and a Preview popover in the `StickyFooter` summary; Check = What you changed, headline, before and after table, students grouped by move with each reason said once, evidence choice (nothing preselected, "Decision pending"), one primary Publish |
| `?variant=B` (set 2) | 3 columns, copy-from row and two header buttons | `FormPage` (720), sticky row of section anchors (Model, Outcomes, Rule, Who signs, Check and publish), all sections on one page, Check and publish as the last section, rule sentence in the footer, Publish in the footer; Copy from and Apply to other skills in the title overflow |
| `?variant=C` (set 3) | 175 px model tiles, sentence, live panel column | `FormPage` (720): inline model radios (consequence in a tooltip), the editable sentence, setting note, then two Collapsibles (Outcomes; Who signs and what the student adds). Footer: today's count or "Applies to 4 skills"; primary "Check and publish" opens the check dialog. `?skills=a,b,c` configures several at once with one evidence choice for all |
| `/lab/admin/rule-change-impact?variant=A` | Card with dl, choice, table, every student; lab toolbar | `FormPage`: The rule (now, after), Who changes (headline, table, grouped students), evidence choice; footer secondary Edit the rule, primary Publish |
| `?variant=B` | 2 columns, every row repeating "1 more in Inpatient (you have 0 of 1)" | `FormPage`: people first, groups expanded with one header row per combination of needs (reason printed once per combination), counts folded, rule diff, evidence choice, What each role sees (Collapsible) |

Lab chrome: the in-page dashed demo bar is gone. B4's lab bar exists, so its Scenario menu carries the configure and rule impact scenarios (my `scenarios` and `labNotes` entries in `lib/lab/screens.json`); "Reset edits" is the `lab:reset` event, handled in `use-configure.tsx`.

## Engine (lib/lab/configure.ts, pure, tested)

- `SECTIONS` is four (model, outcomes, rule, signoff) plus `CONFIGURE_STEPS` with Check; setting minimum issues now belong to Rule, student field issues to Who signs.
- `ImpactRow.gaps` (staff wording, keyed), `gapsOf`, `groupImpact` (groups by move, `shared` needs and `parts` by identical needs), `groupReason`, `partSentence`, `ruleDelta` and `ruleDeltaLine` ("Adds from 2 different evaluators and 1 in Inpatient."), `configDiff`.
- `computeImpact` and every existing test unchanged.

Real numbers on the sample change (Oral medication administration, 123 students, 121 with evidence): 15 change status, Achieved 113 to 98, In progress 6 to 21; group Achieved to In progress: "13 need 1 more in Inpatient. 1 needs 1 more different evaluator. 1 needs 1 more in Inpatient and 1 more different evaluator." (seen in the check dialog shot)

## Decisions I made (reversible)

1. **Model choice is a DS `RadioGroup` of labelled option cards, not `SelectionTileGrid`.** The grid renders square tiles and does not render `description`, so the one-line consequence the spec asks for cannot appear; 2 columns of 720 px squares are 350 px tall. Removed `SelectionTileGrid` and `Card` from `requiredDsComponents` for configure and rule impact. DS gap to raise: a tile with a description line.
2. **Primary stays enabled until the first failed attempt (L9),** not disabled from the start (02 section 4.8 check 1), because a disabled control above the fold fails the density script. The first press shows the summary and moves focus.
3. **Field errors go screen-reader-only while a summary lists them** (L9 plus L11): the visible text is said once, `role="alert"` and `aria-describedby` still reach assistive tech.
4. **Check says the rule change as a delta** ("Adds ... Was: ...") because the footer already shows the full new sentence.
5. **Ties when nothing is shared** are split into parts by identical needs (not a per-row "Still needs" column), found by looking at variant B.
6. Step 4 is labelled "Who signs" (caller brief) instead of "Evidence and sign-off" (02 section 4).
7. `density-budget.mjs`: added `"admin/configure-skill/A": "wizard"` to `VARIANT_TYPE` (B1 added the wizard type; nothing duplicated).

## Verification

- `npx vitest run tests/lab`: 26 files, 310 tests passed (configure.test.ts 24, five new describe blocks: steps, sections, ties, gaps, configDiff).
- `npx tsc --noEmit`: clean.
- `node scripts/lab-ds-gate.mjs --write` then the gate: 93 variants, GATE PASSED.
- `node tests/lab/density-budget.mjs --only=admin/configure-skill,admin/rule-change-impact`: 5 of 5 pass (A wizard 4/4 regions, 1/7 fields, 15/30 words, 1/2 hues; B 3/4, 5/7, 15/40, 0/2; C 3/4, 3/7, 32/40, 0/2; impact A 3/5, 0/6, 38/40, 1/2; impact B 3/5, 1/6, 13/40, 0/2). The script measures default URLs only, so Check steps were judged from screenshots.
- Screenshots (Playwright headless, webpack dev server :3017, `term=Fall 2026`): `../lab-shots/b2-*-1440.png` and `b2-*-375.png`, every step of set 1, error, published, preview popover, loading, B, B errors, B at Check, C, C many, C check dialog, impact A, B and no change.

## Not verified / open

- axe not run. Keyboard order checked only by reading the code.
- 1024 width not shot.
- Density of the Check step and of the sample-change states is not script-measured.
- The evidence choice stays an open decision (AE-02 vs option B); "Different evaluators" stays Proposed (D-X6); per-skill evidence choice in set 3 is not offered (02 open point 6).
- The carried v2 line "Simulation can supply at most 0 of 3." is real engine output from the v2 rule and reads oddly; it is labelled Proposed with Remove.
- Course mapping does not yet read `?skill=` (the success banner links there).
- The DS `ToggleSwitch` on state paints the success green, a third hue on Who signs.
