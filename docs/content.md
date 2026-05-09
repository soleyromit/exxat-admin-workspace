# Workspace Content Standards

> Workspace-level voice, glossary, and error-copy conventions. Per-product content lives in `apps/<product>/docs/content.md` and EXTENDS this file (does not replace it).

Maintained by the intake skill via INTAKE-003. Confirm before write.

---

## Voice (workspace defaults)

| Surface type | Tone | Reading level |
|---|---|---|
| Admin (any product) | Clinical-formal, decisive | Domain-fluent |
| Faculty (any product) | Honest, scaffolded, decisive | Domain-fluent |
| Student | Supportive, neutral | Grade 9–10 |
| Email (any audience) | Direct, scannable | Match audience |
| Error messaging (all) | Explain what / why / what-to-do (CONTENT-003) | Match audience |
| Empty states (all) | Propose action; never "no data" (CONTENT-002) | Match audience |

Per-product content.md may tighten these per-surface (see `apps/pce/docs/content.md` for the per-screen treatment).

---

## Glossary — workspace (cross-product)

> Order: alphabetical. First use of any term in a product context MUST link to the per-product `content.md` glossary entry; the per-product entry may link back here for the canonical definition.

**Accommodation** — administered globally at program level; applied to students with documentation; faculty inherits read-only filtered view. Per workspace ADR-006. Custom (school-specific) accommodations live alongside the master list.

**Admin (view tier)** — Phase 1 view tier per workspace ADR-004. Covers Program Director, Curriculum Committee Chair, Curriculum Chair, Department Chair, Director, Coordinator, anyone with cross-faculty visibility.

**ADR (Architecture Decision Record)** — durable record of an architectural decision, captured in `docs/decisions/<NNN>-<slug>.md` (workspace) or `apps/<product>/docs/decisions/...` (per-product). Append-only; status moves Proposed → Accepted → (sometimes) Superseded.

**AI lane / Pulled lane** — see `docs/patterns/viz/ai-vs-pulled-lane.md`. Pattern for distinguishing AI-generated content from data-computed content on analytics surfaces. Per workspace ADR-005.

**CFE (Course Faculty Evaluation)** — Aarti's framing for the PCE product. Used interchangeably with PCE in conversation; PCE remains the package name (`@exxat/pce-admin`).

**Cohort** — a graduating class moving through the program together. A 3-year program × 2 terms/year = 6 terms per cohort. Used as a primary axis in PCE/CFE dashboards (cohort-grouping toggle).

**Collaborator** — Exam Mgmt persona/role. A faculty added to a course offering by another faculty (Course Director), with admin-granted permission. May contribute to QB, share material, or co-present.

**Competency** — program-level outcome capability. Admin-owned (workspace ADR-001). Questions tag 1-to-many in Exam Mgmt; PCE doesn't student-rate competencies (per Aarti audit — competencies are outcomes, not student-rated).

**Content area** — topic taxonomy at program level. Admin-owned. Questions tag 1-to-many in Exam Mgmt.

**Course director** — Exam Mgmt's default Faculty role: "whole and soul navigator" of a course offering.

**Course offering** — a specific instance of a master course in a specific term taught by specific faculty (e.g., "Pharmacology I, Spring 2026, Faculty X"). What faculty acts on. Distinct from master course. Per workspace ADR-001 + Exam Mgmt ADR-001.

**Faculty (view tier)** — Phase 1 view tier per workspace ADR-004. Covers full faculty + adjunct + course director + instructor variants.

**LMS-on / LMS-off** — school-level configuration toggle per workspace ADR-002. Determines whether master entities (courses, terms, students, faculty) sync from the school's LMS or are managed manually. Default is LMS-on (recommended).

**Master course** — abstract course in the program catalog (e.g., "PHARM 101 Pharmacology I"). Owned by Admin; reused across terms as course offerings.

**Module launcher** — the Prism shell's main landing page after workspace ADR-003. Replaces the current Prism dashboard. Each Exxat module appears as a tile that opens in a new tab.

**Module sellability** — workspace constraint per ADR-003: every Exxat product (module) must be standalone-sellable. No cross-product dependencies in core flows; each module's first-visit landing works without Prism context.

**Objective / Measure** — course-level learning goal mapped to standards. What a course intends to teach. Used in Exam Mgmt for question tagging.

**Persona collapse rule** — workspace ADR-004. Phase 1 of every Exxat product collapses to 3 view tiers (admin/faculty/student). Per-product DESIGN.md may document sub-archetypes for design context, but Phase 1 ships 3 views.

**Phase 1 / Phase 2** — Exxat shipping cadence. Phase 1 = current build (most products). Phase 2 = post-Phase-1 enhancements. Phase 2 in PCE includes accreditation reports, dean-level views, Anthology migration. Phase 2 in Exam Mgmt includes lockdown vendor integration, three-tier program-level competency reporting.

**Standard** — program-level accreditation requirement (CAPTE, ARC-PA, ASHA codes). Owned by Admin. Course objectives map to standards.

**Student (view tier)** — Phase 1 view tier per workspace ADR-004. All student roles.

**Term (master list)** — academic term in the program catalog (e.g., "Spring 2026", "Fall 2025"). Owned by Admin.

**Two-question dashboard** — pattern from Aarti audit D14: "Am I doing X?" + "Is X working?" Generalizes across products. See `docs/patterns/dashboards/two-question-dashboard.md`.

---

## Per-product extensions

Each product's `apps/<product>/docs/content.md` adds product-specific terminology. The workspace glossary above is the shared vocabulary; per-product glossaries are domain-specific (e.g., point-biserial in Exam Mgmt; lifetime average in PCE).

If a term appears in multiple products with different meanings, it MUST be defined in this workspace file with the canonical definition; per-product files can add nuance but cannot contradict.

---

## Error-copy library (workspace defaults)

Per CONTENT-003 (every error explains what / why / what-to-do):

| Bad | Good | Notes |
|---|---|---|
| "Error" | "Couldn't save — your section names match an existing draft. Rename and try again." | Explain the actual cause |
| "Failed" | "The server returned 503. Your data is safe — try refreshing in a minute." | Reassure + propose action |
| "Locked" | "Faculty results unlock 24 hours after grades are submitted. Coordinator can confirm grade post status." | Explain unlock condition + who/what unlocks |
| "Not authorized" | "You can view this course but can't edit it. Your admin assigned you read-only access." | Explain why + where authority lives |
| "No data" | "Build your first assessment from this course's questions — `New assessment` →" | Propose action (CONTENT-002) |

---

## Maintenance

- Add a workspace term: trigger the intake skill or use `/intake glossary <term>`. Confirm before write.
- Add a per-product term: edits go to `apps/<product>/docs/content.md`.
- Conflict between workspace and product: workspace wins. Per-product can add nuance but not contradict. Conflicts that need resolution → ADR.
- Deprecate: move to `## Deprecated` with the date and replacement. Don't delete (search history depends on it).
