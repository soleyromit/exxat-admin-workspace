---
type: meeting
date: 2026-07-09
product: pce
participants: [Romit Soley, Monil]
source: granola
granola_id: 497b1010-de33-49be-904e-3bb8d2fcd698
---

# Course Eval sync up — 2026-07-09

> Monil + Romit sync. Topics: current design scope (rows 12–17), settings deprioritization, analytics split (single-survey vs. longitudinal), layout/screen-width issue on completed screens (rows 3–10), engineering QA deadline (Aug 15), handoff gated on Yash review (Jul 10).

## Topics covered

- EM roadmap row scope: rows 3–10 done, rows 12–17 in progress, rows 19–21 next
- Settings deprioritized — most settings go to Phase 2
- Analytics: single-survey first (row 16), longitudinal deferred
- Layout issue: all screens from rows 3–10 using only ~70% of screen width; tables scrolling horizontally when screen has space
- Push survey Step 2 table specifically: must stretch to full horizontal width
- Engineering backend has started for rows 3–17; frontend awaits design handoff
- QA release deadline: August 15 (set by Monil with Vinay)
- Handoff blocked on Yash design review scheduled Jul 10

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0709_01 | **Settings deprioritized to Phase 2.** Monil: "Settings. I'm not that much worried about because most of the settings would go in phase two. So we can deprioritize that at least for the, from the design standpoint." T30 (Likert config), T81 (email templates), T82 (reminder schedule), T83 (course type mapping), T92 (answer type labels) all defer to Phase 2. | pce | T30, T81, T82, T83, T92 |
| D_PCE_0709_02 | **Analytics split: single-survey first, longitudinal later.** Monil: "Let's break down analytics into two parts right now. One is single survey analytics. And the second is multi survey analytics, which we call as longitudinal. For the sake of this call, let's only focus on single survey analytics." Single survey analytics = row 16. Longitudinal/cross-survey analytics deferred. | pce | T47, T72, T73, T74 |
| D_PCE_0709_03 | **Current design scope: rows 12–17.** Monil confirmed: "You can work on row 12 till row 17. Yes." After that: rows 19–21 (download responses + faculty-level). Target for beta = row 45. Engineering has started backend for rows 3–17; frontend blocked on design handoff. | pce | T98 |
| D_PCE_0709_04 | **Layout must use full screen width on all row 3–10 screens.** Monil: "we are only using 70 of the screens. I'm not sure why." Tables must not scroll horizontally when screen space is available. Push survey Step 2 (course offerings table) specifically: "Either should be centered or it should be stretched." Romit agreed: "we should stretch the table. That I can do." APPLY fix to `surveys/[id]/page.tsx`, `surveys/[id]/responses/page.tsx`, `surveys/push/page.tsx`. | pce | T98 |
| D_PCE_0709_05 | **QA release deadline: August 15.** Monil: "We only have time till 15th of August. 15 of August. Vinay is told that we will be releasing into QA." Engineering backend active for rows 3–17. Frontend engineering starts after handoff. | pce | — |
| D_PCE_0709_06 | **Handoff gated on Yash review (Jul 10).** Monil: "I am having this design review tomorrow with Yash. If Yash feels that the designs are ready and we can hand over, I will hand it over." Rows 3–10 designs hand to Vinay for frontend only after Yash signs off. | pce | D_EM_0707_02 |

---

## Verbatim quotes (Monil)

> "Settings. I'm not that much worried about because most of the settings would go in phase two. So we can deprioritize that at least for the, from the design standpoint."

> "Let's break down analytics into two parts right now. One is single survey analytics. And the second is multi survey analytics, which we call as longitudinal. For the sake of this call, let's only focus on single survey analytics."

> "you see this layout is not using the entire space. Is it intentional?"

> "we are only using 70 of the screens. I'm not sure why."

> "Either should be centered or it should be stretched." (on push survey Step 2 table)

> "So from now, from the discussion, even row 3 to row 10 is not ready. We cannot give this to engineering without we fix the layout."

> "We only have time till 15th of August. 15 of August. Vinay is told that we will be releasing into QA."

> "I am having this design review tomorrow with Yash. If Yash feels that the designs are ready and we can hand over, I will hand it over."

## Verbatim quotes (Romit)

> "we should stretch the table. That I can do." (agreeing on push survey Step 2)

---

## Design tasks generated

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T98 | Layout fix — survey screens must use full width | Admin | `surveys/[id]/page.tsx`, `surveys/[id]/responses/page.tsx`, `surveys/push/page.tsx` | P0 — ✅ APPLIED | Monil Jul 9: "we are only using 70 of the screens." Remove `max-w-2xl` from `surveys/[id]/page.tsx:75` and `surveys/[id]/responses/page.tsx:83`. Remove `maxWidth: 640` from `surveys/push/page.tsx:125`. Romit agreed: "we should stretch the table." Engineering handoff blocked until this is resolved. D_PCE_0709_04. |
| T99 | Settings deprioritized — no Phase 1 design work needed | Admin | Settings | Phase 2 | Monil Jul 9: "most of the settings would go in phase two." Demote T30, T81, T82, T83, T92 to Phase 2. Remove settings from Phase 1 design scope. D_PCE_0709_01. |
| T100 | Single-survey analytics (row 16) — design and share today | Admin | Survey detail / analytics | P1 — IN PROGRESS | Monil Jul 9: focus on single survey analytics only; longitudinal (multi-survey) is deferred. Row 16 UI was partially built; Romit to share updated link same day. Monil to review and provide feedback. D_PCE_0709_02. |
