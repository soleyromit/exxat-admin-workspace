# Viz: DS chart versus hand-rolled

Source of truth for which `admin/components/v2/viz/*` primitives use the DS `chart` primitive (`@exxatdesignux/ui/components/ui/chart`: `ChartContainer`, `ChartTooltip`, `ChartConfig`, Recharts) and which are still hand-rolled. DS 1.6.5. Colours come only from tokens (`viz/tokens.ts`, `var(--chart-N)`); no red in score encodings; text 12px or larger.

## Now DS chart

| Viz | Chart | Notes |
|---|---|---|
| `stacked-bar.tsx` | `BarChart layout="vertical"`, stacked, axes hidden, 24px high | Hatched segments use an SVG `pattern` so identity survives without colour. Tooltip gives segment value. Legend and sr-only list kept. |
| `bullet-meter.tsx` | `BarChart layout="vertical"` with a `Bar background` track, `ReferenceLine` for the required tick (solid) and pace (dashed), 16px high | Keeps `role="meter"` and the spoken `aria-valuetext`. The printed count stays beside it. |
| `dot-strip.tsx` | `ScatterChart` on a 0 to 100 x axis, lanes on a hidden y axis, `ReferenceLine` for pace | Behind-pace dots are diamonds in the warning tone with the name drawn by `LabelList`. The greedy lane placement is kept (pure layout). Every dot is in the tooltip and the sr-only list. |
| `cumulative-line.tsx` | `LineChart` / `BarChart` | Already DS chart. |

## Still hand-rolled (genuine DS gaps)

| Viz | What it shows | Why no DS chart fits | Dimensions |
|---|---|---|---|
| `heat-grid.tsx` | Students by skills, one cell per student and skill, state shown by fill, glyph and word | The DS chart set is Recharts cartesian and pie types; a categorical x categorical grid of states needs a semantic `table` (row and column headers, sortable, sticky first column, optional cell buttons). Recharts has no accessible equivalent. | Cell min 24 x 24px; first column min 144px, other columns min 96px; scrolls sideways |
| `waffle.tsx` | Counted, waiting and still-to-do as one square each (count form or per-square form, optional groups) | A unit chart of countable squares. There is no DS pictogram or unit chart, and a bar would hide that each square is one skill. | Square 16px default (min 8), gap 4px, group gap 10px |
| `segmented-dots.tsx` | Ordered attempts for one skill, one dot per attempt coloured by outcome | A row of discrete states in a list, used per row inside tables and cards. A Recharts instance per row is heavy and loses the list semantics. | Dot 20px default (min 16), gap 4px |

When the DS ships a heat map, unit chart or pictogram, move the row from this section to the first table.
