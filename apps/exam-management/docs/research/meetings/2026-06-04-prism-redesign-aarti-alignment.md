---
type: meeting
date: 2026-06-04
product: exam-management, pce
participants: [Romit, Aarti]
source: granola
granola_id: 2ad77c6e-b501-41ab-bcf6-e61a4446b89e
---

# Prism Redesign — React Migration, Module Coexistence, and Himanshu Alignment

## Topics covered

- New Prism modules (exam management, CFE/PCE) must coexist with old Prism modules during transition
- Himanshu alignment required before finalizing new module navigation
- Each new module must function independently of legacy Prism for base entity management
- Course & Faculty Evaluation (CFE/PCE) product structure — two sections
- Student experience in CFE — email-driven, minimal pending-activities dashboard
- Super admin role only for Phase 1 of new modules (no granular role variations at launch)
- Cohere conference — user research booth with Himanshu

## Decisions

| # | Decision | Product | Quote |
|---|---|---|---|
| D_PCE08 | New modules must function independently — base entities self-managed within module; no forced Prism detour | exam-management, pce | "This needs to function independently. They're still saving data in the student entity, but this is operating independently." — Aarti |
| D_PCE09 | New and old Prism modules must coexist — design cannot ignore existing Prism patterns | pce, exam-management | "I also do not want it to be completely on a different island. Where it completely ignores every element of today's prism." — Aarti |
| D_PCE10 | Himanshu alignment required before new module navigation is finalized and shipped | pce, exam-management | "before we say this is ready for consumption, he needs to be included, aligned, and invited to some of these meetings." — Aarti |
| D_PCE11 | Super admin role only for Phase 1 of new modules — defer granular role permissions | pce, exam-management | "we just want to worry about the super admin role … I don't want it to worry about it." — Aarti |
| D_PCE12 | CFE has two distinct sections: Course & Faculty Evaluation + Institutional Surveys — each with its own dashboard | pce | "we are going to have these two entry points and almost treat them as two sections of the product." — Aarti |
| D_PCE13 | CFE student experience is email-driven and minimal — pending-activities landing page aggregates all open survey emails | pce | "I don't expect a lot of people to go here. I expect them to barely do this call to action, click done, dusted." — Aarti |
| D_PCE14 | CFE survey email has two CTAs: direct link to this survey + link to all pending activities | pce | "this email should have both buttons. Like, see all my pending activities or click here to complete this survey." — Aarti |

## Verbatim Aarti quotes

> "I do not want for the new system to be [a copy paste]. I also do not want it to be completely on a different island." — Aarti, 2026-06-04

> "This needs to function independently. They're still saving data in the student entity, but this is operating independently." — Aarti, 2026-06-04

> "before we say this is ready for consumption, he needs to be included aligned, and invited to some of these meetings so that you are not the only one fielding questions." — Aarti, 2026-06-04

> "we are going to have these two entry points and almost treat them as two sections of the product. And I'm good with that. Course and faculty, and institutional surveys." — Aarti, 2026-06-04

> "I don't expect a lot of people to go here. I expect them to barely do this call to action, click done, dusted." — Aarti, 2026-06-04

> "this email should have both buttons. Like, see all my pending activities or click here to complete this survey." — Aarti, 2026-06-04

> "I do not want Himanshu to feel like he's getting sidelined in this conversation." — Aarti, 2026-06-04

## Design tasks generated

| Task | Type | Notes |
|---|---|---|
| T88 | Himanshu alignment — schedule navigation coexistence review before shipping any new module nav | D_PCE10 |
| T89 | PCE/CFE two-section architecture — design two distinct entry points + dashboards for course+faculty eval vs. institutional surveys | D_PCE12 |
| T90 | PCE student email templates — two-CTA email design + pending-activities landing page | D_PCE14 |
