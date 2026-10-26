# 01 Layout pattern library for the lab (five page templates, build-ready)

**Written:** 2026-10-26 for Romit Soley and the lab builders. **Status:** standard for the next lab build; no app code changed by this doc. Nothing here decides an `OD-*`.
**Consulted:** `../../00-design-brief.md`, `../../glossary.md`, `../../02-decisions-ledger.md` (3c defaults), `../../strategy/01` (IA), `02` (text budget), `03` (rule change flow), `04` (shells, header, sticky actions, step indicators), `06`, `07` (UX laws, density budget), `../visual-language.md`, `../lab-README.md`, `../../ds-usage-map.md`, `../import-and-starter-library.md`, `../configure-skill.md`, `../skills-library-and-add-skill.md`, REQ SL, IM, SC, CM (`/tmp/sc-audit/requirements.txt`), `docs/v2/audit/T1-admin.md`, `../../01-competitive-digest.md`.
**Tags:** `[REQ id]` `[LAW]` lawsofux.com `[NNG]` `[S0n]` strategy doc `[DS]` read from `@exxatdesignux/ui@1.6.5` dist types or `src/globals.css` `[SHOT]` screenshot I looked at `[CODE file:line]` `[MOBBIN]` `[INFER]` my judgement.
**Companions:** `02-skill-setup-content-and-ui-strategy.md` (per-screen build specs), `03-lab-architecture.md` (lab chrome, flows, work breakdown).

---

## 0. Why this exists (what I saw)

Every setup screen invents its own frame. Measured on the current lab at 1440 x 900 [SHOT `../lab-shots/sweep-after-admin-*`, `evidence/current-*`]:

| Screen | Frame it invented | What goes wrong |
|---|---|---|
| Import A, step 1 | Full-width column (1136 px), numbered DS `Wizard` with 36 px circles, visible `WizardProgress` "Step 1 of 4", `WizardStepHeading` "Upload" | The heading and "Step 1 of 4" repeat the stepper; the stepper uses 60 percent of its row as dead dashes; the dropzone is disabled until a 320 px Select is used ("Choose a library above to bring in a file"); 55 percent of the viewport is empty [SHOT sweep-after-admin-import-ai-review-A-1440] |
| Import A, step 2 | Same frame | Top of the table at y = 790: header, subtitle, stepper, "Step 2 of 4", repeated heading, attachment card, warning banner, 4 KPI cards, legend sentence, tabs, filter row: 9 regions before the first row. Unreadable line renders as tofu glyphs "□□ □□□□ □□" in the Skill name cell [SHOT evidence/current-import-review-A-1440] |
| Import B | Two panes in a card under the same header, KPI cards, banner and legend | Same 4 KPI cards and banner; the left pane shows 227 raw lines, so two scroll areas compete [SHOT evidence/current-import-review-B-1440] |
| Configure A | Status pill and facts line under the title, a dashed lab toolbar of 4 chips plus a sentence, then three columns: vertical stepper 208 px, form about 520 px, live panel 352 px; one lone Next button mid-page | Three columns at equal visual weight, so nothing leads; the form column is the narrowest; lab controls sit inside the product [SHOT sweep-after-admin-configure-skill-A-1440] |
| Configure B | Same toolbar, then "Copy configuration from" row with two buttons, then section list, form, live panel | Three header-level buttons, two of them filled-looking [SHOT -B] |
| Configure C | Model tiles 175 px tall, sentence builder, collapsible, button | Tiles hold one word each in a 175 px box [SHOT -C] |
| Rule impact B | Same lab toolbar; table where all 8 visible rows read "1 more in Inpatient (you have 0 of 1)" | Von Restorff: a tie listed 15 times [SHOT evidence/current-rule-impact-B-1440] |
| Skills library A, B | Title with three header buttons, flat KPI strip (16, 160, 2), dashed "Add filter", table | Acceptable list frame; the strip and banner both carry "16 not configured" on some states [`../visual-language.md` section 5] |
| Starting points B | Cards, filter chips, a "Decision pending" pill beside the description | Reasonable, but a different header rhythm again |
| All screens | Variant bar with a long "Tests:" sentence (one line, truncated at 1440) and a "Design system components used on this page" panel under the content | Lab chrome competes with the product; the panel sits where a footer or the next region would be |

The cause is structural: there is no shared page template, so each builder chose title zone, action placement, stepper, width and footer anew. This file defines five templates; `02` applies them to the setup journey; `03` makes the lab enforce them.

---

## 1. Shared rules (apply to every template)

| # | Rule | WHY | CHECK |
|---|---|---|---|
| L1 | **Title zone**: DS `PageHeader` through `PageFrame` (`components/skills/page-header.tsx`). Title is the serif h1 from `PAGE_TITLE_TYPE_CLASS` = `text-lg sm:text-xl font-heading` (18 to 20 px) [DS page-header.d.ts]. One optional `subtitle` line only when it adds a fact the title cannot (the target list, the skill's state); never a sentence that explains the page | One place sets title type and inset [S04 4.1]; readers scan the first words and skip the rest [NNG F-pattern] | One h1; `subtitle` 12 words or fewer; no second paragraph under the title |
| L2 | **One primary action per screen**, filled `Button variant="default"`. Lists and dashboards put it in the header (`size="sm"`); wizards and forms put it in the sticky footer (`size="default"`, 40 px). Never both | A page with several equal buttons has no primary [S04 4.1]; serial position: the act-on control is last in reading order on a task page [LAW serial-position-effect] | Count `button[data-variant=default]` in `main` = 1 (density script line "primary") |
| L3 | **Secondary actions**: at most 2 `outline` `sm` buttons visible; everything else in one overflow `DropdownMenu` behind an `icon-sm` ghost button with `aria-label="More actions"`. Header `actionItems` follow the DS limit `PAGE_HEADER_MAX_VISIBLE_ACTIONS = 3` [DS] | Hick: fewer visible choices, faster pick [LAW hicks-law] | Visible header buttons 3 or fewer |
| L4 | **No icons on text buttons** (leading or trailing). `ResponsiveAction` requires an `icon` field [DS responsive-action-row.d.ts:17]; it is shown only in the overflow menu, so pass a Font Awesome class but keep header row buttons as `PageFrame actions` nodes when a row button would render the icon | Romit's standing rule [memory no_icons_action_buttons; S04 5.1] | Grep `fa-` inside visible `Button` children |
| L5 | **Spacing tokens** (real values, DS 1.6.5 `src/globals.css:961-968`): `--exxat-spacing-1` 4 px, `-2` 8, `-3` 12, `-4` 16, `-5` 20, `-6` 24, `-8` 32, `-12` 48. Use the Tailwind equivalents: `gap-2` inside a control group, `gap-4` between elements in a region, `gap-6` between regions, `gap-8` between groups of regions. Page padding stays `PageFrame` (`py-5`, `px-4 md:px-6`) | Proximity: the gap between groups is at least twice the gap inside [LAW law-of-proximity; S07 laws table] | Inspect: region gap 24 px; never `gap-3` between regions |
| L6 | **Controls are compact**: toolbars, filters, header actions use `--control-height-sm` 32 px (`size="sm"`); form fields use `--control-height` 40 px; phone targets `--control-height-touch` 44 px [DS globals.css:723-729] | Material density: compact suits toolbars and tables, not form fields [S07 1.1] | Header and toolbar controls 32 px tall |
| L7 | **Palette**: neutral surfaces (`--background`, `--card`, `--muted`), brand only on the one primary action and selected nav, soft brand tint (`--brand-tint` oklch 0.9695 0.0158 341.4 under `.theme-prism`) only for a selected tile, and ONE amber (`--chart-5` oklch 0.58 0.18 70.08 for marks; `--status-badge-warning-fill/-fg` for badges). Red (`--destructive`) only for a hard block that stops the primary action | One colour, one meaning [S07 K3]; amber not red [brief section 8] | 2 or fewer saturated hues above the fold (density script "hues") |
| L8 | **Banners** (`LocalBanner`) sit directly under the title zone, above tabs, filters or stepper content, at most 2 per screen. `variant="error"` only when the primary action is blocked, with focus links to each field; `warning` for amber attention; `success` after a commit, scrolled into view and focused; `info` with `emphasis="subtle"` | Banner in view after the action [S04 4.5; AUDIT T4 P2-4]; severity visibly distinct [S02 7.6] | Banner count 2 or fewer; no banner between table header and rows |
| L9 | **Validation**: field errors under the field (`FieldError`), plus one error summary `LocalBanner variant="error"` at the top of the step panel only after a failed attempt to continue; the primary stays enabled until that first attempt, then disabled with the reason in the footer context slot | Error prevention without hiding the reason [NNG heuristic 5, 9]; disabled controls without a reason fail Hick and recognition [S07 traps] | After pressing Next with a gap: summary appears, focus moves to it, each link focuses its field |
| L10 | **Empty state** in place of the region it replaces, same width and roughly the same height, content-specific copy `{what is missing}. {what to do}.` with at most one action; never a centred icon plus "No X yet" [S04 4.6; S02 7.3]. **Loading**: `Skeleton` in the final layout of that region (rows, tiles, footer), never a page spinner [S04 4.7] | Layout shift on 100+ row pages; empty states that explain [REQ RP-09] | Throttle and screenshot loading: no layout jump |
| L11 | **Say it once.** No sentence, figure or label appears twice on a screen, including Tip text versus visible captions, header subtitle versus banner, stepper label versus heading | [S07 K4; brief 5.2] | Density script "repeated sentences" = 0 |
| L12 | **Lab chrome is not page content.** Only the slim lab bar (03 section 2) sits above the page; no lab controls inside the page (the dashed demo bars in `components/lab/configure/shell.tsx:39`, `components/lab/evaluator/lab-controls.tsx` move into the lab bar's "Scenario" menu); no DS components panel under the page | Lab chrome competing with product is one of Romit's named problems | `[data-lab-chrome]` only inside the lab bar and its drawer |

---

## 2. The five templates

Widths below are the content column inside the staff shell. At 1440 the shell sidebar is 256 px and `PageFrame` pads 24 px each side, so the available column is 1136 px [CODE `page-header.tsx:46`; S04 4.3 says about 1144 px]. Columns are **left aligned**, never centred, so the title and the body share one left edge [S04 4.1].

New `PageFrame` widths (additive change to `components/skills/page-header.tsx`, owned by builder 4 in `03`): `form` = `max-w-[45rem]` (720 px), `wizard` = `max-w-[60rem]` (960 px). Existing `reading` (768) and `wide` (1024) stay for v2 callers.

### T1 List page

```
+-- PageFrame width="full" ------------------------------------------------------------- 1136 px ---+
| Skills                                                     [Import]  [Add a skill]  [...]          |  title zone, 32 px controls
| (subtitle only if needed)                                                                           |
|                                                                                       gap-4 (16)    |
| LocalBanner warning (optional, one)                                                                 |
|                                                                                       gap-4         |
| Tabs line: All 178 | Not configured 16 | Inactive 2           [Search]  [Filter]  [View]           |  tabs left, toolbar right, one row
| DataTable (grouped, 48 px rows, scrolls with the page, header row sticky)                           |
| ...                                                                                                 |
| bulk bar appears on selection (DataTable bulkActionsSlot)                                           |
+-----------------------------------------------------------------------------------------------------+
```

| Rule | Value | WHY | CHECK |
|---|---|---|---|
| Primary | Header, one filled `sm` button, rightmost | Jakob: list primary sits top right in DataTable hubs (Linear, Stripe customers) [MOBBIN https://mobbin.com/screens/eade1912-e11c-4d70-9556-1527dbd9837c] | 1 filled |
| Counts | Tab labels carry counts via `TabsCountBadge`; no KPI strip on a list unless the page has no tabs (then up to 3 figures, `KeyMetrics variant="flat"`) | S07 budget: list 0 figures when tabs exist; never repeat a tab count in a KPI [S04 4.2] | Figures above fold 0 (or 3 with no tabs) |
| Toolbar | Search, up to 3 filters, view switch: 5 or fewer controls; more go into "More filters" Popover | Hick [S07 laws table] | Controls above the table 6 or fewer |
| Width | Full (1136 at 1440) | Tables need width for 5 columns | n/a |
| Row action | Name cell is the link; one kebab `icon-sm` ghost per row | One control per row [skills-library doc section 1] | n/a |
| Detail | Opens in `FloatingSheetPanel` `size="md"` (32 rem) over the list, or routes for heavy work (configure) | Keep list context [S04 5.4] | n/a |
| Regions above fold | 4: title zone, optional banner, tabs plus toolbar row (one region), table | [S07 section 3 list column] | Density script regions 4 or fewer |
| Empty | Inside the table body via `DataTable emptyState`, one sentence plus one action | [S04 4.6] | `emptyState` prop present |
| Loading | `Skeleton` rows at 48 px with real column widths, tab skeletons | [S04 4.7] | n/a |
| 1024 | Same; hide the lowest-value column (Evaluations) via column visibility | Width | No horizontal scroll at 1024 |
| 375 | Tabs become a `Select`; table becomes a list of `Card size="sm"` rows (name, status badge, one fact); primary moves to the header overflow plus a full-width bottom button | [S04 4.4 mobile] | No sideways scroll |

### T2 Wizard page

```
+-- PageFrame width="wizard" ------------------------------------------- 960 px ---+
| Import skills                                                   [Cancel]          |  title zone (no subtitle)
|                                                                       gap-4       |
| (1)Upload ---- (2)Review ---- (3)Fix ---- (4)Confirm                             |  Wizard horizontal compact, labels inside 960
|                                                                       gap-6 (24)  |
| LocalBanner (only error summary or step-level warning)                            |
|                                                                                   |
| Step panel: one question, one job                                                 |
|   (no visible step heading; WizardStepHeading className="sr-only")               |
|                                                                                   |
+-- sticky footer (bottom 0, border-t, bg-background, py-3) -----------------------+
| [Back]                          142 ready, 0 need a decision     [Create skills]  |
+-----------------------------------------------------------------------------------+
```

| Rule | Value | WHY | CHECK |
|---|---|---|---|
| Stepper | DS `Wizard orientation="horizontal" variant="compact" linear` + `WizardNav` inside the 960 column. Compact markers are 24 px dots [DS wizard.js: `compact ? "size-6"`]. 3 to 5 steps; 6 or more is a design smell (DS `WIZARD_RECOMMENDED_MAX_STEPS = 6`, `WIZARD_SCROLL_THRESHOLD = 5`) | Labels inside the content width remove the long dashes seen today; strategy 04 5.5 says up to 5 steps take a horizontal indicator. Pipedrive import puts a compact 5-step row above the step content [MOBBIN https://mobbin.com/screens/3eedf784-de2e-42c0-b9d6-a768348986dd]; Remote centres 4 short labels [MOBBIN https://mobbin.com/screens/3a5decfb-5aa1-4283-a804-2c9d9866d852] | Step labels 1 to 2 words; stepper row 40 px tall or less |
| No repeats | No visible `WizardProgress` text ("Step n of m"): render it `className="sr-only"` with `aria-live="polite"` so it is announced. No visible heading that repeats the step label; the panel opens with its one question in `text-base font-medium` (for example "Which lines need a decision?") or with the hero control | Say it once [S07 K4]; the stepper already states position | Grep the rendered panel for the step label text: appears once (in the stepper) |
| Width | 960 px (`max-w-[60rem]`): wide enough for a 4-column review table, narrow enough to keep the footer and the stepper within one eye span | Remote and Pipedrive keep import content in a bounded column; full width (1136) left 55 percent empty on step 1 [SHOT] | Column 960 at 1440, 100 percent below |
| Footer | Sticky to the bottom of the scrollport (`position: sticky; bottom: 0` inside the shell's single `data-page-scroll` owner), `border-t border-border bg-background`, `py-3` (12 px) so its height is 64 px with 40 px buttons. Left: `Back` (`outline`, `default` size; hidden on step 1). Middle right: context text (`text-sm text-muted-foreground`, 10 words or fewer, the step's outcome in numbers or the blocking reason). Right: the primary (`default`, `default` size). Exit is `Cancel` (`outline sm`) in the title zone, which opens a discard `AlertDialog` when there is work | Fitts: the forward action stays in the same place on every step [LAW fittss-law]; Pipedrive, Attio and Fibery all keep Back and the forward action together at the bottom [MOBBIN https://mobbin.com/screens/743c9394-4846-4d21-a8ab-c9ac8729ce60, https://mobbin.com/screens/0772ade8-9a33-4c63-932b-4136f4eb50b2]; S04 4.5 asks for a sticky wizard footer | Footer visible at 1440 x 900 on every step without scrolling |
| Banners | Under the stepper, above the panel; error summary only after a failed continue | L8, L9 | n/a |
| Step panel budget | 7 fields per step at most; 1 figure (impact) at most; 0 charts except the impact preview | [S07 section 3 form or wizard column] | Density script, page type `form` |
| Regions above fold | 4: title zone, stepper, panel, footer | [S07 section 3] | 4 or fewer |
| Loading | Skeleton of the panel in its final shape; stepper and footer render immediately with the primary disabled and "Reading the file" in the context slot | Doherty threshold: respond within 400 ms [LAW doherty-threshold] | n/a |
| 1024 | Column 100 percent of available (about 720); footer same | n/a | n/a |
| 375 | Stepper collapses to the current step name in `text-sm font-medium` plus `WizardProgress` visible as "3 of 4" (here the stepper is not visible, so this is not a repeat); footer buttons full width stacked, primary on top, 44 px | Touch targets [DS `--control-height-touch`] | No sideways scroll; primary 44 px |

### T3 Form or detail page

```
+-- PageFrame width="form" --------------------------- 720 px ---+
| Oral medication administration         In use  [...]          |  title + StatusBadge in subtitle slot
| Medication. 121 students have evidence.                        |  subtitle: facts only
|                                                    gap-6        |
| Section heading (h2, text-base font-semibold)                   |
| Field  Field                                                     |  FieldSet, gap-4 between fields
|                                                    gap-8        |
| Section heading                                                  |
| ...                                                              |
+-- sticky footer ----------------------------------------------+
| Get 3 evaluations rated Met. Today 113 achieved.   [Publish]   |
+----------------------------------------------------------------+
```

| Rule | Value | WHY | CHECK |
|---|---|---|---|
| Width | 720 px single column (`max-w-[45rem]`); two fields side by side only when they are a pair (first and second outcome label) | One column is completed faster and with fewer errors than multi-column forms [INFER from Baymard/NNG form guidance; Clerk plan settings and Plane automation keep one centred column about 640 to 720 px wide: MOBBIN https://mobbin.com/screens/5fcadf3b-ace8-4161-a761-bff11b623aa1, https://mobbin.com/screens/68c84e24-ebfa-4d7e-ad62-c999eb899a34] | Column 720 at 1440 |
| Sections | `FieldSet` + `FieldLegend` (or `PageSection` h2) per group of 5 to 7 fields; `gap-8` between sections, `gap-4` between fields | Chunking, Miller [LAW chunking] | 7 or fewer fields per section |
| Primary | Sticky footer as in T2, with a summary line on the left instead of Back | Sweatpals and Meetup keep Save draft and Publish in a sticky bottom bar on long settings forms [MOBBIN https://mobbin.com/screens/fb01363b-c53c-4c59-b075-5dabf5d27b72, https://mobbin.com/screens/5825d35f-a44d-4532-97d9-2efeaeee7009] | Footer visible |
| Detail page | Same width rule for a record detail that is mostly fields; a detail with a table of related records may use `wide` (1024) | Reading line length | n/a |
| Disclosure | Advanced options behind one `Collapsible` per section ("More rule options"), never nested | Two disclosure levels at most [S07 K5; NNG] | Click depth 1 |
| Regions above fold | 4 (title zone, first section, second section start, footer) | [S07 form] | n/a |
| 375 | Same column at 100 percent; side-by-side pairs stack | n/a | n/a |

### T4 Split page (list plus detail panel)

```
+-- PageFrame width="full" ------------------------------------------------------------------+
| Approvals                                                                      [Approve 3] |
| Tabs: Awaiting 9 | Stalled 4 | Returned 2                 [Search] [Filter]                 |
| DataTable (left, shrinks)                     | FloatingSheetPanel size="md" (32 rem)        |
|  row (selected)                               |  Header: record title, close                  |
|  row                                          |  Body: the record                             |
|  row                                          |  WorkflowFooter: Cancel | primary             |
+--------------------------------------------------------------------------------------------+
```

| Rule | Value | WHY | CHECK |
|---|---|---|---|
| Panel | `FloatingSheetPanel` + `FloatingSheetPanelContent side="right" size="md"` (sizes `sm` 24 rem, `md` 32 rem, `lg` 40 rem [DS lib/floating-sheet-panel.d.ts:10]), non-modal so the list stays clickable; rows that swap the record carry `railTriggerProps()` [DS] | DS sheet convention [memory ds_sheet_convention]; keeps the list in place | Clicking another row swaps content without a blink |
| Primary | One: in the panel's `FloatingSheetPanelWorkflowFooter` when a record is open; in the header (bulk) when rows are selected and no panel is open | [S07 split column: primary 1] | 1 filled visible |
| Budget | Regions 5 (panel counts as one), controls 8, words 40 | [S07 section 3 split] | Density script page type `split` |
| 1024 | Panel `sm`; list drops to name, status, one fact | n/a | n/a |
| 375 | Panel becomes a full-screen route; list is cards | n/a | n/a |

### T5 Dashboard

Unchanged from `../../strategy/06-dashboard-patterns.md` and `../../strategy/07-ux-laws-and-density.md` section 3: full width, title zone with Export as the only header action, one-row scope bar (32 px controls), verdict band, at most 2 charts and 4 figures above the fold, act-on region last. Listed here so every lab screen maps to one of five templates.

---

## 3. Page-type budgets added for wizard, form, list and detail (extends strategy 07 section 3)

Shell and lab chrome excluded. Counts are for the first 1440 x 900 viewport.

| Budget line | List (T1) | Wizard step (T2) | Form (T3) | Detail (T3 wide) | Split (T4) |
|---|---|---|---|---|---|
| Regions | 4 | 4 (title, stepper, panel, footer) | 4 | 5 | 5 |
| Headline figures | 0 with tabs, 3 without | 1 (only an impact or outcome figure) | 0 | 4 | 3 |
| Visible controls above the first table or the panel | 6 | 7 fields in the panel; 3 in title plus footer (Cancel, Back, primary) | 7 fields per section | 6 | 8 |
| Prose words (not data, labels, buttons) | 40 | 30 per step (12 per field helper) | 40 | 40 | 40 |
| Filled primary | 1 | 1 (footer) | 1 (footer) | 1 | 1 |
| Outline secondary visible | 2 | 2 (Cancel, Back) | 2 | 3 | 3 |
| Stepper | none | horizontal compact, 3 to 5 labels | none | none | none |
| Banners | 1 | 1 (2 only when one is the error summary) | 1 | 1 | 1 |
| Repeated sentence | 0 | 0 (no step label twice, no "Step n of m") | 0 | 0 | 0 |
| Content max width | 1136 (full) | 960 | 720 | 1024 | full |

`admin/tests/lab/density-budget.mjs` needs a `wizard` page type with these values (builder 4 adds it; see `03` section 7).

---

## 4. Every built lab screen mapped to a template, and what violates it today

Evidence column: `SHOT` = I looked at the 1440 shot; `CODE` = grep in `admin/components/lab/screens`. A screen not marked was mapped by its purpose only and has not been audited against the template.

### 4.1 Setup journey (in scope for the next build; full specs in `02`)

| Screen / variant | File | Template | Violations today | Change |
|---|---|---|---|---|
| admin/skills-library A | `screens/admin-skills-library-a.tsx` | T1 | KPI strip (16 / 160 / 2) above a table that also has a "All skills" view select: counts said twice once tabs exist; dashed "Add filter" button plus search icon plus filter icon plus view select: 4 toolbar entry points [SHOT] | Replace strip and view select with status tabs carrying `TabsCountBadge`; keep search and one Filter |
| admin/skills-library B | `-b.tsx` | T1 | Same strip; toggle "Most to set up first" plus "Expand all" plus count in one row; per-section "Configure 4 here" outline button plus "Add a skill here" on every section header (2 buttons per group) [SHOT] | One kebab per section header; sort toggle into the Filter popover |
| admin/skills-library C | `-c.tsx` | T1 | Board fills the viewport with cards; acceptable as an option; footer panel cut at the fold [SHOT] | Keep as option set 3; remove DS panel |
| admin/add-skill A | `-a.tsx` | T4 (sheet over T1) | Sheet holds 8 fields including 4 tall model radio cards; three footer buttons (Cancel, Save, Save and configure) [SHOT] | 3 fields visible, rest under "More details"; model out of the sheet (configure owns it) |
| admin/add-skill B | `-b.tsx` | T1 | Inline row card plus header "Add a skill" button still visible: two ways to add on one screen [SHOT] | Hide the header button while the inline row is open |
| admin/import-ai-review A | `screens/admin-import-a.tsx` | T2 | Width full; numbered 36 px stepper; visible "Step n of m" [CODE :196]; visible step heading [CODE :199]; dropzone disabled until the library Select [SHOT]; step 2 has 9 regions above the table [SHOT evidence]; tofu glyphs for unreadable text [SHOT evidence]; 2 filled buttons in the file [CODE] | Rebuild per `02` section 3 |
| admin/import-ai-review B | `-b.tsx` | T2 without a stepper (single page) | Same header, banner and 4 KPI cards; two scroll panes [SHOT evidence] | Becomes option set 3 per `02` |
| admin/starter-library A, B | `admin-starter-library-a.tsx`, `-b.tsx` | T1 | B: "Decision pending" pill sits beside the description as page content; A: 2 filled buttons [CODE] | Pending flag moves to the lab bar info tooltip (it is a lab note, not product copy) |
| admin/configure-skill A | `screens/admin-configure-skill-a.tsx` | T2 | Vertical stepper plus form plus live panel (3 columns); 6 steps; dashed lab toolbar in the page [CODE `configure/shell.tsx:39`]; Next floats mid-page, not sticky [SHOT]; 2 filled buttons [CODE] | Rebuild per `02` section 4 (5 steps, horizontal, 720 column, rule sentence in the sticky footer) |
| admin/configure-skill B | `-b.tsx` | T3 | Three columns; "Copy configuration from" row plus 2 header buttons [SHOT] | Becomes option set 2 per `02` |
| admin/configure-skill C | `-c.tsx` | T3 | 175 px model tiles; live panel column [SHOT] | Becomes option set 3 per `02` |
| admin/rule-change-impact A, B | `admin-rule-impact-a.tsx`, `-b.tsx` | T2 last step (A) / T3 | Same lab toolbar; tie repeated per row [SHOT evidence] | Step 5 of configure per `02` section 5 |
| admin/course-mapping A, B | `admin-course-mapping-*.tsx` | T4 (A, offering first), T1 (B) | Not audited in this pass | Next flow step after publish; journey bar link only |

### 4.2 Other lab screens (template assignment; audit later)

| Screen | Template | Known issue (evidence) |
|---|---|---|
| admin/dashboard A to F | T5 | Covered by strategy 07 section 4 and `../visual-language.md` |
| admin/dashboard-drill A, B | T1 | n/a |
| admin/retire-deactivate A | T3 | Uses full width (no `width` prop) [CODE]; should be `form` |
| admin/retire-deactivate B | T4 | n/a |
| admin/lists-cohorts A, B | T1 | n/a |
| admin/evaluator-directory A, B | T1 (A), T4 (B) | n/a |
| admin/settings A, B | T1 (A), T4 (B, three panes: master, entries, detail) | B exceeds 2 panes; check against the split budget |
| admin/attainment A, B | T5 (A matrix), T1 (B) | n/a |
| admin/export A, B | T4 (A, panel over attainment), T3 (B) | B uses full width [CODE]; should be `form` |
| admin/approvals A, B | T1, T4 | n/a |
| student/home A to C | T5 (student progress budget) | n/a |
| student/log-skill A, B | T3 (`form`) | A has 2 filled buttons [CODE] |
| student/request-signoff A, B | T2 (A: who, then how) / T3 | B uses `wide` [CODE] |
| student/my-requests A, B | T1 | n/a |
| student/fix-returned A, B | T3 (A `reading`), T3 wide (B before and after) | n/a |
| student/skill-detail A, B | T3 detail | A uses `wide` [CODE] |
| student/record A, B | T1 | n/a |
| student/share-record A, B | T3 | B uses `wide` [CODE] |
| student/offline-sync A, B | T1 (A ledger), T3 (B one at a time) | n/a |
| evaluator/* (form, submitted, expired, email) | Evaluator shell: centred 820 px column, light header, no lab bar except the slim one [S04 3] | form B and C have 2 filled buttons [CODE]; in-page lab controls in `components/lab/evaluator/lab-controls.tsx` and `outcome-variants.tsx` [CODE] (move to the lab bar Scenario menu) |
| lab-instructor/lab-batch-grid A, B | Evaluator shell, `wide` | n/a |
| reviewer/approvals A to C | T1, T4, T1 board | n/a |
| reviewer/review-item A to C | T3 detail | n/a |
| reviewer/student-record A, B | T3 detail | n/a |
| reviewer/students A to C | T1 | n/a |
| director/dashboard A to C | T5 | n/a |
| director/verification-detail A, B | T3 detail (`wide`) | n/a |
| director/reports A, B; director/attainment A, B | T5, T1 | n/a |

---

## 5. How a builder checks a screen against its template (paste in the PR)

1. Name the template (T1 to T5) in the variant's file header comment and set `data-page-type` on the root (`list`, `wizard`, `form`, `detail`, `split`, `dashboard`).
2. Run `node tests/lab/density-budget.mjs` for the variant at 1440 x 900 and paste the line (regions, figures, controls, words, primary, hues, repeats).
3. Screenshot 1440 x 900, 1024 x 768 and 375 x 812; confirm: one filled primary; footer visible on wizard and form; no text repeated; no horizontal scroll.
4. Run `node scripts/lab-ds-gate.mjs` (no raw `button` or `table`, no hex, no "items", explicit Button variant and size).
5. Keyboard pass: Tab reaches the stepper (if clickable), the panel, then Back and the primary in that order; Escape closes sheets; focus returns to the trigger.
