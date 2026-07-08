---
type: meeting
date: 2026-07-07
product: exam-management
participants: [Romit Soley, Vishal]
source: granola
granola_id: 91c567e8-c8ae-42c0-b60d-55b13444ffa9
---

# Exam management priority sync and governance change — 2026-07-07

> Vishal + Romit 1:1. Topics: Course Evaluation design status, exam management priority order, question creation as P0, governance shift (Aarti stepping back → Yash as day-to-day approver), assessment creation screen density flag.

## Topics covered

- Course Evaluation "view survey" design status
- Exam management MVP phase priority order
- Question creation confirmed as P0 for exam management
- Assessment creation screens identified as too dense — needs redesign
- Process change: weekly Aarti call canceled permanently; Yash is new day-to-day approver
- Vishal to join all design sync calls going forward

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_EM_0707_01 | **Weekly Aarti design call canceled — permanently.** "There is no call tomorrow. There is no. The weekly call we have with arti is canceled. Forever." Aarti transitions to leadership sponsor only, reviewing designs roughly every 1.5 months. | exam-management | §5.63 decisions summary |
| D_EM_0707_02 | **Yash is now the day-to-day design approver.** Vishal: "yes will be our sponsor... Leadership sponsor. So yes will be reviewing the designs. And give us a go." For day-to-day design approvals, Yash is the final decision-maker, not Aarti. Aarti reviews the full picture periodically. Reconfirms D_EM_0706_02 from the Arun 1:1. | exam-management | §5.63 decisions summary |
| D_EM_0707_03 | **Question creation is P0 for exam management — unambiguous.** Vishal: "your P0 will be question creation. Period." Assessment creation has prototypes already (built by Nipun/Bhargav); dev is building from those. Question creation has NOT been picked up by dev yet. That is where Romit's design effort must go next. | exam-management | T104 (new task) |
| D_EM_0707_04 | **Accommodations confirmed not Phase 1.** Reconfirms D_EM_0702_07. "Accommodations is not something we are building in the first phase. So there is no point building anything there on accommodation." | exam-management | D_EM_0702_07, T13 |
| D_EM_0707_05 | **Assessment creation screens are too dense.** Vishal: "there are some screens where the information is too dense. We need to figure out a way to present so much of information. And little screen." Not a full redesign — information is correct, presentation needs improvement. FLAG for design review before dev handoff. | exam-management | T104 |
| D_EM_0707_06 | **Exam management focus begins next week.** After Romit completes Course Evaluation "view survey" (with Monil), the focus shifts to exam management question creation. Target: at minimum start the exam management conversation by Thursday, confirm Monday. | exam-management | — |
| D_EM_0707_07 | **Vishal joining all design sync calls going forward.** "I'll make sure to join all our sinks." Increases overlap and decision velocity between product and design. | exam-management | — |

---

## Verbatim quotes (Vishal)

> "your P0 will be question creation. Period."

> "There is no call tomorrow. There is no. The weekly call we have with arti is canceled. Forever."

> "yes will be our sponsor... Leadership sponsor. So yes will be reviewing the designs. And give us a go."

> "accommodations is not something we are building in the first phase. So there is no point building anything there on accommodation."

> "there are some screens where the information is too dense. We need to figure out a way to present so much of information. And little screen."

> "next week onwards, I want your major time and attention on exam management."

---

## Design tasks generated

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T104 | Assessment creation screens — information density review | Admin / Faculty | Assessment builder (`create-assessment-modal.tsx` + related builder screens) | P1 — DESIGN-REVIEW | Vishal Jul 7: "there are some screens where the information is too dense. We need to figure out a way to present so much of information. And little screen." The workflow is correct; the density of information within existing screens needs a design pass. Do not restructure workflow — only reconsider information hierarchy and visual grouping. D_EM_0707_05. |
