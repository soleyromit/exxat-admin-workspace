---
type: meeting
date: 2026-08-12
product: pce
participants: [Romit Soley, PM/colleague (unidentified)]
source: granola
granola_id: 0ef80c33-115a-4909-b408-a7909785c41d
---

# PCE — Course Evaluation Survey: Roles, Status Tracking, Response Rate Thresholds — 2026-08-12

**Date:** 2026-08-12 1:39 PM EDT
**Participants:** Romit (designer, note creator); a PM/colleague reviewer ("Them" in transcript). Vishal referenced as a separate party to align with.

---

## Topics covered

1. Five roles defined for course evaluation: super user, admin/setup, program director/content, course affiliation, and role with ghost mastery
2. Board view vs. table view — same statuses, status label consistency required
3. Board: five stages for survey lifecycle
4. Response rate thresholds — three-tier color coding with configurable validity and desired thresholds
5. Extension: rare but should be highlighted when a course date differs from term date
6. Countdown to close date ("closes today" / "closes in N days")
7. Faculty display — color-coded person icons by role
8. Draft state labels: "No surveys configured" rather than empty/null
9. Action placement: where to put view results, preview, reminders, extend date
10. Archive/inactivate as an error-recovery mechanism (not delete)

---

## Decisions

| ID | Decision | Product | Notes |
|---|---|---|---|
| D_PCE_0812B_01 | **Three-tier response rate coloring with two configurable school-level thresholds.** Every school can define: (1) validity threshold — below this the survey is not statistically valid for comparative analysis; (2) desired participation rate — above this is green. Three color bands: below validity = red (not yet valid); between validity and desired = orange (in progress); above desired = green (good). Both thresholds are school-configurable. "That percentage needs to be editable by each school." | pce | T167 |
| D_PCE_0812B_02 | **Extension highlighted when course close date differs from term close date.** Extensions are rare. When a course has been given an extended close date beyond the term default, highlight it with a star or distinct indicator. "Extensions are rare and extension should be highlighted. Generally speaking, everything will be closing at the same time." | pce | T168 |
| D_PCE_0812B_03 | **Status labels must be identical between table view and board view.** The board (kanban) and table show the same data. Whatever status names appear in the board column headers must match the status labels in the table. "I just wanted the statuses here to reflect the boards there." Consistency is not optional — a mismatch confuses admin. | pce | T169 |
| D_PCE_0812B_04 | **Countdown label for live surveys** ("closes today" / "closes in N days"). For surveys in collecting/live status, show a relative countdown next to the close date. This helps admin understand urgency at a glance. Reviewer: "Isn't something like that a good idea to show... closes today versus closes in five days or whatever." Both parties agreed. | pce | T170 |
| D_PCE_0812B_05 | **Faculty display in survey/course list: color-coded by role.** Person icon avatars in the survey list instructor column can be color-coded by role type (e.g. course coordinator in one color, instructor in another). "Color code the icons based on the thing. So it shows the number of icons will never be 25. It will be four, five, three, two, one, whatever. So it's always going to be possible to fit those items in there. And then all you do is color code the icons based on the thing." Supplements T101. | pce | T171 |
| D_PCE_0812B_06 | **Five survey lifecycle stages confirmed.** Board and table must both reflect these five states in order: Draft → Scheduled → Live/Collecting → Closed Pending Review → Results Available. Current production code uses: draft, active, collecting, pending_review, released. Align labels. | pce | T169 (supplements) |
| D_PCE_0812B_07 | **Admin action placement: adaptive per status.** The primary action shown next to a survey row should adapt to current status. Draft → "Preview". Live → "Send Reminder" (primary), "Extend Date". Closed pending review → "Review & Release". Admin should not have to hunt for the right action for their current task. | pce | T172 (supplements) |
| D_PCE_0812B_08 | **Archive/inactivate instead of delete for error recovery.** When an admin activates a survey by mistake or attaches the wrong faculty/course, they need an "archive" or "inactivate" mechanism. Delete is not an option. "Not a common practice, but mistakes happen." | pce | T173 (new design task) |
| D_PCE_0812B_09 | **No surveys label / draft label must be consistent.** Whatever empty/null state label is used in the board view must match the table view. Reviewer: "Recommend using the same word here. Whatever you're showing over there, like the action attempt there and action items here have to be the same." | pce | T169 (supplements) |

---

## Verbatim quotes

> **Reviewer:** "Extensions are rare and extension should be highlighted. Generally speaking, everything will be closing at the same time."

> **Reviewer:** "That percentage needs to be editable by each school. Yes. We need to give them, like two numbers according to me at least. One is below that number, the survey is not alleged to make survey... minimum required percentage below which I think the survey is valid and then desired percentage."

> **Reviewer:** "If until it is to a point where it's not even considered valid. So like below 60 or 50 participation, it's not considered banded. Desire does 80."

> **Reviewer:** "Closes today versus closes in five days or whatever. Isn't something like that a good idea to show at the top?"

> **Reviewer:** "Color code the icons based on the thing. So it shows the number of icons will never be 25. It will be four, five, three, two, one, whatever."

> **Reviewer:** "I just wanted the statuses here to reflect the boards there. Whatever, however way you think about categorizing the standard, the statuses."

> **Romit:** "So whatever you're showing over there, like the action attempt there and action items here have to be the same. Understood. Yeah, I'll take care of it."

---

## Code cross-reference (Pass 5)

| Directive | Existing code | Gap / Status |
|---|---|---|
| D_PCE_0812B_01: Three-tier response rate coloring | `response-gauge.tsx` uses single `--brand-color` bar. No threshold logic, no configurable thresholds. | Gap. T167 added. |
| D_PCE_0812B_02: Extension indicator | No `isExtended` field in `PceSurvey` type or mock data. Deadline column shows raw date only. | Gap. T168 added. |
| D_PCE_0812B_03: Status label consistency (table = board) | Board view not in production code. `STATUS_LABELS` in `surveys/page.tsx:23` defines table labels. | Applies to prototype design. T169 added. |
| D_PCE_0812B_04: Countdown label | `surveys/page.tsx:167` shows raw deadline string. No countdown logic. | Gap. T170 added. |
| D_PCE_0812B_05: Faculty color-coded icons | `surveys/page.tsx:115–128` uses `AvatarFallback` with single `--avatar-initials-bg` token (no role-based coloring). | Gap. T171 added. |
| D_PCE_0812B_08: Archive/inactivate mechanism | Only "Close Survey" action exists (`pce-modals.tsx: CloseSurveyDialog`). No archive/inactivate. | Gap. T173 added. |

**Pass 5 verdict:** No direct code changes applied today. All gaps are design tasks for the new survey management surface.

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T167 | Response rate: implement three-tier color coding with two configurable school-level thresholds | P1 — DESIGN-REVIEW | Below validity = red (invalid). Between validity and desired = orange. Above desired = green. Thresholds configurable per school. D_PCE_0812B_01. |
| T168 | Survey list: highlight extension when course close date differs from term close date | P1 — DESIGN-REVIEW | Star or distinct indicator. Extension is rare — must stand out. D_PCE_0812B_02. |
| T169 | Status labels: enforce identical names between table view and board/kanban view | P1 — DESIGN-REVIEW | Five stages must use consistent names across both representations. Applies to prototype and future board view implementation. D_PCE_0812B_03, D_PCE_0812B_06, D_PCE_0812B_09. |
| T170 | Survey list: add countdown label for live surveys ("closes today" / "closes in N days") | P1 — DESIGN-REVIEW | Relative countdown next to close date for collecting-status surveys. Both parties agreed. D_PCE_0812B_04. |
| T171 | Survey list: faculty avatar icons — color-coded by role | P1 — DESIGN-REVIEW | Stacked avatars, each color-coded by role type (instructor vs coordinator vs other). Supplements T101. D_PCE_0812B_05. |
| T173 | Survey management: archive/inactivate mechanism for error recovery | P1 — DESIGN-REVIEW | Admin needs to cancel/inactivate an erroneously activated survey. "Archive" label preferred over "delete." D_PCE_0812B_08. |
