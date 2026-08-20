---
name: exxat-domain-context
description: >-
  Load when the prompt mentions Exxat-domain concepts — placement, preceptor,
  compliance, accreditation, rotation, coordinator, titer, screening,
  ePortfolio, case log, timesheet, school, program, site, location, slot,
  cohort, clearance, immunization, HIPAA, FERPA, CCNE, CAPTE, ACOTE, ARC-PA,
  ACPE, LCME, Prism, Exxat One, Approve, STEPS — or any design that touches
  role-scoped data (student medical history, compliance docs, preceptor
  evaluations, placement contracts, tenant config). Provides the persona
  quick-reference + RBAC framework so the agent doesn't invent personas or
  leak data across roles. Pair with the always-apply
  `exxat-product-context` rule and the senior-UX brief template.
---

# Exxat domain context — persona + RBAC reference

This skill anchors agent behavior to **Exxat's actual domain** —
clinical education at health-science schools — instead of generic SaaS.
It's the runtime companion to:

- **`docs/exxat-ds/agent-context/domain.md`** — what CEMS is, who Exxat
  competes with, the regulatory/supply/compliance triad.
- **`docs/exxat-ds/agent-context/personas.md`** — full persona profiles.
- **`docs/exxat-ds/agent-context/expert-agent.md`** — Tier-3 navigation
  trees + the RBAC verification framework.
- **`.agents/rules/exxat-product-context.md`** — always-apply rule that
  enforces the brief's `Product:` / `Scope:` / `Persona:` lines.

When this skill loads, the agent already knows the runtime ProductSwitcher
list and the school/site selector binary. This file gives it the
**persona library** + **RBAC table** without re-reading three long docs.

## Product → scope → persona map

The product the agent designs for is whatever the
[`ProductSwitcher`](mdc:components/product-switcher.tsx) is
currently pointing at. Map runtime id → scope hierarchy → primary
persona(s):

| Product (selector id) | Scope hierarchy | Primary persona | Secondary |
|---|---|---|---|
| `exxat-prism` | school > program | **DCE / Placement Coordinator** | Curriculum Chair, Tenant Admin, Student |
| `exxat-one-schools` | school > program | **DCE (school-side)** | Curriculum Chair, Tenant Admin |
| `exxat-one-sites` | brand > site > location | **Site Coordinator / Clinical Partner Ops** | DCE (cross-side), Tenant Admin |
| `exxat-custom` (tenant-branded Prism) | school > program | Same as Prism — tenant-configured branding only | — |
| Approve (overlay on Prism) | school > program | **Student** | DCE (light) |
| STEPS (legacy, read-only context) | school > batch > student | DCE (migration view) | — |

**Multi-product designs** (e.g. Prism slot offer surfaced into One,
cross-product placement) list both products + both scopes + both
personas in the brief, and explain the crossing in `Pattern:`.

## Persona quick-reference

Cite these headings verbatim in the senior-UX brief's `Persona:` line.
Full profiles live in
[`personas.md`](mdc:docs/exxat-ds/agent-context/personas.md).

### P1 · Director of Clinical Education (DCE) / Placement Coordinator
- **JTBD:** Slot ingestion + optimization, enforce 100 % compliance
  before clinical floor, balance rotation lottery fairness.
- **Modality:** Desktop monitors. Dense data grids, quick-filter
  toggles, bulk-action checkboxes.
- **Friction:** Multi-step config menus, hidden toggle filters,
  unlinked site profiles.
- **Design implication:** Coordinators want **density**, **bulk ops**,
  **filter chips above the fold**, **export and audit trails**. Avoid
  spacious "marketing" layouts. KPI tiles must reflect
  accreditation-readiness, not vanity metrics.

### P2 · Stressed Health Science Student
- **JTBD:** Submit clearance paperwork, log clinical hours and case
  encounters, find rotation site rules.
- **Modality:** Mobile / tablet during clinic shifts. Single-tap CTAs,
  drag-and-drop file inputs, real-time status badges.
- **Friction:** Multi-page data entry without auto-save, illegible
  upload rejections, session timeouts.
- **Design implication:** Student-facing surfaces are **mobile-first**,
  **auto-save by default**, **visible upload feedback**, **never
  surface peer data**. Avoid keyboard-shortcut-only affordances.

### P3 · High-Stress Clinical Preceptor / Site Instructor
- **JTBD:** Approve student hours, complete midterm/final
  clinical evaluations.
- **Modality:** **Tokenized email links — no password wall.** Single-page
  forms, large radio buttons.
- **Friction:** Anything behind auth, multi-layer nav, save-progress
  failures.
- **Design implication:** Preceptor surfaces are **delivered as a single
  URL inside an email**, render as **one-screen forms**, save state
  every field-change. No login chrome. No sidebar. No app shell.

### P4 · Curriculum & Accreditation Chair
- **JTBD:** Map course activities to board standards, generate
  audit-ready reports.
- **Modality:** Analytical visualizations, custom matrix exports,
  longitudinal queries.
- **Friction:** Systems that fail to cross-reference student
  evaluations with curriculum competencies.
- **Design implication:** Chair surfaces are **comparison-heavy**,
  **export-rich**, **competency-coverage charts**, **pivot grids**.
  Use `KeyMetrics` + chart-figure patterns; avoid status-board chrome.

### P5 · Institutional / Tenant Administrator
- **JTBD:** Standardize HIPAA/FERPA security posture, consolidate
  vendor footprint, enforce SSO.
- **Modality:** Macro configs, global controls, identity rule groups.
- **Friction:** Disjointed error logging, lack of cross-program
  visibility.
- **Design implication:** Tenant Admin surfaces are **global
  configuration consoles** — settings pages with search, audit logs,
  cross-program rollups. Single-program scope is wrong here.

## RBAC framework — what each role can see

When designing any role-scoped surface (compliance, evaluations,
placements, tenant config), check this table from
[`expert-agent.md`](mdc:docs/exxat-ds/agent-context/expert-agent.md) §5
and cite the relevant row in the brief's `Out of scope:` line.

| Role | Can see / do | Strict block |
|---|---|---|
| **Super Program Admin** | Full read/write across compliance, placements, sites, curriculum, learning activities **for their assigned program**. | No institutional config; no cross-program data. |
| **Tenant Level Admin** | Institution-wide oversight; standardize affiliations; cross-program slot sharing. | Read-only on student medical history unless privacy officer overrides. |
| **Faculty / Track Chair** | Review evaluations, map curriculum, monitor cohort milestones. | No master site contracts; no compliance baseline edits. |
| **Student User** | Own compliance items, own placements, own timesheets / case logs, ePortfolio. | Zero peer visibility; no preceptor contact info; no contract details. |
| **Clinical Site / Preceptor** | Verify student hours, submit evaluations via tokenized email links. | No academic curriculum; no university analytics; no password wall. |

**Test before you ship a role-scoped design:**
> "If I open this screen as the OTHER role I might mistake for the
> primary one, does the data leak break HIPAA / FERPA / contract terms?"

If yes → fix the IA (filter, hide, route) before writing code.

## Compliance terminology — copy this, don't paraphrase

When designing surfaces that touch healthcare compliance, use the
domain's actual vocabulary. Wrong terminology signals to coordinators
that the product doesn't understand their world.

| Use | Avoid |
|---|---|
| "Quantitative blood titer (Hepatitis B)" | "Blood test" |
| "Hepatitis B 3-dose series" | "Hep B status" |
| "Drug screen — multi-panel" | "Drug test" |
| "Federal background clearance" | "Background check" |
| "OSHA workforce training" | "Safety training" |
| "Clinical rotation slot" | "Internship slot" / "Placement opening" |
| "Clearance paperwork" | "Onboarding documents" |
| "CAPTE Criterion 7D" / "AACN Essential 2.1" | "Compliance rule" / "Standard" |
| "Tokenized email link" | "Magic link" / "Quick link" |
| "Site / Location / Preceptor" | "Provider" / "Mentor" / "Supervisor" |
| "Accreditation site visit" | "Audit" |
| "Affiliation agreement" | "Contract" (in placement contexts) |

## Industry pressures the agent should encode

These are the *forces* (`domain.md` §1) that shape every Exxat surface
— they're why the product exists and why the design choices below are
non-negotiable:

1. **Accreditation risk** — programs lose federal funding if they fail
   CCNE / CAPTE / ACOTE / ARC-PA / ACPE / LCME audits. ⇒ Exports must
   be **audit-ready** by default, not a runtime customization. KPIs
   surface "evidence rate" and "competency coverage" before "user
   engagement".
2. **Slot scarcity** — hospitals control clinical placements as
   premium currency. ⇒ Placement IA shows **slot utilization rate**,
   **historical site relationship**, **geo-travel limits** as
   first-class fields. Optimization runs are a primary action, not
   buried in settings.
3. **Compliance liability** — a single non-compliant student on a
   hospital floor can terminate a school's affiliation. ⇒ Compliance
   status is **status visible without scroll** (P13). "Cannot rotate"
   states are **blocking** by default, not warnings.

## Trigger keywords (auto-load this skill on)

This skill should auto-load when the prompt contains any of:

- **Products:** Prism, Exxat One, Approve, STEPS
- **Roles:** coordinator, DCE, preceptor, faculty, tenant admin,
  curriculum chair
- **Workflows:** placement, rotation, slot, cohort, clearance,
  affiliation, ePortfolio, timesheet, case log, immunization, titer,
  screening, evaluation, accreditation
- **Regulatory:** HIPAA, FERPA, OSHA, CCNE, CAPTE, ACOTE, ARC-PA,
  ACPE, LCME
- **Scope:** school, program, site, location, batch (legacy STEPS)
- **UI hooks:** ProductSwitcher, school selector, site selector

If the prompt has none of these but the design clearly touches a
role-scoped surface (compliance, evaluations, contracts, medical
records), load this skill anyway.

## How to use this skill in a design brief

1. Read this file's persona quick-reference + RBAC table.
2. Read the runtime
   [`PRODUCTS`](mdc:components/product-switcher.tsx) array to
   confirm which products are currently exposed.
3. Fill the senior-UX brief template (see
   `.agents/skills/exxat-senior-ux/SKILL.md` §3.1) with the three
   product-context lines added by `exxat-product-context.md`.
4. If the surface touches role-scoped data, cite the relevant RBAC row
   in `Out of scope:`.
5. End your turn with `Ready to build — confirm or edit.` and wait for
   user reply.

If the brief feels like it could ship for any generic SaaS, you skipped
the domain. Re-read `domain.md` §1 (accreditation / scarcity /
compliance), pick the force that drives this surface's existence, and
rewrite `Problem:` to name it.

## See also

- `.agents/rules/exxat-product-context.md` — the always-apply rule
  this skill supports.
- `.agents/skills/exxat-senior-ux/SKILL.md` — full brief template +
  five-step protocol.
- `.agents/rules/exxat-ux-principles.md` — P14 (density follows
  frequency), P13 (status visible without scroll), P5 (empty/error/
  loading states) all map to specific Exxat personas.
- `docs/exxat-ds/agent-context/expert-agent.md` §3 — click-by-click
  troubleshooting trees you can quote when designing
  recovery/error-state UI.
