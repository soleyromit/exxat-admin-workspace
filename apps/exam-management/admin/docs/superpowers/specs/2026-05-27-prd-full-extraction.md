# PRD Full Extraction — Assessment Creation | Exam Management
> Method: literal line-by-line read of the full PRD. Every requirement extracted with exact quote, data level, and current status.
> Data levels: **Q** = Question row, **A** = AssessmentSettings/AssessmentDraft, **S** = AssessmentSection, **C** = Course/Offering, **UI** = UI-only (no stored state)

---

## §4.1 Assessment Blueprint Creation

### 4.1.1 Setup Wizard — Phase 1 (Status Quo fields)
These are the minimum required to create a functional digital exam.

| # | Requirement (PRD quote) | Data level | Status |
|---|---|---|---|
| P1-1 | Assessment Name & Course Association | A | ✅ Built |
| P1-2 | Assessment Type (Exam, Quiz, Assignment) | A (`settings.type`) | ✅ Built |
| P1-3 | Total Marks | A (`settings.totalMarks`) | ✅ Built |
| P1-4 | Total Duration (minutes) | A (`durationMinutes`) | ✅ Built |
| P1-5 | Grading Scheme — Graded vs Ungraded | A (`settings.graded`) | ✅ Built |
| P1-6 | Basic Section Structure (create sections) | S | ✅ Built |

### 4.1.2 Setup Wizard — Phase 2 (Collaboration Parameters)
Digitizes the instructor's mental map so collaborators are aligned.

| # | Requirement (PRD quote) | Data level | Status |
|---|---|---|---|
| P2-1 | "Primary Goal / Intent (e.g., 'Evaluating foundational knowledge…')" | A (`primaryIntent`) | ✅ Built (type + UI) |
| P2-2 | "Target Audience Level (e.g., Year 2 Med Students)" | A | ❌ Missing — not in type, not in UI |
| P2-3 | "Target Topic Weightage (e.g., 40% Anatomy, 60% Physiology)" | A | ❌ Missing — topic-level weighting not in type or UI |
| P2-4 | "Target Difficulty Distribution (e.g., 30% Easy, 50% Medium, 20% Hard)" | A (`targetDiffDistribution`) | ✅ Built (type + UI) |
| P2-5 | "Target Question Type Distribution (e.g., 60% MCQ, 20% MSQ, 20% Essay)" | A (`targetTypeDistribution`) | ✅ Built (type + UI) |
| P2-6 | "Section-Level Delegations (e.g., Assigning Dr. Smith to Section A)" | S (`facultyIds`) | ⚠️ Partial — section-faculty assignment built; delegate-by-section in builder exists |
| P2-7 | "Manual Syllabus/Reference Upload (course PDF so reviewers can verify)" | A (`syllabusUrl`) | ✅ Built (type + UI) |

### 4.1.3 Blueprint Recycling (V0 Core)
> "Instructors select an older assessment as a complete blueprint template. System ingests its sections, question type/category distribution, and historical difficulty data."

| # | Requirement | Data level | Status |
|---|---|---|---|
| B1 | Select past assessment as template | A | ⚠️ Partial — `MOCK_COPY_SOURCES` exists; no section structure copy |
| B2 | Ingest sections with title, structure, ordering | S | ❌ Missing — sections not copied on selection |
| B3 | Ingest question type/category distribution | A | ❌ Missing |
| B4 | Ingest historical difficulty data per question | Q | ❌ Missing |
| B5 | Full manual edit of ingested blueprint after copy | UI | ❌ Blocked by B2–B4 |

### 4.1.4 Saved Blueprints
> "Instructors can also save 'from-scratch' blueprints to reuse."

| # | Requirement | Data level | Status |
|---|---|---|---|
| BL1 | Save current assessment structure as a named reusable blueprint | A | ❌ Missing — no save-as-blueprint flow |

---

## §4.2.1 Assessment Builder Overview Panel (MetricsPanel)

### Composition Metrics — always available

| # | Requirement (PRD quote) | Data level | Status |
|---|---|---|---|
| M1 | "Number of Questions: Total question count across all sections" | **A** (aggregated) | ✅ Built |
| M2 | "Total Score: Sum of all point values" | **A** (aggregated) | ✅ Built |
| M3 | "Estimated Time to Complete: based on configured time limits and historical per-question average completion times" | **A** (aggregated from `Q.avgTimeSeconds`) | ⚠️ Partial — shows time limit; does NOT use `Q.avgTimeSeconds` for estimate |

### Psychometric Quality Metrics — from historical Question Bank data

> PRD: "populated from historical Question Bank data where available"
> This data lives at the **Question** level (historical per-question metrics from prior administrations), **aggregated** to the assessment level in the panel.

| # | Metric (PRD quote) | Data level | What it is technically | Status |
|---|---|---|---|---|
| PM1 | "Difficulty Index: Average difficulty rating across all questions (based on historical correct-answer rates from prior exam administrations)" | **Q→A**: `Q.pValue` averaged | p-value = (# correct) / (# attempts) per question; averaged across assessment | ✅ Built (`avgPValue`) |
| PM2 | "Upper 27% vs. Lower 27%: Comparison of average scores between top and bottom performing student cohorts, indicating how well the assessment differentiates strong from weak performers" | **Q→A**: derived from `Q.pValue` in top/bottom 27% by score | Sort questions by pValue; compute avg pValue for top 27% and bottom 27% of questions | ✅ Built (`upper27avg` / `lower27avg`) — **but this is the wrong computation** (see note below) |
| PM3 | **"Discrimination Index: Average discrimination index, measuring how effectively each question distinguishes between high and low scorers"** | **Q→A**: `Q.discriminationIndex` averaged | D = (# correct in top 27%) − (# correct in bottom 27%), expressed as proportion; per question, then averaged | ❌ **Missing entirely** — `Q.discriminationIndex` field does not exist on `Question` type; not computed; not in MetricsPanel |
| PM4 | "Average Point-Biserial Correlation: A correlation coefficient indicating overall question quality and alignment between individual question performance and overall assessment score" | **Q→A**: `Q.pbis` averaged | Point-biserial = correlation between Q score (0/1) and total test score; per question, then averaged | ✅ Built (`avgPbis`) |

**Note on PM2 (Upper/Lower 27%):** The PRD means: take the top 27% of STUDENTS by total score and compare their average performance to the bottom 27% of STUDENTS. This is a student-cohort comparison, not a question-pValue comparison. The current implementation sorts questions by pValue instead. This is a different calculation. The correct metric requires historical cohort data — which should come from `Q.optionDistribution` or a separate historical field. For mock purposes, a separate `Q.upper27pct` / `Q.lower27pct` field per question would be needed.

### Outlier Flagging

| # | Requirement (PRD quote) | Data level | Status |
|---|---|---|---|
| F1 | "negative point-biserial" → flag inline in question list | **Q** flag displayed in **UI** | ✅ Built (`poor-pbis`, `poor-discriminator` flags) |
| F2 | "extremely high/low difficulty" → flag | **Q** flag | ✅ Built (`extreme-difficulty` flag) |
| F3 | **"near-zero discrimination"** → flag | **Q** flag | ❌ Missing — requires `Q.discriminationIndex`; flag type not defined |

---

## §4.3 Question Authoring, Sourcing & Reorganization

| # | Requirement | Data level | Status |
|---|---|---|---|
| QS1 | Manual creation from scratch via "+ New Question" in section | UI | ✅ Built (Edit Question flow) |
| QS2 | QB selection via semantic search + filters (Topic, Bloom's, Difficulty) | UI | ✅ Built (QB picker) |
| QS3 | AI-generated questions | UI | ⚠️ Partial — AI prompt box exists; does not actually generate structured questions |
| QS4 | **Local vs Master Copy**: "pulling an existing question into the assessment creates a 'pinned' reference. Editing inside builder creates a 'local draft' for that exam only, leaving master institutional copy untouched." | **Q** (local draft flag) | ❌ Missing — no local-draft flag; edits would affect master copy |
| QS5 | Drag & Drop — drag entire sections to reorder | **S** | ⚠️ Partial — up/down buttons built; no drag handle |
| QS6 | Drag & Drop — drag individual questions across section boundaries | **A→S** | ❌ Missing — cannot drag questions between sections; only bulk-move exists |
| QS7 | Bulk selection to move questions into new section | **A→S** | ✅ Built (bulk "Move to →" select) |
| QS8 | Bulk selection to apply point values | **A** | ✅ Built (bulk point-setting) |
| QS9 | **AI Quiz & Question Generator (V0 Core)**: "faculty supply a syllabus topic, a specific clinical case, or a slide deck, and the generator automatically drafts relevant, structured questions (e.g. MCQs/MSQs) and formats them into a complete active quiz template ready for preview and editing." This is marked A. High Priority Core V0. | UI | ❌ Missing — prompt box exists; no actual AI generation of structured question objects |

---

## §4.4 Assessment Configuration & Question-Level Grading Rules

### Question-Level Grading (GradingRulesSection per-question)

| # | Requirement | Data level | Status |
|---|---|---|---|
| G1 | MCQ: Option Randomization | **A** (default) + **Q** (override via `randomizeOptions`) | ✅ Built |
| G2 | MCQ: Distractor Locking (pin specific options like "All of the above" to remain at bottom) | **Q** (`distractorLockKeys`) | ❌ Scoped out per user request |
| G3 | **MCQ: Negative Marking** (deduct fractional points for incorrect selections) | **A** (default: `negativeMarking` + `negativeMarkingFraction`) + **Q** (override: `negativeMarkingWeight`) | ⚠️ Partial — assessment-level fields exist in types (`negativeMarking`, `negativeMarkingFraction`); **no UI in Settings sheet**; no per-question override field or UI |
| G4 | MSQ: Option Randomization | **Q** | ✅ Built |
| G5 | MSQ: Distractor Locking | **Q** | ❌ Scoped out |
| G6 | MSQ: All-or-Nothing Scoring | **Q** (`msqMode`) | ✅ Built |
| G7 | MSQ: Partial Credit Additive / Proportional | **Q** (`msqMode`) | ✅ Built |
| G8 | MSQ: Right-Minus-Wrong Scoring | **Q** (`msqMode`) | ✅ Built |
| G9 | Fill/Blank: Exact match vs Contains | **Q** (`fillBlankMatchMode`) | ✅ Built |
| G10 | Fill/Blank: Case sensitivity | **Q** (`fillBlankCaseSensitive`) | ✅ Built |
| G11 | Fill/Blank: Alternate acceptable spellings | **Q** (`alternateAcceptedAnswers`) | ✅ Built |
| G12 | Matching: Partial credit per correctly matched pair | **Q** (`matchPartialCredit`) | ✅ Built |
| G13 | Matching: Extra Distractors | **Q** (`matchExtraDistractors`) | ✅ Built |
| G14 | Hotspot: Multiple hotspots with partial credit | **Q** (`hotspotMultipleAllowed`, `hotspotPartialCredit`) | ✅ Built |
| G15 | **Essay: Rubric-Based Grading** — "instructors can attach a configurable rubric (with named criteria and point values per criterion) to any essay question" | **Q** (`rubric[]` already on Question type) | ⚠️ Partial — `Q.rubric` field exists and renders in preview; **no UI to ADD/EDIT rubric criteria** from within the builder |

### Navigation & Progression Rules (Assessment Settings)

> "Following strict clinical exam standards matching ExamSoft"

| # | Requirement (PRD quote) | Data level | Status |
|---|---|---|---|
| N1 | "once a student completes or advances past a section, they cannot return to any previous section (forward-only)" | **A** | ❌ Missing — no `forwardOnlySections` field in AssessmentSettings |
| N2 | "Require Answer for Section Advancement: All questions within active section must be answered before transitioning" | **A** | ❌ Missing — `requireAnswer` exists but is **assessment-level** (per question); no `requireAnswerForSectionAdvance` field |
| N3 | "Forced Timer Transitions: section timer expires → student forced to next section; unanswered questions auto-submitted" | **A** | ❌ Missing — no `forcedTimerTransition` flag in AssessmentSettings |
| N4 | "Backward Navigation (Within-Section): Toggle to prevent returning to previous questions within active section" | **A** (`backwardNavigationAllowed`) | ✅ Built in type; **no UI in Settings sheet** |
| N5 | "Require Answer (Assessment-level): Toggle to force students to select answer before moving forward globally" | **A** (`requireAnswer`) | ✅ Built in type; **no UI in Settings sheet** |

### Question Ordering & Randomization

| # | Requirement | Data level | Status |
|---|---|---|---|
| R1 | Fixed order OR Random order (shuffled per student) | **A** (`randomize`) | ✅ Built |
| R2 | Randomization within sections only (not cross-section) | **S** | ✅ Built (`S.randomize` per section) |

### Time Settings

| # | Requirement | Data level | Status |
|---|---|---|---|
| T1 | Time limits at Assessment level | **A** (`durationMinutes`) | ✅ Built |
| T2 | Time limits at Section level | **S** (`timeLimitMinutes`) | ✅ Built |
| T3 | **Time limits at Question level** | **Q** | ❌ Missing — no per-question timer field in `AssessmentQuestion` or `Question` |
| T4 | Option to allow breaks between sections | **A** (`maxBreaks`, `allowUnauthorizedBreaks`) | ✅ Built in type; UI built |
| T5 | Warning alarms at Assessment level (default 5 min) | **A** (`digitalTools.warningAlarmMinutes`) | ✅ Built |
| T6 | Warning alarms at Section level | **S** (`sectionWarningAlarmMinutes`) | ✅ Built |

### Pre-reads & Resource Attachments

| # | Requirement (PRD quote) | Data level | Status |
|---|---|---|---|
| PR1 | Pre-reads at Assessment level | **A** | ❌ Missing — `S.prereadText` exists for sections; no assessment-level preread field |
| PR2 | Pre-reads at Section level with dedicated read timer | **S** (`prereadText`, `prereadTimerMinutes`, `excludePrereadFromDuration`) | ✅ Built |
| PR3 | "Pre-reads can also be provided days in advance of the assessment (supported by automated email notifications, alerts, and prominent dashboard announcements)" | **A** + notifications system | ❌ Missing — no advance-preread window or notification mechanism |
| PR4 | **"Granular Attachments at four distinct levels: Assessment-level, Section-level, Question Group-level, or Question-level"** | **A/S/Q** | ❌ Missing entirely — no attachment field at any level |

### Weightage & Grading (Assessment-level)

| # | Requirement | Data level | Status |
|---|---|---|---|
| W1 | Total weightage configurable | **A** (`totalMarks`) | ✅ Built |
| W2 | Distribution section-wise or question-wise | **S** / **Q** | ✅ Built (`Q.points` + section grouping) |
| W3 | Bonus Questions | **Q** (`AssessmentQuestion.bonus`) | ✅ Built |
| W4 | Auto-scoring | **A** | ⚠️ Assumed — no explicit toggle in settings |
| W5 | Manual scoring with blind scoring (hide student names) | **A** (`blindScoring`) | ✅ Built in type; **no UI in Settings sheet** |
| W6 | **Student Performance Flagging**: "Admins and Course Instructors can define score thresholds to flag specific student performance categories for teachers/instructors only (strictly teacher-facing; no pass/fail status will be visible to students)" | **A** | ❌ Missing — no score threshold / performance flag configuration |

### Digital Tools (Cascading hierarchy: Assessment → Question → Student)

| # | Requirement | Data level | Status |
|---|---|---|---|
| DT1 | Calculator (Basic / Scientific) | **A** (`digitalTools.calculator`) | ✅ Built in type; UI built |
| DT2 | Text Highlight | **A** (`digitalTools.textHighlight`) | ✅ Built |
| DT3 | Notes/Scratchpad | **A** (`digitalTools.scratchpad`) | ✅ Built |
| DT4 | Allow Feedback within Notes (faculty reviews student scratchpad) | **A** (`digitalTools.scratchpadFeedback`) | ✅ Built in type; **no UI** |
| DT5 | Allow Copy/Paste | **A** (`digitalTools.allowCopyPaste`) | ✅ Built |
| DT6 | Warning Alarms | **A** (`digitalTools.warningAlarmMinutes`) | ✅ Built |
| DT7 | Spell Check (essay) | **A** (`digitalTools.spellCheck`) | ✅ Built in type; **no UI** |
| DT8 | Find and Replace (essay) | **A** (`digitalTools.findReplace`) | ✅ Built in type; **no UI** |
| DT9 | **Question-level tool override** (e.g., enable calculator only for a specific math question) | **Q** | ❌ Missing — no `toolOverrides` on `AssessmentQuestion` |
| DT10 | Student/Accessibility-level tool override (accommodations bypass assessment+question restrictions) | student profile | ❌ Out of scope for builder; accommodation system |

### Exam End Settings

| # | Requirement | Data level | Status |
|---|---|---|---|
| E1 | Display results/rationale immediately or delayed | **A** (`postExamReviewEnabled`, `postExamReviewDelayHours`) | ✅ Built |
| E2 | Show Raw Score toggle | **A** (`showRawScore`) | ✅ Built in type; **no UI in Settings sheet** |
| E3 | Show Percentage toggle | **A** (`showPercentage`) | ✅ Built in type; **no UI in Settings sheet** |
| E4 | Allow early submission | **A** (`allowEarlySubmission`) | ✅ Built in type; **no UI in Settings sheet** |

---

## §4.4.1 Configurable Post-Exam Review Engine

| # | Requirement | Data level | Status |
|---|---|---|---|
| PER1 | Immediately upon submission OR Scheduled/Delayed | **A** (`postExamReviewEnabled`, `postExamReviewDelayHours`) | ✅ Built |
| PER2 | Lockdown Browser Enforcement during review | **A** (`postExamReviewLockdown`) | ✅ Built in type; UI built (Wave 1) |
| PER3 | Access Password for review screen | **A** (`postExamReviewPassword`) | ✅ Built |
| PER4 | Time-Limited Review (max duration) | **A** (`postExamReviewTimeLimitMinutes`) | ✅ Built |
| PER5 | Incorrect Answers Only toggle | **A** (`postExamReviewIncorrectOnly`) | ✅ Built |
| PER6 | Rationale Toggles | **A** (`postExamReviewShowRationale`) | ✅ Built |

---

## §4.4.2 Post-Assessment Regrading Engine

| # | Requirement | Data level | Status |
|---|---|---|---|
| RE1 | Invalidate Question (Full Credit) | **Q** (`gradingConfig.invalidated`) | ✅ Built (type + UI in analytics) |
| RE2 | Discard Question (Exclude from Denominator) | **Q** (`gradingConfig.discarded`) | ✅ Built |
| RE3 | Correct Option Override (Key Correction) | **Q** (`gradingConfig.correctedKey`) | ✅ Built |
| RE4 | Accept Multiple Correct Options | **Q** (`gradingConfig.additionalCorrectKeys`) | ✅ Built |
| RE5 | Points Adjustment (flat add/subtract to all scores) | **A** (curve) | ✅ Built (analytics curve UI) |
| RE6 | Percentage-Based Curving (top score = 100% or multiplier) | **A** | ✅ Built |
| RE7 | **Automated Psychometric Alerts** (scan post-exam results, flag negative point-biserial / low success rate) | **Q→A** analytics | ⚠️ Partial — pre-exam flags built; no POST-exam automated scan |
| RE8 | Real-Time Automated Regrading (background task, updates LMS) | system | ❌ Out of scope for mock; noted |
| RE9 | Historical Audit Logging (instructor ID, timestamp, mandatory explanation, before/after snapshot) | **A** | ⚠️ Partial — audit log UI built; "mandatory explanation" not enforced; no before/after snapshot |

---

## §4.5 Delivery, Security, and Accommodations

### Three-Stage Availability Window

| # | Requirement (PRD quote) | Data level | Status |
|---|---|---|---|
| D1 | "Visible Date: assessment card appears but cannot be launched" | **A** (`visibleDate`) | ✅ Built in type; **no UI in Settings sheet** |
| D2 | "Openable Date (Pre-Flight): students can launch exam interface and download to browser cache" | **A** (`openableDate`) | ✅ Built (type + UI) |
| D3 | "Cutoff Date (Available Until): final deadline for submission. Prohibit late submissions (auto-submit when cutoff reached)" | **A** (`closeDate`) | ✅ Built in type; **no UI to toggle auto-submit on cutoff** |

### Security

| # | Requirement | Data level | Status |
|---|---|---|---|
| SE1 | Secure Mode (Respondus lockdown browser) | **A** (`secureMode`) | ✅ Built in type; **no UI in Settings sheet** |
| SE2 | Unsecure Mode | **A** | ✅ (default) |
| SE3 | Exam Start Password (decrypts cached exam) | **A** (`passwordRequired`, `password`) | ✅ Built |
| SE4 | Resume Password (after authorized break) | **A** (`resumePassword`) | ✅ Built |

### Accommodations

| # | Requirement | Data level | Status |
|---|---|---|---|
| AC1 | Student-level extra time, third-party software, calculators, text-to-speech, increased breaks | student profile | ❌ Missing — no accommodation configuration in builder or student profile |
| AC2 | Permanent accommodations (registered in student global profile) | student profile | ❌ Missing |
| AC3 | Temporary accommodations (student requests via dashboard) | student dashboard | ❌ Missing |

### Proctor Controls (Proctoring Dashboard — §4.7)

| # | Requirement | Data level | Status |
|---|---|---|---|
| PC1 | Monitor students on pre-exam placeholder + cache verification | proctoring UI | ❌ Missing |
| PC2 | Monitor exam start status | proctoring UI | ❌ Missing |
| PC3 | Receive alerts when student raises issue | proctoring UI | ❌ Missing |
| PC4 | End exam early for specific student | proctoring UI | ❌ Missing |
| PC5 | Print exam with answer key (proctor copy) | proctoring UI | ❌ Missing |
| PC6 | Provide student-specific printout if device fails | proctoring UI | ❌ Missing |

---

## §4.6 Assessment Lifecycle States

| # | State | Status |
|---|---|---|
| LC1 | Planned / Scheduled | ✅ (`status: 'scheduled'`) |
| LC2 | Draft | ✅ (`status: 'draft'`) |
| LC3 | In Review (formal 2-level) | ⚠️ Partial — `status: 'pending-review'` / `'approved'` exist; **no send-for-review UI** |
| LC4 | Ready (approved, not yet accessible) | ✅ (`status: 'approved'`) |
| LC5 | Published / Live | ✅ (`status: 'live'`) |
| LC6 | Completed | ✅ (`status: 'completed'`) |
| LC7 | Archived | ❌ Missing — no archived state |

### Review Workflow UI (4.6)

| # | Requirement | Status |
|---|---|---|
| RW1 | Send for review button in builder | ❌ Missing |
| RW2 | Reviewer selection (chair, multiple allowed) | ❌ Missing |
| RW3 | 2-level review (owner review → chairperson) | ❌ Missing |
| RW4 | Partial section submission (faculty submits their section only) | ❌ Missing |
| RW5 | Real-time section status on builder dashboard | ❌ Missing |
| RW6 | Soft gate warning when publishing unapproved | ❌ Missing |

### Dual-View Preview & Simulation (4.6)

| # | Requirement | Status |
|---|---|---|
| SIM1 | Student View Simulation (preview exam as student) | ❌ Missing |
| SIM2 | Simultaneous Proctor Simulator (side-by-side proctoring dashboard) | ❌ Missing |

---

## §6 AI Features

| # | Requirement | Priority | Status |
|---|---|---|---|
| AI1 | **Assessment Creation via Past Assessment Ingestion (Recycling/Template)** — ingest section structure, Q type distribution, historical difficulty | **A. Core V0** | ❌ Missing (see B2–B4 above) |
| AI2 | **AI-Driven Semantic Search (Question Bank)** — natural language QB queries | **A. Core V0** | ⚠️ Partial — search exists; not semantic/NLP |
| AI3 | **Quick Quiz & Question Creation via Course Content Ingest** — supply syllabus topic/slide deck/clinical case → AI generates structured questions into quiz template | **A. Core V0** | ❌ Missing — prompt box exists but no actual generation |
| AI4 | Smart Question Replacement (AI replaces selected Q with unused equivalent) | B. Medium | ❌ Missing |
| AI5 | Conversational AI blueprinting | C. Deferred | — |
| AI6 | AI-Led From-Scratch Blueprint Generation | C. Deferred | — |

---

## Summary: What's Missing / Has No UI Despite Having a Type

### Critical gaps (data model incomplete):
- **`Q.discriminationIndex`** — separate from pbis; needed for Discrimination Index metric (PM3) and near-zero discrimination flag (F3)
- **`Q.upper27pct` / `Q.lower27pct`** — historical cohort data per question for correct Upper/Lower 27% computation (PM2)
- **`Q.localDraft: boolean`** — local-vs-master copy flag (QS4)
- **`AssessmentQuestion.questionTimeLimitMinutes`** — question-level timer (T3)
- **`AssessmentQuestion.toolOverrides`** — question-level tool override (DT9)
- **`AssessmentSettings.forwardOnlySections`** — section navigation lock (N1)
- **`AssessmentSettings.requireAnswerForSectionAdvance`** — separate from per-Q requireAnswer (N2)
- **`AssessmentSettings.forcedTimerTransition`** — auto-advance on section timer expire (N3)
- **`AssessmentSettings.negativeMarkingWeight` per-Q** → should be `QuestionGradingConfig.negativeMarkingWeight` (G3)
- **`AssessmentDraft.targetAudienceLevel`** — Year 2 Med Students etc. (P2-2)
- **`AssessmentDraft.targetTopicWeightage`** — topic % distribution (P2-3)
- **Attachment fields** at A/S/Q levels (PR4) — no attachment model exists

### Type exists, UI missing (Settings sheet has no control):
- `backwardNavigationAllowed` (N4)
- `requireAnswer` (N5)
- `blindScoring` (W5)
- `showRawScore` / `showPercentage` (E2, E3)
- `allowEarlySubmission` (E4)
- `visibleDate` — type exists, no UI (D1)
- `secureMode` — type exists, no UI (SE1)
- `digitalTools.scratchpadFeedback` (DT4)
- `digitalTools.spellCheck` / `findReplace` (DT7, DT8)
- `negativeMarking` + `negativeMarkingFraction` — assessment-level fields exist; **no UI in Settings sheet** (G3)

### Features not in scope for builder (acknowledged):
- Accommodations system (AC1–AC3) — student profile module
- Proctoring dashboard (PC1–PC6) — separate app
- Real-time automated regrading + LMS sync (RE8) — backend system
- Advance pre-read with email notifications (PR3) — notification system
