---
type: meeting
date: 2026-06-30
product: pce
participants: [Romit Soley, Monel, David]
source: granola
granola_id: b235be1e-2c64-4472-a01a-22dc67e9f25a
---

# Post-Course Survey Cadence Meeting (Bi-Weekly 45 Mins) — 2026-06-30

> Bi-weekly cadence call. David (external collaborator / clinical education expert). Monel debriefs Romit and David on Vadodara trip outcomes. Open engineering questions about survey answer types, faculty role taxonomy for evaluation, and student roster handling.

## Topics covered

- Beta launch strategy: Q3 target of 20–50 beta customers (existing Prism clients)
- PCE navigation rename
- Answer type taxonomy for course evaluation surveys
- Faculty role taxonomy across didactic, clinical, and lab-based courses
- Student roster refresh before survey push
- Course-level date override above term-level scheduling
- Pendo campaign for beta sign-up

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_630_10 | **Navigation rename**: PCE entry in Prism = "Course Evaluation and Survey" as one link. Inside: two tabs (Course Evaluation + Surveys). | pce | T41, T54 |
| D_PCE_630_11 | **Answer types**: Likert (5-point standard, 7-point also valid) + free text. These two only for course evaluation surveys. Likert labels are predefined templates (satisfaction, agreement, frequency, quality, difficulty, true/false). No free-form customization of labels. Follow Harvard guide approach: restricted label set. | pce | T30, T44 |
| D_PCE_630_12 | **Student roster refresh**: System must refresh student roster (from SIS/LMS) immediately before sending survey push. Students who dropped are excluded; late-adds are included. "Yes. 100%. What's gonna happen is students are gonna be dropping, and they're also might be some students added a week or two into the semesters." — David | pce | T94 |
| D_PCE_630_13 | **Course-level date override**: Course start/end date can override the term-level default date for when a survey is live. Term-level remains the default; course level is an override. "We should also give course start and end date as an overrider above the term start and end date." — Monel | pce | T69, D_PCE_NC15, T95 |
| D_PCE_630_14 | **Faculty role taxonomy** for PCE evaluation: Top tier: Course Coordinator, Course Director. Mid tier (didactic/lab): Instructor, Lecturer, Teacher (same responsibility, different titles per institution). Lab-specific: Lab TA / Lab Assistant (separate role, may have a distinct question set). Clinical/placement: Placement Faculty + Director of Clinical Education (DCE). This is the exhaustive role list to drive the template role picker (T35, T93). | pce | T34, T35, T93 |
| D_PCE_630_15 | **Pendo campaign** for beta sign-up: Use Pendo to target the 103 programs currently using survey or LAM for course evaluations. Show pop-up when they click surveys: "We're making your experience better — join as beta tester." Monel will coordinate with Swinton. Not a design task. | pce | — |
| D_PCE_630_16 | **Likert scale customization restriction**: Do NOT allow free-form label input. Predefined template options only. David: "I'm of the opinion that we should give some restraint, some restrictions on this... the longitudinal insights will go for a toss" if labels aren't standardized. | pce | T30, D_PCE_630_11 |
| D_PCE_630_17 | **Beta launch timeline**: Q3 = 20–50 beta customers. Fall semester survey run is the target (late November). Q4 '26 = general announcement. Q1 '27 = full rollout, 100+ programs. PCE runs on a carved-out Prism base. | pce | — |

## Verbatim quotes

> "Should our system take the latest student registry before pushing the survey on that day? Yes. 100%. What's gonna happen is students are gonna be dropping, and they're also might be some students added a week or two into the semesters. You're gonna be sending surveys to students that dropped, and you'll also be missing students that actually participated in the class." — David

> "We should also give course start and end date as an overrider above the term start and end date." — Monel, confirmed by David

> "I'm of the opinion that we should give some restraint, some restrictions on this, right, and not allow everyone just to type whatever they want... the longitudinal insights will go for a toss." — David (on Likert label customization)

> "Too much freedom is not always a good thing." — Monel

> "We'll rename that as course evaluation and survey. It will be one link. And when we enter that link, we will see two side tabs." — Monel

> "We should not allow for a cash customization. So this is a unique product where we should avoid having customization. Otherwise, the longitudinal insights will go for a toss." — Monel

> "All of them are faculty. So in my mind, that's a group already created." — David (explaining Course Coordinator / Course Director are both "faculty" at the institution level)

> "We should we should not do that. We should have a lab TA or a TA as a separate role inside this." — Monel

## Faculty role taxonomy (detailed reference for T35, T93)

| Course type | Role | Note |
|---|---|---|
| Didactic | Course Coordinator | Top-level; oversees whole course |
| Didactic | Course Director | Same tier as coordinator |
| Didactic | Instructor / Lecturer / Teacher | Different names, same function. Teaches the class. |
| Lab-based | Lab TA / Lab Assistant | Separate role. May have separate question set. |
| Clinical/placement | Director of Clinical Education (DCE) | Equivalent to course coordinator for placement |
| Clinical/placement | Placement Faculty | Employed by the institution; monitors students on placement |
| Clinical/placement | Preceptor | NOT evaluated via PCE — evaluated via LAM |

## Design tasks generated

- T94 (pce): Student roster refresh before survey push — engineering requirement. Confirm in push survey review step. D_PCE_630_12.
- T95 (pce): Course-level start/end date override in push survey scheduling. Supplements T69. D_PCE_630_13.
- T96 (pce): Faculty role taxonomy for template role picker. Enriches T34, T35, T93. Use taxonomy above when designing role selector in template builder. D_PCE_630_14.
