---
type: meeting
date: 2026-09-14
product: pce
participants: [Romit, Vishal]
source: granola
granola_id: 8152353a-b0c7-4828-8710-c2f47cd6a494
---

# Course Eval — Distribution Workflow + Analytics Design Sync

**Date:** 2026-09-14
**Participants:** Vishal (Product), Romit (Design)
**Context:** Pre-Cohere design sync. Daily cadence beginning this week. Topics: design-system coherence between exam management and course evaluation, Cohere demo scope (distribution + term analytics overview), term analytics tab architecture, leaderboard column structure, quadrant scatter chart placement and label tone.

---

## Topics covered

1. Design-system coherence — font and component consistency between exam management and PCE (Vishal raised ongoing concern; Romit and Vishal agreed on two action items: Vishal gives faster feedback, Romit aligns closer to DS before first share)
2. Cohere demo scope: distribution workflow + term analytics overview only. Single survey analytics deferred.
3. Distribution demo flow: blank dashboard → schedule (3 steps, nursing data) → back to dashboard → live status + poor response rate → send reminders
4. Term analytics architecture: 3 tabs (Overview, Course, Faculty) with academic year + term filters above all tabs
5. Rating trend chart: 6 terms by default, by-term only (no toggle), selected term highlighted
6. Quadrant XY scatter chart (course × faculty rating) — placement right after trends, neutral quadrant labels with David
7. Leaderboard column restructuring: 4 columns only, sortable, navigation links
8. Red-highlight rule conflict (flagged — do not apply)

---

## Decisions

| ID | Area | Decision | Role | Task |
|---|---|---|---|---|
| D_PCE_0914_01 | Left nav | "Course Evaluations" and "Programmatic Surveys" sections always expanded by default; no open/close toggle. Aarti confirmed. | Admin | T265 |
| D_PCE_0914_02 | Term analytics | Academic year (single-select) + term (multi-select) filters moved ABOVE all 3 tabs. Both apply across Overview, Course, Faculty tabs. Default: most recent academic year + most recent term. | Admin | T262 |
| D_PCE_0914_03 | Term analytics | 3 tabs: **Overview** (= term analytics), **Course** (= course analytics), **Faculty** (= faculty analytics). Updates T72 tab names and structure. | Admin | T262 |
| D_PCE_0914_04 | Term analytics filters | Course and faculty dropdown filters REMOVED from overview tab. Only academic year + term at top. | Admin | T262 |
| D_PCE_0914_05 | Trend charts | Academic year vs term toggle REMOVED. Only "by term" time scale. 6 terms always shown by default. Selected term highlighted with background. Reinforces T234. | Admin | T268 |
| D_PCE_0914_06 | Quadrant chart | XY scatter: X = course rating, Y = faculty rating. Dotted threshold lines mark quadrant boundaries. Positioned right after rating trend cards (trend is still first, quadrant follows). | Admin | T263 |
| D_PCE_0914_07 | Quadrant labels | Labels must be neutral and descriptive — not judgmental. "Teaching support recommended" is wrong tone. Coordinate with David for wording. | Admin | T263 |
| D_PCE_0914_08 | Leaderboard columns | Columns: # offerings, course avg, faculty avg, response rate ONLY. Remove "overall" column. All columns clickable/sortable (asc/desc on click). | Admin | T264 |
| D_PCE_0914_09 | Leaderboard navigation | Row click (on course name/link) → course offering analytics. "View All Courses" → by course analytics. "View All Faculty" → by faculty analytics. | Admin | T264 |
| D_PCE_0914_10 | At-risk highlight | ⚠️ CONFLICT: Vishal requested red for cells below threshold (4.0). Design rules prohibit red (--destructive) in performance viz — amber/--chart-4 required. Do NOT apply red. Flagged as T267. | Admin | T267 |
| D_PCE_0914_11 | Faculty leaderboard | Show only instructor + coordinator roles in prototype. | Admin | T264 |
| D_PCE_0914_12 | Demo data | Use nursing program as domain for all Cohere demo screens. | Admin | T266 |
| D_PCE_0914_13 | Cohere demo scope | Demo scope: (1) distribution workflow, (2) term analytics overview. Single survey analytics: ignore for now — deferred. | Admin | — |

---

## Verbatim Vishal quotes

> "Let's expand course evaluations and programmatic surveys by default. This open-close is not required on the left." — Aarti also confirmed this.

> "We need to move this up, right? So we will have academic year and term selection on top, and under that you have 3 tabs: Overview, Course, and Faculty. This Overview is nothing but term analytics… By course is nothing but course analytics. By faculty is faculty analytics."

> "We are removing course and faculty from the filters."

> "The time scale is always by term. We don't— we can remove this trend view, academic year versus term. It's only term."

> "We show 6 terms always by default, and the selected term is highlighted."

> "Right after trend, we can show this." [re: the quadrant XY scatter chart]

> "We want to have our messaging sound neutral, not judgmental. It should kind of explain what that quadrant means, that's all."

> "We are removing overall. We only have number of offerings, course average, faculty average, and response rate columns, and each column needs to be clickable. On click, we sort. Ascending or descending."

> "Any cell which has a rating less than threshold. Let's say our threshold is 4, right? So any course which has less than the threshold needs to be highlighted in red." ⚠️ Flagged — conflicts with no-red-in-performance-viz rule.

> "We only show 2 roles, instructor and coordinator, in our prototype, nothing else."

> "We are going to use nursing as a domain. And all our data should be based on that."

> "You can ignore single survey analytics for now."

> "I would rather recommend David to come up with something because since this is going to be presented and since we are going to say that this is innovation, everything needs to sound good."

---

## Not addressed / deferred

- Course analytics (By Course tab) detailed spec — "we can discuss tomorrow"
- Faculty analytics (By Faculty tab) detailed spec — "we can discuss tomorrow"
- Quadrant label wording — pending David
- Single survey analytics — explicitly deferred
