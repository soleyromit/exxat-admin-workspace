# Prototype Parity Spec: build Sankalp's screens exactly, inside the DS base shell

**Written:** 2026-10-08 · **For:** five re-skin workers (R1..R5) · **Source of truth for LAYOUT, IA and COPY STRUCTURE:** `docs/source/prism-skills-prototype.html`
**Why this exists:** Romit's correction (2026-10-08): the built UI re-composed the screens instead of building Sankalp's mockup, and it did not use the DS base layout (left nav, top utility bar, page header). Product `CLAUDE.md` now says so.

## 0. The rule (read before touching code)

| Concern | Governed by | Meaning |
|---|---|---|
| Layout, region order, containers (modal vs page vs panel), IA, tab/column sets, button hierarchy, copy structure and exact strings | **The prototype** `[PROTO]` | Build it. Do not improvise, re-pattern or "improve". |
| Visual language (colour, type, radius, shadow, density tokens), component implementation, shell chrome | **The DS** (`@exxatdesignux/ui` 1.6.5) | Replace the prototype's raw Tailwind (navy sidebar, blue-700, slate-*) with DS tokens/components. Never override Card/Button shape. |
| Behaviour, validation, state rules, immutability, scoping | **REQ** `[REQ x]` + the engine (`lib/engine`) | Keep. Where the prototype's behaviour contradicts REQ, fix the behaviour, keep the layout (section 6). |
| Anything the prototype does not show (loading, error, empty, mobile) | Contracts `docs/build/contracts/*` + `docs/ux/06,08,09` | Add inside the prototype's visual frame. |

Precedence for visual questions: **PROTO > contract wireframes (docs/ux/07) > INFER**. The contract wireframes in `docs/ux/07` are superseded where they differ from this spec.

### Method and artifacts
Captured 2026-10-08 with Playwright (headless Chromium 1440x900) by `docs/source/walkthrough-scripts/parity-*.mjs` (rerun to refresh). For every state there are, in `docs/source/parity/`:
- `NN-name.png` full-page (or viewport, for overlays) screenshot; `NN-name-b.png` is the same overlay scrolled to its bottom.
- `NN-name.json` structured extraction: headings, buttons (with a `filled` flag for primary), tables (headers, row count, row height), overlays, full visible text, and a DOM tree with boxes and computed CSS.
- `NN-name.outline.txt` the tree flattened into an indented outline (**read this first**; it holds exact strings, positions and measurements). Regenerate with `python3 -I docs/source/walkthrough-scripts/parity-outline.py`.
- `manifest-*.json` capture index. The full index is in Appendix A.
Total: 126 captured states (plus bottom-scroll shots). Colours below are given as DS intent, not prototype hex.

## 1. DS base shell (replaces the prototype's shell, keeps its IA)

**Prototype shell** `[PROTO 01-shell-overview-by-student]`: fixed 240px left sidebar (navy), no top bar; sticky page header 87px tall (breadcrumb, title, subtitle); main padding 20px 24px; content column 1152px at 1440.
- Sidebar brand: `exxat` + `Prism` (16px/600). Three groups with uppercase 12px/600 labels and 1px separators: **ADMINISTRATOR** (Overview, Skills Library, Course Mapping, Review & Approve), **STUDENT** (Student View), **EVALUATOR** (Preceptor Evaluation). Each item 36px tall, 14px, icon + label, active item filled.
- Page header: `Skills & Competencies / Nursing` (12px, muted) above `h1` (18px/600), then a one-line subtitle (12px, muted). Subtitles: Overview "Skills attainment by student, by skill and by tag"; Skills Library "The program's skills, plus the categories, tags and settings that organise them"; Course Mapping "Set which skills are mandatory for each clinical course offering"; Review & Approve "Approve submitted evaluations for skills that require it"; Student View "What a student sees in their own login: pick skills, submit, track history"; Preceptor Evaluation "The form an evaluator opens from their emailed link — preceptors do not sign in to Prism".

**Build it in the DS base shell** (reference: `apps/pce/admin/app/(app)/layout.tsx`, `components/app-sidebar.tsx`, `components/utility-bar-slot.tsx`, `components/sidebar/*`; DS: `SidebarShell`, `AppSidebar`, `SidebarInset`, `SidebarNavLabel`/`NavSection`, `Breadcrumb*`, `PageHeader`, `useAppShellSlots`). Required, all visible on every page:
1. **Utility/top bar** across the full width (DS pattern from PCE `UtilityBarSlot`): product mark/label "Prism" (+ "Skills & Competencies"), sidebar trigger, global search/command slot, user/identity menu. Slots the DS provides but we have no contract for may stay empty, but the bar itself must render.
2. **Left nav** (`AppSidebar`) with the three prototype groups as nav sections: label **Administrator** / **Student** / **Evaluator**, same item labels and order, FA icons (prototype icons: Overview chart, Skills Library checklist, Course Mapping link, Review & Approve clipboard, Student View graduation cap, Preceptor Evaluation stethoscope), active state per DS. "Review & Approve" shows always (prototype); the conditional-visibility rule from the contracts is **kept as a count badge or hidden state only if** REQ SC-15 demands it: default = always visible as in the prototype.
3. **Page header** per page: `Breadcrumb` ("Skills & Competencies" / "Nursing") + `PageHeader title subtitle actions`. Title strings = the prototype's sidebar labels (Overview, Skills Library, Course Mapping, Review & Approve, Student View, Preceptor Evaluation). Actions slot holds the page-level buttons (e.g. Library: Import, Add skill).
4. Theme: Prism (pink/rose hue 342, never violet).
5. Density/measurements to match inside `SidebarInset`: content max column = viewport minus rail, page rhythm 16px between blocks (`space-y-4`), page padding 20x24 (use DS page padding; do not hardcode).
The three role groups live in ONE shell (as the prototype). The student and evaluator pages are therefore reachable from the same sidebar for the demo; the real production routes `/e/[token]` stay shell-free (REQ EV-01).

## 2. Shared patterns (prototype measurements, then DS mapping)

| Pattern | Prototype measurement `[PROTO]` | DS mapping (deep imports `@exxatdesignux/ui/components/ui/<name>`) |
|---|---|---|
| Card/panel | white, 1px border, radius 8px, pad 14x16 (KPI) / 0 (table card) | `Card` + slots; do not override radius/shadow |
| KPI strip | 4 equal columns (279px each at 1152, gap 12px); label 12px/500 uppercase tracking 0.3; value 24px/600; caption 12px muted; the 4th value is amber when attention needed | `KeyMetrics` (max 4, flat/card variant; label sentence case per DS voice is NOT allowed to change the strings: keep the prototype's wording, DS handles case) |
| Tabs in a card | 51px bar, pad 0 16, tab 14px/500, active = brand colour + 2px bottom border; counts in labels e.g. "Skills (9)" | `Tabs`/`TabsList variant="line"`/`TabsTrigger` + `TabsCountBadge` or text count |
| Toolbar in card | search 192x34 (left icon), sort select 192x33, Export outline button 80x26 12px/500 | `DataTable` toolbar slots; `Input` with search icon, `Select`, `Button variant="outline" size="sm"` |
| Table | th 33px, 12px/600 uppercase tracking 0.3 on a light header band; td 41px, name 14px/500, others 12px; 25 rows then footer "Showing 25 of 150 students ..." + `Show 25 more` | `DataTable` (+ `TableViewMoreFooter` for "Show 25 more"); header casing handled by DS, strings unchanged |
| Attainment cell | "78%" + 80px bar (amber fill, light track) | `ProgressCell` (the prototype's bar is part of the design; use DS tone tokens, not amber hex; never red) |
| Status pill | rounded, light tint + text ("Active" green, "Needs configuration" amber, model badge indigo, tags blue) | `StatusBadge` semantic (`tone`, size `sm`) / `Badge` |
| Dialog sizes | backdrop slate 40% opacity; panel top 48px; **large 1024px wide** (wizard 760 tall, student/history 701 tall, evaluation detail 515); **small 672px** (category/tag/setting/lab/add-skill dialogs) | `Dialog`/`DialogContent` at those widths (check `size` prop via `node tools/ds/source.mjs Dialog`) |
| Dialog anatomy | title 16px/600 + 12px muted subtitle + X (aria-label Close); body scrolls; footer border-top with right-aligned actions; wizard footer has left text "Step n of 3 — <name>" | `DialogHeader/Title/Description/Footer` |
| Info/warn banners | blue info bar, amber warn bar, green success bar; dismissible where shown | `LocalBanner` variants `info`/`warning`/`success` with `dismissible`, `action` |
| Selection tiles | 2x2 grid of bordered tiles, radio dot top-left, title 14/500 + description 12px, selected = brand border + tint | `SelectionTileGrid interaction="radio"` (SelectionTileGrid radio is wrapped; see docs/ux/10 DS defect note about the detached radio input: keep the local workaround) |
| Segmented pair (Clinical / Lab, Mandatory / Non-mandatory) | two bordered pills, selected has check + brand border | `ButtonSegmentedControl` (exported) or `RadioGroup` pills; keyboard arrows must work |
| Toggle rows (workflow) | label, description, On/Off switch right | `ToggleSwitch` (controlled) with visible On/Off text |
| Empty state | "Nothing awaiting review" + description + outline button | vendored `EmptyState` |
| Sticky action bar | bottom of content, bordered card: "<n> skills selected" + Clear + filled "Send for review" | hand-roll on `BadgeCount` + `Button` (documented hand-roll C-17) |
| Wizard stepper | 3 steps with check/number circles and chevrons, current step in brand tint pill | **DS `Wizard`** (`Wizard`, `WizardNav`, `WizardPanel`, `WizardFooter`; exported in 1.6.5). **Correction:** earlier docs said "Stepper not exported"; the DS ships `Wizard`. Use it. |

Colour/typography rule for every card below: **translate prototype colours to DS tokens** (`--muted-foreground`, `--border`, brand/primary, success/warning/info tones). No red in score or status visuals (workspace rule: Aarti). Do not copy the prototype's uppercase 12px field labels if the DS Field label style differs: keep the *text*, use `FieldLabel`.

## 3. Parity cards

Each card: **Shots** (in `docs/source/parity/`), **Regions** (order), **Strings** (exact), **DS**, **Interactions**, **Delta** (vs the build as read 2026-10-08; the shell work is in flight in parallel: ignore shell differences here), **Acceptance**.

### P-01 Overview, By student (default)  [R4]
**Shots:** 01-shell-overview-by-student, 02-overview-filters-open, 03-overview-show-more, 12-overview-search · **Outline:** read `01-...outline.txt`.
**Regions (top to bottom):** (1) filter bar card 46px: `Filters` outline button (with funnel icon, chevron) + grey text `Showing everything` (or the applied filters); (2) context line: `Showing data for 150 students · All cohorts · All groups · All clinical courses · 9 skills in scope`; (3) KPI strip x4; (4) table card: tabs `By student` `By skill` `By tag` | search `Search students` + sort select (`Highest attainment` / `Lowest attainment` / `Name (A–Z)`) + `Export`; (5) table; (6) footer `Showing 25 of 150 students · Not met includes skills with no qualifying evidence yet` + `Show 25 more`.
**KPI strings:** `STUDENTS IN VIEW` / `150` / `Matches the filters above`; `AVG. SKILLS ACHIEVED` / `3.2 / 9` / `Per student, in scope`; `STUDENTS ACHIEVING ALL SKILLS IN SCOPE` / `0` / `0% of students in view`; `SKILLS NEEDING ATTENTION` / `6` (attention tone) / `Below 50% achievement in view`.
**Table columns:** `STUDENT` | `COHORT · GROUP` | `ACHIEVED` | `IN PROGRESS` | `NOT MET` | `ATTAINMENT` (% + bar) | chevron. Row = student name (14/500) + cohort/group + three counts + attainment; row opens P-02. Default sort Highest attainment (prototype); 25 rows; `Show 25 more` appends 25.
**Filters panel** (click `Filters`, inline panel, `Filters` shows a count when applied; chips + `Clear all` appear): selects `COHORT` (All Cohorts, BSN 2026, BSN 2027, ABSN 2026), `GROUP` (All Groups; disabled with hint "Select a cohort first" until a cohort chosen; then Group A..D), `CLINICAL COURSE` (All Clinical Courses + 4 offerings), `CATEGORY`, `TAG` (hint "Cuts across categories"), `LOCATION` (6 locations), `SETTING` (All Settings, Lab / Simulation, Inpatient, Emergency, Outpatient Clinic, Perioperative, Community / Home; hint "Filters the evidence"). Applied filters appear as removable chips before `Clear all`.
**Impossible combination** `[PROTO 16]`: context line becomes `Showing data for 0 students · BSN 2026 · All groups · All clinical courses · at Mercy Home Health · in Emergency · 9 skills in scope` and the content is `No evidence matches these filters` / `Mercy Home Health does not offer Emergency, so no evidence could have been gathered there in that setting.` (matches REQ RP-09: keep).
**DS:** `PageHeader`/`Breadcrumb`, `FilterButton`/`ActiveFilter` or a `Collapsible` panel of `Select`s, `KeyMetrics`, `Tabs`, `DataTable` + `TableViewMoreFooter`, `ProgressCell`, `Input`, `Select`, `Button`.
**Delta (built):** built adds `Add filter` dashed chip UI instead of the Filters panel; KPI labels are sentence case and 'Open the skills library' banner is extra; table columns are four-state (`Achieved/In progress/Evidence does not qualify/No evidence yet`) not three (see conflict C-1); `Lowest attainment` default instead of `Highest attainment`; no per-row chevron; no `Show 25 more` (built paginates differently); no attainment bar (text "7 of 10 (70%)"); no `Export` outline button in the toolbar (built uses a sheet).
**Acceptance (Playwright):** regions in the order above; exactly 4 KPI cards with the 4 label strings; tab labels exactly `By student|By skill|By tag`; header cells exactly the 7 above; first page = 25 rows then `Show 25 more` shows 50; `Filters` expands the 7 labelled selects; Group select disabled until a cohort is chosen; the impossible combination renders the two strings above; one filled primary on the page = none (Export is outline).

### P-01b Overview, By skill / By tag  [R4]
**Shots:** 04-overview-by-skill, 05-overview-by-tag, 13-overview-by-skill-row-click, 14-overview-by-tag-row-click.
**By skill columns:** `SKILL` | `CATEGORY` | `EVALUATION MODEL` | `STUDENTS IN VIEW` | `ACHIEVED` | `IN PROGRESS` | `NOT MET` | `% ACHIEVED` (bar) | `COURSES`. Footnote: `% achieved counts every student in view, including students whose clinical courses do not recommend the skill. Filter by clinical course to narrow the population to students expected to complete it.` Row opens a modal: heading = skill, sentence `15 of 150 students in view have achieved this skill (10%)`, block `HOW THIS SKILL IS ACHIEVED` (model, levels line, qualification line, criteria line), tabs/segments `Achieved (15)` `In progress (82)` `Not met (53)`, table `STUDENT | GROUP | PROGRESS | EVIDENCE | STATUS` with `0 / 4 demonstrations` and `Not Started`.
**By tag columns:** `TAG` | `SKILLS` | `CATEGORIES SPANNED` | `ACHIEVED` | `IN PROGRESS` | `NOT MET` | `% ACHIEVED` | `STUDENTS ACHIEVING ALL`. Footnote: `Achieved, in progress and not met count student-to-skill records, not students. A skill carrying two tags is counted under both, so these rows overlap — that is what makes the view cross-cutting rather than a partition.` Row opens a modal: `Tag A` / `4 skills · 25% of student-to-skill records achieved` / `Program-defined tag`, KPIs `ACHIEVED 149 · IN PROGRESS 265 · STUDENTS ACHIEVING EVERY SKILL IN THIS TAG 1`, then a table `SKILL | CATEGORY | EVALUATION MODEL | % ACHIEVED`.
**Delta:** built By skill/By tag rows open a rail with a different structure; footnotes differ; no skill modal with the three status segments. **Acceptance:** column sets exact; both footnotes verbatim; row click opens a modal with the strings above.

### P-02 Student drill-down modal + evidence ledger + evaluation dialog  [R4]
**Shots:** 07, 08, 09, 10, 11 · **Container: centered `Dialog`, 1024px wide, ~701px tall, scrolls internally (NOT a side rail).**
**Regions:** header `Noah Zeller` + `BSN 2027 · Group A · 7 of 9 skills achieved` + X; three counters `ACHIEVED 7 [Show these only]`, `IN PROGRESS`, `NOT MET 2 [Show these only]`; skill list: each row = skill name, `Model · needs <criteria>`, progress `7 / 5 demonstrations`, status badge `Achieved|In Progress|Not Started`; clicking a row expands its **evidence ledger**: `Demonstration levels:` lines (`Observed: 2 / 1`, `With Assistance: 1 / 1`, `Independent: 4 / 3`) and a table `DATE | SETTING | EVALUATOR | RECORDED | RESULT` where Setting shows `Clinical` + setting + location, or `Lab / Simulation`; Evaluator shows name + role; Recorded = outcome; Result = `Counts as evidence`; per-row `View form`; an evaluator comment line `<Role> comment: ...` under rows that have one.
**`View form`** opens a second dialog (stacked, 1024x515): `IV Insertion — Noah Zeller` / `2026-03-17 · Clinical (Perioperative) · Riverside Medical Center · NURS 315` / badges `Completed` `Counts as evidence` / `J. Delgado, RN (Preceptor)` / `Supplied by the student` fields / `Preceptor responses` with the answered control rendered read-only / `COMMENT` (`None recorded.`) / `Close`.
**Behaviour notes:** `Show these only` filters the list to that status; Esc does not close (X / Close do): add Esc per DS Dialog (improvement, behaviour only). 
**DS:** `Dialog`, `Badge`/`StatusBadge`, `Table`/`DataTable` (inside dialog, no toolbar), `Button`.
**Delta:** built uses `FloatingSheetPanel` rail with a breadcrumb and a different ledger column order (Result second, Recorded last); built ledger opens a second rail level, not a stacked dialog; counters lack `Show these only`.
**Acceptance:** opens as a centered 1024px dialog; header strings; 3 counters; ledger header exact; `View form` stacks a second dialog with the strings above; closing the second returns to the first.

### P-03 Export menu  [R4]
**Shot:** 06. Click `Export` opens a popover (not a sheet) under the button, 2 items, heading `EXPORT (CSV, OPENS IN EXCEL)`: `By student — this table` / `Exactly what is on screen, filters applied`; `Evidence detail` / `One row per evaluation, with comments and setting`; footnote `The current filters are written into the file header.` Outside click closes (aria "Close export menu"). **DS:** `DropdownMenu` or `Popover`. **Delta:** built opens a `Sheet`. **Acceptance:** popover with the 2 items and footnote; downloads CSV with `#` filter header (REQ RP-10).

### P-04 Skills Library, Skills tab  [R1]
**Shots:** 20, 21, 22, 43, 44. **Regions:** tab row `Skills (9)` `Categories (3)` `Tags (3)` `Clinical Settings (5)` `Lab Instructors (2)` (each with a leading icon); toolbar: search `Search skills`, selects (`All categories` / `No category` / A-C), (`All tags`/A-C), (`All statuses` / `Active` / `Needs configuration` / `Inactive`), outline `Import` (upload icon), filled **`Add skill`** (plus icon).
**Table columns:** `SKILL` (name, grey description "Placeholder skill definition — program-defined.", tag chips) | `CATEGORY` | `EVALUATION MODEL` (indigo pill) | `ACHIEVEMENT CRITERIA` (text) | `COURSES` (link-styled count) | `STATUS` (`Active` green pill) | `Edit` (pencil). Unconfigured rows: model cell `Not configured`, criteria `—`, courses `0`, status `Needs configuration` (amber), action `Configure` instead of `Edit`.
**After import** `[PROTO 43]`: success bar `Added 8 skills to the library. They cannot be used until each one is configured.` + `Configure them now` + `Dismiss`; plus info bar `8 skills in the library have not been configured, so they are not available for mapping or submission.` + `Show them`. `Show them` sets the status filter to Needs configuration (44).
**DS:** `Tabs`, `DataTable`, `Input`, `Select`, `StatusBadge`, `Badge`, `LocalBanner`, `Button`. Primary: `Add skill` is the one filled button.
**Delta:** built has an `Add filter` chip UI, a different filter set and a bulk "Apply configuration" bar; table lacks the inline description and tag chips layout; Edit/Configure link text differs. **Acceptance:** exact tab labels with counts; toolbar order; 7 columns; unconfigured row shows `Configure`; after import the two banners.

### P-05 Library tabs: Categories, Tags, Clinical Settings, Lab Instructors  [R1]
**Shots:** 23-26, 27-36. **Common frame:** intro sentence in a muted bar, a card with title + subtitle + filled add button right, then a table with `Edit` per row.
- **Categories:** intro `Categories are defined by the program — Prism does not ship a standard taxonomy. A skill sits in at most one category, which is how the library is organised.`; card `Categories` / `Each skill belongs to at most one`; `Add category`; columns `CATEGORY | DESCRIPTION | SKILLS | STATUS`. Rows `Category A` / `Program-defined category` / 3 / Active.
- **Tags:** intro `Tags are optional and cross-cutting. A skill can carry any number of them, and a tag can span categories — that is what lets you report on a theme the category structure does not follow.`; card `Tags` / `Applied to any number of skills`; `Add tag`; same columns with `TAG`; below: `Where each tag reaches` / `A tag spanning several categories is doing the job a category cannot.` three cards (`Tag A` / `4 skills across 3 categories` + skill names).
- **Clinical Settings:** intro `A student on one placement may move between several settings. Recording which one an evaluation came from keeps the evidence meaningful — and lets a program see whether experience is spread across settings or concentrated in one. Applies to clinical evidence only; lab evidence is recorded as lab.`; card `Clinical settings` / `Offered to students when they record clinical evidence`; `Add setting`; columns `SETTING | EVIDENCE RECORDED | STATUS`.
- **Lab Instructors:** intro `Lab instructors are not Prism users and are not stored elsewhere in the product. This roster holds only what a delegator link needs — a name and an email. Nobody here can sign in, and no account is created. A student can also name someone who is not on this list when sending a skill for review.`; card `Lab instructors` / `Offered to students when a skill is signed off in the lab`; `Add instructor`; columns `NAME | EMAIL | EVALUATIONS | STATUS`; section `Named by students, not on the roster` / `Add them if they sign off regularly — otherwise the spelling drifts and reporting splits` with a row (`R. Whitmore`, email) and `Add to roster` (opens the Edit dialog prefilled; Save moves them into the roster).
**Dialogs (672px, small):** `Add category` / `Edit category`: subtitle `Each skill belongs to at most one category.`, fields `NAME *`, `DESCRIPTION`, `STATUS` (Active|Inactive segmented), `Cancel` `Save` (filled). `Add tag`/`Edit tag` same pattern. `Add clinical setting`: `NAME *`, `STATUS` + helper `Inactive settings stay on existing evidence but are not offered to students.` `Add lab instructor`/`Edit lab instructor`: subtitle `Held by the Skills module only. No Prism account is created.`, `NAME *`, `EMAIL` + helper `Where the delegator link is sent. Without it they cannot be sent a form.`, `STATUS`.
**DS:** `Tabs`, `Card`, `DataTable`, `Dialog`, `Field*`, `Input`, `Textarea`, `ButtonSegmentedControl`, `Button`. **Delta:** built tabs are separate routes with a different frame, no intro bars, no "Where each tag reaches", adoption section is a list with different wording. **Acceptance:** intro strings verbatim; card titles/subtitles; column sets; dialog titles/fields/helper text; `Add to roster` opens a prefilled Edit dialog.

### P-06 Import dialogs  [R2]
**Shots:** 40, 41, 42, 42-b, 43. **Containers: dialogs, not routes.**
- **Step 1 (large dialog):** title `Import skills`, subtitle `Bring in a list you already hold instead of entering skills one at a time.`; info bar `Skills arrive unconfigured. A list tells us what the skills are called, not how each one should be evaluated or what achievement requires — those are decided per skill afterwards.`; `Upload a file` (dashed drop area: `Spreadsheet, document or PDF. No particular template or column order is needed.`); `Or paste the list` (textarea, `One skill per line. A description and a grouping are picked up if present.`) with link `Paste a sample list`; footer `Cancel` + filled `Read the list`.
- **Step 2 review (1024x760):** title `Review 8 skills found in pasted list`, subtitle `Nothing is added until you confirm. Edit, exclude or rename anything before creating.`; 3 stat cards `FOUND 8 / Rows read from the source`, `WILL BE CREATED 8 / 0 excluded`, `POSSIBLE DUPLICATES 0 / Already in the library`; checkbox bar `Create 3 new categories from the groupings in this list` + names; table `[checkbox] SKILL (editable input) | DESCRIPTION (editable input) | CATEGORY`; below the table a block `1 lines were not read as skills` / `Shown so nothing is lost silently. Add any of these by hand if they should have been included.` / `Line 9: SECTION 2 — ADVANCED PROCEDURES` / `Looks like a section heading`; footer `Back` + filled `Create 8 skills`.
- Then P-04 banners (success + info).
**DS:** `Dialog`, `Textarea`, `Checkbox`, `Input`, `DataTable`/`Table` with `InlineInputCell`, `LocalBanner`, hand-rolled `SkillsFileUpload`. **Delta:** built uses `/library/import` and `/library/import/[batchId]/review` routes with different framing and a duplicate resolver UI. **Behaviour to keep (REQ):** nothing created before `Create` (IM-05/13), unconfigured on arrival (IM-09), duplicates decision UI when duplicates > 0 (IM-06: prototype shows only the 0 counter: add the resolver inside this dialog), unread lines with original text (IM-08). **Acceptance:** 2 dialogs with the strings above; 3 stat cards; review table 3 columns; unread-lines block; counts in the primary button label.

### P-07 Add skill dialog  [R2]
**Shots:** 51, 52, 78. Small dialog 672px: title `Add a skill`, subtitle `Name it now; decide how it is evaluated separately.`; `SKILL NAME *` (placeholder `Programme-defined skill name`), `DESCRIPTION`, `CATEGORY` select (`No category`, ... ; helper `Optional`), `TAGS` chip toggles (`Tag A` `Tag B` `Tag C`, helper `Optional`), checkbox (default ticked) `Configure how it is evaluated now` + helper `Leave this unticked to add the skill and configure it later. Until it is configured it cannot be mapped to a course offering or submitted against.`; footer `Cancel` + filled button that reads `Add and configure` (disabled until a name is entered) or, when the checkbox is unticked, `Add to library`. `Add and configure` opens P-08 at step 1 titled `Edit skill — <name>`.

### P-08 Skill configure wizard (replaces my full-page S-09)  [R2]
**Shots:** 53-81 (new skill per model), 70-84 (existing), 90-93 (model change, add question/field), `-b` bottom shots.
**Container:** large `Dialog` (1024x760). Title `Edit skill — <name>` (also used for a brand-new skill) + subtitle `The program defines how this skill is evaluated and what achievement requires.` + X. Below the header: **stepper** `1 Skill definition › 2 Evaluation configuration › 3 Achievement criteria` (completed steps show a check; clicking a completed step goes back). Body is two columns from step 2: left = step content (scrolls), right = **CONFIGURATION LINEAGE** card (pinned). Footer: left text `Step n of 3 — <Skill definition|Evaluation configuration|Achievement criteria>`; right `Cancel`, `Back` (steps 2-3), filled `Continue` (steps 1-2) or filled `Save skill` (step 3).
**Step 1 Skill definition:** `SKILL NAME *`, `DESCRIPTION`, `CATEGORY` + `New` (inline create) + helper `One per skill. Optional. Only active categories are listed.`, `TAGS` chips + `New tag` + helper `Any number per skill. Only active tags are listed. Tags cut across categories and drive cross-cutting reports.`, `SKILL STATUS` segmented `Active|Inactive` + helper `Active skills can be mapped to course offerings and requested by students.`
**Step 2 Evaluation configuration** (all four models share the frame):
1. `EVALUATION MODEL`: 2x2 tiles with descriptions: `Overall Binary Outcome` ("The evaluator records one overall outcome, using two labels the program defines. Defaults to Met / Unmet."), `Question-Level Qualitative` ("The evaluator answers Yes/No against each program-defined question."), `Scored / Likert` ("The evaluator scores each question on the program-configured scale."), `Demonstration-Level Outcome` ("The evaluator records the level of supervision the demonstration needed."). **For a new skill none is selected and `Continue` is disabled until a model is chosen and its required config is valid** `[PROTO 54, 59, 64, 69]` (matches REQ SC-02).
2. Amber note when binary: `This model records one outcome per evaluation, so question-level responses are not available. To capture Yes/No per question, choose Question-Level Qualitative; to capture scores, choose Scored / Likert.`
3. Model section card:
   - Binary: `Response options` / `Two outcomes, worded however the program words them. The model stays binary.`; `QUALIFYING OUTCOME *` (placeholder `Met`; helper `Counts as evidence toward achievement.`), `NON-QUALIFYING OUTCOME *` (placeholder `Unmet`; helper `Recorded, but does not count toward achievement.`); error `Both outcomes need a label.`; chips `Common alternatives:` `Met / Unmet` `Pass / Fail` `Satisfactory / Needs Improvement` `Competent / Not Yet Competent`; note `Renaming these changes the wording everywhere — the evaluation form, the evidence history and the reports. Existing evidence keeps its meaning; only the label it displays under changes.` Qualification text: `An evaluation qualifies when the preceptor records Met. No further configuration applies.`
   - Question: `Evaluation questions (n)` / `Each question is answered Yes or No.` `Add question`; rows `Q1` input...; qualification radios `All questions answered Yes` / `At least [N] of [M] questions answered Yes` / `These specific questions answered Yes` + helper `Every question you tick must be Yes. Unticked questions are recorded but do not affect qualification.` and a checkbox list of the questions.
   - Scored: `Evaluation questions (n)` / `Each question is scored on the program-configured scale.` `Add question`; `RESPONSE SCALE` `Program-configured scale (4 points)` + `Scales are configured by the program. No universal scale is assumed.`; `Evaluation qualification`: `SCORE CALCULATION` radios `Average across questions` / `Minimum on every question` / `Total across questions`, `SCORE THRESHOLD` number.
   - Demonstration: `Demonstration levels (3)` / `Ordered most-supervised first. Each evaluation records one level.` `Add level`; numbered rows (1 Observed, 2 With Assistance, 3 Independent); note `Removing a level does not delete evidence already recorded against it; that evidence stops counting toward any level minimum until the level is restored.`; qualification text `Every completed demonstration is evidence. The outcome mix is set in the achievement criteria.`
4. `Student submission details (n)` / `What the student supplies when sending this skill. Independent of the evaluation model.` `Add field`; note `Location and setting are already captured from the student's placement. Anything here is written by the student when they submit; the evaluator's own comment is configured separately below.`; field rows: numbered, `LABEL` input, `TYPE` select (Date, Short text, Long text, Number, Choice list), `Required|Optional` toggle (defaults seen: Completion date required, Unit required (some), Student notes optional).
5. `Evaluator comment` / `Narrative feedback the evaluator writes alongside the outcome. Separate from the student's own notes above.` segmented `Optional|Required` + helper (`The preceptor may leave the comment blank.` / `The evaluator cannot submit without writing a comment.`).
6. `Review workflow` / `Who touches an evaluation, and in what order.`: two switch rows `Student self-evaluates first` (On: `The student completes the same form before it reaches the evaluator. Both sets of answers are kept, and the preceptor sees the student's while evaluating.`; Off: `The student selects the skill and it goes straight to the evaluator.`) and `Administrator reviews before it counts` (On: `A submitted evaluation waits for an administrator to approve it. Evidence only counts toward achievement once approved.`; Off: `The evaluator's submission counts immediately.`).
7. `WHO CAN EVALUATE THIS SKILL`: role chips `Preceptor` `Clinical Faculty` `Lab Instructor` + helper `A lab-only skill is usually signed off by a lab instructor; some skills are reviewed by faculty rather than a preceptor. Students can only send this skill to a role allowed here.` + a `Route:` sentence `Student selects → Student self-evaluates → Evaluator completes the form → Administrator approves → Counts as evidence` (shows only the active steps).
8. `Form preview` / `What the evaluator and the student will each fill in`: two panels `STUDENT SUPPLIES ON SUBMISSION` (read-only fields) and the evaluator form controls (`DEMONSTRATION OUTCOME` buttons, `EVALUATOR COMMENT *` etc.) + sentence `The student completes this same form before the evaluator sees it.` when self-evaluation is on.
**CONFIGURATION LINEAGE card (right, pinned, from step 2):** heading `CONFIGURATION LINEAGE` then 5 rows with a vertical connector: `EVALUATION MODEL` <model>, `EVIDENCE PER EVALUATION` <e.g. `Met or Unmet` | `Yes / No per question` | `A score per question` | `Observed / With Assistance / Independent`>, `AN EVALUATION QUALIFIES WHEN` <rule>, `ACHIEVEMENT CRITERIA` <e.g. `3 qualifying evaluations` | `5 demonstrations · 1 observed · 1 with assistance · 3 independent`>, `SKILL STATUS` `Not Started → In Progress → Achieved`; footnote `Each step below the model is determined by the one above it. This is what keeps evaluation setup and achievement criteria from contradicting each other.`
**Step 3 Achievement criteria:** intro `Achievement criteria depend on the evidence this evaluation model produces. Changing the model changes what can be required here.`; card `Achievement criteria` / `Evidence available: <evidence line>`; non-demonstration: `REQUIRED QUALIFYING EVALUATIONS` (number) + `A qualifying evaluation is one where: <rule>.` + `Level counts are not shown because this model records a single outcome rather than a level of supervision.`; demonstration: `TOTAL DEMONSTRATIONS REQUIRED` + `MINIMUM AT EACH LEVEL` (one number per level); both: `MINIMUMS BY CLINICAL SETTING` / `Optional. Pick every setting that matters for this skill, then set how much evidence each one needs. Anything not listed carries no requirement.` + `Choose settings…` multi-picker + `No setting requirements. Evidence counts wherever it was gathered.`; lineage card stays.
**Model change** `[PROTO 90, 91]`: choosing another model at step 2 immediately swaps the section and the lineage and the criteria step (no confirm dialog in the prototype). REQ SC-09 requires criteria to rebuild: keep, and add the confirm/report from the contract (behaviour, section 6).
**DS:** `Dialog` + **`Wizard`/`WizardNav`/`WizardPanel`/`WizardFooter`**, `SelectionTileGrid`, `Field*`, `Input`, `Textarea`, `ToggleSwitch`, `ButtonSegmentedControl`, `Checkbox`, `RadioGroup`, `Popover`+`Command` multi-select, `Card`, `LocalBanner`. **Delta:** built is a full page with eight anchored sections, a section nav, a preview toggle and an unsaved-changes bar: replace with the modal wizard; keep all store/engine wiring (`validateDraft`, `changeModelKind`, `previewDraftImpact`, `saveSkillConfig`), the validation summary (as inline banner at the top of the step body), the BL-1 validator, copy/apply-configuration entry points (put them in step 2 header menu or keep as dialog actions from the table row), the reorder/keyboard paths and impact preview (as a confirm step before `Save skill`, behaviour only). **Acceptance:** dialog 1024x760; stepper with 3 labelled steps; footer left text per step; lineage card on step 2 and 3 (and its five row labels); 4 model tiles with the exact descriptions and none preselected on a new skill; `Continue` disabled until valid; step 3 criteria per model; `Save skill` filled primary only on step 3.

### P-09 Course Mapping  [R3]
**Shots:** 100-108 · **Layout:** info bar (`Mapping a skill to an offering marks it as mandatory or non-mandatory for that course. Neither setting restricts where a skill can be evaluated — students may still request evaluations for skills outside the mapping, and evidence counts toward one skill record shared across courses.`), then a two-column card: **left** `Clinical course offerings` + `14 of 42 offerings match · count shows mandatory / total` + `Clear`, filters `COHORT` / `ACADEMIC YEAR` / `TERM` / `PROFESSIONAL YEAR` (selects: All cohorts, BSN 2026, BSN 2027, ABSN 2026; All years, 2024-2025, 2025-2026, 2026-2027; All terms, Fall, Spring, Summer; All professional years, Year 1-3) and search `Search by course code or name`; offering rows: `NURS 301 — Adult Health I` / `Fall 2026 · Year 1 · BSN 2027, ABSN 2026` / pill `3/4` (`No cohort enrolled` for empty ones, pill `0/0`); first offering selected by default. **Right:** heading `Skills mapped — NURS 301` / `Adult Health I · Fall 2026 · Year 1 — 3 mandatory, 1 non-mandatory`; search `Search the Skills Library`; skill rows: checkbox `Map <skill>` + name + model + criteria text; when mapped, segmented `Mandatory` / `Non-mandatory`; footnote `Also mapped in NURS 350 (Fall 2025), NURS 301 (Fall 2026), NURS 315 (Fall 2026) and 1 more — one student-level skill record is shared across courses.`
**Observed behaviour:** ticking a skill maps it as **Mandatory** by default (header becomes `1 mandatory, 0 non-mandatory`); `Non-mandatory` flips it; unticking returns to `0 mandatory, 0 non-mandatory`.
**DS:** `Card`, `Select`, `Input`, `Checkbox`, `ButtonSegmentedControl`, `Badge`, `LocalBanner`. **Delta:** built has a different left list grouped by course code, URL-driven filters, a "Not yet saved" pending requirement state (no silent default) and `?skill=` mode; follow the prototype's frame and default Mandatory (conflict C-3), keep `?skill=` entry as an addition. **Acceptance:** two-column card; the 4 filter labels and option sets; left header strings; right header strings; segmented control only on mapped rows; default requirement Mandatory.

### P-10 Review & Approve  [R3]
**Shots:** 110-114. **Layout:** info bar `Evaluations appear here only for skills where the program turned on administrator review. Everything else counts as soon as the preceptor submits it.` then a **vertical list of cards, one per evaluation (not a table)**. Card = heading `Rina Okonkwo — IV Insertion`; meta `NURS 350 · Clinical (Outpatient Clinic, Lakeside Community Clinic) · submitted 2026-08-26 by J. Delgado, RN (Preceptor)` (lab variant: `NURS 350 · Lab / Simulation · submitted 2026-08-27 by R. Whitmore (Lab Instructor)`); badge `Qualifies`; supplied fields `Completion date: ...`, `Unit: ...`, `Student notes: ...`; two blocks side by side `PRECEPTOR` (outcome + comment) and `STUDENT SELF-EVALUATION` (outcome); agreement sentence (`Student and preceptor recorded different outcomes — worth a conversation before approving.` / `... recorded the same outcome.`); disclosure `See the full responses` (expands the control rendering of the answers); `REVIEW NOTE` textarea (`Optional. Kept with the evaluation.`); actions `Return to preceptor` (outline) and `Approve` (filled) **on every card**.
After action: banner `Returned IV Insertion for Rina Okonkwo to the preceptor. It does not count until resubmitted.` / `Approved IV Insertion for Jonah Nakamura — it now counts toward achievement.` + `Dismiss`; empty state `Nothing awaiting review` / `Submitted evaluations for skills configured with administrator review will appear here.` + `Configure review on a skill`.
**DS:** `Card` list, `StatusBadge`, `Textarea`, `Collapsible`/`Accordion` for responses, `LocalBanner`, vendored `EmptyState`. **Delta:** built is a DataTable queue with a detail Sheet and one Approve in the sheet; replace with the card list (two filled buttons per card is the prototype; see conflict C-5 for the one-primary rule: render `Approve` as the filled button, `Return` outline, per card, as the prototype does). **Acceptance:** cards with the strings above; both buttons on every card; banner strings; empty state strings.

### P-11 Student View  [R5]
**Shots:** 120-128, 130-135, 150-154, 155. **Regions:** card `VIEWING AS STUDENT` select (40 names) + `CLINICAL COURSE` select (`NURS 350 — Clinical Practicum`, `NURS 410 — Community Health`) + text `BSN 2026 · Group A` / `Placed at Harbor Family Practice, Northgate Surgical Center`; card `Awaiting preceptor evaluation` / `n request(s) sent` with pills `Medication Reconciliation · S. Nakamura, RN (Preceptor)`; row checkbox `Show only skills I have sent for review` + right text `7 of 9 skills sent, 2 not mapped to this course`; card `Mapped to this course` / `NURS 350 — Clinical Practicum. Mandatory skills are required for this course; non-mandatory ones are available but not required.`; skill rows: checkbox `Select <skill>`, name, pill `Mandatory for this course`/`Non-mandatory for this course`, status pill (`In Progress`, `Achieved`, `Not Started`, `Not Met`), extra pill `1 in progress`, progress bar + `4 / 5 demonstrations` + `· Demonstration-Level Outcome`, achieved note `Already achieved — you can still request another evaluation if your program wants more evidence.`, `View history (5)` right; collapsible card `Other skills` + count pill `2 sent` / `Not mapped to this course. Evidence still counts toward your skill record.` (expands to the other skills with checkboxes); **sticky bar** `2 skills selected` `Clear` filled `Send for review`.
**Send for review dialog (1024x760):** title `Send for review`, subtitle `2 skills · NURS 350 — Clinical Practicum`; `WHERE DID YOU PERFORM THIS?` segmented `Clinical` / `Lab / Simulation` + helper `Programs can require a minimum amount of clinical evidence.`; clinical: `WHICH CLINICAL SETTING?` select (`Outpatient Clinic — Harbor Family Practice` ...) + helper `From your 2 placements for this course. You may move between settings during a placement — record where this one happened.`; `SEND FOR REVIEW TO` role select (Clinical: `Preceptor`, `Clinical Faculty`; Lab: `Clinical Faculty`, `Lab Instructor`) + helper (`Roles that sign off clinical evidence.` / `Roles that sign off lab / simulation evidence.`) beside the person select (`PRECEPTOR` list); Lab Instructor shows `LAB INSTRUCTOR` select (`T. Ferreira — t.ferreira@example.edu`, ..., `Someone not listed…`) + helper `Lab instructors are not held as Prism users. This module keeps a light roster — a name and an email, which is all a delegator link needs. No account is created and they never sign in.` + `Link goes to <email>.`; `SKILLS IN THIS REQUEST` rows with model pill; per-skill card `Details for this submission` with badge `Incomplete`/`Complete`, `COMPLETION DATE *` (date) and `STUDENT NOTES` (textarea) (+ `Unit` where configured); for self-evaluation skills a `STUDENT'S SELF-EVALUATION` block with the same controls (scale buttons 1-4 or level buttons); info line `The evaluator completes the form your program configured for each skill. They do not choose how a skill is evaluated.`; footer `Cancel`, filled `Send request` (disabled until valid). After send `[PROTO 135]`: banner pattern `Sent <n> skill(s) to <name> (<role>) for evaluation — <mode>.`; observed verbatim for the lab path: `Sent 2 skills to T. Ferreira (lab instructor) for evaluation — lab / simulation.` (the clinical-path wording was not captured verbatim; earlier observation: `... — lab / simulation` suffix for lab, clinical suffix not recorded: use the same pattern with the clinical setting and location per REQ ST-13). The sent skills then show in `Awaiting preceptor evaluation` (and the banner omits setting/location: DEFECT-02, see C-9).
**History dialog** `[125-128]` (1024x701): title `Your submission history · 5 demonstrations · 1 observed · 1 with assistance · 3 independent`; counters `COUNTED SO FAR 4`, `IN PROGRESS 1 / Sent but not finished`, `RETURNED 1 / Sent back by a reviewer`; note `Evidence counts toward this skill wherever it was gathered, so submissions from other courses are included.`; segmented `All courses (5)` / `NURS 350 only (1)`; attempt cards newest first: `Attempt 5` + date, `Clinical — Outpatient Clinic` + location + course, outcome pill (`Returned by the reviewer`, `Counted`, ...), line `Not recorded yet — with M. Okonkwo, RN (Preceptor)` or `Observed — S. Nakamura, RN (Preceptor)`, supplied fields, `You rated yourself: Independent`, `Preceptor feedback: ...`, reviewer note, `Revised and resent 1 time.`, buttons `View form` and (returned only) `Revise and resend` (filled).
**DS:** `Card`, `Checkbox`, `Select`, `Badge`/`StatusBadge`, `ProgressCell`, `Collapsible`, `Dialog`, `ButtonSegmentedControl`, `Field*`, `Textarea`, `LocalBanner`, hand-rolled sticky selection bar (C-17). **Delta:** built is a separate student shell with `/courses`, `/my-skills` routes, a Sheet for send, a full-page history; replace with the single `Student View` page and the two dialogs; keep the engine/store wiring, role x setting resolver, DEFECT-01/02/07 fixes. `My skills` (S-15) is not in the prototype: keep only if reachable from Student View (decision for Romit). **Acceptance:** region order and strings above; selection bar appears at >=1 selected; Lab path offers roles `Clinical Faculty` and `Lab Instructor`; history counters; `Revise and resend` only on returned attempts.

### P-12 Preceptor Evaluation  [R5]
**Shots:** 140-147, 155-157. **Page (inside the shell):** card `Evaluations sent` / `Preceptors receive a delegator link by email. Faculty and lab instructors can open the same form in Prism. Open one to see what the evaluator sees.`; list rows: student name, `NURS 350 — Clinical Practicum · Requested 2026-08-28 · S. Nakamura, RN (Preceptor)`, skill pills, right `Open link` button. Clicking opens the form **inline in the same page** with `Back to sent links`, heading `Evaluate student skills`, sub `Jonah Okonkwo · NURS 350 — Clinical Practicum · evaluated by A. Whitfield, RN (Preceptor)`; per skill a card: `1. IV Insertion` / `Demonstration-Level Outcome · Achievement: 5 demonstrations · 1 observed · 1 with assistance · 3 independent`, line `Clinical — Outpatient Clinic`, badge `Goes to review` (approval skills), `Not answered`, `SUPPLIED BY THE STUDENT` (fields), `STUDENT'S SELF-EVALUATION` (`Avg 4.0 across 2 questions` + `Recorded before this evaluation. Your assessment is independent of it.`) when present, answer controls per model (`DEMONSTRATION OUTCOME` buttons; Yes/No per `Q1..Qn` with question text; `OVERALL SKILL EVALUATION` `Met`/`Unmet`; `Scale: Program-configured scale (4 points)` with 1-4 buttons per question), `YOUR COMMENT *` or `(OPTIONAL)` with placeholder `What the student did well, and what to work on next time.` and `This program requires a comment on this skill.`; footer text `Submitting converts each response into skill evidence and re-applies the program's achievement criteria.` + filled `Submit evaluation` (disabled until every answer and mandatory comment). After submit: banner `Evaluation submitted` / `2 skills recorded for Jonah Okonkwo` + `Dismiss`, table `SKILL | RECORDED | QUALIFIES? | PROGRESS | STATUS` (e.g. `Independent | Qualifies | Held for review | Awaiting review`; `3 of 3 answered Yes | Qualifies | 4 / 3 qualifying evaluations | Achieved`), and the submitted link disappears from the list (147).
**DS:** `Card`, `Button`, `RadioGroup`/`ToggleGroup`, `Textarea`, `Table`, `LocalBanner`. **Delta:** built has only the shell-free `/e/[token]` form (no mailbox page, no `Open link` list, no inline form, no results table). Build the prototype page `Preceptor Evaluation` inside the shell, reusing `components/evaluator/*` for the form; keep `/e/[token]` shell-free for real links (REQ EV-01). **Acceptance:** mailbox list strings; `Open link` opens the inline form; Submit disabled until valid; result table columns; link removed after submit.

## 4. Component-level notes for all workers
- Deep imports only (`@exxatdesignux/ui/components/ui/<name>`; the barrel fails `next build`). Verify every prop with `node tools/ds/source.mjs <Component>` AND the app's installed types (workspace tool resolves 1.5.1).
- No hardcoded colours; no toast (`LocalBanner`); no raw `<button>`/`<table>`; icons: FA, `aria-hidden`; prototype shows icons on some action buttons (Import, Add skill, Send for review, Send request): workspace memory says text-only action buttons; **follow the prototype here** `[INFER]`: keep the icons the prototype shows (user: exact mockup) but add `aria-hidden` and keep `variant`/`size` explicit.
- Keep a11y rules from `docs/ux/08` (focus return, aria-live, status never colour-only, 44px targets on student surfaces).
- Copy: strings in this spec are exact. Move them into `lib/copy` (keyed), do not retype in components. The prototype uses British spelling in places (`Programme-defined skill name` placeholder) alongside American; copy exactly as shown.

## 5. Worker assignments
| Worker | Cards | Owns (suggested folders) |
|---|---|---|
| **R1** library | P-04, P-05 | `components/library/**`, library route pages (tabs in ONE page like the prototype, not separate routes unless the shell needs deep links) |
| **R2** wizard + import | P-06, P-07, P-08 | `components/configure/**`, `components/import/**`, dialogs mounted from the library page (export `openAddSkill/openConfigure/openImport` helpers for R1) |
| **R3** mapping + review | P-09, P-10 | `components/mapping/**`, `components/review/**`, `course-mapping`, `review` routes |
| **R4** reporting | P-01, P-01b, P-02, P-03 | `components/reporting/**`, `overview` route |
| **R5** student + preceptor | P-11, P-12 | `components/student/**`, `components/evaluator/**` (reuse), `student` and `preceptor` pages |
| Shell (in flight) | section 1 | `components/shell/**`, `app/(shell)/layout.tsx`, nav |
Shared (no worker edits without the manager): `lib/store`, `lib/seed`, `lib/domain`, `lib/engine`, shared `components/skills`. If a card needs new store behaviour (e.g. default Mandatory, three-state labels), request it; do not fork it locally.

### Acceptance method (every worker, per screen)
1. Run the app, open the screen, take a Playwright screenshot at 1440x900; open the matching `docs/source/parity/NN-*.png` and compare region order, container type and size, column sets, counts and strings.
2. Assert programmatically: heading text(s), tab labels, table `th` text array, KPI label array, button text and which one is filled, dialog width (1024 or 672 +/- 8px), step labels, banner strings. A worker's report must paste the assertion output.
3. Re-run unit tests (update string assertions to the spec strings), `tsc`, `eslint`, then axe in a real browser with contrast ON for each screen and dialog state.

## 6. Conflicts: prototype vs REQ/contracts, with resolution `[INFER]`
Rule: **layout/IA/copy structure from the prototype, behaviour from REQ.**
| # | Prototype | Contract/REQ | Resolution |
|---|---|---|---|
| C-1 | 3 states: Achieved / In progress / Not met (Not met includes no evidence) `[PROTO 01, footer]` | AE-04 four states; OD-03 open | Build the prototype's three columns and labels as the **default** display (`skillStatusDisplay='merged'`); keep the engine four-state and the flag; update the flag default from `separate` to `merged`. |
| C-2 | `Return to preceptor` button and banner `... to the preceptor. It does not count until resubmitted.` | AR-05 "goes back for correction"; OD-16 open; student `Revise and resend` implies the student corrects | **Decision for Romit.** Default: prototype layout and button position; label `Return for correction` and neutral banner (REQ wording) until Sankalp decides OD-16. Switch to the prototype string only on Romit's say-so. |
| C-3 | Mapping a skill defaults it to Mandatory | S-10 contract: "no silent default" (my proposal, open question) | Follow the prototype (default Mandatory). REQ CM-03 only needs a requirement level per mapping. |
| C-4 | Student drill-down, history, send, wizard, import are modals/dialogs | Contracts used rail/sheet/full page | Follow the prototype (dialogs). |
| C-5 | Review card has `Return` and `Approve` on every card | Contract: one filled primary, Approve in detail sheet | Follow the prototype card layout; `Approve` filled, `Return` outline per card; document as an exception to the one-primary-per-surface rule. |
| C-6 | Preceptor form shows `Achievement: <criteria>`, the student's self-evaluation, and after submit `Progress / Status` (`Achieved`) | OD-17 open (what an evaluator may see); my DEFECT-05 inference | Follow the prototype layout behind a flag `evaluatorSeesProgress` (default ON to match the prototype), real `/e/[token]` link default OFF until OD-17 is decided. Flag to Romit. |
| C-7 | `Not met` merges zero-evidence and failed | AE-04 / OD-03 | See C-1. |
| C-8 | DEFECT-01: after Clinical → Lab the previous evaluator can be sent | ST-08 | Keep layout; fix behaviour (already fixed in the store/send-form). Dialog must reset role and person on mode switch. |
| C-9 | DEFECT-02: sent banner lacks setting/location in some paths | ST-13 | Keep banner layout; include skills, evaluator, role, setting, location. |
| C-10 | History counter `IN PROGRESS / Sent but not finished` beside skill status `In Progress` | S-14 DEC-012 renamed the counter `Awaiting evaluation` | Follow the prototype wording (`In progress` + helper `Sent but not finished`); DEC-012 superseded. The clash exists in the prototype too. |
| C-11 | Seed binary skills have blank outcome labels (continue disabled with `Both outcomes need a label.`) | SC-03 | Data quirk: seed binary skills with `Met` / `Unmet` filled; keep the placeholders and the error copy for new skills. |
| C-12 | `Import` shows only a duplicates counter | IM-06 | Build the duplicate decision UI inside the review dialog when count > 0 (skip/replace/keep both). |
| C-13 | Export is a popover with two items | RP-10 | Keep; CSV with `#` header block. |
| C-14 | Prototype sidebar mixes Administrator, Student, Evaluator | Production: separate logins; evaluator has no shell | Keep for the demo shell; real `/e/[token]` stays shell-free. |
| C-15 | Model-change swaps config with no confirmation | SC-09 | Keep the immediate swap; show the rebuild report as an inline banner in the step (behaviour). |
| C-16 | Prototype shows icons on Import / Add skill / Send for review / Send request | Workspace rule: text-only action buttons | Follow the prototype (icons shown), `aria-hidden`. |

## 7. Gaps (states not reached or not visible in the prototype)
- Loading, error and empty states for every list except Review: not in the prototype (add per `docs/ux/06`).
- File upload parsing and the upload drop-area behaviour: UI present, no parsing (paste only).
- Validation states of step 1 (name required: button disabled) are visible; step 2 validation shows only the binary label error; question/scored `Continue` stays disabled with a blank config without an error message (observed: new question and scored skills keep `Continue` disabled; I did not fill questions to enable it, so step 3 for new question/scored skills was not captured: use the existing Foley/Head-to-Toe step 3 shots 75 and 78).
- `Edit` of an unconfigured imported skill with a category assigned from the import: only step 1 captured (45).
- Mobile/tablet behaviour of every screen: not captured (desktop 1440 only).
- Hover/focus/keyboard states: not captured.
- Light/dark: single theme.
- A scored skill's step 2 with more than 4 scale points: only the 4-point scale is shown.
- Student-side `My skills` page: not in the prototype.

## Appendix A: capture index
| Name | State |
|---|---|
| `01-shell-overview-by-student` | Overview, By student (default), filters collapsed |
| `02-overview-filters-open` | Overview with Filters panel expanded |
| `03-overview-show-more` | Overview By student after Show 25 more |
| `04-overview-by-skill` | Overview By skill |
| `05-overview-by-tag` | Overview By tag |
| `06-overview-export-menu` | Export menu open |
| `07-overview-student-panel` | Student drill-down panel (Noah Zeller), skills list collapsed |
| `08-overview-student-evidence-ledger` | Student panel with IV Insertion evidence ledger expanded |
| `09-overview-evaluation-dialog` | Evaluation detail ("View form") dialog |
| `09-overview-student-show-these-only` | Student panel filtered with Show these only (Achieved) |
| `10-overview-after-dialog` | Student panel after closing evaluation dialog (dialog closed?) |
| `100-mapping-default` | Course Mapping default (first offering selected?) |
| `101-mapping-filter-cohort` | Mapping filtered by first cohort (BSN 2026) |
| `102-mapping-filter-cohort-term` | Mapping filtered by cohort + term Fall |
| `103-mapping-search` | Mapping search "NURS 410" |
| `104-mapping-offering-no-cohort` | Offering with no cohort selected (NURS 301 Spring 2027) |
| `105-mapping-skill-mapped` | After mapping Medication Administration in an unmapped offering |
| `106-mapping-nonmandatory` | After choosing Non-mandatory |
| `107-mapping-unmapped` | After unmapping |
| `108-mapping-skill-search` | Skill search "wound" in mapping panel |
| `11-overview-student-show-these-only` | Student panel filtered with Show these only |
| `110-review-default` | Review & Approve: two evaluation cards |
| `111-review-full-responses` | Review card with full responses expanded |
| `112-review-note-entered` | Review note entered |
| `113-review-after-return` | After Return to preceptor (banner? card removed?) |
| `114-review-after-approve` | After Approve (queue empty state?) |
| `12-overview-search` | By student with search "Noah" |
| `120-student-default` | Student View default (Olivia Martin, NURS 350) |
| `121-student-course-410` | Student View, course NURS 410 |
| `122-student-switched` | Student View, switched student (Rina Okonkwo) |
| `123-student-only-sent` | Show only skills I have sent for review ticked |
| `124-student-other-skills-open` | Other skills section expanded |
| `125-student-history` | History drawer, IV Insertion (5 attempts) |
| `126-student-history-course-only` | History drawer, NURS 350 only |
| `127-student-history-view-form` | View form from history (nested dialog) |
| `128-student-revise-and-resend` | Revise and resend dialog |
| `13-overview-by-skill-row-click` | By skill after clicking first row |
| `130-student-selection-bar` | Two skills selected: sticky selection bar |
| `131-student-send-clinical` | Send for review dialog (Clinical default) |
| `132-student-send-clinical-filled` | Send dialog, details filled (Send enabled) |
| `133-student-send-lab` | Send dialog, Lab / Simulation |
| `134-student-send-lab-instructor` | Send dialog, role = Lab Instructor |
| `135-student-sent-confirmation` | After Send request (confirmation banner, waiting strip) |
| `14-overview-by-tag-row-click` | By tag after clicking first row |
| `140-preceptor-mailbox` | Preceptor Evaluation: Evaluations sent (mailbox) |
| `141-preceptor-form-binary-or-single` | Open link #1 (Olivia Martin, Medication Reconciliation: Overall Binary) |
| `142-preceptor-form-demo-question` | Open link #2 (Jonah Okonkwo, IV Insertion + Foley: demonstration + question) |
| `143-preceptor-form-lab` | Open link #3 (Tobias Zeller, Medication Administration, Lab Instructor) |
| `144-preceptor-form-iv` | Open link #4 (Olivia Martin, IV Insertion) |
| `145-preceptor-form-answered` | Form answered, Submit enabled |
| `146-preceptor-submitted` | After Submit evaluation (result table) |
| `147-preceptor-mailbox-after` | Mailbox after submission (link removed?) |
| `15-overview-filter-cohort` | Filters panel with first cohort selected |
| `150-student-send-with-self-eval` | Send dialog for IV Insertion (self-evaluation + approval workflow skill) |
| `151-student-course-410-skills` | Student (Olivia) NURS 410 skills list |
| `152-student-course-410-other-open` | NURS 410 with Other skills expanded |
| `153-student-send-scored-binary` | Send dialog for Head-to-Toe (scored), Sterile (binary), Tracheostomy (scored) |
| `154-student-send-scored-binary-filled` | Send dialog (scored+binary) with self-evaluation scores and details filled |
| `155-student-sent-confirmation-scored` | After sending scored+binary skills |
| `156-preceptor-mailbox-after-send` | Mailbox after the student sent new skills |
| `157-preceptor-form-scored-binary` | Evaluation form for scored + binary skills (with student self-evaluation shown?) |
| `16-overview-impossible-filter` | Location Mercy Home Health + setting Emergency (prototype behaviour for a combination with no evidence) |
| `20-library-skills` | Skills Library, Skills tab (default) |
| `21-library-search` | Skills tab, search "wound" |
| `22-library-filter-category` | Skills tab, category filter = Category A |
| `23-library-categories` | Categories tab |
| `24-library-tags` | Tags tab |
| `25-library-settings` | Clinical settings tab |
| `26-library-lab-instructors` | Lab instructors tab |
| `27-category-add-dialog` | Add category dialog |
| `28-category-edit-dialog` | Edit category dialog |
| `29-tag-add-dialog` | Add tag dialog |
| `30-tag-edit-dialog` | Edit tag dialog |
| `31-setting-add-dialog` | Add setting dialog |
| `32-setting-edit-dialog` | Edit setting dialog |
| `33-lab-add-dialog` | Add lab instructor dialog |
| `34-lab-edit-dialog` | Edit lab instructor dialog |
| `35-lab-adopt-dialog` | Add to roster opens prefilled instructor dialog |
| `35-lab-adopt-result` | Lab instructors after Add to roster (R. Whitmore adopted) |
| `36-lab-adopt-result` | Lab instructors after saving the adopted instructor |
| `40-import-dialog-empty` | Import dialog, empty |
| `41-import-dialog-pasted` | Import dialog with sample list pasted |
| `42-import-review` | Import review step |
| `43-import-created-banner` | Library after import: banner + unconfigured skills |
| `44-library-filter-needs-config` | Library filtered to Needs configuration |
| `45-configure-unconfigured-step1` | Configure (unconfigured skill) step 1 |
| `50-add-skill-step1-blank` | Add skill: step 1 blank (note Continue enabled/disabled state) |
| `51-add-skill-dialog-empty` | Add a skill dialog, empty |
| `51-add-skill-dialog-filled` | Add a skill dialog with name entered |
| `52-add-skill-dialog-filled` | Add a skill dialog with name entered |
| `52-add-skill-dialog-unticked` | Add a skill dialog with "Configure now" unticked (button label?) |
| `53-new-binary-step1` | New skill (binary): wizard step 1 after Add and configure |
| `54-new-binary-step2-no-model` | New skill (binary): step 2 before choosing a model |
| `55-new-binary-step2-model-chosen` | New skill, Overall Binary Outcome: step 2 with model chosen, config blank |
| `56-new-binary-step2-labels-filled` | Binary: step 2 with both labels entered |
| `57-new-binary-step3` | New skill, Overall Binary Outcome: step 3 criteria |
| `58-new-question-step1` | New skill (question): wizard step 1 after Add and configure |
| `59-new-question-step2-no-model` | New skill (question): step 2 before choosing a model |
| `60-new-question-step2-model-chosen` | New skill, Question-Level Qualitative: step 2 with model chosen, config blank |
| `63-new-scored-step1` | New skill (scored): wizard step 1 after Add and configure |
| `64-new-scored-step2-no-model` | New skill (scored): step 2 before choosing a model |
| `65-new-scored-step2-model-chosen` | New skill, Scored / Likert: step 2 with model chosen, config blank |
| `68-new-demo-step1` | New skill (demo): wizard step 1 after Add and configure |
| `69-new-demo-step2-no-model` | New skill (demo): step 2 before choosing a model |
| `70-edit-demo-iv-step1` | Edit IV Insertion: step 1 |
| `70-new-demo-step2-model-chosen` | New skill, Demonstration-Level Outcome: step 2 with model chosen, config blank |
| `71-edit-demo-iv-step2` | Edit IV Insertion: step 2 evaluation configuration |
| `72-edit-demo-iv-step3` | Edit IV Insertion: step 3 criteria |
| `72-new-demo-step3` | New skill, Demonstration-Level Outcome: step 3 criteria |
| `73-edit-question-foley-step1` | Edit Foley Catheter Insertion: step 1 |
| `74-edit-question-foley-step2` | Edit Foley Catheter Insertion: step 2 evaluation configuration |
| `75-edit-question-foley-step3` | Edit Foley Catheter Insertion: step 3 criteria |
| `76-edit-scored-h2t-step1` | Edit Head-to-Toe Assessment: step 1 |
| `77-edit-scored-h2t-step2` | Edit Head-to-Toe Assessment: step 2 evaluation configuration |
| `78-add-skill-dialog-unticked` | Add a skill dialog with Configure-now unticked |
| `78-edit-scored-h2t-step3` | Edit Head-to-Toe Assessment: step 3 criteria |
| `79-edit-binary-sterile-step1` | Edit Sterile Dressing Change: step 1 |
| `80-edit-binary-sterile-step2` | Edit Sterile Dressing Change: step 2 evaluation configuration |
| `81-edit-binary-sterile-step3` | Edit Sterile Dressing Change: step 3 criteria (after filling blank labels) |
| `82-edit-demo-wound-step1` | Edit Wound Care: step 1 |
| `83-edit-demo-wound-step2` | Edit Wound Care: step 2 evaluation configuration |
| `84-edit-demo-wound-step3` | Edit Wound Care: step 3 criteria |
| `90-edit-change-model` | Edit Foley, step 2 after switching model to Overall Binary Outcome (is there a confirm? criteria rebuilt?) |
| `91-edit-change-model-step3` | After model change: step 3 |
| `92-edit-add-question` | Step 2 after Add question |
| `93-edit-add-field` | Step 2 after Add field (if present) |

## Integrated verification (2026-10-08, production build, real Chromium, port 3081)

29/29 integrated checks pass: shell (utility bar, three nav groups, breadcrumb, one `main`, one `h1`) on every primary page; axe (wcag2a/aa, 2.1 a/aa, best-practice, **contrast on**) zero violations on every primary screen and dialog state; console clean; the lifecycle (configure through the wizard dialog, import, map, student send incl. Clinical to Lab evaluator reset, evaluator link, review return and approve, reporting with the impossible-filter explanation and the export download); 390px no overflow and 44px targets on the student dialog and evaluator form. Side-by-side composites against the prototype captures are in `admin/.verify/integrated/sbs/` (gitignored).

**Remaining visible differences from the prototype** (all expected, none are layout/IA/copy-structure):
- DS Prism theme: pink-tinted rail, dark primary, serif titles; the prototype has a navy rail and blue primary. Breadcrumb sits in the utility bar, not above the title.
- Seed size: 40 students and 12 skills (two unconfigured) vs the prototype's 150 and 9, so the Skills Library shows the extra "2 skills have not been configured" info bar and Course Mapping shows "6 skills need configuration".
- `Open link` is an outline button (prototype: filled blue). Some dialog titles use the DS serif title face.
- The model tiles are a hand-rolled RadioGroup (the DS SelectionTileGrid detaches its radio from the tile); selection also shows a ring.
- Course skill list order follows the offering's mapping order.

