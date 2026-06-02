# PRD Watcher Digest — 2026-06-02

## Changes applied (1)
- BUILD-STATUS.md last updated date bumped to 2026-06-02 (Nipun Excel processed; no feature status changes per step-7b mapping — Excel uses Aligned/Review Pending, not Completed/In Progress)

## Flagged for your review (6)

### PCE
1. **[AMBIGUOUS] Key Product Decision 2 — PRISM dependency sub-bullets added** — "Dependency on availability of course offerings in PRISM" and "This will not work for schools that don't have term and course data in PRISM." No fallback path defined for non-Prism schools. Confirm with Monil whether a manual data-entry path is planned for Phase 1. See `docs/watch/flags/pce.md`.

2. **[NEW SCOPE] Flow 2b — Entire AI Native / Run Evaluation flow added** — New comprehensive AI-native evaluate distribution flow with Leo agent, animated audit panel, per-course tile states (Ready/Fix), conditional Push Surveys button. May supersede or complement the 5-step wizard (Flow 2a). Confirm with Monil which flow is primary for Phase 1. See `docs/watch/flags/pce.md`.

3. **[CLEAR] Step 3 — Instructor section renders per instructor count** — The Instructor section in the student survey renders N times based on how many instructors are assigned to the course. No code action (student app not yet built). Implement when building apps/pce/student/. See `docs/watch/flags/pce.md`.

4. **[CLEAR] Step 3 — Submitted surveys remain visible to students** — After submission, the survey stays visible in the student portal with Submitted state shown (not hidden). Student-facing display change. Implement when building apps/pce/student/. See `docs/watch/flags/pce.md`.

### Exam Management
5. **[CLEAR] Business alignment confirmed for 2 features** — Assessment Creation & Distribution and In Assessment Experience both moved from Review Pending → ✅ Aligned. Engineering can proceed without further business sign-off on these features. See `docs/watch/flags/exam-management.md`.

6. **[URGENT] In Assessment Experience engineering 🔴 Blocked — 4th June design unblock target** — Comment: "To continue on 4th June post design unblock." 15th June delivery targets also added for QB (QA) and Assessment Creation & Distribution. Check what design asset is needed to unblock engineering ASAP. See `docs/watch/flags/exam-management.md`.

## FERPA/HIPAA alerts
None today.

## New docs discovered (0)
None (inbox was empty).

## New decisions extracted (1)
- **pce-decision-018** — FAAS UI will be used as-is for PCE template question creation. Trade-off is user experience (FAAS follows old DS, CE is on new DS). Source: PCE PRD §12 Dependencies and Risks.

## Auth status
✅ M365 authenticated — 4 docs synced

| Entry | Type | Changes |
|---|---|---|
| PCE PRD — Monil Pokar | direct | 4 flagged (Flow 2b new scope, PRISM dependency, Step 3 x2); 1 decision extracted |
| Exam Mgmt Roadmap — Nipun | excel-manifest | 2 flagged (alignment confirmed, engineering blocked); BUILD-STATUS date updated |
| Assessment Builder PRD — Nipun | direct | No changes |
| Roadmap-Exam-Management | direct | Same Excel as above — no additional changes |
