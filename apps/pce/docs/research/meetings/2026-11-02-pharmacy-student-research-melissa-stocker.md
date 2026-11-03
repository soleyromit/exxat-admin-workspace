---
type: meeting
date: 2026-11-02
product: pce
participants: [Romit Soley, Kanthi Supriya, Ruchi Laliwala, Melissa Stocker (external — pharmacy student)]
source: granola
granola_id: cca82a3f-bba9-42d9-aa5b-a2535f26983d
---

# Pharmacy Student Research Interview — Exxat x Melissa Stocker — 2026-11-02

**Date:** 2026-11-02 2:00 PM EST  
**Participants:** Romit Soley (Design), Kanthi Supriya (Exxat), Ruchi Laliwala (Exxat), Melissa Stocker (P4 pharmacy student, Drake University — external research participant)  
**Topic:** User research — pharmacy student experience with clinical rotation platforms (CoreLM, Blackboard), APPE workflow, EPA tracking, case logs, rotation scheduling  
**Format:** Discovery research interview

---

## Summary

Melissa Stocker is a P4 (4th year) pharmacy student at Drake University currently in her 5th APPE (Advanced Pharmacy Practice Experience) block at Blessing Hospital. This session explored her day-to-day use of CoreLM and Blackboard for rotation management, case log submission, EPA self-evaluations, and the rotation scheduling/preference process. Key findings: two-platform split creates confusion, case logs are not tailored to rotation type, rotation preferences are still paper-based, and EPA tracking is preceptor-driven with limited institutional standardization. Melissa keeps her own offline spreadsheet as a backup because CORE access expires after graduation.

---

## Platform landscape

| Platform | Used for | Pain level |
|---|---|---|
| CoreLM (competitor) | Evals, case logs, IPPE/APPE tracking | Medium — not user-friendly, confusing uploads |
| Blackboard (competitor) | Course assignments, reflections, NAPLEX study proof | Medium — two platforms = confusion about which to use |

---

## Key research insights

### Rotation workflow
- Drake requires 9 APPE blocks (200 hours each), with 1 off block. Required: 4 core rotations, 2 faculty, rest electives.
- Hours are not logged for APPEs — Drake expects 40 hrs/week and preceptor notifies Drake only if student misses a day.
- Case logs: minimum 10 per block, no maximum. Student can submit as many as they want.
- Evaluations: mid-rotation self-eval + final self-eval + final preceptor eval + site eval.

### EPA tracking
- Drake uses EPAs (Entrustable Professional Activities) — 5 components: collect, assess, plan, implement, follow up.
- Target level: "completes with reactive or intermittent supervision" by end of year.
- EPAs are generic across rotation types — not tailored to setting (inpatient vs. outpatient).
- Preceptors do weekly check-ins with students using the CORE self-eval tool together.

### Rotation scheduling / preference
- Rotation preference submission is paper-based (not in CORE). Deadline ~November 1st. Results given by February.
- CORE shows available sites (long list: preceptor name, rotation type, availability) — no alternatives or match suggestions shown to student.
- Drake uses a match-like algorithm on the backend — students submit top preferences on paper, system attempts to match.
- Students cannot update preferences after scheduling is set in February.

### Pain points surfaced
1. **Two-platform split**: "Having a more streamlined approach… it's hard to remember if the assignment was on Blackboard or do I need to submit it on Core."
2. **Case log upload UX**: "It's hard to figure out if it was uploaded or not. You can't really tell how many times you've submitted it." Uploading PDFs is "a pain."
3. **Sensitive document restrictions**: Drug screen and background check can't be uploaded to CORE (not stored there). Creates fragmented compliance document management.
4. **Case logs not tailored by rotation type**: Same log form for outpatient substance use and acute care. Melissa wants rotation-type-aware log fields.
5. **No longitudinal skill/competency view**: Industry pain point — "the industry has not progressed a lot." No tool today shows a student's complete picture across rotations.
6. **Loss of access after graduation**: Melissa maintains her own spreadsheet because CORE access expires. "I kind of want to make sure that I have those records."
7. **Paper-based preferences**: Rotation scheduling preferences submitted on paper — not tracked in CORE at all.

### What works
- Preceptor access to CORE alongside student for weekly check-ins (collaborative eval)
- Broad institutional goals (not overly prescriptive) allow preceptors to tailor to their setting
- Drake provides comprehensive library access (Micromedex, LexiComp, Access Pharmacy) accessible from any rotation site

---

## Implications for PCE product

| Insight | Design implication |
|---|---|
| Two-platform confusion | Single consolidated student hub is a differentiator vs. CoreLM + Blackboard split |
| Case log upload UX is confusing | File upload states (pending/uploaded/verified) must be explicit and confirmed |
| Case logs not tailored by rotation type | Case log templates should adapt to rotation setting/type |
| No longitudinal competency view | Longitudinal skill tracking across rotations is unmet market need |
| Paper-based preferences | Digital preference submission with match visibility is a clear gap to fill |
| Student loses data access after graduation | Consider exportable portfolio/record that persists beyond enrollment |
| EPA evaluation: student + preceptor together | Shared eval review mode (both viewing same record simultaneously) is valued |

---

## No direct design directives in this meeting

This was discovery research. No decisions were made that require screen changes. All insights feed into PCE product strategy and persona documentation.

---

## Design tasks generated

See `apps/pce/docs/workflows/_backlog.md` — research insights logged for future feature planning.
