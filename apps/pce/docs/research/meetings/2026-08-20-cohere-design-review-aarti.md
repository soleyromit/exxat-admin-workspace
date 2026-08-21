---
type: meeting
date: 2026-08-20
product: pce
participants: [Aarti, Vishaka, Vishal, David, Monil, Kunal]
source: granola
granola_id: 87f007fe-8a69-40e5-bade-22e4807dd12c
---

# Course Eval Design review for Cohere — Aug 20, 2026

Full stakeholder walkthrough of the PCE / course survey module in preparation for the Cohere conference. Aarti attended as lead, Vishaka as design/product reviewer. Vishal demoed live dev build + Figma states. Kunal and David also present.

---

## Topics covered

- Cohere session structure and timing (surveys + post-course-eval, 40–50 min total)
- Pre-Cohere all-hands demo logistics (Friday before Cohere)
- Dashboard walkthrough: term cards, two goals (management vs. analytics)
- Role-based access: management role MUST NOT see faculty/course performance details
- Template creation: self-service UI not ready — hide for beta/Cohere; contact support instead
- Terminology: "Post Course Evaluations" → "Course Surveys"; avoid "evaluation" where possible
- Analytics deep-dive: KPI labels, overview/by-course/by-faculty structure, quadrant chart
- "Program Rating" label objection → "Average course rating"
- "Competency trends" label → "Section averages" (or "Drill down by section")
- "Other factors / General" section: can be hidden when not in template
- Template course type vocabulary: "Didactic" and "Experiential" (not "Classroom based" and "Clinical")
- Significant movers: confirmed not in initial release
- Competitive analysis grid: create chart-by-chart comparison vs. Qualtrics, Anthology, etc.
- Multi-section course handling in analytics (ongoing discussion)
- Cohere session structure confirmed (25 min Vishal: 5 min context, <5 min setup, 10 min analytics, Q&A)
- Download/export: faculty report needs graphs + callouts + comparison even if downloadable

---

## Decisions

| ID | Decision | Product | Surface |
|---|---|---|---|
| D_PCE_0820_01 | **Rename tile/section**: "Post Course Evaluations" → "Course Surveys." Never use word "evaluation" where it can be confused with clinical placement evaluations (LAM/preceptor). Aarti: "surveys in my mind is a different connotation. Post course evaluations has a different meaning. Call it course surveys." | pce | Nav / tile label |
| D_PCE_0820_02 | **Management role dashboard — STRICT restriction**: management view may show aggregate average ratings (course avg, faculty avg) ONLY. MUST NOT surface "needs attention" counts by specific faculty or course. "I don't think it's a good idea to start calling out which courses are badly rated and which faculty are badly rated." Aarti: "The only thing that is acceptable to add to the [management view] is the average rating." | pce | Role-based dashboard design |
| D_PCE_0820_03 | **Hide template creation self-service for beta/Cohere**: Remove "New Template" / "Create Template" button from templates page header and empty state. Replace with instruction text box: contact support@exxat.com with PDF/paper form and team will create template. Self-service UI continues developing in background but is not exposed to clients. | pce | `templates/page.tsx` |
| D_PCE_0820_04 | **Rename "Program avg" KPI → "Course avg"** (or "Avg course rating"). Students do not rate the program — they rate courses and faculty. "Program rating doesn't fit." Vishaka and Aarti confirmed. | pce | `analytics/page.tsx` KPI row |
| D_PCE_0820_05 | **Rename "Program trend" card → "Avg course trend"**. Same rationale as D_PCE_0820_04. | pce | `analytics/page.tsx` Card title |
| D_PCE_0820_06 | **"Competency trends" label → "Section averages"** in by-faculty analytics. Sections are not always competencies — they can be workload, general questions, etc. "You should just say section averages." Vishaka: "drill down by section." | pce | By-faculty analytics (T73 — not yet built) |
| D_PCE_0820_07 | **Hide "Other factors / General" analytics section** when template has no General section. Decision to potentially remove General section from the product entirely: "we can hide it throughout." | pce | Analytics page — general/other-factors section |
| D_PCE_0820_08 | **Template course types: "Didactic" and "Experiential"** (not "Classroom based" / "Clinical" / "Practice based"). Confirmed: "We decided to use experiential and didactic. So those are the terms." Applies to template creation form and analytics filters. | pce | Template creation + analytics filters |
| D_PCE_0820_09 | **Significant movers section: confirmed NOT in initial release.** Vishal: "will not be building in the initial go." Criteria for significance (delta, percentile) still TBD. | pce | Analytics |
| D_PCE_0820_10 | **Quadrant chart confirmed priority for Cohere**: faculty avg vs. course avg, threshold dotted lines, four-quadrant layout. Aarti: "I love that graph with the quadrants. Right? That's something that's actionable." Include in Cohere analytics demo. | pce | Analytics |
| D_PCE_0820_11 | **Competitive analysis grid**: Vishal to create chart-by-chart comparison: major competitors (Qualtrics, Anthology) → what charts they have → PCE equivalents → new additions. Useful for sales team + gap analysis. | pce | Design task (not a screen change) |
| D_PCE_0820_12 | **Multi-section course aggregation**: when one course (e.g. Nursing 101) has multiple sections (course offerings), analytics shows aggregate at course level by default. Filter by course + faculty narrows to that section. Design implications TBD — needs further discussion with Aarti when in India. | pce | Analytics — course drilldown |
| D_PCE_0820_13 | **Faculty report downloads must include graphs, callouts, and comparison**, even if the report is downloadable rather than an interactive screen. "Even those downloadable reports still need to have graphs and chats and callouts and comparison available." | pce | Faculty report download (Phase 1) |
| D_PCE_0820_14 | **Term-comparison chart: must use academic year view, not term-by-term**. Same course may not be offered every term. "This makes sense with the academic year view." | pce | Analytics — term comparison chart |
| D_PCE_0820_15 | **Cohere session timing**: Guest speaker (Stephanie, Univ. of Vermont) 5–10 min on existing surveys. David intro 5 min. Vishal: 25 min total → 5 min context + <5 min management/setup + 10 min analytics deep-dive + Q&A. Focus on analytics, not training on setup. | pce | Planning (not a screen change) |
| D_PCE_0820_16 | **Pre-Cohere all-hands**: Friday before Cohere. Full Exxat Cohere attendee demo. Vishal + Canti to co-host. Aarti: "let's shoot for that." | pce | Planning (not a screen change) |
| D_PCE_0820_17 | **Analytics: if no live demo data is clean, use Figma**. Aarti: "if you cannot show the beauty of the dashboards with really good data in cohere then please do everybody a favor and use figma." Clean, meaningful data takes priority over live vs. Figma distinction. | pce | Cohere presentation (not a screen change) |

---

## Verbatim Aarti quotes

- "The only thing that is acceptable to add to the [management view] is the average rating."
- "I don't think it's a good idea to start calling out which courses are badly rated and which faculty are badly rated."
- "Keep it very, very clear. One is management... and another is content... do not intermingle."
- "Course rating program rating doesn't fit they are not rating the program in any of the surveys."
- "If you cannot show the beauty of the dashboards with really good data in cohere then please do everybody a favor and use figma."
- "I love that graph with the quadrants. Right? That's something that's actionable."
- "Surveys in my mind is a different connotation. Post course evaluations has a different meaning... call it course surveys."
- "I am actually a little jittery right now because we are designing these advanced analytics and we haven't had a discussion internally like how much of it makes sense."

## Verbatim Vishaka quotes

- "Course service is self-explanatory and it helps us distinguish from evaluations, which is a term we use for our clinical placement management. So call it course surveys."
- "You should just say drill down by section."
- "We decided to use experiential and didactic. So those are the terms."

---

## Design tasks generated

See backlog entries T218–T225.

---

## Action items

- Vishal + David: finalize Cohere presentation structure and slide deck; align by week of Sep 7
- Vishal: create competitive analysis grid (analytics charts vs. Qualtrics / Anthology)
- Canti + Vishal: schedule pre-Cohere all-hands for Friday before Cohere
- Vishal: deep-dive analytics review with Vishaka next week (block calendar proactively)
- Romit: apply safe label changes (KPI "Program avg" → "Course avg", "Program trend" → "Avg course trend")
- Romit: hide template creation self-service for Cohere build
- Aarti + Vishal: discuss multi-section course aggregation when Aarti is in India
