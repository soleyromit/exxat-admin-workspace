# Viz Selection Rubric — v2

> Required reading before designing any analytics card, dashboard, or report screen.
> DESIGN.md rules **VIZ-001..011** bind here. Progress bars are last resort (VIZ-001).
>
> **What changed in v2 (2026-07-16):** v1 only mapped *question → form*. The results-page
> redesign (PR #46) passed every v1 check and still shipped unreadable micro-viz — dots whose
> diameter exceeded the differences they encoded. v2 adds the missing layers: **a
> not-a-chart gate, a perceivable-difference test, container-fit ladders, and a 7-point
> glance test**. A form is only "correct" when it passes ALL gates, in order.

---

## Gate 0 — Is it even a chart?

The most common viz mistake is charting a fact that a number states better.

| The data is… | Use | Never |
|---|---|---|
| One current value (± trend) | **Stat: number + signed delta chip** (`4.65` `↑ 0.25 vs Sp25`) | a mini chart squeezed into the slot |
| A handful of headline numbers | **KPI row** (KeyMetrics, max 4) | grouped bars |
| One value vs one benchmark, in a **list row** | **number + delta chip** (`+0.4 vs prog`) | dot-on-track (see PD test below) |
| A ratio against a limit, in-flight 0→100% | progress bar (**only** here) | — |
| >7 categories that all carry meaning | **table** (or table + chart) | more colors |

**The redundancy rule (Aarti A4):** *"You either need the chart or you need those numbers.
You don't need both."* Every fact gets ONE primary encoding. In slots < 200px wide the
number is primary and at most one mark may support it; in sections ≥ 600px the chart is
primary and prints one number per row, at the mark.

## Gate 1 — Question fit (v1, kept)

Match the user's question. If it matches none, ask Romit before generating.

| # | Question | Right forms | Wrong |
|---|---|---|---|
| 1 | Where does X stand vs target/cohort? | bullet (wide slots only) · dot-on-distribution · slope | progress bar |
| 2 | Who is an outlier across N entities? | strip plot (N>30) · Cleveland dot (N≤30) · scatter | sorted bar list |
| 3 | Gaps across two dimensions? | heatmap · small multiples | grid of progress bars |
| 4 | How is X changing over time? | line · sparkline (≥ 96px) · slope (2 points) · cumulative area | % delta arrow alone |
| 5 | Cohort A vs cohort B? | paired slope · distribution overlay · grouped bar (N≤10) | two big numbers |
| 6 | Ordered-scale share (Likert/sentiment)? | 100% stacked bar (favorable-share story) · diverging stacked (neutral-midpoint story) | pie/donut |

## Gate 2 — Perceivable-Difference test (PD test) — **new, hard gate**

Position/length encodings are only honest when the smallest difference the user must
**act on** is bigger than both the rendering noise and the mark itself.

```
px-per-unit   = track-width-px / domain-span
Δpx           = actionable-difference × px-per-unit

PASS requires: Δpx ≥ 8   AND   Δpx ≥ mark-diameter
```

Worked example (the PR #46 failure): list-card track 112px on a 3–5 window →
px-per-unit = 56. Actionable difference 0.1 → **Δpx = 5.6px**, drawn with **10px dots**.
The mark is bigger than the difference. FAIL → fall back to Gate 0 (number + delta chip).

Remedies, in order: (1) widen the track; (2) zoom the domain — **only with a visible,
labeled axis**; (3) abandon position encoding for this slot — print the number.
A zoomed domain without a printed axis is a lie; a zoomed domain that still fails the
PD test is a lie *and* unreadable.

## Gate 3 — Container fit ladder — **new**

The same fact degrades as its container shrinks. Never render a section-scale form in a
row-scale slot.

| Slot | Width | Allowed forms |
|---|---|---|
| Table cell / list-row slot | < 200px | number + delta chip · status dot · sparkline ≥ 96px with endpoint labels — **max ONE mark** |
| Card | 200–600px | stat + slope/spark with direct endpoint labels · single mini bar/meter |
| Section | ≥ 600px | full charts: dot plots, Likert bars, heatmaps, lines — with axis + direct labels |
| Page | full-width | anything above + small multiples |

**Legend-adjacency rule:** if decoding requires information outside the visual unit the
eye is on (a legend at the top of a list, a subtitle two cards away), the form fails the
slot. Row-scale marks must be self-evident or labeled in place.

## Gate 4 — Perceptual ranking (Cleveland–McGill)

When several forms survive Gates 0–3, prefer the highest-ranked encoding the container
allows: **position on a common scale > length > slope/angle > area > color value**.
Color is never the primary encoding (A11Y-008) and never the only one.

## Gate 5 — The glance test — **new, run on the rendered screenshot, not the JSX**

Screenshot the real render at real size. All seven must pass:

1. **5-second takeaway** — a first-time viewer states the main point unprompted.
2. **Marks ≥ 12px** in their smallest dimension (dots ≥ 12px Ø; bars ≥ 8px thick; a
   ring-vs-filled distinction needs ≥ 12px to read at all).
3. **Labels in place** — the value a mark encodes is printed at the mark or one saccade
   away; never in a far column the eye must round-trip to.
4. **Differences visible** — the two closest marks the user must distinguish are ≥ 8px
   apart (the PD test, verified on pixels).
5. **≤ 2 encodings to learn** per surface; the whole page teaches ONE comparison
   vocabulary, not four.
6. **No hover required** — hover enriches (counts, breakdowns); the takeaway must not
   live only in a tooltip.
7. **Solid marks** — no opacity-stepped series (a 0.45-alpha segment reads as empty
   track); use distinct solid steps of one hue.

Any failure → back to Gate 3 and degrade the form. **"Chart renders" ≠ "chart reads."**

---

## Worked audit — PR #46 results viz scored under v2

Honesty check: the v1 rubric approved all of these. v2 verdicts:

| Component | Gate it fails | v2 verdict |
|---|---|---|
| `BulletScore` (list card, 112px track, 10px dots) | PD test (Δpx 5.6 < mark 10) · legend-adjacency | **Replace**: `4.65/5` + `+0.4 vs prog` delta chip |
| `TrendSpark` (64px sparkline) | Gate 5.2 min size · Gate 3 (< 96px) | **Replace**: `↑ 0.25 vs Sp25` chip, or widen to ≥ 96px with endpoint labels |
| `CompareDots` (15rem col, you/median/prog) | PD test · Gate 5.5 (4th vocabulary) | **Replace**: printed `you 3.7 · prog 3.7` + one signed-gap chip |
| Theme dot plot (~600px track) | Gate 5.2 (10px ring vs dot) · Gate 5.3 (numbers far right) | **Keep form, fix render**: ≥ 12px marks, values printed at the marks, gap chip inline |
| `ScoreCard` slope (208px, 2 points) | passes PD (Δpx ≈ 9/0.1) | **Keep**: add endpoint value labels on the SVG |
| `LikertBar` (0.45-alpha segments) | Gate 5.7 solid marks · Gate 5.6 (counts hover-only is OK, but favorable split must read) | **Keep form, fix render**: two-tone solid split (favorable vs not) or 5 solid steps |
| AI-verdict-first ordering, gap-sorted rows, collapsed-header previews | — | **Keep** — narrative layer passed |

## Color discipline (binds VIZ-003/004 — unchanged)

- Series colors: `--chart-1..5` via tokens only; score/rating viz **never red** — amber
  (`--chip-4`/`--chart-4`) for below-threshold (Aarti).
- Brand color is never a data color (CTAs only).
- Color never the sole encoding — pair with position, shape, or label.

## Annotation discipline (VIZ-002 — unchanged)

- Targets/benchmarks/bands drawn ON the chart; outliers highlighted on the viz.
- Text under a chart labels values; interpretation belongs to the narrative line
  (AI insight / trend sentence), which leads the surface.

## Anti-patterns (block list — v2 additions marked ●)

- More than one progress bar in a card → heatmap or strip plot.
- Pie/donut ≥ 4 slices · 3D · dual-axis · gradients/shadows → never.
- `% complete` as a bare width-div → bullet (wide slots) or number + chip.
- ● **Micro-dot-on-track in row slots** — any position encoding that fails the PD test.
- ● **Zoomed domain without a visible labeled axis.**
- ● **Opacity-stepped series** (alpha < 1 as a scale step).
- ● **Legend outside the visual unit** for row-scale marks.
- ● **Sparklines < 96px** or without endpoint labels.
- ● **Two encodings for one fact at equal weight** (bar + repeated number columns).

## Pattern catalogue (this folder — unchanged)

`bullet-vs-target.md` · `outlier-strip-plot.md` · `cleveland-dot.md` · `slope-paired.md` ·
`gap-heatmap.md` · `small-multiples.md` · `calendar-heatmap.md` · `progression-sankey.md` ·
`ai-vs-pulled-lane.md`

---

## The v2 decision flow

```
0. Would a number + delta chip state it better?      → yes: stop, no chart
1. Which of the six questions is being asked?        → candidate forms
2. PD test: Δpx ≥ 8 AND ≥ mark size?                 → no: widen / zoom-with-axis / demote to number
3. Container ladder: is the form allowed in the slot? → no: degrade one rung
4. Pick the highest Cleveland–McGill encoding left
5. Render → screenshot → 7-point glance test          → any fail: back to 3
```
