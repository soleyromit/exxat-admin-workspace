# Strategy 07: UX laws and the density budget (so no screen ships crowded)

**Written:** 2026-10-26 for Romit Soley. **Status:** standard for review; no app code changed. No `OD-*` is treated as decided.
**Why this file exists:** Romit on the lab dashboard (`/lab/admin/dashboard?variant=A`): "extremely crowded and doesn't follow UX and UI principles, laws" [ROMIT 10-26]. Strategy 01 to 06 say *what* goes on a screen; this file says *how much* fits, and gives numbers a reviewer or a Playwright test can count.
**Inputs read:** `../00-design-brief.md`, `../glossary.md`, `../02-decisions-ledger.md`, `02-content-strategy.md` (prose ceilings), `04-ui-and-visual.md` (spacing), `06-dashboard-patterns.md`, `../design/dashboards-and-layouts.md`, code `admin/components/lab/screens/admin-dashboard-{a,b,c}.tsx`, `admin/components/lab/dashboard/{frame,scope-bar,cards}.tsx`, `admin/components/v2/admin/admin-home.tsx`, `admin/components/v2/viz/tokens.ts`, shots `../design/mockups/shots/admin-A-1440.png` and `../design/lab-shots/before-dashboard-{A,B,C}.png` (1440 wide), DS `@exxatdesignux/ui@1.6.5` `src/globals.css`.
**Tags:** `[LAW]` lawsofux.com page · `[NNG]` Nielsen Norman Group article · `[M3]` Material · `[DS]` globals.css token · `[S02]`..`[S06]` sibling docs · `[CODE file:line]` · `[SHOT]` screenshot count · `[INFER]` my judgement, not a study.
**Format:** each rule is DECISION, WHY (source), REJECTED, CHECK, as in 01 to 06.

---

## 1. The five rules that matter most

| # | DECISION | WHY | REJECTED | CHECK |
|---|---|---|---|---|
| K1 | **First viewport (1440 x 900) holds at most 5 regions on a dashboard, 4 elsewhere.** A region is a bounded block with its own question (header, scope bar, verdict band, chart card, table, worklist) | NN/g: a dashboard is a "single-page view that imparts at-a-glance information" [NNG dashboards]; every extra block "competes with the relevant units of information" [NNG heuristic 8] | Fitting everything because it is all true | Playwright `data-region` count (section 6) |
| K2 | **At most 4 headline figures per screen, the hero included.** A figure that repeats another region's figure does not count as a fifth, it is deleted | Miller: working memory is limited, chunk instead of listing [LAW millers-law]; [S06 4.1 "max 4 KPIs"] | Hero plus 4 KPIs (5 figures today) | Count `[data-figure]` above the fold |
| K3 | **One colour, one meaning, per page.** Amber is the only state hue (shortfall); brand only on the one primary action and selected nav; every other mark is neutral | Similarity: alike-looking things read as one group [LAW law-of-similarity]; colour carries no magnitude and fails for colour-blind readers [NNG dashboards] | Blue meaning "on track" in one chart and "8 to 14 days" in the next (today) | Distinct saturated colours above the fold is 2 or fewer |
| K4 | **Say it once; prose ceiling 40 words desktop, 25 phone, 15 evaluator** (words that are not data, labels or buttons) [S02 section 5] | Cognitive load is the mental effort to use the screen [LAW cognitive-load]; readers scan the first words and skip the rest [NNG F-pattern] | A description under each chart that restates the hero | Word count script; duplicate-sentence check |
| K5 | **Two disclosure levels at most: the surface, then one click.** Tables, formulas, secondary filters and comparison live one click away, never two | NN/g: "designs that go beyond 2 disclosure levels typically have low usability" [NNG progressive disclosure] | Surfacing everything; or nesting a popover inside a sheet inside a tab | Click-depth audit per fact |

### 1.1 How an agent applies this without being told

| When | Do | Output |
|---|---|---|
| Before any layout (contract, mockup, JSX) | Pick the page type in section 3; write its budget row into the contract | A "Density budget" table in the contract with the target per line |
| While composing | Spend the budget top-down: verdict first, then the 1 to 2 regions that answer the next question; anything left over goes to section 3's "one click away" table | A region list with each region's question |
| Before claiming done | Count from the screenshot at 1440 x 900 and from the code (section 4 method); run section 6 when it exists | The filled audit row from section 4, pasted with numbers |
| When a budget line fails | Cut or move, never shrink type, padding or spacing below the tokens in section 3 to make things fit | A cut list in the section 4 format |
| When a line cannot be met | Say which line, why, and ask Romit; never silently raise a limit | A line in the report under "uncertain" |

Shrinking spacing to fit more is the wrong fix: density in Material is a per-component scale for tables, lists and long forms, not a way to fit more regions on a landing page [M3 density blog] [INFER for the landing-page reading].

## 2. Laws table (what each law means, our rule with numbers, where it bites)

| Law | In one plain sentence | Our rule for this product | Example on our screens |
|---|---|---|---|
| Hick's law [LAW hicks-law] | The more choices you show, the longer it takes to pick one | Max 5 visible filter controls in a scope bar or table toolbar; anything past 5 goes into "More filters". A select with more than 7 options gets type-to-search (Popover + Command; the DS has no Combobox) | Dashboard scope bar shows 6 selects today (term, cohort, group, course, More, Compare): move Group into More. Configure: evaluation model choice shows its 4 options as tiles, each with one consequence line |
| Miller's law [LAW millers-law] | People hold only a handful of things in mind at once, so group them | Clusters of 5 to 7 (nav 4 rows, KPI 4, worklist 5 + "All n", ranked chart top 5 to 8). LawsofUX warns not to use 7 as an excuse for arbitrary limits, so cut by meaning first [LAW] | Skills library: 153 skills shown as 10 sections, collapsed, each with its count, not one flat scroll. Approvals tabs: 3, each with a count |
| Chunking [LAW chunking] | Break long content into small named groups | Every list over 20 rows is grouped or paginated; a group heading carries a count | Import review: 154 rows grouped "Needs a decision (n) / Ready (n)"; Evaluator form: one card per skill |
| Fitts's law [LAW fittss-law] | Small or far targets are slower and easier to miss | Desktop target 24 px minimum (WCAG 2.5.8), touch 44 px (`--control-height-touch`) [DS]; the action sits next to the thing it acts on; on phone the primary action is full width at the bottom | Evaluator form: Submit is full width on 375 px; Approvals: row action at the row end, bulk action in the bar that appears on selection |
| Jakob's law [LAW jakobs-law] | People expect your screen to work like the other tools they use | Use the shapes they know: scope at top, as-of at the right [S06 M1 to M4], removable filter chips, DataTable sort and search, tabs with counts. No invented chart without a legend and a table | Dashboard follows the AirOps and Square analytics layout [S06 M1, M2]; Skills library behaves like any DataTable |
| Gestalt: proximity [LAW law-of-proximity] | Things close together read as one group | Gap between groups at least twice the gap inside a group: `gap-1`/`gap-2` inside, `gap-4` between elements, `gap-6` between sections, `gap-8` between groups [S04 4.3] | A figure and its "of N" sit 4 px apart; two KPI cells 16 px apart; hero band and charts 24 px apart |
| Gestalt: common region [LAW law-of-common-region] | A border or fill makes what is inside it a group | One card answers one question. No card inside a card (the table fallback is the only nested block). Never box a single line of text | Dashboard: Needs you is one card; the Unverified evaluator line belongs inside "Where are requests stuck", not as a fourth box |
| Gestalt: similarity [LAW law-of-similarity] | Things that look alike are read as the same kind of thing | One colour, one meaning, per page (K3). Same glyph for the same state everywhere (amber diamond = behind) | Today blue = on track in the gap strip and blue = 8 to 14 days in the site bars [CODE viz/tokens.ts:24, cards.tsx:249]: fails |
| Gestalt: figure/ground [INFER, classic Gestalt] | The eye separates the thing to look at from its background | Data marks are the only saturated ink; gridlines and axes `var(--border)`; cards use the DS surface and no extra shadow | Gap strip: on-track dots `--muted-foreground`, behind dots amber, zero line foreground |
| Gestalt: Prägnanz [LAW law-of-pr%C3%A4gnanz] | People read a complex picture as its simplest form | One chart form per question; no decorative repeats of a number already printed | Hero glyph row draws 28 diamonds for "28" next to the dot strip that draws the same 28 [CODE cards.tsx:91]: cut |
| Tesler's law [LAW teslers-law] | Some complexity cannot be removed, only moved | Rule complexity lives in the engine and the Configure wizard; students and evaluators see the result in one sentence | Student progress: "Needs 2 sign-offs from 2 different evaluators; you have 1" [REQ SH-03]; the admin sees the full chain model, evidence, rule |
| Von Restorff effect [LAW von-restorff-effect] | The one thing that differs is the one remembered | Highlight at most 1 thing per region, or at most 20% of the marks [INFER]. If every value is equal, say so in a sentence instead of a chart | Variant B outlines 7 of 9 visible matrix cells: nothing stands out. Blocker card ranks 8 skills that all read "17 of 42" [SHOT A]: replace with "8 skills tie at 17 of 42" |
| Serial position effect [LAW serial-position-effect] | First and last in a sequence are remembered best | Put the verdict first and the act-on-it region last in reading order; nav: landing first, reports last | Dashboard: hero first, Needs you last; Evaluator form: summary first, Submit last |
| Doherty threshold [LAW doherty-threshold] | People stay productive when the system answers within about 400 ms | A scope or basis change re-renders figures for 123 students x 153 skills within 400 ms; slower work shows the final-shape Skeleton per card, never a full-page spinner | Dashboard scope change; Configure rule impact preview ("6 students change status") |
| Postel's law [LAW postels-law] | Accept messy input, give back clean output | Import accepts any column order, merged cells, synonyms and several date formats; it outputs one strict shape and lists what it guessed | Import: "We read 'Skill title' as Name" with an undo per guess [REQ IM-05] |
| Aesthetic-usability effect [LAW aesthetic-usability-effect] | Attractive screens are judged easier, which hides real problems | Never accept a design on looks; run the 10-second test [S06 D1] and the counts in section 3 | A polished dashboard still failed 4 budget lines (section 4) |
| Pareto principle [LAW pareto-principle] | A few causes produce most of the effect | The top jobs per role own the first viewport (admin: who is behind, what waits; reviewer: approve; student: ask for sign-off); set-up, export and history go below or one click away | v2 admin home spent half its first viewport on "Library setup" [CODE admin-home.tsx:108] |
| Zeigarnik effect [LAW zeigarnik-effect] | Unfinished tasks stay on our mind | Show open work as a count with a next step, never as a nag | Student progress "In progress (2 of 4)" [LEDGER D-L1]; Configure "12 not configured" with "Configure next" |
| Goal-gradient effect [LAW goal-gradient-effect] | Effort rises as the goal gets closer | Surface the nearly-done: "one skill short" is a first-class group; no progress bars for attainment [brief section 8] | Director: "7 are one skill short"; Student: "1 more sign-off" |
| Peak-end rule [LAW peak-end-rule] | An experience is judged by its best or worst moment and its end | Every flow ends on a plain outcome sentence that says what happens next | Evaluator: "Counted now" or "Waits for approval by the program" [REQ EV-07]; Import: "142 skills added, 12 need configuring" |
| Occam's razor [LAW occams-razor] | Prefer the simplest option that works | The cut test: remove an element; if no question loses its answer, leave it out | Hero caption that repeats its own info Tip [CODE cards.tsx:75-82]: keep one |
| Cognitive load + progressive disclosure [LAW cognitive-load] [NNG progressive disclosure] | Every element costs effort; show the common part first, the rest on request | Two disclosure levels (K5). Behind one click: chart tables, formulas (Tip), More filters, Split by results, advanced rule options, version history | Configure wizard: advanced rule types behind "More rule options"; Skills library: row detail in a Sheet |
| F and Z reading patterns [NNG F-pattern] | Readers scan across the top, then down the left, and skip the right | Text pages (lists, forms): first column = the record name; headings start with the informative word. Dashboards (Z): verdict top-left, page action top-right, act-on region bottom-right | Approvals: student name first column; Dashboard: Export top-right, Needs you bottom-right |

**Nielsen heuristics that decide dashboards here** [NNG ten heuristics]

| Heuristic | Our rule | Example |
|---|---|---|
| 1 Visibility of system status | As-of time and Refresh always visible; offline drafts show queued, synced or conflict | Dashboard scope bar; Student log |
| 3 User control and freedom | Each filter chip removable alone; Back restores scroll and scope [S06 R3] | Dashboard to drill list and back |
| 4 Consistency and standards | Same student shows the same counts on every screen; one count per concept (nav badge and KPI may not disagree) | Approvals badge 19 vs KPI "20 in 19 submissions" [SHOT A]: label both as submissions or both as evaluations |
| 5 Error prevention | Unconfigured skills cannot be mapped or sent; blocked configurations saved with the reason [REQ IM-09, SC-18] | Configure, Map courses |
| 6 Recognition rather than recall | Applied scope readable without opening a control; select triggers print their value | Scope chips |
| 8 Aesthetic and minimalist design | "Interfaces should not contain information that is irrelevant or rarely needed" [NNG] | The density budget below |
| 9 Recognise, diagnose, recover from errors | A failed rule names the rule and the gap; a card error says what is kept and offers Try again | Student progress; dashboard CardError |

## 3. Density budget per page type (1440 x 900 first viewport unless stated)

Shell (left nav, utility bar) and lab chrome (variant bar, DS components panel) are excluded from every count.

| Budget line | Dashboard | List or table page | Form or wizard | Detail page | Evaluator form | Student progress | Split view or panel |
|---|---|---|---|---|---|---| --- |
| Regions in first viewport | **5** | **4** (header, toolbar or tabs, optional banner, table) | **4** (header, stepper, step panel, footer actions) | **5** | **3** (light header, request summary, first skill) | **4** (header, hero, do this next, list start) | **5** (header, scope bar, summary or tabs, list, and the open panel as ONE region) |
| Headline figures (hero included) | **4** | 0 (tab counts are the counts [S06 5.3]); 3 if the page has no tabs | 0 (1 impact figure on a rule step) | 4 | 0 ("Skill 2 of 5" is position, not a figure) | **3** (counted, waiting, returned [REQ SH-04]) | 3 (the list's; none in the panel header) |
| Charts above the fold | **2** | 0 (one in-cell viz column allowed) | 0 (1 preview on rule impact) | 1 | 0 | 1 (the hero viz) | 0 |
| Interactive controls above the first chart or table (buttons, selects, tabs, toggles; links inside figures excluded) | **8** | **6** (search, up to 3 filters, view, 1 action) | **7 fields per step** | 6 | 3 per skill (outcome, feedback, attach) + Submit | 4 | **8** (page and panel together; the panel's own toolbar, such as size, previous, next, close, counts) |
| Members per cluster (rows, tabs, KPIs, ranked marks) | 5 to 7; ranked chart top 5 to 8 + "All n" | 5 to 7 filters; 3 to 5 tabs | 5 to 7 fields per fieldset | 5 to 7 | 5 skills per sitting before "Next" [INFER] | 5 per group + "All n" | as list |
| Prose words above the fold [S02] | **40** | 40 | 40 (12 per field helper) | 40 | **15** | **25** phone, 40 desktop | **40** (page and panel together) |
| Primary (filled) actions | **1** | 1 (+ bulk action on selection) | 1 per step | 1 | 1 | 1 | 1 |
| Outline secondary actions above the fold | 2 | 2 | 2 (Back, Save draft) | 3 | 1 | 2 | 3 |
| Accent colours | 1 brand (primary action, selected nav) + 1 state hue (amber); everything else neutral | same | same | same | same | same + success tone for counted | same |
| Highlighted marks per region | 1, or 20% of marks [INFER] | 1 row state glyph per row | 1 error at a time in focus | 1 | 1 | 1 | 1 row state glyph per row |
| Repeated sentence or figure | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Page height | 2 viewports max [INFER] | table scrolls inside the page; header stays | 1 viewport per step | 3 | 1 skill card per viewport on phone | 2 | list scrolls; panel scrolls inside itself |

**Split view or panel (added 2026-10-26).** A list with an open record panel beside or over it (reviewer Approvals B; admin Export A, which exports from a panel over Attainment) is its own page type, not a list. The panel is the variant's point, so the open panel counts as ONE region, and its own controls and words count with the page's. Budget: regions 5, controls 8, words 40, primary 1. The script maps these screens to `split` in `PAGE_TYPE` (`admin/tests/lab/density-budget.mjs`). Why: a split view answers two questions at once (which record, and what about it) [LAW law-of-common-region] [INFER]; holding it to the list budget of 4 regions would force the panel closed or the list hidden, which removes the reason for the variant. No other limit is raised.

**Evaluator surfaces: what counts as prose (added 2026-10-26).** The evaluator budget stays 3 regions and 15 words. The request summary (student, skills, course, place) sits inside the light header as one region, and it is data. The student's own rating and note are record content. On the invitation screens the message being previewed (email body, text message, inbox row) is the artifact itself, so it counts as data only inside a frame visibly labelled "Email preview", "Text message preview" or "Inbox preview" (`data-artifact-preview` in code; the script fails an unlabelled one). The explanatory prose around it keeps the 15-word budget.

**Modal surfaces count alone (added 2026-10-26, delegated default, reversible).** When a dialog or sheet is modal (the page behind is inert: aria-modal, focus trap and pointer lock), only the modal surface is counted: its regions, controls and words; the page behind and its h1 are not. Why: the reader cannot act on the page behind, so its controls are not choices on screen [LAW hicks-law] [INFER]. A non-modal panel (FloatingSheetPanel, split view) keeps counting page plus panel, because both stay usable. The script (`admin/tests/lab/density-budget.mjs`, MODAL RULE) applies it; Export A and Add a skill A (the add sheet, modal since 2026-10-26: Escape and outside click go through the unsaved-change guard, focus returns to "Add a skill") are measured this way.

**A tab list counts as ONE control (added 2026-10-26, delegated default, reversible).** A tab list is a single choice (one view at a time), so it is priced like a radio group, a segmented control or a Select: one control, whatever the number of tabs. The tab count still has to respect the cluster line (3 to 5 tabs on a list). Why: the reader makes one decision; counting each status tab pushed every list page over budget for a choice made once (builder B3 finding on the skills library), and the only way to pass was to hide tabs that carry the counts [S06 5.3] [LAW hicks-law] [INFER]. The script (`admin/tests/lab/density-budget.mjs`, SINGLE-CHOICE GROUP RULE) applies it.

**Named exceptions (each is in the script's `EXCEPTIONS` map with its reason; no other screen may exceed its budget)**

None. The admin dashboard B and C allowances (+5 controls for their 5 tabs, D-X21) were removed on 2026-10-26 because the tab list rule above prices those tabs as one control.

**Spacing and type tokens (real values, DS 1.6.5 `src/globals.css`)**

| Token | Value | Use |
|---|---|---|
| `--text-xs` | max(12px, 0.75rem), line 1.333 | Floor for any text; captions, axis ticks |
| `--text-sm` | max(14px, 0.875rem), line 1.429 | Body, table cells, card descriptions |
| `--text-md` | max(14px, 0.9375rem) | Emphasised body |
| `--text-base` | max(16px, 1rem), line 1.5 | Evaluator form body, phone body |
| `--font-heading` / `--font-sans` | ivypresto-text serif / Inter Variable | Page title only serif; everything else sans |
| `--control-height` / `--control-height-sm` | 40px / 32px (x `--scaling` 1) | Form fields / scope bar and toolbars |
| `--control-height-touch` | 44px | Every phone target |
| `--control-padding-y` / `-x` | 8px / 12px | Inside controls |
| `--table-row-height` | 48px | DataTable rows; never denser outside heat-grid and lab grid [S04 8] |
| `--radius` | 0.5rem (8px) | Cards and controls; never override |
| `--shell-utility-bar-height` | 2.625rem (42px) | Utility bar; part of the 900 px |
| Spacing | Tailwind 4 px scale (the DS defines no spacing tokens): `gap-2` inside, `gap-4` between elements, `gap-6` between sections, `gap-8` between groups; PageFrame 16 px block rhythm, 20 px vertical padding [S04 4.3] | Minimum vertical rhythm between regions is 16 px; between a region and the next section heading 24 px |

**Must move behind progressive disclosure (one click, never two)**

| Content | Where it goes | Control |
|---|---|---|
| Chart data tables | Under the chart | "Show as table" Collapsible (already) |
| Formula and basis explanation | Tip on the figure | Info button or focusable figure; not also as a visible caption |
| Secondary filters (group, category, tag, location, setting) | "More filters (n)" Popover | Applied ones show as chips |
| Comparison across cohorts or groups | Inside the chart card | Split by `ViewSegmentedControl` [S06 S2] |
| Lists longer than the cluster budget | Drill route | "All n" outline button |
| Set-up and adoption status | Needs you row or {Skills} filter | Never a dashboard card [S06 D3] |
| Advanced rule options, version history, audit trail | Configure step "More rule options"; record Sheet | Disclosure button |

## 4. Crowdedness audit (current lab dashboards and the older v2 admin home)

Counts from code plus the 1440 screenshots; first viewport = top 900 px of the 1440 x 2200 lab shots (818 px as displayed at 1309 wide). Lab chrome excluded.

| Budget line (dashboard) | Limit | A (lab) | B (lab) | C (lab) | v2 admin home (code only, not rendered) | Mockup admin-A-1440 |
|---|---|---|---|---|---|---|
| Regions in first viewport | 5 | **6 FAIL** (header, scope bar 2 rows, hero, KPI strip, who is behind, blocker) | **6 FAIL** (header, scope, hero, matrix, behind rail, Needs you) | 5 pass (header, scope, question rail, hero, chart) | 4 pass (header, KPI cards, 2 charts) | 5 pass |
| Regions on the page | 7 [INFER] | 8 (+ sites, Needs you) | 6 | 5 per tab | 6 (+ Set up, Needs attention) | 6 |
| Headline figures | 4 | **5 FAIL** (hero 28 + 4 KPIs) | **3 + 2 heroes FAIL** (hero names a section % and a student count) | **6 FAIL** (5 tab figures + hero repeats tab 1) | 4 pass | **5 FAIL** + 4 sparklines |
| Charts above fold | 2 | 2 pass + hero glyph row (a third viz) | 1 pass (matrix with internal scroll) | 1 pass | 2 pass | 2 + 4 sparklines **FAIL** |
| Controls above first chart | 8 | **10 FAIL** (Export, 4 selects, More, Compare, Refresh, hero Tip, View the 28) | **11 FAIL** (same 8 + View + Split 3-way + Rows 2-way) | **13 FAIL** (8 + 5 question tabs) | 0 pass | n/a |
| Prose words above fold | 40 | **about 60 FAIL** (hero detail 12, caption 11, chart description 21, blocker description 12, legend excluded) | about 45 **FAIL** | about 40 borderline | about 30 pass | about 100 **FAIL** |
| Repeated sentence or figure | 0 | **FAIL x4**: "28 of 123 behind the term clock" in hero and chart description; caption repeats the hero Tip; KPI "252 / 31 at 15 days" repeats the sites summary; KPI "16 to configure" repeats Needs you | **FAIL**: "28 of 123" in hero and rail heading; rail duplicates the hero drill | **FAIL**: "28 of 123" in tab and hero | **FAIL**: setup appears in a chart and in Set up | **FAIL** |
| One colour, one meaning | 2 saturated hues | **FAIL**: blue = on track (strip) and 8 to 14 days (site bars); brown on blocker lines, sites and hero; red nav badge | **FAIL**: 7 amber outlines of 9 cells; red nav badge | **FAIL**: blue on-track dots; red nav badge | **FAIL**: 4 tones per weakest-skill bar (met, magnitude, notMet, muted) | pass (grey on pace) |
| Highlighted marks per region | 1 or 20% | **FAIL**: 28 diamonds in hero glyph row; 8 equal blocker lines | **FAIL**: 78% of visible cells highlighted | pass | **FAIL** | pass |
| Primary actions | 1 | 0 (all outline) [INFER acceptable on a dashboard] | 0 | 0 | 1 pass | 1 |
| Dead space in first viewport | none | who is behind card has about 130 px empty under the strip (stretched to the blocker card height) | matrix scrolls inside its card while the rail is short | about 150 px gap between question rail and panel (rail triggers narrower than `lg:col-span-4`) | n/a | none |
| Viewer-centric cards (S06 D3) | 0 | 0 | 0 | 1 (tab "What is not set up?") | **2 FAIL** (Library setup chart, Set up section) | 0 |

**Minimal restructure for the polish worker (A first; each line fixes one failing budget line)**

| # | Cut or move | Fixes | File the worker owns |
|---|---|---|---|
| A1 | **Merge hero and KPI strip into one verdict band**: hero sentence left (8 of 12 columns), 3 KPIs stacked or in a row right; drop the "Skills configured" KPI (set-up belongs to Needs you per S06 D3) | Regions 6 to 5; figures 5 to 4 | `cards.tsx` Hero, Kpis; `admin-dashboard-a.tsx` |
| A2 | **Delete the hero glyph row** (`data-hero-glyphs`); the dot strip below already draws the 28 | Prägnanz, highlight budget, one viz fewer | `cards.tsx:91-98` |
| A3 | **Keep the basis explanation in the Tip only**; delete the visible caption line under the hero detail | Repeat 0; prose minus 11 words | `cards.tsx:82` |
| A4 | **Drop sentence 1 of the "Who is behind" description**; keep "Each dot is a student; left of the line is behind." (10 words) | Repeat 0; prose minus 11 | `cards.tsx:140-142` |
| A5 | **Move Group into More filters** (it is disabled until a cohort is set, so it is a dead control above the fold) | Controls 10 to 9; Hick | `scope-bar.tsx:89` |
| A6 | **Collapse the scope bar to one row** when nothing removable is applied: drop the two non-removable pseudo-chips ("Fall 2026", "All active students", which look like buttons and repeat the Term select) and move As of + Refresh + Sample data onto row 1; the chip row appears only when a chip exists | One row (about 44 px) back; affordance; repeat 0 | `scope-bar.tsx:126-159` |
| A7 | **Remove the hero info Tip button and put the Tip on the hero figure itself** (focusable), or keep the button and drop A3's caption, not both | Controls 9 to 8 | `cards.tsx:75-79` |
| A8 | **On-track dots neutral** (`--muted-foreground`), site age ramp neutral greys with amber only for 15+ days; never `--chart-1` on this page | One colour one meaning | `gap-strip.tsx:210`, `cards.tsx:249` (do not edit `components/v2/viz/tokens.ts`, shared) |
| A9 | **Blocker card: collapse ties.** If the top N share one value, print "8 skills tie at 17 of 42" and list names in one line with "All 31"; otherwise top 5, one line per skill (category to the Tip) | Von Restorff; cluster 8 to 5; height | `cards.tsx:190-243` |
| A10 | **Stop the stretch**: `self-start` on both diagnose cards, or give the strip card the table preview row so the 130 px gap is used | Dead space | `admin-dashboard-a.tsx:26` |
| A11 | **Fold the Sites summary into its KPI**: KPI "Waiting with evaluators" links to the sites card anchor; the card description keeps only the site fact ("14 sit at Maple Ridge Care") | Repeat 0 | `cards.tsx:254` |
| A12 | Nav count badge for Approvals uses the DS default destructive tone; ask DS or use the neutral count variant if one exists (check `node tools/ds/source.mjs SidebarMenuBadge`) [INFER] | Red only for hard blocks | shell, not lab |
| B1 | Delete the behind rail (the hero's "View the students" already opens that list); move Needs you under the matrix or to the right column alone | Regions 6 to 5; repeat 0 | `admin-dashboard-b.tsx:30-57` |
| B2 | One hero subject: the section gap. Move "28 of 123 behind" out of the hero sentence | Figures; say it once | `admin-dashboard-b.tsx:86` |
| B3 | Outline only the worst 3 cells (or cells 15+ points under); others show the number and the glyph only | Von Restorff | `section-matrix.tsx` |
| B4 | Move "Required / All skills" into the card's overflow menu or More filters | Controls 11 to 9 | `admin-dashboard-b.tsx:106` |
| C1 | The question rail figures are the KPIs: hide the Hero card inside the "Who is behind" panel and let the chart card title carry the sentence | Figures 6 to 5; repeat 0 | `admin-dashboard-c.tsx:72` |
| C2 | Rail width: make the triggers fill `lg:col-span-3`, panel `lg:col-span-9`, removing the 150 px gap | Dead space | `admin-dashboard-c.tsx:62` |
| C3 | Drop the "What is not set up?" question (viewer-centric) or rename it to the population fact it changes ("Students who cannot send a skill") | S06 D3 | `admin-dashboard-c.tsx:57` |
| V1 | v2 admin home (reference only, do not fix): Library setup chart and Set up section are viewer-centric; weakest-skill bars use 4 tones. Already superseded by S06 | n/a | none |

After A1 to A11, A counts: regions 5, figures 4, charts 2, controls 8, prose about 30 words, repeats 0, two saturated hues. That passes every dashboard line [INFER until measured by the script in section 6].

## 4b. The budget applied to the other screens (first viewport plan, not yet audited in code)

These are the allocations a designer starts from; each screen still needs its own count once built [INFER].

| Screen | Page type | Regions in the first viewport (in order) | Figures | Controls above the table or form | What goes one click away |
|---|---|---|---|---|---|
| Skills library | List | 1 header (title, Import, Add skill as the one primary) · 2 tabs or toolbar (search, Section, Model, State, view) · 3 optional banner "12 not configured" · 4 grouped table, 10 sections collapsed | 0 (tab counts) | 6: search, 3 filters, view, Add skill | Row detail in a Sheet; bulk configure on selection [REQ IM-14] |
| Add skill | Form | header · fields (name, section, group, required) · footer actions | 0 | 4 to 7 fields | Tags, description, evidence notes behind "More details" |
| Configure (wizard) | Form | header · stepper (3 to 5 steps) · step panel · footer (Back, Save draft, Next) | 1 on the rule step: "6 students change status" | 7 fields per step | Advanced rule types; preview of student and evaluator view [REQ SC-19] as its own step, not a side panel |
| Import | Form, then list | header · stepper (Upload, Match columns, Review, Done) · step panel · footer | 1 on Review: "154 rows, 12 need a decision" | Review step: filter "Needs a decision / Ready", bulk accept, 1 primary | Per-row guess detail in a Sheet; raw file preview behind "Show original" |
| Approvals | List (queue dashboard) | header · scope bar (term, cohort, group, course) · tabs with counts · queue table; the aging chart sits below or in a tab [INFER: S06 5.3 places 2 charts above the tabs, which breaks the list budget of 0 charts; Romit to choose] | 0 (tab counts) | 6: 4 scope selects, tabs, bulk approve on selection | Self versus evaluator answers in the row Sheet [REQ AR-02]; evaluator outlier chart |
| Evaluator form | Evaluator | light header (program, student, no chrome) · request summary (1 line) · first skill card (outcome, feedback) | 0 | 3 per skill + Submit (full width on phone) | Skill criteria text behind "What is assessed"; no charts, no history [REQ EV-03] |
| Student progress | Student | header "My progress" · hero (counted of required, ring or waffle) · Do this next · mandatory list start | 3: counted, waiting, returned | 4: course switch, Ask for sign-off (primary), filter, view | Failed-rule detail per skill (one sentence visible, history behind it); peer comparison off |
| Director dashboard | Dashboard | header · scope (cohort chip preselected) · verdict band (31 of 38 ready + split) · "What stops the 7?" · records by next step | 4 | 6 | Verification detail on the student record |

**Common traps found while writing this (check them on every screen)**

| Trap | Law it breaks | Rule |
|---|---|---|
| A description that restates the card title or the hero | Occam, heuristic 8 | Description only when it adds a fact the chart cannot show |
| A legend plus inline labels plus a table for the same marks | Prägnanz | Inline labels or a legend, not both; the table stays collapsed |
| Non-interactive chips styled like buttons | Jakob, Fitts (false targets) | Fixed scope facts render as plain text, not bordered pills |
| Disabled controls above the fold | Hick | Hide until usable, or move into More |
| Same count in nav badge, KPI and worklist with different units | Heuristic 4 | One unit per concept across the shell |
| Every row of a ranking showing the same value | Von Restorff | State the tie in words |
| Cards stretched to match a taller neighbour | Common region, figure/ground | `self-start`, or fill the space with the next useful content |

## 5. Review checklist (yes or no; any "no" blocks the screen)

| # | Check |
|---|---|
| 1 | At 1440 x 900, are there at most the budgeted regions for this page type (dashboard 5, others 4, evaluator 3)? |
| 2 | Are there at most 4 headline figures, hero included, and does no figure appear twice on the page (badge, KPI, card, worklist)? |
| 3 | Are there at most 2 charts above the fold, and is no number drawn twice (glyph row plus chart)? |
| 4 | Are there at most 8 interactive controls (6 on lists) above the first chart or table, with no disabled control above the fold? |
| 5 | Is visible prose under 40 words desktop, 25 phone, 15 evaluator, counted without data, labels or buttons? |
| 6 | Does every sentence appear only once on the page (including Tip text versus visible captions)? |
| 7 | Does each colour mean one thing on the page, with only brand (primary action, selected nav) and amber (shortfall) saturated? |
| 8 | Is at most one thing per region highlighted (or 20% of marks), and are ties stated in words rather than ranked? |
| 9 | Is there exactly one filled primary action, and at most 2 outline actions above the fold? |
| 10 | Do clusters stay at 5 to 7 members, with "All n" for the rest? |
| 11 | Is everything secondary exactly one click away (table, formula, More filters, split, history), never two? |
| 12 | Is the gap between groups at least twice the gap inside a group (gap-2 inside, gap-4 elements, gap-6 sections), with no card inside a card? |
| 13 | Is there no dead block over 80 px in the first viewport (stretched card, empty column, gap between rail and panel)? |
| 14 | Does a scope or filter change render within 400 ms, or show final-shape Skeletons per card? |
| 15 | Did a timed 10-second read pass: a coordinator states the hero number, its cause and the next click [S06 D1]? |

## 6. Script spec: measuring the budget in Playwright

**Proposed file:** `admin/tests/e2e/density-budget.spec.ts` (not written here; the tests folder belongs to the polish worker this session). Convention it needs: every region root carries `data-region="<name>"`, every headline figure `data-figure`, every chart `data-chart`, every page `data-page-type="dashboard|list|form|detail|evaluator|student"`.

| Step | How | Assertion |
|---|---|---|
| Setup | `page.setViewportSize({ width: 1440, height: 900 })`; goto route; `await page.evaluate(() => document.fonts.ready)`; wait for `[data-loading]` to detach; add a style that sets `transition: none; animation: none` (avoids mid-transition phantoms) | Page type read from `data-page-type` selects the budget row |
| Fold | `fold = 900`; an element is above the fold when its `getBoundingClientRect().top < fold` and height > 0 and it is visible (not `aria-hidden`, not `display:none`) | n/a |
| Exclusions | Skip anything inside `nav[aria-label]` shell sidebar, the utility bar, `[data-lab-chrome]` (variant bar and DS panel; add the attribute) | n/a |
| Regions | Count `[data-region]` above the fold whose nearest `[data-region]` ancestor is none (top level only) | `<= budget.regions` |
| Figures | Count `[data-figure]` on the whole page; collect their normalised text; also above-fold count | above fold `<= budget.figures`; no two figures with the same label and value |
| Charts | Count `[data-chart]` above the fold with height >= 80 px | `<= budget.charts` |
| Controls | `main` locator for `button, [role=button], [role=combobox], [role=tab], [role=switch], [role=checkbox], select, input:not([type=hidden]), textarea`, visible, top above `min(top of first [data-chart], [role=table], table, fold)`; exclude links (`a`) and elements inside `[data-figure]` | `<= budget.controls`; count of `[disabled], [aria-disabled=true]` among them is 0 |
| Prose words | Walk text nodes under `main` above the fold; drop nodes inside `button, a, label, th, [role=columnheader], [role=tab], svg, [data-figure], [data-scope-bar], h1, h2, h3, legend, [role=tooltip]`; drop tokens matching `/^[\d.,%:/+-]+$/`; count `/\p{L}+/gu` | `<= budget.words` |
| Repeats | Split all visible prose plus Tip labels (`[data-tip-label]` or `aria-label` of Tip triggers) into sentences; normalise case, digits kept | no duplicate sentence of 5+ words |
| Colour | For SVG marks and badges above the fold, read computed `fill`, `background-color`, `stroke`; convert to OKLCH in page (`new CSSStyleValue` unsupported, so parse `color(srgb ...)` via a canvas probe); keep chroma > 0.06 | distinct hues (rounded to 20 degrees) `<= 2` |
| Highlight share | Per `[data-chart]`, marks with `[data-flagged=true]` divided by all marks | `<= 0.2` or count `<= 1`, unless the chart's job is the flag (gap strip) and it carries `data-highlight-exempt` |
| Dead space | For each top-level region above the fold, sample a 4 x N grid of points with `document.elementFromPoint`; a row band of 80 px where every point hits only the card background is dead | 0 dead bands |
| Primary actions | Count visible `button[data-variant=default]` (or the DS primary class) in `main` | `<= 1` |
| Report | Attach JSON `{ route, pageType, regions, figures, charts, controls, words, repeats, hues, dead }` to the test; print a table on failure | Run on dashboard A, B, C, Skills library, Configure, Import, Approvals, Evaluator form, Student progress at 1440; repeat at 375 x 812 with the phone word limit |

[INFER] The `data-*` attributes are a convention proposed here; until regions carry them, the script can fall back to top-level children of the PageFrame content container, which over-counts wrappers.

## 7. References (fetched or searched 2026-10-26)

| Source | URL | What we use | Verified how |
|---|---|---|---|
| Laws of UX (Jon Yablonski), index and law pages | https://lawsofux.com/ (slugs `hicks-law`, `millers-law`, `fittss-law`, `jakobs-law`, `law-of-proximity`, `law-of-common-region`, `law-of-similarity`, `law-of-pr%C3%A4gnanz`, `teslers-law`, `von-restorff-effect`, `serial-position-effect`, `doherty-threshold`, `postels-law`, `aesthetic-usability-effect`, `pareto-principle`, `zeigarnik-effect`, `goal-gradient-effect`, `peak-end-rule`, `occams-razor`, `cognitive-load`, `chunking`) | One-line definitions; Doherty 400 ms; Miller caveat "Don't use the magical number seven to justify unnecessary design limitations" | WebFetch of index and the Miller page |
| NN/g, Laubheimer (2017), "Dashboards: Making Charts and Graphs Easier to Understand" | https://www.nngroup.com/articles/dashboards-preattentive/ | Single-page at-a-glance definition; length and 2D position are the most accurate encodings; avoid pie, donut, gauges; colour not for magnitude | WebFetch |
| NN/g, "Progressive Disclosure" | https://www.nngroup.com/articles/progressive-disclosure/ | Show the common set first; more than 2 levels typically has low usability; staged disclosure for wizards | WebFetch |
| NN/g, "10 Usability Heuristics for User Interface Design" | https://www.nngroup.com/articles/ten-usability-heuristics/ | Heuristic names; #8 wording | WebFetch |
| NN/g, "F-Shaped Pattern of Reading on the Web" (2017, from 2006 research) | https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/ | Front-load headings; first 2 words carry the gist | WebFetch |
| Material Design, "Material density on the web" | https://m2.material.io/blog/material-density-web | Three levels (default, comfortable, compact); dense suits tables, lists, long forms; do not densify dialogs | WebSearch snippet only (page body not fetched) |
| Apple HIG, Layout | https://developer.apple.com/design/human-interface-guidelines/layout | Group related content; 44 x 44 pt minimum target | Page body did not load; 44 px is also the DS token `--control-height-touch`, which is what we enforce |
| Mobbin references already cited | `06-dashboard-patterns.md` section 10 (M1 to M10); `../design/dashboards-and-layouts.md` (R1 to R12, including anti-examples R10 Deel donuts, R11 Employment Hero) | Scope top, as-of right, compare as a chip, table under chart | Viewed by the authors of 06 and the design doc |

No study is cited beyond those pages. Thresholds marked [INFER] (20% highlight share, 2-viewport page height, 7 regions per page, 5 skills per evaluator sitting, 80 px dead band) are judgement to be validated in review.
