# Workspace Build Status
> Single source of truth for session continuity. Update after each significant build session.
> Last updated: 2026-05-19

---

## Quick orientation

| Product | Status | Port | Key surface |
|---|---|---|---|
| **Exam Management** | 🟢 Active build | 3001 (admin), 3002 (student), 5174 (taker) | Question Bank (admin) |
| **PCE** | 🟡 In Progress — target 30 Aug 2026 | 3005 (admin), 3006 (student) | Master-list entities |
| **Portal** | 🟢 Active build, deployed | 3100 | Workspace hub |
| **Patient Log** | ⚪ Scoped, not built | 3003 / 3004 | — |
| **Skills Checklist** | ⚪ Scoped, not built | 3007 / 3008 | — |
| **Learning Contracts** | ⚪ Scoped, not built | 3009 / 3010 | — |
| **FaaS 2.0** | ⚪ Planned, not scaffolded | — | — |

---

## Portal (`apps/portal/`) — port 3100

**Live URL:** https://exxat-portal.vercel.app

**What's built:**
- Connector list home page — all 6 products in a bordered card list with product icon, name, description, version, "Open Admin" CTA, chevron
- Product detail page (`/product/[id]`) — App Store style: hero gradient banner, floating product icon overlapping hero seam, name/description/badges, DS line-variant tabs (Overview · Resources · What's New)
  - **Overview tab:** Key features grid, compact "Open In" surface buttons (Admin / Student / Assessment Taker), institutions list
  - **Resources tab:** Webinars, videos, documentation, support links — `Resource` type with `kind` field
  - **What's New tab:** Upcoming roadmap (quarter-tagged items) + Release History (timeline layout)
- Per-product color palettes: `--product-{key}-from/to/icon` CSS tokens
- Per-product SVG illustrations for hero banners (ExamIllustration, PceIllustration, etc.)
- DS tabs fix: `shadcn/tailwind.css` custom variants (`data-active`, `data-horizontal`, etc.) inlined in `globals.css` because `shadcn` is not hoisted in pnpm

**Deploy process (Vercel remote build fails — pnpm workspace + private DS):**
```bash
cd /Users/romitsoley/Work/apps/portal
vercel pull --yes --environment=production
vercel build --prod --yes
vercel deploy --prebuilt --prod --yes
```

**Key files:**
- `apps/portal/app/globals.css` — shadcn custom variants, product palette tokens, sidebar overrides
- `apps/portal/app/page.tsx` — connector list home
- `apps/portal/app/product/[id]/page.tsx` — detail page
- `apps/portal/lib/products.ts` — `Product`, `Resource`, `ReleaseNote`, `RoadmapItem` types + all product data
- `apps/portal/lib/illustrations.tsx` — per-product SVG illustration components

**What's NOT done yet:**
- No auth / gating (intentionally — internal tool)
- Roadmap data only on Exam Management + PCE; other products have empty arrays
- Resources data only on Exam Management (3) + PCE (1); others empty
- Portal doesn't appear in the sidebar's "Apps" nav list for other products yet

---

## Exam Management (`apps/exam-management/admin/`) — port 3001

**Feature Status (from Nipun's Roadmap — synced 2026-05-19):**

| Feature | Status |
|---|---|
| Create and Manage Question Bank | 🟢 Shipped |
| My Questions & All Questions | 🟢 Shipped |
| Assessment Creation | 🟡 In Progress |
| In Assessment Experience (Student) | 🟡 In Progress |
| Course Offering Perspective | 🟡 In Progress |
| Question Creation (Manual & AI) | 🟡 In Progress |
| Question Tagging / Import | 🟡 In Progress |
| Assessment Distribution | 🟡 In Progress |
| Dashboard | 🟡 In Progress |

**What's built (Question Bank):**
- Full QB view: folder tree sidebar + question table + filter sheet
- Folder tree: collapse/expand, pin/unpin, drag-to-folder, right-click context menu, folder action dropdown
- Question table: multi-select bulk bar, column search, full-text search across all fields, Bloom's level badges, difficulty badges, row actions pill
- Filter sheet: filter by folder, Bloom's level, question type, difficulty
- Bulk actions: move to folder, duplicate, delete, assign — all with undo toast
- AI gap analysis (assessment level)
- Assessment Builder route exists at `/assessments/[id]`
- Analytics route at `/assessments/[id]/analytics` — tabs (Overview, Per-question, Content Areas)
- Course detail at `/courses/[id]` — tabs

**Active focus for next session:**
- The QB is feature-complete per §4.6 of the PRD. Next area likely to be worked on: Assessment Builder polish or the student Assessment Taker surface (`apps/exam-management/assessment-taker/`, port 5174)

**Assessment Taker (`apps/exam-management/assessment-taker/`) — port 5174:**
- Vite 5 + React 19 + Tailwind v4 + Exxat-DS (admin DS — exception, see rationale in `apps/exam-management/CLAUDE.md`)
- Status: partially built, UI pass in progress

**Key files:**
- `apps/exam-management/admin/app/(app)/question-bank/` — entire QB (qb-view.tsx, qb-table.tsx, qb-sidebar.tsx, qb-state.tsx, qb-filter-sheet.tsx, qb-modals.tsx, qb-inline-helpers.tsx)
- `apps/exam-management/admin/components/qb/badges.tsx` — Bloom's + difficulty badges
- `apps/exam-management/admin/app/globals.css` — DS tabs orientation fix + line-variant active underline CSS

---

## PCE (`apps/pce/admin/`) — port 3005

**What's built:**
- 11 master-list entity routes under `app/(app)/admin/`:
  surveys, programmatic-surveys, my-surveys, moderation, templates, analytics, admin, moderation
- DataTable (canonical, vendored) + KeyMetrics (canonical, vendored)
- Bulk evaluation send, site performance dashboard

**What's NOT done yet:**
- Student app (`apps/pce/student/`, port 3006) — not scaffolded
- Placement detail page
- Student-facing evaluation form

---

## Architecture rules to remember

### DS imports
```tsx
// Admin DS
import { Button, Badge, Tabs, ... } from '@exxat/ds/packages/ui/src'

// Student DS (only in student apps)
import { Button } from '@exxat/student/components/ui/button'
```

### Vercel / build
- Remote Vercel builds fail for all apps due to pnpm workspace + exxat-ds directory structure
- Always use `vercel build --prod --yes && vercel deploy --prebuilt --prod --yes`
- Portal is the only app deployed to Vercel so far

### DS tabs (critical — every app needs this)
Every admin app's `globals.css` needs:
```css
[data-slot="tabs"][data-orientation="horizontal"] { display: flex; flex-direction: column; }
[data-slot="tabs"][data-orientation="vertical"]   { display: flex; flex-direction: row; }
[data-slot="tabs-list"][data-variant="line"] [data-slot="tabs-trigger"][data-state="active"]::after {
  content: ""; position: absolute; inset-inline: 0; bottom: -5px; height: 2px;
  background: var(--foreground); opacity: 1;
}
```
Plus the `shadcn` custom variants block (see `apps/portal/app/globals.css` — inlined because shadcn not hoisted).

### Tabs usage pattern (canonical from analytics-client.tsx)
```tsx
<div className="border-b border-border">
  <TabsList variant="line" className="gap-0">
    <TabsTrigger value="...">Label</TabsTrigger>
  </TabsList>
</div>
```

### Never
- No toast (`sonner`) for product feedback — use banners or inline status
- No `opacity-60` on parents containing `text-muted-foreground` (WCAG contrast)
- No raw `<table>` — use DS DataTable
- No hardcoded hex — use CSS custom properties
- No editing `exxat-ds/` or `studentUX/` — read-only

---

## Scoped products (not yet built — scaffold when prioritized)

### Patient Log (`apps/patient-log/`) — port 3003/3004
- ICD-10 encounter logging, faculty validation workflows
- Package stubs exist in `pnpm-workspace.yaml`

### Skills Checklist (`apps/skills-checklist/`) — port 3007/3008
- Faculty sign-off, remediation tracking, PDF export for accreditation

### Learning Contracts (`apps/learning-contracts/`) — port 3009/3010
- Collaborative contract editor, approval workflows, PCE integration

### FaaS 2.0
- Visual form builder, conditional logic, multi-step workflows
- Nothing scaffolded — highest priority after EM + PCE

---

## Key people

| Person | Role | Context |
|---|---|---|
| Romit Soley | Product Designer II | Owns this branch — all design + prototype work |
| Himanshu Suthar | Engineering | Main branch owner — reviews before any merge to main |
| Aarti | PM / stakeholder | Champions Exam Management; drives scope decisions |
| Vishaka | PM | Gatekeeper for confidence-based marking; PCE PM |
| Darshan | Dev | Exam Management engineering |
