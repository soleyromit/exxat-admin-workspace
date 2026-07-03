---
type: meeting
date: 2026-07-02
product: pce
participants: [Romit Soley, Monil]
source: granola
granola_id: fdf4dbb5-be0e-410e-be6b-378ebe3503cd
---

# Course Eval sync up — 2026-07-02

> Quick status call (9:30 AM). Monil checking in on create-template and create-survey progress ahead of
> engineering grooming Monday Jul 6. Confirms create template is done; create survey for course
> evaluation is in progress (due same day). Design freeze deadline: end of Jul 3.

## Topics covered

- Create template status: confirmed done
- Create survey status: in progress, target end of Jul 2
- Engineering grooming Monday Jul 6 (Vinai / engineering manager)
- Design freeze before Monday for both create template and create survey
- Design reference hierarchy: PRD first, then lovable prototype
- Scope: programmatic survey explicitly out of current design focus

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0702_04 | **Programmatic survey is NOT in current design scope.** Romit was working on create-survey for BOTH course evaluation and programmatic survey. Monil explicitly scoped this: "Only focus on course evaluation right now. Survey. We should not focus." Programmatic survey design is deferred — not just Phase 2 in product, but out of current active design work entirely. | pce | D_PCE_AAD05 |
| D_PCE_0702_05 | **Engineering grooming is Monday Jul 6.** Vinai (engineering manager) will be groomed for create template + create survey on Monday. Design freeze deadline = end of Jul 3 (tomorrow). "We also aligned with Vinai, who is our engineering manager, and we are going to kick off engineering from Monday. So I have to groom them for create survey and create template on Monday. Let's freeze those designs." Romit has Jul 3 for any remaining minor tweaks. | pce | T28, T29, T97 |
| D_PCE_0702_06 | **Design reference hierarchy: PRD first, prototype second.** Monil: "First start with the PRD. Then with prototype. And then you can see how you want to build it." Both sources are in sync — "there is no single information that is different in prototype and different in PRD." Lovable (prototype) is valid but PRD takes priority when they appear to diverge. | pce | — |

## Verbatim quotes

> "Only focus on course evaluation right now. Survey. We should not focus." — Monil

> "We also aligned with Vinai, who is our engineering manager, and we are going to kick off engineering from Monday. So I have to groom them for create survey and create template on Monday. Let's freeze those designs. And get the confidence." — Monil

> "First start with the PRD. Then with prototype. And then you can see how you want to build it." — Monil

> "There is no single information that is different in prototype and different in PR. So either way work." — Monil (confirming PRD + lovable prototype are aligned)

## Design tasks generated

No new design tasks. This meeting produces urgency/deadline updates to existing tasks:

| # | Update |
|---|---|
| T28 (create template) | Status: **DONE** per Monil. "Create template is done. And preached." |
| T29 (create survey for course evaluation) | **FREEZE DEADLINE: Jul 3.** Romit to complete and share by end of day Jul 2 for Monil review. Final freeze before engineering grooming Jul 6. Course evaluation only — not programmatic survey (D_PCE_0702_04). |
