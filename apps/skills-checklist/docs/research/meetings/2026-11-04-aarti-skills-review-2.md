---
type: meeting
date: 2026-11-04
product: skills-checklist
participants: [Romit Soley, Sankalp Panda, Aarti Vaishnav, Vishakha Bhave, Kunal Vaishnav, Yash Shah]
source: granola
granola_id: 205da2dd-a7b1-4b25-b547-031162c25b29
---

# Skills Tracking Discussion 2 — Aarti, Vishaka, Kunal, Sankalp — 2026-11-04

**Date:** 2026-11-04 7:00 AM EST
**Participants:** Romit (Design), Sankalp (Engineering), Aarti Vaishnav (Product), Vishakha Bhave (PM), Kunal Vaishnav, Yash Shah
**Topic:** Conceptual alignment on standards vs. competencies vs. skills; design review of skills library prototype

---

## Context

Sankalp opened with a conceptual framing (standards vs. competencies vs. skills) before Romit walked through the skills library prototype. Aarti gave structured design feedback. The prototype showed multiple design variants which caused navigation confusion; Sankalp and Romit have agreed to consolidate into one happy path before the next review.

**Aarti is unavailable Nov 5 – Nov 19. Next review: November 23, 9 AM ET, 90 minutes.**

---

## Topics covered

1. Conceptual distinction: Accreditation Standards vs. Competency Frameworks vs. Skills
2. Placement of skills module in Prism navigation
3. Skills library prototype walkthrough (admin: add, configure, group, assign, map to courses)
4. Aarti feedback on group-of-skills model (critical correction)
5. Course mapping approach and relationship to course cloning
6. Student and faculty workflow overview (exposure vs. evaluation, QR code, email)
7. Reporting views: student-centric, skill-centric, course-level
8. Skills-to-competencies optional mapping
9. Scope of initial build: nursing undergrad primary but all 8 known use cases must be accounted for
10. PA domain: already served by patient logging; this module is not targeted at PA initially
11. Next steps and schedule

---

## Decisions table

| # | Decision | Product | Applies to |
|---|---|---|---|
| D17 | Accreditation Standards, Competency Frameworks, and Skills are three distinct entity types and must be treated and tracked separately — not all lumped under "standards" | skills-checklist | Data model / Admin setup |
| D18 | Skills module sits in a dedicated "Skills and Competencies" section with two sub-tabs: one for Skills, one for Competencies — NOT inside Program Details | skills-checklist | Navigation / Admin |
| D19 | Primary initial domain is nursing undergrad; PA is already served by patient logging. But the design MUST account for all 8 known use cases — Aarti explicitly rejected a nursing-only approach | skills-checklist | Product scope |
| D20 | Skill assignment model: a complete SKILL LIST is assigned to a student group — not individual skills sub-selected per group. Aarti called the previous sub-selection model incorrect | skills-checklist | Admin setup |
| D21 | A program can have one or more simultaneous active skill lists; each is tracked and reported independently (separate tabs in reports; no cross-list data merging) | skills-checklist | Admin setup / Reporting |
| D22 | One skill list is designated as the default; any new student group automatically gets the default list applied | skills-checklist | Admin setup |
| D23 | Course skill mapping must work with course cloning: when a course offering is cloned, skill mappings carry forward automatically | skills-checklist | Admin setup / Eng |
| D24 | Skills are mapped at the COURSE OFFERING level (not abstract course level) | skills-checklist | Admin setup |
| D25 | Student QR code for preceptor sign-off is confirmed as a desired interaction (UTA faculty interest confirmed by Aarti). Email link remains as alternative | skills-checklist | Student / Preceptor |
| D26 | Student can request evaluation for the same skill multiple times | skills-checklist | Student workflow |
| D27 | Students access skill requests within their placement course section AND from a global skills dashboard — both entry points required | skills-checklist | Student |
| D28 | Two primary admin reporting views: (1) student-centric — all skills × progress per student; (2) skill-centric — cohort performance against each skill; also course-level view | skills-checklist | Reporting |
| D29 | Skills can optionally be mapped to competencies; skills completed by a student appear as evidence when viewing that student's competency report | skills-checklist | Admin setup / Reporting |
| D30 | No role-based access complexity needed in initial build — think in 2 views: course-based view and overall student view | skills-checklist | Roles / Scope |

---

## Critical design corrections (Aarti directives)

### 1. Group-of-skills assignment model — WRONG in current prototype

**Current broken design:** Admin creates a group, then sub-selects individual skills to assign to that group, then selects student groups.

**Correct model:**
1. Create a skill list: give it a name, select which skills from the library are in it → save
2. Separately: assign skill list to a student group (the ENTIRE list goes to the group, no sub-selection)
3. The same skill list can be assigned to multiple groups

> "They don't sub-select skills to apply to cohorts. That is just the wrong way to think about it." — Aarti
>
> "You will have the ability to create one or more lists for skills. That entire list will be applied to the group." — Aarti
>
> "Sub-selection of skills from existing multiple lists — bullshit. This is not how it's going to happen." — Aarti

### 2. Course mapping must account for course cloning

Do NOT design per-offering seasonal toggles (fall/spring/etc.). Skill mappings are set at the offering level and carried forward through cloning.

> "I don't want to do this complex thing. Oh, in fall it applies but in spring it doesn't apply... That's not how skills are done." — Aarti
>
> "Anytime I do course cloning, those skills are also carried forward so I don't have to do it." — Aarti

### 3. Prototype has too many variants — consolidate before next review

Romit must present one consolidated happy-path flow for November 23. No variant switching during demo.

> "I don't want to see multiple variants. These screens don't look clean and easy to navigate." — Aarti

---

## Verbatim quotes (Aarti)

> "I don't want to take the approach that we are only going to cater to nursing needs and then we will adapt it. We understand these 8 use cases and these 8 use cases will be catered through our design." — Aarti

> "You will be able to create student groups, you'll be able to create skill lists, and you will apply a particular skill list to a particular group in one go and be done with it." — Aarti

> "If the skills are going to change, you will create another skill list. And going forward, you will start applying that skill list to new groups." — Aarti

> "You need to think about course cloning. We've made our clients' lives complicated already by saying cloning will not include curriculum mapping, will not include LAM. I don't want you to start thinking about this in abstraction of that." — Aarti

> "I will have to figure out a way to deploy this from within a place, my placement section. So when I'm placed somewhere if that course has course skills mapping done, I should see that link for it within my course and be able to request that." — Aarti

> "I should also be able to look at a dashboard and request something from there directly." — Aarti

> "I talked to the faculty at UTA earlier this week, and there they were very excited about the QR code option so I can either request it. I can show the QR code for that skill to the preceptor, they can scan that QR code and fill my evaluation for me." — Aarti

> "I can request for that evaluation multiple times." — Aarti

> "Role-based access — I don't want you to complicate it too much. Just think about 2 views: course-based view and student-based." — Aarti

> "There is a list view that gives me all the mapping of this to each student. How is that student doing? And then at the skill level, how is my cohort doing? At this course level, how is my cohort doing?" — Aarti

> "Make it count when you show me [Nov 23]. These 2 and a half weeks — please work on this." — Aarti

---

## Verbatim quotes (Sankalp / Vishaka)

> "Instead of having competency management and skills management as separate things, we can have skills and competencies, but within this, we can have 2 sections, one for skills and one for competencies." — Sankalp

> "Additionally, we will also give a way to map skills to specific competencies." — Sankalp

> "To combine and create a skills tracking tool for different disciplines will make it very complicated. If we do want to cater to nursing to begin with, take into account those use cases and then incrementally keep adding to it." — Vishaka

> "PA schools — they are able to already track what they want through the regular mechanism [patient logging]. They will not do extra work to set up a list here." — Yash Shah

---

## Design tasks generated

See `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_17 through T_SC_28

---

## Action items

| Owner | Action | Deadline |
|---|---|---|
| Romit | Consolidate all prototype variants into one happy-path flow | Before Nov 23 |
| Romit | Redesign group-of-skills assignment to match Aarti's model (skill list → assign to student group) | Before Nov 23 |
| Sankalp | Email Ankit: list all existing clients using skills workarounds (radiation tech, nutrition, etc.) with OU codes and tenant info | Today |
| All | Schedule 90-minute review with Aarti for Nov 23, 9 AM ET | ASAP |
| Vishaka | Available for interim reviews before Nov 23 | Ongoing |
