# Exam Management — Vision

> Synthesized from 7 stakeholder meetings (May 5–8 2026). Aarti drives; Vishaka brings domain expertise; Vishal authors PRDs. Maintained by intake skill.

---

## North star (Aarti, multiple sources)

**Replace ExamSoft as the default exam platform for accredited health-sciences programs by closing the Curricular Assessment Loop — the four-stage cycle no incumbent has built.**

The loop:

```
A) Why is content taught          →  Standards / competencies (accreditation)
B) How is content taught          →  Course objectives in courses
C) How are students tested        →  Exam questions (assessments)
D) How do you know they learned   →  Assessment scores
E) Loop D back to B               →  Tweak curriculum (class-wide failures)
                                  →  Support individual students (single-student failures)
```

> "No software, to my knowledge today, covers the entire curricular assessment loop. And that could be our value proposition and our differentiator if we can get it right." — Aarti, 2026-05-07

Competitors decompose the loop:
- **AS Map / Carrot:** A↔B (curriculum mapping only)
- **ExamSoft:** C↔A (questions to standards only)
- **Influx:** Analytics layer over imported ExamSoft data — no original data
- **Exxat (target):** Full loop, owned end-to-end

## Strategic anchors

| Anchor | What it means | Source |
|---|---|---|
| **Match-then-extend** | ExamSoft parity is the FLOOR. Differentiators are the CEILING. Don't ship without parity must-haves. Maintain a parity sheet. | Aarti, 2026-05-06 + 2026-05-07 |
| **Top 10 differentiators by Sept 2026** | Marketing page on exact.com goes live before Cohere with Jan 20, 2027 launch date. Top 10 list is the marketing anchor. | Aarti, 2026-05-06 |
| **Modular sellability** | Each Exxat product standalone-sellable; module launcher replaces Prism main dashboard | Aarti, 2026-05-08 (workspace ADR-003) |
| **AI as platform** | Pervasive AI in question creation, assessment building, gap analysis — but human validates. AI recommends, faculty decides. | Aarti, 2026-05-06 + 2026-05-07 |
| **3-layer analytics** | L1 Dashboard (persona-tile drill-down) + L2 On-screen analytics (in-flow viz) + L3 Canned + custom reports (PDF AND Excel) | Vishal proposed, Aarti confirmed, 2026-05-06 |
| **One mechanism per concept** | Don't repeat the curriculum-mapping product's "attributes vs direct mapping" mistake. Use Gmail-style nested labels for tagging. | Aarti, 2026-05-07 |
| **Faculty are conservative on new questions** | 90–95% recycled per exam. AI generates → faculty validates carefully → only ~5–10% per exam are new. Don't optimize for generation volume; optimize for trust. | Aarti, multiple sources |
| **LMS-first default** | Today ~5% of customers integrate LMS. Should flip to ~95% with new modules. | Aarti, 2026-05-08 (workspace ADR-002) |

## Phasing

| Phase | Target | Scope |
|---|---|---|
| **Phase 1 — Jan 20, 2027 launch** | ExamSoft parity + Curricular Assessment Loop foundation + AI in question creation/assessment + LMS-Canvas integration (pull + grade-push) + 3-tier persona collapse + bulk import (with draft mode) | Be better than ExamSoft on day one |
| **Phase 2 — 2027** | Curricular Assessment Loop completion, faculty action-item logging, deeper integrations (Banner / Brightspace / Blackboard / SIS), three-tier program-level competency reporting | 50 signed customers for 2027 |
| **2027–2028** | AI-proof assessment design (faculty test students' ability to spot AI errors), lockdown browser vendor integration, Phase 3 cumulative competency reporting | TBD — Aarti to brainstorm |

## Customer adoption mental models

| Model | What Aarti believes |
|---|---|
| **Migration from ExamSoft** | Switching costs are real; faculty will complain about every dropped feature. Conscious effort to provide everything ExamSoft does AND more. |
| **40% adoption baseline** | ~400 of 1600 programs use curriculum mapping today. Build for the mixed basket — gap analysis must work standalone (questions↔standards) AND with curriculum (questions↔objectives↔standards). |
| **Beta cohort** | 30 conversations + 50 signed customers for 2027. Champions = OHSU dentistry, OHSU medicine (just acquired), 2 Row, PCOM, Karen, Dean's list. Consultant route acceptable (paid feedback). |
| **Cohere as commercial pivot** | Day 2 session: "Leveraging course and faculty and survey evaluations in Prism." Marketing partnership with Dan Malacotti + Isha for beta sign-up incentive (discount or gift cert). |

## What Aarti has explicitly killed

| Killed | Why | When |
|---|---|---|
| Standalone Questions tab inside a course | Duplicates the Question Bank; faculty confused on where to author | Vishaka 2026-05-05 |
| Global Assessment Builder menu (Phase 1) | Phase 1 = assessments live inside courses only | Vishaka 2026-05-05 |
| "Awaiting results" status | Confusing wording; replace via gradebook integration | Vishaka 2026-05-05 |
| 8-persona model (Vishal's PRD draft) | Bandwidth — collapse to admin/faculty/student | Aarti 2026-05-08 |
| Mobile evaluation form (custom) | Use existing mobile architecture | Aarti 2026-05-08 |
| Cohort readiness in CFE | Wrong product — students aren't being assessed in CFE | Aarti 2026-05-08 |
| Competency rating in CFE | Competencies are outcomes, not student-rated | Aarti 2026-05-08 |
| Question-level live monitoring | Student-centric only during ongoing exams | Aarti 2026-05-08 |
| Word "live" as a status | Use "ongoing" instead — "live" reserved for proctoring (out of scope) | Aarti 2026-05-08 |
| Practice questions Phase 1 | Backlog | Aarti 2026-05-08 |
| QB-level gap analysis as P0 | Assessment-level is higher ROI | Aarti 2026-05-07 |
| Pre-tagged taxonomy on user-authored content | AI extracts themes dynamically | Aarti 2026-05-08 |
| Action-plan tracking Phase 1 (CFE) | Phase 2/3 — doesn't help sell the product | Aarti 2026-05-08 |

## What Aarti has explicitly green-lit

| Approved | Why | When |
|---|---|---|
| Curricular Assessment Loop as the differentiator | No competitor closes the loop | 2026-05-07 |
| AI question creation (3 modes: lecture upload, LMS pull, NL prompt) | Faculty already use 3rd-party AI tools — bring it in-system | 2026-05-07 |
| Confidence-based marking (T/F + confidence %) — provisional | Real-world calibration for medical students; "in real life they'll be even more anxious." Supersedes prior memory note marking this Nipun-driven & out-of-scope. | 2026-05-06 (pending Vishaka feedback) |
| Hotspot Phase 1: instructor-drawn polygons + instructor-placed points | Both modes confirmed. Student-drawn deferred. | 2026-05-06 |
| Bulk import with draft mode + confidence markers | Only original uploader can review; questions stay in draft until reviewed | 2026-05-06 |
| Course architecture: master courses + terms + course offerings | Faculty cannot add courses; admin owns all three | 2026-05-08 (Exam Mgmt ADR-001) |
| Gradebook is publishing endpoint, NOT Exam Mgmt | "ExamSoft doesn't have a gradebook... they port the results to gradebook" | Vishaka 2026-05-05 |

## How this vision shapes design

Every design decision in Exam Management should:

1. **Move toward closing the loop.** If the feature doesn't ladder up to A↔B, B↔C, C↔A, C↔D, or D↔E, justify why we're building it.
2. **Match ExamSoft on parity items.** Maintain the parity sheet. Conscious decision to drop a parity item, never accidentally.
3. **Use the 3-layer analytics shape.** L1 dashboard tiles, L2 on-screen analytics during work, L3 self-service reports (PDF + Excel).
4. **Distinguish pulled vs AI lanes.** Per workspace ADR-005 + `docs/patterns/viz/ai-vs-pulled-lane.md`.
5. **Default to LMS-on.** Per workspace ADR-002.
6. **Three personas, not eight.** Per workspace ADR-004.
7. **One mechanism per concept.** Labels (Gmail-style nested) for tagging. Not "attributes" + "direct mapping."

## Source provenance

| Source | Date | Granola ID |
|---|---|---|
| Vishaka design review | 2026-05-05 3:29 PM | `e82b0659-a5cf-41ce-8688-2a2b99bcf0b4` |
| Aarti+Vishal+Vishaka roadmap planning | 2026-05-06 7:29 AM | `a73456ab-a1f6-46d5-99e5-e577a3fd5104` |
| Aarti+Romit AI exam + confidence-based | 2026-05-06 10:55 AM | `d6a35ea2-d1e0-4372-9def-defb85d217c0` |
| Aarti+Nipun+Vishal AI question creation | 2026-05-07 10:33 AM | `fb9e76c2-bc27-40d7-bc07-1d2a7e1fab0a` |
| Aarti+Romit Assessment overview | 2026-05-07 4:45 PM | `b68ede99-005a-44bf-aa3c-001e3753d8d8` |
| Aarti+Romit Exam + PCE design review | 2026-05-08 12:44 PM | `4e1c850e-d760-4d05-81a1-a52287b9ae21` |
