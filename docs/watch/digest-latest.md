# PRD Watcher Digest — 2026-05-23 09:00

## Changes applied (1)
- **BUILD-STATUS updated from Nipun roadmap Excel** — Added two new exam-management feature rows: "Setup — Logo, LMS integration, RBAC, Import Courses" (🟡 In Progress) and "Base entities — Faculty, Students" (🟡 In Progress). Last updated date bumped to 2026-05-23.

## Flagged for your review (9)

### PCE
1. **Distribute Survey wizard steps now defined** — 5-step wizard confirmed: Properties/Details → Distribution → Survey Design → Communication → Report Access. Will drive stepper component when Distribute Survey page is built.
2. **Shared Platform Architecture added under Analytics** — New section notes that PCE and General Surveys share Survey type, Template engine, Distribution engine, Analytics foundation. AMBIGUOUS — ask Monil if this means shared DB tables/APIs or just shared UI patterns.
3. **Limitation of Current Survey Capability section added** — Context addition documenting 3 current survey limitations (no bulk push, auto-render sections, access control within form). Non-functional, no code action.
4. **Dependency renamed: SIS/course roster integration → SIS/LMS** — Risk text simplified. Scope of dependency broadened. Informational.

### Exam Management
5. **New roadmap items: Setup + Base entities** — Both added to BUILD-STATUS (applied above). Confirm with Nipun whether these need UI or are backend-only.
6. **"Question bank on screen analytics" removed from Excel** — Was previously listed as TBD. Now gone. Confirm with Nipun: descoped, deferred, or renamed?
7. **Assessment Distribution ETA: 27-May** — Concrete design-readiness target set.
8. **Question Import category renamed: Onboarding → Question Bank** — Implies import is part of QB feature, not a one-time onboarding flow.
9. **Stakeholder Alignment column added; Question Creation has open "Alignment Points"** — Unknown alignment gaps for Question Creation (Manual & AI). Ask Nipun.

## FERPA/HIPAA alerts
- **pce-decision-009 extracted**: "We will just track submission and not the responses" — FERPA implication confirmed and now in stakeholder-decisions.json. No student response content stored. This is correctly handled in PRD Non-Functional Requirements.

## New docs discovered (0)
None (inbox.txt was empty / not present)

## New decisions extracted (3)
- **pce-decision-007**: Re-design Surveys so that Course Evaluation and Survey can co-exist.
- **pce-decision-008**: Three new constructs introduced — Survey type (mandatory), Course type (optional), Subject (per section).
- **pce-decision-009**: Track submission only, not responses (FERPA-safe). ⚠️ FERPA implication noted.

## Auth status
✅ M365 authenticated — 4 docs synced (pce-prd-monil, exam-roadmap-nipun, exam-prd-nipun, exam-management-1779040819474)

---
*PCE PRD: changes detected — 4 flagged, 3 decisions extracted. Exam Roadmap: 2 applied to BUILD-STATUS, 5 flagged. Exam PRD (Assessment Builder): no changes.*
