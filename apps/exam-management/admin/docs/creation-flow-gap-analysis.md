# Creation Flow Gap Analysis

> Cross-reference between what the test-taker renders (config map) and what the admin builder + question editor currently configure.
> "Gap" = student-visible behaviour that has no admin-side authoring surface.

---

## Assessment level gaps

What `AssessmentSettings` currently has: type, password, randomize, scheduling dates, download window, instructions, acknowledgment, status, grading (total marks, negative marking), show rationale.

| Missing field | Taker effect | Priority |
|---|---|---|
| `isHighStakes: boolean` | Determines immediate results vs faculty-review gate. Currently no toggle exists. | P1 |
| `passingScore: number` | Shown in pre-exam summary and results screen. | P1 |
| `allowComments: boolean` | Per-question comment/flag box during exam. | P1 |
| `referenceMaterials: string[]` | Global "Reference" button in exam toolbar — PDFs available at every question. | P1 |
| `autoAdvance: boolean` | Quiz mode: after MCQ selection, auto-moves to next Q. Aarti: "by mistake it's a big problem." | P2 |
| `reviewShowsCorrectAnswers: boolean` | In review session: reveal correct answers. `showRationaleAfter` exists but is semantically different. | P2 |
| `reviewSessionStart / reviewSessionEnd` | Date window when scheduled review is open. | P2 |

---

## Section level gaps

What `AssessmentSection` currently has: id, title, facultyId, collaboratorId, prereadText (case-study preread), questionIds, contentAreaIds, randomize, status.

| Missing field | Taker effect | Priority |
|---|---|---|
| `fillTarget: { type: 'count' | 'points'; value: number }` | How many Q or how many pts the faculty must fill. Core to coordinator flow. `prereadText` is NOT a substitute. | P1 |
| `dueDate: string` | Faculty deadline for filling section. | P1 |
| `instructions: string` | Shown at section boundary before student answers Q1. Distinct from `prereadText` (case-study preread). | P1 |
| `documents: { name: string; url: string }[]` | Section-scoped reference PDFs in the reference panel. | P2 |
| `attestationRequired: boolean` | Student must check "I understand" before answering Q1 of this section. | P2 |
| `calculatorAllowed: boolean` | Calculator button shown for questions in this section. Currently global per Q type. | P2 |
| `keyboardAllowed: boolean` | On-screen keyboard shown for text input Qs in this section. Currently global per Q type. | P2 |
| `timeLimitMinutes: number` | Section countdown. Taker data model ready; deferred to 2027 in UI. | P3 |

---

## Question level gaps — types

Admin editor has 9 types: mcq, multi-select, true-false, essay, fill-blank, matching, ordering, hotspot, k-type.
Test-taker renders 20 types. 14 have no admin authoring surface:

| Taker type | Student control | Admin gap | Priority |
|---|---|---|---|
| `image-mcq` | Radio + image in right panel | No image attachment to MCQ | P1 |
| `video-mcq` | Radio + video in right panel | No video attachment | P1 |
| `audio` | Radio + audio player | No audio question type | P1 |
| `case-study` | Radio + tabbed clinical vignette (HPI/Labs/Imaging tabs) | Section `prereadText` is closest but wrong scope — it's per-section, not per-question, and has no tab structure | P1 |
| `short-answer` | Textarea + dictation, char limit | Essay exists but is long-form/rubric — short-answer is distinct (char limit, no rubric) | P1 |
| `highlight` | Click sentences to highlight correct one | No highlight type | P2 |
| `cross-out` | Click to strike through options | No cross-out type | P2 |
| `dropdown` | Native select | No dropdown type | P2 |
| `table` | Data table shown + radio MCQ | No table type | P2 |
| `combined` | Image + radio MCQ variant | No combined type | P2 |
| `pdf` | Embedded PDF + radio MCQ | No PDF question type | P2 |
| `passage` | Long passage text + radio MCQ | No passage type | P2 |
| `word-highlight` | Click words to highlight | No word-highlight type | P3 |
| `chart` | Line/bar chart rendered + radio MCQ | No chart question type | P3 |

Also in admin but NOT in taker (admin-only authoring types that need a taker renderer if kept):
- `ordering` — drag to reorder sequence (taker has no ordering renderer)
- `k-type` — complex true/false combination (taker has no k-type renderer)

---

## Question level gaps — fields

What `QuestionDraft` currently has: stem, type, payload (type-specific), standards, objectives, explanation, tags, difficulty, blooms.

| Missing field | Taker effect | Priority |
|---|---|---|
| `imageUrl / videoUrl / audioUrl / pdfUrl` | Media attachment — triggers automatic 50/50 split layout | P1 |
| `caption` | Shown below media in right panel | P1 |
| `required: boolean` | If false, student can skip without submission being blocked | P2 |
| `calculatorOverride: boolean` | Per-question override for calculator availability | P3 |
| `keyboardOverride: boolean` | Per-question override for keyboard availability | P3 |

---

## Summary: what to fix for the new builder design

### Must close before the new builder ships (P1)

**Assessment level:**
- Add `isHighStakes`, `passingScore`, `allowComments`, `referenceMaterials[]` to `AssessmentSettings` + builder UI

**Section level:**
- Add `fillTarget`, `dueDate`, `instructions` to `AssessmentSection` — these are the core of the coordinator two-persona model

**Question level (types):**
- Add media attachment (imageUrl/videoUrl/audioUrl/pdfUrl + caption) to `QuestionDraft` — this unlocks image-mcq, video-mcq, audio, combined, pdf without needing separate type branches; the split layout is auto-triggered in the taker
- Add `case-study` type with tab structure
- Add `short-answer` distinct from essay

**Question level (fields):**
- Add `required` toggle to `QuestionDraft`

### Defer to V2 (P2-P3)
- autoAdvance, review session window, review shows correct answers
- Section: documents, attestation, calculator/keyboard flags
- Question types: highlight, cross-out, dropdown, table, passage, word-highlight, chart
- Question: calculator/keyboard overrides

---

## What the two-persona model changes about section design

The coordinator-fills model (Aarti's directive) makes `fillTarget` the **most critical gap**:

- Coordinator creates sections, sets `fillTarget` (X questions OR Y points), assigns faculty + due date
- Faculty sees their fill target on login, uses QB/AI/import to reach it
- Progress tracks filled vs target: "8 of 15 filled", "32 of 40 pts covered"
- Coordinator can view, override, and add questions on faculty's behalf

None of this exists in the current `AssessmentSection` type or builder UI. The current section only tracks `questionIds` and `facultyId` — no target, no progress concept.
