# Exam Management — Feature Registry

**Source of truth:** Each row links to the decision file(s) that define the feature. Any implementation without a citation here is unverified.

**Status key:** ✅ Built | ⚠️ Partial | ❌ Missing | 🔜 Phase 2+

---

## Assessment Creation & Builder

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| 3-step wizard (Details → Build → Review) | ✅ | af529725, b68ede99 | Built in assessment-builder-client.tsx |
| 4 assessment types (Quiz, Exam, Midterm, Pop Quiz) | ⚠️ | b68ede99, f274ade0 | Types exist; type-specific config not differentiated |
| Section creation with free-text title | ✅ | af529725, f59cfbe4 | Sections exist with faculty assignment |
| Section → instructor assignment | ✅ | af529725 | Built — "Assigned to" Select per section in DetailsStep; last name chip in SectionsOutline (commit 521f2d3) |
| Instructor can only edit their section | ⚠️ | af529725 | UI shows assignment; RBAC enforcement needs real auth layer |
| Instructor "section ready" signal | ❌ | af529725 | Not built |
| Section pre-read text | ⚠️ | af529725 | `AssessmentSection.prereadText` exists in types, no UI |
| Section content area targeting | ✅ | f274ade0, fb9e76c2 | Coordinator specifies content areas per section in Step 1 |
| Per-section randomize toggle | ✅ | — | Toggle per section; randomize=false = fixed/locked order |
| Instructor "section ready" signal | ✅ | af529725 | Mark ready/Reopen in SectionsOutline Step 2 header |
| Copy from previous assessment | ⚠️ | f59cfbe4, 66898189 | MOCK_COPY_SOURCES exists; section structure copy ❌ |
| Move questions between sections in copy flow | ❌ | 66898189 | Not built |
| Download window configuration | ✅ | 66898189 | Built in DetailsStep — open/close dates + downloadWindowHours input (was already there, not a gap) |
| Pop quiz / instant-start flow | ❌ | b68ede99 | Not built — fast path from course → start exam now |
| Assessment settings (randomize, time, password) | ⚠️ | 66898189, af529725 | Settings exist in types; some UI gaps |

---

## Assessment Review & Approval Workflow

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| Send assessment for review (to reviewer) | ✅ | af529725, b68ede99 | SendForReviewDialog built (commit 45f1459); "Send for review" button in Step 3 ApprovalPanel |
| Reviewer selection (chair / multiple) | ✅ | af529725 | Multi-checkbox; filters to Program Directors + Course Coordinators |
| Assessment review status (pending / approved) | ✅ | b68ede99 | ApprovalPanel shows status chip with --chart-2 for approved |
| Soft gate on publish (warning if not approved) | ✅ | af529725, b68ede99 | "Publish without review" shows warning card; "Publish anyway" allowed |
| Review status chip on assessment list | ❌ | b68ede99 | Step 3 ApprovalPanel shows it; assessment list overview still doesn't |
| Assessment-level only (not section, not question) | ✅ | af529725 | Correct by design |

---

## Question Bank

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| QB linked to base course (not offering) | ⚠️ | f59cfbe4, f274ade0 | Assumed in data model; needs verification |
| Content area filter in QB picker | ✅ | fb9e76c2 | Chip filter row in assessment builder; derived from course QB subfolders |
| Question → direct standard/competency mapping | ✅ | fb9e76c2 | StandardsSelect in question editor right rail; NAPLEX + NCLEX blueprints (commit fb6de33) |
| Question labels (nested, program + personal) | ⚠️ | fb9e76c2 | Simple comma tags only; no nesting/program labels |
| AI suggest standard mapping | ⚠️ | fb9e76c2 | AI objective suggestion exists; not linked to standards |
| Question versioning | ❌ | f59cfbe4 | Not built |
| PBI / discrimination coefficient on questions | ❌ | 4e1c850e | Not built |

---

## Assessment Analytics (Post-Exam)

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| Score distribution overview | ❌ | 4e1c850e | Not built |
| Per-question analysis (PBI, discrimination) | ❌ | 4e1c850e | Not built |
| Content area coverage chart | ⚠️ | 4e1c850e | HealthPanel has pre-exam view; post-exam ❌ |
| Objective coverage chart | ❌ | 4e1c850e | Not built |
| Bloom's taxonomy distribution | ⚠️ | 4e1c850e | Pre-exam only in HealthPanel |
| AI gap analysis vs. published standard blueprints | ❌ | fb9e76c2 | Not built |

---

## Accommodations

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| Course coordinator accommodation view (which students, what accommodations) | ❌ | 4e1c850e, af529725 | Not built |
| Extra time accommodation | ❌ | 4e1c850e | Not built in exam-taking UI |
| Font size accommodation | ❌ | 4e1c850e | Not built |
| Dyslexic font support | ❌ | 66898189 | Not built |
| 200% magnification verified | ❌ | 66898189 | Needs accessibility audit |

---

## Assessment Overview (Course Level)

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| Assessments organized by completion status (Ongoing/Upcoming/Completed) | ❌ | b68ede99 | Not built; current CourseOfferingDetail shows a list |
| Ongoing state most prominent | ❌ | b68ede99 | No live "in progress" indicator |
| Approval status as secondary widget (not primary org) | ❌ | b68ede99 | Not built |
| Summary stats (N assessments, N completed, N scheduled) | ❌ | b68ede99 | Not built |

---

## Offline / Download

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| Configurable download window (coordinator sets) | ⚠️ | 66898189 | `downloadWindowHours` in types; no student flow |
| Explicit student download CTA | ❌ | 66898189 | **Critical — not built** |
| Encrypted exam in browser storage | ❌ | 66898189 | Architecture not built |
| Submit when reconnected queue | ❌ | 66898189 | Not built |

---

## Roles & Access

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| Three roles: admin, faculty, student | ✅ | f274ade0 | Role structure exists |
| Course coordinator vs. instructor sub-roles | ❌ | af529725, f274ade0 | Only one faculty role currently |
| Section-level access control per instructor | ❌ | af529725 | Not built |

---

## Base Entities

| Entity | Status | Decision Files | Notes |
|---|---|---|---|
| Students list + detail | ✅ | f274ade0 | Built |
| Faculty list + detail | ⚠️ | f274ade0 | Partial |
| Courses | ✅ | f274ade0 | Built |
| Terms | ⚠️ | f274ade0 | Navigation exists; entity management TBD |
| Course Offerings | ✅ | f274ade0 | Built |
| Accommodations admin | ❌ | f274ade0 | Not built |
| Content areas (admin list) | ❌ | f274ade0 | No standalone content area admin page; currently derived from QB folder structure in builder |
| Competencies | ❌ | f274ade0 | Not built |
| Standards | ❌ | f274ade0 | Not built |

---

## Last updated: 2026-05-22 (session 3 — content areas filter, section content area targeting, randomize, ready signal)
## Next review: after any new relevant meeting transcript
