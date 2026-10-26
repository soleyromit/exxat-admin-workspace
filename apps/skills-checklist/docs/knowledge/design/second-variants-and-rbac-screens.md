# Second variants and permission screens (Oct 26)

**Consulted:** `00-design-brief.md`, `glossary.md`, `02-decisions-ledger.md` (D-L2 one link per request, D-L3 Approvals row always shown), `strategy/01-information-architecture.md` (IA-3 role is a permission, 7.2 role chip), `strategy/07-ux-laws-and-density.md` (budgets). Tags as in the brief.
**Rule applied:** every screen has 2 or more structurally different variants (Romit 10-26). `tests/lab/registry.test.ts` now enforces 2+ on every screen (tier 1: 3 to 6, tier 2: exactly 2, tier 3: 2 or 3 once every screen has 2).

## 1. What was built

| Screen | Route | Variants | Single source of every figure |
|---|---|---|---|
| Evaluator, Submitted | `/lab/evaluator/submitted` | A receipt (existing), **B what happens next**, **C what the student sees** | `buildRequest` + `receipt` (lib/lab/evaluator.ts); `receiptSummary`, `STUDENT_SEES` appended |
| Evaluator, Expired or not for you | `/lab/evaluator/expired` | A one message (existing), **B ask to resend with request preview**, **C identify yourself (OD-18 seam)** | `buildRequest`; shared terminal states from components/lab/evaluator/status.tsx |
| Evaluator, Invitation email | `/lab/evaluator/invitation-email` | A email + plain text tabs (existing), **B inbox row (first 40 characters)**, **C one text per request + plain text** | `buildInvitation`; `inboxPreview`, `smsDrafts` appended |
| Admin, Approvals | `/lab/admin/approvals` | **A reviewer triage list reused + Approval rules sheet**, **B rules and queue** | `useReviewer` / `scopeRows` (same entries as the nav badge); `approvalRules` (lib/lab/rbac.ts) |
| Reviewer, Students | `/lab/reviewer/students` | **A table**, **B by cohort**, **C needs attention first** | `reviewerStudents` (lib/lab/reviewer.ts, appended): `populationRows` joined with `scopeRows` |
| Director, Attainment | `/lab/director/attainment` | **A matrix**, **B skills ranked** | `buildAttainment` (admin pieces) + `buildReadiness` (director dashboard) |

Role is a permission (strategy/01 IA-3): `lib/lab/rbac.ts` holds the permission sets (admin: approve, approval rules, configure, export, all programs; reviewer: approve; director: export, all programs [INFER for director, a v2 proposal, AUDIT T3]). Screens ask `can(role, perm)`. No "acting as" chip on any page: strategy/01 7.2 puts the role chip in the bar's role switch (the lab persona switcher already is that), so `SHOW_PAGE_ROLE_CHIP = false`, pinned by a test.

## 2. Layouts, DS per region, question, density

Density counts are first viewport, from the screenshots (1440 for staff; 375 for evaluator, rendered in a 375 px iframe because the Chrome window would not resize below 1384). Lab chrome (variant bar, lab state select, DS panel) excluded.

### Evaluator, Submitted (budget: 3 regions, 15 words)

```
B  what happens next                 C  thanks + student view
+-------------------------------+    +-------------------------------+
| Harbor University BSN   lock  |    | Harbor University BSN   lock  |
| Signed off. They count now.   |    | (check)                       |
| Maya Ferreira · NURS 350      |    | Thank you, J. Delgado         |
| +-What happens next---------+ |    | 2 skills signed off for Maya. |
| | (v) You signed off 2      | |    | +-What Maya sees------------+ |
| | (v) 2 skills counted now  | |    | | Indwelling ...  [Counted] | |
| |     Indwelling ... Met    | |    | | Oral med ...    [Counted] | |
| | (v) It shows in Maya's ...| |    | +---------------------------+ |
| +---------------------------+ |    | [Print a copy]                |
| It cannot be changed here.    |    +-------------------------------+
+-------------------------------+
```

| | Regions | Prose words (not data) | DS per region | Question |
|---|---|---|---|---|
| B | 3 (light header, title, steps card) | 6 ("It cannot be changed from here.") | EvaluatorFrame; PageHeader; Card + CardHeader/CardTitle, ordered list | Does a sequence explain "waits for approval" better than a badge? |
| C | 3 (light header, thanks, student view card) | 7 | EvaluatorFrame; PageHeader; Card + StatusBadge (Counted neutral, Awaiting approval amber); Button outline sm | Does the student's word for each skill connect the handoff (D-C)? |

States (via `?state=`): submitted, offline (queued on this phone), unverified (program may confirm details); `?hold=1` previews the approval hold. No next-request button (one link per request, D-L2).

### Evaluator, Expired (budget: 3 regions, 15 words)

| | Layout | Regions | Prose | DS | Question |
|---|---|---|---|---|---|
| B | Title "Ask Maya to resend", subtitle, card: "Link expired" StatusBadge, facts (student, course, how many skills, sent), full-width "Email Maya" | 3 | 4 | PageHeader, Card, StatusBadge, dl, Button default (touch height) | Does a preview of which request lapsed let the evaluator act without guessing? |
| C | Lab-chrome "Open decision" note, title, card with email Input + "Send a new link", neutral confirmation ("If the address matches, a new link is on its way."), "Not you? Tell Maya" | 3 | 9 | PageHeader, Card, Label, Input, Button, Badge (lab chrome only) | Would an address check with a neutral answer recover a lapsed link without exposing who was asked? |

Forwarded, not for you and already completed reuse A's components unchanged in B and C, so none of them shows request content to a possible wrong person. The expiry date is not stated in B (OD-18 open; A's sample date sits after the demo day, see section 5).

### Evaluator, Invitation email (content only, delivery out of scope REQ 14)

| | Layout | DS | Question |
|---|---|---|---|
| B | "Inbox row" card: one-request row and every-open-request row, characters after 40 greyed; then the opened email as compact rows, one "Open" button per request (aria-label names the student) | PageHeader, Card, Badge, Button outline (touch height) | Do the first 40 characters tell who and how many before opening? |
| C | One text message per request (bubble, character count of 160, "1 message" or amber "2 messages"), then the plain text email | PageHeader, Card, StatusBadge | Is one 160 character text per request enough to start the form? |

Measured: subject "Maya Ferreira asks you to sign off 2 skills" shows "Maya Ferreira asks you to sign off 2 ski" in 40; texts are 117 and 124 characters.

### Admin, Approvals (list budget: 4 regions)

```
A  reviewer triage reused                       B  rules and queue
Approvals                    [Approval rules]   Approvals
[scope bar]                                     [scope bar]
35 wait · oldest 60 days · median 11 · 24 aging 35 wait · oldest 60 days · median 11 · 24 aging
[ reviewer DataTable, unchanged ]               Held by a rule · 12 submissions
   rules open in a FloatingSheetPanel           [ DataTable: skill | approval | holds now | students | oldest | Change rule ]
                                                23 more wait for other reasons: new evaluator name 19, ... Open the triage list
```

| | Regions | Figures | DS | Question |
|---|---|---|---|---|
| A | 4 (header, scope, summary, table) | 3 (summary line) | ReviewerApprovalsA unchanged; Button outline sm; FloatingSheetPanel + DataTable (compact rules) | Is the reviewer's queue plus one rules button enough for an admin who also approves? |
| B | 4 (header, scope, summary, rules table) | 3 | ApprovalsFrame (header, ScopeBar, states); SummaryLine; DataTable; StatusBadge (Asks for approval / Not set); Button ghost "Change rule" (admin only, links to configure) | Does seeing the rule behind the queue help an admin change a rule rather than clear the backlog? |

Totals agree: 12 held by a rule + 23 other reasons = 35 = nav badge = reviewer queue.

### Reviewer, Students (list budget: 4 regions)

| | Layout | Regions | DS | Question |
|---|---|---|---|---|
| A | Search, Tabs with counts (All 123, Waiting for you 31, Behind 28, On track 95), DataTable: PersonIdentityCell, cohort, required achieved, status (glyph + word, plus Behind when both), detail line, pinned Review or Open record | 4 (header, scope, toolbar, table) | ScopeBar, InputGroup, Tabs, DataTable, PersonIdentityCell, Button | Is one sortable table with an attention filter the fastest way to find who needs the reviewer? |
| B | One Card per cohort (ABSN 2027 14, BSN 2026 38, BSN 2027 29, BSN 2028 42): waiting / behind / on track counts (linked to A filtered), top 5 needing attention, "All n" | 4 (header, scope, toolbar, cohort grid) | Card, PersonIdentityCell, Button | Does grouping by cohort make the work feel smaller and show which cohort is slipping? |
| C | Worklist: Waiting 8+ days (21), Waiting for approval, Behind with nothing waiting (16), "Nothing needs you" collapsed; 20 per group then "Show all n" | 4 (header, scope, toolbar, worklist) | Collapsible, PersonIdentityCell, Button | Does reading top to bottom, oldest first, replace sorting and filtering? |

Consistency: Behind 28 = dashboard `facts.behind`; On track 95 = 123 - 28; Waiting for you 31 students hold the 35 queue entries. Filters overlap on purpose (a behind student with a submission waiting is in both), so no count disagrees with another screen. Status uses glyphs, not filled chips, so 21 aging rows do not turn the table amber (same reason Approvals uses AgeText). States: loading, `?state=error` with retry, empty scope with one Remove per filter, no search match with Clear search.

### Director, Attainment (list budget: 4 regions)

| | Layout | Regions | DS | Question |
|---|---|---|---|---|
| A | DirectorPage header (Export only), scope bar with the graduating cohort preselected, readiness line "BSN 2026 ready to graduate, every required skill · 38 students · 31 complete · 4 one skill short · 3 far behind" (each a link to the director list), then "Required in Fall 2026, students by section" StudentMatrix | 4 | PageHeader action Export; ScopeBar; StudentMatrix; EvidencePeek (FloatingSheetPanel); ExportPanel | Does the matrix show where the graduating cohort is short at a glance? |
| B | Same header and readiness line, then SkillsTable ranked most not achieved first | 4 | SkillsTable (DataTable) | Does ranking skills tell the director what to raise faster? |

No configure links exist in the admin attainment pieces, so nothing is hidden; nothing is added either.

## 3. Mobbin references (looked at)

| Reference | What it shows | Used for |
|---|---|---|
| [Ro, what's next after submit](https://mobbin.com/screens/d3182fbb-9ba1-4882-a4a1-9abf5ffb99fc) | Submitted, then a vertical timeline of next steps with timing | Submitted B |
| [Neo Financial, request under review](https://mobbin.com/screens/c9735eb3-ed10-42be-a213-6050b1cde3df) | Calm terminal page, one sentence, one action | Submitted C tone, Expired A |
| [Givingli, submitted with case number](https://mobbin.com/screens/d50cc2bc-dd27-4493-bb4a-a60f8345d618) | Receipt facts under a confirmation | Expired B facts list |
| [Descript, check your email card](https://mobbin.com/screens/d15d7c44-8cf3-46fc-a975-a5c1f6d544ba) | Small centred card, resend action | Expired B card |
| [Threads, trouble logging in](https://mobbin.com/screens/03814870-57fe-4d78-956b-9aa68f77ca24) | Identify by address, neutral "if an account exists" answer | Expired C seam |
| [Klaviyo, publishing rules](https://mobbin.com/screens/9535efca-4dff-49ce-9e56-bba1947b0c97) | Manual approval rules as settings | Admin Approvals B rules |
| [Toggl Track, approvals settings](https://mobbin.com/screens/181ba688-c116-4922-8e3c-2686fab3342b) | Approvals with a settings sub-page as a table | Admin Approvals A rules sheet |
| [Klaviyo, profiles with counts above the table](https://mobbin.com/screens/c4006505-8637-4785-922e-d78471727183) | Counts that act as filters above a people table | Reviewer Students A tabs |
| [Calendly, contacts with filter chips](https://mobbin.com/screens/092046e2-5304-49ba-b285-f4e3b428cdcc) | Search plus saved views over a people table | Reviewer Students A toolbar |

## 4. DS used and missing

Used: PageHeader, Card, Button, Badge, StatusBadge, Input, Label, Skeleton, Tabs, DataTable, PersonIdentityCell, InputGroup, Collapsible, LocalBanner, FloatingSheetPanel, ScopeBar (lab composite on DS Select and Popover). Gate: all 13 new variants PASS.
Missing in the DS: a vertical step list (Submitted B uses an ordered list on tokens); a page-header action slot on the reused ApprovalsFrame (Admin A places its one action with `HeaderActionSlot`, an absolute slot in the header row; the clean fix is an `actionItems` prop on ApprovalsFrame, owned by the reviewer worker).

## 5. Open issues found (not decided here)

1. **Data: rule holds sit on skills without the approval setting.** In the seed, the 12 "Rule needs approval" entries cover skills whose `config.approvalRequired` is false, and the 6 skills that ask for approval hold nothing. Admin Approvals B shows this honestly ("Not set" next to a held count). Fix belongs in the data layer (lib/v2 seed or `heldReason`), not in the screen.
2. **Director: two bases side by side.** Readiness counts every skill required to graduate (31 of 38 complete); the attainment view counts skills required this term (BSN 2026 has 3 in Fall 2026, all achieved). Both are labelled, but a graduation basis for `buildAttainment` would remove the tension. Romit to choose.
3. **Expiry sample date** in Expired A ("Expired Nov 9") is after the demo day (Oct 26). B avoids the date; OD-18 stays open.
4. **Lab chrome overflows at 375** (persona switcher in the light frame's top bar), not the screens.
