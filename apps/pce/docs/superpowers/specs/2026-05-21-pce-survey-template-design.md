# PCE — Survey & Template Creation: Design Specification
**Date:** 2026-05-21  
**Author:** Romit Soley (Product Design II)  
**Status:** Draft — awaiting review  
**Scope:** Phase 1 — Template Creation + Distribute Survey (Traditional + AI-native shell)  
**Target freeze:** 2026-05-27  
**Eng handoff target:** 2026-06-01

---

## 0. Source References

### Granola Transcripts (raw, this spec)
| Date | Meeting | Key decisions captured |
|---|---|---|
| May 19 | Course eval + survey design — base entities, template workflow, ETAs | ETAs, subject list from Prism lookup, scalable template model, FAST decision |
| May 19 | PCE template — workflow, role-based access, distribution with Monil | Subject terminology, same-template-for-all logic, guest lecturer scope-out, distribution filters |
| May 14 | CE survey design — base entities + structure with Adi | Prism Base context, traditional-first, AI-overlay later |
| May 12 | CE PRD — design scope, FAST integration, AI workflows | FAST shell decision, AI-layer thinking, persona reduction to 3 |
| May 5  | PCE module planning + Aarti feedback | Scope boundary (program-level), GTM constraint (Prism data required), programmatic survey naming, subject access control |

### Mobbin Pattern References
| Pattern | Source app | Applied to |
|---|---|---|
| Left-nav step tracker (vertical, checkable) | Jira Bulk Ops, Deel, User Interviews | Distribute wizard navigation |
| Drag-to-add section builder | Fresha | Template section composition |
| Inline question builder (name + type + options) | Employment Hero, Posh | Per-section question editing |
| Three-panel editor (list · editor · preview) | Sprig, Typeform, HubSpot | Template detail editor |
| Bulk member selection with table + filters | Gusto Enroll, Deel Assign | Course selection in distribute step |
| Progress bar + centered section-per-screen | Udemy, Skillshare | Student survey experience |
| Card-per-response + flag toggle | — (designed from PRD spec) | Moderation flow |

### PRD
Monil Pokar — "PRD - Create template & Push Survey - PCE.docx" (May 21 version)  
Confirmed scope: Steps 1 (Template Creation) + Step 2 (Distribute Survey). Student response, moderation, and analytics are out of this spec's implementation scope but included here for journey completeness.

---

## 1. Product Context

### 1.1 Why We're Building This
Post-course evaluation is a non-discretionary accreditation requirement for every health professions program Exxat serves. Programs currently pay Explorance Blue, Watermark, or similar third-party tools — money leaving per-account revenue. This module captures that spend by building evaluation directly into Prism, with the advantage of connecting CE data to clinical competency data (something no competitor currently does).

The design goal is not to copy what exists. It is to eliminate the two biggest pain points users told us about:
1. **Admin burden**: manually building distribution lists course-by-course, chasing non-completions, compiling accreditation evidence by hand
2. **Low faculty engagement**: reports too buried to surface actionable improvement; faculty never see results

Every design decision in this spec must serve one of these pain points or the accreditation compliance requirement. If it does not, it should not be built in Phase 1.

### 1.2 Phase 1 Scope Boundary
```
IN SCOPE (this spec)
  ├── Template Creation (admin)
  ├── Distribute Survey — Traditional wizard (admin)
  ├── Distribute Survey — AI-native shell (design now; engineering later)
  └── Lifecycle states for all flows

OUT OF SCOPE
  ├── Student response experience (separate PRD + spec)
  ├── Moderation & Enable Results (separate)
  ├── Analytics / results (separate PRD)
  ├── Longitudinal insights
  ├── Guest lecturer evaluation
  └── Standalone (non-Prism) distribution — Phase 2
```

### 1.3 GTM Constraint
Phase 1 users must have **Term + Academic Year + Course Offering data in Prism** to distribute. Programs without this data cannot use CE distribution until Prism Base is built (Phase 2). This constraint must be surfaced clearly in the distribution flow — not as an error, but as a pre-flight check.

---

## 2. Personas

### 2.1 Admin (Primary Operator)
**Who:** Program director, associate dean, administrative coordinator, assessment chair — anyone with admin access to Prism.  
**Mental model:** Thinks in batches. "I need to send evaluations for all 12 courses this semester before the window closes." Does not want to configure course-by-course manually. Has done this in spreadsheets or Watermark for years.  
**Primary need:** Batch distribution with minimal per-course friction. Reusable templates. Automation wherever possible.  
**Primary fear:** Sending a survey to the wrong students, or students seeing who wrote what.  
**Moment that matters:** The 2-week rush at end of each semester to push evaluations before course data expires.

### 2.2 Faculty (Evaluated persona)
**Who:** Course instructor, course coordinator, lab instructor, DCE — anyone associated to a course offering.  
**Mental model:** Thinks of evaluation as either threatening or irrelevant. Becomes relevant only when results lead to something actionable.  
**Primary need:** See their own results clearly, understand how they compare, take action.  
**Primary fear:** Students will know who they are / bias from evaluations.  
**Moment that matters:** When results are released and they open their first report.

### 2.3 Student (Respondent)
**Who:** Enrolled in the course being evaluated. Completes the survey anonymously.  
**Mental model:** Thinks "this is mandatory" or "this takes 10 minutes." Will abandon if confusing.  
**Primary need:** Complete quickly, know their identity is protected.  
**Primary fear:** Faculty will know it was them.  
**Trust signal:** "Your response is anonymous. Your name will never be attached to your answers."

---

## 3. Full User Journey Map

### 3.1 Lifecycle Overview (all personas)

```
SEMESTER START
     │
     ▼
[ADMIN] Setup templates
  ─────────────────────
  Open: Templates → New Template
  Build: Name → Course type → Add subjects → Add questions
  Save as Draft → Review → Publish (Active)
     │
     │ Template is "Active" — ready to assign
     ▼
[ADMIN] Distribute survey
  ─────────────────────
  Traditional path:
    Surveys → Push Surveys → 5-step wizard
    Step 1: Properties (Term + AY + Program + Survey type)
    Step 2: Courses (load offerings, deselect exclusions)
    Step 3: Design (assign template per course, or bulk-assign)
    Step 4: Communication (email invite + reminders)
    Step 5: Report Access (admin view + instructor view + windows)
    → Push Surveys → Success state
     │
     │ Surveys created: status = Scheduled → flips to Live on open date
     ▼
[STUDENT] Receives email → Opens survey portal
  ─────────────────────
  Sees list of open surveys
  Opens survey → one section at a time
  Required questions block advance
  Can save as draft and return
  Submits → thank-you screen
  Survey becomes Submitted (anonymous; name never stored with response)
     │
     │ Survey window closes → status = Closed, Pending Review
     ▼
[ADMIN] Moderation
  ─────────────────
  Review & Moderation queue
  Open-text response cards → flag/unflag inappropriate
  Threshold check: warn if < 5 responses
  Click "Enable Results" → results available to faculty
     │
     ▼
[FACULTY] Views results
  ─────────────────────
  My Surveys → select released survey
  Sees: response rate, section averages, open-text themes
  Cannot see individual student identity
     │
     ▼
NEXT SEMESTER — admin reuses same templates
```

### 3.2 Key Invariants (design must never violate these)
| Invariant | Why |
|---|---|
| Student identity is never stored with response | Anonymity contract; trust anchor for completion rate |
| Faculty cannot see results until admin enables | Quality gate; prevents low-response distortion |
| Template is created once; subjects auto-suppress per course | Scalability; one template works for all courses |
| Subjects come from Prism course-level role lookup only | Data integrity; keeps subject list accurate |
| Likert scale configured globally (settings), not per question | Prevents incomparable data across terms |
| Distribution requires Term + AY + Course Offering in Prism | Phase 1 GTM constraint |

---

## 4. Flow 1 — Template Creation

### 4.1 What a Template Is

A template is a reusable evaluation form composed of one or more **sections**, each section attributed to a **subject** (who or what is being evaluated). A single template can serve all courses in a term — if a course does not have a given subject (e.g., no Teaching Assistant), that section is suppressed for students in that course.

```
Template
  ├── Name (internal, admin-facing)
  ├── Course type (optional): Didactic | Clinical | Any
  └── Sections (ordered, drag-to-reorder)
        ├── Section 1
        │     ├── Subject: "Course Content"  ← general, always visible
        │     └── Questions (Likert / Free text)
        ├── Section 2
        │     ├── Subject: "Course Instructor"  ← suppressed if no instructor on course
        │     └── Questions
        └── Section N
              ├── Subject: "Teaching Assistant"  ← suppressed if no TA on course
              └── Questions
```

**Why this model is scalable:** Admins build the template once, include all possible subjects, and the system handles per-course suppression. Watermark requires separate templates per course type. We do not.

**Why subject matters for analytics:** Subject attribution is the access-control key. When results are released, faculty only see sections attributed to their role. Program directors see all. This is designed in the data model from day 1, not retrofitted.

### 4.2 Entry Points

```
Templates list (empty state)
  → [ New Template ] button in page header

Templates list (has templates)
  → [ New Template ] button in page header
  → Row action menu → Duplicate (creates a copy in Draft)
```

### 4.3 Layout Architecture

Template creation is a **full-page editor** (not a sheet/modal). It needs vertical space for the section list and does not benefit from being overlaid on another page.

```
┌─────────────────────────────────────────────────────────────────────┐
│ [≡]  Templates / Untitled template                    [Draft] [Save] │
├───────────────────┬─────────────────────────────────────────────────┤
│                   │                                                   │
│  TEMPLATE INFO    │  SECTION EDITOR (active section)                 │
│  ─────────────    │  ─────────────────────────────────────────────── │
│  Name             │  Section: Course Content                         │
│  ┌─────────────┐  │  Subject: [Course Content ▾]                     │
│  │             │  │                                                   │
│  └─────────────┘  │  ┌───────────────────────────────────────────┐   │
│                   │  │  Q1  How clear was the course structure?  │   │
│  Course type      │  │      [Likert scale · 5 pts]    [⋮]        │   │
│  [Any ▾]          │  └───────────────────────────────────────────┘   │
│                   │  ┌───────────────────────────────────────────┐   │
│  ─────────────    │  │  Q2  Any additional comments?             │   │
│                   │  │      [Free text]                [⋮]        │   │
│  SECTIONS         │  └───────────────────────────────────────────┘   │
│  ─────────────    │                                                   │
│  ⋮ Course Content │  [ + Add question ]                               │
│    ● active       │                                                   │
│  ⋮ Instructor     │                                                   │
│  ⋮ Course Dir.    │  ─────────────────────────────────────────────── │
│                   │  STUDENT PREVIEW (collapsed by default)           │
│  [ + Add section ]│  [ ▶ Preview this section ]                       │
│                   │                                                   │
└───────────────────┴─────────────────────────────────────────────────┘
```

**Why this layout:**
- Left panel = document metaphor (sections = pages of the form). This matches Fresha, User Interviews, HubSpot — all use left panel for structure navigation.
- Clicking a section in the left panel loads it in the editor center. No scrolling through a long single-page form.
- Preview is collapsed by default — admins building templates care about structure, not appearance. Show preview on demand.
- Full-page avoids the sheet constraint (max-w-96 is too narrow for multi-column question editor).

### 4.4 Screen-by-Screen Journey

**Step A: Entry — New Template**
Admin clicks "New Template" from Templates list.

```
┌───────────────────────────────────────────────────────────────────┐
│  [≡]  Templates / New template                                    │
│                                          [Cancel]  [Save as draft]│
├───────────────────┬───────────────────────────────────────────────┤
│                   │                                               │
│  TEMPLATE INFO    │  ┌────────────────────────────────────────┐  │
│                   │  │                                        │  │
│  Name *           │  │                                        │  │
│  ┌─────────────┐  │  │      Add your first section            │  │
│  │             │  │  │                                        │  │
│  └─────────────┘  │  │   Sections are groups of questions     │  │
│                   │  │   for each entity being evaluated.     │  │
│  Course type      │  │   Start by adding Course Content.      │  │
│  [Any ▾]          │  │                                        │  │
│                   │  │         [ + Add first section ]        │  │
│  ─────────────    │  │                                        │  │
│                   │  └────────────────────────────────────────┘  │
│  SECTIONS         │                                               │
│  (empty)          │                                               │
│                   │                                               │
│  [ + Add section ]│                                               │
│                   │                                               │
└───────────────────┴───────────────────────────────────────────────┘
```

**Step B: Add first section — Subject picker sheet**
Admin clicks "+ Add first section" or "+ Add section".  
A **right-side sheet** opens. Width: 480px.

```
┌────────────────────────────────────────────────┐
│  Add section                              [✕]  │
├────────────────────────────────────────────────┤
│                                                │
│  Subject                                       │
│  What entity will this section evaluate?       │
│                                                │
│  ┌───────────────────────────────────────────┐ │
│  │ Search subjects...              [🔍]       │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  GENERAL                                       │
│  ┌───────────────────────────────────────────┐ │
│  │  ○  Course Content                        │ │
│  │     Evaluates the course itself, not a    │ │
│  │     specific person. Always visible.      │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  FROM YOUR PROGRAM                             │
│  ┌───────────────────────────────────────────┐ │
│  │  ○  Course Instructor (3 in Prism)        │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │  ○  Course Coordinator (1 in Prism)       │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │  ○  Teaching Assistant (0 in Prism)       │ │
│  │     No TAs assigned to any course yet.   │ │
│  │     Add this section anyway?             │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  Section title (optional, renames display)     │
│  ┌───────────────────────────────────────────┐ │
│  │ e.g. "Faculty Performance"                │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  [Cancel]                       [Add section] │
└────────────────────────────────────────────────┘
```

**Why the subject picker works this way:**
- Subject list comes from Prism's course-level role lookup — not hardcoded. "From your program" section updates dynamically.
- Showing "N in Prism" count teaches admins what exists without requiring them to navigate away.
- "0 in Prism" with "Add anyway?" respects Monil's decision: include the subject, it will auto-suppress if course has no TA. But warn them so it isn't confusing later.
- Section title field lets programs rename ("Faculty Performance" vs "Instructor Review") without changing the underlying subject.

**Step C: Section editor — Adding questions**
After adding a section, admin is taken to the section editor in the center panel.

```
┌───────────────────────────────────────────────────────────────────┐
│  Section: Course Content                                           │
│  Subject: Course Content · [General]                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ⋮  Q1                                               [ ⋮ ]  │ │
│  │                                                             │ │
│  │  Question text *                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │ How clearly were the course objectives communicated? │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  Answer type          Required                              │ │
│  │  [Likert scale ▾]     [✓ Required]                          │ │
│  │                                                             │ │
│  │  Preview: ① ② ③ ④ ⑤   (1 = Strongly disagree, 5 = ...)     │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ⋮  Q2                                               [ ⋮ ]  │ │
│  │                                                             │ │
│  │  Question text *                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │ Any other comments about the course content?        │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  Answer type          Required                              │ │
│  │  [Free text ▾]        [ Required]                           │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [ + Add question ]                                               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Why this question editor:**
- `⋮` (drag handle) on the left enables reorder via drag-and-drop. Matches Posh, Employment Hero.
- `[ ⋮ ]` on the right is the action menu (Duplicate, Delete, Move to section).
- Answer type: only two options in Phase 1 — **Likert scale** and **Free text**. The Likert scale visual preview shows the current pointer (configured in Settings). Admin sees exactly what students will see.
- Free text is always optional by default (accreditation research: required open-text depresses submission rates).
- No answer options UI, no branching logic, no image upload — YAGNI for Phase 1.

**Step D: Import from PDF (AI assist)**  
Admin clicks "Import from PDF" in the template info panel.

```
Import questions from PDF
─────────────────────────
Drag & drop or [Browse files]

Supports: PDF, Word (.docx)
Max size: 10MB

[Cancel]   [Upload and parse]
```

After upload, system proposes sections + questions mapped to subjects:

```
AI found 3 sections in your document

  ✓ Course Content    4 questions  → [Review]
  ✓ Instructor        6 questions  → [Review]
  ? Lab Instructor    2 questions  → Subject not found in Prism
                                     [Map manually ▾]

[Use all found]   [Review individually]
```

**Why:** Admin shouldn't re-type 40 questions by hand. This is the single highest-friction moment in template creation. Identified in May 12 transcript ("upload a word document or PDF, and it gets auto populated").

**Step E: Save and publish states**

The template can exist in three states:

| State | Label | Who can use |
|---|---|---|
| Draft | `Draft` badge | No one — cannot be assigned to surveys |
| Active | `Active` badge | Can be assigned to distribute surveys |
| Archived | `Archived` badge | Hidden from selection; not deleted |

Actions from the editor header:
- **Save as draft** — anytime, no validation required
- **Publish** — validates required fields, transitions to Active
- Draft auto-saves on navigation away (with a "Saving…" indicator)

Publish validation:
1. Template name must not be blank
2. Template name must not conflict with existing active templates
3. At least one section with at least one question

### 4.5 State Inventory — Template Editor

| State | Trigger | Visual |
|---|---|---|
| **Empty** | No sections added yet | Center panel shows empty state illustration + "Add your first section" |
| **Has name, no sections** | Name filled, no sections | "Publish" remains disabled; "Save as draft" enabled |
| **Section selected** | Click section in left panel | Center panel loads section editor |
| **Question being edited** | Click question card | Card expands inline; other cards collapse |
| **Drag in progress** | Drag handle held | Card lifts with shadow, drop zone appears between others |
| **Name conflict** | Publish clicked, name exists | Inline error below name field: "A template with this name already exists." |
| **No sections on publish** | Publish clicked, 0 sections | LocalBanner error: "Add at least one section before publishing." |
| **Saving** | Auto-save triggered | "Saving…" ghost text in header next to status badge |
| **Saved** | Auto-save complete | "Saved" with checkmark, fades after 2s |
| **Publish success** | Publish confirmed | Badge flips to `Active`; LocalBanner success: "Template published. It can now be assigned to surveys." |
| **Used by surveys warning** | Delete attempted on Active template used by ≥1 survey | Dialog: "This template is used by N surveys. Archiving it will not affect those surveys, but it cannot be assigned to new ones." Actions: Cancel / Archive |

### 4.6 Interactions — Template Editor

| Interaction | Behavior |
|---|---|
| Click "+ Add section" | Opens subject picker sheet from right |
| Click section in left panel | Loads section editor in center; preserves unsaved question text |
| Drag section handle | Reorders sections; section list in left panel updates live |
| Click "+ Add question" | Appends new blank question card, auto-focuses question text field |
| Drag question handle | Reorders questions within section |
| Click question action menu `⋮` | Shows: Duplicate / Move to section / Delete |
| Change answer type | Likert: shows scale preview. Free text: shows text area preview. Immediate visual feedback. |
| Click "Preview this section" | Expands preview panel on the right showing student-facing render |
| Click "Import from PDF" | Opens upload sheet |
| Click "Publish" | Runs validation → if errors, shows inline errors → if clean, transitions to Active |
| Click "Duplicate template" (from list) | Creates copy with "Copy of [Name]" in Draft status |

---

## 5. Flow 2 — Distribute Survey

### 5.1 What Distribution Is
Distribution is the act of creating one survey configuration per course offering, assigning a template, setting the respondent window, configuring email communications, and defining who can view results. A single "push" can cover an entire semester's courses (12–30 courses) in one operation.

**Why the wizard pattern:**  
Watermark uses 7 steps. Our PRD targets 5. Each step represents a distinct mental context-switch for the admin — scope first, then configure, then push. Mixing these creates errors (wrong template assigned, wrong date set, wrong access). The wizard enforces the right mental order.

### 5.2 Entry Points

```
Surveys home page → [ Push surveys ] primary button in header

Surveys home page → Empty state → [ Push surveys ] CTA

Run Evaluation (AI-native) → falls back to traditional wizard if Leo detects a condition it can't handle
```

### 5.3 Layout Architecture — Wizard

The wizard uses a **left-nav step tracker + right main area** pattern, not a modal. It is full-page with the sidebar collapsed.

```
┌──────────────────────────────────────────────────────────────────┐
│ [≡]  Surveys / Push surveys                                      │
├────────────────────┬─────────────────────────────────────────────┤
│                    │                                             │
│  STEPS             │  STEP CONTENT                              │
│  ──────────────    │  ──────────────────────────────────────    │
│                    │                                             │
│  ✓ 1  Properties   │  (step-specific content)                   │
│  ● 2  Courses      │                                             │
│    3  Design       │                                             │
│    4  Communicate  │                                             │
│    5  Access       │                                             │
│                    │                                             │
│                    │                                             │
│                    │  ─────────────────────────────────────────  │
│                    │  [← Back]                       [Continue →]│
│                    │                                             │
└────────────────────┴─────────────────────────────────────────────┘
```

**Why left-nav over top stepper:**
- Top steppers truncate on long step names. Left-nav gives full label + check state.
- Jira Bulk Ops (left nav, 4 steps) and User Interviews (left nav, 6 steps) both use this pattern for multi-step configuration flows of this complexity.
- Completed steps show a ✓ and can be clicked to go back and edit — non-linear return to any completed step.

### 5.4 Step 1 — Properties

**Purpose:** Define the scope of this evaluation cycle. Everything downstream depends on this.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Step 1 of 5: Properties                                         │
│                                                                  │
│  Define the scope of this survey cycle. All courses and          │
│  students in the next step are filtered by these selections.     │
│                                                                  │
│  Survey type *                                                   │
│  ┌──────────────────────────────────────┐                        │
│  │  ● Course Evaluation                 │                        │
│  │    Evaluates faculty and course      │                        │
│  │    content. Anonymous. Accreditation │                        │
│  │    compliant.                        │                        │
│  │                                      │                        │
│  │  ○ Programmatic Survey               │                        │
│  │    Annual or recurring institutional │                        │
│  │    surveys (alumni, preceptor, etc.) │                        │
│  └──────────────────────────────────────┘                        │
│                                                                  │
│  Term *                    Academic year *                        │
│  [Spring ▾]                [2025–2026 ▾]                         │
│                                                                  │
│  Program *                                                       │
│  [Doctor of Physical Therapy ▾]                                  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                   [Continue →]   │
└──────────────────────────────────────────────────────────────────┘
```

**States:**
- All three dropdowns unpopulated → Continue disabled
- All three populated → Continue enabled
- Program selected but has no course offerings for that term/AY → inline amber warning: "No course offerings found for Spring 2026 in this program. Verify your base data in Setup → Courses."

**Why survey type is step 1, not a later concern:**  
Survey type determines which courses are loaded (CE = courses with enrolled students + faculty), which template types are shown (CE = templates with CE subjects), and the anonymity model. It cannot be changed after step 1 without resetting the wizard.

### 5.5 Step 2 — Courses

**Purpose:** Select which course offerings to include in this batch. Default: all included.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Step 2 of 5: Courses                                            │
│                                                                  │
│  Spring 2026 · 2025–2026 · Doctor of Physical Therapy            │
│  14 course offerings found. All included by default.             │
│                                                                  │
│  [Deselect all]                [🔍 Search courses]               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ☑  DPT 501  Anatomy & Physiology I                       │   │
│  │    Dr. Sarah Chen · 42 enrolled · Didactic               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ☑  DPT 502  Clinical Kinesiology                         │   │
│  │    Dr. James Park · 38 enrolled · Didactic               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ☑  DPT 601  Clinical Practicum I                         │   │
│  │    Dr. Maria Torres · 22 enrolled · Clinical             │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ☑  DPT 602  Neurological Rehabilitation                   │   │
│  │    Unassigned faculty  ⚠  · 30 enrolled · Didactic       │   │
│  │    ─────────────────────────────────────────────────     │   │
│  │    No primary instructor assigned. Students will          │   │
│  │    not see an Instructor section in the survey.           │   │
│  │    [Continue anyway] [Edit faculty in Setup]              │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ...                                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  12 of 14 selected                                               │
│                                                                  │
│  [← Back]                                          [Continue →]  │
└──────────────────────────────────────────────────────────────────┘
```

**States:**
| State | Display |
|---|---|
| Default | All courses checked |
| Unassigned faculty | Amber inline warning below course row; Continue not blocked (auto-suppress handles it) |
| 0 enrolled | Red inline warning: "No students enrolled. This course will not receive a survey." Row auto-deselected. |
| 0 courses selected | Continue disabled; LocalBanner: "Select at least one course to continue." |
| Search active | Filters rows live; "N of M courses match" shown |

**Why all-included default:**  
Matches Monil's PRD direction. Admin's job is to deselect exclusions, not build inclusion lists. Reduces clicks by ~80% for the common case (include all).

**Why show Unassigned faculty warning inline:**  
This is a teachable moment — the admin may not know DPT 602 has no instructor assigned. Surfacing it here lets them fix it in Setup without abandoning the wizard. They can continue; the Instructor section auto-suppresses for that course.

### 5.6 Step 3 — Design (Template Assignment)

**Purpose:** Assign a template to each course. If the template's course type matches the course, auto-assign.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Step 3 of 5: Survey design                                      │
│                                                                  │
│  Assign a template to each course. Courses of the same type      │
│  can share a template.                                           │
│                                                                  │
│  [Bulk assign: Didactic courses →  [CE Didactic Template ▾] ]    │
│  [Bulk assign: Clinical courses →  [CE Clinical Template ▾] ]    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  DPT 501  Anatomy & Physiology I  [Didactic]             │   │
│  │  Template: [CE Didactic Template ▾]  ✓ Auto-assigned     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  DPT 502  Clinical Kinesiology      [Didactic]           │   │
│  │  Template: [CE Didactic Template ▾]  ✓ Auto-assigned     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  DPT 601  Clinical Practicum I      [Clinical]           │   │
│  │  Template: [CE Clinical Template ▾]  ✓ Auto-assigned     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  DPT 503  Health Policy             [Didactic]           │   │
│  │  Template: [Select template ▾]       ⚠ Not assigned      │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  10/12 templates assigned                                        │
│                                                                  │
│  [← Back]                                          [Continue →]  │
│                               (disabled until all assigned)      │
└──────────────────────────────────────────────────────────────────┘
```

**Auto-assignment logic:**
- If course type = Didactic AND exactly one Didactic template exists → auto-assign, show "✓ Auto-assigned"
- If course type = Clinical AND exactly one Clinical template exists → auto-assign
- If course type = Any OR multiple templates of that type exist → show "Select template ▾" unselected

**States:**
| State | Display |
|---|---|
| All assigned | Continue enabled |
| Any unassigned | Continue disabled; count "X/N templates assigned" |
| Only one template exists (any type) | All courses auto-assigned to it |
| Template selected → preview | Click template name → drawer from right shows template sections/questions read-only |

**Why Continue is locked until all assigned:**  
A survey pushed without a template has no questions — it would be empty for students. This is a correctness gate, not a preference.

### 5.7 Step 4 — Communication

**Purpose:** Configure the student-facing email for survey invitation and optional reminders.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Step 4 of 5: Communication                                      │
│                                                                  │
│  SURVEY WINDOW                                                   │
│  ─────────────────────────────────────────────────────────────  │
│  Applies to all selected courses. Individual overrides available │
│  in the course list below.                                       │
│                                                                  │
│  Opens on *            Closes on *                               │
│  [May 26, 2026 ▾]      [Jun 9, 2026 ▾]                          │
│                                                                  │
│  ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ──    │
│                                                                  │
│  INVITATION EMAIL                                                │
│  ─────────────────────────────────────────────────────────────  │
│  Sent to students on the survey open date.                       │
│                                                                  │
│  Subject line                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Your course evaluation for {{course_name}} is now open   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Body (plain text, {{variables}} supported)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Hi {{student_first_name}},                               │   │
│  │                                                          │   │
│  │ Your evaluation for {{course_name}} is open until        │   │
│  │ {{close_date}}. Your responses are anonymous.            │   │
│  │                                                          │   │
│  │ [Take survey →]                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  REMINDER EMAIL  [ Enable reminder ]                             │
│  ─────────────────────────────────────────────────────────────  │
│  (collapsed until enabled)                                       │
│  When: [ 3 days before close ▾ ]                                 │
│  To: Non-respondents only                                        │
│                                                                  │
│  [← Back]                                          [Continue →]  │
└──────────────────────────────────────────────────────────────────┘
```

**States:**
| State | Display |
|---|---|
| Open date in the past | Amber inline warning: "Open date is in the past. The survey will be immediately Live." |
| Close date before open date | Inline error: "Close date must be after open date." Continue disabled. |
| Reminder enabled | Reminder email section expands with fields |
| Variables hover | Tooltip showing the variable's resolved value, e.g. `{{course_name}}` → "Anatomy & Physiology I" |

**Why defaults matter:**  
Most admins don't want to write email copy from scratch. The default copy surfaces anonymity explicitly ("Your responses are anonymous.") — this is the #1 trust signal for student response rates.

### 5.8 Step 5 — Access (Report Access)

**Purpose:** Define who can view results and for how long, once the admin enables them.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Step 5 of 5: Report access                                      │
│                                                                  │
│  Define who can view results after you enable them.              │
│                                                                  │
│  ADMIN ACCESS                                                    │
│  ─────────────────────────────────────────────────────────────  │
│  You (and other admins) always have full access.                 │
│                                                                  │
│  INSTRUCTOR ACCESS                                               │
│  ─────────────────────────────────────────────────────────────  │
│  Allow instructors to view their section results?                │
│                                                                  │
│  ● Yes — instructors can see results for their sections          │
│  ○ No  — only admins can view results                            │
│                                                                  │
│  Access window (optional)                                        │
│  From: [Enable date (automatic) ▾]                              │
│  Until: [No end date ▾]                                          │
│                                                                  │
│  COURSE COORDINATOR ACCESS                                       │
│  ─────────────────────────────────────────────────────────────  │
│  Allow course coordinators to view their section results?        │
│                                                                  │
│  ● Yes — coordinators can see results for their sections         │
│  ○ No                                                            │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  12 courses · 486 students · Spring 2026                 │   │
│  │  Opens May 26 → Closes Jun 9                             │   │
│  │  Templates: CE Didactic (10 courses), CE Clinical (2)    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [← Back]                             [Push surveys →]          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Why this step exists (not auto-configured):**  
Vishaka confirmed in the May 5 transcript: "We shouldn't make the rules. Give them configurable defaults." Some programs want instructors to see results immediately; others want to review first. Some programs have access windows for CAPTE audit reasons. The default (instructors can see, no end date) is the permissive starting point that admins can tighten.

### 5.9 Success State

After clicking "Push surveys":

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                        ✓                                         │
│                                                                  │
│              12 surveys pushed for Spring 2026                   │
│                                                                  │
│  DPT501  DPT502  DPT601  DPT602  DPT503  DPT511                  │
│  DPT512  DPT513  DPT601  DPT701  DPT702  DPT801                  │
│                                                                  │
│  Surveys open on May 26. Students will receive an invitation     │
│  email on that date.                                             │
│                                                                  │
│       [View surveys]           [Push another]                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Why course code pills:**  
Visual confirmation that the right courses were included. Scannable in 3 seconds. Matches the PRD spec for success state.

---

## 6. Flow 3 — AI-Native "Run Evaluation" (Design Now, Build Later)

### 6.1 What It Is
An intelligent alternative entry to distribution that reduces the 5-step wizard to 3 clicks for experienced admins. Leo (the AI agent) scans the program, flags issues, proposes the survey window, and builds the course list automatically. The traditional wizard remains available as the fallback and for first-time users.

**Trigger:** Seasonal — Leo surfaces a banner when term-end data is within 30 days. Not always visible.

### 6.2 Entry Point — Surveys Home Banner

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │  ● Spring 2026 evaluation cycle is ready to launch           │ │
│ │    14 courses found · all with enrolled students             │ │
│ │                                  [Run evaluation →]          │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Run Evaluation Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  [≡]  Surveys / Run Evaluation                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Spring ▾]  [2025–2026 ▾]  [Doctor of Physical Therapy ▾]      │
│                                                                  │
│  [  Run Audit  ]                                                 │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ◉ ·  Leo                                                  │ │
│  │                                                            │ │
│  │  Scanning Spring 2026 courses for Doctor of Physical       │ │
│  │  Therapy...                                                │ │
│  │                                                            │ │
│  │  Found 14 courses: 11 Didactic, 3 Clinical.                │ │
│  │                                                            │ │
│  │  All courses have enrolled students.                       │ │
│  │                                                            │ │
│  │  1 course has no faculty assigned: DPT 602.               │ │
│  │  The Instructor section will be suppressed for             │ │
│  │  students in that course.                                  │ │
│  │                                                            │ │
│  │  Term dates: Spring 2026 ends May 30, 2026.               │ │
│  │                                                            │ │
│  │  Suggested survey window:                                  │ │
│  │  Opens May 23 (7 days before term end)                     │ │
│  │  Closes Jun 13 (14 days after term end)                    │ │
│  │                                                            │ │
│  │  [ Looks right ✓ ]    [ Edit dates ]                       │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  COURSES (14)                                                    │
│  ┌──────────────────────────────────────────┬──────────┐        │
│  │  DPT 501  Anatomy & Physiology I          │ ● Ready  │        │
│  │  Dr. Sarah Chen · 42 students · Didactic │          │        │
│  ├──────────────────────────────────────────┼──────────┤        │
│  │  DPT 602  Neurological Rehab              │ ⚠ Fix → │        │
│  │  Unassigned · 30 students · Didactic     │          │        │
│  ├──────────────────────────────────────────┼──────────┤        │
│  │  ...                                      │          │        │
│  └──────────────────────────────────────────┴──────────┘        │
│                                                                  │
│  [  Push Surveys  ]  ← locked until all conditions met          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 States — AI-Native Flow

| State | Description | Visual |
|---|---|---|
| Pre-audit | Config chips shown, no scan yet | "Run Audit" button active; course list empty |
| Scanning | Leo panel shows animated typing cursor after each message | Pulsing orb indicator |
| Missing term dates | Term dates not in Prism | Leo shows amber inline card with start/end date fields |
| Window proposed | Leo shows suggested open/close | "Looks right ✓" + "Edit dates" CTA |
| Fix → open | Admin clicks Fix → on a course | Right drawer slides in: Faculty tab · Students tab · Template tab |
| All ready | All courses = Ready, window confirmed | "Push Surveys" button activates (transitions from ghost to solid) |
| Success | Push complete | Same animated checkmark + pills success state as traditional wizard |

### 6.5 Fix → Drawer

```
┌───────────────────────────────────────────────────────┐
│  DPT 602 — Neurological Rehabilitation         [✕]    │
│  Fix before pushing                                    │
├──────────────────┬──────────────────┬─────────────────┤
│  Faculty         │  Students        │  Template       │
├──────────────────┴──────────────────┴─────────────────┤
│                                                        │
│  No faculty assigned to this course offering.          │
│                                                        │
│  Without a faculty assignment, students will not       │
│  see the Instructor section in their survey.           │
│                                                        │
│  You can continue without a faculty assignment.        │
│                                                        │
│  [Mark as resolved]                                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

"Mark as resolved" changes the course badge from ⚠ Fix → to ● Ready (acknowledged, not fixed).

---

## 7. Scalability Principles

### 7.1 Template Architecture Scales Because

- **One template, many courses.** Subjects auto-suppress based on course-level role data. Programs with 30 courses and 3 subject types need 1–2 templates, not 30.
- **Subject list is dynamic.** New roles added in Prism automatically appear in the template subject picker. No schema migration in the PCE design layer.
- **Course type is optional.** Programs that want one universal template can have it. Programs that want Didactic/Clinical splits can have that. No forced pattern.
- **Answer types are centrally configured.** Likert pointer set in Settings propagates to all new templates. Existing live surveys are unaffected.

### 7.2 Distribution Scales Because

- **Batch-first model.** All courses selected by default; admin deselects exclusions. An admin with 14 courses needs 0 clicks to scope the batch (vs. Watermark's course-by-course selection).
- **Auto-assignment by course type.** Correct template assignment for 95% of courses requires 0 clicks from the admin.
- **Per-course overrides always available.** The drawer (Fix → or row action) allows individual override without breaking the batch.
- **Survey window is bulk-set with per-course override.** One date set for all; any course can have its own window if needed.

### 7.3 Subject Access Control Scales Because

- **Subjects are the access control key at analytics time.** Adding a new subject (Teaching Assistant) in a future term automatically gates analytics access for that role without any additional access control configuration.
- **Defaults lean permissive; programs can tighten.** This avoids the "we can't see our results" ticket more than the "faculty saw something they shouldn't" ticket.

---

## 8. Open Questions (Unresolved as of 2026-05-21)

| # | Question | Owner | Impacts |
|---|---|---|---|
| OQ-1 | Better word than "Subject" for what is being evaluated? Monil flagged this in May 19 call. | Monil + David | All admin-facing labels in template creation + distribution |
| OQ-2 | How does the subject list update when a new role is added in Prism? Real-time or on next login? | Engineering (Sankalp) | Template builder subject picker |
| OQ-3 | What happens to live surveys if an admin changes the Likert pointer in Settings mid-term? | Monil (PRD) | Settings page design; surveyed: "existing live surveys keep current pointer" confirmed verbally but not in PRD |
| OQ-4 | Communication step — does the invitation email use Exxat's notification infrastructure or a standalone mailer? | Engineering | Communication step field scope (can we support {{variables}}?) |
| OQ-5 | Report Access — when Vishaka says "access windows" should there be a hard expiry (portal access blocked after date) or soft expiry (content hidden but link still works)? | Vishaka | Access step UX + analytics permissions model |
| OQ-6 | AI-native "Run Evaluation" — what data does Leo actually have access to? Term dates from Prism base? Faculty assignments from FAAS? | Engineering (Arun/Darshan) | Whether AI-native can be built in Phase 1 or is truly Phase 2 |

---

## 9. What This Spec Does Not Cover

These are in scope for Phase 1 product but get their own design spec:

- **Student survey response experience** (section-by-section, draft mode, submission, thank-you)
- **Moderation & Enable Results** (open-text response cards, flag/unflag, threshold warning)
- **Faculty results view** (per-section scores, response rate, open-text themes)
- **Analytics / longitudinal insights**
- **Settings page** (Likert pointer, program defaults)
- **Programmatic Survey** flow (shares architecture with CE but different scope/distribution model)

---

*End of spec v1.0 — 2026-05-21*
