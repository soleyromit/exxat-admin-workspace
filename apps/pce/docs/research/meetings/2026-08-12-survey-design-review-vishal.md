---
type: meeting
date: 2026-08-12
product: pce
participants: [Romit Soley, Vishal (PM)]
source: granola
granola_id: d6d6e961-ff67-4643-8d74-70cfce33c870
---

# PCE — Survey Design and Review (Vishal) — 2026-08-12

**Date:** 2026-08-12 9:30 AM EDT
**Participants:** Romit (designer, note creator); Vishal (PM — "Them" in transcript).

---

## Topics covered

1. Survey aspect setup UX: accordion (expand to bottom) vs. right-side drawer — conflicting pattern with exam management
2. Aspects display: how to show course material, coordinator, instructor in setup screen
3. "Add another template" concept — confirmed killed again (supplements T157)
4. No aspect-level or faculty-level template selection — confirmed dead
5. Per-faculty remove + add-back in aspect assignment
6. "Recipients" summary card on push survey review screen — confusing, possibly remove
7. Response rate: survey-level only (not aspect-level) — 80% of cases are one survey per course
8. Preview should open real FAST survey form, not placeholder
9. Push survey review screen structure — compared to "flight booking confirmation"

---

## Decisions

| ID | Decision | Product | Notes |
|---|---|---|---|
| D_PCE_0812A_01 | **Replace accordion/inline-expand with right-side drawer for survey aspect setup.** Current design shows aspects expanding inline to the bottom. Exam management uses a right-side drawer. Conflicting UX. Vishal: "Here I am seeing a conflicting user experience. This opens to the bottom and the exam management opens a drawer. Right. So any specific reason why we taken this approach versus that." Romit confirmed drawer is feasible. Vishal: "try that out and see how it plays." | pce | T165 |
| D_PCE_0812A_02 | **Remove "Recipients" summary card from push survey review screen.** The card attempts to summarize who is being evaluated (e.g. "400 students"), but the audience changes per template and per aspect — the combined summary is confusing and unusable. Vishal: "This is actually confusing. So either remove it or see if we can. What else can be shown." The flight-booking-style review screen needs to show a properly structured per-course table instead. | pce | T166 |
| D_PCE_0812A_03 | **CONFIRMED KILL: No aspect-level or faculty-level template selection.** Each course has exactly one template. Aspect-level template override is not supported and will never be supported. Vishal: "We don't have faculty or aspect level template. We're not supporting that right now. I don't anticipate supporting that anytime in future." Supplements T157 (from Aug 11). | pce | T157 (already tracked) |
| D_PCE_0812A_04 | **Response rate is survey-level (not aspect-level) in 80% of cases.** Default hypothesis: one survey per course covers all aspects (course material + faculty + general). Response rate = tied to the whole survey, not to individual aspect. Vishal: "Response rate is always survey level." 20% edge case: separate surveys per aspect exist but are non-optimal. Design must optimize for single-survey. Vishal: "We have optimized our solution for that." | pce | T167 |
| D_PCE_0812A_05 | **Push survey review screen — redesign from card summary to per-course structured view.** The current "recipients" card plus survey-level summary card don't give admin enough detail. Review screen should list courses with sub-information per course (aspects, faculties, student counts). Vishal referenced "flight booking confirmation" as the mental model. | pce | T166 (supplements) |
| D_PCE_0812A_06 | **Per-faculty remove + add-back affordance in aspect assignment.** When two coordinators are shown for an aspect, admin needs to be able to remove one (but also add them back). Disabling the whole aspect is not enough — per-person remove is required. Vishal: "How can I remove one of them? So you're giving an option to disable, which disables the entire aspect. But I cannot remove one of that." | pce | Supplements T134 |

---

## Verbatim quotes

> **Vishal:** "Here I am seeing a conflicting user experience. This opens to the bottom and the exam management opens a drawer. Right. So any specific reason why we taken this approach versus that."

> **Vishal:** "Try that out. Right. So try that out and see how it plays."

> **Vishal:** "We don't have faculty or aspect level template. We're not supporting that right now. I don't anticipate supporting that anytime in future."

> **Vishal:** "We won't have aspect level response rate. So if someone fills a survey, he will fill for the entire survey, which includes course and faculty. So your response rate is not is tied to the survey, not to the aspect."

> **Vishal:** "This is actually confusing. So either remove it or see if we can. What else can be shown."

> **Vishal:** "So response rate is always server level. Yes."

> **Vishal:** "One template, one course, one template. That's about it. One survey push at a time. That's all."

---

## Code cross-reference (Pass 5)

| Directive | Existing code | Gap / Status |
|---|---|---|
| D_PCE_0812A_01: Accordion → drawer | `surveys/push/page.tsx` is legacy 3-step flow, no accordion. New T129 wizard not yet in code. | Applies to T129 design, not existing code. DESIGN-REVIEW. T165 added. |
| D_PCE_0812A_02: Remove recipients card | Not in production `surveys/push/page.tsx`. Applies to prototype/design. | DESIGN-REVIEW. T166 added. |
| D_PCE_0812A_03: Kill aspect-level template | Not in production code. Prevents it from being built. | Already T157. Confirmed. |
| D_PCE_0812A_04: Survey-level response rate | `response-gauge.tsx` shows survey-level rate. Aspect-level never built. | Already consistent. No change needed. |
| D_PCE_0812A_06: Per-faculty remove/add-back | `surveys/push/page.tsx` has no faculty-level remove. Applies to T129 Step 2. | Supplements T134. T129 design task. |

**Pass 5 verdict:** No immediate production code changes required. All directives apply to T129 wizard design or prototype work.

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T165 | Survey aspect setup: replace accordion/inline-expand with right-side drawer | P1 — DESIGN-REVIEW | Consistent with exam management drawer pattern. Vishal: "try that out and see how it plays." D_PCE_0812A_01. |
| T166 | Push survey review screen: remove recipients card; redesign as per-course structured list | P1 — DESIGN-REVIEW | "Recipients" card is confusing and unusable when aspects differ per course. Use flight-booking-confirmation structure. D_PCE_0812A_02, D_PCE_0812A_05. |
