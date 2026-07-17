---
type: meeting
date: 2026-07-16
product: pce
participants: [Romit Soley, Vishal]
source: granola
granola_id: b1b6d7fb-ecf1-4a25-a43a-1f9fe4a9b9b7
---

# Course Eval sync up — 2026-07-16

> Vishal + Romit status sync (Jul 16, 9:30 AM EDT). Topics: design priority order (rows 19–21), Yash design review status, incoming requirements for rows 23–32, DS compliance mandate, Himanshu + Vinay building shared DS components for exam-management and PCE, engineering retroactive UI alignment before Cohere. No killed features; no screen-level changes applied — all items are priority/coordination directives.

---

## Topics covered

- Priority order confirmed: rows 19, 20, 21 are the current active design focus (T19 course detail, T20 faculty self-view, T21 distribution viz)
- Rows 1–10 marked completed; some items reviewed by Yash; Vishal will email Yash to re-review after incorporating his comments on step 1 of create survey
- Yash had comments on "the others" (rows beyond 10) — small comments on step 1 of create survey already incorporated; Yash re-review pending
- Vishal to share requirements for rows 23–32 by end of day Jul 17
- Faculty experience (QR code generator, individual question view) in progress; design corrections needed; Claude navigation issues being worked through
- Vishal sharing a recording of Aarti + Vishaka course evaluation discussions (analytics, workflows, metrics decisions)
- Himanshu temporarily redirected to exam management DS work; he + Vinay will build shared DS components used by both exam-management and PCE teams
- Romit's designs must be DS-compliant; coordinate via existing weekly Himanshu call
- Engineering continues development independently; UI enhancements applied retroactively before Cohere (Sep 2026)
- Design priorities for next two weeks: distribution workflow + analytics

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0716_01 | **Priority order: rows 19, 20, 21 are the current active design focus.** Vishal: "from the priority perspective, you can first focus on row 19, 20 and 21. Because we are going in that order." T19 (course detail), T20 (faculty self-view), T21 (course distribution viz). | pce | T19, T20, T21 |
| D_PCE_0716_02 | **Rows 23–32 requirements incoming from Vishal by Jul 17 EOD.** Vishal: "by tomorrow end of the day I will also have enough requirement captured in the document for you to start this section 23 to 32." Design is unblocked on T19–T21 while requirements are being prepared. | pce | T120 |
| D_PCE_0716_03 | **Design focus for next two weeks: distribution workflow + analytics.** Vishal: "for next couple of weeks, right. look at all the nuances and design complete the designs of the distribution workflow and also analytics." Supplements existing T49/T104 (distribution) and T100/T116/T117 (analytics). | pce | T49, T104, T100, T116, T117 |
| D_PCE_0716_04 | **All PCE designs must be DS-compliant; Himanshu + Vinay building shared components.** Vishal: "your designs needs to stay design system compliant." Himanshu temporarily working on exam management screens where DS doesn't fit; will also enhance DS and build components with Vinay that are shared across exam-management and PCE. Romit to coordinate via weekly Himanshu call. | pce, exam-management | — |
| D_PCE_0716_05 | **Engineering applies UI enhancements retroactively before Cohere (Sep 2026).** Vishal: "none of this is going to block engineering development. Engineering is going to continue to develop the workflows. Any UI enhancements which are needed. Now they will retroactively go and make those changes. So before cohere." Engineering is not blocked on design system compliance changes. | pce | T85 |
| D_PCE_0716_06 | **Vishal sharing Aarti + Vishaka course evaluation meeting recording.** Covers analytics workflows, which metrics to keep vs. drop, and other decisions. Romit to review when received. | pce | T100, T116 |

---

## Verbatim quotes (Vishal)

> "from the priority perspective, you can first focus on row 19, 20 and 21. Because we are going in that order."

> "by tomorrow end of the day I will also have enough requirement captured in the document for you to start this section 23 to 32."

> "your designs needs to stay design system compliant."

> "none of this is going to block engineering development. Engineering is going to continue to develop the workflows. Any UI enhancements which are needed. Now they will retroactively go and make those changes. So before cohere."

> "imansu is going to help us with exam management for a while. So we have design system. exam management has some screens where the design system is not probably fitting in well. So the manu is going to look into those. So he'll also parallelly work on enhancing the design system. And he'll also be working with vinay to build those components."

> "those components would be used by both the teams exam management and course [evaluation]."

> "I'm going to share a recording of the meeting course evaluation discussions we have had with ati and vanadara. So if you don't have it already, I'm just share it with you."

> "for next couple of weeks, right. look at all the nuances and design complete the designs of the distribution workflow and also analytics."

## Verbatim quotes (Romit)

> "I have started exploring each of the problem statement and associate a analytics feature in that."

> "Yes I have so the some of those features like for example it has like QR code generator and like you know seeing individual questions. So that is also something which I'm working on right now."

---

## Design tasks generated

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T120 | Rows 23–32 design scope — await requirements from Vishal | Admin | PCE (rows 23–32 per PRD sheet) | P1 — BLOCKED pending requirements from Vishal (due Jul 17 EOD) | D_PCE_0716_02. Vishal will share requirements document by end of day Jul 17. Do not start until requirements land. |
| T121 | Review Aarti + Vishaka course evaluation meeting recording (Vishal to share) | Design | Research | P1 — ACTION ITEM | D_PCE_0716_06. Recording covers analytics workflows, which metrics to keep vs. drop, and broader course evaluation decisions. Review when received to inform T100, T116, T117. |
