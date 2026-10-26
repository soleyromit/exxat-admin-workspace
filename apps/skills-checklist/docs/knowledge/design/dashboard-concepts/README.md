# Dashboard concepts: six mental models before more polish

**Written:** 2026-10-26 for Romit Soley. **Status:** concept round, no app code. No `OD-*` treated as decided.
**Problem (Romit):** "What's with so many huge text and controls in the dashboard? It doesn't look like a dashboard. Also you are lacking different perspectives that you tried in the Home design compared to the Dashboard design."
**Consulted first:** `../../00-design-brief.md`, `../../glossary.md`, `../../02-decisions-ledger.md` (dashboard not home; cohort is a filter; "In progress"; per-request links; Approvals always shown), `../../strategy/05`, `06`, `07`, `../dashboards-and-layouts.md`, `../../dataset-spec.md`, `../../ds-usage-map.md`, shots `../mockups/shots/admin-A/B/C-1440.png` and `../lab-shots/before-dashboard-A.png`, DS tokens from `@exxatdesignux/ui` `src/globals.css` (`:root`, `.theme-prism`), `node tools/ds/source.mjs` for `KeyMetrics`, `PageHeader`, `SelectTrigger`, `FloatingSheetPanel`, `ViewSegmentedControl`.
**Files:** `mockups/a-status-board.html`, `b-exceptions-worklist.html`, `c-journey-pipeline.html`, `d-matrix-explorer.html`, `e-sites-operations.html`, `f-narrative-brief.html` (shared `dash.css`, `dash.js`); renders in `shots/<name>-1440x900.png` and `shots/<name>-full.png`.

---

## 1. Why the last round failed (diagnosis, not taste)

| Symptom in `before-dashboard-A.png` | Cause | Fix used in every concept here |
|---|---|---|
| Scope bar takes two rows (selects, then pseudo-chips) and every select is a 40 px field with a separate label | Form controls used as a toolbar | One row of 32 px controls (DS `SelectTrigger size="sm"`, `Button size="sm"`), label printed inside the trigger ("Term Fall 2026"), the way Snowflake and Shopify do it [D1, D2] |
| A 28 px hero sentence with a caption and an info button is the first thing read | The page opens with prose, so it reads as a report | Lead with figures or the list; any verdict is one 18 px line [D5, D6] |
| 30 px serif page title plus a purpose line | Home pattern | DS `PageHeader` type is 18 to 20 px semibold serif (`PAGE_TITLE_TYPE_CLASS`); no purpose line |
| Every concept had the same skeleton (scope bar, hero, KPIs, two charts, worklist) | Variants were skins of one model | Six different primary jobs, below |
| Blue and brown in charts, red nav badge | No colour contract | Neutral ramp for magnitude, one amber for shortfall, brand tint only for selection; nav count is the neutral badge |

The density budget in strategy 07 still applies. Section 4 counts each concept against it, including where a concept breaks it on purpose.

## 2. References (Mobbin, web, viewed 2026-10-26)

Toolbar height and control size are estimated from the 768 px wide previews, scaled to 1440. Treat them as approximate.

| # | Reference | Toolbar | Controls | First viewport | Borrow | Do not copy |
|---|---|---|---|---|---|---|
| D1 | [Snowflake, Performance explorer](https://mobbin.com/screens/9d47d927-7738-4af1-ae1e-a18166983c76) | one row, about 32 px | chips with label inside ("Warehouse All", "Role All"), range select | tabs, then 8 equal chart tiles in 4 x 2 | label inside the chip; small multiples grid (A) | blue, green and red series; onboarding banner |
| D2 | [Shopify, Analytics](https://mobbin.com/screens/35153b56-4d7f-4398-ae6b-2fefaba5d024) | one row, about 30 px | 3 small chips; "Last refreshed 9:07 PM" beside the title | 4 KPI cards with sparklines, widget grid | as-of next to scope; KPI with sparkline (A, E) | donut chart |
| D3 | [Shopify, conversion breakdown](https://mobbin.com/screens/3614343e-74a1-49b3-a559-0b15928ed191) | shared with D2 | none in card | stage columns with count and share, cohort table | stage columns for a pipeline (C) | saturated blue fill |
| D4 | [AirOps, Analytics](https://mobbin.com/screens/ef4f113f-b98a-49b6-a028-4b43d9de78df) | one row, about 32 px | grouped selects (Date, Region, Platforms), Filter | 3 KPI cards, chart with a per-card breakdown menu | grouped labelled scope; breakdown inside the card (split by) | large empty KPI cards |
| D5 | [Gumloop, Insights](https://mobbin.com/screens/9053b6d1-aadb-4f5d-b64d-9aca0ce2404b) | date picker plus refresh only | 2 | six bare figures without boxes, one chart, two breakdown tables | figures without card chrome (F); minimal toolbar | two unrelated chart colours |
| D6 | [Vercel, Analytics](https://mobbin.com/screens/f58e584d-9481-4125-961f-b08bde53529b) | 2 selects, top right, about 32 px | environment, range | figure tabs (Visitors, Page views, Bounce) that switch one chart; two top lists | figure as a tab that switches the body (B) | red delta chip |
| D7 | [Vercel, Usage](https://mobbin.com/screens/e828f30f-3564-432d-8a2f-33b3116dd465) | none | none | grouped rows, each with a sparkline and a value | sparkline per row (E) | one colour per row |
| D8 | [Vercel, Speed Insights](https://mobbin.com/screens/7ecc2280-d362-4eb8-9810-9fe1b8ce252e) | segmented control plus 2 selects | 3 | metric list left, selected metric right, bucket columns | master and detail (D detail panel) | red, amber, green verdicts |
| D9 | [Linear, Projects with health panel](https://mobbin.com/screens/fb06f720-0dcd-423f-bba9-83b54701bc4c) | icon buttons | 3 | project list plus a side summary (on track, update missing) | list with a side insight panel (B peek) | large blank area |
| D10 | [Stripe, Developers overview](https://mobbin.com/screens/fb030c6b-f6dd-4715-9f6f-45f0e354411f) | tabs only | per-card period select | 3-column widget board, "Updated today 09:35:27", calm all-clear card | updated time; calm empty state | per-card scope (we keep one scope) |
| D11 | [Klaviyo, Executive dashboard](https://mobbin.com/screens/5eeb662f-8a2a-4dfb-9346-0e81250d84d3) | one row, about 36 px | metric select, time period, "compared to previous period", "Last updated 1 minute ago" | chart card, funnel summary | compare-with stated in the toolbar | drag handles and add-card builder |
| D12 | [Quo, Busy times](https://mobbin.com/screens/c2a9cf1b-9b32-4ac4-89b5-b907c8f26146) | one select per card | 1 | one-hue heat grid with Less to More legend | single-hue scale and legend (D) | empty grid when data is thin |
| D13 | [Juicebox, search insights](https://mobbin.com/screens/858166de-5db1-4d89-ab4b-bd866f7aba08) | one row of chips at the very top | chips carry counts ("Python (1)"), More filters | figure tiles with P25, median, P75; distribution chart; ranked bars | distribution summary inside a figure; chips with counts (D facets) | gated blur, serif numbers |
| D14 | [Workable, review outcomes](https://mobbin.com/screens/a90f6805-b6e6-4d21-b15e-8c3258c48a9b) | one row, about 40 px | search, 3 selects, More filters, Download | distribution chart, then the people table it describes | chart directly above the people behind it (F, director) | paired green and hatched blue bars |
| D15 | [Snowflake, Trust Center](https://mobbin.com/screens/c04490cc-bbb7-432b-b656-ae5f279852d0) | tabs | 2 | "1 not ready" count plus "take action on the users below" | readiness count that leads to action (director) | red and blue rule lines |
| D16 | [Calendly, Routing funnel](https://mobbin.com/screens/e50d7744-9733-428b-b82d-b59928ed6298) | 2 selects, about 32 px | 2 | horizontal funnel with drop-off share between steps | drop-off between stages (C, director) | saturated blue |
| D17 | [Replit, Monitoring](https://mobbin.com/screens/f929df2e-7ee2-4f62-ab93-eb0ce891df7b) | one select per section | 1 | request histogram in duration buckets | age buckets as a histogram (A tile) | multi-colour lines |

Not found on Mobbin under the names searched: PostHog, Datadog, Grafana, Amplitude, Metabase, Mixpanel, Plausible, Retool, Notion, Intercom reports, Deel or 15Five people analytics, Vanta. The earlier round already cites Vanta (R25) and 15Five (R2, R37) in `../dashboards-and-layouts.md`. The patterns those products are known for (status board, funnel, heat map, people table) are covered by D1 to D17.

What every reference shares and the last round lacked: the toolbar is one quiet row; figures are 20 to 28 px and labels 12 to 13 px; the body is a grid of equal tiles or one dominant table; prose is a caption, never a lead.

## 3. Shared frame (identical in all six, so only the mental model differs)

```
UTILITY BAR 42      Clinical Education | Dashboard                     [Search] [AR]
PAGE HEADER 36      Dashboard (20 px serif)                  [Sample data] [Export]
TOOLBAR 32, 1 row   [Term Fall 2026 v][Cohort Any v][Course Any v][Filters 0 v]   [Compare with Expected now v] | As of Oct 26, 09:40 [r]
BODY                one of six concepts
```

| Toolbar rule | DS | Strategy 06 rule honoured |
|---|---|---|
| 32 px height, 13 px text, 8 px gap, one row | `SelectTrigger size="sm"`, `Button variant="outline" size="sm"`, icon button with `aria-label="Refresh figures"` | S1 scope bar, F1 as-of |
| Label inside the trigger ("Term Fall 2026"); no separate label row | `SelectTrigger` children | Recognition over recall (07 heuristic 6) |
| At most 4 scope selects; group, category, tag, location, setting under "Filters (n)" | `Popover` + `Command`, `FilterBar` chips only when something non-default is applied | S1, S4, 07 Hick (5 visible) |
| Compare with on the right, always visible | `SelectTrigger size="sm"` | B1 basis in the URL |
| As of text plus Refresh, no auto reflow | text + `Button` icon | F1, F2 |
| Cohort is a filter value, never lanes by default | as above | S2, ledger "cohort is a filter" |
| Page action: one Export, outline | `PageHeader actionItems` | 3.7 export, one page action |

Numbers used everywhere (sample, consistent across the six files): 123 students (38 / 43 / 42), 178 skills (162 configured, 16 not), 28 behind the term clock (19 in 2027, 8 in 2028, 1 in 2026; 19 of the 28 short in IV therapy), required achieved 49% (760 of 1,547 required skill records; expected now 58%, week 9 of 16), 252 requests waiting (101 / 63 / 57 / 31 by age, 31 at 15 days or more at 9 sites), 20 evaluations awaiting approval in 19 submissions (3 over 10 days), 14 unverified evaluators (3 hold requests over 8 days). Section gaps: IV therapy 35 points under expected, Oxygenation 17, Dressings 17, Medications 15, Emotional and cognitive 13, Teaching 6, others 5 or less or ahead.

---

## 4. The six admin concepts

Budget lines from strategy 07 (dashboard, 1440 x 900): regions 5, figures 4, charts 2, controls 8, prose 40 words. Controls and words were measured by script on the rendered page (`/tmp/dc-render/audit.cjs`, method in section 8); regions and figures counted by hand from the screenshot.

### A. Status board ("is anything off?")

Mental model: a monitoring wall. The coordinator glances, sees which tile moved, clicks that tile. Question: "Across everything I watch, what changed and where?" [D1, D2, D17]

```
| Dashboard                                          [Sample data] [Export] |
| [Term][Cohort][Course][Filters]          [Compare with] As of 09:40 [r]  |
| <>Behind 28 of 123 ~~ | Required 49% ~~ | Waiting 252 ~~ | Approval 20 ~~ |
| Where are the 28?     | Are we on pace?      | Which sections lag?        |
| <><><>...ooooo 2027   | burn-up vs expected  | IV therapy ------<> 35     |
| How old are requests? | Which sites stale?   | Is evidence still flowing? |
| [101][63][57][31]     | 4 sites, age stacks  | weekly counted bars        |
```

| Region | DS component |
|---|---|
| Figure strip | `KeyMetrics variant="flat" size="sm"` with `chart={{ kind: "sparkline" }}`, `href` per cell, `trendPolarity` set per metric |
| Six tiles | vendored `ChartCard` each; inside: `DotStrip` (cohort rows), `CumulativeLine` (burn-up), ranked dots (new, small), `StackedBar` (age, sites), bars (`ChartContainer`) |

Budget: regions **9 if each tile counts, 4 if the grid counts as one small-multiples region** (FAIL under the strict K1 reading); figures 4 (pass; tile numbers are labels, not headlines); charts **6 tiles plus 4 sparklines (FAIL, by design)**; controls 7 (pass); prose **76 words (FAIL**; most are tile subtitles and KPI captions; cutting subtitles brings it near 45).
Not on the page: no hero sentence, no worklist, no student names. Risks: it breaks the chart budget on purpose; a tile wall can become decorative if a tile's question is not acted on; six chart types to build. Strategy 06: scope in URL, compare-with, as-of, drill equals count (each tile title opens the list behind its mark).

### B. Exceptions first ("what needs action, and who?")

Mental model: an inbox. Five exception counts are tabs; the body is one ranked list with inline evidence and a peek panel. Question: "Who do I act on first, and why?" [D6, D9, Linear inbox model]

```
| [<>Students behind 28] [Stalled 15+ d 31] [Approvals >10 d 3] [Names to adopt 3] [Not configured 16] |
| [Search][Most short in v][Request v]   Furthest behind first.   | Amara Nwosu  Student record |
| Yuki Sato   2028  --<>---| -41  2 of 12  Safety 0 of 3  16 d      | Behind by 37 points          |
| Amara Nwosu 2027  --<>---| -37  3 of 14  IV 0 of 4  D. Pryor 34 d | IV [][][][]  0 of 4 ...      |
| ... 9 of 28, pagination                                          | Waiting and returned (3)     |
```

| Region | DS component |
|---|---|
| Exception tabs | `Tabs` + `TabsTrigger` + `TabsCountBadge` (counts are the only figures) |
| List | `DataTable` (`V2Grid`), custom cell for the gap (in-cell viz), `StatusBadge` for age, pagination |
| Peek | `FloatingSheetPanel` (exported, 0 adoption today) or a `Card` beside the table; `SegmentedDots` for sections |

Budget: regions 5 (pass); figures **5 (FAIL by one; drop "Skills not configured", which is viewer-centric per S06 D3, to pass)**; charts 0 (pass; in-cell viz); controls **16 (FAIL**: 7 toolbar + 5 tabs + search + 2 list filters + 2 pager buttons; reads as a list page, whose budget is 6); prose **65 (FAIL**, mostly the peek panel's timeline lines).
Not on the page: no charts of the population, no trend. Risks: it is close to a list page, so "does it look like a dashboard?" may get the same answer; the peek duplicates the student record; tabs of different kinds (students, requests, evaluators, skills) change the table's columns. Strategy 06: scope in URL, compare-with (drives the gap column), as-of, drill equals count by construction (the tab count equals the rows).

### C. Journey pipeline ("where are records stuck in the flow?")

Mental model: a pipeline. Every required skill record moves No evidence yet, Evidence none qualifies, In progress, Achieved (the four engine states; waiting is a hatched overlay, never a stage). Question: "Where does progress stall, overall and per section, and what moved this week?" [D3, D16]

```
| No evidence yet 412 27% > None qualifies 96 6% > In progress 279 18% > Achieved 760 49% |
|  [////      ]            [=]                     [/////====]             [##########]   |
|  12 left this week. 118 waiting     9 new        31 started              48 achieved    |
| Where does each section sit?                       Achieved  In progress  None q.  No ev. |
| Basic skills 246   [#########|####==..]            168 68%     40          8       30    |
| <> IV therapy 205  [###==..  |.........]            48 23%     40         22       95    |
```

| Region | DS component |
|---|---|
| Stage strip | `KeyMetrics variant="flat"` for the four figures plus a new stage-bar glyph (hand-roll on `ChartContainer`), "Movement" window as `SelectTrigger size="sm"` |
| Section rows | `StackedBar` per row (exists), `Table` primitives, tick for expected now |

Budget: regions 4 (pass); figures 4 (pass); charts 2 (pass; the script counts each stage bar, 4 svgs, as one chart region); controls 7 (pass); prose 35 (pass). The only concept that passes every line.
Not on the page: no student names, no sites, no approvals. Risks: the per-section rows are 100% stacked state bars, which a reviewer may read as progress bars (brief: no progress bars for attainment); the unit "required skill record" is abstract for a coordinator; the stage counts depend on OD-03 (whether "no evidence" and "none qualifies" merge). Strategy 06: scope in URL, as-of, drill equals count (stage and segment open the records list). Compare-with is replaced by "Movement, last 7 days"; the expected tick keeps the basis visible.

### D. Matrix explorer ("where exactly is the gap?")

Mental model: an analyst's pivot. Facets left, students by sections heat map centre, the selected cell's evidence right. Question: "For this group, which student and which section, and what is the evidence?" [D8, D12, D13; earlier R36 Profound]

```
| [Term][Course][Rows Students][Columns Sections][Sort Furthest behind]   As of [r] |
| Pace       |  28 students behind, by section     0% [][][][][] 100% | Amara Nwosu, IV therapy |
| [x]<>Behind 28 | Student      Basic Safety Meds IV   Oxy Elim      | 0 of 4. Expected 2      |
| [ ]On pace 95  | <> Yuki S.    1/5  0/3   -    -    0/2  1/2       | <> Start IV  D. Pryor 34d|
| Cohort ...     | <> Amara N.   1/4  1/3  1/3 [0/4]  -    -        | o Hangs PB Med  6 d     |
```

| Region | DS component |
|---|---|
| Facets | `Card` + `Checkbox` with counts (compose; the DS has no facet panel) |
| Matrix | `HeatGrid` (hand-rolled on DS `Table` primitives; the gate flags raw table use and needs the documented allowlist) |
| Detail | `Card` or `FloatingSheetPanel`, `StatusBadge` |
| Rows / Columns | `SelectTrigger size="sm"` (or `ViewSegmentedControl` when two options) |

Budget: regions 5 (pass); figures 0 (pass); charts 1 (pass); controls 7 above the matrix (pass), **17 counting the facet rail (FAIL** if facets count as above the first chart); prose **61 (FAIL**, mostly the detail panel).
Not on the page: no trend, no figures, no sites. Risks: an analyst tool, not a glance; 123 rows by 178 skills cannot render, so it must stay aggregated (sections or groups) and paginate rows; empty columns appear when the scope spans courses (handled here by hiding sections with no required skill, stated in a caption). It belongs more naturally in Attainment than on the landing page. Strategy 06: scope in URL, as-of, drill equals count (cell opens its students and skills). Compare-with appears only as the "expected" line in the detail panel.

### E. Sites and evaluators operations ("where is evidence stuck?")

Mental model: an operations board for the evidence supply chain. Question: "Which site or evaluator is holding the oldest requests, and is it getting worse?" [D7, D11, D17]

```
| Waiting 252 ~~ | Median wait 6 d ~~ | <>15+ days 31 ~~ | Unverified 14 ~~ |
| Where are requests stuck?  sites, oldest first          | Who holds the oldest?   |
| Site               Open  Age mix        Oldest  Signed 8 wk  | D. Pryor [Unverified] 34 d |
| Maple Ridge, 5 East   7  [######]       34 d   \___         | K. Vance, RN         29 d |
| Meadowbrook, Infusion 25 [..==##]       35 d   \__          | Jon Delgado [Unverified]  |
| Other 23 sites      130  62, 26, 39, 3   17 d                | ...                 All 180|
```

| Region | DS component |
|---|---|
| Figure strip | `KeyMetrics variant="flat" size="sm"` with sparklines, `trendPolarity="lower_is_better"` on waiting and age |
| Sites table | `DataTable`; age mix via `StackedBar` cell; sparkline cell (no DS cell: hand-roll on `ChartContainer`, or drop) |
| Evaluators | `Card` list, `StatusBadge` "Unverified" |

Budget: regions 5 (pass); figures 4 (pass); charts 0 plus in-cell viz (pass for a table column; the 4 KPI sparklines are the line to watch, as in the earlier audit); controls 6 (pass); prose **59 (FAIL**, mostly evaluator site lines).
Not on the page: no student attainment at all. Risks: it answers only one of the three admin questions; reminders are REQ section 14 (out of scope), so the only actions are reassign, adopt or open; it could double the Approvals Stalled tab. Strategy 06: scope in URL, as-of, drill equals count (Open opens that site's requests). Compare-with does not apply (no basis for waiting); trend comes from the sparklines.

### F. Narrative brief, tightened ("tell me the story in one line")

Mental model: the earlier recommended A, shrunk. Question: "Who is behind, why, and what needs me?" [D5 bare figures; earlier R4 Asana]

```
| <> 28 of 123 students are behind the term clock   | Required 49% | Waiting 252 | Approval 20 |
|    19 of them are short in IV therapy. View the 28 |              |             |             |
| Who is behind, and by how much? (beeswarm, gap axis) | Which sections lag? (ranked dots) |
| Needs you (4 rows, oldest first)                                                      |
```

| Region | DS component |
|---|---|
| Verdict band | `Card` + `KeyMetrics variant="compact"` for the 3 figures, link to the drill list |
| Two charts | vendored `ChartCard` + `DotStrip` (gap axis) + ranked dots |
| Needs you | `Card` rows with one link each |

Budget: regions **6 (FAIL by one**, Needs you still lands inside 900 px); figures 4 (pass); charts 2 (pass); controls 7 (pass); prose **55 (FAIL**).
Not on the page: no sparklines, no sites chart. Risks: it is still text-first in its top band, which is the original complaint; it is the least different from the round Romit rejected. Strategy 06: all four (scope in URL, compare-with named in the verdict, as-of, drill equals count).

### Comparison

| Concept | Mental model | Best for (persona, moment) | First viewport vs budget (regions / figures / charts / controls / words) | DS fit | Build cost | Main risk |
|---|---|---|---|---|---|---|
| A Status board | monitoring wall | coordinator, Monday glance; director skim | 9 or 4 / 4 / 6+4 sparks / 7 / 76 | High: `KeyMetrics` sparkline, `ChartCard`, existing viz | M | breaks the chart budget by design; tiles can turn decorative |
| B Exceptions first | inbox | coordinator, daily follow-up | 5 / 5 / 0 / 16 / 65 | High: `Tabs` + `TabsCountBadge`, `DataTable`, `FloatingSheetPanel` | M | reads as a list page, not a dashboard |
| C Journey pipeline | flow through states | program lead, weekly review; accreditation prep | 4 / 4 / 2 / 7 / 35 | Medium: stage glyph is new; `StackedBar` exists | M | stacked bars may read as progress bars; abstract unit |
| D Matrix explorer | pivot | analyst or director, investigation | 5 / 0 / 1 / 7 (17 with facets) / 61 | Low to medium: `HeatGrid` is a raw-table hand-roll, facets composed | L | an analysis tool; belongs in Attainment |
| E Sites operations | supply chain board | clinical coordinator, chasing evaluators | 5 / 4 / 0 + in-cell / 6 / 59 | High: `KeyMetrics`, `DataTable`, `StatusBadge` | S | answers one question of three |
| F Narrative brief | one-line story | first-time admin | 6 / 4 / 2 / 7 / 55 | High: everything exists | S | still text-first; closest to the rejected round |

## 5. Recommendation: build A, B and C in the lab next

1. **A, status board, as the default Dashboard.** It is the only concept that looks like a dashboard at first glance (Romit's first complaint), its figures are compact `KeyMetrics` with sparklines that the DS already ships, and each tile is one existing viz in a `ChartCard`. It needs one decision: allow small multiples as a budget exception (one region, up to 6 tiles of one size, each with a question title), or cut to 4 tiles.
2. **B, exceptions first, as the second variant.** It is a genuinely different job (act, not monitor), carries the strongest part of the earlier Home A (the worklist with names and causes), and makes drill equals count automatic. Trim it to 4 tabs to pass the figure line.
3. **C, journey pipeline, as the third variant.** It is the only concept that passes every budget line and it shows the engine's four states, which no other page shows at population scale.

Move D into Attainment as the Sections or Matrix view (it is the "report as launch page" idea without deciding OD-29). Fold E into A as the sites tile plus the Approvals Stalled tab. Keep F as the fallback if Romit prefers the narrative band.

### Reviewer (Approvals), in B's family

```
| Approvals                                                   [Sample data]         |
| [Term][Cohort][Course]                                     As of 09:40 [r]        |
| [Awaiting approval 19] [Waited over 10 days 3] [From unverified evaluators 5] [Answers disagree 1] |
| [] Student | Skills | Evaluator | Held because | Answers agree | Waiting |  peek: self vs evaluator |
| bulk bar on selection: Approve selected (blocked rows named first)                 |
```
Tabs with counts are the only figures (S06 5.3; ledger D-L3 keeps the row visible with an empty state). DS: `Tabs` + `TabsCountBadge`, `DataTable` with selection and bulk action, `FloatingSheetPanel` for the side-by-side answers [REQ AR-02].

### Director (readiness), in C's family

```
| Dashboard   [Cohort 2026, graduating x][Group][Course]          As of 09:40 [r] |
| Far behind 3 > One skill short 4 > Complete, request open 3 > Ready to verify 28 |
| What stops the 7?  Hangs PB Med | 4 students | 3 requests waiting               |
| Records by next step (DataTable grouped by the stage above)                      |
```
The cohort chip is preselected only here, because the director's question names the cohort (S06 5.4). Stages sum to 38 (dataset arcs 2 and 9). Verification stays on the student record (ledger Q3 open).

## 6. Questions for Romit

1. Can small multiples count as one region (status board A), or must the first viewport hold at most two charts? This decides whether A ships as drawn or with four tiles.
2. Which job should the Dashboard serve first: monitor (A), act (B), or flow (C)? The lab can carry all three as variants.
3. Is the pipeline unit "required skill record" understandable to coordinators, or should C count students (for example "students with every required skill achieved")?
4. Are 100% stacked state bars per section acceptable, or do they count as the progress bars the brief bans?
5. Should the matrix (D) become the first Attainment view?
6. Is the term clock (pace) confirmed? Every "behind" figure here still rests on it (S06 Q1).

## 7. What is deliberately absent from every concept

Greeting, onboarding or set-up cards; a second scope bar; per-card date pickers; red; blue or brown series; animated counters; reminders or nudges (REQ section 14); cohort lanes by default; requirement IDs or stakeholder names in copy.

## 8. Verification done and not done

Done:
- Rendered all six with Playwright Chromium 1440 x 900 viewport (own headless browser, closed after), screenshot and full page in `shots/`. Script `/tmp/dc-render/render.cjs` reports per page: `scrollWidth` 1440 on all six (no horizontal scroll), 0 text elements under 12 px, 0 overflowing cards after fixes, no "undefined", "NaN", em or en dash, or the banned generic noun (glossary section 5 rule 9) in rendered text.
- Looked at every screenshot and fixed: B table clipping its last column (dropped the redundant "Last evidence" column), C header row inheriting card header flex (renamed class), C stage pattern fills sharing one id, C bars overflowing, D column headers colliding (hid four sections with no required skills, captioned), E amber on every "Oldest" cell (now neutral, bold at 30 days or more), A and F section gaps disagreeing with C (aligned to C's counts), A stale-site list disagreeing with E (aligned), B "Most short in" disagreeing with D's cells (aligned).
- Measured controls and prose words above the fold by script (`/tmp/dc-render/audit.cjs`): words exclude headings, controls, table cells, links, legends and figure values; controls count `button`, select triggers, tabs and checkboxes. Results are in section 4. The word count still includes card subtitles and KPI captions, so it is stricter than a reading that treats those as labels.

Not done:
- No axe or contrast check; the proposed viz tokens (`--viz-*`) are unvalidated.
- No 1024 or 375 renders; no dark theme.
- No `ds-conformance-reviewer`, `state-review` or `verification-reviewer` run (no app code, so no runtime GREENLIGHT is claimed; this is GREENLIGHT (static) at most, for mockups only).
- No requirements-auditor pass on the claims here.
- `node tools/ds/source.mjs` reports `@exxatdesignux/ui@1.5.1` installed in this worktree while `ds-usage-map.md` says 1.6.5; tokens were read from the installed `src/globals.css`. Confirm which version the lab builds against before using `KeyMetrics chart` or `FloatingSheetPanel`.
- Section-level numbers (per-section records and gaps), weekly series and site rows are invented to be internally consistent with the totals above; they are not produced by the seed generator.
