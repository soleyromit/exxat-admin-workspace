# Marks & Grading — Assessment Builder
**Date:** 2026-05-25
**Status:** Approved
**PRD ref:** §4.1.1 Phase 1, §4.4
**Decision refs:** af529725, f59cfbe4, 66898189

---

## 1. Problem

The assessment builder produces assessments with no grade. Duration is configured; marks are not. Without a points system the platform cannot compute scores, support negative marking, or produce the graded vs. ungraded distinction the PRD requires for V0.

---

## 2. Scope

**In:** Total marks, per-question point entry, graded/ungraded toggle, assessment-level negative marking, bonus questions, grading tray UI, Review step point summary.

**Out (Phase 2+):** Per-question negative marking override, section-level points budget enforcement as a hard gate, rubric-based grading (Essay type), partial credit for MSQ.

---

## 3. Data Model

Two existing interfaces in `lib/qb-types.ts` gain new fields. No new files.

```ts
interface AssessmentSettings {
  // --- NEW ---
  graded: boolean               // false = ungraded; only valid for Quiz / Assignment
  totalMarks: number            // default 100
  negativeMarking: boolean      // assessment-level toggle; applies to MCQ only in V0
  negativeMarkingFraction: number // default 0.25 — deducted per wrong answer
}

interface AssessmentQuestion {
  questionId: string
  order: number
  // --- NEW ---
  points: number                // default: Math.floor(totalMarks / questionCount) on tray open
  bonus: boolean                // default: false — see §5.8
}
```

Three derived values, computed via `useMemo` (following existing builder pattern):

| Derived | Formula |
|---|---|
| `totalAssigned` | `sum(questions[].points)` where `bonus === false` |
| `unassignedPts` | `settings.totalMarks - totalAssigned` |
| `sectionSubtotals` | `Map<sectionId, sum(section.questionIds → points)>` (bonus questions included in subtotal display but marked separately) |
| `bonusTotal` | `sum(questions[].points)` where `bonus === true` |

`defaultAssessmentSettings()` in `qb-types.ts` gains defaults: `graded: true`, `totalMarks: 100`, `negativeMarking: false`, `negativeMarkingFraction: 0.25`.

---

## 4. Step 1 — Details changes

Added to the right column of `DetailsStep`, below the existing Delivery toggles, as a new `Grading` section separated by a `<Separator />`.

### 4.1 Graded / Ungraded toggle

```
─── Grading ───────────────────────────────────────────

Weightage
  ● Graded      ○ Ungraded
```

- Rendered as two DS `<Button variant="ghost">` with `aria-pressed` — same pattern as assessment type picker.
- "Ungraded" is disabled (with tooltip: "Only available for Quiz and Assignment") when `settings.type === 'Exam'`.
- When switched to Ungraded: `totalMarks` and `negativeMarking` inputs are hidden (not destroyed — state preserved if toggled back).

### 4.2 Total marks input

```
Total marks
  [ 100 ] pts
```

- DS `<Input type="number">` min=1, step=1.
- Only shown when `graded === true`.
- Does not auto-redistribute existing question points on change — that's the faculty's explicit action via "Distribute evenly" in the tray.

### 4.3 Negative marking

```
[ ] Enable negative marking
    Deduct [ 0.25 ] pts per incorrect answer
```

- DS `<Checkbox>` + conditional DS `<Input type="number">` (step=0.05, min=0.01, max=1).
- Only shown when `graded === true`.
- Fraction field hidden until checkbox checked.
- Applied to MCQ question types only in V0.

---

## 5. Step 2 — Grading Tray

### 5.1 Toolbar toggle

A `pts` icon button added to the existing toolbar row (alongside the health panel `♥` toggle):

```tsx
<Button
  variant={showGrading ? 'secondary' : 'ghost'}
  size="sm"
  aria-label={showGrading ? 'Hide grading tray' : 'Show grading tray'}
  aria-pressed={showGrading}
  className="h-7 gap-1.5 px-2"
>
  <i className="fa-light fa-scale-balanced" aria-hidden="true" />
  <span className="text-xs">pts</span>
</Button>
```

- State: `const [showGrading, setShowGrading] = useState(false)` — hidden by default.
- Shown only when `settings.graded === true` and `activeAsmt !== null`.

### 5.2 Tray layout

Renders below the picker/outline layout (not overlaying it). Fixed height 240px, `borderTop: 1px solid var(--border)`, `background: var(--card)`.

```
┌─ Grading tray ─────────────────────────────────────────────────────────┐
│  □ select all   12 questions                                            │
│  Total: 87 / 100 pts  ⚠ 13 pts unassigned      [Distribute evenly]    │
│─────────────────────────────────────────────────────────────────────────│
│  □ │  # │ Question                           │  Pts  │  Applied neg    │
│─────────────────────────────────────────────────────────────────────────│
│  ── Section A ──────────────────────────  subtotal: 40 / 60 pts ────── │
│  □ │  1 │ Cardio pharm distractors…          │ [10]  │     −2.5        │
│  □ │  2 │ Beta blockers mechanism…           │ [10]  │     −2.5        │
│  ── Section B ──────────────────────────  subtotal: 47 / 40 pts ⚠ ─── │
│  □ │  5 │ Renal anatomy basics…              │ [15]  │     −3.75       │
│─────────────────────────────────────────────────────────────────────────│
│  [Set selected to…] [ 1 ] pts   [Apply]                                │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Tray columns

| Column | Detail |
|---|---|
| Checkbox | Multi-select for bulk operations |
| # | Question order number |
| Question | Truncated title (2-line clamp). `⚠` prefix for missing-rationale or low-PBI flags (carried from existing SectionsOutline logic) |
| Pts | Editable inline number input — click to edit, Tab advances to next row, Enter confirms |
| Applied neg | Read-only. Shows `pts × negativeMarkingFraction` as a negative value. Only rendered when `negativeMarking === true`. Hidden column otherwise. |

### 5.4 Section rows

- Section header rows are non-selectable separators showing section title + subtotal badge.
- Subtotal badge: `var(--muted-foreground)` when within fair share, `var(--chart-4)` (amber) when over. Over = section subtotal > `totalMarks × (sectionQCount / totalQCount)`. Soft warning only — no blocking.

### 5.5 Tray header

- "Total: X / Y pts" — `X` = `totalAssigned`, `Y` = `settings.totalMarks`.
- `⚠ N pts unassigned` appears in `var(--chart-4)` when `unassignedPts !== 0`.
- "Distribute evenly" button: sets all `question.points` to `Math.floor(totalMarks / n)`, then adds remainder to last question. Only active when `unassignedPts !== 0`.

### 5.6 Bulk edit

- Select rows via checkboxes → "Set selected to X pts" → "Apply" sets all selected `question.points` to X.
- "Select all" checkbox in header toggles all rows.
- Bulk controls rendered in tray footer, disabled when no rows selected.

### 5.7 Points default on question add

When `toggleQuestion()` adds a new question to the assessment:
- If `totalAssigned === 0` (no points set yet): new question gets `points: 0` — "Distribute evenly" handles first-time setup.
- If `totalAssigned > 0` (at least one question has points): new question inherits `Math.floor(totalMarks / (currentCount + 1))` as a default. A `LocalBanner variant="info"` in the tray header reads "Points redistributed — review totals." Dismissed on next tray interaction.

### 5.8 Bonus questions

A bonus question awards its points to students who answer correctly, but does not count against the total marks denominator. A student scoring 105/100 is valid.

**Tray column addition:**

```
│  □ │  # │ Question                  │  Pts  │ Bonus │  Applied neg │
│  □ │  3 │ Extra credit concept…     │  [5]  │  ★   │      —       │
```

- "Bonus" column renders a `<Button variant="ghost" size="sm" aria-pressed={bonus}>` with a `fa-light fa-star` icon (filled `fa-solid` when active).
- Toggling bonus sets `question.bonus = true` and adds a `★ Bonus` chip to that row's question label.
- Bonus questions are excluded from `totalAssigned` and the "Distribute evenly" calculation.
- Bonus questions are excluded from the "unassigned pts" warning — they are intentionally outside the total.
- Negative marking does not apply to bonus questions (wrong answer = 0, not negative). "Applied neg" cell shows `—` for bonus rows.

**Bulk:** Selecting bonus rows and using "Set selected to X pts" works normally — point value is independent of bonus status.

---

## 6. Step 3 — Review changes

### 6.1 Summary card

Adds "Total" as a 5th stat column alongside Questions / Duration / Password / Randomize:

```
Questions   Duration   Password   Randomize   Total
   12        90 min    Required      On       100 pts + 5 bonus
```

If `bonusTotal > 0`: appends `+ N bonus` in `var(--muted-foreground)` after the main pts value.
If `graded === false`: shows "Ungraded" in place of pts value.

### 6.2 Difficulty distribution card

Each difficulty row gains point totals and percentage of total marks:

```
Easy     4 Q   32 pts  (32%)
Medium   6 Q   48 pts  (48%)
Hard     2 Q   20 pts  (20%)
```

Points per difficulty = sum of `question.points` where `question.difficulty === level`.

### 6.3 Sections card

Adds a pts column to each section row:

```
1.  Section A     6 Q     60 pts
2.  Section B     5 Q     40 pts  +  1 bonus (5 pts)
```

Bonus questions within a section are counted separately with a `★` chip.

### 6.4 Unassigned points warning

If `unassignedPts !== 0`, renders above the Summary card using the existing `<LocalBanner variant="warning">` pattern:

```
⚠  13 pts unassigned — question point values don't add up to 100 pts.
                                              [Fix in Build →]
```

"Fix in Build →" calls `onBack()` and sets `showGrading(true)` — `setShowGrading` is passed down to `ReviewStep` as a prop (same pattern as `onBack`). Not a blocking gate — faculty can still send for review or publish.

---

## 7. Behaviour matrix

| Scenario | Result |
|---|---|
| `graded = false` | Tray toggle hidden. No pts shown anywhere. Review shows "Ungraded." |
| `graded = true`, tray never opened | All `question.points = 0`. Warning in Review. |
| `graded = true`, distribute evenly used | Points set. No warning if sum matches totalMarks. |
| Question removed | Points removed from sum. Warning re-evaluates. |
| `negativeMarking = false` | Applied neg column hidden from tray. |
| `totalMarks` changed in Step 1 | Existing question points unchanged. Tray header shows new mismatch. Faculty must redistribute manually or use "Distribute evenly." |
| Question marked bonus | Excluded from `totalAssigned`, "Distribute evenly", unassigned-pts warning, and negative marking. Points still configurable. |
| All questions are bonus | `totalAssigned === 0`, unassigned-pts warning suppressed (intentional). Review shows "0 pts + N bonus." |

---

## 8. Files changed

| File | Change |
|---|---|
| `lib/qb-types.ts` | Add 4 fields to `AssessmentSettings`; add `points` + `bonus` to `AssessmentQuestion`; update `defaultAssessmentSettings()` |
| `assessment-builder-client.tsx` | Grading section in `DetailsStep`; `showGrading` state + toolbar toggle; `GradingTray` component; Review step additions; unassigned-pts banner |
| No new files required | `GradingTray` is a local function component in the builder client (same pattern as `ReviewStep`, `DetailsStep`) |
