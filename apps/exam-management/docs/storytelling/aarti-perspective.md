# Aarti's Perspective — Exam Management

> Aarti drives product strategy. Captured across May 5–8 2026 meetings. Append-only — when Aarti changes her mind, add a new dated section; don't delete prior.

---

## Recurring mental models

### 1. Curricular Assessment Loop (the strategic frame)

> "You first teach the content to the students, which is your curriculum mapping… then you create assessments that test the students on what you have taught. You cannot be creating assessments in a vacuum… so you build your assessments based on what you have taught and then you look at the results and then you know that have the students learned what they need to learn. That's the curricular assessment loop."
> — 2026-05-06

> "ExamSoft is not able to do it… everything is fragmented right now. Either you map your questions directly to your standards or you map your curriculum directly to the standards. No one is creating a complete chain… we have an opportunity here to do it the right way."
> — 2026-05-07

### 2. Match-then-extend (the parity discipline)

> "We will keep us rooted and anchored… we cannot do it at the cost of the basic bread and butter kind of functionality."
> — 2026-05-06

> "Anytime we go from V3 to V4 or we take a current feature and we drop it, people will keep complaining about it… for helping people with the migration from ExamSoft to Exact, there will have to be like a conscious effort to say they should be able to do everything they can do with ExamSoft. And more."
> — 2026-05-06

> "I want to bring back that parity list with examsoft to keep us grounded and anchored that we do innovation, we create those differentiators but not at the expense of the must haves."
> — 2026-05-07

### 3. AI recommends, human decides

> "Whether it's comprehensive or not is for them to decide because you don't know what is the scope of a given assessment."
> — 2026-05-07 (on AI claiming standards coverage)

> "Faculty may not create assessments with course objectives as starting point. It will most likely be course content. As a starting point. Topics as a starting point."
> — 2026-05-07 (on respecting faculty mental model over AI-suggested workflow)

### 4. Faculty are conservative on new questions

> "99.9% of our users already have their question banks, already have their validated assessments which have been used for years … they are not going to create new questions in lump sum because they don't know how these new questions are going to perform."
> — 2026-05-07

### 5. Modularity + composition

> "By default any functionality we build, we build it in such a way that it can be used in isolation. It can also be used along with other modules. But the user will get a compounded benefit if we use it with other modules."
> — 2026-05-07

> "Going forward, I'm going to be with or without prism. It's going to be with or without clinic. With or without compliance… each product is independently sellable."
> — 2026-05-08

### 6. Persona collapse rule

> "I do not want eighteen variations of this. You don't have the bandwidth to develop this. So admin level, faculty level, student level. Give me three views."
> — 2026-05-08

### 7. AI-first thinking

> "AI is good at finding themes and grouping the information by themes. Just let AI do that work… You're still thinking that everything has to be tagged and grouped and organized. But, no, like, let it be dynamic."
> — 2026-05-08

### 8. One mechanism per concept

> "Something like labels which you see in Gmail. You could have nested labels."
> — 2026-05-07 (on tagging architecture — replaces "attributes vs direct mapping" confusion from curriculum-mapping product)

> "There is only one way to create links."
> — 2026-05-07

### 9. Architectural extensibility as license to defer

> "We're going to start with these six [question types]. In case we want to add more features within a question type or if you want to add more question types, it's not something which requires me to delete code and write it again."
> — 2026-05-06

### 10. Demote what users haven't validated

> "Workflow is something ExamSoft doesn't have. Vishakha wants us to build. We'll build it as a secondary feature."
> — 2026-05-07 (on pre-publication chair approval)

> "I don't want a lot of it to take up space until we really deploy that feature and we align with the users that, oh, this is very, very helpful."
> — 2026-05-07

## Anti-patterns Aarti rejects (across meetings)

| Anti-pattern | Why she rejects it | Source |
|---|---|---|
| QB-completeness as P0 gap analysis | "If you are not picking up those questions… it is as good as you've not created those questions." Assessment-level higher ROI. | 2026-05-07 |
| Two parallel mapping mechanisms (attributes + direct) | Created real user confusion in curriculum-mapping product. Don't repeat. | 2026-05-07 |
| Comprehensive tag taxonomy upfront | Show concrete designs first; let stakeholders rename. | 2026-05-06 |
| Building Phase-1 with the dream feature set | Architectural extensibility = license to defer. Match ExamSoft first. | Multiple |
| Faculty CRUD on master entities | "As a faculty, I cannot just randomly add a new course to my syllabus." | 2026-05-08 |
| Workflow approval as primary nav axis | "I don't want you to think that assessment workflow is the primary concern." | 2026-05-07 |
| Mandatory pre-publication approval | "If they want to administer it and it has not been approved, you let them administer it. But you say 'just so you know this is still pending approval.'" | 2026-05-07 |
| Live monitoring at question level | "While the exam is on, like, who cares?" | 2026-05-08 |
| Pre-tagged taxonomy on user-authored eval content | AI extracts themes dynamically. | 2026-05-08 |
| 8 persona variations | Bandwidth. Three view tiers. | 2026-05-08 |
| Custom mobile evaluation form | Use existing mobile arch. | 2026-05-08 |
| Cohort readiness in CFE | Wrong product — students aren't being assessed in CFE. | 2026-05-08 |
| Competency rating in CFE | Competencies are outcomes, not student-rated. | 2026-05-08 |
| Action plan tracking Phase 1 (CFE) | Phase 2/3 — doesn't help sell. | 2026-05-08 |
| AI claiming assessment completeness | AI doesn't know scope. | 2026-05-07 |
| Hard-coded role permissions | Defaults are okay; configurability is mandatory. | 2026-05-05 (PCE) — applies cross-product |
| Faculty deciding accommodations | Wrong authority — admin determination. | 2026-05-08 |

## Key directives Aarti has issued for Romit specifically

| Directive | Date |
|---|---|
| Read up on point-biserial; explain the calculation; send Aarti a Claude note when done | 2026-05-08 |
| Research ExamSoft download / lockdown / take-home patterns | 2026-05-08 |
| Find CAPTE 2C / SSR template (PT accreditation form 2D1–2D9) — ask Dale if needed | 2026-05-08 |
| Write a summary doc of all decisions discussed in 2026-05-08 audit | 2026-05-08 |
| Help design the Prism module-launcher landing page (separate workstream) | 2026-05-08 |
| Bring prototype reviews into Vishal's PM cadence | 2026-05-06 |
| Top 10 differentiators finalized by September; marketing page anchors product | 2026-05-06 |

## Strategic frames Aarti returns to

### "Class-vs-individual diagnostic" (teaching frame)

Class-wide low scores → fix the curriculum (column B in the loop).
Individual low scores → fix the student (column E with practice / 1:1).

This is a teaching frame Aarti invokes naturally; it should ladder into reporting design.

### "Compound benefit"

> "Customers using only one capability get value; customers using all capabilities get a compound benefit (the loop closes)."
> — 2026-05-07 (paraphrased from her three-question architecture explanation)

### "Foot in the door"

PCE / CFE is the foot-in-the-door into didactic course data. Exxat owns clinical data; CFE creates pull for LMS integration → opens didactic data ownership → adjacencies for Patient Log / Skills Checklist / Learning Contracts.

### "World-class product"

> "Aarti has that vision to make a world-class product. Is flexible in things such as discontinuing an existing product or rebuilding."
> — Vishal channeling Aarti, 2026-05-06

License to discontinue Fast (form-builder platform) if necessary.

## What Aarti is frustrated about

> "My blood boils when we're debating ancillary things without foundationally at least getting facts understood."
> — 2026-05-08

> "Course faculty evaluation is just a fucking simple-ass product that should have been designed in one month, but we are going to take three months to design."
> — 2026-05-08

The frustration pattern: visualization-first work that bypasses foundational architecture (assessment types, statuses, role/permission matrix, accommodations list, content/competency taxonomies).

## 2026-05-08 16:09 follow-up — Aarti refines (after morning audit)

Second meeting today. Net-new emphasis on Exam Mgmt + curriculum mapping:

| Refinement | Status |
|---|---|
| **Two question-mapping pathways** — via course objective (auto-inherits content area + competency) AND direct-to-standards (independent of curriculum) | NEW |
| **Comp Genie–style AI gap analysis** — compare assessments to published board blueprints (NAPLEX, NCLEX) WITHOUT customer curriculum data | NEW (Phase 1 differentiator) |
| **Collaborator pattern** — first-class concept (read-only / co-edit) on courses + assessments | NEW |
| **Faculty has 2 sub-roles at course level** — Course Coordinator (full) + Instructor (limited) | refines morning |
| **Course landing = assessments primary** — course details are secondary tabs, not the lead | confirmed |
| **Faculty profile shared component** between Exam Mgmt + CFE (single source of truth) | NEW |
| **Assessment types phased** — P1 quizzes/take-home/proctored; P2 lockdown; P3 monitored | refined |

### Curricular Assessment Loop — canonical 4-phase model

Aarti will own the one-pager:

1. **Must teach** — standards/blueprints declare what programs must teach (NAPLEX, NCLEX, etc.)
2. **Am teaching** — courses map objectives → standards/competencies/content areas
3. **Am assessing** — questions map to course objectives (auto-inherits chain) OR direct to standards
4. **Are learning** — assessment scores reflect student mastery; loop closes back to curriculum tweaks (class-wide failures) or individual support (single-student failures)

> "If I teach them and I don't assess them, I don't have evidence that students learn. If I don't teach them and I assess them, I'm being unfair to them." — 2026-05-08 16:09

### Anti-patterns about Romit's process (2026-05-08 16:09)

> "It is not [Romit's] position to start answering the question, what would a program director want to see? That's not expected."

> "There is no document that lists all of these things. And then I will get on a review call, and I will see eight versions of it, and I will lose it."

> "Just go fucking create these pages. Like, what are you waiting for?"

**Translation:** stop wearing personas, document base entities first, ship setup screens before dashboard polish.

---

## How Aarti's thinking has evolved (timeline)

| Date | Topic | Evolution |
|---|---|---|
| 2026-05-05 | PCE alignment | Established: program-level only, unify surveys+PCE, restrictive-but-configurable visibility |
| 2026-05-06 | AI question creation (1:1 with Romit) | Sketched copilot UX; floated confidence-based marking; deferred items 3-4 (PRISM coverage AI) |
| 2026-05-06 | Roadmap planning (with Vishal+Vishaka) | Locked Jan 20 launch; locked Sept 15 CFE target; LMS Canvas integration mandatory; ExamSoft parity sheet methodology |
| 2026-05-07 | AI question creation + Curricular Loop | Articulated the 4-stage loop; "labels" tagging metaphor; assessment-level gap analysis as P0 |
| 2026-05-07 | Assessment overview | Completion-status taxonomy as primary axis; "ongoing" replaces "live"; pop quiz Start/End workflow |
| 2026-05-08 | Live monitoring + accommodations + cross-product | Persona collapse to 3 tiers; cross-product entity universe; module sellability; AI-first thinking pattern; accommodations as shared module |

## Things Aarti hasn't said yet but I should anticipate

(Open questions to surface in next stakeholder meeting.)

- The exact AI quality bar for theme extraction in CFE (false-positive rate, citation requirements)
- Persona-level sequencing within the admin tier (PD-first vs Coordinator-first feature priority)
- Whether confidence-based marking student-side lands in Phase 1 or defers (pending Vishaka feedback)
- Pop quiz workflow integration — separate Lecture surface vs start-inline from Create Assessment

## Source provenance

All quotes verbatim from Granola transcripts (May 5–8 2026). Speaker attribution validated by audit subagents per meeting. Granola IDs in `apps/exam-management/docs/storytelling/vision.md` § Source provenance.
