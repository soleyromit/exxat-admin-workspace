---
type: meeting
date: 2026-07-20
product: pce
participants: [Romit Soley, Monil]
source: granola
granola_id: 7cc5879f-c23d-4430-8430-8764380e33bc
---

# Survey design — course-to-template assignment and data validation flow — 2026-07-20

> Monil + Romit design review (Jul 20, 9:05 AM EDT). Topics: step order redesign for the setup evaluations wizard (template assignment → data audit, previously reversed), combined step 1+2 option, "Create Template" CTA for first-time entities in dashboard cards, soft warning treatment for missing data, priority sequencing. Vishal proposed the combined-step approach in a separate review call with Yash. Two action items for Romit: (1) combined step design — urgent, affects dev sequence; (2) Create Template CTA — lower priority.

---

## Topics covered

- Prior step order: Step 1 = data gap identification → Step 2 = course-to-template assignment
- Proposed new order (Vishal's direction, confirmed by Monil): Step 1 = course-to-template assignment → Step 2 = data audit/validation
- Rationale: once template is assigned, the system knows exactly which evaluatees to expect per course, making the data audit deterministic rather than asking admin to declare upfront
- Combined step option: merge course-to-template assignment table and data-audit table into a single table/step — preferred if not too cluttered
- Fallback: if combined is too wide (too many columns), keep separate steps in new order (template first, audit second)
- Dashboard card: "Create Template" CTA must surface for entities with zero templates AND no prior survey push
- Soft warning for missing faculty/student rows — NOT a hard block; admins can skip and proceed
- Zero students = hard block on survey push (backend logic only — no design change needed)
- Yash design review cycle happening in parallel; Vishal will review combined flow once complete
- After this design task, Romit returns to analytics

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0720B_01 | **Step order reversal: course-to-template assignment FIRST, data audit SECOND.** Monil (relaying Vishal): "the order has to be in this way. First you select courses using filters. Then you assign templates to each course and then you validate the data." Replaces the Jul 14 step-1-as-data-audit direction (T111). | pce | T104, T111 |
| D_PCE_0720B_02 | **Combined step 1+2 design is the primary deliverable — URGENT.** Monil: "you will have to think through that exactly when we do the swap of table. What columns would be removed? And what columns would be added." Try building combined course-selection + template-assignment + data-flag columns in a single table first. If too cluttered, fall back to two separate steps in new order. Affects development sequence — must be done first. | pce | T104, T111, T124 |
| D_PCE_0720B_03 | **"Create Template" CTA to appear in dashboard cards for first-time entities.** Monil: "if I am not wrong Riverside DPT Lakeside and summit only these three would have that CTA." Also: Cascade. The CTA surfaces when: (a) entity has zero templates created AND (b) entity has never pushed a survey. Entities with a prior-term push (Harbor, Spring 2026, Fall 2026) do NOT show this CTA — template already exists. | pce | T46, T114, T125 |
| D_PCE_0720B_04 | **Missing faculty/student = soft warning only, not hard block.** Monil: "yes that is true yes so we will just give them soft warning. So this is just enabling them to identify which courses need attention but they can skip adding a faculty and proceed we will allow them." | pce | T109, T126 |
| D_PCE_0720B_05 | **Zero students = hard block on survey push — backend only.** Monil: "the only hard check would be on [zero students cases]. You cannot. Proceed with zero students courses." No design change — backend validation, not a UI affordance. | pce | — |
| D_PCE_0720B_06 | **Priority: combined step design first (urgent), then Create Template CTA, then analytics.** Monil: "I will want you to work on that on priority today and then you can. Start. This create template CTA create template CT I feel is not a major task." | pce | T124, T125 |

---

## Verbatim quotes (Monil)

> "the order has to be in this way. First you select courses using filters. Then you assign templates to each course and then you. Validate the data."

> "we should try to think of a design where we can combine both. We'll build that design. And we will also propose our opinion of why combining step one and step two would not be feasible."

> "you will have to think through that exactly when we do the swap of table. What columns would be removed? And what columns would be added."

> "we will just give them soft warning. So this is just enabling them to identify which courses need attention but they can skip adding a faculty and proceed we will allow them."

> "the only hard check would be on [zero students cases]. You cannot. Proceed with zero students courses."

> "if I am not wrong Riverside DPT Lakeside and summit only these three would have that CTA."

> "I will want you to work on that on priority today and then you can. Start. This create template CTA create template CT I feel is not a major task it's a very minor feedback."

> "wherever there is a first evaluation that is about to set up create template would be a mandatory action item that we will show them."

---

## Design tasks generated

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T124 | Setup evaluations flow redesign: combined course-selection + template-assignment + data-audit in single table — URGENT | Admin | Setup evaluations wizard (dashboard → term card → "Setup Evaluations") | **P0 URGENT** | D_PCE_0720B_01, D_PCE_0720B_02. Primary deliverable: one unified table with columns for course, template picker, and data-gap flags (missing faculty / missing student). If too many columns → fallback to two separate steps in new order (template first, audit second). Must be complete before dev picks up this flow. Supersedes T111 step-1-as-data-audit direction. Needs Romit design direction — do NOT touch code without it. |
| T125 | Dashboard cards: "Create Template" CTA for entities with zero templates and no prior survey push | Admin | Dashboard term cards (setup evaluations entry) | P1 — DESIGN-REVIEW | D_PCE_0720B_03. Entities: Riverside, DPT Lakeside, Summit, Cascade. Condition: zero templates created AND no prior-term survey pushed. Entities with a prior push (Harbor, Spring 2026, Fall 2026) do not show CTA. Can be stacked above existing CTAs on the card. Supplements T114 (4-scenario dashboard design). |
| T126 | Soft warning treatment for missing faculty/student rows in combined step | Admin | Setup evaluations wizard — data-audit column | P1 — DESIGN-REVIEW | D_PCE_0720B_04. Rows with missing faculty or student data show a soft warning indicator (inline alert, flag badge, or caution icon). Proceeding past the warning is allowed. Only zero-students courses are hard-blocked (backend; no UI change needed per D_PCE_0720B_05). Design the warning state per DS patterns — use `LocalBanner` or inline badge, never toast. |
