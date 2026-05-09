# Patient Log — Experience Principles

⚠️ **Scaffold.** No product-specific UX principles captured yet for Patient Log.

## What workspace patterns inherit

Until Patient Log has its own experience principles, all workspace patterns apply:

- `viz/RUBRIC.md` — viz selection + color discipline (no red in score viz)
- `viz/ai-vs-pulled-lane.md` — AI surfaces
- `dashboards/RUBRIC.md` — coverage + outcome questions
- `admin/master-list-admin.md` — admin entity screens
- `admin/read-only-inherited-filtered-view.md` — faculty consumption of admin entities (likely accommodations on roster)
- `nav/module-launcher.md` — entry from Prism shell
- `ia/cross-product-entity-views.md` — students / faculty / courses lists
- `onboarding/lms-toggle-first-run.md` — school admin first-run
- `states/loading-empty-error-states.md` — all data-bearing surfaces
- `forms/field-validation.md` — encounter logging forms
- `async/live-monitor-polling.md` — live encounter tracking (if applicable)

## Workspace cross-product rules apply

- 3 view tiers per ADR-004 (admin / faculty / student)
- LMS-first per ADR-002
- Accommodations as shared module per ADR-006
- Module sellability per ADR-003

## When populated

Same structure as `apps/exam-management/docs/storytelling/experience-principles.md`:
- Per-surface principles
- Cross-surface principles
- What we're NOT doing (anti-patterns from stakeholders)
- Validation discipline
- Source provenance

Don't fabricate. Real stakeholder input only.
