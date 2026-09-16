---
type: meeting
date: 2026-09-15
product: pce
participants: [Romit, Vishal]
source: granola
granola_id: b8aeb736-3e83-400c-a94a-62b114386d75
---

# Analytics Solution Design — Course, Faculty, and Survey Specs

**Date:** 2026-09-15
**Participants:** Vishal (Product), Romit (Design)
**Context:** Daily Cohere-prep cadence (day 2). Follow-up to Sep 14 sync — covers the course analytics and faculty analytics detail specs that were deferred yesterday ("we can discuss tomorrow"). Also sets expectations on single survey analytics timing.

---

## Topics covered

1. Confirmed scope order: longitudinal analytics (overview) first, then course analytics, then faculty analytics, then single survey analytics last
2. Course analytics "Course" tab default view: list of all courses by academic year + term; clicking a course opens it in a new closable tab
3. Course analytics detail view spec: what to show when a specific course is opened
4. Course vs Faculty heatmap card — layout issue: currently not rendering well; must be square and centered
5. Rating trend + Response trend — merge to work alongside the square course vs faculty card
6. Faculty filter in sticky header — faculty dropdown only appears inside a specific course's analytics tab, not on overview
7. Faculty analytics structure mirrors course analytics (aspect changes)
8. Single survey analytics — Aarti gave raw feedback in document; Vishal will update and share by today/tomorrow morning

---

## Decisions

| ID | Area | Decision | Role | Task |
|---|---|---|---|---|
| D_PCE_0915_01 | Course analytics detail | Clicking a course in the Course tab → opens in NEW CLOSABLE TAB. Shows for that course only: KPIs, rating trend, response trend, faculty heatmap, course vs faculty, list of last 6 course offerings (table). | Admin | T269 |
| D_PCE_0915_02 | Course analytics default list | By default the Course tab shows ALL courses filtered by academic year + term. List view (similar to course leaderboard). | Admin | T269 |
| D_PCE_0915_03 | KPI cards sizing | KPI cards in course analytics detail view are too large — scale down to appropriate density. | Admin | T269 |
| D_PCE_0915_04 | Course vs Faculty card | Must be SQUARE aspect ratio. Must be centered in its container. Currently it "is not going well." | Admin | T270 |
| D_PCE_0915_05 | Merge trend cards | Merge "Rating trend" + "Response trend" into a single card to work well alongside the square course vs faculty card. | Admin | T271 |
| D_PCE_0915_06 | Faculty filter sticky | Faculty dropdown filter appears in sticky header ONLY when inside a specific course's closable analytics tab. NOT on the Course tab overview or on the Overview tab. | Admin | T272 |
| D_PCE_0915_07 | Faculty analytics | Structure is similar to course analytics — same pattern, but "the aspect would change." Vishal to confirm exact aspect differences. | Admin | T73 update |
| D_PCE_0915_08 | Single survey analytics | Aarti gave raw feedback (in Vishal's feedback document). Vishal updating doc for clarity → will share with Romit. Status: incoming. | Admin | — |
| D_PCE_0915_09 | Analytics scope order | Confirmed order of work: (1) Overview tab, (2) Course tab, (3) Faculty tab, (4) single survey analytics. Course and faculty analytics "closer to what I've written" per Vishal's spec. | Admin | — |

---

## Verbatim Vishal quotes

> "We've decided to focus on longitudinal analytics to start with."

> "So by default, you will see a list of courses. All courses. In that particular criteria — academic year slash one or multiple terms. If you click on any one course, we are opening that course analytics in a new tab which is closable."

> "We need to show KPIs, we need to show rating trend, response trend. We need to show faculty heatmap. All of these are for that particular course only. Right, so, and we show course versus faculty."

> "We also need to show a list of course offerings." [last 6, in table form]

> "Why is it looking so big, the KPI cards?"

> "That should be like a square, and we probably need to keep it at the centre." [re: course vs faculty card]

> "Or we need to merge rating and response trend into one."

> "I think if it is that, that card is somehow is not going well, so we maybe we need to keep — that should be like a square… try it out. Yes, so this is our important visual, so important analytic report, course versus faculty. So I mean, yeah, that should come out well."

> "Faculty analytics also is pretty much similar to course analytics, just that the aspect would change."

> "If I'm able to complete single survey analytics before I close today, I'll let you know. You can also update that. Worst case tomorrow morning."

---

## Design tasks generated

| Task | Surface | Priority |
|---|---|---|
| T269 — Course analytics detail view (closable tab) | Analytics → Course tab | P1 — NEW PAGE NEEDED |
| T270 — Course vs Faculty card: square + centered | Course analytics detail | P1 — DESIGN-REVIEW |
| T271 — Merge rating trend + response trend cards | Course analytics detail | P1 — DESIGN-REVIEW |
| T272 — Faculty filter in sticky header (course tab only) | Analytics sticky header | P1 — DESIGN-REVIEW |
| Update T73 — Faculty analytics mirrors course analytics structure | Analytics → Faculty tab | P1 — update |

---

## Not addressed / deferred

- Single survey analytics full spec — incoming from Vishal (today/tomorrow Sep 16)
- Exact aspect differences for faculty analytics vs course analytics — Vishal to confirm
