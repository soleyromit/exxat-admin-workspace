---
type: meeting
date: 2026-07-14
product: pce
participants: [Romit Soley, Monil]
source: granola
granola_id: f1f8d1e4-16c9-4fa6-bf65-4426543d6c34
---

# Course evaluation setup — design feedback and UX refinement — 2026-07-14

> Monil reviews Romit's latest dashboard + setup screens. Topics: setup evaluation flow, action-needed column CTA consolidation, cohort and "what to evaluate" field scalability (20+ options from Prism → radio buttons fail), Step 1 framing as data-audit rather than evaluee-selection, toggle for faculty results access, and prioritisation for the week.

---

## Topics covered

- Label change: "set up evaluations" (reconfirmed from Jul 13)
- Workflow: missing-info and reminder actions start at Course Readiness with default selections pre-filled
- Toggle: distinct "All Faculty" vs. individual faculty selection for results access
- Question breakdown anchor: clicking question number scrolls directly to that question's results
- Term dates and survey dates shown explicitly (no countdown like "42 days left")
- Action needed column: individual per-role CTAs fail when 5 evaluities × N faculty roles — consolidate
- Cohort field: can have 20+ types from Prism — radio buttons overflow horizontally
- "What to evaluate" field: 45–50 faculty roles from Prism — same horizontal overflow problem
- Cohort = empty state (not pre-selected)
- Step 1 reframing: goal is data audit + preparation, not evaluee selection; copy must reflect this
- Async feedback plan: Romit to share doc/screenshots; Monil will tag Vishaka + David with a comment
- Priority for week: dashboard + single-survey analytics > setup flow copy change

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0714A_01 | **Action needed column: max 2 CTAs — "Add Faculty" + "Add Student" only.** Multiple per-role CTAs (add lab instructor / add instructor / add course coordinator shown separately) are replaced by one aggregated "Add Faculty" CTA and one "Add Student" CTA. Monil: "We can categorize all the faculty roles as add faculty CTA. And all the students at add student. So there is only maximum two CTAs that you will see." Inside "Add Faculty" → navigate to Prism, add all relevant personas. | pce | T109 |
| D_PCE_0714A_02 | **Cohort field can have 20+ types from Prism; radio button layout fails.** Cohort is a Prism-defined lookup value, NOT dependent on term or academic year. Monil: "cohort can be of 20 types in the system. How would it feel? The entire horizontal space would run up." Must redesign selector (dropdown or equivalent pattern). | pce | T110 |
| D_PCE_0714A_03 | **"What to evaluate" field: 45–50 faculty roles from Prism; radio button layout fails.** Same overflow problem as D_PCE_0714A_02. Monil: "what to evaluate, there are 45, 50 faculty roles created in the system." Redesign needed — not a radio group. | pce | T110 |
| D_PCE_0714A_04 | **Cohort field: empty state (NOT pre-selected).** Monil: "No. No, it will not be preset. It's empty State." No default cohort selection when admin enters Setup Evaluation. | pce | T110 |
| D_PCE_0714A_05 | **Step 1 goal = audit course data + prepare admin — NOT evaluee selection.** Monil: "The purpose of step one is to audit the course data and help user prepare that data. Preparation. Preparation to anyway will happen in prism." Current copy ("Course and evaluities", "What to evaluate") doesn't communicate this intent. Try copy change first; async Vishaka + David feedback requested on the specific screen. Monil: "ask this question to yourself — does this UX answer that user intent?" | pce | T111 |
| D_PCE_0714A_06 | **Toggle: distinct "All Faculty" vs. individual faculty selection for results access.** Romit's new toggle design: one mode grants all faculty access; other mode allows per-faculty selection. Toggle state changes per selection. Monil: "Okay." | pce | — |
| D_PCE_0714A_07 | **Missing-info and reminder actions both start at Course Readiness with defaults pre-filled.** Monil confirms direction from D_PCE_0713_10: "the user will directly see the course readiness as their first option. With default selections already been done." Reinforces setup flow opening on Course Readiness (not Term Details). | pce | T104, D_PCE_0713_10 |

---

## Verbatim quotes (Monil)

> "cohort can be of 20 types in the system. How would it feel? The entire horizontal space would run up."

> "same goes for what you all had told. So what to evaluate, there are 45, 50 faculty roles created in the system."

> "No. No, it will not be preset. It's empty State."

> "We can categorize all the faculty roles as add faculty CTA. And all the students at add student. So there is only maximum two CTAs that you will see."

> "The purpose of step one is to audit the course data and help user prepare that data."

> "ask this question to yourself. Saying, does this UX answer that user intent?"

> "So first is if we change the language. If that serves the purpose, then we just change the language."

> "I'm going to go through a watermark. And anthologies designs. And if we get some inspiration. We can brainstorm."

> "I like that idea. But what I'm seeing is just. Asynchronously try to think and come up with some opinion."

## Verbatim quotes (Romit)

> "So then I think that way I can parallel analytics and other. First priority is on the dashboard. And basic changes within course and evaluities."

---

## Design tasks generated

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T109 | Action needed column: consolidate to max 2 CTAs ("Add Faculty" + "Add Student") | Admin | Dashboard setup evaluation / action needed column | P1 — DESIGN-REVIEW | D_PCE_0714A_01. No code equivalent (dashboard is prototype-only). Apply in Lovable prototype. Inside each CTA → link to Prism for the actual data entry. |
| T110 | Cohort + "What to evaluate" field redesign: replace radio buttons with scalable selector | Admin | Setup evaluation flow (step 1 / Course Readiness) | P1 — DESIGN-REVIEW | D_PCE_0714A_02, D_PCE_0714A_03, D_PCE_0714A_04. Both fields can have 20–50 options from Prism. Dropdown or multi-select list instead of horizontal radio group. Cohort = empty state by default. No code equivalent. |
| T111 | Step 1 copy change: frame as "data audit" not "evaluee selection" | Admin | Setup evaluation flow step 1 | P1 — DESIGN-REVIEW + async feedback | D_PCE_0714A_05. Try copy/label change first (rename section header + description to reflect audit intent). Share screen in feedback doc; Monil to tag Vishaka + David for async input. |
