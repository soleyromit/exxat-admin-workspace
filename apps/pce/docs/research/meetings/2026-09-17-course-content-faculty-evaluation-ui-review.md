---
type: meeting
date: 2026-09-17
product: pce
participants: [Romit, Rohit]
source: granola
granola_id: 8152353a
---

# Course Content & Faculty Evaluation UI Review

**Date:** 2026-09-17
**Participants:** Rohit (Engineering / Demo builder), Romit (Design)
**Context:** Rohit is building the Cohere demo prototype. UI review call to align on single survey analytics and faculty tab layout specifics. Follows the Sep 16 analytics spec session with Vishal. Covers five concrete directives: faculty tab content scope, role label placement, AI component visual treatment, term dropdown format, and faculty role data scope.

---

## Topics covered

1. Faculty tab layout — what to show when a faculty is selected
2. Role label (coordinator vs. instructor) placement in evaluation header
3. AI components visual treatment — elevation vs. vanilla background
4. Term dropdown format — year handling
5. Faculty roles scope in prototype data

---

## Decisions

| ID | Area | Decision | Role | Task |
|---|---|---|---|---|
| D_PCE_0917_01 | Faculty tab | When inside the faculty tab / faculty analytics view, SKIP course content questions. Start directly with faculty-specific sections (instructor sections, coordinator sections). Do NOT repeat the course content section in the faculty view. | Admin | T285 |
| D_PCE_0917_02 | Faculty evaluation header | Show the faculty's role label (e.g. "Course Coordinator" or "Instructor") in the faculty evaluation section header. Not just the faculty name. | Admin | T286 |
| D_PCE_0917_03 | AI component visual treatment | AI summary, AI highlights, and "Scope of improvement" components must have an elevated visual treatment — distinct from vanilla card background. They should stand out from regular content cards. (Token-based — use a tinted or elevated surface, not a new hard-coded color.) | Admin | T287 |
| D_PCE_0917_04 | Term dropdown format | Term labels in dropdowns must be short: just "Fall", "Summer", "Spring" (no year appended). Academic year is shown in a SEPARATE field/selector. Do not render "Fall 2026" as a single compound label. | Admin | T288 |
| D_PCE_0917_05 | Faculty roles in prototype data | Instructor and Course Coordinator ONLY in the demo/prototype faculty role data. Remove all other faculty role types. Rohit to update the mock data for the Cohere build. | Admin | T289 |

---

## Verbatim Rohit quotes

> "For the faculty tab — we skip the course content. Start right from the faculty sections."

> "Can we show the role? Like, is this the coordinator or the instructor? In the header."

> "The AI stuff — the summary, the highlights, the scope of improvement — they need to look elevated. Not just like a plain card. They should stand out."

> "For the terms — just Fall, Summer, Spring. No year. The year is separate."

> "Faculty roles — just instructor and course coordinator. Remove the rest for now."

---

## Design tasks generated

| Task | Surface | Priority |
|---|---|---|
| T285 — Faculty tab: skip course content, start with faculty-specific sections | Single survey analytics — faculty view | P0 — Cohere demo |
| T286 — Role label in faculty evaluation section header | Single survey analytics — faculty section header | P1 |
| T287 — AI components: elevated visual treatment (token-based surface) | All AI cards — AiInsightCard + scope/highlights | P1 — DESIGN-REVIEW |
| T288 — Term dropdown: short labels (Fall/Summer/Spring), academic year separate | All term selectors | P1 |
| T289 — Faculty roles in mock data: instructor + coordinator only | `lib/pce-mock-data.ts` | P0 — Cohere demo |

---

## Conflict flagged

⚠️ **T285 conflicts with T259** (from Aarti Aug 26 session):  
- **T259** (Aarti, `0aad1695`): "Show course content section in faculty view too." Aarti's explicit ask.  
- **T285** (Rohit, `8152353a`): Skip course content in faculty tab, start with faculty sections.  

These are directly contradictory. Do NOT apply either until Vishal + Aarti alignment meeting confirms the direction. T285 may be a demo-scope simplification; T259 may be the product-correct behavior. Flag with Vishal at next daily cadence call.

---

## Not addressed / deferred

- Distribution chart type inside question breakdown (bar vs. other) — not discussed
- Exact "elevated" token to use for AI components — Romit to decide + confirm with Himanshu
- Whether "term average" rename (T275 from Sep 16) applies to faculty view too — not discussed
