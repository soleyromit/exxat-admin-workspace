# v2 decisions and open questions

Consolidated after Stage 5. "Decided" means decided for this prototype by the person named. **Nothing here decides a requirements `OD-*`.** (`OD-14` and above are team-proposed open decisions in `strategy/05`, not in the requirements document; `OD-19`, the batch grid, is one of them.) Tags: `[PROPOSED]` a capability beyond the requirements, `[INFER]` my reading, "Romit" or "brief" where the instruction came from the person.

## A. Ground rules (Stage 0 brief)

| # | Decision | Status |
|---|---|---|
| D1 | Every v2 screen is built on `@exxatdesignux/ui` 1.6.5. `studentUX` and `exxat-ds` are read-only references. | Romit |
| D2 | **Hard-stop scope change, v2 only.** Starter libraries (`SL-01`), a default evaluation model (`SC-02`), remediation (REQ section 14), QR codes and heatmaps, the batch grid (`OD-19`), offline sync, CLR 2.0, photo of a signed paper form, tamper-evident PDF, evaluator qualification and expiry are in scope for the prototype. They are `[PROPOSED]` in docs and never labelled in the UI. **Kept:** completed evaluations are immutable (a later change is a new version), preceptors have no login, lab never satisfies a clinical-setting minimum, mapping is not eligibility. | Romit. The product `CLAUDE.md` still reads as before; it applies to the production build. |
| D3 | Four models are configurable. Binary is pre-selected in v2 screens, scored is never the default. Pre-selecting conflicts with `SC-02`, so it is part of D2. | Romit |
| D4 | v2 lives in `app/(v2)/v2/...` with its own layout, store provider and nav. v1 groups are untouched. The role comes from the URL, and the role switcher navigates. | `[INFER]` |
| D5 | Store: React context plus `useSyncExternalStore`, `localStorage` with guarded access, hydrate after mount, a shape check discards bad data. Envelope version 3. Every later field is optional so saved state still loads. | `[INFER]` |
| D6 | Student screens are a 28rem column on every viewport (conflict screen 48rem). Bottom navigation below 768 px: Home, Log, Requests, Record. R. Whitmore uses the Preceptor role. | `[INFER]` |
| D7 | L. Haddad, Dr. K. Brennan and the eleven other students are invented names. Preceptor and lab-instructor credentials are sample data. | Placeholder |

## B. Admin setup (Stage 1)

| # | Decision | Status |
|---|---|---|
| D8 | The configure wizard has 8 steps (the DS recommends 6 and warns in dev). Opening the review step directly shows steps 1 to 7 as complete. | Brief |
| D9 | Starter libraries are static sample catalogues. Copying adds only skills not already present (name match), unconfigured. "Replace" is not offered because it could overwrite configuration that carries evidence. | `[INFER]` |
| D10 | Import reads a PDF through the local extractor and proposes skills by rules (no network, no AI key). The AI path (OD-12) stays a v1 concern. | `[INFER]` |
| D11 | The wizard draft lives in the store and is saved without audit entries. Step changes and publish are audited. | `[INFER]` |
| D12 | The strength hint (`strengthHint`) and the coverage warning "no setting can satisfy it" are my heuristics, not requirements. | `[INFER]`, review with Sankalp |
| D13 | `SkillConfig.feedbackRequired` (SC-14) and `approvalRequired` (SC-15) are read by the forms. The wizard has no control for either yet. | Open: add the controls |

## C. Student, sign-off, offline (Stage 2)

| # | Decision | Status |
|---|---|---|
| D14 | A lab or simulation entry is a practice trial: it counts toward prerequisites and is never sent for sign-off. A clinical entry is what a student sends. | `[PROPOSED]` |
| D15 | Prerequisites read as "and": lab check-off, practice trials and each prerequisite skill together. | Open: "all" or "any of"? |
| D16 | The log asks for the setting once and stores it on each entry. A note is stored per skill entry (OD-07 and ST-12 untouched). | `[INFER]`, OD-07 open |
| D17 | A person must be qualified for every skill in a request. Preceptors and lab instructors are always listed (unqualified ones disabled with the reason); faculty only when qualified. Lab instructors are never valid for a clinical entry. | `[INFER]` |
| D18 | The QR generator is dependency-free (`lib/v2/qr.ts`, byte mode, level M, versions 1 to 10), cross-checked against an independent decoder. | Done |
| D19 | Offline is a demo toggle, not `navigator.onLine`. A conflict resolution is a new change that syncs at once when it can. Handover is a sheet with three phases, no PIN. | Brief, `[PROPOSED]` |

## D. Evaluation, outcomes, review, verification (Stages 3 and 4)

| # | Decision | Status |
|---|---|---|
| D20 | Reopen adds a version and never edits one. Staff reopen with a reason; the evaluation does not count until the newest version is confirmed. | `[PROPOSED]`, ask Sankalp who may reopen |
| D21 | "Not yet, feedback only" is outcome `not-yet`, status counted, never an attempt, never opens a plan. | `[PROPOSED]` |
| D22 | Remediation opens on a fail only where the skill's failure path says so (IV catheter does, sterile dressing does not), or by hand. One open plan per student and skill. | `[PROPOSED]`, deviation from a literal reading of the brief |
| D23 | Confidential concerns are visible to administrator, reviewer and director, never to the student or preceptor, and are never in any report, PDF or export (tested). | Open: should the reviewer and director see them? |
| D24 | No accounts: identity comes from the link (the assigned evaluator, or "Open this link as" in a labelled demo control). Unqualified people are blocked with the reason. | `[PROPOSED]` |
| D25 | The queue holds evaluations awaiting approval, photos of paper forms and stalled or returned requests. The unit of approval is the request. Blocked items never stop the others; the confirm names them before the click. | `[PROPOSED]` |
| D26 | A paper form is entered by the reviewer on the evaluator's behalf, source recorded as paper form and who typed it. | `[PROPOSED]` |
| D27 | A return needs a reason and shows the student a next step. Send again continues the same record with a revision count and edits nothing in place. OD-08 untouched. | Open: OD-08 |
| D28 | "Stalled" is a status the seed sets; there is no timer. Reassign replaces the candidates, resets the wait, and audits who, from whom, to whom and why. | `[INFER]`, open: what makes a request stalled |
| D29 | A director verification is append-only and numbered. It stores who, when, a note, the counted evaluations with their versions, and the mandatory skills with whether each was achieved. A later reopen marks the record "Changed since verified"; the next verification is version n + 1. | `[PROPOSED]` |
| D30 | "Completed record" means nothing pending, not every mandatory skill achieved. Unmet mandatory skills are listed and confirmed, not blocking. | `[INFER]`, open question 6 |

## E. Reports, record, lab grid (Stage 5)

| # | Decision | Why | Status |
|---|---|---|---|
| D31 | **Pace is evidence-based and a prototype assumption.** Term Aug 24 to Dec 11, 2026; expected = floor(evaluations the mandatory rules ask for x share of term gone); behind = more than 1 evaluation short. On the demo day (day 56 of 109) 10 of 12 students are behind, because the seed history is thin. A mandatory-skills-achieved measure was tried first and put all 12 behind. | The requirements do not define pace. | `[INFER]`, needs a program rule |
| D32 | **Heatmap states** are Achieved, Half or more (counted at least half of the need), Some, Not met yet (attempted, none qualifying) and Not started, on a 4-step sequential brand scale. Every cell carries a symbol and words; the Student table tab is the words-only equivalent. | Colour must never be the only carrier; no red. | `[PROPOSED]` |
| D33 | **Single rater** = two or more counted observations and one evaluator behind all of them. One observation is not flagged. Rater comparison shows a gap to all raters, never a verdict, and marks raters under 5 evaluations. | A flag on a single observation would be noise; a verdict would be unfair to raters who see different students. | `[PROPOSED]` |
| D34 | **Filters re-scope the evidence first, then recompute** (RP-08). Cohort and group are one value in v2; tag and location filters are not built (RP-04 is not covered). A lab or simulation setting with a named clinical setting is explained, not returned empty (RP-09). | Meets RP-01, RP-08, RP-09 as far as the data allows. | Done |
| D35 | **The signature.** The PDF is rebuilt byte for byte from the content it carries and checked against a SHA-256 hash and an HMAC-SHA-256 signature with a demo key that ships in the page. It proves the file is unchanged since it was made here. It does not prove who made it, and anyone can recompute it. The page says so beside the download, in the PDF itself and on the checker. A production design needs a private key held by the program or an e-signature service. | A real signature needs a key management decision nobody has made. | `[PROPOSED]` |
| D36 | **What leaves the program.** Reports and the record never contain concerns, self-ratings, notes or evaluator feedback text. The record includes only Met evaluations of skills that were achieved when the director verified, unchanged since, plus a "Not included" list with a reason each. It does not say a concern exists. | A shared record can only state what the program verified. | `[PROPOSED]`. Open: may feedback text leave the program? Should failed attempts? |
| D37 | **Sharing needs a verified, unchanged record.** Not verified or Changed since verified turns both downloads off and says why. New evidence added after verification is excluded and counted in the list. | Keeps "only verified items" true. | `[PROPOSED]` |
| D38 | **CLR 2.0** is the 1EdTech v2.0 shape (VC 2.0 context, `ClrCredential`, one `AchievementCredential` per skill, `Competency`, evidence per evaluation) with no `proof`, so it is not a verifiable credential until signed. No external validator was run. | A signed CLR needs the same key decision as D35. | `[PROPOSED]` |
| D39 | **Lab grid.** Any published skill the course maps is offered (the lab instructor role is not checked against `evaluatorRoles`, because no seeded skill lists it; qualification of the instructor is checked). A session is Skills lab or Simulation. Results are stored as lab or simulation evaluations by the lab instructor with no clinical setting, so they cannot satisfy a setting minimum; the simulation cap still applies. Absent students get no evaluation and are listed on the batch. A saved batch is read-only and the same name, date and setting cannot be saved twice. A skill with `approvalRequired` holds the result for approval. A lab Met adds a lab check-off for skills whose prerequisites ask for one. | Makes the lab hard stop true in data and keeps completed evaluations immutable. | `[PROPOSED]`; OD-06 and OD-19 open |
| D40 | **Store shape.** `V2State.labBatches` (optional). No version change. `lib/v2/pdf.ts`, `reports.ts`, `report-docs.ts`, `record.ts`, `lab.ts`, `download.ts` and `paths.ts` are new. | | Done |

## F. Open questions

1. **Where does D2 get recorded?** `strategy/07` and the product `CLAUDE.md` still say the hard stops apply. Romit to decide on a "v2 prototype exception" note.
2. **Sample names** (D7): real program staff names or placeholders?
3. **Hosting.** v2 uses `localStorage` only, so a hosted copy shows each viewer their own state. Fine for demos, wrong for a shared review.
4. **Do stakeholders see `[PROPOSED]` items?** The UI never labels them, so a reviewer could mistake a proposal for a requirement. Option: a one-line "Prototype, not the requirements" note in the Scenario menu.
5. **Prerequisites "all" or "any of"** (D15), and the wizard controls for feedback and approval (D13).
6. **Can a record with unmet mandatory skills be verified?** (D30) Is "verified" about the evidence so far, or about program completion?
7. **What makes a request stalled?** (D28) Days, per skill, per program?
8. **Who may verify, reopen, see concerns?** One director role is modelled; programs may have a dean, an accreditation officer or several directors (D20, D23).
9. **Signature key** (D35, D38): who holds the private key, and is a signed PDF enough or does the receiving party need a verifiable credential?
10. **What may leave the program in a shared record?** Feedback text, failed attempts, evaluator names (D36).
11. **Pace rule** (D31): by term share, by calendar milestones the program sets, or not at all?
12. **Is a lab instructor allowed on every skill?** (D39, OD-06) The grid assumes yes, subject to qualification.

## G. Findings (DS and tooling, not v2 decisions)

- **DS DataTable** reserves the column key `select` (an empty cell results). Its row checkboxes show only on hover or focus, and its default bulk actions are placeholders (Export, Delete). The queue draws its own checkboxes; `V2Grid` has `selectable`, `rowLabel`, `bulkActions` and `emptyText`. Earlier v2 tables still inherit the placeholder bar unless `selectable={false}`.
- **Open DS Select** fails `aria-hidden-focus` (and `scrollable-region-focusable` for long lists) behind it and traps Tab by design. `shoot.mjs` records these as `knownAxe` and checks ArrowDown and Escape.
- **DS TabsList** can take focus without a ring after a mouse click; v2 adds the DS ring tokens. Three tabs with counts overflow at 390 px, so tab labels are short.
- **DS Wizard** warns above 6 steps. **DS LocalBanner** action buttons are small on touch; student banners use a DS `Button size="lg"` in the body. **DS Button `lg`** is a fixed 36 px and does not wrap, so student buttons add `min-h-(--control-height-touch) h-auto whitespace-normal py-2`. **DS ToggleSwitch** shrinks to a circle in a narrow flex row unless wrapped in `shrink-0`. **A native `type="date"` input** counts as a keyboard trap in the Tab walker (three segments, one element), so the lab grid uses the DS `DatePickerField`.
- **`node tools/ds/source.mjs`** reports `@exxatdesignux/ui@1.5.1` while the app installs 1.6.5; APIs were checked against the installed `.d.ts`.
- **Reduced-motion hydration error** in the DS Ask Leo launcher (also in v1); v2 renders it after mount.
- **Intermittent hydration warning on `/v2/reviewer/review-queue` (dev server, not explained).** Seen three times in Playwright runs (empty-queue desktop and phone in the 2026-10-20 09:14 report, returned-tab desktop in a later run) and once in a six-load probe, always on a page reloaded with saved (non-seed) state. The full React diff shows only Radix `Tabs` ids and `aria-controls` / `aria-labelledby` values (`useId` output) differing between server and client; no Ask Leo markup is in the diff, so it is not the launcher problem above. It did not recur in 45 further probe loads or in a full `shoot.mjs` run (306 captures, no console errors). The store hydrates after mount, so a state-driven mismatch is ruled out; the trigger is not isolated, and it may be a dev-only React and Radix tree-path issue. Not verified in a production build. The earlier phone Returned tab warning was a separate one-off. `shoot.mjs` now waits until every button is hydrated before it acts, which also fixed a flaky `copy-menu-open` capture (the click landed on server HTML before React attached, so the listbox never opened).
- **Failure screenshots** from the stage 1 and stage 2 flow scripts go to the system temp folder, not `docs/v2/screenshots`. A stale `stage2-e2e-failure.png` (a review queue shot from a failed development run) was deleted.
- **Governance files edited on this branch, for Himanshu's review:** `docs/governance/ds-adoption.md`, `scripts/ds-adoption-audit.py`, `docs/watch/ds-snapshot.json`.
- **DS LocalBanner `retry` button is small on touch** (24 px). Student banners keep the DS `retry` prop and lift its height with `BANNER_TOUCH` (`[&_button]:min-h-(--control-height-touch)`).
- **`shoot.mjs` overwrites `report.json`** with the routes of the current run, so only a run with no route arguments writes the full report.

## H. Naming

`docs/design/brief-v2.md` is the three-direction design brief of 2026-10-08. This folder is the connected prototype. The names collide; suggestion: say "connected prototype" in all docs. Not renamed, to keep links working.
