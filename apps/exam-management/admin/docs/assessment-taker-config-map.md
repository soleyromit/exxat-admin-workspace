# Assessment Taker Configuration Map

> Derived from reading all assessment-taker source files.
> Use this as the ground truth for what needs to be configured in the admin assessment builder and question creation flows.
> Every config listed here has a visible runtime effect on the student exam screen.

---

## How layout works (the key insight)

Layout is **not an explicit config toggle** — it is auto-detected from what media is attached to a question:

- **Media present** (image, video, audio, PDF, case-study tabs, table, passage, chart) → 50/50 split view: question + answer choices LEFT, media RIGHT labeled "Reference Material"
- **No media** → single centered column, max-width constrained

So configuring "layout" = choosing whether to attach media and what type. No separate layout picker needed.

---

## Configuration levels

### 1. Assessment level

| Config | Type | Runtime effect |
|---|---|---|
| Title | string | Header during exam + pre-exam screen |
| Type | quiz / midterm / final / practical / review | Badge in student dashboard |
| Course assignment | FK to course offering | Header during exam |
| Duration (base minutes) | number | Timer countdown (multiplied by accommodation factor) |
| High stakes | boolean | Immediate results vs faculty-review gate |
| Password | string (optional) | Step 0 of pre-exam flow — faculty announces verbally |
| Instructions | rich text | Step 2 pre-exam (Instructions screen) |
| Allow comments | boolean | Per-question flag/comment box shown during exam |
| Auto-advance | boolean | After MCQ selection, auto-moves to next question (quiz mode; Aarti: "by mistake if they do it it will be a big problem") |
| Global reference materials | string[] (file names) | "Reference" button in exam toolbar — opens panel with PDFs accessible at any question |
| Passing score | number (%) | Pre-exam summary and results display |
| Show correct answers on review | boolean | Post-submission review session |
| Show rationale on review | boolean | Post-submission review session |
| Review session window | dateRange (optional) | Unlocks scheduled review session post-publication |

### 2. Section level

Current `ExamSection` data model has: id, title, questionCount, timeLimitMinutes (deferred 2027), contentAreas[].

**Gaps not yet in data model — all visible to student:**

| Config | Type | Runtime effect |
|---|---|---|
| Instructions | string | Shown before section starts (or inline at section boundary) |
| Reference materials / documents | File[] | Available in reference panel scoped to this section |
| Attestation required | boolean | Student must check "I understand" before answering first question in this section |
| Calculator allowed | boolean | Shows calculator button for questions in this section (currently global) |
| Virtual keyboard allowed | boolean | Shows on-screen keyboard for text input questions in this section (currently global) |
| Time limit | number (minutes) | Section countdown (data model ready, deferred to 2027) |
| Faculty assignment | FK to faculty | Who fills questions for this section (admin-side only, transparent to student) |
| Fill target | { type: 'count' | 'points', value: number } | Admin-side tracking; affects student experience via total Q count and points |

### 3. Question level

All 20 question types available — each type determines which input controls the student sees:

| Type | Student control | Media/layout |
|---|---|---|
| `mcq` | Radio buttons with A/B/C/D keyboard shortcuts | Single column or split if has imageUrl |
| `image-mcq` | Radio buttons | Always split: image right |
| `video-mcq` | Radio buttons | Always split: video right |
| `audio` | Radio buttons | Always split: audio player right |
| `checkbox` | Multi-select checkboxes | Single or split |
| `case-study` | Radio buttons | Always split: tabbed clinical vignette right (HPI / Vitals / Imaging tabs) |
| `fill-blank` | Inline dropdown per blank in passage | Single (passage is part of interactive) |
| `highlight` | Click sentences to highlight | Single (no separate media pane) |
| `word-highlight` | Click words to highlight | Single |
| `cross-out` | Click to strike through options | Single |
| `matching` | Drag/select left→right pairs | Single |
| `anatomy` | Click hotspots on a diagram | Always split: diagram right |
| `short-answer` | Textarea (dictation supported) | Single + keyboard/calculator available |
| `dropdown` | Native select | Single |
| `table` | Radio buttons | Always split: data table right |
| `combined` | Radio buttons | Always split: image right |
| `pdf` | Radio buttons | Always split: embedded PDF viewer right |
| `essay` | Rich textarea (min/max words, pages) | Single + keyboard/calculator available |
| `passage` | Radio buttons | Always split: passage text right |
| `chart` | Radio buttons | Always split: line/bar chart right |

**Per-question fields that need config in the admin:**

| Field | Applies to |
|---|---|
| Points | All |
| Required | All |
| Question text / stem | All |
| Image attachment | mcq, combined, anatomy, case-study |
| Video attachment | video-mcq |
| Audio attachment | audio |
| PDF attachment | pdf |
| Caption | audio, video, chart |
| Options (A/B/C/D) | mcq, image-mcq, video-mcq, audio, checkbox, cross-out, dropdown, table, combined, pdf, passage, chart |
| Option images (parallel to options) | mcq (ECG strip variant) |
| Tabs (title + content[]) | case-study |
| Passage template + blanks | fill-blank |
| Sentence groups | highlight |
| Word passage | word-highlight |
| Match pairs (left → right options) | matching |
| Diagram URL + hotspots | anatomy |
| Table (headers + rows) | table |
| Max chars | short-answer |
| Essay prompt + min/max words + pages | essay |
| Passage text | passage |
| Chart data (title, xLabels, series) | chart |

**Question-level accessibility flags (currently global in App.tsx — should be per-question or per-section):**

| Flag | Currently determined by | Should be |
|---|---|---|
| Calculator available | Question type in CALCULATOR_TYPES set | Per question toggle (override) |
| Virtual keyboard available | Question type in KEYBOARD_TYPES set | Per question toggle (override) |

---

## Accessibility (student-controlled at runtime — not configurable by admin)

These are always available to students via the settings panel — admin cannot turn them off:

| Setting | Options |
|---|---|
| Theme | Light / Dark / High contrast |
| Text zoom | 80% – 150% (in 10% steps) |
| Color vision mode | Normal / Protanopia / Deuteranopia / Tritanopia / Achromatopsia |
| Voice narrator | On/Off — reads question text and options aloud via Web Speech API |
| Virtual keyboard | On-screen keyboard for text fields |
| Calculator | Floating scientific calculator |
| Keyboard shortcuts | A-D select, ←→ navigate, Enter next, Z flag |

---

## Pre-exam flow (5 steps, driven by assessment config)

1. **Password** — shown only if assessment has a password set
2. **System check** — always shown (browser, connectivity, storage)
3. **Instructions** — shows `assessment.instructions` + `referenceMaterials` list
4. **Accommodation confirmation** — shown only if student has an accommodation on file (owned by Student Services, not faculty)
5. **Ready to start** — summary: Q count, duration, passing score, result timing

---

## Navigation features during exam

- Linear prev/next navigation (StickyFooter)
- Question jump popover (grid of numbered bubbles, colored by answered/flagged/unanswered)
- Flag toggle per question (Z key shortcut)
- Submit review overlay (shows counts: answered / unanswered / flagged)
- Global reference panel (toolbar button, shows `assessment.referenceMaterials[]`)

---

## What this means for assessment creation config buckets

The admin builder config should be organized around these natural groupings — each visible to students at different points in the flow:

| Bucket | Configures | Visible to student |
|---|---|---|
| **Basics** | title, type, course, duration, high-stakes | Pre-exam summary + header |
| **Access control** | password, scheduling window | Pre-exam password step |
| **Instructions & attestation** | instructions, allow comments, global reference materials | Pre-exam instructions step + exam toolbar |
| **Scoring & results** | passing score, graded/ungraded, negative marking, show correct answers, show rationale | Post-exam results + review session |
| **Sections** | sections with faculty, targets, instructions, documents, attestation per section, calculator/keyboard flags | Section boundary screens + reference panel |
| **Auto-advance** | auto-advance (quiz mode only) | MCQ answer flow |
