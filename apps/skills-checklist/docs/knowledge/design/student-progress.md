# Student screens in the design lab: My progress, Skill detail, My requests, Fix a submission

**Written:** 2026-10-26. **Persona:** Maya Ferreira (`stu-maya`, BSN 2027, Group A) inside the 123-student, 178-skill seed. Any student opens with `?student=<id>`; `stu-g-067` has 4 returned submissions and shows the correction path on real data.
**Consulted:** `../00-design-brief.md`, `../glossary.md`, `../02-decisions-ledger.md` (D-L1 "In progress (2 of 4)", D-L2 one link per request, D-L4 "My progress"), `../strategy/07-ux-laws-and-density.md` (student budget), `../strategy/06-dashboard-patterns.md` (in spirit), `../../v2/audit/T2-student.md`, REQ ST, SH, SC-13..15, RV, AE-04, build prompt section 7 (stuhub, stuoverview, sturadar, stuplace, stuitem, sturequests, stufix, stutarget) and section 10 (N-01, N-03, N-04, N-05), `../01-competitive-digest.md`.
**Code:** model `admin/lib/lab/student.ts` (pure, read only, v2 selectors and `lib/v2/evidence-index.ts`); shared pieces `admin/components/lab/student/*`; screens `admin/components/lab/screens/student-*.tsx`; tests `admin/tests/lab/student.test.ts`.

## 1. What the data says about Maya (so nothing is invented)

| Fact | Value | Source |
|---|---|---|
| Required this term | 5 skills (mandatory, configured, published, on her cohort's Fall 2026 offerings) | same `populationRows` the staff dashboard uses, so the counts match [BUILD-PROMPT 8.9] |
| Achieved | 2 of 5; 2 in progress; 1 "Evidence does not qualify" (Sterile dressing change, Not yet from J. Delgado on Oct 17) | `skillProgress` |
| Whole list | 94 skills: required, optional on a current course, or with evidence; 24 sections | mappings + evidence index |
| Waiting | 2 (one request with J. Delgado holding 2 skills, sent today; one evaluation awaiting approval) | submissions + evaluations |
| Returned | 0 (use `?student=stu-g-067` for the returned path) | submissions |
| Pace | 7 of 13 required evaluations counted; the term clock expects 7 (week 9 of 16): on pace | dashboard pace rule |
| Placements | Harbor General 4 West (Inpatient) and Harbor Outpatient Clinic, NURS 350; end with the term on Dec 11 [INFER: placements carry no dates]; 2 likely skills not started | placements + mappings |
| Cohort radar | 29 students with required skills in her cohort, so n >= 5 and the radar shows | `SMALL_NUMBERS` |

## 2. Design bar applied

Compact DS controls (`size="sm"`, 32 px), at most one toolbar row (only variant B has one control), data first, neutral ink with the soft brand tint (radar fill only), one amber accent for shortfall (`viz-tokens.css`: diamond, triangle, wash), no red, no saturated blue. The Prism brand pink was tried for achieved marks and replaced with neutral foreground because it read as a second accent. Status is glyph + word + colour everywhere: check circle "Achieved", half circle "In progress (2 of 3)", amber triangle "Evidence does not qualify", empty circle "No evidence yet". Waiting and Returned are overlays (StatusBadge), never states. Every number is a link; every "did not count" names the failed rule in numbers and the next step ("The evaluator answered Not yet. Needs 3 Met evaluations; you have 0. Make a further attempt...").

## 3. My progress (Tier 1, three structurally different variants)

| | A: next actions first (recommended) | B: my requirements map | C: timeline and pace |
|---|---|---|---|
| Tests | Does a short list of what to do now under a thin verdict get a student to the next sign-off fastest? | Does the whole list as a sections by skills mosaic, with a radar against the cohort median, show where a student stands better than a to-do list? | Does a pace line against the term clock, the placement end and what each course expects now help a student plan better? |
| Mental model | Duolingo-like "what next" (competitive digest) | OASIS red-to-green requirement checklist; build prompt stuoverview + sturadar | Fisdap-style goal tracking; build prompt stuplace + stutarget |
| Regions at 1440 | header (sync chip, Send for evaluation) · hero card (required ring, Waiting, Returned, pace verdict, placement line) · Do this next · Required list | header · summary line (3 figures as links + view switch) · mosaic card · "You and your cohort" radar card | header · pace card (headline figure, chart) · placements card · "What each course expects now" table |
| DS per region | PageHeader (via PageFrame), StatusBadge, Button sm; Card + RequiredRing (lab SVG on tokens) + links; Card + Button outline sm; Card + Tip + StatusBadge + Button ghost sm | PageHeader; links + ViewSegmentedControl; Card + Tip on each cell + Collapsible "Show as table" + Table; Card + SVG radar + Table fallback | PageHeader; Card + SVG pace + Collapsible + Table; Card + links; Card + Table |
| 375 | stacks: hero, next, list; rows become 2-line cards | summary wraps, switch under it; mosaic label column narrows to 9 rem | chart full width, placements, then the course table with the optional column hidden |

Next actions, in order: N-05 returned (amber), did not count (amber), sync conflict (amber), N-01 one away (counted >= need minus 1), N-03 placement ending (within 21 days [INFER]; Maya's is 46 days away so it does not fire, the hero placement line carries it), N-04 waiting 3+ days. Each row has numbers and one outline action; the page keeps one filled action.

## 4. Skill detail (Tier 2)

| | A: rule first (recommended) | B: attempt ledger |
|---|---|---|
| Tests | Does the rule as one sentence with parts as fractions above a timeline that says why each attempt counted answer "what is left and why"? | Does a table with Result and Why columns let a student audit what counted faster? |
| Regions | back link + header (state-driven primary: Send for evaluation, Make a further attempt, View request, Fix and send, or none when achieved) · rule card (state, overlay, rule sentence, parts "Evaluations 2 of 3 · Different evaluators 1 of 2 · Inpatient 0 of 1", why it did not count) · attempts timeline · where it counts | header · state and parts line · ledger table · side card (why it did not count, the rule, where it counts) |
| DS | PageHeader, Card, StatusBadge, Button sm | PageHeader, Table, Card, StatusBadge |

Parts come from `partsOf`: "Different evaluators" appears only when the rule asks for more than one; each named setting minimum appears as its own fraction (lab never satisfies it, REQ SC-12).

## 5. My requests (Tier 2)

| | A: by evaluator (recommended) | B: by status |
|---|---|---|
| Tests | Does grouping under the person who holds them make it obvious who to remind and what to fix? | Do three tabs with counts, each a table grouped by evaluator, clear open work faster? |
| Regions | header · no-login note (said once) · waiting and returned cards per evaluator · done card (5 evaluators, then "Show all n") | header · no-login note · Tabs (Waiting, Returned, Done with TabsCountBadge) · Table |
| Per request | skills (links), status with age ("Waiting 4 days"; amber diamond at 3+ days, N-04), link state ("Link open since Oct 26", "Link closed until you send the correction", "Paper form, no link"), revision, return reason, Fix and send | same, as columns |

## 6. Fix a returned or did-not-qualify submission (Tier 2)

The screen names its path before the student acts [brief section 7]:
- **Correction** (returned): "Correction, revision 2 of the same submission. The return reason and earlier revisions stay in your record." Defaults to the same evaluator; "Someone else you have worked with" is allowed [REQ RV-02, RV-04]. "What you changed" is required.
- **Further attempt** (did not qualify): "Further attempt 2, a new submission. Attempt 1 stays as it is." [REQ RV-03]. Note optional.

| | A: guided column (recommended) | B: before and after |
|---|---|---|
| Tests | Does reason, then what to change, then send, with the path named first, get it right in one pass? | Does seeing what the reviewer or evaluator saw beside the new draft prevent a second return? |
| Regions | back link + header · reason (amber block) and path line · form card (What to change checkboxes, Send to radio + Select sm, note, Send) | header · path line · "What the reviewer saw" read-only card · "Your correction, revision n" form card |
| DS | PageHeader, Card, Checkbox, RadioGroup, Select (sm), Textarea, Field, FieldError, LocalBanner (outcome), Button | same |

Sending is local (the lab never writes the shared store); the outcome is one LocalBanner sentence that says what happens next ("Sent to O. Eze, RN as revision 1. Their email holds a new link for this request. It counts after they answer Met."). Offline: "Kept on this device. It goes to ... when you reconnect."

## 7. States (every student screen, `?state=`)

`loading` final-shape Skeleton · `empty` "No skills mapped to your courses yet" with Send for evaluation · `done` every required skill achieved (demo transform, labelled in the URL only) · `offline` info LocalBanner "You are offline. New entries stay on this device..." and the sync chip shows queued · `error` error LocalBanner with Try again ("Nothing you logged is lost"). The header sync chip always shows one of: amber "1 conflict" (links to Offline and sync), "n queued", "Synced".

## 7b. Density, measured (Playwright, first viewport, strategy/07 counting rules; lab chrome excluded)

Student budget: 4 regions, 3 figures, 1 chart, 4 controls above the first chart or table, 40 words desktop and 25 phone, 1 filled action. Raw word counts include data values (state labels such as "In progress (2 of 3)", table cells); prose only is given after the slash.

| Screen | Regions | Figures | Charts | Controls | Words 1440 (raw / prose) | Words 375 | Filled |
|---|---|---|---|---|---|---|---|
| My progress A | 4 (header, hero, next, list) | 3 | 1 | 0 | 54 / about 25 | 32 | 1 |
| My progress B | 4 (header, summary, map, radar) | 3 | 2 (mosaic + radar; over the student line of 1, within the dashboard line of 2) | 2 | 25 | 14 | 1 |
| My progress C | 4 (header, pace, placements, courses) | 3 | 1 | 0 | 61 / about 15 (rest is the course table) | 22 | 1 |
| Skill detail A | 4 | 1 | 0 | 0 | 31 (64 on a did-not-qualify skill, the failed-rule block) | 19 | 1 |
| My requests A | 3 | 0 | 0 | 6 | 66 (146 for stu-g-067 with 11 open, mostly reasons) | 48 | 1 |
| My requests B | 2 | 0 | 0 | 3 tabs | 36 | 28 | 1 |
| Fix A / B | 3 | 0 | 0 | form fields | 40 / 58 | 31 / 45 | 1 |

No horizontal scroll at 375 on any screen; no text under 12 px (chart labels scale with the SVG width).

## 8. What v2 got wrong, and what these screens do instead

| v2 (AUDIT T2) | Here |
|---|---|
| Progress shown three ways on Home | one ring, two figures, one verdict |
| Lab note x3, "saved" x3 | each said once; one offline line |
| Home waffle and card dots disagree on waiting | one waiting count from submissions + held evaluations, used everywhere |
| Log and Requests split; requests newest-first, ungrouped, sync state as status | My requests grouped by evaluator with request status, age and link state |
| No stuoverview, sturadar, stutarget | B mosaic of 94 skills by 24 sections, radar vs cohort median (n >= 5), C course expectations |
| No placement-based likely skills, no N-03 | likely star on rows, placement line and placements card with end date and not-started count |
| No did-not-qualify action, no different evaluator | Make a further attempt everywhere it applies; Send to someone else on both paths |
| Phone column on a 1440 page | web-first grid, adapted at 375 |
| AE-04 "evidence but none qualifies" folded into In progress | its own state, amber |

## 9. References (Mobbin)

| # | Screen | What we took |
|---|---|---|
| 1 | [Uxcel home: continue learning + right rail](https://mobbin.com/screens/e2def7c6-f7a3-4d84-81f7-6eae55ac7f07) | A: one primary "continue" block beside a quieter status rail |
| 2 | [Dropbox Dash "Get to know" checklist, 1 of 5](https://mobbin.com/screens/db24613b-901d-4574-9f74-134fdfaa52ab) | A: short ordered list with a count, each row one action |
| 3 | [Tana To-Do grouped by status](https://mobbin.com/screens/8f7056a0-fe49-4cdd-820c-78147a8edcd2) | Required list: name first, status column, quiet rows |
| 4 | [Airtable group-by grid](https://mobbin.com/screens/78b76ba8-be7a-4286-a991-abf82f444044) | B: sections as groups with a roll-up count |
| 5 | [Plane work item activity + properties rail](https://mobbin.com/screens/cfddd1af-a701-4c3d-ad1c-b7f42e8c10fe) | Skill detail A: timeline left, facts rail right |
| 6 | [Shopify order timeline](https://mobbin.com/screens/659579b5-ce4c-4b89-b776-be3fdadf01c8) | Skill detail: one line per event, newest first |
| 7 | [Unify outbox by person](https://mobbin.com/screens/421d367b-cb5f-4a25-817f-458cea21e1bd) | My requests A: rows keyed on the recipient |
| 8 | [Resend sent emails with status](https://mobbin.com/screens/539ca69c-a072-416b-a1ee-d36a242216ef) | My requests B: status column, age at the end |
| 9 | [Zillow signatures requested: who has signed, what happens next](https://mobbin.com/screens/effa7594-3d3a-44ed-bd66-420a48160c40) | Per-request state and the no-account recipient note |
| 10 | [talabat refund resubmit with reason field](https://mobbin.com/screens/839139c6-4f67-4a17-b097-0df7f8a09316) (iOS) | Fix: reason first, one note, full-width send at 375 |
| 11 | [Copilot goal with time left (iOS)](https://mobbin.com/screens/05906c98-edab-4f98-91a9-bbed376ff424) | C: amount to go against a date, not a bare bar |

Competitive (digest): SimCapture "why not counted" (the failed-rule block), Fisdap goals (C), Platinum Planner correction versus new attempt (Fix paths), OASIS red-to-green requirement list (B, as neutral-to-filled with amber), Duolingo-like next action (A).

## 10. Uncertain, for Romit

- Student nav row 1 still reads "Home" (`lib/lab/personas.ts`, owned by another worker); the page title and registry say "My progress" (D-L4). Rename the nav row.
- Placement end dates are not in the data; the term end is used [INFER]. N-03's 21-day window is [INFER] (build prompt gives no number).
- Maya's required set is only 5 skills because her cohort's courses map few mandatory skills; the whole list (94) carries the scale. Confirm that "required" should mean mandatory on current-term offerings.
- Done requests are completed evaluations grouped by evaluator (seed history has no request ids).
- Radar axes are the sections of her required skills (5); with one skill per section the shares are coarse (0, 33, 67, 100).
- "Send for evaluation" links to the planned request screen (`/lab/student/request-signoff`), not built here.
