# Nav Pattern Rubric

> Binds DESIGN.md A11Y-007 (sidebar shell), workspace ADR-003 (module sellability + Prism launcher).
> The DS already documents Sidebar / Breadcrumb / Tabs — those are component patterns, not workspace patterns. This rubric covers the higher-order nav decisions: how products/modules relate to each other and to Prism.

---

## The four nav layers

| Layer | What it is | Where | Owner |
|---|---|---|---|
| **L1 — Module launcher** | Which Exxat module is the user in? | Prism shell (replaces current dashboard, ADR-003) | Workspace pattern |
| **L2 — Product nav** | Which surface within the module? | Per-product `Sidebar` (admin) or NavShell (student) | DS component |
| **L3 — Section tabs** | Which section within a multi-tab surface? | Per-screen `Tabs` (line variant) | DS component |
| **L4 — In-content controls** | Filters, sorts, drill-in | Per-component | Per-component |

This rubric covers L1 only. L2–L4 are DS component patterns documented in `exxat-ds/packages/ui/src` and `studentUX`.

---

## L1 — Module launcher

The new pattern (ADR-003): replaces Prism dashboard. Each Exxat module appears as a tile; clicking opens the module in a new tab. See `module-launcher.md` for the spec.

**When to use:**
- Always. The Prism main dashboard is replaced by the module launcher per ADR-003.

**When NOT to use:**
- Within a module — the launcher belongs to the Prism shell, not to product surfaces.

---

## Cross-module nav rules

| Rule | Why |
|---|---|
| Modules open in **new browser tabs** | ADR-003 — tech-stack split between Angular Prism + React modules |
| Each module's first-visit landing must work without Prism context | Module sellability |
| No persistent "back to Prism" chrome inside modules | Cluttered; Prism is one tab among the user's tabs |
| Cross-module deep links must work via URL (e.g., from Exam Mgmt notification → PCE evaluation surface) | Shared entity universe (workspace ADR-001) makes deep links sensible |

---

## Anti-patterns

- ❌ Embedding a module inside the Angular Prism iframe — defeats ADR-003
- ❌ "Back to Prism" link in module headers — user uses browser tabs
- ❌ Module-to-module navigation that requires routing through Prism — direct URL links work, use them
- ❌ Per-product chrome that imitates Prism's chrome — confusing; let each module's chrome reflect its own identity

## Pattern catalogue (this folder)

P3 (this round):
- `module-launcher.md` — Prism dashboard replacement (ADR-003 / D34)

P4+ (later): `cross-module-deep-link.md`, `breadcrumb-with-context.md`
