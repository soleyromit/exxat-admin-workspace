---
type: meeting
date: 2026-09-16
product: pce
participants: [Romit, Vishal]
source: granola
granola_id: de0c85ee
---

# Single Survey Analytics — Dashboard Design & Cohere Demo Prep

**Date:** 2026-09-16
**Participants:** Vishal (Product), Romit (Design)
**Context:** Daily Cohere-prep cadence (day 3). Vishal delivers the single survey analytics spec deferred from Sep 15 ("if I'm able to complete before I close today"). Full walkthrough of the single survey analytics layout, with live feedback on Romit's prototype. Demo account cleanup directives also given.

---

## Topics covered

1. Single survey analytics page — full layout spec walkthrough
2. Navigation cleanup (My Logs tab, Reports tab)
3. Export-as split button replacing Reports tab
4. Question breakdown section (expand-all default, term average label, section distribution)
5. Overview tab: remove rating trend card
6. KPI cards placement (above tabs for course/faculty analytics)
7. AI summary placement in course content + faculty sections
8. Free text question handling + per-question AI summary
9. Qualitative feedback component — removal
10. Reminder sent date markers on response rate timeline
11. Faculty filter interaction — score display
12. Demo account onboarding cards — remove for Cohere

---

## Decisions

| ID | Area | Decision | Role | Task |
|---|---|---|---|---|
| D_PCE_0916_01 | Navigation | KILL "My Logs" tab — no such tab should exist in admin or faculty nav. | Admin/Faculty | — (already absent from code) |
| D_PCE_0916_02 | Navigation | KILL "Reports" tab entirely — replace with "Export as" split button. | Admin | T273 |
| D_PCE_0916_03 | Export | "Export as" = split button. Primary action = PDF. Secondary (via chevron) = Excel. No standalone Reports page. | Admin | T273 |
| D_PCE_0916_04 | Question breakdown | All questions must be EXPANDED by default in the question breakdown. Admin does not need to manually open each question. | Admin | T274 |
| D_PCE_0916_05 | Question breakdown labels | "Program average" → rename to **"term average"** in question breakdown / section tile context. (Applies only to the breakdown view, not the top KPI strip.) | Admin | T275 |
| D_PCE_0916_06 | Section distribution | Section distribution is NOT expandable/collapsible. It is rendered as a single static line (bar + key stats). No accordion, no toggle. | Admin | T276 |
| D_PCE_0916_07 | Overview tab | REMOVE the rating trend chart/card from the Overview tab. Too much noise for Cohere demo. | Admin | T277 |
| D_PCE_0916_08 | KPI cards placement | In course/faculty analytics views, KPI cards sit ABOVE the tabs (not inside any tab body). Tabs are below the KPI row. | Admin | T278 |
| D_PCE_0916_09 | AI summary | AI summary is shown inside BOTH the course content section AND the faculty section of single survey analytics. Not only at page level. | Admin | T279 |
| D_PCE_0916_10 | Free text questions | Free text question results rendered per question, each with its own AI summary chip/card below. Not grouped into a single qualitative section. | Admin | T280 |
| D_PCE_0916_11 | Qualitative feedback | REMOVE the standalone "qualitative feedback" component/panel from single survey analytics. Content is handled per-question with per-question AI summary (D_PCE_0916_10). | Admin | T281 |
| D_PCE_0916_12 | Response rate timeline | Show "Reminder sent" date markers on the response rate / completion trend timeline. Markers identify when reminders fired. | Admin | T282 |
| D_PCE_0916_13 | Faculty filter interaction | When a specific faculty is selected via the faculty filter, show that faculty's score directly below the filter control (not in a separate card further down the page). | Admin | T283 |
| D_PCE_0916_14 | Demo cleanup | Remove onboarding step cards from the PCE dashboard in the Cohere demo account. Rohit building demo — no persistent UI state needed. | Admin | T284 |
| D_PCE_0916_15 | Heatmap | KILL heatmap in question breakdown — not needed, adds noise. (No heatmap currently in codebase; decision confirms do-not-build.) | Admin | — (already absent) |

---

## Verbatim Vishal quotes

> "My Logs — that tab should not be there at all."

> "Remove Reports tab. Instead we add 'Export as' — split button. PDF is primary. Excel is secondary via the chevron."

> "All questions should be expanded by default. I don't want to click open each one."

> "Don't call it program average here. Call it term average."

> "Section distribution — that's not expandable. Just one line."

> "Remove the rating trend from overview. Too much. Less is more."

> "KPI cards sit above the tabs. Not inside the tabs."

> "AI summary should appear in the course content section AND in the faculty section. Both."

> "Each free text question should have its own AI summary. Individual."

> "Remove qualitative feedback as a separate component. The per-question AI handles it."

> "On the timeline — show when the reminder was sent. A marker."

> "When faculty is selected, show their score right below the filter. Don't make them scroll."

> "For the Cohere demo, remove those onboarding step cards from the dashboard."

---

## Design tasks generated

| Task | Surface | Priority |
|---|---|---|
| T273 — "Export as" split button (PDF primary / Excel secondary) — replaces Reports tab | Analytics header + any export surface | P0 — Cohere demo |
| T274 — Expand all questions by default in question breakdown | Single survey analytics — question breakdown | P1 — DESIGN-REVIEW |
| T275 — Rename "Program average" → "term average" in question breakdown context | Single survey analytics — section tile + question tile | P1 |
| T276 — Section distribution: static single line (not expandable) | Single survey analytics — section distribution | P1 |
| T277 — Remove rating trend card from Overview tab | Analytics → Overview tab | P1 |
| T278 — KPI cards placement: above tabs in course/faculty analytics views | Analytics page layout | P1 — DESIGN-REVIEW |
| T279 — AI summary inside both course content + faculty sections | Single survey analytics | P1 — DESIGN-REVIEW |
| T280 — Free text questions: per-question AI summary chip | Single survey analytics — free text section | P1 — DESIGN-REVIEW |
| T281 — KILL standalone qualitative feedback component | Single survey analytics | P1 |
| T282 — Reminder sent date markers on response rate timeline | Single survey analytics — timeline | P1 — DESIGN-REVIEW |
| T283 — Faculty score displayed below faculty filter when faculty selected | Single survey analytics — faculty filter | P1 |
| T284 — Remove onboarding step cards from dashboard (demo account cleanup) | PCE dashboard | P0 — Cohere demo |

---

## Already confirmed absent (no action needed)

- "My Logs" tab — not in ADMIN_NAV or FACULTY_NAV in `app-sidebar.tsx`
- Reports tab — no such nav item exists
- Heatmap — no heatmap component exists in codebase

---

## Not addressed / deferred

- Exact question breakdown layout (distribution chart type — bar vs. dot plot) — TBD from Sep 17 walkthrough with Rohit
- Excel export backend mechanism — engineering flag, not a design decision
- "Term average" rename scope — applies only to question/section breakdown, not to top-level KPI card (Romit to confirm scope with Vishal)
