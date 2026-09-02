---
type: meeting
date: 2026-09-01
product: course-eval
participants: [Romit Soley, PM (unidentified — likely Nipun or Monil)]
source: granola
granola_id: e7f0d9d8-6686-4dce-9e98-38fefa32438f
---

# Course Eval sync up — 2026-09-01

**Date:** 2026-09-01 9:30 AM EDT
**Participants:** Romit (note-taker), PM (name unclear from transcript — references Himanshu, Vishaka, Vinay, Monal, Kunal)

**Note:** Course-evaluation product is not in this workspace's apps directory. Decisions documented under exam-management for completeness. No screen code changes applicable.

---

## Topics covered

1. Common setup — academic calendar settings (enabling existing Prism academic year vs. creating new)
2. Role access / RBAC — complex RBAC grid architecture; Vishaka leading solution design
3. Onboarding flow — 4-step experience definition (academic calendar → evaluation rules → communication → templates)
4. Dashboard — Himanshu's design selected over Romit's; Romit to focus on workflow screens only
5. Term setup scope — manual only, no migration from Prism; listener job for future Prism terms
6. Design process / feedback loop — PM feedback on design velocity and collaboration gap with Himanshu

---

## Decisions

### Course evaluation (product not in scope for this workspace — documented for completeness)

| ID | Decision | Product | Notes |
|---|---|---|---|
| D_CE_0901_01 | **Dashboard design — Himanshu's version selected.** PM reviewed Romit's dashboard and went with Himanshu's design. "I couldn't even look at those designs to be frank." Romit's focus going forward = workflow screens only (survey distribution, view survey, single survey analytics, survey details). | course-eval | Not applied — course eval out of scope and not in repo. |
| D_CE_0901_02 | **Dashboard layout confirmed.** Shows: (1) live term KPI metrics, (2) last closed term KPI analytics overview, (3) response rate trend visualization, (4) rating trend for courses and faculty, (5) action items. Actions: one action visible at top; remaining actions behind three-dots overflow menu. | course-eval | Himanshu's design. Not a Romit deliverable. |
| D_CE_0901_03 | **Onboarding flow — 4 steps.** Step 1: Academic calendar. Step 2: Evaluation rules. Step 3: Communication. Step 4: Templates. Role access EXCLUDED. "access we can ignore that will not be part of onboarding." | course-eval | → T119 |
| D_CE_0901_04 | **Onboarding is dismissible.** Sits on top of the dashboard, not blocking it. User can close it. When closed: show message "you can always find this under settings." "We don't want to be intrusive." | course-eval | → T119 |
| D_CE_0901_05 | **Academic calendar — primary path not yet designed.** Primary use case: enable an existing Prism academic year + its terms for course evaluations. Secondary: create a new academic year. Only the secondary path is currently designed. "Most of our customers would already have academic year and terms set up." | course-eval | → T120 |
| D_CE_0901_06 | **Onboarding completion criteria per step.** Academic calendar: at least 1 term set up = done. Evaluation rules: default rating scale + benchmarks shown; user reviews and confirms (faculty roles must be explicitly selected). Communication: user navigates to page and confirms/proceeds. Templates: shown; content created internally for beta. | course-eval | → T119 |
| D_CE_0901_07 | **Rating scale: default 5-point. Benchmarks: default 74 and 4.** Some customers use 4-point scale so not hard-coded. Faculty roles to evaluate must be explicitly selected by admin — cannot be pre-selected because they are tenant-defined. | course-eval | Evaluation rules step. |
| D_CE_0901_08 | **Terms — manual setup, no Prism migration.** All terms for course evaluation must be manually configured. "We don't want to conjugate user is what are the same." A background listener job will sync future Prism-created terms automatically. No historical migration — "for this module since it is new historical data may not make any sense." | course-eval | → T120 |
| D_CE_0901_09 | **RBAC — complex new design needed.** Standard roles (not custom): super admin (institution scope), program admin (program scope), program admin limited (program scope), course manager (course scope), instructor (association scope). Permissions: tenant-level admin, course-level admin, course-level content. Course manager + instructor NOT selectable at user creation — resolved through course-faculty role associations at runtime. | course-eval | → T121 (DESIGN-REVIEW). Read RBAC recording + Excel + 1-pager from PM first. |
| D_CE_0901_10 | **RBAC grid — single merged grid.** Faculty roles are additional columns in the RBAC grid (not a separate grid). Admin maps each faculty role to course manager or instructor RBAC role. "In a way you are merging these into this. Right. So you're adding a new column here. Which says faculty roles." | course-eval | → T121 |
| D_CE_0901_11 | **Add-user flow.** When adding a user, only super admin and program admin selectable. Course manager / instructor are NOT selectable — resolved by course-faculty associations. UX must communicate why these roles can't be selected at user creation. | course-eval | → T121 |
| D_CE_0901_12 | **Custom roles — NOT being built for course evaluations.** "We won't be building custom roles for course evaluations at least." Standard roles only. | course-eval | No action. |
| D_CE_0901_13 | **Templates — beta customers do not create templates.** Internal Exxat team creates templates for beta customers. Templates step appears in onboarding UI but content creation is Exxat-side. Fast (existing tool) is too complex for end users. "Internally when we are releasing this to beta customers we are going to work with them and we are going to tell them that they don't create templates by yourself." | course-eval | No template UX action for beta. |

---

## Verbatim quotes

> "access we can ignore that will not be part of onboarding" — PM (role access exclusion from onboarding)

> "I couldn't even look at those designs to be frank. Right. So I told you that I have a demo." — PM (on Romit's dashboard design)

> "If you set up any at least one term that is done." — PM (academic calendar onboarding completion)

> "Faculty roles to evaluate needs to be explicitly selected. We don't even know what. The roles are. They can have a, b, c as a third and year old." — PM (on why faculty roles can't default)

> "We don't want to be intrusive. So it will probably sit somewhere on top of the dashboard. But if users wants to close it they can close it." — PM (onboarding dismissibility)

> "In a way you are merging these into this. Right. So you're adding a new column here. Which says faculty roles." — PM (RBAC grid single-grid architecture)

> "We have abstracted it out is. We can create an RBAC grid. You have a super admin who is at an institution level program admin program admin limited at a program level course manager at a course level instructor at an association level." — PM (RBAC roles)

> "Rating scale can be selected by default to file. Benchmarks also can be defaulted or rather should be defaulted to 74 and 4." — PM (evaluation rules defaults)

> "For this module since it is new historical data may not make any sense. So let's not conjugate user." — PM (on no term migration)

> "We need to split sometimes." — PM (on design process when iterations are blocking)

---

## Design tasks generated

| Task | Product | Priority | See |
|---|---|---|---|
| T119 — Course eval onboarding flow design (4-step; dismissible; completion criteria per step) | course-eval | P1 | Backlog |
| T120 — Academic calendar: design primary path (enable existing Prism academic year + terms for course eval) | course-eval | P1 | Backlog |
| T121 — RBAC UX: merged RBAC grid + add-user flow distinguishing institution-level vs. association-resolved roles | course-eval | P1 — DESIGN-REVIEW | Backlog |
