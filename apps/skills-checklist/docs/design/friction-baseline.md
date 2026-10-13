# Friction baseline: the current build, counted

Purpose: put numbers on how hard each job is in the **current build** (Sankalp's prototype structure rendered in the DS shell), so the three v2 directions can be compared against something measured, not felt.
Method: counted by walking the built flow (see `admin/components/**`, the parity cards in `docs/build/prototype-parity.md` and the integrated E2E in `admin/.verify/integrated/`). One "interaction" = one click, tap, selection or typed field. Counts are **estimates `[INFER]`** with every assumption stated; they were not timed with users. Treat them as order-of-magnitude.

## Assumptions

- Program imports **100 skills**; about 25 per evaluation model (binary, question, scored, demonstration).
- An average configure is **15 interactions** (model tile, 2 to 10 labels/questions, rule, 0 to 3 submission fields, evaluator toggles, criteria, Continue x2, Save).
- **42 course offerings** (REQ uses the prototype's number), about 10 skills mapped per offering, new mappings default to Mandatory (prototype behaviour).
- Cohort of **150 students**; 16 evaluations waiting approval (the seed's queue).

## Job 1: Admin setup (list in, program ready for students)

| Step | Path in the current build | Interactions | Containers |
|---|---|---|---|
| Import | Library, Import, upload, Read, scan and fix about 10 rows, Create | about 16 | page + 2 dialogs |
| Configure 100 skills | per skill: Configure, 3-step wizard (Continue x2, Save) | about 15 x 100 = **1,500** | 1 dialog x 100 |
| Configure faster (best case) | configure one per model (4 x 15), then "Apply to selected skills", reachable **only inside the wizard** (the S-04 table has no selection column) | about 4 x 15 + 4 x 30 = **about 180** | wizard + apply dialog; not discoverable |
| Map to courses | per offering: select offering, tick about 10 skills; **no copy-from control in the layout** | about 11 x 42 = **about 460** | 1 page |
| **Total** | | **about 2,000** (about 650 if the admin finds Apply) | |

Where it hurts: the work is organised by object (one skill, one offering) while the admin's job is organised by program ("these 25 are demonstrations"). `IM-14` exists in the store but the prototype layout hides it. Mapping repeats across terms because `OD-01` (carry-forward) is open and nothing offers an explicit copy.

## Job 2: Student submits evidence (single skill, in a shift gap)

| Step | Interactions |
|---|---|
| Open Student View, pick course (already selected most days) | 0 to 2 |
| Tick the skill, Send for review | 2 |
| Dialog: Clinical/Lab, setting, role, person | 3 to 4 |
| Completion date (picker) | 2 to 3 |
| Self-evaluation block, **if configured for the skill** | 3 to 8 |
| Send request | 1 |
| **Total** | **8 to 10 without self-evaluation; 11 to 18 with** |

Where it hurts: setting, role and person are asked again on every submission although placement and the last evaluator rarely change within a week. The surface is a 1024px dialog on desktop and a centred dialog on a phone. "What counts" is only visible after opening History (another dialog).

## Job 3: Preceptor signs off (no login)

| Step | Interactions |
|---|---|
| Open the email link | 1 |
| Per skill: outcome (1) plus comment where mandatory (1 to 2) | 2 to 3 each |
| Submit | 1 |
| **Total for 3 skills** | **about 8 to 11** |

Where it holds up: no login, one page. Where it can improve: no summary of what is being asked before the first scroll, no statement of what happens next until after Submit (EV-07 is shown post-submit only).

## Job 4: Reviewer clears the approval queue (16 waiting)

| Step | Interactions |
|---|---|
| Open Review and Approve | 1 |
| Per card: read, Approve (agreeing cases) | 1 each |
| Per disagreeing card: See full responses, type a note, Return or Approve | 3 to 4 |
| **Total (12 agree, 4 differ)** | **about 25** |

Where it hurts: no bulk action, no grouping by agree/differ, 16 filled Approve buttons (an accepted exception C-5). Agreement is a sentence, not a scan-able signal.

## Job 5: Coordinator finds who is lagging and sees why

| Step | Interactions | Containers |
|---|---|---|
| Overview, sort to put lowest first (default sort is highest) | 3 | page |
| Open student | 1 | dialog 1 |
| Open the failing skill | 1 | dialog 1 (expanded) |
| Open the evaluation ("View form") | 1 | dialog 2 stacked |
| **Total to see one failing evaluation** | **6 across 3 stacked containers** | |

Where it hurts: no path from "lagging" to any next step. Remediation and notifications are out of scope (REQ section 14), but the product can still offer **export of the filtered list (RP-10) and a visible list of stalled requests**; today it offers neither as a workflow.

## What the numbers say

| Job | Current | Reasonable target for v2 `[INFER]` |
|---|---|---|
| Setup | about 2,000 | under 300 |
| Student submit | 8 to 10 | 3 to 5 |
| Preceptor | 8 to 11 | 5 to 8 (same shape, better framing) |
| Review 16 | about 25 | about 12 |
| Find lagging + evidence | 6 in 3 stacked containers | 3 in one surface |
