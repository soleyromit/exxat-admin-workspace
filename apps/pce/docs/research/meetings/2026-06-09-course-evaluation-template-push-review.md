---
type: meeting
date: 2026-06-09
product: pce
participants: [Romit, David]
source: granola
granola_id: 3fd2ac92-2d54-467c-b2be-986290459c1e
---

# Course Evaluation & Programmatic Surveys — Template Creation and Push Flow Review

**Date:** 2026-06-09 · **Time:** 8:45 AM EDT
**Context:** Romit walkthrough of course evaluation and programmatic surveys designs with David (and references to past Aarti/Adi feedback). Full review of template creation flow, section setup, PDF upload placement, visibility settings, and anonymous response handling.

## Topics covered

1. Template creation entry point — Build new / Copy existing / Import from PDF/Word
2. Section setup — selecting evaluatee roles, descriptions vs. labels-only
3. Workload question — identified as not making sense in Course Content section
4. PDF/Word upload placement — top-level vs. per-section
5. Section-level add-from-template option — removed as redundant
6. Visibility setting (private / share with program) — killed for course evaluation
7. Anonymous response toggle — killed; replaced by informational message
8. Anonymous share link — discussed but not finalized

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_PCE46 | **Remove "workload" question from Course Content section.** "Is workload. All these verbatim will need to be verified. Validated. And the post content, you have workload of which doesn't make sense. So we'll have to remove that." — David. APPLIED: removed q3 ("The workload was appropriate for the credit hours.") from `MOCK_TEMPLATES[0].questions.course_content` in `pce-mock-data.ts`. `questionCount` updated from 8 to 7. | Admin | — |
| D_PCE47 | **Responses are anonymous by default. Do not ask. Convey the message instead.** "This response is anonymous. I think we don't need to ask. By default, it would be anonymous. By default, Yes. Yes. It has to be anonymous. So we should not ask. We'll just convey the message that response is going to be anonymous." — David/Them. APPLIED: added "Responses are anonymous" row to the Step 3 summary panel in `surveys/push/page.tsx`. No toggle exists in the push flow (correct). | Admin | — |
| D_PCE48 | **Template creation: add top-level PDF/Word document upload option alongside manual and copy-from-existing.** "I'm gonna wanna upload my PDF likely on that main, like, template screen. Can we not have an upload PDF from this screen where they can just upload one document and it pulls that information forward instead of it buried within each individual section." — David. Aarti's past preference reaffirmed: upload should be inside "Build New" path, not as a third top-level card. DESIGN-REVIEW — structural change to `CreateTemplateSheet`. T60. | Admin | — |
| D_PCE49 | **PDF upload must accept PDF AND Word documents. Label accordingly.** "Why are we just saying PDF? Like, do do we not support Word? ... If word is also fine, then we just call it out. Like, PDF or a word document or whatever ... PDF is PDF. Then they'll think that they first have to convert their word file into a PDF and then upload it." — David. When T60 is built, label the upload as "PDF or Word document" and set `accept=".pdf,.doc,.docx"`. Part of T61. | Admin | — |
| D_PCE50 | **Remove per-section PDF/document upload option. Remove per-section "add from template" option.** "This section level upload doesn't come into picture at all... So now for each section, we don't have to repeat the options. It's making it too complicated... if we're only letting them write questions manually, just go straight into the interface of letting them actually write the questions." — David/Them. VERIFIED: no per-section import or add-from-template exists in `templates/[id]/page.tsx`. Code is already correct — no change needed. | Admin | — |
| D_PCE51 | **Remove visibility toggle (private / share with program) from course evaluation.** "I don't think they had, like, public surveys where without any control or review, whatever when as and when the student respond, everyone can see the results... This whole section is not needed. Visibility... We are going to have a review and release results workflow." — David/Them. VERIFIED: no visibility section exists in `surveys/push/page.tsx`. Code is already correct — no change needed. | Admin | — |
| D_PCE52 | **Section labels should come from program (no hardcoded descriptions). Just labels — no description text below the label.** "I feel we should not have that description. We can just have the labels. Course content, course instructor, and so on." — David/Them. VERIFIED: `CreateTemplateSheet` shows only label checkboxes, no description text. Template editor sidebar shows only label + count. Code is already correct. Existing T35 (section list from Prism roles) remains open. | Admin | — |
| D_PCE53 | **All question text verbatim in mock data needs validation with program stakeholders before launch.** "All these verbatim will need to be verified. Validated." — David/Them. The remaining question texts in `pce-mock-data.ts` are placeholders and should not be used for customer demos without review. Tracked as T62 (low priority). | Admin | — |

---

## Verbatim quotes

> "Is workload. All these verbatim will need to be verified. Validated. And the post content, you have workload of which doesn't make sense. So we'll have to remove that." — David

> "I'm gonna wanna upload my PDF likely on that main, like, template screen. So if you x out of this little card, that's like I'm not gonna have my Word document or a PDF broken up into and have five different Word docs or five different sections. I'm gonna have one Word doc that is my entire post course evaluation survey." — David

> "Why are we just saying PDF? Like, do do we not support Word? ... PDF is PDF. Then they'll think that they first have to convert their word file into a PDF and then upload it." — David

> "This whole section is not needed. Visibility, because we are going to control we are not gonna call it visibility. We are going to have a review and release results workflow." — Them

> "This response is anonymous. I think we don't need to ask. By default, it would be anonymous. By default, Yes. Yes. It has to be anonymous. Yeah. So we should not ask. We'll just convey the message that response is going to be anonymous." — Them

> "So now for each section, we don't have to repeat the options. It's making it too complicated... if we're only letting them write questions manually, just go straight into the interface of letting them actually write the questions." — Them

> "If Adi has a preference for it, let's not go back because, otherwise, again, it will take longer time for all of us to align. So let's take her feedback." — Them (re: PDF upload placement inside Build New, respecting Aarti's earlier directive)

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| `apps/pce/admin/lib/pce-mock-data.ts:116` | q3: "The workload was appropriate for the credit hours." present in `MOCK_TEMPLATES[0].questions.course_content`. | ✅ APPLIED: removed. D_PCE46. |
| `apps/pce/admin/app/(app)/surveys/push/page.tsx` Step 3 | No "Responses are anonymous" informational note exists. No anonymous toggle (correct). | ✅ APPLIED: added SummaryRow "Privacy → Responses are anonymous". D_PCE47. |
| `apps/pce/admin/components/pce/pce-modals.tsx` CreateTemplateSheet | No PDF/Word upload option in template creation flow. Only manual section selection via checkboxes. | 🔴 DESIGN-REVIEW (T60). New top-level upload entry point needed. D_PCE48. |
| `apps/pce/admin/app/(app)/templates/[id]/page.tsx` | No per-section PDF upload or "add from template" option. Section editor goes straight to question writing. | ✅ Already correct — no change needed. D_PCE50. |
| `apps/pce/admin/app/(app)/surveys/push/page.tsx` | No visibility toggle in push flow. | ✅ Already correct — no change needed. D_PCE51. |

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T60 | P1 — DESIGN-REVIEW | Template creation: add top-level PDF/Word upload option inside "Build New" path in `CreateTemplateSheet`. Romit to define exact flow and wireframe. D_PCE48. |
| T61 | P1 (part of T60) | When T60 is built: label upload as "PDF or Word document", set `accept=".pdf,.doc,.docx"`. Pairs with T74 (exam-management). D_PCE49. |
| T62 | P3 (pre-launch) | All question text in `pce-mock-data.ts` needs validation with program stakeholders before customer demo. D_PCE53. |
