---
type: meeting
date: 2026-07-28
product: pce
participants: [Romit Soley, Monil]
source: granola
granola_id: bfaa2076-04a2-4cf8-b51c-5e282fef109c
---

# Course eval sync up — 2026-07-28

**Date:** 2026-07-28 9:30 AM EDT
**Participants:** Romit (Me), Monil (Them)

---

## Topics covered

1. Analytics design put on HOLD — requirements not yet frozen
2. Spend time with Vishaka and David on template creation + survey distribution journey feedback
3. Architecture decision: email templates / reminder templates / reminder frequency = central settings (NOT per-survey)
4. Hold on all verbiage/copy changes until PM writes stories
5. Open question: can an approved template still be edited?

---

## Topics covered (detail)

### Analytics freeze
Monil: requirements for analytics are not yet frozen and screens will definitely change. Working on analytics now would be rework. Romit should not pick up T100, T116, T117 until Monil shares written stories.

### Get user feedback from Vishaka and David
Last call with Vishaka/David was very insightful. Monil wants Romit to spend more time with them to complete the template creation journey and survey distribution journey — collect feedback on verbiage, instruction copy, and workflow framing.

### Central settings architecture
Earlier today Monil's team decided: email templates, reminder templates, and reminder frequency are **global/central settings** — they are NOT configured per survey distribution. When admin reaches step 3 of the distribution wizard, settings are fetched from this central store. This is a backend logic change, not a UI flow change right now, but it clarifies the Phase 2 architecture for T81 and T82.

### Hold on verbiage changes
Monil asked Romit NOT to implement any verbiage or copy changes on the prototype until requirements are fully frozen and stories are written. Hold applies to David's review comments as well (90% are verbiage; don't mix with functional changes).

### Approved template editability — UNRESOLVED
David raised a question: once a template is approved, can admin still edit it, or is it locked? Monil said he'll review and provide his opinion. No decision yet.

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0728A_01 | **Analytics design ON HOLD.** PM freezing requirements. Do not work on T100 (single-survey analytics), T116 (surface-first chart pattern), T117 (export capability) until Monil shares written stories. | pce | T100, T116, T117 |
| D_PCE_0728A_02 | **Email templates + reminder templates + reminder frequency = Central settings.** Global defaults shared across all surveys, NOT configured per-distribution. Settings are fetched when admin reaches step 3. Architecture decision for Phase 2 T81/T82 design when resumed. | pce | T81, T82 |
| D_PCE_0728A_03 | **Hold on all verbiage/copy changes.** Do not implement copy changes from David's feedback doc or any other verbiage review until Monil freezes requirements and shares user stories. | pce | — |
| D_PCE_0728A_04 | **UNRESOLVED — approved template editability.** Open question: can admin still edit a template after it is approved? Monil to review and share opinion. | pce | T131-OPEN |

---

## Verbatim Monil quotes

> "I have to freeze analytics requirement. So right now, I don't want you to work on analytics because it might change. The screens will definitely change. It will be a reverb for you."

> "The best time we can spend is with Vishaka. To get such feedback. I felt the last call was very insightful. It's like proper user feedback that we got — how user thinks and how user interprets each single line."

> "We will have email templates, reminder templates and reminder frequency as Central settings. Which will not be per survey distribution. It is a setting that is saved and whatever is saved will be fetched when we jump on step three."

> "Do not implement those verbiage changes on the prototype. Let's first freeze requirements from my side as well."

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T131 | Analytics design on HOLD — pause T100, T116, T117 until Monil shares stories | P0 HOLD | D_PCE_0728A_01 |
| T132 | Central settings architecture: email templates + reminders = global defaults (Phase 2 design note) | P2 — Phase 2 | D_PCE_0728A_02. Affects T81, T82 when Phase 2 resumes. |
| T133 | OPEN QUESTION: approved template editability — track until Monil responds | P1 UNRESOLVED | D_PCE_0728A_04. No design change until resolved. |
