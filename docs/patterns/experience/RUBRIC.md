# Experience Pattern Rubric

> Workspace-level experience principles that cut across products. Per-product principles live in `apps/<product>/docs/storytelling/experience-principles.md`.
> Binds DESIGN.md A11Y rules + storytelling-framework + L1 patterns.

---

## The five workspace experience principles

| # | Principle | Source |
|---|---|---|
| 1 | **Decisions, not dashboards** | Every analytics card answers a question or proposes an action. No decorative metrics. |
| 2 | **Pulled vs AI visually distinct** | Per workspace ADR-005. Users must know provenance. |
| 3 | **Restrictive defaults, configurable per surface** | Aarti 2026-05-05. Defaults are okay; hard-coded role rules are not. |
| 4 | **One way to do a thing** | Aarti + Vishaka. Multiple paths = cognitive confusion. |
| 5 | **Spatial weight = priority** | Aarti 2026-05-07. Bigger card = needs attention. Smaller card = done. Position and size *are* the message. |

---

## The four cross-product UX rules (binding)

| Rule | Why | Applies to |
|---|---|---|
| **3 view tiers, not N personas** (workspace ADR-004) | Phase 1 bandwidth | Every product's nav shells |
| **LMS-on default** (workspace ADR-002) | 95% of new customers expected to integrate | Every admin master-list screen |
| **Module sellability** (workspace ADR-003) | Standalone-sellable modules; new-tab open from Prism | Every product's landing page |
| **Persona-tier collapse on every screen** | Don't surface admin chrome to faculty; don't surface faculty CRUD on master entities | Every screen design decision |

---

## The validation discipline (Vishaka)

| Rule | Why |
|---|---|
| Don't bring half-baked screens to faculty | Burns champion goodwill |
| Restrict user-test pool to the right faculty type per product | Wrong audience = wrong feedback |
| Use paid consultants if champions don't engage | Ensures dedicated feedback time |
| ExamSoft (or relevant incumbent) is the parity floor | Match-then-extend (Aarti) |

---

## Decision flow

```
Designing a new screen?
├─ Which view tier owns it?           → admin / faculty / student per ADR-004
├─ What entity is the anchor?          → noun the user thinks in (per ia/RUBRIC.md)
├─ What's the primary axis?            → completion? workflow? trend? decide explicitly
├─ Is there an AI surface?             → use AI vs pulled lane pattern
├─ Is there an inherited admin entity? → read-only-inherited-filtered-view pattern
├─ Is there a master-list?              → master-list-admin pattern (admin tier only)
├─ Is there a coverage + outcome question? → two-question-dashboard pattern
└─ Per-product nuance?                  → check apps/<product>/docs/storytelling/experience-principles.md
```

---

## Cross-product experience anti-patterns

| Anti-pattern | Why |
|---|---|
| Per-screen persona switcher | Collapses the 3-tier model |
| Master-entity CRUD on faculty surfaces | Wrong authority |
| Hidden state without explanation | Show the gate (CONTENT-003) |
| Different terminology across modules for the same entity | Confuses users |
| Welcome tour overlays | onboarding/RUBRIC.md |
| Toast notifications for product feedback | DS-005 |
| Cohort-relative ranking that names individuals on faculty self-view | Anxiety-inducing without value |
| Decorative metrics with no decision | dashboards/RUBRIC.md |
| Animations that exceed DS defaults | DS-009 |
| Color as the only encoding | A11Y-008 |

## Pattern catalogue (this folder)

P3 (this round): RUBRIC only.

P4+ (later):
- `decisions-not-dashboards.md` — how to audit a card for decision-attached
- `validation-discipline-checklist.md` — Vishaka's pre-validation rules
- `spatial-weight-as-priority.md` — Aarti's card-size hierarchy pattern
