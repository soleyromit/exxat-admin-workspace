---
type: meeting-distillation
date_range: 2026-05-05 to 2026-05-08
product: pce
source: granola
participants: [Aarti, Romit, Vishaka, others]
session: 2026-05-09-design-merge
status: Distilled
---

# Aarti's Approved Designs — May 5–8 2026

> Distilled via `query_granola_meetings`. Captures everything Aarti explicitly liked / approved / agreed with during PCE design reviews. Critical for course-eval merge work — we should preserve these designs, not rebuild parallel.

## Context for this distillation

The new course-eval surfaces (admin term overview, cohort, drill-downs, faculty self-view) were initially built parallel to existing PCE pages. Romit pointed out (2026-05-09) that several existing designs were Aarti-approved, and rebuilding without integrating them is wrong. This file is the source of truth for "what Aarti specifically signed off on."

## Approvals — May 8 PCE Design Session

### A1 — Live monitoring: student-level focus first

> *"My 2¢ is it is a good idea for them to see this first level at the student level only… I'm more concerned about what's going on with the students."* — Aarti

Approved structure: three-bucket layout (not started / in progress / submitted) with scan-band progress visualization.

> *"You know how you have those scan band? Yes. Yes. That's what I was thinking. Interested in this student journey."*

**Where this applies:** primarily Exam Management (live exam monitor). NOT directly course-eval, but the principle of student-journey-first carries over to PCE response cadence views.

### A2 — Question analysis as secondary tab post-exam

> *"…can be a tab that gives me a question level analysis, but that can be a secondary tab, which if and when the exam closes is when I will be more interested in seeing, oh, what happened with question one."* — Aarti

> *"But while the exam is on, like, who cares? Like, do it in any order."*

**Applies to:** assessment review (Exam Mgmt). For course-eval, analog is "per-question detail" sits below "AI themes" on the offering drill-down — already done in `/course-eval/offering/[id]`.

### A3 — Flagged questions / items: status tracking

Aarti approved a flag status system (addressed / dismissed / acknowledged):

> *"Even so the flag status is something that can be valuable… Like, I have eight flags from the question. At the admin, I'm going to try and do something about it. So either dismiss it or address it."*

> *"This also will be used in terms of mapping as well as like, when we want to make the course better. Yeah. Or the curriculum better."*

**Applies to course-eval:** AI-flagged response themes / outlier evaluations could carry the same dismiss/address/acknowledge status workflow. Currently the offering drill-down doesn't have this — gap.

### A4 — Remove redundancy: chart OR numbers, not both

> *"You either need the chart or you need those numbers. You don't need both… Yes. Information in two places."*

> *"Instead of 31% completion, you just showed that graph with that chart over there. Yes. Yes. You don't have to block out that space."*

**Applies broadly across the workspace** — design principle. Audit all new course-eval pages for duplicate metric+chart pairings.

### A5 — Two-color distractor analysis (green + one other)

> *"Just use two colors. Okay. Green is for the right answer and Yes. Yellow or brown or whatever it is for all other answers. And Yes. The length of the [bar] chart tells you which one was the second or the third prominent answer."*

**Applies to:** assessment review (Exam Mgmt). For course-eval, the analog could be "rating distribution" — currently 5 colors, but Aarti's logic suggests 2 or 3 (correct/below threshold/above).

### A6 — Assessment cards with stages + latest note

Aarti engaged positively with assessment cards showing status stages (live / approved / draft) + latest timeline note.

**Applies to course-eval:** could apply to "evaluation cards" on a per-course landing.

### A7 — Course architecture: master course / term / offering

> *"Yes. That is correct. Think through all of that. Add a course, add a term, add a course of[fering]— Right."*

> *"Yes. Yes. Okay. We need to create a functionality for adding other course collaborators."*

**Already shipped at:** `/admin/courses`, `/admin/terms`, `/admin/offerings`. Course-eval correctly uses course-offering as data spine.

### A8 — LMS integration disables manual add

> *"Got it. Okay."* (after full explanation)

**Already shipped:** workspace ADR-002, surfaced in admin entity pages (e.g., students page reads `MOCK_LMS_ENABLED`).

### A9 — Collaborator permission system

Admin-controlled, faculty can add collaborators only if granted that right.

> *"Correct. The admin can assign one to many faculty. But each faculty can have the ability to add more collaborators."*

**Applies to course-eval:** template / survey access — when faculty self-view ships sharing, this model applies.

### A10 — Role titles customizable, meanings fixed

> *"So we have to create four — three or four types of roles. Correct. Give it a default name. And meaning. And what the capabilities are. But then we allow them to add a label to that setup."*

**Applies to:** permissions / role admin. Already in `/admin/permissions` route stub.

### A11 — Course evaluation dashboard: term + cohort grouping

> *"Either I'm looking at it term by term by term. Or I'm looking at it by cohort by cohort… Faculty and courses, I think, is foundational."*

**Already shipped at:** `/analytics` with `<ToggleGroup>` for axis + `<Select>` for term/cohort within the chosen axis. **My new `/course-eval/page.tsx` uses `<Select>` instead of `<ToggleGroup>` — DEVIATION from approved design.**

### A12 — Three views only: admin, faculty, student

> *"Within the administrator view… I only want three views. Administrator, faculty, and students."*

**Already encoded:** workspace ADR-004 (persona collapse). Course-eval correctly has 3 surface tiers.

## Approvals — May 5 PCE Planning

### A13 — Program-level scope for Phase 1

Aarti aligned on tenant-level deferred to Phase 2.

### A14 — Unified "Course Evaluation + Surveys" module

> *"Yes, I'm completely aligned with this. In fact, initially the alignment was different. Initially, the recommendation was that post course evaluation are very separate and they reside within each course. And I had actually said that's a bad idea because the survey is a survey — post course evaluation is a specialized service. It doesn't make sense to have a completely different place for it. So I am totally aligned with this."*

**Already shipped at:** `apps/pce/admin/app/(app)/page.tsx` — module home with FolderCard linking to "Course Evaluation" and "Programmatic Surveys."

**My new `/course-eval` route is a SIDESTEP from this unified pattern** — it bypasses the home and lands directly on the dashboard. The toggle infrastructure should let users go back to `/page.tsx` → `/analytics` to see the originally-approved unified flow.

### A15 — "Programmatic Surveys" naming (Aarti coined)

> *"I think we should call it programmatic surveys because post course evaluation surveys are one set. And then annual student survey, annual preceptor survey — all of these are programmatic surveys that are collected every year."*

**Already shipped at:** `/programmatic-surveys`.

### A16 — AI-first / analytics-first approach

> *"Yeah. I think I like that approach. We should continue to do that."*

**Already shipped:** workspace ADR-005 (AI-first thinking pattern). Course-eval uses `AiInsightCard` per pattern.

### A17 — Configurable access controls with restrictive defaults

> *"Configurable fields are good. Default selections like you're showing is also okay. And they should be able to change it."*

> *"I think we can default to more restrictive, right — default to the safer where people shouldn't be seeing stuff they shouldn't be seeing, and they can edit that and make it less restrictive."*

**Applies to:** template / survey access defaults. Currently in `/templates`. New course-eval should inherit, not parallel.

### A18 — Multi-admin sharing of evaluations

> *"There could be multiple people who want to share the post course evaluation — that definitely should be possible."*

**Applies to:** evaluation sharing. Phase 2 work.

## Integration debt this distillation surfaces

The new course-eval surfaces should integrate with — not parallel — these approved designs:

| New course-eval surface | Approved equivalent that should be merged |
|---|---|
| `/course-eval` (term overview) | `/analytics` — uses approved `<ToggleGroup>` axis + `<Select>` term/cohort. New page should reuse this header pattern, NOT use only `<Select>`. |
| `/course-eval` data | `usePce()` state (analytics page uses this); new page builds parallel `course-eval-mock.ts` |
| `/course-eval` h1 | analytics uses `style={{ fontFamily: 'var(--font-heading)' }}` — new page uses default font |
| `/course-eval/templates` (stub) | `/templates` — fully built; should redirect or merge |
| `/course-eval/me` | `/my-surveys` — exists; new page shouldn't replace it without migration |
| Top-level entry | `/page.tsx` (unified module home with FolderCards) — new course-eval bypasses this |

## Action items from this audit

1. **Add a design toggle** between new and legacy surfaces (immediate — Romit's request)
2. **Apply A4 (no chart + numbers redundancy) audit** across new pages
3. **Adopt A11 ToggleGroup pattern** for axis switching on `/course-eval`
4. **Use `var(--font-heading)`** on new page h1s
5. **Plan `usePce()` state migration** — separate refactor session
6. **Connect `/course-eval` from `/page.tsx` FolderCard** so the unified module entry is preserved
7. **Add A3 flag-status workflow** to AI insight cards (dismiss / address / acknowledge)

Items 1-4 are this commit. Items 5-7 are follow-up work tracked in `apps/pce/docs/specs/course-evaluation.md` §16 maintenance.

## Maintenance

When the team makes new design decisions or Aarti revises approval, append a new section to this file. **Don't silently re-interpret.**
