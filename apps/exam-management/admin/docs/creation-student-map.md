# Creation → Student Map: Every UI Element in Assessment & Question Creation

> **Purpose:** Reference for every button, icon, input, toggle, and control in the admin creation flows, mapped to its student-side rendering. Load this before any assessment-builder or question-editor work.
>
> **Files covered:** `create-assessment-modal`, `assessment-builder-client`, `create-canvas-client`, `question-editor`, `step2-*`, `question-detail-sheet`, `ai-generate-modal`, `import-assessment-modal`, `qb-state`, `qb-modals`

---

## 1. Assessment Creation — 3-Step Modal (`create-assessment-modal.tsx`)

Entry point: "New assessment" button on the Assessments list page.

### Step 1: Basics

| Element | Type | Options / Behavior |
|---|---|---|
| Course / code / semester | LocalBanner (info, locked) | Read-only context — cannot be changed |
| Title | Input (required) | `id="asmt-title"` — becomes `<h1>` in student exam header |
| Description | Textarea (3 rows, optional) | Shown on student pre-exam landing page |
| Quick start | Radio group | Blank / Copy from existing |
| Copy source | Select (conditional) | Appears when "Copy from existing" is selected |

### Step 2: How Students Take It

| Element | Type | Options / Student Impact |
|---|---|---|
| Mode | 2-column button grid | **Proctored** = lockdown browser + proctor oversight; **Self-paced** = open-tab, no proctor |
| Duration | InputGroup (number + "minutes" addon) | Timer shown in `ExamToolbar` — pulses red in last 5 min |
| Question count target | InputGroup (number + "questions" addon) | Controls how many Q drawn into the exam |
| Hold for faculty review | Checkbox | Scores not released until faculty manually releases |
| Show results immediately | Checkbox | Student sees score + correct answers on submit screen |

### Step 3: Schedule

| Element | Type | Behavior |
|---|---|---|
| Schedule now | Checkbox | Reveals date/time fields when checked |
| Starts | Date + time inputs | Window opens — student cannot launch before this |
| Ends | Date + time inputs | Window closes — submission blocked after this |
| Confirmation banner | LocalBanner (info) | Shows full summary before "Create" |

**Footer buttons:** ← Back (outline) · Cancel (outline) · Next → / Create (default)

---

## 2. Assessment Builder Canvas (`create-canvas-client.tsx`, `assessment-builder-client.tsx`)

### Canvas Header Inputs

| Element | Type | Notes |
|---|---|---|
| Assessment name | Inline editable input | Underline border; becomes exam title in student header |
| Type | ChipPopover | Exam / Quiz / Pop Quiz / Assignment |
| Date | ChipPopover | Schedule window |
| Duration | ChipPopover | Timer in student taker |
| Collaborators | Selector | Faculty who can co-edit the builder |

### Canvas Body — Creation Mode Picker

| Card | Icon | Student Impact |
|---|---|---|
| Build new assessment | fa-file-plus | Creates blank sections, pick Q from QB |
| Copy existing | fa-copy | Duplicates questions and settings from a prior exam |
| QbFolderPicker | fa-database | Selects an entire QB folder as the Q pool |
| PDF import | fa-file-pdf | OCR extracts Qs from paper exam, matches to QB |
| AI prompt | Textarea (7 rows) + send icon | AI proposes sections + Q counts from description |

### QbFolderPicker Dialog

- Checkbox list of QB folders (grouped by private/shared)
- Per folder: name + question count "X Q"
- Footer: Selected folder count + "Build" button

### Copy Source Picker Dialog

- Assessment list cards: title, question count icon, duration icon
- Difficulty distribution bar (Easy/Med/Hard color segments)
- "Copy" chip per assessment

### PDF Import Dialog

- Drop zone: fa-file-pdf icon + "Upload your paper exam" label
- File input (hidden, `.pdf` only, ≤50 MB)
- After upload → Review step:
  - LocalBanner: "Found N questions — X matched to QB · Y will be added as new"
  - Per-question card: checkbox + stem preview (2 lines) + QB match badge + confidence %
  - "New question" badge for unmatched
- Footer: "N of N questions selected" · Cancel · **Create draft** (fa-file-import)

---

## 3. Builder Step 2 — Sections + Questions

### Sections Outline (`step2-sections-outline.tsx`)

| Element | Student Impact |
|---|---|
| Add section | Creates a named section break in the exam |
| Section title | Shown as section header to student between Q groups |
| Section instructions textarea | Section-level instruction text student reads before the Qs |
| Preread textarea | Pre-reading passage displayed alongside Qs in that section |
| Faculty / Collaborator chip | Read-only assignment; not shown to student |
| "Mark ready" / "Reopen" button | Internal workflow state; not student-visible |
| Question row: warning icons | fa-triangle-exclamation = missing rationale; fa-chart-line-down = poor PBI — admin only |
| Question row: PBI score | Point-Biserial Index — admin analytics only |
| "Add questions" toggle | Activates the section as the insertion target for Q picker |

**Inline section editors (when section is active):**
- Instructions textarea (blue left border) → student-facing
- Preread textarea (purple left border) → student-facing reading pane

### QB Search Bar (`step2-qb-search-bar.tsx`)

| Element | Notes |
|---|---|
| fa-sparkles icon + search input | "Search by topic, type, difficulty…" |
| Clear (X) button | Clears query |
| Active filter tags with remove (X) | Per filter: Difficulty · Type · Bloom's |
| Result count + sort label | "{N} questions · sorted by relevance + PBI" |

### Inline Question Editor (`step2-inline-editor.tsx`)

| Element | Notes |
|---|---|
| "Editing {code}" header | Read-only label |
| Copy & modify button (copy icon) | Creates a fork of the question before editing |
| Question stem textarea | Min-height 16; live edit |
| Rationale textarea | Highlighted in red border if missing |
| Cancel / Save to QB buttons | Save commits to the Question Bank |

---

## 4. Grading + Health

### Grading Settings Panel (`step2-grading-settings-panel.tsx`)

| Element | Type | Student Impact |
|---|---|---|
| Graded / Ungraded | Button group | Graded = score appears; Ungraded = no score displayed |
| Total marks | Number input | Denominator shown in student score summary |
| Negative marking | Checkbox | Penalty applied to student score on wrong answers |
| Fraction | Number input (0.01–1) | Fraction of marks deducted per wrong answer |

**Note:** "Ungraded" is disabled when assessment type is "Exam."

### Grading Tray (`step2-grading-tray.tsx`)

| Element | Student Impact |
|---|---|
| Select All checkbox | Bulk points assignment only |
| Distribute evenly button | Sets equal points across all Qs |
| Per-question points (inline edit) | Point value shown in student results per Q |
| Bonus star toggle | Bonus Qs don't count against total but add to student score |
| Negative deduction (monospace red) | Per-Q deduction shown in student score breakdown |
| Bulk "Set selected to N pts + Apply" | Batch-set points |

### Health Panel (`step2-health-panel.tsx`)

| Metric | Visible to Student? |
|---|---|
| Q count vs target | No — admin planning only |
| Estimated duration vs configured | No — admin only |
| Difficulty distribution (Easy/Med/Hard bars) | No |
| Bloom's level distribution | No |
| Topic coverage (objectives) | No |
| Missing rationale count | No |
| Poor PBI count | No |

---

## 5. Question Detail Sheet (`question-detail-sheet.tsx`)

Opened from the builder by clicking a question row. 5 tabs.

### Details Tab

**Left: Question Preview (all types)**

| Type | Preview Elements |
|---|---|
| MCQ | Stem + radio affordances + correct answer indicator + rationale |
| MSQ | Stem + checkbox affordances + "Select all that apply" label |
| True/False | Large T / F toggle buttons |
| Essay | Response area + word count badge + rubric table |
| Ordering | Numbered sequence cards with rationale |
| Matching | Prompt → answer pairs with key labels |
| Fill blank | Stem with answer blanks filled + correct answers list |
| Short Answer | Response area + keyword list + rubric |
| Extended Matching | Option pool + numbered sub-questions |
| Hotspot | Image placeholder + circular correct zone + rationale |

**Right: Meta Sidebar (224px)**
- Quick stats: Usage · Correct % · Avg time
- Location: QB folder breadcrumb path
- Classification: Tags (comma-separated) · Bloom's badge

### Stats Tab

| Element | Notes |
|---|---|
| Correctness %, Avg time, Difficulty | Aggregate analytics across all usages |
| PBI tile | Large number + "Low/Fair/Good" label + horizontal bar with zone markers (0.00 | 0.20 fair | 0.30 good | 1.00) |
| Option distribution table | Per-option: Count · % · bar chart (MCQ/MSQ) |
| Config grid | Type · Layout · Bloom's · Difficulty |

### Versions Tab

- Timeline with vertical line + dots
- Per version: v# label, "(Original)" indicator, "Viewing" badge or "View this version" button
- Modified by + date + changes list
- "Used in assessments" tag chips

### Collaborators Tab

- Avatar (initial + color coded)
- Name + role
- Permission chip: Owner / Edit / View

### Config Tab — Full Settings Accordion

| Section | Controls | Student Impact |
|---|---|---|
| **Bonus** | Toggle switch | Bonus Q doesn't reduce total marks if wrong |
| **Randomize options** | Toggle | Answer order randomized per student (MCQ/MSQ/T-F/Ordering/EM) |
| **Negative marking** | Chips: Inherit · Off · −¼ · −⅓ · −½ | Score deduction per wrong answer |
| **MSQ scoring mode** | Radio: Standard · All-or-nothing · Partial additive · Partial proportional · Right minus wrong | How partial selections score |
| **Answer matching** | Chips: Exact match · Contains | How student text answer is evaluated |
| **Case sensitive** | Checkbox (Fill blank / Short Answer) | "apple" ≠ "Apple" if on |
| **Alternate spellings** | Text input + chip tags | Additional accepted answers |
| **Partial credit per pair** | Toggle (Matching) | Each matched pair scores independently |
| **Extra distractors** | Toggle (Matching) | More distractor pairs shown than needed |
| **Multiple hotspot areas** | Toggle | Student can mark >1 zone |
| **Partial credit per area** | Toggle | Each correct zone scores independently |
| **Word limit** | Number input 10–5000 (Essay) | Hard cap shown in student essay field |
| **Blind grading** | Toggle (Essay) | Student names hidden from grader |
| **Calculator** | Chips: Inherit · Off · Basic · Scientific | Tool shown in student toolbar for this Q |
| **Text highlighting** | Chips: Inherit · On · Off | Highlight tool available to student |
| **Answer elimination** | Chips: Inherit · On · Off | Strikethrough icon per answer option (MCQ/MSQ) |
| **On-screen keyboard** | Toggle | Virtual keyboard shown in student footer |
| **Reference materials** | Label + URL inputs + remove button | Attachments student can open during this Q |

**Sheet Footer:**
- Remove from section (fa-circle-minus)
- Edit question (fa-pen) → opens full question editor

---

## 6. Question Editor (`question-editor.tsx`)

The full-featured question editor. Used via `/questions/new`, `/questions/[id]/edit`, and inline from the builder.

### Top Controls

| Element | Notes |
|---|---|
| Type picker grid | Button per type (ghost, sm, rounded-full); active state shown |
| Cancel | outline, sm |
| Save draft | outline, sm — disabled if validation errors |
| Save to bank | default or outline, sm — disabled if validation errors |
| Add to assessment | default, sm — only shown when `showAddToAssessment` prop is true |

### AI Enhancement Buttons (above options)

| Button | Action |
|---|---|
| Tighten with AI (fa-sparkles, ghost, text-xs) | Rewrites stem for clarity |
| Suggest distractors (fa-sparkles, ghost, text-xs) | Generates 2-3 plausible wrong answers |

When AI suggestion returns, two inline cards appear:
- **Accept** (default, sm) — applies the suggestion
- **Reject** (ghost, sm, muted) — dismisses

### Question Types and Their Controls

#### MCQ (Multiple Choice Question)

| Control | Student Impact |
|---|---|
| Stem textarea | The question text |
| Per-option: correct radio | The one correct answer |
| Per-option: lock/unlock (icon-sm, ghost) | Locked option never randomizes position |
| Per-option: remove (icon-sm, ghost) | Removes distractor |
| Add option (outline, sm) | Adds a new distractor |
| Shuffle options toggle | Options shown in random order per student |

**Student renders:** Radio group, options A–D (or more), one selectable.

#### MSQ (Multiple Select Question)

Same as MCQ but:
- Correct answers use **checkboxes** (multi-select)
- Adds **Partial credit toggle** (QBToggle)
- Scoring mode set in Config tab

**Student renders:** Checkbox group with "Select all that apply" subtext.

#### True/False

| Control | Student Impact |
|---|---|
| True radio (fa-circle-check) | Sets "True" as correct |
| False radio (fa-circle-xmark) | Sets "False" as correct |
| Rationale textarea | Shown after student answers (if results enabled) |

**Student renders:** Large T / F button pair.

#### Short Answer

| Control | Student Impact |
|---|---|
| Main answer input | Primary correct answer |
| Alt 1, Alt 2… inputs | Additional accepted answers |
| Add alternative (outline, sm) | Adds more accepted variants |
| Remove answer (icon-sm, ghost) | Removes a variant |
| Case-sensitive toggle | Exact case required if on |

**Student renders:** Text input field, no hints.

#### Numeric

| Control | Student Impact |
|---|---|
| Answer (number input) | Exact correct value |
| Tolerance ± (number input) | Accepted range around the answer |
| Units (text input) | Unit label shown to student (e.g., "kg") |

**Student renders:** Number input + unit label.

#### Essay

| Control | Student Impact |
|---|---|
| Word limit (number input) | Hard cap counter shown in student text area |
| Rubric table | Criterion · Weight (%) · Description — not student-visible |
| Add criterion (outline, sm) | Adds grading row |
| Remove criterion (icon-sm, ghost) | Removes row |

**Student renders:** Large textarea with word count, no rubric.

#### Fill in the Blank

| Control | Student Impact |
|---|---|
| Sentence template textarea | Uses `[[ ]]` syntax to mark blanks |
| Student-facing preview card | Shows how blanks render |
| Per-blank: accepted answers (pipe-separated) | All pipe-separated values are valid |
| Per-blank: Aa toggle (case-sensitive) | Each blank can have independent case sensitivity |

**Student renders:** Inline text inputs embedded in sentence.

#### Matching

| Control | Student Impact |
|---|---|
| Term input ↔ Match input pairs | Left column → right column matching |
| Add pair (outline, sm) | More pairs added |
| Remove pair (icon-sm, ghost) | Removes a pair |

**Student renders:** Two-column matching interface (drag or dropdown).

#### Ordering

| Control | Student Impact |
|---|---|
| Step inputs | The items to put in order |
| Move up / Move down (icon-sm, ghost) | Reorders in editor (correct order) |
| Remove (icon-sm, ghost) | Removes a step |
| Add step (outline, sm) | Adds more items |

**Student renders:** Draggable list, student sorts items.

#### Hotspot

| Control | Student Impact |
|---|---|
| Image URL input | Background image for the hotspot question |
| Upload button (outline, sm) | File upload alternative |
| Canvas click interaction | Click to mark correct zone(s) |
| Remove hotspot (destructive, icon-xs) | Removes a marked zone |

**Student renders:** Image with clickable areas.

#### K-Type (Complex MCQ with Statements)

| Control | Student Impact |
|---|---|
| Statement inputs | Individual T/F claims |
| True / False buttons per statement | Sets correct per statement |
| Add statement (ghost, sm) | Adds a claim |
| Remove statement (ghost, sm, conditional) | Min 2 statements required |
| Combination key buttons (12×12 grid) | K-Type answer combinations |

**Student renders:** List of statements + combination selection.

#### Extended Matching

- Option pool (shared distractors)
- Numbered sub-questions each referencing the same pool

### Right Rail — Metadata Panel

| Control | Notes |
|---|---|
| Course objective Select | Dropdown with all course objectives |
| AI suggest objective (ghost, xs) | Auto-maps the question to its best objective |
| Difficulty Select | Easy · Medium · Hard |
| Bloom's level Select | Remember · Understand · Apply · Analyze · Evaluate · Create |
| Custom labels | Comma-separated free-text tags (Gmail-style labels) |
| Standards multi-select | "Map to standard…" button → grouped popup with checkboxes |

### Right Rail — Workflow Panel

| Control | Notes |
|---|---|
| Confidence marker | High / Low / Clear — faculty reviewer confidence flag |
| Bulk-import status | Read-only status text (not student-visible) |

### Validation

- LocalBanner (error variant) — blocks save if errors present
- LocalBanner (info variant) — warnings that don't block save

### Location Selector (New Question only — `add-question-client.tsx`)

| Control | Notes |
|---|---|
| "Locations" label + folder badge chips | Shows currently selected QB folders |
| Remove chip (X) per folder | Removes that folder assignment |
| "+ Add location" popover (ghost, xs) | Search + grouped folder list with check icons |

---

## 7. AI Generate Modal (`ai-generate-modal.tsx`)

Three views: Setup → Generating → Results

### Setup View

| Element | Type | Notes |
|---|---|---|
| Objectives scope | Chip badges with count | Shows which objectives are in scope |
| "What do you need?" | Textarea (`id="ai-prompt"`) | Prompt describing question intent |
| Count stepper | − [N] + (range 1–10) | Number of questions to generate |
| Difficulty chips | Mixed · Easy · Medium · Hard | Quick filter |
| Bloom's chips | Mixed · Apply · Analyze · Evaluate | Quick filter |
| LocalBanner (info) | "AI drafts are starting points" | Permanent reminder |
| Cancel · Generate N questions | outline + default buttons | — |

### Generating View

- Animated spinner with AI icon
- "Drafting N questions…" text
- Animated progress bar

### Results View

| Element | Notes |
|---|---|
| "Generated X drafts from Y objectives" | Summary |
| Select all (ghost, sm) | Selects all draft cards |
| Per-draft card: Checkbox | Include/exclude this draft |
| Per-draft: DifficultyChip, BloomChip | Classification chips |
| Per-draft: Objective title | fa-bullseye icon + title |
| Per-draft: Stem text | The generated question text |
| Per-draft: Options list (A/B/C/D) | Correct answer highlighted |
| Per-draft: Rationale box | Explanation of correct answer |
| Per-draft: Refine button | Sends back to AI for revision |
| Per-draft: Reject button | Removes this draft |
| "N of X selected" display | Footer count |
| ← Adjust prompt (outline) | Returns to Setup |
| Add to Question Bank / acceptLabel (default) | Accepts selected drafts |

---

## 8. Import from PDF (`import-assessment-modal.tsx`)

Two-step flow.

### Upload Step

- Drop zone (dashed border, fa-file-pdf, brand-color icon)
- "Upload your paper exam" heading + PDF up to 50 MB subtext
- "Choose file" button (default, sm) wrapping hidden file input
- Parsing status: fa-spinner fa-spin + "Parsing {filename}…"

### Review Step

- LocalBanner (info, fa-wand-magic-sparkles): "Found N questions — X matched · Y new"
- Per-question card (checkbox + stem + badge):
  - **QB match**: fa-link badge (secondary) + matched title + confidence %
  - **New question**: outline badge "New question"
- Excluded cards: opacity 0.5, muted border
- Footer: "N of N questions selected" · Cancel · Create draft (fa-file-import)

---

## 9. QB Modals (`qb-modals.tsx`)

### Request Edit Access Modal

Shown when a faculty tries to edit a question they don't own.

| Element | Notes |
|---|---|
| Header: fa-lock-keyhole-open icon in brand tint circle | Visual context |
| Question title preview (muted, truncated to 80 chars) | Shows which Q they're requesting access for |
| Message Textarea (optional, 3 rows) | Reason for request |
| Cancel · Send Request (fa-paper-plane, default) | Buttons |
| Success state: fa-circle-check + "Request sent" | Auto-closes after 1.8s |

---

## 10. Send for Review Dialog (`send-for-review-dialog.tsx`)

| Element | Type | Notes |
|---|---|---|
| Reviewer(s) * | Checkbox list | Multi-select; at least one required |
| Message | Textarea (3 rows, min-h 68px, no resize) | Optional |
| Due date | HTML5 date input | Optional |
| Cancel · Send for review (fa-paper-plane, default) | Buttons | Submit disabled until ≥1 reviewer checked |

---

## 11. QB State — Data Model (`qb-state.tsx`)

Key state fields that control what students see:

| Field | Student Impact |
|---|---|
| `questions[].type` | Determines student Q layout |
| `questions[].difficulty` | Used in difficulty distribution visible to admin |
| `questions[].blooms` | Bloom's distribution in health panel |
| `questions[].pbis` / `pbisDir` | Point-Biserial Index — analytics only, not student-visible |
| `questions[].usage` | How many times used — admin only |
| `questions[].tags` | Labels — admin only |
| `folders` / `folderPath` | QB organization — admin only |
| `selectedQuestionIds` | Bulk selection for delete/copy/move — admin only |
| `columnOrder` | QB table column order — admin only |

**Default column order:** type · difficulty · blooms · location · creator · lastEditedBy · usage · pbis · version

---

## 12. Creation → Student Rendering Map

| Admin Setting | Where Set | Student Sees |
|---|---|---|
| Assessment title | Step 1 / Canvas header | `<h1>` in ExamToolbar |
| Duration | Step 2 / Canvas | Timer in ExamToolbar; pulses red in last 5 min |
| Mode (Proctored/Self-paced) | Step 2 | Affects available tools and monitoring |
| Show results immediately | Step 2 | Score + correct answers on submit screen |
| Section title | Sections Outline | Section header between Q groups |
| Section instructions | Sections Outline (blue textarea) | Instruction block before Q group |
| Preread text | Sections Outline (purple textarea) | Reading pane alongside Q group |
| Q stem | Question Editor | Main question text |
| Q options | Question Editor | Selectable answer choices |
| Shuffle options ON | Config / Editor toggle | Options in random order per student |
| Rationale | Question Editor | Shown after submission (if results enabled) |
| Word limit (Essay) | Question Editor | Hard cap counter in student textarea |
| Randomize options | Config tab | Randomizes answer order |
| Negative marking | Config tab / Grading Settings | Deduction shown in score breakdown |
| Calculator (Basic/Scientific/Off) | Config tab | Calculator tool in exam toolbar |
| Text highlighting (On/Off) | Config tab | Highlight tool in exam toolbar |
| Answer elimination (On/Off) | Config tab | Strikethrough icon per option |
| On-screen keyboard (On) | Config tab | Virtual keyboard in exam footer |
| Reference materials | Config tab | Attachments accessible during that Q |
| Case sensitive | Config tab / Editor | Exact case required for short answer |
| Alternate spellings | Config tab | Additional accepted answers |
| Partial credit | Config tab | Fraction of marks awarded for partial match |
| Blind grading | Config tab | Student names hidden from grader |
| Points per Q | Grading Tray | Shown in student score breakdown |
| Bonus Q | Grading Tray (star) | Marked "(Bonus)" — doesn't penalize if wrong |
| Hold for review | Step 2 | Score withheld until faculty releases |
| Objective mapping | Metadata panel | Not student-visible; used in curricular analytics |
| Bloom's / Difficulty | Metadata panel | Not student-visible; used in health panel |
| PBI | Stats tab (read-only) | Not student-visible; admin quality signal |

---

## 13. Question Type → Student Layout Reference

| Type Code | Admin Label | Student Layout |
|---|---|---|
| MCQ | Multiple Choice | Vertical radio list, one selectable |
| MSQ | Multiple Select | Vertical checkbox list, "Select all that apply" |
| TF | True/False | Large T / F button pair |
| SA | Short Answer | Single-line text input |
| NUM | Numeric | Number input + unit label |
| ESS | Essay | Large textarea + word count counter |
| FIB | Fill in the Blank | Inline text inputs embedded in sentence |
| MAT | Matching | Two-column drag or dropdown |
| ORD | Ordering | Draggable card list |
| HOT | Hotspot | Clickable image with zone affordances |
| KTY | K-Type / Complex MCQ | Statement list + combination picker |
| EMQ | Extended Matching | Shared option pool + numbered sub-questions |

---

## 14. Icon Reference — All Icons Used in Creation Flows

| Icon class | Location | Purpose |
|---|---|---|
| fa-file-plus | Canvas card | "Build new assessment" |
| fa-copy | Canvas card | "Copy existing" |
| fa-database | QB folder picker | Select QB source |
| fa-file-pdf | PDF import | Upload PDF |
| fa-wand-magic-sparkles | AI generate | AI generate modal trigger |
| fa-sparkles | Question editor | "Tighten with AI" / "Suggest distractors" |
| fa-paper-plane | Send for review · Submit exam | Send action |
| fa-circle-check | T/F True option · Success states | Correct / True |
| fa-circle-xmark | T/F False option | Incorrect / False |
| fa-bookmark / fa-flag | Q rows in builder | Flagged/bookmarked question |
| fa-triangle-exclamation | Section outline warning | Missing rationale |
| fa-chart-line-down | Section outline warning | Poor PBI |
| fa-pen | Sheet footer · Row actions | Edit question |
| fa-circle-minus | Sheet footer | Remove Q from section |
| fa-lock-keyhole-open | QB modal | Request edit access |
| fa-link | PDF review cards | QB match badge |
| fa-file-import | PDF modal footer | "Create draft" |
| fa-upload | PDF drop zone | File upload |
| fa-spinner fa-spin | Loading states | Parsing / generating |
| fa-bullseye | AI drafts | Objective label |
| fa-clipboard-list-check | Create modal step 3 | Confirmation summary |

---

> **Last updated:** 2026-06-01
> **Owner:** Design (Romit) — update after any builder or question-editor change
