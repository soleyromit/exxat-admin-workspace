# Patient Log — Admin Dashboard Design

**Date:** 2026-05-27
**Author:** Romit Soley
**Status:** Approved

---

## Purpose

Answer two admin questions at a glance:
1. Are students logging required clinical encounters?
2. Is their diagnosis/encounter-type coverage balanced?

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  SiteHeader — "Patient Log"                     [filter: Term]│
├─────────────────────────────────────────────────────────────┤
│  KPI Band (4 tiles)                                          │
│  Total Students | On Track % | At Risk Count | Avg Enc/Tgt  │
├──────────────────────────┬──────────────────────────────────┤
│  Students at Risk        │  Encounter Type Breakdown        │
│  DataTable (5-row max)   │  Horizontal bar chart            │
├──────────────────────────┴──────────────────────────────────┤
│  All Students — DataTable (sortable, searchable)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

| Section | DS Component | Notes |
|---|---|---|
| Header | `SiteHeader` | Term `Select` filter on right |
| KPI band | 4× `KeyMetricsShowcase` tiles | Max 4 per workspace rule |
| Students at risk | `DataTable` (vendored) | 5-row max, links to student detail |
| Encounter type chart | `Chart` horizontal bar | DS Chart component |
| All students | `DataTable` with `SearchInput` in toolbarSlot | Full list |

---

## Data Model (mock)

```ts
type StudentLog = {
  id: string
  name: string
  program: string
  loggedCount: number
  targetCount: number
  status: 'on-track' | 'at-risk' | 'completed'
}

type EncounterType = {
  label: string
  count: number
  percentage: number
}
```

KPIs derived from the mock student array at render time. Encounter types hardcoded for Phase 1.

---

## KPI Definitions

| Tile | Value | Calculation |
|---|---|---|
| Total Students | Count | `students.length` |
| On Track | Percentage | `students.filter(on-track or completed).length / total` |
| At Risk | Count | `students.filter(at-risk).length` |
| Avg Encounters | `X / Y` | `avg(loggedCount) / target` |

---

## Encounter Types (mock)

- Primary Care — 48%
- Acute Care — 30%
- Preventive — 18%
- Other — 4%

---

## Scaffolding Required

The admin app does not exist yet. Must scaffold `apps/patient-log/admin/` as a Next.js 15 app per `apps/patient-log/CLAUDE.md §1` before building the dashboard.

---

## Out of Scope (Phase 1)

- Student detail page
- Real API / data fetching
- Diagnosis-level breakdown (encounter types only)
- Export / reporting
