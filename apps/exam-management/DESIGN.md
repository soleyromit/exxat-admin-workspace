# DESIGN.md — Exam Management

> Extends `/Users/romitsoley/Work/DESIGN.md` (workspace v0.1.0).
> L2 layer: product strategy, personas, workflows, content. L0/L4 rules inherit unchanged.

**Version:** 0.1.0 (2026-05-08)
**Owner:** Romit Soley
**Phase:** Phase 1 — be better than ExamSoft on day one; build with a 2027 vision

---

## 1. North star

> "Replace ExamSoft as the default exam platform for accredited health-sciences programs by building five differentiators ExamSoft doesn't have, while staying at parity on the core exam-creation and delivery features faculty already expect."

The 2027 vision (per Aarti's email): a curricular assessment loop where standards, course objectives, exam questions, and assessment scores form a closed system. Phase 1 ships the foundation: course-centric faculty home, embedded workflow intelligence, AI-aided question creation with gap analysis, and pre-publication chair approval.

## 2. Principles

| # | Principle | Source | Enforced by |
|---|---|---|---|
| 1 | **Faculty home is course-centric, not bank-centric** | Aarti email | "My courses" lands first; QB is admin scope; faculty access questions through their courses |
| 2 | **Independent entities, association tables** | Aarti email | Courses, students, faculty, questions, assessments, competencies, standards exist independently; UI constraints layer on top, not in data model |
| 3 | **Workflow approval is secondary, not primary** | Aarti 2026-05-07 | Pre-publication chair review is a side widget, not the org axis. Don't hard-block — surface "still pending approval" but allow administer |
| 4 | **Group by completion, not by workflow** | Aarti 2026-05-07 | Assessment overview groups by Ongoing → Scheduled → Not yet scheduled → Completed |
| 5 | **AI generates, faculty validates** | Aarti 2026-05-07 | Recycle 90–95% of questions per exam; AI-generated content goes through faculty review before assessment use |
| 6 | **Tagging is one-way only** | Aarti 2026-05-07 | Avoid the Prism mistake (attributes vs curriculum mapping = two ways = confusion). Use Gmail-style nested labels |
| 7 | **Embedded workflow intelligence** | Aarti email (5 differentiators) | Point-biserial, difficulty, negative-performing Qs surface at decision-time, not in separate reports |
| 8 | **Three-tier competency reporting** | Aarti email | (a) per-assessment, (b) course-level cumulative, (c) program-level cumulative — third tier 2027 |

## 3. Personas

Source: Aarti's decisions (memory: project_exam_aarti_decisions, project_exam_aarti_may7) and CLAUDE.md. Full detail at `apps/exam-management/docs/personas.md`.

| # | Persona | Phase 1? | Primary surface |
|---|---|---|---|
| 1 | Faculty (Edit) | ✓ | My Courses → Course (Questions / Assessments / Students / Accommodations) |
| 2 | Faculty (Read-only) | ✓ | Same surface as Edit, view-only on assigned courses |
| 3 | Admin | ✓ | Global Question Bank, Role assignment, Cross-course settings |
| 4 | Department Chair | ✓ | Pre-publication assessment approval queue |
| 5 | Student (Assessment Taker) | ✓ | Active assessments → exam delivery; Past assessments + analytics secondary |
| 6 | Curriculum/Program leadership | Phase 2 (2027) | Cross-course cumulative competency reporting |

## 4. Workflows

Detail at `apps/exam-management/docs/workflows/`. Five canonical flows for Phase 1:

1. **Faculty entry** (PRISM tile OR direct exam-management login) → My Courses
2. **Question authoring** — QB sandbox; AI-aided creation (lecture upload, LMS pull, NL prompt); faculty validates
3. **Assessment building** — pull from QB; ad-hoc questions in builder as fallback; topic-first then objective
4. **Pre-publication review** (Chair) — silent gate; pending approval doesn't hard-block administer
5. **Assessment delivery** (Assessment Taker) — active-first landing; lockdown architecture present, vendor TBD Q4 2026 / Jan 2027
6. **Results publication** — faculty-controlled; low-stakes can show immediately, high-stakes get 3–4 day faculty review window
7. **Scheduled review session** (post-publication) — students log back in to see exam with answers + rationales, copy/screenshot blocked

## 5. Content (voice + glossary)

Detail at `apps/exam-management/docs/content.md`. Voice for exam-management:

- **Tone:** clinical-formal (admin), supportive-but-decisive (faculty), task-focused (student during exam — minimum chrome)
- **Reading level:** domain-fluent for faculty/admin; grade 10 for student during exam
- **Glossary:** point-biserial, item difficulty, negative-performing Q, three-tier competency, lockdown, scheduled review session, AI gap analysis (assessment-level vs bank-level), labels (Gmail-style), pop quiz workflow

## 6. Five differentiators over ExamSoft

These are the bets. Track each as a workstream.

| # | Differentiator | Phase 1 status |
|---|---|---|
| 1 | Embedded workflow intelligence (point-biserial, difficulty, negative-performing Qs at decision time) | Active build |
| 2 | AI-assisted question creation against curriculum objectives + gap detection | Active build (was deferred PRD #3-4, now P1) |
| 3 | Pre-publication chair/admin approval on assessments | Active build (Vishakha-driven, Aarti-approved as secondary feature) |
| 4 | Curricular assessment loop (objectives ↔ questions ↔ performance, three-way data model) | Foundation in Phase 1; full loop 2027 |
| 5 | Cross-course cumulative competency reporting (three-tier) | Tiers 1–2 Phase 1; tier 3 (program-level) 2027 |

## 7. Active build status

| Area | Status | Path |
|---|---|---|
| Admin app (Question Bank hub) | Active build | `apps/exam-management/admin/` |
| Assessment Taker (Vite, exam delivery UI) | Active build | `apps/exam-management/assessment-taker/` |
| Student (Next.js) | Scaffolded · empty | `apps/exam-management/student/` |
| Lockdown browser | Architecture present, vendor TBD | `pages/ReviewSession.tsx` (placeholder) |

**Design reference:** https://www.magicpatterns.com/c/kq8sem88owbpxfzmopj8in/preview

## 8. Open product questions

- **Pop quiz workflow** — separate "Lecture" surface vs. start-inline from create-assessment? (decision pending)
- **Course content / lectures** — Canvas has it, we don't; do we need a lectures surface?
- **Standalone assessments** — preserve technical flexibility, discourage in UI; surveying academic contacts for real-world need

## 9. Curricular Assessment Loop (Aarti's mind map)

The 2027 north star. 5 columns:

```
A — Why is content taught   →  Standards / competencies
B — How is content taught   →  Course objectives
C — Test understanding       →  Exam questions
D — Did they learn?          →  Assessment scores
E — Loop D back to B         →  Tweak curriculum or support individual students
```

**Three insights to surface (the differentiator):**
- **Taught but not assessed** — objective covered, no questions test it
- **Assessed but not taught** — questions exist, no objective covers them (unfair to students)
- **Neither taught nor assessed** — undercovered standard (most critical)

Phase 1 priority: question→standard mapping (parity with ExamSoft).
Phase 1 differentiator: question→course-objective mapping (closes the loop).

## 10. How to extend this file

Same as `/DESIGN.md` §9: ADRs first, then update this file on Accept. New persona → personas.md detail. New workflow → workflows/<flow>.md.
