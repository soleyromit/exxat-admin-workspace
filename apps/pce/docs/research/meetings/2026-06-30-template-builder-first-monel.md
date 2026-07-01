---
type: meeting
date: 2026-06-30
product: pce
participants: [Romit Soley, Monel]
source: granola
granola_id: 6932e692-ae80-4be2-ba11-1e0f354d73b7
---

# Course evaluation template — builder-first flow and role-based sections — 2026-06-30

> Design review of Romit's current course evaluation create-template screens. Monel reviewing and giving direction. Engineering starting front end soon. Key structural call: builder should come before details in the template creation flow.

## Topics covered

- Create template flow: builder-first vs details-first ordering
- Role-based sections in template: grouping concept discussed and rejected
- Faculty roles: predefined from Prism settings only, no custom labels
- Likert scale settings: duplicate "answer type labels" section to be removed
- Left nav layout: Aditi explicitly wants this shown
- Course evaluation nav item: expanded by default
- Q3 will use old UI for course evaluation (not new React/Prism redesign)
- After create template: next design priority is create survey

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_630_01 | **Builder-first flow**: When creating a template (from scratch or document upload), show the builder interface FIRST — not a details form. Details (name, description, course type, etc.) should appear as a popup at publish time or as a separate later step. "We should start by giving them the builder flow." | pce | T60 |
| D_PCE_630_02 | **Kill the "add group" / group naming concept** in template builder. "We should not have a grouping concept because that will add to engineering effort." The three top-level aspects (Content/Course, Faculty, General) are already implicitly groupings. No custom group names. | pce | T62, T90 |
| D_PCE_630_03 | **Faculty roles: predefined dropdown only**. Admin cannot type custom role labels. Roles come from Prism settings. Settings page allows admin to pick a subset of the Prism universal role list. That subset is what appears in create-template. If no settings configured, show full universal Prism list. | pce | T35, T93 |
| D_PCE_630_04 | **Remove "answer type labels" section from settings UI**. Romit's settings design had this as a separate config. Monel confirmed: "It is the same thing" as the Likert scale templates already in settings. Remove the redundant section. Keep only the predefined Likert scale template picker. | pce | T30, T92 |
| D_PCE_630_05 | **Course evaluation nav item = expanded by default**. The nav entry for course evaluation should NOT be collapsed by default. Monel: "Are we keeping course evaluation expandable? I think it's an overkill. No. No. It's collapsed. Expanded by default." | pce | T80, T91 |
| D_PCE_630_06 | **Left nav must be laid out by end of day Jun 30**. Aditi explicitly asked to see the left nav structure. "That's one thing which Aditi explicitly said that she want to see." This is P0 — Aarti reviews Jul 2. | pce | T80, T91 |
| D_PCE_630_07 | **Next design priority after create template = create survey**. "Once you are done with this you can pick up create survey, the entire pushing of survey flow." | pce | T29 |
| D_PCE_630_08 | **Q3 course evaluation uses old UI (Prism/FAST integration)**. Instruction title/text fields follow the survey screens pattern — they live in the builder, not in a separate details step. | pce | — |
| D_PCE_630_09 | **Section multi-select for faculty roles** (not groups). Admin can multi-select which faculty roles a given set of questions applies to. No group naming — just role multi-select within each section. This replaces the "add group" concept. Monel: "you can just multi select faculty roles and assign sections and questions to them." | pce | T62 |

## Verbatim quotes

> "I'm suggesting then we should have builder first." — Monel

> "So even if it is a scratch at a scratch level or at a document level, it should be builder that should show first." — Monel (confirming Romit's interpretation)

> "We should not have a grouping concept because that will add to engineering effort... From user perspective also, as a user, I feel [it's not intuitive]." — Monel

> "Will not give user the ability to add custom rules. It will be predefined from the drop down list. That they set up in settings will show that roles only." — Monel

> "What I don't like is naming the group. That is confusing." — Monel

> "Yeah. [The answer type labels section] is actually that only. It is the same thing." — Monel

> "Can make sure that by tomorrow end of the day, you know, have the left nav also laid out. So that's one thing which Aditi explicitly said that she want to see." — Monel

> "Are we keeping course evaluation expandable? I think it's an overkill. No. No. It's collapsed. Expanded by default." — Monel

## Design tasks generated

- T89 (pce): Builder-first template creation flow. DESIGN-REVIEW — structural. D_PCE_630_01.
- T90 (pce): Kill "add group" / group naming concept. DESIGN-REVIEW. D_PCE_630_02.
- T91 (pce): PCE left nav expanded by default + layout for Aarti. **P0 URGENT** — due before Jul 2. D_PCE_630_05, D_PCE_630_06.
- T92 (pce): Remove duplicate "answer type labels" from settings UI. D_PCE_630_04.
- T93 (pce): Faculty roles — predefined Prism dropdown only, no custom input. Supplements T35. D_PCE_630_03.
