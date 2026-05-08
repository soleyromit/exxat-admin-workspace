# Exam Management — Content (voice, glossary, errors)

Maintained by the intake skill via INTAKE-003.

---

## Voice

| Surface | Tone | Reading level | Notes |
|---|---|---|---|
| Faculty (My Courses, QB, builder) | Decisive, domain-fluent | Domain | Faculty are PhDs/clinicians — don't condescend |
| Admin (settings, role assignment) | Operational, terse | Domain | Status verbs over status nouns |
| Chair (approval queue) | Neutral, reviewable | Domain | Don't editorialize on faculty work |
| Student (Assessment Taker — outside exam) | Direct, scannable | Grade 10 | Active assessments first, no marketing copy |
| Student (DURING exam) | Minimum chrome | Grade 10 | UI gets out of the way; no celebratory copy, no marketing |

## Empty state copy

Per CONTENT-002: never "No data". Always propose an action.

| Surface | Empty state | What to write |
|---|---|---|
| My Courses, no courses | "No courses" | "You haven't been assigned to a course yet. Contact your admin." |
| Course → Questions, no questions | "No questions" | "Pull from the global Question Bank or author new ones — `Add question` →" |
| Course → Assessments, no assessments | "No assessments" | "Build your first assessment from this course's questions — `New assessment` →" |
| Approval queue, empty | "Nothing to review" | "All published assessments are approved. New assessments will appear here as they're submitted." |

## Error copy

Per CONTENT-003: explain what happened, why, what to do.

| Error | Bad | Good |
|---|---|---|
| Assessment administered without approval | "Not approved" | "This assessment is still pending chair approval. You can administer it now — chair will see it in the review queue." |
| AI question generation failed | "Error" | "AI couldn't generate questions for this lecture upload. Most common cause: text not extractable from the file. Try a different format or paste content directly." |
| Lockdown not yet available | "Locked" | "Scheduled review sessions require the lockdown browser, available Q1 2027. For now, this assessment runs in standard mode." |

---

## Glossary

> Order: alphabetical. First use of any term in a new screen MUST link here.
> Maintained by the intake skill (INTAKE-003) — confirm-before-write.

**Active assessment** — assessment currently open for student attempts. The Assessment Taker landing prioritizes active assessments first.

**AI gap analysis (assessment level)** — surfacing which course objectives are covered or missed in a specific assessment. Higher ROI than bank-level gap analysis because the assessment is what students actually take.

**AI gap analysis (bank level)** — surfacing which standards or objectives lack questions in the question bank. Useful for QB curation, less useful for assessment integrity.

**Assessment Taker** — the Vite/React student-facing exam delivery app. Separate from the Next.js student app. Uses Exxat-DS (admin DS) by exception while studentUX setup gaps are resolved.

**Curricular Assessment Loop** — Aarti's mind map: standards (A) → course objectives (B) → exam questions (C) → assessment scores (D) → loop back to B. The 2027 north star.

**Difficulty (item difficulty)** — proportion of test-takers who answered an item correctly. Surfaced at decision time, not in a separate report.

**Faculty (Edit)** — Phase 1 role with CRUD on assigned courses.
**Faculty (Read-only)** — Phase 1 role with view-only on assigned courses.

**Independent entity architecture** — courses, students, faculty, questions, assessments, competencies, content areas, standards exist independently and link through association tables. UI constraints (e.g., "one question per course") layer on top, not in the data model.

**Item quality dashboard** — embedded view of point-biserial + difficulty + negative-performing flags surfaced where faculty makes the decision (in the assessment builder, not in a downstream report).

**Labels (Gmail-style nested)** — Exam Management's single tagging system. Houses standards, course measures, faculty names, custom categories. Replaces the Prism multi-system tagging mistake.

**Lockdown browser** — vendor-supplied browser that prevents copy/screenshot/tab-switch during exam delivery. Vendor TBD Q4 2026 / Jan 2027.

**Negative-performing question** — a question where high-scoring students get it wrong more often than low-scoring students. Strong signal of an item-writing problem; surfaced inline.

**Point-biserial** — correlation between getting an item correct and the total test score. Item-quality metric; surfaced inline.

**Pop quiz workflow** — in-class ceremony: faculty starts → students see → faculty ends. Decision pending: separate Lecture surface vs. start-inline from create-assessment.

**Pre-publication approval** — chair review of an assessment before administer. Silent gate (administer allowed pending). Side widget on assessment overview, not primary org axis.

**Question Bank (QB)** — global, admin-scoped. Faculty access questions through their courses, not through the bank directly.

**Scheduled review session** — post-publication student review under lockdown: students log back in to see exam with correct answers and rationales, copy/screenshot blocked.

**Three-tier competency reporting** — (a) per-assessment, (b) course-level cumulative, (c) program-level cumulative. Tiers 1–2 Phase 1; tier 3 2027.

**Workflow approval** — see "Pre-publication approval". Same thing; "workflow" is the older term Vishakha uses, "pre-publication approval" is the clearer phrasing.
