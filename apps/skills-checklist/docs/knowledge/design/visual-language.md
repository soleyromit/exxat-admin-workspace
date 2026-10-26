# Lab visual language: palette, encodings, density, and what changed (2026-10-26)

**Why:** Romit on the lab dashboard: the Home mockups were "visually pleasing"; the lab page had no proper colour, indicators or viz, used "a very strong colour", and was "extremely crowded" and "doesn't look like a dashboard" [ROMIT 10-26]. This file is the palette and encoding standard for every lab screen, the measured result, and the DS gaps to raise.
**Read with:** `../strategy/07-ux-laws-and-density.md` (budget, laws), `../strategy/06-dashboard-patterns.md`, `dashboards-and-layouts.md` (Mobbin R1 to R16), `../00-design-brief.md` section 8 (amber not red, glyph plus word).
**Code:** palette `admin/components/lab/viz-tokens.css` (imported by `admin/app/(lab)/lab/layout.tsx`), values for SVG `admin/components/lab/viz.tsx`, density audit `admin/tests/lab/density-budget.mjs`.
**Shots:** `lab-shots/before-*.png` and `lab-shots/after-*.png` (1440 wide; `after-fold-*` is the first 1440 x 900 viewport).

## 1. The palette (one palette, DS tokens only)

No hex, no raw oklch, no `color-mix` in lab code: every lab viz colour is a `var()` of an `@exxatdesignux/ui` token (theme-prism, light). Hex below is the token converted for the validator only.

| Lab token | DS token | Hex (light) | Job | Contrast on card |
|---|---|---|---|---|
| `--lab-viz-on` | `--border-control-3` | #8e9095 | On track / counted mark (circle), ranked dots | 3.19:1 |
| `--lab-viz-behind` | `--chart-5` | #ba6000 | Behind / short mark (diamond), largest-gap outline, oldest-age outline | 4.41:1 |
| `--lab-viz-behind-edge` | `--status-badge-warning-fg` | #633807 | Bracket under the behind cluster | 10:1 |
| `--lab-viz-behind-wash` | `--status-badge-warning-fill` | #faeeda | Hero icon tile surface | n/a (surface) |
| `--lab-viz-behind-ink` | `--status-badge-warning-fg` | #633807 | Icon and label on the wash, triangle glyph, "28 behind" | 8.72:1 on wash |
| `--lab-viz-zero` | `--foreground` | #0a0a0a | Expected-now line (1 px, dashed 3/3) | 19:1 |
| `--lab-viz-grid`, `--lab-viz-track` | `--border` | #e4e4e6 | Baselines, empty tracks, cell hairline | decorative |
| `--lab-viz-tick` | `--muted-foreground` | #454750 | Tick labels | 9.25:1 |
| `--lab-viz-seq-1..4` | `--background`, `--brand-tint`, `--brand-tint-subtle`, `--sidebar-border` | #ffffff, #fdf1f8, #fbe7f0, #f8d9e8 | Heat cells (share counted: under 50, 50 to 69, 70 to 89, 90+) | text on darkest step: foreground 15.16:1, muted 7.08:1 |
| `--lab-viz-age-1..4` | `--border`, `--border-control`, `--border-control-3`, `--muted-foreground` | #e4e4e6, #d0d1d4, #8e9095, #454750 | Request age bands 0 to 3, 4 to 7, 8 to 14, 15+ days | step 4: 9.25:1 |
| `--lab-viz-age-4-edge` | `--chart-5` | #ba6000 | 1.5 px amber outline on the 15+ band only | 4.41:1 |

Rules the palette enforces: neutral for on track and counted; amber only for behind or short; brand only on the selected nav and the heat ramp (pale, chroma under 0.04); never red for shortfall; state = glyph + word + colour (circle "On track", diamond "Behind the term clock", triangle "8 or more points under").

**Why `--chart-5`, not the warning foreground, for the amber mark.** Before, behind diamonds were filled with `--status-badge-warning-fg` (#633807): a text colour used as a fill, which reads dark brown, and it sat next to `--chart-1` blue dots. The validator confirms the old pair failed the lightness band and chroma floor (brown L 0.386, C 0.084). `--chart-4` (#c18200) was tried first and failed the normal-vision floor against the grey dot (dE 14.6, under 15). `--chart-5` passes it (dE 16.5) with 4.41:1 contrast. The DS itself pairs `--chart-4/5` with warning (`--insight-severity-warning-*`, `--conditional-rule-orange`), so this is the DS's own amber family.

### 1.1 Validator output (dataviz skill, `scripts/validate_palette.js`, run 2026-10-26)

```
Categorical pair, light, on card #ffffff: on track #8e9095 (border-control-3) + behind #ba6000 (chart-5)
  Lightness band   PASS  all 2 inside L 0.43-0.77
  Chroma floor     FAIL  #8e9095 C 0.008 (by design: the on-track mark is the neutral; identity is carried by hue on one side only, plus shape)
  CVD separation   PASS  worst adjacent dE 14.3 (deutan), tritan 18.1
  Normal-vision    PASS  dE 16.5
  Contrast         PASS  both >= 3:1
Rejected: #8e9095 + chart-4 #c18200   Normal-vision FAIL dE 14.6 (under 15)
Before:   chart-1 #2b62ef + warning-fg #633807   Lightness band FAIL (0.386), Chroma floor FAIL (0.084)
Dark (theme-prism dark card #22181e): border-control-3 #c3c3c9 + chart-5 #f49500
  CVD PASS dE 17.4, Normal-vision PASS dE 18.6, Contrast PASS; Lightness band FAIL (0.819, 0.751: the DS dark steps sit above the band). The lab is light only today; re-check if dark ships.
Aging ramp (ordinal): monotone PASS; adjacent dL FAIL by 0.001 (border to border-control 0.059); light-end contrast 1.27:1 FAIL; single hue PASS.
Heat ramp (ordinal): monotone PASS; adjacent dL FAIL (0.023 to 0.031); light end is white (1:1); hue spread FAIL only because white has no hue.
```

**What the ordinal FAILs mean and the relief we ship.** The DS has no darker brand-tint steps, so a tint ramp cannot clear dL 0.06 on 4 steps. The skill allows a sub-threshold ramp only with a relief channel; ours: every heat cell prints its value and its basis, the short cells carry a triangle, the 3 largest gaps carry the amber outline, and the chart has a legend and a text summary. Every aging bar has a 2 px surface gap between segments, a legend, an `aria-label` with all four counts, and a table fallback. Asking the DS for a 5-step brand ramp is in section 6.

## 2. Encoding table

| Question | Form | Marks and colours | Status cue (never colour alone) | Fallback |
|---|---|---|---|---|
| How many are behind? (hero) | Hero metric: 36 px number in `font-heading`, "of 123 students are behind the term clock" in muted 16 px | Amber icon tile (warning wash and ink) | Word in the sentence; basis in a Tip on the number | Sentence is the h2 |
| Supporting figures | DS `KeyMetrics` flat, 3 cells | Achieved: sparkline (8 weekly points from dated evaluations, ends on the figure). Waiting and approval: 4 age bars (sum = the figure). Tone `info` = `--primary`, neutral | n/a | Cell links to the drill list; chart tooltip labels |
| Who is behind, by how much? | Gap-axis dot strip (binned, packed) | Grey circles on track, amber diamonds behind, 1 px dashed zero line "On pace" | Legend words, bracket "28 behind", readout per student | Show as table |
| Which skill blocks the most? | Ranked dot plot, one row per distinct value, visible scale 0 to the flagged count | Grey stem and dot; amber diamond only on the top value | Ties stated: "17 skills tie at 17 of the 28 students flagged"; legend "Blocks the most" | See all 31 (table) |
| Where are requests stuck? | Graded neutral stacked bars per site, width = total | 4 neutrals; the 15+ band also amber-outlined | Legend, `aria-label` with counts | Show as table |
| Where is the scope short? (B) | Section x scope heat table | Pale brand ramp; 3 largest gaps amber-outlined | Triangle on every cell 8+ points under; printed % and basis | The table is the data |
| Library state | DS `StatusBadge` | Not configured amber; Configured, Published, Inactive neutral | Glyph + word per state | n/a |
| Skill-record state (rule impact, configure) | DS `StatusBadge` | Achieved success (counted); In progress and No evidence neutral; Evidence does not qualify amber | Glyph + word | Table |

## 3. What changed and why (dashboard A, B, C)

| Before (seen in `before-dashboard-*.png`) | After (`after-*.png`) | Why |
|---|---|---|
| On-track dots saturated blue (`--chart-1`), behind diamonds dark brown (warning text token as fill) | Grey circles (`--border-control-3`), amber diamonds (`--chart-5`) | One colour one meaning; the brown was a text token; validator above |
| Aging bars: light grey, dark grey, blue, brown | Graded neutrals, amber outline on 15+ only | Blue meant "on track" in the strip and "8 to 14 days" here (similarity) |
| Approvals nav count: red destructive chip | Neutral dark chip (badge passed as a string, so the DS renders its default Badge) | Amber-not-red; red is for hard blocks. DS gap, section 6 |
| Variant bar: tinted band, 14 px text on two lines | Background surface, 12 px truncated question, 6 px padding, `data-lab-chrome` | Lab chrome must recede |
| Scope bar: 6 controls with "Label: value", two rows with fake chips ("Fall 2026", "All active students") | One row of 32 px controls, value only ("All cohorts"), Group inside More filters, chips row only when a filter is applied, secondary (filled, borderless) chips | Hick, Jakob, no false targets |
| Hero: 28 px sentence, tiny tile, 48 diamonds, caption repeating the Tip | Compact verdict band: 36 px number + muted claim, one cause line, small outline "View the 28", 3 KPI cells with mini charts on the right, in one card | Figure-first; the band replaces hero + KPI strip (07 A1, A2, A3) |
| KPI strip: 4 plain numbers, no trend | 3 numbers with DS sparkline or age bars; "Skills configured" moved to Needs you | 4 figures max; show movement |
| Blocker list: 8 identical "17 of 42" rows, tiny brown lines, no scale | Ranked dot plot with ticks, ties collapsed to one row ("17 skills tie"), top value alone amber, See all 31 | Von Restorff; Miller (top 5) |
| Chart description repeated the hero count; sites summary repeated the KPI | Descriptions say only what the chart encodes or a new fact | Say it once |
| Cards stretched to the taller neighbour | `items-start`, `gap-6` between regions | Common region, no dead block |
| B: one-column matrix with an inner scroll, 7 of 9 cells outlined, behind rail duplicating the hero | Heat ramp, all 17 rows on the page, 3 largest gaps outlined, rail removed, Needs you beside, KPIs in the band | Von Restorff, say it once |
| C: question rail narrower than its column (150 px gap), "What is not set up?" tab, hero repeating tab 1 | 4 question tiles as a figure strip across the top, panel below with Needs you beside it, hero removed, set-up tab dropped | Dead space, viewer-centric question (07 C1 to C3) |

Other lab screens (section 5): library status tones neutralised except Not configured, KPI cards flattened to a 3-figure hairline strip (the banner owns "16 not configured"), import confidence neutral except "look", configure "In use" pill neutral, rule-impact "In progress" neutral, drill list drops the Status column when every row carries the same flag, configure demo bar marked as lab chrome.

## 4. UX laws review (each law mapped to a concrete change on the dashboard)

| Law | Change | Evidence |
|---|---|---|
| Hick's law | Toolbar shows 4 scope controls (Term, Cohort, Course, More filters) plus Compare; Group, Category, Tag, Location, Setting live in More filters | `scope-bar.tsx`; audit: 7 controls above the first chart (was 10) |
| Miller's law | Supporting figures 3 (+ hero = 4); blocker chart 5 rows by value with "See all 31"; Needs you max 5 | `cards.tsx` Kpis, BlockerCard |
| Proximity | Number and its claim 8 px apart; inside cards `gap-2`/`gap-3`; between regions `gap-6` (24 px) | `after-fold-dashboard-A.png` |
| Common region | Hero, cause, action and the 3 figures are one card; each chart answers one question; no card in a card | verdict band |
| Similarity | One glyph per state on every chart: grey circle = on track, amber diamond = behind | `viz.tsx` DotGlyph, DiamondGlyph |
| Progressive disclosure | Tables behind "Show as table"; basis formula in a Tip on the hero number; sites and Needs you below the fold in A; secondary filters in More filters | 2 levels max |
| Fitts's law | "View the 28" sits directly under the verdict it acts on; every figure and chart row is a link to its drill list | verdict band |
| Serial position | Verdict first (top-left), act-on region (Needs you) last | layout A, B |
| Von Restorff | The amber accent marks only behind students, the top blocker value, the 3 largest gaps, the 15+ age band; ties are stated in words | audit: 1 saturated hue above the fold |
| Jakob's law | Monitoring layout from the cited references: scope top with as-of at the right (Vercel R5, Square/AirOps in 06), hero sentence above counts (Asana R4), denominator under every number (Deputy R3), status rows with a figure and a link (15Five R2) | `dashboards-and-layouts.md` R1 to R5 |
| Aesthetic-usability and white space | 24 px region rhythm, compact 32 px controls, one accent; no shrink of type below the DS 12/14 px | shots |
| Doherty threshold | `LoadingShape` skeletons render immediately per card; scope changes recompute in memory (KPI history adds 7 populationRows passes; `tests/lab/dashboard.test.ts` runs the whole model in about 250 ms for 123 students) | `cards.tsx` LoadingShape |
| Postel's law | Scope from the URL is parsed leniently (`parseScope`): an unknown basis falls back to Expected now, a group without a cohort is dropped; an impossible combination is explained with "Remove" buttons rather than shown empty | `lib/lab/scope.ts`, `frame.tsx` (unchanged in this pass) |
| Tesler's law | The system picks the default scope (current term, all cohorts) and the basis; the engine computes "behind" and ties; the person reads one sentence | `lib/lab/dashboard.ts` |

### 4.1 Density budget, measured (1440 x 900, `node tests/lab/density-budget.mjs`)

Before numbers are the manual counts in `../strategy/07-ux-laws-and-density.md` section 4 (taken from the same `before-dashboard-*.png` shots; the script did not exist yet). After numbers are the script output pasted below.

| Line (budget) | A before | A after | B before | B after | C before | C after |
|---|---|---|---|---|---|---|
| Regions (5) | 6 | 5 | 6 | 5 | 5 | 5 |
| Headline figures (4) | 5 | 4 | 3 + 2 heroes | 4 | 6 | 4 |
| Charts above fold (2) | 2 + glyph row | 2 | 1 | 1 | 1 | 1 |
| Controls above first chart (8) | 10 | 7 | 11 | 7 | 13 | **11 (over)** |
| Prose words (40) | about 60 | 36 | about 45 | 17 | about 40 | 11 |
| Saturated hues (2) | 4 (blue, brown, red badge, pink band) | 1 (amber) | 2 + red | 0 above fold | 2 + red | 1 |
| Repeated sentences (0) | 4 | 0 | 2 | 0 | 1 | 0 |
| Primary actions (1) | 0 | 0 | 0 | 0 | 0 | 0 |

```
PASS Dashboard A  regions 5/5 [scope, verdict, who-behind, blockers, page-header]; figures 4/4; charts 2/2; primary 0/1
  controls above first chart 7/8, disabled 0 [Export | Term | Cohort | Course | More filters | Compare with | Refresh figures]
  prose words 36/40; saturated hues 1/2 [80]; repeated sentences 0
PASS Dashboard B  regions 5/5 [scope, verdict, matrix, needs-you, page-header]; figures 4/4; charts 1/2; primary 0/1
  controls 7/8, disabled 0; prose words 17/40; saturated hues 0/2; repeated sentences 0
FAIL Dashboard C  regions 5/5 [scope, questions, who-behind, needs-you, page-header]; figures 4/4; charts 1/2; primary 0/1
  controls above first chart 11/8 OVER [the 7 toolbar controls + the 4 question tabs]
  prose words 11/40; saturated hues 1/2 [80]; repeated sentences 0
```

C is over on controls by design: its 4 question tiles are tabs (the variant's whole idea). Options for Romit: accept C's exception, or render the tiles as DS `KeyMetrics` cells that link to `?q=` (they would stop being tab controls but lose `aria-selected`). Not decided here.

Measurement rules (in the script header): shell, utility bar and `[data-lab-chrome]` excluded; a region counts when it shows whole or at least 80 px of it shows (a thinner sliver of the next card is a scroll cue); prose excludes headings, buttons, links, figures, the scope bar, SVG, legends, ranked data rows and axis titles marked `data-viz-label` (strategy/07 K4: "words that are not data, labels or buttons"); hues = OKLCH chroma over 0.06, bucketed to 20 degrees.

## 5. Other lab screens checked (before and after shots)

| Screen | What I saw | Change |
|---|---|---|
| Skills library A, B, C | Green, blue and amber status pills on every row (3 state hues); 4 boxed KPI cards plus a banner both saying "16 not configured" | Only Not configured is amber; KPI strip flat with 3 figures; banner keeps the one "16 not configured" |
| Add skill A, B | Sheet over the library; inherits the library change | none beyond the library |
| Import A, B | Calm; confidence badges used green, blue and amber | Only "look" is amber |
| Starting points | Calm, neutral | none |
| Configure A, B, C | Green "In use" pill; demo controls styled like page content; selected model tile uses brand tint (DS convention for selection, kept) | "In use" neutral; demo bar is `data-lab-chrome` |
| Rule change impact | Achieved green, In progress blue, Evidence does not qualify amber | In progress neutral; Achieved keeps success (counted is the one positive state the brief allows) |
| Dashboard drill | A column of 28 identical amber badges under a "Behind the term clock" chip | Status column hidden when every row carries the filtered flag |

## 6. DS gaps to raise with the DS team

1. **Sidebar nav count badge is destructive red** for any numeric badge (`app-sidebar.tsx` `NavItemBadgeContent`, collapsed dot `bg-destructive`). A count of work waiting is not an error. Ask for a `badgeTone` (neutral, attention) on nav items. Lab workaround: pass the count as a string so the DS renders its default Badge; side effect: the accessible suffix becomes "19" instead of "19 items" (which the product vocabulary bans anyway).
2. **No darker brand-tint steps** for a sequential ramp: `--brand-tint-light` to `--sidebar-border` spans only L 0.983 to 0.915, so a 4-step ramp cannot reach the dL 0.06 the dataviz method asks for. Ask for a 5-step `--chart-seq-*` ramp per theme.
3. **No neutral tone for KPI mini charts.** `MetricChart.tone` offers brand, success, warning, danger, info, auto; `info` maps to `--primary` (near black), which makes 4-bar charts heavy. Ask for `neutral` (`--muted-foreground`).
4. **No named viz tokens for "on track" and "behind"**: products reach for `--chart-1` (saturated blue) or the warning text colour. Ask for `--viz-neutral` and `--viz-attention` with a validated pair.
5. **Dark-mode amber**: `--chart-5` dark (0.75) and `--border-control-3` dark (0.82) sit above the validator's dark band; check before dark ships.

## 7. Not verified, and open

- Dark mode not rendered. Mobile widths (1024, 375) not checked. axe not run in this pass (the `aria-hidden={false}` SVG flagged by conformance was removed, the DS-used panel now has a stable `aria-controls` id, the lab breadcrumb is named "Lab location").
- Mobbin: the R1 to R16 references were used as cited in `dashboards-and-layouts.md`; I did not re-open them in Mobbin in this pass.
- The hero number now uses `font-heading` (the conformance item); strategy/07 says only the page title is serif. If Romit wants the hero sans, drop `font-heading` in `HeroMetric`.
- KPI "Waiting with evaluators" has no weekly line: the records do not date every past request, so a line would mislead; age bars are shown instead.
