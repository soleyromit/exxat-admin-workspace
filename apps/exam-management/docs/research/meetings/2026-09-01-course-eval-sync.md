---
type: meeting
date: 2026-09-01
product: course-evaluations
participants: [Romit Soley, PM (course evaluations)]
source: granola
granola_id: e7f0d9d8-6686-4dce-9e98-38fefa32438f
note: stored under exam-management until course-eval has its own product directory
---

# Course Eval sync up — 2026-09-01

**Date:** 2026-09-01 9:30 AM EDT
**Participants:** Romit (Design), PM (course evaluations product manager)

---

## Context

Working session reviewing the current course evaluation design state across: common settings, RBAC, academic calendar, onboarding, dashboard, and template management. PM also used this session to give direct feedback on dashboard design direction.

---

## Key decisions

### D1 — Dashboard design: Himanshu's version is canonical
PM explicitly rejected Romit's dashboard designs. Himanshu's dashboard version was chosen. Romit's single-survey analytics, survey details, and workflow screens remain as-is.

> "I couldn't even look at those designs to be frank. Right. So I told you that I have a demo."
> "Dashboard is something we needed really quickly and himanshu had spent time on it."

**Implication:** Romit's dashboard Figma frames are superseded. No more parallel dashboard designs. Romit focuses on: single-survey analytics, survey details, and workflow screens. Dashboard = Himanshu.

### D2 — Dashboard structure (Himanshu's)
Two terms shown:
- **Live / ongoing term** — KPI row + action items
- **Last closed term** — analytics overview

Below: Response rate trend visualization. Also to include rating trend for courses/faculty, then all other terms (past + future).

Action items panel: ONE primary visible action per item + three-dots menu for additional actions. Current design shows multiple visible actions — reduce to one + overflow.

### D3 — Academic calendar: enable existing Prism terms (primary use case)
The primary use case is enabling existing Prism academic year/term records for course evaluations — NOT creating new ones from scratch. The current design covers only the "create new" path. The "enable existing" path must be added as the primary flow.

> "I would say [enabling existing terms] would be the primary use case. Most of our customers would already have academic year and terms set up."

### D4 — Term setup: always manual (even for migrated customers)
There is no migration of terms into course evaluations. Admin manually selects which of their existing Prism terms to enable for course eval. Even for existing customers, this is a deliberate manual step (avoids cluttering with historical data from other modules).

A background job will sync new terms created in Prism → course evaluations automatically going forward (but historical is not migrated).

### D5 — RBAC: faculty-role-mapped system
Course evaluations RBAC has 5 roles: super admin, program admin, program admin limited, course manager, instructor.

- **Super admin / program admin** — assigned manually at user management level (straightforward)
- **Course manager / instructor** — resolved at runtime through faculty course associations (NOT selectable when adding a user)

Two UI requirements:
1. **Faculty role → RBAC role mapping grid** (one-time system-level setup in common settings): admin defines which faculty roles map to "course manager" or "instructor" RBAC roles
2. **Add user flow**: only shows super admin / program admin options; course manager / instructor roles are NOT shown (they resolve automatically)

> "We need to figure out a way to add users and then give permissions to each user."
> "So we don't show we don't select anything [for course manager/instructor]."

The current "Role access" placeholder screen is not specced out — needs complete redesign based on this RBAC model.

### D6 — RBAC role access: NOT part of onboarding
Role access step is excluded from the onboarding stepper.

> "access we can ignore that will not be part of onboarding"

### D7 — Onboarding stepper: 4 steps
Step 1: Academic calendar (enable at least one term — completion criterion)
Step 2: Evaluation rules (faculty roles explicit select required; rating scale defaults to 5; benchmarks default to 74 and 4)
Step 3: Communication (default templates shown; confirm/proceed)
Step 4: Templates (show defaults; confirm/proceed — internal team builds templates, users do NOT self-create)

Onboarding sits on top of dashboard (non-intrusive banner/stepper). User can close it. On close: show message pointing to Settings. Does not block dashboard.

> "onboarding should not really be intrusive with the with the dashboard"

### D8 — Templates: internal team builds, users confirm
Templates are NOT self-created by end users (too complex: 10–20 configuration steps, scoring not pre-selectable). In onboarding and throughout: show pre-built templates, let users confirm. Internal CX/product team maintains template library.

### D9 — Evaluation rules defaults
- Rating scale: default to 5 (user can change)
- Benchmarks: default to 74 and 4 (user can change)
- Faculty roles to evaluate: NO pre-selection — tenant-specific, must be explicitly selected
- These are the only explicit inputs needed; rest can be defaulted or confirmed

---

## Process feedback (for Romit's awareness)

PM noted a recurring pattern of designs being delivered as "done per spec" when they diverged significantly from exam management visual language. PM's expectation:
- Senior designer fills spec gaps proactively (don't just execute what's written)
- Designs should require 1–2 iterations to close, not multi-week feedback loops
- Romit to propose a better working model in writing (list problems + proposed solution, share with PM)

---

## Action items for Romit

- Retire current dashboard Figma frames; align to Himanshu's dashboard design
- Add "enable existing Prism terms" as primary flow in academic calendar settings
- Redesign role access screen per D5 RBAC model (faculty-role mapping grid + simplified add-user flow)
- Update onboarding to 4 steps (remove role access step)
- Add evaluation rules defaults: rating 5, benchmarks 74/4, faculty roles = explicit select
- Prepare written proposal on design collaboration process with PM
