---
type: meeting
date: 2026-07-14
product: pce
participants: [Romit Soley, Vishaka, David, Monil]
source: granola
granola_id: 90332d37-9765-4fc6-a7da-ad2b44a900d0
---

# Post-Course Survey Cadence Meeting (BiWeekly 45 Mins) — 2026-07-14

> Bi-weekly cadence call with Vishaka + David + Monil. Topics: beta launch plan (Sept 15 build-ready, Cohere signup strategy, QR codes for beta signups), PCE nav tab structure (Settings → Setup terminology), default landing page when clicking the PCE tile, dashboard 4 term-card scenarios, clinical term edge case for PA programs, base entity directory (fetch-only Phase 1), and verbiage review logistics.

---

## Topics covered

- Beta launch: build-ready Sept 15; Cohere beta signup via QR codes; GA = Jan 2027 with monetisation
- PCE module nav terminology: "Setup" vs "Settings" — confirmed "Setup" matches Prism everywhere
- Default landing page when clicking PCE tile: current/programmatic split uncertain → homepage overview concept
- Three-card dashboard structure: current / last / upcoming term
- All 4 term card scenarios need to be designed (empty, 1 active, 2 active, 3 active)
- Clinical term edge case: PA programs set year-long "clinical term" → may always appear as current term
- Directory: base entities fetched from Prism; Phase 1 = read-only; edits redirect to Prism
- Contributing faculty feedback: out of scope for Phase 1
- Verbiage review: David + Vishaka want screenshots of every screen to review all copy
- Single vs multi-module tile: post-GA, course eval + programmatic survey under one entry; modularisation seeded at Cohere

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0714B_01 | **Module nav label: "Setup" (not "Settings").** Must match Prism terminology across the board. David: "In rest of the prism product, I think we are using the term setup. If I'm not wrong. So any particular reason why we are changing it to settings in this particular module." Monal confirmed alignment. Note: `ADMIN_NAV` in `app-sidebar.tsx:150` already says "Setup" — confirmation for prototype + any future screens. | pce | — |
| D_PCE_0714B_02 | **Default landing page: homepage overview concept, not defaulting to either module.** Cannot predict whether admin intends to use course eval or programmatic survey. Monal: "I think that will be better. Either it gives them an overview and a couple of ways to go about it. Or give them a nice [stat] that you have five programmatic surveys and 10 post course evaluations that are active." Vishaka: "use like a little pendo tooltip or something the first time they log in saying like the other one is right here." Homepage shows stats from both modules. | pce | T113 |
| D_PCE_0714B_03 | **Four term card scenarios must all be designed explicitly.** Monal: "we need to also capture all these scenarios. One scenario is where the user comes for the first time, which is the empty state. Where nothing is configured. How will it look? Then one scenario where current term is set up and it is live. There is neither the last term nor the upcoming term. And the fourth scenario you have all the terms." Romit to design all 4 in prototype. | pce | T114 |
| D_PCE_0714B_04 | **Clinical term edge case for PA programs: flag for investigation.** PA programs define a "clinical term" spanning the entire academic year. Any course offering in that term will always appear as the "current term" on the dashboard. Monal: "depending now that if you collect the start date and end date of the clinical term, then they will likely put it as July 2026 to June 2027, which is their clinical year. Then. It will always show up as a current term on your dashboard." Vishaka to ask Carol (PA admin) how they collect course evals for clinical courses. Data query suggested: how many PA programs have a clinical term defined. | pce | T115 |
| D_PCE_0714B_05 | **Contributing faculty feedback: NOT Phase 1.** Vishaka: "if contributing faculty also, we want to collect feedback on the course performance. We are not going to cater to that in phase one. But you should have that as a requirement and we should solve for it later." Team-taught courses with multiple contributing faculty — Phase 2+. | pce | — |
| D_PCE_0714B_06 | **Directory: fetch-only in Phase 1; edits redirect to Prism.** Monal: "in phase one, with respect to course evaluation, we will read those data. We will not make any edits. If you want to make any edits — meaning you want to add a missing course offering or a missing instructor — we will navigate them to prism platform. There. They will make the changes and then come back." Confirms T78 / T79 direction. | pce | T78, T79 |
| D_PCE_0714B_07 | **Verbiage review: David + Vishaka need screenshots of all screens, not just the prototype link.** David: "can you also share screenshots of each screen? Because I'm not entirely sure all the screens that I need to review if I'm just clicking around on the link. So you can share the link. But is that okay if you also go through and screenshot each one and send me 10 or 12 or whatever it is screenshot so I can review it." Action item: Monal to share screenshots + link. Verbiage review includes dashboard + templates + directory. | pce | — |

---

## Verbatim quotes (Vishaka)

> "I'm excited to get an update on, like, what's been happening with all the new modules."

> "if contributing faculty also, we want to collect feedback on the course performance. We are not going to cater to that in phase one. But you should have that as a requirement and we should solve for it later."

> "In rest of the prism product, I think we are using the term setup. If I'm not wrong... It's setup. So maybe, monal, we want to stick to that and not like create new terms."

> "use like a little pendo tooltip or something the first time they log in saying like the other one is right here."

## Verbatim quotes (David)

> "can you also share screenshots of each screen? Because I'm not entirely sure all the screens that I need to review if I'm just clicking around on the link."

> "are we using the term setup or settings in prison. It's setup."

## Verbatim quotes (Monil)

> "we need to also capture all these scenarios. One scenario is where the user comes for the first time, which is the empty state. Where nothing is configured. How will it look?"

> "depending now that if you collect the start date and end date of the clinical term, then they will likely put it as July 2026 to June 2027. Then. It will always show up as a current term on your dashboard."

> "in phase one, with respect to course evaluation, we will read those data. We will not make any edits. We will navigate them to prism platform."

> "I think that will be better. Either it gives them an overview and a couple of ways to go about it. Or give them a nice [stat] that you have five programmatic surveys and 10 post course evaluations that are active."

---

## Design tasks generated

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T112 | Confirm "Setup" label in all prototype screens (not "Settings") | Admin | All PCE prototype nav screens | P1 — DESIGN-REVIEW | D_PCE_0714B_01. Code already uses "Setup" in ADMIN_NAV (app-sidebar.tsx:150). Review Lovable prototype for any remaining "Settings" labels in PCE module nav and rename to "Setup". |
| T113 | Homepage landing page: overview of both programmatic survey + course eval modules | Admin | PCE tile landing (new page) | P1 — NEW PAGE NEEDED | D_PCE_0714B_02. Cannot default to either module alone. Show aggregate stats from both (e.g. "5 programmatic surveys, 10 course evaluations active"). Entry points to each module from there. Supplements T46. |
| T114 | Dashboard: design all 4 term-card scenarios | Admin | Dashboard prototype | P1 — DESIGN-REVIEW | D_PCE_0714B_03. Scenario 1: empty state (nothing configured, single CTA). Scenario 2: current term only (no last, no upcoming). Scenario 3: current + last term (no upcoming). Scenario 4: all three terms. Currently only scenario 4 is designed. |
| T115 | Clinical term edge case: investigate PA program data + propose dashboard handling | Admin | Dashboard term cards | P1 — RESEARCH FLAG | D_PCE_0714B_04. PA programs define a year-long "clinical term" → always shows as current term. Vishaka to ask Carol (PA admin) how they collect course evals. Monil to run data query: how many PA programs have clinical term defined. No design change until investigation complete. |
