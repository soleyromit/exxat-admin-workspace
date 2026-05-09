# Vishaka's Perspective — PCE / CFE

> ⚠️ **Vishaka has not yet been a meaningful voice in PCE-specific meetings.** This file scaffolds the structure; the intake skill populates as Vishaka contributes.

**Update 2026-05-08 16:09:** Vishaka was named as a participant in today's curriculum-mapping + base-entities meeting but **did not speak meaningfully on PCE** in the transcript. The meeting was ~100% Aarti↔Romit dialogue. Recommend a dedicated PCE-only session with Vishaka before relying on her input for PCE design.

---

## Status

Vishaka was **referenced but did not speak** in the 3 PCE-focused meetings audited (2026-05-05 alignment, 2026-05-06 persona mapping, 2026-05-08 design review).

Where she was referenced:

- 2026-05-05: "We will keep the scope to program level. As you also had suggested Vishaka, and even Aarti was aligned on it." (Mohan)
- 2026-05-05: "So Vishaka, if I have to put it in another way, how we're looking at this is basically the course evaluation is a niche survey…" (Mohan addressing Vishaka — no response in transcript)
- 2026-05-06: "Vishaka was pointing out [the assessment metrics design] earlier, where it's like all the objectives that are associated to that course, where has that been applied so far?" (Romit recalling)
- 2026-05-06: "When I was talking to Vishaka, she was like, 'we should merge assessment and question bank together… in a course assessments are built.'" (Romit recalling)

## What we can infer about her PCE position

From cross-meeting references and her domain expertise role:

| Inferred view | Source signal |
|---|---|
| Aligned with program-level Phase 1 scope (not tenant level) | Cited as supporting this in 2026-05-05 |
| Domain-SME view that assessments live structurally inside courses | Recalled in 2026-05-06 |
| Curriculum-objective coverage as a first-class metric | Recalled in 2026-05-06 |
| Pre-publication chair approval for evaluations? | She championed this in Exam Mgmt; unclear if it applies to CFE |
| Action-item differentiator (from Professor Modi) | She raised this in Exam Mgmt 2026-05-06 roadmap meeting; deferred to Phase 2 |
| Anonymous reporting realism (≥5 gating, hide columns, more) | She pushed Aarti on this in 2026-05-06 roadmap; applies to CFE |

## Open questions for next Vishaka conversation

(These are the things to ask Vishaka directly when she's available for a CFE-focused 1:1.)

- Her read on the 3-tier persona collapse (admin / faculty / student) for PCE specifically
- Adjunct faculty (F2): email-only or rolls into faculty view?
- AI theme extraction quality bar — what's the false-positive threshold she'd accept?
- Whether action-item logging from Professor Modi's workflow applies to CFE Phase 1 or stays Phase 2
- Anonymity safeguards beyond ≥5 gating — what else does OHSU expect?
- Mobile evaluation form experience — what does "use existing mobile architecture" actually mean operationally?

## Maintenance

When Vishaka contributes a PCE perspective in a meeting, intake skill writes here with frontmatter:

```yaml
---
date: YYYY-MM-DD
source_meeting: <granola_id>
topic: <topic>
---
```

Then a section with:
- Verbatim quotes
- Mental models surfaced
- Anti-patterns rejected
- Specific feature opinions
- Risks flagged

(See `apps/exam-management/docs/storytelling/vishaka-perspective.md` for the full structure when populated.)

## Decisions / use-cases shaped

This perspective is **scaffolded** — Vishaka's PCE-specific input is still pending (see Status section above). Inferred / weak backrefs only:

**Workspace ADRs (Vishaka cited as aligned, not lead):**
- [ADR-001 — Program-level entity universe](../../../../docs/decisions/001-program-level-entity-universe.md) (Mohan attributed program-level support to Vishaka, 2026-05-05)

**Product ADRs:**
- [PCE ADR-001 — No question bank, templates only](../decisions/001-no-question-bank-templates-only.md) (Vishaka has not weighed in directly; mark as Tentative until validated)

**Use cases:**
- [`use-cases.md`](./use-cases.md) — Vishaka's domain-SME view on assessment/curriculum coupling carries forward from Exam Mgmt; PCE-specific UCs need her review.

> **Audit follow-up:** Once a PCE-only Vishaka session happens, revisit each entry above; promote inferred refs to direct refs and add new ones.

## Source provenance

References extracted from:
- 2026-05-05 PCE alignment (`e9389c39-c819-459a-a0c6-de2b7a35db61`) — Vishaka referenced but did not speak
- 2026-05-06 PCE persona mapping (`1b317110-ab98-4b61-b040-d23498850868`) — Vishaka referenced via Romit's recall
