---
type: meeting
date: 2026-07-28
product: pce
participants: [Romit Soley, PM/PO (unnamed, Engineering lead)]
source: granola
granola_id: bfaa2076-04a2-4cf8-b51c-5e282fef109c
---

# Course Eval sync up — 2026-07-28

**Date:** 2026-07-28 9:30 AM EDT
**Participants:** Romit (note creator / designer); PM/PO (engineering/product lead, unnamed in transcript)

---

## Topics covered

1. Analytics requirements frozen — design paused until PM shares updated stories
2. Communication settings architecture decision: email templates + reminder templates + reminder frequency = CENTRAL settings, not per-survey
3. David's verbiage feedback on prototype — hold all content changes until requirements stabilize
4. Open question: Can an approved (active) template still be edited, or is it locked?
5. Priority action: schedule calls with David and Vishaka to complete template creation + survey distribution journey review

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0728A_01 | **Communication settings = CENTRAL, not per-survey.** Email templates, reminder templates, and reminder frequency are saved as central settings. When the setup flow reaches Step 3, those saved settings are FETCHED (not configured). "We will have email templates, reminder templates and reminder frequency as Central settings. Which will not be per survey distribution. It is a setting that is saved and whatever is saved will be fetched. When we jump on step three." This means T129 Step 3 must be redesigned: admin confirms/views the central communication settings rather than configuring them per-survey. | pce | T129, T141 |
| D_PCE_0728A_02 | **Analytics design = FROZEN.** Do not work on analytics screens until PM shares updated user stories with exact use cases. "I have to freeze analytics requirement… the screens will definitely change. It will be a reverb for you." Design effort should shift to template creation + distribution journey user testing instead. | pce | T142 |
| D_PCE_0728A_03 | **David's verbiage/content feedback on prototype → DO NOT IMPLEMENT YET.** 90% of David's comments are about copy/terminology. Hold all content changes until product requirements are frozen. "Do not implement those verbiage review or changes on the prototype. Let's first freeze requirements from my side as well. So that you have the clarity what is going to change. And after every UX is frozen, then we will pick up all the content changes." | pce | — |
| D_PCE_0728A_04 | **OPEN DECISION: Approved (active) template — editable or locked?** David's question: "does that mean that I can edit a template still or is it locked?" PM to review and give opinion before next design session. Not resolved in this call. Do not design a lock mechanic until PM responds. | pce | T143 |

---

## Verbatim quotes

> "I have to freeze analytics requirement. So right now, I don't want you to work on analytics because it might change. The screens will definitely change. It will be a reverb for you."

> "We will have email templates, reminder templates and reminder frequency as Central settings. Which will not be per survey distribution. It is a setting that is saved and whatever is saved will be fetched. When we jump on step three."

> "Give me some time till tomorrow. So once I have a black and white story, I will share it with you. Then you can update your prototype, your designs based on the story that will have exact user scenarios and each use case captured."

> "Do not implement those verbiage review or changes on the prototype. Let's first freeze requirements from my side as well. So that you have the clarity what is going to change. And after every UX is frozen, then we will pick up all the content changes."

> "I went through it. But it's too long, so I could not give exact comments on each of them." [re: David's feedback]

---

## Code cross-reference (Pass 5)

| Directive | Existing code | Gap / Status |
|---|---|---|
| D_PCE_0728A_01: Communication = central settings | ❌ Not modeled | T129 Step 3 spec currently assumes per-survey communication configuration. Decision means Step 3 must fetch + display centrally configured templates/frequency instead. T141 added. |
| D_PCE_0728A_02: Analytics frozen | — | `analytics/page.tsx` exists and is built. No design changes should be made to it until PM unfreezes analytics requirements. |
| D_PCE_0728A_03: Hold verbiage changes | — | No code impact. Design protocol only — do not update prototype copy until requirements are locked. |
| D_PCE_0728A_04: Template edit/lock open question | ❌ No lock mechanic | `templates/[id]/page.tsx` — template editor has no published/locked state. `pce-modals.tsx` CreateTemplateSheet has no approval lock. Decision pending PM response (T143). |

**Pass 5 verdict:** No immediate safe code changes. T129 Step 3 architecture change (central settings) captured in T141. Template lock open decision tracked in T143.

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T141 | T129 Step 3 redesign: communication step shows CENTRAL settings, not per-survey config | P1 — DESIGN-REVIEW | Step 3 of setup evaluations wizard should fetch and display the centrally configured email template, reminder template, and reminder frequency. Admin views/confirms these settings; they do not configure per-survey. Requires Settings screen for central communication configuration to exist. D_PCE_0728A_01. |
| T142 | Analytics design: hold / do not update screens until PM unfreezes requirements | P0 — HOLD | Analytics screens (`analytics/page.tsx`) must not receive new design work until PM shares updated stories. Current screen is correct for its current state. D_PCE_0728A_02. |
| T143 | OPEN DECISION: Can an approved template be edited post-publish, or is it locked? | BLOCKED — awaiting PM | David's question raised in prototype review: once a template is "approved" / active, is it editable? Does editing affect in-flight surveys? PM to review and respond. Do not add lock mechanic to `templates/[id]/page.tsx` until answered. D_PCE_0728A_04. |
