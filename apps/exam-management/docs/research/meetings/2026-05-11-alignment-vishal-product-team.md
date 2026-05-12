---
type: meeting
date: 2026-05-11
product: exam-management
also-affects: [pce, workspace]
participants: [Romit, Senior leader (Nipun / CTO)]
source: granola
granola_id: 841aa054-0895-491c-9b3f-56fa71716497
---

# 2026-05-11 — Exam management and course evaluation: alignment with Vishal and product team

## Context

Senior leader (appears to be Nipun or CTO equivalent) checking in on Romit's status across exam management and course evaluation. Wide-ranging process alignment call — no deep design decisions, but several important process directives and one product-scope confirmation.

## Topics covered

1. Status of question bank designs — 95–96% done; some arbitrary feedback being incorporated
2. Status of course evaluation — conceptual designs shown to Aarti; some accepted, some rejected; still broad architecture phase
3. Question creation — not started; waiting for PRD finalization
4. Developer team allocation — senior leader had allocated 6 devs; concerned they may be idle / premature
5. Design system — Romit building agents to optimize design workflow; waiting for Himanshu (out of office) on some DS questions
6. Module-based activation — confirmed: student and admin experience will be within the same module, not separate navigation

## Decisions / directives

| # | Decision | Product | Notes |
|---|---|---|---|
| D-0511-1 | Daily sync between Romit and Vishal is mandatory going forward | All | Already established day of call |
| D-0511-2 | Module-based activation: student side is NOT a separate navigation — it lives within the module | Exam Mgmt + workspace | "Within that module itself, we can expect that student side and everything is going to be there" |
| D-0511-3 | Design system: reuse exactly same components across modules — do not reinvent patterns | Workspace | "I just want the same literally the same thing to be used, not reinvented" |
| D-0511-4 | Dev team should wait for further PRD clarity before starting back-end work | Exam Mgmt | Senior leader had allocated resources; Romit to coordinate with Vishal so devs aren't idle doing wrong things |
| D-0511-5 | Romit should NOT be justifying time allocation to Aarti — trust is established | Process | "You have our total trust. Do not solve that problem." |

## Verbatim quotes (senior leader)

> "If we do not have that and if everybody is moving in a slightly different direction, the product is not gonna move forward."

> "You both are going to be working on the same projects, like, for a long time. You both need to kind of connect every day and be on sync."

> "I just want the same literally the same thing to be used, not reinvented. It'd be exactly the same sort of situation or pattern comes up in another module. I just want the same thing to be reused."

> "Ultimately, we'll choose to design our new modules [using] the design system."

> "The real thing is, could not move to a consensus decision, so we did not together move to the next step."

## Design tasks generated

None requiring screen changes. All directives are process-level.

## Things to note (no code impact)

- Romit has been building a Claude-based multi-agent mono-repo for design workflow optimization. Senior leader is aware and supportive.
- Himanshu (DS maintainer) is out of office; some DS alignment questions pending.
- Course evaluation architecture still being finalized in 6 in-person Aarti sessions.
