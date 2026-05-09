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

---

## Glossary additions from 2026-05-08 Aarti audit

**Course offering** — a specific instance of a master course in a specific term taught by specific faculty (e.g., "Pharmacology I, Spring 2026, Faculty X"). What faculty acts on. Different from master course. Per Exam Mgmt ADR-001.

**Master course** — the abstract course in the program catalog (e.g., "PHARM 101 Pharmacology I"). Owned by Admin; reused across terms as course offerings. Per Exam Mgmt ADR-001.

**Term (master list)** — academic term in the program catalog (e.g., "Spring 2026"). Owned by Admin. Per Exam Mgmt ADR-001.

**Course director** — default Faculty role: "whole and soul navigator" of a course offering. Full CRUD on Questions / Assessments / Students / Accommodations [read-only inherited].

**Collaborator** — a faculty added to a course offering by the Course Director, with admin-granted permission. May teach a lecture, contribute to QB, share material, or second-read.

**Cohort** — a graduating class moving through the program together. Used in PCE primarily; relevant in Exam Mgmt for cross-cohort assessment trend analysis (Phase 2).

**Content area** — topic the course covers. Program-level master list; questions tag 1-to-many. Per workspace ADR-001.

**Competency** — program-level outcome capability. Questions tag 1-to-many.

**Standard** — program-level accreditation requirement. Course objectives/measures map to standards.

**Objective / Measure** — course-level learning goal mapped to standards. What a course intends to teach.

**Course health** — whether a course's question bank covers the course's content areas, competencies, and objectives. Surfaced at the course level (NOT competency-level) per Exam Mgmt ADR-005 (pending).

**Question-bank gap** — a content area / competency / objective tagged to a course offering but with zero or few questions in the QB. Surfaced on course health view; "Generate more with AI" CTA per gap.

**Flag (statuses)** — voluntary student action during exam to mark a question as questionable. Statuses: addressed / dismissed / acknowledged. Faculty does NOT respond in real-time during the exam (per Exam Mgmt ADR pending — confirm with Vishakha).

**Curving** — score adjustment applied post-exam at question or assessment level. Allows excluding ANY question, not just flagged ones (Exam Mgmt ADR pending — D9).

**Distractor analysis** — distribution of student answer choices across distractors. Visualized green = correct + single accent for incorrect (no rainbow palette).

**Difficulty index (faculty-set)** — easy/medium/hard tier set by faculty at question creation. Distinct from calculated post-exam difficulty.

**Difficulty (calculated)** — proportion of test-takers who answered correctly. Already defined above.

**Assessment types** — pop quiz / timed exam / take-home / open-book / proctored. Each has distinct parameters. Phase 1 may exclude proctored (lockdown vendor TBD Q4 2026 / Jan 2027). Aarti requires per-type parameter doc before designing screens (R5).

**Assessment statuses** — draft / review / pending chair / change requested / approved / **ongoing** / done / results. Aarti rejected "live" → use "ongoing" instead.

**Ongoing** (status) — replaces "live". Active assessment, students currently taking it.

**Accommodation** — see workspace `docs/decisions/006-accommodations-shared-module.md`. Administered globally; faculty inherits read-only filtered view.

**Custom accommodation** — optional school-specific accommodation not in the master list.

**Module launcher** — see workspace ADR-003. Replaces Prism main dashboard.
