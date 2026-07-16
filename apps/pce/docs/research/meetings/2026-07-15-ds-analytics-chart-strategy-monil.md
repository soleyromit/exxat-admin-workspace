---
type: meeting
date: 2026-07-15
product: pce
participants: [Romit Soley, Monil]
source: granola
granola_id: 1e018244-23d5-4121-9996-46c04eb59482
---

# Design system refinement — analytics charts, theme approach, and product integration — 2026-07-15

> Romit + Monil design sync. Topics: DS theme approach (dynamic themes coming, but weeks out — Romit continues on new DS), analytics chart library strategy for course evaluation (observable plot for advanced viz, high charts as production target, DS catalog as first reference), surface-first UX pattern for analytics (summary visible, expand on double-click for full view + grid), export capability requirement, assessment scope handoff (Romit = course evaluation only; product team + Monil audit assessment from next week), portal landing page ownership, and Cohere conference booth planning.

---

## Topics covered

- DS theme approach: dynamic theme system in progress (Wina); Romit unblocked to continue using new DS
- Analytics chart selection rule: DS catalog first, observable plot if not available, high charts for production
- Observable plot use cases: medians, year-over-year comparison, four-quadrant charts, range/average plots, Sankey, heatmap
- Analytics UX pattern: surface-level summary → double-click to expand (full view + grid data)
- Export requirement: analytics charts must support PNG/PDF and data export
- Assessment scope: Romit focus = course evaluation only; assessment UI handed to product team; Monil auditing DS compliance from next week
- Portal landing page: Romit owns it; needs DS update; new marketing product names from Kunal infographic to replace current labels; marketing team owns content/colors within framework
- Cohere conference booth: Aarti wants usability testing / feedback collection at September conference; Romit to prepare initial plan by Monday's call

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0715_01 | **DS chart catalog is the first selection point for analytics charts; observable plot is the fallback for advanced visualizations.** Monil: "I'll harden the rule so that at first look the chart should be picked from here. Then you can prompt it if there is nothing available or if it's picking the wrong chart." DS catalog to be updated as new chart types are designed. | pce | T116 |
| D_PCE_0715_02 | **Analytics surface pattern: primary information visible at surface; charts scalable via summary → expand.** Romit: "primary information should be at the surface level. Those information should stay there." When a chart has 30+ data points, show a compact summary tile; double-click/expand reveals full chart + grid data. Inspired by Monday.com widget expand pattern. | pce | T116 |
| D_PCE_0715_03 | **Analytics export capability required: PNG/PDF and raw data export.** Romit: "we need to have that flexibility where I can export the data in these different formats." Users combine Exxat analytics with external platforms (e.g., influx) and need portable data. | pce | T117 |
| D_PCE_0715_04 | **High charts is the production chart library target; Monil to obtain key from Wina.** Monil: "I'll talk to Wina if I can get the key for high chart. That would be even better because at the end in product they will use high charts." Observable plot used in prototype exploration only. | pce | T117 |
| D_PCE_0715_05 | **Assessment UX: Romit is NOT responsible. Arun confirmed Romit's scope = course evaluation only.** Romit: "Arun told me that just focus on course evaluation. Assessment is something which the product team will take care of." Monil to audit assessment experience for DS compliance from next week. | pce | — |
| D_PORTAL_0715_01 | **Portal landing page: Romit owns it. Needs DS update and new marketing product names.** Monil: "you can take the lead on sort of creating that page." New labels from Kunal's infographic (emailed to Romit) replace current product labels at the entry point. Some components Romit added are unnecessary and should be removed in the DS update pass. Marketing team governs content + colors within the design framework. | portal | T118 |
| D_PORTAL_0715_02 | **Marketing team owns colors/icons/branding on portal entry point; Romit governs experience framework.** Monil: "I am governing the experience part and they are governing the content part." Design the entry point as a framework with placeholders; align with Aarti + Kunal before involving marketing on content. | portal | T118 |
| D_MISC_0715_01 | **Cohere conference booth (September): usability testing or feedback collection; Romit to prepare initial plan.** Romit: "I was thinking like starting next week we can discuss around it — whatever the design team has come up with so far, if that can be used to market or test our product, then we can think of different strategies." Initial plan to be shared before Monday's call. | pce | T119 |

---

## Verbatim quotes (Monil)

> "I'll harden the rule so that at first look the chart should be picked from here. Then you can prompt it if there is nothing available."

> "I'll talk to Wina if I can get the key for high chart. That would be even better because at the end in product they will use high charts."

> "you can take the lead on sort of creating that page — the landing page."

> "I am governing the experience part and they are governing the content part."

> "A new update — I've also created a catalog like you suggested. And in this it has some of the graphs."

> "do let me know which all new graphs that you have prepared. What I'll do is I add it to the design system."

> "from assessment point of view I was talking to Vishal. I can look at this from two viewpoints: the UX and the design system thing, and the product thing which is the journeys."

> "I've not really started auditing anything — I will pick up from next week."

## Verbatim quotes (Romit)

> "primary information should be at the surface level. Those information should stay there."

> "we need to have that flexibility where I can export the data in these different formats."

> "Arun told me that just focus on course evaluation. Assessment is something which the product team will take care of it."

> "I haven't yet specifically adapted to the new design system. I think there is some — for example they ask you think that was showing off which wasn't necessary — or like some of the components here and there, so that is something those changes I'll do."

---

## Design tasks generated

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T116 | Course evaluation analytics — implement surface-first chart pattern: compact summary tile with expand-on-double-click for full view + grid data | Admin | PCE analytics (all chart surfaces) | P1 — DESIGN-REVIEW | D_PCE_0715_01, D_PCE_0715_02. Apply when building each analytics chart. DS catalog is first chart source; observable plot for advanced viz (Sankey, heatmap, four-quadrant, range/median). Pattern inspired by Monday.com widget expand. No code equivalent yet. |
| T117 | Course evaluation analytics — export capability: PNG/PDF chart export + raw data export | Admin | PCE analytics | P1 — DESIGN-REVIEW | D_PCE_0715_03, D_PCE_0715_04. Required for all analytics surfaces. Production chart library = high charts (Monil to get key from Wina). Observable plot for prototype only. |
| T118 | Portal landing page — DS update + new marketing product names from Kunal infographic | Admin | Portal entry point (`apps/portal/`) | P1 — DESIGN-REVIEW | D_PORTAL_0715_01, D_PORTAL_0715_02. Remove unnecessary components added to existing build. Replace current product labels with marketing names from Kunal's email infographic. Align with Aarti + Kunal before involving marketing team. Marketing owns content/colors within experience framework Romit defines. |
| T119 | Cohere conference booth plan (September) — prepare initial strategy for Monday discussion | — | Planning | P1 | D_MISC_0715_01. Options: usability testing, feedback collection, product showcase. Share draft plan before Monday's placeholder call with Monil. |
