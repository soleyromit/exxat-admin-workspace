# Design Contract: HY-01 Home (admin)

**Status: CONFIRMED by Romit 2026-10-09 (Layout 2).** Written under `docs/build/02-design-contract-template.md`; built as Layout 2 in `admin/components/home/`. Layout 1 stays documented below as the rejected alternative.
Tags: `[REQ id]` · `[OD-n]` · `[PROTO]` · `[CALL 09-23]` · `[CALL 03-05]` · `[MOBBIN url]` · `[INFER]`. Precedence REQ > CALL > PROTO > INFER. **Untagged claims are wrong.** Every `OD-*` stays OPEN and is built as its named seam. OD-14 and above are proposals by this pack, not requirements-document items.
Companions: `docs/design/brief-v2.md` (Direction A "guided setup journey", the hybrid recommendation), `docs/research/meetings/2026-10-09-mobbin-home-setup-analogies.md`, `docs/build/contracts/00-cross-cutting.md` (inherited, only narrowed here).

## 0. Honest premise

**The requirements document says nothing about a Home page.** No requirement names a landing page, a setup journey or an attention queue `[REQ: no Home ID in source/requirements.extracted.txt]`. The 2026-09-23 call does not discuss a first-run experience or what an admin sees first either; it discusses importing a 40-50 skill list, configuring "one after another" being "cumbersome", and reports `[CALL 09-23 lines 20, 112, 114, 72]`. Therefore **every element of Home that is not a pointer to a requirement-backed fact is `[INFER]`**, and Home may add no behaviour that a requirement governs (configuration, mapping, approval, attainment). Home is a **read-only summary and a set of links**. It performs no state-changing action itself.

## 1. Surface and wave

**Surface.** HY-01 Home: the admin landing page at `ROUTES.home` (`/home`) `[INFER; admin/lib/skills-routes.ts]`. First nav item `[brief-v2 Direction A IA, INFER]`.
**Wave.** After W1 (engine, library, configure) because every figure on it is derived from W1 data; can ship with W2 import and mapping as its links go live `[docs/build/01 waves, INFER]`.

## 2. Persona and RBAC

P-A Program administrator (workspace persona: DCE / Placement Coordinator, closest match) `[journeys/01 persona note, INFER]`. High density, desktop, returns in bursts during setup then weekly `[brief-v2 §0, INFER]`. The admin who approves is the same role `[00-cross-cutting §7]`. Admin sub-roles are unspecified (gap G-8), so this contract assumes one admin role. Student and evaluator have **no** Home in this contract: the student's entry is S-12 / S-15, the evaluator has no shell `[REQ EV-01]` `[00-cross-cutting §2]`.

## 3. Scope and data seen

Program-scope counts of the admin's own library, mappings and approval queue. **Counts and names of things to do, never student-level attainment or evidence.** Must not show: other programs' data; any student's achievement state; evaluator or site quality, heatmaps, preceptor consistency `[CALL 09-23 lines 74, 76]` `[OD-11]`; any "behind" or ranking list `[OD-27 undefined]`.

## 4. Job to be done and why

**Job-to-be-done `[INFER]`.** When I open the module, I want to know in one glance whether my library is ready for students and what needs my attention next, so I can continue the unfinished work or decide that nothing is waiting.
**Why → So what.**
- Why `[REQ §3]`: a client "may reasonably decline" days of re-entry; import removes that obstacle, but each imported skill then arrives **unconfigured** and unusable `[REQ IM-09]`, and a part-configured library must be "a visible state of progress rather than a silent gap" `[REQ IM-10]`. `[CALL 09-23 line 112]`: configuring each skill "one after another will be cumbersome".
- So what `[INFER]`: the admin who imports 120 skills has 120 decisions ahead and will leave and return. Home must make "where was I and what is left" instant (journey moment of truth 2, "will this ever be achievable?", fatigue by skill 30 `[journeys/01 stage B]`), then, once the library is ready, become a short list of what needs a human so the module is checked weekly rather than abandoned.

## 5. Requirements and open decisions

**Requirements Home reads or links to.**
SL-01 (no pre-filled skills or taxonomy: empty states) · SL-11 (deactivated skills leave counts) · SL-09 (named-by-students lab instructors awaiting adoption) · IM-01, IM-12 (two starting points: list or by hand) · IM-08 (unread lines reported with original text) · IM-09 (unconfigured cannot be mapped or submitted) · IM-10 (visible count of skills needing configuration) · IM-11 (import repeatable, adds to library) · IM-13 (interpretation is a draft; no AI-accuracy claims) · IM-14 (bulk apply, linked not owned) · SC-01, SC-02 (configure separate from create; model never defaulted) · SC-15 (approval optional per skill, so the approval row is conditional; the strip has no approval tile) · SC-19 (admin may preview the student and evaluator view) · CM-05 (mapping is expectation, not eligibility) · AR-01, AR-06 (approval queue; pending evidence excluded) · RP-02 (attainment by student, linked, not duplicated).

**Open decisions hit and the seam used.**
| OD | Hit | Seam (never decided here) |
|---|---|---|
| OD-15 (is "activation" a state distinct from configured plus active; `[CALL 09-23 line 114]` implies an activation step, REQ implies none) | The brief's step 5 "Go live" gate `[brief-v2 Direction A]` | Home shows a derived **readiness sentence** (counts of skills that are configured and active) and **no Go live button and no gate**. A single `readiness` selector returns `{configuredActive, unconfigured, inactive}`; if OD-15 resolves "activation is a state", the sentence gains one action and nothing else changes |
| OD-03 (four statuses vs merged) | Counts of statuses | Home shows **no skill-status counts** (no Achieved, no Not met). Leaves `skillStatusDisplay` to S-01 `[00-cross-cutting §5]` |
| OD-01 (carry mappings forward) | "Map to courses" step | Home never offers "copy from last term"; the step counts mapped skills only and links to Course mapping |
| OD-12 (does interpretation propose model and criteria) | Import step copy | Copy says "skills and descriptions"; never "suggested configuration" |
| OD-18 (evaluator link lifecycle) | "Waiting on an evaluator" | Optional neutral count only, no age, no "stalled", no resend action on Home (see §9 row W) |
| OD-27 (definition of "behind"; proposal in `brief-v2 §6`, id in `source/proposed-ids.txt`) | Any "students behind" list | **Not on Home.** Link to Attainment only |
| OD-P1 (module placement) | Routes | All links via `ROUTES.*` `[00-cross-cutting §2]` |
Not touched: OD-02, OD-04..OD-11, OD-13, OD-14, OD-16, OD-17, OD-19..OD-26.

## 6. Prototype reference (keep / do not copy)

`[PROTO]` has **no Home**: its first screen is the Overview (`docs/source/screens/01`) and its Library carries the unconfigured banner (`13-import-unconfigured-banner.png`, `08-library-skills.png`) `[docs/build/prototype-parity.md]`. Therefore Home has no prototype to match; it is a brief-v2 addition `[brief-v2 hybrid recommendation, item 2]`. Keep from `[PROTO]` the **wording of the unconfigured banner**: "cannot be used until each one is configured" with Configure them now / Show them / Dismiss `[journeys/01 stage A]`. Do not copy Dismiss on Home: a dismissed unconfigured count is the "silent gap" IM-10 forbids.
**Do not copy from brief-v2 Direction A, and why:**
1. The **"Go live" locked gate** (step 5 locked until steps 3 and 4 finish): REQ has no go-live step `[REQ SC-02, SL-11]` and activation is open `[OD-15]`.
2. **"Map to courses" as a prerequisite of go-live**: mapping is expectation, not eligibility; students may submit skills not mapped to their course `[REQ CM-05]`. Mapping is therefore a **recommended** step, never a gate. This is a defect in the brief's gate, not a style choice.
3. **A "progress bar" as the primary figure** (`▓▓▓▓▓░░░░░ 3 of 5 steps`): workspace rule "no progress bars as primary viz". Home leads with the number in words.
4. **"Spot-check one of each kit (2 of 4 checked)"**: this needs a stored self-attestation. SC-19 requires only that a preview **exists** `[REQ SC-19]`. Home offers the preview as a link and does not track whether it was looked at.
5. **"Sort into kits"** language: kits are a brief-v2 proposal, not a confirmed contract `[docs/build/contracts: no kits contract]`; the confirmed configure surface is the S-09 dialog `[S-09, prototype-parity]`. Home links to what exists (`ROUTES.skills?status=unconfigured`, `ROUTES.kits` only when that route is built).

## 7. Pattern and reference hub

**Pattern:** route (page), no dialog on Home `[00-cross-cutting §2]`. **Reference hub in repo:** `apps/pce/admin/app/(app)/admin/courses/page.tsx` shape (PageHeader + KeyMetrics + list) `[S-01 contract §7]`; for the attention-list grammar use no PCE file: it is a list of Card rows (see §8). `Mobbin` analogies and fit (full table in the companion note):
- Remote dashboard "Things to do (3)" with setup as the first row `[MOBBIN https://mobbin.com/flows/08aee33d-b6d5-45d4-9fa1-4b6348786e52]`: **Strong** for one list that holds setup and ongoing work.
- Vanta "Needs attention" card of labelled counts that link to a filtered list `[MOBBIN https://mobbin.com/screens/eb1d71b4-2b3c-4a83-8435-bdc0e7cbb9e2]`: **Strong** structure; its overdue and SLA words do not transfer.
- Squarespace per-section counts with "Show all" `[MOBBIN https://mobbin.com/screens/ae6fdc60-942b-4e54-a371-d1af8cc49294]`: **Partial**.
- Pipedrive explicit "Setup complete" hand-over `[MOBBIN https://mobbin.com/screens/e7f636d0-1d6f-4a07-a5fa-9baaffea7734]`: **Partial** (completion there is not recomputed).
- Salesforce "set up the essentials ... activate" `[MOBBIN https://mobbin.com/screens/71cb4514-c0f0-4030-94c8-0a4d49d7cbdb]`: **Partial**, evidence that OD-15's activation split exists in the wild, not an answer.
- Deel compliance count cards with denominators `[MOBBIN https://mobbin.com/screens/9c17783e-46c9-45d2-8bfd-0f3d1cff575b]`: **Partial** (its "Send message" row action is a notification and is out of scope).
- **No reference** for a setup step whose status is a live count over a 40-200 item bulk library, for setup and a live queue coexisting, or for a queue derived from configuration completeness. Those parts are hand-designed and untested `[INFER]`.
- **No clinical-education or accreditation analogue exists.**

## 8. DS mapping (verified 2026-10-09 with `node /Users/romitsoley/Work/tools/ds/source.mjs <Component>` against `@exxatdesignux/ui@1.5.1`; product pin proposal `^1.6.5`, prop drift not diffed `[00-cross-cutting §13]`)

| Need | Component | Verdict | Verified API note |
|---|---|---|---|
| Page title, subtitle, header actions | `PageHeader` | IMPORT | props `title`, `subtitle`, `actions`, `actionItems` (max three row actions); title is the serif `<h1>` |
| Setup card and each attention row container | `Card`, `CardHeader`, `CardTitle` (use `asChild` to render an `h2`), `CardDescription`, `CardContent`; `size?: "default"\|"sm"`, `interactive?` | IMPORT | `CardTitle` is an `h3` by default; `asChild` for heading order |
| Collapse the setup card to a summary line | `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` | IMPORT | Radix-based; trigger must be a labelled `Button` |
| Row and step status chips (text plus tone) | `StatusBadge` semantic mode (`label`, `tone: success\|warning\|info\|danger\|neutral`, `icon`, `size: sm\|md`) | IMPORT | no red: `danger` is not used on Home `[INFER; 00-cross-cutting]` |
| Counts strip in steady state (max four: Active skills, Mapped to a course, Course offerings with sub-label "{k} have skills", Students) | `KeyMetrics` `variant="compact"` or `"flat"`; items `{id,label,value,description}` with an empty trend | IMPORT | trend chip is hidden when `trend` delta is empty; no comparison deltas on Home. `[INFER]` approvals count appears once on Home, in Needs attention |
| Every action | `Button` with explicit `variant` and `size` (`default\|outline\|secondary\|ghost\|link`; `xs\|sm\|default\|lg`), text only, no icon | IMPORT | |
| Load failure, import-review reminders | `LocalBanner` (`variant error\|success\|warning\|info\|promo`, `title`, `action`, `retry`, `dismissible`) | IMPORT | there is no `emphasis` or `actionPosition` on `LocalBanner` `[00-cross-cutting §4]`; the 1.5.1 type dump prints the shared `SystemBannerProps`, re-verify before use |
| Loading | `Skeleton` in final layout | IMPORT | |
| Empty queue and zero-library states | none exported (`EmptyState` is **not** exported by 1.5.1: verified) | VENDOR `apps/pce/admin/components/empty-state.tsx` `[00-cross-cutting §12]` | pending `ds-adoption-reviewer` |
| Tooltip on truncated reasons | `Tooltip` | IMPORT | |
| Progress display | `Progress` is **not** exported; `ProgressCell` is a table cell | **Not used** | numbers in words, no bar |
| Stepper | `Stepper` not exported (`WizardProgress` exists) | **Not used** | Home list is not a gated linear flow |
| Attention row (title, count, reason, link) | composition on `Card` + `Button variant="link"`/`Button` | HAND-ROLL `AttentionRow`, one file, `[INFER]` | verdict belongs to `ds-adoption-reviewer`; register in `docs/governance/ds-adoption.md` (Romit) |
**No `DataTable`:** Home has no tabular data. Raw `<button>`, hex values and toasts are not used `[workspace CLAUDE.md]`.

## 9. Layout, content and behaviour

### 9.1 Two candidate layouts

Counts are illustrative, generated for this document, not data `[docs/strategy/07 §D13]`.

**Layout 1: Two-state page (brief-v2 Direction A read literally).** Setup layout until configuration is finished, then a different "status" layout.
```
SETUP STATE                                              STATUS STATE
┌ Home ─────────────────────────────┐                    ┌ Home ───────────────────────────────┐
│ Set up your skills library        │                    │ Your skills library                 │
│ 34 of 120 skills configured       │                    │ ┌KPI┐┌KPI┐┌KPI┐┌KPI┐               │
│ ┌ 1 Bring in skills      Done  › ┐│   when steps 1+2   │ Needs attention                     │
│ │ 2 Configure skills  34 of 120 › ││   are complete,    │  Approvals 4        [Open]          │
│ │ 3 Preview student view         › ││   the whole page   │  Lab instructors 2  [Open]          │
│ │ 4 Map to courses (optional)    › ││   is replaced      │ Shortcuts: Import · Attainment      │
│ └──────────────────────────────────┘│   ───────────▶     └─────────────────────────────────────┘
└───────────────────────────────────┘
```
**Layout 2: One page, setup card on top that shrinks into the attention list (recommended).** One layout in every state. A setup card sits above the attention list while the library is not fully configured, collapses to a single summary line when it is, and re-opens by itself if a later import adds unconfigured skills.
```
┌ PageHeader: Home ───────────────────────────────── [ Import skills ] [ Add a skill ] ┐
│ ┌ Setup (shown open while any skill is unconfigured) ──────────────────────────────┐ │
│ │ 86 skills need configuration              34 of 120 are configured  [Continue ]  │ │
│ │ ─────────────────────────────────────────────────────────────────────────────── │ │
│ │ 1  Bring in your skills        Done      120 skills in your library, 2 lines not │ │
│ │                                         read                      [ Review lines ]│ │
│ │ 2  Configure your skills      In progress   34 of 120  (unconfigured skills      │ │
│ │                                         cannot be mapped or used)  [ Continue ]  │ │
│ │ 3  Preview what students and evaluators will see          [ Preview ]            │ │
│ │ 4  Map skills to courses   Recommended   0 of 6 offerings have skills [ Open ]   │ │
│ └───────────────────────────────────────────────────────────────────────────────┘ │
│ Needs attention                                                                    │
│  ┌ Evaluations awaiting approval  · 4      Evidence is not counted until you decide [Review]│
│  ├ Lab instructors named by students · 2   Not yet on your roster              [Review]    │
│  └ Skills not mapped to any course · 12    Students can still submit them      [Open]      │
│ ┌ At a glance (KeyMetrics, max four) ──────────────────────────────────────────────┐ │
│ │ Active skills 34 │ Mapped to a course 22 │ Course offerings 6 │ Students 150    │ │
│ └──────────────────────────────────────────────────────────────────────────────────┘ │
│ Attainment by student, skill and tag is on the Attainment page.        [ Open Attainment ]│
└────────────────────────────────────────────────────────────────────────────────────┘
        Steady state: the Setup card becomes one line: "All 120 skills are configured. [ Review setup ]"
```

**Comparison `[INFER]`.**
| Criterion | Layout 1 two-state | Layout 2 one page, shrinking card |
|---|---|---|
| Setup and live work at the same time (students can submit on configured skills while 86 are still unconfigured `[REQ IM-09, SC-02]`, so approvals can arrive mid-setup `[REQ AR-01]`) | Poor: setup state must either hide the queue or become a hybrid | Good: the queue is always present |
| Layout stability (no page that changes shape) | Poor: the page is replaced at a threshold | Good: only the top card changes height |
| Re-import after go-to-steady-state `[REQ IM-11]` | Needs a third "back to setup" state | Free: the card re-opens because it is derived |
| First-run emphasis | Strong: setup is the whole page | Medium: setup is the top card; the queue below is empty and quiet |
| Empty-queue risk (Remote-style lists feel empty on day one, `brief-v2 Risks`) | Hidden in setup state | Visible; mitigated by a one-line "Nothing needs attention" row |
| Build cost | Two layouts and a switch | One layout, two card states |
| Fit with brief-v2 "one Home, two states, same nav item" `[brief-v2 §5 item 2]` | Literal | Same intent, one component tree |

**Recommendation: Layout 2.** Rationale `[INFER]`: (1) setup in this product is long and interruptible, so partial setup is the usual state for days, and a page that must choose "setup page" or "status page" is wrong for exactly the state users sit in longest; (2) because setup completion is **derived from data** (`configured count == total`), a later import re-opens it without a special case, honouring IM-10 and IM-11; (3) it keeps the queue visible when evidence arrives from already-configured skills; (4) Remote's "setup is the first row of the same list" is the strongest analogue found `[MOBBIN Remote flow]`. Cost accepted: the first-run page is quieter than a full-page guided journey. **Deviation to flag to Romit:** brief-v2 recommends Direction A literally for the first state; this contract keeps its steps and intent but not its two-page switch, its locked gate or its progress bar (see §6).

### 9.2 Derivations (all computed from library, mapping and review data; none stored or ticked) `[INFER]`
| Item | Rule | Backed by |
|---|---|---|
| Skills in library | count of active and inactive skills not including deactivated in scope figures | SL-11 |
| Configured / unconfigured | a skill is configured when it has a chosen model and a saveable configuration; never inferred from a default | SC-01, SC-02, SC-18 |
| Step 1 Done | library has at least one skill | `[INFER]` |
| Step 2 Done | zero unconfigured active skills | IM-10 |
| Step 3 | link only; no completion state | SC-19 (preview exists) |
| Step 4 Recommended, never blocking | count of offerings with at least one mapped skill; **not required for students** | CM-05 |
| Setup card open | any unconfigured skill exists `[REQ IM-10]`, **or** library is empty `[INFER]` | IM-10, IM-11 |
| Unread lines count (step 1) | from the most recent import batch only; persisting past the import dialog is `[INFER]` (REQ requires the report at import time only) | IM-08, IM-11 |
| Approvals row | shown only when at least one skill has administrator approval turned on | SC-15, AR-01 |
| Lab instructors row | names students entered that are not on the roster | SL-09 |
| Unmapped skills row | configured active skills mapped to no offering; **informational only**, copy never says "must" | CM-05 |
| Waiting on an evaluator row | count of submissions with the evaluator; **hidden until OD-18 decides how stalled is shown**; ships off by default | OD-18 |

### 9.3 States (L E Er V S Su D P Bl; `docs/strategy/06` rows adapted; none TBD)
| State | Behaviour |
|---|---|
| **L Loading** | `Skeleton` in the final layout: card header, three rows, four KPI cells. No spinner-only load `[00-cross-cutting §8]` |
| **First run** (library empty) | Setup card open; no counts; step 1 is the only actionable step; steps 2 to 4 shown as "Available after you add skills" (text, disabled with the reason, not hidden) `[00-cross-cutting §8 blocked-with-reason]`. No skills, categories or example names are suggested `[REQ SL-01]`. Two entry buttons: Import skills and Add a skill `[REQ IM-01, IM-12]`. Attention list: one row "Nothing needs attention yet" |
| **Partially set up** | Setup card open; headline count of unconfigured skills; step 2 "In progress {n} of {N}"; attention rows appear as their conditions become true; KPI strip shown |
| **Ready (all configured, none unmapped required)** | Setup card collapsed to one line with "Review setup" trigger; readiness sentence "{n} skills are configured and active. Students can submit evidence for them." No Go live action `[OD-15]` |
| **Live** (evidence flowing) | Same as Ready plus non-zero attention rows and KPI values |
| **E Empty queue** | One row "Nothing needs your attention" with neutral tone and a next-best link (Attainment) `[MOBBIN Oyster, mobbin-evidence job 2]` |
| **Er Error** | Failure to load counts: `LocalBanner` error, title "Home could not be loaded", body "Try again.", with `retry`; any figure that failed shows "Not available", never a stale or zero value `[00-cross-cutting §8]`. A single failed row does not blank the page |
| **V Validation** | None (read-only) |
| **S Saving** | None on Home. Navigating away from a link never discards anything because Home holds no edits |
| **Su Success** | After returning from import: `LocalBanner` success "{n} skills added. They need configuration before they can be mapped or used." `[REQ IM-09]` |
| **D Disabled** | Steps 2 to 4 disabled with a visible reason when the library is empty; "Review setup" absent while the card is open |
| **P Partial / recalculating** | While counts refresh after a rule change `[REQ AE-02]`, the changed figure shows "Updating" in a polite live region, not a stale number `[00-cross-cutting §6]` |
| **Bl Blocked-with-reason** | Step 4 and the unmapped-skills row never claim mapping is required. Unconfigured skills named in copy as "cannot be mapped or used" `[REQ IM-09]` |
| **Inactive skills** | Excluded from every count; row "Inactive skills: {n}" is not shown on Home `[REQ SL-11]` |

### 9.4 Edge cases `[docs/strategy/06 §2]`
EC-28 imported skill unconfigured: counted in the headline, never in the mapped counts. EC-27 import re-run: the setup card re-opens because the unconfigured count is non-zero. EC-10 skill deactivated: removed from every Home count. EC-11 student submits an unmapped skill: the unmapped row is informational and says so. EC-15 lab instructor not on roster: appears in the lab instructor row until adopted `[REQ SL-09]`. Duplicate display names are irrelevant here: Home names no students.

### 9.5 Copy `[INFER; wording pending docs/ux/09; professional, no em-dashes, no colloquialisms, sentence case, text-only buttons]`
| Where | Text |
|---|---|
| Page title / subtitle | "Home" / "Where your skills library stands and what needs your attention." |
| Setup card title (open) | "Set up your skills library" |
| Headline (partial) | "{n} skills need configuration" with secondary "{done} of {total} are configured." |
| Step 1 | "Bring in your skills" · "Add a list you already have, or add skills one at a time." (never "we found", never an accuracy claim `[REQ IM-13]`) |
| Step 1 detail | "{total} skills in your library." · "{k} lines could not be read." with action "Review lines" `[REQ IM-08]` |
| Step 2 | "Configure your skills" · "Choose how each skill is evaluated. Skills that are not configured cannot be mapped to a course or used by students." `[REQ IM-09, SC-02]` |
| Step 3 | "Preview what students and evaluators will see" · action "Preview" `[REQ SC-19]` |
| Step 4 | "Map skills to courses" · badge "Recommended" · "Mapping shows students what is expected. Students can still submit skills that are not mapped." `[REQ CM-05]` |
| Collapsed setup | "All {total} skills are configured." with "Review setup" |
| Readiness | "{n} skills are configured and active. Students can submit evidence for them." |
| First-run disabled step reason | "Available after you add skills." |
| Rows | "Evaluations awaiting approval" · "Evidence is not counted until you approve it." `[REQ AR-06]` / "Lab instructors named by students" · "These names are not on your roster yet." `[REQ SL-09]` / "Skills not mapped to a course" · "Students can still submit them." `[REQ CM-05]` |
| Empty | "Nothing needs your attention." |
| Attainment pointer | "Attainment by student, skill and tag is on the Attainment page." with "Open Attainment" |
| Error | Title "Home could not be loaded"; body "Try again." |
Not used: "Go live", "Great job", "You're all set", "Skip", any time word (overdue, due, stalled), any ranking word ("behind", "lagging", "bottom"), any reference to a skills list we supply, any em-dash.

### 9.6 Behaviour
Every row action is a link into an existing surface using `ROUTES.*`: Import `ROUTES.import`; Review lines opens the import dialog; Configure `ROUTES.skills` with `?status=unconfigured` per `[S-04 contract §7]`; Preview opens the S-09 preview `[REQ SC-19]`; Map `ROUTES.courses`; approvals `ROUTES.reviews`; lab instructors `ROUTES.labInstructors`; Attainment `ROUTES.attainment`. "Continue" in step 2 opens the **first unconfigured skill's configure dialog** (`ROUTES.skillConfigure`) `[INFER]`, so one click resumes work. Bulk apply (`IM-14`) is reached from the library bulk bar, not owned by Home. Keyboard and focus: see §10.

## 10. Accessibility (WCAG 2.1 AA) `[00-cross-cutting §9]`
One `h1` (the PageHeader title); setup card title is an `h2` via `CardTitle asChild`; each attention row heading is an `h3` or a labelled list item; no skipped levels. The attention list is a real `ul` with one `li` per row, each `li` reading "{label}, {count}, {reason}" as one accessible name so a screen reader hears the count before the reason. Status is always text on a `StatusBadge`; colour never carries it `[WCAG 1.4.1]`. No `progress` role: no bar exists; the headline sentence is the text equivalent. Collapse control: `Button` with `aria-expanded` and `aria-controls`; focus stays on the trigger after toggling; Escape does nothing special (no overlay). Targets at least 24 by 24 CSS px `[00-cross-cutting §9]`. Icon-only buttons need `aria-label` and a `Tooltip`; decorative icons `aria-hidden="true"`; action buttons are text-only. Count changes announce in a polite live region only after a user-triggered refresh, not on every render. Reduced motion: the collapse is instant when `prefers-reduced-motion`. Contrast verified with axe per state (first run, partial, ready, error) **before any done claim: not yet run**.

## 11. Out of scope
`[REQ §14]`: remediation workflow; notifications, reminders and escalation (so no "Remind", no due dates, no overdue); skill currency and expiry; patient-encounter linkage; accreditation outputs beyond exports; Evaluations migration. Call-only, not in REQ: heatmaps, preceptor-consistency, site-quality `[CALL 09-23 lines 74, 76]`; "bottom 20%" lists `[CALL 09-23 line 72]` `[OD-27]`; batch grid `[OD-19]`; QR. Also not on Home: skill-status counts `[OD-03]`, any attainment figure, a Go live action `[OD-15]`, "copy from last term" `[OD-01]`, a student or preceptor Home, a custom per-admin dashboard, saved views, in-product tours or videos, dismiss-forever controls for setup.

## 12. Acceptance tests (Given / When / Then; at least one per requirement ID)
- **SL-01** Given a new program with no skills, When I open Home, Then no skill, category, tag or example name is shown or suggested and the only content actions are Import skills and Add a skill.
- **IM-01, IM-12** Given an empty library, When I open Home, Then both "Import skills" and "Add a skill" are offered with equal prominence and neither is described as required.
- **IM-08** Given the latest import left 2 lines unread, When I open Home, Then step 1 states "2 lines could not be read" and "Review lines" opens the import dialog showing each line with its original text.
- **IM-09** Given 86 unconfigured skills, When I read Step 2, Then it says they cannot be mapped to a course or used by students, and none appears in any mapped or active count.
- **IM-10** Given 34 of 120 skills configured, When I open Home, Then the headline reads "86 skills need configuration", the count equals the library's unconfigured filter, and there is no control that dismisses it.
- **IM-11** Given Home shows the collapsed setup line, When I import 10 new skills, Then on returning the setup card is open again and the headline reads "10 skills need configuration" without any manual reset.
- **IM-13** Given any state of Home, When I read all copy, Then no string claims interpretation accuracy or says a skill was created automatically.
- **IM-14** Given unconfigured skills exist, When I read Home, Then no bulk or kit action is offered on Home and step 2 links to the library where bulk apply is available.
- **SC-01, SC-02** Given an unconfigured skill, When "Continue" is activated, Then the configure dialog opens with no evaluation model preselected and nothing is saved by Home.
- **SC-15** Given no skill has administrator approval enabled, When I open Home, Then the approvals row is absent; Given one skill has it enabled, Then the row appears.
- **SC-19** Given configured skills exist, When I activate "Preview", Then the student and evaluator views open together, and Home shows no "checked" or "not checked" state for it.
- **CM-05** Given 12 skills are mapped to no offering, When I read Home, Then the unmapped row says students can still submit them, and Step 4 is labelled Recommended and never blocks any readiness sentence.
- **AR-01, AR-06** Given 4 evaluations await approval, When I open Home, Then the row shows 4 with "Evidence is not counted until you approve it" and links to the approval queue; and the 4 are absent from every count on Home that implies achievement.
- **SL-09** Given 2 student-named lab instructors are not on the roster, When I open Home, Then the lab instructor row shows 2 and links to the roster; Given none, Then the row is absent.
- **SL-11** Given a skill is deactivated, When I open Home, Then it is removed from the library, configured, unmapped and active counts.
- **RP-02** Given the Home page in any state, When I look for student attainment, Then no per-student or per-skill figure appears and "Open Attainment" links to the Attainment page.
- **OD-15 seam** Given all skills are configured and active, When I read Home, Then there is no "Go live" or "Activate" control and the readiness sentence is plain text.
- **States** Given each of first run, partially set up, ready, empty queue, error, loading, When I view Home, Then each renders as specified in §9.3 with no blank region, and axe reports no violations (run before done claim).
- **Hard stops** Given the final Home source, When grepped, Then it contains no `<button>`, no hex or rgb literal, no `toast(`, no red in any count, no progress-bar component, no word from the "Not used" list.

## 13. Risks and unknowns (max three)
1. **The Home concept itself is `[INFER]`**: no requirement, no call remark and no prototype screen asks for it; it has not been tested with an admin (brief-v2 §6 proposes a 5-user concept test `[docs/ux/12]`). Cheapest slice: the setup card plus the unconfigured count only.
2. **Derived completion cost and trust**: counts over 200 skills recomputed on every rule change `[REQ AE-02]`; and "configured" must mean "has a saveable configuration" `[REQ SC-18]`, which Home cannot define on its own.
3. **Attention rows may drift into judgement or notification** (approval age, "stalled", "behind"): each needs an OD (OD-18, OD-27) and a stakeholder call before any reaches Home.

## 14. Vault notes consulted
`Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw, read in full: lines 20, 28, 72, 74, 76, 78, 112, 114, 118); `_Insights.md` searched for skills and Sankalp (entries: `Meetings/exxat/2026-09-23-skills-checklist-with-sankalp`, `Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract`, `Meetings/exxat/2026-09-30-day-3-post-cohere-meeting`); the two Meetings notes themselves were **not** opened (the raw transcript supersedes the first; the others are not about Home).

## 15. Questions for Sankalp and Aarti (recommendation first)
**Sankalp**
1. OD-15: is "activation" a state after configuration (as on the call, line 114) or just configured plus active? Recommendation: configured plus active, per-skill, no separate go-live (REQ SC-02), so Home needs no gate.
2. Is a part-configured library allowed to take student evidence on its configured skills while the rest wait? Recommendation: yes (REQ IM-09 only blocks the unconfigured ones); it is why Home keeps the queue visible during setup.
3. Should the most recent import's unread lines persist after the import dialog closes (IM-08 requires the report at import time only)? Recommendation: persist until the next import, shown on Home.
4. OD-27: how is "behind" defined (threshold, date, per course)? Until answered it stays off Home.
**Aarti**
5. Is a Home with no attainment numbers acceptable, with the lagging view living only on Attainment (and the call's "bottom 20%" deferred)? Recommendation: yes.
6. Is "Recommended" the right label for mapping, given the call says mapping is "more like a recommendation" `[CALL 09-23 line 30]` but REQ uses mandatory and non-mandatory per offering `[REQ CM-03]`?

## 16. What was not verified
Static research and document review only. No runtime render, no axe, no `visual-diff`, no live catalog (`localhost:4000`) check; DS props were verified against the installed 1.5.1 type files only. The `LocalBanner` 1.5.1 type dump prints `SystemBannerProps` (with `emphasis`), which conflicts with the cross-cutting note that `LocalBanner` has none; not resolved here. `docs/design/hybrid-build-plan.md` is referenced by `admin/lib/skills-routes.ts` but **does not exist** in the repo. The `ROUTES.kits` route exists in the registry; whether it renders anything was not checked. Raw call lines 112 and 114 are partly Hindi-English mixed speech and were paraphrased, not quoted. Mobbin findings are single-frame previews with no interaction.
