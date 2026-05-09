# Cross-Product Entity Views

**Question answered:** How do shared program-level entities (students, faculty, courses, accommodations) appear consistently inside each module?

**Pattern ID:** `IA-001`
**Binds rules:** workspace ADR-001 (program-level entity universe), ADR-003 (module sellability), ADR-006 (accommodations shared)

---

## When to use

Always — every module needs its own filtered view of the entities it uses (students enrolled in this module's courses, faculty assigned to this module, etc.).

## The principle

Data is shared at program level. **Views are per-module.** Two reasons:

1. Each module's filter is different (e.g., Exam Mgmt shows students in courses with active assessments; PCE shows students in courses being evaluated this term).
2. Per workspace ADR-003, modules must be standalone-sellable. Module A can't depend on Module B's UI to render its student list.

## Pattern shape

Every entity has a "list view" within each module. Shape:

```
┌─ Module: <Module name> > Students ──────────────────────┐
│  Search [____________]  Filters [▼]  [Export] [Bulk ▼] │
│  ──────────────────────────────────────────────         │
│  Name               Course offering    Status           │
│  ──────────────────────────────────────────────         │
│  Alice Chen         PHARM 101 S26      Active           │
│  Bob Patel          PHARM 101 S26      Active           │
│  Carlos Diaz        ANAT 201 S26       Inactive         │
│                                                         │
│  Per-row: ⓘ  hover/click → drilldown                   │
└─────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Header path | `<Module> > <Entity type>` — establishes scope |
| Filter chrome | Standard DS `FilterBar` (admin) or studentUX `FilterBar` |
| Per-row reveals | Hover/click → drilldown to entity detail (cross-module-safe URL) |
| "Add new" CTA | **Hidden** for shared entities — admin owns creation (per ADR-001) |
| Bulk actions | Module-specific (e.g., "Send reminder", "Export this view") — never CRUD on the master entity |

## Filter scope per module

| Module | Default student filter | Default faculty filter | Default course filter |
|---|---|---|---|
| Exam Mgmt | Enrolled in this module's courses | Assigned to this module's courses | Has active assessments this term |
| PCE | Enrolled in evaluated courses | Assigned to evaluated courses | Being evaluated this term |
| Patient Log | (TBD on scaffold) | (TBD) | (TBD) |
| Skills Checklist | (TBD) | (TBD) | (TBD) |
| Learning Contracts | (TBD) | (TBD) | (TBD) |

**Default filters can be overridden** by user filter chrome — but never expanded beyond what the user has access to (e.g., Faculty in Exam Mgmt can never see students in courses they're not assigned to).

## URL contract for cross-module deep links

If Module A wants to deep-link to Module B's view of the same entity:

```
https://exxat.app/<module-b>/students/<student-id>
```

That URL works whether the user came from Module A, came from the launcher, or pasted it directly. Module sellability requires this.

## A11y notes

- Use DS `Table` (admin) or `DataTable` (student) — not raw `<table>` (DS-004)
- Row drilldown: row is keyboard-focusable; `Enter` / `Space` triggers drilldown
- Bulk-action checkbox column: select-all uses `aria-label="Select all"` and supports indeterminate state

## Read-only inherited filtered view

When a module surface inherits an admin entity that the persona can't modify (e.g., faculty viewing accommodations on the roster):

→ See `admin/read-only-inherited-filtered-view.md` for the badge / inline pattern.

## Anti-patterns

- ❌ Per-module CRUD on shared entities (e.g., "Add student" button inside Exam Mgmt) — wrong authority (ADR-001)
- ❌ Different terminology across modules for the same entity ("course" in one, "course offering" in another, both meaning the same thing) — confuses users
- ❌ Module A reading Module B's filter state — modules are standalone; each owns its view
- ❌ Hard-coded entity list per module — entities come from the program API, not from the module's own DB
- ❌ Cross-product nav links that route through Prism — direct URL, new-tab, per ADR-003
