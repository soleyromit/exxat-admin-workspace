# PCE — Hand-rolled viz patterns

Per `docs/governance/ds-adoption.md` § Visualization: custom viz patterns with no DS
equivalent are HAND-ROLL ALLOWED when genuinely bespoke, logged here rather than in
`ds-adoption.md`'s "Documented hand-rolls" table (that table is for files overlapping a DS
*organism*; these overlap no organism at all — the DS has no visualization primitive for them).

| File | Visual | Why a standard chart wouldn't work | SVG dimensions |
|---|---|---|---|
| `admin/components/pce/response-funnel-sankey.tsx` | Response funnel Sankey — 4 main-chain nodes (Invited → Opened → Started → Completed) plus one drop-off terminal node after each of the first three, connected by value-proportional flow ribbons. VIZ-PATTERN-008. | No Observable Plot Sankey mark exists (every other analytics chart on `/analytics` is Plot). recharts' `<Sankey>` was the prior implementation and was the *only* recharts import reachable from `/analytics` — it pulled recharts' core runtime (state/cartesian/component/util chunks, ~2MB decoded in dev) into the page bundle for one chart. `docs/patterns/viz/progression-sankey.md:106` endorses hand-rolling over adding `d3-sankey`/`react-d3-sankey` as a new dependency ("Discuss with Himanshu before adding a new dep"). The topology is fixed and small (7 nodes, 6 links, always the same shape — only the counts change), so a generic graph-layout library adds nothing a closed-form column/ribbon calculation can't. Replaced 2026-08-17. | Responsive width (`ResizeObserver`, same pattern as `plot-figure.tsx`), height via `height` prop (168 default card size, 520 in the expand dialog). |
