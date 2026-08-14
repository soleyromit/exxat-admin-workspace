---
type: meeting
date: 2026-08-13
product: exam-management
participants: [Romit Soley, Vishal, Himanshu, Vinay, Monal]
source: granola
granola_id: 7aeae56b-fd4a-4225-a751-a42fa99c8ea0
---

# Course eval design review + DS design language sync — 2026-08-13

**Date:** 2026-08-13 10:15 AM EDT
**Participants:** Romit (note-taker), Vishal (Product), Himanshu (Engineering / DS), Vinay (DS), Monal (PM)

---

## Topics covered

1. Survey distribution screen — faculty column display options (three variants to explore)
2. Survey instructions placeholder text — remove in favour of info icon + hover tooltip
3. Email template / merge fields — confusing UX; subject line and body merge fields must be separate; course name not valid in bulk-reminder subject
4. Reminder card layout — single card preferred; two-card split questioned
5. Deadline pressure — engineering handoff for course evaluation is overdue; focus on survey distribution + survey list view only
6. Himanshu walkthrough of new DS design language: compact sidebar, line-only tabs, tab overflow menu, sticky nav/headers, KPI card variants, resizable sheets, in-sheet navigation
7. Shared component set — same DS components to be used across exam-management AND course evaluation; Vinay building; engineering will pick up

---

## Decisions

### Course evaluation (product not in scope for this workspace — documented for completeness)

| ID | Decision | Product | Notes |
|---|---|---|---|
| D_CE_0813_01 | **Faculty column — three display options to evaluate.** Option A: show evaluates (Instructor/Coordinator role icons) only. Option B: show faculty names; on hover show role. Option C: show both evaluates and faculty names. Vishal: share screenshots of all three; decision offline. Not applied — course eval out of scope. | course-eval | — |
| D_CE_0813_02 | **Survey instructions placeholder text — remove.** Replace instructional placeholder with info icon + hover tooltip. Romit and Vishal agreed "things like these I don't think it's very difficult for them to understand." | course-eval | — |
| D_CE_0813_03 | **Email template — merge fields must be separate for subject vs. body.** Merge fields shown in current design are confusing because subject line merge fields differ from body merge fields. Course name is NOT valid in the bulk-reminder subject (sent across multiple courses). Must redesign — defer to email template settings section, not survey distribution workflow. | course-eval | Existing prism pattern reused — needs redesign |
| D_CE_0813_04 | **Priority: survey distribution first, survey list view second.** All else deferred. Himanshu cannot start building until survey distribution designs follow the DS. Deadline for engineering handoff was "days ago." | course-eval | Urgency flag |

### Design system — shared across exam-management and course evaluation (in scope)

| ID | Decision | Product | ADR | Notes |
|---|---|---|---|---|
| D_DS_0813_01 | **Sidebar: no card-based approach; compact layout.** Himanshu's new DS design language removes the card-style sidebar. Everything is more compact, putting more focus on data. Applies to exam-management and course-eval. | exam-management | — | Pending Vinay component release |
| D_DS_0813_02 | **Tabs: line variant only; no primary/secondary split.** All tabs use the line (underline) variant. There is no longer a separation between "primary" and "secondary" tab styling. | exam-management | — | Pending Vinay component release |
| D_DS_0813_03 | **Tab overflow: icon-based with visible label for selected; "more" menu for overflow.** When screen space is constrained, tabs collapse to icon-only mode — selected tab always shows its label. Excess tabs route to a "more" overflow menu. | exam-management | — | Pending Vinay component release |
| D_DS_0813_04 | **Sticky tabs and section/table headers on scroll.** Navigation becomes sticky as the user scrolls. Section headers and table column headers are also sticky. Himanshu: "when I'm also making the section sticky and then your list header or the table header also becomes sticky." | exam-management | — | Pending Vinay component release |
| D_DS_0813_05 | **KPI cards: more concise top portion; optional graph variants (small / medium / large).** Top KPI area is trimmed for density. Graph option can be added at small, medium, or large sizes within the card. | exam-management | — | Pending Vinay component release |
| D_DS_0813_06 | **Sheets: resizable + in-sheet data navigation without going back.** Sheets (drawers) are now resizable by the user (drag handle). Users can jump between records inside the sheet without closing it and returning to the list. Himanshu: "without going back, if you want to jump to some other data point, you can do that as well." | exam-management | — | Pending Vinay component release |
| D_DS_0813_07 | **DS component updates are now manual, not automatic.** Auto-update hook was rolled back because it overwrote custom content. Engineers now get a list of updated components after package update and selectively apply them. Vinay's new agent prevents content removal during updates. | exam-management / cross-product | — | Note for Himanshu working session |

---

## Verbatim quotes

> "It will be the same set of components used across both the modules exam management and course evaluation." — Vishal

> "When vinay releases this new design language, there was this hook which was basically auto updating everything. But what I realize is that it is also overwriting some of the things which you might have created. So then I rolled that back and now you have to manually update components." — Himanshu

> "I don't want the student's cursor to move across too much." *(context: exam management assessment taker — reconfirms T79 direction)* — Rohit reference echoed

> "Deadline was days ago. It's not in the future." — Vishal (on course eval engineering handoff)

> "You can focus only on the survey distribution and view survey. Remaining all we can get to later. If we are done with these two engineering can start working on those." — Vishal

> "I realize is that it is also overwriting some of the things which you have, you might have created. Right. So then I rolled that back." — Himanshu (on auto-update rollback)

---

## Design tasks generated

| Task | Product | See |
|---|---|---|
| T112 — DS design language alignment working session with Himanshu | exam-management | Backlog |
| CE-01 — Faculty column variants (3 screenshots) | course-eval | Out of scope |
| CE-02 — Survey distribution and list view complete handoff to engineering | course-eval | Out of scope |
