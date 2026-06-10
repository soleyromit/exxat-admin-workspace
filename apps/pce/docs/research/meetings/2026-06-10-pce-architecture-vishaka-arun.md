---
type: meeting
date: 2026-06-10
product: pce
participants: [Romit Soley, Vishaka, Arun, Vinaya, Michelle]
source: granola
granola_id: 4d1fa807-2bda-4a38-880e-15376e9810a7
---

# PCE Architecture — tab structure, analytics, academic calendar — 2026-06-10

> Long architectural alignment session (115k char transcript). Vishaka, Arun, Vinaya (dev manager), Michelle (Yash?) present. Covers PCE navigation structure, analytics page design, base entity strategy, academic calendar setup, and standalone sellability roadmap.

## Topics covered

- Navigation / tab structure for PCE module
- Dashboard design: term-based grouping of course offerings
- Longitudinal analytics — renamed to course-offering + faculty dimensions
- Faculty analytics page: leaderboard, trends, spider graph
- Student directory: columns, detail view, survey status
- Academic calendar setup as prerequisite for survey automation
- Base entity strategy: pull from Prism, no separate entity creation in PCE Phase 1
- Entity management actions → navigate to Prism
- LMS integration roadmap
- Standalone sellability timeline (2027)

## Decisions

| ID | Decision | Product |
|---|---|---|
| D_PCE_AV01 | Tab naming: do NOT call analytics tab "Longitudinal Insights". Use "Course Offering" and "Faculty" as the two analytics entry points. These are the dimensions that make PCE unique and special. | pce |
| D_PCE_AV02 | Dashboard groups all course offerings by TERM (current, future, past). Not a flat list of all courses ever. Term is the primary organizing axis. | pce |
| D_PCE_AV03 | "Course Offering" analytics page: leaderboard by term + average rating charts. Clicking into a course shows trend (5-year history of how that course was rated), per-term comparison. | pce |
| D_PCE_AV04 | "Faculty" analytics page: top performers section + "needs attention" section at top (leaderboard), then searchable grid. Columns: total courses, average score, highest score, lowest score. Clicking a faculty shows course-level history + spider graph of section-level scores + comparative trend vs. peers. | pce |
| D_PCE_AV05 | Spider graph for faculty: sections of the template (e.g., delivery, preparation, accessibility) as axes. Peer comparison in same term + longitudinal trend across terms. | pce |
| D_PCE_AV06 | No separate "surveys" tab on student detail view. Survey completion status INTEGRATED into course rows on student detail. Current courses at top, completed courses below, no future courses shown. | pce |
| D_PCE_AV07 | Student detail columns: merge course + survey status into one view. Show: is survey ongoing or filled/past? Was it released? Include adherence metric (e.g., student filled 1 of 4 surveys = poor adherence). | pce |
| D_PCE_AV08 | Academic calendar setup = PREREQUISITE for survey operations. Settings must include: academic year (with start date + end date) + term labels (with start/end dates per year+term combination). Only terms with dates configured will be pulled into the module. | pce |
| D_PCE_AV09 | "Terms" grouped dashboard only shows terms that have been configured with dates in Settings → Academic Calendar. Unconfigured/blank terms are excluded from dashboard grouping. | pce |
| D_PCE_AV10 | Base entities (students, faculty, courses) = pulled from Prism base. No separate entity creation inside PCE for Phase 1. View-only list in PCE; actions (add student, register) navigate user to Prism page in new tab. | pce |
| D_PCE_AV11 | Student directory in PCE: view-only API page. Columns relevant for PCE (not same as Prism's full student page). Phase 1 columns: cohort, campus, category, status, number of courses with surveys, survey completion count. | pce |
| D_PCE_AV12 | Faculty directory in PCE: view-only. Columns: name, designation, courses taught, average rating, survey count. Entry point to faculty detail/analytics. | pce |
| D_PCE_AV13 | Standalone sellability target = 2027. Phase 1 (2026) relies on Prism base for entity management. By 2027, PCE must work independently (own entity creation flows or reusable base components). | pce |
| D_PCE_AV14 | LMS integration (95% target) is long-term default. Phase 1 uses Prism base + manual. When LMS is connected, manual add/edit flows go away automatically. No phase-1 LMS-specific UI needed for PCE beyond what already exists. | pce |
| D_PCE_AV15 | "Don't call it project" — term-level grouping language is "terms", not "projects". Academic terminology for users. | pce |
| D_PCE_AV16 | Course offering analytics entry: "course offering listing, all offerings of that course over time" sorted descending. Stats per row: average rating, response rate, # enrolled, # completed. | pce |

## Verbatim quotes

> "Don't call it longitudinal because call it faculty because I want faculty's insights." — Arun

> "This page and this page [course dimension + faculty dimension] is what makes sense for us to say we are carving this out as a unique type of survey. It only makes sense to carve out if you can ace this." — Arun/Vishaka

> "The trend like, you know, how you have seen the spider graph for competencies for students — so if those questions fall into a particular group or a section, we may be able to calculate average scores for the section and then do a spider web graph for those sections." — Vishaka

> "We should not show here all twenty twenty five, twenty thirty five — not show all of them. The landing when you click on that faculty, the landing page will be like, top five performing faculty, faculty that need attention could be the bottom five faculty. And then on the right side, you have a little bit of a section where you don't need very many attributes — just the selection of the faculty." — Arun

> "I don't think we need a separate tab called surveys. Whether or not the student has filled the survey — be integrated here itself. So there is nothing about the course that is really that important. So course, term, you can kind of merge it." — Arun

> "We have to ensure your configuration is correct. Academic calendar is essentially a label. Term, academic year, start date, and end date. If it doesn't exist, we shall not pull it in. If they are not configured it correctly, we know the dates. We will not bring it up." — Vishaka/Arun

> "For the ones that you want to use, start adding this. When we onboard a client on this, for whichever terms you will run survey, that term must have start date and end date set up. Only those will get pulled in." — Arun

> "Is everybody clear that the setup section will force them to add start date and dates for their years and terms that they want to use?" — Vishaka

> "On day one launching this app, you are relying on the Prism base. For entity management, the second operation is the additions done in Prism. And the third operation is a link from within this app. By 2027, we will make this independent sellable." — Arun

## Design tasks generated

- T72 (pce): Rename analytics tab entries: "Course Offering" and "Faculty" (not "Longitudinal Insights"). Navigation label change needed when analytics nav is built. D_PCE_AV01.
- T73 (pce): Faculty analytics page — leaderboard layout (top performers + needs attention) + searchable grid with columns: total courses, avg score, highest score, lowest score. Click → faculty detail with spider graph + trend. NEW PAGE NEEDED. D_PCE_AV04, D_PCE_AV05.
- T74 (pce): Course offering analytics page — term-grouped offering list with per-row stats (avg rating, response rate, enrolled, completed). Click → per-offering results. NEW PAGE NEEDED. D_PCE_AV03, D_PCE_AV16.
- T75 (pce): Student detail view — merge course + survey status into one view. Current courses on top, past below, no future. Survey completion status (filled/not filled, released/not) integrated as column on course rows. No separate "surveys" tab. DESIGN-REVIEW — structural. D_PCE_AV06, D_PCE_AV07.
- T76 (pce): Academic calendar settings screen — academic year (label + start date + end date) + terms (per year+term combination: start date + end date). Must be configured before dashboard term-grouping works. NEW PAGE NEEDED. D_PCE_AV08, D_PCE_AV09.
- T77 (pce): Dashboard term-grouping — only pull terms with configured calendar dates. Unconfigured terms excluded. Reminder/link shown for unconfigured terms (pairs with T58). D_PCE_AV09.
- T78 (pce): Student directory in PCE — view-only page with PCE-relevant columns (cohort, campus, category, status, survey count, adherence). Phase-1 entity actions navigate to Prism in new tab. DESIGN-REVIEW. D_PCE_AV10, D_PCE_AV11.
- T79 (pce): Faculty directory in PCE — view-only page with PCE columns (name, designation, courses taught, avg rating). Entry to faculty detail/analytics. DESIGN-REVIEW. D_PCE_AV10, D_PCE_AV12.
