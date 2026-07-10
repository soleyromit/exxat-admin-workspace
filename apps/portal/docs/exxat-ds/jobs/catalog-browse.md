# Job: Catalog / pattern browse

**Reference:** `components/catalog-client.tsx`, `src/views/catalog.tsx`, `lib/mock/catalog-entries.ts`.

---

## Job-to-be-done

Help a **design-system consumer or internal builder** discover templates, patterns, and showcase routes — browse by category, open a live demo, without pretending to be a production data hub.

---

## Decision

| Signal | Choose |
|--------|--------|
| Browse DS patterns / templates / demos | **Catalog browse** (this job) |
| Operational records with filters/export | [List hub](./list-hub.md) |
| Single-task timed surface | [Focus workflow](./focus-workflow.md) |

---

## Composition

- **`ListPageTemplate`-free list + details** — `PrimaryPageTemplate` + `PageHeader` + `ListPageTreePanelShell` (no KPI strip, no hub view tabs). Category group tabs in the list show consolidated row counts; sections show per-section counts.
- Static entries from `catalog-entries.ts`; interactive previews in `components/catalog-preview-demos.tsx` and `components/catalog-preview-sandboxes.tsx`.
- **Live preview in the detail pane** — select a list row to interact in place (`?pattern=`). No redirect to showcase routes from the preview footer.
- Category scope via SidebarDrillIn + `?category=` (same model as Tokens).

---

## Checklist

- [ ] Entries typed in `lib/mock/catalog-entries.ts` (id, title, category, routeSuffix, importPath)
- [ ] Preview body wired in **`components/catalog-live-previews.tsx`** (real DS components) — **`catalog-preview-sandboxes.tsx`** / **`catalog-preview-demos.tsx`** delegate here; no bespoke card/chart/table stand-ins
- [ ] **Board** hub previews use **`LibraryBoardView`** + **`LibraryBoardCard`** (or **`ListPageBoardTemplate`** with the same card renderer) — not a lone simplified card
- [ ] **Charts** use **`ChartCard`** + **`ChartFigure`** with variant switcher when multiple variants apply
- [ ] Nav entry in `lib/catalog-nav.ts` / `navigation.tsx` as appropriate
- [ ] Showcase routes registered in `src/routes.tsx`
- [ ] Row click updates `?pattern=` and opens detail pane — not a hard redirect
- [ ] Empty state when filter matches nothing

---

## Showcase vs product route

| Type | URL | Chrome |
|------|-----|--------|
| DS demo | May live under product root for dogfood | Full or focus shell per entry |
| Product hub | `/prism/<entity>` | Full app shell |

Document in catalog entry metadata which shell the demo uses.

---

## Rules

- Reuse before custom — `.cursor/rules/exxat-reuse-before-custom.mdc`
- Token discipline — no hex literals
- Brief required if redesigning catalog IA (not for adding one entry)

---

## Ship gate

- [ ] Links resolve (no 404 showcases)
- [ ] One H1 via `PageHeader`
- [ ] Keyboard reachable cards/rows
