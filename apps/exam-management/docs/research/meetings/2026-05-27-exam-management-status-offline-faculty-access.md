---
type: meeting
date: 2026-05-27
product: exam-management
participants: [Vishal, Aarti (Adi), Nipun, Bhargava, Michelle Vailati, Romit]
source: granola
granola_id: 943b9e4a-9d63-4ab7-b63e-07bc22b3c4e9
---

# Exam Management — Assessment Creation, Faculty Access, and Offline Mode

**Date:** 2026-05-27 · **Time:** 7:29 AM EDT
**Call:** Weekly Thursday exam management team call

## Topics covered

1. Exam management project status by epic (question bank, assessment creation, distribution, collaboration)
2. Faculty access levels — full access, read-only, add-own, section-level contribution
3. Offline mode / standalone desktop client — build vs. Respondus integration, Q1 vs. December timeline
4. Student experience PRD review (Bhargava's document)
5. Course offering landing page requirements (Nipun's PRD + wireframes)
6. Accreditation module — 3-bucket framing and early research
7. Certifications module — near-term scope (templates + internal certs)
8. Survey and course evaluation status update

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_EM45 | **Offline mode / standalone desktop → Q1 deliverable, NOT December launch.** December launch is browser-only. Offline download mode (students pre-download exam file before exam day) is desirable but not a must-have for the initial release. Decision driven by complexity of lockdown-browser integration and tech research still in progress. | Admin / Faculty / Student | — |
| D_EM46 | **No standalone desktop client being built — Respondus integration instead.** Rather than build own lockdown browser from scratch (ExamSoft took 10+ years), use Respondus or a similar vendor. This reduces build risk and allows earlier offline capability delivery. "My 2¢ would be live with the limitations of Respondus or whatever that is for now. But figure out how to integrate that." — Aarti | Eng | — |
| D_EM47 | **Browser-based exam has preload safety net.** Browser mode already downloads all exam data at exam start. If WiFi drops after start, student can continue. This mitigates the risk of browser-only December launch. Known gap: if Internet fails BEFORE login/start, student cannot begin the exam. | Eng | — |
| D_EM48 | **Faculty access levels: 4 tiers, roles document needed.** Aarti's direction: (1) Full access — CRUD on everything; (2) Read-only; (3) Add assessments but not modify others'; (4) Add/modify only their own. Section-level contributor (faculty assigned to specific section with question target and deadline) = DEFER to phase 2. Roles alignment document to be created by Romit + PMs + Vishaka. | Admin / Faculty | — |
| D_EM49 | **Contributor/reviewer workflow → Phase 2.** Explicitly deferred. Section-level faculty assignment with question targets and contribution deadlines is not Phase 1. Faculty ownership at assessment level (not section level) is the Phase 1 mental model. | Admin / Faculty | — |
| D_EM50 | **Collaborative grading → stretch goal (November/December at earliest).** Remains in the PRD document but labelled as stretch goal. Not part of the Q3 or launch roadmap. | Admin / Faculty | — |
| D_EM51 | **Certifications module — near-term scope.** Two near-term elements: (1) add more templates, (2) support internal certifications on the same platform. Broader product direction (direct vs. indirect revenue, sellability) to be discussed in June 2026. | Admin | — |
| D_EM52 | **Faculty cannot view student scores via contributor/reviewer access.** Explicit reconfirmation: contributor access to assessment creation/question-building does NOT grant access to see student scores. Score visibility is limited to admin and course coordinator (reinforces §5.32). | Admin / Faculty | — |
| D_EM53 | **Survey/CFE design review: tomorrow (May 28) 8–8:30 AM EST.** Romit presents first version of create-template and push-survey flows. Aarti reviewing for the first time. | Process | — |
| D_EM54 | **Accreditation module framing: 3 buckets.** (1) Project management (tracking site visits, timelines), (2) Data collection (mapping Prism data to accrediting body requirements), (3) Electronic transactions (direct integration with accrediting body databases, e.g., ARC-PA monthly updates). Discussion and research in progress; no design tasks yet. Follow-up call: Tuesday June 2, 6 AM. | Admin | — |

---

## Verbatim quotes

> "We are not going to make standalone desktop a must-have for launch. It will be highly desirable to have it, but not a must-have. As long as there is a fixed date by which we can do it." — Aarti

> "My 2¢ would be live with the limitations of Respondus or whatever that is for now. But figure out how to integrate that. That will also reduce their footprint and allow us to bring this capability in our product earlier with some known limitations, but that's okay." — Aarti

> "If even four or five students say they are not able to connect with the Internet or their device is not connecting, I don't want... I am making sure that my exam starts on time." — Nipun (explaining why offline mode matters for high-stakes exams)

> "I just want to reiterate. I'll be using raw mix bandwidth to finish some minor changes in question bank. I need at least one day bandwidth for an assessment experience. And then after that, we'll work on assessment creation flow." — Nipun

> "We will only build the basic assessment creation this month, this quarter, which is planned. And those stretch goal items will be picked sometime later when we have time, November, December." — Vishal

> "Faculty can create assessments and has access to [a] section of assessment — that doesn't mean they can view student scores once the exam is administered." — Nipun (reconfirmation of role isolation)

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| `apps/exam-management/docs/aarti-decisions-summary-2026-05-08.md` §5.35 | Says "Download exam — confirmed Phase 1. Default = download-and-take." | ⚠️ SUPERSEDED by D_EM45. Update to Q1. |
| `apps/exam-management/docs/workflows/_backlog.md` T58 | "Download exam — Phase 1 confirmed" | ⚠️ Update: now Q1, not December launch. |
| `apps/exam-management/admin/app/(app)/assessment-builder/assessment-builder-client.tsx` | No contributor/section assignment UI exists in code. | ✅ Correct — contributor workflow was never built. |
| `apps/exam-management/admin/components/create-assessment-modal.tsx` | Steps 2–3 still contain scheduling/proctoring (should be in Stage 2/Publish per T66). | Flagged as T66 — DESIGN-REVIEW. No new action. |

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T68 — Faculty access levels: create alignment document | P0 | Romit + PMs + Vishaka to produce roles document. Full / read-only / add-own / add+modify-own / section contributor (Phase 2). No design screens until document is aligned. D_EM48. |
| T69 — Update T58: offline exam mode is now Q1, not December | P1 | T58 in backlog says "Phase 1 confirmed." Revise to "Q1 deliverable." Browser-only for December with preload safety net. D_EM45 supersedes §5.35. |
| T70 — Respondus integration research (engineering) | P1 | Research Respondus lockdown browser integration. Report options and constraints before Q1 sprint. D_EM46. |
