---
type: meeting
date: 2026-06-25
product: pce
participants: [Romit Soley, Nipun (PM)]
source: granola
granola_id: c9797a3b-44af-4704-8cfe-0cfa72c85c45
---

# Course Eval sync up — 2026-06-25

> Nipun debriefing Romit after a week-long alignment trip to Vadodara covering exam management and course evaluation. PCE product requirements are now frozen on the product side. Engineering (Vinay) starts grooming this week. Aarti visits Bangalore next Wednesday — 4 capability designs must be ready.

## Topics covered

- Dashboard: 3-card fixed layout (current / previous / upcoming term)
- Data audit step: label "Add data" (not "Fixed data") — Arjun's directive
- Push survey: confirmed 4-step flow (down from 5 in PRD, up from 3 currently coded)
- Template: 3 evaluation aspects — Content, General, Faculty (faculty has sub-roles; clone supported)
- Settings: evaluation window auto-calculates from term dates; email and answer type pre-populated from settings; admin can override per survey
- Priority build order: Setup term → Create template → Push survey → Settings
- Analytics: not a design priority right now
- "Run with AI" in dashboard prototype: removed / ignore — not relevant to Phase 1

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_625_01 | Dashboard: 3 fixed term cards — current term, last term, upcoming term. As terms progress, old terms drop off the top. First-time login shows a single "configure term calendar" CTA card, no survey cards. | pce | T46 |
| D_PCE_625_02 | Label rename: "Fixed data" → **"Add data"** for the pre-distribution data audit action. Arjun's directive from Vadodara. Positive framing — admin is adding missing data, not fixing errors. Applies to step-zero audit screen (T48). | pce | T48 |
| D_PCE_625_03 | Push survey: **4 steps** confirmed. Step names will evolve but purpose: (1) select courses/term, (2) assign or design template, (3) communication, (4) implied review/confirm. Supersedes the 5-step count in T49; also supersedes the current 3-step code. | pce | T49 |
| D_PCE_625_04 | Template evaluation aspects: **Content, General, Faculty**. Faculty aspect supports multiple named sub-roles (instructor, course coordinator, etc.). Admin can clone the question set from one sub-role section to another within the same template — avoids re-entry. | pce | T34, T35 |
| D_PCE_625_05 | Settings auto-populates push survey fields: answer type locked to program default (e.g., 5-point Likert); evaluation window auto-calculated as 7 days before term end → 7 days after term end; email template and reminder cadence pre-filled from saved settings. Admin can override any field per survey. | pce | T81, T82, T83 |
| D_PCE_625_06 | Analytics: explicitly not a design priority. Work on the 4 priority capabilities first. Deferred. | pce | Reconfirms T33 |

## Verbatim quotes

> "Earlier it was, I think, five step process. That was documented in PRD, but now it will be only four step process. With these names. Names might change, but these are the purpose of each step. Selecting course, designing the template or assigning template, and then communication." — Nipun

> "Arjun did not like the word fixed. So we can have some positive or a soft word called add data." — Nipun

> "And this run with AI is going to all be there all the time? No. No. No. This this, you can ignore. This is actually is not relevant now. I will remove it from the code as well." — Nipun

> "Admin only cares about current term, upcoming term, and last term. When it comes to operational thing." — Nipun

> "Content, general, and faculty. Inside faculty, we can have multiple faculty roles... I can clone from instructor. Instead of writing it again." — Nipun

> "Designs, we'll build it not in a rush. We'll build it step by step." — Nipun

## Engineering schedule

- Monday Jun 30: Nipun grooming Vinay on create template + push survey + settings
- Wednesday Jul 2: Aarti visits Bangalore — 4 capability designs must be ready to present
- Priority order: (1) Setup term, (2) Create template, (3) Push survey, (4) Settings

## Design tasks generated

See `_backlog.md` entries T88 (new) and updates to T46, T48, T49 notes.
