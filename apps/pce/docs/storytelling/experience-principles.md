# PCE / CFE — Experience Principles

> Product-specific UX/UI principles. Workspace patterns are upstream; this file is what's specific to CFE's audience.

---

## Per-surface principles

### Admin program overview

- **Primary axis:** term (current). Cohort grouping toggle as secondary axis.
- **Visible without scroll:** course leaderboard top 5, faculty leaderboard top 5, average score (course), average score (faculty), trend chart.
- **Drill paths:** click any course → course detail; click any faculty → faculty detail.
- **Color discipline:** trending-up = positive (green/blue tones); trending-down = below-threshold (amber/orange — NEVER red per VIZ-004).
- **No decorative metrics:** every card answers a question or proposes an action.

### All courses tab

- **Grid layout:** every important column visible without horizontal scroll on standard desktop (1280px+).
- **Trending column:** sparkline OR up/down arrow + delta. Color-coded amber/orange for below-threshold (NEVER red — Aarti).
- **Filter chrome:** term, cohort, faculty, status. DS FilterBar.
- **Click-row behavior:** drill into course detail.

### Course detail

- **Tab order:** Overview → Per-question analysis → Faculty insights → Action plan.
- **Header summary:** response rate, current avg, current trend, lifetime avg, # times offered, per-faculty historical comparison — all visible without scroll.
- **AI insights pane:** distinct affordance per workspace ADR-005 (pulled vs AI lane). Banner-style with sparkles icon.

### Faculty self-view

- **Side-by-side rating display:** course rating + faculty rating in adjacent containers.
- **Comparative context:** "0.3 above average" — cohort-relative without naming individuals.
- **Trend chart:** current term + prior 5–6 terms.
- **Lifetime average + tenure:** at right side, secondary emphasis.
- **No peer ranking:** faculty doesn't see "you're 12 of 50" — that's anxiety-inducing without value.

### Student mobile evaluation form

- **Uses existing mobile architecture** — Romit does NOT custom-design.
- **Two sections per student:** course content + faculty teaching style (rated separately).
- **Multi-faculty fan-out:** if course has 2 faculty, student sees Section 2A + Section 2B.
- **Welcome screen note:** prior cohort's faculty self-reflection 2-sentence note (proves the loop closes).
- **Anonymity badge always visible.**

### Template authoring

- **Fast module dependency:** current legacy UI per Vishal 2026-05-06; new DS for everything else.
- **Section-to-evaluatee mapping:** each section tagged with what/who it evaluates (course content / instructor / coordinator).
- **Optional Course Type field:** schools that use one template across didactic + clinical can keep doing so.
- **First-survey saves a template on the way:** don't gate template creation.

### Survey distribution wizard

- **4 steps:** Scope → Design → Distribution → Reminder cadence.
- **Step 1 Scope:** course filter + select with real-time "existing survey pushed" status, faculty count column ("0 / 1 / 2 faculty found").
- **Step 3 Distribution Phase 1:** Prism users only. Manual-upload + anonymous-link tabs hidden.
- **Step 4 Reminder cadence:** T-minus N days from reference date. Reference date semantics TBD with Vishaka.

### Action plan flow

- **Triggered from negative theme** (AI insight surfaces it).
- **AI recommends → accept / edit / clear / type-own** (per ADR-005).
- **Lite tracking Phase 1:** save the plan, but no heavy state machine; Phase 2/3 for tracking infrastructure.

## Cross-surface principles

### From workspace patterns (this product inherits)

| Pattern | Where it applies |
|---|---|
| `viz/ai-vs-pulled-lane.md` | All AI surfaces — theme insights, action plan recommendations, template builder |
| `viz/RUBRIC.md` | All charts (no progress bars; no red in score viz per VIZ-004) |
| `viz/bullet-vs-target.md` | Score-vs-cohort-average visualizations |
| `viz/outlier-strip-plot.md` | Cohort distribution viz on faculty/course screen |
| `dashboards/two-question-dashboard.md` | Phase 2 pattern application |
| `admin/master-list-admin.md` | Template management; school configuration |
| `nav/module-launcher.md` | Entry from Prism shell |
| `ia/cross-product-entity-views.md` | Faculty / Students lists (filtered to CFE scope) |
| `onboarding/lms-toggle-first-run.md` | School admin first-run (workspace ADR-002) |
| `states/loading-empty-error-states.md` | All data-bearing surfaces (especially low-N response anonymity suppression) |
| `forms/field-validation.md` | Template authoring forms |

### CFE-specific cross-surface

- **3 view tiers, never 8 personas.** Per workspace ADR-004.
- **Templates only.** No question bank UI.
- **Anonymity suppression as a first-class state.** ≥5 response gating; "Faculty self-view is suppressed below N=5" message; PD aggregate view sees data even when faculty self-view is suppressed.
- **AI extracts themes dynamically.** No school-tagged taxonomy.
- **Restrictive defaults, configurable per section.** Survey creator decides who sees what (Aarti 2026-05-05).
- **Admin ≠ PCE viewer.** Faculty-as-admin must not leak peer evaluations.
- **Use existing mobile architecture.** Romit does NOT custom-design student mobile form.

## What we're NOT doing (anti-patterns from stakeholders)

| Anti-pattern | Source |
|---|---|
| 8-persona variations | Aarti 2026-05-08 |
| Custom mobile evaluation form | Aarti 2026-05-08 |
| Cohort readiness | Aarti 2026-05-08 (wrong product) |
| Competency rating | Aarti 2026-05-08 (competencies are outcomes) |
| Question banks in CFE | Aarti PCE ADR-001 |
| Pre-tagged theme taxonomies | Aarti 2026-05-08 |
| Heavy action-plan tracking Phase 1 | Aarti 2026-05-08 |
| Per-course PCE nesting | Aarti 2026-05-05 |
| Hard-coded role permissions | Aarti 2026-05-05 |
| "Dean level" terminology | Aarti 2026-05-05 |
| Auto-granting admin access to PCE | Aarti 2026-05-05 |
| Red in score/rating viz | VIZ-004 |
| Progress bars (when richer viz fits) | VIZ-001 |
| Toast notifications for product feedback | DS-005 |
| Decorative metrics with no decision | dashboards/RUBRIC.md |
| Welcome tour overlays | onboarding/RUBRIC.md |
| Faculty CRUD on master entities | Workspace ADR-001 |

## Validation discipline

PCE doesn't have its own validation guidance yet (Vishaka not yet voiced on PCE specifically). Defer to Exam Mgmt validation discipline (`apps/exam-management/docs/storytelling/experience-principles.md` § Validation discipline) until Vishaka contributes a PCE-specific view.

## Source provenance

All principles cite stakeholder + meeting. See:
- `apps/pce/docs/storytelling/aarti-perspective.md`
- `apps/pce/docs/storytelling/vision.md` § Source provenance
