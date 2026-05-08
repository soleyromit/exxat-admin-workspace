# PCE — Personas

Source: HANDOFF.md §2. This file holds long-form persona detail. Goals, frustrations, JTBD per persona.

> Maintained by the intake skill via INTAKE-001 (Granola refs) and INTAKE-002 (decisions referencing personas).

---

## P3 — Program Director (PD)

**Who:** runs an accredited program; holds CAPTE/ARC-PA reaffirmation responsibility.
**Phase 1 surfaces:** Dashboard, Templates, Question Banks, All Results, CQI Log.

**Goals**
- Know which courses are at risk before accreditation visit, not after
- Author and version templates without breaking longitudinal trend continuity
- Produce CAPTE 2C export in <10 minutes when reaffirmation cycle starts

**Frustrations (current state)**
- "I'm reading 40 PDFs to find the 3 courses that actually need attention"
- Anthology can't compare term-to-term without re-running queries
- Faculty self-reflection is unstructured Word doc that nobody reads

**Jobs to be done**
- Every Monday: see 3 courses that drifted vs prior term + one-click drill-in
- Every action created in CQI must have a reassess date the system enforces

---

## P4 — Curriculum Committee Chair (CCC)

**Who:** chairs the curriculum committee; meets monthly; reports to faculty senate.
**Phase 1 surfaces:** Multi-cohort trends (4+ terms), Competency coverage matrix, Cross-course themes.

**Goals**
- Identify systemic curricular gaps (a competency that no course covers well)
- Surface themes across the program (faculty in same area trending similar)

**Frustrations**
- Per-course views miss the systemic pattern
- Theme coding is manual (PD reads open-text, codes themes, presents in committee)

**Jobs to be done**
- Pull "competencies trending below threshold for 3+ terms" with one filter
- Auto-grouped open-text themes (LLM-clustered) so committee discusses the pattern, not the data

---

## P5 — Department Chair

**Who:** chairs an academic department; writes annual reviews using teaching scores.
**Phase 1 surfaces:** Faculty roster + Faculty dossier with longitudinal scores.

**Goals**
- Defensible teaching scores for annual review (department-normed, not raw)
- Fairness — low-N courses don't unfairly drag a faculty score

**Frustrations**
- Faculty contest scores; chair needs comparison context
- PT vs FT vs adjunct workloads not normalized

**Jobs to be done**
- Per-faculty 5-term trend with department median overlay
- Workload-adjusted comparison (course size, course type, adjunct flag)

---

## P6 — DCE (Director of Clinical Education)

**Who:** runs clinical placement program; coordinates with site preceptors.
**Phase 1 surfaces:** Clinical dashboard, Cohort readiness facets.

**Goals**
- Know which clinical rotations had didactic prep gaps
- Surface cohort readiness facets (skills, professionalism, communication) heading into clinic

**Frustrations**
- Didactic feedback arrives after clinical rotations start
- Site preceptor feedback (collected separately in Learning Activities) doesn't tie back to didactic

**Jobs to be done**
- Quick "which cohort skills are weakest going into next rotation" view
- Cross-cohort didactic ↔ clinical correlation (Phase 2)

---

## P7 — Course Director / Faculty

**Who:** teaches the course, owns the course outcomes.
**Phase 1 surfaces:** My results (grade-locked), Reflection, Notes for next cohort.

**Goals**
- See own results before peer comparisons
- Write a meaningful reflection without it feeling like a punishment exercise

**Frustrations**
- Survey results show up before grades are posted (timing pressure)
- Reflection prompt is vague ("what will you change?") — no scaffolding

**Jobs to be done**
- Grade-locked self-view with 5-term trend
- Structured reflection (3 questions) that produces a 2-sentence next-cohort note for the welcome screen of next term's survey

---

## P8 — Adjunct Faculty

**Who:** part-time / clinical adjunct.
**Phase 1 surfaces:** email digest preview only — **no app login per PRD**.

**Goals**
- See own course feedback via email
- Don't manage another login

**Jobs to be done**
- Receive a digest email after grade lock window closes — that's it.

---

## P9 — Program Coordinator

**Who:** operations role; ~80% of effort across program admin.
**Phase 1 surfaces:** Setup wizard, Live monitor, Audit trail.

**Goals**
- Autopilot covers 90% of the term; handle exceptions only
- Audit trail proves anonymity + timing compliance

**Frustrations**
- Cross-listed courses break automation
- Late grade posts cascade into late surveys

**Jobs to be done**
- One screen per term that shows: courses on track, courses with exceptions, courses pending grade post
- Audit trail export for any term, any course, any time range

---

## P10 — Student

**Who:** the student in the course.
**Phase 1 surfaces:** Mobile shell with anonymity badge, two-section form, prior-cohort feedback note.

**Goals**
- Give honest feedback without identifying themselves
- Know that prior cohorts' feedback shaped the course they took

**Frustrations**
- "Why am I doing this 8 times?" (one survey per course, end-of-term cluster)
- "Will the faculty know it's me from my writing?"

**Jobs to be done**
- 5–7 minutes per course, mobile-first, two sections (course + faculty)
- Welcome screen shows the 2-sentence note from this faculty's last cohort — proves the loop closes
