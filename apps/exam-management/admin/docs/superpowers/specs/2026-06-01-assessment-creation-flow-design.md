# Assessment Creation Flow — Design Spec

> **Spec 1 of 2.** Covers the full assessment creation flow: entry modal, 3-step wizard, builder settings panel, section settings panel, and the coordinator fill-target model.
> Spec 2 (Question Editor — 6 V0 types) is a separate document.

---

## Source material

| Source | Key decisions |
|---|---|
| `admin/docs/decisions/f59cfbe4.md` | QB ownership at base course level; copy-from-previous with section structure; versioning concept |
| `admin/docs/decisions/af529725.md` | Review/approval workflow (soft gate); faculty two-edit levels; multi-faculty section model |
| `admin/docs/decisions/66898189.md` | Offline download mandatory P1; accessibility (200% zoom, dyslexic font, high contrast) |
| `admin/docs/decisions/b68ede99.md` | Course overview = list of assessments grouped by completion; workflow = side widget |
| `admin/docs/decisions/fb9e76c2.md` | AI gap analysis; curricular matrix in Mapping tab; tagging = Gmail-style labels |
| PRD: Student Experience | Keyboard shortcuts; passing score = teacher-facing only; V0 question types (6 types) |
| PRD: Assessment Creation | Builder settings fields; warning alarms; submit button config; post-exam review |
| PRD: Question Bank | QB browsing; section assignment; versioning; fill target |
| `admin/docs/creation-flow-gap-analysis.md` | P1 field gaps at assessment, section, and question levels |
| Session brainstorm — 2026-06-01 | Section chip pattern; settings panel; Mobbin-informed layouts |

---

## Scope — Phase labels

| Label | Meaning | Target |
|---|---|---|
| P0 | Cohere delivery (immediate) | Now |
| P1 | Phase 1 launch | Jan 20, 2027 |
| P2 | Incremental post-P1 | TBD |

---

## Architecture — high level

```
Entry modal (4 creation modes)
    │
    ▼
Step 1: Setup  ─────────────────────────────────────────────────────────────────
  Left column: Identity (name, type, duration, description)
  Right column: Sections list + Delivery (schedule, download window, randomization, pre-exam instructions)
    │
    ▼
Step 2: Build  ─────────────────────────────────────────────────────────────────
  Left panel:    Sections Outline (240px fixed)
  Center panel:  QB Browser (flex — tabs: This Course / Other / +Q / AI Gap Fill)
  Right panel:   Context-sensitive (3 states):
                   ① Health panel (default)
                   ② Settings panel (⚙ icon in header)
                   ③ Section settings panel (click section row in outline)
    │
    ▼
Step 3: Review  ────────────────────────────────────────────────────────────────
  Health banner + Summary card + Sections list + Schedule block + Approval panel
```

---

## Entry modal — 4 creation modes

```
╔══════════════════════════════════════════════════════════╗
║  Create assessment                                   [×] ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  ┌─────────────────┐  ┌─────────────────┐               ║
║  │ ○  Start blank  │  │ ○  From QB      │               ║
║  │                 │  │                 │               ║
║  │  Clean slate.   │  │  Open the QB    │               ║
║  │  Set up name,   │  │  browser first, │               ║
║  │  type, sections │  │  pick questions,│               ║
║  │  first.         │  │  details later. │               ║
║  └─────────────────┘  └─────────────────┘               ║
║                                                          ║
║  ┌─────────────────┐  ┌─────────────────┐               ║
║  │ ○  Copy prev.   │  │ ○  Import PDF   │               ║
║  │                 │  │                 │               ║
║  │  Copy structure │  │  Upload a paper │               ║
║  │  + questions    │  │  exam. We match │               ║
║  │  from a prior   │  │  to your QB     │               ║
║  │  term's exam.   │  │  automatically. │               ║
║  └─────────────────┘  └─────────────────┘               ║
║                                                          ║
║                          [Cancel]  [Continue →]          ║
╚══════════════════════════════════════════════════════════╝
```

### Copy mode → source picker (step 2 of entry modal)

```
╔══════════════════════════════════════════════════════════╗
║  Copy from previous — PHAR101                        [×] ║
╠══════════════════════════════════════════════════════════╣
║  ┌──────────────────────────────────────────────────┐   ║
║  │ ● Midterm 1 — Spring 2025      42 Q  90 min      │   ║
║  │   ⚠ 3 questions have low point-biserial (<0.15)  │   ║
║  ├──────────────────────────────────────────────────┤   ║
║  │ ○ Final Exam — Spring 2025     58 Q  150 min     │   ║
║  │   ✓ All questions healthy                        │   ║
║  └──────────────────────────────────────────────────┘   ║
║                                                          ║
║  ⚠ Poor point-biserial questions will be flagged in     ║
║    Step 2 so you can swap or edit them.                  ║
║                                                          ║
║                   [← Back]  [Copy Midterm 1 →]          ║
╚══════════════════════════════════════════════════════════╝
```

**Source:** `f59cfbe4.md` — "Faculty takes last year's exam, recycles 5–15% of questions." Sections copy with structure; faculty assignments are cleared (may differ by year).

**Phase:** P1

---

## Step 1 — Setup

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [☰]  PHAR101 · Fall 2025  ›  New assessment          Step 1 of 3  [×]   │
│      ①Setup  ──────────────  ②Build  ──────────────  ③Review            │
├───────────────────────────────────────┬──────────────────────────────────┤
│  IDENTITY                             │  SECTIONS                        │
│                                       │                                  │
│  Assessment name *                    │  Dr. Mehra's Section         [×] │
│  [Midterm Exam 1                    ] │  Dr. Purani's Section        [×] │
│                                       │  [+ Add section]                 │
│  Type                                 │                                  │
│  [Exam ●][Quiz ○][Pop Quiz ○][Assign ○│  DELIVERY                        │
│                                       │                                  │
│  Duration                             │  Opens                           │
│  [90] minutes                         │  [May 28, 2026] [9:00 AM]        │
│                                       │                                  │
│  Description (optional)               │  Closes                          │
│  [                                  ] │  [May 28, 2026] [10:30 AM]       │
│                                       │                                  │
│                                       │  Download window (Exam only)     │
│                                       │  Students can pre-download       │
│                                       │  [24] hours before exam start    │
│                                       │                                  │
│                                       │  ─── ─── Randomize questions     │
│                                       │  ─── ─── Randomize options       │
│                                       │                                  │
│                                       │  Pre-exam instructions (optional)│
│                                       │  [                             ] │
│                                       │  ─── ─── Require acknowledgment  │
└───────────────────────────────────────┴──────────────────────────────────┤
│  [Cancel]                                       [Continue to Build →]    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Pop Quiz delivery variant

```
│  DELIVERY                                                                │
│  ────────────────────────────────────────────────────────────────────── │
│  ℹ  Pop quizzes are started live in class — no scheduling needed.        │
│     Duration: [15] minutes · Password: [──────────]                     │
```

### Step 1 state rules

| Condition | Behavior |
|---|---|
| Type = Pop Quiz | Scheduling fields hidden; password kept; no download window |
| Type = Exam | Download window shown |
| Type = Quiz / Assignment | No download window |
| Instructions empty | Acknowledgment toggle hidden |
| Name empty | Continue button disabled |
| Section title max | 60 characters |

### Fields — phase labels

| Field | Phase |
|---|---|
| Name, type, duration, description | P0 |
| Sections list (add / remove) | P0 |
| Scheduling (opens/closes) | P0 |
| Download window | P1 — `66898189.md`: "This was always part of ExamSoft parity" |
| Randomize questions / options | P0 |
| Pre-exam instructions + acknowledgment | P1 |

---

## Step 2 — Build (3-panel)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [☰]  Midterm Exam 1  ·  42 questions         Step 2 of 3   [⚙ Settings] [Save] │
│      ①Setup  ──────────────  ②Build ●  ────────────  ③Review                   │
├────────────────────┬──────────────────────────────┬──────────────────────────────┤
│  OUTLINE    240px  │  QB BROWSER          flex    │  HEALTH             280px    │
│                    │                              │                              │
│  ┌ Dr. Mehra ▾    │  [This course QB][Other][+Q] │  ● Good                      │
│  │  8/15 Q  Jun10  │  [AI gap fill]               │  42 of 50 questions          │
│  │  [purple chip]  │                              │                              │
│  ├ Q001 MCQ ✓     │  Filter: [All ▾] [Diff ▾]   │  Estimated time              │
│  ├ Q002 MCQ ✓     │                              │  87 min vs 90 min config     │
│  └ Q003 MCQ ⚠     │  ┌────────────────────────┐  │  ████████████░░  97%         │
│                    │  │ ● Q045  MCQ  Medium    │  │                              │
│  ┌ Dr. Purani ▾   │  │ Describe ADME princip… │  │  Difficulty mix              │
│  │  0/10 Q [grey]  │  │ pbis: 0.41 ↑  Used: 3x │  │  Easy   ████░░  12           │
│  │                 │  │  PBI column  [Use ▾]   │  │  Medium ████████  28         │
│  Unassigned (4)    │  ├────────────────────────┤  │  Hard   ████  8              │
│  ├ Q020 MCQ ✓     │  │ ○ Q046  MCQ  Hard  ⚠  │  │                              │
│  ├ Q021 TF  ✓     │  │ pbis: 0.09 ↓  POOR     │  │  Bloom's                     │
│  │                 │  │ ⚠ Low point-biserial   │  │  Remember ██  4              │
│  [+ Unassigned]    │  │  [Use ▾]               │  │  Understand ████  14         │
│                    │  └────────────────────────┘  │  Apply ████████  18          │
│  ─────────────     │                              │                              │
│  ⚠ 3 missing rat. │                              │  Topic coverage              │
│                    │                              │  Pharmacokinetics  ✓         │
│                    │                              │  Drug interactions ✓         │
│                    │                              │  Adverse events    ✓         │
│                    │                              │  Black-box warnings ✗        │
│                    │                              │                              │
│                    │                              │  ── Flags                    │
│                    │                              │  ⚠ 3 missing rationale       │
│                    │                              │  ⚠ 2 poor point-biserial     │
└────────────────────┴──────────────────────────────┴──────────────────────────────┘
                                                    [← Back to Setup]  [Review →]
```

### Left panel — Sections Outline

Section header chip colors (Kajabi/Squarespace compact chip pattern — Mobbin-informed):

| State | Chip style |
|---|---|
| Not started | Grey background, grey border: `0 / 15 Q` |
| In progress | Purple background, purple border: `8 / 15 Q` |
| Complete | Green background, green border: `✓ 20 / 20 Q` |

Click a **section header row** → right panel switches from Health to **Section Settings panel**.

**"Use ▾" dropdown on each QB question:**

```
┌────────────────────┐
│ Add to section:    │
│  · Dr. Mehra's     │
│  · Dr. Purani's    │
│  · Unassigned      │
├────────────────────┤
│ Copy & modify      │
└────────────────────┘
```

**Source:** `f59cfbe4.md` — QB questions belong to base course QB; when added to an assessment they link to the section, not modify the QB question.

**Inline editor** (expands within outline below the question row):

```
│  ├ Q003 ···· MCQ ⚠  [editing]                                            │
│  │  ┌───────────────────────────────────────────────────────────────┐    │
│  │  │ Stem                                                           │    │
│  │  │ [A 67-year-old patient…                                      ] │    │
│  │  │                                                               │    │
│  │  │ Options          ✓ = correct                                  │    │
│  │  │ [A] Renal function only              ○ ✓                     │    │
│  │  │ [B] Body surface area only           ○                       │    │
│  │  │ [C] Time of day                      ○                       │    │
│  │  │ [D] Patient handedness               ○                       │    │
│  │  │                                                               │    │
│  │  │ Rationale *                                                   │    │
│  │  │ [Aminoglycoside dosing is adjusted primarily…               ] │    │
│  │  │                                                               │    │
│  │  │                       [Cancel]  [Save to QB]                  │    │
│  │  └───────────────────────────────────────────────────────────────┘    │
```

**Source:** `af529725.md` (Vishaka) — "Anywhere in the product, you are not going to have faculty stop their work to go do something somewhere else."

---

### Right panel — 3 states

#### State ①: Health panel (default)

```
┌── HEALTH ──────────────────────────────────────────┐
│  ● Good  (or ⚠ Needs attention)                    │
│  42 of 50 questions                                 │
│  ████████████░░  84%                               │
├─────────────────────────────────────────────────────┤
│  ESTIMATED DURATION                                 │
│  87 min vs 90 min config   ████████████░░  97%     │
├─────────────────────────────────────────────────────┤
│  DIFFICULTY                                         │
│  Easy   ████░░  12                                  │
│  Medium ████████  28                                │
│  Hard   ████  8                                     │
├─────────────────────────────────────────────────────┤
│  BLOOM'S                                            │
│  Remember   ██  4                                   │
│  Understand ████  14                                │
│  Apply      ████████  18                            │
│  Analyze    ████  6                                 │
├─────────────────────────────────────────────────────┤
│  TOPIC COVERAGE (3/4)                               │
│  ✓ Pharmacokinetics                                 │
│  ✓ Drug interactions                                │
│  ✓ Adverse events                                   │
│  ✗ Black-box warnings                               │
├─────────────────────────────────────────────────────┤
│  FLAGS                                              │
│  ⚠ 3 missing rationale                             │
│  ⚠ 2 low point-biserial                            │
└─────────────────────────────────────────────────────┘
```

#### State ②: Settings panel (triggered by ⚙ Settings in Step 2 header)

```
┌── ⚙ ASSESSMENT SETTINGS ──────────────────────────┐
│  [← Health]                              [Close ×] │
├─────────────────────────────────────────────────────┤
│  GRADING                                            │
│  ─── ─── High-stakes exam                          │
│           Results held until faculty review         │
│  Passing score threshold                            │
│  [70]%  (faculty-visible only)                      │
│  ─── ─── Allow student comments / flags             │
├─────────────────────────────────────────────────────┤
│  NAVIGATION                                         │
│  Question ordering    [Fixed ▾]                    │
│  ─── ─── Allow backward navigation within section   │
│  ─── ─── Require answer before advancing            │
├─────────────────────────────────────────────────────┤
│  SUBMIT BUTTON                                      │
│  Show submit when   [Answer all ▾]                 │
│  Options: Always / After viewing all / After answering all │
├─────────────────────────────────────────────────────┤
│  SCORE DISPLAY (post-exam)                          │
│  Show to student    [Raw score + % ▾]              │
│  Options: Raw score only / Raw + % / Scaled score   │
│  NOTE: Pass/fail label never shown to students.     │
├─────────────────────────────────────────────────────┤
│  POST-EXAM REVIEW                                   │
│  ─── ─── Allow students to review their answers     │
│  Review window opens  [Date picker]                 │
│  Review window closes [Date picker]                 │
│  ─── ─── Show correct answers in review             │
├─────────────────────────────────────────────────────┤
│  WARNINGS                                           │
│  Warn student at   [5] minutes remaining            │
│  ─── ─── Warn when student leaves a question blank  │
├─────────────────────────────────────────────────────┤
│  REFERENCE MATERIALS                                │
│  Global PDFs available via toolbar during exam      │
│  [+ Add PDF]                                        │
│  · Pharmacology Formula Sheet.pdf     [×]           │
│  · Drug Reference Tables.pdf          [×]           │
│  (Student sees "Reference" button in exam toolbar)  │
├─────────────────────────────────────────────────────┤
│  PRE-READS (assessment level)                       │
│  [+ Add pre-read document]                          │
│  Shown in exam toolbar: "Pre-reads" button          │
└─────────────────────────────────────────────────────┘
```

**PRD-critical note:** `passingScore` is **faculty-facing only**. Students see raw score and percentage. The pass/fail label is never surfaced to students in the exam UI, results screen, or notifications. This is explicit in the Student Experience PRD — performance flag threshold is an administrative tool.

**Source:** Assessment Creation PRD — warning alarms, backward nav toggle, require-answer toggle, question ordering, score display config, submit button config, post-exam review config.

**Phase assignments for settings fields:**

| Field | Phase |
|---|---|
| isHighStakes | P1 |
| passingScore (faculty-facing only) | P1 |
| allowComments | P1 |
| referenceMaterials[] | P1 |
| Warning alarms | P1 |
| Backward nav toggle | P1 |
| Require-answer toggle | P1 |
| Question ordering (fixed/random within section) | P1 |
| Score display config | P1 |
| Submit button config | P1 |
| Post-exam review window | P2 |
| Show correct answers in review | P2 |
| Pre-reads at assessment level | P1 |

#### State ③: Section settings panel (click section row in outline)

```
┌── SECTION: Dr. Mehra's Section ────────────────────┐
│  [← Health]                              [Close ×] │
├─────────────────────────────────────────────────────┤
│  FILL TARGET                                        │
│  [15]  [Questions ▾]                               │
│  ███████░░░░░░  8 of 15 filled                     │
├─────────────────────────────────────────────────────┤
│  DUE DATE          ASSIGNED TO                      │
│  [Jun 10, 2026]    [Dr. Mehra ▾]                   │
├─────────────────────────────────────────────────────┤
│  SECTION INSTRUCTIONS (P1)                          │
│  Shown to student before Q1 of this section         │
│  [                                               ]  │
│  [                                               ]  │
├─────────────────────────────────────────────────────┤
│  PRE-READS (section level)                          │
│  [+ Add pre-read document]                          │
│  Shown in exam sidebar during this section          │
└─────────────────────────────────────────────────────┘
```

**Section chip colors** (right panel closes, chip in outline updates):
- Grey: not started (`0 / 15 Q`)
- Purple: in progress (`8 / 15 Q`)
- Green: complete (`✓ 15 / 15 Q`)

**Coordinator model** (from `af529725.md` + `creation-flow-gap-analysis.md`):
- Coordinator creates sections, sets fillTarget (X questions OR Y points), assigns faculty + due date
- Faculty sees their fill target on login; uses QB/AI/import to reach it
- Progress tracks filled vs target: "8 of 15 filled"
- Coordinator can view, override, add questions on faculty's behalf

**Phase assignments for section fields:**

| Field | Phase |
|---|---|
| fillTarget (count or points) | P1 |
| dueDate | P1 |
| assignedFacultyId | P1 |
| sectionInstructions | P1 |
| Pre-reads (section level) | P1 |
| Section-level reference documents | P2 |
| attestationRequired | P2 |
| calculatorAllowed | P2 |
| timeLimitMinutes | P3 |

---

## Step 3 — Review

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [☰]  Midterm Exam 1  ·  PHAR101 Fall 2025    Step 3 of 3   [Save draft] │
│      ①Setup  ──────────────  ②Build  ────────────── ③Review ●           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌── Assessment health ─────────────────────────────────────────────┐   │
│  │  ● Ready to publish                                               │   │
│  │  42 questions · 87 min est. vs 90 min · 3 missing rationale ⚠   │   │
│  │  ⚠ 3 questions missing rationale — [Fix in Build →]              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Summary                                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Midterm Exam 1                              [Exam]              │   │
│  │  PHAR101 · Pharmacology I · Fall 2025                            │   │
│  │  42 questions · 90 min · Password required · Randomized          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Sections                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Dr. Mehra's Section         8 / 15 Q  ⚠ not complete           │   │
│  │  Dr. Purani's Section        0 / 10 Q  ⚠ not started            │   │
│  │  Unassigned                  4 Q                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Schedule                          Approval status                       │
│  ┌────────────────────────────┐    ┌───────────────────────────────┐    │
│  │  Opens                     │    │  ○ Draft                      │    │
│  │  May 28, 2026  9:00 AM EDT │    │                               │    │
│  │                            │    │  Send to a chair or senior    │    │
│  │  Closes                    │    │  faculty for review before    │    │
│  │  May 28, 2026  10:30 AM EDT│    │  publishing.                  │    │
│  │                            │    │                               │    │
│  │  Download from             │    │  [Send for review]            │    │
│  │  May 27, 2026  9:00 AM     │    │                               │    │
│  └────────────────────────────┘    │  ─── or ───                   │    │
│                                    │  [Publish without review]     │    │
│  Pre-exam instructions preview     │  (soft warning shown)         │    │
│  ▸ Students will see these before  └───────────────────────────────┘    │
│    starting [Show preview]                                               │
│                                                                          │
│  [← Back to Build]                             [Save draft]             │
└──────────────────────────────────────────────────────────────────────────┘
```

### Send for review sheet

```
╔══════════════════════════════════════════════╗
║  Send for review                         [×] ║
╠══════════════════════════════════════════════╣
║  Reviewer                                    ║
║  [Search faculty...          ▾]              ║
║  Selected: Dr. Sarah Chen                    ║
║                                              ║
║  Due date (optional)                         ║
║  [Jun 1, 2026                ]               ║
║                                              ║
║  Message (optional)                          ║
║  [Please review rigor level  ]               ║
║  [for the hard questions in  ]               ║
║  [section 2.                 ]               ║
║                                              ║
║  ℹ You can still publish without approval.  ║
║                                              ║
║           [Cancel]  [Send for review]        ║
╚══════════════════════════════════════════════╝
```

**Approval is a soft gate.** Faculty can always publish without review. System shows a contextual warning:

```
│  ⚠ This assessment hasn't been reviewed.          │
│  Most programs get chair approval before           │
│  high-stakes exams. You can still publish.         │
│                                   [Publish anyway] │
```

**Source:** `b68ede99.md` (Aarti) — "I don't want assessment workflow to be the primary concern. If they want to administer it and it has not been approved, you let them administer it. But you say 'just so you know this is still pending approval'."

---

## Keyboard shortcuts — PRD-defined

These are defined by the Student Experience PRD and apply during the exam (assessment taker), not during admin creation. Included here because the **admin creation spec determines what features must be buildable** — e.g., calculator must be configured per section, scratch pad must not require a separate toggle.

| Shortcut | Action |
|---|---|
| `A` – `E` | Select answer option |
| `ALT + F` | Flag / unflag question |
| `ALT + C` | Toggle calculator |
| `ALT + N` | Next question |
| `ALT + P` | Previous question |
| `ALT + W` | Toggle scratch pad |
| `Ctrl + /` | Open keyboard shortcuts modal |

**Creation implication:** Calculator availability is set at the section level (P2) with per-question override (P3). Scratch pad is always available — no admin toggle needed.

---

## Data model changes

### `AssessmentSettings` — new/changed fields

```ts
interface AssessmentSettings {
  // Existing
  type: 'Exam' | 'Quiz' | 'Pop Quiz' | 'Assignment'
  passwordRequired: boolean
  password: string
  randomize: boolean
  showRationaleAfter: boolean
  openDate: string | null
  closeDate: string | null
  timezone: string
  status: AssessmentStatus
  reviewRequest: AssessmentReviewRequest | null

  // New — P1
  randomizeOptions: boolean             // shuffle answer choices within each Q
  downloadWindowHours: number           // hours before openDate for pre-download (Exam type only)
  instructionsText: string              // pre-exam instructions
  requireAcknowledgment: boolean        // student must check box before starting
  isHighStakes: boolean                 // results held until faculty review
  passingScore: number | null           // percentage threshold — FACULTY FACING ONLY
  allowComments: boolean                // per-question comment/flag box in exam
  referenceMaterials: { name: string; url: string }[]  // global PDFs in exam toolbar
  warnAtMinutesRemaining: number | null // warn student N min before time runs out
  warnOnBlankQuestion: boolean          // warn when leaving a question unanswered
  backwardNavAllowed: boolean           // allow navigating to previous questions within section
  requireAnswerBeforeAdvancing: boolean // must answer before moving to next Q
  questionOrdering: 'fixed' | 'random' // fixed = order as authored; random = shuffled per student
  submitButtonVisibility: 'always' | 'after-viewing-all' | 'after-answering-all'
  scoreDisplay: 'raw' | 'raw-and-percent' | 'scaled'
  preReadDocuments: { name: string; url: string }[]  // assessment-level pre-reads

  // New — P2
  reviewShowsCorrectAnswers: boolean
  reviewSessionStart: string | null     // ISO datetime — review window open
  reviewSessionEnd: string | null       // ISO datetime — review window close
}
```

### `AssessmentSection` — new/changed fields

```ts
interface AssessmentSection {
  // Existing
  id: string
  title: string
  facultyId?: string
  questionIds: string[]

  // New — P1
  fillTarget: { type: 'count' | 'points'; value: number } | null
  dueDate: string | null               // ISO date
  instructions: string                 // shown to student at section boundary
  preReadDocuments: { name: string; url: string }[]  // section-level pre-reads

  // New — P2
  documents: { name: string; url: string }[]     // section-scoped reference PDFs
  attestationRequired: boolean         // student must check "I understand" before Q1
  calculatorAllowed: boolean           // calculator button shown for this section

  // New — P3
  timeLimitMinutes: number | null      // section countdown
}
```

---

## V0 question type scope — PRD constraint

The Question Bank PRD defines **6 question types for V0** (Cohere delivery):

| Type | Admin type key | Notes |
|---|---|---|
| MCQ / MSQ | `mcq`, `multi-select` | MCQ = single correct; MSQ = multiple correct |
| Hotspot | `hotspot` | Click-on-image |
| Match the Following | `matching` | Drag or select to match pairs |
| Fill in the Blank | `fill-blank` | Text input, configurable correct answers |
| Essay | `essay` | Long-form open text |
| True/False | `true-false` | Binary correct/incorrect |

**Admin editor must support exactly these 6 types for V0.** The remaining types (`ordering`, `k-type`, `short-answer`, `case-study`, etc.) are deferred to post-V0.

**Source:** PRD: Question Bank — "V0 is scoped to the following question types: Multiple Choice Question, Multiple Select Question, Hotspot, Match the Following, Fill in the Blank, Essay, True/False."

Spec 2 (Question Editor) will detail the full editor UX for each of these 6 types.

---

## Interaction patterns — right panel switching

```
User action                          Right panel state
────────────────────────────────     ─────────────────────────────────
Default (enter Step 2)           →   Health panel
Click ⚙ Settings in header       →   Settings panel
Click ⚙ again / close button    →   Health panel
Click section row in outline     →   Section settings panel
Click different section row      →   Section settings panel (updates)
Click outside / close button     →   Health panel
Click question row (edit)        →   Health panel (inline editor in outline)
```

---

## Accessibility requirements — Phase 1

From `66898189.md` (May 21):

| Requirement | Scope | Phase |
|---|---|---|
| 200% magnification support | All admin creation screens | P1 |
| 44px minimum touch targets | All interactive elements | P1 |
| Keyboard navigable (Tab, Enter, Escape, Arrow keys) | Wizard steps, modals, dropdowns | P1 |
| High contrast color combinations | All status indicators, chips | P1 |
| Dyslexic-friendly font (toggle in taker) | Exam taker only | P1 |
| No information by color alone | Chip states must have text label | P1 |
| 400% magnification | Deferred | P2 |

---

## What this spec does NOT cover

- **Question Editor UX for 6 V0 types** — Spec 2 (`2026-06-01-question-editor-design.md`)
- **Student exam experience** — separate taker spec
- **Live monitoring** — separate spec (live monitor PR exists; this spec adds flagged-questions panel from PRD)
- **AI gap fill** — surface exists (button in QB browser); content is PRD-defined but implementation is AI service concern
- **LMS integration / download-window student flow** — architecture decision pending (Darshan/Arun/Yash — per `66898189.md`)
- **ExamSoft parity table** — separate deliverable (Nipun — per `66898189.md`)

---

## Open questions

- [ ] Is `fillTarget` in points a Phase 1 requirement or Phase 1 stretch? — confirm with Vishaka
- [ ] Pre-read documents (assessment level): URL input or file upload? (impacts infra)
- [ ] Section instructions: plain text or rich text (bold, bullets)? — recommend plain text for P1
- [ ] Submit-without-review: does publishing require minimum questions (e.g., ≥ 1) as a hard gate?
- [ ] Copy-from-previous: when faculty assignments change year over year, does the system auto-clear or prompt?
