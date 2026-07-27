---
type: weekly-assessment
date: 2026-07-27
range: 2026-07-19 to 2026-07-24
products: [pce, exam-management]
agent: granola-deep-assessment
---

# Weekly Design Assessment — Jul 19–24, 2026

---

## Meetings analysed

| Title | Date | Granola ID | Included | Directives |
|---|---|---|---|---|
| Survey evaluation workflow — step separation and duplicate detection | Jul 24 | 10d48960-e5e8-4346-98cb-820bf2db1415 | ✅ | 5 |
| Exam management weekly call | Jul 23 | 0261fe62-676a-4943-b452-d1a47422f86f | ✅ | 7 |
| Template creation and analytics review with design feedback | Jul 22 | b1f1e827-33a9-4111-a39f-199960ebd0e4 | ✅ | 6 |
| Course Eval sync up | Jul 21 | 0a8a79f3-716c-4877-b91e-f83cc0e20fa9 | ✅ | 4 |
| 1:1 meeting with Arun and Romit | Jul 20 | 2870dd23-2ade-4ed9-9f36-9a8be7852cfb | ✅ | 2 |
| Survey design — course-to-template assignment and data validation flow | Jul 20 | 7cc5879f-c23d-4430-8430-8764380e33bc | ✅ | 6 |
| Modular product strategy — pricing tiers, upsell opportunities, and AI capabilities | Jul 19 | 1bc03a5a-ecd1-4d2d-8fd0-8423c5fdd763 | ✅ | 0 (strategic only, no product code targets) |
| The UX Chats: Team Meeting | Jul 21 | 17e9a2c8-ee35-42a8-a7cb-50e81f989f01 | ❌ SKIP | Non-Exxat community meeting (external participants) |

**Total included: 7 meetings | Total directives: 30 | Actionable code directives: 14**

---

## Change inventory

### WILL APPLY (safe, unambiguous)

_None this week._ All code-touching directives require either new TypeScript types, new mock data structures, structural screen rework, or are explicitly pending Romit/Monil/Arun alignment. No label-only or layout-only changes identified that aren't already done.

---

### NEEDS REVIEW (complex, needs Romit's judgment)

| # | Directive | Product | File | Why flagged | Suggested approach | Source quote |
|---|---|---|---|---|---|---|
| NR-01 | Push survey wizard: restructure to 4 separate steps — (1) course selection, (2) per-course template assignment + missing faculty + duplicate warning, (3) communication, (4) review | PCE | `apps/pce/admin/app/(app)/surveys/push/page.tsx` | Current code is a 3-step wizard with global template picker in Step 1. New structure inverts this and adds a whole new review step. Requires new `Step = 1 \| 2 \| 3 \| 4` type, new state, and new step components. D_PCE_0724_01 supersedes D_PCE_0720B_02 (combined step) — combined step explicitly reversed. | New Step type; Step 1 = course picker only (filter/select); Step 2 = DataTable with per-row template dropdown + faculty gap indicator + inline duplicate warning; Step 3 = communication window; Step 4 = summary table before push | "We are going back — we are going to separate courses as one step and assignment of templates, missing faculty association as step two, and step three would be communication." (Monil, Jul 24) |
| NR-02 | Per-row soft duplicate warning in Step 2 — flag rows where (course_offering_id + faculty_role_type + person_id) already exists in a live survey | PCE | `apps/pce/admin/app/(app)/surveys/push/page.tsx` | Requires uniqueness triplet check in mock data + new inline warning UI component per evaluatee row. Hard block explicitly rejected. | Inline soft warning badge per evaluatee row with uncheck affordance. Hard block = NOT the direction. | "Let's not go with hard block — let's keep it as soft warning… Right now what I'm asking for is just a soft warning in the UI." (Monil, Jul 24) |
| NR-03 | Step 4 duplicate consent acknowledgment — if admin proceeds past Step 2 duplicate warning, resurface consent check before final push | PCE | `apps/pce/admin/app/(app)/surveys/push/page.tsx` | New step entirely. Requires tracking which evaluatees received warnings and were confirmed. | Show consent acknowledgment row per accepted-duplicate in review step. "I understand this re-evaluates [name] for [course] / [role]." | "We just ask again and they have to give a consent that I understand." (Monil, Jul 24) |
| NR-04 | Faculty role → person hierarchy filter in survey analytics | PCE | `apps/pce/admin/app/(app)/analytics/page.tsx` | Analytics page currently has `instructorName` as a flat single-value field. Two-level filter needed: first filter by faculty role (Instructor / Coordinator / Lab Instructor), then by person within that role. Requires new mock data shape. | Add two-level filter above the chart panel: role selector (all / instructor / coordinator / lab instructor) then person within role. Existing `instructorName` field insufficient — needs `instructors: {role, personId, name}[]` on survey data. | "You need to make one more filter which is the faculty role… Within the faculty, the person who is evaluated can be instructor, coordinator, lab instructor… you will have to accommodate filters also at this hierarchy, meaning the faculty role hierarchy." (Monil, Jul 22) |
| NR-05 | Exam analytics: per-student score override in CurveView | Exam Management | `apps/exam-management/admin/app/(app)/assessments/[id]/analytics/analytics-client.tsx` | CurveView currently shows class-wide adjustments (bonus slider + exclude questions). Per-student row override (increase or decrease individual score) is not designed or built. Requires new student score table in CurveView. | Add a "Per-student adjustments" section below the class-wide controls in CurveView. Row per student: name, raw score, override input (+ / −), final score. | "There should always be a way for a faculty to review and say yeah publish this. Faculty could also mark — if the student has scored 80 out of 100 faculty could increase it or decrease it — the total score." (Aarti, Jul 23) |
| NR-06 | Template editor: two-step structure — settings first, builder second | PCE | `apps/pce/admin/app/(app)/templates/[id]/page.tsx` | Current code is a flat single-page builder (sections + questions). Monil confirmed Vishal's direction: template settings must come first as Step 1, question builder is Step 2. What "settings" contains exactly is not yet specified in code terms — needs Romit to define the settings fields (likert scale, opening instructions, etc.). | Split template editor into a settings tab/step (name, likert pointer, opening instructions) and a builder tab/step (sections + questions). Or use a settings drawer before entering builder. Cannot implement without knowing what settings fields are required. | "We will be moving template settings to step one and build a two step two. We mentioned that. Okay. Yeah." (Monil, Jul 22) |

---

### ALREADY DONE (directive found, code already correct)

| # | Directive | Product | File | Confirmed correct |
|---|---|---|---|---|
| AD-01 | Survey status label "Ongoing" (not "Live") for collecting surveys | PCE | `apps/pce/admin/components/pce/pce-badges.tsx:32` | `STATUS_CONFIG.collecting.label = 'Ongoing'` ✅ |
| AD-02 | Survey status label "Scheduled" for active/upcoming surveys | PCE | `apps/pce/admin/components/pce/pce-badges.tsx:24` | `STATUS_CONFIG.active.label = 'Scheduled'` ✅ |
| AD-03 | Point-biserial at assessment-instance level (per item, per class) | Exam Management | `apps/exam-management/admin/app/(app)/assessments/[id]/analytics/analytics-client.tsx` (ItemsView) | `pointBiserial` field computed per item per assessment ✅ |
| AD-04 | Exclude ANY question from scoring in curving (not just flagged) | Exam Management | `apps/exam-management/admin/app/(app)/assessments/[id]/analytics/analytics-client.tsx` (CurveView) | Description: "You can exclude any question — not just flagged ones" ✅ |
| AD-05 | Cohort-wide bonus points (0–10 pts slider) | Exam Management | `apps/exam-management/admin/app/(app)/assessments/[id]/analytics/analytics-client.tsx` (CurveView) | Bonus slider implemented ✅ |
| AD-06 | Grade book NOT in scope for exam management | Exam Management | — | Correctly absent from entire codebase ✅ |
| AD-07 | Download capability NOT in Jan MVP (stub only) | Exam Management | — | Download as StubButton correctly not functional ✅ |
| AD-08 | Zero students = backend hard block, no UI affordance in push wizard | PCE | `apps/pce/admin/app/(app)/surveys/push/page.tsx` | No UI validation for zero students — backend-only per D_PCE_0720B_05 ✅ |
| AD-09 | +N overflow indicator for multiple instructors in surveys list | PCE | `apps/pce/admin/app/(app)/surveys/page.tsx:83` | `extraInstructorCount` field + "+N" display already implemented ✅ |
| AD-10 | Highcharts confirmed as chart library | Exam Management / PCE | — | Already referenced in product approach; no code change needed ✅ |

---

### BLOCKED (needs PM/Aarti/Vishaka alignment first)

| # | Directive | Product | What's blocking |
|---|---|---|---|
| BL-01 | Cronbach's alpha metric in exam analytics | Exam Management | Engineering research task (Vishal + Nipun). D_EM_0723_03: "look into it and see what it measures and whether we also want to introduce that in our exam management." No design decision yet — research first. |
| BL-02 | "Create Template" CTA in dashboard term cards | PCE | Term dashboard with term cards does not exist in code. `apps/pce/admin/app/(app)/page.tsx` shows folder cards only. D_PCE_0720B_03 requires term-card-based dashboard first. New feature requiring PM scope alignment. |
| BL-03 | Template builder simplification (too loaded) | PCE | D_PCE_0721_01: "Exploratory — no code change until Romit + Monil + Arun align on approach." Sequential vs tabbed approach still under discussion. Arun: "do a very rough prototype pen and paper, discuss, then come back." Cannot implement without alignment. |
| BL-04 | Analytics screens expansion (multi-survey: board, term tabs) | PCE | Jul 22 directive: "right now, do not spend more time on prototyping this section… let me come back and review and give you the feedback." Analytics held pending Romit + Monil review. No code changes to analytics until review complete. |
| BL-05 | Template builder: vertical vs horizontal layout decision | PCE | "I am not fine with it. But you are saying that you need to work on something. So you can do your work and then we can review it. Let's review it but let's do it quickly." Monil not satisfied with vertical scroll; user test with David first before code direction. (Jul 22) |

---

## Notes on Jul 22 transcript (b1f1e827 — not previously documented)

This meeting was a Romit–Monil design review session covering:
- Template creation screen: multi-instructor +N overflow (design confirmed, code already correct)
- Confirmation of "template settings first, builder second" direction (NR-06 above)
- Nine dashboard scenarios review (design discussion, no code target)
- Analytics multi-survey screens (faculty + overview done; board + term need more inputs): HOLD directive issued
- Faculty role hierarchy filter requirement (NR-04 above)
- Qualitative feedback categorization in results (three categories + toggle — design confirmed)
- Highcharts confirmed as charting library
- Focus directive: template creation + evaluation distribution screens, NOT analytics

Meeting notes created: `apps/pce/docs/research/meetings/2026-07-22-template-analytics-review-monil.md`
