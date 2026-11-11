# Design Contract (draft addendum to S-13) - Send C, step "Send"

Status: DRAFT, 2026-11-10. Amends the confirmed `S-13-student-send-for-review.md` for the lab's Send C, step 4 only. Requirement IDs, ODs and seams are unchanged from S-13.

## Problem (Romit, 2026-11-10)
"Why can't I send and see a QR code, the validation is not helping, and the page layout needs validating because it's not easy to select and navigate between the other options."

## Root causes (verified in code)
1. Date performed is checked against the frozen demo clock (`DEMO_TODAY` 2026-10-26, `lib/v2/seed-core.ts:4`; rule `lib/lab/student2.ts` detailErrors). The DS `DatePickerField` has no max date and highlights the machine's today (2026-11-10), so the natural pick ("today") is refused with "The date cannot be in the future.", which names neither the rule nor the latest allowed date.
2. Outside the walkthrough the date starts empty (only the walkthrough passes `defaultDate: DEMO_TODAY`), so the same flow behaves two ways.
3. The QR code exists only after Send (`RequestResult`, method qr). Nothing before Send says so; with Send disabled the QR is never reached.
4. Method tiles are DS `SelectionTileGrid` compact/below: unselected tiles have a transparent border, so they read as icon links; QR and the two other ways were split behind "Other ways" (delegated D-L70).
5. Three columns of different density (fields, evaluator list, summary); the order on the page did not match the order of decisions (where, who, how, details).

## Requirements (quoted, REQ)
| ID | Text (short) | Where on the step |
|---|---|---|
| ST-05 | records clinical or lab/simulation | Where select |
| ST-06 | setting derived from placement | Where defaults to the placement |
| ST-07 | no placement: full list of settings, location typed | Where + Location field |
| ST-08 | roles constrained by setting and skill; say why | Who list, disabled rows with reason |
| ST-09 | select from recorded; name someone not listed with email | Who list + Someone not listed |
| ST-10 | required details captured and enforced before send | Date performed (+ configured fields), summary, inline errors |
| ST-12 | one note, apart from the evaluator's comment | Note for the evaluator |
| ST-13 | confirmation: what, to whom, role, setting, location | Result card (unchanged) |
| EV-01 | completable without login; email opens directly | Email a link default; QR after send |
| EV-02 | several evaluator kinds by setting | Who list |

## Layout (one column of decisions, summary aside from 1280 px)
```
Where [placement v]            Date performed [10/26/2026 v]
Who signs off   [search]  ( ) 5 rows  ( ) Someone not listed  [Show all 8]
How they sign   (o) Email a link  ( ) QR code  ( ) Hand over device  ( ) Photo of paper form
                <one line: what happens with the chosen way>
[Photo field, photo only]
Note for the evaluator (optional)
Footer: Back | <first problem, after a failed Send> | Save for later | Send
```

## States
Default (date prefilled with today on the program clock) · Validation after Send: summary with links that focus the field, inline error per field, Send disabled with the first problem named; fixing a field clears its error at once and Send re-enables when none remain; focus is not pulled back to the summary while fixing · Offline: method labels add ", later" for link and QR; consequence line says it goes on reconnect · Success: result card (unchanged), QR shown for QR.

## Copy
- Future date: "{Label} is after today. Choose {Mon D, YYYY} or earlier." generated from the program clock, never hard-coded.
- Consequence lines: link "{Name} gets an email with a link to this request only."; QR "The QR code appears after you send. {Name} scans it to sign."; hand over "After you send, hand your device to {Name} to sign."; photo "Add a photo of the signed form. Your program reviews it."

## DS
RadioGroup + RadioGroupItem + Label (choice cards, same as the Course step) for method; FieldSet/FieldLegend/FieldDescription; Popover + Calendar (`disabled={{ after }}`, `today`) inside the DS field chrome for the capped date; existing EvaluatorPicker, WhereSelect, NoteField, ValidationSummary, StickyFooter.

## Not doing
No QR preview before send (it would be a fake). No change to the demo clock (Romit's decision). No change to Send A or B.

## Acceptance tests
1. Open step Send with no date param: date shows the program's today; Send creates the request.
2. The calendar cannot select a day after the program's today.
3. With `?date=` after today, Send shows the summary with the named rule; clicking it focuses the date; picking a valid day clears the error and re-enables Send.
4. Arrow keys move between the four ways; the selected one has a visible border and a consequence line.
5. QR selected, Send: the result shows the QR code.

## Addendum, 2026-11-10 (round 3): the same Send design on A and B

Status: DRAFT. Supersedes "No change to Send A or B" above. Requirement IDs, ODs and seams are unchanged (S-13 and the table above).

### One shared section (`student2/request-parts.tsx` `SendSection`)
C's Send step body moves to `SendSection`; C renders it unchanged. A and B render the same section with options:

| Part | C (wizard, course first) | A (one page, who then how) | B (one page, situation first) |
|---|---|---|---|
| Summary card | skills, course; place · date; scope; Change opens Where + Date | same, Change also opens the skills (Add a skill, chips, what the evaluator checks) | same as A |
| Self-evaluation | its own step | inline cards under the summary card, only when a chosen skill asks [REQ ST-11] | same as A |
| Who signs off | 3 suggestions + Someone not listed + Search all n | same | same |
| How they sign | four illustrated cards | same | first on the page, legend "Is your evaluator with you?", cards grouped With me (QR, Hand over) / Not here (Email) / On paper (Photo) |
| Note | disclosure | same | same |
| Footer | StickyFooter Back / Save for later / Send | StickyFooter Save for later / Send | same as A |
| Result | RequestResult wide (QR after Send) | same | same |

### Shared fixes
1. One selected treatment for every choice on Send: muted fill and a 1 px foreground outline, on the method cards and the evaluator choices alike.
2. Evaluators are choice tiles in a grid (4 across from 64rem, 2 from 40rem, 1 below): radio, initials, name over role and site, so name and detail read as one unit and the row no longer stretches across 1,376 px with its words at the left edge. Fix (further attempt) keeps its list layout, with the same selected treatment.

### Acceptance tests (A and B)
1. 1440 and 1920: summary card, suggested evaluators, four illustrated method cards and Add a note show; no horizontal scroll; footer visible.
2. Date performed cannot be picked after the program's today; `?date=` after today plus Send focuses the date field (one problem, no summary).
3. Two problems: the summary appears and each entry focuses its field.
4. QR selected and Send: the result shows the QR code.
