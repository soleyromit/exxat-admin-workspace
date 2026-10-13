# Skills Checklist (Prism Skills Tracking) — Documentation Index

**Created:** 2026-10-08 · **Owner:** Romit Soley (design) · **Initiative owner:** Sankalp Panda (product)
**Status:** Pre-build understanding pack. No app code exists. Nothing here is a design; it is the clarity layer that design must stand on.

> Purpose of this pack: make it impossible to hallucinate. Every claim below is tagged with where it came from.
> If a claim has no tag, it is wrong. Fix it or delete it.

## Source tags (use these in every doc)

| Tag | Meaning | Authority |
|---|---|---|
| `[REQ SL-01]` | Requirement ID from Sankalp's requirements doc | **Highest** for *what the capability must do* |
| `[OD-07]` | Open decision in the requirements doc | Unresolved — never treat as decided |
| `[PROTO]` | Observed behaviour in Sankalp's clickable prototype | **Visual layout, IA and copy structure: follow it exactly** (Romit, 2026-10-08: build the exact mockup, rendered with DS components inside the DS base shell). **Behaviour: requirements govern**; where the prototype contradicts a requirement, keep its layout and fix the behaviour (see `build/prototype-parity.md`). Earlier note that Sankalp said not to go by the design (paraphrased from Hindi on the call) is superseded for visuals by Romit's instruction |
| `[CALL 09-23]` | Raw Granola transcript, Skills checklist with Sankalp, 2026-09-23 | Context + intent; contradicted by REQ if they differ |
| `[CALL 03-05]` | Vault note, Day 4 Marriott meeting, 2026-03-05 | Strategic origin |
| `[CALL 10-08 Aarti]` | Raw Granola, "Skills Checklist" brain dump, 2026-10-08 (`095fe094`). Speaker is **Aarti, inferred** (single "Microphone" stream, no diarization, at least two voices) | Stakeholder statement, CALL tier. Never marks an OD decided |
| `[CALL 10-08 Vaibhav]` | Raw Granola, Oct 8 design review and kickoff with Vaibhav (`db6dc27e`, `c4c6d9eb`). Mostly Romit's own framing and questions | Process, constraints, scope confirmation; Romit's views are preferences |
| `[CALL 10-09]` | Raw Granola, Oct 9 implementation and configuration calls (`1d181b10`, `42543caf`). Discovery and routing; no design shown | Delivery-team mental model; data not yet in hand |
| `[CALL 09-25]` | Raw Granola, Sep 25 conference sessions (placement and learning activities `d2576da6`; Day 2 essentials `7f00b9b7`) | Platform behaviour as described by Exxat presenters (descriptive, not a Skills requirement) |
| `[CALL 09-30..10-02 leaders]` | Vault raw transcripts Day 3, 4, 5 post-Cohere meetings | Unnamed Exxat leaders; soft on timing and scope |
| `[CALL 10-05]` | Raw Granola, pharmacy accreditation interview (Dr. Gilzai), 2026-10-05 (read in part) | Student 360 and thresholds; prototype with mock data |
| `[CALL 10-02]` / `[CALL 08-21]` | Raw Granola, Oct 2 expectations meeting; Aug 21 Prism navigation | Research rules (AI opt-in, no over-generalising); shell and landing context |
| `[INFER]` | My inference. Must be validated | **Lowest** |

Precedence when sources disagree on **behaviour**: **REQ > CALL > PROTO > INFER**. On **visual layout / IA / copy structure**: **PROTO (exact mockup) inside the DS base shell**. Disagreements are logged in `strategy/07-gaps-contradictions-defects.md`.

## What changed on 2026-10-09 (raw Granola review)

Three raw-review files (`research/meetings/2026-10-09-raw-review-*.md`) were folded in. New CALL-tier statements, **none of which decides anything**:

- **One list.** Aarti (inferred) argues skills, competencies, EPAs, procedures and essentials are "one list" and the module should "extend the competency"; she also says alignment is needed. This pulls on README fact 3 and OD-02. New OD-28. **Needs Sankalp.**
- **Report = launch page.** "My report should be my launch page." Student-level, per-skill counts, trigger review from the same place. Conflicts with the separate Attainment and Reviews destinations. New OD-29.
- **Evidence can arrive without a student submission** (assessment question, whole assessment, course grade or pass, FAST form, even a patient log), and sign-off can be self, faculty, preceptor, a chain, N distinct signers, or automatic. New OD-31, OD-33, OD-37. The REQ still governs v1.
- **Program requirements** defined once (for example 100 skills). Hours stay out. New OD-30.
- **Soft mapping only**, and "it doesn't matter where they learn it". Consistent with CM-05, but the second line presses on SC-12. Logged, not adopted.
- **Existing FAST forms "going to be the same"** (Romit, Oct 9) vs a configuration-generated form. New OD-36.
- **Timeline:** some version by the last week of October. **No data yet:** implementation Excel pending; the Sep 22 Aarti meeting has no transcript.
- Digest: `strategy/08-raw-granola-findings-oct-2026.md`. Design inputs: `design/ARCHITECTURE-INPUTS-2026-10-09.md`. Contradictions: `strategy/07` section E.

All hard stops stand. Speaker attribution is weak on every one of these calls.

## Reading order

| # | File | Hat | Read when |
|---|---|---|---|
| 1 | `strategy/01-problem-and-why.md` | PM / strategist | First. Why this exists, who wins, so-what |
| 2 | `strategy/02-domain-model-and-achievement-engine.md` | Architect | Before any screen. The rules everything depends on |
| 3 | `journeys/01-admin-journey.md` | UX | Library, config, mapping, review, reporting |
| 4 | `journeys/02-student-journey.md` | UX / interaction | Pick, submit, track |
| 5 | `journeys/03-evaluator-and-reviewer-journey.md` | UX / interaction | Preceptor/faculty/lab instructor + admin approval |
| 6 | `strategy/03-prototype-walkthrough.md` | UI | What the prototype actually does, screen by screen |
| 7 | `strategy/04-requirements-traceability.md` | PM | Every requirement ID → prototype coverage → build wave |
| 8 | `strategy/05-open-decisions.md` | PM | OD-01..13 (requirements) + OD-14..38 (this pack's proposals; OD-28..38 are from the 2026-10-09 raw review), each with recommendation + what it blocks, plus a 'New evidence 2026-10-09' table |
| 9 | `strategy/06-states-and-edge-cases.md` | Interaction | State coverage, empty/error/blocked, a11y, FERPA/role-scope |
| 10 | `strategy/07-gaps-contradictions-defects.md` | QA / PM | Where sources disagree; prototype defects; do-not-assume list. Section E (2026-10-09) adds C-9..C-20, G-13..G-23 |
| 10a | `strategy/08-raw-granola-findings-oct-2026.md` | PM / Architect / UX | **New 2026-10-09.** Consolidated digest of the raw Oct 8-9 and context calls by theme, with verbatim quotes, firmness and design implication. Read right after 05 and before any redesign |
| 11 | `build/01-build-plan.md` | Tech design | IA, nav, DS component map, waves, acceptance tests |
| 12 | `build/02-design-contract-template.md` | Design | The per-surface gate before JSX |

## UX artifacts (`ux/`) — the build-facing layer

OD numbering: **OD-01..OD-13 come from the requirements document §13**; **OD-14..OD-38 and OD-P1 are proposals by this pack** (`source/proposed-ids.txt`), not decisions from the requirements.

Shared IDs: surfaces **S-01..S-18**, flows **F-01..F-14**, state machines **SM-01..04**, personas **P-A/P-S/P-P/P-F/P-L/P-R**, patterns **P-01..P-18**.

| File | Artifact | Use it to |
|---|---|---|
| `ux/01-personas-and-roles.md` | Proto-personas, empathy maps, emotion curves | Decide density, device, data scope |
| `ux/02-jtbd-and-user-stories.md` | JTBD + Given/When/Then stories covering all 113 REQ IDs | Write acceptance tests |
| `ux/03-information-architecture.md` | Object model, sitemaps per role, routes, permissions matrix | Build navigation + routes |
| `ux/04-user-flows.md` | 14 flows + lifecycle swimlane (mermaid) | Design transitions and error branches |
| `ux/05-state-machines.md` | SM-01..04 states, transitions, label mapping | Build status logic + badges |
| `ux/06-service-blueprint.md` | Front/back stage, systems, dependencies | Find hidden work and owners |
| `ux/07-screen-inventory-and-wireframes.md` | S-01..S-18 ASCII wireframes, keep / don't-copy | Start every surface contract here |
| `ux/08-interaction-specs.md` | 18 reusable interaction patterns | Behaviour, keyboard, a11y |
| `ux/09-content-and-microcopy.md` | Glossary, copy per surface, failed-rule generator, email | All UI text |
| `ux/10-component-inventory-and-ds-map.md` | Surface x DS component matrix, gaps, custom compositions | Feed ds-adoption-reviewer |
| `ux/11-design-principles-and-heuristics.md` | 12 principles, review checklist, anti-patterns | Review any design |
| `ux/12-research-plan-and-validation.md` | Questions, tests, assumption register, Mobbin queries (not run) | Validate before building |

These are proposals derived from REQ; items tagged `[INFER]` need confirmation. They are not approved designs.

## Contracts (`build/contracts/`) — CONFIRMED 2026-10-08

All 20 contracts (00 cross-cutting, S-01..S-18 with S-05a/b) are confirmed by Romit. Confirmation covers each contract as written: `[INFER]` items are accepted proposals; every `OD-*` stays OPEN and is built as its named seam. Coverage: `node docs/build/contracts/_coverage-check.mjs` (265 requirement IDs, 0 uncovered). Pattern research: `research/meetings/2026-10-08-mobbin-*.md`. **Containers and layout now follow the prototype** (`build/prototype-parity.md`): where a contract describes a rail, sheet or full page that the prototype draws as a dialog (S-02, S-03, S-09, S-13, S-14 and import), the prototype wins; behaviour, states and requirement coverage in the contracts still apply.

## Raw sources (never edit)

`source/prism-skills-tracking-requirements.docx` · `source/requirements.extracted.txt` (line-numbered text of the docx) ·
`source/prism-skills-prototype.html` · `source/prototype-text-dump.txt` · `source/screens/*.png` (25 captured screens) ·
`source/walkthrough-scripts/` (Playwright scripts that reproduce every capture — rerun, don't trust).

Vault (canonical, outside repo): `~/Documents/research-repos/Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` and
`Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md`.

## Facts that are easy to get wrong (read once)

1. The requirements doc describes capability, not screens `[REQ §intro]`. Sankalp's prototype is the screen design to build, rendered in the DS base shell (Romit's instruction, 2026-10-08). Where it breaks a requirement, keep the layout, fix the behaviour.
2. **Prism ships no skills, no categories, no taxonomy.** Everything is program-defined. Nursing is first, nothing may be nursing-specific. `[REQ SL-01, §1.6]`
3. A skill is **narrower than a competency**, and must **not** inherit competency scoring/reporting. `[REQ §1.4]` **Amended 2026-10-09 (annotation, REQ-derived text kept):** the REQ still governs, but `[CALL 10-08 Aarti]` argues for "one list" and says the boundary needs alignment; this is contested, not settled (OD-02, OD-28, `07` C-9). Do not rename nav or merge the model; do not assert the boundary as agreed either.
4. Configuration is **separate from creation**. An unconfigured skill can be neither mapped nor submitted against. `[REQ SC-01, IM-09]`
5. The model **constrains** the criteria. This is the core design principle. `[REQ §1.5, SC-09]`
6. **Preceptors have no login.** Email link, no account created. `[REQ EV-01]`
7. Mapping is **expectation, not eligibility**. Students can submit unmapped skills. `[REQ CM-05]`
8. **One student record per skill**, shared across courses. `[REQ CM-07, AE-05]`
9. Req doc §15 "Sources and external context" is listed in the contents but **absent from the document body**. Do not cite it. `[INFER from extraction]`
10. Remediation, notifications, expiry, patient-encounter linkage, migration from Evaluations: **out of scope**. `[REQ §14]`
11. **Aarti's raw calls add stakeholder views, never decisions.** Attribution is "Aarti, inferred"; firmness is recorded in `strategy/08`. `[CALL 10-08 Aarti]`
12. **Achievement evidence can come from places other than a student submission** in real programs (assessment, grade, course pass, FAST form). The REQ models only student-submitted evidence; automatic sources are named seams, not v1. `[CALL 10-08 Aarti]` vs `[REQ ST, EV, RV]` (C-11)
13. **The student-level report is wanted as the launch page** and the headline view ignores rotation. Setting and location stay in the evidence ledger and the minimum rules (SC-11, SC-12). `[CALL 10-08 Aarti]`
14. **"Enabled by default" means the module is on and the library is empty.** Prism still ships no skills. `[CALL 10-09]` vs `[REQ SL-01]`
15. **Existing FAST forms vs a configuration-generated form is unresolved.** Do not assume either. `[CALL 10-09]` vs `[CALL 09-23]` (OD-36)
16. **The Prism front end is Angular**; this Next/React build is a design and behaviour reference. `[CALL 09-30..10-02 leaders]`
17. **The market name is "skills checkoff" as well as "skills checklist"**; label unresolved (OD-34). `[CALL 09-30..10-02 leaders]`
