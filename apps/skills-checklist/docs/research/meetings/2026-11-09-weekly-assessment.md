# Weekly Design Assessment — Nov 2–9, 2026

**Run date:** 2026-11-09 (granola-deep-assessment-weekly routine)
**Scope:** All 5 Exxat products — meetings from last 7 days

---

## Meetings analysed

| Title | Date | Granola ID | Directives found |
|---|---|---|---|
| Skills tracking UX discussion | 2026-11-02 | e72ea925 | 8 |
| Skill tracking discussion 2 with Aarti | 2026-11-04 | 205da2dd | 10 |
| Skills tracking UX - 3 | 2026-11-06 | 741d1f1c | 8 |

**Other meetings scanned (no product directives):**
- AM / AAM checkpoint, Nov 3 — ops/personnel, no design directives
- Medical education interview, Nov 3 — research/domain context, no actionable directives
- TAM working group, Nov 5 — go-to-market, no design directives
- Miscellaneous Exxat colleague meetings — no skills/product directives

**Products with directives this week:** skills-checklist only
**Products with no directives this week:** exam-management, pce, patient-log, learning-contracts

---

## Change inventory

### WILL APPLY (safe, unambiguous)

No items. The skills-checklist product is not yet scaffolded — no `.tsx` files exist in `apps/skills-checklist/admin/app/` or `apps/skills-checklist/admin/components/`. There is no existing code to apply safe changes to.

---

### NEEDS REVIEW (design work required before any build — Romit's judgment)

| # | Directive | Why flagged | Source | Suggested approach |
|---|---|---|---|---|
| R1 | Admin 4-section module IA: Library → Checklists → Assignments → Reporting | New product, no scaffold. Full IA must be designed before engineering starts. HARD DEADLINE: Nov 23 Aarti review. | 741d1f1c (D41) | Design 4-panel sidebar nav for skills admin. Use existing exam-management admin sidebar as reference pattern. |
| R2 | Admin entry point: "Create skills checklist" CTA as primary onboarding action | Nav entry changes mental model from library-first to checklist-first. Needs design validation. | 741d1f1c (D35) | Design the empty-state / onboarding screen for new programs with the "Create skills checklist" CTA. |
| R3 | Checklist entity: named, versioned snapshot of skills from library | New entity with no Prism analog. Needs data model and UX spec before engineering. | 205da2dd (D34), 741d1f1c (D36, D40) | Define checklist entity properties (name, version, default flag, assigned cohorts). Design create/edit/version flows. |
| R4 | Assignment flow: whole checklist → student group, "all students" option | New surface. No sub-selection allowed anywhere. "All students" must be a valid target. | 205da2dd (D25), 741d1f1c (D37) | Design single-screen assignment flow. Multi-select for target groups + "All students" option. No skill-level controls. |
| R5 | Student QR code eval request flow | New surface for student app. QR display + preceptor scan + form entry. | 205da2dd (D29), 2026-11-02 (D22) | Design student skill detail screen with QR code display. Design preceptor mobile form entry. |
| R6 | Faculty group checkoff matrix | New surface for faculty app. Batch evaluation for a group of students. | 2026-11-02 (D21) | Design faculty checkoff matrix — different from admin assignment matrix (this is faculty-side, eval-time, not assignment-time). |
| R7 | Reporting: two separate pages — By Course and By Student | New surfaces. Separate pages (not tabs) with distinct filter sets. | 205da2dd (D28), 741d1f1c (D42) | Design two reporting pages. By-course: course filter → student × skill grid. By-student: student filter → skill progress timeline. |
| R8 | Multiple checklists per program, one default; new cohorts auto-receive default | Checklist management page — new surface. Default designation logic needed. | 205da2dd (D26), 2026-11-02 (D19, D20) | Design checklist management page with default badge, create new, version history. |
| R9 | Course clone must carry skill-to-course mappings | Engineering dependency. Must be formally specced and confirmed with Himanshu before skills Phase 1 ships. | 205da2dd (D27) | Write a 1-page spec for Himanshu: "when course X is cloned, copy all skill_course_mapping records for X to the new course." |
| R10 | Skills and Competencies as separate nav sections | Architecture decision — affects admin nav for all skills and competencies work going forward. | 205da2dd (D30), 2026-11-02 (D24) | Confirm placement with Aarti Nov 23. Two separate top-level nav items OR one "Standards" section with two subsections. |

---

### ALREADY DONE (directive found, code already correct)

None — no code exists yet.

---

### BLOCKED (needs PM/Vishaka alignment or engineering confirmation first)

| # | Directive | What's blocking |
|---|---|---|
| B1 | FAST form integration for skill evaluation forms | FAST team integration planning not yet completed (was flagged Q4 by Sankalp in Sep 23 meeting). Cannot design the form generation flow until FAST approach is confirmed. |
| B2 | Skills module navigation placement (top-level section vs. tab under Standards) | Needs Aarti confirmation at Nov 23 review before scaffold begins. |
| B3 | Lab tech / non-preceptor evaluator via free email | Technical approach unresolved — confirm with Sankalp before designing the free-email evaluator entry flow. |
| B4 | AI-assisted bulk upload (Word/Excel/PDF → skills library) | Technical approach (AI parsing + document types) pending Q4 engineering alignment. Do not design the upload UX until confirmed. |

---

## Pass 5 — Cross-reference result

**All files checked:** `apps/skills-checklist/admin/app/` and `apps/skills-checklist/admin/components/` — both directories do not exist. Product is unscaffolded.

**Result:** 0 directives already implemented. All 26 directives from the three meetings are net-new design work. 10 are in NEEDS REVIEW (design decisions Romit must make before build). 4 are BLOCKED on external alignment. No code changes were possible this run.

---

## Critical deadline

**Nov 23, 2026 (9am ET) — Aarti review (90 min).** Items R1–R8 (admin IA, entry point, checklist entity, assignment flow, student QR, faculty checkoff, reporting, checklist management) must be designed and ready for review. This is ~2 weeks from today (Nov 9).
