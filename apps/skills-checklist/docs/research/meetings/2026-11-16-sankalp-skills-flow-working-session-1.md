---
type: meeting
date: 2026-11-16
product: skills-checklist
participants: [Sankalp Panda, Romit Soley]
source: granola
granola_id: f3cecc8a-89d3-4266-95a5-dac77ed9a55c
---

# Skills Flow Working Session 1 — 2026-11-16

**Date:** 2026-11-16 7:30 AM EST
**Participants:** Sankalp Panda (Engineering), Romit (Design)
**Topic:** Skills admin setup flow review — Sankalp walks through Claude-generated prototype, Romit reviews existing design against it; resolve information architecture (library, skill list, evaluation methods, course mapping)

---

## Summary

Sankalp had spent the prior week reviewing ~30 of the 100+ client skill forms in the existing system. He built a Claude prototype to demonstrate a simplified admin setup flow for skills. The session was Sankalp walking through that prototype and Romit reviewing it against the current design. Key outcome: the separate "Library" navigation section is eliminated — skill lists ARE the library. Evaluation methods are centralized. Additional metadata fields are cross-cutting (apply regardless of method). Design system decision (old Angular vs. new React) deferred to a Sankalp–Yash call on Nov 17.

---

## Topics covered

1. Findings from reviewing 500+ forms across ~100 clients — most programs have one skill list, one evaluation method
2. Skills information architecture simplification — skill list replaces library
3. Skill list creation flow: name → assign to students → save → add skills within
4. Centralized evaluation methods (one method per program in 95%+ of cases)
5. Two-part structure of evaluation forms: scoring questions + additional metadata fields
6. Per-skill question override as an edge case (not Phase 1 required)
7. Design system decision: old Angular (Prism-integrated) vs. new React (standalone) — pending Yash/Arun confirmation
8. Course mapping → skills should be visible within the Prism course page
9. Reports as default landing page after setup
10. Phase 2: preceptor module integration (not Phase 1)
11. Student view not yet designed — priority for follow-up session
12. No migration of existing clients

---

## Decisions table

| # | Decision | Product | Applies to | ADR |
|---|---|---|---|---|
| D1 | **Skill list IS the library.** No separate "Library" navigation section. Each program creates named skill lists; skills live inside them. | skills-checklist | Admin setup | — |
| D2 | **Categories and tags merged into skill list page.** Not a standalone navigation section. Admin manages categories/tags within a specific skill list. | skills-checklist | Admin setup | — |
| D3 | **Evaluation methods are centralized.** Admin creates one evaluation method (95%+ of clients use just one method for all skills). Applied to all skills by default. Per-skill override is a 2% edge case — not required for Phase 1. | skills-checklist | Admin config | — |
| D4 | **Evaluation form = two distinct parts.** (1) The scoring questions (pass/fail, demonstration levels, checklist items, etc.). (2) Additional metadata fields (date performed, unit, shift, notes, license number, etc.) — cross-cutting, apply to ALL skill submissions regardless of method. Schools configure which metadata fields to capture. | skills-checklist | Admin config / Student | — |
| D5 | **Skill list creation simplified.** Flow: give a name → assign to students (default: all students) → save → add skills within that list. No multi-step wizard during list creation. | skills-checklist | Admin setup | — |
| D6 | **Clicking a skill list loads the entire page** (not a drawer). Back button returns to skill list listing. Page title changes to the skill list name. | skills-checklist | Admin setup | — |
| D7 | **Zero state**: when no skill list exists, show only "Add new" / create button. No other content. | skills-checklist | Admin setup | — |
| D8 | **Reports as default landing** after setup is done. Admin should land on reports, not setup screens, once at least one skill list exists. | skills-checklist | Admin | — |
| D9 | **Skills within Prism course pages.** Skills mapped to a course should be viewable within that course in Prism. Likely surfaced under a Skills section alongside learning activities. Final placement to confirm with LAM team. | skills-checklist | Admin / Prism integration | — |
| D10 | **Phase 2: preceptor module integration.** Phase 1 = student selects skills and submits via delegator link (admin distributes). Phase 2 = integrate preceptor module so preceptors see skills natively. | skills-checklist | Phase planning | — |
| D11 | **No migration.** Existing clients continue using patient log forms. New skills module is for new clients or clients who opt in. | skills-checklist | Phase planning | — |
| D12 | **Design system decision PENDING** (Sankalp to confirm Nov 17 with Yash/Arun). Option A: old Angular design system (if skills integrates inside Prism pages). Option B: new React design system (if skills stays as a fully separate standalone module with its own tab). Student module is currently Angular — if student view is in Prism, old system required. | skills-checklist | Engineering | — |
| D13 | **Student view not yet designed.** Student side of skills module was not covered in this session. Priority for next working session — Sankalp noted this is the harder part. | skills-checklist | Student | — |

---

## Verbatim quotes

> "Library we can remove then right, because your library sits within a list right?" — Sankalp

> "Skill list categories and tags can be just skill lists, and here you can have list categories tags mentioned right? Just your evaluation setting becomes 1 point, and course mapping becomes 1 point." — Sankalp

> "In 90–95 percent of cases I have seen they have just one way [evaluation method]... For everything it is the same." — Sankalp

> "These are the 4 options only where you say... one option is just pass/fail, right?... Demonstration level is you just say observed, assisted, independent... Checklist... Rated performance." — Sankalp

> "These sections that I showed you, right? Would still be applicable — like date, which unit, and all. So you see, there is a separate section." — Sankalp (on cross-cutting metadata fields)

> "Student ने जो भेजा है मैंने वो review किया है. What if like 10 skill करने थे student ने 8 ही भेजे? तो preceptor आठ ही review करेगा." — Sankalp (on Phase 1 student-initiated flow)

> "Migration नहीं कर पाएंगे... A lot of them will continue tracking it via the patient log." — Sankalp

> "If this has to be part of Prism, then will have to go into the older design system... It could only be done in Exam Management because those are completely separate modules." — Sankalp

> "I would say कि let's go with the old one... because if the student side is in Prism, it has to be old Angular." — Sankalp (before deferring to Yash/Arun)

> "The more difficult part would be student — that we do, we are not going to add any different tile or anything... today in our system student कैसे skill को access करेगा?" — Sankalp

---

## Design tasks generated

See `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_17 through T_SC_24
