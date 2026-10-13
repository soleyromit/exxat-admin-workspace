# Design contract: S-04 Library, skills list

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Written 2026-10-08. Tags: `[REQ id]` `[OD-n]` `[PROTO]` `[CALL 09-23]` `[CALL 03-05]` `[INFER]`. Precedence REQ > CALL > PROTO > INFER.

## 1. Surface and wave

**Surface.**
S-04 Library: skills list (tab 1 of 5 in the library)         Wave: W1 (bulk apply entry points are W2, see Scope)

## 2. Persona and RBAC

P-A Program administrator. P-R reviewer has read-only access (docs/ux/03 §9). RBAC row: Administrator (program scope).

## 3. Scope and data seen

Program-level library only: skill name, description, tags, category, evaluation model, criteria summary,  
mapped-course count, status, import batch label. NO student records, no evidence content (docs/strategy/06 §4).  
Must not: show per-student data, evaluator emails.

## 4. Job to be done and why

**Job-to-be-done.**
When my library is only partly configured, I want to find, create, configure, import and deactivate skills and  
see what still needs work, so I can open the module to students without silent gaps.

**Why → So what.**
The admin alone decides what "skilled" means (journeys/01 §Why). If this list hides unconfigured skills or lets  
them leak into mapping, every downstream actor inherits the damage. So-what: a visible, filterable worklist  
turns 200 imported skills into progress, not a silent gap [REQ IM-10].

## 5. Requirements and open decisions

| Group | IDs (all resolve in `docs/source/requirements.extracted.txt`) |
|---|---|
| Library | SL-01, SL-02, SL-03, SL-04, SL-06, SL-10, SL-11 |
| Import traces | IM-09, IM-10, IM-11, IM-12, IM-14 (entry point only) |
| Configuration entry | SC-01 |

Open decisions touched and the seam this surface keeps (none is decided here):

| OD | Seam on this surface |
|---|---|
| OD-04 submission-field defaults | The list never shows or implies "submission fields apply to all skills". The criteria summary column shows model and criteria only. |
| OD-15 activation distinct from configured+active | Status is rendered from two independent flags (`configured`, `active`). No separate "Activate" action is built. If OD-15 resolves to a distinct state, a third value is added to one enum. |
| OD-24 (proposed) deactivation with in-flight submission | Deactivation dialog states only what REQ SL-11 states. In-flight submissions are left in their current state; no new behaviour. |
| OD-01 mapping carry-forward | The "Courses" count links to S-10 at `…/course-mapping?skill={skillId}` (entry mode defined in the S-10 contract §9); it counts offerings mapped today and makes no claim about carry-forward. |

## 6. Prototype reference (keep / do not copy)

`docs/source/screens/08-library-skills.png`, `13-import-unconfigured-banner.png`.
**Keep `[PROTO]`:** criteria summary column; unconfigured banner with count and "Show them"; row-level Configure for unconfigured rows; Courses count as link.
**Do NOT copy:** icons on Import and Add skill buttons; the prototype's generic "Category A / Tag A" seed text as ship content `[REQ SL-01]`; a second filled blue in the toolbar; uppercase tracking-wide column headers (docs/ux/10 §8); placeholder description text on every row.
**Prototype did not show (net-new):** import-batch filter `[REQ IM-11]`, bulk apply `[REQ IM-14]`, per-row inactive handling.

## 7. Pattern and reference hub

- **Pattern:** route `{base}/library/skills?q=&category=&tag=&status=&batch=` with the five library tabs (docs/ux/03 §4). Filters live in the query string.
- **Reference hub (read in repo):** `apps/pce/admin/components/admin/admin-hub-client.tsx`: `ListPageTemplate` + `HubTable` + `ViewTab`, a `LocalBanner` above the table, per-view `emptyState`, an import sheet as the primary action. Table primitives: `apps/pce/admin/components/data-table/` (`use-table-state.ts`, `row-actions.tsx`). We take its shape (hub + tabs + banner + table) and **do not** take its KeyMetrics band: REQ asks for none on the library `[REQ SL-10, IM-10]`; the unconfigured count is a banner, not a KPI.
- **Interactions:** docs/ux/08 P-05 (bulk apply/copy), P-06 (filter chips), P-13 (focus maps), P-14 (loading), P-15 (deactivate), P-17 (error recovery).

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** `DataTable`, `FilterBar` (+ Add/Clear), `Tabs`, `StatusBadge` all IMPORT. `BadgeCount` IMPORT for selection tallies only (red by design). EmptyState = VENDOR.


Verified 2026-10-08: `node tools/ds/source.mjs <C>` (resolves `@exxatdesignux/ui@1.5.1`) and `dist/index.d.ts` of `1.6.5` under `apps/pce/admin/node_modules`. Every component below is exported in both. **Version pin caveat (docs/ux/10 banner):** this product has no pinned version yet; proposal: pin `^1.6.5` like PCE and re-run the checks before build.

| Need | Component | Verdict | Notes |
|---|---|---|---|
| Hub frame, tabs | `Tabs` (`TabsList variant="line"`) | IMPORT | five library tabs, roving tabindex |
| Skills table | `DataTable` (`toolbarSlot`, `toolbarActions`, `searchable`, `emptyState`, `bulkActionsSlot`) | IMPORT | never raw `<table>` |
| Filters | `FilterBar` (+ `FilterBarAddButton`, clear) | IMPORT | category incl. "No category", tag, status incl. "Needs configuration", import batch |
| Status | `StatusBadge` semantic `label` + `tone` + `icon`, `size` `sm`/`md` only | IMPORT | tones verified in 1.6.5: `success`, `warning`, `info`, `danger`, `neutral`. Proposed: Active=success, Inactive=neutral, Needs configuration=warning. Text is always present `[WCAG 1.4.1]` |
| Model badge, tags | `Badge` | IMPORT | explicit `variant` |
| Selection tally | `BadgeCount` | IMPORT | red by design; selection tallies only (docs/ux/10 §6) |
| Unconfigured banner | `LocalBanner variant="info"` | IMPORT | no toast |
| Deactivate confirm | `Dialog` | IMPORT | P-15 |
| Row menu | `DropdownMenu` | IMPORT | Edit, Configure, Deactivate |
| Buttons | `Button` explicit `variant`+`size`, text only | IMPORT | Add skill = filled primary; Import = `outline` |
| Search | `Input`/`InputGroup` or DataTable `searchable` | IMPORT | |
| Loading | `Skeleton` | IMPORT | |
| Empty state | `EmptyState` not exported by DS | VENDOR | `apps/pce/admin/components/empty-state.tsx` (props `icon, title, description, steps?, footer?, align?`) |

Banned here: raw `<table>`/`<button>`, `toast()`, hex/rgb, `uppercase tracking-wide`, icons on action buttons, `py-20 text-center` empties.

## 9. Layout, content and behaviour

Wireframe: docs/ux/07 §S-04. Regions: page header (title + subtitle) · unconfigured `LocalBanner` (only when ≥1) · library tabs · filter row · table · bulk bar (appears on selection).
- **Exactly one filled primary:** `Add skill`. Secondary: `Import` (outline), row `Edit`/`Configure`, bulk `Apply configuration` (P-05, W2), bulk `Deactivate skill`.
- **Columns:** Skill (name + description + tags) · Category · Evaluation model · Achieves when · Courses · Status · row action. Order from docs/ux/09 §5 S-04.
- **Default sort:** name ascending. Deactivated rows hidden unless Status filter includes Inactive `[INFER]`.
- **Progress line** "{configured} of {total} configured" shown with the banner `[INFER]`; **"Configure next"** lives in S-09 and returns here at the same scroll position `[INFER]`.
- **Unconfigured rows** are not selectable for mapping (S-10) or student submission (S-12) `[REQ IM-09]`; the row says why in text.

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour |
|---|---|
| **L**oading | Skeleton rows in table shape, tabs and header render immediately; announce "Loading skills" (polite) |
| **E**mpty | Library empty: `EmptyState` with copy 09 §5 S-04 "Your library is empty…" and two next steps (Import, Add skill); never pre-supplies skills `[REQ SL-01]`. Filtered-to-zero: "No skills match these filters." + Clear filters |
| **Er**ror | Fetch failure: `LocalBanner variant="error"` with Try again, filters preserved (P-17); row action failure: banner with Retry, row state unchanged |
| **V**alidation | None inline on this surface (editing happens in S-09). Search input accepts any text |
| **S**aving | Deactivate/reactivate: button shows busy and disabled; row not changed optimistically for anything that affects scope `[INFER, P-14]` |
| **Su**ccess | `LocalBanner variant="success"` "{Skill} deactivated. Evidence already recorded is kept." with Undo link omitted (REQ silent); dismissible, never auto-dismissed |
| **D**isabled | Bulk actions disabled with reason when selection includes rows the action cannot apply to (for example Apply configuration with only unconfigured sources, copy needs a configured source) |
| **P**artial | Part-configured library = the normal state: banner count + status column + `Status: Needs configuration` filter `[REQ IM-10]` |
| **Bl**ocked | Row cannot be mapped/submitted because unconfigured: text reason on the row. Deactivate blocked: never (REQ allows); effect on mapped offerings listed in the dialog `[F-14]` |

## 11. Edge cases

EC-9 (inactive category/tag stays on skill as inactive; the Category column shows "{name} (inactive)" and the row remains filterable) · EC-10 (deactivated skill with evidence: withdrawn from scope, evidence retained) · EC-27 (second import: both batches visible via the batch filter, no overwrite) · EC-28 (unconfigured cannot be mapped or submitted) · 200+ rows (server-side filter/sort, table virtualised) `[INFER]`.

## 12. Copy and interactions

Owned by `docs/ux/09` §5 **S-04**, §3.1 buttons, §3.2 banners, §4 status labels, §8 empty/error/blocked index. Do not duplicate here. The **Import batch** filter (REQ IM-11) was missing from 09 and is now added there (fix pass; 07 + REQ win on existence of an element).

## 13. Accessibility (WCAG 2.1 AA)

- **Keyboard path:** page → tabs (arrows) → search → filter chips → Add filter → table (grid semantics, arrows move rows, Enter opens the row action menu or S-09) → bulk bar when present. Skip link to table.
- **Focus:** after Deactivate dialog closes focus returns to the row's menu button; after "Show them" focus moves to the table caption/first filtered row; focus ring always visible.
- **Targets** ≥24×24 CSS px (admin density), row checkbox with `CheckboxLabel` for a larger hit area `[INFER]`.
- **Status not colour-only:** `StatusBadge` always carries its label text; the Needs configuration state also appears as text in the Model column ("Not configured").
- **Announcements:** filter result count (polite); banner count changes (polite).
- `aria-rowcount` for large libraries; sticky header must not hide the focused row (P-13).

## 14. Out of scope

REQ §14: remediation workflow, notifications/reminders/escalation, skill currency/expiry, linkage to patient encounter or clinical hours, accreditation-ready outputs beyond exports, migration from the Evaluations module. Also: pre-seeded skills or taxonomy `[REQ SL-01]`; hierarchical skills (OD-20); batch-evaluation grid (OD-19); category merge (not in REQ); permanent deletion `[INFER, P-15]`; KPI band; heatmaps.

## 15. Acceptance tests (Given / When / Then)

| # | Test | REQ |
|---|---|---|
| T1 | Given a new program with no skills, When I open S-04, Then the table is empty with an empty state offering Import and Add skill and no skill, category or tag is pre-supplied | SL-01 |
| T2 | Given skills, When I view the list, Then each shows name, description and an active/inactive status | SL-02 |
| T3 | Given a skill with category and tags, When I view it, Then at most one category and any number of tags display | SL-03, SL-04 |
| T4 | Given a category was deactivated after assignment, When I view the skill, Then the category shows as "(inactive)", is not in pickers, and stays until removed | SL-06 |
| T5 | Given 200 skills, When I search by name and filter by category, tag, status, Then the table narrows and each applied filter is visible and individually removable; Status includes "Needs configuration" | SL-10 |
| T6 | Given an active skill with evidence, When I deactivate it and confirm, Then it disappears from S-10 pickers and S-12 selection and reporting scope, and its evidence remains | SL-11 |
| T7 | Given imported skills, When I open S-04, Then they show "Needs configuration", are not selectable for mapping or submission, and a banner states the count | IM-09, IM-10 |
| T8 | Given two imports, When I filter by import batch, Then I see only skills from that batch and the library still holds both | IM-11 |
| T9 | Given I do not want to import, When I choose Add skill, Then I reach S-09 to create and configure one skill by hand | IM-12 |
| T10 | Given a configured source skill and 3 selected targets, When I choose Apply configuration, Then P-05 opens and a result banner reports applied vs overwritten counts (W2) | IM-14 |
| T11 | Given an unconfigured skill, When I open it, Then it exists in the library and "Configure" leads to S-09 | SC-01 |
| T12 | Given the page is rendered, Then there is exactly one filled primary (Add skill), no icon on text action buttons, and all statuses include text | global rules |

## 16. Risks and unknowns (max 3)

1. **Scale:** 200–500 skills with server filtering; table virtualisation approach to confirm in build.
2. **DS version pin:** 1.5.1 vs 1.6.5 behaviour of `DataTable` grouping and `bulkActionsSlot`; re-verify before build.
3. **OD-15** may add a third lifecycle value; the enum seam must allow it.

## 17. Vault notes consulted

- `Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw): activation only after configuration; 40–50 skills in Word/Excel/PDF; do not restrict to template.
- `Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md`: standalone program-level entity; hierarchical skills noted (OD-20).
- `_Insights.md` scanned (skills, import, configur, competenc): `Meetings/post-course-survey-cadence/2026-07-31-exact-prism-evaluation-setup-ux-feedback.md` (summary and Dashboard section read): a setup table with Not configured / In progress / Distributed states and bulk-select restricted to unconfigured items is a precedent for the worklist and bulk bar; precedent only, a different product.

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

- 07 S-04 lists an **Import batch** filter (REQ IM-11); 09 S-04 filter list omitted it: **resolved in the fix pass** (09 amended).
- 09 S-04 row actions say "Edit · Configure"; 07 shows a single [Configure/Edit] per row. Proposal: Configure when unconfigured, Edit otherwise (matches 09).
- 03 §4 route lists `?status=` but the batch parameter was not in the route scheme; this contract adds `batch=` `[INFER]` (ux/03 route scheme still to gain `batch=` and `skill=` on S-10; `skill=` added in the fix pass).

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** The library is ONE page, `/library/skills`, with five tabs in `?tab=` (Skills (n), Categories (n), Tags (n), Clinical Settings (n), Lab Instructors (n)). The Skills tab is a bordered card: toolbar (search, categories, tags, statuses, an Import-batch select when imports exist, Import, filled `Add skill`) and the table (Skill with description and tag chips, Category, Evaluation model, Achievement criteria, Courses link, Status, Edit or Configure). The old tab routes `/library/categories|tags|settings|lab-instructors` redirect to `?tab=`. Add skill, Edit and Configure open dialogs in place via `?dialog=add | configure&skill=<id> | import` (see S-08, S-09). Hand-offs `?status=unconfigured`, `?batch=<id>`, `?setting=<id>`, `?imported=<id>` are kept.

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-04, P-05 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** SL-01..SL-11, IM-09..IM-12, IM-11 batch filter and traceability, SL-11 deactivation from the status pill menu, Courses count linking to `/course-mapping?skill=<id>`, OD-15 seam, immutability of evidence on deactivation.

**Weakened or traded away (honest list):** (1) Row selection, the bulk Apply configuration bar and bulk Deactivate were removed because the prototype table has no selection column: IM-14 bulk apply is now only reachable from S-09 'Apply to selected skills' (S-04 T10 is not met on this table). (2) No 'Add filter' menu; the toolbar is selects, and a removable chip appears only for the setting filter. (3) The status pill is a button that opens a deactivate/reactivate menu (an addition to the prototype's static pill).
