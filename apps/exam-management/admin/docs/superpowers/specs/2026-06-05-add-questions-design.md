# Add Questions — Design Spec
**Date:** 2026-06-05  
**Product:** exam-management/admin  
**Feature:** Add questions to an assessment section (all 4 methods)

---

## Goal

A single, calm interface for faculty to add questions to an assessment section — no method picker dialog, no tabs, no upfront choices. The four methods are reachable from the section itself without navigating away.

---

## Scope (V0)

| In scope | Out of scope |
|---|---|
| QB search + inline results (semantic) | Bulk CSV import |
| QB question detail (read-only, all 6 V0 renderers) | Question editing from QB detail (link to QB) |
| AI generate (free-text prompt + optional PDF attach) | AI generate from curriculum map |
| Write from scratch (all 6 V0 types) | Sentence/word highlight, table+MCQ, passage+MCQ, chart+MCQ (future types) |
| Import from PDF (AI extraction → same Runway review) | Import from DOCX / PPTX (future) |
| Done state — count update, new Q highlight | Drag-to-reorder after add |

---

## Entry points — how each method is triggered

```
Section header
├── [input box]           ← type anything → QB search (①)
├── [spark icon]          ← click → AI generate (②)
└── [··· menu]
    ├── Write from scratch → (③)
    └── Import from PDF   → (④)
```

Search and Generate are always visible — no click to reveal.  
Write and Import are tertiary (less frequent) → live in `···`.

---

## State machine

```
State 0 (Resting)
    │
    ├─── user types ──────────────────────────► State 1A (QB search active)
    │                                               │
    │                                               └─── user clicks result ──► State 1A+ (Detail panel open)
    │                                                                               │
    │                                                                               └─── "+ Add" ──► State 4
    │
    ├─── user clicks spark ───────────────────► State 1B (AI mode)
    │                                               │
    │                                               └─── user clicks Generate ──► State 2 (Generating)
    │                                                                               │
    │                                                                               └─── done ──► State 3 (Runway review)
    │                                                                                               │
    │                                                                                               └─── Add / Add all ──► State 4
    │
    ├─── ··· → Write from scratch ───────────► State 1C (Write form)
    │                                               │
    │                                               └─── Save & add ──► State 4
    │
    └─── ··· → Import from PDF ──────────────► State 1D (Drop zone)
                                                    │
                                                    └─── file uploaded ──► State 2D (Extracting)
                                                                            │
                                                                            └─── done ──► State 3 (Runway review, same as AI)
```

---

## State 0 — Resting

```
┌─────────────────────────────────────────────────┐
│ Cardiology                        [4 questions] ···  │
├─────────────────────────────────────────────────┤
│  [✦]  Search or generate questions…         [→]  │
├─────────────────────────────────────────────────┤
│  1  A 68yo with syncope…                MCQ Hard │
│  2  In Mobitz II block…                  MCQ Med │
└─────────────────────────────────────────────────┘
```

- `[✦]` spark icon — gray, dim, clickable
- `[→]` send arrow — muted (disabled until input has text)
- No other affordances in section header

---

## State 1A — QB search

```
┌─────────────────────────────────────────────────┐
│ Cardiology                        [4 questions] ···  │
├─────────────────────────────────────────────────┤
│  [🔍]  AV block Mobitz                      [→▪]  │  ← brand border, send active
├─────────────────────────────────────────────────┤
│  6 results from question bank                    │
│  1  Which ECG finding most reliably…  MCQ  Med   │
│  2  In complete AV block…            MCQ  Hard   │
│  3  A patient with Mobitz II…        MCQ  Easy   │
│     3 more results ↓                             │
├─────────────────────────────────────────────────┤
│  1  A 68yo with syncope…                MCQ Hard │
│  2  In Mobitz II block…                  MCQ Med │
└─────────────────────────────────────────────────┘
```

- Results appear inline below the search input, above existing questions
- Flat rows only: number · truncated stem · type badge · difficulty badge
- No checkboxes, no "+ Add" on the row — clicking the row opens the detail panel
- Existing questions remain visible below the results
- **Semantic search (V0 core — PRD §4.3.6):** input accepts natural language ("AV block when to pace") — not keyword-only; the backend uses semantic/vector matching

**Local vs. Master copy (PRD §4.3.2):** When a faculty member adds a QB question to an assessment, a pinned reference is created — the question's QB ID is stored. The master QB copy is never modified. If the faculty edits the question within the builder (via "Edit question" in Runway review or future inline edit), those changes apply only to the local draft inside this assessment; the QB master remains unchanged.

---

## State 1A+ — QB detail panel (right-edge Sheet)

```
┌──────────────────────────────┬──────────────────────────┐
│ [section card — dimmed 55%]  │  DETAIL PANEL            │
│                              │                           │
│  [🔍]  AV block Mobitz  [→]  │  MCQ  Med  Bloom's L3    ✕│
│                              │                           │
│  ▶ 1  Which ECG finding…     │  Which ECG finding most  │  ← row highlighted
│    2  In complete AV block…  │  reliably distinguishes  │
│    3  A patient with…        │  Mobitz I from Mobitz II?│
│                              │  ─────────────────────── │
│                              │  ○ A  Constant PR before │
│                              │  ● B  Progressive PR     │  ← correct, green
│                              │  ○ C  Fixed 2:1 ratio    │
│                              │  ○ D  Widened QRS        │
│                              │  ─────────────────────── │
│                              │  PBI 0.41  68%  14  312  │
│                              │  Last used: Apr 2026     │
│                              │  ─────────────────────── │
│                              │  [← Prev]  [Next →]  [+ Add] │
└──────────────────────────────┴──────────────────────────┘
```

### Panel zones (constant across all 14 future renderer types)

| Zone | Content | Changes per type? |
|---|---|---|
| **Header** | Type badge · difficulty badge · Bloom's · ✕ | No |
| **Stem** | Full question text, never truncated | No |
| **Body** | `<QuestionBodyRenderer type={q.type} question={q} readOnly />` | Yes — swaps per type |
| **Stats** | PBI · Avg. correct % · Assessments used · Students seen · Last used | No |
| **Footer** | ← Prev · Next → · + Add | No |

### QuestionBodyRenderer — V0 + future

V0 question types per §4.3.1 of `assessment-creation-v0-requirements.md` — exactly 6:

| # | Type | Taker component | Read-only preview in detail panel | V0? |
|---|---|---|---|---|
| 1 | **MCQ** — single best answer | `RadioMCQRenderer` | Options A–D; correct highlighted green; no cross-out | ✅ V0 |
| 2 | **MSQ** — multiple select (SATA) | `CheckboxRenderer` | All correct options pre-checked; "N of M correct" label | ✅ V0 |
| 3 | **True / False** | `RadioMCQRenderer` (2 options) | True / False rows; correct highlighted green | ✅ V0 |
| 4 | **Fill in the Blank / Short Answer** | `FillBlankRenderer` / `ShortAnswerRenderer` | Blanks pre-filled with correct answers; short answer shows model answer in a green box | ✅ V0 |
| 5 | **Match the Following** | `MatchingRenderer` | Static left→right pairs; no dropdowns | ✅ V0 |
| 6 | **Hotspot Image** | `AnatomyRenderer` | Diagram shown; correct hotspot region filled brand color; no click interaction | ✅ V0 |
| 7 | **Essay** | `EssayRenderer` | Prompt + word/page requirements shown; no textarea; rubric summary if present | ✅ V0 |
| — | Sentence highlight | `HighlightRenderer` | Correct sentences pre-highlighted; drag disabled | Future |
| — | Word highlight | `WordHighlightRenderer` | Correct words highlighted; drag disabled | Future |
| — | Table + MCQ | `TableRenderer` | Table + read-only MCQ options | Future |
| — | PDF + MCQ | `PDFRenderer` | PDF thumbnail + read-only MCQ options | Future |
| — | Passage + MCQ | `PassageRenderer` | Scrollable passage + read-only MCQ options | Future |
| — | Chart + MCQ | `ChartRenderer` | SVG chart (already non-interactive) + read-only MCQ | Future |
| — | MCQ + cross-out | `CrossOutRenderer` | Same as MCQ; cross-out button hidden | Future |

**Implementation note:** Add `readOnly?: boolean` prop to `QuestionRenderers.tsx`. When `true`: block `onSelectAnswer` calls, hide cross-out buttons, hide mic button, disable drag handlers. Correct answer(s) pre-marked on mount — no `onSelectAnswer` needed.

**Panel behavior:**
- Slides in from right edge of viewport (not embedded in section card)
- Page content behind dims to ~55% opacity
- Dismissed by ✕ or clicking behind the panel
- Prev/Next browse through the current result set without closing

---

## State 1B — AI mode

```
┌─────────────────────────────────────────────────┐
│ Cardiology                        [4 questions] ···  │
├─────────────────────────────────────────────────┤
│  [✦▪]  AV block mechanisms — when to pace…      │  ← spark lit brand red, border brand red
│  ─────────────────────────────────────────────  │
│  [📎 Attach]  AI infers count, type & difficulty  [✦→] │
├─────────────────────────────────────────────────┤
│  1  A 68yo with syncope…                MCQ Hard │
└─────────────────────────────────────────────────┘
```

- Clicking spark icon toggles AI mode (clicking again returns to resting)
- Input border + spark icon both turn brand red (`--brand-color`)
- Placeholder changes to: "Describe what to test — topics, cases, concepts…"
- Toolbar row appears below the text area: Attach chip (left) · hint text · Generate button (right)
- Attach: accepts PDF, will be sent to AI as context source
- Generate button is the send action in AI mode (replaces the arrow)
- Existing questions remain visible below
- **AI design override (PRD §6 Flow 2 vs. this spec):** PRD §6 Flow 2 specifies explicit "Question count target" and "Question type mix (MCQ only, mixed)" fields. This design intentionally omits them. The AI infers count, type mix, and difficulty from the free-text prompt and curriculum context — showing explicit dropdowns adds friction without matching how faculty actually describe what they need. Directive: Romit (2026-06-05).

---

## State 2 — Generating (AI) / Extracting (PDF)

```
┌─────────────────────────────────────────────────┐
│ Cardiology                        [4 questions]      │
├─────────────────────────────────────────────────┤
│  Generating questions  ● ● ●                     │
│                                                  │
│  ✓  Read prompt — "AV block mechanisms…"         │
│  ✓  Scanned curriculum map — 3 LOs found         │
│  ✓  Calibrated — 6 MCQs, 2 med · 3 hard · 1 easy│
│  ✦  Writing 6 questions…         [pulsing]        │
└─────────────────────────────────────────────────┘
```

### Step labels — AI generate vs PDF import

| Step | AI generate | PDF import |
|---|---|---|
| 1 | Read prompt — "{excerpt}" | Read PDF — "{filename}", N pages |
| 2 | Scanned curriculum map — N LOs found | Identified question candidates — N found in slides |
| 3 | Calibrated — N MCQs, mix breakdown | Formatting & calibrating N questions |
| 4 | Writing N questions… | *(not shown — goes straight to Runway)* |

- Steps 1–3 show ✓ with what was actually found/decided
- Step 4 (active) pulses brand red
- No cancel button — generation runs to completion

---

## State 3 — Runway review (AI generate + PDF import shared)

```
┌─────────────────────────────────────────────────────────────┐
│ Cardiology                               [4 questions]       │
├─────────────────────────────────────────────────────────────┤
│  Question 1 of 6  [AI-generated]  [MCQ]  [Hard]  [Skip] [← Prev] [Next →▪] │
├─────────────────────────────────────────────────────────────┤
│  A 72-year-old man presents with recurrent presyncope…       │
│                                                              │
│  ▣ A  Mobitz I (Wenckebach); observation…  ✓ suggested      │  ← green border, green label
│  □ B  Mobitz II; immediate temporary pacing                  │
│  □ C  Complete heart block; permanent pacemaker              │
│  □ D  First-degree AV block; no intervention                 │
│                                                              │
│  [Edit question]                   [Skip]  [Add + Next →]   │
├─────────────────────────────────────────────────────────────┤
│  1 of 6 added so far               [Add all remaining →]    │
└─────────────────────────────────────────────────────────────┘
```

- "✓ suggested" label on AI's recommended correct answer (faculty can click a different option to override)
- **Edit question** — opens the write-from-scratch form inline, pre-populated with this question's content
- **Skip** — dismisses this question, moves to next
- **Add + Next →** — adds to section, advances to next
- **Add all remaining →** — bulk-adds all un-skipped questions; goes to State 4

---

## State 1C — Write from scratch

```
┌─────────────────────────────────────────────────────┐
│ Cardiology    [4 questions]    Writing new question ✕ │
├─────────────────────────────────────────────────────┤
│  QUESTION STEM                                       │
│  ┌───────────────────────────────────────────────┐  │
│  │ Which of the following correctly describes…|  │  │  ← cursor, brand border
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  TYPE                    DIFFICULTY                  │
│  [MCQ — single best ▾]   [Medium ▾]                  │
│                                                      │
│  ANSWER OPTIONS                                      │
│  ●  Progressive PR lengthening…     ← correct (green)│
│  ○  Constant PR with sudden loss…                    │
│  ○  Widening QRS with normal PR…                     │
│  ○  + Add option D                  ← dashed, muted  │
│                                                      │
├─────────────────────────────────────────────────────┤
│  [Cancel]                        [Save & add to section] │
└─────────────────────────────────────────────────────┘
```

- Form expands inside the section card — no dialog, no new page
- Stem: full textarea, auto-grows, active focus on open
- **Type dropdown (all 6 V0 types):** selecting a type changes the answer body below it

| Selected type | Answer body renders as |
|---|---|
| MCQ — single best answer | Options A–D rows with radio circles; one correct at a time |
| MSQ — multiple select | Options A–D rows with checkboxes; multiple correct allowed |
| True / False | Two rows only: True and False; radio circles |
| Fill in the Blank | Sentence textarea with `{{blank}}` syntax + per-blank options list |
| Match the Following | Two-column row builder: left prompt → right answer |
| Hotspot Image | Image upload area + instruction to click correct region on preview |
| Essay | No options section; shows word/page limit fields (min/max words, or page count toggle); optional rubric upload (named criteria + point values per criterion — per PRD §4.4) |

- Correct answer: click the circle/checkbox on the option to mark it correct (MCQ: one; MSQ: multiple; T/F: one)
- Options (MCQ / MSQ / T/F): 3 fields by default, "+ Add option" dashed row for more
- Cancel → collapses form with no save
- Save & add → saves question to QB (with draft status) + adds to section → State 4

---

## State 1D — Import from PDF

### Sub-state: drop zone
```
┌─────────────────────────────────────────────────────┐
│ Cardiology    [4 questions]    Import from PDF    ✕  │
├─────────────────────────────────────────────────────┤
│                                                      │
│         ┌──────────────────────────────┐             │
│         │   [doc icon]                 │             │
│         │   Drop lecture slides         │             │
│         │   or exam doc                │             │
│         │   PDF, DOCX, PPTX — 50MB     │             │
│         │         [Browse files]        │             │
│         └──────────────────────────────┘             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Sub-state: extracting (→ same as State 2, PDF labels)

After extraction, feeds directly into **State 3 Runway review** — same UI, same Add/Skip/Add all pattern.

---

## State 4 — Done

```
┌─────────────────────────────────────────────────────┐
│ Cardiology    [9 questions ✓]  [+5 added]  ···       │  ← count chip green briefly, badge fades after 3s
├─────────────────────────────────────────────────────┤
│  [✦]  Search or generate questions…          [→]     │  ← input resets to resting
├─────────────────────────────────────────────────────┤
│  1  A 68yo with syncope…                 MCQ  Hard   │
│  2  In Mobitz II block…                   MCQ  Med   │
│  3  A 72yo with recurrent presyncope…  ✓ New  MCQ   │  ← green row tint + ✓ New badge
│  4  What is the key ECG difference…    ✓ New  MCQ   │
└─────────────────────────────────────────────────────┘
```

- Section count updates immediately (optimistic)
- Count chip turns green briefly (2s), then returns to neutral
- "+N added" badge fades after 3s
- New questions: green left tint + "✓ New" badge (fades after 5s)
- Input resets to resting — ready for next action
- No toast notification

---

## Component structure

```
<AssessmentSection>
  ├── <SectionHeader>            title, count chip, ··· menu
  ├── <AddQuestionsInput>        resting / QB / AI mode states
  │     ├── <SparkIcon>          mode toggle trigger
  │     └── <AIToolbar>          attach chip + generate btn (AI mode only)
  ├── <QBResults>                inline result rows (State 1A)
  ├── <WriteFromScratchForm>     expands in section (State 1C)
  ├── <PDFDropZone>              drop zone (State 1D)
  ├── <GeneratingSteps>          4-step display (State 2 / 2D)
  ├── <RunwayReview>             1/N navigation (State 3)
  └── <QuestionList>             existing + newly added questions
        └── <QuestionRow>        number, stem, badges, ✓ New badge

<QBDetailPanel>                  right-edge Sheet (State 1A+)
  ├── <PanelHeader>              type/diff/bloom badges, ✕, full stem
  ├── <QuestionBodyRenderer>     readOnly — V0: RadioMCQRenderer
  ├── <PanelStats>               PBI, avg correct, assessments, students
  └── <PanelFooter>              Prev, Next, + Add
```

---

## Open questions

| # | Question | Decision needed by |
|---|---|---|
| 1 | Does "Save & add" (Write from scratch) save to QB as a draft, or only add to the section? | Aarti |
| 2 | Can faculty search across ALL sections' QB or only the current course's QB? | Vishaka |
| 3 | What happens when AI generates a question that duplicates an existing one in the section? | Team |
| 4 | PDF import — does the faculty see the source page alongside the extracted question in Runway review? | Aarti |

---

## Not in scope (explicit)

- Question bank management (editing existing QB questions from the detail panel)
- AI regenerate individual questions in the Runway review (only Edit manually)
- Drag-to-reorder within the section after adding
- Auto-duplicate detection on QB search results
