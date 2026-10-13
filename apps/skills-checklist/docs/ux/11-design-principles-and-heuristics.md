# UX 11 — Design Principles, Review Heuristics, Anti-patterns, Decision Log

Derived from the requirements, the journeys and the two calls. Tags per `docs/README.md` (REQ > CALL > PROTO > INFER). The architectural principles P1–P5 in `strategy/02` explain the data rules; these principles explain how the rules should *feel and look*. DS rules come from the workspace CLAUDE.md.

## 1. Product design principles

**DP-1 — The program's words, never ours.**
*Statement:* Every label, category, question, level and threshold is program-defined; the UI ships none.
*Why:* Prism ships no skills, categories or taxonomy `[REQ SL-01, §1.6]`; accreditors do not publish a single checklist `[REQ §1.3]`.
*Shows up as:* empty states that invite creation, placeholders that say "your" not examples, no seeded vocabulary beyond the Met/Unmet default labels `[REQ SC-03]`.
*Anti-example:* pre-filling a "standard nursing skills" list.

**DP-2 — Show the dependency chain.**
*Statement:* Model, evidence, qualification rule, criteria and status are one chain; the UI makes the chain visible and refuses contradictions.
*Why:* Core design principle `[REQ §1.5, SC-09, SC-17]`.
*Shows up as:* configuration steps that visibly depend on the previous choice; changing the model rebuilds criteria with an explanation; a preview of what student and evaluator will see `[REQ SC-19]`.
*Anti-example:* independent tabs for "evaluation" and "achievement" that can disagree.

**DP-3 — Proposals, never outcomes.**
*Statement:* Anything inferred (import interpretation) is a draft that needs explicit human confirmation.
*Why:* `[REQ IM-05, IM-13]`; interpretation will not be perfect.
*Shows up as:* review tables with edit/discard, a visible "could not read" list with original text `[REQ IM-08]`, no "AI is accurate" copy.
*Anti-example:* auto-creating skills after upload.

**DP-4 — Say what cannot be done and why.**
*Statement:* Dead ends and empty results are explained, with the next step.
*Why:* `[REQ ST-08, RP-09, SH-03, SC-18]`.
*Shows up as:* "No valid evaluator for this setting because this skill allows only Lab Instructor", "No evidence exists for Mercy Home Health in Emergency", a failed-rule sentence on a non-counting submission.
*Anti-example:* an empty select, a zero-row table with no cause.

**DP-5 — The record is a ledger; status is a view.**
*Statement:* Completed evaluations are never edited; correction continues a record, a further attempt starts a new one.
*Why:* `[REQ RV-02, RV-03, RV-05, AE-02]`.
*Shows up as:* locked states with a stated reason, revision counts, attempt numbers, a read-only "view form".
*Anti-example:* an "Edit" button on a completed evaluation.

**DP-6 — Expectation is not eligibility.**
*Statement:* Mapping tells students what is expected; it never blocks.
*Why:* `[REQ CM-05, CM-07]` `[CALL 09-23: mandatory or recommended list, other skills still allowed]`.
*Shows up as:* mapped-then-other sections, "evidence counts toward your skill record" copy, one record across courses.
*Anti-example:* hiding unmapped skills from the student's selector.

**DP-7 — Explain the question, not the form.**
*Statement:* One generated form per skill; no template sprawl; the evaluator never configures.
*Why:* `[REQ EV-03]` `[CALL 09-23: schools must not have many form types]`.
*Shows up as:* a form derived from the skill configuration with the same components for every skill.
*Anti-example:* a bespoke layout per skill.

**DP-8 — Evaluators arrive from an email, not an app.**
*Statement:* The evaluator surface is one page, no shell, no account, large targets.
*Why:* `[REQ EV-01]` and the preceptor persona `[INFER]`.
*Shows up as:* a standalone route, readable on a phone, instant render, a result message about what happens next `[REQ EV-07]`.
*Anti-example:* a sign-in prompt, or the admin sidebar around the form `[PROTO demo device]`.

**DP-9 — Progress is specific, not a bar.**
*Statement:* Show what is left against each criterion (counts, per-level, per-setting), not a single percentage.
*Why:* A skill can be 4 of 4 yet not achieved because a setting minimum is missing `[REQ AE-03, SH-05]`; seeded case in `strategy/07` DEFECT-07. Workspace memory: progress bars are a last resort.
*Shows up as:* "Inpatient 1 of 1, Emergency 0 of 1", per-level counts.
*Anti-example:* a green bar at 100% with status "In progress".

**DP-10 — From aggregate to evidence in one move.**
*Statement:* Every number leads to the people and the evaluation behind it, keeping the filter context.
*Why:* `[REQ RP-05, RP-06, RP-07]`.
*Shows up as:* clickable figures, evidence ledger inline, full evaluation view, filters preserved and removable.
*Anti-example:* a report table that ends in a dead number.

**DP-11 — Reports state their own caveats.**
*Statement:* Overlaps, denominators and what "not met" includes are written next to the figure.
*Why:* `[REQ RP-04]` `[PROTO footnotes]` and OD-03 on the not-met definition.
*Shows up as:* "Tag figures overlap because a skill may carry several tags", a denominator line.
*Anti-example:* summing tag rows as if they partition the population.

**DP-12 — Open decisions get seams, not guesses.**
*Statement:* Where an OD is open, build the shape that fits either answer and label the behaviour as provisional.
*Why:* ODs are "costly to change once built" `[REQ §13]`.
*Shows up as:* data fields that accommodate both options, feature flags, no copy that asserts the unsettled rule.
*Anti-example:* hard-coding "mappings do not carry forward".

## 2. Per-surface review heuristics (checklist agents can run)

Answer pass / fail / N/A with evidence (file:line or screenshot) for each.

**A. Source and scope**
1. Every requirement ID the surface claims exists in `docs/source/requirements.extracted.txt`.
2. No ODs treated as decided; seam named.
3. Nothing from REQ §14 (remediation, notifications, expiry, patient-encounter linkage, Evaluations migration) is designed.
4. Prototype used only as illustration; no prototype layout copied as spec.

**B. Role and data**
5. The persona and the data they may see are stated; the evaluator surface shows only that request.
6. Student never sees another student's data; no PII beyond what the task needs.
7. Evaluator surface has no shell, no login and no configuration controls.

**C. Rules**
8. No default evaluation model; unconfigured skills absent from mapping and student selectors.
9. Completed evaluations are read-only; further attempt is separate from correction.
10. Lab evidence is never shown as satisfying a clinical setting.
11. One student record per skill across courses; mapping does not gate submission.

**D. Interaction and states**
12. All of loading, empty, error, validation, saving, success, disabled, partial, blocked-with-reason are designed (`strategy/06` row).
13. Every dead end or empty result is explained with the next step.
14. Exactly one filled primary action per surface; the rest are outline or ghost.
15. Keyboard reaches every action; Enter and Esc behave; focus managed in dialogs and sheets.
16. Destructive or irreversible actions (deactivate, approve, return) confirm what will happen to evidence.

**E. UI and DS**
17. Components imported from `@exxatdesignux/ui` and checked with `node tools/ds/source.mjs <C>`.
18. Tokens only, no hex or rgb; no raw `<table>` or `<button>`; `Button` has explicit variant and size.
19. No toast for product feedback; use `LocalBanner`.
20. No icons on action buttons; `aria-hidden="true"` on decorative icons, `aria-label` on icon-only buttons.
21. Status is never colour-only; contrast and targets meet WCAG 2.1 AA.
22. No `uppercase tracking-wide` labels, no `py-20 text-center` empties, no `color-mix(in oklch`.
23. No red in score or rating visualisation (stakeholder preference, workspace memory).

**F. Copy**
24. Sentence case, professional, no colloquialisms or em-dashes (workspace microcopy standard).
25. Uses REQ terms: mandatory / non-mandatory, evaluation, qualifying evaluation, further attempt.
26. No internal notes or stakeholder names in UI copy.

**G. Journey**
27. The moment-of-truth question for the stage is answerable within two seconds.
28. Previous and next stages' assumptions are honoured (`docs/journeys`).

## 3. Anti-pattern list

| # | Anti-pattern | Why banned | Source |
|---|---|---|---|
| AP-1 | Shipping or suggesting a skills list, taxonomy, or accreditation-endorsed checklist | Program-defined | `[REQ SL-01, §1.7]` |
| AP-2 | Defaulting the evaluation model | Must be explicit | `[REQ SC-02]` |
| AP-3 | Letting an unconfigured skill be mapped or submitted | Gating | `[REQ IM-09]` |
| AP-4 | Editing a completed evaluation | Immutable record | `[REQ RV-03]` |
| AP-5 | Using mapping to restrict submission | Expectation only | `[REQ CM-05]` |
| AP-6 | Giving preceptors or lab instructors accounts or a login wall | No account | `[REQ EV-01, SL-08]` |
| AP-7 | Counting lab evidence toward a clinical setting minimum | Rule | `[REQ SC-12]` |
| AP-8 | Designing remediation, reminders, expiry, encounter links, Evaluations migration | Out of scope | `[REQ §14]` |
| AP-9 | Treating an OD as decided in UI copy or logic | Costly to change | `[REQ §13]` |
| AP-10 | Merging "no evidence yet" with "evidence that does not qualify" without a decision | OD-03 open; four states required | `[REQ AE-04, AE-08]` |
| AP-11 | QR codes, heatmaps, preceptor-consistency reports, batch grid, hierarchy, learning-contract linkage in v1 | Raised on calls, not in REQ | `[CALL 09-23]` `[CALL 03-05]` |
| AP-12 | Showing the evaluator the student's achievement status | Over-disclosure, OD-17 proposed | `[PROTO]` `[INFER]` |
| AP-13 | Copying prototype visuals (navy sidebar, custom blue buttons, three roles in one shell, uppercase tracking-wide labels) | Not Exxat DS | `[PROTO]`, workspace rules |
| AP-14 | Raw `<table>`, raw `<button>`, hardcoded colours, recreating DataTable, KeyMetrics, Button, Badge, Dialog | Workspace non-negotiables | workspace CLAUDE.md |
| AP-15 | `toast()` for product feedback | Use `LocalBanner` | workspace CLAUDE.md |
| AP-16 | Overriding DS Card or Button shape for editorial skin | Reads as "not DS" | workspace memory |
| AP-17 | Basic progress-bar dashboards as the only visualisation | Specific progress | workspace memory, DP-9 |
| AP-18 | Two filled primary CTAs on one surface | Hierarchy | `exxat-senior-ux` |
| AP-19 | Claiming "matches the prototype" as acceptance | Acceptance is REQ coverage + DS conformance + states | `strategy/07` |
| AP-20 | Stating "GREENLIGHT" without the (static) or (runtime) tier and without listing what was not verified | Verification discipline | workspace CLAUDE.md |

## 4. Decision log template

Store entries at `docs/ux/decisions/DEC-NNN-<slug>.md`; one per decision, never edit history, supersede instead.

```
# DEC-NNN — <title>
Date: YYYY-MM-DD        Status: proposed | accepted | superseded by DEC-NNN
Decided by: <role, e.g. Sankalp (requirements), Aarti (product review), Romit (design)>
Open decision resolved: OD-nn | none (new)
Context: <1–3 sentences; tags per README>
Options considered: A) … B) … (each with consequence)
Decision: <one sentence>
Seam impact: <what stays configurable, what is now fixed>
Requirements affected: <IDs>   Surfaces: S-nn   Flows: F-nn
Matrix updates: <rows in strategy/04 to change; run skills-req-trace>
Vault note: <path> (decision atom per workspace schema)
Follow-ups: <owner, due>
```

## 5. Decision log (entries made 2026-10-08, review-fix pass)

All entries are **proposed** design resolutions by this pack (`[INFER]`), made to remove internal contradictions found by the UX critic and the requirements auditor. None resolves a requirements-document OD; each keeps its seam.

| ID | Status | Resolves | Decision | Seam kept | Files |
|---|---|---|---|---|---|
| DEC-001 | proposed | Critic B1 (self-evaluation timing; REQ ST-11, SC-15, EV-04) | Self-evaluation is completed BEFORE send, inside the S-13 send sheet; Send is disabled until complete. No post-send "Self-evaluation pending" state by default | Conditional "Self-evaluation pending / Draft" state and a "Continue self-evaluation" affordance on S-12/S-14 exist only if OD-14 (save partial) is accepted | 02, 04, 05, 07, 09 |
| DEC-002 | proposed | Critic B2 (OD-03 decided both ways; REQ AE-04) | Skill status renders from the 4-state enum behind ONE display flag; S-01, S-02, S-15 and microcopy show both renderings (A four columns, B merged "Not met"), neither committed | The flag; storage always keeps four states | 03, 05, 07, 09 |
| DEC-003 | proposed | Critic I1 (label collision; REQ AE-04, SH-02) | AE-04 state 2 is labelled "Evidence does not qualify" everywhere; "Did not meet criteria" is reserved for the per-submission outcome (SH-02); AE-04 state 1 is labelled "No evidence yet" | none | 03, 05, 07, 09 |
| DEC-004 | proposed | Critic I2 (two filled primaries on S-05) | S-05 is a pair of library tabs, S-05a Categories and S-05b Tags, each with one filled primary | none | 03, 07, 09, 10 |
| DEC-005 | **superseded 2026-10-08 by DEC-018** (prototype card list) | Critic I3 (N filled Approve buttons on S-11) | S-11 is a DataTable queue with no filled row buttons; the compare view opens in a Sheet where Approve is the single filled primary | none | 07, 08 (P-12), 09, 10 |
| DEC-006 | proposed | Critic I4 (S-14 counter label; OD-16 pre-commit; REQ SH-04, AR-05) | S-14 third counter is "In progress" everywhere; the return banner is neutral ("returned for correction ... until the correction is complete") | OD-16 stays open | 05, 07, 08, 09 |
| DEC-007 | proposed | Critic N1 (semantics) | Single-choice controls (S-13 Clinical/Lab, S-16 Yes/No and levels, duplicate resolver, role resolver) use RadioGroup; ToggleGroup only for multi-select or segmented views | none | 07, 10 |
| DEC-008 | proposed | Auditor finding 1 (DS API) | StatusBadge size: product mode xs/sm/md; semantic mode sm/md only | none | 10 |
| DEC-009 | proposed | Critic N2 (version drift) | `10` carries a version-pin warning and a blocking TODO to re-verify exports against the pinned version | none | 10 |
| DEC-010 | proposed | Auditor note, critic N3 (OD numbering) | OD-01..13 are from REQ §13; OD-14..24 and OD-P1 are proposals by this pack, stated in README, strategy/05 and the headers of ux/02, 03, 12 | none | README, 02, 03, 12, strategy/05 |
| DEC-012 | **superseded 2026-10-08 (R5 re-skin, Romit: build the exact prototype)**: the counter is back to the prototype's "In progress" with helper "Sent but not finished" (parity card P-11, conflict C-10). The clash with the skill status "In progress" exists in the prototype too and is flagged to Romit | UX critic on the built S-14 (2026-10-08) | The S-14 outstanding counter is labelled "Awaiting evaluation" (helper "Sent, not yet assessed"), not "In progress", because "In progress" is the AE-04 derived skill status shown on the same screen. Data field unchanged (`outstanding`) | Keep "In progress" and rename the skill status instead (rejected: the status label is shared across S-01, S-02, S-12, S-15) | S-14, lib/copy/surfaces.ts |
| DEC-013 | proposed | DS conformance review of the build | Breadcrumb crumbs in the S-02/S-03 rail are the design system `Button` (variant link, size sm), never a raw `<button>` inside `BreadcrumbLink asChild` | Keep asChild (rejected: workspace rule bans raw buttons) | S-02, S-03 |
| DEC-014 | proposed | End-to-end run (B1/B2) | The S-09 model picker keeps the DS `SelectionTileGrid` but makes each tile label the containing block (`[&_label]:relative`) and adds a ring on the checked tile, because the DS renders the tile radio as `sr-only` absolute inside a non-relative label (detached radio, intercepted click, 15px overflow). Recorded as a DS defect in ux/10 | Hand-roll the picker (rejected until the DS team responds) | S-09 |
| DEC-015 | proposed | End-to-end run (invalid vs submitted link) | The S-16 contract state table specifies two neutral states: an invalid, expired, revoked or superseded link share ONE message; "already submitted" is the only distinct message. That distinction lets a holder of a link learn it was used, and is part of OD-18 which stays OPEN | One message for all states (rejected: the contract asks for the submitted message) | S-16 |
| DEC-016 | proposed (instructed by Romit 2026-10-08) | Romit: build the exact Sankalp mockup in the DS base shell; parity cards P-07, P-08 | S-09 is the prototype's flow: Add skill 672px dialog (`?dialog=add`) and a 3-step DS `Wizard` in a 1024px dialog (`?dialog=configure&skill=<id>`), replacing the full-page design (anchored sections, sticky lineage panel, preview toggle, unsaved bar). The lineage panel and form preview live in step 2; model change shows the rebuild report as an inline banner (C-15); Copy configuration and Apply to selected skills are small secondary controls | none | S-09, S-04, `docs/ux/07`, `08` P-01..P-05 |
| DEC-017 | proposed (instructed by Romit 2026-10-08) | Romit instruction; `docs/build/prototype-parity.md` §0 | Precedence changes for visuals: layout, IA, containers, tab and column sets and copy structure follow the prototype (PROTO > `docs/ux/07` wireframes); visual language and components follow the DS; behaviour follows the requirements. Prototype strings are kept verbatim, including em-dashes, in the R1..R5 copy files, which are excluded from the voice test by a documented exception | none | all contracts (Build alignment sections), README, `docs/ux/09` appendix |
| DEC-018 | proposed (parity C-5) | Prototype card P-10 | S-11 is a card list with Return for correction (outline) and Approve (filled) on every card; the one-filled-primary rule has a documented exception here. Supersedes DEC-005 (DataTable queue plus Sheet) | none | S-11, `docs/ux/08` P-12 |
| DEC-019 | proposed (parity C-4) | Prototype cards P-02, P-03, P-11 | The student drill-down, evidence view, evaluation view, Send for review and history are 1024px DS Dialogs, not rails or sheets (S-02, S-03, S-13, S-14); small entity dialogs are 672px (S-05..S-07, Add skill). Esc closes the top dialog only | none | S-02, S-03, S-13, S-14, `08` P-07, P-09 |
| DEC-020 | proposed (parity C-1, OD-03 open) | Prototype card P-01 | The default status display flag is `merged` (Achieved / In progress / Not met; Not met includes no evidence yet) to match the prototype; the engine and exports keep the four AE-04 states and `/dev/state` flips the flag. Supersedes the 'separate' default | OD-03 | S-01, S-02, S-12, S-14, S-15, `docs/ux/09` |
| DEC-021 | proposed (parity C-6, OD-17 open) | Prototype card P-12 | Two evaluator surfaces: the real `/e/[token]` link stays shell-free with no achievement or progress data; the in-shell demo page `/preceptor` shows the criteria line and post-submit progress table behind `evaluatorSeesProgress` (default ON there, never read on `/e/`) | OD-17 | S-16 |
| DEC-022 | proposed (parity C-3, C-10) | Prototype cards P-09, P-11 | Mapping a skill defaults to Mandatory (supersedes the 'no silent default' proposal); the S-14 history counter returns to 'In progress' with 'Sent but not finished' (supersedes DEC-012 and DEC-006's rename note); the clash with the skill status 'In progress' remains and a rename to 'Awaiting evaluation' is the recommended fix | none | S-10, S-14 |
| DEC-011 | proposed | Critic gap (setting deactivation) and OD-24 | F-14 gains a clinical-setting branch (blocked while a skill's per-setting minimum references it); "in-flight submission when its skill is deactivated" is recorded as proposed OD-24 | Leave in-flight submissions in their current state until decided | 04, strategy/05 |

### DEC-023: Shell hierarchy follows the Exxat Design OS shell (2026-10-08, Romit's correction)
Persona is a view switch in the profile menu with a bar chip, not three sibling role groups in the left nav; the rail is one flat list per view; the utility bar carries product switcher, page title, Search, Notifications, Help, Ask Leo, scope switcher and profile in the DS order; What's new, Chat with support and the onboarding flag are omitted because no content or service backs them. Evidence and delta: `docs/build/ds-shell-anatomy.md`. Proposal `[INFER]`; supersedes the 3-group rail from the shell parity pass.

