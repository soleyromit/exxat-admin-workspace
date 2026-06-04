# Assessment Creation — Redesigned UX
**Exam Management | Admin**
Last updated: 2026-06-04

---

## Problem

The current creation flow asks too much, too early, in too many places.

1. **Two creation surfaces exist and overlap.** The `CreateAssessmentModal` (3-step dialog) and the `CreateCanvasClient` (AI-prompt full page) are both in the codebase. Faculty can reach either one depending on how they navigate. This is confusing.

2. **The 3-step creation modal front-loads decisions that cannot be made yet.** Step 2 asks for duration and question count before any questions exist. "Hold for review" is asked in Step 2 before the faculty has even seen the builder. These decisions belong later.

3. **Each step has too many responsibilities.** Step 2 of the modal owns: mode selection, duration, question target, and results publication policy — four unrelated decisions jammed together.

4. **The builder steps are not focused.** The current `Step 2` owns question sourcing, health metrics, section management, and grading settings simultaneously. The current `Step 3` owns delivery config, review workflow, and publish — some of which need to be set before question work (dates), some only after (security).

**Result:** Faculty feel the flow is complicated before they've added a single question.

---

## Design Principles

1. **One responsibility per step.** Each screen or tab should be describable in one sentence.
2. **Ask for information only when it is actionable.** Don't ask for duration before questions exist. Don't ask for security mode before dates are set.
3. **Minimum viable creation: 2 fields.** Name + type. Everything else comes later in the builder.
4. **Progressive disclosure over front-loading.** Advanced config lives behind expand/settings, not in the primary path.
5. **The builder is a workspace, not a wizard.** Tabs let faculty jump between Structure, Questions, and Deliver without a forced linear gate — except for publishing, which requires the prior steps to be sufficiently complete.

---

## Design Language

This section is the source of truth for how every screen in the assessment creation flow should behave. When a new component is designed, check each rule before writing a line of JSX.

### Screen-level rules

**One primary action per screen.** Every tab and every panel has exactly one thing it is trying to help the faculty do. If you can't say that thing in one verb phrase, the screen is doing too much.

| Tab | Primary action |
|---|---|
| Create modal | Name it and type it |
| Structure | Define sections |
| Questions | Add questions to sections |
| Deliver | Set when and how students take it |

**Primary action is always visible.** The one thing a screen does — its `+` button, its `Generate` button, its `Publish` button — must be visible without scrolling. It is never inside an accordion or hidden in a menu.

**Secondary and advanced options collapse.** Everything that is not the primary action starts collapsed. Faculty expand it when they need it. Optional metadata, advanced security settings, review window config — all collapsed by default.

---

### Row rules

**Rows are flat, never cards.** A list of sections, a list of questions — both use `border-b` rows on a transparent background. No rounded border, no shadow, no card background per row.

```
✅  │  1.  A 35-year-old patient presents with…   MCQ  4pts  Medium   ···  │
    ├───────────────────────────────────────────────────────────────────────┤

❌  ┌───────────────────────────────────────────────────────────────────────┐
    │  1.  A 35-year-old patient presents with…   MCQ  4pts  Medium   ···  │
    └───────────────────────────────────────────────────────────────────────┘
```

**Actions are hover-reveal, maximum 3.** Row actions are invisible until the row is hovered or focused. There are never more than 3 inline actions on a row. If a feature needs more than 3, one becomes a `···` overflow menu.

```
Default:   │  Section A: Cardiovascular Pharm  ·  12 Q          │
Hover:     │  Section A: Cardiovascular Pharm  ·  12 Q   ✏ ↕ ⋯  │
```

**Metadata lives right of the stem, never below it.** Type chip, points, difficulty, Bloom's — all on the same line as the truncated stem. If the row gets too wide, metadata is the first thing to hide (not the stem).

**Status is a chip, never a sentence.** A section that is ready shows a `Ready` badge. Not "This section has been marked as ready by Dr. Patel."

---

### Interaction rules

**Context-triggered UI, not always-visible forms.** Instructions editor, preread text, section settings — these appear only when the section is active/selected. When the section is inactive, these fields are hidden. No "empty" textareas sitting in every row all the time.

```
Section A (inactive):  │ Section A  ·  12 Q          [Add questions] │
Section A (active):    │ Section A  ·  12 Q          [Adding here ✓] │
                       │ ┌─ Instructions ─────────────────────────┐  │
                       │ │  [Section instructions text…]           │  │
                       │ └────────────────────────────────────────┘  │
```

**Add actions are inline, never modal.** Adding a section: inline form appears at the top of the list. Adding a question: inline editor appears below the question list for the active section. A modal is only used for actions that are irreversible or that require multi-step configuration (example: "Send for Review" dialog with reviewer selection).

**Expand/collapse is one click on the row header.** Clicking a section header toggles its questions visible/hidden. No separate chevron button needed — the whole header row is the toggle target.

---

### Content density rules

**Stems are truncated at 2 lines.** Question stems never wrap to 3+ lines in the list view. Full stem is visible in the editor or detail sheet.

**Maximum 4 metadata chips per row.** Type · Points · Difficulty · one flag (if present). Bloom's and PBI are visible in the detail sheet, not the list row.

**Section header carries 2 pieces of information.** Section name + question count. Instructor name, status, and preread indicators appear on hover or as small icon chips — not as always-visible text.

---

### What we explicitly do not do

| Pattern | Why it's banned |
|---|---|
| Multi-column form layouts in panels | Cognitive split — one field at a time reads faster |
| Stacked card grids for question sourcing options | Use a flat action list or button row instead |
| Inline tooltips on every row to explain metadata | Labels are self-evident; tooltips are for edge cases only |
| Modals for adding a section or question | Inline forms keep context; modals break flow |
| Empty state + form on the same screen | Show one or the other — not "no sections yet" text above an always-visible add form |
| `uppercase tracking-wide` section labels | Already banned workspace-wide; listed here to reinforce |
| Color as the only status signal | Always pair color with a text chip or icon |
| More than one primary CTA visible at once | One button is the obvious next step; two creates choice anxiety |

---

## New Flow Overview

```
Course page
  └─ "+ New Assessment" button
        │
        ▼
┌─────────────────────────────────┐
│  Create Modal (single screen)   │  ← 2 required fields max
│                                 │
│  [Exam]    [Quiz]               │  ← type toggle
│                                 │
│  Name: _________________________│  ← auto-focused
│                                 │
│  Course: AUTO-POPULATED         │  ← locked if entered from course page
│                                 │
│          [Create Draft →]       │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Assessment Builder                                          │
│                                                             │
│  [← Cardiology Exam] [Structure] [Questions] [Deliver]      │
│   breadcrumb          tab 1       tab 2       tab 3         │
│                                                             │
│  Step content (see below)                                   │
│                                                             │
│  Health bar (always visible in header):                     │
│  0 sections · 0 questions · 0 pts · — est. time             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 0: Create Modal

**Purpose:** Give the draft a name and type. Nothing else.

**Fields (required):**
- **Type toggle** — two large selectable cards: `Exam` (high-stakes, proctored) / `Quiz` (low-stakes, open)
  - Choosing Exam/Quiz pre-sets defaults (security mode, results timing) — faculty can override in Deliver tab
  - This is the ONLY decision that meaningfully changes the builder experience
- **Name** — free text, auto-focused on modal open

**Fields (contextual):**
- **Course** — auto-populated (locked) if modal was opened from a course page. Shown as a read-only chip. If accessed from the global "+ New" (not from course), a required Select appears.

**Fields removed from current modal (moved to builder):**
| Field | Where it goes now |
|---|---|
| Description | Structure tab — optional metadata |
| Quick start (blank/copy/template) | Structure tab — "Start from" section |
| Mode (proctored/self-paced) | Deliver tab — Security section |
| Duration | Deliver tab — Time section |
| Question target | Structure tab — Blueprint section (optional target, not required) |
| Hold for review | Deliver tab — Review & Publish section |
| Schedule (open/close dates) | Deliver tab — Availability section |

**Behavior:**
- "Create Draft" → creates draft with `status: draft` → routes to builder at Tab 1 (Structure)
- If course is missing and none selected: inline validation, no dialog dismiss
- Name is the only hard-gate — can be changed later in the builder header

```
┌─────────────────────────────────────────────────────┐
│  New assessment                              [✕]     │
│─────────────────────────────────────────────────────│
│                                                     │
│  What are you creating?                             │
│                                                     │
│  ┌───────────────────┐  ┌───────────────────┐      │
│  │  📋 Exam          │  │  ⚡ Quiz           │      │
│  │  High-stakes      │  │  Low-stakes        │      │
│  │  Proctored        │  │  Self-paced        │      │
│  │  Review required  │  │  Publish directly  │      │
│  └───────────────────┘  └───────────────────┘      │
│                                                     │
│  Name *                                             │
│  ┌─────────────────────────────────────────────┐   │
│  │  e.g. IM Midterm 2026                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Course                                             │
│  [NURS 4210 · Advanced Practice Nursing]  [locked] │
│                                                     │
│              [Cancel]  [Create draft →]             │
└─────────────────────────────────────────────────────┘
```

---

## Tab 1: Structure

**Purpose:** Define the skeleton of the assessment before any questions are added.

**Owns:**
- Blueprint source (how the assessment is populated)
- Section definition (name, order, optional description)
- Section delegation (which instructor owns which section)
- Optional: topic weightage, description, collaborators

**Does NOT own:** Individual questions. Delivery settings. Dates. Security.

### 1a — Blueprint (top of tab, collapsed after first save)

```
┌─ Start from ────────────────────────────────────────────┐
│  ○ Blank  ●  Copy past assessment  ○ Upload PDF/DOC     │
│                                                         │
│  ┌─ Copy from ─────────────────────────────────────┐   │
│  │  IM Midterm 2025  ·  45 Q  ·  90 min            │   │
│  │  [Change]                                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  What gets copied: section names, Q-type distribution,  │
│  difficulty targets. Questions become placeholders.      │
└─────────────────────────────────────────────────────────┘
```

### 1b — Sections

```
┌─ Sections ──────────────────────────────────────────────┐
│                                                         │
│  ≡  Section A: Cardiovascular Pharmacology       [···] │
│     Instructor: Dr. Patel   ·  0 questions              │
│                                                         │
│  ≡  Section B: Renal Pathophysiology             [···] │
│     Unassigned              ·  0 questions              │
│                                                         │
│  [+ Add section]                                        │
└─────────────────────────────────────────────────────────┘
```

- Drag handle (≡) for reordering — V0
- [···] row action menu: Rename, Assign instructor, Add instructions, Delete
- "Assign instructor" opens a people-picker → sends notification to instructor
- **"Add instructions"** opens an inline text editor for section-level instructions. These are shown to the student as a full-screen interstitial before section questions appear (taker renders `ExamSection.instructions`). V0 required — currently has no admin authoring UI.
- Section status chips appear once questions are added: `Not started` / `In progress` / `Ready`

> **⚠ Taker gap — section instructions:** The assessment-taker data model has `ExamSection.instructions` and renders it before the section begins. Admin creation has no UI to author this content. **Required in V0.**

### 1c — Optional metadata (collapsed by default)

```
▸ Assessment details (optional)
   └─ Description, topic weightage targets, collaborators
```

### Tab 1 completion signal

The "Questions" tab becomes accessible once at least one section exists. No hard gate — faculty can click Questions at any time, but an empty-state nudge appears if no sections are defined.

---

## Tab 2: Questions

**Purpose:** Add questions to each section.

**Owns:**
- All question sourcing (QB search, AI generator, manual create, doc upload)
- Question-level editing
- Health panel (live composition metrics)
- Outlier flag visibility

**Does NOT own:** Section structure (done in Structure tab). Delivery config. Review workflow.

### Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  STRUCTURE  QUESTIONS  DELIVER                    [Health panel ↗] │
├───────────────────────────────────┬────────────────────────────────┤
│  Sections                         │  Health                        │
│  ─────────────────                │  ─────────────────             │
│  ● Section A · 12 Q               │  12 questions                  │
│    Section B · 0 Q                │  48 pts total                  │
│                                   │  ~42 min est.                  │
├───────────────────────────────────│                                │
│  Section A: Cardiovascular Pharm. │  Bloom's mix                   │
│                                   │  Recall ████░░  8              │
│  Add questions via:               │  Apply  ██░░░░  4              │
│  [Search QB] [AI Generate]        │                                │
│  [New question] [Upload doc]      │  ⚠ 1 outlier flagged           │
│                                   └────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐              │
│  │  1.  In which layer of the heart wall is the…    │              │
│  │      MCQ · 4 pts · Medium · PBI 0.42     [Edit] │              │
│  ├──────────────────────────────────────────────────┤              │
│  │  2.  ⚠ A patient presents with chest pain…      │              │
│  │      MCQ · 4 pts · Hard · PBI −0.08  [Replace]  │              │
│  └──────────────────────────────────────────────────┘              │
│  [+ Add question]                                                   │
└────────────────────────────────────────────────────────────────────┘
```

### Sourcing actions

| Action | What it does |
|---|---|
| **Search QB** | Opens right panel with semantic search + filters. Results show stem preview, metadata, PBI, usage count. Select → "Add to section" creates a local pinned copy. |
| **AI Generate** | Opens right panel. Input: topic / source doc / count / Q-type mix → AI drafts → faculty review each → add accepted. |
| **New question** | Inline editor opens below the question list for the active section. Type selector first, then full editor. |
| **Upload doc** | File picker (PDF/DOC/PPTX) → AI extracts/generates questions → review panel same as AI Generate. |

### Question list row

Each row is a flat border-b row (no cards):

```
#  [stem truncated, max 2 lines]                  [Type] [pts] [Diff] [Bloom's] [flags]  [···]
```

- Outlier questions: `⚠` chip inline. Hover chip to see: "Negative PBI (−0.08). AI can suggest a replacement."
- Row actions [···]: Edit, Replace with AI equivalent, Move to section, Duplicate, Remove
- Editing a QB-sourced question shows: "This will create a local copy — the Question Bank original is unaffected."

### 2b — Assessment-level reference materials ⚠ Missing from current admin

> **Taker gap:** The assessment-taker renders a `GlobalReferencePanel` sidebar — a tabbed panel of reference sheets accessible throughout the entire exam (formula sheets, lab value tables, reference documents, images, PDFs). Vishaka: *"Some formulas the instructor wants to upload which can be for multiple questions… always available. Just like the calculator — open the resource document."* The admin has **no UI to configure this panel.**

This is a V0 required feature. Location: Tab 2 (Questions), because references contextualize content — not delivery config.

```
┌─ Exam references (available to student throughout exam) ───────┐
│  These appear as a persistent panel students can open any time │
│                                                                │
│  [fa-file-formula] Formula sheet       [Edit] [Remove]        │
│  [fa-table]        Lab reference table [Edit] [Remove]        │
│  [fa-file-pdf]     Pharmacology guide  [Edit] [Remove]        │
│                                                                │
│  [+ Add reference]                                             │
│     ├─ Formula sheet (name + formula + variable definitions)  │
│     ├─ Table (headers + rows + optional note)                 │
│     ├─ Text / paragraphs                                      │
│     ├─ Image (upload)                                         │
│     ├─ PDF (upload or URL)                                    │
│     └─ Document (Word / Google Doc — download only)           │
└────────────────────────────────────────────────────────────────┘
```

**Reference types and their required fields:**

| Type | Admin configures | Taker renders |
|---|---|---|
| `formula` | Name, formula string, variable definitions | Bordered formula block per formula |
| `table` | Column headers, rows (grid editor), optional note | DS Table with rounded border |
| `text` | Paragraphs (textarea) | Plain paragraphs |
| `image` | Upload + alt label | Full-width image with error fallback |
| `pdf` | Upload or URL + display label | Embedded viewer + download link |
| `doc` | Upload or URL + display label | Download-only (no preview) |

Each reference also needs: **label** (shown as tab title in taker) and **icon** (FA icon class — admin can pick from a preset list).

---

### 2c — Per-question reference materials ⚠ Missing from current admin

> **Taker gap:** Every question in the taker has a `references[]` array supporting image, table, PDF, HTML, and iframe types. These render as a tabbed right panel alongside the question stem. The admin question editor has **no UI to attach per-question references.**

Per-question references are distinct from assessment-level references:
- **Assessment-level:** Persistent sidebar, available for any question, faculty uploads once (formula sheet, lab values)
- **Question-level:** Specific to one question, rendered inline in the split view (anatomy diagram, case-specific table, clinical image)

**Admin question editor additions required:**

```
┌─ Question editor ─────────────────────────────────────────────┐
│  [Stem]  [Options]  [References]  [Settings]                  │
│                                                               │
│  References tab:                                              │
│  ┌─ Add reference material for this question ───────────────┐│
│  │  Students see this alongside the question stem            ││
│  │                                                           ││
│  │  [fa-image] Image    [fa-table] Table    [fa-file] PDF   ││
│  │  [fa-code] HTML      [fa-text] Passage                   ││
│  │                                                           ││
│  │  [Drag to reorder]  Reference 1: Renal diagram  [Remove] ││
│  │  [Drag to reorder]  Reference 2: Lab values     [Remove] ││
│  └───────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

---

### 2d — Question media and context types ⚠ Partially missing from admin

> **Taker gap:** The question renderer supports video (`videoUrl`), audio (`audioUrl`), passage text (`passageText`), charts with captions (`chartData`), case study tabs (`tabs[]`), and a universal caption field. The admin question editor needs explicit UI for each.

**Required additions to the question editor "media" section:**

| Media type | Taker field | Admin needs |
|---|---|---|
| Image | `imageUrl` | Upload or URL input |
| Video | `videoUrl` | Upload or URL input, format guidance |
| Audio | `audioUrl` | Upload or URL input |
| Passage text | `passageText` | Multi-line textarea (displayed in scrollable box) |
| Case study tabs | `tabs[]` | Tab builder: add/rename tabs, paragraph editor per tab |
| Chart | `chartData` + `caption` | Chart config (V1 — defer chart builder) |
| Universal caption | `caption` | Single-line text below any media type |

V0 priority: image, audio, passage text, case study tabs. Video and chart config can be V1.

---

### Tab 2 completion signal

The "Deliver" tab becomes accessible once there is at least 1 question in the assessment. No hard gate.

---

## Tab 3: Deliver

**Purpose:** Schedule, configure, and publish the assessment.

**Owns:**
- Availability window (3 dates)
- Time limit
- Security mode + passwords
- Digital tools config
- Results & post-exam review config
- Review workflow (send for review / publish directly)

**Does NOT own:** Questions. Sections. Anything that changes the exam content.

**Structure:** Each section is a card with a clear label. Advanced options collapse by default. Exam type pre-fills defaults (Exam → secure, hold for review; Quiz → unsecure, publish immediately).

```
┌─ Availability ───────────────────────────────────────┐
│  Visible to students  [Jun 18, 2026]                 │
│  Students can enter   [Jun 20, 2026  ·  09:00]       │
│  Hard deadline        [Jun 20, 2026  ·  11:30]       │
│                                                       │
│  ▸ Pre-reads & early access                          │
└───────────────────────────────────────────────────────┘

┌─ Time limit ─────────────────────────────────────────┐
│  ○ No limit   ● Timed                                │
│  [90] minutes  ·  warn at [5] min remaining          │
└───────────────────────────────────────────────────────┘

┌─ Security ────────────────────────────────────────────┐
│  ○ Standard browser   ● Respondus lockdown           │
│                                                       │
│  ▸ Passwords (start / resume)                        │
└───────────────────────────────────────────────────────┘

┌─ Tools ───────────────────────────────────────────────┐
│  Calculator     [Off ▾]                              │
│  Highlighting   [On]                                 │
│  Notes          [On]                                 │
│  Copy/paste     [Off]                                │
│  ─────────────────────────────────────────────────── │
│  ⚠ Allow question comments   [Off]                  │  ← taker gap
│  ⚠ Auto-advance on selection [Off]                  │  ← taker gap
└───────────────────────────────────────────────────────┘
```

> **⚠ Taker gap — `allowComments`:** The taker renders a `QuestionCommentBox` below each question when `allowComments === true`. Students can flag questions for faculty review. This is already data-modeled in the taker but has no admin toggle. Add to Tools section. Default: Off.

> **⚠ Taker gap — `autoAdvance`:** The taker supports `Assessment.autoAdvance` — automatically moves to the next question the moment a student selects an answer. Aarti flagged this as high-risk: *"by mistake if they do it it will be a big problem for students."* Default must be Off. Add to Tools section with a prominent warning label.

```
┌─ Results & review ────────────────────────────────────┐
│  This assessment is   ○ Standard  ● High-stakes       │  ← taker gap
│                                                       │
│  High-stakes: Results withheld until faculty          │
│  manually publishes them (status: results_pending)    │
│                                                       │
│  Show results   ○ Immediately on submit               │
│                 ● Hold for faculty review (3 days)    │
│                                                       │
│  ▸ Student review window                             │
│     Access: Immediate / Scheduled / Delayed           │
│     ⚠ Show correct answers to student  [Off]         │  ← taker gap
│     ⚠ Show rationale / explanation     [Off]         │  ← taker gap
│     Time-limited session  [—] min                    │
└───────────────────────────────────────────────────────┘

┌─ Publish ─────────────────────────────────────────────┐
│  [Preview as student]  [Send for review]  [Publish →] │
│                                                       │
│  Review workflow:                                     │
│  Draft → Level 1 (You) → Level 2 (Chairperson) → Ready│
└───────────────────────────────────────────────────────┘
```

**Publish button behavior:**
- Exam type → "Send for review" is the primary CTA. "Publish directly" is secondary, destructive-outlined.
- Quiz type → "Publish" is the primary CTA. "Send for review" is secondary.
- Both require availability dates to be set. If missing: inline validation, not a blocking gate from Tab 3 access.

---

## Responsibility Matrix

| What | Modal | Tab 1 · Structure | Tab 2 · Questions | Tab 3 · Deliver |
|---|---|---|---|---|
| Assessment name | ✓ (editable in header throughout) | | | |
| Assessment type | ✓ | | | |
| Course association | ✓ | | | |
| Description | | Optional | | |
| Blueprint source (blank/copy/upload) | | ✓ | | |
| Topic weightage targets | | Optional | | |
| Sections (add/rename/reorder) | | ✓ | | |
| Section delegation | | ✓ | | |
| Collaborators | | Optional | | |
| Question sourcing (QB/AI/manual/upload) | | | ✓ | |
| Question editing | | | ✓ | |
| Question media (image, audio, passage, case study tabs) | | | ✓ | |
| Per-question reference materials | | | ✓ | |
| Assessment-level reference panel (formula/table/PDF/image/doc) | | | ✓ | |
| Section instructions authoring | | ✓ | | |
| Health panel (count, score, time, Bloom's) | | | ✓ (live) | |
| Content area weight configuration | | Optional | | |
| Outlier flags | | | ✓ | |
| Availability window (3 dates) | | | | ✓ |
| Time limit | | | | ✓ |
| Security mode | | | | ✓ |
| Passwords (start/resume) | | | | ✓ |
| Digital tools | | | | ✓ |
| `allowComments` toggle (per-question feedback boxes) | | | | ✓ |
| `autoAdvance` toggle | | | | ✓ |
| `isHighStakes` flag | | | | ✓ |
| `reviewShowsCorrectAnswers` / `reviewShowsRationale` | | | | ✓ |
| Results & review config | | | | ✓ |
| Preview as student | | | | ✓ |
| Review workflow / Publish | | | | ✓ |

---

## Behavioral Rules

### Navigation
- Tabs are accessible in any order once created (no forced linear gate)
- Exception: "Publish" action requires: name set, ≥1 section, ≥1 question, availability dates set
- Incomplete fields show a badge count on the tab: `Deliver ⓘ 2 required`
- Back to course page anytime via breadcrumb — draft is auto-saved

### Auto-save
- All fields auto-save on blur/change (no "Save" button in tabs)
- Status stays `draft` until explicitly submitted for review or published
- Unsaved new question (in inline editor) shows `· Unsaved` next to section name

### Section state propagation
- When an instructor is delegated a section and marks it "Ready," the coordinator sees the section chip update in real time
- Coordinator cannot submit for review unless all sections are either "Ready" or manually waived

### Type defaults
| Setting | Exam default | Quiz default |
|---|---|---|
| Security | Respondus lockdown | Standard browser |
| Time limit | Required field | No limit |
| Results | Hold for review | Show immediately |
| Review workflow | 2-level review | Direct publish |
| Navigation | Forward-only sections | Unrestricted |

---

## What Changed vs. Current

| Current | Redesigned |
|---|---|
| 3-step creation modal asking duration, question target, mode | Single-screen modal with name + type only |
| Separate "Create Canvas" AI-prompt page | Removed — AI Generator lives in Tab 2 as a sourcing action |
| Quick-start options in modal (blank/copy/template) | Moved to Tab 1 — "Start from" section |
| "Hold for review" asked before builder opens | Moved to Tab 3 — Results & review section |
| Duration and question count asked before any questions exist | Duration in Tab 3; question count is derived, not asked |
| Step labels ("Step 1 of 3 · Name your assessment") with `uppercase tracking-wide` | Removed — tab labels are plain nouns |
| Builder steps numbered | Builder steps are workspace tabs (no numbers, no forced sequence) |

---

## Implementation Notes

### Files to update
| File | Change |
|---|---|
| `components/create-assessment-modal.tsx` | Reduce to single-screen, 2 required fields. Remove 3-step wizard. |
| `app/(app)/assessment-builder/create/create-canvas-client.tsx` | Retire this page or redirect to builder Tab 1 |
| `app/(app)/assessment-builder/assessment-builder-client.tsx` | Add tab navigation (Structure / Questions / Deliver) |
| `components/assessment-builder/step2-sections-outline.tsx` | Move to Tab 1: Structure |
| `components/assessment-builder/step2-health-panel.tsx` | Keep in Tab 2: Questions |
| `components/assessment-builder/step2-inline-editor.tsx` | Keep in Tab 2: Questions |
| `components/assessment-builder/step2-qb-search-bar.tsx` | Keep in Tab 2: Questions (panel) |
| `components/assessment-builder/step2-settings-panel.tsx` | Split: delivery settings → Tab 3 |
| `components/assessment-builder/step2-grading-settings-panel.tsx` | Move to Tab 3 |
| `components/assessment-builder/send-for-review-dialog.tsx` | Stays — invoked from Tab 3 publish section |

### Routing
- Modal creates draft → routes to `/assessment-builder?draftId={id}&tab=structure`
- Tab state in URL param: `?tab=structure|questions|deliver`
- Breadcrumb: `{CourseName} / {AssessmentName}` — links back to course

### Not in scope for redesign
- Question editor internals (question types, grading config per type)
- Health panel psychometric data (PBI, discrimination — V1)
- Post-exam regrading engine
- Proctoring dashboard

---

## Taker-Derived Requirements — Admin Configuration Gaps

These features are **rendered by the assessment-taker today** but have **no corresponding admin creation UI**. Each is a missing requirement that must be addressed in the admin builder.

### Reference Materials

| Gap | Where in Admin | Priority | Notes |
|---|---|---|---|
| **Assessment-level reference panel** — formula, table, text, image, PDF, doc | Tab 2 — new "Exam references" section (§2b) | V0 | Vishaka-confirmed. Faculty need to upload formula sheets, lab value tables accessible to all students throughout the exam |
| **Per-question reference materials** — `Question.references[]` | Tab 2 — question editor "References" sub-tab (§2c) | V0 | Taker renders a tabbed split-view panel per question. Without admin authoring, references can only be seeded via QB import |
| **Formula sheet editor** — structured `name`, `formula`, `variables` fields | Inside assessment-level reference editor | V0 | Taker renders each formula with its name, formatted expression, and variable legend |
| **Table editor for references** — headers + rows grid | Inside assessment-level + question-level reference editors | V0 | Taker renders DS Table; admin needs a basic spreadsheet-style row/column editor |

### Question Media & Context

| Gap | Where in Admin | Priority | Notes |
|---|---|---|---|
| **Audio attachment** — `Question.audioUrl` | Tab 2 — question editor media section (§2d) | V0 | Taker renders HTML5 `<audio>` with controls |
| **Passage text block** — `Question.passageText` | Tab 2 — question editor media section (§2d) | V0 | Taker renders a scrollable bordered text block alongside the question stem |
| **Case study tab builder** — `Question.tabs[]` | Tab 2 — question editor media section (§2d) | V0 | Taker renders tabbed content panels (each tab: title + paragraphs). Faculty need to add/name/reorder tabs and author content per tab |
| **Universal caption field** — `Question.caption` | Tab 2 — question editor (below any media) | V0 | Applies to any media type; taker renders it as a captioned box with left accent |
| **Video attachment** — `Question.videoUrl` | Tab 2 — question editor media section (§2d) | V1 | Taker renders HTML5 `<video>`; defer to V1 given hosting complexity |
| **Chart configuration** — `Question.chartData` | Tab 2 — question editor media section (§2d) | V1 | Chart builder is substantial scope; defer |

### Delivery & Behavior

| Gap | Where in Admin | Priority | Notes |
|---|---|---|---|
| **`allowComments` toggle** — enables per-question error-reporting box for students | Tab 3 — Tools section | V0 | Taker renders `QuestionCommentBox` when true. Useful for low-stakes assessments to collect feedback on question quality |
| **`autoAdvance` toggle** — auto-advance to next question on answer selection | Tab 3 — Tools section | V0 | Taker supports this. Aarti flagged as high-risk; default must be Off with a visible warning |
| **`isHighStakes` explicit flag** — controls whether results enter `results_pending` state | Tab 3 — Results section | V0 | Currently only modeled implicitly via "hold for review." The taker uses this flag to determine the student status screen copy and result timing |
| **Section instructions authoring** — `ExamSection.instructions` | Tab 1 — Sections row action (§1b) | V0 | Taker shows instructions as a full-screen interstitial before section questions. No admin authoring UI exists |

### Post-Exam Review Visibility

| Gap | Where in Admin | Priority | Notes |
|---|---|---|---|
| **`reviewShowsCorrectAnswers`** — whether student sees the correct answer during review session | Tab 3 — Student review window (§3) | V0 | Taker conditionally exposes correct answers in review mode. Admin has no toggle |
| **`reviewShowsRationale`** — whether student sees explanations during review session | Tab 3 — Student review window (§3) | V0 | Taker conditionally exposes rationale text in review mode. Admin has no toggle |

### Accommodations

| Gap | Where in Admin | Priority | Notes |
|---|---|---|---|
| **Per-assessment accommodation overrides** — `timeMultiplier`, `separateRoom`, `extendedBreaks` | Tab 3 — Accommodations section | V0 | Taker uses `assessment.accommodation` per student. Admin currently defines global accommodations but has no per-assessment override UI |

### Results Page Configuration

| Gap | Where in Admin | Priority | Notes |
|---|---|---|---|
| **Content area weight configuration** — `ContentArea.weight` (%) | Tab 1 — Optional metadata / Tab 2 — Health panel | V0 | The taker results page shows `{ca.weight}% of grade` per content area. Admin has no UI to set this weight |
| **Percentile display** — `assessment.percentile` | Post-publish config | V1 | Taker shows cohort percentile. This requires aggregation after submission; V1 |

---

## Open Questions

| Question | Impact |
|---|---|
| Does section delegation send an email notification immediately, or only on "Submit for review"? | Affects UX copy in Tab 1 |
| When an instructor is delegated a section, do they see only their section in the builder, or the full assessment read-only? | Determines scoping in Tab 2 |
| Should "Preview as student" be Tab 3 only, or available from Tab 2? | Tab 2 access is more natural mid-build |
| Does copying a past assessment deep-copy questions or create placeholders? | PRD says placeholders — confirm behavior for UI copy |
