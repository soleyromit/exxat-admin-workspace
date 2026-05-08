# Aarti's Perspective — PCE / CFE

> Aarti's voice on PCE/CFE specifically. Cross-product mental models live in `apps/exam-management/docs/storytelling/aarti-perspective.md` (most are shared).

---

## Recurring mental models

### 1. CFE is a simple product (the strategic frame)

> "Course faculty evaluation is just a fucking simple-ass product that should have been designed in one month, but we are going to take three months to design."
> — 2026-05-08

This is Aarti's frustration: the 8-persona model + custom mobile design + heavy action-plan workflow turned CFE into a multi-month project when it should be small.

### 2. AI extracts themes (you don't pre-tag)

> "AI is good at finding themes and grouping the information by themes. Just let AI do that work… You're still thinking that everything has to be tagged and grouped and organized. But, no, like, let it be dynamic."
> — 2026-05-08

Direct rebuttal to a CFE design where Romit had pre-tagged eval questions into theme categories. Aarti rejected. The pattern is now workspace ADR-005 (AI-first thinking).

### 3. Persona collapse

> "I do not want eighteen variations of this. You don't have the bandwidth to develop this. So admin level, faculty level, student level. Give me three views."
> — 2026-05-08

This collapsed Vishal's 8-persona PRD (PD / Coordinator / DCE / Instructor / Student / Program Admin / Dean / "core faculty") into 3 tiers.

### 4. Restrictive defaults, configurable per section

> "For each of these sections, if you offer the flexibility to the administrator who's setting up — that who should be able to view this — I think that would be the most flexible way. We can give them some defaults… but the moment we build these hard rules ourselves, we are putting ourselves in a tight spot because later on we might get tickets and we might have to go back and make it flexible."
> — 2026-05-05

Foundational principle for visibility/permissions in CFE. Per-section access control is mandatory.

### 5. Admin ≠ PCE viewer

> "Sometimes faculty are given admin access, but they don't necessarily should be allowed to see post course evaluation. So we'll have to build that flexibility."
> — 2026-05-05

Faculty-as-admin must not leak peer evaluations. Admin role doesn't auto-grant PCE viewing.

### 6. Academic vocabulary precision

> "It's semantic, but it's important when you're talking to Academia folks. When you say not at Dean level, Dean is a role. This role can be at a program level. This role can be at a tenant level… typically nursing programs have deans, pharmacy programs have deans... in medical and PA and PT are typically departments as part of a health science program or a medical school. That's why they typically do not have deans of their own."
> — 2026-05-05

Translation: don't talk about "Dean level" — Dean is a role, not a level. CFE Phase 1 = program level only.

### 7. Schools are lazy (build for that)

> "In real use case scenario, I have seen multiple programs not even have two different templates. In fact, my own program, I have seen they're just using — it's lazy. Okay. But they're using the same survey template across didactic and clinical."
> — 2026-05-05

Translation: Course Type field is OPTIONAL. Schools that use one template for didactic + clinical can keep doing so. Encourage best practice; don't enforce.

### 8. Course evaluation is a specialized survey (not a separate product)

> "Initially the alignment was different. Initially, the recommendation was that post course evaluation are very separate and they reside within each course. And I had actually said that's a bad idea because the survey is a survey — post course evaluation is a specialized service. It doesn't make sense to have a completely different place for it."
> — 2026-05-05

Foundational architecture decision: PCE inherits from the surveys module backbone. Unified home entry.

### 9. Two student-rated entities (not one)

> Students rate two distinct entities: course (content) and faculty (teaching style). These are not combined into one number. Faculty self-view shows them side-by-side with comparative context.
> — 2026-05-08 (D27)

Faculty must see both because they're responsible for both.

### 10. AI 3 pillars for CFE

> "We want to use AI in the research analytics. We want to use AI for providing action items from that. And we want to use AI for building the actual evaluation template. So those are the three things… please make sure that you write them down."
> — 2026-05-06

Three explicit AI pillars. Comment analysis + recommended action items + evaluation template builder.

## Anti-patterns Aarti rejects (CFE-specific)

| Anti-pattern | Why she rejects it | Source |
|---|---|---|
| 8-persona PCE nav | Bandwidth — collapse to 3 tiers | 2026-05-08 |
| Mobile evaluation form (custom design) | Use existing mobile arch | 2026-05-08 |
| Cohort readiness in CFE | Wrong product — students aren't being assessed | 2026-05-08 |
| Competency rating in CFE | Competencies are outcomes, not student-rated | 2026-05-08 |
| Question banks in CFE | Eval questions are school-specific (PCE ADR-001) | 2026-05-08 |
| Pre-tagged theme taxonomy | AI extracts themes dynamically (workspace ADR-005) | 2026-05-08 |
| Heavy action-plan tracking Phase 1 | Phase 2/3 — doesn't help sell | 2026-05-08 |
| Per-course PCE nesting | PCE is a specialized survey, not separate module | 2026-05-05 |
| Hard-coded role permissions | Defaults are okay; configurability is mandatory | 2026-05-05 |
| "Dean level" terminology | Dean is a role, not a level | 2026-05-05 |
| Auto-granting admin access to PCE | Admins ≠ PCE viewers by default | 2026-05-05 |
| "General Surveys" naming | Renamed Programmatic Surveys (more accurate) | 2026-05-05 |

## Key directives Aarti has issued for PCE

| Directive | Date |
|---|---|
| Collapse personas to 3 view tiers | 2026-05-08 |
| Drop mobile evaluation custom design | 2026-05-08 |
| Drop cohort readiness | 2026-05-08 |
| Drop competency rating | 2026-05-08 |
| Templates only (no QB) | 2026-05-08 |
| AI-first: themes dynamic, not pre-tagged | 2026-05-08 |
| Restrictive defaults, configurable per section | 2026-05-05 |
| Three schema attributes: Survey Type, Course Type, Subject | 2026-05-05 |
| Use term + academic year separately (not "semester") | 2026-05-05 |
| Course offering = base course × course number × term × academic year | 2026-05-05 |
| Anonymity must be truly anonymous (≥5 gating, hide columns, more) | 2026-05-05 + roadmap meeting |

## CFE-specific use cases Aarti walked through

### Faculty self-view (UC pattern)

Course rating + faculty rating side-by-side. Comparative ("0.3 above average"). Trend (current term). Lifetime average. Tenure to the right.

### Admin program overview (UC pattern)

Term-driven. Header: term, # courses offered, cohort breakdown table.
Top sections: course leaderboard (top 5), faculty leaderboard (top 5), bottom 5 each.
Average score (course) + average score (faculty).
Trend chart: course-rating line + faculty-rating line over last 5–6 terms.
Cohort grouping toggle (term ↔ cohort).

### Course detail (UC pattern)

Header: response rate, current avg, current trend, lifetime avg, # of times offered, per-faculty historical comparison.
AI insights pane (positive themes / improvement areas).
Per-question analysis tab.
Faculty insights.
Action plan.

### Action plan (lite)

From negative theme → "Create action plan" → AI recommends → accept/edit/clear/type-own.

## How Aarti's PCE thinking has evolved

| Date | Stance |
|---|---|
| 2026-05-05 | Foundational: program level only, unify with surveys, restrictive-but-configurable visibility, academic vocabulary precision |
| 2026-05-06 | AI 3 pillars for CFE (analytics + action items + template builder) — high-level commitment, no surfaces designed yet |
| 2026-05-08 | Persona collapse (8→3); kill mobile custom design; kill cohort readiness; kill competency rating; templates only (no QB); AI-first themes dynamic |

## Things Aarti hasn't said yet (open questions)

- F2 (adjunct faculty) — email-only or rolls into faculty view? Reconfirm.
- Grade-lock workflow — was a PCE PRD feature; Aarti didn't reaffirm 2026-05-08; treat as deferred until reconfirmed.
- "Notes" concept (D32) — low priority placeholder for action-plan content; what shape exactly?
- Reminder cadence reference date (course end / term end / custom) — Vishal owes Vishaka follow-up.
- Specific shape of AI insights surface (no surfaces designed yet despite 3-pillar commitment).

## Source provenance

- 2026-05-05 PCE alignment (Aarti drives, Mohan presents) — `e9389c39-c819-459a-a0c6-de2b7a35db61`
- 2026-05-06 Roadmap planning (Aarti drives both products) — `a73456ab-a1f6-46d5-99e5-e577a3fd5104`
- 2026-05-08 Exam + PCE design review (Aarti drives) — `4e1c850e-d760-4d05-81a1-a52287b9ae21`

Note: 2026-05-06 9:00 AM PCE persona mapping was Vishal-led (Aarti absent). Decisions there are Vishal's PRD draft, NOT Aarti's vision. The 8-persona model was Vishal's; Aarti collapsed it on 2026-05-08.
