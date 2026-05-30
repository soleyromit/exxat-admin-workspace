# PRD Watcher Digest — 2026-05-30 09:00

## Changes applied (1)

- **PCE survey status labels** — Updated 4 labels across `pce-badges.tsx`, `surveys/page.tsx`, and `my-surveys/page.tsx` to match the formal "Status of a Survey" table now in PCE PRD §4: `active` → "Scheduled", `collecting` → "Live", `pending_review` → "Closed, Pending Review", `released` → "Closed, Results Available".

## Flagged for your review (2)

### PCE
1. **Section 13 "Feedback on Designs" added** — Monil added a new design feedback section with open layout questions: how to position CE vs General Surveys, whether Moderation should move out of the sidebar into a status-based master list view, and FAAS UI constraint for question creation (question design uses existing FAAS UI; subject assignment step is outside FAAS). Needs a call with Monil to confirm sidebar restructure scope. See `docs/watch/flags/pce.md`.

2. **Wizard Step 2 renamed "Create Survey"; substep 2 renamed "Scope/Courses"** — Section heading changed from "Distribute Survey" to "Create Survey". Wizard substep 2 changed from "Distribution" to "Scope/Courses". Communication and Report Access steps now explicitly marked as newly added (steps 4 and 5). No code change needed (code already uses CreateSurvey terminology). When building the /surveys/push wizard, use "Scope/Courses" as the label for step 2. See `docs/watch/flags/pce.md`.

## FERPA/HIPAA alerts

None today.

## New docs discovered (0)

None (inbox was empty).

## New decisions extracted (0)

No new decision statements found in PRDs this run (status table additions are structural, not decision statements per Step 6 criteria).

## Auth status
✅ M365 authenticated — 4 docs synced (pce-prd-monil, exam-roadmap-nipun, exam-prd-nipun, exam-management-1779040819474)

---
*PCE PRD: 1 clear change applied (status labels), 2 flagged. Exam Roadmap Excel: no status changes (all still In Progress) — BUILD-STATUS last-updated date bumped to 2026-05-30. Exam PRD (Assessment Builder): no changes.*
