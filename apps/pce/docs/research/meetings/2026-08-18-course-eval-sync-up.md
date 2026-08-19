---
type: meeting
date: 2026-08-18
product: pce
participants: [Romit Soley, Vishaka]
source: granola
granola_id: 421b0a20-4013-4b94-9d5c-499d0dc1b184
---

# Course Eval sync up — Aug 18, 2026

Romit + Vishaka end-to-end design walkthrough of the setup evaluations wizard, survey distribution table, and dashboard.

---

## Topics covered

- Survey distribution table: codes column placement
- Bulk actions and status-based multi-select behaviour
- Board view deferral (table view only in Phase 1)
- Setup term: multi-term selection and drawer pattern
- Setup term vs. setup evaluations: confirmed separation
- Reopen closed survey: not allowed
- Dashboard terminology: "feedback requests" not "students"
- Dashboard days-left card: keep at term level (no per-course granularity)
- Onboarding workflow: deferred

---

## Decisions

| ID | Decision | Product | Surface |
|---|---|---|---|
| D_PCE_0818_01 | Evaluation codes must be in a **separate column**, not nested under the Course column in the survey distribution/setup wizard table. "It makes it clear if we have it as a separate column." | pce | Setup evaluations wizard / survey distribution table |
| D_PCE_0818_02 | Term addition must use a **drawer** — user can add a term in-page without navigating to the terms directory, then close the drawer and continue the workflow. "Design and experience where I can set up terms on the same page and continue my work." | pce | Setup terms / evaluation dashboard |
| D_PCE_0818_03 | Bulk actions / multi-select: **only Draft, Ongoing (Live), and Not Configured** statuses allow row selection. **Closed** and **Results Released** rows are non-selectable by default. "Anything which is closed, results available should be by default non-selectable." | pce | Survey list / surveys/page.tsx |
| D_PCE_0818_04 | **Board view is Phase 2.** Table view only in Phase 1. "Board view. I think we will build in the second pass first will be table view only." | pce | Survey list |
| D_PCE_0818_05 | Dashboard terminology: replace **"students"** with **"feedback requests"** when referring to outstanding responses. "We are not saying students. We are saying feedbacks. Feedback requests, because you could have the same student giving multiple feedback." | pce | Evaluation completion dashboard (T46/T165) |
| D_PCE_0818_06 | **Reopen closed survey** is not available. "No, we're not giving that option currently." | pce | Survey list / survey detail |
| D_PCE_0818_07 | **Setup term** and **Setup evaluations** are two distinct steps/surfaces. Once a term is configured, admin chooses to either add more terms or set up evaluations for that term. "We split setup term from course evaluations setup… when you click on setup term, take users to this page." | pce | Setup term / setup evaluations (T129) |
| D_PCE_0818_08 | Dashboard days-left card: keep at **term level** (not per-course). Per-course variation is rare. "It's rare… Let's leave it as it is." | pce | Evaluation dashboard (T46) |
| D_PCE_0818_09 | Onboarding workflow deferred. "You worry about onboarding in the next step. Let's not worry about onboarding right now." | pce | Onboarding |

---

## Verbatim Vishaka quotes

- "It makes it clear if we have it as a separate column. Right. So in sync with server distribution workflow."
- "Board view. I think we will build in the second pass first will be table view only."
- "Anything which is closed, results available should be by default non-selectable."
- "No, we're not giving that optional currently." [on reopening closed surveys]
- "We are not saying students. We are saying feedbacks. Feedback requests, because you could have the same student giving multiple feedback."
- "Design and experience where I can set up terms on the same page and continue my work."
- "Maybe we should have a drawer kind of a thing, right? To add terms. Otherwise, every time if we are taking users to the setup term directory, then, you know, there is a break in the user's workflow."
- "We split setup term from course evaluations setup. You can set up terms in a different step. And once you set up a term, you can choose to set up more terms, or you can choose to set up evaluations for that particular term."
- "You worry about onboarding in the next step."

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T204: Codes → separate column in distribution table | P1 | DESIGN-REVIEW. D_PCE_0818_01 |
| T205: Term addition drawer | P1 | DESIGN-REVIEW. D_PCE_0818_02 |
| T206: Bulk actions restricted by status | P1 | DESIGN-REVIEW. D_PCE_0818_03 |
| T207: Multi-term selection scope in setup term | P1 | DESIGN-REVIEW — needs Vishaka confirmation. D_PCE_0818_04 (open question) |
| T208: Dashboard "feedback requests" language rule | P1 | Applies at T46/T165 implementation. D_PCE_0818_05 |
