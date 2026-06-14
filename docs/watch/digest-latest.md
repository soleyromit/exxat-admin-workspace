# PRD Watcher Digest — 2026-06-14 09:00

## Changes applied (1)
- BUILD-STATUS.md last updated date bumped to 2026-06-14 (Exam Mgmt Roadmap — Nipun; no Step 7b feature status changes this run)

## Flagged for your review (5)

### PCE (4 flags)
- **[AMBIGUOUS — ACTION REQUIRED]** Course type values changed in §2: `Didactic/Clinical` → `Practice/Classroom/Lab` — BUT §4 Step 1 still says "Didactic or Clinical". Internal PRD contradiction. Code at `pce-mock-data.ts:43` + `analytics/page.tsx:125` affected. Ask Monil to confirm which is correct before code is updated. See pce.md Flag 1.
- **[CLEAR — informational]** Two new Key Product Decisions added: (6) "Focus on selling this module independently in Q2, 2027" and (7) "No Student login till Q3, 2027 for this module". Added as pce-decision-019 and pce-decision-020. Confirm student login scope with Monil.
- **[CLEAR — resolved]** §13a.5 user profile position resolved: confirmed at bottom-left per DS. Closes 2026-06-09 Flag 2. No action needed.
- **[CLEAR — resolved]** §13 design feedback all marked (Done). CE wizard confirmed as 4 steps: Properties/Details → Scope/Courses → Survey Design → Communication. Report Access is out. Closes 2026-06-09 Flag 6.

### Exam Management (1 flag)
- **[CLEAR — informational]** Gantt chart: "POC" and "POC Completed" entries added to timeline rows. Likely Secure Browser POC completed. No BUILD-STATUS status change warranted.

## FERPA/HIPAA alerts
None today.

## New docs discovered (0)
None — inbox was empty.

## Auth status
✅ M365 authenticated — 4 docs synced

| Entry | Changes | Action |
|---|---|---|
| PCE PRD — Monil Pokar | 4 changes: course type taxonomy, decisions 6 & 7, §13 Done resolutions | 4 flags written; 2 decisions extracted; no code auto-applied |
| Exam Mgmt Roadmap — Nipun | 1 change: Gantt POC/POC Completed entries added | 1 flag written; BUILD-STATUS date bumped |
| Assessment Builder PRD — Nipun | No changes | — |
| Roadmap-Exam-Management | 1 change: same Gantt update as exam-roadmap-nipun | Snapshot updated |

---

### Open items carried forward (not new flags — from prior runs)
- **[PRIORITY]** PCE course type taxonomy conflict (§2 vs §4) — resolve with Monil before building template creation wizard. Code references exist at pce-mock-data.ts + analytics/page.tsx.
- 8 Exam Roadmap open questions (all due 04-Jun-26, now 10 days overdue) remain unresolved. Questions 3 and 5 have FERPA-adjacent implications.
- PCE Flow 2b (AI Native / Run Evaluation) vs 5-step wizard — scope not yet confirmed with Monil.
- Course Offering engineering target 12-Jun (Darshan) has now passed — check status with Nipun/Darshan.
