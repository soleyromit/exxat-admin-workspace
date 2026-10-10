# Skills Checklist — Architecture Decision Records

Per-product ADRs. Workspace ADRs at `docs/decisions/`.

## Index

| # | Title | Status | Date |
|---|---|---|---|
| ADR-SC-001 | Unified module: competencies, EPAs, skills, essentials, procedures under one student-level area | Accepted | 2026-10-09 |
| ADR-SC-002 | Multiple skill lists (logs) per OU code — cohort attachment model, default list concept | Accepted | 2026-10-09 |
| ADR-SC-003 | Course-skill mapping is soft — all skills visible to students, course-mapped ones highlighted | Accepted | 2026-10-09 |
| ADR-SC-004 | Deactivation removes from reports/views but retains data; delete only if no submissions | Accepted | 2026-10-09 |
| ADR-SC-005 | Free-email sign-off — evaluator entry by name + email, no system user restriction | Accepted | 2026-10-09 |
| ADR-SC-006 | Skill list hierarchy is N-level tree (not hard-coded 2 levels) | Accepted | 2026-10-09 |
| ADR-SC-007 | Skill list at OU code level; accrediting body pre-population offered at setup, editable after | Accepted | 2026-10-09 |

## ADR-SC-001 — Unified module

**Date:** 2026-10-09 | **Source:** Aarti Vaishnav (granola `24cf2e12`)

Competencies, EPAs, skills, essentials, and procedures should all live under one unified student-level module. Each discipline uses its own terminology (nursing says "competency", SLP says "skill", pharmacy says "EPA"), but the underlying data model and UX pattern is shared. The umbrella product/marketing term is TBD. Do not build separate modules per terminology type.

> "Can we make it one and the same. I also am thinking that this should be one." — Aarti

## ADR-SC-002 — Multiple skill lists (logs) per OU code

**Date:** 2026-10-09 | **Source:** Aarti Vaishnav (granola `24cf2e12`)

Each OU code may have 1+ skill lists. Each list is independently configured and independently attached to one or more cohorts (or student groups). A list marked as "default" is automatically applied to new cohorts. Reports never merge across lists — each list is a separate tab/report/section. This replaces the Prism anti-pattern of re-configuring per cohort.

> "You'll have to have the concept of multiple lists." — Aarti

> "I hate to set something up per cohort because that is a bad setup that we have done in Prism today." — Aarti

## ADR-SC-003 — Soft course-skill mapping

**Date:** 2026-10-09 | **Source:** Aarti Vaishnav (granola `24cf2e12`)

Course-skill mapping is optional and advisory. All skills in a student's active list are always visible to them. Course-mapped skills are visually highlighted (bold, underscore, or similar) as "likely for this course," but students are never blocked from submitting for any skill. This is a clarification/softening of T_SC_07 (mandatory/recommended).

> "Mapping it to a course is an optional thing, so it could or could not be associated with a course."

> "Either we bold it, we highlight it, we underscore it, we do something to indicate to them that under this course these are the likely skills, but we still show them all of the skills and let them click on any skill that they care to get a sign-off on."

## ADR-SC-004 — Deactivation and deletion rules

**Date:** 2026-10-09 | **Source:** Aarti Vaishnav (granola `24cf2e12`)

Deactivating a skill removes it from: course mapping lookups, student skill selection, and all reports/visualizations. Previously recorded evaluation data is retained in the database but not surfaced in any UI. Deletion is allowed only when zero submissions exist against the skill; the system must enforce this. To update a list for new cohorts, create a new list — do not deactivate items from an active list that other cohorts depend on.

> "I don't want deactivated things in the report." — Aarti

## ADR-SC-005 — Free-email evaluator sign-off

**Date:** 2026-10-09 | **Source:** Aarti Vaishnav (granola `24cf2e12`)

When a student requests a skill sign-off, they may send the evaluation form to any person by typing a name and email address. The system does not restrict to assigned preceptors or system users. If an email was used before, offer it as a quick-access suggestion. This resolves the open design question in T_SC_13.

> "We'll let them put in the name, email. If they've already put in the name, email previously, that we can show that as easy access. But they should be able to send it to anyone they want." — Aarti

## ADR-SC-006 — N-level skill hierarchy

**Date:** 2026-10-09 | **Source:** Aarti Vaishnav (granola `24cf2e12`)

Skill categories support an N-level tree structure. Do not design or build with a hard-coded maximum depth of 2 levels. Programs may have sub-competencies, sub-sub-competencies, etc. The library UI and student view must render arbitrary tree depth cleanly.

## ADR-SC-007 — Skill list at OU code level with accrediting body pre-load

**Date:** 2026-10-09 | **Source:** Aarti Vaishnav (granola `24cf2e12`)

Skill lists belong to the school (OU code), not to a discipline. When an OU code is first set up for skills checklist, the system may offer to pre-populate the list from the relevant accrediting body's published standards as a starting point. After loading, the list is the school's document — they may add, remove, or edit freely. Discipline-level data is never the final authority.

> "We can pre-populate it with the discipline list, but we have to make that list editable and manageable. By the school. At each OU code level."
