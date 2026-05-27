# Assessment Builder — Full PRD Compliance Spec

> **Method:** Every row extracted from a literal line-by-line read of the PRD. Each requirement cites the exact PRD section + quote, states current file:line evidence, and defines exactly what to build. Nothing is assumed from memory.

**Current state summary:**
- Types (`qb-types.ts`): 70% complete — major fields present, ~12 missing
- Canvas/Setup wizard (`create-canvas-client.tsx`): ~30% complete — name, type, date, duration, collaborators, copy-from-past present; intent, syllabus, distributions missing
- Builder MetricsPanel: shows count/score/time/difficulty/blooms — all PRD psychometric indicators missing
- Per-question grading config: type exists, **zero UI**
- Settings sheet: ~75% complete — 5 fields missing from type; 3 UI sections missing
- Regrading engine: types exist; analytics page has `curve` tab stub — UI not implemented
- Drag & drop: not built
- Student/proctor simulation: not built

---

## Tier 1 — Type Infrastructure (no UI, pure type changes)

These are prerequisite for all downstream UI work. Do these first as a single agent task.

### T1-A: Blueprint metadata fields on `AssessmentDraft`

**PRD 4.1 §Phase 2 — Collaboration Parameters:**
> "Primary Goal / Intent (e.g., 'Evaluating foundational knowledge of cardiovascular pharmacology')"
> "Target Topic Weightage (e.g., 40% Anatomy, 60% Physiology)"
> "Target Difficulty Distribution (e.g., 30% Easy, 50% Medium, 20% Hard)"
> "Target Question Type Distribution (e.g., 60% MCQ, 20% MSQ, 20% Essay)"

**Current:** `AssessmentDraft` at `lib/qb-types.ts:246` has no intent, no target distributions. `Assessment.diffDistribution` records actuals, not targets.

**Add to `AssessmentDraft`:**
```ts
primaryIntent?: string                        // free-text exam goal
targetDiffDistribution?: Record<QDiff, number> // target %, e.g. {Easy:30, Medium:50, Hard:20}
targetTypeDistribution?: Partial<Record<QType, number>> // target %, e.g. {MCQ:60, MSQ:20, Essay:20}
syllabusUrl?: string                           // uploaded syllabus reference
```

**File:** `lib/qb-types.ts` — add inside `AssessmentDraft` interface

---

### T1-B: Missing `AssessmentSettings` fields

**PRD 4.5 §Security:**
> "A separate Resume password can be required to unlock the interface after an authorized break."

**PRD 4.5 §Breaks:**
> "Control over breaks: define maximum breaks allowed, or permit undefined/unauthorized breaks."

**PRD 4.5 §Target Audience:**
> "Exams can be published to all students or specific subsets."

**PRD 4.5 §Three-stage window:**
> "Openable Date (Pre-Flight): When students can officially launch the exam interface to view final starting instructions and securely download the exam data to their browser cache before starting the timer."

**Current:** `AssessmentSettings` at `lib/qb-types.ts:178` has `password` (start), `visibleDate`, `openDate`, `downloadWindowHours`. No resume password, no breaks, no audience targeting, no pre-flight date separate from `openDate`.

**Note on pre-flight date:** The PRD's "Openable Date" (pre-flight cache) differs from `openDate` (timer start). Currently `downloadWindowHours` is relative — converting to an explicit `openableDate: string | null` allows coordinators to set it independently. Keep `downloadWindowHours` for backward compat (used as fallback when `openableDate` is null).

**Add to `AssessmentSettings`:**
```ts
resumePassword: string           // separate from start password; empty = no resume password
maxBreaks: number | null         // null = unlimited; 0 = no breaks allowed
allowUnauthorizedBreaks: boolean // true = students can take breaks without proctor approval
openableDate: string | null      // pre-flight cache date (when students can enter pre-exam screen)
publishToAll: boolean            // true = all enrolled students; false = use studentGroupIds
studentGroupIds: string[]        // IDs of specific student groups to receive this exam
```

**Add to `defaultAssessmentSettings()`:**
```ts
resumePassword: '',
maxBreaks: null,
allowUnauthorizedBreaks: false,
openableDate: null,
publishToAll: true,
studentGroupIds: [],
```

**File:** `lib/qb-types.ts`

---

### T1-C: Missing `AssessmentSection` fields

**PRD 4.4 §Pre-reads:**
> "Pre-reads include dedicated read timers (with an option to include or exclude pre-read time in overall duration)."

**PRD 4.4 §Warning Alarms:**
> "Configure visual warning alarms at the Assessment level and Section level (defaults to a 5-minute warning before the timer expires)."

**Current:** `AssessmentSection` at `lib/qb-types.ts:226` has `prereadText`, `timeLimitMinutes`. No preread timer, no section-level warning alarm.

**Add to `AssessmentSection`:**
```ts
prereadTimerMinutes?: number | null       // dedicated read timer; null = no timer
excludePrereadFromDuration?: boolean      // true = preread time does not count against overall clock
sectionWarningAlarmMinutes?: number | null // section-level alarm; null = inherit assessment default
```

**File:** `lib/qb-types.ts`

---

### T1-D: Missing `QuestionGradingConfig` fields for Match and Hotspot

**PRD 4.4 §Match the Following:**
> "Partial credit per correctly matched pair, and Extra Distractors (more target answers than prompts to prevent elimination guessing)."

**PRD 4.4 §Hotspot Image:**
> "Define target areas using circles/polygons, allow multiple hotspots with partial credit."

**Current:** `QuestionGradingConfig` at `lib/qb-types.ts:126` has MSQ modes, fill-blank config, essay config, post-exam flags. Missing Match and Hotspot specific configs.

**Add to `QuestionGradingConfig`:**
```ts
matchPartialCredit?: boolean         // award partial credit per correctly matched pair
matchExtraDistractors?: boolean      // include extra answer options beyond prompt count
hotspotMultipleAllowed?: boolean     // student can select multiple hotspot areas
hotspotPartialCredit?: boolean       // partial credit per correctly selected hotspot area
```

**Note:** Hotspot area geometry (polygon/circle coordinates) requires a richer data model scoped to the Question itself, not the grading config. That's a Phase 2 authoring feature (question editor scope, not builder scope).

**File:** `lib/qb-types.ts`

---

## Tier 2 — Blueprint Setup Canvas

### T2-A: Primary intent field

**PRD 4.1 §Phase 2:**
> "Primary Goal / Intent (e.g., 'Evaluating foundational knowledge of cardiovascular pharmacology')"

**Current:** `create-canvas-client.tsx` has name, type, date, duration, collaborators, prompt. No intent field. `CanvasHeader` at line 89.

**What to build:**
- Add a short `<textarea>` labeled "What is this exam evaluating?" below the assessment name in `CanvasHeader`
- Persist as `primaryIntent` on the draft when `handleSubmit` calls `addDraft()`
- Character limit: 280; show remaining count

**File:** `create-canvas-client.tsx` — `CanvasHeader` component + `handleSubmit`

---

### T2-B: Target distributions

**PRD 4.1 §Phase 2:**
> "Target Difficulty Distribution (e.g., 30% Easy, 50% Medium, 20% Hard)"
> "Target Question Type Distribution (e.g., 60% MCQ, 20% MSQ, 20% Essay)"

**Current:** Not in canvas UI or draft store.

**What to build:**
- Collapsible "Blueprint targets" section in `CanvasBody` (below the prompt textarea)
- Two sub-rows, each showing 3 chips: **Difficulty** (Easy / Medium / Hard) and **Type** (MCQ / MSQ / Essay)
- Each chip has a `%` input (0–100); sum auto-displayed; warn if sum ≠ 100
- Chips are optional — if left blank, no target recorded
- Persist as `targetDiffDistribution` and `targetTypeDistribution` on draft

**File:** `create-canvas-client.tsx` — `CanvasBody` component + `handleSubmit`

---

### T2-C: Syllabus reference

**PRD 4.1 §Phase 2:**
> "Manual Syllabus/Reference Upload (Attaching the course PDF so reviewers can manually verify the exam against the syllabus)"

**Current:** No syllabus field anywhere.

**What to build:**
- File input (`.pdf` only) labeled "Attach syllabus (optional)" in `CanvasBody`
- In mock: convert to object URL; store URL as `syllabusUrl` on draft
- Show attached filename with a remove button when selected

**File:** `create-canvas-client.tsx` — `CanvasBody` component

---

## Tier 3 — MetricsPanel Psychometrics

**PRD 4.2.1:**
> "Difficulty Index: Average difficulty rating across all questions (based on historical correct-answer rate)"
> "Upper 27% vs. Lower 27%: Comparison of average scores between top and bottom performing student cohorts"
> "Discrimination Index: Average discrimination index"
> "Average Point-Biserial Correlation"
> "Questions that are pulling the assessment's overall psychometric profile out of expected range… are automatically flagged inline within the question list"

**Current MetricsPanel** (`assessment-builder-client.tsx:3391`): shows total count, total score, time estimate, difficulty bar chart (count only), Bloom's breakdown. **No psychometric indicators.**

**Current outlier flagging:** Health flags at `assessment-builder-client.tsx:1383` show `missing-rationale` and `poor-pbis` — but the PRD requires flagging all psychometric outliers (negative point-biserial, near-zero discrimination index, extreme difficulty index) computed from mock data.

### T3-A: Psychometric row in MetricsPanel

**What to build** (add below the Difficulty section):
```
Psychometrics          [only shown when ≥1 question has pValue or pbis data]
─────────────────
Avg difficulty    0.68   [from question.pValue average]
Avg pt-biserial   0.31   [from question.pbis average]
Upper/Lower 27%   +12%   [mock: upper27Avg - lower27Avg, read from mock data]
```

- Compute averages from `activeAsmt.questions` mapped to their `MOCK_QB_QUESTIONS` data (`pValue`, `pbis`)
- Upper/lower 27% is mock data on `QuestionPsychometrics` in `faculty-mock-data.ts` — compute avg diff index for top 27% and bottom 27% of questions by pValue
- Show "—" when no data
- Color-code pt-biserial: green if > 0.2, amber if 0.1–0.2, red if < 0.1

**Files:** `assessment-builder-client.tsx` — `MetricsPanel` function + the `useMemo` that computes `timeMetrics`/`bloomsMetrics`

---

### T3-B: Inline psychometric outlier flag in question list

**PRD 4.2.1:**
> "Flagged questions are visually highlighted so instructors can immediately identify and review or replace them before publishing."

**What to build:**
- When a question's `pbis < 0.1` OR `pValue < 0.15` OR `pValue > 0.9`, add it to `healthFlags` as `{ type: 'poor-discriminator', questionId }` or `{ type: 'extreme-difficulty', questionId }`
- Extend `QuestionHealthFlag` union in `lib/qb-types.ts`:
  ```ts
  | { type: 'poor-discriminator'; questionId: string; pbis: number }
  | { type: 'extreme-difficulty'; questionId: string; pValue: number }
  ```
- The existing health flag icon at `assessment-builder-client.tsx:1387` already renders for any health flag — extend its `title` to describe the specific type

**Files:** `lib/qb-types.ts` (type union), `assessment-builder-client.tsx` (healthFlags useMemo + flag icon title)

---

## Tier 4 — Settings Sheet Missing UI

### T4-A: Delivery — pre-flight date, resume password, breaks

**PRD 4.5 §Three-stage window + Security + Breaks**

**What to build** (new section in settings sheet, after the Scheduling section):

**Section header: "Delivery"**

1. **Openable date (pre-flight)** — `datetime-local` input labeled "Pre-flight opens (students can cache exam)"
   - `patchSettings({ openableDate: ... })`
   - Help text: "Students can enter the pre-exam screen and download exam data starting from this time."

2. **Resume password** — `text` input labeled "Resume password (optional)"
   - `patchSettings({ resumePassword: ... })`
   - Help text: "Required to resume after an authorized break. Leave blank to skip."

3. **Breaks** — two controls in a row:
   - Number input: "Max breaks allowed" (0–20; 0 = no breaks; leave blank = unlimited → `null`)
   - Toggle: "Allow without proctor approval" → `allowUnauthorizedBreaks`

**File:** `assessment-builder-client.tsx` — settings sheet, after the existing Scheduling section (around line 4016)

---

### T4-B: Audience targeting

**PRD 4.5:**
> "Exams can be published to all students or specific subsets."

**What to build** (new row in settings sheet, under Scheduling or a new "Audience" section):

- Toggle labeled "All enrolled students" → `publishToAll`
- When off: show a multi-select chip list of student groups (mock: 3–4 named groups per course)
- Persist as `studentGroupIds`

**File:** `assessment-builder-client.tsx` — settings sheet

---

### T4-C: Section assign sheet — preread timer + warning alarm

**PRD 4.4 §Pre-reads:**
> "Pre-reads include dedicated read timers (with an option to include or exclude pre-read time in overall duration)."

**PRD 4.4 §Warning Alarms:**
> "Configure visual warning alarms at the Assessment level and Section level"

**What to build** in `SectionAssignSheet` (after existing preread textarea ~line 5660):

1. **Preread timer** (shown only when `prereadText` is non-empty):
   - Number input: "Reading time limit (min)" → `prereadTimerMinutes`
   - Toggle: "Exclude from total duration" → `excludePrereadFromDuration`

2. **Section warning alarm** (after section timer, ~line 5705):
   - Number input: "Warning alarm" with "min before section ends" label → `sectionWarningAlarmMinutes`
   - Placeholder "—" means inherit assessment default

**File:** `assessment-builder-client.tsx` — `SectionAssignSheet` component

---

## Tier 5 — Per-Question Grading Config UI

**PRD 4.4:**
> "MCQ: Option Randomization, Distractor Locking, Negative Marking"
> "MSQ: Option Randomization, Distractor Locking, All-or-Nothing Scoring, Partial Credit (Additive/Proportional), Right-Minus-Wrong Scoring"
> "Fill in the Blank: Exact match vs 'Contains' logic, Case sensitivity toggles, alternate acceptable spellings"
> "Match the Following: Partial credit per correctly matched pair, Extra Distractors"
> "Essay: Enforce word limits and toggle Blind Grading"

**Current:** `QuestionGradingConfig` type fully defined. `question-detail-sheet.tsx` renders question preview but has **zero grading config UI**. The builder renders a Points/Bonus column but no per-question config access.

### T5-A: Grading config tray in `question-detail-sheet.tsx`

**What to build:**
A "Grading rules" collapsible section at the bottom of the sheet, below the question preview. Content is conditional on `question.type`:

**For MCQ:**
```
☐ Randomize options (per student)
Distractor lock: [none] [pin "E"] [pin "D" + "E"]   ← chip selector for distractorLockKeys
Negative marking: [off] [−0.25] [−0.33] [−0.5]     ← from assessment-level default; can override
```

**For MSQ:**
```
☐ Randomize options
Distractor lock: same as MCQ
Scoring mode: [Standard] [All-or-nothing] [Partial–additive] [Partial–proportional] [Right-minus-wrong]
```

**For Fill blank / Short Answer:**
```
Match mode: [Exact] [Contains]
☐ Case sensitive
Alternate spellings: [tag input — comma to add]
```

**For Matching:**
```
☐ Partial credit per pair
☐ Include extra distractors
```

**For Essay:**
```
Min word count: [number input]  (maps to question.minWordCount — already in Question type)
☐ Blind grading
```

**For True/False, Hotspot, Ordering, Extended Matching:**
```
☐ Randomize options   (where applicable)
```

**Data plumbing:**
- `question-detail-sheet.tsx` receives `gradingConfig?: QuestionGradingConfig` prop from the assessment
- Changes call a new `onUpdateGradingConfig(questionId, patch)` callback up to the builder
- Builder stores updates in `activeAsmt.questions[i].gradingConfig`

**Files:** `question-detail-sheet.tsx` (new "Grading rules" section), `assessment-builder-client.tsx` (pass `gradingConfig` + `onUpdateGradingConfig` down)

---

## Tier 6 — Drag & Drop

**PRD 4.3:**
> "Drag & Drop UI: Faculty can drag entire sections to reorder them or drag individual questions across section boundaries."
> "Bulk Selection: Checkboxes allow faculty to select multiple questions to move them into a new section"

**Current:** Up/down arrow buttons for within-section reorder. Bulk selection checkboxes exist for point-setting but NOT for cross-section move. No section reorder affordance.

### T6-A: Question drag within and between sections

**What to build:**
- Use `@dnd-kit/core` + `@dnd-kit/sortable` (install if not present; check `package.json` first)
- Each question row gets a drag handle (`fa-light fa-grip-dots-vertical`) as the first cell
- `SortableContext` wraps each section's question list with `verticalListSortingStrategy`
- On `onDragEnd`: if dropped within same section → reorder; if dropped into different section → move (update both `sourceSection.questionIds` and `destSection.questionIds`)
- Section drag: wrap the sections list in a separate `SortableContext`; drag handle on section header row

**Files:** `assessment-builder-client.tsx` — question table rows + SectionsOutline; install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

### T6-B: Bulk move to section

**PRD 4.3:**
> "Bulk Selection: Checkboxes allow faculty to select multiple questions to move them into a new section"

**Current:** Bulk selection exists (`bulkSelectedIds`). Bulk action bar shows "Set points" only. Missing: "Move to section" action.

**What to build:**
- Add a "Move to →" `<Select>` dropdown in the bulk action bar listing all section names
- On select: move all `bulkSelectedIds` questions to target section (remove from source sections, append to target `questionIds`)
- Clear `bulkSelectedIds` after move

**File:** `assessment-builder-client.tsx` — bulk action bar (~line 1238)

---

## Tier 7 — Regrading Engine UI (Post-Assessment)

**PRD 4.4.2:**
> "Invalidate Question (Full Credit): automatically awards full points to every student"
> "Discard Question (Exclude from Denominator): removes question from scoring pool"
> "Correct Option Override (Key Correction): instructors can edit the answer key"
> "Accept Multiple Correct Options: specify additional correct answers"
> "Points Adjustment: Add or subtract flat point values to all student scores"
> "Percentage-Based Curving: Apply percentage curves"
> "Historical Audit Logging: editing instructor ID, timestamp, explanation, before/after snapshot"

**Current:** `analytics-client.tsx` has a `curve` tab (line 53, 176, 203) but it's a stub (`StubButton` used — line 36 imports it). `QuestionGradingConfig.invalidated`, `discarded`, `correctedKey`, `additionalCorrectKeys` are typed but have no UI.

**What to build** in `analytics-client.tsx` `curve` tab:

**Section 1 — Per-question adjustments table:**
| Q# | Title | Action |
|---|---|---|
| Q1 | "Metformin in CKD…" | [Invalidate] [Discard] [Fix key ▾] [+ Accept] |

- "Invalidate": sets `gradingConfig.invalidated = true` → badge "Full credit" on row
- "Discard": sets `gradingConfig.discarded = true` → badge "Excluded" on row; total score denominator shown updated
- "Fix key": dropdown of A/B/C/D to set `correctedKey`
- "+ Accept": tag input to add `additionalCorrectKeys`

**Section 2 — Grade curve:**
```
Curve method: [Flat points ±] [Percentage curve] [Root curve] [Top score = 100%]
Value: [±N pts] or [N%]
Preview: score distribution histogram before → after
[Apply curve]
```

**Section 3 — Audit log:**
- Read-only table: instructor, timestamp, action, before/after snapshot (mock data)
- "Add note" input when applying any adjustment

**Files:** `analytics-client.tsx` — replace `curve` tab stub with real UI

---

## Tier 8 — Student & Proctor Simulation (Deferred)

**PRD 4.6:**
> "Student View Simulation: Allows faculty to preview and navigate the exam exactly as a student would"
> "Simultaneous Proctor Simulator: Launches a side-by-side or split-screen dashboard view"

**Current:** No simulation button or mode.

**Decision:** This requires launching the Assessment Taker UI (`apps/exam-management/assessment-taker/`) in a mock/preview mode with a student persona. This is an integration across two apps. **Defer to a separate planning session.** Placeholder: add a "Preview as student" button in the builder that opens the assessment-taker at `/preview?draftId=X` — the taker already loads questions from the QB. The split-screen proctor simulator is further deferred.

---

## Implementation Order

```
T1 (types, 1 agent)          → prerequisite for everything
T2 (canvas, 1 agent)         → unblocked after T1
T3 (MetricsPanel, 1 agent)   → unblocked after T1
T4 (settings, 1 agent)       → unblocked after T1
T5 (per-Q config, 1 agent)   → unblocked after T1
T6 (drag & drop, 1 agent)    → unblocked, heavier
T7 (regrading, 1 agent)      → unblocked, analytics page only
T8 (simulation)              → deferred
```

T2, T3, T4, T5 can run in parallel after T1. T6 and T7 are independent of each other.

---

## Verification Gate (after all tiers)

For each requirement row above, the verification agent must find `file:line` evidence of:
1. Type field present with correct TypeScript type
2. UI element present (input/toggle/select) with `aria-label`
3. State wiring correct (onChange calls the right setter/patcher)
4. Default value present in factory function (for AssessmentSettings fields)
