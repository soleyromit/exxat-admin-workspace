# Exam Management — Personas

Source: Aarti's email (early May 2026), Aarti's 2026-05-07 meetings, `apps/exam-management/CLAUDE.md`. Maintained by the intake skill via INTAKE-001 and INTAKE-002.

---

> **Restructured 2026-05-08 per Aarti (workspace ADR-004 + Exam Mgmt ADR-001).** Phase 1 collapses to 3 view tiers (admin/faculty/student). Sub-archetypes documented below for design context.

---

## V2 — Faculty (sub-archetypes within the Faculty view)

Faculty view is one nav shell. Sub-archetypes inform feature priority within it.

## F1 — Course Director (default sub-archetype)

**Who:** "whole and soul navigator" of a course offering. Default role for any faculty assigned to a course offering.
**Capabilities:** full CRUD on Questions, Assessments, Students (roster), Accommodations [read-only inherited per workspace ADR-006]. Can add Collaborators **if admin granted that permission** per Exam Mgmt ADR-002.
**Phase 1 surfaces:** My Course Offerings landing → per-course-offering (Questions · Assessments · Students · Accommodations).
**Cannot:** add courses, add terms, create master entities (per Exam Mgmt ADR-001).

**Goals**
- Land on My Course Offerings (not the global question bank)
- Author and recycle questions efficiently — typically 90–95% recycled per exam, ~5–10% new
- Get useful diagnostic data (point-biserial, difficulty) at decision time, not in a separate report
- Course-level question-bank gap analysis: "is my QB covering what this course teaches?" (per Exam Mgmt ADR-005, pending)

**Jobs to be done**
- Land on My Course Offerings → drill into one → 4-section view (Questions · Assessments · Students · Accommodations)
- Build assessment from QB (primary) or ad-hoc in builder (fallback for "need 5 more")
- Tag every question to content area / competency / objective at creation time
- See course-level QB gap signals; "Generate more with AI" CTA per gap, fed by course materials (syllabus, lecture, textbook chapter)

**Two faculty entry paths (both must work)**
1. Module launcher tile (replaces PRISM faculty module per workspace ADR-003)
2. Direct exam-management login

---

## F2 — Instructor (sub-archetype)

**Who:** faculty assigned to a course offering with narrower capabilities than Course Director.
**Phase 1 capabilities (TBD with Vishakha + PMs):** the 3–4 default role variants Aarti called for. Possible variants:
- Can create assessments but not view results
- Can create questions but not assessments
- Can view results but not create content

Exact set requires R7 from 2026-05-08 audit (permissions matrix).

## F3 — Collaborator (new sub-archetype, 2026-05-08)

**Who:** a faculty added to a course by another faculty (Course Director) with admin-granted permission.
**Capabilities:** depends on the role granted by the Course Director (subject to admin-set ceiling). Use case: lecture co-presenter, question bank contributor, second-reader.
**Phase 1:** designable as the role-assignment UI per Exam Mgmt ADR-002.

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
