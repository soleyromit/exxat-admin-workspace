# Weekly Design Assessment — 2026-08-25 to 2026-08-31

**Generated:** 2026-08-31
**Routine:** `granola-deep-assessment` (weekly Monday 9am ET)
**Products in scope:** exam-management, pce, patient-log, skills-checklist, learning-contracts

---

## Meetings analysed

| Title | Date | Granola ID | Directives found |
|---|---|---|---|
| Post-Course Survey Cadence Meeting | Aug 25 | `970c20a2` | 7 (KPI split, eval coverage, remove sparklines, remove group-by, remove responses-by-role, keep response rate, feature rename) |
| Course Eval sync up (Vishal) | Aug 25 | `fb6bd7f5` | 5 (remove upcoming card, add faculty role column, rename extend→edit survey, filters not tabs, state-specific row actions) |
| Single server analytics — UI design and export strategy | Aug 26 | `9dcd7804` | 13 (action row cleanup, section tile fields, faculty UX, PDF export) |
| Course Eval sync up | Aug 27 | `ab12472a` | 10 (already documented as T238–T248) |
| Exam management review with leadership team | Aug 24 | `0e389b16` | 2 informational (browser lockdown blocked, question mapping confirmed) |
| Exam management weekly call | Aug 27 | `7ed017c8` | 3 (already documented as T116–T118) |
| Exxat system onboarding — patient logging | Aug 27 | `cba8ce86` | 1 (remove minutes fields — blocked, no code) |
| Kunal / Wilson emerging domain questions | Aug 28 | `11beb00d` | 0 (pure market research) |
| PRISM capabilities / emerging domains | Aug 27 | — | 0 (pure product research) |
| Nursing market penetration with Wilson | Aug 26 | — | 0 (pure market research) |
| Office Hour — Design System | Aug 24 | — | 0 (DS tooling only) |
| 1:1 Arun and Romit | Aug 24 | — | 0 (status update) |

---

## Change inventory

### WILL APPLY (safe, unambiguous)

| # | Directive | File | What changes | Source quote |
|---|---|---|---|---|
| 1 | Rename "Course Evaluation" folder card to "Course surveys" | `apps/pce/admin/app/(app)/page.tsx` | `title="Course Evaluation"` → `title="Course surveys"`, `label: 'active evaluation'` → `label: 'active survey'` | "course surveys is very well understood, so we can go with course surveys on our UI" |

### NEEDS REVIEW (complex, needs Romit's judgment)

| # | Directive | Why flagged | Suggested approach |
|---|---|---|---|
| 1 | Split course avg + faculty avg into two separate KPI tiles (T232) | Requires new mock data field (faculty avg is not separately tracked) | Add `facultyRatingAvg` field to mock data + second KPI tile |
| 2 | Evaluation coverage KPI as count display "N of M" (T233) | Requires new data field; rework of KPI metric shape | New `evaluationCoverageCount` field + replace rate display |
| 3 | Add response rate as standalone KPI tile | Requires mock data aggregation change | Surface `totalRate` as dedicated KPI slot |
| 4 | Single-server analytics page (T249–T259): 11 directives for a page not yet in codebase | Whole new page/component; requires new TypeScript types | Build page once design spec is finalized (T239 review pending) |
| 5 | PDF export on course analytics page (T260) | New feature requiring export mechanism | Flag with Himanshu before building |
| 6 | Faculty role column on survey list (T-new, from fb6bd7f5) | Requires new `facultyRole` field on `PceSurvey` mock data type | Add field to mock data + new column definition |
| 7 | State-specific row actions in survey list (fb6bd7f5) | Logic: scheduled → edit+preview; live → reminder primary, edit/preview/results in three-dots | Refactor `RowActions` with `survey.status` branching |
| 8 | Faculty chips display (T258) | Needs visual spec before coding | Create Figma spec first, then implement |

### ALREADY DONE (directive found, code already correct)

| # | Directive | File | Confirmed correct |
|---|---|---|---|
| 1 | No sparklines in KPI tiles | `apps/pce/admin/app/(app)/analytics/page.tsx` | KPI strip uses `trend: 'neutral'` + delta text only; no TrendSparkline in KPI tiles |
| 2 | No group-by filter on rating trend | `apps/pce/admin/app/(app)/analytics/page.tsx` | No group-by UI on program trend card |
| 3 | No "responses by role" chart | `apps/pce/admin/app/(app)/analytics/page.tsx` | Chart does not exist in codebase |
| 4 | Survey list = table with filters, no tabs | `apps/pce/admin/app/(app)/surveys/page.tsx` | Two filter dropdowns, no tab UI |
| 5 | No "Upcoming" card in dashboard | `apps/pce/admin/app/(app)/page.tsx` | Dashboard shows folder cards, no term-status KPI cards |
| 6 | No "extend" action in survey list | `apps/pce/admin/app/(app)/surveys/page.tsx` | RowActions shows View + Reminder + Close only |
| 7 | Aug 27 sync directives | PCE backlog T238–T248 | Already documented in backlog from prior run |
| 8 | Aug 27 exam-management directives | EM backlog T116–T118 | Already documented in backlog from prior run |
| 9 | Z-scores deferred to phase 2/3 | Exam management backlog | Confirmed in Aug 27 weekly call; code unchanged |

### BLOCKED (needs PM / alignment first)

| # | Directive | What's blocking |
|---|---|---|
| 1 | Remove minutes fields (time_with_patient, time_with_preceptor) from patient log form | No `patient-log` app code directory in this workspace (docs only); code lives elsewhere |
| 2 | Browser lockdown opt-out for open-book exams | Needs PM / Vishaka alignment before any design work |

---

## Changes applied

- `apps/pce/admin/app/(app)/page.tsx` — folder card title "Course Evaluation" → "Course surveys", label "active evaluation" → "active survey" — driven by: "course surveys is very well understood, so we can go with core surveys on our UI"

## New documentation created

- `apps/pce/docs/research/meetings/2026-08-26-single-server-analytics-export-strategy.md` — 13 directives from Granola `9dcd7804`
- `apps/pce/docs/workflows/_backlog.md` — added T249–T261 from Aug 26 meeting

## Needs Romit's review

1. **KPI split (T232)** — `analytics/page.tsx` — add separate course avg + faculty avg KPI tiles (needs mock data)
2. **Evaluation coverage as count (T233)** — `analytics/page.tsx` — rework coverage KPI to count format
3. **Single-server analytics page (T249–T259)** — new page not yet built — finalize after T239 design review with David + Vishaka
4. **PDF export (T260)** — flag with Himanshu before engineering
5. **Faculty role column on survey list** — `surveys/page.tsx` — needs `facultyRole` field on mock data type
6. **State-specific row actions** — `surveys/page.tsx` — refactor `RowActions` for scheduled vs. live state branching
7. **Faculty chips design (T258)** — `surveys/[id]` analytics — create Figma spec first

## Blocked (needs alignment)

1. **Patient log minutes removal** — no code directory in workspace
2. **Browser lockdown opt-out** — needs Vishaka + PM alignment

---

## Summary

- Meetings analysed: 12
- Directives found: 41 (across 7 meetings with design content)
- Changes applied: 1 (vocabulary: "Course Evaluation" → "Course surveys")
- New docs created: 1 (Aug 26 meeting notes + 13 backlog tasks T249–T261)
- Flagged for review: 7
- Already correct: 9
- Blocked: 2
