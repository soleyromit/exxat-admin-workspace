# Exam Management — Feature Registry

**Source of truth:** Each row links to the decision file(s) that define the feature. Any implementation without a citation here is unverified.

**Status key:** ✅ Built | ⚠️ Partial | ❌ Missing | 🔜 Phase 2+

---

## Assessment Lifecycle (4-step — June 4 Aarti directive)

> **Aarti directive (2026-06-04):** Every assessment has 4 lifecycle steps: **Create/Edit → Review (Phase 2, hidden) → Distribute → Stats/Analytics**. Current 3-tab builder must be refactored to match this.

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| 4-step lifecycle tab: Create/Edit | ✅ | 2026-06-04-aarti-teams | assessment-creation-app.tsx — Edit tab (2026-06-13) |
| 4-step lifecycle tab: Review | ✅ | 2026-06-04-aarti-teams | Tab disabled with Phase 2 badge — assessment-creation-app.tsx:197 (2026-06-13) |
| 4-step lifecycle tab: Distribute | ✅ | 2026-06-04-aarti-teams | distribute-tab.tsx — availability window, security, tools, publish (2026-06-13) |
| 4-step lifecycle tab: Stats/Analytics | ✅ | 2026-06-04-aarti-teams | stats-tab.tsx — Monitoring + Results views (2026-06-13) |
| Assessment list: published status column + date | ✅ | 2026-06-04-aarti-teams | assessments-landing.tsx — Status column with publish date (2026-06-13) |
| Assessment list: scored + timed attribute chips | ✅ | 2026-06-04-aarti-teams | assessments-landing.tsx — Badge chips in Assessment name cell (2026-06-13) |
| Assessment list: applicable students count | ✅ | 2026-06-04-aarti-teams | assessments-landing.tsx — RingChart shows applicable count (2026-06-13) |
| Assessment list: completed count (post-exam) | ✅ | 2026-06-04-aarti-teams | assessments-landing.tsx — RingChart shows completed count (2026-06-13) |
| Assessment list: pie charts for active exams | ✅ | 2026-06-04-aarti-teams | ActiveExamsStrip in assessments-landing.tsx — ring chart per live exam, hidden when none active (2026-06-15) |
| Distribute step: enrolled students count | ✅ | 2026-06-04-aarti-teams | distribute-tab.tsx — audience card with enrolled count (2026-06-13) |
| Distribute step: QB associations display | ✅ | 2026-06-04-aarti-teams | distribute-tab.tsx — audience card shows QB association chips (2026-06-13) |
| Distribute step: publish date + delivery window | ✅ | 2026-06-04-aarti-teams | distribute-tab.tsx — 3-stage availability (visible/openable/cutoff) (2026-06-13) |
| Stats step: applicable vs completed count | ✅ | 2026-06-04-aarti-teams | stats-tab.tsx — MonitoringView KPI chips + ResultsView (2026-06-13) |
| Monitoring: live proctoring dashboard | ✅ | 2026-06-04-aarti-teams, 4e1c850e | stats-tab.tsx — issue flags, proctor actions, student DataTable (2026-06-13) |

---

## Assessment Creation & Builder

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| 3-step wizard (Details → Build → Review) | ⚠️ | af529725, b68ede99 | Built; must be refactored to 4-step lifecycle (June 4) |
| 4 assessment types (Quiz, Exam, Midterm, Pop Quiz) | ⚠️ | b68ede99, f274ade0 | Types exist; type-specific config not differentiated |
| Section creation with free-text title | ✅ | af529725, f59cfbe4 | Sections exist with faculty assignment |
| Section → instructor assignment | 🔜 | af529725, 2026-06-04-aarti-teams | Phase 2 per June 4 — hidden: CollabPanel shows Team only; section card avatar + structure-tab owner name removed (2026-06-15) |
| Instructor can only edit their section | ⚠️ | af529725 | UI shows assignment; RBAC enforcement needs real auth layer |
| Instructor "section ready" signal | ❌ | af529725 | Not built |
| Section pre-read text | ⚠️ | af529725 | preRead toggle in structure-tab.tsx; actual doc upload/link UI not built |
| Section content area targeting | ✅ | f274ade0, fb9e76c2 | Coordinator specifies content areas per section in Step 1 |
| Per-section randomize toggle | ✅ | — | Toggle per section; randomize=false = fixed/locked order |
| Copy from previous assessment | ⚠️ | f59cfbe4, 66898189 | MOCK_COPY_SOURCES exists; section structure copy ❌ |
| Move questions between sections in copy flow | ❌ | 66898189 | Not built |
| Download window configuration | ✅ | 66898189 | Built in DetailsStep — open/close dates + downloadWindowHours input |
| Pop quiz / instant-start flow | ❌ | b68ede99 | Not built — fast path from course → start exam now |
| Assessment settings (randomize, time, password) | ⚠️ | 66898189, af529725 | Settings exist in types; some UI gaps |
| Blueprint setup modal (multi-course, owner, collaborators, syllabus) | ❌ | PRD §4.1 | Not built — wizard before entering builder |
| AI quiz/question generator (Cohere demo core) | ⚠️ | PRD §4.3 | AI suggestion exists; full end-to-end generator ❌ |
| AI semantic search for QB | ✅ | PRD §4.3 | SemanticSearch + QBDetailPanel in ai-tools.tsx (2026-06-13) |
| Local vs master question copies (pinned reference) | ❌ | PRD §4.3 | Not built |
| Drag & drop section/question reorder | ❌ | PRD §4.3 | Not built |
| Bulk point value assignment | ❌ | PRD §4.3 | Not built |

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

## Assessment Configuration (PRD §4.4 — mostly unbuilt)

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| Per-question grading configs (MCQ option randomization, distractor lock, negative marking) | ❌ | PRD §4.4 | Not built |
| MSQ grading (all-or-nothing, partial credit, right-minus-wrong) | ❌ | PRD §4.4 | Not built |
| Essay rubric-based grading | ❌ | PRD §4.4 | Not built |
| Fill-in-blank exact/contains logic | ❌ | PRD §4.4 | Not built |
| Hotspot image target areas | ❌ | PRD §4.4 | Not built |
| Forward-only section navigation rule | ❌ | PRD §4.4 | Not built |
| Require answer for section advancement | ❌ | PRD §4.4 | Not built |
| Backward navigation toggle (within section) | ❌ | PRD §4.4 | Not built |
| Time limits at section/question level | ❌ | PRD §4.4 | Assessment-level only currently |
| Pre-reads with read timer (assessment + section level) | ❌ | PRD §4.4, af529725 | prereadText in types; no UI |
| Reference attachments (assessment/section/question level) | ❌ | PRD §4.4 | Not built |
| Bonus questions | ❌ | PRD §4.4 | Not built |
| Digital tools (calculator, highlighter, scratchpad, copy/paste toggle) | ✅ | PRD §4.4 | distribute-tab.tsx — calculator Seg + 5 digital tool toggles (2026-06-13) |
| Score display config (raw/percentage toggles for students) | ✅ | PRD §4.4 | settings-panel.tsx — scoreDisplay none/raw/raw+pct + submitVisible (2026-06-13) |
| Post-exam review engine (access window, lockdown, time-limited) | ❌ | PRD §4.4.1 | Not built |
| Post-assessment regrading engine (invalidate, key correction, curving) | ❌ | PRD §4.4.2 | Not built |
| Automated psychometric alerts (PBI, discrimination) | ❌ | PRD §4.4.2, 4e1c850e | Not built |

---

## Delivery & Security (PRD §4.5)

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| Three-stage availability (visible / openable / cutoff dates) | ✅ | PRD §4.5, 66898189 | distribute-tab.tsx — 3 date inputs (visible/openable/cutoff) (2026-06-13) |
| Target audience / student groups | ⚠️ | PRD §4.5 | distribute-tab.tsx shows enrolled count + team; no group selector |
| Secure mode (Respondus lockdown browser) | ✅ | PRD §4.5 | distribute-tab.tsx — Secure/Standard Seg in security card (2026-06-13) |
| Exam start + resume passwords | ✅ | PRD §4.5, 66898189 | distribute-tab.tsx — startPw/resumePw toggles in security card (2026-06-13) |
| Offline tolerance (browser cache preflight) | ❌ | PRD §4.5, 66898189 | Architecture not built |

---

## Assessment Analytics (Post-Exam)

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| Score distribution overview | ✅ | 4e1c850e | stats-tab.tsx ResultsView — SVG histogram (2026-06-13) |
| Per-question analysis (PBI, discrimination) | ✅ | 4e1c850e | stats-tab.tsx ResultsView — per-question DataTable with difficulty/disc/pbi (2026-06-13) |
| Content area coverage chart | ⚠️ | 4e1c850e | HealthPanel has pre-exam view; post-exam results not disaggregated by content area |
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

---

## Assessment Lifecycle States (PRD §4.6)

| Feature | Status | Decision Files | Notes |
|---|---|---|---|
| Draft → In Review → Ready state machine | ⚠️ | PRD §4.6, af529725 | 3-step wizard exists; formal state machine ❌ |
| Dual-view preview + proctor simulator | ❌ | PRD §4.6 | Not built |
| Partial section review submission | ❌ | PRD §4.6.1 | Not built |
| Section-level collaborator delegation (scoped permissions) | ❌ | PRD §4.6.1, af529725 | Phase 2 per Aarti June 4 |
| Planned/Scheduled state (before building starts) | ❌ | PRD §4.6 | Not built |
| Archived state | ❌ | PRD §4.6 | Not built |

---

## Last updated: 2026-06-15 (Waves 1–6 built: lifecycle tabs, distribute-tab, stats-tab, structure-tab, settings-panel, ai-tools QB detail, question media)
## Sources added: 2026-06-04-aarti-teams · full PRD §4.1–4.7 audit
## Next review: pop quiz flow + section pre-read doc upload + aggregate active-exam charts
