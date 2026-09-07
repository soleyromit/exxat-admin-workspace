# Learning Contracts — Design Backlog

## Initial tasks — added 2026-08-24

Source: `docs/research/meetings/2026-08-24-aarti-focus-directive.md`

> Aarti directed Romit (via 1:1 with Arun, 2026-08-24) to begin focusing on learning contracts as a new design area, alongside skills checklist and emerging domain research. Product is not yet scaffolded.

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T_LC_01 | **Begin design exploration for learning contracts.** Aarti-directed new focus area (2026-08-24). Start with: (1) understanding the existing Prism learning contracts feature set and its pain points; (2) persona mapping for admin, faculty, and student roles; (3) identifying the core workflow (contract creation → assignment → student acknowledgment → tracking). No screens to build yet — this is a discovery and scoping phase. | Admin / Faculty / Student | Product-level | P1 | Aarti directive via Arun 1:1. Pair with T_SC_01 (skills checklist). NEW PRODUCT — DESIGN-REVIEW before any screen work. |
| T_LC_02 | **Emerging domain research for learning contracts context.** As part of the broader emerging domains initiative (4 new domains, 10 universities each), understand what accreditation bodies and clinical programs expect from learning contracts. Research task — informs personas and feature scope before any design. | Research | Product | P1 | Pairs with the emerging domain research Aarti assigned. Zendesk + domain-specific accreditation sources. |

## Tasks from 2026-09-03 stakeholder review (Ankit prototype walkthrough)

Source: `docs/research/meetings/2026-09-03-learning-contracts-config-workflow.md`

> First full stakeholder review of Ankit's prototype. 14 design directives captured. Scope NOT yet frozen — tech team capacity TBD. Q1 is the hard deadline (Adi + Kunal explicit). No lightweight release.

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T_LC_03 | **Configuration UI: redesign as full-page multi-step, not drawer.** Current prototype uses a 1/3-width drawer. Directive: put all config on the main page as a multi-step flow. If a drawer is ever used for editing, it must be 2/3 width. Summary of configuration should appear on the main screen; edit action opens a 2/3 drawer. | Admin | Configuration setup | P0 | Adi: "Why don't we just create the entire page and leave the page as the editable form." |
| T_LC_04 | **Living document concept: perpetual edit after sign-off.** Contracts remain editable by all parties at any time, even after full sign-off. Admin configures whether edits trigger mandatory reapproval or only notifications. This replaces the current checkpoint-locked model. | Admin / FI / FL / Student | Contract lifecycle | P0 | "It needs to be a forever purchable perpetual edit mode." Primary SW pain point. |
| T_LC_05 | **Audit log at field level.** Every edit must capture who changed what field, what the old and new values were, and when. Available to all stakeholders. | Admin / FI / FL | Contract view | P0 | Confirmed by Adi: "Yes." Required alongside living document. |
| T_LC_06 | **Secondary reviewer policy: two separate flags.** Split the single secondary-reviewer toggle into: (1) Allow secondary reviewer participation — yes/no. (2) Make participation mandatory when secondary reviewer is assigned — yes/no. | Admin | Configuration policy | P1 | "Allow versus mandate." Current prototype conflates the two. |
| T_LC_07 | **Checkpoint-level rating scale (configurable per checkpoint).** Rating scale can differ between midterm and final checkpoints (e.g., midterm = on-track/off-track; final = 1–5). Show a caution/warning when scales differ across checkpoints. Only super admin can configure. | Admin | Configuration — checkpoints | P1 | "We just need to tell them. We noticed the scales are different. Hope you are aligned." |
| T_LC_08 | **Checkpoint flag: will this count toward competency tracking?** Each checkpoint definition needs a "count for competency: yes/no" flag. Replaces the current implicit logic (midterm overwritten by final). | Admin | Configuration — checkpoints | P1 | Directive from Vishaka + Adi. Coordinate with Sankalp on scoring engine impact. |
| T_LC_09 | **Applicability levels (4): placement / course / year / student.** Admin configures scope of each contract. Four levels: (1) placement, (2) course (shared across placements in a course), (3) year, (4) student-universal. | Admin | Configuration | P1 | "Is it at the placement level? Is it at the course level? At placement level… course level… year level… universal." |
| T_LC_10 | **Notification design: no per-field email triggers.** Stage-transition notifications (student → FI → FL) are required. Per-field save notifications are too aggressive. Design alternatives: daily digest, per-session batch, or stage-only. Must be decided before implementation. | Admin / All parties | Notifications | P1 | Adi: "every field change… you really need to think through this properly." Flag for dedicated design pass. |
| T_LC_11 | **Navigation placement: learning contracts in placement management card.** On the product dashboard, learning contracts appears as its own navigation item inside the third card (placement management / sites + placements + evaluations). | All | Navigation | P1 | Per Ankit's prototype overview. |
| T_LC_12 | **Multi-placement checkpoint scoping.** When a learning contract is shared across multiple placements, each placement has its own independent set of checkpoints (not one global set). Checkpoints are scoped to the placement attached to that course. | Admin / Student / FI | Checkpoint design | P1 | Aarti: "placement one will also have its checkpoints of midterm and final, and placement two will also have its midpoints." |
| T_LC_13 | **Self-assessment at checkpoints: configurable toggle.** Admin can enable/disable student self-rating at each checkpoint type. Separate toggle for justification comments. | Admin | Configuration — checkpoints | P2 | Ankit confirmed. Default off; programs opt in. |
| T_LC_14 | **Cohere session prep (Sep 15): review Katie + Kanti's presentation plan.** Adi wants to review the proposed Cohere session content before Sep 15. Romit should be in the loop — attend or review before the session. | Romit | Process | P0 | Adi: "Kanti, why don't you and Katie set up some time with me on September 15." |
