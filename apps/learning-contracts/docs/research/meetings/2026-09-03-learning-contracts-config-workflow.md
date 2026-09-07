---
type: meeting
date: 2026-09-03
product: learning-contracts
participants: [Romit Soley, Ankit (PM), Adi/Aarthi, Katie, Kanti, Kunal, Vishaka]
source: granola
granola_id: 7957f86d-f692-49cb-9c76-8c0366dc08bd
---

# Learning contracts — configuration, workflows, and phased rollout — 2026-09-03

**Date:** 2026-09-03 8:29 AM EDT
**Participants:** Romit (Design), Ankit/Pankaj (PM presenting prototype), Adi/Aarthi, Katie, Kanti, Kunal, Vishaka

---

## Context

Ankit presented the first-draft prototype for the learning contracts module covering: admin configuration flow, checkpoints, rating scales, notifications, and the learning contract lifecycle. This was a cross-disciplinary stakeholder review (social work, counseling, OT, public health). Meeting also served as a dry run before a planned Cohere conference session.

---

## Key decisions

### D1 — Living document (perpetual edit)
Learning contracts must be perpetually editable even after all parties have signed off. Current Prism locks the contract to checkpoint-only edits. This is a hard requirement and a primary pain point to address.

> "It needs to be a forever purchable perpetual edit mode. Once it has been even though approved and up by field instructors and field liaisons, the students would be constantly able to make edits."

### D2 — Audit log at field level
Full audit history required — who made what change, to what field, at what time. Confirmed by Adi: "Yes."

### D3 — Applicability levels (4)
Admin configures learning contract scope:
1. Placement (current route)
2. Course (shared across all placements within a course)
3. Year (shared across all courses in a year)
4. Universal / student-level (referred to across any course or placement)

### D4 — Multi-placement sharing (primary pain point)
Learning contract can be attached to multiple placements. When sharing, each placement gets its own set of checkpoints (midterm/final per placement, not global). This resolves the biggest SW pain point.

### D5 — Checkpoint setup at course level, editable
Base checkpoint template is defined at program level and pulled into courses automatically. Courses can edit. Supports multi-placement scenarios where each placement's checkpoints are scoped to that placement.

### D6 — Checkpoint flag: competency tracking
Each checkpoint definition needs a "will this be considered for competency tracking? yes/no" flag. Current logic uses midterm while available, then replaces with final. Future: allow explicit per-checkpoint control.

> Vishaka: "which one is going to be counted for competency tracking? […] you need to think about that."
> Adi: "you can add one more bit that says will this be considered for competency? Yes, no."

### D7 — Checkpoint-level rating scale (configurable)
Rating scale can differ between checkpoints (e.g., midterm = "on track/off track", final = 1–5). Show a caution warning if different scales are set. Only super admin can configure.

> Kanti: "at midpoint, we just say, are they on track, off track. And then at final, we really give them a rating number."
> Adi: "I think we just need to tell them. We noticed that the is it we just wanna ensure that this is, by design."

### D8 — Secondary reviewer: two separate policy flags
Not a single toggle. Two distinct admin policies:
1. **Allow secondary reviewer participation** — yes/no
2. **Mandatory when secondary reviewer is available** — yes/no

Current prototype had a single toggle. This needs to be split.

> "Allow versus mandate. Correct." — Vishaka/Adi

### D9 — Notification design: NOT per-field
Per-field email notifications on every save are too aggressive. Options: daily digest, batch-per-session, or stage-transition only. Stage notifications (student → FI → FL) are required. Field-level must be reconsidered with more configuration before implementing.

> Adi: "every field change, I think it's going to you really need to think through this properly."

### D10 — Configuration UI: full page, not 1/3 drawer
Config setup should be on the main page (multi-step within the page, not a narrow drawer). If a drawer is used, it must be 2/3 width, not 1/3.

> Adi: "Why don't we just create the entire page and leave the page as the editable form of the configuration."
> Ankit: "we will come up with a slightly different way that rather than obviously sightseeks and draws. Can it on the page itself with multiple steps."

### D11 — Summary before saving: show metadata on main screen, edit in drawer
After configuration is complete, the main screen shows the config summary metadata. Edit action opens a drawer (2/3 width). This replaces the current approach of everything in a 1/3 drawer.

### D12 — Navigation placement
Learning contracts goes in the "placement management" card (third card on the dashboard), as its own navigation item.

### D13 — Reapproval policy (configurable)
After a signed contract is edited, whether reapproval from all parties is mandatory or only notifications are sent is an admin-configurable policy. Some programs (high caseload) do not want mandatory reapproval on every edit.

### D14 — Self-assessment at checkpoints (configurable toggle)
Admin can enable/disable student self-rating at checkpoints. With/without justification comments also configurable.

---

## Deferred to Phase 2

- **Pre-placement supervisor signing**: supervisor signature before rotation start date (counseling/CMHC use case) — blocked on placement association logic
- **Evaluation scope visibility per placement**: whether scores from one placement are visible in sibling courses — not phase 1
- **Two-entity model** (contract + separate evaluation module): OT use case — linking from evaluation module continues as today; learning contracts scope does not change that

---

## Timeline

- Target: Q4 deployment — NOT confident given scope
- **Hard commitment: Q1 is the absolute deadline** (Adi and Kunal explicit)
- No lightweight version acceptable — "I'm not in favor of releasing lightweight version of this" (Kunal)
- Scope freeze expected in 1–2 weeks; tech team capacity TBD
- Cohere session (Sep 15): Kanti and Katie to present concept + targeted questions; no screens to be shown yet pending Adi review Sep 15

---

## Action items for Romit

- Update learning contracts backlog with all phase 1 directives from this meeting
- Redesign configuration UI: full-page multi-step flow, not drawer
- Add two-flag secondary reviewer policy UI to configuration
- Add per-checkpoint: rating scale + competency tracking flag
- Add living document concept to core prototype spec
- Add audit log to feature requirements
- Rethink notification design (no per-field triggers — propose alternatives)
- Attend or review Cohere prep session on Sep 15 with Kanti and Katie
