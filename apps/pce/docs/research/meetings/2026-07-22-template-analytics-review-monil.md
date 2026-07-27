---
type: meeting
date: 2026-07-22
product: pce
participants: [Romit Soley, Monil]
source: granola
granola_id: b1f1e827-33a9-4111-a39f-199960ebd0e4
---

# Template creation and analytics review with design feedback — 2026-07-22

**Date:** 2026-07-22 10:32 AM EDT
**Participants:** Romit (Microphone, showing designs), Monil (Speaker, reviewing/giving direction)

---

## Topics covered

1. Template creation screen: multi-instructor/persona overflow indicator
2. Template settings → builder step order (Vishal's direction confirmed)
3. Nine-scenario design review for dashboard term cards
4. Multi-survey analytics: screen readiness and review cadence
5. Faculty role hierarchy filter requirement for analytics
6. Qualitative feedback categorization in results view
7. Analytics chart library confirmation (Highcharts)
8. Focus directive: hold analytics, prioritize template creation + evaluation distribution

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0722_01 | **Template settings FIRST, builder SECOND — confirmed.** Monil relaying Vishal: "we will be moving template settings to step one and build a two step two. I was not able to convince yes. So we will have to go back to again the same order that you had. Sorry for that." Confirms the two-step structure Romit had originally proposed. | pce | T128, NR-06 in weekly assessment |
| D_PCE_0722_02 | **Multi-instructor overflow indicator: +N design confirmed.** Monil: "only you can accommodate is for multiple faculties here." Design uses +N chip with tooltip listing all instructors + roles. Already correctly implemented in surveys list code (extraInstructorCount). Apply to template view when built. | pce | AD-09 in weekly assessment |
| D_PCE_0722_03 | **Faculty role hierarchy filter required in analytics.** Two levels: (1) faculty role (Instructor / Coordinator / Lab Instructor / etc.) then (2) person within that role. "you need to make one more filter which is the faculty role… you will have to accommodate filters also at this hierarchy, meaning the faculty role hierarchy." | pce | NR-04 in weekly assessment |
| D_PCE_0722_04 | **Analytics screens: HOLD.** "right now, do not spend more time on the prototyping this section because I am yet to review it. Once I review it, I will give you proper requirements… you will not be doing rework again." Multi-survey analytics (board, term tabs) blocked pending Romit + Monil review session. Only faculty + overview tabs ready for review. | pce | BL-04 in weekly assessment |
| D_PCE_0722_05 | **Highcharts confirmed as chart library.** "there is already a high chart library that reporting team recommends using it." All custom charts (score landscape, trend sparklines, etc.) use Highcharts via the reporting team's existing setup. Not building charting from scratch. | pce | Applies to all analytics surfaces |
| D_PCE_0722_06 | **Focus priority: evaluation distribution + template creation screens.** Monil: "you should hold down on analytics for a couple of days. Let me come back and review and give you feedback. Till then you can focus on perfecting the evaluation distribution and template creation screens… sit on each of the screens and think of all the possibilities and try to accommodate them." | pce | Sequencing guidance |
| D_PCE_0722_07 | **Template builder vertical vs horizontal layout: user-test with David.** Monil not satisfied with vertical scroll for long template question lists: "doesn't this horizontal layout be a better option?" But Romit argued against horizontal due to space constraints. Monil: "let's review it but let's do it quickly… we can ask David to review this and tell us whether he's able to create a template." Blocked on user review. | pce | BL-05 in weekly assessment |
| D_PCE_0722_08 | **Nine dashboard scenarios: Monil to create Excel-format scenario matrix.** Design already covers 9 scenarios (first card = create template CTA, etc.). Monil: "I will try to create an excel formatted scenarios which explains exactly what happens when and who is the anchor information." Reference: the Notion doc Romit shared days prior. | pce | T125, D_PCE_0720B_03 |

---

## Verbatim Monil quotes

> "we will be moving template settings to step one and build a two step two. We mentioned that. Okay. Yeah. So I think I remember you had proposed the same order of having template settings first and Builder as second. I was not able to convince yes. So we will have to go back to again the same order that you had. Sorry for that."

> "only you can accommodate is for multiple faculties here."

> "you need to make one more filter which is the faculty role… within the faculty, the person who is evaluated can be instructor, coordinator, lab instructor… so this would be the structure. Now you will have to accommodate filters also at this hierarchy, meaning the faculty role hierarchy."

> "right now, do not spend more time on the like prototyping this section because I am yet to review it. Once I review it, I will give you proper requirements. What exactly — what are the five graphs that we need? We'll have a limited graphs and trends that we need to show. We'll not show 10 15. So yeah, once I come back, you will have better clarity. Then you will not be doing rework again."

> "there is already a high chart library that reporting team recommends using it. So whatever we want to build, even if we want to build let's say this graph, then we need to find a relevant high chart graph for this."

> "you should hold down on analytics for a couple of days. Let me come back and review and give you the feedback. Till then you can focus on perfecting the evaluation distribution and template creation screens."

> "doesn't this horizontal layout be a better option? Because user will have to scroll so much."

> "I am not fine with it. But you are saying that you need to work on something. So you can do your work and then we can review it. I don't want to on the face say no. Let's review it but let's do it quickly."

> "we can ask David to review this three and just tell us whether he's able to create a template or does he face any issues?"

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T131 | Template editor: settings-first, builder-second step structure | P1 — DESIGN-REVIEW | D_PCE_0722_01. Romit to define what goes in "settings" step (name, likert pointer, opening instructions, etc.). Cannot implement without settings fields defined. No code change until design is confirmed. |
| T132 | Faculty role → person hierarchy filter in analytics | P1 — DESIGN-REVIEW | D_PCE_0722_03. Two-level filter: role first, person within role second. Requires mock data shape change (instructors as array with role + personId). No code change until hierarchy structure confirmed with Monil. |
| T133 | User test: template builder layout — vertical vs horizontal — with David | P1 — USER TEST | D_PCE_0722_07. Monil to schedule with David. Outcome determines layout direction before any code work. |
