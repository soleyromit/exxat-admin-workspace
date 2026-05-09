# Progression Sankey (Sequential-Stage Flow)

**Question answered:** How do students/items/cohorts flow between sequential stages, and where is the drop-off?

**Pattern ID:** `VIZ-PATTERN-008`
**Binds rules:** VIZ-002 (viz first), VIZ-004 (no red), VIZ-009 (sequential stages = flow, not separated count cards), A11Y-008 (color not only encoding — drop-off has both color and dashed border)

> Drop-off is the story. Separated count cards force the reader to mentally subtract; Sankey shows the WHERE of attrition.

---

## When to use

- PCE student progression: Applied → Placed → Completed → Passed
- Exam-management item lifecycle: Draft → Review → Published → Retired
- Learning-contracts approval flow (when scaffolded): Drafted → Submitted → Approved → Active
- Survey response funnel: Sent → Opened → Started → Completed
- Any 3-5 sequential stages with attrition between them

**Replaces in current product:**
- Stacked counts per stage (currently shown as N separate metric cards) — switch to Sankey
- "Funnel" step indicators that show stages but not the FLOW

## When NOT to use

- ≥6 stages (becomes spaghetti)
- < 50 entities total (use a numbered list with stage counts)
- Entities can revisit prior stages (Sankey assumes one-way flow — use a state diagram)
- Two-stage transitions (use a slope graph or simple arrow + count)

## Anatomy

```
Applied (482)                                                 
    │                                                         
    │  461 ───────────► Placed (461)                         
    │                       │                                
    │                       │  448 ─────────► Completed (448)
    │                       │                       │        
    │  −21 ◄───── (drop)    │                       │  413 ─►  Passed (413)
    │  not placed           │  −13 ◄────── (drop)   │           
                            │  withdrew              │  −35 ◄─── (drop)
                                                    │  did not pass
                                                                
Largest drop-off: Completed → Passed (35 students, 7.3%)
```

## DS tokens

| Token | Use |
|---|---|
| `--chart-1` (indigo) | Default node fill + flow links (in-flow) |
| `--chart-4` (amber) | Drop-off node + dashed border indicator (NEVER red — VIZ-004) |
| `--muted` | Terminal node fill (e.g., final stage) |
| `--conditional-rule-orange` | Border on largest drop-off arc (1px dashed) |
| `--foreground` | Node labels |
| `--text-xs` | Drop-off delta annotations (11px) |

## Annotation discipline

- **Label every node** with count + delta from previous stage ("Placed: 461 (−21)")
- **Largest drop-off** highlighted with `--conditional-rule-orange` 1px dashed border on the link
- **Flow link opacity** — 30% default, 60% on hover; stays in `--chart-1` for in-flow, `--chart-4` for drop-off
- **No legend** — node colors + node labels carry meaning directly
- **Stages in chronological order** — never reorder by count
- **One-line takeaway below** — "Largest drop-off: Completed → Passed (35 students, 7.3%)"

## Anti-patterns

- ❌ Animate the flow (DS-009; "no visual polish beyond DS")
- ❌ Color drop-off red (VIZ-004) — use amber + dashed border (redundant encoding for A11Y-008)
- ❌ Reorder nodes by count — chronological order IS the meaning
- ❌ Hide drop-off paths to make the funnel "look better" — drop-off IS the chart
- ❌ Add ≥6 stages — becomes unreadable; split into multiple Sankeys or use a different pattern
- ❌ Use Sankey for backflow scenarios — use a state diagram instead

## Code skeleton

This pattern is most often built with a Sankey library (e.g., `recharts` v2.x has `<Sankey>` or use `d3-sankey`). Stub:

```tsx
'use client'
import { Sankey, Tooltip } from 'recharts'

type Node = { name: string; count: number; isDropoff?: boolean }
type Link = { source: number; target: number; value: number; isDropoff?: boolean; isLargestDropoff?: boolean }

// Build nodes + links from raw progression data
// nodes[0] = "Applied", nodes[1] = "Placed", nodes[2] = "Placed-dropoff" (terminal)
//   etc., one terminal node per drop-off

const colorFor = (node: Node) =>
  node.isDropoff ? 'var(--chart-4)' : 'var(--chart-1)'

const linkColor = (link: Link) =>
  link.isDropoff ? 'var(--chart-4)' : 'var(--chart-1)'

const linkBorder = (link: Link) =>
  link.isLargestDropoff ? '1px dashed var(--conditional-rule-orange)' : 'none'

// <Sankey> from recharts — pass nodes + links
// Node labels: name + count + delta (computed from links)
// Hover via <Tooltip>
```

If `recharts/Sankey` isn't sufficient (it's stricter than D3), use `react-d3-sankey` or hand-roll. Discuss with Himanshu before adding a new dep.

## Why this elevates beyond current

Stage-by-stage count cards force the user to do mental arithmetic:
- "Applied: 482, Placed: 461 — wait, what was the drop-off again? 21? Let me look back at Applied..."

Sankey makes the drop-off VISIBLE and PROPORTIONAL. The thickness of the "drop" stem encodes the magnitude. The eye reads "biggest leak is between Completed and Passed" without computation.

Aarti's "embedded workflow intelligence" applied to cohort lifecycle — the Sankey is itself the dashboard.

## See also

- `docs/patterns/viz/small-multiples.md` (one Sankey per cohort/year — when comparison matters)
- DESIGN.md VIZ-009 (sequential stages must use flow viz, not separated cards)
