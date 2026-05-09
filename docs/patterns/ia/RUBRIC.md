# Information Architecture Rubric

> Binds workspace ADR-001 (program-level entity universe), ADR-004 (3-view persona collapse), and per-product DESIGN.md §3 personas.
> IA decisions cascade: the entity model + the persona model determine the screen graph.

---

## The two anchors

Every product's IA must resolve:

1. **Entity anchor** — what's the noun the user thinks in? (course, course offering, student, faculty, assessment, evaluation, encounter, skill, contract)
2. **Persona anchor** — which view tier owns this surface? (admin / faculty / student per ADR-004)

Wrong entity anchor → users feel lost. Wrong persona anchor → users see chrome they can't use.

---

## Cross-product entity views

Per workspace ADR-001, 11 entities live at program level. Each module subsets them. **Each module needs its own filtered view of the entities it uses** — the underlying data is shared, the views are per-module.

Pattern: `cross-product-entity-views.md` covers the standard shape: a faculty / student / course list filtered to the module's scope, surfaced consistently across the 5 products so users carry mental model across.

---

## The screen graph rules

| Rule | Why |
|---|---|
| Persona-tier collapse → 3 nav shells per product (admin / faculty / student), not 8+ | ADR-004 |
| Master-list admin screens live in admin tier always | ADR-001 entities are admin-owned |
| Faculty surfaces never include "create master entity" CTAs | Faculty cannot create master entities |
| Student surfaces have minimum chrome — no nav switcher, no master-list links | A11Y-005 (touch) + cognitive load |
| Cross-module nav uses new-tab + URL deep links, not embedded iframes | ADR-003 |

---

## Decision flow

```
Designing a new screen?
├─ What's the entity anchor?         → noun the user thinks in
├─ Which persona tier owns it?       → admin / faculty / student
├─ Does it create / modify a master entity? → admin tier only
├─ Does it surface inherited data?   → use read-only-inherited-filtered-view pattern (admin)
├─ Does it cross modules?            → cross-product-entity-views pattern (ia)
└─ Does it answer a curriculum/assessment question? → two-question-dashboard pattern (dashboards)
```

---

## Anti-patterns

- ❌ Per-screen persona switcher — collapses the 3-tier model
- ❌ Master-entity CRUD on faculty surfaces — wrong authority
- ❌ Hidden state (e.g., "course is locked because... [no explanation]") — show the gate
- ❌ Different entity terminology across modules — "course" in one, "course offering" in another, both meaning the same thing

## Pattern catalogue (this folder)

P3 (this round):
- `cross-product-entity-views.md` — shared entity filtered per-module (ADR-001)

P4+ (later): `screen-graph-template.md`, `cross-product-deep-link.md`, `persona-shell-checklist.md`
