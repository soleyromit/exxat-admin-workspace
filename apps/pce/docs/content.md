# PCE — Content (voice, glossary, errors)

Maintained by the intake skill via INTAKE-003 (new term confirmation flow). Edit by hand only when the skill isn't available.

---

## Voice

| Surface | Tone | Reading level | Notes |
|---|---|---|---|
| Student survey (mobile) | Supportive, neutral | Grade 9–10 | Never use "rate" — use "share your experience" / "tell us how" |
| PD/CCC analytics | Clinical-formal, decisive | Domain-fluent | Use accreditor terms (CAPTE 2C, ARC-PA, ASHA) without expansion when audience is PD+ |
| Faculty self-view | Honest, scaffolded | Domain-fluent | Reflection prompts are open but bounded — never blank text area |
| Coordinator UI | Operational, terse | Domain-fluent | Status verbs over status nouns ("paused", not "in pause state") |
| Email (faculty/adjunct digest) | Direct, scannable | Domain-fluent | Subject line carries the headline; body is a 3-bullet summary + link |

## Empty state copy

Per CONTENT-002 in DESIGN.md: never "No data". Always propose an action.

| Surface | Empty state | What to write |
|---|---|---|
| PD dashboard, no surveys yet | "No surveys yet" | "Configure templates and bind to course types — `/templates` →" |
| Faculty results, min-N suppressed | "No data" | "Results are hidden because fewer than 5 students responded. Your reflection is still required — `Open reflection` →" |
| CQI log, no actions | "No actions" | "When a result trends below threshold, create an action here. `New action` →" |

## Error copy

Per CONTENT-003: explain what happened, why, what to do.

| Error | Bad | Good |
|---|---|---|
| Save template failed | "Error saving" | "Couldn't save the template — your section names match an existing draft. Rename and try again." |
| Grade lock not yet open | "Locked" | "Faculty results unlock 24 hours after grades are submitted. Grades for `PHYS 401` are pending — the coordinator can confirm status." |
| Anonymity threshold | "Below threshold" | "Only 3 students responded. Faculty self-view is suppressed below N=5. Coordinator can extend the survey window if appropriate." |

---

## Glossary

> Order: alphabetical. Format: **Term** — definition (1 sentence). First use of any term in a new screen MUST link here.
>
> Maintained by the intake skill (INTAKE-003) — confirm-before-write.

**ARC-PA** — Accreditation Review Commission on Education for the Physician Assistant; PA program accreditor. Defines competency reporting requirements that map to FR-15 export.

**Autopilot** — PCE's automated survey lifecycle: triggers on course close, runs Day 3/7/10 reminders, archives on grade-lock close. Coordinator overrides per-course as needed.

**CAPTE** — Commission on Accreditation in Physical Therapy Education; DPT program accreditor. The "CAPTE 2C export" refers to standard 2C reporting on outcome assessment.

**Cohort** — students enrolled in the same course in the same term; the unit of analysis for trend comparison.

**CQI** — Continuous Quality Improvement; the action-loop discipline of Result → Action → Reassess → Close. FR-14 implements this as a structured log per program.

**Grade-lock** — the period between course end and grade submission during which faculty cannot view evaluation results (FR-06). Prevents grade retaliation perception.

**Longitudinal impact warning** — UI warning shown when editing a template version that's been used for 4+ terms; explains that breaking comparability resets the trend baseline.

**Min-N suppression** — hiding faculty self-view results when fewer than 5 students responded (FR-03). Prevents identifiability of individual students.

**Standardized question bank** — the locked, university-level question set (didactic + clinical). Templates pull from banks; banks themselves are not editable in the template builder (FR-05).

---

## Maintenance

- Add a term: trigger the intake skill ("we call this `<term>` — it means `<def>`") OR use `/intake` slash command.
- Deprecate a term: move to `## Deprecated` section with the date and replacement. Don't delete (search history depends on it).
- Conflict with workspace `docs/content.md`: workspace wins, file an ADR for the override.
