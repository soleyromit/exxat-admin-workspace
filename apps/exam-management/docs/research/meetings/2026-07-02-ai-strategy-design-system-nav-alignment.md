---
type: meeting
date: 2026-07-02
product: exam-management, pce
participants: [Romit Soley, Aarti (implied — senior decision-maker), Himanshu, Darshan, Vinay, Vishal, Arun, Krishna, and others]
source: granola
granola_id: d2449a66-d404-4c78-be4d-d2c6f4d927ab
---

# EduTech AI adoption strategy — phased rollout, MVP scope, and design system alignment — 2026-07-02

> Large cross-functional meeting covering AI strategy roadmap, exam management MVP scope, course evaluation phases, design system approach, and navigation architecture. Early morning call (4:43 AM ET), Aarti likely in Bangalore. Multiple engineering leads, product, design.

## Topics covered

- AI adoption strategy (4 phases)
- Exam management timeline and MVP scope
- Manual time extension for MVP (accommodation precursor)
- Design system approach — proceed without waiting
- Navigation architecture (top bar vs. left nav debate)
- Module entry point (app-store-style landing)
- Course evaluation Q4 goals
- PRD status process clarification

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_EM_0702_01 | MVP launch: December 2026. Limited availability (10 pilot customers): January 1, 2027. Target 30 customers by June 30, 2027. GA: October 1, 2027. These dates align with academic calendar (new semester starts July 1). | exam-management | §3 phasing in decisions summary |
| D_EM_0702_02 | **Manual time extension in MVP (accommodations precursor).** Students need a field to manually extend exam end time before full accommodations module is built. "At least be able to manually extend the time. It will be the same field that then gets overwritten by the accommodation setup." Phase 2 = full accommodations (separate room, extra time via rules). MVP = a single per-student end-time override in the live monitor. | exam-management | T13 (accommodations module), T3 (live monitor) |
| D_EM_0702_03 | **Design system: proceed now.** Do not wait for Himanshu's design system to be fully signed off. Use existing Exact One React components. Himanshu + engineering to collaborate and incrementally enhance components to match his design system principles. Monthly cadence with leadership to track DS gap (Himanshu to map "200 target controls vs. 85 existing"). | both | D_PCE_630L_02, T77, T88 |
| D_EM_0702_04 | **Navigation direction.** Decision: keep a top utility bar (module switcher, search, Leo, profile) consistent across ALL modules including Prism. New modules (exam management, course evaluation) use Himanshu's left-nav design below that bar. Prism stays as-is structurally but shares the common top bar. Minimized left nav (collapse to icons + breadcrumb label). NEXT STEP: Himanshu to design the top bar + finalize with meeting next week. | both | T88, T99, T57 (partial resolution — Leo in top bar, not left nav) |
| D_EM_0702_05 | **Module entry point deferred to August.** Romit showed the app-store-style concept (subscribed products as cards + cross-sell tiles for non-subscribed). Aarti: "think through this and work with Amit a little bit to have a point of view for us to discuss in August." Direction endorsed: main purpose = operational launcher + secondary cross-sell real estate. Not a pure marketing page. | both | T101 |
| D_EM_0702_06 | **AI strategy phases.** Stage 1 (MVP): AI as feature — question refinement assistance, document import. Stage 2 (Limited avail / Beta): AI watches data, flags attention areas, semantic search. Stage 3 (GA): AI performs tasks, agentic checklists. Stage 4 (post-GA): AI as main interface (chat/audio). Semantic search deferred to beta; proctoring/lockdown browser deferred to beta. | exam-management | §3 phasing |
| D_EM_0702_07 | **Accommodations deferred except manual time extension.** Full accommodations (extra time by rule, separate room, etc.) → Phase 2. But MVP must allow manually extending a student's end time. This field gets overwritten when accommodation rules are applied in Phase 2. | exam-management | T13 |
| D_PCE_0702_03 | **Course evaluation Q4 goal.** Set up data for 5 programs and run limited-availability course evaluations by December 2026. Analytics + reports must be demoable at the conference (show, not blank screen). Distribution and analytics are both needed; Vishal confirmed he has bandwidth to do both. | pce | — |
| D_EM_0702_08 | **PRD "requirements complete" status clarified.** "Requirements complete" = BRD is ready for partner teams (designers, devs, QA) to pick up and work from. Not just conceptual alignment. Two separate statuses needed: (1) "Conceptual alignment done" and (2) "BRD / solution review complete." | process | — |
| D_EM_0702_09 | **Module logos: not wanted.** No module-specific logos. Use Exact logo. Module name = text only (may abbreviate if long). | both | — |
| D_EM_0702_10 | **Page title problem in Prism nav.** Currently, selecting a tab changes the breadcrumb/page title in Prism to the tab name (e.g. "dashboard" instead of "placement"). This is a known bug — "there are a lot of bugs like this." Not immediately in scope but should not be replicated in new modules. | both | — |

---

## Verbatim quotes (Aarti / senior decision-maker)

> "Between now and August twentieth, feel free to have no meetings with me... I'll come here in August, and we'll kind of sit down, and you can show me what we have done."

> "We stick with the new design in general. The only defect we have is that where it says exact one premium, can we continue to have that panel move some of that [Leo, search] to the top bar and live with that."

> "We don't want module logos. Don't even want a very cryptic module name — we just wanted to kind of see what it does."

> "[Module entry page] seems more like a website marketing... But I never want them to forget that there is a course and survey assessment module available." [Then after Romit's demo] "You can think through this and work with Amit a little bit to have a point of view for us to discuss in August."

> "[On accommodations] We don't need to do other accommodations... We do later. But at least be able to manually extend the time."

> "I would prioritize speed over anything else. Have design system finalized in parallel. Once it is signed off and everything, we will do things."

---

## Design tasks generated

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T102 | Manual time extension — per-student end-time override in live monitor | Admin | Live monitor (`assessments/[id]/live`) | P1 — DESIGN-REVIEW | New MVP scope item. A simple field/button to extend an individual student's exam end time. Field gets overwritten when full accommodations are applied (Phase 2). Not a new accommodations module — just a single override control in the live monitor. D_EM_0702_02. NEW SCREEN CHANGE. |
| T103 | Navigation: top bar + new module left-nav (finalizes T99 direction) | Design / Eng | Cross-product nav | P0 — DESIGN-REVIEW | Top utility bar (module switcher, search, Leo, profile) stays consistent across ALL modules and Prism. New modules use Himanshu's left-nav below that bar. Partially resolves T99 (Ask Leo → top bar, not left nav sidebar). Himanshu to design top bar options — meeting next week to finalize. Do NOT apply nav changes until that meeting produces alignment. D_EM_0702_04. |

### Updates to existing tasks

| # | Update |
|---|---|
| T101 | Module entry point concept deferred to August discussion. Direction: operational launcher primary + cross-sell secondary. Not a pure marketing page. Work with Amit on the point of view before August. D_EM_0702_05. |
| T99 | Partial resolution: Ask Leo + search go in the top utility bar (not in left nav). Left nav = module navigation only. Final confirmation pending Himanshu's top bar design (T103). Do not apply yet. D_EM_0702_04. |
| T13 | Accommodations confirmed Phase 2 except manual time extension (T102). Do not design full accommodations UI for MVP. |
