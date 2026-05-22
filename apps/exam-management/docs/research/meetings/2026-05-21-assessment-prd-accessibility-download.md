---
type: meeting
date: 2026-05-21
product: exam-management
participants: [Romit, Vishaka, Nipun]
source: granola
granola_id: 66898189-b888-4d9a-8765-c0ebd838cc78
---

# Assessment PRD — Accessibility Standards, Offline Exam Download, and Parity with ExamSoft

**Date:** 2026-05-21 · **Time:** 10:33 AM EDT

## Topics covered

1. Accessibility standards for Phase 1 — which standards to comply with, and whether to defer to Phase 2
2. ExamSoft accessibility compliance check (action item: consultant + independent search)
3. Offline exam download — explicit download workflow requirements vs. browser-only
4. Download window mechanics — coordinator-configured timing, student action required
5. Lockdown browser model — password-decrypt, offline taking, async submit on reconnect
6. ExamSoft parity table — scope and tagging methodology for setup options
7. Differentiators vs. parity — both need to be tracked and communicated
8. Faculty exam creation workflow — how often faculty plan ahead vs. work near the exam date
9. Copy assessment from prior year — sections, question arrangement, faculty re-assignment
10. High stakes / low stakes labels — explicitly removed from vocabulary

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_EM29 | **"High stakes" / "Low stakes" labels — KILL.** Do not categorize or label assessments as high vs. low stakes anywhere in the product. No meaningful product distinction. Remove from all UI labels, tooltips, and copy. | Admin / Faculty / Student | — |
| D_EM30 | **Accessibility Phase 1 targets (pending ExamSoft parity check):** text-to-speech, 200% magnification (not 400% — start at 200%), dyslexic font support (full feature font change), high contrast color combinations. Speech-to-text = lowest priority (Phase 2). Final scope pending consultant confirmation. | Student (exam-taker) | — |
| D_EM31 | **Download window = coordinator-configured period.** Window opens at publication; closes ~2 hours before exam. Students must take explicit action within this window — no auto-download. After window closes, student is expected to have the exam on their device. | Admin / Faculty / Student | — |
| D_EM32 | **Lockdown + async submit model.** Student takes exam offline in lockdown browser. Password (given on exam day) decrypts the exam. Student submits; exam locks immediately; background upload; "uploaded successfully" when synced. If not connected at submit time → submits automatically when reconnected. | Student | — |
| D_EM33 | **Copy assessment = copy sections + questions + structure, with reorganization capability.** Faculty copy an entire prior-year exam. Sections copy. Faculty-to-section assignments may change (faculty left; coverage dates shifted). Questions can be moved between sections after copy. Points structure typically stays same. | Admin / Faculty | — |
| D_EM34 | **Faculty do not pre-plan exam schedule at course start.** Faculty typically begin building 10 days to 1 month before the exam. Product should not rely on a blueprint of upcoming assessments at the start of a term. Any "upcoming exam reminder" feature must account for this — it cannot depend on coordinator inputting a schedule upfront. | Admin / Faculty | — |
| D_EM35 | **ExamSoft parity table format:** for every setup option, tag it as (a) parity, (b) parity-but-deferred, or (c) differentiator. Both parity gaps AND extra capabilities must be called out explicitly. Applies to the full exam management module, not just setup. | PM / Product | — |

---

## Verbatim quotes

> "So the expectation is you have downloaded the exam on your device, and irrespective of availability of Internet, you are able to successfully take the exam at the prescribed time and date." — Vishaka (on offline exam download)

> "You have to create a workflow that will explicitly point them that there is some action needed from them they come to take the actual exam. That's what that whole download workflow is." — Vishaka (on why auto-download isn't sufficient)

> "If they are not able to submit because of lack of connectivity, then whenever they are connected to the network again, is when it gets submitted. That is what how it should be." — Vishaka (on async submission)

> "High stakes, low stakes, we don't want to put those labels. How does it matter whether it's high stakes or low stakes?" — Vishaka

> "Start at 200 [percent magnification]." — speaker (on accessibility — choosing 200% over 400%)

> "The entire font of the feature changes to dyslexic friendly font." — speaker (on dyslexic font support scope)

> "Speech to text is the lowest priority among all." — speaker

> "You'll need to create a table and you say, these are the 20 things related to setup. And we are offering 18 out of the 20, or we are offering 22." — speaker (on parity tracking)

> "We are not creating a new product [that] is not in the market. We are challenging a giant that already exists. So we need to do this exercise for the entire exam management module." — speaker

> "Some faculty like working on an assessment ten days before the actual assessment. Like, if a course has two midterms and one final... they may not go at the beginning of the course first week and say, oh, I have two midterms, one on this day." — Vishaka (on faculty planning habits)

> "A way for us to copy the structure in terms of and the questions, but giving them the ability to edit, reorganize questions, move them to other sections. Would help." — Vishaka (on copy assessment workflow)

> "The faculty related to those sections might be different. Because maybe the faculty left, or it might be the same." — Vishaka (on section faculty re-assignment after copy)

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| `apps/exam-management/admin/components/create-assessment-modal.tsx:271` | "high-stakes" label on Proctored mode button | Removed today (D_EM29). |
| `apps/exam-management/admin/components/create-assessment-modal.tsx:283` | "low-stakes" label on Self-paced mode button | Removed today (D_EM29). |
| `apps/exam-management/admin/components/create-assessment-modal.tsx:351` | "recommended for high-stakes" in scoring checkbox copy | Removed today (D_EM29). |
| `apps/exam-management/admin/components/create-assessment-modal.tsx:363` | "low-stakes only" in scoring checkbox copy | Removed today (D_EM29). |
| `apps/exam-management/admin/app/(app)/settings/page.tsx:196` | "Immediate (low-stakes quiz)" in publication mode selector | Removed today (D_EM29). |
| `apps/exam-management/admin/app/(app)/settings/page.tsx:197` | "Faculty-published (high-stakes)" in publication mode selector | Removed today (D_EM29). |
| `apps/exam-management/admin/app/(app)/settings/page.tsx:203` | "Default chair-review window for high-stakes exams" SettingRow label | Removed today (D_EM29). |
| `apps/exam-management/assessment-taker/src/pages/PostExam.tsx:138` | "This is a high-stakes exam." opening sentence in results-pending message | Removed today (D_EM29). |
| `apps/exam-management/assessment-taker/src/data/assessments.ts:6,18,135,169` | "high-stakes" / "low-stakes" in file-level comments and mock-data comments | Cleaned today (D_EM29). |

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T59 — Remove high/low stakes labels from all UI | P1 | ✅ Applied today: `create-assessment-modal.tsx`, `settings/page.tsx`, `PostExam.tsx`, `assessments.ts`. |
| T60 — Accessibility settings panel for exam-taker | P1 | NEW SCREEN NEEDED. Student-facing settings during exam: text-to-speech toggle, magnification (200%), dyslexic font toggle, high contrast toggle. DESIGN-REVIEW — pending final ExamSoft parity check from consultant. D_EM30. |
| T61 — ExamSoft parity table — full exam management module | P0 (blocker) | PM / Nipun task: table of every exam management feature tagged as parity / parity-deferred / differentiator. Must be complete before further setup screen design. D_EM35. |
| T62 — Copy assessment — section reorganization UX | P1 | Builds on T51 "Copy existing" path. After copy: support moving questions between sections, re-assigning sections to different faculty. D_EM33. FLAG for DESIGN-REVIEW — requires section drag+drop or move-to-section affordance. |
