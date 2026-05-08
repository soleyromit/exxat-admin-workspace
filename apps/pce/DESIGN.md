# DESIGN.md — PCE (Post Course Evaluation)

> Extends `/Users/romitsoley/Work/DESIGN.md` (workspace v0.1.0).
> L2 layer: product strategy, personas, workflows, content. L0/L4 rules inherit unchanged.

**Version:** 0.1.0 (2026-05-08)
**Owner:** Romit Soley
**Phase:** Phase 1 — program level only, no dean-level surfaces, didactic + clinical course evaluations

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

## 3. Personas

Source: HANDOFF.md. Full detail at `apps/pce/docs/personas.md`.

| # | Persona | Phase 1? | Primary surface |
|---|---|---|---|
| 1 | Dean / President | Deferred (P2) | — |
| 2 | Associate Dean | Deferred (P2) | — |
| 3 | Program Director (PD) | ✓ | Dashboard, Templates, CQI Log |
| 4 | Curriculum Committee Chair (CCC) | ✓ | Multi-cohort trends, Competency matrix |
| 5 | Department Chair | ✓ | Faculty roster + dossier |
| 6 | DCE | ✓ | Clinical dashboard, Cohort readiness |
| 7 | Course Director / Faculty | ✓ | My results (grade-locked), Reflection |
| 8 | Adjunct Faculty | ✓ (email-only) | Email digest |
| 9 | Program Coordinator | ✓ | Setup wizard, Live monitor |
| 10 | Student | ✓ | Mobile shell, two-section form |

## 4. Workflows

Detail at `apps/pce/docs/workflows/`. The five canonical flows:

1. **One-time setup** (Coordinator) — LMS integration, course types, terms, decision admin
2. **Per-term ops** (Coordinator) — Autopilot dashboard, Live monitor, audit trail
3. **Authoring** (PD) — Templates, banks, longitudinal-impact warning on edits
4. **Distribution → Response → Review** (autopilot, Student, Faculty) — full survey lifecycle
5. **Loop closure** (PD, CCC) — CQI action, reassess, close + CAPTE export

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
