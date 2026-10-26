# Reviewer: Approvals, Review item, Student record (design lab)

**Persona:** L. Haddad, reviewer and clinical coordinator (`rev-haddad`). **Data:** scaled seed (123 students, 178 skills, 8,879 evaluations), read only through `lib/v2` selectors (`queueItems`, `compareEvaluation`, `approveItems`, `returnItem`, `skillProgress`, `studentHistory`) and `lib/v2/evidence-index.ts`. Decisions are a session overlay (`components/lab/reviewer/use-reviewer.ts`), never written to the v2 store.
**Consulted:** `00-design-brief.md`, `glossary.md`, `02-decisions-ledger.md`, strategy 03 (reviewer journey, H4 to H6, D1), 06 (5.3 queue dashboard, S1 to S8 scope, 4.3 states), 07 (list and detail budgets), `ds-usage-map.md`, `docs/v2/audit/T3-evaluator-review-director.md`, REQ AR-01..06, RV-01..06, SC-15, EV-04, AE-04, build prompt section 7 `aprqueue`, J3, J7, N-09, competitive digest (ACEMAPP status model, Medtrics approval hub, Portico reason-on-reject).

## 1. What the reviewer needs (and what v2 lost)

| Need | Source | v2 today | Lab answer |
|---|---|---|---|
| Know why each submission is held | [AUDIT T3 P1-3] [BUILD-PROMPT aprqueue] [strategy/03 H4] | Status says "Ready to approve" (readiness, not cause) | "Why held" on every row: New evaluator name, Rule needs approval, Self and evaluator disagree, Paper form to enter |
| Self versus evaluator side by side | [REQ AR-02, AR-03, EV-04] | Present, but question rows render twice | One table per skill, Agrees or Differs in words, no repeat |
| Decide fast at 30+ submissions | [COMP Medtrics batch approve] [strategy/03 bulk] | Bulk approve with blockers | Bulk only for like rows; blockers named before confirm |
| Say what approval does | [strategy/03 "This makes 2 of 3"] | Missing | Rule check from the engine: "becomes achieved: 1 of 1", or "moves to 1 of 3. Still needed: 2 more successful evaluations" |
| Return with a reason; correction to a different evaluator | [REQ AR-05, RV-01..04] | Return goes back to the same evaluator only | Return dialog: Correction same evaluator / Correction different evaluator (choose) / New attempt; note required |
| Adopt or merge an unverified name | [REQ SL-09, ST-09] [BUILD-PROMPT J7] [LEDGER Q9] | Absent | Decision seam: Adopt as new, or Merge with an existing evaluator (same site first) |
| No edit of counted evidence | [REQ RV-03, RV-05] [strategy/03 D1] | "Reopen to edit" | "Request a correction" on the record: the evaluation stays, a corrected version is asked for |
| 4 KPI cards repeating tab counts, 11 columns, constant Course | [AUDIT T3, T4 P2-7] | Present | No KPI strip: one summary line (3 figures). Six columns; course and setting are a sub-line under the skill |

## 2. Lab rules that are inferences (flag to Romit)

- **Unverified evaluator evidence is held.** The ledger says an unverified evaluator means "Awaiting approval decision" and adoption is the reviewer's decision. The v2 seed stores that evidence (45 evaluations from 14 names) as counted. `labState()` reads it as held, so the queue, the review item and the student record agree. [INFER on the seed; LEDGER on the rule]
- **"Rule needs approval" fallback.** v2 only sets awaiting approval through the SC-15 hold (`lib/v2/preceptor.ts:240`), but the seed's skill configs do not carry `approvalRequired`. A held evaluation with no other cause is labelled "Rule needs approval". [INFER]
- **Term on a queue.** The term filters by when the submission reached the queue. Older work is never hidden silently: a line under the queue says "26 more submissions wait from earlier terms. Show Summer 2026" (seed, default scope). [INFER: S8 says Approvals honours term]
- **Median wait, not turnaround.** No approval is recorded in the seed, so "Median wait" is measured on what is waiting; the Tip says so. [COMP Medtrics median turnaround; do not invent metrics]
- **Request a correction keeps counting** until the corrected version returns [strategy/03 D1, INFER].

## 3. Screens and variants (each tests one question, in `lib/lab/screens.json`)

### Approvals (reviewer landing, tier 1; list page budget)

```
| Approvals                                                                       |
| [Term v][Cohort v][Course v][More filters v]          As of 09:40 [r] [Sample] |   scope bar (term, cohort, group, course; S8)
| 38 submissions wait   Oldest 60 days   Median wait 10 days (i)   * 24 aging 8+  |   thin summary, 3 figures
| (A) table / (B) list + rail / (C) four reason columns                           |
```

| Variant | Mental model | Layout | DS per region | Tests |
|---|---|---|---|---|
| A Triage list (recommended) | Inbox, oldest first | Summary line; DataTable: Student (PersonIdentityCell, links to record), Skill (links to the submission; course and setting sub-line), Waiting, Why held (StatusBadge), Evaluator, Decide (pinned: Approve + Return for like rows, Adopt or merge for new names, Review otherwise). Bulk bar: "Approve n" only when the selection is alike | PageHeader via PageFrame, Select/Popover/FilterBar (scope bar), DataTable + bulkActionsSlot, StatusBadge, Button sm, Dialog (bulk confirm with blockers), LocalBanner | Does one ranked table with a Why held column and inline approve clear the queue fastest? |
| B Split view | Mail client, keep your place | Narrow DataTable (student and skill, why held, waiting) with `openRowId`; FloatingSheetPanel (md) with toolbar previous/next, why held, rule check, compare tables, feedback, facts, decision bar in the footer. A decision moves the rail to the next submission; the page reserves the rail width so nothing sits under it | DataTable, FloatingSheetPanel + Toolbar/Header/Body/Footer, Table primitives (compare), Separator | Does keeping the queue beside the open submission help a reviewer through 30 decisions? |
| C By-reason board | Sort by kind of decision | No summary line (the column counts are the counts, strategy/07 K2). Four Card columns: New evaluator name, Rule needs approval, Self and evaluator disagree, Aging 8+ days; count in each header; five cards each plus "All n"; the column's one action (Approve n like these / Adopt or merge / open one by one) | Card + CardHeader/CardAction, StatusBadge, Button, Dialog | Does grouping by why it is held let a reviewer batch the same kind of decision? |

### Review item (tier 1; detail budget). `?item=` is the submission (one link per request)

| Variant | Mental model | Layout | Tests |
|---|---|---|---|
| A Side-by-side compare (recommended) | Pull request: claim next to observation | Decision band (why held + one decision bar) on top; compare table per skill with Agrees or Differs; side Card "If you approve" with rule check and AR-01 facts | Does self versus evaluator, marked where they differ, make the decision obvious? |
| B Evidence timeline | Stripe payment timeline | Story oldest first (asked for sign-off, returns, signed, versions, waiting for you with the cause); "Your decision" card with rule check; answers on the right; facts behind a disclosure | Does reading the submission as a story make the decision safer? |
| C Decision first | Verdict card | Card: why held, the rule in numbers ("1 of 1 after approval, approving makes Sputum achieved"), the agreement word, decision bar; Answers (open when they differ), How it got here, Course setting location all collapsed | Does leading with what approval does decide faster? |

### Student record (tier 2). `?student=`, scope carried in links

| Variant | Layout | Tests |
|---|---|---|
| A Tabs (recommended) | One summary sentence (achieved, in progress, n awaiting approval as a link to Approvals); Tabs with TabsCountBadge: Evaluations (DataTable: skill, date, status glyph+word, evaluator, setting, Review or Request a correction), Skills (DataTable: four states), Verification placeholder | Do tabs with counts answer what this student has in one click? |
| B One page | "Awaiting your approval (n)" list first (each a link to its submission), then skills DataTable; a skill opens its evaluations in a FloatingSheetPanel | Does held first, skills second, history on demand beat tabs? |

## 4. States (all variants)

| State | How to see it | Pattern |
|---|---|---|
| Loading | `?state=loading` | Skeleton in the final shape; scope bar live |
| All clear | `?state=clear` | Calm Card: "All clear. Nothing waits for you in Fall 2026." No confetti |
| Filtered empty | Course `NUR 130` (no submissions) | Info LocalBanner names the count outside the scope, one Remove button per filter |
| No skill needs approval (row stays in nav, ledger D-L3) | `?state=norule` | Calm Card: "No skills ask for approval. Evidence counts as soon as an evaluator signs..." |
| Error with retry | `?state=error` (A) | Warning LocalBanner on the table only: what failed, what is kept, Try again |
| Stale | `?state=stale` | Scope bar shows the amber "Figures from yesterday" StatusBadge with Refresh |
| Bulk partial failure | `?state=partial` (A), select 2+ like rows, Approve | Confirm names "B. Khalil approved it a moment ago"; result banner "Approved 1 of 2" lists who stayed |
| Earlier-term work | default scope | One line with a link to the earlier term |
| Decision feedback | any decision | Brand-tint (promo) LocalBanner, polite live region, dismissible; never a toast |
| No longer waiting | open a decided `?item=` | Card with Next submission and Back to Approvals |

## 5. Palette and density

- Hold reasons are neutral StatusBadges with distinct glyphs (cause, not judgement). Amber appears only for aging 8+ days (a clock glyph beside the number in lists, a chip once on a detail page) and for Unmet or "Evidence does not qualify". No red, no blue. Brand only on the primary Approve and selected nav.
- Measured budgets are in the worker report (section "Counts"), from the 1440 x 900 screenshots.

## 6. Mobbin references (viewed 2026-10-26)

| App | Screen | What it teaches | Used in |
|---|---|---|---|
| Toggl Track | [Approvals with status tabs](https://mobbin.com/screens/501c9ea1-ae92-497d-8157-db174d744524) | Approvals as a plain list with status tabs and a filter row; no KPI cards | A |
| StackAI | [Pull request approvals, inline approve popover](https://mobbin.com/screens/296385ae-3e45-4038-ae58-0305878b73d3) | Inline approve on the row with a one-line consequence before confirm | A inline Approve |
| AirOps | [Bulk accept or decline with per-row actions](https://mobbin.com/screens/88aed5b3-f244-49e5-94c6-a8b8df2790be) | Per-row accept plus Accept all, with the reasoning in a column | A Why held, C Approve n like these |
| Shopify | [Bill Pay bulk selection bar](https://mobbin.com/screens/2b2c6bc8-1991-4cce-8a70-cc056d32facc) | Floating bulk bar with only the actions that fit the selection; inline "Enter missing details" flags | A bulk slot, paper form block |
| Workable | [Inbox with inline time-off approval](https://mobbin.com/screens/206a61d4-bf58-4bca-b9b6-8226d88ffc66) | Expanding one request in place with Approve and Reject; type of request as the row lead | B and A |
| Front | [Shared inbox list and detail](https://mobbin.com/screens/f8d50b8f-91bc-4da5-a4de-c18747647721) | List stays left while the open conversation fills the right; position kept between decisions | B |
| Linear | [Project list with right side panel](https://mobbin.com/screens/fb06f720-0dcd-423f-bba9-83b54701bc4c) | A quiet list with a right panel that does not navigate away | B, record B |
| GitHub | [Files changed with Finish your review](https://mobbin.com/screens/e5b970ca-4207-466c-9cb8-b5d45fd8779f) | Claim versus change, then one review decision with a required comment | Review item A, return note |
| Stripe | [Payment timeline and details column](https://mobbin.com/screens/ebf7e9fe-326a-4459-ae16-f94aea16f56b) | Timeline of what happened next to a details column | Review item B |
| Deputy | [Request leave approve or decline with comment](https://mobbin.com/screens/4060eb3a-fb01-4b17-976e-dca0af92843c) | The balance before and after the request next to the decision | Review item C rule check |
| Square | [Projects board by stage](https://mobbin.com/screens/9aa8d94b-13fc-4f58-b802-2699c02c8cbb) | Column per state with light cards and a last-activity line | Approvals C |

## 7. DS gaps found

- No DS empty state: calm states compose `Card` and text.
- Sidebar badge count comes from `approvalsBadge` (v2, 19) while the lab queue counts 38 because it also holds unverified-evaluator evidence; the badge belongs to shared lab chrome (`components/lab/lab-frame.tsx`), not changed here.
- `DataTable` has no "scroll the open row into view" for `openRowId`; in B a deep link to row 24 opens the rail but the list does not scroll to it.
