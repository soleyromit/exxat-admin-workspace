# Workspace Storytelling Framework

> The L7 (Storytelling) layer of the design intelligence architecture.
> Captures **stakeholder perspectives, product narrative, and use-case context** that determine WHY/FOR-WHOM/WHEN/HOW. Sits between L2 (Product UX) and L3 (Process). Patterns (L1) are the *how*; storytelling is the *why-for-whom-when*.

**Version:** 0.1.0 (2026-05-08 — initial release with Exam Management + PCE/CFE real content)
**Maintained by:** intake skill + manual curation per major stakeholder meeting

---

## 1. Why this layer exists

Without it, designs drift. We've seen the failure modes:

- A persona model in PCE (8 personas) that came from Vishal's PRD, not from a stakeholder narrative — Aarti collapsed it to 3 tiers because she never owned the 8.
- A mobile evaluation form designed by Romit because no one had captured "use existing mobile architecture" as a strategic constraint.
- AI features specified without trust contracts, because "AI-first" was stated but never structured.

The storytelling layer fixes this by capturing **what was said, by whom, under what context** — not just the resulting decision. Future-you needs the *reasoning*, not just the verdict.

## 2. Three sub-layers within storytelling

| Sub-layer | What it captures | Per-product file |
|---|---|---|
| **Vision** | The product's north star, strategic frame, market position, multi-year roadmap as the stakeholder articulates it | `apps/<product>/docs/storytelling/vision.md` |
| **Stakeholder perspectives** | Per-stakeholder voice — quotes, mental models, anti-patterns rejected, recurring themes | `apps/<product>/docs/storytelling/<stakeholder>-perspective.md` |
| **Use cases** | Persona × condition × outcome × supported elements — concrete scenarios | `apps/<product>/docs/storytelling/use-cases.md` |

Plus two cross-cutting layers that depend on storytelling input:

| Layer | Where |
|---|---|
| **AI layer** (per product) | `apps/<product>/docs/storytelling/ai-layer.md` — what AI does in this product, trust contracts per feature, pulled-vs-AI delineation |
| **Experience principles** (per product) | `apps/<product>/docs/storytelling/experience-principles.md` — UX principles specific to this product's audience |

## 3. The capture template — WHAT / HOW / WHY / for whom / under what conditions / with what supported elements

For every product, feature, or enhancement discussed in a stakeholder meeting, the intake skill captures:

```yaml
- name: <feature or surface>
  WHAT: <1 sentence — the noun>
  HOW: <2-3 sentences — mechanics of operation>
  WHY: <1-2 sentences — stakeholder reasoning, with citation>
  for_persona: <admin / faculty / student / specific sub-archetype>
  under_conditions:
    - <condition 1 — e.g., "Phase 1, LMS-on">
    - <condition 2>
  supported_elements:
    DS_components: [<list>]
    AI_capabilities: [<list>]
    data_dependencies: [<list>]
    integrations: [<list>]
  source:
    meeting: <granola_id or meeting filename>
    speaker: <name>
    quote: "<verbatim if pivotal>"
```

This is the canonical shape every use case takes. The per-product `use-cases.md` is structured around it.

## 4. Stakeholder roles (workspace-wide)

| Stakeholder | Role | Voice characteristic |
|---|---|---|
| **Aarti** | Drives product strategy across all 5 products | Decisive, strategic, anti-shiny-object. Sets vision, decides on scope, kills features. "Match-then-extend" discipline against incumbents. |
| **Vishaka** | Domain expert (medical/health-sciences customer space) | Mechanical, workflow-realistic, "main course before dessert." Pushes parity with incumbents (especially ExamSoft). Closes deals. |
| **Vishal** | PM lead (Exam Management + Course Eval) | Architectural / sequencing-focused. Authors PRDs. Channels Aarti when she's not present. |
| **Nipun (Nippun)** | PM (Exam Management) | Product owner of specific features (bulk import draft mode, confidence-marking concepts). |
| **Monil** | Competitive analysis | Maintains competitor feature matrix. |
| **Vishal (Vishal Eng)** | Engineering perspective on AI/architecture | Pressure-tests strategy with implementation reality. |
| **Darshan** | Engineering lead | Owns dev capacity allocation. |
| **Akshit** | Owns Fast (form-builder platform component) | Cross-team dependency. |
| **Himanshu** | Owns new design system | DS coordination. |
| **Ashish** | Customer relationships | Day-to-day account contact. |
| **David** | US-side product/domain | Programmatic survey use cases. |

**Rule:** quote each stakeholder by name. Attribute opinions, not just decisions. Romit (Designer II) is the receiver of these perspectives, not a stakeholder voice in the storytelling layer.

## 5. How the intake skill writes here

Per `.claude/skills/intake/SKILL.md`, the intake actions cascade to storytelling files when the content warrants it:

| Intake action | Storytelling file written |
|---|---|
| `intake:transcript-paste` from a stakeholder meeting | `apps/<product>/docs/research/meetings/<date>-<slug>.md` (raw) → curated extracts to `vision.md`, `<stakeholder>-perspective.md`, `use-cases.md`, `ai-layer.md`, `experience-principles.md` per relevance |
| `intake:adr-draft` | ADR file + reference added to relevant `vision.md` or `<stakeholder>-perspective.md` |
| `intake:granola-query-by-person` ("Aarti said…") | Append quote to `apps/<product>/docs/storytelling/aarti-perspective.md` after confirmation |

All writes still require user confirmation (INTAKE-002/003).

## 6. The narrative-vs-spec distinction

Storytelling is **narrative**: what stakeholders said, what they meant, why they're framing things this way. Patterns and ADRs are **spec**: what we'll build, what shape it takes, what constraints bind.

Use storytelling to argue. Use ADRs to commit. Use patterns to build.

| Question type | Look in |
|---|---|
| "Why did we decide X?" | ADR (deterministic) + storytelling (narrative context) |
| "What does Aarti think about Y?" | `aarti-perspective.md` |
| "How does this feature work?" | Pattern + per-product DESIGN.md |
| "Who is this for and when?" | `use-cases.md` |
| "What's the AI trust contract here?" | `ai-layer.md` |

## 7. AI Layer — workspace structure

Every product's `ai-layer.md` follows this structure:

```markdown
# <Product> — AI Layer

## Per-feature AI

### <Feature name>
- **What AI does:** (specific action — generates, extracts, suggests, classifies)
- **Trust contract:** (how the user knows it's AI, validates it, accepts/edits/clears)
- **Pulled lane:** (computed-from-data context this AI uses)
- **AI lane:** (the AI-generated output)
- **Failure modes:** (what to surface when AI fails)
- **Quality bar (per Aarti or Vishaka):** (the standard the feature must meet)

## AI roadmap (Phase 1 vs Phase 2 vs 2027)

## Cross-product AI patterns this product inherits

(Reference workspace patterns/ai/ — see `docs/patterns/ai/`)
```

The workspace-level AI patterns are at `docs/patterns/ai/` and `docs/patterns/viz/ai-vs-pulled-lane.md`.

## 8. Experience Layer — workspace structure

Every product's `experience-principles.md` follows this structure:

```markdown
# <Product> — Experience Principles

## Per-surface principles

### <Surface name>
- **Primary axis:** (what's the org axis — completion? workflow? something else?)
- **Cognitive load decisions:** (what to surface vs hide; chrome decisions)
- **Accessibility / touch / responsive notes**
- **Specific micro-decisions:** (with citation)

## Cross-surface principles
- (Workspace patterns this product inherits)

## What we're NOT doing (anti-patterns from stakeholders)
```

## 9. Maintenance

- New stakeholder meeting → intake skill audits raw transcript → updates relevant storytelling files (with confirmation per file).
- Stakeholder perspective drift (Aarti changes her mind on Y) → append new section to `<stakeholder>-perspective.md` with date; do NOT delete prior — supersession lives in ADR.
- Use case contradicted by new ADR → mark old use case as `Superseded by ADR-NNN` in `use-cases.md`.

## 10. Per-product status

| Product | vision.md | aarti-perspective.md | vishaka-perspective.md | use-cases.md | ai-layer.md | experience-principles.md |
|---|---|---|---|---|---|---|
| exam-management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| pce | ✅ | ✅ | scaffold | ✅ | ✅ | ✅ |
| patient-log | scaffold | scaffold | — | scaffold | scaffold | scaffold |
| skills-checklist | scaffold | scaffold | — | scaffold | scaffold | scaffold |
| learning-contracts | scaffold | scaffold | — | scaffold | scaffold | scaffold |

(Vishaka has not been a meaningful voice in PCE meetings yet — scaffold remains until she contributes.)
