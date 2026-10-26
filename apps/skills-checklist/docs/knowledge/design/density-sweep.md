# Density and consistency sweep of every lab screen (2026-10-26)

**Why:** Romit called the lab screens "extremely crowded", with "huge text and controls", and asked for UX laws and visual consistency. This sweep measured every built lab screen and variant against the density budget (`../strategy/07-ux-laws-and-density.md` section 3, with the delegated defaults D-X21 in `../02-decisions-ledger.md` 3c), fixed what failed by cutting or moving content (never by shrinking spacing below DS tokens), and closed the open consistency items in `consistency-audit.md` for the screens in scope.
**Not in scope (owned by another worker today):** `screens/evaluator-*`, `admin-approvals-*`, `reviewer-students-*`, `director-attainment-*`, `components/lab/rbac/**`, `components/lab/evaluator/**`, `lib/**`, `tests/v2/**`. Their failures are listed under section 6, not fixed.
**Tool:** `admin/tests/lab/density-budget.mjs` (rewritten). Run: `node tests/lab/density-budget.mjs [--only=persona/slug[/V]] [--debug] [--shots=dir] [--json]` with the dev server on :3017.
**Screenshots:** `lab-shots/sweep-before-*.png` and `lab-shots/sweep-after-*.png`, one pair per screen and variant that failed in the baseline, at 1440 x 900 and 375 x 812 for student and evaluator. `lab-shots/sweep-after-scope-bar-filters-open-1440.png` shows the new scope bar with a group filter applied.

## 1. Result

| | Baseline | After |
|---|---|---|
| Cases measured (38 screens, 91 variants; student and evaluator at 2 widths; 3 student screens also for stu-g-067) | 134 | 134 |
| Passing | 46 (4 more errored on a dev reload and count as failing) | **107** |
| Failing in files this sweep owns | 64 | **3** (dashboard B, export A, reviewer approvals B; see section 6) |
| Failing in files owned by others | 24 | 24 (20 evaluator, 3 reviewer students, 1 director attainment B) |

`npx vitest run tests/lab`: 22 files, 241 tests passed. `npx tsc --noEmit -p .`: 0 errors. `node scripts/lab-ds-gate.mjs --write`, then the gate: 91 built variants checked, GATE PASSED.

## 2. Counting rules (the script header is the source; summarised here)

The first viewport is the top 900 px at 1440 and 812 px at 375. The shell, utility bar and `[data-lab-chrome]` are excluded. Every route loads with `?variant=X&term=Fall%202026` and empty localStorage. Page type per screen is a map in the script (the registry has none; `data-page-type` is set by only a few frames). A new screen without an entry stops the script.

| Line | Rule | Decision and why |
|---|---|---|
| Regions | Top-level bounded blocks: `[data-region]`, DS Card, scope bar, FilterBar, tablist, table or grid, bordered banner, section with its own heading, plus the page header. Shown whole or at least 80 px of it | Geometric, so screens without `data-region` are still counted (most had none) |
| Tile grid | `[data-tile-grid]`, or 3+ sibling blocks under one grid or wrapping-flex parent, each under 200 px, count as ONE region; at most 6 tiles | D-X21 |
| Open panel | An open Sheet, panel or Dialog (portalled outside `main`) is measured with the page: ONE region, its controls and words count | Added during the sweep. Without it, Add a skill A, Export A and Approvals B measured only the page behind the panel |
| Figures | `[data-figure]`; a `kpis` group counts each linked value; tab counts and figures inside tables are not figures | strategy/07 S06 5.3, "tab counts are the counts". This fixed "Variant B tabs counted as figures" |
| Charts | `[data-chart]` or the DS chart slot, at least 80 px tall, not inside a figure or table | D-X21: at most 3 on a dashboard. Other types keep strategy/07 (list 0, form 1, detail 1, student 1, evaluator 0) |
| Controls | Buttons, button-styled links, selects, comboboxes, tabs, switches, checkboxes, inputs, above the first chart or table (dashboard, list, detail) or above the fold (form, student, evaluator) | **Single-choice group rule:** the options of one radiogroup, RadioGroup, SelectionTileGrid or single ToggleGroup count as ONE control. The reader makes one decision; Hick prices the options inside it, as a Select already counts once. Checkbox sets count per box. Tabs count one each, as strategy/07 counted dashboard C, which D-X21 accepts as the only exception |
| Form controls | Forms count fields only (strategy/07: 7 fields per step). Buttons fall under the primary and disabled checks | Evaluator: 3 per visible skill plus Submit |
| Disabled | Any disabled control above the fold fails, except one half of a Previous/Next pager at its first or last record | Hiding the dead half would move the live half under the pointer (Fitts, Jakob) |
| Prose | Text that is not data, labels or buttons (strategy/07 K4) | Not prose: buttons, links, labels, h1 to h3, legends, badges, tooltips; anything inside a table, grid, figure, chart SVG or `[data-figure]`; `dt` and `dd`; `[data-viz-label]`; user-authored record content (`blockquote`, `q`, `[data-user-content]`: evaluator feedback, a return reason, a student note); the scope bar; screen-reader text; pure numbers. **Short-label rule:** in a chart, list item or table row, a text node of 3 words or fewer is a data label (name, category, state word). Budgets: 40 at 1440, 25 for student pages at 375, 15 on every evaluator surface |
| Hues | The browser resolves every SVG fill and stroke, every background and every Font Awesome glyph colour (so `var()`, `color-mix()`, `oklch()`, `oklab()` all resolve). Each is painted on a 1 px canvas over white, converted to OKLCH, and kept when chroma > 0.06. Hues within 25 degrees merge. Decorative `aria-hidden` marks count, because they are painted | Budget 2 (brand plus amber); student progress 3 (plus the success tone). The old detector skipped `aria-hidden` SVG and so missed the amber diamonds on dashboard A: it reported 0 hues where the screen shows amber |
| Primary | `[data-slot=button][data-variant=default]` above the fold, at most 1 | DS checkboxes and radios also carry `data-variant=default`. The first run counted them as primary buttons (Lists B "16 primaries") |
| Repeats | A sentence of 5+ words appearing twice: fail | |

**Why some earlier numbers differ:** "Send A 23 controls", "Log A 13", "Record A 20", "Record B 157 words", "Share A 135 words" and "My requests A 146 words" came from an earlier counter. That counter scored each radio option and each form button as a control, and counted names and state words in lists as prose. Under the rules above, Send A and Log A pass without change; each radio group and tile grid is one decision. Both were still reviewed by eye. Record, Share and My requests did fail, and were fixed (section 4).

## 3. Shared changes made by the lead

| File | Change |
|---|---|
| `components/lab/dashboard/scope-bar.tsx` | Always one row. The second row of chips and Clear filters is gone: cohort and course already print their value in their own select, so a chip said it twice. Filters applied inside the popover show on the Filters button ("Filters Group A", or "Filters 2"); each chip and Clear filters now sit inside the popover, one click away (K5). New optional prop `courseInFilters` moves Course into the popover on list pages (strategy/07 list budget: search, up to 3 filters, view, 1 action). Existing props are unchanged |
| `components/lab/link-styles.ts` (new) | `LINK_IN_TABLE` (hover underline), `LINK` (always underlined), `NUM_LINK` (counts). All 14 local LINK constants now import or re-export these (the last, `lab-index.tsx`, too) |
| `components/lab/empty-block.tsx` (new) | The one empty state (`compact` for a table's empty slot). `student2/frame.tsx` re-exports it. `admin-a` EmptyState is deleted; `student/frame.tsx` EmptyState wraps it |
| `components/lab/status-pill.tsx` (new) | `StateBadge`, `OverlayBadge`, `OutcomeBadge`, `EvaluatorNameBadge` on DS StatusBadge, with words, icons and tones from `lib/v2/labels.ts`. `admin-b/state-viz.tsx` re-exports `StateBadge` and takes its icons from `RECORD_STATE_META` |
| `components/lab/import/sample-badge.tsx` | Reads `SAMPLE_DATA_LABEL` |
| `components/lab/admin-b/export-panel.tsx` | "Leaves out" moved into a "What it leaves out (n)" Collapsible, as on Export B. The applied-scope list is tagged as data. Headings set to canonical h3 |
| `components/lab/student/requests.tsx`, `screens/student-requests-b.tsx` | A return reason renders as the returner's quoted words (`<q data-user-content>`) after a "Reason:" label |
| `components/lab/screens/admin-skills-library-a.tsx` | The header "Add a skill" turns outline whenever the add sheet is open, so the sheet's Save is the only primary |

## 4. What was cut or moved (by area; each item is one click away unless it says removed)

**Admin setup (library, add skill, import, starter library, configure, rule impact, retire)**
- **Library header:** Import and the other add routes are now one "More" menu. "Add a skill" is the one primary.
- **Library figures:** the three KPIs are links that filter the list. The separate "16 not configured" banner is removed; the Not configured figure states that hard stop and links to the rows.
- **Library A:** the saved-view tabs plus "Save view" are now one View menu in the table toolbar.
- **Library B:** the accordion tree is one table with expandable section and group rows; Expand all and Collapse all are one toggle.
- **Library C:** the card menus left the board (actions are in List view), and the KPI strip shows in List view only.
- **Add skill:** the figures step aside while adding.
- **Import:** file buttons appear after a library is chosen. "Apply" and "Create" render only when they can act. Back is hidden on step 1.
- **Starter library B:** one "Preview" per card; the summary and copy action are in the preview sheet; the intro is 12 words.
- **Configure:** the student and evaluator preview is behind a "Preview as student or evaluator" Collapsible. B's five cards are one card. C's model and rule cards are merged. Footer actions render only when they can act.
- **Rule impact B:** the description is folded into the heading, and "What each role sees after publish" is collapsed.
- **Retire:** Delete renders only when allowed. The other actions appear once a reason is chosen.

**Admin data (dashboards, drill, mapping, lists, evaluators, settings, attainment, export)**
- **Drill A and B:** Course is inside Filters, and Compare with is hidden; the comparison is named in the condition line and set on the dashboard. The condition chip is one sentence with "Show everyone in scope". A uses one page search instead of the table's three query controls.
- **Course mapping:** the "required skills in no course" line heads its pane instead of being a region.
- **Evaluator directory B:** the summary line sits in the toolbar.
- **Settings A:** one page search, inline create behind "Add a {noun}", and TabsCountBadge.
- **Settings B:** about 25 list and entry buttons became links, since each changes the URL. The disabled Delete is hidden while blocked.
- **Attainment:** Course is inside Filters and Compare with is hidden (the legend names the basis). Sections and Tags share one tab with a Group by switch. B's Required / All switch is a sentence link (D-X16). Table query controls are off.
- **Export B:** "Leaves out" is collapsed, and the empty history reads "No exports yet."
- **Dashboard F:** tied skill names are tagged as names.

**Student (all 9 screens, both widths)**
- **Progress A:** Do this next shows 2 actions plus "Show 3 more". The required list no longer repeats an action button on every row; each name opens the skill page. On a phone, a detail line shows only for "did not count".
- **Progress B:** the radar moved into the chart card behind a "By section / Against cohort" switch.
- **Log B:** Send is hidden until an entry is ready.
- **My requests A:** Done is collapsed behind one button, and the no-login note is 8 words.
- **Fix:** shorter path line, and duplicate helpers removed.
- **Skill detail A:** the timeline no longer repeats "Counts toward the rule."
- **Record (phone):** A shows one line per skill, with a reason only when the skill did not count or was returned. B shows the reason on the newest did-not-count row only.
- **Share:** while sharing is closed, link, expiry and export controls are not rendered.
- **Offline:** Send now is hidden when there is nothing to send. B's "Keep this version" shows a FieldError instead of being disabled.

**Reviewer, director, lab grid**
- **Approvals A, B, C:** Course is inside Filters. C's columns show muted counts and scroll inside themselves instead of using "All n".
- **Review item C:** two disclosures merged into one.
- **Verification B:** complete sections sit behind one "n complete sections" disclosure. "Earlier verifications" shows only when relevant.
- **Reports A:** Course is inside Filters; "What each file holds" sits inside the Export menu.
- **Reports B:** Course is inside Filters; PDF and CSV are one segmented control; Export sits at the foot of the preview.
- **Director dashboard C:** Course is inside Filters.
- **Lab grid A and B:** the toolbar is inside the grid card, and "Mark the rest Met" is hidden when nothing is left.

## 5. Visual consistency items closed (consistency-audit.md open items, screens in scope)

| # | Concept | Now |
|---|---|---|
| 1 | Status pill and wording | `status-pill.tsx` on `RECORD_STATE_META` and the other label maps. Configure, reviewer, director verify, the admin-a evaluator badge (now "Unverified / Adopted"), ops sites, exceptions, the drill peeks and student state labels use it. "Does not qualify" became "Evidence does not qualify" (attainment headers, student progress, log, share); "In progress" is neutral everywhere |
| 2 | Count chips | TabsCountBadge in settings and attainment tabs; heading plus muted count for section titles (Needs you, drill peeks, approvals C columns, verification gaps) |
| 3 | Empty state | `EmptyBlock` everywhere in scope (about 25 call sites), `compact` inside tables |
| 4 | Page title | PageFrame only; the remaining direct PageHeader uses are evaluator files (out of scope) |
| 5 | Toolbar | ScopeBar for who and when (one row); the admin-a Toolbar is composed on DS FilterBar |
| 6 | Table density | Cell padding overrides removed in review-parts, verification A, director dashboard B, reports B preview |
| 7 | Links | `link-styles.ts`; no local LINK constants remain in `components/lab` |
| 8 | Dates | `lib/v2/format.ts` shortDate and longDate in reviewer, configure, rule impact, student log, offline and sync; time is 24 h (en-GB) as on the as-of line |
| 9 | Numbers | `fmt`, `plural` and `pctOf` replace private helpers and raw `toLocaleString` in about 25 files |
| 10 | Sample data chip | SampleDataBadge in the PageFrame actions slot on every staff and student page in scope (library, configure, import, starter, retire, dashboards, drill, mapping, lists, evaluators, settings, attainment, export B, approvals, record, review item, director, both student frames). It hides below 640 px on student pages, where it crushed the title |
| 11 | Person cells | PersonIdentityCell in exceptions, pipeline drill, ops drill, attainment students, approvals B, director reports; `initialsOf` from format.ts |
| 12 | Section labels | h2 `text-base font-semibold`, h3 `text-sm font-semibold` in every file touched; the hero number keeps the heading font (D-X22) |

Banned-pattern grep over `components/lab` (`uppercase tracking-wide`, `py-20 text-center`, `color-mix(in oklch`): 0 matches.

## 6. Remaining failures and exceptions (with reasons)

| Case | Over | Why it is still over | Proposed resolution |
|---|---|---|---|
| admin/dashboard B | controls 12/8 | 5 exception tabs + 7 frame controls. Hiding Compare and moving Course only reaches 10; turning the tabs into anything else would only game the counter | Romit's call: extend D-X21's "variant C tabs" exception to B's 5 exception tabs. It is not added to the script's EXCEPTIONS, because the ledger does not say so |
| admin/export A | regions 5/4 | The variant is "export from a panel over Attainment": the page behind keeps header, scope, tabs and table, plus the panel. The new open-panel rule now sees the panel | Accept as the panel-over-page variant (B, the dedicated page, passes), or dim the page behind while the panel is open. Romit to choose |
| reviewer/approvals B | regions 5/4, controls 8/6 | Split view: the open submission panel is the variant's point, and the DS panel toolbar adds 4 controls (size, previous, next, close). It passed before only because the panel was not measured | A split-view budget (list + detail) is not in strategy/07. Romit to decide whether one is added |
| evaluator/* (20 cases) | words, regions, 1 disabled | Owned by the evaluator worker. Largest: invitation email C 118 words, email A 73 with a repeat, submitted A/B 34 to 39, form A 5 regions (header, summary, 2 skill cards, submit bar) | Hand to that worker with this table |
| reviewer/students A, B, C | controls 10/21/19, A regions 5, C words 52 | Owned by another worker | Same scope-bar options apply (`courseInFilters`) |
| director/attainment B | controls 9/8 | Owned by another worker; one prop (`courseInFilters` on DirectorPage) would pass it | Hand over |
| student/my-requests A, stu-g-067, 375 | was 37/25 words | Passes after the record-content rule: the two return reasons (28 words) are the returner's words, now quoted as record data | If Romit counts quoted reasons as prose, this fails again, and reasons on a phone would need a tap |

Judgement calls a reviewer should check:
- **Library C:** the 4-column board is one `data-region` (one board, one question).
- **Reports B:** the view switch and the table form one region, and Export sits below the preview.
- **Offline:** the two conflicting notes render as a `dl`.
- **Drill and attainment:** Compare with is hidden.
- **Settings B:** list rows are links.
- **Phone-only hiding:** some detail lines and the Sample data chip are hidden at 375.

Each is described in section 4.

## 6b. Round 2 (2026-10-26, later): the 27 remaining failures closed

Result: **134 of 134 cases pass** (`node tests/lab/density-budget.mjs`), with two named exceptions, both recorded in the script's `EXCEPTIONS` map and in strategy/07 section 3.

| Case | Before | Fix | After |
|---|---|---|---|
| admin/dashboard B | controls 12/8 | Named exception, the D-X21 rule for C extended to B's 5 exception tabs (delegated default, reversible). No other limit raised | 12/13, PASS (exception) |
| admin/export A | regions 5/4 | New page type **split view or panel** (strategy/07 section 3: regions 5, controls 8, words 40; the open panel is one region with its controls). The export panel is now modal (a task in front of the page, page inert behind it) and has no size menu | split, regions 1/5, controls 5/8 |
| reviewer/approvals B | regions 5/4, controls 8/6 | Split-view type. The panel keeps Close only: no size menu, and no Previous/Next, because the queue beside it is the navigator and a decision moves to the next submission | split, regions 5/5, controls 8/8 |
| evaluator form A, B, C | regions 4 to 5, words 16 to 37, B 1 disabled | The request summary moved into the light header (one region, `EvaluatorFrame summary`); the program name and the request line are data; the student's self-rating is quoted record content; "No account needed" replaces "Secure link, no account needed". A: Submit is the form's last row (one sheet). B: Back is "Previous" (the documented pager half) | 3/3 regions, 3 to 9 words |
| evaluator submitted A, B, C | 17 to 39 words | Receipt lines are data; one 9-word closing line; B step titles are 3 words or fewer ("Signed off: 2 skills", "Awaits program approval", "Then Maya sees it"; also fixes "1 skill wait") | 8 to 13 words |
| evaluator expired A, C | 16 to 21 words | Header copy; C subtitle "Enter the address it was sent to." | 10 to 12 words |
| evaluator invitation A, B, C | 43 to 118 words, A repeat | The message is the artifact: `data-artifact-preview` inside frames labelled "Email preview", "Text message preview", "Inbox preview" (the script fails an unlabelled frame). Surrounding prose cut to 7 to 9 words | 7 to 9 words, no repeat |
| reviewer/students A, B, C | controls 10/21/19, A regions 5, C words 52 | Course in the Filters popover; A: search and a single-choice attention filter (segmented control with counts, one decision) in one toolbar row, replacing 4 tabs; row actions (Review, Open record, All n) are links because they navigate; the row detail line is 3 words ("1 waiting, oldest 60 days", "Behind by 2 evaluations") | 6/6, 5/6, 5/6 |
| director/attainment B | controls 9/8 | `courseInFilters` on the director Attainment page | 8/8 |

The lab top bar no longer scrolls sideways at 375: the persona switcher and "All screens" collapse to icon buttons with the same accessible names, and the badge shortens to "Design lab" (`components/lab/lab-frame.tsx`). Checked with `scripts/lab-shot.mjs` (scrollWidth equals 375 on evaluator, student, lab grid and the lab index).

## 7. Full table, baseline (before)

Baseline run after the primary-button fix. Some reviewer and director rows were measured after the scope-bar change had landed mid-run. Their pre-change counts from the first run were: director reports A 10, reports B 11, director dashboard C 9, reviewer approvals C 9.

| Screen | V | Viewport | Type | Regions | Figures | Charts | Controls | Words | Hues | Result |
|---|---|---|---|---|---|---|---|---|---|---|
| admin/dashboard | A | 1440 | dashboard | 4/5 | 4/4 | 3/3 | 7/8 | 30/40 | 1/2 | PASS |
| admin/dashboard | B | 1440 | dashboard | 4/5 | 0/4 | 0/3 | 12/8 | 7/40 | 1/2 | FAIL: controls |
| admin/dashboard | C | 1440 | dashboard | 3/5 | 4/4 | 1/3 | 7/13 | 0/40 | 1/2 | PASS |
| admin/dashboard | D | 1440 | dashboard | 5/5 | 4/4 | 1/3 | 7/8 | 17/40 | 1/2 | PASS |
| admin/dashboard | E | 1440 | dashboard | 4/5 | 4/4 | 0/3 | 6/8 | 0/40 | 0/2 | PASS |
| admin/dashboard | F | 1440 | dashboard | 5/5 | 4/4 | 2/3 | 7/8 | 41/40 | 1/2 | FAIL: words |
| admin/dashboard-drill | A | 1440 | list | 4/4 | 0/3 | 0/0 | 9/6 | 0/40 | 1/2 | FAIL: controls |
| admin/dashboard-drill | B | 1440 | list | 4/4 | 0/3 | 0/0 | 8/6 | 17/40 | 1/2 | FAIL: controls |
| admin/skills-library | A | 1440 | list | 5/4 | 0/0 | 0/0 | 14/6 | 16/40 | 0/2 | FAIL: regions, controls |
| admin/skills-library | B | 1440 | list | 2/4 | 0/3 | 0/0 | 21/6 | 17/40 | 1/2 | FAIL: controls |
| admin/skills-library | C | 1440 | list | 6/4 | 0/3 | 0/0 | 23/6 | 36/40 | 1/2 | FAIL: regions, controls |
| admin/add-skill | A | 1440 | form | 5/4 | 0/1 | 0/1 | 3/7 | 16/40 | 0/2 | FAIL: regions |
| admin/add-skill | B | 1440 | form | 6/4 | 0/1 | 0/1 | 5/7 | 24/40 | 0/2 | FAIL: regions, primary |
| admin/import-ai-review | A | 1440 | form | 2/4 | 0/1 | 0/1 | 1/7 +3 disabled | 28/40 | 0/2 | FAIL: disabled |
| admin/import-ai-review | B | 1440 | form | 2/4 | 0/1 | 0/1 | 1/7 +3 disabled | 21/40 | 0/2 | FAIL: disabled |
| admin/starter-library | A | 1440 | list | 4/4 | 0/3 | 0/0 | 3/6 | 18/40 | 0/2 | PASS |
| admin/starter-library | B | 1440 | list | 2/4 | 0/3 | 0/0 | 11/6 | 54/40 | 0/2 | FAIL: controls, words |
| admin/configure-skill | A | 1440 | form | 2/4 | 0/1 | 0/1 | 3/7 +1 disabled | 52/40 | 0/2 | FAIL: disabled, words |
| admin/configure-skill | B | 1440 | form | 5/4 | 0/1 | 0/1 | 9/7 | 48/40 | 0/2 | FAIL: regions, controls, words |
| admin/configure-skill | C | 1440 | form | 5/4 | 0/1 | 0/1 | 5/7 | 52/40 | 0/2 | FAIL: regions, words |
| admin/rule-change-impact | A | 1440 | detail | 2/5 | 0/4 | 0/1 | 1/6 | 25/40 | 2/2 | PASS |
| admin/rule-change-impact | B | 1440 | detail | 4/5 | 0/4 | 0/1 | 0/6 | 92/40 | 1/2 | FAIL: words |
| admin/retire-deactivate | A | 1440 | form | 3/4 | 0/1 | 0/1 | 2/7 +2 disabled | 16/40 | 0/2 | FAIL: disabled |
| admin/retire-deactivate | B | 1440 | form | 3/4 | 0/1 | 0/1 | 0/7 | 0/40 | 0/2 | PASS |
| admin/course-mapping | A | 1440 | list | 5/4 | 0/3 | 0/0 | 6/6 | 25/40 | 1/2 | FAIL: regions |
| admin/course-mapping | B | 1440 | list | 5/4 | 0/3 | 0/0 | 4/6 | 16/40 | 1/2 | FAIL: regions |
| admin/lists-cohorts | A | 1440 | list | 3/4 | 0/3 | 0/0 | 1/6 | 24/40 | 0/2 | PASS |
| admin/lists-cohorts | B | 1440 | list | 3/4 | 0/3 | 0/0 | 1/6 | 20/40 | 0/2 | PASS |
| admin/evaluator-directory | A | 1440 | list | 4/4 | 3/3 | 0/0 | 5/6 | 4/40 | 0/2 | PASS |
| admin/evaluator-directory | B | 1440 | list | 5/4 | 3/3 | 0/0 | 4/6 | 8/40 | 1/2 | FAIL: regions |
| admin/settings | A | 1440 | list | 4/4 | 0/0 | 0/0 | 9/6 | 0/40 | 0/2 | FAIL: controls |
| admin/settings | B | 1440 | list | 3/4 | 0/3 | 0/0 | 29/6 +1 disabled | 20/40 | 0/2 | FAIL: controls, disabled |
| admin/attainment | A | 1440 | dashboard | 4/5 | 0/4 | 0/3 | 11/8 | 0/40 | 1/2 | FAIL: controls |
| admin/attainment | B | 1440 | dashboard | 5/5 | 0/4 | 0/3 | 15/8 | 0/40 | 0/2 | FAIL: controls |
| admin/export | A | 1440 | form | 4/4 | 0/1 | 0/1 | 8/7 | 0/40 | 1/2 | FAIL: controls |
| admin/export | B | 1440 | form | 4/4 | 0/1 | 0/1 | 5/7 | 60/40 | 0/2 | FAIL: words |
| admin/approvals | A | 1440 | list | 4/4 | 3/3 | 0/0 | 6/6 | 0/40 | 1/2 | PASS |
| admin/approvals | B | 1440 | list | 4/4 | 3/3 | 0/0 | 5/6 | 2/40 | 1/2 | PASS |
| student/home | A | 1440 | student | 4/4 | 3/3 | 0/1 | 9/4 | 59/40 | 1/3 | FAIL: controls, words |
| student/home | A | 375 | student | 3/4 | 3/3 | 0/1 | 4/4 | 42/25 | 1/3 | FAIL: words |
| student/home | B | 1440 | student | 4/4 | 3/3 | 2/1 | 3/4 | 5/40 | 1/3 | FAIL: charts |
| student/home | B | 375 | student | 3/4 | 3/3 | 1/1 | 2/4 | 5/25 | 1/3 | PASS |
| student/home | C | 1440 | student | 4/4 | 3/3 | 1/1 | 2/4 | 14/40 | 1/3 | PASS |
| student/home | C | 375 | student | 3/4 | 3/3 | 1/1 | 2/4 | 14/25 | 1/3 | PASS |
| student/log-skill | A | 1440 | form | 4/4 | 0/1 | 0/1 | 4/7 | 3/40 | 1/2 | PASS |
| student/log-skill | A | 375 | form | 3/4 | 0/1 | 0/1 | 2/7 | 0/25 | 1/2 | PASS |
| student/log-skill | B | 1440 | form | 4/4 | 0/1 | 0/1 | 1/7 +1 disabled | 33/40 | 1/2 | FAIL: disabled |
| student/log-skill | B | 375 | form | 3/4 | 0/1 | 0/1 | 1/7 | 17/25 | 1/2 | PASS |
| student/request-signoff | A | 1440 | form | 4/4 | 0/1 | 0/1 | 3/7 | 3/40 | 1/2 | PASS |
| student/request-signoff | A | 375 | form | 2/4 | 0/1 | 0/1 | 3/7 | 3/25 | 1/2 | PASS |
| student/request-signoff | B | 1440 | form | 2/4 | 0/1 | 0/1 | 1/7 | 0/40 | 1/2 | PASS |
| student/request-signoff | B | 375 | form | 2/4 | 0/1 | 0/1 | 1/7 | 0/25 | 1/2 | PASS |
| student/my-requests | A | 1440 | list | 3/4 | 0/3 | 0/0 | 8/6 | 52/40 | 1/2 | FAIL: controls, words |
| student/my-requests (stu-g-067) | A | 1440 | list | 2/4 | 0/3 | 0/0 | 3/6 | 74/40 | 1/2 | FAIL: words |
| student/my-requests | A | 375 | list | 2/4 | 0/3 | 0/0 | 2/6 | 52/25 | 1/2 | FAIL: words |
| student/my-requests (stu-g-067) | A | 375 | list | 2/4 | 0/3 | 0/0 | 3/6 | 61/25 | 1/2 | FAIL: words |
| student/my-requests | B | 1440 | list | 2/4 | 0/0 | 0/0 | 4/6 | 17/40 | 1/2 | PASS |
| student/my-requests (stu-g-067) | B | 1440 | list | 2/4 | 0/0 | 0/0 | 4/6 | 18/40 | 1/2 | PASS |
| student/my-requests | B | 375 | list | 2/4 | 0/0 | 0/0 | 4/6 | 17/25 | 1/2 | PASS |
| student/my-requests (stu-g-067) | B | 375 | list | 2/4 | 0/0 | 0/0 | 4/6 | 18/25 | 1/2 | PASS |
| student/fix-returned | A | 1440 | form | 2/4 | 0/1 | 0/1 | 5/7 | 48/40 | 1/2 | FAIL: words |
| student/fix-returned (stu-g-067) | A | 1440 | form | 2/4 | 0/1 | 0/1 | 3/7 | 47/40 | 1/2 | FAIL: words |
| student/fix-returned | A | 375 | form | 2/4 | 0/1 | 0/1 | 5/7 | 39/25 | 1/2 | FAIL: words |
| student/fix-returned (stu-g-067) | A | 375 | form | 2/4 | 0/1 | 0/1 | 3/7 | 38/25 | 1/2 | FAIL: words |
| student/fix-returned | B | 1440 | form | 4/4 | 0/1 | 0/1 | 5/7 | 48/40 | 1/2 | FAIL: words |
| student/fix-returned (stu-g-067) | B | 1440 | form | 4/4 | 0/1 | 0/1 | 3/7 | 47/40 | 1/2 | FAIL: words |
| student/fix-returned | B | 375 | form | 4/4 | 0/1 | 0/1 | 4/7 | 35/25 | 1/2 | FAIL: words |
| student/fix-returned (stu-g-067) | B | 375 | form | 4/4 | 0/1 | 0/1 | 2/7 | 34/25 | 1/2 | FAIL: words |
| student/skill-detail | A | 1440 | detail | 4/5 | 1/4 | 0/1 | 2/6 | 49/40 | 1/2 | FAIL: words |
| student/skill-detail | A | 375 | detail | 4/5 | 1/4 | 0/1 | 2/6 | 49/25 | 1/2 | FAIL: words |
| student/skill-detail | B | 1440 | detail | 4/5 | 1/4 | 0/1 | 2/6 | 13/40 | 1/2 | PASS |
| student/skill-detail | B | 375 | detail | 4/5 | 1/4 | 0/1 | 2/6 | 13/25 | 1/2 | PASS |
| student/record | A | 1440 | list | 3/4 | 3/3 | 0/0 | 5/6 | 0/40 | 1/2 | PASS |
| student/record (stu-g-067) | A | 1440 | list | 3/4 | 3/3 | 0/0 | 5/6 | 1/40 | 1/2 | PASS |
| student/record | A | 375 | list | 3/4 | 3/3 | 0/0 | 11/6 | 23/25 | 1/2 | FAIL: controls, repeats |
| student/record (stu-g-067) | A | 375 | list | 3/4 | 3/3 | 0/0 | 6/6 | 42/25 | 1/2 | FAIL: words |
| student/record | B | 1440 | list | 3/4 | 3/3 | 0/0 | 5/6 | 0/40 | 1/2 | PASS |
| student/record (stu-g-067) | B | 1440 | list | 3/4 | 3/3 | 0/0 | 5/6 | 1/40 | 1/2 | PASS |
| student/record | B | 375 | list | 3/4 | 3/3 | 0/0 | 5/6 | 40/25 | 1/2 | FAIL: words |
| student/record (stu-g-067) | B | 375 | list | 3/4 | 3/3 | 0/0 | 5/6 | 43/25 | 1/2 | FAIL: words |
| student/share-record | A | 1440 | detail | 3/5 | 0/4 | 0/1 | 6/6 +4 disabled | 111/40 | 1/2 | FAIL: disabled, words |
| student/share-record | A | 375 | detail | 3/5 | 0/4 | 0/1 | 5/6 +4 disabled | 32/25 | 1/2 | FAIL: disabled, words |
| student/share-record | B | 1440 | detail | 3/5 | 3/4 | 0/1 | 5/6 +2 disabled | 12/40 | 1/2 | FAIL: disabled |
| student/share-record | B | 375 | detail | 3/5 | 3/4 | 0/1 | 3/6 | 12/25 | 1/2 | PASS |
| student/offline-sync | A | 1440 | list | 4/4 | 0/3 | 0/0 | 5/6 | 50/40 | 1/2 | FAIL: words |
| student/offline-sync | A | 375 | list | 4/4 | 0/3 | 0/0 | 4/6 | 50/25 | 1/2 | FAIL: words |
| student/offline-sync | B | 1440 | list | 3/4 | 0/3 | 0/0 | 3/6 +1 disabled | 2/40 | 0/2 | FAIL: disabled |
| student/offline-sync | B | 375 | list | | | | | | | ERROR (dev reload) |
| evaluator/evaluation-form | A | 1440 | evaluator | | | | | | | ERROR (dev reload) |
| evaluator/evaluation-form | A | 375 | evaluator | | | | | | | ERROR (dev reload) |
| evaluator/evaluation-form | B | 1440 | evaluator | 4/3 | 0/0 | 0/0 | 4/4 +1 disabled | 37/15 | 1/2 | FAIL: regions, disabled, words |
| evaluator/evaluation-form | B | 375 | evaluator | 4/3 | 0/0 | 0/0 | 4/4 +1 disabled | 31/15 | 0/2 | FAIL: regions, disabled, words |
| evaluator/evaluation-form | C | 1440 | evaluator | 4/3 | 0/0 | 0/0 | 2/4 | 16/15 | 0/2 | FAIL: regions, words |
| evaluator/evaluation-form | C | 375 | evaluator | 4/3 | 0/0 | 0/0 | 2/4 | 12/15 | 0/2 | FAIL: regions |
| evaluator/submitted | A | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 36/15 | 1/2 | FAIL: words |
| evaluator/submitted | A | 375 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 34/15 | 1/2 | FAIL: words |
| evaluator/submitted | B | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 0/4 | 39/15 | 0/2 | FAIL: words |
| evaluator/submitted | B | 375 | evaluator | 3/3 | 0/0 | 0/0 | 0/4 | 37/15 | 0/2 | FAIL: words |
| evaluator/submitted | C | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 17/15 | 1/2 | FAIL: words |
| evaluator/submitted | C | 375 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 15/15 | 1/2 | PASS |
| evaluator/expired | A | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 16/15 | 0/2 | FAIL: words |
| evaluator/expired | A | 375 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 14/15 | 0/2 | PASS |
| evaluator/expired | B | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 15/15 | 0/2 | PASS |
| evaluator/expired | B | 375 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 13/15 | 0/2 | PASS |
| evaluator/expired | C | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 2/4 | 21/15 | 0/2 | FAIL: words |
| evaluator/expired | C | 375 | evaluator | 3/3 | 0/0 | 0/0 | 2/4 | 19/15 | 0/2 | FAIL: words |
| evaluator/invitation-email | A | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 4/4 | 73/15 | 0/2 | FAIL: words, repeats |
| evaluator/invitation-email | A | 375 | evaluator | 3/3 | 0/0 | 0/0 | 4/4 | 45/15 | 0/2 | FAIL: words, repeats |
| evaluator/invitation-email | B | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 2/4 | 50/15 | 0/2 | FAIL: words |
| evaluator/invitation-email | B | 375 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 43/15 | 0/2 | FAIL: words |
| evaluator/invitation-email | C | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 0/4 | 118/15 | 0/2 | FAIL: words |
| evaluator/invitation-email | C | 375 | evaluator | 3/3 | 0/0 | 0/0 | 0/4 | 118/15 | 0/2 | FAIL: words |
| lab-instructor/lab-batch-grid | A | 1440 | list | 5/4 | 0/3 | 0/0 | 3/6 | 21/40 | 0/2 | FAIL: regions |
| lab-instructor/lab-batch-grid | B | 1440 | list | 5/4 | 0/3 | 0/0 | 5/6 | 24/40 | 0/2 | FAIL: regions |
| reviewer/approvals | A | 1440 | list | 1/4 | 0/3 | 0/0 | 0/6 | 0/40 | 0/2 | PASS |
| reviewer/approvals | B | 1440 | list | 4/4 | 3/3 | 0/0 | 5/6 | 2/40 | 1/2 | PASS |
| reviewer/approvals | C | 1440 | list | 3/4 | 4/3 | 0/0 | 9/6 | 25/40 | 1/2 | FAIL: figures, controls |
| reviewer/review-item | A | 1440 | detail | 4/5 | 0/4 | 0/1 | 4/6 | 25/40 | 1/2 | PASS |
| reviewer/review-item | B | 1440 | detail | 3/5 | 0/4 | 0/1 | 0/6 | 27/40 | 0/2 | PASS |
| reviewer/review-item | C | 1440 | detail | 2/5 | 1/4 | 0/1 | 7/6 | 31/40 | 1/2 | FAIL: controls |
| reviewer/student-record | A | 1440 | detail | 3/5 | 0/4 | 0/1 | 6/6 | 7/40 | 0/2 | PASS |
| reviewer/student-record | B | 1440 | detail | | | | | | | ERROR (dev reload) |
| reviewer/students | A | 1440 | list | 5/4 | 0/0 | 0/0 | 10/6 | 0/40 | 1/2 | FAIL: regions, controls |
| reviewer/students | B | 1440 | list | 4/4 | 0/3 | 0/0 | 21/6 | 34/40 | 1/2 | FAIL: controls |
| reviewer/students | C | 1440 | list | 4/4 | 0/3 | 0/0 | 19/6 | 52/40 | 1/2 | FAIL: controls, words |
| director/dashboard | A | 1440 | dashboard | 5/5 | 4/4 | 1/3 | 5/8 | 0/40 | 1/2 | PASS |
| director/dashboard | B | 1440 | dashboard | 4/5 | 3/4 | 1/3 | 5/8 | 0/40 | 1/2 | PASS |
| director/dashboard | C | 1440 | dashboard | 4/5 | 0/4 | 0/3 | 9/8 | 0/40 | 1/2 | FAIL: controls |
| director/verification-detail | A | 1440 | detail | 4/5 | 1/4 | 0/1 | 1/6 | 26/40 | 1/2 | PASS |
| director/verification-detail | B | 1440 | detail | 5/5 | 1/4 | 0/1 | 8/6 | 24/40 | 1/2 | FAIL: controls |
| director/reports | A | 1440 | list | 4/4 | 0/3 | 0/0 | 8/6 | 0/40 | 0/2 | FAIL: controls |
| director/reports | B | 1440 | list | 5/4 | 0/0 | 0/0 | 9/6 | 27/40 | 0/2 | FAIL: regions, controls |
| director/attainment | A | 1440 | dashboard | 3/5 | 3/4 | 0/3 | 6/8 | 8/40 | 1/2 | PASS |
| director/attainment | B | 1440 | dashboard | 3/5 | 3/4 | 0/3 | 9/8 | 8/40 | 1/2 | FAIL: controls |

## 8. Full table, after

| Screen | V | Viewport | Type | Regions | Figures | Charts | Controls | Words | Hues | Result | Over |
|---|---|---|---|---|---|---|---|---|---|---|---|
| admin/dashboard | A | 1440 | dashboard | 4/5 | 4/4 | 3/3 | 7/8 | 30/40 | 1/2 | PASS |  |
| admin/dashboard | B | 1440 | dashboard | 4/5 | 0/4 | 0/3 | 12/8 | 7/40 | 1/2 | FAIL | controls |
| admin/dashboard | C | 1440 | dashboard | 3/5 | 4/4 | 1/3 | 7/13 | 0/40 | 1/2 | PASS |  (exception: D-X21: variant C's 5 question tabs are accepted as controls) |
| admin/dashboard | D | 1440 | dashboard | 5/5 | 4/4 | 1/3 | 7/8 | 17/40 | 1/2 | PASS |  |
| admin/dashboard | E | 1440 | dashboard | 4/5 | 4/4 | 0/3 | 6/8 | 0/40 | 0/2 | PASS |  |
| admin/dashboard | F | 1440 | dashboard | 5/5 | 4/4 | 2/3 | 7/8 | 38/40 | 1/2 | PASS |  |
| admin/dashboard-drill | A | 1440 | list | 4/4 | 0/3 | 0/0 | 5/6 | 0/40 | 1/2 | PASS |  |
| admin/dashboard-drill | B | 1440 | list | 4/4 | 0/3 | 0/0 | 6/6 | 11/40 | 1/2 | PASS |  |
| admin/skills-library | A | 1440 | list | 3/4 | 3/3 | 0/0 | 6/6 | 0/40 | 0/2 | PASS |  |
| admin/skills-library | B | 1440 | list | 2/4 | 3/3 | 0/0 | 5/6 | 1/40 | 1/2 | PASS |  |
| admin/skills-library | C | 1440 | list | 2/4 | 0/3 | 0/0 | 5/6 | 20/40 | 1/2 | PASS |  |
| admin/add-skill | A | 1440 | form | 4/4 | 0/1 | 0/1 | 7/7 fields | 32/40 | 0/2 | PASS |  |
| admin/add-skill | B | 1440 | form | 4/4 | 0/1 | 0/1 | 2/7 fields | 8/40 | 0/2 | PASS |  |
| admin/import-ai-review | A | 1440 | form | 2/4 | 0/1 | 0/1 | 1/7 fields | 33/40 | 0/2 | PASS |  |
| admin/import-ai-review | B | 1440 | form | 2/4 | 0/1 | 0/1 | 1/7 fields | 26/40 | 0/2 | PASS |  |
| admin/starter-library | A | 1440 | list | 4/4 | 0/3 | 0/0 | 3/6 | 18/40 | 0/2 | PASS |  |
| admin/starter-library | B | 1440 | list | 2/4 | 0/3 | 0/0 | 6/6 | 18/40 | 0/2 | PASS |  |
| admin/configure-skill | A | 1440 | form | 2/4 | 0/1 | 0/1 | 1/7 fields | 37/40 | 0/2 | PASS |  |
| admin/configure-skill | B | 1440 | form | 3/4 | 0/1 | 0/1 | 7/7 fields | 33/40 | 0/2 | PASS |  |
| admin/configure-skill | C | 1440 | form | 4/4 | 0/1 | 0/1 | 3/7 fields | 37/40 | 0/2 | PASS |  |
| admin/rule-change-impact | A | 1440 | detail | 2/5 | 0/4 | 0/1 | 1/6 | 19/40 | 1/2 | PASS |  |
| admin/rule-change-impact | B | 1440 | detail | 3/5 | 0/4 | 0/1 | 0/6 | 26/40 | 1/2 | PASS |  |
| admin/retire-deactivate | A | 1440 | form | 3/4 | 0/1 | 0/1 | 2/7 fields | 16/40 | 0/2 | PASS |  |
| admin/retire-deactivate | B | 1440 | form | 3/4 | 0/1 | 0/1 | 0/7 fields | 0/40 | 0/2 | PASS |  |
| admin/course-mapping | A | 1440 | list | 4/4 | 0/3 | 0/0 | 6/6 | 25/40 | 1/2 | PASS |  |
| admin/course-mapping | B | 1440 | list | 4/4 | 0/3 | 0/0 | 4/6 | 16/40 | 1/2 | PASS |  |
| admin/lists-cohorts | A | 1440 | list | 3/4 | 0/3 | 0/0 | 1/6 | 24/40 | 0/2 | PASS |  |
| admin/lists-cohorts | B | 1440 | list | 3/4 | 0/3 | 0/0 | 1/6 | 20/40 | 0/2 | PASS |  |
| admin/evaluator-directory | A | 1440 | list | 4/4 | 3/3 | 0/0 | 5/6 | 4/40 | 1/2 | PASS |  |
| admin/evaluator-directory | B | 1440 | list | 4/4 | 3/3 | 0/0 | 4/6 | 8/40 | 1/2 | PASS |  |
| admin/settings | A | 1440 | list | 4/4 | 0/0 | 0/0 | 6/6 | 0/40 | 0/2 | PASS |  |
| admin/settings | B | 1440 | list | 3/4 | 0/3 | 0/0 | 4/6 | 20/40 | 0/2 | PASS |  |
| admin/attainment | A | 1440 | dashboard | 4/5 | 0/4 | 0/3 | 8/8 | 0/40 | 1/2 | PASS |  |
| admin/attainment | B | 1440 | dashboard | 4/5 | 0/4 | 0/3 | 8/8 | 9/40 | 0/2 | PASS |  |
| admin/export | A | 1440 | form | 5/4 | 0/1 | 0/1 | 6/7 fields | 31/40 | 1/2 | FAIL | regions |
| admin/export | B | 1440 | form | 4/4 | 0/1 | 0/1 | 5/7 fields | 34/40 | 0/2 | PASS |  |
| admin/approvals | A | 1440 | list | 4/4 | 3/3 | 0/0 | 5/6 | 0/40 | 1/2 | PASS |  |
| admin/approvals | B | 1440 | list | 4/4 | 3/3 | 0/0 | 4/6 | 20/40 | 1/2 | PASS |  |
| student/home | A | 1440 | student | 4/4 | 3/3 | 0/1 | 4/4 | 34/40 | 1/3 | PASS |  |
| student/home | A | 375 | student | 3/4 | 3/3 | 0/1 | 4/4 | 18/25 | 1/3 | PASS |  |
| student/home | B | 1440 | student | 3/4 | 3/3 | 1/1 | 3/4 | 5/40 | 1/3 | PASS |  |
| student/home | B | 375 | student | 3/4 | 3/3 | 1/1 | 3/4 | 5/25 | 1/3 | PASS |  |
| student/home | C | 1440 | student | 4/4 | 3/3 | 1/1 | 2/4 | 14/40 | 1/3 | PASS |  |
| student/home | C | 375 | student | 3/4 | 3/3 | 1/1 | 2/4 | 14/25 | 1/3 | PASS |  |
| student/log-skill | A | 1440 | form | 4/4 | 0/1 | 0/1 | 4/7 fields | 3/40 | 1/2 | PASS |  |
| student/log-skill | A | 375 | form | 3/4 | 0/1 | 0/1 | 2/7 fields | 0/25 | 1/2 | PASS |  |
| student/log-skill | B | 1440 | form | 4/4 | 0/1 | 0/1 | 1/7 fields | 29/40 | 1/2 | PASS |  |
| student/log-skill | B | 375 | form | 3/4 | 0/1 | 0/1 | 1/7 fields | 13/25 | 1/2 | PASS |  |
| student/request-signoff | A | 1440 | form | 3/4 | 0/1 | 0/1 | 2/7 fields | 0/40 | 1/2 | PASS |  |
| student/request-signoff | A | 375 | form | 2/4 | 0/1 | 0/1 | 2/7 fields | 0/25 | 1/2 | PASS |  |
| student/request-signoff | B | 1440 | form | 2/4 | 0/1 | 0/1 | 1/7 fields | 0/40 | 1/2 | PASS |  |
| student/request-signoff | B | 375 | form | 2/4 | 0/1 | 0/1 | 1/7 fields | 0/25 | 1/2 | PASS |  |
| student/my-requests | A | 1440 | list | 3/4 | 0/3 | 0/0 | 3/6 | 8/40 | 1/2 | PASS |  |
| student/my-requests (stu-g-067) | A | 1440 | list | 2/4 | 0/3 | 0/0 | 3/6 | 9/40 | 1/2 | PASS |  |
| student/my-requests | A | 375 | list | 2/4 | 0/3 | 0/0 | 2/6 | 8/25 | 1/2 | PASS |  |
| student/my-requests (stu-g-067) | A | 375 | list | 2/4 | 0/3 | 0/0 | 3/6 | 9/25 | 1/2 | PASS |  |
| student/my-requests | B | 1440 | list | 2/4 | 0/0 | 0/0 | 4/6 | 8/40 | 1/2 | PASS |  |
| student/my-requests (stu-g-067) | B | 1440 | list | 2/4 | 0/0 | 0/0 | 4/6 | 9/40 | 1/2 | PASS |  |
| student/my-requests | B | 375 | list | 2/4 | 0/0 | 0/0 | 4/6 | 8/25 | 1/2 | PASS |  |
| student/my-requests (stu-g-067) | B | 375 | list | 2/4 | 0/0 | 0/0 | 4/6 | 9/25 | 1/2 | PASS |  |
| student/fix-returned | A | 1440 | form | 3/4 | 0/1 | 0/1 | 5/7 fields | 19/40 | 1/2 | PASS |  |
| student/fix-returned (stu-g-067) | A | 1440 | form | 3/4 | 0/1 | 0/1 | 3/7 fields | 18/40 | 1/2 | PASS |  |
| student/fix-returned | A | 375 | form | 3/4 | 0/1 | 0/1 | 5/7 fields | 19/25 | 1/2 | PASS |  |
| student/fix-returned (stu-g-067) | A | 375 | form | 3/4 | 0/1 | 0/1 | 3/7 fields | 18/25 | 1/2 | PASS |  |
| student/fix-returned | B | 1440 | form | 4/4 | 0/1 | 0/1 | 5/7 fields | 19/40 | 1/2 | PASS |  |
| student/fix-returned (stu-g-067) | B | 1440 | form | 4/4 | 0/1 | 0/1 | 3/7 fields | 18/40 | 1/2 | PASS |  |
| student/fix-returned | B | 375 | form | 4/4 | 0/1 | 0/1 | 4/7 fields | 19/25 | 1/2 | PASS |  |
| student/fix-returned (stu-g-067) | B | 375 | form | 4/4 | 0/1 | 0/1 | 2/7 fields | 18/25 | 1/2 | PASS |  |
| student/skill-detail | A | 1440 | detail | 4/5 | 1/4 | 0/1 | 2/6 | 21/40 | 1/2 | PASS |  |
| student/skill-detail | A | 375 | detail | 3/5 | 1/4 | 0/1 | 2/6 | 21/25 | 1/2 | PASS |  |
| student/skill-detail | B | 1440 | detail | 4/5 | 1/4 | 0/1 | 2/6 | 10/40 | 1/2 | PASS |  |
| student/skill-detail | B | 375 | detail | 4/5 | 1/4 | 0/1 | 2/6 | 10/25 | 1/2 | PASS |  |
| student/record | A | 1440 | list | 3/4 | 3/3 | 0/0 | 5/6 | 0/40 | 1/2 | PASS |  |
| student/record (stu-g-067) | A | 1440 | list | 3/4 | 3/3 | 0/0 | 5/6 | 1/40 | 1/2 | PASS |  |
| student/record | A | 375 | list | 3/4 | 3/3 | 0/0 | 5/6 | 24/25 | 1/2 | PASS |  |
| student/record (stu-g-067) | A | 375 | list | 3/4 | 3/3 | 0/0 | 5/6 | 1/25 | 0/2 | PASS |  |
| student/record | B | 1440 | list | 3/4 | 3/3 | 0/0 | 5/6 | 0/40 | 1/2 | PASS |  |
| student/record (stu-g-067) | B | 1440 | list | 3/4 | 3/3 | 0/0 | 5/6 | 1/40 | 1/2 | PASS |  |
| student/record | B | 375 | list | 3/4 | 3/3 | 0/0 | 5/6 | 24/25 | 1/2 | PASS |  |
| student/record (stu-g-067) | B | 375 | list | 3/4 | 3/3 | 0/0 | 5/6 | 19/25 | 1/2 | PASS |  |
| student/share-record | A | 1440 | detail | 3/5 | 0/4 | 0/1 | 2/6 | 34/40 | 1/2 | PASS |  |
| student/share-record | A | 375 | detail | 3/5 | 0/4 | 0/1 | 1/6 | 17/25 | 1/2 | PASS |  |
| student/share-record | B | 1440 | detail | 3/5 | 3/4 | 0/1 | 3/6 | 12/40 | 1/2 | PASS |  |
| student/share-record | B | 375 | detail | 3/5 | 3/4 | 0/1 | 3/6 | 12/25 | 1/2 | PASS |  |
| student/offline-sync | A | 1440 | list | 4/4 | 0/3 | 0/0 | 5/6 | 7/40 | 1/2 | PASS |  |
| student/offline-sync | A | 375 | list | 4/4 | 0/3 | 0/0 | 4/6 | 7/25 | 1/2 | PASS |  |
| student/offline-sync | B | 1440 | list | 3/4 | 0/3 | 0/0 | 3/6 | 2/40 | 0/2 | PASS |  |
| student/offline-sync | B | 375 | list | 3/4 | 0/3 | 0/0 | 3/6 | 2/25 | 0/2 | PASS |  |
| evaluator/evaluation-form | A | 1440 | evaluator | 5/3 | 0/0 | 0/0 | 5/7 | 34/15 | 0/2 | FAIL | regions, words |
| evaluator/evaluation-form | A | 375 | evaluator | 5/3 | 0/0 | 0/0 | 4/7 | 30/15 | 0/2 | FAIL | regions, words |
| evaluator/evaluation-form | B | 1440 | evaluator | 4/3 | 0/0 | 0/0 | 4/4, 1 disabled | 37/15 | 1/2 | FAIL | regions, disabled, words |
| evaluator/evaluation-form | B | 375 | evaluator | 4/3 | 0/0 | 0/0 | 4/4, 1 disabled | 31/15 | 0/2 | FAIL | regions, disabled, words |
| evaluator/evaluation-form | C | 1440 | evaluator | 4/3 | 0/0 | 0/0 | 2/4 | 16/15 | 0/2 | FAIL | regions, words |
| evaluator/evaluation-form | C | 375 | evaluator | 4/3 | 0/0 | 0/0 | 2/4 | 12/15 | 0/2 | FAIL | regions |
| evaluator/submitted | A | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 36/15 | 1/2 | FAIL | words |
| evaluator/submitted | A | 375 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 34/15 | 1/2 | FAIL | words |
| evaluator/submitted | B | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 0/4 | 39/15 | 0/2 | FAIL | words |
| evaluator/submitted | B | 375 | evaluator | 3/3 | 0/0 | 0/0 | 0/4 | 37/15 | 0/2 | FAIL | words |
| evaluator/submitted | C | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 17/15 | 1/2 | FAIL | words |
| evaluator/submitted | C | 375 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 15/15 | 1/2 | PASS |  |
| evaluator/expired | A | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 16/15 | 0/2 | FAIL | words |
| evaluator/expired | A | 375 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 14/15 | 0/2 | PASS |  |
| evaluator/expired | B | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 15/15 | 0/2 | PASS |  |
| evaluator/expired | B | 375 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 13/15 | 0/2 | PASS |  |
| evaluator/expired | C | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 2/4 | 21/15 | 0/2 | FAIL | words |
| evaluator/expired | C | 375 | evaluator | 3/3 | 0/0 | 0/0 | 2/4 | 19/15 | 0/2 | FAIL | words |
| evaluator/invitation-email | A | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 4/4 | 73/15 | 0/2 | FAIL | words, repeats |
| evaluator/invitation-email | A | 375 | evaluator | 3/3 | 0/0 | 0/0 | 4/4 | 45/15 | 0/2 | FAIL | words, repeats |
| evaluator/invitation-email | B | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 2/4 | 50/15 | 0/2 | FAIL | words |
| evaluator/invitation-email | B | 375 | evaluator | 3/3 | 0/0 | 0/0 | 1/4 | 43/15 | 0/2 | FAIL | words |
| evaluator/invitation-email | C | 1440 | evaluator | 3/3 | 0/0 | 0/0 | 0/4 | 118/15 | 0/2 | FAIL | words |
| evaluator/invitation-email | C | 375 | evaluator | 3/3 | 0/0 | 0/0 | 0/4 | 118/15 | 0/2 | FAIL | words |
| lab-instructor/lab-batch-grid | A | 1440 | list | 4/4 | 0/3 | 0/0 | 3/6 | 21/40 | 0/2 | PASS |  |
| lab-instructor/lab-batch-grid | B | 1440 | list | 4/4 | 0/3 | 0/0 | 5/6 | 24/40 | 0/2 | PASS |  |
| reviewer/approvals | A | 1440 | list | 4/4 | 3/3 | 0/0 | 4/6 | 0/40 | 1/2 | PASS |  |
| reviewer/approvals | B | 1440 | list | 5/4 | 3/3 | 0/0 | 8/6 | 26/40 | 1/2 | FAIL | regions, controls |
| reviewer/approvals | C | 1440 | list | 3/4 | 0/3 | 0/0 | 6/6 | 19/40 | 1/2 | PASS |  |
| reviewer/review-item | A | 1440 | detail | 4/5 | 0/4 | 0/1 | 4/6 | 25/40 | 1/2 | PASS |  |
| reviewer/review-item | B | 1440 | detail | 3/5 | 0/4 | 0/1 | 0/6 | 27/40 | 0/2 | PASS |  |
| reviewer/review-item | C | 1440 | detail | 2/5 | 1/4 | 0/1 | 6/6 | 31/40 | 1/2 | PASS |  |
| reviewer/student-record | A | 1440 | detail | 3/5 | 0/4 | 0/1 | 6/6 | 7/40 | 0/2 | PASS |  |
| reviewer/student-record | B | 1440 | detail | 3/5 | 0/4 | 0/1 | 3/6 | 10/40 | 0/2 | PASS |  |
| reviewer/students | A | 1440 | list | 5/4 | 0/0 | 0/0 | 10/6 | 0/40 | 1/2 | FAIL | regions, controls |
| reviewer/students | B | 1440 | list | 4/4 | 0/3 | 0/0 | 21/6 | 34/40 | 1/2 | FAIL | controls |
| reviewer/students | C | 1440 | list | 4/4 | 0/3 | 0/0 | 19/6 | 52/40 | 1/2 | FAIL | controls, words |
| director/dashboard | A | 1440 | dashboard | 5/5 | 4/4 | 1/3 | 5/8 | 0/40 | 1/2 | PASS |  |
| director/dashboard | B | 1440 | dashboard | 4/5 | 3/4 | 1/3 | 5/8 | 0/40 | 1/2 | PASS |  |
| director/dashboard | C | 1440 | dashboard | 4/5 | 0/4 | 0/3 | 8/8 | 0/40 | 1/2 | PASS |  |
| director/verification-detail | A | 1440 | detail | 4/5 | 1/4 | 0/1 | 1/6 | 26/40 | 1/2 | PASS |  |
| director/verification-detail | B | 1440 | detail | 5/5 | 1/4 | 0/1 | 4/6 | 32/40 | 1/2 | PASS |  |
| director/reports | A | 1440 | list | 4/4 | 0/3 | 0/0 | 6/6 | 0/40 | 0/2 | PASS |  |
| director/reports | B | 1440 | list | 4/4 | 0/3 | 0/0 | 6/6 | 27/40 | 0/2 | PASS |  |
| director/attainment | A | 1440 | dashboard | 3/5 | 3/4 | 0/3 | 6/8 | 8/40 | 1/2 | PASS |  |
| director/attainment | B | 1440 | dashboard | 3/5 | 3/4 | 0/3 | 9/8 | 8/40 | 1/2 | FAIL | controls |
