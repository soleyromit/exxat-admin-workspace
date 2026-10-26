# Skills Checklist v2: dataset spec (deterministic cohort generator)

Status: research and spec only. No app code was changed. Written 2026-10-26.
Tags: [REQ] docs/source requirements, [BUILD-PROMPT n] /tmp/sc-audit/build-prompt.md section n, [AUDIT Tn] docs/v2/audit, [CODE file:line] read in the working tree, [INFER] my judgement.
Line numbers are from the working tree on 2026-10-26. The tree is being edited by other workers (about 70 files modified), so lines drift; re-grep before relying on one.

---

## 0. Why the current seed cannot carry the story

[CODE seed.ts] The seed hand-writes 12 students (`PEOPLE`, seed.ts:70), 31 skills (`LIBRARIES`, seed.ts:121: 10 med-surg + 7 + 7 + 7), one course (`crs-nurs350`), 4 mandatory + 3 optional mapped skills (`MAPPED`, seed.ts:214), 120 evaluations, 14 submissions, 5 raters (`RATERS`, seed.ts:249) and a `PLAN` table (seed.ts:263) that gives each student a fixed count of Met results against exactly four mandatory skills. Everything downstream (pace, heatmap, queue, verification) is computed from this one course. Measured with a throwaway vitest file (deleted afterwards): the whole state serialises to 84,653 characters, 388 characters per evaluation.

---

## 1. Source of the skill list (what was and was not verified)

File: `docs/knowledge/skills-library-hgtc.json` (array, 154 objects).

Found and fetched two published HGTC nursing PDFs, extracted with `pdftotext` (the WebFetch summariser could not read them; the raw PDFs were saved and read locally):

| Doc | URL | What it is |
|---|---|---|
| A | https://www.hgtc.edu/documents/academics/programs/nursing/adn-clinical-skills.pdf | "HGTC Nursing ADN STUDENT SKILLS CARD" (13 sections with items lettered a), b), ...; sign-off columns NUR 101, 120, 150, 220, 221, 201). About 131 skill lines. Bolded skills must be completed clinically. |
| B | https://www.hgtc.edu/documents/academics/programs/nursing/ADN_Clinical_Checklist.pdf | "NURSING CLINICAL SKILLS VALIDATION CHECKLIST", Revised 9/2017, 10 pages. Asterisk = must be completed in the clinical setting before graduation. Contains the structure the build prompt describes ("Enemas (at least one)", "O2 Administration" with Nasal Cannula / Face mask / Croup tent, "IV Therapy"). |

The JSON is built from **Doc B**, because only B has the group structure the build prompt names ("Enemas (at least one)", "O2 Administration" required group with rule any).

Verified vs drafted:

| Item | Count |
|---|---|
| Skill names read directly from Doc B text | **154 verified (`verified: true`)**, 0 drafted |
| Of those, names composed from a parent heading plus a child line (`nameComposed`), e.g. "Urine: Mid-stream urine", "Rate Calculation: Manual" | 6 (the PDF prints the child alone under a parent) |
| Top-level sections | 10 (Doc B has 9 lettered sections; Medications, printed as "H." inside Safety, was split out to match the build prompt's 10) |
| Groups | 17 (build prompt says 18; I could not find an 18th group in Doc B) |
| Mobility item "H." | Name did not survive text extraction. Omitted, not guessed. Likely explains part of the 153 vs 154 gap. |
| Gap to build prompt | Build prompt says 153 items [BUILD-PROMPT 6]; Doc B yields 154 leaves. The build prompt was probably made from a different revision (Doc B is dated 9/2017; Doc A is a differently structured card, about 131 lines). Do not claim 153 are verbatim. |

Fields that are **inferred, not from the PDF** (flagged per row in `inferredFields`): `modelHint`, `setting`, `courseHints`, and `required` for 5 rows where the asterisk position was ambiguous in extracted text (`requiredBasis` says so: Standing, Ambulating, Wheelchair transfer, MIX POWDERED DRUGS, NG TUBE Insertion). `courseHints` column placement in the PDF is garbled by extraction, so treat it as [INFER].

Required count: 47 definite asterisked leaves + 5 ambiguous = 47 to 52, plus the O2 Administration group (asterisk on the group; `requiredViaGroup: true`, `groupRule: "any"`). Build prompt says 49 leaves + 1 group [BUILD-PROMPT 6]. Within range; the exact 49 is not reproducible from this PDF.

Model hints in the JSON: demonstration 123, question 16, scored 15. Setting hints: either 125, clinical 28, lab 1 (CPR). Hint distribution is [INFER] and should be confirmed with the nursing SME before it is shown as fact.

The PDF carries two real program rules worth keeping [Doc B p.1]: (1) "If more than 7% of the required skills have not been performed satisfactorily by the end of the final semester, the student must perform a satisfactory return demonstration in the lab-setting." (2) Skills in small letters can be done independently after validation; CAPITAL LETTER skills need direct supervision. Rule (1) conflicts in spirit with "lab never satisfies clinical" [REQ: "Lab or simulation evidence never satisfies a clinical setting requirement"]. Do not resolve this in the data; see open question Q1.

---

## 2. (a) Target counts

Hard minimums from the brief: at least 100 students and at least 100 skills. Both met.

| Object | Build prompt [BUILD-PROMPT 6, 13.3] | v2 ADOPT | Why |
|---|---|---|---|
| Students | 123 (38 / 43 / 42), 14 also in custom Accelerated track | **123 (38 / 43 / 42), 14 in the track** | Cheap; the story figures (cohorts, track) need it. Keep exact. |
| Cohorts | 2026, 2027, 2028 | same | Graduating, mid-program, first-year. |
| Library items | 153 in 10 sections, 18 groups | **154 verified (10 sections, 17 groups) + 3 hero-only extras (see 3.2)** | Use what was verified, not a made-up 153. Golden "153" in tests is replaced by "library length" read from the JSON. |
| Configured items | 142 | **142 of 154** (12 left unconfigured: Capnography, CPAP/BiPAP, Apnea Monitoring, Gastric Lavage, Endotracheal suctioning, Facial Shave, Cast Care, D/C Central Line, Hanging Blood Products, TPN/PPN, Postural Drainage, Psychotherapeutic Interventions; all non-required) | Keeps the configuration-backlog story. |
| Skills with evidence in the current store | n/a | about 130 of 142 (the rest are listed but unattempted) | Long tail. |
| Sites | 2,141 (190 with active preceptors, 6 settings) | **scale down to 120** (6 settings, 40 with active preceptors) | No v2 screen lists sites; a 2,141 list needs virtualisation we do not have. 120 still supports "one stalled site" and "3 sites with stale requests". |
| Courses x terms | 22 x 5 = 110 offerings | **22 x 5 = 110 offerings** | 110 small rows cost nothing. |
| Evaluators | 403 (18 faculty, 6 lab instructors, 14 unverified) | **180** (150 preceptors, 18 faculty, 6 lab instructors, 6 other staff incl. the 5 hero staff) with **14 unverified** | Keeps all the story numbers except the raw size; no evaluator over 5% holds trivially at 180. |
| Placements | one per student per term | same, about 123 x avg 2.6 terms = about 320 rows | Cheap. |
| Evidence total | 8,879 | **8,879** in memory, never persisted whole (see 7) | The count is what makes charts honest; the cost is in persistence and selectors, which section 7 fixes. If a performance budget fails, a single `SEED_SCALE` knob (0.5) halves evidence and nothing else. |
| Counted | 8,366 | see 3.7: **8,031 counted + 360 did-not-qualify** (recommended) or 8,366 + 25 (golden) | See Q2: 25 is too few to draw an outlier rate. |
| Waiting | 404 | **404** (as skill requests; about 245 submissions) | Drives aging buckets. |
| Awaiting approval | 20 | **20** evaluations (about 14 queue items) | Reviewer queue. |
| Returned | 64 | **64** | Student "fix" lists, evaluator outlier. |
| Today | 2026-10-25 | keep `DEMO_TODAY` (seed.ts:23, currently 2026-10-19) unless Romit wants 2026-10-26/25. Changing it moves termShare (reports.ts `TERM` 2026-08-24..2026-12-11) from 51% to 58% and shifts every "days waiting". Q3. |

Tests currently assert 12 students and 31 skills [CODE store.test.ts:35, admin-actions.test.ts:63]; those become derived values, not literals.

---

## 3. (b) Entity-by-entity generation rules, mapped to current types

Notation: `types.ts:N` is the current type; "ADD" = a type or field that does not exist yet.

### 3.1 Determinism

- One PRNG: reuse `prng()` (mulberry32, seed.ts:34). One root seed `HGTC_SEED = 2026`. Each entity family gets its own derived stream (`prng(root ^ hash("evidence"))`), so adding a student never reshuffles evaluators.
- Ids are positional and stable: `stu-001..stu-123`, `ev-0001..`, never random. Hero ids keep their current ids (3.3).
- `createSeed()` stays synchronous and pure; same output every call (a test hashes the result).
- No `Date.now()`, no `Math.random()`. All dates via `daysBefore(n)` from `DEMO_TODAY` (seed.ts:25).

### 3.2 Skill (types.ts:108) and Specialty (types.ts:9)

- ADD `Specialty` member `"adn-hgtc"`. Load the 154 rows from the JSON (import the JSON at build time; do not re-type names).
- Map to `Skill`: `name` = JSON name, `category` = JSON `group ?? section`, `model` = `modelHint` mapped (demonstration -> "demonstration", question -> "question", scored -> "scored"; v2 has `binary` which the JSON does not use, so use binary for the 20 or so single-outcome skills like Height/Weight/Hand washing [INFER]), `configured` per the 142/12 split, `published` = configured and in the current course map.
- The O2 Administration and "Enemas (at least one)" groups need group semantics. v2 has none. ADD `Skill.groupId?`, `Skill.group?: { name; rule: "any" }` or a `SkillGroup[]` on `V2State`. Without it, "required group, any one" cannot be computed. [BUILD-PROMPT 5]
- Overlap with the 10 hand-written hero skills (seed.ts:122-132). Recommended: keep the hero skills **unchanged** (same ids `sk-iv-cath`, `sk-urinary-cath`, `sk-med-admin`, `sk-sterile-dressing`, `sk-vitals`, `sk-ng-tube`, `sk-blood-glucose`, `sk-handoff`, `sk-central-line`, `sk-pressure-injury`) because 94 references to `IDS.*` and about 40 tests rest on them, and **skip generating the 7 HGTC items they duplicate** (Start IV, Foley cath Insertion, ORAL, Sterile dressing, NG TUBE Insertion, Finger Stick Blood Sugar, Central Line Dressing Change). Net library for the ADN specialty: 147 generated + 10 hero = 157. Display names of the 7 duplicates stay the hero wording; add `Skill.hgtcId?` linking to the JSON id so reports can still say "Start IV". `sk-vitals`, `sk-handoff`, `sk-pressure-injury` have no HGTC twin; they are program-added skills (good: shows a program extending the starter list).
- Keep the other three specialties (radiography, surgical-tech, paramedic, 21 skills). Scenario step 1 precondition is "at least 28 skills in four specialties" [CODE scenario.ts:~46]; it still holds (157 + 21 = 178).
- Rule mix [BUILD-PROMPT 6] mapped to `SkillConfig` (types.ts:59): "met" -> `achievement.kind "count"`; "met with distinct evaluators" (Pulse, BP, Respirations; plus Apical/Peripheral) -> `distinctEvaluators: 2`; "level" (IV Therapy items, 6) -> demonstration model with `minLevelIndex` set (the current IV config does this, seed.ts:~108); "all Yes" (6) -> question model; "needs approval" (Sterile gloving, Sterile dressing) -> `approvalRequired: true` (types.ts:87, exists). Two build-prompt rule types do **not** exist in v2: `commentQualifies` (5) and `selfAttest` (1, CPR). Recommend: map `selfAttest` to a lab-setting binary skill with count 1 and mark it a documented gap; drop `commentQualifies` rather than add a type [INFER].
- v2 levels are program-defined, default 3 names (config.ts SAMPLE_LEVELS). The build prompt's 4 levels (Observed/Assisted/Supervised/Independent) are one program's choice [REQ: levels are program-defined, no fixed scale]. Keep v2's 3 for the hero IV skill; generated demonstration skills use the same 3 so `levelIndex` stays comparable.

### 3.3 Hero path that must survive (14 scenario steps and tests)

[CODE seed.ts:43 `IDS`] `stu-maya` (Maya Ferreira), `pre-delgado` (J. Delgado, RN), `lab-whitmore`, `adm-ross`, `rev-haddad`, `dir-brennan`, course `crs-nurs350`, skills `sk-iv-cath`, `sk-urinary-cath`. Also stu-02..stu-12 (named, with the `PLAN` table, seed.ts:263), preceptors Okonkwo/Castillo/Aldridge, 14 submissions (`sub-maya-1`, `sub-02..sub-15`), `ev-maya-1..8`, `ev-rem-1`, `ev-reopen-1`, `ev-rq-1`, the sync items `sy-1..3`, concern `cn-1`, remediation `rem-1`, `lc-maya-1`, log entries `log-maya-*`.

Rule: **hero overlay is hand-authored and byte-stable.** Build it exactly as today, then merge the generated cohort around it. Generated ids never collide (`stu-013+`, `ev-g-*`, `sub-g-*`). Hero students become members of Cohort 2027, in the current course offering, so Maya's `paceRows` row stays 6 of 12 collected, 6 expected [CODE seed-spread.test.ts:~38].

Hero constraints the generator must not break:
- Maya: `skillProgress` vitals achieved, urinary catheter counted 2, med admin counted 1 [CODE seed-spread.test.ts last case].
- `verificationsOf(s)` empty and `labBatches` empty at start (the 14 steps create them).
- Exactly one multi-version evaluation (`ev-reopen-1`) and exactly one stalled submission (`sub-03`) among the hero set [CODE seed-spread.test.ts "starting conditions"]. Generated data would break "exactly one": generated stalled requests need the new scoped assertions (see 8) or must be created in a separate named group the test filters out. Recommend the test assertion becomes "hero stalled = sub-03" and a second test asserts the generated stalled site story.
- Grace Tanaka (stu-11? per comment "Grace Tanaka and Ethan Cole have nothing pending", seed.ts:~255) and Ethan Cole must keep no pending items so their records can be verified in the director step.
- Hero evaluator weights: today no hero rater exceeds a third (seed.ts:248 comment). In the 180-evaluator world Delgado/Okonkwo/Castillo/Aldridge each fall below 2% of total evidence; the hero students' own histories still show them dominant, which is fine and realistic for a preceptor-student pairing.

### 3.4 Person (types.ts:16)

ADD to `Person`: `cohortId?`, `trackIds?: string[]` (students); `verified?: boolean` (evaluators, default true; the 14 unverified are `false`) [BUILD-PROMPT 4 `adopted`; REQ SL-08/lab instructors adoption]; `homeSiteId?`. Evaluator `kind` already has preceptor/lab-instructor; faculty are `reviewer`/`director` today, which also means "faculty evaluator" does not exist as a kind. ADD `"faculty"` to `Person.kind` or reuse `reviewer` and accept the overlap [INFER; recommend ADD].

Names: generate from two fixed name lists (about 120 first, about 120 last, culturally varied, all fictional, e-mail `@students.example` / `@hgtc.example`) so no real person is implied. Evaluator display `"<I>. <Last>, RN"` with credentials in {RN 80%, LPN 12%, NP 5%, other 3%}, years 1 to 25.
Unverified evaluators (14): a preceptor named by a student and never adopted [REQ: program must see and adopt unrecorded names]; each has 1 to 6 pieces of evidence, all `awaiting-approval` or `counted` with `verified: false` flagged on the item, so the "Unverified" overlay and the adoption action have rows [BUILD-PROMPT 6, J7].

### 3.5 Program, Cohort, Term, Course, Offering, Site

- `Program` (types.ts:29): `cohorts: string[]` stays; display "HGTC ADN". [INFER] Rename the school/program from "Harbor University / BSN" to the real college only if Romit approves publishing a real institution name in a demo; otherwise keep a fictional wrapper and use HGTC's skill list as a "published example". The skill names are public; people and sites are fictional either way.
- ADD `Cohort { id; name; graduates: string; studentCount }` x3. `Person.title` today holds "BSN 2027" as free text (seed.ts:~74); replace with `cohortId`, keep `title` as display.
- ADD `Term { id; name; start; end; current?: boolean }` x5: Fall 2025, Spring 2026, Summer 2026, **Fall 2026 (current, 2026-08-24 to 2026-12-11 matching reports.ts `TERM`)**, Spring 2027 (planned, no evidence).
- `Course` (types.ts:40) has a single `term` and `cohort` string. ADD 21 more courses and `CourseOffering { id; courseId; termId; cohortId }` x110. Replace `V2State.course` (types.ts:377, single) with `courses: Course[]`, `offerings`, and keep `course` as a **getter-compatible "focus offering"** (`courseId = crs-nurs350`) during migration so the 52 `s.course` read sites keep working; migrate them one screen at a time.
- 22 courses [INFER, titles to be confirmed with the nursing SME; only the codes marked * appear in the PDFs]: 8 clinical or lab bearing (NUR 101*, 120*, 150*, 162*, 201*, 220*, 221*, plus the hero NURS 350) and 14 didactic or co-requisite (e.g. pharmacology, pathophysiology, dosage calculation; codes and titles are drafted and must not be shown as HGTC fact). Didactic-only courses map a few "question" skills (teaching, documentation, rate calculation manual) and **no** clinical-setting minimums.
- Mapping (`MappingRow`, types.ts:123): per offering, map 18 to 60 skills as mandatory/optional/not-expected. Use the PDF's NUR hints in `courseHints`. A required HGTC item is mandatory in the offering where it is first expected and optional (not repeated) later. "Mapping is not eligibility" [REQ]: a student can log a skill not mapped to their course; generate about 3% of evidence on unmapped skills so this shows.
- `MappingRow` has no `termId`; mappings are per `courseId`. With offerings, ADD `offeringId?` (default: all offerings of the course) [REQ CM-08 is open: does mapping carry between terms; do not decide, make it overridable per offering].
- ADD `Site { id; facility; unit; setting; active: boolean; hasPreceptors }` x120 (6 settings: Inpatient med-surg, Emergency, Outpatient, Long-term care, Maternal-child, Skills and Simulation Lab). `Placement` (types.ts:244) has free-text `location`/`setting`; ADD `siteId`, `termId`, `offeringId`. `Program.clinicalSettings` (types.ts:35) stays the named settings list [REQ SC-11: counted per setting].
- Add `siteId?` to `Evaluation` and `Submission` so site roll-ups don't join through placements at 9k rows.

### 3.6 Placement (types.ts:244)

One per student per term. Cohort 2026 has 4 terms of history, 2027 about 3, 2028 about 1 to 2. Current term (Fall 2026) placement for every student whose cohort is in clinicals: 2026 all, 2027 all, 2028 about 70% (the rest are in lab/didactic only terms). Site weights follow a heavy tail (top 10 sites hold 35% of placements). **One stalled site** (see arc 3): site-087 has 9 placements this term and 0 completed requests in 18 days.

### 3.7 Evaluation (types.ts:156) and status mapping

Build-prompt status -> v2 representation (this is the key mapping):

| Build prompt status | Count | v2 representation |
|---|---|---|
| counted | 8,366 (golden) / 8,031 (recommended) | `Evaluation.status "counted"`, `outcome "met"` |
| didNotQualify | 25 (golden) / 360 (recommended) | `Evaluation.status "counted"` with `outcome "not-yet"` or `"not-met"`, **or** `outcome "met"` below the rule's `minLevelIndex` (skillProgress already reports this as "Met, but below the minimum level", student.ts:~104). 25 of the 360 are the level-shortfall kind. |
| awaitingApproval | 20 | `Evaluation.status "awaiting-approval"` (queueItems, queue.ts:65, groups by `submissionId`) |
| returned | 64 | `Evaluation.status "returned"` plus `Submission.status "returned"` with `returns[]` (types.ts:208) |
| waiting | 404 | **No Evaluation exists.** `Submission.status "with-evaluator"` or `"stalled"` plus `LogEntry` rows (types.ts:256). 404 skill-requests at 1.6 skills per submission is about 250 submissions. |

So the "8,879 evidence records" are 8,475 `Evaluation` rows + 404 waiting skill-requests. A shared counter `evidenceStatusCounts(s)` should produce the five numbers from `evaluations` and `submissions` so tests can assert the golden partition.

Outcome mix among counted: met 96%, not-yet 3%, not-met 1% (matches the existing mixed-outcome test, seed-spread.test.ts "mixes outcomes").
Settings: clinical 72%, lab 25%, simulation 3%. Clinical evaluations carry `clinicalSetting` from the site's setting; lab/simulation never do (an existing test enforces it; keep it).
Dates: spread over each student's enrolled terms; the current term holds 30% of all evidence; ages from 0 to 400 days.
`versions[]`: one version for 97%; two for the 3% that were returned or reopened (need `reason`). Keep `detail.feedback` text off the generated rows except the 20 awaiting-approval and 64 returned ones (it is the main size cost; omit elsewhere).

### 3.8 Submission, LogEntry, SyncItem

- `Submission` (types.ts:187): 404 waiting requests as about 245 `with-evaluator`/`stalled`; 64 returned as submissions with `returns[]`; about 14 `awaiting-review` for the 20 awaiting evals; `done` ones for the rest of counted evidence only where the evidence came through a request (about 30%; the rest were entered by an evaluator or imported). Do not create a Submission per Evaluation (8k submissions).
- `daysWaiting` drives aging (types.ts:195). Waiting-request ages: 0-3 days 40%, 4-7 25%, 8-14 22%, 15+ 13% (about 52 requests). The 15+ bucket concentrates on the stalled site and 3 unverified evaluators.
- `LogEntry`: one per waiting/returned/awaiting skill (about 500), plus lab practice trials (about 1,200) so the `practiceTrials` prerequisite works. Do not generate a LogEntry for every counted evaluation.
- `SyncItem` (types.ts:226): hero only (Maya's three). Generated students have no offline state; `V2State.device` is a single phone, i.e. the logged-in student's. Leave as is.

### 3.9 Remaining collections

- `ConcernFlag`: keep the one hero concern; add about 6 more (generated), visible faculty-only.
- `Remediation`: hero `rem-1`; add about 9 more (open or in-progress, a few closed) tied to real failed evaluations of the exact student and skill.
- `LabCheckoff`: one per lab-prerequisite skill per student who practised it (about 600). Lab instructors: 6, each below 5%.
- `Verification` (types.ts:343): **zero** at start (step 12 of the story creates them). Pre-verified graduating students would break the "verify" journey; instead, mark graduating students "ready to verify" (no pending items) for 28 of the 38.
- `AuditEntry`: hero 3 + about 40 generated (copied library, mapped skills per course, adopted evaluator). Audit does not scale with evidence.

---

## 4. (c) Distributions that make charts honest

All numbers are targets for the generator; section 6 turns them into tests. [INFER] unless tagged.

1. **Attainment spread.** Share of required units achieved (about 50 units; v2 course-scoped mandatory skills for the focus course):
   - Cohort 2026 (38, graduating): 31 complete, 4 blocked by exactly one required row (Hangs PB Med), 3 far behind (missing 4 or more required rows). With those counts the mean is about 97%, range about 66 to 100 (the earlier "mean 92%" cannot hold with 31 complete; corrected 2026-10-26).
   - Cohort 2027 (43, mid-program, focus offering NURS 350): mean 58%, range 15 to 90 (the existing test's band, seed-spread.test.ts "15 to 85 percent").
   - Cohort 2028 (42, first year): mean 28%, range 6 to 55.
   Overall range about 6 to 100; no cohort clusters at one value (min stdev 12 points within a cohort).
2. **Behind pace.** 8 to 12% of students behind the term clock under the existing definition (reports.ts `paceRows`/`PACE_MARGIN`): target 12 of 123 (9.8%): 9 in Cohort 2027 behind in the IV Therapy group, 2 in 2028, 1 in the Accelerated track.
3. **Long tail.** Evidence per skill is Zipf-like: top 12 skills hold 35% of evidence (Hand washing, Oral temp, BP, ORAL meds, Start IV, Foley, Sterile dressing...); median skill has 28 pieces; 25 skills have fewer than 5; the 12 unconfigured have 0. A scatter of "% attempted vs % achieved" must show a visible cloud plus about 10 outliers (attempted often, achieved rarely: Hangs PB Med, Rate Calculation: Device).
4. **Required vs optional.** Required leaves hold 55% of evidence (students do them first); optional skills 45%. In the focus offering: 4 mandatory + 3 optional kept (hero), and the 15 additional mapped skills are generated mandatory 40% / optional 60%.
5. **Per-evaluator concentration.** Evaluator evidence counts follow a heavy tail with the top evaluator at 4.6% and nobody above 5%; the top 10 together about 25%; at least 60 evaluators with 10+ pieces; 40 with fewer than 5. Replaces the existing "no evaluator over 30%" (seed-spread.test.ts) with "no evaluator over 5% and at least 100 distinct evaluators".
6. **Aging of waiting requests.** Buckets 0-3 / 4-7 / 8-14 / 15+ = 40% / 25% / 22% / 13% of the 404 (about 162 / 101 / 89 / 52). The 15+ bucket is where the "stale requests" arc lives.
7. **Returned and did-not-qualify rates by evaluator.** Population rate: returned 0.7% of evidence (64 of 8,879), did-not-qualify 4% (recommended). Three outlier evaluators are drawn with rate 3 to 4 times the mean on at least 40 pieces each (so the rate is not noise): one high returns, one high did-not-qualify (a strict evaluator, expected), one both. Reports' `SMALL_NUMBERS = 5` (reports.ts:250) suppression must still hide evaluators with fewer than 5 pieces.
8. **Unverified evaluators.** 14, each with 1 to 6 pieces; 3 of them hold waiting requests older than 8 days (J7).
9. **One stalled site.** site-087 (Skills and Simulation Lab excluded): 9 placements, 14 waiting requests all older than 15 days, 1 stalled submission per week. Two more sites have 4 to 6 requests older than 10 days (the "3 sites with stale requests").
10. **Lab vs clinical split.** Overall 25% lab / 72% clinical / 3% simulation. Skills with a hint of `clinical` (28) have 0 lab evidence counting toward their setting minimum, and some students have lab evidence on them anyway (so "lab does not satisfy clinical" has a visible row). About 20 students show a clinical-setting minimum short because their only evidence is lab [REQ].
11. **Didactic-only vs clinical skills by course/term.** Didactic and co-requisite courses map "question" skills only; clinical courses map the demonstration skills. A coverage matrix of required items x courses has at least 6 required items with no mapped course in some offerings (the "required with no likely course" nudge N-13, [BUILD-PROMPT 10]) and 3 mapped to two courses.
12. **Mid-term vs graduating.** Cohort 2026 evidence is 60% older than the current term; Cohort 2028 is 95% within two terms. A burn-up (achieved over weeks) per cohort shows a steep curve for 2026 flattening near 92%, and a slow one for 2028.
13. **Distinct evaluators.** For the 5 distinct-evaluator skills, 12 students have two sign-offs from the same person (progress shows "different evaluators 1 of 2") [REQ: distinct evaluators].
14. **Pace of evidence over the term.** 55-day window already used by the seed (daysAgo 54 to 3) preserved for the focus offering so weekly bars stay meaningful.

---

## 5. (d) Story arcs (each role's journey needs a real insight)

Each arc lists the data conditions and the selector that should reveal it. "Hero" = existing named people; generated people fill the rest.

| # | Role | Arc | Data conditions | How the product shows it |
|---|---|---|---|---|
| 1 | Coordinator / reviewer (L. Haddad) [BUILD-PROMPT 9 J4] | "9 students are behind in IV therapy and 3 sites have stale requests" | 9 students of Cohort 2027 with 0 or 1 of 7 IV Therapy items achieved while peers have 4+; their waiting IV requests sit at 3 sites (site-087 plus two); 12 of those requests are older than 15 days. | Home pace strip and weakest skills (home.ts `weakestSkills`, `paceStrip`) name the IV group; reports pace dots list the 9; aging stack shows 15+; the site roll-up (new) shows the 3 sites. Click-through goes to a student, then the site. |
| 2 | Director (Dr. Brennan) | "Graduating cohort: 31 of 38 complete, 4 one required row short, 3 far behind" | Cohort 2026: 31 of 38 complete; 4 have exactly one required item unmet, the same one (Hangs PB Med; about 2% of the required units, well under the form's 7% threshold), so they can graduate once it is signed; 3 of the 4 already have a waiting request for it; 3 more are far behind (arc 9). Separately, 10 of the 38 hold an open item (waiting, awaiting approval or returned request), so 28 are ready to verify. | Verification list (verification.ts) shows 28 ready, 10 blocked, with "what stops this" text from `pendingReasons`; reports show the least-achieved required item. |
| 3 | Reviewer (queue) [BUILD-PROMPT 9 J3] | "Queue with aged items and an outlier evaluator" | 20 awaiting-approval evaluations (about 14 items) aged 1 to 14 days; 5 of the 14 from one outlier evaluator whose approval-return rate is 3.5x; 2 items older than 10 days; 1 item with a self-rating that disagrees with the evaluator. | Queue sorted oldest first; compare view; reports rater table flags the outlier; returned count rises after the reviewer returns one. |
| 4 | Student (mid-term, Maya) | "One away from done, one stuck on a lab-only gap" | Maya stays exactly as seeded (6 of 12, on pace). Add a generated twin cohort: 6 students one sign-off from a skill, 5 with a returned request to fix, 4 with only lab evidence on a clinical-setting skill (will not count). | Student Home "next action"; Returned panel; setting progress "0 of 2 in Inpatient" with the "Lab does not count" note (student.ts `skillProgress` notes). |
| 5 | Admin (A. Ross) | "142 of 154 configured; 12 rare items in the backlog; changing a rule moves 18 students" | 12 unconfigured rare optional items; a rule edit on IV Therapy (raise distinct evaluators 1 to 2) flips 18 students from achieved to in progress (design the data so the preview number is not 0). | Skills library counters, configuration backlog list, the rule-impact preview (T1 audit: missing "this affects N students", [AUDIT T1]). |
| 6 | Preceptor (no login) | "Evaluator opens one email and sees 11 open requests across 7 students, 2 of them urgent" | Delgado hero keeps a small inbox; a generated evaluator (the busiest, 4.6%) has 11 open across 7 students including 2 older than 8 days. | Preceptor Requests page and the badge `evaluatorRequestsBadge` (selectors.ts:56). |
| 7 | Lab instructor (Whitmore) | "A batch of 24 students signed off in one grid; 3 absent" | Cohort 2027 lab session on IV start planned: 24 students without a lab check-off; the grid must handle 24+ rows. | Lab grid (lab.ts, `labStudents` = all 123 students today, lab.ts:69: needs scoping to the cohort/offering). |
| 8 | Unverified evaluator (J7) | "A name keeps appearing: adopt or merge" | 14 unverified, 3 with 8+ day-old requests, 2 that are spellings of an existing evaluator (J. Delgado vs Jon Delgado, RN) [REQ: avoid several spellings of one person]. | Approvals queue shows the unverified chip; adoption/merge action (does not exist yet). |
| 9 | Director (accreditation) | "7% rule: 3 graduating students need a lab return demonstration" | Of the 38 graduating, 3 are missing 4 or more required items (more than 7% of about 50) and will need the form's lab return demonstration. Hold the data, do not decide the policy (Q1). | Records / verification with a flagged reason. |

Arcs 2 and 9 are different groups, and together with the complete students they partition the 38: 31 complete + 4 missing exactly one item (arc 2) + 3 missing four or more (arc 9) = 38. (The first draft said 7 and 4, which summed to 42 with 31 complete.)

---

## 6. (e) Invariants and tests to write

Write them as `tests/v2/dataset-invariants.test.ts` using the real selectors, parameterised on the generator's counts, so they pass at any `SEED_SCALE`.

1. **One student count.** `students(s).length`, `s.people.filter(kind student).length`, director verification rows, reports `paceRows`, `heatmap rows`, home KPI "students" (home.ts:225), and `selectors.ts` COUNTERS "students" are equal for the unscoped view, and equal to the sum of cohort sizes (123). Scoped views equal the offering's enrolled count.
2. **Cohorts.** sizes 38/43/42, 14 in the custom track, no student in two cohorts.
3. **Verified record agrees.** For every student: `mandatoryProgress` achieved count == `paceRows.achieved` == heatmap row achieved == student Home skill-card achieved count == verified-record snapshot `skills` (when verified). Property test over all 123.
4. **Queue counts equal status counts.** `queueItems(s)` evaluation count == `evaluations.filter(awaiting-approval).length` (20) and `approvalsBadge` == `queueItems.length`; `COUNTERS.queueWaiting` == `submissions awaiting-review`; the five statuses sum to 8,879 and equal the targets (golden or recommended per Q2).
5. **Referential integrity.** Every `Evaluation.studentId/skillId/evaluatorId/siteId` exists; every `submissionId` exists; every LogEntry request exists; clinical evaluations have a `clinicalSetting` that is in `Program.clinicalSettings`; lab/simulation never do (existing rule).
6. **Distribution bands.** Attainment min/max per cohort; behind-pace count 8-12% of 123; no evaluator over 5%; at least 100 distinct evaluators; waiting-age buckets within +/-3 points; returned and DNQ outlier evaluators exist (at least 2 above 3x mean with 40+ evidence); 14 unverified; at least 25 skills under 5 pieces; exactly 12 unconfigured.
7. **Determinism.** `createSeed()` twice deep-equals; a stable hash of the JSON is pinned (changes on purpose only).
8. **Hero stability.** Hero evaluations, submissions and Maya's progress equal a pinned snapshot (replaces scattered literals).
9. **Rule engine rows.** For each rule type present (count, distinct evaluators, level, all Yes, approval, group any), at least one student at achieved and one at in-progress.
10. **Library.** JSON length equals the Skill count minus overlaps; every JSON id unique; 142 configured; names equal JSON names (no re-typing).
11. **Rendered text.** A sweep over all 123 students x all screens finds no `NaN`, `undefined`, `Infinity` [BUILD-PROMPT 13.1].
12. **Perf budget** (non-flaky, coarse): `createSeed()` under 400 ms; first `paceRows` + `heatmap` under 300 ms after warm-up [BUILD-PROMPT 13.4].

---

## 7. (f) Performance guidance (evidence from the code)

1. **Generation cost.** Generating about 9k plain objects is single-digit to tens of milliseconds [INFER]; the cost is not generation but what reads it.
2. **`createSeed()` is called three times at store construction and reset.** [CODE store.ts:73 `serverSeed = createSeed()`, :102 `reset()`, :107 `reload()`]. `getServerSnapshot` returns that first seed for SSR hydration. Make the heavy build lazy and cached: `createSeed()` returns the cached immutable base graph (frozen in dev) and `reset()` clones only collections the user changed. Do not rebuild 9k objects on every `reload()` (it fires on each storage event from another tab).
3. **localStorage persists the entire state on every update.** [CODE store.ts:61-68 `write` does `JSON.stringify({v, state})`, called from `update` at store.ts:98]. Measured today: 84,653 chars for 120 evaluations (388 chars each). At 8,879 evaluations the evaluations alone are about 3.4 M chars, plus about 0.3 M for submissions/logs/people, about 3.8 M chars total. That is close to the roughly 5 MB per-origin quota (browsers count UTF-16 units differently; treat anything over 2 M chars as unsafe) and `write` swallows quota errors silently (store.ts:65-67 comment), so persistence would quietly stop working and a reload would lose the user's J1/J2 changes. Also every click would serialise about 4 MB.
   Recommendation: **regenerate from seed and persist only deltas.** Envelope v4 = `{ v: 4, seedId, seedVersion, patch }`, `patch` = per collection `{ upserts: T[], removedIds: string[] }`. At write, diff against the base by reference identity (pure transitions in store.ts, queue.ts etc. spread arrays, so untouched rows keep their identity; this is an O(n) identity scan, not a deep compare). On `hydrate` (store.ts:89) rebuild the base then apply the patch. Bump `ENVELOPE_VERSION` (store.ts:5) and reject mismatched `seedVersion` so a generator change never mixes with stale deltas. Typical patch after the 14-step story is under 50 KB.
4. **Selectors are O(evaluations) per call and are called per student x per skill.** [CODE student.ts:65-72 `skillProgress` runs `s.evaluations.filter(...)` for every call; verification.ts:40-50 `mandatoryProgress` calls it per mandatory skill and filters evaluations again; reports.ts `paceRows` (about :270) calls `mandatoryProgress` for every student; `heatmap` (about :121) calls `heatCell` per student x skill; queue.ts:65-80 does `s.submissions.some(...)` inside a loop over awaiting evaluations (quadratic).] At 123 students x 100 skills x 8,879 evaluations a heatmap is roughly 110 M comparisons, likely 0.3 to 1 s [INFER]; that blows the 300 ms budget [BUILD-PROMPT 13.4]. Fix before the data lands, not after:
   - Build one index per state object: `WeakMap<V2State, Index>` with `byStudent: Map<studentId, Evaluation[]>`, `byStudentSkill: Map<"stu|skill", Evaluation[]>`, `bySkill`, `byEvaluator`, `submissionById`, `skillById`, `personById`. Because transitions return new state objects, a WeakMap keyed by `V2State` memoises for free and invalidates on change. Callers: `skillProgress`, `mandatoryProgress`, `countedEvaluations`, `queueItems`, `heatCell`, `skillOf/personName`.
   - Precompute one student x skill matrix per state (BUILD-PROMPT 5 "Precompute"): `progressMatrix(s)` returning the `SkillProgress` per cell lazily on first read of a row. Every screen reads that, never recomputes.
   - Keep `skillProgress` pure and signature-stable (31 tests call it); only its internals use the index.
5. **Lazy generation by role.** Student, preceptor and admin-library screens need the library plus one student's evidence; only reports/director need all 123. Split the base graph into `core` (people, library, courses, offerings, sites) and `evidence` built on first access with `memoize(() => buildEvidence(core, params))`. The static render of nav and shells must not trigger evidence generation (the SSR `getServerSnapshot` seed, store.ts:82).
6. **Rendering.** Heat grid renders every cell (heat-grid.tsx:101-107, `sorted.map` x `columns.map`): 123 rows x about 20 category columns is fine, 123 x 157 skills is about 19 k cells and is not. Keep the heatmap at category level with a skill drill-down, or virtualise rows. Lists over 50 rows (students, evaluators, skills, queue) need pagination or virtualisation; the repo has none (grep for virtual/paginate in components/v2 and lib/v2 found nothing).
7. **JSON import size.** The library JSON is about 150 KB with the provenance fields. Strip `source`, `inferredFields`, `requiredBasis` at build time for the shipped bundle, keep them in the knowledge file.

---

## 8. (g) Existing tests and screens that will break or need work

Tests (literals tied to the 12-student, 31-skill, 1-course world) [CODE tests/v2]:

| File:line | Assertion | Needed change |
|---|---|---|
| store.test.ts:35 | `people.filter(student)` length 12 | derive from cohort sizes (123) |
| admin-actions.test.ts:63 | `s.skills` length 31 | derive from library (157 + 21) |
| admin-actions.test.ts:196, :201 | mappings 10 then 9 | relative (`before + 1`, `before`) |
| reports.test.ts:56, :63, :286, :292, :294, :299, :305 | 7 skills, 4 mandatory, `att[0].students` 12, 12 pace dots | scope to the focus offering (4 mandatory stays if the hero mapping is untouched) and read the student count from the offering; dots length = enrolled count |
| reports.test.ts:152 | behind-pace is 5 | band 8-12% of enrolled students, or scope the hero 12 |
| reports.test.ts:180 | `ng.raters` length 1 (single-rater flag) | holds only if NG tube stays hero-only; generated students must not add raters to `sk-ng-tube`, or the single-rater story moves to a generated skill |
| queue.test.ts:32 | queue has 9 items | about 23 items (9 hero + 14 generated); change to `>= 9` plus hero-scoped assertions |
| queue-viz.test.ts:21, :23 | oldest queue item is 12 days | max age 14; assert hero item ages explicitly |
| queue.test.ts:108-117 | approve results (2 evaluations, 1 blocked) | stable if hero keys used, verify |
| seed-spread.test.ts (entire file) | 12 rows, 30% concentration, 8-12 queue items aged 1-12, 4-5 behind, exactly 1 multi-version evaluation, exactly 1 stalled submission | rewrite against sections 4 and 6; keep the Maya and starting-conditions cases hero-scoped |
| scenario.test.ts / scenario.ts:~184 | precondition "Twelve students hold evaluation history" (`s.people.filter(...)` check) | change text and check to "students hold evaluation history" and `>= 100` |
| scenario.ts:~46 | step 1 precondition "at least 28 skills, 4 specialties" | still true; verify `new Set(specialty).size` becomes 5 (adds `adn-hgtc`) and fix to `>= 4` |
| student.test.ts:167 | `w2.summary.mandatory` 5 | stays if hero mapping untouched |
| home.test.ts, coverage.test.ts | counts from `courseCoverage` and `homeKpis` | review: `homeKpis` counts all students (home.ts:225) |

Screens and selectors that assume one course or all-students:
- `V2State.course` (single) is read at about 52 sites in lib/v2 and components/v2 (coverage.ts, home.ts, lab.ts, queue.ts, reports.ts, record.ts, verification.ts, report-docs.ts, student.ts, admin-actions.ts, review pages, reports page, export sheet, student home, log flow, map-courses page). `NURS 350` appears in scenario.ts, seed.ts, selectors.ts:20-21 (counter labels), configure-wizard.tsx. `bsn-med-surg` is hard-coded in admin-actions.ts, starter-libraries.ts, log-flow.tsx, map-courses-page.tsx, types.ts:9 and store.test.ts.
- "Students" are `people.filter(kind student)` unscoped in lab.ts:69, reports.ts:154, selectors.ts:13, home.ts:225, verification.ts:163, and scenario.ts. All must become `studentsIn(scope)` (offering or cohort).
- Student mobile screens pick `STUDENT_ID = IDS.maya` (student.ts:11) with 119 references to `maya/STUDENT_ID`; a student switcher (build prompt "student picker") would need `studentId` threaded through, but it is optional for this change.
- The data-driven tables (library-table, review queue, verification list, lab grid, reports raters, heat grid) have no pagination or virtualisation. With 123 students, 157 skills, 180 evaluators, 14+ queue items: students list and lab grid (123 rows), library (178), raters (180) need pagination/virtualisation; the review queue (about 23) and stalled lists are fine.
- Legacy v1 code (`lib/seed`, `lib/store`, `tests/store`, `tests/ui`) has its own 12-student literals (tests/store/seed.test.ts, runtime.test.ts, tests/ui/shells.test.tsx). It is separate from v2; do not touch it with this change.

---

## 9. Risks

1. **PDF provenance.** Names are verbatim from the 9/2017 checklist; the build prompt's 153/18 comes from some other version. If Romit has `dataset.json` from the build-prompt authors, use its item names instead and treat the JSON here as a cross-check. 6 names are composed; 1 Mobility item is missing.
2. **Inferred fields look like facts.** `modelHint`, `setting`, `courseHints` and 5 required flags are mine. Keep the `inferredFields` markers until the SME signs off.
3. **Real institution name.** Using HGTC's name in a demo with invented people and sites needs a decision (Q4).
4. **Selector cost.** Without the index (7.4) the 123-student reports will freeze; this is the single biggest delivery risk, more than the data itself.
5. **Persistence quota.** Writing the whole state silently stops working at about 4 MB (7.3); the failure is invisible (`catch {}` in store.ts:65-67).
6. **Hero stability vs realism.** The hero 12 are hand-tuned to four mandatory skills; a real cohort has dozens. Keep them as an overlay and do not let generated data change their counts or the 14 steps break.
7. **Golden figures.** Several build-prompt golden numbers (153 items, 25 did-not-qualify, 403 evaluators, 2,141 sites) are deliberately not adopted; the deltas must be stated wherever the golden test is referenced.
8. **Policy tension.** Lab return demonstration (the form) vs lab never satisfies clinical [REQ]. Data should not decide it.
9. **Line drift.** About 70 files are modified in the working tree; all file:line anchors above may move.

## 10. Open questions for Romit

- Q1. Does a lab return demonstration under the 7% rule count toward required completion, or only unlock graduation? ([REQ] says lab never satisfies a clinical-setting minimum; the HGTC form allows a lab return demo.) Do not treat as decided.
- Q2. Did-not-qualify: keep the golden 25, or use about 360 so per-evaluator rates mean something (recommended)?
- Q3. `DEMO_TODAY`: keep 2026-10-19, or move to 2026-10-25/26?
- Q4. Show HGTC as the institution name, or keep a fictional wrapper around the HGTC skill list?
- Q5. Dedupe the 7 skills that overlap the hero library (recommended: keep hero names, link to HGTC ids), or rename hero skills to the HGTC names?
- Q6. Add `"faculty"` as an evaluator kind (recommended) or reuse `reviewer`?

---

## 11. Implementation status (T8, 2026-10-26)

Built: `lib/v2/evidence-index.ts` (WeakMap indexes), `lib/v2/generate-ref.ts` and `lib/v2/generate.ts` (the generator), `lib/v2/seed.ts` (`buildHero()` is the hand-written layer, `createSeed()` = `generate(buildHero())`), `lib/v2/hgtc-library.json` (the 154 rows with provenance fields stripped), `SEED_VERSION` bump and delta persistence (`store.ts`).
Tests: `tests/v2/dataset-invariants.test.ts` (section 6, items 1-11), `tests/v2/scale.test.ts` (item 12 and the storage size), `tests/v2/scale-render.test.tsx` (pages render at 123 students).

Deviations from the spec, on purpose:
- Did-not-qualify is 360 (Q2 recommended). The level-shortfall kind (Met below the minimum level, 25 rows on IV therapy rows) stays in the counted bucket, so the 360 are all counted, not met.
- Hero students (Maya, stu-02 to stu-12) also receive generated evidence, but only on HGTC rows the hand-written library does not hold. Their hand-written history is a byte-stable prefix of the seed (asserted).
- The four NURS 350 mandatory skills (urinary catheter, oral medication, sterile dressing, vital signs) are filled by a pace vector per student, not by the progress frontier, so the behind-pace count is exact (12 of 123) and independent of the required-row attainment.
- Lab evidence is supervised by lab instructors and faculty (23 people) so no one exceeds 5%.
- Returned, awaiting-approval and waiting items are given only to students outside the graduating cohort, plus 10 graduating students that hold one open request each (the 4 one short, the 3 far behind and 3 complete ones), so 28 of 38 graduating students have nothing open.
- Placements: 2026 four terms, 2027 three, 2028 two (not "about 70% in Fall 2026"), about 365 rows.
- Group rules `any` (O2 administration, enemas) are stored on `Skill.hgtc.groupRule` but not evaluated; `commentQualifies` and `selfAttest` are not modelled.
- Lab return demonstration (7% rule, Q1) is not modelled; the data stays neutral.
- Superseded by section 12: behind is no longer 12 (focus course); the generator's `BEHIND_TARGET = 12` now only shapes the four NURS 350 pace vectors.

---

## 12. Single sources and the 2026-10-26 data changes (consistency pass)

Romit's rule: "I don't want any inconsistencies in data or visual." One fact has one definition. Precisely (corrected 2026-10-26): no screen calls `facts()` directly; screens compute from the same source functions `facts()` wraps (the modules in 12.1), and the consistency gates enforce agreement (`tests/v2/consistency*.test.ts` compare screen models with `facts()`; `tests/lab/consistency.mjs` compares rendered lab numbers). Agreement is a tested property, not a structural guarantee. `SEED_VERSION` is now `2026-10-26.3`; the pinned fingerprint in `tests/v2/dataset-invariants.test.ts` was updated on purpose.

### 12.1 The single sources (all pure, no React, under `admin/lib/v2/`)

| Module | Defines | Read by |
|---|---|---|
| `filters.ts` | Report filters, `studentsIn`, `scoped` (RP-08), `findTerm` (term id, name or slug such as `fall-2026`; empty means current), `PACE_MARGIN`, `SMALL_NUMBERS` | `reports.ts` (re-exports), population, approvals |
| `population.ts` | `populationRows` (moved from `lib/lab/dashboard.ts`, which re-exports it), `requiredSets`, `requiredSkillsFor` / `requiredThisTerm`, `requiredToComplete`, `isReportable`, `mandatoryProgressFor`, `openRequests`, `populationTotals`, `graduationStageOf` | lab dashboard A to F, drills, lab student, director, v2 `reports.paceRows/behindPace/reportSummary`, v2 `verification.mandatoryProgress`, v2 `home`, v2 counters |
| `approvals.ts` | `heldState` (evidence from an unadopted evaluator name is awaiting approval), `approvalEntries`, `heldReason`, `approvalsInScope`, `approvalTotals`, `approvalsBadgeCount` | lab sidebar badge, v2 `approvalsBadge`, dashboard figure, B tab and drill, reviewer queue (`lib/lab/reviewer.ts`), v2 home, verification blockers |
| `placements.ts` | `PLACEMENT_ENDING_DAYS = 21` (decision D-X20), `placementStatus`, `daysLeftIn`, `placementsOf`, `placementsEnding` | lab student (N-03), facts |
| `facts.ts` | The number registry (`facts(state, scope)`), `EVALUATOR_KINDS` | consistency gates only (the dashboard imports `EVALUATOR_KINDS`, not `facts()`) |

### 12.2 What changed in the numbers

| Figure | Before | After | Why |
|---|---|---|---|
| Students behind (v2 reports, home, pace dots) | 12 (focus course NURS 350 only) | 28 of 123 | One method: each student against the mandatory skills of their own cohort's offerings in the term (the dashboard method) |
| v2 "mandatory achieved" | 66% (NURS 350 grid) | 49% (760 of 1,547 required-this-term records) | Same population |
| Maya on pace | 6 of 12 evaluations | 7 of 13 (5 mandatory skills this term) | Same population |
| Approvals badge (lab sidebar, v2 nav) | 19 (raw status items, all terms) | 35 in Fall 2026 (61 in all terms, 26 earlier) | One queue: status rows plus evidence held for unadopted names, grouped per evaluator and student, scoped by term |
| Dashboard "Awaiting approval" figure | 20 evaluations in 19 submissions, no term window | 35 submissions (41 evaluations) | Same queue and scope as the badge; the figure is submissions, the description evaluations |
| Waiting with evaluators | 252 | 251 | Director story answers one waiting request |
| Graduating students free of anything open | 28 of 38 | 29 of 38 | Same story |
| Evidence partition | dnq 360, waiting 404 | dnq 361, waiting 403 (total still 8,879) | Same story |

### 12.3 Awaiting approval, reconciled (current term, default scope)

41 evaluations in 35 queue entries = 20 stored "awaiting approval" rows (the SC-15 rule hold) + 19 held only because the evaluator name is not adopted + 2 paper forms with no outcome yet (counted as one each). Causes per entry: new evaluator name, rule needs approval, self and evaluator disagree, paper form to enter. Aging (8 or more days) is an overlay, not a cause. All terms: 61 entries, 67 evaluations (20 + 45 + 2).

### 12.4 New data

- **Placements** carry `startDate`, `endDate` (ISO, inside the term), `termId` and `offeringId`. Rotations are 4 to 8 weeks, Monday to Friday. In Fall 2026 about 30% have finished, 30% end within 21 days, 20% started in the last week, the rest are mid-rotation (separate PRNG stream `placement-dates`). Every student has a placement in every term in which they have clinical evidence. Maya: 4 West Aug 31 to Oct 9 (finished), Harbor Outpatient Clinic Oct 12 to Nov 13 (current, ends in 18 days). Likely-here skills come from the placement's own course; a finished rotation no longer makes a skill likely.
- **Hero layer (deliberate change)**: Maya has one returned submission (`sub-maya-2`, bedside handoff, returned by the reviewer for a missing date) and one did-not-qualify attempt (sterile dressing, Unmet), so "Fix a returned or did-not-qualify submission" and My requests demo for the hero. The hand-written layer is still a byte-stable prefix of the seed.
- **Director story** (moved from the director screen model into the generator): one one-short graduating student's waiting request answered Unmet (Oct 21), two complete records verified (version 1, Oct 2), one rule change on the busiest required-to-graduate skill (Oct 20, `state.ruleChanges`). Every screen sees it; `lib/lab/director.ts` only reads it.
- **Export fields (REQ RP-10)**: about 60% of generated clinical evaluations carry `self` (the student's self-evaluation: rating and note); about 8% of counted ones carry an approval `review` note; returned ones already carry the return note. Never on evidence from an unadopted evaluator name.
- **Deactivated skills** (`Skill.active === false`, SL-11, decision D-X14): two, excluded from every figure through `isReportable`.
- **Professional year** (decision D-X19): `Cohort.professionalYear` (current academic year) and `CourseOffering.academicYear` / `professionalYear`.

### 12.5 Two required sets (decision D-X12)

"Required this term" (mandatory on the student's current-term offerings; pace, behind, attainment, student progress) and "Required to graduate" (the list's required-before-graduation flag; readiness, one short, far behind at 4 or more missing per D-X11, verification). Both are named in `population.ts` and `glossary.md`; `tests/v2/consistency.test.ts` asserts no figure mixes them.

### 12.6 Gates

`tests/v2/consistency.test.ts` asserts every screen model returns the `facts.ts` value for four scopes (default, cohort, course, explicit term slug). `tests/lab/consistency.mjs` (Playwright) compares the numbers the lab screens render. Names stay in the generator pools so the realistic-data pass can swap them; to re-pin, run the fingerprint test, paste the new pair and bump `SEED_VERSION`.

## 12b. Round 2 (2026-10-26, later): writes through the shared store, approval rule, required-set basis

`SEED_VERSION` is now `2026-10-26.4`; the pinned fingerprint is `[4430892, 2533529944]` (changed on purpose, 12.7). Every fact in `facts.ts` is unchanged by the seed change (verified: 123 students, 1,547 required records, 760 achieved, 49%, 28 behind, 251 waiting, 35 awaiting approval in 41 evaluations, 20 stored and 19 unadopted, 14 unverified evaluators, 178 skills, 162 configured, 2 inactive, 52 required to graduate, 44 placements ending).

### 12.7 Rule holds sit on skills that ask for approval (SC-15)

Before: all 12 "Rule needs approval" submissions sat on skills whose `config.approvalRequired` was false, and the 6 skills that ask for approval held nothing, so Admin Approvals B printed "Not set" beside held counts.

- Medication administration (`sk-med-admin`) and point-of-care blood glucose (`sk-blood-glucose`) now ask for approval (`HERO_APPROVAL` in `seed-core.ts`, applied in `generate.ts`).
- Hand-written queue: `sub-07` (was vital signs) and the first skill of `sub-10` (was vital signs) are now blood glucose, with matching evaluator feedback. Every other hero hold was already on one of the two skills.
- Generated holds (`sub-g-043` to `sub-g-049` and any top-up): each held evaluation takes the next approval skill in turn (the 6 list skills and the 2 hero skills), keeping its student, evaluator, site, course and date. No extra random draw, so no other stream moved.
- Counted evaluations on an approval skill carry `review: { decision: "approved", note: "" }` (hero layer in `seed.ts`, generated layer in `generate.ts`), except evidence from an unadopted evaluator name, which `heldState` still holds. Review notes (non-empty) are unchanged.
- `approvals.ts`: "rule" is a cause only when a held evaluation sits on an approval skill (`heldByRule`); it is listed after any other cause, so the first cause and `byCause` are unchanged (new evaluator 19, rule 12, disagree 2, paper 2). The two "disagree" entries (both medication administration) now also list "rule", so Admin Approvals counts 14 rule-held submissions across 8 rules, all with the setting on.
- Gate: `tests/v2/approvals-rule.test.ts`.

### 12.8 Deactivate, reactivate and delete write the shared store (D-X14, D-X15)

- `admin-actions.setSkillsActive(state, ids, active, actor, at)` sets or clears `Skill.active` (audit entry, delta-persisted). The library (`components/lab/library/use-library.tsx`) and the retire screens (`components/lab/admin-b/use-retire.ts`) call it; skills added by hand in the tab stay in the lab overlay. Every figure goes through `population.isReportable`, so dashboard, attainment, director, drills and facts move together. Deactivating the most-required graduation skill drops `mandatoryRecords` by exactly the students it was required for and `requiredToGraduate` by 1; reactivating restores every fact exactly.
- Delete: `trackedAgainst(state, id)` counts evaluations plus requests, practice log entries and lab check-offs that name the skill ("as soon as there is data" [CALL 10-09]). `canDelete` in `lib/lab/library.ts` and `lib/lab/retire.ts` is `total === 0`; a mapping never blocks it. 51 seed skills have nothing tracked (14 of them are mapped, so their delete lists courses); one evaluation-free skill is blocked by a practice log entry. `deleteSkill` removes the skill, its mappings and any draft; the library row carries `unmapFrom` (course labels) and the delete confirmation lists them.
- Gate: `tests/v2/consistency-writes.test.ts` (every consumer against `facts` after the write, and after a store reload).

### 12.9 Reviewer decisions write the shared store

- `lib/lab/reviewer.ts commitDecision(raw, decision)` turns approve, return and adopt or merge into a store transition. It applies the decision on the held reading, then writes back only the rows the decision changed, so undecided evidence from unadopted names stays stored as counted (the 20 stored / 19 unadopted split stays honest). A correction request changes nothing in the store.
- `components/lab/reviewer/use-reviewer.ts decide()` writes through `lib/v2/react.tsx updateActiveV2Store` (the mounted provider) and keeps a session log only for what was decided on the tab (session key `lab.reviewer.decisions.v2`). The reviewer screens re-read the store immediately; other screens read it on load. `applyDecisions` is kept for the lab reading and the tests.
- Approving one submission moves the Approvals badge, the queue, the dashboard figure, the drill and the student's waiting count by exactly one, in the same session and after reload (`tests/lab/consistency.mjs` "Write" checks, `tests/v2/consistency-writes.test.ts`).

### 12.10 Required-set basis on Attainment, graduation bands on the director (D-X11, D-X12)

- `buildAttainment(state, scope, today, { basis })`: `"thisTerm"` (default, the dashboard records) or `"toGraduate"` (every student in the population x `director.graduationSkillsIn(scope)`, the director's own set). `REQUIRED_SET_OPTIONS` labels come from `REQUIRED_SET_LABEL`; `defaultRequiredSet` picks "Required to graduate" for the graduating cohort. Under the graduate basis the student "behind" flag is "far behind" (4 or more missing), never the term pace. For BSN 2026 the matrix equals readiness: 31 complete, 4 one short, 0 short, 3 far behind (`tests/v2/consistency-bases.test.ts`).
- Director: `graduationStage` per row and `graduation` (four bands) on the model; `STAGE_LABEL` and `LIST_LABEL` read `GRADUATION_STAGE_LABEL` and `UNMET_LABEL`. The three-column `Stage` stays for the current screens (see glossary "Graduation bands").
- Screens (later on 2026-10-26): the switch "Required this term | Required to graduate" renders on admin and director Attainment (`components/lab/admin-b/required-set-switch.tsx`, URL `set=term|graduate`, default from `defaultRequiredSet`), and the basis goes into `buildAttainment`. Under the graduate basis the matrix lists most missing first inside each cohort (order only). The director pipeline, dashboard B figures and the Attainment readiness line show the four bands from `graduation` / `graduationOpen`; their lists use `GRADUATION_LIST` (`short` = one short, `several` = 2 to 3, `far` = 4 or more; the `far` list is now strictly 4 or more, which changes no count because the 2-to-3 band is empty). Gates: `tests/lab/consistency.mjs` "Required to graduate" checks (readiness 31 / 4 / 0 / 3 = director matrix = admin matrix with `set=graduate`) and `tests/lab/director-bands.test.tsx` (a synthetic 2-missing row renders the Short band, its list length equals its figure).
- Display wording: a stored legacy "Not met" outcome label or self-rating shows as "Unmet" through `lib/v2/labels.ts outcomeWord` / `binaryLabels` (evaluator choices, lab grid chips, reviewer compare rows and "why held", export self-rating). Stored data is unchanged. `initialsOf` skips credentials ("S. Okonkwo, RN" gives SO).

### 12.11 Smaller fixes

- v2 heat grid (`reports.heatmap`) lists only the population the summary counts (`populationScopeOf`), so a course no cohort takes this term shows 0 rows and 0 students, not 123 rows.
- Wording: lab outcome and status maps read `lib/v2/labels.ts` (`OUTCOME_LABEL` Unmet, `EVALUATION_STATUS_LABEL`, `REVIEW_DECISION_LABEL`, `OVERLAY_LABEL`); the director reports' "Not met" columns read "Unmet". `tests/lab/wording.test.ts` greps `lib/lab` and `components/lab` string literals for "Not met", "Waiting for approval" and "items".
- Evaluator expired sample: the link was sent 15 days before the demo day, so it reads "Expired Oct 25", not a date after the demo day (`lib/lab/evaluator.ts`).
- `lib/lab/director.ts` dates and plurals delegate to `lib/v2/format.ts`.

## 13. Realistic but fictional data: the pools and how to swap them (2026-10-26, decision D-X23)

`SEED_VERSION` is now `2026-10-26.5-realistic`; the pinned fingerprint is `[4922963, 3762884294]` (re-pinned on purpose). Every fact in `facts.ts` is identical before and after, in seven scopes (default, cohorts BSN 2026 / 2027 / 2028, course NURS 350, term slugs fall-2026 and spring-2026), and the evidence partition is unchanged (8,031 / 361 / 20 / 64 / 403). `tests/v2/realistic-data.test.ts` pins the default-scope registry.

### 13.1 Where everything lives

All names and free text are in `admin/lib/v2/pools.ts`. `generate.ts` and `generate-ref.ts` hold no names; they read the pools positionally (index arithmetic, no random draws), so a pool change moves no PRNG stream and therefore no count, distribution or story.

| Pool | Feeds | Notes |
|---|---|---|
| `INSTITUTION` | Student and staff mail domains (`students.harbor.example`, `harbor.example`), student numbers (`S2024-0412`: entry year = graduation year minus 2), 3 campuses (Port Halsey SC, Marlow SC, Sandhaven NC), 6 programs | Non-nursing program course lists are catalog reference only, not in the state (the 22 x 5 offerings stay fixed) |
| `COURSE_SEEDS` | The 22 courses | NUR 101, 120, 150, 162, 201, 220, 221 are real HGTC card columns. **Titles are [INFER]**: the HGTC skills card prints numbers only, and the HGTC catalog could not be fetched (2026-10-26). `legacyId` keeps the 5 renamed didactic courses on their old ids (`crs-phm110` and so on), so URLs, mappings and tests are untouched |
| `HERITAGE`, `HERITAGE_CYCLE`, `namesFrom` | 111 generated students, 172 generated staff | 7 heritage pools (Anglo incl. Irish, German, Italian; Hispanic; Black incl. West African; East and Southeast Asian incl. Filipino; South Asian; Arab; Eastern European), a cycle of 20 weighted like a US nursing cohort, one name in six cross-paired (families, Anglicised and hyphenated surnames). Full names are unique; hero names (`RESERVED_NAMES`) are never reused; hero surnames (`RESERVED_SURNAMES`) are kept off evaluators so the only "same surname" merge suggestions are the deliberate ones |
| `CREDENTIAL_FORMS`, `FACULTY_CREDENTIALS`, `LAB_CREDENTIALS`, `*_TITLES` | Evaluator display names ("Courtney Norwood, MSN, RN"), credential tokens, titles ("Preceptor, Osprey Inlet Medical Center", "Clinical faculty, Marlow campus", "Lab instructor, Port Halsey campus") | The tokens the qualification rule reads (RN, LPN, NP) are always kept; the base credential still comes from the same `people` stream draw, so eligibility is unchanged |
| `UNVERIFIED_TYPED`, `NICKNAME` | The 14 unadopted names | Typed forms (no credentials, initials, a hyphenated surname). Slot 0 is "Jon Delgado, RN" (merge target: J. Delgado, RN); slot 1 is a nickname spelling of an adopted preceptor at the same site ("Javi Espinoza" for Javier Espinoza), so `mergeCandidates` has two real merges |
| `HOSPITALS`, `HOSPITAL_UNITS`, `OUTPATIENT`, `LONG_TERM_CARE`, `LABS` | The 120 sites | 18 fictional hospitals in fictional SC and NC towns host the inpatient, emergency and maternal-child units (hospital x unit pairs taken diagonally, never repeated); 22 outpatient facilities (clinics, dialysis, infusion, home health, school nursing, public health, ambulatory surgery with PACU), 9 long-term care and hospice facilities, campus labs and one regional simulation center. Setting counts are untouched (Inpatient 69, Outpatient 31, Emergency 10, lab 10). Site location = "Facility, Unit"; main-campus labs carry their room name ("Skills lab 2") |
| `HERO_SITES` | The hand-written places | The busiest matching active sites that are not story sites become "Harbor General, 4 West", "Harbor General, 5 East", "Harbor General Emergency Department" and "Harbor Outpatient Clinic", so the hero evaluations, placements and preceptors link by site id while keeping their exact strings |
| `FEEDBACK_*`, `SELF_NOTES`, `APPROVAL_NOTES`, `RETURN_REASONS`, `CONCERN_NOTES`, `REMEDIATION_*`, `PRACTICE_RATINGS` | Evaluator comments, self-evaluation notes, approval and return notes, concern notes, remediation steps | Comments are composed (a strength plus, often, one coaching line; shortfall text for not-met): 171 distinct strings over about 2,570 comments, none above 5% |
| `REAL_SYSTEM_DENY_LIST` | Test guard | Real health-system names (Mayo, Cleveland Clinic, Kaiser, HCA, Johns Hopkins, Prisma Health, MUSC, Atrium, Novant, McLeod, Tidelands, Grand Strand, Conway Medical and others) must not appear in any facility, unit, location or title |

### 13.2 What changed in the data (names only, plus three links)

- People: names, emails, titles, credential display; new `Person.studentNumber`. Hero people are unchanged except that the four hero preceptors gain `homeSiteId` (Delgado 4 West; Okonkwo and Aldridge 5 East; Castillo the outpatient clinic) and hero students gain a student number.
- Sites: facility, unit, location, and new optional `Site.city`, `Site.state`, `Site.facilityType`. Ids, settings, `hasPreceptors`, the stalled site (`site-087`, now "Pine Hollow Medical Center, Neuro 7 North") and the stale sites (`site-023` Ashby Point Hospital, Surgical Step-Down; `site-056` Briarwood County Health Department, Immunization clinic) are the same records.
- Hand-written placements gain `siteId` for their named place. `Program.locations` lists the hand-written places plus every site with preceptors (42 in all), and every evaluation names a listed location (asserted).
- Lab evidence and practice trials name the instructor's own lab (faculty: a campus lab) instead of a single "Skills lab 2".
- About 30% of generated evaluations without feedback gain an evaluator comment (positional: 3 of every 10).
- `lib/lab/student2.ts evaluatorsFor` matches evaluators to the placement by site record (same facility as the preceptor's `homeSiteId`); title text is only the fallback for a typed location that names no site.
- Story students (the one-short student whose request was answered, the two records verified on Oct 2) are chosen by id, not by name, so swapping a pool can never change who the story is about. This picked different students than the old name order did (`stu-g-004` and `stu-g-005` are now the verified records); every count is unchanged. The `dataset-invariants` "verification snapshot" case now skips records already verified, and `record.test.ts` checks that no comment text (rather than the word "feedback") reaches the PDF.

### 13.3 How to swap the data

1. Replace the arrays in `lib/v2/pools.ts`, keeping their shapes and at least today's lengths (outpatient pairs at least 31, long-term care pairs at least 16, 10 labs, hospitals x units at least the inpatient count). The unique-site test fails if a pool runs short.
2. Keep emails on a reserved `.example` domain and run `npx vitest run tests/v2/realistic-data.test.ts`.
3. Run `tests/v2/dataset-invariants.test.ts`: only the fingerprint should fail. Paste the new pair into `PINNED`, bump `SEED_VERSION` (saved deltas from the old seed are then discarded), and confirm `facts(createSeed())` is unchanged.

### 13.4 What is still not realistic, and why

- NUR course titles are inferred (13.1). Confirm with the nursing SME before showing them as HGTC fact.
- Cohort labels stay "BSN 2026 / 2027 / 2028" and "ABSN 2027" although the skill list is HGTC's ADN card: the labels are the scope keys in URLs, filters and about 60 test assertions; renaming them is a separate, deliberate change.
- Clinical groups stay "Group A / B / C" (same reason).
- The hero layer keeps its initial-style names ("J. Delgado, RN") and its place names; generated staff use full names. "Harbor General" is fictional here, but a historical Los Angeles County hospital once used that name: a known residual.
- Other programs (radiography, surgical technology, paramedic) exist only as catalog entries and as the hand-written specialties; they have no students or offerings, because the facts registry fixes 22 courses x 5 terms.
- Fictional town names may coincide with real places elsewhere; no real organisation is attached to a problem story.

## 14. Oct 26 call: three levels, custom groups, clinical courses first (SEED_VERSION 2026-10-26.6-levels-groups)

Source: `design/granola-2026-10-26-updates.md` items 9 to 11 `[CALL 10-26]`. All three are position-based post-passes in `generate.ts` (no PRNG draw, so nothing else shifts). Every fact in `lib/v2/facts.ts` is unchanged; `tests/v2/consistency-levels.test.ts` proves it for every term x cohort x group and every course scope.

| Change | Data | Rule | Counts |
|---|---|---|---|
| Three per-course levels | `MappingRow.level`: `mandatory`, `recommended`, `optional`, `not-expected` | `splitNonMandatory`: within each course, the 1st, 3rd, 5th... non-mandatory row (mapping order) is recommended, the rest optional. Mandatory untouched | 38 mandatory, 250 recommended, 244 optional, 1 not expected (533 rows, as before) |
| Custom group fields | `Person.enrollmentYear`, `Person.enrollmentCategory` | `withEnrollment`: the year of the cohort's first enrolled term; every 7th student in a cohort (position) re-entered a year earlier; every 4th is Hybrid, else Day. Graduation year is the cohort's | 45 students enrolled in 2025 (BSN 2026 plus re-entries), 29 Hybrid |
| Course type | `Course.kind` (already present): 9 clinical, 13 didactic | Didactic courses carry no mandatory skill, so "Clinical only" (the default) leaves "Required this term" identical | 22 courses, 110 offerings, unchanged |

Group values: a program group name (`Group A`, any cohort), a track (`trk:<id>`), or a custom group (`cg:cat=Hybrid&enr=2025&grad=2027`); `lib/v2/filters.ts` `inGroup`. Sample custom group: "Enrolled in 2025" (`SAMPLE_CUSTOM_GROUPS`). What changes on screen (not facts): "Likely here" now reads mandatory and recommended only (1,768 to 1,159 skill records across students; placements with the ending nudge stay 43), and the N-13 line counts clinical courses (13 required skills in no Fall 2026 clinical course; 12 with didactic included).

### 2026-10-26.7-level-words (UX critique: one level vocabulary)

The assisted level reads **With assistance** (`ASSISTED_LEVEL` in `lib/v2/config.ts`), as the configure preset says it, in place of "Works with prompts" (`SAMPLE_LEVELS`, `PRACTICE_RATINGS`, Maya's practice trials and self-evaluation in `seed.ts`). Verified: the seed JSON before the change, with "Works with prompts" replaced by "With assistance" (353 occurrences), equals the seed after, byte for byte; the facts registry, the approvals row count and the dashboard KPIs are identical. `SEED_VERSION` is `2026-10-26.7-level-words`; the pinned fingerprint is `[4928768, 897679549]`.

The lab's seeded "Clinical skills checklist" minimum total is no longer a fixed 120 of 154: `dataMinTotal` in `lib/lab/lists.ts` takes the median total of the students in its groups who already have every required skill (84 in the reference data), so BSN 2026 shows 17 of 38 meeting the rule and the earlier cohorts, still short of the 52 required skills, show 0. This is lab-only state; no fact changes.
