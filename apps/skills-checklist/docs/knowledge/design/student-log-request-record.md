# Student screens in the design lab: Log a skill, Send for evaluation, Record, Share record, Offline and sync

**Written:** 2026-10-26. **Persona:** Maya Ferreira (`stu-maya`, BSN 2027) on the scaled seed (123 students, 178 skills, 147 configured and published). Any student opens with `?student=<id>`.
**Consulted:** `../00-design-brief.md`, `../glossary.md` (Send for evaluation, Share record, "Not yet recorded" for a new evaluator name, submission states), `../02-decisions-ledger.md` (D-L1 In progress, D-L2 one link per request, D-L4 My progress), `../strategy/02-content-strategy.md` (text budget, say it once), `../strategy/07-ux-laws-and-density.md` (student budget), `../ds-usage-map.md`, `../../v2/audit/T2-student.md`, REQ ST-01..14, SC-13, SC-15, SH-01..07, EV-01, EV-05, EV-07, RV-04, RV-05, `../01-competitive-digest.md`, `student-progress.md` and `visual-language.md` (style).
**Code:** model `admin/lib/lab/student2.ts` (pure, read only, v2 selectors and `lib/v2/evidence-index.ts`); pieces `admin/components/lab/student2/*`; screens `admin/components/lab/screens/student-{log,request,record,share,offline}-{a,b}.tsx`; tests `admin/tests/lab/student2.test.ts`. Nothing writes the shared store: sending, saving and resolving are local lab state.

## 1. What the data says (nothing invented)

| Fact | Value | Source |
|---|---|---|
| Library a student can log from | 147 configured skills in 40+ sections, every specialty (v2 hard-coded one) | `pickRows` over `s.skills` with `openToLog` |
| Likely here | 6 skills (mapped to NURS 350, not achieved, the placement setting can satisfy them) | `buildStudent` placements |
| Places | Harbor General 4 West (Inpatient), Harbor Outpatient Clinic, plus Lab and Simulation as practice; placements repeat across terms, deduplicated | `whereOptions` |
| Evaluators at Harbor General | J. Delgado RN, S. Okonkwo RN, T. Aldridge LPN; 5 program faculty behind "Show program faculty" | `evaluatorChoices` filtered by facility |
| Record | 56 counted, 2 did not count, 1 awaiting approval, 1 returned on Oct 26 (the seed moves as other workers extend it) | `recordRows` |
| Share | Not verified (no verification in the seed), 47 achieved skills, 53 sign-offs from 22 evaluators, 3 required gaps | `shareModel`, `verificationStatus` |
| Device queue | 1 conflict (note on Indwelling urinary catheter insertion), 1 queued, 1 synced | `s.syncQueue` |
| Program-defined submission details | Not in `SkillConfig`; the lab carries one sample program list: Date performed (date, mandatory), Unit (short text, mandatory), Case reference (short text, optional, "No patient names.") [INFER sample] | `PROGRAM_DETAILS` |
| Self-evaluation switch | Not in `SkillConfig`; stand-in: switched on for skills with program-named levels [INFER] | `selfEvalEnabled` |

## 2. Design bar applied

Compact DS controls (Input h-8, Select sm, Button sm/default 32 px) with touch height below `sm` (`--control-height-touch`). Neutral ink, the soft brand tint only where the DS puts it (selected tile, hover row), one amber (`viz-tokens.css`: did not count, returned, conflict). Status is glyph + word + colour everywhere (`ResultLabel`, `StateLabel`, `SyncBadge`). One filled action per page. Every outcome is one `LocalBanner` sentence, never a toast. "Saved" appears once (the save result). Sync status is said once per page: the header chip, except on Offline and sync, where the page is the status and the chip is hidden. No "items", no em dashes, sentence case, no icons on CTA buttons, no requirement IDs in UI.

## 3. Screens

### 3.1 Log a skill (Tier 2)

| | A: one form per sitting (recommended) | B: shift log |
|---|---|---|
| Question | Do skills, where, the program's details and a self-rating only where switched on, saved to the device first with one next step "Send for evaluation", get a skill logged in under a minute and end the split between logging and asking? | Does adding each skill the moment it happens (one search, place from the placement) and finishing details later, then sending the ready ones together, fit a busy shift better than a form per sitting? |
| Mental model | A form you fill once per sitting (Xero time entry) | A running list you add to all day (Matter queue, Fisdap shift) |
| Regions at 1440 | header · What you did (picker) · Where and when · Rate yourself (only when switched on) · This entry (sticky summary + Save) | header · Add what you just did (search + where) · On this device (entries, details, sync) · Ready to send |
| DS per region | PageHeader via PageFrame + StatusBadge sync chip · Card + Command (search, groups, "Likely here" star, state glyph + word) + Badge chips · Card + RadioGroup tiles + DatePickerField + Input + Field/FieldError · Card + ToggleGroup sm · Card + Button + LocalBanner | PageHeader · Card + Popover + Command (add mode) + Select sm · Card + Collapsible rows + StatusBadge (Practice, Sent to, Add date, Ready) + SyncBadge · Card + Button |
| 375 | stacks; summary and Save last; full-width 44 px Save | badges wrap under the name; send card last |
| After save | "Saved on this device" once, then "Send for evaluation" (carries the skills in the URL) and "Log another skill"; practice entries get no send | rows show Queued or Synced from the moment they are added; conflict badge links to Offline and sync |

### 3.2 Send for evaluation (Tier 2; registry title changed from "Request a sign-off" per glossary)

| | A: who, then how (recommended) | B: situation first |
|---|---|---|
| Question | Do skills, then the evaluator (site preceptors first, or anyone by name and email), then one of four ways to reach them, with one Send and one sentence on what happens next, get a request out fastest? | Does asking "Is your evaluator with you?" first (with me: QR or hand over; not here: email link; paper: photo) route a student to the right method faster than choosing skills and a person first? |
| Regions | header · skills + who · how they sign (4 tiles) · this request (Send) | header · the situation (3 choices) · the rest, shown once chosen |
| DS | Badge chips + Popover/Command "Add a skill" · Select "At" (hidden with one placement) · RadioGroup rows with AvatarInitials, disabled rows carry their reason · "Someone not listed": Input name + email, StatusBadge "Not yet recorded" · SelectionTileGrid (QR code, Hand over device, Email a link, Photo of paper form) · Input file for the photo · Card summary + Button | RadioGroup cards · SelectionTileGrid (QR, hand over only) · same who, skills, photo fields · inline sentence + Send |
| Result (both) | One card: QR (real, scannable, `lib/v2/qr`) + InputGroup "Copy link" for QR; "Open the sign-off for them" for hand over; nothing extra for a link or photo. One LocalBanner sentence: who, no account, when it counts (approval, Met, review, or "Kept on this device" offline). Then "Go to My requests". A sent request has no QR or link controls anywhere else (v2 RV-05 UI defect). |
| Offline | QR and link tiles read "QR code, later", "Email a link, later"; Send reads "Keep and send later"; hand over and photo work offline | same |

One request, one evaluator, one link [LEDGER D-L2]; several skills from one sitting are one request [REQ EV-05]. A picked evaluator who stops qualifying when skills change is cleared, not kept.

### 3.3 Record (Tier 2)

| | A: by skill (recommended) | B: chronological |
|---|---|---|
| Question | Does a filtered list of evidence grouped under each skill, with did-not-count first and the reason on every row, match how students audit their record? | Does one dated ledger of every evaluation, by month, with the same filters and reasons, match how students audit their record better than grouping by skill? |
| Regions | header (Share record) · three figures that filter (Counted, Did not count amber, Awaiting approval) · one filter row (search, result, setting, course) · table grouped by skill, did-not-count groups open | same figures and filters · table grouped by month |
| DS | Button (figure toggles, neutral active state) · Input h-8 + Select sm x3 · Card + Table, group rows with StateLabel, rows with ResultLabel and Why | same, Table by month |
| 375 | the table becomes a two-line list (date + result, then why) | two-line list (date, skill, result, then why) |
| Why column | Counted: "Counts toward the rule and toward Inpatient." Did not count: "The evaluator answered Unmet. Needs 3 Met evaluations; you have 0." [REQ SH-03] Awaiting approval: "Completed. It counts once a reviewer approves it." Returned: the reviewer's note | same |

### 3.4 Share record (Tier 2; registry title changed from "Share verified record" per glossary)

| | A: the preview is the page (recommended) | B: recipient first |
|---|---|---|
| Question | Does seeing exactly what a reader will get (evaluator sign-offs, gaps stated, what stays private) beside the link, expiry and PDF and CLR 2.0 exports build enough trust to share? | Does picking who it is for (employer, another school, licensing board) and letting that set the format and expiry share faster and with fewer mistakes than a preview with controls? |
| Regions | back link + header · preview (name, achieved skills with sign-offs, "Required, not achieved yet" with state labels, "Not shared") · status · link (expiry Select 7/30/90 days, Create link) and exports | back link + header · who it is for (3 cards) · what they get (3 figures, status, "See what they see" disclosure) · one action set by the recipient |
| DS | Card + preview list + StatusBadge "Not verified yet" / "Verified" · Separator · Field + Select sm + Button · InputGroup copy + LocalBanner expiry date + "Turn off link" · Button outline PDF, CLR 2.0 file | RadioGroup cards · figures · Collapsible · LinkPanel or one Button |
| States | Maya is not verified: preview shows, link and exports are disabled with the reason printed (no hover needed on a phone). `?state=verified` opens the path (demo). CLR is a real JSON file in the CLR 2.0 shape (unsigned); PDF uses the browser print. | same |

### 3.5 Offline and sync (Tier 2)

| | A: queue ledger (recommended) | B: one at a time |
|---|---|---|
| Question | Does one list of every change on the device, grouped conflict, queued, synced, with one-tap choices inline, make it obvious that nothing is lost? | Does resolving each conflict with the two versions side by side as a single choice, the rest summarised in one line, resolve conflicts faster than a grouped ledger? |
| Regions | header (no chip) · counts (only non-zero) + Send now · Choose a version (versions side by side, Keep this device / Keep your other device / Keep both) · On this device + Synced behind a disclosure | header · current conflict (RadioGroup version cards, Keep both for a note only, Keep this version) · one status line with every change behind a disclosure |
| DS | StatusBadge counts · Button · Card + amber edge + Button default/outline · Card + Collapsible list + StatusBadge | Card + RadioGroup + Button · StatusBadge + Collapsible |
| Outcome | one LocalBanner: "Kept this device's version for note on ... It reached your program." (offline: "It sends when you are online.") | same |

A rating keeps one value, so "Keep both" exists only for a note (same rule as `lib/v2/sync.ts`).

## 4. States (`?state=`)

`loading` final-shape Skeleton per screen · `empty` per screen ("No skills open yet", "Nothing to send yet", "No evaluations yet", "Nothing to share yet", "Nothing waiting on this device"), each with its one action · `error` LocalBanner "This page did not load" + Try again, "Nothing on this device is lost." · `offline` one info banner, chip shows queued, offline-aware labels and outcomes · `conflict` default seed · `queued` everything held on the device · `synced` everything sent, no conflict · `verified` share demo. Seen in Playwright: request A offline, offline A synced and queued, share A verified, log A empty, record A error.

## 5. Density, measured (Playwright, first viewport, lab chrome excluded; header is one more region)

Raw words include data values (skill names, reasons, notes); the record and share counts are mostly data. Controls count every radio and input, so a 3-person evaluator list is 4 to 8 controls.

| Screen | Regions 1440 (+header) | Figures | Controls 1440 | Words 1440 | Words 375 | Horizontal scroll 375 |
|---|---|---|---|---|---|---|
| Log A | 3: what, where, save | 0 | 13 | 3 | 0 | no |
| Log B | 3: add, device, send | 0 | 3 | 43 (entry names, places) | 27 | no |
| Send A | 3: who, how, send | 0 | 23 (radios, tiles, chips) | 3 | 3 | no |
| Send B | 1: situation (rest appears on choice) | 0 | 6 | 0 | 0 | no |
| Record A | 2: filters, evidence (+ figures) | 3 | 20 | 72 (reasons) | 39 | no |
| Record B | 2: filters, ledger (+ figures) | 3 | 8 | 157 (reasons) | 57 | no |
| Share A | 4: preview, status, link, exports | 0 | 6 | 135 (achieved list) | 34 | no |
| Share B | 2: recipient, gets | 3 | 7 | 9 | 9 | no |
| Offline A | 3: counts, conflicts, queue | 0 | 5 | 47 (the two notes) | 47 | no |
| Offline B | 2: conflict, status | 0 | 5 | 0 | 0 | no |

Prose (not data) stays under 25 words on every phone view; Send A goes over the 8-control line because each evaluator row is a control (a form, not a dashboard; strategy 07 form line is 7 fields per step).

## 6. What v2 lost, and what these screens do instead

| v2 (AUDIT T2) | Here |
|---|---|
| No program-defined submission details (SC-13, ST-10) | Date, Unit, Case reference with types and mandatory enforcement (sample program config) |
| Self-evaluation always on (SC-15, ST-11) | Asked only where switched on |
| Cannot name an evaluator not on record (ST-09) | "Someone not listed": name + email, "Not yet recorded" until the program adds them |
| Returned correction cannot go elsewhere (RV-04) | Fix screens own it (other worker); the request here picks any qualifying person |
| QR, link and hand-over stay on completed requests (RV-05 UI) | Controls exist only on the Send result; My requests shows link state only |
| "Saved" three times | Once, as the save result |
| Log and Requests split | Log ends in "Send for evaluation" carrying the skills; B's send tray sends the ready entries |
| Picker hard-coded to one specialty, no search at 150+ | Search over 147 skills, grouped by section, "Likely here" first |
| Sync strip on every page, phone status card noise | One chip; the Offline page is the status |
| Phone column on a 1440 page | Web-first grid, adapted at 375 |

## 7. References (Mobbin)

| # | Screen | What we took |
|---|---|---|
| 1 | [Xero new time entry](https://mobbin.com/screens/2eec6581-658a-4b97-836a-35def27c63ea) | Log A: one compact form per sitting, picker then date, Save |
| 2 | [Square new project with customer search and date](https://mobbin.com/screens/241c60f9-e2fa-4e9a-a422-01aeffb99f58) | Log A: searchable picker above details; date popover |
| 3 | [Slopes "Have them scan me" or send as a link](https://mobbin.com/screens/c7f32d02-596b-4d44-9293-35aee2f526ac) (iOS) | Send: QR first, link as the fallback in one place |
| 4 | [Strava scan-to-follow QR with Copy link](https://mobbin.com/screens/78fc6c82-871d-4d8e-b6e4-5ac56e2818eb) (iOS) | Send result: code, one copy action, Done |
| 5 | [Plane invite teammates by email and role](https://mobbin.com/screens/9c8bde90-9c60-41e6-8d74-4cb0bb04e8a0) | "Someone not listed": name and email inline |
| 6 | [HoneyBook signer name and details](https://mobbin.com/screens/a4df730b-eb7d-49be-8e21-a4d1e028ba46) | Request: signer chosen per document, signature required |
| 7 | [Plane publish link with regenerate and access line](https://mobbin.com/screens/2989a5ef-7ef1-4b8c-8122-6bce1bef4c7d) | Share: link, who can open it, turn off |
| 8 | [Tally share link with link preview](https://mobbin.com/screens/969c7063-1a7c-44ca-be14-945c3ea651fe) | Share A: preview beside the link |
| 9 | [Browserbase sessions with status and Expires column](https://mobbin.com/screens/35f01220-bd45-42bb-a932-eca18c487e70) | Record and share: status word per row, expiry stated as a date |
| 10 | [Matter queue list](https://mobbin.com/screens/73cfb382-bdce-42b3-bee3-18e89919780b) (iOS) | Log B and Offline: a quiet running list, one line per entry with provenance |
| 11 | [Sprig studies with status filter](https://mobbin.com/screens/abdc1314-5b82-4136-b99b-2462e0079afc) | Record: one filter row above the list |

Competitive (digest): QR fastest and best liked (Snyder 2018), CORE email link (REQ EV-01), Medtrics SMS link, Elentra PIN, one45 hand-over; login loops and lost entries are the loudest complaints, so every entry is on the device first and shows Queued, Synced or Conflict (Fisdap offline).

## 8. Uncertain, for Romit

- QR, hand over, photo of paper form, CLR 2.0, verification and offline are v2 proposals, not REQ (ledger Q5); built because the task names them.
- Program-defined details and the self-evaluation switch are sample stand-ins: `SkillConfig` has neither field.
- "Not yet recorded" (glossary) is used instead of "unverified" for a new evaluator name; the task brief said "unverified until adopted".
- Placement-to-evaluator matching uses the facility name in the evaluator's title (people carry no site id in the core seed) [INFER].
- Send has no nav row (student nav: My progress, Log a skill, My requests, Record); it is reached from Log, My progress and Skill detail.
- Send A counts 23 controls above the fold at 1440 (evaluator radios and method tiles); a compact evaluator Select would cut it but hides who is at the site.
- The dev server was slow under several workers; first hydration took up to 10 s, so a Playwright pass is the reliable check.
