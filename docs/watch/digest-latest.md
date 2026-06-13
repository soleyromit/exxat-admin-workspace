# PRD Watcher Digest — 2026-06-13

## Changes applied (0)
None — all CLEAR changes this run had no existing product code to update (PCE template builder course type selector not yet built; scope decisions are non-code).

## Flagged for your review (5)

- **PCE — CRITICAL** Course types renamed: `Didactic / Clinical` → `Practice / Classroom / Lab` (3 types now). Supersedes pce-decision-008 and pce-decision-016. See `docs/watch/flags/pce.md` 2026-06-13 Flag 1.
- **PCE — CRITICAL** Two new Key Product Decisions added: "Focus on selling independently Q2 2027" (pce-decision-020) and "No Student login till Q3 2027" (pce-decision-021). Student app (apps/pce/student/) may be out of Phase 1 scope. See Flag 2.
- **PCE** §13a.5 resolved: User profile confirmed at bottom-left per DS convention. Closes prior AMBIGUOUS flag from 2026-06-09. No action needed.
- **PCE** Multiple §13 design feedback items marked "(Done)" in PRD — §13a.2, §13a.4, §13b.1–3, §13c.1–2 all acknowledged by Monil. Non-functional.
- **Exam Management** "POC" and "POC Completed" status annotations added to Nipun's roadmap rows — new status type not in BUILD-STATUS mapping. Ask Nipun which features these apply to.

## FERPA/HIPAA alerts
None today.

## New docs discovered (0)
None — inbox was empty.

## Auth status
✅ M365 authenticated — 4 docs synced

| Doc | Changes |
|---|---|
| PCE PRD — Monil Pokar | Course types renamed (Didactic/Clinical → Practice/Classroom/Lab), 2 new decisions (6 & 7), §13 (Done) annotations |
| Exam Mgmt Roadmap — Nipun (Excel) | POC/POC Completed status annotations added to roadmap rows |
| Roadmap-Exam-Management (same file) | Same as above |
| Assessment Builder PRD — Nipun | No changes |

## Decisions extracted (4)
- **pce-decision-019**: Course types updated to Practice / Classroom / Lab (supersedes pce-decision-008)
- **pce-decision-020**: Focus on selling PCE independently Q2 2027
- **pce-decision-021**: No Student login till Q3 2027 (significant Phase 1 scope signal)
- **pce-decision-022**: Course type auto-assignment updated to Practice/Classroom/Lab names (supersedes pce-decision-016)

---

### Open items carried forward (not new flags — from prior runs)
- 8 Exam Roadmap open questions (all due 04-Jun-26, now overdue) remain unresolved. Questions 3 and 5 have FERPA-adjacent implications — confirm with Nipun/Darshan.
- PCE §13c.2 Report Access contradiction still unresolved — §4 lists it as step 5; §13c.2 removes it. Now marked (Done) in §13 but §4 text unchanged. Resolve before building wizard.
- PCE Flow 2b (AI Native / Run Evaluation) scope vs. 5-step wizard still awaiting Monil clarification.
- Course Offering engineering target 12-Jun (Darshan) — confirm design refinement status.
