---
type: meeting
date: 2026-07-19
product: exam-management
participants: [Romit Soley, Aarti]
source: granola
granola_id: 1bc03a5a-ecd1-4d2d-8fd0-8423c5fdd763
---

# Modular product strategy — pricing tiers, upsell opportunities, and AI capabilities (2026-07-19)

> Aarti + Romit. Topics: module launcher layout specifics, cross-sell/upsell strategy context, module-to-persona mapping, AI capability principle.

## Topics covered

- Layout constraints and grid direction for the module launcher / product overview screen
- Interactive product ecosystem diagram concept
- Visual treatment: subscribed vs non-subscribed modules
- Modular pricing strategy context (program-length tiers, foot-in-the-door approach)
- Module-to-user persona clustering
- AI capability principle: AI must always be paired with point-and-click UI
- Next team conversation: week of August 3rd (Vishaka will participate)

---

## Decisions

| ID | Decision | Product | ADR |
|---|---|---|---|
| D_EM_0719_01 | **Module launcher: no-scroll, all products visible.** "the goal is without scrolling I need to know what exact offers." Layout is Romit's call — Aarti suggested: top row = one prominent product, remaining rows = 2 columns. Not prescriptive — "you can use some of your design thinking to decide." | exam-management (cross-product platform) | Supplements T101, D_EM_HIM05, D_EM_0702_05 |
| D_EM_0719_02 | **Module launcher: incorporate interactive product diagram.** "I also like what product was doing with that diagram. So if there's a way to even incorporate that diagram and then like explore exact and then like you know give them a way to explode that." Users can drill into / expand from the diagram view. | cross-product platform | Supplements T101 |
| D_EM_0719_03 | **Module launcher visual treatment: subscribed = grayed, non-subscribed = emphasized.** "the ones that you already have can be grayed out and the ones that you don't have can be given a little bit more important or whatever." Purpose: expose current clients to upsell opportunities inside the product itself. | cross-product platform | Supplements T101 |
| D_EM_0719_04 | **Module-to-persona clustering.** Clinical education director = clinic. Academic/education director = exam management. "Curriculum mapping and exam management could probably belong to the same user just like compliance and clinic belongs to the same category of users." | cross-product platform | New — informs persona docs |
| D_EM_0719_05 | **AI capability principle: always paired with point-and-click.** "this capability have to be done through point of click also no matter what we do." AI supplements existing UI; never replaces it. No standalone "loop through all courses" AI interface needed. "we can have both ways of working with the product." | exam-management (all products) | Supplements D_EM_0702_06 |

---

## Verbatim quotes (Aarti)

> "the goal is without scrolling I need to know what exact offers."

> "the ones that you already have can be grayed out and the ones that you don't have can be given a little bit more important or whatever."

> "I also like what product was doing with that diagram. So if there's a way to even incorporate that diagram and then like explore exact and then like you know give them a way to explode that or whatever."

> "Curriculum mapping and exam management could probably belong to the same user just like compliance and clinic belongs to the same category of users."

> "this capability have to be done through point of click also no matter what we do. But in addition to point and click for the basic capabilities we are never going to have the UI that says oh ma'am let me drift through all the courses and do it."

> "we can have both. Ways of working with the product. Where you can either do point and check or you can do this I don't think it would be necessarily need either or."

> "only as we start doing it will we even know this is working this is not working."

---

## Timeline notes

- Aarti is on vacation starting July 20 (just left)
- Next elaborate team AI/strategy conversation: **week of August 3rd**
- Last week of August + first week of September: Aarti in India — more strategic conversations then
- Vishaka will participate in August discussions

---

## Design tasks generated

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T105 | AI capability rule — document and apply across all exam-management AI features | All | Cross-cutting | P1 — DOCUMENTATION | Aarti Jul 19: all AI features must have a point-and-click equivalent. No standalone AI batch-processing UIs. Audit existing AI feature designs for compliance. D_EM_0719_05. |
| T106 | Module launcher — update layout spec with July 19 Aarti direction | Cross-product | Module launcher | P1 — DESIGN-REVIEW | Deferred to August review (per T101). New specifics: no-scroll constraint, 2-column grid for lower tiers, interactive product diagram, subscribed=grayed / non-subscribed=emphasized. D_EM_0719_01, D_EM_0719_02, D_EM_0719_03. August 3rd week target for team conversation. |
