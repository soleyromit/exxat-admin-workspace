# Exam Management — AI Layer

> What AI does in Exam Management, the trust contracts per feature, the pulled-vs-AI delineation per workspace ADR-005.
>
> Source: 7 stakeholder meetings (May 5–8 2026). Aarti drives AI strategy.

---

## AI strategy (per Aarti)

Exam Management leverages AI in **almost every workflow** (Vishal): question creation, assessment building, gap analysis. NOT QB browsing.

The trust contract is consistent: **AI recommends; human decides.** Per Aarti 2026-05-07: "Whether it's comprehensive or not is for them to decide because you don't know what is the scope of a given assessment."

## Per-feature AI

### F1 — AI question generation from lecture upload

| Field | Detail |
|---|---|
| **What AI does** | Ingests uploaded PowerPoint/PDF/lecture material → generates questions (MCQ, fill-in-the-blank, etc.) at specified rigor levels. |
| **Trust contract** | Faculty selects WHICH lectures (not all) — AI doesn't auto-decide scope. Faculty edits/accepts each generated Q before it enters QB. Provenance visible: source = "uploaded lecture: <filename>". |
| **Pulled lane** | Lecture content imported as context. |
| **AI lane** | Generated questions, draft state, with AI badge. |
| **Failure modes** | If faculty pulls from LMS without scoping, AI generates from 10 lectures when only 4 are in scope → noise. Mitigation: scope-selector UI requires choice. |
| **Quality bar (Aarti)** | Auto-tag generated Qs to standards/course measures. Respect faculty's chosen scope. |
| **AI affordance** | DS Sheet (right-rail copilot panel) with `fa-light fa-sparkles` icon, brand color. Per `docs/patterns/viz/ai-vs-pulled-lane.md`. |

### F2 — AI question generation from LMS pull

| Field | Detail |
|---|---|
| **What AI does** | Connects to LMS (Canvas Phase 1) → pulls lecture artefacts → generates questions. |
| **Trust contract** | Same lecture-scoping requirement. Source = "Canvas lecture: <name>". |
| **Pulled lane** | LMS-pulled lecture material. |
| **AI lane** | Generated questions in draft. |
| **Failure modes** | Generating Qs from material faculty hasn't actually taught yet. Mitigation: faculty selects specific lectures. |
| **Quality bar** | Same as F1. |

### F3 — AI question generation from natural-language prompt

| Field | Detail |
|---|---|
| **What AI does** | "Create 5 medium-rigor MCQs on diabetes care, mix of MCQ + fill-in-the-blank." Generates from world knowledge / web. |
| **Trust contract** | No source material attached → faculty validates more rigorously. Provenance: source = "natural-language prompt: <prompt text>". |
| **Pulled lane** | None. |
| **AI lane** | Pure AI; pure AI affordance. |
| **Failure modes** | Hallucination from world knowledge; outdated medical info. Mitigation: faculty validation, citation requirement (Phase 2). |
| **Quality bar** | Faculty accepts this is real behavior today (they leave the system to do it elsewhere). Bringing it in-system is the win. |

### F4 — AI question→standard auto-mapping

| Field | Detail |
|---|---|
| **What AI does** | Reads question stem → recommends mapping to standards / accreditation frameworks (CAPTE, ARC-PA, ASHA, NCLEX blueprint). |
| **Trust contract** | AI **recommends**, faculty decides comprehensiveness. AI cannot judge whether assessment scope is complete because it doesn't know what faculty intended. |
| **Pulled lane** | Standards library + curriculum mapping data (where present). |
| **AI lane** | Mapping suggestions, badged AI-suggested. User-mapped tags are explicitly user-attributed. |
| **Failure modes** | AI overclaiming "your assessment fully covers patient care standard" when scope isn't AI's to determine. **Mitigation: don't fabricate completeness claims.** |
| **Quality bar** | Per Aarti: "AI does not claim assessment completeness." |

### F5 — Assessment-level gap analysis (the differentiator)

| Field | Detail |
|---|---|
| **What AI does** | Cumulative across all assessments + courses → surfaces 3 insights: taught-not-tested, tested-not-taught, neither. Maps QB content to standards/blueprints. |
| **Trust contract** | Insight is over the *universe* of questions, not per-exam. Source attribution: which courses, which assessments. AI lane visually distinct from pulled metrics. |
| **Pulled lane** | Question→standard mappings (manual or AI-suggested-then-accepted), course objectives→standards mappings. |
| **AI lane** | Themes / patterns / "neither taught nor tested" gap surfaces. |
| **Failure modes** | Empty-state for programs without curriculum mapping (60% of customers). Must degrade gracefully. |
| **Quality bar** | Higher priority than QB-completeness. Must work even when only ~40% use curriculum mapping. |
| **AI affordance** | Per `docs/patterns/dashboards/two-question-dashboard.md` — two-question framework with AI lane summary. |

### F6 — Course-level question-bank gap analysis ("Course health")

| Field | Detail |
|---|---|
| **What AI does** | Per course: surfaces which content/competencies/objectives lack QB coverage. "Generate more with AI" CTA per gap; AI uses course materials (syllabus, lecture, chapter) for higher-quality generation. |
| **Trust contract** | Faculty validates AI-generated fill-in questions before they join the QB. Source attribution per question. |
| **Pulled lane** | Course mapping data (content/competencies/objectives) + QB question tags. |
| **AI lane** | Generated questions, gap-fill recommendations. |
| **Failure modes** | Generated questions that don't actually fit the gap. Mitigation: faculty validation. |
| **Quality bar** | Aarti 2026-05-08 moved this from competency screen to course screen — course is the natural shell. |

### F7 — Per-question AI confidence scoring (bulk import)

| Field | Detail |
|---|---|
| **What AI does** | On bulk-imported questions: assigns confidence marker (high / low / needs-attention). Surfaces as filter chip in review queue. |
| **Trust contract** | Confidence is AI's read; faculty decides accept/edit/reject. NEVER reorder questions — preserve upload order (per Aarti). |
| **Pulled lane** | Original imported question text. |
| **AI lane** | Confidence marker, AI-suggested tags. |
| **Failure modes** | False confidence on a poorly-formatted question. Mitigation: faculty can sort/filter but not reorder. |
| **Quality bar** | Per Aarti + Nipun 2026-05-06: "draft mode" + uploader-only review = structural validation gate. |

### F8 — AI copilot (right-rail authoring assistant)

| Field | Detail |
|---|---|
| **What AI does** | During question authoring (new or edit), persistent right-rail panel critiques: stem clarity, distractor balance, rationale auto-gen, Bloom's tag suggestion, category auto-suggest. Each critique has an `Apply` button. |
| **Trust contract** | Each critique flag is dismissible. `Apply` is one-click but reversible (undo). Stays visible even on empty-state authoring (Aarti acknowledged: "it'll end up being dead also" but still wants it). |
| **Pulled lane** | Question content as authored. |
| **AI lane** | Critique flags + suggested edits. |
| **Failure modes** | Flagging valid questions as problematic. Mitigation: dismiss. Empty-state = no flags shown but panel still visible. |
| **Quality bar** | Per Aarti 2026-05-06: "less about objectives and more about question quality." |
| **AI affordance** | Per `docs/patterns/viz/ai-vs-pulled-lane.md`. |

### F9 — Hotspot question generation (deferred)

Not in Phase 1 AI scope. Hotspot author tools exist but no AI generation of hotspot regions. May come in Phase 2.

### F10 — AI-proof question authoring (deferred 2027–2028)

| Field | Detail |
|---|---|
| **What AI does** | Future: help faculty design assessments that test *human judgment* over AI output (e.g., generate AI-erroneous responses for students to critique). |
| **Why deferred** | Per Aarti 2026-05-07: "There is no way for us to design a AI proof generic solution." SME-driven; defer. |
| **Failure modes** | N/A (deferred) |

## AI roadmap

| Phase | AI scope |
|---|---|
| **Phase 1 (Jan 20, 2027 launch)** | F1, F2, F3 (AI question generation 3 modes); F4 (Q→standard auto-mapping); F5 (assessment-level gap analysis); F6 (course health); F7 (bulk import confidence); F8 (copilot) |
| **Phase 2 (2027)** | Curricular Assessment Loop full automation; AI insights chat with citations (Watermark-class); Phase-2 of F9 (hotspot AI — TBD) |
| **2027–2028** | F10 (AI-proof assessment design — SME-driven); cross-product cohort analytics |

## Cross-product AI patterns this product uses

- **Pulled vs AI lane** — `docs/patterns/viz/ai-vs-pulled-lane.md` (workspace pattern)
- **Two-question dashboard** — `docs/patterns/dashboards/two-question-dashboard.md` (UC-11 uses this)
- **Confirm-before-write intake** — `.claude/skills/intake/SKILL.md` (the harness pattern; not user-facing AI but methodologically aligned)

## What AI does NOT do in Exam Management

| Thing | Why |
|---|---|
| Edit existing questions automatically | Aarti 2026-05-06: "edit a question is NOT AI — basic form behavior only" |
| Claim assessment completeness | Trust contract: AI doesn't know intended scope |
| Auto-publish bulk-imported questions | Draft mode + uploader-only review (structural gate) |
| Reorder bulk-imported questions by confidence | Preserve upload order; surface as filter only |
| Make accommodation decisions | Workspace ADR-006: admin determines; AI not in scope |
| Generate proctoring decisions | Lockdown vendor TBD Q4 2026 / Jan 2027; AI not in scope here |

## Cross-cutting principles (workspace-wide AI)

Per workspace ADR-005:

1. **Pulled vs AI lanes are visually distinct.**
2. **Pre-tagged taxonomies are NOT required.** AI extracts dynamically.
3. **AI affordance:** `fa-light fa-sparkles` + brand-color, "AI" / "AI insight" label, source citation.
4. **Edit affordance:** accept / edit / clear / type-own when content is editable.
5. **No "explain why" in Phase 1.** Defer to Phase 2.

## Source provenance

- Aarti 2026-05-06 AI exam + confidence (`d6a35ea2`) — items 1, 2a, 2b, 2c committed
- Aarti 2026-05-07 AI question creation + Curricular Loop (`fb9e76c2`) — gap analysis priority, labels metaphor, AI-proof deferred
- Vishal+Aarti 2026-05-06 roadmap (`a73456ab`) — pervasive AI confirmed; Watermark/ExplorerBlue Amply competitive map
- Vishal+Romit 2026-05-06 PCE persona (`1b317110`) — 3-layer analytics (L1/L2/L3), edit-not-AI distinction
