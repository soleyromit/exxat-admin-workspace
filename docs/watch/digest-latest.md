# PRD Watcher Digest — 2026-06-17

## Changes applied (2)

1. **PCE PRD — Course type taxonomy renamed**
   - Didactic/Clinical → Practice/Classroom/Lab (per §2 Key Decision #5, 14 Jun 2026)
   - Code updated: `apps/pce/admin/lib/pce-mock-data.ts`, `apps/pce/admin/app/(app)/analytics/page.tsx`

2. **Exam Roadmap — In Assessment Experience (Student): 🟡 In Progress → 🟢 Shipped**
   - All 3 P0-Cohere sub-items now Completed (test taking, exam initiation, post exam completion)
   - `docs/BUILD-STATUS.md` updated

## Flagged for your review (9)

### PCE (4 flags — see `docs/watch/flags/pce.md`)
1. **§2 Key Decisions #6 + #7 added** — PCE positioned as standalone commercial offering (Q2 2027); no student login until Q3 2027 (extracted to stakeholder-decisions.json as pce-decision-036 and pce-decision-037)
2. **§4 Sidebar navigation taxonomy formally specified** — full nav tree now in PRD; verify it matches current implementation
3. **§4 Step 2 Properties/Details marked "(removed)"** — confirm removal is intentional and component is dead-coded
4. **Appendix B — NIU→Anthology competitor case study added** — informational, no code impact

### Exam Management (5 flags — see `docs/watch/flags/exam-management.md`)
1. **Course Offering — 2 sub-capabilities removed from roadmap** — target date slipped to 16-Jun (past); verify scope change with Nipun
2. **New Base Entities section added** — Students entity, Faculty entity (In Progress), Settings-RBAC (To be picked); no prior tracking
3. **Question Creation + Assessment Creation status fills** — multiple items shifted to In Review / In Refinement; BUILD-STATUS rows may need updates
4. **June 23–25 EM Solution Review sessions scheduled** — milestone dates P0 15-Sep, P1 19-Dec, P2 20-Sep added; no prior tracking
5. **Stakeholder name: Laura → Kim** — informational only

## FERPA / HIPAA alerts
None this run.

## New docs discovered
None (inbox was empty).

## Auth status
✅ M365 authenticated — 4 docs synced (pce-prd-monil, exam-roadmap-nipun, exam-prd-nipun, exam-management-1779040819474)

| Entry | Changes | Action |
|---|---|---|
| PCE PRD — Monil Pokar | 4 changes: taxonomy rename + 3 new PRD sections | 1 CLEAR applied; 3 flagged |
| Exam Mgmt Roadmap — Nipun | 5 changes: In Assessment Completed + scope shifts | 1 CLEAR applied; 4 flagged |
| Assessment Builder PRD — Nipun | No changes | — |
| Roadmap-Exam-Management | Same URI as Exam Roadmap | Snapshot refreshed |

## Decisions extracted (2)
- `pce-decision-036`: PCE/CE standalone commercial offering, positioned separately from core Prism suite — Q2 2027 target (Monil Pokar, PCE PRD §2 Key Decision #6)
- `pce-decision-037`: No student login for PCE/CE until Q3 2027 — email-link-only distribution in phase 1 and 2 (Monil Pokar, PCE PRD §2 Key Decision #7)

---

### Open items carried forward (from prior runs)
- 8 Exam Roadmap open questions (all due 04-Jun-26, overdue) remain unresolved. Questions 3 and 5 have FERPA-adjacent implications — confirm with Nipun/Darshan.
- PCE §13c.2 Report Access contradiction still unresolved — §4 lists it as step 5; §13c.2 removes it. Resolve before building wizard.
- PCE Flow 2b (AI Native / Run Evaluation) scope vs. 5-step wizard still awaiting Monil clarification.
- PCE §13a.1 "navigation" rename (flagged 2026-06-11) — confirm with Monil what pattern "navigation" refers to before building sidebar routing.
