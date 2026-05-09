# Viz Selection Rubric

> Required reading before designing any analytics card, dashboard, or report screen.
> DESIGN.md rule **VIZ-005** binds here.
> Default to richer viz; **progress bars are last resort (VIZ-001)**.

---

## The five questions

Match the user's question to the right viz. If your question matches none, ask Romit before generating.

### 1. "Where does X stand vs target / cohort?"

| Right viz | Why | Pattern file |
|---|---|---|
| Bullet chart | Actual + target + qualitative ranges in one read | `bullet-vs-target.md` |
| Dot-on-distribution | Where one entity sits in the cohort distribution | (P3) `strip-with-marker.md` |
| Slope (single line) | Before/after for one entity | (P3) `slope-single.md` |

❌ **Wrong:** Progress bar. Hides cohort, hides target, hides trajectory.

### 2. "Who is an outlier across N entities?"

| Right viz | Why | Pattern file |
|---|---|---|
| Strip plot / dot plot | Every entity = a dot; outliers visually obvious | `outlier-strip-plot.md` |
| Scatter (2 vars) | Quadrants surface high-low / low-high outliers | (P3) `scatter-quadrants.md` |
| Box / violin plot | Distribution + outliers above/below whiskers | (P3) `box-distribution.md` |

❌ **Wrong:** Sorted bar list. Works for ranking but buries the gap if there's a true outlier.

### 3. "Where are the gaps across two dimensions (students × competencies, sites × KPIs)?"

| Right viz | Why | Pattern file |
|---|---|---|
| Heatmap | Two-dimensional density readable at a glance | `gap-heatmap.md` |
| Small multiples | Repeated chart per row, axes aligned | (P3) `small-multiples.md` |

❌ **Wrong:** Grid of progress bars. Eye cannot integrate dozens of independent bars into a pattern.

### 4. "How is X changing over time?"

| Right viz | Why | Pattern file |
|---|---|---|
| Line | Standard trajectory | (P3) `line-trajectory.md` |
| Sparkline (inline) | Per-row trend in a table | (P3) `sparkline-table.md` |
| Slope (multi) | Before/after across many entities | (P3) `slope-multi.md` |
| Cumulative area | Stock-like accumulation | (P3) `cumulative-area.md` |

❌ **Wrong:** Single % delta with arrow. Hides the path; a drop-and-recovery looks identical to flat.

### 5. "How does cohort A compare to cohort B?"

| Right viz | Why | Pattern file |
|---|---|---|
| Slope (paired) | Direct A→B comparison per entity | (P3) `slope-pair.md` |
| Distribution overlay | Two density curves on the same axis | (P3) `distribution-overlay.md` |
| Grouped bar | When N is small (≤10) and entities are named | (P3) `grouped-bar.md` |

❌ **Wrong:** Two big numbers side by side. No distribution, no overlap, no narrative.

---

## Quick decision flow

```
What's the question?
├─ Single value vs target?       → bullet
├─ Many values, find outlier?    → strip plot / scatter
├─ Two-dim density / gaps?       → heatmap
├─ Trajectory over time?         → line / sparkline / slope
├─ Cohort comparison?            → slope-pair / distribution overlay
├─ Composition (parts of whole)? → stacked bar / waffle (NEVER pie/donut for ≥4 slices)
├─ Single in-flight task 0–100%? → progress bar (only here)
└─ None of the above?            → ask before generating
```

---

## Color discipline (binds VIZ-003, VIZ-004)

- Series colors: `--chart-1` … `--chart-5`. Never raw hex / Tailwind colors.
- Conditional thresholds: `--conditional-rule-{green,yellow,blue,red,purple,orange}`.
- **Score / rating / performance viz: NEVER red.** Use amber/orange (`--chart-4`, `--chart-5`) for "below threshold". *(VIZ-004, per Aarti)*
- Color is never the only encoding (A11Y-008). Pair with shape, label, or icon.

## Annotation discipline (VIZ-002)

- Target lines, benchmark dots, distribution bands belong on the chart.
- Outliers are highlighted on the viz (color + label callout), not enumerated in prose.
- Text below a chart labels values; it does not interpret the data.

---

## Anti-patterns (block list)

- More than one progress bar in a card → use heatmap or strip plot.
- Pie / donut for ≥4 slices → use stacked bar or waffle.
- 3D chart of any kind → never.
- Dual-axis line chart → split into small multiples.
- Decorative grid lines, drop shadows on bars, gradients → strip them (DS-009).
- "% complete" rendered as a literal `width: ${n}%` div with no scale, target, or context → use bullet chart.

---

## Pattern catalogue (this folder)

P1 (this round):
- `bullet-vs-target.md`
- `outlier-strip-plot.md`
- `gap-heatmap.md`

P3 (later): `strip-with-marker`, `slope-single`, `slope-multi`, `slope-pair`, `scatter-quadrants`, `box-distribution`, `small-multiples`, `line-trajectory`, `sparkline-table`, `cumulative-area`, `distribution-overlay`, `grouped-bar`.
