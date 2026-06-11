---
type: meeting
date: 2026-06-10
product: pce
participants: [Romit Soley, Aarti]
source: granola
granola_id: 410d7c0e-439c-4a4c-9c42-190cbf476785
---

# Course & Faculty Evaluation — setup, directories, term workflow — 2026-06-10

> 1:1 with Aarti (11:16 PM EDT). Context: India team (new initiatives) coming to Baroda week of June 22. One day will be dedicated to course & faculty evaluation alignment. Aarti wants design and structure nailed down before that visit.

## Topics covered

- Baroda visit scope: one day for course & faculty eval, rest for exam management
- Menu items and overall layout: finalize with Mondal (Monil) before June 22
- Three entry points for analytics: by term, by faculty, by course
- Directory structure: student, faculty, course master list — view-only, no entity management
- Setup section: academic year + terms with dates (already in T76), email templates, reminder schedule, course-type → template default mapping
- Term setup workflow: select term → courses + default templates → dates → email templates → done (3-minute task)
- General survey module enhancements: explicitly deferred (Aarti does not have bandwidth)

## Decisions

| ID | Decision | Product |
|---|---|---|
| D_PCE_AAD01 | Two email templates live in Setup (not per-survey): (1) initial email sent when evaluation is published; (2) reminder email. These are reused term after term. Admin can edit per-term if needed, but defaults are saved in Setup. | pce |
| D_PCE_AAD02 | Default reminder schedule is a Setup item, anchored on term end date. Default = "15 days before term end date, send reminder." The schedule (days before/after close date) is configured once and reused. Per-survey overrides are allowed. | pce |
| D_PCE_AAD03 | Course type → template default mapping in Setup: each course type (classroom, practice-based, etc.) can have a default survey template assigned. When setting up a term, courses auto-populate with their type-matching template. Admin can override per course. | pce |
| D_PCE_AAD04 | Term setup workflow = 3-minute task once defaults are configured: (1) select term → (2) courses auto-populate with type + default template → (3) set/confirm dates → (4) confirm email templates → save. No manual repeat work if defaults are set. | pce |
| D_PCE_AAD05 | General survey module enhancements: explicitly deferred. "Right now, I don't have the bandwidth to discuss the updates that we want to make to the general survey module." Phase 1 scope = course evaluations only. General survey UI does not change in Phase 1. | pce |
| D_PCE_AAD06 | Menu items and entry points must be finalized with Mondal before the Baroda visit (week of June 22). Aarti: "I'm hoping that in the coming week, you can nail down with Mondal all the menu items specifically that we are going to design and how the menu item is going to be structured." | pce |
| D_PCE_AAD07 | Directory pages (student, faculty, course master list, course offering): view-only. No entity management in PCE. Clicking into a student shows: which courses they're registered in, evaluation completion status, due dates. Overall stats: "student was part of 8 courses but has only completed 2 evaluations." Link to full Prism profile opens in new tab. Confirms D_PCE_AV10. | pce |
| D_PCE_AAD08 | Terminal analytics view (evaluation card) is the same regardless of entry point. Whether entering via term, faculty, or course — the final screen shows that specific course-offering instance with all its analysis. Entry point only changes the aggregation/stats shown before drilling in. | pce |

## Verbatim Aarti quotes

> "I'm hoping that in the coming week, you can nail down with Mondal all the menu items specifically that we are going to design and how the menu item is going to be structured. Right. How many entry points will we have?"

> "Right now, I don't have the bandwidth to discuss the updates that we want to make to the general general survey module."

> "So all of this is done, you assume you have the students who are registered on the courses... Now you're going in and you're setting getting yourself ready for a term. So what you are going to do is select the term... Then you're going to say okay. Which are the courses that are taught in... it defaults — each course will have a type. Based on that type, there will be a default template that gets selected."

> "So assuming I don't want to edit anything, I select fall twenty twenty six, I select my courses. I say okay to the dates. I say okay to the email templates. And I save it, and I'm done. It literally should take you two to five minutes to get a new term ready."

> "The email template is a setup. The reminder schedule is a setup. Right. Actual survey is a setup."

> "Fifteen days before the term end date, we are going this week's reminder. So that's also a default structure."

> "The three ways of entering this — by term, by faculty, by course. Each way of entering has its own stats. And then at the end of it, that final review screen is the same."

## Design tasks generated

- T80 (pce): Finalize menu structure (entry points, nav labels) with Mondal before Baroda visit week of June 22. Block time with Mondal this week. D_PCE_AAD06.
- T81 (pce): Setup section — email templates: two email templates (initial publish + reminder) as persistent Setup items, not per-survey. Design a two-template editor in Settings/Setup. D_PCE_AAD01.
- T82 (pce): Setup section — reminder schedule default: design a reminder schedule configuration (days relative to term close date) as a Setup item. Default = 15 days before close date. D_PCE_AAD02.
- T83 (pce): Setup section — course-type → template default mapping: design a mapping screen in Setup where each course type can have a default survey template assigned. Used to auto-fill template when setting up a term. D_PCE_AAD03.
- T84 (pce): Terminal evaluation card — confirm consistent design regardless of entry point (term / faculty / course). This is the same view whether entered via the term analytics path, faculty path, or course path. D_PCE_AAD08.
