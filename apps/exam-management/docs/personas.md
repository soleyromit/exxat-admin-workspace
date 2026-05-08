# Exam Management — Personas

Source: Aarti's email (early May 2026), Aarti's 2026-05-07 meetings, `apps/exam-management/CLAUDE.md`. Maintained by the intake skill via INTAKE-001 and INTAKE-002.

---

## P1 — Faculty (Edit)

**Who:** course-owning faculty with CRUD on their assigned courses.
**Phase 1 surfaces:** My Courses landing → per-course (Questions · Assessments · Students · Accommodations).

**Goals**
- See own courses first (not a global question bank)
- Author and recycle questions efficiently — typically 90–95% recycled per exam, ~5–10% new
- Ship assessments without losing time to chair-approval ceremony
- Get useful diagnostic data (point-biserial, difficulty) at decision time, not in a separate report

**Frustrations (current state with ExamSoft)**
- Question bank is monolithic; finding "my course's" questions is friction
- Item-quality stats live in standalone reports — not surfaced where the decision happens
- New AI-generated questions risk poor point-biserial → hurts post-course evaluation → faculty are conservative

**Jobs to be done**
- Land on My Courses → click into a course → 4-section view (Questions · Assessments · Students · Accommodations)
- Build assessment from QB (primary) or ad-hoc in builder (fallback for "need 5 more")
- See AI-suggested questions tied to lecture content (uploaded slides, LMS pull, NL prompt) — validate carefully before adding
- Publish results: low-stakes immediately, high-stakes after 3–4 day review window

**Two faculty entry paths (both must work)**
1. PRISM faculty module (tile/menu item)
2. Direct exam-management login

---

## P2 — Faculty (Read-only)

**Who:** faculty with view-only access on assigned courses.
**Phase 1 surfaces:** Same as Faculty (Edit), but read-only. Also view-only access to all settings.

**Goals**
- See course state without editing
- Reference questions/assessments from courses they don't own (e.g., team-teaching, observation roles)

**Phase 1 boundaries**
- More complex roles (proxy edit, partial edit, etc.) are deferred. Two levels only in Phase 1.

---

## P3 — Admin

**Who:** institution admin; full access; assigns roles.
**Phase 1 surfaces:** Global Question Bank, role assignment UI, cross-course settings, institution-level configurations.

**Goals**
- Maintain institution-wide question bank quality
- Assign Faculty (Edit) / Faculty (Read-only) to courses
- Configure institution-wide settings (chat at institution OR course level, label taxonomy, etc.)

**Phase 1 requirements**
- Role assignment UI (required Phase 1 per Aarti)
- Admin-defined course shells with structured organization (faculty create folders within their own course only — admin sets the shell)

---

## P4 — Department Chair (pre-publication approver)

**Who:** chairs a department; reviews/approves high-stakes assessments before they're administered.
**Phase 1 surfaces:** Pre-publication assessment approval queue.

**Goals**
- Catch low-quality items before they hit students
- Provide a defensible review trail for accreditors

**Constraints (per Aarti 2026-05-07)**
- This is a SECONDARY feature — Vishakha-driven, Aarti-approved as not-a-blocker
- Don't mandate approval — silent gate. If faculty wants to administer pending-approval, system says "just so you know this is still pending approval" but allows it
- Render as a side widget on the assessment overview ("5 pending review, 2 reviewed"), not as the primary org axis

---

## P5 — Student (Assessment Taker)

**Who:** students taking exams via the Assessment Taker app.
**Phase 1 surfaces:** Active assessments first → exam delivery; past assessments + analytics secondary.

**Goals**
- Find and start the assessment due now without ceremony
- Take the exam without distracting chrome (minimum UI during exam delivery)
- Review past attempts after results are published (rationales, correct answers)

**Two student entry paths (both must work)**
1. Email link entry (clicked from notification)
2. Direct login

**Lockdown architecture** is present in Phase 1 (`ReviewSession.tsx` placeholder). Vendor selection: Q4 2026 / Jan 2027.

**Scheduled review sessions** (post-publication, under lockdown): students log back in to see the exam with correct answers and rationales. Copy/screenshot blocked at app level (vendor lockdown reinforces).

---

## P6 — Curriculum / Program Leadership (Phase 2 / 2027)

**Who:** program directors, curriculum committee chairs — the audience for cross-course cumulative competency reporting.
**Phase 2 surface:** Three-tier cumulative competency reporting at the program level (tier 3).

**Phase 1 boundaries**
- Tier 1 (per-assessment) and Tier 2 (course-level cumulative) ship in Phase 1
- Tier 3 (program-level cumulative) is the 2027 differentiator — design for it, deliver phased

---

## Roles NOT in Phase 1

- Adjunct faculty (TBD — patterning may follow PCE adjunct: email-only, no app login)
- Department chair beyond pre-publication review
- Coordinator role (no equivalent surfaced yet — may emerge if chair-approval queue volume requires it)
- Student parents/guardians (no use case identified)

These open up via the intake skill if a meeting reveals a new persona behavior.
