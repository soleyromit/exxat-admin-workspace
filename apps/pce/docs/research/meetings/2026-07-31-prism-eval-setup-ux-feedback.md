---
type: meeting
date: 2026-07-31
product: pce
participants: [Romit Soley, External stakeholder (admin user UX feedback session)]
source: granola
granola_id: 0aad1695-75e8-4b14-85e0-ed1a99b1e793
---

# Exxat Prism — Evaluation Setup UX Feedback — 2026-07-31

**Date:** 2026-07-31 12:05 PM EDT
**Participants:** Romit (note creator / designer presenting screens); External stakeholder (program admin / medical school perspective, giving UX walkthrough feedback). Vishaka mentioned as downstream recipient of design updates.

---

## Topics covered

1. Survey/evaluation setup wizard walkthrough — template selection, course selection, faculty management
2. "Two evaluations" terminology confusion for one course with multiple sections
3. Template name vs. course name in the template selection card
4. Course status visibility on the main course list screen
5. Three-state model for courses: not configured / in progress / configured+distributed
6. Post-distribution lock behavior
7. Faculty add/remove within setup workflow vs. redirect to Prism
8. Bulk configure = unconfigured courses only
9. "Open surveys for selected courses and reminders" screen within wizard
10. "Evaluate again" CTA label confusion
11. Dashboard template shortcut link
12. Preferred UI: information-rich table view vs. step-by-step wizard

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0731_01 | **Master setup screen MUST show configuration status per course per term.** Admin must be able to see at a glance which courses are: (1) Not configured, (2) In progress (saved but not pushed), (3) Configured + distributed. Status visible on the course list / setup evaluation master screen. Filter affordance required ("show only courses not yet set up"). "I should be able to very quickly see and even filter which courses do I still need to finish setting up this workflow." | pce | T109, T127, T131 |
| D_PCE_0731_02 | **POST-DISTRIBUTION LOCK — after push date passes, evaluation row becomes read-only.** Visual treatment: row grayed out. "I would almost imagine it becomes grayed out, right? And it says this evaluation has already been distributed. You cannot make any further changes." Pre-push but configured = still editable (add/remove faculty, change reminder dates, change release date, change template). | pce | T129, T132 |
| D_PCE_0731_03 | **BULK MULTI-SELECT = UNCONFIGURED COURSES ONLY.** Admin cannot select a mix of already-configured and unconfigured courses in the same bulk operation. "I shouldn't be able to select [a configured course] and select a course I haven't configured. Because otherwise you're going to show them a really complicated screen." Already-configured courses → one-at-a-time edit flow. Unconfigured courses → bulk configure flow. These are two separate actions from the master screen. | pce | T129, T133 |
| D_PCE_0731_04 | **FACULTY ADD/REMOVE WITHIN SETUP WORKFLOW — always available, even when Prism data exists.** "Add Faculty" and "Remove Faculty" affordances must be present in the setup workflow regardless of whether faculty are already populated from Prism. "Always have the ability to add or remove as needed. Even if there is data in Prism to pull into it." Button available even if faculty exist; editing the final list is always supported. | pce | T129, T134 |
| D_PCE_0731_05 | **TEMPLATE NAME must appear in template selection card — NOT the course name.** Showing course name where admin expects to see a template name causes fundamental confusion. "The biggest confusion for me is the template names are a course name. I already picked the course here and then I expect to click here and see… which template am I using for that course?" Template picker row must show: template name, sections it covers, question count. | pce | T129, T135 |
| D_PCE_0731_06 | **KILL "open surveys for selected courses and reminders" from the setup wizard.** This intermediate screen showing existing reminders for the selected term must be removed from the setup flow. "As a user I'm stopping here and being like, what do I need to do with this? If it's just like an FYI, I don't know if we need to surface in the workflow because right now I'm planning the communication for this particular course or courses." Move to dashboard view if it has value. | pce | T129, T136 |
| D_PCE_0731_07 | **TERMINOLOGY: "N surveys across N courses" — NOT "N evaluations."** Each course = 1 survey (even if the template has multiple sections: course content, instructor, coordinator). "When you say I have 21 evaluations, I should really just have nine surveys for nine courses. There's 21 different sections across nine courses." Affects all labels in the setup wizard that count evaluations. | pce | T129, T137 |
| D_PCE_0731_08 | **TABLE VIEW confirmed as preferred UI over step-by-step wizard for course management screen.** The information-rich table (course row + status + faculty + students + action column) is preferred. "I actually like this better. It makes sense to me… it gives me the information I need to decide what I need to do next? Yes, a lot better." Confirms T109 direction. | pce | T109, T138 |
| D_PCE_0731_09 | **Dashboard template shortcut link required.** Without a shortcut, new users cannot discover where to create templates before starting the setup flow. "I think there needs to be more visibility here into how do I add a template." A link or button on the dashboard that navigates to Settings > Templates. Priority: especially if no templates exist. Pairs with T125 (Create Template CTA on term cards). | pce | T125, T139 |
| D_PCE_0731_10 | **Per-course template assignment row must show sections AND specific people.** After admin picks courses + template, the confirmation/review step should show: template name, template sections (Course Content, Instructor, Coordinator), and the SPECIFIC people associated with each section. "Okay, human anatomy and kinesiology. You have it set up that you have this course materials section and then you have it set up that you have this faculty here… here are your three instructors." | pce | T129, T140 |

---

## Verbatim stakeholder quotes

> "The biggest confusion for me is the template names are a course name. I already picked the course here and then I expect to click here and see something like, okay, yes, that's a course I'm pulling forward, but then which template am I using for that course?"

> "I should be able to very quickly see and even filter which courses do I still need to finish setting up this workflow and be able to go through this to do that."

> "I would not probably resend the exact same evaluation or the exact same survey for the same academic year, the same cohort, the same term. If it's already been sent once."

> "I would almost imagine it becomes grayed out, right? And it says this evaluation has already been distributed. You cannot make any further changes."

> "I shouldn't be able to select [a configured course] and select a course I haven't configured. Because otherwise you're going to show them a really complicated screen where some of it is… how do I handle this that's already been configured in other part of it is it's brand new."

> "Always have the ability to add or remove as needed. Even if there is data in Prism to pull into it."

> "When you say I have 21 evaluations, I should really just have nine surveys for nine courses. There's 21 different sections across nine courses, but I think that's what's confusing here."

> "As a user I'm stopping here and being like, what do I need to do with this? If it's just like an FYI, I don't know if we need to surface in the workflow because right now I'm planning the communication for this particular course or courses."

> "I actually like this better. It makes sense to me. It gives me more information. Is it busier? Yes. But does it give me the information I need to decide what I need to do next? Yes, a lot better."

> "I think there needs to be more visibility here into how do I add a template."

> "Setting up a brand new course all the way through is a different flow. And then for one that's already been set up, whether that's adding faculty or moving faculty is a different flow. You should be able to start both of them from this page."

---

## Code cross-reference (Pass 5)

| Directive | Existing code | Gap / Status |
|---|---|---|
| D_PCE_0731_01: Configuration status per course on master screen | ❌ Not built | Setup evaluation master screen / table does not exist in code. T131 added. |
| D_PCE_0731_02: Post-distribution lock (grayed row + message) | ❌ Not built | `surveys/push/page.tsx` is a 3-step wizard (pre-T129). Lock state not modeled. T132 added to T129 scope. |
| D_PCE_0731_03: Bulk select = unconfigured only | ❌ Not built | Current wizard has global multi-select with no configured/unconfigured distinction. T133 added. |
| D_PCE_0731_04: Faculty add/remove within setup flow | ❌ Not built | No faculty management UI in current `surveys/push/page.tsx`. T134 added to T129 scope. |
| D_PCE_0731_05: Template name in template card | ✅ Correct in `surveys/push/page.tsx` | `Step1` shows `t.name` (template name). Not a problem in current code. Issue is in Lovable prototype. Note: ensure this carries forward when T129 is implemented. |
| D_PCE_0731_06: Kill "open surveys and reminders" from wizard | ✅ Not present in code | `surveys/push/page.tsx` has no such section. Only issue is in Lovable prototype design. |
| D_PCE_0731_07: "N surveys" not "N evaluations" | ✅ Code OK | `surveys/page.tsx` doesn't have "N evaluations" count language. Applies to Lovable prototype only. Carry forward when T129 Step 3/4 copy is written. |
| D_PCE_0731_08: Table view preferred | — | Confirms T109 direction. No code to change — the table IS the new design target. |
| D_PCE_0731_09: Template shortcut on dashboard | ❌ Not built | Dashboard term cards (T46) don't exist in code. T139 added. |
| D_PCE_0731_10: Sections + specific people in review step | ❌ Not built | Step 4 review in T129 is not yet built. T140 added to T129 scope. |

**Pass 5 verdict:** No immediate code changes apply to existing screen files. All 10 directives target either the Lovable prototype (copy/terminology fixes to carry forward) or the not-yet-built T129 setup evaluation wizard. Tasks T131–T140 added to backlog to track.

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T131 | Setup evaluation master screen: three-state course status column | P1 — DESIGN-REVIEW | States: (1) Not configured → "Set up" button. (2) In progress → "Continue" button. (3) Configured + distributed → grayed row, locked, tooltip message. Filter affordance: "show only courses needing setup." Supplements T109, T127. |
| T132 | Post-distribution lock: grayed row + locked state visual treatment | P1 — DESIGN-REVIEW | After push date passes, course evaluation row grays out. Message: "This evaluation has already been distributed. You cannot make any further changes." Pre-push but configured = still editable. Lock behavior applies in T129 Step 1 master screen. |
| T133 | Bulk multi-select constraint: unconfigured courses ONLY | P1 — DESIGN-REVIEW | Selecting a configured course + an unconfigured course in the same bulk operation must be blocked. Once a course is selected that is already configured, unconfigured ones become non-selectable (or vice versa). Two separate action paths from master screen: bulk-setup flow (new courses) vs. one-at-a-time edit flow (configured courses). |
| T134 | Faculty add/remove within setup workflow (not just Prism redirect) | P1 — DESIGN-REVIEW | Add Faculty + Remove Faculty affordances in Step 2 (template + faculty step per T129). Available even when Prism already provides faculty. "Add Faculty" button always visible. Editing the final person list is always supported. |
| T135 | Terminology sweep: "N surveys across N courses" in setup wizard copy | P1 — when T129 is implemented | When writing Step 3 / Step 4 copy for T129, use "N surveys across N courses" phrasing. NOT "N evaluations." Each course = 1 survey regardless of section count within the template. |
| T136 | Kill "open surveys for selected courses and reminders" from wizard | P1 — applies when T129 is implemented | If this section exists in Lovable prototype Step 2 or Step 3, remove it. Belongs on dashboard only. Do not build into T129 wizard. |
| T137 | Configuration status filter on setup evaluation master screen | P1 — DESIGN-REVIEW | Quick filter above the course table: "All" / "Not yet set up" / "In progress" / "Configured." Helps admin resume partial work mid-term. Supplements T131. |
| T138 | Template selection card: template name (not course name) — carry-forward note | P1 — carry forward | Current `surveys/push/page.tsx` correctly shows `t.name`. When rebuilding per T129, the per-course template picker in Step 2 must show template name, not course name or course code. |
| T139 | Dashboard template shortcut link | P1 — DESIGN-REVIEW | Link or button on PCE dashboard (and/or on term cards when no templates exist) navigating to Settings > Templates. "There needs to be more visibility here into how do I add a template." Especially important for zero-template state. Supplements T125. |
| T140 | Step 4 review: per-course template sections + specific people | P1 — DESIGN-REVIEW | The review step in T129 must show per selected course: template name, template sections (Course Content, Instructor, Coordinator), and SPECIFIC people in each section (not just role names). "Here are your three instructors." Supplements T129 Step 4 spec. |
