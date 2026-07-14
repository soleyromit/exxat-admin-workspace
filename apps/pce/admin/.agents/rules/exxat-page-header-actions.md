---
description: Exxat DS — PageHeader actions slot; View as / overflow / primary CTA patterns. Auto-attaches when editing React PageHeader callsites; the universal "one filled primary" rule lives in P3 of exxat-ux-principles.
activation: glob
globs: {components,lib,src}/**/*.{tsx,ts}
---

<!-- Synced from .agents/rules/exxat-page-header-actions.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — page header actions

**Blueprint:** `docs/exxat-ds/blueprints/page-header.md`

## Anatomy (actions slot only)

| Control | DS pattern |
|---------|------------|
| **Primary CTA** | One **`Button`** `variant="default"` `size="lg"` (filled) — e.g. “Add student”, “Ask Leo” when it is the main action |
| **Secondary / scope** (“View as”, “All students”) | **`Button variant="outline" size="lg"`** + chevron, or **`Select`** / **`DropdownMenu`** trigger styled as outline button — **not** plain grey rectangles or unstyled `<button>` |
| **Overflow (⋯)** | **`Button variant="outline" size="icon-lg"`** (or `size="lg"` icon-only) opening **`DropdownMenu`** — Export, settings, invite |
| **Collaboration** | **`PageHeader variant="collaboration"`** face rail — not a custom avatar row |

## MUST

- Compose **`PageHeader`** + pass **`actions`** as DS **`Button`** / **`DropdownMenu`** primitives.
- Keep **one** filled primary; put Export and long-tail items under **⋯**.
- **List hubs** (`ListPageTemplate` + table/board views): wire **`ExportDrawer`** (or domain header with **`onExport`**) and mount the drawer on the page client — see `library-client.tsx`.
- **Record detail routes** (`PrimaryPageTemplate` + entity header): **`PageHeader`** with **⋯** overflow at minimum **Export** when the surface has exportable rows; add domain actions (Configure, Invite, etc.) as extra menu items — see `learning-activities-course-detail-client.tsx`.
- Reuse **`LibraryPageHeader`** / domain `*-page-header.tsx` when the hub matches library collaboration patterns — do not hand-roll a second overflow menu.

## List hub checklist (binding)

| Piece | DS primitive |
|-------|----------------|
| Shell | `PrimaryPageTemplate` or `SecondaryPanelHubTemplate` |
| Hub body | `ListPageTemplate` |
| Route identity | `PageHeader` or domain `*PageHeader` with **`actions`** |
| Primary CTA | One `Button variant="default" size="lg"` when the hub has a create action |
| Overflow | `Button variant="outline" size="icon-lg"` → `DropdownMenu` |
| Export | Menu item → `setExportOpen(true)` + **`<ExportDrawer>`** sibling on the client |
| Table | `HubTable` inside `renderContent` — not a bespoke grid |

## MUST NOT

- Hand-built header button rows that skip **`PageHeader`** and **`Button`** variants.
- Multiple filled primaries beside each other (e.g. “Ask Leo” + “Add student” both solid black unless product explicitly documents hierarchy — prefer outline for secondary).

## Reference

- `components/library-page-header.tsx`, `components/library-client.tsx` — hub + export drawer
- `components/learning-activities-course-detail-client.tsx` — detail ⋯ + export
- Placements/Team patterns in **`docs/exxat-ds/reference-implementations.md`**
