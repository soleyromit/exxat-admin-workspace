---
type: meeting
date: 2026-11-04
product: skills-checklist
participants: [Romit Soley, Sankalp Panda]
source: granola
granola_id: 365abc25-9514-48ee-b627-9289d4fb9905
---

# Skills Management Pre-Call Prep — Sankalp + Romit — 2026-11-04

**Date:** 2026-11-04 ~5:43 AM EST (before the main Aarti review)
**Participants:** Romit (Design), Sankalp (Engineering)
**Topic:** Internal walkthrough of prototype before the Aarti demo — identifying issues and planning what to show

---

## Context

Sankalp and Romit walked through the skills prototype together before the main meeting with Aarti. They identified specific UI issues, label problems, and flow gaps. Some decisions here are "pre-decisions" that were then confirmed in the main Aarti meeting.

---

## Topics covered

1. Skill addition flow: individual, bulk list, bulk upload, copy from starter library
2. Skill configuration: independence level selection (radio → checkbox), evaluation settings
3. Group of skills: creation flow issues, "assign group vs. individual" tab confusion
4. Course mapping: two-view toggle (skill-anchored vs. course-anchored)
5. Global evaluation settings: central defaults + per-skill overrides
6. Categories and tags
7. Final result override in question-based evaluation
8. Setup summary screen (should not be shown)
9. Skills vs. competencies placement in Prism navigation

---

## Decisions / UI fixes identified

| # | Issue | Fix |
|---|---|---|
| F1 | "Required to graduate" label on skill groups | Remove entirely — if a skill is assigned to a student it's implicitly required |
| F2 | Achievement level uses radio button | Change to multi-select checkbox (e.g., underdeveloped / developing / developed — select whichever counts) |
| F3 | "Not configured" label on skills that have inherited global settings | Change to "Default configuration" |
| F4 | "Assign a group of skills / individual skills" tabs inside group creation flow | Remove these tabs — creation of group and assignment to students should be presented clearly without this sub-tabbing |
| F5 | Group creation flow conflates creating the group AND assigning to students in one step | Show as: (1) give name + select skills → save group, (2) assign group to student group separately |
| F6 | "Tracks and custom groups → create a group" section appearing redundantly inside the assignment flow | Remove the duplicate group-creation section from within the assignment flow |
| F7 | Setup summary screen at the end | Don't show — changes from every step make a single summary meaningless |
| F8 | Final result field in question-based evaluation can be overridden independent of question answers | Remove or rethink — the approved/not state should derive from question answers, not an overriding field |
| F9 | Course mapping: only one view shown (course-anchored) | Support BOTH views with a toggle: skill-anchored (select skill, map to multiple courses) and course-anchored (select course, map skills to it) |
| F10 | Global evaluation settings as a separate top-level section | Keep it — it's the central default applied to all skills; individual skills inherit and can override |

---

## Skills vs. competencies placement (Sankalp proposal, confirmed in main meeting)

Sankalp proposed a "Skills and Competencies" section with two sub-sections:
- **Skills tab**: full setup and review workflow for skills
- **Competency tracking tab**: evaluation and reporting

Within the Skills tab, there would also be a "map to competencies" option alongside the existing "map to courses" and "map to students" options.

---

## Starter library concept

Exxat will curate starter skill libraries per domain (nursing, radiation tech, etc.) that schools can copy from. This reduces the burden of manual entry for the initial setup.

---

## Verbatim quotes (Sankalp)

> "Instead of saying 'not configured', we should say 'Default configuration'." — Sankalp

> "If you say at a central level, change it for all skills — times needed part we don't necessarily want to include there, but we can. They can set it, then override per skill." — Sankalp

> "We will have 2 separate sections — setup and review for competencies, setup and review for skills. And within skills, map to competencies option alongside map to courses and map to students." — Sankalp

> "If it is question-based, it should draw whether the skill is approved based on the questions' answer, right?" — Sankalp
