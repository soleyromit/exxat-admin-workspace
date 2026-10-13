# Cross-cutting contract (applies to every surface contract)

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.
**Precedence:** `[REQ]` > `[CALL 09-23]` / `[CALL 03-05]` > `[PROTO]` > `[INFER]`. Open decisions (`OD-*`) are never treated as decided; each rule below names the seam. OD-14 and above, and OD-P1, are proposals by this pack, not requirements §13 items.
**Companions:** `docs/ux/03` (IA), `08` (patterns P-01..P-18), `09` (copy), `10` (DS map), `docs/strategy/02` (engine), `06` (states).

## 1. Scope of this file

Rules every surface contract (S-01..S-18) inherits, so individual contracts do not re-decide them. A surface contract may only **narrow** a rule here, never contradict it; if it must, it records a deviation with a reason.

**Source-of-truth adjudication (copy vs structure).** For the *wording of a string*, `docs/ux/09` wins. For the *existence of a UI element* (a filter, counter, control, column), `docs/ux/07` plus the requirements win and `docs/ux/09` must be amended to carry copy for it. When 07 and 09 disagree on wording, edit 07; when they disagree on existence, edit 09. Contracts cite 09 by section and never duplicate strings.

## 2. Application shell and navigation delta `[docs/ux/03 §2–4; INFER]`

| Item | Rule | Source |
|---|---|---|
| Placement of the module | **OPEN (OD-P1).** Standalone app (`apps/skills-checklist/{admin,student}`, ports 3007/3008 per product CLAUDE.md) or a section of the existing Prism admin and student apps. Every route is written as `{base}/…` so either answer works | `docs/build/01-build-plan.md §1` |
| Admin nav | One new top-level group **Skills** with children Overview, Library, Course mapping, Review and approve. Review and approve is shown only when at least one skill has administrator approval turned on `[REQ SC-15]` | `docs/ux/03 §2.1` |
| Library children | Skills, Categories, Tags, Clinical settings, Lab instructors (S-05 is two tabs, S-05a and S-05b, DEC in `ux/11`) | `docs/ux/03` |
| Student nav | Skills is a section of a clinical course page (S-12) plus a cross-course "My skills" (S-15) | `[CALL 09-23]`, `[REQ SH-06]`; S-15 is `[INFER]` |
| Evaluator | **No shell**: no sidebar, no top navigation, no account menu, no links out except the form itself `[REQ EV-01]`. Faculty who choose to use Prism open the same form inside the Prism shell `[REQ §7 intro]` | `docs/ux/03 §2.3` |
| Shell implementation | Use the DS shell from `@exxatdesignux/ui` as the other products do; navigation changes go through the product navigation config, not by forking the sidebar component `[workspace CLAUDE.md, exxat-senior-ux]` | workspace rules |
| Way back | One affordance per page: breadcrumb **or** back link, never both `[exxat-senior-ux audit]` | `exxat-senior-ux` |

## 3. Command palette entries `[docs/ux/03 §8]`

| Label | Route | Group | Condition |
|---|---|---|---|
| Skills overview | `{base}/overview` | Skills | admin |
| Skills library | `{base}/library/skills` | Skills | admin |
| Import skills | `{base}/library/import` | Skills | admin, action |
| Add skill | `{base}/library/skills/new` | Skills | admin, action |
| Skills needing configuration | `{base}/library/skills?status=unconfigured` | Skills | admin; shows the count `[REQ IM-10]` |
| Categories and tags | `{base}/library/categories` | Setup | admin |
| Clinical settings | `{base}/library/settings` | Setup | admin |
| Lab instructors | `{base}/library/lab-instructors` | Setup | admin |
| Course mapping | `{base}/course-mapping` | Skills | admin |
| Review and approve | `{base}/review` | Skills | admin, only when approvals exist |
| Export attainment | action on S-01 | Skills | admin `[REQ RP-10]` |
| My skills | `/my-skills` | Student | student |
| Course skills | `/courses/{offeringId}/skills` | Student | student, per course in scope |

The evaluator surface (S-16) has **no** command palette and no keyboard shortcut layer `[REQ EV-01]`. Product-level registration happens in the product's palette file (workspace `components/command-palette.tsx` equivalent), per `exxat-module-brief` Step 7.

## 4. Feedback and banners

- Product feedback uses `LocalBanner` (props: `variant` `error | success | warning | info | promo`, `title?`, `children`, `dismissible?`, `onDismiss?`, `action?: {label, href?, onClick?}`, `retry?: {label?, onClick}`, `icon?`; there is **no `emphasis` and no `actionPosition`** (those belong to `SystemBanner`, the full-bleed shell strip); verified with `node tools/ds/source.mjs LocalBanner`, `@exxatdesignux/ui@1.5.1`, and the 1.6.5 type defs by ds-adoption-reviewer). **Never `toast()`** `[workspace CLAUDE.md]`. Prototype banners such as "Sent 1 skill to …" and "Returned … to the preceptor" are demo devices, not patterns `[PROTO]`.
- Banner placement: top of the content region of the page that owns the action; not stacked more than two at once; error banners carry a recovery action (P-17).
- Banner text for outcomes that depend on an open decision stays neutral until it is decided (OD-16 return target; OD-18 link lifetime; OD-17 achievement disclosure). Source of copy: `docs/ux/09`.
- Status is never colour alone: every badge or pill carries text `[WCAG 1.4.1]`.

## 5. Skill-status rendering flag `[REQ AE-04, OD-03]`

The engine stores **four** states (`AE-04`):
1. **No evidence yet**
2. **Evidence does not qualify** (label decided in `ux/11` DEC, `[INFER]`)
3. **In progress** (some qualifying evidence, criteria not yet met)
4. **Achieved**

Every surface that shows skill status (S-01, S-02, S-03, S-12, S-14, S-15, S-17 columns) renders from the enum through **one** shared display component with a single configuration flag named **`skillStatusDisplay`** (`"four"` | `"merged"`; surface-neutral: columns, cards, headers and summaries all read it):
- Rendering A: four distinct statuses.
- Rendering B: states 1 and 2 merged as "Not met" (the prototype's behaviour `[PROTO]`).
Neither rendering is committed while OD-03 is open. Exports (S-17) must carry the **enum value** in a column regardless of the rendering so the decision can change without re-collecting data `[INFER]`. The submission-level outcome "Did not meet criteria" (`SH-02`) is a different thing and is never used as a skill status label.

## 6. Derived-state recomputation contract `[REQ AE-01..AE-07, RV-03, RV-05]`

| Rule | Contract | REQ |
|---|---|---|
| Source of status | Skill status is **derived** from retained evidence and the skill's **current** configuration; it is never stored as authoritative truth | AE-02 |
| What counts | Completed evidence only; anything awaiting self-evaluation, evaluator or approval is excluded | AE-01, AR-06 |
| Achieved | Every criterion met: qualifying count, per-level minimums, per-clinical-setting minimums (clinical only; lab never satisfies a setting minimum) | AE-03, SC-11, SC-12 |
| Rule change | Changing a qualification rule or criteria re-applies to evidence already held; responses are never rewritten | AE-02, AE-06 |
| Presentation-only edits | Renaming labels, levels or question text never changes whether evidence counts | AE-06 |
| Cascade | Removing a question or level removes it from every rule that referenced it | AE-07 |
| Immutability | A completed evaluation is never edited; a further attempt is a new record; counted or awaiting-approval evidence cannot be edited or resent | RV-03, RV-05 |
| One record | One student record per skill across courses | CM-07, AE-05 |
| UI consistency | While a recalculation is pending the affected badge shows "Recalculating", never a stale "Achieved" (P-14). Anything that affects achievement (send, submit, approve, return, rule change) is **not** optimistic `[INFER]` | `docs/ux/08 P-14` |
| Test oracle | Engine unit tests exist before UI for every row of `docs/strategy/02 §3` (wave W1 exit tests) | `docs/build/01 §4` |

Open: what happens to held evidence when the evaluation **model** changes (REQ `SC-09` says criteria are rebuilt, silent on evidence; guess recorded in `docs/ux/05`) → needs a decision before W1 closes; treat as a blocker question, not an assumption.

## 7. Data-scope and role rules `[docs/ux/03 §9, docs/strategy/06 §4, exxat-domain-context]`

| Role | Sees | Must never see |
|---|---|---|
| Administrator (program scope; includes the reviewer hat) | Whole program scope for skills, evidence, evaluations, exports | Nothing excluded by REQ; sub-roles unspecified (gap G-8) |
| Student | Own record only, all courses `[REQ SH-06]` | Other students' data, evaluator contact details beyond name `[INFER]` |
| Preceptor, clinical faculty, lab instructor | Only the single request behind the link `[REQ EV-01, EV-03]` | Other students, history, aggregates, student's achievement status (OD-17 default: not shown) |
- Lab instructors and preceptors have no Prism account; their name and email are program-held data `[REQ SL-08]`; whether they are Prism-wide records is OD-05.
- Every query is scoped server-side by role and, for the evaluator, by token. No client-only hiding.
- Permission mismatch shows "You do not have access to this" with no hint about other records (P-17).
- Student names are not unique in the data (DEFECT-09 `[PROTO]`): tables identify people with an extra field (cohort and group, ID or email) `[INFER]`.

## 8. Error, empty and loading conventions `[docs/strategy/06 §1, docs/ux/08 P-14, P-17]`

- **Loading:** `Skeleton` in the shape of the final layout; no spinner-only loads.
- **Empty (never blank):** headline, one explanation line, one primary action where one exists. Empty must be distinguishable from "filters hide everything" (offer Clear filters) and from "impossible filter combination" (explain, `RP-09`).
- **Blocked-with-reason:** where a user cannot proceed (no valid evaluator role for the setting `ST-08`; unconfigured skill `IM-09`; impossible combination `RP-09`), state **why** and what to do, never an empty control.
- **Error:** say what failed, keep user input, offer retry; no stack traces; no raw IDs.
- **Validation:** inline at field with `aria-invalid` and `FieldError`; one summary banner for multi-error forms; save-blocking rules per `SC-06` and `SC-18`.
- **Unsaved changes:** leaving a form with edits prompts a `Dialog` "Discard changes?" (Cancel is the default focus).
- Empty and error copy lives in `docs/ux/09 §8`; surfaces reference it by key, do not retype it.

## 9. Page-level accessibility (WCAG 2.1 AA) `[docs/ux/08 P-13, docs/ux/11]`

- One `h1` per page; heading levels not skipped; landmarks `main` and (where a shell exists) `nav`.
- Every interactive element has a visible focus ring; no keyboard trap other than modal `Dialog` and `Sheet`; focus returns to the trigger on close.
- Targets at least 24×24 CSS px for admin density, 44px for student and evaluator surfaces `[INFER, persona-driven; REQ silent]`.
- Icon-only buttons have `aria-label` and a `Tooltip`; decorative Font Awesome icons are `aria-hidden="true"`; action buttons are text-only `[workspace memory]`.
- Live regions: polite for result-count updates and "Saving"; assertive only for blocking errors.
- Respect `prefers-reduced-motion` (P-16). Contrast is checked in both light mode and the product themes with axe per route and per interaction state before any "done" claim.
- Charts and progress have text equivalents; no progress-bar-only visualisation; no red in score visualisation `[workspace memory, Aarti]`.

## 10. Evaluator-link security and disclosure questions (OD-17, OD-18) `[REQ EV-01; gaps G-5; INFER]`

REQ requires only that an evaluation be completable **without a login**, reached by **email**, creating **no account** `[REQ EV-01]`. It does not define the link's lifetime, reuse, revocation or what it reveals. `[CALL 09-23]` says delegator links "are always unique" and open a form (FAST). These are questions, not decisions, and no surface may assume an answer:

| # | Question | Why it matters | Default until decided (reversible) |
|---|---|---|---|
| L-1 | How long is a link valid (days, until submitted, term end)? | Stalled evidence vs exposure window (OD-18) | Copy states no expiry rule; error page is neutral |
| L-2 | Single-use or reusable until submitted? | Re-opening after a timeout; sharing risk | Reusable until submitted, then read-only "already submitted" page |
| L-3 | Can the student resend, revoke or replace a link, and does the old link die? | `RV-04` lets a student choose a different evaluator | Resend creates a new link; the old one stops accepting submissions |
| L-4 | Is the link bound to the evaluator's email (second factor) or bearer-only? | Forwarded emails, shared inboxes | Bearer token; revisit with security review |
| L-5 | What does the page reveal before submit: student name, course, skills, setting, student-supplied details, self-evaluation | `EV-04` requires student details and self-evaluation | Exactly the request's data, nothing else |
| L-6 | What does it reveal **after** submit: student's resulting achievement status? | Prototype shows it (DEFECT-05); OD-17 | **Not shown** |
| L-7 | Is draft autosave stored against the token (no account)? Retention and deletion of drafts | `[INFER]` persona need; REQ silent | Autosave stored against the token, deleted on submit |
| L-8 | Is the token logged in analytics or referrer headers? | Token leakage | Referrer-policy `no-referrer`; no third-party scripts on S-16 |
| L-9 | Who may preview the evaluator's view (admin preview in S-09, `SC-19`)? | Admin must see what evaluators will ask | Admin preview is a separate non-token route |
| L-10 | Bot/link-scanner prefetch of email links consuming a single-use token | Corporate mail scanners hit URLs | Do not mark used on GET; only on POST submit |

These go to Sankalp and the FAST team (`docs/ux/12`); Mobbin/pattern research is separate and not yet run (Mobbin MCP unauthenticated in this session).

## 11. Audit and logging proposals `[INFER; REQ requires none beyond RV-02 and RP-10]`

| Event | Record | Reason |
|---|---|---|
| Configuration saved on a skill that holds evidence | who, when, before/after of rule and criteria, count of evidence affected | AE-02 re-applies rules; admins will ask "who changed what" (gap G-9) |
| Evaluation submitted via link | token id (not the token), evaluator identity as recorded, timestamp, request id | Authority entering the record |
| Admin approve / return | reviewer, timestamp, note | `AR-04`, `RV-02` (reason retained) |
| Export created | who, scope (filters), type, row count | `RP-10` records filters in the file; who-exported is advisable `[INFER]` |
| Link issued, resent, revoked | actor, evaluator email hash, request id | L-3 |
| Import batch confirmed | who, source name, counts created/skipped | `IM-11` traceability |
Retention periods are not specified anywhere and are an open question for the program/legal owner. No log may contain the raw link token or free-text evaluator comments.

## 12. Shared compositions (build once; contracts reference by name)

Hand-roll on DS primitives, each in its own file (`docs/ux/10 §5` has the full list): `SkillStatusBadge` (reads the enum + the OD-03 flag), `ModelCriteriaLineage`, `LevelMinimumEditor`, `SettingMinimumEditor`, `QualificationRuleEditor`, `ImportReviewTable`, `AgreementCompareCard`, `ProgressBySetting`, `EvidenceLedger`, `FailedRuleExplainer`, `EvaluatorAnswerGroup` (RadioGroup-based, used by S-16 and the student self-evaluation block in S-13), `EvaluationRequestSummary`. Verdicts for IMPORT / VENDOR / HAND-ROLL on each gap belong to `ds-adoption-reviewer`.

**Documented hand-rolls to register (net-new for this product; ds-adoption-reviewer, to be added to `docs/governance/ds-adoption.md` by Romit; not edited here):** `SkillsFileUpload` (S-08), `SkillsMultiPick` (Popover + Command + Checkbox; S-09 tags and named subset, S-10), `SkillStatusBadge` (wraps StatusBadge; reads `skillStatusDisplay`), `ModelCriteriaLineage` (C-1), `QualificationRuleEditor` (C-3), `LevelEditor` (C-4), `LevelMinimumEditor` (C-5), `SettingMinimumEditor` (C-6), `SubmissionFieldEditor` (C-7), `FormPreview` (C-8), `AgreementCompareCard` (C-11), `ProgressBySetting` (C-12), `PerLevelStrip` (C-13), `StickySelectionBar` (C-17), `RoleSettingResolver` (C-18), `EvaluatorAnswerGroup` (shared S-13 self-evaluation and S-16). **Not hand-rolls:** model picker C-2 (`SelectionTileGrid interaction="radio"`), import review table C-9 and evidence ledger C-14 (`DataTable` configs), failed-rule C-15 and impossible-filter C-16 (single `LocalBanner` uses), duplicate resolver C-10 (a small `RadioGroup` row). **VENDOR:** `EmptyState` from `apps/pce/admin/components/empty-state.tsx`; `ChartCard`/`ChartFigure` from `apps/pce/admin/components/charts-core.tsx` only if charts are confirmed.

## 13. DS version pin and verification `[docs/ux/10 N2]`

**Proposed (ds-adoption-reviewer, pending Romit): pin `@exxatdesignux/ui@^1.6.5` for this product (matches PCE); all surfaces including student and evaluator use `@exxatdesignux/ui`, not studentUX (DSQ-1 resolved as a proposal). The product `CLAUDE.md` section 4 still lists studentUX and was not edited: Romit to confirm or amend.** Prop-level drift between 1.5.1 and 1.6.5 is not diffed; re-verify after the pin lands.

The workspace `tools/ds/source.mjs` resolves `@exxatdesignux/ui@1.5.1`; `apps/pce/admin` resolves 1.6.5. Before any contract is confirmed: re-run `node tools/ds/source.mjs <Component>` against the version this product pins, and confirm exports for `RadioGroup`, `Textarea`, `Field`, `LocalBanner`, `Sheet`, `Dialog`, `Skeleton`, `DropdownMenu`, `Button`. Not exported in 1.5.1 (verified 2026-10-08): `Stepper`, `Pagination`, `MultiSelect`, `Combobox`, `FileUpload`, `Dropzone`, `ChartContainer`, `Banner`, `Drawer`, `EmptyState`, `ListHubStatusBadge`, `Progress`.

## 14. Out of scope for the whole module `[REQ §14]`

Remediation workflow; notifications, reminders and escalation; skill currency and expiry; linking evidence to patient encounter or clinical hours records; accreditation-ready outputs beyond RP-10 exports; migration from the Evaluations module. Also not designed (raised on calls, not in REQ): QR codes, heatmaps and preceptor-consistency reports, learning-contract linkage, batch students×skills grid (OD-19), hierarchical skills (OD-20).

## 15. Definition of done for any surface contract to be confirmed

1. Every REQ ID cited exists (`node .claude/hooks/check-req-ids.mjs`).
2. Every state in `docs/strategy/06` for that surface is designed, no TBD.
3. Every open decision touched names its seam.
4. DS mapping verified against the pinned version; gaps handed to `ds-adoption-reviewer`.
5. At least one Given/When/Then per requirement ID.
6. Reviewed by `skills-requirements-auditor` and `skills-ux-critic`; literal verdicts pasted.
7. Romit confirms in chat; only then rename the file.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** one DS base shell (`app/(shell)`): full-width utility bar (sidebar toggle, `exxat Prism` lock-up, breadcrumb 'Skills & Competencies / Nursing / <page>', search, profile), left nav with the prototype groups ADMINISTRATOR (Overview, Skills Library, Course Mapping, Review & Approve), STUDENT (Student View), EVALUATOR (Preceptor Evaluation), and a page header per page. Admin, student and the demo evaluator page share the shell; `/e/[token]` stays shell-free. Dialog URL contract on the library page: `?dialog=add | configure&skill=<id> | import`. `skillStatusDisplay` defaults to `merged` (parity C-1) and `evaluatorSeesProgress` is a pref (C-6). Dialog widths: 1024px large, 672px small. The product-switcher, school-switcher, notification, help and Ask Leo slots are not filled. The command menu is the DS CommandDialog with the pages from docs/ux/03.

**Why:** Romit, 2026-10-08, plus `docs/build/prototype-parity.md` §1 (shell) and §6 (conflict resolutions C-1..C-16).

**Unchanged:** data-scope and role rules, derived-state recomputation (AE-01..AE-07), error/empty/loading conventions, accessibility, evaluator-link security questions (OD-17, OD-18), audit proposals, DS pin `@exxatdesignux/ui ^1.6.5` with deep imports only.

**Weakened or traded away (honest list):** the 'one filled primary per surface' rule has a documented exception on S-11 (C-5); the 'text-only action buttons' rule yields to the prototype's icons on Import, Add skill, Send for review and Send request (C-16, icons `aria-hidden`); the 'LocalBanner emphasis' note is moot (no such prop); prototype strings with em-dashes are kept verbatim in the R1..R5 copy files, which are excluded from the voice test by a documented exception.
