---
type: meeting
date: 2026-08-19
product: pce
participants: [Romit Soley]
source: granola
granola_id: 713d7675-08bd-4569-bf1a-1788164737c2
---

# Course evaluations UI — information hierarchy and past/future terms layout — Aug 19, 2026

Design review session (5:09 PM EDT). Romit presenting the current course evaluations dashboard design-in-progress to a colleague (participant identity unclear in transcript — not yet shared with Arun). Session focused on information hierarchy concerns, past/future terms navigation pattern, and confirming analytics + programmatic survey status.

---

## Topics covered

- Information hierarchy critique of current dashboard design
- Past term and future term table placement
- Alternative navigation: "go to all terms" button vs. separate tables
- Analytics requirements status (still in review)
- Programmatic survey status

---

## Decisions

| ID | Decision | Product | Surface |
|---|---|---|---|
| D_PCE_0819B_01 | **Past/future term tables: proposed removal** — replace with a single "go to all terms" button/link that navigates to the terms directory. Rationale: separate past/future tables duplicate what the terms directory already provides. "To me, honestly, like past term and future terms should ideally not be there. Because then the point of having a directory and then term, just create a button that takes you to all terms." ⚠️ CONFLICTS D_PCE_0819A_03 (Vishal same day: always-visible past table). Romit to discuss with Vishal before applying. | pce | Evaluation dashboard — past/future section |
| D_PCE_0819B_02 | **Information hierarchy** on the current dashboard design needs improvement. Concern: too many elements competing for attention when the whole page is used as a dashboard. Tabs on top + grid/table below is preferred over all elements at the same visual weight. | pce | Evaluation dashboard (in-progress design) |
| D_PCE_0819B_03 | **Analytics requirements** are still being reviewed — do not present or lock analytics design until requirements are confirmed. "I don't want to go deeply into that. Because the requirement structure and what has been done is like is still being reviewed." | pce | PCE analytics |
| D_PCE_0819B_04 | **Programmatic survey** remains parked. No design or engineering action. "We have parked it. At the moment." Focus = course evaluations and directory only. | pce | Programmatic surveys |

---

## ⚠️ Conflict with Aug 19 AM Vishal session

| Conflict | D_PCE_0819A_03 (Vishal AM) | D_PCE_0819B_01 (PM session) | Status |
|---|---|---|---|
| Past/future terms in dashboard | Always visible as table by default | Remove entirely; use "go to all terms" button | UNRESOLVED — Romit to discuss with Vishal |

---

## Verbatim quotes

- "If you're going to use the entire page as a dashboard, first of all, I have concerns and problems there also. It looks too jumbled up into many things and I don't understand the information hierarchy."
- "To me, honestly, like past term and future terms should ideally not be there. Because then the point of having a directory and then term, just create a button that takes you to all terms. And it will take you to the directory with terms. Just an action button or something that says go to all terms."
- "I don't want to go deeply into [analytics]. Because the requirement structure and what has been done is still being reviewed."
- "We have parked [programmatic survey]. At the moment."

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T216: Past/future terms — alignment needed: table vs. "go to all terms" button | P0 — ALIGNMENT NEEDED | D_PCE_0819B_01 vs D_PCE_0819A_03. Romit to discuss with Vishal. Do NOT apply either pattern until resolved. |
| T217: Dashboard information hierarchy pass — reduce visual noise, clarify primary/secondary elements | P1 — DESIGN-REVIEW | D_PCE_0819B_02. Tabs-on-top + grid-below pattern preferred over all-same-weight dashboard layout. |
