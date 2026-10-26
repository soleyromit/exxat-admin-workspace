# Skill setup journey: layout patterns, content and UI strategy, lab architecture

**Written:** 2026-10-26 for Romit Soley. **Status:** implementation-ready specs for the lab builders. No app code changed. Nothing here decides an `OD-*`.
**Consulted:** `../../00-design-brief.md`, `../../glossary.md`, `../../02-decisions-ledger.md`, `../../strategy/01` to `07`, `../visual-language.md`, `../lab-README.md`, `../../ds-usage-map.md`, the import, configure and library design docs, REQ SL, IM, SC, CM, `docs/v2/audit/T1-admin.md`, `../../01-competitive-digest.md`, the 1440 shots in `../lab-shots/`, three new shots in `evidence/`, 17 Mobbin screens (cited inline), DS `@exxatdesignux/ui@1.6.5` types and `src/globals.css`.

## The problem in one paragraph

Romit: importing, adding and configuring a skill is crowded, has no hierarchy, uses no layout patterns, and the variant architecture does not help navigation. What I saw confirms it is structural: every setup screen invents its own frame (title zone, action placement, stepper, width, footer); import step 1 is a disabled dropzone under a required Select with 55 percent of the viewport empty; import step 2 stacks 9 regions (stepper, "Step 2 of 4", a heading repeating the step, attachment, banner, 4 KPI cards, legend, tabs, filters) before the first table row; configure is three equal columns with the form narrowest and a dashed lab toolbar inside the page; variants are per screen, so nobody can walk Library > Add > Import > Configure > Publish > Map in one consistent design.

## Files

| File | What it gives a builder |
|---|---|
| `01-layout-patterns.md` | Five page templates (list, wizard, form or detail, split, dashboard) with ASCII, widths, spacing tokens, footer, stepper, banner, empty and loading rules, 375/1024/1440 behaviour, page-type budgets for wizard, form, list, detail and split, and every lab screen mapped to a template with its current violations |
| `02-skill-setup-content-and-ui-strategy.md` | Journey jobs, 11 cross-cutting decisions, then per-screen build specs (DS components and props, regions, exact copy, states, acceptance checks) for import (4 steps), configure (5 steps), check and publish, skills library and add a skill, each in three option sets; density count per screen |
| `03-lab-architecture.md` | Flows and option sets for every persona, the slim lab bar (persona, flow and journey, option set, scenario menu, question tooltip, components drawer), URL scheme that keeps every old URL working, `flows.json` schema, registry migration table, shared layout primitive APIs, and the work split for 4 parallel builders with merge order |
| `evidence/` | Current import review A and B and rule impact B at 1440 x 900 |

## The templates, one line each

- **List (T1):** full width; title with one filled primary top right; status tabs carry the counts (no KPI strip); toolbar of 5 or fewer controls on the tab row; grouped DataTable; detail in a FloatingSheetPanel.
- **Wizard (T2):** 960 px left-aligned column; DS `Wizard` horizontal compact, 3 to 5 one-word labels inside the column; no visible "Step n of m" and no heading repeating the step; one question per step; sticky 64 px footer with Back, a 10-word context line and the one primary.
- **Form or detail (T3):** 720 px single column; FieldSets of 7 or fewer fields, 32 px between sections; advanced options behind one Collapsible; sticky footer with a summary line and the primary.
- **Split (T4):** list plus a non-modal FloatingSheetPanel (`md` 32 rem); one primary, in the panel footer when a record is open.
- **Dashboard (T5):** as strategy 06 and 07 (5 regions, 4 figures, 2 charts, one-row scope bar).

## The six most consequential decisions

1. **The dropzone is the hero and nothing blocks it.** The file goes to the program's default list, shown as "Adds to Medical-surgical nursing. Change" under the dropzone. Why: the required Select before the drop was the first failure a coordinator meets; Databricks, Airwallex and Pipedrive make the drop the whole step; repeats are still checked against the chosen list [REQ IM-06].
2. **Review and fix are separate jobs.** Review shows the file's own 10 categories, collapsed, with counts ("Did it understand my list?"); Fix shows only the 16 lines that need a decision, grouped by kind, one choice per row, "Accept n suggestions" per group. Why: chunking and Miller; the built screen put 158 rows, a confidence column, KPI cards and inline fixes on one page; Fresha, Remote and Attio split errors from ready rows.
3. **Configure is five steps in one 720 px column, and the live rule sentence lives in the sticky footer.** Setting minimums join the Rule step (they are achievement criteria), evaluator fields, feedback, self-evaluation, approval and signer roles share "Evidence and sign-off". Why: five fits the DS horizontal threshold and strategy 04; a persistent sentence satisfies SC-17 without a competing third column (ClickUp pattern).
4. **Check and publish is the last configure step**, with "What changes", "Student sees", "Evaluator sees" as tabs, one headline figure, a 4-row before and after table, the open evidence choice, and ties stated once ("All 15 need 1 more evaluation in Inpatient"). Why: SC-19 and AE-02 belong at the moment of commitment; the built impact screen repeated the same reason on every row.
5. **The lab moves from per-screen A/B/C to flows and option sets.** Set 1 Guided (table, side sheet, wizards), set 2 One page (tree, inline add, folding single pages), set 3 Many at once (board, paste several, file beside the list, one rule for many). One switch changes every step; a journey bar names the previous and next step. Why: Romit needs to review one coherent journey per option, not 91 unrelated variants.
6. **Lab chrome shrinks to one 40 px row.** The "Tests:" sentence becomes an info tooltip, the DS components panel becomes a drawer, demo buttons ("Load a sample rule change", "Use the sample file", "Reset edits") move into a Scenario menu, "Sample data" and "Decision pending" pills leave page content. Why: lab notes were being read as product copy and took the place of real regions.

## Open questions for Romit

1. **Category versus section and group.** REQ has one optional category and tags; the HGTC file has sections and groups. I specified "section becomes Category, group becomes a tag" in UI copy. Confirm, or keep a second level. `[PENDING-ROMIT]`
2. **Default target list for import.** The drop goes to the program's default list and can be changed after. If programs often hold several active lists, should the list be asked at Confirm instead?
3. **Add a skill without the model.** I removed the evaluation model from the add sheet (configure owns it, REQ SC-01). The built A argued for showing it there. Keep it out?
4. **Five configure steps.** Merging "Settings and minimums" into "Rule" and "Who can sign off" into "Evidence and sign-off" is my call. Acceptable?
5. **Evidence already held** (re-evaluate versus new evidence only) stays a required choice before publish [REQ AE-02 versus build prompt option B]. Still open.
6. **Set 3 bulk configure** applies one evidence choice to every selected skill. Per-skill choice would add a step. OK for the lab?
7. **Starting points** stay outside the flow, in the library overflow, because of the SL-01 hard stop. Keep, or drop the screen?

## What I could not verify

- Mobbin screens were viewed as previews; I did not open full flows.
- The DS Wizard catalog page did not load at `localhost:4000/library/wizard` (it returned the catalog's not-found page); the compact variant was checked in the 1.6.5 source (`size-6` markers), not visually.
- Density counts in `02` section 8 are targets from the specs, not script output; builders paste the real numbers.
- Import exception counts are quoted from `../import-and-starter-library.md` and `tests/lab/import.test.ts` (156 read, 16 need a decision, 4 repeats, 2 unreadable); the coordinator's brief said 6 composed names and 3 repeats. Builders must render the engine's numbers.
- No HTML mockups were built (scope changed to building in the lab).
