---
type: meeting
date: 2026-05-14
product: pce
participants: [Romit, Adi (PCE PM/designer)]
source: granola
granola_id: 6a648f67-bb87-4771-8258-a0840ef41efd
---

# Course Evaluation Survey Design — Base Entities and Product Structure

**Date:** 2026-05-14  **Time:** 9:31 AM EDT

## Topics covered

1. Base entity scope for course evaluation module (aligned to exam management approach)
2. Survey answer types — what's in Phase 1
3. Question bank import for surveys
4. Traditional vs. AI-native flow
5. Likert scale configurability
6. PRD status: what's approved vs. in review

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_CE1 | PCE Phase 1 survey answer types: **Likert scale + free text ONLY** | PCE | — |
| D_CE2 | Question bank import for surveys: **NOT phase 1** — ignore for now | PCE | — |
| D_CE3 | Import method for survey questions: **PDF document only** — no Canvas/LMS integration | PCE | — |
| D_CE4 | Likert scale is configurable at **settings level** by program director (pointer options: 3, 4, 5, 7, 10) | PCE Admin | — |
| D_CE5 | Existing **live surveys don't change retroactively** when Likert settings are updated (engineering constraint) | PCE | — |
| D_CE6 | **AI-native survey flow: NOT phase 1** — traditional (manual) flow only comes first | PCE | — |
| D_CE7 | PCE base entity design (terms, course offerings, faculty landing pages) due **Tuesday May 19** | PCE Design | — |
| D_CE8 | PCE **analytics PRD not yet approved** — don't design analytics until review complete | PCE | — |
| D_CE9 | PCE **create template + push survey PRD = approved** — start design from this PRD | PCE | PCE ADR-002 (draft) |

---

## PRD status (from Adi)

| Document | Status |
|---|---|
| Create template + push survey PRD | ✅ Approved — engineering kickoff scheduled |
| Student responses PRD | 🔄 Adi drafting next |
| Analytics PRD | ⏳ In review — not yet approved |

---

## Survey flow (Phase 1 — traditional)

1. Program director creates a template (manual, from scratch)
2. Select answer type per question: Likert (configured pointer) or free text
3. Push survey to a course offering / term
4. Students respond
5. Results available in analytics (when analytics PRD is approved)

AI-native flow (auto-pilot, scheduled surveys): deferred to Phase 2.

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| PCE base entity landing pages | P0 | Terms, course offerings, faculty — one page per entity. Due Tue May 19. |
| PCE settings page (Likert scale config) | P1 | Program director sets default pointer (3/4/5/7/10). Show warning when changing won't affect live surveys. |
| Create template UI | P1 | Manual, zero-state → add questions → Likert or free text per question. No QB import. |
| Push survey UI | P1 | Select course offering / term, configure distribution window |

---

## Verbatim quotes

> "When you create the questions, we'll assume that you upload your course evaluation form, and you will build a template. Zero state where the user has to select section one, add questions manually, complete self serve." — Adi

> "AI native flow will never be part of phase one. Because that will slow us down." — Adi

> "An existing survey which is already live will have to be five [pointer]. Because that's the engineering bottleneck." — Adi
