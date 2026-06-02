---
type: meeting
date: 2026-06-01
product: exam-management
participants: [Romit Soley, Rohit]
source: granola
granola_id: caaae283-b969-4039-970b-8473013522b7
---

# Exam Taker Design Review — Navigation, Question Layout, and Accessibility

**Date:** 2026-06-01  
**Participants:** Romit Soley (Designer II), Rohit (stakeholder)  
**Context:** Design review of Romit's exam-taker Figma work before dev handoff. Rohit reviewed the current design against industry references (USMLE, GRE, GMAT, TOEFL, NAPLEX). Nipun and Vishal to review next day in office.

---

## Topics covered

1. Navigation drawer — cursor movement, question surfacing
2. Question number/label format
3. "Flag" vs "Bookmark" vs "Report an issue" vocabulary
4. "Report an issue" button prominence
5. Pre-exam setup scope change
6. Audio support phase
7. Keyboard shortcuts accessibility
8. Design system accessibility gaps (Himanshu nudge)
9. PreExamFlow centering

---

## Decisions

| # | Decision | Product | Notes |
|---|---|---|---|
| D_AT01 | Remove the word "Question" from the question stem label — use "{N}. {stem}" format only | exam-management / assessment-taker | APPLIED: `SplitQuestionView.tsx:224` |
| D_AT02 | Question navigation panel should surface ONLY flagged questions; answered count shown at top as summary, not in the list | exam-management / assessment-taker | DESIGN-REVIEW — extends T35. Aligns with USMLE/GRE pattern. |
| D_AT03 | Question navigation should be on the LEFT to minimize cursor movement ("always surface the questions on the left") | exam-management / assessment-taker | DESIGN-REVIEW — major layout change |
| D_AT04 | Color coding in nav: answered = subtle color, flagged = yellow, unanswered = gray | exam-management / assessment-taker | DESIGN-REVIEW — design direction needed |
| D_AT05 | "Flag" vocabulary split: "Bookmark" (student personal use) and "Report an issue" (faculty review request) — separate icons, separate flows | exam-management / assessment-taker | DESIGN-REVIEW — new data model |
| D_AT06 | "Report an issue" button should be de-emphasized — move inside settings gear or bottom area; students rarely use it, heavy placement creates distraction | exam-management / assessment-taker | DESIGN-REVIEW |
| D_AT07 | Audio/video support NOT in Phase 1 — "we are actually not supporting audio in the first phase. Because that is still not a common thing that people ask." | exam-management / assessment-taker | Already noted in PreExamFlow.tsx comment |
| D_AT08 | Keyboard shortcuts must support full mouse-free operation (accessibility requirement). Expose all shortcuts via a button-triggered modal | exam-management / assessment-taker | DESIGN-REVIEW — new component needed |
| D_AT09 | PreExamFlow: centering should use full screen height as reference, not just area below progress bar | exam-management / assessment-taker | FLAG — design iteration in progress |
| D_AT10 | Design system (Himanshu's) has accessibility gaps: color blindness modes, voice narrator, calculator/keyboard shortcuts not covered. Rohit to nudge Himanshu. | exam-management / DS | Action item: Rohit → Himanshu |

---

## Verbatim Rohit quotes

> "I don't want the student's cursor to move across too much. They should be able to very minimally get across with all the things."

> "Only flagged can be surfaced here because as you said, after I answer a lot of questions, I don't need the answered questions. I only need the flagged ones. Right? At the end of the day, at the end of the exam, I'll as a student, I'll only go back for the flagged ones, not the answered one."

> "This question five, the word question, I think, is redundant because we know everything is a question... you can simply put it as seven dot [stem]. You don't need to write question question because writing it for the options. Right? Options are a, b, c, d. Then why do we have to have question, question, question, question all over?"

> "Flagging a question for faculty's review or whatever the report and issue. Is not something you come across regularly. So I personally don't think that needs such a space. So what you can do is probably put it inside the settings button at the top or probably somewhere at the bottom... because if you put it here, naturally, anybody would be curious of what is this."

> "Put a button or some sort of element. Once you click that, you'll open a model where you show all the common shortcuts. That is almost pretty common across a lot of apps."

> "We are actually not supporting audio in the first phase."

> "You're only considering the area below the progress bar. But you should consult the entire screen rather than only the area below the progress bar. So that way, he'll be centered well."

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T_AT01: Remove "Question" prefix from stem — use "N. stem" | ✅ APPLIED | `SplitQuestionView.tsx` |
| T_AT02: Question nav — surface only flagged questions; answered count summary at top | DESIGN-REVIEW | Extends T35 |
| T_AT03: Question nav position — move to LEFT panel | DESIGN-REVIEW | Major layout change |
| T_AT04: Keyboard shortcuts modal | DESIGN-REVIEW | New component |
| T_AT05: "Report an issue" de-emphasis — move into settings panel | DESIGN-REVIEW | |
| T_AT06: Bookmark vs Report Issue — split into two separate flows | DESIGN-REVIEW | New data model |
