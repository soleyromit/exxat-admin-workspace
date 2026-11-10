# Decisions ledger (Romit, Oct 2026) and open questions

**Rule:** a decision here is Romit's statement in the session of 2026-10-26 (relayed by the lead agent), not a requirement and not an `OD-*` resolution. Requirement open decisions (`OD-01` to `OD-38`) stay open; see `../strategy/05-open-decisions.md`. Tag `[ROMIT 10-26]`.

## 1. Stated this session (treat as settled until Romit says otherwise)

| # | Decision | Design consequence | Notes |
|---|---|---|---|
| D-A | The navigation must shrink. Too many rows, too much chrome. | Collapse rows per role; remove duplicate pages that render the same component for several roles. Starting proposal 19 rows to 12 (admin 4, reviewer 2, director 2, preceptor 0 or 1, student 3) [AUDIT T4] | The specific row list is an audit proposal, not approved. Ask before cutting a destination that carries a REQ job |
| D-B | "Items" is the wrong word. | UI says "skills" (or the program's own noun). Never "items" in copy | Build prompt uses `{itemNoun}`; this is a copy rule, not a data rename. See `glossary.md` |
| D-C | The dots must connect per role: each role's screen shows what the previous role did and what the next will see. | Handoff cue at each hop (student sends, evaluator signs, reviewer decides, student sees result); record-carrying links; "same record in other views" [AUDIT T4; BUILD-PROMPT §8] | The audit found the store is shared (state does propagate); the gap is entry points and signals, not data |
| D-D | The dataset must be 100+ students and 100+ skills. | Design and prototype at that scale; reference set is 123 students, 153 skills [BUILD-PROMPT §6] | 7-skill demos are not acceptable evidence of a design |
| D-E | Base knowledge is: the outcome (build prompt) markdown, the three Word documents, and the competitive analysis. | These, plus REQ and the two transcripts, are what agents consult first; this folder distils them | Which three .docx files Romit means was not identified in this session; the REQ docx is one. `[PENDING-ROMIT]` confirm the other two |
| D-F | v2 (the current branch prototype) is a reference, not final. | Do not defend v2 choices; audit findings may be overruled by this brief | Branch `feat/skills-checklist-v2` |

## 2. Carried from earlier sessions (already in the repo)

- Visual layout, IA and copy structure follow Sankalp's prototype inside the DS base shell; behaviour follows requirements (Romit 2026-10-08) [README].
- All 20 early contracts were confirmed by Romit on 2026-10-08 as written; every OD stays open [README]. The audit and this session may supersede parts of them; flag when a contract and this ledger disagree.
- Aarti dislikes red in score and rating visualisation [memory].

## 3. Open questions awaiting Romit

| # | Question | Why it matters | Source |
|---|---|---|---|
| Q1 | Reopen on counted evaluations: v2 lets staff "Reopen to edit" a counted or awaiting-approval evaluation as an append-only version. REQ RV-03 and RV-05 say completed evaluations cannot be edited. The competitive analysis (rec 10) says an edit after sign-off reopens the item with history visible. Keep, rename (for example "Add a correction"), or remove? | Hard stop versus competitive recommendation versus faculty convenience | [AUDIT T3]; [COMP rec 10]; [REQ RV-03, RV-05] |
| Q2 | Web-first or phone-first for student and evaluator surfaces? The build prompt says web-first (adapt to 1024 and 375); v2 is phone-first (28 rem column). Public reviews say mobile reliability is the main risk. | Determines shells, nav, offline scope | [BUILD-PROMPT §2.1]; [AUDIT T2]; [COMP] |
| Q3 | Director verifying with unmet mandatory skills: may a director verify a record when mandatory skills are unmet? v2 shows a gaps banner plus a checkbox acknowledgement. Director and "verification" are not in REQ. | Risk of verifying an incomplete record; scope | [AUDIT T3] |
| Q4 | Which of the 41 build-prompt screens are in scope for the next build? The audit counts: admin 1 present, 7 partial, 11 missing of 20; student 4 of 10 absent (stuoverview, sturadar, stutarget, stuplace partial). | Prevents building 41 screens by default; sets the sequence | [BUILD-PROMPT §7]; [AUDIT T1, T2] |
| Q5 | Which v2-only scope changes stay: shipped starter libraries (REQ SL-01 hard stop), last-N currency rule (REQ section 14), evaluator credential and training qualification, remediation in the nav (REQ section 14), QR, hand-over, photo of paper form, CLR 2.0? | Several conflict with hard stops or REQ section 14 | [AUDIT T1, T2]; `docs/v2/decisions-and-open-questions.md` D2 |
| Q6 | Are the four extra achievement-rule types (distinct evaluators, success rate, practice count before checkoff, context in requirement) in v1? The build prompt engine already includes distinct evaluators and level thresholds. | Not in REQ SC section; affects rule builder | [COMP rec 3]; [BUILD-PROMPT §5] |
| Q7 | Do option A and option B toggles (strategy section 15.1: one list versus separate module, setting as context versus measure, any versus all signers, completion rule on or off) ship in the prototype? | Build prompt asks for A default, B behind a toggle | [BUILD-PROMPT §11] |
| Q8 | "Reviewer" versus "admin" as separate nav: the audit says they differ by permission, not IA. Confirm one staff shell with per-role actions. | Drives nav size | [AUDIT T3, T4] |
| Q9 | Evaluator identity lifecycle (unverified name, adopt, merge) is missing in v2; confirm it is in scope because the reviewer "why held" cue depends on it. | Dots between roles | [REQ SL-09, ST-09]; [BUILD-PROMPT admevals, J7]; [AUDIT T3] |

## 4. Not decided (for avoidance of doubt)

All `OD-01` to `OD-38`, including: one list versus separate models (OD-28), report as launch page (OD-29), evidence sources beyond student submission (OD-31), sign-off chains (OD-33), FAST form reuse (OD-36), standalone versus Student Success (OD-34), first domain (OD-38). Competitive recommendations 13 (expiry, validator qualifications) are proposed new ODs, not decisions.
