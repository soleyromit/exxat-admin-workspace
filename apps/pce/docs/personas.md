# PCE / CFE — Personas

> **Restructured 2026-05-08 per Aarti (workspace ADR-004).** Phase 1 collapses the 8-persona PRD model into 3 view tiers. The 8 personas remain documented as **sub-archetypes** to inform feature prioritization within each view, but Phase 1 ships 3 views, not 8.

Maintained by the intake skill via INTAKE-001/002.

---

## Phase 1 — 3 view tiers

### V1 — Admin

**Covers:** Program Director, Curriculum Committee Chair, Curriculum Chair, Department Chair, DCE, Coordinator, Director, anyone with cross-faculty visibility.

**Phase 1 surfaces:**
- Term-driven program dashboard
- Course leaderboard + Faculty leaderboard (top 5 + bottom 5)
- All courses tab (current term)
- Course detail (with AI insights)
- Faculty detail (with AI insights)
- Action plan flow (lite)
- Master lists admin (per workspace ADR-001)

**Goals:**
- Know which courses and faculty are trending poorly this term
- See themes from open-text responses without manually coding
- Track program-level patterns over 5–6 terms

**JTBD:**
- Land on dashboard → see top 5 / bottom 5 courses + faculty for current term → drill in
- Switch grouping between Term view and Cohort view
- Trigger an action plan from a negative theme; AI recommends; admin accepts/edits/clears

**Anti-goals (from Aarti):**
- 18 variations of admin views — no
- Pre-tagged taxonomy authoring — no, AI extracts themes dynamically
- Heavy action-plan workflow — phase 2/3

---

### V2 — Faculty

**Covers:** Full faculty + adjunct + course director + instructor variants.

**Phase 1 surfaces:**
- Self-view: course rating + faculty rating side-by-side, trend (current term), lifetime average, comparative ("0.3 above average")
- Reflection input
- Feedback to next cohort (2-sentence note)

**Goals:**
- See own course + faculty rating without peer-comparison anxiety, but with comparative context
- Understand the difference between course content rating and teaching style rating (these are two distinct things students rate)
- Write a reflection that produces a 2-sentence note for next cohort's welcome screen

**JTBD:**
- Land on faculty self-view → see two ratings (course + faculty) + trend + lifetime + comparative → reflect → write next-cohort note

**Anti-goals (from Aarti):**
- Faculty cannot decide accommodations (workspace ADR-006)
- Faculty cannot pre-tag eval questions into themes (AI does this)
- No grade-lock workflow in CFE Phase 1 (it was a PCE PRD feature; Aarti didn't reaffirm in 2026-05-08, treat as deferred until reconfirmed)

---

### V3 — Student

**Covers:** All students taking course evaluations.

**Phase 1 surface:**
- Mobile evaluation form using **existing mobile architecture** (Romit does NOT custom-design this — Aarti killed the mobile prototype)

**Goals:**
- Give honest feedback without identifying themselves
- Rate two distinct entities: course (content) and faculty (teaching style)

**JTBD:**
- Mobile form, ~5–7 min, two sections (course + faculty), submit anonymously

---

## Sub-archetypes (reference — not Phase 1 nav)

The 8 personas from the original PRD live here as design-context reference. They inform what features to prioritize within each view tier.

### Admin sub-archetypes

#### A1 — Program Director (PD)
- Runs the program; holds CAPTE/ARC-PA reaffirmation
- Wants 3 at-risk courses surfaced every Monday with one-click drill-in
- CAPTE 2C export readiness (Phase 2 — see CAPTE 2D1–2D9 reference R4 from 2026-05-08 audit)
- Phase 1 admin view should default to this sub-archetype's priorities

#### A2 — Curriculum Committee Chair (CCC)
- Multi-cohort trends across 4+ terms
- Cross-course themes (LLM-clustered open-text)
- Phase 1: cohort grouping toggle on the admin dashboard

#### A3 — Department Chair
- Defensible teaching scores for annual review
- Per-faculty 5-term trend with department median overlay
- Phase 1: faculty detail view serves this

#### A4 — DCE (Director of Clinical Education)
- Clinical readiness facets (Phase 2)
- **Cohort readiness was killed by Aarti on 2026-05-08** for CFE — students aren't being assessed in CFE, they're assessing faculty. Cohort readiness belongs to Patient Log / Skills Checklist, not CFE.

#### A5 — Coordinator
- Operational role; per-term ops, audit trail
- Setup wizard, live monitor — these mostly handled by autopilot per original PRD

### Faculty sub-archetypes

#### F1 — Course Director / Faculty (full)
- Owns the course, gets self-view, writes reflection
- Phase 1 faculty view defaults to this

#### F2 — Adjunct Faculty
- Email-only per original PRD (no app login)
- Phase 1: digest email after grade-lock window closes
- Confirm with Aarti whether this stays email-only or rolls into the same faculty view

### Student sub-archetypes

#### S1 — Student (taking evaluation)
- One sub-archetype only; mobile form

---

## Killed by Aarti on 2026-05-08 (do not design)

- 8-persona PCE nav (collapsed to 3 tiers per ADR-004)
- Cohort readiness in CFE (wrong product — students aren't assessed)
- Competency rating in CFE (competencies are outcomes, not student-rated)
- Custom mobile evaluation form (use existing mobile arch)

## Source provenance

- 8-persona detail: HANDOFF.md §2 + original PRD
- Phase-1 collapse: workspace ADR-004 from 2026-05-08 Granola meeting `4e1c850e-d760-4d05-81a1-a52287b9ae21`
- Course rating vs faculty rating distinction: PCE ADR-002 (pending, Tier 2)
