# Design contract: S-07 Library, lab instructors roster

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Written 2026-10-08. Tags: `[REQ id]` `[OD-n]` `[PROTO]` `[CALL 09-23]` `[INFER]`. Precedence REQ > CALL > PROTO > INFER.

## 1. Surface and wave

**Surface.**
S-07 Library: lab instructors roster (tab 5 of 5)                Wave: W1

## 2. Persona and RBAC

P-A Program administrator (R/W). P-L lab instructor is the subject but has NO account and no access here.  
RBAC row: Administrator (program scope).

## 3. Scope and data seen

Name, email, evaluation count, status; students' typed names awaiting adoption. Emails are PII: visible to  
administrators only (docs/strategy/06 §4). Must not: expose roster to students beyond names in selectors.

## 4. Job to be done and why

**Job-to-be-done.**
When students name lab instructors I do not know, I want to record the ones who sign off regularly, so one  
person does not accumulate as several spellings and requests reach the right inbox.

**Why → So what.**
Lab evidence needs a person to sign off, and Prism has no record of lab technicians; schools today add them as  
"placement faculty" as a workaround [CALL 09-23]. So-what: a name+email roster lets a request reach a  
non-user by email without creating an account [REQ SL-08, EV-01] and keeps reports from splitting  
evaluator counts across spellings [REQ SL-09].

## 5. Requirements and open decisions

REQ: SL-08, SL-09, ST-09 (student side that creates the adoption candidates), SL-01 (nothing pre-seeded), EV-01 (why no account).
Open decision: **OD-05** (Skills-only record vs Prism-wide external evaluator). **Seam:** a standalone `ExternalEvaluator` entity (name, email, role=lab instructor, status) referenced by id from submissions; Skills is the first consumer; moving to a Prism-wide table later is a data move, not a UI change. OD-06 (roles as data) touches this only as the fixed value "lab instructor" for roster rows.

## 6. Prototype reference (keep / do not copy)

`docs/source/screens/09-library-lab-instructors.png`: banner "not Prism users… Nobody here can sign in, and no account is created", table Name / Email / Evaluations / Status, section **"Named by students, not on the roster"** with [Add to roster].
**Keep:** the adoption block directly under the list; the no-account sentence. **Do NOT copy:** example emails as ship data; the evaluation counts (454, 380) as meaning (sample numbers).

## 7. Pattern and reference hub

Route `{base}/library/lab-instructors`. Table + add/edit `Dialog`; adoption section below table, each candidate row has `Add to roster` and `Merge into…`. Reference hub: `apps/pce/admin/app/(app)/admin/competencies/page.tsx` (list CRUD + `Dialog` + `FieldError`) and `apps/pce/admin/components/admin/admin-hub-client.tsx`. Interactions: P-14, P-15, P-17, P-13; flow F-13 (docs/ux/04).

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** All IMPORT. The merge target picker is `Popover` + `Command` (no Combobox in the DS). EmptyState = VENDOR.


Verified 2026-10-08 (`1.5.1`, `1.6.5`): `Tabs`, `DataTable`, `Dialog`, `Field*`, `Input` (email), `StatusBadge`, `LocalBanner`, `DropdownMenu`, `Command`+`Popover` (merge target picker), `Skeleton`, `Badge` → IMPORT. Merge picker: HAND-ROLL composition `Popover`+`Command` (the sanctioned gap for combobox; docs/ux/10 §4). Empty state: VENDOR `empty-state.tsx`.

## 9. Layout, content and behaviour

Regions: header · no-account sentence · tabs · roster table · adoption section. **One filled primary: `Add instructor`.** `Add to roster` buttons in the adoption section are `outline` (secondary) so only one filled primary exists on the surface `[INFER, global one-primary rule]`.
Columns: Name · Email · Evaluations (count of requests) · Status. Adoption row: typed name · typed email · "named {n} times" · [Add to roster] · [Merge into…]. Similar-name suggestion ("Looks like T. Ferreira") `[INFER]`.

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour |
|---|---|
| **L** | Skeleton rows; adoption section skeleton |
| **E** | Roster empty: "No lab instructors yet. Students can also name an instructor when they send a skill for review." Adoption section hidden when none |
| **Er** | Save/merge failure: banner + retry; dialog values kept |
| **V** | Name required ("Enter a name."); email required and valid ("Enter a valid email address."); email already on roster (active or inactive) → warn and offer open existing |
| **S** | Add/merge wait for the server (merge rewrites references; not optimistic) |
| **Su** | Banner "{Name} added to the roster." / "{n} requests now point to {Name}." |
| **D** | Merge disabled until a target is chosen |
| **P** | Candidate named with different emails: show both; admin picks the email to keep |
| **Bl** | None. Merging two roster entries is never blocked (REQ is silent); the confirmation shows how many open requests will point to the kept entry `[INFER]` |

## 11. Edge cases

EC-15 (instructor not on roster: student supplies name and email) · EC-16 (same person misspelt twice; adoption merges) · inactive instructor named again by a student (offer reactivate) · typo'd email (a request would go nowhere; REQ has no bounce handling; flagged risk).

## 12. Copy and interactions

`docs/ux/09` §5 **S-07** (intro, button, columns, student-named section, row action, validation, empty). F-13 outcome banner copy to be added to 09 (not present today; flagged).

## 13. Accessibility (WCAG 2.1 AA)

Keyboard: tabs → Add instructor → table → adoption list (each row's actions reachable in order). Merge picker is a `Command` listbox with `aria-label`. Email input `type="email"` with `autocomplete="off"` (not the admin's own). Emails are plain text (no hover-only reveal). Status in text. Dialog focus trap and return.

## 14. Out of scope

REQ §14 (including notifications/reminders for unopened requests); giving lab instructors accounts or logins `[REQ SL-08, EV-01]`; instructor profiles beyond name+email; a Prism-wide external-evaluator directory (OD-05); evaluator-consistency or site-quality reporting (OD-11); QR codes.

## 15. Acceptance tests (Given / When / Then)

| # | Test | REQ |
|---|---|---|
| T1 | Given I add a lab instructor with a name and email, Then no Prism account is created and the roster shows the instructor | SL-08 |
| T2 | Given a student named "R. Whitmore" with an email in S-13, When I open the roster, Then I see the name under "Named by students, not on the roster" and can Add to roster | SL-09, ST-09 |
| T3 | Given two spellings of one person, When I merge them, Then evaluator counts and future selectors show one name | SL-09 |
| T4 | Given an invalid email, When I save, Then the dialog shows the validation message and does not save | SL-08 |
| T5 | Given a new program, Then the roster is empty | SL-01 |
| T6 | Given the tab renders, Then Add instructor is the only filled primary | global |
| T7 | Given an instructor deactivated, Then students no longer see them in selectors and evaluations already completed remain attributed | SL-08 `[INFER]` |
| T8 | Given a lab instructor on the roster, When a student sends a request to them, Then the evaluator opens the link with no Prism login and no account is created for the roster entry (also S-16 AT-1). | EV-01 |

## 16. Risks and unknowns (max 3)

1. OD-05 may move the entity to a Prism-wide table; keep the standalone seam.
2. Duplicate detection by email vs by name similarity; no source defines the matching rule `[INFER]`.
3. No bounce/invalid-address handling in REQ; requests to a wrong email stall (links to OD-18).

## 17. Vault notes consulted

`Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw: lab technician added as placement faculty workaround; give a free email for lab sign-off) · `Meetings/exam-management/2026-03-05-...md` · `_Insights.md` scanned: `Decisions/pce/2026-06-30-course-eval-faculty-roles-from-prism-settings` (title and summary only; roles come from tenant config, relevant to OD-06 not read in full).

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

- 07 §S-07 puts `Add to roster` as the only action of the adoption block; this contract makes it `outline` to keep one filled primary (07 does not state which is filled).
- 09 has no copy for F-13 success or for merge confirmation.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** Lab Instructors is a tab (`?tab=lab-instructors`): not-a-Prism-user banner, roster table Name / Email / Evaluations / Status, and the 'Named by students, not on the roster' list with Add to roster. Add and Edit use a 672px dialog.

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-05 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** SL-08, SL-09 (adopt or merge a student-named instructor; evaluations stay immutable), no account created, OD-05 seam.

**Weakened or traded away (honest list):** The adoption area is a list, not a table (landmark uniqueness); the standalone deactivate confirmation dialog was removed.
