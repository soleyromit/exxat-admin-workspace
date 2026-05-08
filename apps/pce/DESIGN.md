# DESIGN.md — PCE (Post Course Evaluation)

> Extends `/Users/romitsoley/Work/DESIGN.md` (workspace v0.1.0).
> L2 layer: product strategy, personas, workflows, content. L0/L4 rules inherit unchanged.

**Version:** 0.2.0 (2026-05-08 — Aarti audit applied)
**Owner:** Romit Soley
**Phase:** Phase 1 — 3 view tiers (admin/faculty/student), templates only (no QB), term-driven analytics
**Aarti's framing:** "Course Faculty Evaluation" (CFE) — simpler than the original PCE PRD. See `docs/research/meetings/2026-05-08-aarti-design-review.md` for the load-bearing changes.

---

## 1. North star

> "Close the post-course evaluation loop with no faculty surprise, no coordinator gruntwork, and a CAPTE/ARC-PA-defensible audit trail."

PCE replaces the current SurveyMonkey + manual chase + Anthology archive workflow with an autopilot model: surveys auto-trigger on course close, run on a Day 3/7/10 reminder cadence, suppress faculty self-views below N=5, grade-lock until grades are submitted, and feed structured CQI actions back into the next term.

## 2. Principles

| # | Principle | Enforced by |
|---|---|---|
| 1 | **Anonymity is sacred** | Always render anonymity badge on student survey; never expose student identity in faculty/PD views (FR-02) |
| 2 | **Faculty see themselves first** | Self-view loads before peer comparisons; min-N suppression hides peer when sample is too small (FR-03, FR-11) |
| 3 | **Grade-lock is enforced, not advisory** | Faculty cannot view results until grades are submitted (FR-06) — UI literally locks |
| 4 | **Decisions, not dashboards** | Every analytics card answers a question or proposes an action; no decoration metrics |
| 5 | **CQI is a loop, not a log** | Every action has an owner, a target, a reassess date — no orphan entries (FR-14) |
| 6 | **Autopilot, with brakes** | Coordinator can pause, edit, or skip per-course; defaults are tuned, not mandated |

## 3. Personas (Phase 1 — 3 view tiers)

**Superseded by ADR-004 (workspace) on 2026-05-08.** Aarti collapsed the 8-persona model from HANDOFF.md into 3 view tiers for Phase 1. Sub-archetype detail in `docs/personas.md` for design context.

| # | View tier | Covers | Primary surface |
|---|---|---|---|
| 1 | **Admin** | PD, CCC, Curriculum Chair, Dept Chair, DCE, Coordinator, Director | Term-driven program dashboard, course leaderboard, faculty leaderboard, course detail, faculty detail, action plans |
| 2 | **Faculty** | Full faculty + adjunct + course director + instructor variants | Self-view (course rating + faculty rating + trend + lifetime + comparative), reflection, feedback to next cohort |
| 3 | **Student** | Students taking evaluations | Mobile evaluation form (uses existing mobile architecture — Romit does NOT custom-design this) |

The 8 personas from the original PRD live as **sub-archetypes** in `docs/personas.md`. Phase 1 ships 3 views, not 8. Sub-archetype context informs which features within a view get prioritized.

## 4. Workflows (Phase 1 — superseded by 2026-05-08 audit)

Aarti redirected from the original 5-flow PRD model toward a tighter Phase-1 set. Detail at `apps/pce/docs/workflows/`.

**Phase 1 Aarti-aligned flows:**

1. **Setup** (Admin) — LMS-integration toggle (default ON per ADR-002), templates (5–6 of them, one inactive — no question bank per PCE ADR-001)
2. **Distribution** (autopilot) — survey lifecycle from course close
3. **Response** (Student) — uses **existing mobile architecture**; Romit does not custom-design this surface
4. **Admin program overview** (Admin) — term-driven dashboard with course leaderboard + faculty leaderboard + trend across 5–6 terms; cohort grouping toggle
5. **Faculty self-view** (Faculty) — course rating + faculty rating + trend + lifetime average + comparative
6. **Course detail / Faculty detail drilldown** (Admin) — AI-extracted themes from open-text responses (no preset taxonomy per ADR-005)
7. **Action plan flow (lite)** (Admin/Faculty) — from negative theme → AI recommends → accept/edit/clear/type-own. Tracking deferred to Phase 2/3

**Killed by Aarti on 2026-05-08:**
- Mobile evaluation form custom design (use existing mobile arch)
- Cohort readiness concept (students aren't being assessed in CFE)
- Competency rating concept (competencies are outcomes, not student-rated)
- Heavy CQI action-plan tracking (Phase 2/3 — doesn't help sell the product)
- Question banks (templates only, per PCE ADR-001)

## 5. Content (voice + glossary)

Detail at `apps/pce/docs/content.md`. Voice for PCE:

- **Tone:** clinical-formal (admin), supportive but neutral (student-facing student survey)
- **Reading level:** ~grade 10 for student surveys; technical OK for PD/CCC analytics
- **Glossary:** PCE has high jargon density (CAPTE, ARC-PA, ASHA, longitudinal impact, min-N, grade-lock window). Always link to glossary entry on first use of a term in any new screen.

## 6. Design references

Detail at `apps/pce/docs/design-refs.md`.

- **Canonical prototype:** `apps/pce/prototype/pce-evaluation.html`
- **Engineering handoff:** `apps/pce/prototype/HANDOFF.md`
- **Active brand:** Exxat Prism (Rose) — `theme-prism` — switched from One/Lavender 2026-04-XX (see ADR when written)
- **Magic Patterns reference:** (none for PCE — built from prototype directly)

## 7. Active build status

| Area | Status | Path |
|---|---|---|
| Admin app | Not yet scaffolded | `apps/pce/admin/` (config exists per workspace CLAUDE.md §15) |
| Student app | Not yet scaffolded | `apps/pce/student/` |
| Prototype | Active — engineering source of truth | `apps/pce/prototype/` |
| Brand decision | Prism (Rose) | (will become ADR) |

## 8. Open product questions

Mirror of HANDOFF.md §OQ table. Ones blocking Phase 1: none. Phase 2 questions tracked there.

## 9. How to extend this file

- Strategy/principle changes → ADR first, then update §1–§2 on Accept.
- New persona → add to §3 + write detail in `apps/pce/docs/personas.md`.
- New workflow → add to §4 + write detail in `apps/pce/docs/workflows/<flow>.md`.
- New term → glossary in `apps/pce/docs/content.md` (intake skill writes via INTAKE-003).

L0/L4 rules cannot be overridden here. Exceptions go through workspace ADR.
