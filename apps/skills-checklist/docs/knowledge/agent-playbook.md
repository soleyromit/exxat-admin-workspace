# Agent playbook: Skills Checklist design lead (long form)

**What this is.** The full operating manual for the `skills-design-lead` agent (`apps/skills-checklist/.claude/agents/skills-design-lead.md`). The agent prompt carries a distilled copy; this file is the long form. If the agent is unavailable, the main session reads this file and follows section I itself.
**Written:** 2026-10-26. **Owner:** Romit Soley (design). **Product owner:** Sankalp Panda.
**Built from (read in full, not from memory):** `00-design-brief.md`, `glossary.md`, `02-decisions-ledger.md` (1, 3b, 3c), `01-competitive-digest.md`, `strategy/01` to `07`, `design/visual-language.md`, `design/granola-2026-10-26-updates.md`, `design/skill-setup-journey/01-layout-patterns.md`, `03-lab-architecture.md`, `ds-usage-map.md`, product `CLAUDE.md`, workspace `/Users/romitsoley/Work/CLAUDE.md`, and the design feedback memories in `~/.claude/projects/-Users-romitsoley-Work/memory/`.
**Tags.** `[REQ id]` requirements (`docs/source/requirements.extracted.txt`) · `[CALL]` raw call transcript (10-08, 10-09, 10-26) · `[COMP]` competitive digest · `[LEDGER D-x]` decisions ledger · `[S0n]` strategy doc n · `[LAW]` lawsofux.com · `[NNG]` Nielsen Norman Group · `[MEM name]` Romit's standing feedback memory · `[INFER]` judgement, unverified. Precedence for behaviour: REQ > CALL > PROTO > INFER. For visual layout, IA and copy structure the prototype is the design to build inside the DS base shell (Romit 2026-10-08).

---

## A. Product

### A1. One sentence and the jobs

A program defines the skills it expects, students gather signed evidence, evaluators sign without an account, and the program sees who has achieved what and can trace every figure to the evidence behind it [REQ 1.1, 1.2].

| Role | Job to be done | Done when | Source |
|---|---|---|---|
| Admin (program, coordinator) | Get a 100+ skill library live without retyping; configure how each is judged; assign to cohorts or groups; map to courses; see attainment | Every skill is configured or visibly "Not configured"; a rule change shows who flips before publish | [REQ IM-01, IM-10, SC-19] [CALL 10-26] |
| Student | Know what is left; ask for a sign-off in seconds; understand why something did not count | Counted, waiting, returned always visible; every "did not count" names the failed rule | [REQ SH-02..04] |
| Evaluator (preceptor, clinical faculty, lab instructor) | Sign one or several skills in one sitting, no login, under 2 minutes | Link opens straight to the form; told "counts now" or "held for approval" | [REQ EV-01, EV-05, EV-07] [COMP 22 s to 2.7 min] |
| Reviewer (faculty, coordinator) | Clear the approval queue and know why each record is held | Approve or return with a note; sees self versus evaluator side by side | [REQ AR-01..05] |
| Director | Confirm the graduating cohort is ready; find who is behind | Drill from figure to students to evidence | [REQ RP-05, RP-06]; director role and verification are not REQ [INFER] |

### A2. Hard stops (never violate)

| Hard stop | Source |
|---|---|
| Prism ships no skills or taxonomy (starter libraries only as editable starting points the program owns, SL-01 conflict flagged) | [REQ SL-01] [LEDGER D-X5] |
| No default evaluation model | [REQ SC-02] |
| Unconfigured skills cannot be mapped or submitted | [REQ IM-09] |
| Completed evaluations are immutable: a correction is a new version ("Request a correction"), a failed one needs a further attempt; never "Edit" or "Reopen" | [REQ RV-03, RV-05] [LEDGER D-X1] |
| Mapping is expectation, not eligibility | [REQ CM-05] |
| Evaluators have no login and no app chrome | [REQ EV-01] |
| Lab or simulation evidence never satisfies a clinical-setting minimum | [REQ SC-12] |
| REQ section 14 is out of scope: remediation workflow, notifications, expiry, patient-encounter linkage, Evaluations migration | [REQ 14] |
| The engine decides what qualifies, not the evaluator or reviewer | [REQ AE-02] |
| Pending never counts: waiting and awaiting approval are overlays, never states | [REQ AE-01, AE-06] |
| Never treat an `OD-*` as decided | [README] |

### A3. Handoff chain (every hop needs a receiver-side cue) [S01 6] [S03 3] [LEDGER D-C]

```
ADMIN publish+map --H1--> STUDENT "2 new skills in NURS 350" (FYI strip)
STUDENT send --H2--> EVALUATOR email, one row and one link per request (D-L2)
EVALUATOR submit --H3--> STUDENT card flips + "J. Delgado signed 2 skills. 2 counted."
                 --H3b-> EVALUATOR receipt "Counts now" / "Held for approval" + Next request
HELD --H4--> REVIEWER nav badge + "Why held" chip (Skill requires approval / Evaluator not assigned / Paper form)
REVIEWER approve --H5--> STUDENT "Approved after review"; return --H6--> STUDENT "Fix and send again" + reason
DID NOT QUALIFY --H7--> STUDENT failed-rule sentence + "Make a further attempt"
COUNTED/READY --H8--> DIRECTOR "Ready" / "Changed since verified"
UNKNOWN NAME --H10--> ADMIN Needs you "Dr. Whitmore, named by 3 students" (adopt or merge)
RULE CHANGE --H11--> STUDENT "Rule changed Oct 26: ..." + DIRECTOR "Changed since verified"
```

Channel rule: email only to people with no account (evaluators); everyone else gets in-product cues at the entry point they already open. No toast, no global feed [S03 3].

### A4. Done per role (acceptance, observable)

| Role | Acceptance test |
|---|---|
| Student | Cover all but the top screen: can they say counted, waiting, returned and the next action in 2 seconds? |
| Evaluator | Email tap to receipt under 2 minutes; zero chrome, zero sign-in, zero decisions beyond outcome and feedback |
| Reviewer | Name the hold cause of every row without opening it |
| Director | Every figure drills to evidence; the verified record states its own gaps |
| Admin | Predict the effect of a save before making it ("6 students change status") |

### A5. Scale reality [LEDGER D-D]

123 students (38 / 43 / 42), 153 to 154 skills in 10 sections, 403 evaluators, 2,141 sites (120 in the lab dataset), 8,879 evidence records. Never design or test against 12 students or 7 skills. Search first, group by section, chips removable alone, bulk by default.

---

## B. UX laws and principles (plain sentence, our rule, check)

| Law | Plain sentence | This product's rule | Check |
|---|---|---|---|
| Hick [LAW] | More choices, slower choice | Max 5 visible filter controls in a scope bar or toolbar; rest in "More filters". Select over 7 options gets type-to-search (Popover + Command) | Count controls above the first table or chart |
| Miller [LAW] | People hold a handful of things | Clusters 5 to 7: nav per role 2 to 4, KPIs max 4, worklist 5 + "All n", ranked chart top 5 to 8. Cut by meaning, not by 7 | Count members per cluster |
| Chunking [LAW] | Break long content into named groups | Any list over 20 rows is grouped or paginated; group heading carries a count | 153 skills shown as 10 collapsed sections |
| Fitts [LAW] | Small or far targets are slow | Desktop target 24 px min, touch 44 px (`--control-height-touch`); action next to its object; phone primary full width at the bottom | Measure targets |
| Jakob [LAW] | People expect familiar patterns | Scope top, as-of right, removable chips, DataTable sort and search, tabs with counts; no invented chart without legend and table | Compare to cited Mobbin refs |
| Tesler [LAW] | Some complexity only moves | Rule complexity lives in the engine and Configure; students and evaluators read one sentence | "Needs 2 sign-offs from 2 different evaluators; you have 1" |
| Gestalt proximity | Close things group | Gap between groups at least 2x the gap inside: `gap-2` inside, `gap-4` elements, `gap-6` sections, `gap-8` groups | Inspect spacing |
| Gestalt common region | A border makes a group | One card answers one question; no card in a card; never box a single line | Count nested cards |
| Gestalt similarity | Alike looks read as same | One colour, one meaning per page; same glyph for same state everywhere | Saturated hues above fold 2 or fewer |
| Gestalt figure/ground, Pragnanz | Eye separates marks from ground; reads simplest form | Data marks are the only saturated ink; one chart form per question; never draw a number twice | No glyph row beside a chart of the same count |
| Von Restorff [LAW] | The odd one is remembered | Highlight 1 thing per region or 20% of marks max; state ties in words ("8 skills tie at 17 of 42") | Highlight share per chart |
| Serial position [LAW] | First and last are remembered | Verdict first, act-on region last; evaluator: summary first, Submit last | Reading order |
| Doherty [LAW] | Answers within 400 ms keep flow | Scope change re-renders 123 x 153 within 400 ms or shows final-shape Skeleton per card; no page spinner | Time a scope change |
| Postel [LAW] | Accept messy input, return clean | Import accepts any column order and synonyms, outputs one strict shape and lists its guesses with undo | "We read 'Skill title' as Name" |
| Aesthetic-usability [LAW] | Pretty hides problems | Never accept a design on looks; run the 10-second test and the density counts | Density script output pasted |
| Pareto [LAW] | Few causes, most effect | Top jobs own the first viewport (admin: who is behind, what waits; reviewer: approve; student: ask for sign-off); setup, export, history go below or one click away | First viewport audit |
| Zeigarnik and goal-gradient [LAW] | Unfinished work sticks; effort rises near the goal | Open work as a count with a next step, never a nag; "one skill short" is a first-class group; no progress bars for attainment | "In progress (2 of 4)", "1 more sign-off" |
| Peak-end [LAW] | Judged by peak and end | Every flow ends on a plain outcome sentence saying what happens next | "Counted now", "142 skills added, 12 need configuring" |
| Occam [LAW] | Simplest that works | Cut test: remove an element; if no question loses its answer, leave it out | Run the cut test per element |
| Cognitive load + progressive disclosure [LAW] [NNG] | Every element costs effort; show common first | Two disclosure levels max: surface, then one click (tables, formulas, More filters, history) | Click depth per fact |
| F and Z patterns [NNG] | Readers scan top, then left | Lists: first column is the record name; headings start with the informative word. Dashboards: verdict top-left, page action top-right, act-on bottom-right | Screenshot read |

**Nielsen's 10 for this product** [NNG] [S07 2]

| # | Heuristic | Dashboards | Forms and wizards |
|---|---|---|---|
| 1 | Visibility of status | As-of time and Refresh always visible; "Recalculating after a rule change" banner | Offline drafts show Queued, Synced, Conflict; sending shows `aria-busy` label |
| 2 | Match the real world | Program's noun, REQ words (Met/Unmet, Did not meet criteria) | Client words: "Evaluation criteria", "How many times" [CALL 10-26] |
| 3 | User control and freedom | Each chip removable alone; Back restores scroll and scope | Back in footer; Save draft; unsaved-change guard on sheets |
| 4 | Consistency and standards | Same student, same counts on every screen; nav badge and KPI never disagree in unit | One noun per concept (glossary) |
| 5 | Error prevention | Impossible filters explained, not zero | Unconfigured skills cannot be mapped or sent; unsatisfiable configs saved with the reason [REQ SC-18] |
| 6 | Recognition over recall | Applied scope readable without opening a control | Live rule sentence in the sticky footer |
| 7 | Flexibility and efficiency | Saved views (up to 5) [INFER] | Bulk configure, bulk approve, paste several |
| 8 | Aesthetic and minimalist | Density budget (section E7) | 7 fields per step |
| 9 | Recognise, diagnose, recover | Per-card error: what failed, what is kept, Try again | Field error under field + one summary banner after a failed continue |
| 10 | Help and documentation | One "How this is counted" sheet per page; Tip on figures | Field helper 12 words max |

---

## C. Information architecture and navigation

| # | Rule | Source |
|---|---|---|
| C1 | **11 sidebar rows total**: admin 4 (Dashboard, {Skills}, Approvals, Attainment), reviewer 2 (Approvals, Students), director 2 (Dashboard or Verification, Attainment; PENDING), student 3 (My progress, Log, Record); evaluator has no sidebar, only a link-target page | [LEDGER D-A] [S01 3.1] [D-L4] row list is an audit proposal, not approved |
| C2 | An object is a destination only if some role begins a work session there; everything else is a lens (filter, tab, linked drill) | [S01 IA-1] |
| C3 | **Role is a permission, not a path**: one staff route tree, one URL per record for every staff role; a link never changes role | [S01 IA-3, L3] [LEDGER D-X8] |
| C4 | **Record-linked**: every student, skill, group, site, course, evaluator and count that names a record is a link to where it is acted on, carrying the key (`stu`, `item`, `coh`, `site`, `course`, `evaluator`, `list`) | [S01 IA-4] |
| C5 | A figure opens a list whose length equals the figure, with the same scope; a count with no drill is plain text, never link-styled | [S06 D2, R1] [S01 L4] |
| C6 | Back from a drill restores scroll and scope; scope lives in the URL and is shared across Dashboard, Attainment, Approvals | [S06 S5, R3] |
| C7 | Approvals row always shown, with an empty state when no skill requires approval | [LEDGER D-L3] |
| C8 | Staff landing is "Dashboard"; student landing is "My progress"; reviewer lands on Approvals | [ROMIT 10-26] [LEDGER D-L4] |
| C9 | Tabs: at most 4 per page on IA grounds (3 to 5 on the cluster line), they split one object into views, none is a step | [S01 14] [S07 3] |
| C10 | **Lab: flows and option sets.** A flow is an ordered list of steps for one job; an option set is one coherent direction across all steps (set-up-skills: 1 Guided, 2 One page, 3 Many at once). Registry `lib/lab/screens.json` (38 screens, 93 variants), flows `lib/lab/flows.json` (10 flows) | [03-lab-architecture 2, 3] |
| C11 | **Set-aware links**: in-lab hrefs come from `lib/lab/links.ts` (`labHref`, `navHref`, `variantFor`, `rewriteLabUrl`); never hard-code a variant letter in an href. Sidebar rows identical across all variants of a persona | [lab-nav-crawl.mjs] [CALL 10-26 item 21] |
| C12 | Present mode (`/lab?present=1`) hides tier, build status, Tests tooltip, Components drawer and non-recommended variants; reporting shows "Not ready" | [CALL 10-26 item 20] |

---

## D. Content strategy

### D1. Voice

Professional, plain, calm, specific. Active voice, sentence case, no exclamation marks, no colloquialisms ("heads up", "oops", "flip", "tweak"), no emoji, no em dashes anywhere including docs and comments [S02 1.1] [MEM professional_microcopy_standard]. Warmth comes from specificity and a next step, not tone words.

| Role | Sentence length | Address | Example |
|---|---|---|---|
| Admin | up to 20 words | Imperative buttons; consequence at the decision | "Publish and apply to 123 students. Completed evaluations are kept." |
| Student | 8 to 14 | "you" | "You have 1 of 2 sign-offs." |
| Evaluator | 6 to 12, shortest in product | Direct; "Please" only in email | "Choose an outcome for each skill." |
| Reviewer | 8 to 16 | States cause | "Held because the skill requires approval." |
| Director | 8 to 14 | Figure first | "3 verified, 1 changed." |

### D2. Vocabulary governance [S02 2] [glossary 2.1]

| Rule | Detail |
|---|---|
| Glossary is the only source | Propose new terms in `glossary.md` (Use, Not, Who, Config, source) before using them |
| The program names the noun | `{itemNoun}`: Skill, Competency, EPA, Essential, Procedure; nav and titles read from the term map |
| One word per concept | submission (the record), request (the message to an evaluator), evaluation (one completed assessment), skill record (one student on one skill) |
| REQ words win | Met / Unmet, Did not meet criteria, Awaiting approval, mandatory |
| Program labels are data | Outcome labels, level names, clinical settings, evaluator role names |

**Banned in UI:** items, item, pending, entry (alone), ticket, record (as a verb), reject, fail, failed, retake, "Reopen to edit", "AI-powered", "smart", requirement IDs, OD numbers, stakeholder names, "per Sankalp", "Prism supplies skills" [S02 5] [glossary 5 rule 9].

### D3. Text budget [S02 4.2]

| Element | Limit |
|---|---|
| Page title | 1 to 3 words (nav pages), up to 6 (object pages) |
| Subtitle | Default none; 12 words; facts only |
| Section heading | 4 words, noun + count |
| Section description | Default none; 10 words; one per section |
| Field helper | 12 words |
| Button | Verb + object, 4 words max, no icon |
| Empty state | Title 6, body 14 |
| Banner | Title 8, body 20; max 2 per screen |
| Confirm dialog | Title 6, body 20 |
| Tip | 20 words; never the only copy of required information |
| Prose above the fold | Desktop 40, phone 25, evaluator 15 (wizard step 30) |

Where text goes instead, in order: a quantity becomes a visual with the number on it; how-to-operate text is deleted and the control fixed; consequences go on the action; status becomes StatusBadge; an uninferable rule gets one 10-word line beside its control; method goes to a Tip and the page's one "How this is counted" sheet; anything else is deleted [S02 4.3].

### D4. Status wording system (one value, one label, everywhere) [S02 6] [glossary] [lib/v2/labels.ts]

| Concept | Labels | Rule |
|---|---|---|
| Outcome of one evaluation | Met / Unmet (program may rename); Did not meet criteria | Never "Not met", "Failed" |
| State of a submission | Waiting for {name} · Awaiting approval · Counted · Did not meet criteria · Returned · Not sent · Sent to {name} for a new evaluation (D-X25) | Always name who holds it |
| Skill record (four states only) | No evidence yet · Evidence does not qualify · In progress (n of N) · Achieved | "In progress" is Romit's word [LEDGER D-L1]; OD-03 on merging the first two stays open |
| Overlays | waiting, returned, unverified evaluator | Never change the state; never counted |
| Queue tabs / why held | Awaiting approval (n) · Stalled (n) · Returned (n) / Skill requires approval · Evaluator not assigned · Paper form | Cause, not readiness [CALL 10-26 item 13] |
| Configuration | Not configured · Configured · Published · Inactive | "Draft", "Incomplete" banned |
| Requirement level per course | Mandatory · Recommended · Optional · Not mapped | Recommended and Optional are PROPOSED against REQ CM-03 [CALL 10-26 item 9]; only Mandatory drives "Required this term" |
| Graduation bands | Complete · One skill short · Short · Far behind (4+ missing) | Against "Required to graduate" [LEDGER D-X11, D-X12] |
| Two required sets | "Required this term" vs "Required to graduate" | Never in the same figure [LEDGER D-X12] |

### D5. Microcopy formulas [S02 7] [S03 8]

| Case | Formula | Example |
|---|---|---|
| Error | {What failed}. {What to do}. | "The file could not be read. Check that it is a PDF and try again." |
| Recoverable error | {What failed}. {What is kept}. Try again | "Your request was not sent. Everything you entered is kept." |
| Blocked | {Thing} cannot {act}: {reason}. {Way out}. | "No evaluator can be chosen for this setting. This skill allows only lab instructors." |
| Empty (nothing yet) | {What will appear}. {One action}. | "Your skills library is empty. Add skills from a file or one at a time." |
| Empty (filtered) | No {things} match {chips}. Clear filters | "No submissions match Waiting 8+ days." |
| Impossible filter | Explain in place of the table, Remove per chip | "Mercy Home Health does not offer Emergency." |
| Failed rule | This evaluation did not meet criteria. {Rule with numbers}. {Next step}. | "You need 2 sign-offs from 2 evaluators and have 1. Send it to a second evaluator." Generated from the current rule at read time |
| Success | {Object} {past verb}. {Consequence once}. {One next link} | "Approved. 2 evaluations now count toward Maya's record." |
| Confirm | Title is the action; body is consequence and what is kept; primary repeats verb + scope | "Publish and apply to 123 students" (never "Are you sure?") |
| Hard block vs warning | "Cannot" + reason (error style) vs "Check" / "Will not block" (amber or neutral) | Never the same pill or banner style [MEM severity_must_be_visually_distinct] |

---

## E. UI and visual

### E1. Shells per audience [S01 7.1] [S04 3, 14]

| Shell | Who | Carries | Must not carry |
|---|---|---|---|
| Staff | Admin, reviewer, director | DS shell: left rail, utility bar (product switcher, title, Search only if it indexes records, profile with "Switch view"), page header, work-count badges | Demo menu, device toggles, inert Notifications or Help, Leo glow |
| Student | Student | Same DS shell, 3 rows; bottom bar (max 4, 44 px) at 375; sync chip only when not synced | Staff vocabulary, fault toggles in production chrome |
| Evaluator | Preceptor, faculty, lab instructor | Light header "Secure evaluation link, no account needed" once + program name; centred column 820 px max; sticky submit on phone | Sidebar, switchers, search, profile, any link out of the evaluation, any account language |

Theme: the app runs `theme-prism` (rose, hue 342); never violet [S04 2] [MEM prism_theme_is_pink].

### E2. Layout templates (content column inside the staff shell; left aligned, never centred) [01-layout-patterns 2, 3]

| Template | Use | Width | Primary | Footer | Regions |
|---|---|---|---|---|---|
| T1 List | Library, queues, directories | full (1136 at 1440) | Header, one filled `sm`, rightmost | DataTable bulk bar on selection | 4 |
| T2 Wizard | Import, Configure (Set 1) | 960 (`max-w-[60rem]`) | Sticky footer, `default` size | Sticky: Back left, context (10 words) middle, primary right; `WizardProgress` sr-only | 4 |
| T3 Form or detail | Add, settings, record detail | 720 (`max-w-[45rem]`); detail with tables 1024 | Sticky footer with summary line | Sticky | 4 (detail 5) |
| T4 Split | Approvals B, Export A | full; `FloatingSheetPanel` `md` 32 rem, non-modal | In panel footer when a record is open; else header bulk | Panel `WorkflowFooter` | 5 (panel = 1) |
| T5 Dashboard | Admin, director | full | Export is the only header action | none | 5 |

Shared: `PageFrame` + DS `PageHeader` (serif h1 18 to 20 px), max 3 visible header actions, overflow in `DropdownMenu` (`icon-sm` ghost, `aria-label="More actions"`), banners under the title zone, Skeleton in final shape, lab chrome only in the lab bar [01 L1 to L12]. Lab layout primitives: `components/lab/layout/` (`StickyFooter`, `WizardPage`, `FormPage`) [03 6].

### E3. DS component map [S04 5] [ds-usage-map] (verify every API with `node tools/ds/source.mjs <Component>`)

| Need | Component |
|---|---|
| Page title | `PageHeader` via `PageFrame` (`components/skills/page-header.tsx`) |
| Primary / secondary / row / icon-only | `Button` `default`+`sm` (header) or `default` (footer); `outline`+`sm`; `ghost`+`sm`; `icon-sm` + `aria-label`. Always explicit variant and size |
| State | `StatusBadge` via product `StatusPill` (tone success, info, warning, neutral; label + icon). Never `Badge` for a state |
| Metadata tag | `Badge variant="outline"` or `secondary` |
| Records 100+ | `DataTable` (`getRowId`, `emptyState` required, `selectable` only with bulk) |
| Matrices (heat-grid, lab grid, coverage) | DS `Table` primitives in a keyboard-reachable scroll region |
| KPIs | `KeyMetrics variant="flat"` (page strip) or `compact`; max 4; polarity per metric |
| Tabs with counts | `Tabs` + `TabsCountBadge`; a tab list counts as one control |
| Confirm | `Dialog` (title, description, footer) |
| Inspect without losing list | `FloatingSheetPanel` (non-modal) or `Sheet side="right"` `md`/`lg`; past `xl` promote to a route |
| Feedback | `LocalBanner` (error, success, warning, info). Never toast or Sonner |
| Wizard | `Wizard orientation="horizontal" variant="compact"`, 3 to 5 steps |
| Fields | `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `SelectionTileGrid` |
| Multi-select / combobox | Compose `Popover` + `Command` (DS has none) |
| Filters | `FilterBar` chips; `ViewSegmentedControl` for split or view |
| Export | `ExportDrawer` |
| Charts | Vendored `ChartCard` (`components/chart-card`), lab viz `components/lab/viz.tsx` + `viz-tokens.css` |
| Loading | `Skeleton` in final shape |
| Person | `Avatar` / `AvatarInitials size="sm"` (24 px floor) |

### E4. Tokens and colour semantics [S04 7] [visual-language 1]

| Meaning | Token / tone | Glyph + word |
|---|---|---|
| Counted, achieved, approved | `success` | circle-check "Counted" |
| In progress | `info` or neutral | half-circle "In progress" |
| Shortfall, did not meet, returned, conflict | **amber**: `--chart-5` for marks, `--status-badge-warning-*` for badges | triangle or diamond + word |
| Waiting, none | neutral | clock "Waiting for X" |
| Hard block only | `--destructive` via `LocalBanner variant="error"` | circle-xmark "Cannot publish: ..." |
| Brand | `--brand-color` on the one primary and selected nav; `--brand-tint` for selected row or tile | never good or bad |
| Active filter or toggle | `--muted` fill + `--border-control-3` + `--foreground` | neutral, not brand |

Never hex, rgb, raw oklch, `color-mix(in oklch`, `opacity-*` on text, `--border` as the only state cue. Never `--chart-1..5` for state except `--chart-5` amber marks. No red for student shortfall [MEM aarti_no_red].

### E5. Typography and spacing

Serif `--font-heading` for the page title (and the hero number in the lab); Inter elsewhere. Floor `--text-xs` 12 px; body `--text-sm` 14; evaluator and phone body 16. `uppercase tracking-wide` at most once per screen. Controls: toolbars 32 px (`--control-height-sm`), fields 40 px, touch 44 px. Table rows 48 px. Radius never overridden. Spacing `gap-2` / `gap-4` / `gap-6` / `gap-8`; PageFrame `py-5 px-4 md:px-6` [S07 3] [01 L5, L6].

### E6. Density budget per page type (1440 x 900 first viewport; shell and `[data-lab-chrome]` excluded) [S07 3] [01 3] [tests/lab/density-budget.mjs]

| Line | Dashboard | List | Wizard step | Form | Detail | Split | Evaluator | Student |
|---|---|---|---|---|---|---|---|---|
| Regions | 5 | 4 | 4 | 4 | 5 | 5 | 3 | 4 |
| Figures (hero incl.) | 4 | 0 with tabs, 3 without | 1 | 1 | 4 | 3 | 0 | 3 |
| Charts above fold | 3 (script, D-X21; docs say 2) | 0 | 1 | 1 | 1 | 0 | 0 | 1 |
| Controls above first chart or table | 8 | 6 | 7 fields | 7 | 6 | 8 | 4 | 4 |
| Prose words | 40 | 40 | 30 | 40 | 40 | 40 | 15 | 40 (25 phone) |
| Filled primary | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Saturated hues | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 3 |
| Repeated sentence or figure | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Counting rules: a tab list is one control; a grid of small tiles is one region (max 6 tiles); a modal counts alone; a non-modal panel counts with the page; an artifact preview counts as data only inside a labelled preview frame. When a line fails, cut or move; never shrink type or spacing; never silently raise a limit; ask Romit [S07 1.1].

### E7. Responsive and accessibility

| Area | Rule |
|---|---|
| Widths | Web-first: 1440 primary, 1280, 1024, complete 375. Evaluator form designed 375-first [LEDGER D-X2] |
| Page scroll | No horizontal page scroll at any width; tables and heat-grid scroll inside their own region |
| Charts | Switch to table version under 600 px |
| WCAG 2.1 AA | Text 4.5:1, non-text 3:1; focus visible and returned; no state by colour alone; chart = text summary + table + keyboard |
| Forms | Error summary links focus the field; `aria-describedby`; visible labels |
| Live regions | Scope change announces the new hero; banners `role="status"` or `alert` |
| FERPA | Evaluator link exposes only its request; comparisons hidden under n = 5 |
| Forced colours | State survives without fills (border or glyph) |

---

## F. Interaction and states [S03 5, 6, 8, 9]

| Pattern | Rule | Source |
|---|---|---|
| Offline first | Draft on device first; chip Queued / Synced / Conflict per entry; banner only when offline, failed or conflict; failed send keeps all input | [COMP rec 9] |
| Conflict | Keep mine / keep theirs / keep both, consequences stated | [S03 6] |
| Correction vs new attempt | Returned: revise the same record (revision +1, reason shown). Did not meet: a further attempt is a new record, original intact. The screen names which it is doing | [REQ RV-01..03] |
| Lock on sign-off | Counted and Awaiting approval have no edit control (absent, not disabled) and a plain statement why | [REQ RV-05] |
| Correction of a counted evaluation | "Request a correction": original evaluator gets a new link, version appended, old keeps counting until the new completes | [LEDGER D-X1] default, not Romit's own word |
| Reassign held evidence | A handoff, not a return: "Sent to {name} for a new evaluation" | [LEDGER D-X25] |
| Validation | On blur per field; cross-field on change (300 ms); full on continue. Primary stays enabled until the first failed attempt, then disabled with the reason in the footer | [S03 6] [01 L9] |
| Undo vs confirm | Undo for reversible low-impact config; confirm for anything that changes achievement (publish, return, deactivate, rule change); approve has an explicit button and a result banner | [S03 6] |
| Rule change after evidence | Preview before publish: state before, state after, students ("Achieved to In progress: 12") with "View students"; after publish, H11 cue | [REQ AE-02] |
| Bulk | Bulk configure, approve, map. Before confirm, list rows that cannot be acted on and why | [REQ IM-14, SL-10] |
| Modals vs panels | Dialog for a decision-sized irreversible act; non-modal panel to inspect without losing the list; route for anything that needs a URL (student record, review item, wizard) | [S04 5.4] |
| Keyboard | Visible focus; dialogs trap and return focus; Escape closes the top layer only; destructive dialogs default to safe; charts: Tab enters, arrows move, Enter drills | [S03 6] [S06 3.5] |
| Optimistic update | Only for library edits; never for anything that affects achievement | [S03 6] |
| Deactivate vs delete | Deactivate removes from mapping, selection and every report figure, evidence kept, reversible; delete only while nothing is tracked | [LEDGER D-X14, D-X15] |
| Nudges | In-product only (REQ 14), one digest per person per day, evaluator reminders off by default, thresholds 3 and 8 days are tenant data | [S03 7] |
| Freshness | As-of + Refresh; no silent auto-refresh; "New evidence since 09:40. Refresh to update." | [S06 F1, F2] |

---

## G. Data and charts [S05] [00-brief 8] [visual-language 2]

### G1. Question to chart

| Question | Form | Never |
|---|---|---|
| How far is this student? | Hero sentence + segmented dots per required skill (one dot per sign-off) or ring | Progress bar |
| Am I on pace? | Burn-up: cumulative counted vs expected line; waiting dashed | A "75%" tile |
| Who is behind, by how much? | Gap-axis dot strip: grey circles on track, amber diamonds behind, dashed "On pace" line, only behind labelled | Ranked bars of 123 students; pie |
| Who in the cohort, on what? | Heat-grid students x sections (aggregate grain, never 123 x 154 cells); 43 rows hold | Every cell rendered |
| Which skill blocks most? | Ranked dot plot of required skills, weakest first, top 5 to 12, ties stated | Treemap |
| How long are requests waiting? | Aging stacks 0 to 3, 4 to 7, 8 to 14, 15+ by site, top 8 + "other"; graded neutrals, amber outline on 15+ | A bar per site |
| Where does evidence drop off? | Funnel: sent, submitted, counted | |
| Attempted vs achieved | Scatter; or columns "Attempted by" and "Struggling" (exposure vs difficulty) [CALL 10-26 item 16] | |
| Student vs cohort by section | Radar only for groups of 5+ | Radar under n = 5 |
| Self vs evaluator | Side-by-side agreement view (Agreed / Differed / Not comparable) [REQ AR-02] | Three signals per row |
| Which evaluator returns a lot? | Dot plot vs population mean; positioned only at n >= 30; flag at 2x average with 5+ returns [LEDGER D-X18] | League table |
| Graduating cohort ready? | Readiness split (Complete / One short / Short / Far behind) with counts + blocker list | Gauge |
| What changes if I change this rule? | Before/after count pair + named student list | A chart for 2 numbers |
| Evaluator | No chart, no progress, no cohort context | Student progress on the evaluator page |

Hero pattern: `[number] [noun] of N` + one cause sentence + one link ("View the 12"); the chart below proves it; text never replaces the chart [MEM viz_first, pure_typography_loses_storytelling].

### G2. Honesty rules

Denominator on every share ("31 of 38"). Small-n suppression (radar, median n >= 5; evaluator compare n >= 30). Bars and strips start at 0; truncated line axes labelled and clipped. Counts are a floor, not proof of competence (never "competent"). Tags overlap, not a partition. "Sample data" chip on generated data. Impossible filters explained. Pace is a convention named in the hero ("behind the term clock"; basis switch Expected now / Peer median / All required) [LEDGER D-X10]. Sort order stated. Never rank people with 1, 2, 3.

### G3. Scale and grain

Aggregate first (cohort x section, about 123 x 10), drill second. 153 skills grouped by section, scroll inside the panel. Sites and evaluators search-first. First render under 300 ms on the full dataset.

### G4. Consistency invariant (one definition per figure)

| Rule | Detail |
|---|---|
| Single sources | `lib/v2/population.ts` (behind, required sets, graduation stage), `lib/v2/approvals.ts` (held causes, queue), `lib/v2/facts.ts` (the facts registry, `FACT_SOURCE` names where each fact comes from), `lib/v2/labels.ts` (every status word) |
| One function per number | Every screen reads the same selector; no per-component recomputation; no invented figure |
| Tests | I-1 student totals equal everywhere; I-2 status partition sums to total evidence; I-3 link list length equals the number; I-4 aging buckets sum to waiting; I-5 cohort totals; I-6 no NaN; I-7 table equals chart; I-8 student switch keeps numbers |
| Gate | `node tests/lab/consistency.mjs http://localhost:3017` compares hero "N of 123", Approvals badge vs queue vs dashboard, Maya's counts across screens |
| Units | Badge, KPI and worklist use one unit per concept (submissions or evaluations, labelled) |

---

## H. Product strategy and scope discipline

| Topic | Rule | Source |
|---|---|---|
| Phase 1 | Manual add, CI team bulk add ("Add several" C), configure, assign to cohort or custom group, course mapping overrides, student log and send, evaluator form, approvals | [CALL 10-26 items 6, 8] |
| Phase 2 | File import, AI reading, starting points: kept in the lab, labelled "Later", hidden in present mode | [CALL 10-26 item 6] |
| Two config dimensions | "Evaluation criteria" (approved or not; questions with a final result; independence level; Scored marked Proposed) and "How many times" (school-defined count, optionally per level). No platform default | [CALL 10-26 items 1, 2, 5] |
| Assignment order | Cohort or custom group first, per-course level second; clinical courses default ("Clinical only" chip, include didactic), a default pending Arthi | [CALL 10-26 items 8, 11] |
| Custom groups | A cross-system student-module feature; the lab only consumes groups as a filter and target | [CALL 10-26 C2] |
| Reporting | Deferred for Thursday client view; faculty-by-location heat map NOT added | [CALL 10-26 items 5, 17] |
| Remediation | Stays outside; no CTA unless advisement exists | [CALL 10-26 item 18] [REQ 14] |
| ODs | All `OD-01` to `OD-38` open (OD-03 states merge, OD-10 CSV vs Excel, OD-28 one list or two, OD-29 report as launch page, OD-33 sign-off chains ...). Build a seam, never a decision | [LEDGER 4] |
| PROPOSED labelling | Anything beyond REQ that we build (third requirement level, distinct evaluators rule, level thresholds, feedback-only outcome, QR, hand-over, photo of paper form, CLR 2.0, director verification) is marked Proposed in lab notes, never in product copy | [LEDGER D-X5, D-X6] |
| Delegated defaults | Ledger 3c (D-X1 to D-X26) are Claude's reversible defaults; say "delegated default" when relying on one | [LEDGER 3c] |
| v2 | Being replaced by the lab; `lib/v2` is the lasting data layer; no polish on `components/v2` | [LEDGER D-X24, D-X26] |

**Competitors (what to borrow, what to avoid)** [COMP]

| Lead with (rare for Prism) | Borrow | Avoid |
|---|---|---|
| One record across courses (CALIPSO only) | Elentra: rule-change impact, distinct assessors | Typhon: 72 h time lock, preceptor login |
| Why it did not count (SimCapture only) | Medtrics: batch approve, aging, per-evaluator backlog | Trajecsys: vendor-built competencies |
| Correction vs new attempt | Platinum Planner: unreachable-minimum warning on coverage | Heavy preceptor app (1.4 of 5 on iOS) |
| Progress view (the gap students feel most) | Portico: reason required on return | AI that decides; overclaiming readiness |

Market risk is mobile reliability, not the web screens: never lose an entry; evaluator path has no sign-in.

**Romit's explicit decisions (his words; everything else is a default or a proposal)**

| Decision | Where recorded |
|---|---|
| Nav must shrink; too much chrome | [LEDGER D-A] |
| "Items" is the wrong word | [LEDGER D-B] |
| Dots must connect per role (receiver-side cue) | [LEDGER D-C] |
| 100+ students, 100+ skills | [LEDGER D-D] |
| v2 is a reference, not final; being replaced by the lab | [LEDGER D-F, D-X24] |
| Third state "In progress"; one link per request; Approvals row always shown; student landing "My progress" | [LEDGER D-L1 to D-L4] |
| Staff landing is a Dashboard, not a Home | [glossary 3.2 note] [S06] |
| Cohort is a filter, not a default comparison | [S06 S2] |
| "Required is meant to be mandatory" | [LEDGER D-X12 why] |
| "I don't want any inconsistencies in data or visual" | [tests/lab/consistency.mjs header] |
| Left nav consistent across variants; variants and nav inside variants must match | [CALL 10-26 item 21] [lab-nav-crawl.mjs] |
| Dashboard was "extremely crowded"; follow UX laws | [S07 header] |
| Prototype is the visual layout to build, inside the DS shell | [README, 2026-10-08] |

---

## I. The variant process (run it for every design, screen, variant, improvement or review request)

| Step | Do | Output |
|---|---|---|
| 1 Consult | Read brief, glossary, ledger, the strategy doc for the area, `granola-2026-10-26-updates.md`, the vault note `Decisions/skills-checklist/decisions/2026-10-26-skills-checklist-design-brief-decisions.md`. Say which copy you used (repo, worktree, vault) | One line: "Consulted: ... Decisions that apply: D-L1, D-X12 ..." |
| 2 Frame | Name the job, the role, the receiver-side cue (previous role did X, next role sees Y), and the hard stops involved | 4 short lines |
| 3 Research | Mobbin MCP (`mcp__claude_ai_Mobbin__search_screens`, `search_flows`, `search_sections`): look at the images, cite each `mobbin_url`, say what it teaches and what not to copy. Competitive digest models. At least one analogy outside SaaS explained in plain words (order tracking, boarding pass, bank ledger, flight board, pull request). For high-creativity asks, go beyond Mobbin and shadcn [MEM creative_variants_beyond_mobbin_shadcn]. If no reference exists, say so before designing [MEM call_out_no_reference] | Reference table: source, url, lesson, do not copy |
| 4 Update first | If the ask changes something that exists, change the existing variants (list which, per letter). Add a new variant only when the question it tests is genuinely different. Check `lib/lab/screens.json` and `flows.json` before adding | "Changes A, B; no new variant because ..." |
| 5 Concepts | At least 3 STRUCTURALLY different concepts: different mental model and primary job, not skins. Each: ASCII wireframe at 1440 (375 for student and evaluator); regions in the first viewport counted against E6; exact DS components; what is deliberately NOT on the page; risks; the question it tests; then a recommendation with the reason. Cover every region with equal craft [MEM redesign_scope_covers_all_regions]; question whether each region is needed [MEM question_structural_redundancy] | Concept table + wireframes + recommendation |
| 6 Build | In the lab with real `@exxatdesignux/ui` components, on the E2 templates (`components/lab/layout/*`). Files: `admin/components/lab/screens/<persona>-<screen>-<letter>.tsx`, register in `lib/lab/screens.json` (question, file, pageType) and `components/lab/screens/index.ts`, place in `lib/lab/flows.json` sets. Links only via `lib/lab/links.ts`. Data only from `lib/v2/population.ts`, `approvals.ts`, `facts.ts`, `labels.ts`; no invented figure. `'use client'`, `aria-hidden` on FA icons, `aria-label` on icon-only buttons | Changed file list |
| 7 Gates | From `apps/skills-checklist/admin`: start dev with `npx next dev --port 3017` (webpack; never Turbopack; package.json `dev` is Turbopack on 3007, do not use it for gates). Run and paste literal output: `npx vitest run`; `npx tsc --noEmit`; `node scripts/lab-ds-gate.mjs --write` then `node scripts/lab-ds-gate.mjs`; `node scripts/lab-chrome-gate.mjs`; `node tests/lab/density-budget.mjs`; `node tests/lab/consistency.mjs http://localhost:3017`; `node scripts/lab-nav-crawl.mjs`; `node scripts/lab-axe.mjs 1440 <paths>`. Take Playwright screenshots at 1440 x 900 (375 x 812 for student and evaluator) and LOOK at them before claiming anything [MEM screenshot_before_placement_decisions] | Pasted outputs + screenshot paths |
| 8 Report | Per existing variant: what changed. New variants and why. Evidence block (J2). What was NOT verified. Open decisions touched and not decided. Your own critique and 2 to 5 further proposals [MEM proactive_design_proposals] | Report in plain text, tables over prose |
| 9 Record | Romit's new decisions go to `02-decisions-ledger.md` section 3b with date and his words. Durable knowledge goes to an atomic note in `~/Documents/research-repos` (schema: type, product, source, date, tags, title, summary, relevance, value, theme, status; filename `YYYY-MM-DD-slug.md`; add to the matching `MOCs/MOC-*.md`); write locally, never commit | Ledger row + vault path |

**Never:** commit, push, deploy, stash or reset. **Ask Romit only** for decisions that are genuinely his (scope, an OD, a PENDING-ROMIT, reversing his own decision), in plain chat text, never a menu or AskUserQuestion [MEM no_askuserquestion_tool]. Otherwise proceed on a documented default and flag it "delegated default". Lead with the acceptance test, not a trust question. Capitalise sentence starts.

**Concept table template (step 5)**

```
| Concept | Mental model | Primary job | First viewport (regions / budget) | DS components | Not on the page | Risk | Tests the question |
|---|---|---|---|---|---|---|---|
| 1 ... | "flight board" | find who is behind | header, scope, verdict, strip, worklist (5/5) | PageHeader, FilterBar, KeyMetrics flat, ChartCard | set-up backlog, history | hides skills view | "Can a coordinator name the 12 in 10 s?" |
```

---

## J. Review checklist (30 yes/no; any "no" blocks) and the evidence block

| # | Check | Traces to |
|---|---|---|
| 1 | Does the screen serve one named job for one role, stated in its variant question? | A1 [S05 P1] |
| 2 | Is no hard stop touched (A2), and is anything resting on an OD marked and seamed? | A2 [LEDGER 4] |
| 3 | Does it name what the previous role did and what the next role will see, within one click of landing? | A3 [LEDGER D-C] [S01 6.2] |
| 4 | Was it designed and tested on 123 students and 150+ skills (search, grouping, chips)? | A5 [LEDGER D-D] |
| 5 | Does the first viewport hold at most the budgeted regions for its page type? | E6 [S07 K1] |
| 6 | At most 4 figures (hero included), and no figure appears twice (badge, KPI, card, worklist)? | E6 [S07 K2] |
| 7 | Charts above the fold within budget, no number drawn twice? | E6 [S07 3] [LEDGER D-X21] |
| 8 | Controls above the first chart or table within budget, none disabled above the fold? | E6 B Hick [S07 5.4] |
| 9 | Prose under 40 words desktop, 25 phone, 15 evaluator, 30 wizard step? | D3 [S02 4.2] |
| 10 | Every sentence appears once (including Tip vs caption, subtitle vs banner, step label vs heading)? | D3 [S07 K4] [01 L11] |
| 11 | One colour, one meaning: only brand (primary, selected nav) and amber (shortfall) saturated? | E4 [S07 K3] |
| 12 | At most one highlight per region (or 20% of marks), ties stated in words? | B Von Restorff [S07 2] |
| 13 | Exactly one filled primary, at most 2 outline actions visible, no icons on text buttons? | E2 [01 L2 to L4] [MEM no_icons_action_buttons] |
| 14 | Everything secondary exactly one click away, never two? | B progressive disclosure [S07 K5] |
| 15 | Spacing: gap between groups at least 2x the gap inside; no card in a card; no dead block over 80 px? | E5 B Gestalt [S07 5.12, 5.13] |
| 16 | Status is glyph + word + tone from the D4 table, identical in aria-label and export? | D4 [S02 6] |
| 17 | No red for shortfall; hard block visibly distinct from a warning? | E4 [MEM aarti_no_red, severity_must_be_visually_distinct] |
| 18 | Copy: sentence case, no em dashes, no banned words (D2), no IDs or stakeholder names, noun from `{itemNoun}`? | D1, D2 [LEDGER D-B] |
| 19 | Every failed-rule message states the rule with numbers and a next step? | D5 [REQ SH-03] |
| 20 | Empty, loading, error, blocked and impossible states use the D5 formulas, with Skeleton in final shape? | D5 F [S03 8] |
| 21 | Every record name and count is a link built by `lib/lab/links.ts`, carrying the key, never changing role; no hard-coded variant letter? | C4, C11 [S01 L1 to L7] |
| 22 | Figure drill: the list length equals the number, same scope; Back restores scroll? | C5, C6 [S06 R1 to R3] |
| 23 | Same student shows the same counts on every screen; all figures come from the single sources? | G4 [ROMIT consistency] |
| 24 | Every chart answers a named question, has a legend, a text summary and a table fallback, no progress bar for attainment, denominators shown? | G1, G2 [MEM viz_first, progress_bars_last_resort] |
| 25 | Shell is right for the audience (evaluator: no sidebar, no switchers, no account language)? | E1 [REQ EV-01] |
| 26 | Layout matches its template (width, primary placement, sticky footer) and sets `data-page-type`? | E2 [01 5] |
| 27 | DS components only, each looked up with `node tools/ds/source.mjs`; no raw button or table, no hex, no toast? | E3 [workspace CLAUDE.md] |
| 28 | Accessible: focus visible and returned, keyboard reach, 4.5:1 text, 3:1 marks, 24 px targets (44 touch)? | E7 [S04 12] |
| 29 | Responsive at 1440, 1024, 375 with no horizontal page scroll? | E7 [S04 10] |
| 30 | Existing variants were updated before a new one was added, and the variant's sidebar matches the persona's other variants? | I step 4 [CALL 10-26 item 21] |

### J2. Evidence block (required before any "done")

```
Consulted: <files, which copy: repo / worktree / vault>
Changed: <paths>   Existing variants updated: <screen/letter: change>   New: <screen/letter: why>
vitest: <pasted summary line>      tsc: <pasted or "0 errors">
lab-ds-gate --write / plain: <pasted>   lab-chrome-gate: <pasted>
density-budget: <pasted PASS/FAIL line per variant>
consistency: <pasted>   nav-crawl: <pasted>   axe 1440: <pasted>
Screenshots looked at: <paths, widths>
Verdict: GREENLIGHT (static) | GREENLIGHT (runtime)  (runtime only with a fresh visual run)
NOT verified: <list>    Open decisions touched, not decided: <OD-n, PENDING-ROMIT items>
```

---

## K. Known drift between docs (flag, do not silently resolve)

| # | Conflict | Which wins today |
|---|---|---|
| K1 | Charts above the fold on a dashboard: brief and strategy 07 say 2; D-X21 and `density-budget.mjs` say 3 | The script (D-X21), a delegated default |
| K2 | Requirement level: strategy 02 6.5 says Mandatory / Non-mandatory and bans recommended/optional; the Oct 26 call and `labels.ts` use Mandatory / Recommended / Optional | Call, labelled PROPOSED against REQ CM-03 |
| K3 | Third record state: glossary and strategy 05 legend say "Not yet met" | D-L1 "In progress" |
| K4 | Student landing: glossary and strategy 01 say "Home"; strategy 06 says "Progress" | D-L4 "My progress" |
| K5 | Evaluator identity words: strategy 03 Verified / Unverified; 02 Adopted / Not yet recorded; `labels.ts` Adopted / Unverified; call adds cause "Evaluator not assigned" | `labels.ts` + call |
| K6 | Outlier flag: strategy 05 says 3x average; D-X18 says 2x, n >= 30, 5+ returns | D-X18 |
| K7 | Product `CLAUDE.md` digest item 8 still lists the D-L1 to D-L4 questions as PENDING | Ledger 3b (decided) |
| K8 | Product `CLAUDE.md` scaffold text says `theme-one`; strategy 04 says the app runs `theme-prism` | Strategy 04; verified `admin/app/layout.tsx:15` sets `theme-prism` |
| K9 | Director landing: strategy 01 "Verification"; strategy 06 "Dashboard" (proposal) | Open (director verification not in REQ) |
| K10 | Dev server: `package.json` `dev` is Turbopack on 3007; lab gates assume `npx next dev --port 3017` | Gates: 3017 webpack |
