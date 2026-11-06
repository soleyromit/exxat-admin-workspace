# Admin workflow map: from the requirements to pages, tasks and tests

Status: design proposal, not reviewed, nothing built. One recommended design per page. Written 2026-11-04.
Copy used: worktree `sc-scale`. Supersedes nothing until Romit agrees; the conflicts in section B say what it would change.

**Changed 2026-11-05 (Romit, "go"; ledger D-L88 to D-L94).** Romit rejected part of the approved spec. The labels "Program default" and "Own settings" are replaced throughout this document. Why: "Own settings" was a label an agent invented, found in neither the requirements nor the calls; one Status held two separate facts [REQ SL-02, IM-09, SC-01]; and evaluation fields sat read-only in the edit panel with a link to another page. What replaces them: Status is only Active or Inactive; Configuration is a separate field reading Default configuration, Edited or Not configured; every evaluation setting is edited in the panel and saved by its one Save changes. Rewritten: D0, D1, D1a, D4, section F (Edit a skill, Per-skill settings, new Library tasks). Corrected: sections A, B, C, D1b, D2, D3, E, G. Sources read in raw: Granola 365abc25 chunks 2 and 16 (Nov 4), e72ea925 chunk 7 (Nov 2).

Tags: `[REQ id]` requirements document. `[CALL date Lnnn]` raw transcript, line of the extracted text file. `[LEDGER D-x]` decisions ledger. `[INFER]` this document's reasoning.
Transcript keys: `11-04 pre` Sankalp and Romit before the review (`sankalp-precall.txt`). `11-04 rev` stakeholder review (`nov4.txt`, speaker labels unreliable). `11-02` Sankalp, Vaibhav, Romit. `10-28`, `10-26` Sankalp and Romit.

**The whole design in five sentences.**
1. A program adds skills to one library, in any of four ways, and nothing else is asked at that moment.
2. It sets how skills are judged once, on one plain settings page; every skill uses that the default until someone edits it. Times needed is the common per-skill difference and is edited in the library table or the panel.
3. Clicking a library row opens one edit panel. That panel is the whole editing workflow for one skill: name, description, category, tags, status, times needed and every evaluation setting, saved by one Save changes. *Amended 2026-11-06 (D-L115): the panel keeps quick edits; evaluation setup for one skill is a full page, D1c.*
4. A whole skill list is assigned to student groups; a change to a list on anyone is a new version.
5. Course mapping is optional, per offering, with two views; a coverage view is the end state.

**Five decisions needed from Romit** (recommendation first, detail in section B): B1 the default, B4 which levels count, B6 cloning and OD-01, B7 mapping levels, B9 walkthrough stops and the end state.

---

## A. How the document was read

### A1. Library, import, configuration, mapping, engine

Page key: LIB Library. EDIT edit panel. BULK bulk edit. ADD add sheets. UP bulk upload. START starting points. SET Evaluation settings. BULK also covers Configure N skills (D4). CAT Categories and tags. LIST Skill lists. ASSIGN Assign. MAP Course mapping. OTHER outside this flow.

| ID | Plain meaning | Page and task that delivers it |
|---|---|---|
| SL-01 | The program defines the library; Prism supplies no standard list | LIB empty state; START conflict, see B8 |
| SL-02 | A skill has name, description, active or inactive | ADD create; EDIT change; LIB status column |
| SL-03 | Own categories; at most one per skill; optional | ADD, EDIT, BULK category field; CAT manage |
| SL-04 | Own tags; any number; span categories. Later copy of the document adds "Tags are optional" | ADD, EDIT, BULK tag field; CAT manage |
| SL-05 | Create a category or tag at the moment it is needed | Category and tag pickers in ADD, EDIT, BULK |
| SL-06 | Only active ones can be assigned; a deactivated one stays visible on the skill until removed | Pickers; EDIT shows "Inactive" on the chip; CAT deactivate |
| SL-07 | Program list of clinical settings | OTHER Settings > Clinical settings; read by EDIT minimums |
| SL-08 | A lab instructor can be recorded with a name and email, no account | OTHER Settings > Evaluators |
| SL-09 | A name a student types can be adopted, so spellings do not pile up | OTHER Approvals > New evaluators |
| SL-10 | Search and filter by name, category, tag, status | LIB toolbar |
| SL-11 | Deactivating withdraws from mapping, student selection and reporting; evidence stays | EDIT and LIB menu: Deactivate, with a dialog of counts |
| IM-01 | Create skills in bulk from an existing list | ADD several (phase 1); UP (later) |
| IM-02 | Accept spreadsheets, Word, PDF | UP |
| IM-03 | No template or column order | UP. Sankalp floated a template on 11-02; the requirement wins, see B13 |
| IM-04 | Find skills, descriptions, headings, written criteria | UP review step |
| IM-05 | A proposal: edit, rename, merge, split, discard, add before anything is created | UP review step |
| IM-06 | Check against the library; skip, replace or keep both | UP review step; ADD flags possible duplicates |
| IM-07 | Headings may become categories, under review | UP review step |
| IM-08 | What could not be read is listed with its original text | UP review step; ADD several line check |
| IM-09 | Imported skills are unconfigured and marked; they cannot be mapped or submitted | LIB Configuration column; MAP and student selection exclude them. Conflict with the call, see B1 |
| IM-10 | See how many still need configuring and work through them | LIB banner with the count; its action applies the Configuration filter (D1) |
| IM-11 | Repeatable; tell which skills came from which import | LIB column "Came from" (off by default) and filter |
| IM-12 | One skill by hand stays available | ADD one |
| IM-13 | Nothing created without human confirmation | UP confirm; SET save dialog is the confirmation for inheritance, see B1 |
| IM-14 | Copy one skill's configuration or apply to several | BULK "Configure N skills", start from a skill |
| IM-15 | Whether reading a file proposes a model: open (OD-12) | UP stops at skills and descriptions until decided |
| SC-01 | Creating and configuring are separate | ADD asks nothing about evaluation |
| SC-02 | Exactly one model, chosen explicitly, no default assumed | SET nothing preselected; EDIT any skill, nothing preselected when it has no settings. See B1 |
| SC-03 | Binary: two program labels, which one qualifies, both required and different | SET, EDIT rows for this model |
| SC-04 | Question and scored: the program defines the question set | EDIT questions (per skill, see inheritance rule 5) |
| SC-05 | Question rule: all Yes, at least N of M, or a named subset | SET rule kind; EDIT named subset. See B3 |
| SC-06 | Rule must be satisfiable; usable with many questions | SET and EDIT validation; subset picker with search |
| SC-07 | Scored: program scale; average, minimum on every question, or total | SET, EDIT rows for this model |
| SC-08 | Demonstration: program levels, ordered, no fixed three | SET, EDIT level rows. See B4 |
| SC-09 | Criteria limited to what the model produces; changing the model rebuilds them | SET, EDIT: rows change with the model; save dialog lists what is cleared |
| SC-10 | Demonstration: total and a minimum at each level | Total: Times needed. Minimums: EDIT |
| SC-11 | Any skill can need a minimum from named clinical settings, per setting | EDIT minimums |
| SC-12 | Lab or simulation never satisfies a setting minimum | Engine rule; EDIT minimums offer clinical settings only |
| SC-13 | What the student supplies: label, type, mandatory | SET "Student adds"; OD-04 open, see B2 |
| SC-14 | Evaluator feedback always capturable; mandatory set per skill | SET default; EDIT any skill |
| SC-15 | Per skill: self-evaluation first; approval before it counts | SET default; EDIT any skill |
| SC-16 | Which evaluator roles may sign off each skill | SET default; EDIT any skill |
| SC-17 | The chain model, evidence, rule, achievement is apparent | SET and EDIT: rows appear beneath the model they depend on; rule sentence on EDIT |
| SC-18 | Unsatisfiable configuration cannot be saved | SET, EDIT: Save shows problems and focuses the first |
| SC-19 | Review everything asked of student and evaluator together, before use | SET and EDIT "Preview" dialog |
| CM-01 | Offering = code and name, term, academic year, professional year, cohorts | MAP row data |
| CM-02 | Find offerings by search, cohort, term, academic year, professional year | MAP search and Filters |
| CM-03 | Mapped skill is mandatory or non-mandatory for that offering | MAP level control. See B7 |
| CM-04 | For any offering, how many mapped and how many mandatory | MAP By course: figures on each offering |
| CM-05 | Expectation, not eligibility; unmapped evidence counts | Student side; MAP says nothing that implies a block |
| CM-06 | Level can differ between offerings for one skill | MAP per-offering rows. See B6 |
| CM-07 | One record per skill; any course counts | Engine; no MAP control |
| CM-08 | Set per offering; carry forward open (OD-01) | MAP; "Copied from" seam. See B6 |
| AE-01 | Only completed evidence counts | Engine |
| AE-02 | The current rule decides, so a rule change re-applies to evidence held | SET, EDIT save dialog names who changes. See B10 |
| AE-03 | Achieved only when every criterion is met | Engine; rule sentence on EDIT |
| AE-04 | Four states | Student and report pages; not on setup pages |
| AE-05 | One record per skill across courses | Engine |
| AE-06 | Labels and levels are presentation; renaming changes no evidence | SET, EDIT: rename has no impact dialog |
| AE-07 | Removing a question or level removes it from any rule | SET, EDIT: removal updates "Levels that count" and minimums |
| AE-08 | Report the two "not achieved" states apart: open (OD-03) | Not touched here |

### A2. What the later sections impose on admin setup

- **ST-05, ST-06, ST-07:** clinical settings and placements must exist or fall back to the full list. Setup offers them but does not block on placements.
- **ST-08:** roles allowed on a skill can leave a student with no valid evaluator. SET and EDIT should warn when a role choice has no recorded person of that role [INFER]; the student is told why either way.
- **ST-10, ST-11:** fields and self-evaluation set here are enforced at submit, so a preview must show them [REQ SC-19].
- **ST-01, CM-05, ST-02:** students see expected skills per course, but must be able to submit any active configured skill. So mapping and lists never hide a skill from selection.
- **EV-03, EV-05, EV-06, EV-07:** the evaluator form is generated from this configuration; feedback rule and approval rule travel with it. Each skill's rule must resolve to one answer at send time, which is what the inheritance model guarantees.
- **AR-01 to AR-06:** approval on means a queue exists. Evaluation settings approval changes who appears in Approvals. Approval row always shown [LEDGER D-L3].
- **RV-03, RV-05:** nothing on a setup page may edit a completed evaluation. A rule change re-judges under AE-02; it never alters a record.
- **SH-03, SH-05:** the failed-rule sentence and per-setting progress are built from the rule, so the question rule cannot be a free "final result" [see B3].
- **RP-01, RP-03, RP-04, RP-08:** category, tag, clinical course, setting are report dimensions, so they must be real data here, not free text. Reports read one list at a time [CALL 11-04 rev L184] [LEDGER D-L63].

---

## B. Conflicts

**Rule used:** requirement over call, unless the initiative owner states the document should change. Any OD or PENDING item below is marked NEEDS ROMIT; nothing here decides it.

| # | Document says | Later source says | Recommendation | Status |
|---|---|---|---|---|
| **B1** | Imported skills are created unconfigured [REQ IM-09]. No default assumed [REQ SC-02]. Nothing created without confirmation [REQ IM-13]. Ledger: new skills stay Not configured until an explicit Apply [LEDGER D-X44, D-L55] | Romit proposed, Sankalp agreed: with central settings, no skill shows Not configured; it shows "the default", editable [CALL 11-04 pre L741-747]. Told to Aarti: one setup, every added or uploaded skill uses it, per-skill rare [CALL 11-04 rev L28]. Paste only names [CALL 11-04 pre L779-785] | **Follow the call, narrowly.** The product still ships no default: before the program's first save every skill is Not configured and IM-09 holds. The first save is a human confirmation for all skills (dialog with counts). After that a new skill uses the the default at once and the banner says so. The status word "Program default" proposed here was replaced on 2026-11-05 by a separate Configuration field reading Default (D-L89). Ask Sankalp to amend IM-09 and SC-02 wording (still owed, D-L90). Reverses D-L55 and part of D-X44 | Decided: D-L72, amended by D-L89, D-L90 |
| **B2** | Whether submission details have a program-wide default is open [REQ OD-04] | Program-level settings already hold them [LEDGER D-X41]; "what the student will provide" is central [CALL 11-02 L431] | Keep "Student adds" on Evaluation settings, per-skill additions in the edit panel. Note that the build already leans on an open OD | **NEEDS ROMIT** (OD-04), low risk |
| **B3** | Question model has Yes or No answers and SC-05's three rules. No final result [REQ 4.1, SC-05] | Lab label "Questions, then a final result" (`lib/lab/configure.ts:104`) from [CALL 10-26 L93]. Sankalp now: drop the final result; a preceptor could give zero on every question and still approve; result must derive from the answers [CALL 11-04 pre L673-695] | **Remove the final result.** Label "Questions". Requirement and latest call agree. Trajectsys-style final form stays out unless a client asks [CALL 11-04 rev L18] | Recommend, no OD. Tell Romit |
| **B4** | Levels are ordered; minimum at each level [REQ SC-08, SC-10]. Engine holds one threshold | Sankalp: three checkboxes, one per level, select any; if two are selected either counts [CALL 11-04 pre L517-523]. Romit: checkboxes, no "Any level", show the rest [LEDGER D-L51], built as linked threshold. Romit told the group it becomes checkboxes [CALL 11-04 rev L29]. Sankalp's list includes the lowest level; D-L51 leaves it out | **Keep D-L51 linked checkboxes.** Levels are ordered, so a gap (lowest and top, not middle) has no real use [INFER], and independent levels mean an engine change and contradict SC-10's ordered minimums. Confirm with Sankalp that leaving out the lowest is right | **NEEDS ROMIT** |
| **B5** | Mapping marks mandatory or non-mandatory [REQ CM-03]; requirements never mention "required to graduate" | Sankalp: remove it; any skill on a student's list is needed to graduate [CALL 11-04 pre L61, L331] [LEDGER D-L54, D-L62] | **No conflict with CM-03.** List membership is "what must be achieved"; Mandatory is "where". Already removed. Director verification scope stays open | Recommend, record |
| **B6** | Set per offering; carry-forward open [REQ CM-08, OD-01]; level may differ by offering [REQ CM-06] | Aarti: map at offering level; cloning carries the set; edit on an offering, the next clone carries the edit; no fall, spring thinking; think of cloning from version one; cloning is not on the mapping page [CALL 11-04 rev L137-162]. Ledger: "one row per course and cohort; its level sets all of them" [LEDGER D-L65], and it keeps OD-01 open | **Ask Sankalp to close OD-01 as "carries through cloning".** Until then the page only shows "Copied from". **Reverse the D-L65 write-across:** a row is one offering, default filter current and upcoming terms, older ones behind Filters. Offering-level thinking is what Aarti asked for; writing a level across five offerings at once is the opposite of "edit this offering, the next clone carries it" | **NEEDS ROMIT** (OD-01, D-L65) |
| **B7** | Two values [REQ CM-03] | Three: mandatory, recommended, optional [CALL 10-26] [Glossary]. Two plus unmapped: optional need not be mapped [CALL 11-02 L461-467]. Told to Aarti as mandatory, recommended, optional [CALL 11-04 rev L82]. PENDING [LEDGER D-X43] | **Two levels, Mandatory and Recommended, plus Not mapped.** Recommended is the non-mandatory value. The student's course page already lists "all other skills". Also: [CALL 11-02 L467] says mandatory means must be done in that course; the engine must not enforce that [REQ CM-05, CM-07] | **NEEDS ROMIT** |
| **B8** | Prism ships no skills or taxonomy [REQ SL-01, 1.6, 1.7] | Starter library from Exxat with domain champions and Sarah [CALL 11-04 pre L33] [CALL 11-02 L93-123]; shown to Aarti, no objection [CALL 11-04 rev L11]. Kept as editable starting point [LEDGER D-X5] | Keep as Later, opt-in, copied into the program's own library, fully editable, never loaded by default. Ask Sankalp to amend SL-01 | Flag, open |
| **B9** | No requirement on walkthrough order. Ledger: eight stops ending in Setup summary [LEDGER D-L64, D-L39, D-L32] | Sankalp: do not show Setup summary, every step changes it, there is no one summary; the coverage graph is the good part [CALL 11-04 pre L763-775]. Coverage view removed as delegated [LEDGER D-L61]. Configuration per skill is rare [CALL 11-04 rev L28] | **Five stops** (section C). Setup summary off the path and out of the panel; Coverage returns as the third view on Course mapping and is the visible end state D-L32 asked for. Configure the skill and Categories and tags become side steps | **NEEDS ROMIT** (his own D-L32, D-L64) |
| **B10** | The current rule re-applies to evidence [REQ AE-02] | "Apply to new evidence only" is PENDING [LEDGER D-X27] | **Do not offer it.** REQ is explicit. Impact dialog names who changes | **NEEDS ROMIT** (PENDING) |
| **B11** | Configuration happens per skill [REQ section 3, SC-14, SC-15, SC-16] | Set once at program level; only times per skill [CALL 11-02 L427-435] [LEDGER D-L30] | **Default, editable on any skill in its panel** (replaced the wording "Program default with per-skill own settings" on 2026-11-05, D-L91). REQ stays met because any skill can differ. Already [LEDGER D-X41] | Decided: D-L82, amended by D-L91 |
| **B12** | No requirement on student groups as a feature (built 2026-11-05: Settings, Student groups) | Sankalp: page must have one reason; "Create a group" on Assign should go [CALL 11-04 pre L443-469]; student groups belong in the student module [CALL 10-28 L43] [CALL 10-26 L103]; but Prism has no groups today, and Aarti expects them [CALL 11-04 rev L121] | **Remove the button from Assign.** Assign has a text link "Manage student groups" that opens Settings > Student groups, labelled in lab notes as a student-module feature. Cohorts are always available | **NEEDS ROMIT** (new Settings section) |
| **B13** | No template [REQ IM-03] | Template or AI upload [CALL 11-02 L111] | Requirement wins; AI reading stays Later [CALL 10-26 L67] | Recommend |
| **B14** | Boundary with competencies open [REQ 1.4, OD-02] | Skills and competencies as one entry, two sections, each with Setup and Review [CALL 11-04 pre L233, L255, L639, L805]; Vishakha prefers the library in Standards [CALL 10-28 L23]; Vaibhav wants one place [CALL 11-02 L535-575]; Aarti accepts separate entities, optional mapping [CALL 11-04 rev L172-179] | Use Sankalp's entry, one place, section C. Competency mapping as a Later row. OD-02 itself stays open | **NEEDS ROMIT** (OD-02), low risk for Nov 23 |
| **B15** | Forms: none. Leadership: full width, no white space [LEDGER D-L5, D-X30]. Romit picked summary layout [LEDGER D-L50] | Romit now: Evaluation settings is global and should be far simpler (task brief, 2026-11-04) | Full-width label and control rows meet D-X30 without an aside. Removes the Summary card, which repeats every value and breaks "say it once". Supersedes D-L50 | Confirm with Romit |
| **B16** | Category optional [REQ SL-03] | No categories means a plain list; do not even say "no category" [CALL 11-04 pre L785]. Glossary: "No category" group | Flat list while no skill has one. Once any skill has one, the rest group under "No category" [INFER] | Recommend |
| **B17** | Only configured skills can be mapped [REQ IM-09] | Only configured skills can join groups [CALL 10-28 L161]. Picker offers all, marks Not configured [LEDGER D-L60] | Keep D-L60. REQ limits mapping and submission only; a list may be built before settings exist | Recommend |
| **B18** | Four models required [REQ 4.1] | Brief says Scored is "Proposed" (from [CALL 10-26]) | Scored is required. Fix the brief | Doc fix |

**Not designed, still open, do not treat as settled:** patient logs as an evidence source, discipline by discipline [CALL 11-04 rev L30-48] and [CALL 11-04 pre L303]; exposure counts versus assessed skills [CALL 11-04 rev L3, L188-194]; signature only without scoring. No control for these on Evaluation settings. Aarti wants known variations accounted for [CALL 11-04 rev L40], so the first section ("How skills are judged") is where a future method would sit [INFER]. A student listed against a course that mandates a skill not on the student's list is an open edge case [CALL 10-28 L39].

---

## C. The admin journey

### C1. Where it sits in Prism

Per Sankalp: one entry, two sections, each with Setup and Review [CALL 11-04 pre L233, L255]. Prism's look is a later task for Nov 23 [CALL 11-04 pre L553, L801]. The lab's Skills panel stays the stand-in [LEDGER D-L20].

```
Prism dashboard
 +-- Skills and competencies
      +-- [ Skills ]                [ Competencies ]
           Setup                     Setup   (existing, unchanged)
             Library                 Review  (existing, unchanged)
             Evaluation settings
             Categories and tags
             Skill lists  (who a list is assigned to is in its panel, D-L106)
             Course mapping
             Competency mapping  (Later)
           Review
             Approvals
             Reports
```
Lab mapping: sidebar row Skills opens the panel with these Setup rows; Approvals and Reports stay sidebar rows [LEDGER D-L20]. Setup summary row is removed (B9). Faculty quick check-off lives in the course view, not admin setup [CALL 10-28 L65-69].

### C2. Stages, from an empty program to ready

```
 1 Add skills -> 2 Set how they are judged -> 3 Adjust exceptions -> 4 Make a skill list
      -> 5 Add students to the list, in its panel -> 6 Map to courses (optional) -> 7 Check coverage
```

| # | Stage | Entry point | Admin knows on arrival | Finishing state | What comes next |
|---|---|---|---|---|---|
| 1 | Add skills [REQ section 3] | Skills > Library, empty state or Add a skill menu | Has a list somewhere | Skills in library. Configuration reads Not configured if no settings yet, else Default | Banner: "Set how skills are judged" if no settings; otherwise none |
| 2 | Set how they are judged [CALL 11-02 L431] | Banner action, or panel row Evaluation settings | Program's usual way of judging; a number | Saved; dialog confirmed for N skills; all show Default | Banner: "Saved for N skills." with action "Open the library"; "Settings saved." when the program holds no skills yet (D3) |
| 3 | Adjust exceptions (optional) | Library: times cell, row click, bulk bar | Which skills are harder | Numbers changed; few skills Custom | Stays in library; panel row Skill lists is the next job |
| 4 | Make a skill list [CALL 11-04 rev L99-133] | Skill lists, New skill list | Which skills this generation of students must achieve | Named list with skills, on the table. First list is default | Banner action "Assign to student groups" |
| 5 | Add students [CALL 11-04 rev L121] [365abc25 ch 9] | Skill lists, the list's panel (D-L106) | Who gets it: student groups, a filter or individual students | Groups and students saved against the list | Banner names who got it, with "See Skill lists". Course mapping is the panel's next row, not offered here (2026-11-05, 365abc25 ch 9) |
| 6 | Map to courses (optional) [CALL 11-04 rev L172] | Course mapping, By skill or By course | Where skills are expected | Offerings carry levels | Coverage view |
| 7 | Check coverage [CALL 11-04 pre L775] | Coverage view on Course mapping | Wants to see it is complete | Each group shows list, skills, mapped, in no course | Done. Student sees the list on My progress |

**Ready [INFER]:** a student group is ready when it has a live list and every active skill on it is configured. Course mapping is not part of ready [CALL 11-04 rev L172, L186]. **Receiver cue:** a student in that group sees the list on My progress, and on a course page when that course has mapped skills [CALL 11-04 rev L206] [LEDGER D-C]. *2026-11-05 (D-L102):* My progress's total and "N of M" read the list, one at a time; a student on two lists gets two tabs; a student on none gets a plain message and can still submit. Course mapping says where each can be done.

### C3. An existing program returning

| Job | Entry | Path | Ends |
|---|---|---|---|
| Fix a skill's name, category, tags, number | Library row | Edit panel, Save changes | Same row, updated, banner |
| Add one new skill | Library, Add a skill | Sheet. Uses the default. It is on no live list | Library. Filter "On no list" shows it. To require it: New version of the list |
| Change how skills are judged | Evaluation settings | Edit, Save, dialog names who changes | Same page, banner |
| One skill differs | Library row | Edit panel, change the setting, Save changes | Panel stays open, Configuration reads Custom |
| Retire a skill | Library row, Deactivate | Dialog with counts | Row Inactive. Evidence kept [REQ SL-11] |
| New accreditation version | Skill lists, row menu, New version | Not assigned yet: add or remove skills, Add students for new groups, turn on "New student groups get this list" | Older groups stay on their list [CALL 11-04 rev L109, L123] |
| New term | Course cloning, outside these pages | Offering arrives with "Copied from" | Edit on Course mapping if needed; next clone carries it [CALL 11-04 rev L150-151] |

### C4. Walkthrough stops

**Keep, in this order (four stops, 2026-11-05, D-L106; Assign was the fourth of five):**
1. **Library.** Sankalp starts here [CALL 11-04 pre L27]; requirement order [REQ section 3].
2. **Evaluation settings.** Second, because skills must exist to see what they inherit [CALL 11-04 pre L725] and a data team usually loads the list first [CALL 11-04 pre L733].
3. **Skill lists.** The list exists before it can be assigned [CALL 11-04 pre L403], and it is assigned in the same panel, a required step [CALL 11-04 rev L186].
4. **Course mapping.** Last for today's scope [CALL 11-04 pre L263]; holds the By skill, By course and Coverage views.
Next on stop 4 continues to the student path, as today [LEDGER D-L67].

**Side steps, reached from the page's own controls, path bar stays:** from Library: Add a skill, Add several, Bulk upload (Later), Starting points (Later), Edit a skill, Configure N skills, Categories and tags.

**Remove from the main path:**
| Stop today | Why |
|---|---|
| Categories and tags (stop 2) | Created at the point of need [REQ SL-05], so a stop before settings teaches a step nobody must do |
| Configure the skill (stop 4) | Rare by design [CALL 11-04 rev L28]; on the path it reads as a required per-skill step, which was Sankalp's confusion [CALL 11-04 pre L87-125] |
| Setup summary (stop 8, removed 2026-11-05) | B9 |

Rename "Paste several" to "Add several", matching the menu. Next never lands on a page whose first state needs an unseen choice [CALL 11-04 pre L125].

*Note added 2026-11-05 (recommendation; Romit may overrule).* **The student path that continues this one.** Seven stops follow one student, Maya Ferreira, on My progress variant 1 (D-L110): My progress, Skills by course, Self-evaluation, Send for evaluation, Evaluation form, Skill progress, Faculty check-off. Side steps keep the bar: Log a skill (from Skills by course), Email to the preceptor (from Send), My requests and My evaluations (from Skill progress), and **Fix or further attempt** (from My progress), so Do this next's Fix and send and Make a further attempt stay on the path. Its bar reads "Fix or further attempt, 1 of 7", Back returns to My progress, and Next goes on to Skills by course (D-L114). One name covers both, since the page does both jobs. A course opened from My progress reads stop 2 whatever the course, while Next on stop 1 still opens NURS 350 on Nasogastric tube care (D-L114).

---

## D. Page specs

### Research behind these specs (Mobbin, looked at the images)

| Topic | Looked at | Took | Did not take |
|---|---|---|---|
| Edit from a list | [Midday edit product flow](https://mobbin.com/flows/d60afbb5-fb08-40f5-ad17-f7c129b628bd), [QuickBooks edit account](https://mobbin.com/screens/25b0cce3-7fe8-494e-bf65-019c9457dd46), [Supabase add row](https://mobbin.com/screens/6e009d03-f48a-4093-bee4-2511b99cf707) | Row opens a form directly in a side panel; list stays visible; Cancel and Save at the panel foot; active status inside the same panel | Midday's single button with no Cancel |
| View then edit | [Midday customer](https://mobbin.com/screens/924969bd-edd1-476d-ad75-70e9a457d480), [Airwallex role](https://mobbin.com/screens/20f6cf65-6657-48c5-8ab9-448a58540679), [Twenty](https://mobbin.com/screens/f35fbc4f-bfd5-4092-931a-c6712aee8650) | Grouped sections and links to related records | A read view plus a separate Edit step: this is the extra step the lab has today |
| Full page editing | [Webflow edit product](https://mobbin.com/flows/b7ac09a3-72f8-4e97-a131-71b05dc18076), [Airtable record](https://mobbin.com/flows/5a70815c-55ea-485b-aad9-abb70995de4b) | Cancel and Save top right on a long page; breadcrumb context | Webflow's three column list plus form |
| Bulk edit | [Pipedrive](https://mobbin.com/screens/1c70f25d-7816-4204-a257-c5c4309dcb0c), [Toggl Track](https://mobbin.com/screens/cdf93e6c-3f61-42bc-a8d9-3874484a3a9d), [Twenty confirm](https://mobbin.com/screens/5a6c89c6-2c27-4a65-8814-d354f7c760b9), [Mixpanel](https://mobbin.com/screens/ff8d9a88-a673-4c00-848a-906504d01225), [ClickUp](https://mobbin.com/screens/e9639493-e0a6-46c9-93d1-d3189cbdc3c7), [Shopify](https://mobbin.com/flows/01bbff1e-4f2f-4d87-a12c-f96443a1e86b), [Square](https://mobbin.com/screens/43d138cb-1bed-4cbb-b35a-0d6e613c4945) | Pipedrive's "Keep current value" on every field in a side panel; selection bar with few actions; confirm naming the count | Shopify and Square editable grids: a second table for a job a panel covers |
| Global settings | [Obvious](https://mobbin.com/screens/5653c579-2eb5-423a-8626-1d28b63d82cd), [Langdock](https://mobbin.com/screens/40db7825-65cf-4d6d-a6e5-398ee9d4ebc7), [Unify](https://mobbin.com/screens/29fc6dd6-e213-47e8-b484-f0b74cbe8eef), [Dovetail](https://mobbin.com/screens/ca7212b7-d03c-4d0c-909d-80205d3cac16), [Navattic](https://mobbin.com/screens/64162cf6-5ef1-4a83-abbc-e9a1422d6395) | Plain rows, label left, control right, thin dividers, no cards in cards, no summary beside the form | Per-section Save buttons; descriptions under every label (D-L34); toast "Saved" |
| Inherit and override | [Cursor "Use installation default"](https://mobbin.com/screens/a1caf968-ed6d-49fc-b754-f92f0ceedc33), [Churnkey](https://mobbin.com/screens/9abc8a58-37f1-456f-9864-9ef060f15c43), [GitLab](https://mobbin.com/screens/1208b9fc-c774-445b-8e1e-35c762c0c1f8) | The default has a name in the value itself; "Show overrides only" filter; "Reset to default" | Reset per field: too fine for this model |

Everyday analogy for inheritance: a company leave policy. Everyone gets it, a few named people have their own terms, and the policy page does not list every employee.

### D0. Status, configuration and inheritance (used by every page below)

*Rewritten 2026-11-05, D-L88 to D-L94.* A skill carries two separate facts, in two separate fields. Neither word ever appears in the other's column.

**Status** says whether the skill is in use [REQ SL-02, SL-11].

| Status | Meaning | Action beside it |
|---|---|---|
| Active | In use | Switch in the panel header; Deactivate in the row menu and bulk bar |
| Inactive | Withdrawn from mapping, student selection and reporting scope; evidence kept [REQ SL-11]; still editable (D-L93) | Switch in the panel header; Reactivate in the row menu |

**Configuration** says where the skill's evaluation settings come from [REQ IM-09, SC-01].

| Configuration | Meaning | Action beside it |
|---|---|---|
| Default | Uses Evaluation settings as saved [CALL 11-04 Granola 365abc25 chunk 16] | Custom, in the segmented control on the Configure one skill page (D1c) |
| Custom | The skill has its own settings, chosen with Custom on its page (D-L97, D-L115; "Edited" until 2026-11-05) | Default, in the segmented control on the Configure one skill page (D1c) |
| Not configured | Only in two cases: (a) before the program's first save of Evaluation settings; (b) the skill's model needs questions and the skill has none (D-L90) | Set how skills are judged (a); Add questions (b) |

**Can be mapped and submitted against** only when Status is Active and Configuration is Default or Custom [REQ IM-09, SL-11]. Not configured wins the Configuration word: an Custom skill that lacks questions reads Not configured, and still offers Use default configuration [INFER].

**Display (rewritten 2026-11-05, D-L97).** Plain text for what is normal: Default in muted text, Active in plain text. `StatusBadge` with glyph, word and tone only for the exceptions: Custom (`info`), Not configured (`warning`, amber, never red), Inactive (`neutral`, on a muted row) (D-L94) [INFER on tones]. So the exceptions stand out and the table has no wall of grey chips.

**Inheritance rules, checkable one by one:**
1. Prism preselects nothing and ships no model. Until the first save every skill is Not configured [REQ SC-02], except one the admin has configured in its own panel, which is Custom [INFER].
2. The first save opens a dialog naming the count. Confirming is the human confirmation [REQ IM-13].
3. After that, a skill added by any path is Default at once; the result banner says so (B1). If the program's model needs questions, it is Not configured until it has them. No skill is a standing exception: IV catheter insertion, Central line dressing change and Patient handoff to emergency department are ordinary skills, with no special case in logic or data (D-L90).
4. The package, inherited as one: how skills are judged, labels or levels, levels that count, scale and rule kind, student fields, self-evaluation, roles, feedback, approval, group check-off. They can differ on a skill only under Custom (D-L91, D-L97).
5. Always per skill and never changing the Configuration word from Default to Custom: Times needed value, minimums at each level [REQ SC-10], setting minimums [REQ SC-11], the questions themselves [REQ SC-04]. Under Default they sit in the group "For this skill" on the page (D1c), so a skill can differ there without becoming Custom (D-L97, D-L115). Rule 4's list is what Custom counts; rule 5's list is not, because Times needed is the expected difference from skill to skill [CALL 11-02 Granola e72ea925 chunk 7] and Custom has to stay rare (D-L94) [INFER].
6. Times needed: a skill follows the program's number until someone changes it. Changing the program's number updates those that follow; changed ones keep theirs, and the dialog says how many. It is always editable, on every skill, including skills that are Not configured and skills that are Inactive (D-L92, D-L93).
   *Added 2026-11-05 (recommendation; Romit may overrule).* A skill keeps its own number by a mark, not by comparing values (`Skill.ownNeed`). A skill whose number has come to match the program's still keeps it, and still counts under "different number" and in the dialog's "keep their number". Typing the program's number on a skill that differs from it is the way back to following.
7. Evaluation setup for one skill is on its full page (D1c). *Amended 2026-11-06 (D-L115, reversing in part D-L91 and D-L97):* the page's segmented control "Evaluation settings" has Default and Custom. Choosing Custom is one click: it copies the package into the form as live controls in four sections, and nothing changes until Save changes. Choosing Default shows the read-out, keeping the Custom draft while on the page [INFER]; Save changes applies it with the dialog of rule 9. The panel edits Times needed and details only. Later program saves do not touch a Custom skill; its whole package stays as saved, and the save dialog counts it as keeping its settings [INFER: the earlier detached copy stays underneath; it is no longer so named].
8. Changing the model rebuilds what depends on it [REQ SC-09]: the dialog lists what is cleared. Going back to Default applies the same rule when the default's model differs.
9. Every save that changes achievement names the students whose progress changes [REQ AE-02] before it applies, including a Times needed number saved from the table cell (D-L92). Renames do not [REQ AE-06]. An Inactive skill is outside reporting scope, so its saves name nobody; its Reactivate dialog names them instead [INFER].
   *Added 2026-11-05 from the engine.* What each kind of save does to a student, so the dialog and the student's page say one thing. A skill that stays usable re-applies its rule to the evidence held [REQ AE-02]: evidence with answers or scores is read by the new rule, and any other evidence by the outcome the evaluator recorded (`qualifiesOn`). So Independence level to Approved or not approved moves nobody unless a level rule was filtering, and the dialog says so by having no students row (2026-11-05: the row shows only when at least one student changes; a zero is never printed). A skill that goes Not configured has no rule that can qualify anything: its evidence is kept and listed [REQ RV-05, SH-01], and counts for nothing until the skill is configured again, when the rule re-applies [REQ AE-02, IM-09] [INFER]. The dialog names the students who held qualifying evidence (`progressLost`). Their Skill detail reads 0 of the times needed, Did not count, "Your program has not set this skill up yet.", with no action to send.
10. Status and Configuration move independently. Deactivating or reactivating never changes Configuration; editing never changes Status.

*Note added 2026-11-05 (D-L96, recommendation; Romit may overrule).* **The program's question set.** Under Questions or Score on a scale, Evaluation settings holds a question set [REQ SC-04: "the program defines and maintains the question set"]. Every skill on the default configuration that has no questions of its own takes that set, and follows it while it still holds the set the program last saved, as Times needed does (rule 6). A skill can edit its own in the panel, which does not make it Custom (rule 5); a skill with its own keeps them, and the save dialog counts it. A named subset goes with the set. A skill with its own questions keeps its own choice, else the program's named questions it also has, else all of its own, so the rule stays satisfiable [REQ SC-06] [INFER]; "at least N" and a total are capped to what its own set reaches [INFER]. A new skill takes the set at once. This narrows case (b) of Not configured: it remains only for a question model with no questions, which Evaluation settings refuses, so in practice only for a skill's own panel. Rule 3's "If the program's model needs questions, it is Not configured until it has them" reads accordingly. Replaces "questions are written on each skill" in D3.

*Note added 2026-11-05 (recommendation; Romit may overrule).* **The question set keeps by a mark too.** "Follows it while it still holds the set the program last saved", above, was a comparison of values, the same bug as Times needed: a skill with its own questions that once matched the program's set took the program's next set and silently lost its own [REQ SC-04]. A skill now keeps its own questions by a mark (`Skill.ownQuestions`), set at a program save for any skill holding a set that is not the one the program had, whichever values it holds afterwards. A skill with none, or with the set the program last saved and no mark, follows. Giving the skill the program's set in its panel is the way back. A model that uses no questions clears the set and the mark. The save dialog's "Own questions, N keep their own" reads the same test, so its count holds through a match and past it.

*Note added 2026-11-05 (build T7).* A program save can still push a skill to Not configured when its own part cannot meet the new settings: a setting minimum with lab instructor as the only role, minimums above the times needed, or more different evaluators than times needed [REQ SC-18]. The dialog names each reason. This is a third case D-L90 does not list, kept because SC-18 forbids an unsatisfiable rule. Open for Romit.

**Still owed:** Sankalp to amend the wording of IM-09 and SC-02 (D-L72, D-L90). Until then this is a recorded deviation, not a changed requirement. Hard stops unchanged: Prism ships no model and preselects nothing; completed evaluations are immutable; minimums are per skill [REQ SC-10, SC-11]; a skill's own questions stay its own [REQ SC-04].

**Sample data (D-L94):** about 12 of 178 skills start Custom, so the exception looks like an exception. The three skills of rule 3 start as Default [INFER]. The walkthrough skill Nasogastric tube care is Custom, because the seed gives it self-evaluation alone (D-L68) [INFER].

### D1. Library

Requirements: SL-02, SL-03, SL-04, SL-10, SL-11, IM-09, IM-10, IM-11, IM-14, AE-02.
**Job:** find any skill and act on it, in a list of 150 or more.

```
Skills > Library
Skills library                                          [More v] [Add a skill | v]
(at most one banner, for example: 178 skills not configured. [Set how skills are judged])
[All 178] [Active 176] [Inactive 2]              Search  Filters  Columns  View
+-----------------------------------------------------------------------------------------+
| [] Skill                   Times needed  Category      Configuration          Status  ... |
| v Basic skills (23)                                                                     |
| [] Blood pressure              [ 3 ]     Basic skills  Default                Active  ... |
|    #vitals #first-year                                                                  |
| [] Nasogastric tube care       [ 3 ]     Basic skills  (Custom)               Active  ... |
| [] Oral temperature            [ 2 ]     Basic skills  Default                (Inactive) .|
+-----------------------------------------------------------------------------------------+
          when selected:  [ 3 selected  Configure 3 skills  Edit 3 skills  Deactivate 3  x ]
```

**The tabs are Status and nothing else:** All, Active, Inactive, each with a count. Configuration is its own column and its own filter, so that one control never mixes two facts [INFER: Romit decided the two fields; the tab set is this document's reading of it]. (In the sketch, brackets in round form are badges; plain words are plain text, D-L97.) Tabs [Not configured] and [Custom] are gone; both are one Filters choice away, and Not configured also has the banner when any exist [REQ IM-10].

**Primary:** Add a skill.

| Other action | Where | Why |
|---|---|---|
| Add several, Bulk upload (Later), Starting points (Later) | Chevron beside Add a skill | Same job, one place |
| Open a skill | Click the row, or Enter on the name: panel on Details. The word in the Configuration cell: panel on Evaluation (D-L97) | Row is the one door to editing |
| Change Times needed | The cell, number input, on every row including Not configured and Inactive; saves on blur or Enter. When the number changes students' progress, the impact dialog names them first [REQ AE-02] and Cancel restores the number | The common per-skill change [CALL 11-04 rev L28] [CALL 11-02 Granola e72ea925 chunk 7] |
| Row menu: Edit, Deactivate or Reactivate, Delete | Row "..." | Same verbs as the panel. Configure and Map to courses leave this menu: they live in the panel. Replace with a new version is gone, 2026-11-05 (D-L105): no source; lists have New version. IM-06's Skip, Replace, Keep both stay in Add a skill and Add several |
| Categories and tags, Export | Header More | Occasional, not this page's job |
| Status tabs: All, Active, Inactive | Above the table | Requirement filter [REQ SL-10] |
| Show the skills that need configuring | Banner action, sets the Configuration filter | [REQ IM-10] |
| Category, tag, configuration, came from, on no list, different number | Toolbar Filters, one button; chips below | Density [D-L8 pattern]. Configuration offers Default, Custom, Not configured |
| Configure N, Edit N, Deactivate N | Selection bar only | Bulk actions appear only when they can act. Configure first [LEDGER D-L48]. Set times and Copy settings move inside these. Configure with one row selected opens that skill's panel on Evaluation, not D4 (D-L91, D-L97) [INFER] |

**Tasks**
- **Find:** Library -> type in Search or use Filters -> rows narrow, tab counts follow -> stays here.
- **Change times:** cell -> type 5, Enter -> if progress changes, dialog names the students, confirm -> value saved, a short "Saved" state in the cell -> stays here, focus next row's cell.
- **Work through unconfigured:** banner action -> Configuration filter chip reads Not configured -> open a row, Add questions, Save changes -> count falls -> list empties to "No skills match" with Clear, banner gone.
- **Group:** View menu -> By category (default) or Plain list.

*Amended 2026-11-05 (independent review):* the banner sits under the title while the title is on screen; with the title scrolled away it uses the shell's slot, so a result is always in view (rule E10). The header carries More, then Add a skill. Search moves the tab counts, as filters do. Columns offers Times needed, Category, Configuration, Status, Tags and Came from; the DS column menus (Pin, Wrap, Group, Conditional Rule) are hidden on this page, since the DS has no prop to leave items out of them. The view and the columns chosen are kept for the next visit. A selection stays until an action is confirmed: Keep active and Esc on any layer leave it. With only inactive rows selected the bar has the count and clear. One Tab from a selected row offers "Go to selection actions". The source list's second heading no longer shows under the name: a skill has one category. The Library does not point into the setup wizard: no Set up skills link, no "Setup paused" band, no Continue setup.

*Added 2026-11-05 (fix round).* Selection persists across tabs, searches and filters. When some of it is out of view the bar reads "N selected, M not shown", and its actions act on all N, naming them in their question. The header box adds or takes away only the rows on the tab showing. Clear returns focus to the row.

**States:** Empty, whatever made it empty (a new program or the demo state): "Add your program's skills." with Add a skill, Add several, Bulk upload. Partial: not configured banner once, with the count, never also a sentence elsewhere. No categories anywhere: plain list with no group row and no Category column (B16). Filtered to nothing: "No skills match" with Clear. Error: "The library did not load" with Try again. Inactive: row muted with badge, Times needed and panel still editable (D-L93), left out of bulk Edit and Configure with a note naming it. Loading: Skeleton in final table shape.

**Not on the page:** a status word for where settings come from (Status is Active or Inactive only), tabs for configuration, evaluation count [LEDGER D-L45], courses column, "How it's judged" column [LEDGER D-L65], read-only detail view, per-row Configure button, setup checklist, helper text, KPI band.

### D1a. Edit panel (quick edits)

Rewritten 2026-11-05 (D-L88 to D-L93), rebuilt the same day (D-L97, D-L98). **Narrowed 2026-11-06 (D-L115):** the designer found configuring a skill here hard, so evaluation setup moved to a full page, D1c. The Evaluation tab, the panel's segmented control and its groups are gone. The fixed header, the Active switch, the footer only with changes, and the words Default and Custom stand.
Requirements: SL-02 to SL-06, SL-11, AE-02, AE-03, AE-06.
**Job:** the quick edits to one skill, without leaving the list.
Component: `FloatingSheetPanel`, non-modal, size md (32rem, verified `node tools/ds/source.mjs FloatingSheetPanel`; its toolbar lets the admin widen it).

```
+----------------------------------------------+   header: never scrolls
| ^ v                    [...]             [x] |
| Blood pressure                               |
| Active  (o-)                                 |   ToggleSwitch, named "Skill is active"
| [Details] [Used in]                          |   DS Tabs, one purpose each
|----------------------------------------------|   body scrolls
| Name  Description  Category  Tags            |
| Times needed  [ 3 ]                          |
| Student needs 3 evaluations at any level.    |   read only [REQ SC-17, AE-03]
|----------------------------------------------|
| Evaluation settings  Default     [Configure] |   Default, Custom or Not configured
|----------------------------------------------|   footer: only with unsaved changes
| Unsaved changes          [Cancel] [Save chg] |
+----------------------------------------------+
```

**Tabs.** Details: Name, Description, Category, Tags, Times needed, the rule sentence, Evaluation settings with Configure. Used in: Skill lists, Courses, Came from, versions. Opens on Details. The arrows keep the tab [INFER]. The URL does not hold the tab. Configure, with a dirty panel, asks "Discard your changes?" first. An older `?section=evaluation` link goes to the page.

**Why it would not close, and the fix (2026-11-05, D-L98).** Reproduced by test: (1) X took 1.2 to 3 s to act, since panel state was the URL, written with `router.replace` (a server round trip), and the 178-row list re-rendered before the panel left: the button looked dead, on the walkthrough root most of all. X, Esc and page click now close the panel in the same frame, and the URL is written with `history.replaceState`. (2) Esc did nothing while a tooltip was showing, for example after hovering X or tabbing onto a toolbar button: Radix gives Esc to its top layer. The panel now takes Esc in the capture phase unless a dialog, menu or list has its own use for it. (3) The left Skills menu: closing the panel restored a fold the admin had since changed, the admin's collapse did not survive a stop or reload, and an icon row re-expanded the labels. The menu now keeps the admin's choice in the browser; a press on Show labels or Collapse to icons works with the panel open, dirty or not, and the panel stops folding it from then on.

**Why it was still slow, and the fix (2026-11-05, independent review, E31).** Closing painted 0.8 to 0.95 s after the press on the full list and 70 ms on two rows, on the dev server under load. Three causes. (1) Panel state came from `useSearchParams`, which takes a new URL in a transition: the panel waited behind it. It now reads the location itself (`useLiveUrlParam`), so the press answers in its own frame. (2) `DataTable` rendered every row for `openRowId` and the Category column stepping aside, and the page rendered it again on every URL change and on the form turning dirty. The table's props are now stable behind `React.memo`, the open row's `data-open` is set on the DOM, and the column change and the page's reflow beside the panel wait until the first frame has painted (`afterPaint`). The form mounts after the panel's first frame for the same reason. (3) Not fixable here: 24 rules in the DS CSS use `:has(...[data-state=...])`, and each makes any `data-state` change restyle every element on the page, about 6,800 on this list. That is what is left of the wait; two rows take 18 ms. Removing them all took one change from 76 ms to 0.1 ms in the browser. For the DS owner.

**History (2026-11-05).** Opening, stepping and closing replace the URL, so Back leaves the Library. Forward returns to the record last open. No entry below holds an older skill: the extra entry a dirty form keeps for Back's question sits above an entry with no record in it.

**Evaluation fields** moved to the page (D1c) on 2026-11-06. Numbers below that talk about the panel's groups are history.

**What a model change clears** [REQ SC-09] (applies on the page, D1c). The form rebuilds at once; Save changes lists it in the dialog.

| Leaving | Cleared | Kept |
|---|---|---|
| Independence level | Levels, Levels that count, Minimum at each level, Checked-off students get | Times needed, Minimum from a clinical setting, Different evaluators, What the student does, Who evaluates |
| Approved or not approved | Labels, Which one qualifies | Same |
| Questions | Counts when, named subset. The questions stay if the new model is Score on a scale, which also uses them [REQ SC-04]; otherwise they are cleared [INFER] | Same |
| Score on a scale | Scale, Counts when, Checked-off students get. Questions as above | Same |

The new model's rows fill from Evaluation settings when the program uses that model; otherwise they start empty with nothing preselected [REQ SC-02] [INFER].

Group check-off is kept through every model change, as this table says; it stays as it read before the change, whichever model that default came from (2026-11-05). All four models can record a check-off (`tickRecordsLine`), so nothing goes in the dialog for it. Checked-off students get is cleared where the table says.

**Primary:** Save changes, in a footer that exists only while the form has unsaved changes. It stores the details and Times needed. An invalid form still offers it and shows the problem at the field (rule E4).

| Other action | Where | Why |
|---|---|---|
| Active switch | Header, under the name | Off opens the deactivate impact dialog; confirming applies at once; Cancel leaves the switch on. On is Reactivate with its impact behaviour. Not part of Save; unsaved form edits stay in the form [INFER]. The switch shows the saved status, also while its dialog is open [INFER] |
| Configure | Details, the Evaluation settings row | The full page for this skill (D1c); dirty guard applies. After a save there, focus returns here |
| Skill lists, Courses | Links on the Used in tab | Facts here, acted on elsewhere. Unchanged |
| Delete | Header "..." | Rare and heavy. Replace with a new version is gone, and so are the Version badge, Replaced by and Replaces (2026-11-05, D-L105) |
| Previous, next skill | Header arrows | Working down a list |
| Close | Header x, Esc, or click on the page; first press, every time (D-L98) | Non-modal rule. Dirty: "Discard your changes?" |

**How each edit works**

| Edit | Entry | Steps | Finish | Lands |
|---|---|---|---|---|
| Name, description, category, tags | Row | Change, Save changes | Banner "Blood pressure saved." | Panel stays open on the same skill, list updated |
| Status: deactivate | Row menu, bulk bar, or the panel's switch | Dialog: leaves N courses, N students have it, N evaluations kept. [Keep active] [Deactivate] | Banner with Reactivate | Status Inactive; Configuration unchanged; panel stays |
| Status: reactivate | The panel's switch or row menu; the banner's Reactivate is the undo of what was just confirmed, and direct [INFER] | Direct when it reaches nobody. Dialog names the students first when any hold evidence on it or the settings were edited while inactive (D0 rule 9, corrected 2026-11-05) [REQ AE-02] | Banner | Status Active; Configuration unchanged; panel stays |
| Evaluation settings | Configure | The full page, D1c | Banner "Blood pressure saved." | Library, panel open on the skill, focus on Configure |
| Times needed | Panel field or table cell, any skill | Change; panel: Save changes; cell: Enter. If progress changes, dialog names the students first [REQ AE-02] | Saved | Same place. Configuration word unchanged |
| Delete | Header "..." | Allowed only with nothing tracked; lists courses it leaves [LEDGER D-X15] | Banner | Panel closes |

**Edit versus create**

| | Create (Add a skill) | Edit (panel) |
|---|---|---|
| Fields | Name, description, category, tags | The same (Details tab), plus the Active switch, Times needed, the rule sentence and Configure, Used in tab |
| Evaluation | Nothing asked [REQ SC-01] | On the full page (D1c), reached by Configure |
| Buttons | Cancel, Add skill | Cancel, Save changes, only with unsaved changes; else X |
| After | Panel closes, row at top | Panel stays open |
| Duplicate name | Warned, can open the existing one | Blocked on rename, with Open it (corrected 2026-11-05: the panel has always blocked, since two skills with one name cannot be told apart in a picker; this row said "Warned") [INFER] |

**States:** The Evaluation settings row reads Default, Custom or Not configured, from the draft. Not configured: Times needed stays editable and saves; Configure opens the page, which says why and offers the one action. Inactive: every field live (D-L93); the switch reads off.

**Not on the panel:** an Evaluation tab, a Default or Custom control, groups, Preview, a Status row, a Deactivate or Reactivate button; a reset on each field; a second read-only mode, evaluation history, course mapping controls, Map to courses button, footer primary that changes by state, a footer with nothing to save.

**Research for this panel (Mobbin, 2026-11-05, low-resolution previews looked at).**

| Reference | Copy | Avoid |
|---|---|---|
| [Calendly event type side panel](https://mobbin.com/screens/64dea695-1b10-4dea-8083-f30be3dffc29) | Stacked collapsible groups in a side panel, each showing its current value when closed (Duration, Availability, Host); the list stays visible | A "More options" button at the foot: here every setting belongs in the groups |
| [Xero sales defaults](https://mobbin.com/screens/bc110a18-ec13-484a-b7e1-a861d5064d36) | The default has a plain name the admin can read ("Use organisation settings"), and the form says defaults can be changed on a record | One inherit choice per field: too fine for a package that travels as one |
| [Churnkey text overrides](https://mobbin.com/screens/9abc8a58-37f1-456f-9864-9ef060f15c43) | "Show overrides only": a filter for the exceptions, as the Configuration filter does here | A reset link on every row; every row styled as an override, so nothing reads as the exception |
| [Zendesk theme settings](https://mobbin.com/screens/aacee7ec-a235-4285-b200-4227a3e3ad93) | Revert is unavailable until something differs, as choosing Default changes nothing on a Default skill | Revert on each field: too fine for a package that travels as one |
| [Sweatpals pricing panel](https://mobbin.com/screens/ac19adfa-edd1-47b0-94a3-4bd9d85f1569) | Fields editable directly in the panel with one Save at the foot | Card inside panel, a nested "More settings" fold, and no Cancel |
| [Calendly side panel](https://mobbin.com/screens/2cb90a92-7689-4166-92ff-86607ae0a3ca), checked 2026-11-05 on the screens the search returned for it | Toggle row at the top of the group; groups showing their value when closed | A long ungrouped panel |
| [Cosmos segmented choice](https://mobbin.com/screens/f6b8a36b-6321-4022-98c8-f09c580097eb) (link from the brief; the image was not opened) | Two-way segmented choice, here DS `ViewSegmentedControl` | |
| [Shopify unsaved changes](https://mobbin.com/screens/5d81a2ca-b286-4e00-bb45-e8f5c73bcda3), checked on sibling Shopify screens | A save bar that appears only with changes, naming them "Unsaved changes" | A save bar far from the form: here it is the panel's foot |

### D1c. Configure one skill (full page)

Added 2026-11-06, D-L115. Designer 2026-11-05: "We have made a full page before, but the UX and ui along with content were too dense." Density is the acceptance test.
Requirements: SC-01 to SC-19, IM-09, IM-13, AE-02, AE-03, AE-06, AE-07, SL-11.
**Job:** set how one skill is evaluated, and see what the student and evaluator will get.
Route: `/lab/admin/configure-skill?skill=`. Crumb Skills > Library > {Skill}. Title {Skill}; a badge only for Not configured or Inactive. Form and "What they will see" side by side; rule sentence atop the preview; Student and Evaluator line tabs over a muted read-only tray. At 1920 the columns are 1fr 1fr. Below 1100 px it stacks, with Preview as a header Dialog (the D3 pattern) and the rule sentence closing For this skill or What counts as achieved. No sticky footer.

```
Basic airway management                               [Cancel] [Save changes]  appear after a change
Evaluation settings  [ Default | Custom ]      |  What they will see
For this skill                                 |  Student needs 3 evaluations at any level.
Times needed  [ 3 ]                            |  [Student] [Evaluator]
Minimums      None          [Add minimum]      |  +-- muted tray, read only ---+
From Evaluation settings (a link)              |  |                            |
Judged by; Levels; Labels; Which one qualifies;|  |                            |
Scale; Counts; Student fills in; Student rates |  |                            |
first; Who signs off; Feedback; Group check-off|  |                            |
Approval                                       |  +----------------------------+
```

**Switch.** `ViewSegmentedControl` "Evaluation settings": Default, Custom. Switching keeps the Custom draft while on the page [INFER]. Custom edits held aside under Default count as unsaved: every door asks "Discard your changes?", though Save and Cancel stay hidden until the chosen Default itself changes, since Save writes what is chosen (2026-11-06).
**Default.** "For this skill": Times needed; Minimums, None, Add minimum; for question and score models Questions "4 questions" with Edit questions; a named rule adds "Questions that must be Yes" "3 of 8" with Choose. "From Evaluation settings" (a link): a read-out of only the rows that apply to the model, including student fields [REQ SC-13] and group check-off. Values: Yes, No; Required, Optional; Not required; Required before it counts; On, students get {level}.
**Custom.** One open section at a time (Accordion `type="single" collapsible`):
1. How this skill is judged: tiles Independence level, Approved or not approved, Questions, Score on a scale. Arrow keys changing the model keep the section open.
2. What counts as achieved (open on arrival): Level and Counts table with Edit levels (Dialog: Levels; Add a level; Use a starting set; Cancel; Save); First label, Second label, Which one qualifies; Scale; Counts when; Questions; Times needed; Minimums with Add minimum (At a level, From a clinical setting, Different evaluators).
3. What the student does: What the student fills in with Edit fields; Student rates themselves first.
4. Who evaluates: Who can sign off; Feedback is required; Faculty can check off a group; Level or Score students get; Approval before it counts.
A closed section states its values on one line; with a problem it reads "1 to fix".
**Not configured.** (a) The program has no settings: no switch; "Your program has not set how skills are judged." with Set how skills are judged, filled until a model is chosen; tiles with none preselected; choosing one starts Custom. Preview line "Choose how this skill is judged first." (b) The model needs questions: "No questions yet" with Add questions; preview line "Add questions to see the evaluator's form." Hard stop: no default evaluation model is ever preselected [REQ SC-02].
**Save.** "Save changes" and Cancel, top right, only after a change. Invalid: Save lists the problems in a sticky summary, opens the section and focuses the field [REQ SC-18]. A save that affects students opens the dialog: Students whose progress changes, Show names, Cleared [REQ AE-02, SC-09]. Results "{Skill} saved." and "{Skill} was not saved. Try again." Landing: Library with the same filters and scroll, panel open on the skill, the banner, focus on Configure. Cancel returns to where the admin came from. Every way off the page with a change uses "Discard your changes?": Cancel, breadcrumbs, Skills panel rows, sidebar, From Evaluation settings, Set how skills are judged, walkthrough bar, Back, reload.
**Doors.** The panel's Configure; the Library Configuration cell; the selection bar with 1 row; older `?section=evaluation` links. 2 or more rows go to D4.

**Density budget at 1440 x 900 (acceptance, task CFG1). Fields count every radio and box, the switch included.**

| Measure | Budget |
|---|---|
| Live fields, first viewport | Default at most 3, Custom at most 9 |
| Other buttons, first viewport | at most 3 |
| Words, form side | Default at most 65, Custom at most 50 |
| Words, with preview | at most 115 |
| Helper lines | 0, tile examples excepted |
| Lines for models not chosen | 0 on arrival |
| Filled buttons | 0 on arrival, then 1 (Not configured (a) carries its one filled action on arrival) |
| Visible sections | at most 4 |
| Value repeated | 0 |
| Fits 900 px on arrival | yes |

Exception: Who evaluates with check-off on may read 8 fields against its gate of 7. A skill that already holds a minimum carries one more live field per minimum: the budget is measured with None, and this is stated rather than raised.

**Preview tray.** Under the question and score models the Student tab shows one question and the count of the rest, and the button alone names the form, so the first viewport holds its word budget. The Evaluator tab and the Preview dialog show it all [INFER].

**Doors, in code.** A capture-phase listener notes the address and scroll whenever a link to this page is pressed (`lib/lab/configure-origin.ts`), so a dirty panel's guard cannot lose it; Save and Cancel read it back.

### D1b. Bulk edit

Requirements: IM-14, SL-03, SL-04, SL-11. **Job:** apply one change to many selected skills.

```
Selection bar -> Edit 12 skills:                 Selection bar -> Configure 12 skills:
+----------------------------------+             page D4 for several skills
| Edit 12 skills               [x] |             [LEDGER D-L48]; Mixed shown where they differ;
|----------------------------------|             "Start from" adds a skill or the default
| Category     [Keep current    v] |             [REQ IM-14]
| Add tags     [_______________]   |
| Remove tags  [_______________]   |
| Times needed [Keep current    v] |
|----------------------------------|
|        [Cancel] [Update 12 skills]|
+----------------------------------+
```
*Built 2026-11-05 (contract ADMIN-D1b). Bar: N selected, Configure N skills, Edit N skills, Deactivate N, clear. Set times moved into this panel; Copy settings into D4 Start from.*
**Primary:** Update 12 skills, enabled once a field is set.
**Tasks:** select rows -> Edit N -> set a field -> Update -> banner "12 skills updated." with failures listed by name -> Library, selection cleared. Deactivate N: dialog with summed counts -> banner with Reactivate. *2026-11-05:* evaluations are added up; courses and students are counted once each, since 3 skills on the same 123 students is 123 students [INFER]. Keep active and Esc leave the selection; a confirmed Deactivate clears it.
**States:** Inactive rows selected: not counted, and the panel says "2 inactive skills left out" with names [INFER]. None changed: Update disabled. Partial failure: banner names each.
**Not here:** name and description (one each), status field, an editable grid.

### D2. Add

Requirements: SL-02 to SL-05, IM-01 to IM-13, SC-01.
**Job:** get skills into the library. All four ways open from one menu and end in Library.

**Add a skill.** `FloatingSheetPanel`.
```
Add a skill                    [x]
Name         [________________]
Description  [________________]
Category     [Pick or create v]
Tags         [________________]
             [Cancel] [Add skill]
```
Primary: Add skill. Task: Add a skill -> fill name -> Add skill -> sheet closes -> banner "Blood pressure added. Uses the default." or "Not configured." with action "Set how skills are judged" -> row at top, highlighted. States: duplicate: inline "Already in the library" with Open it. Removes "Save and configure", "Save for later" and the next-step routing.
Built, 2026-11-05: no "Add another" checkbox, since no requirement or call asks for it [INFER]. A name in the library defaults to Skip; the program chooses Skip, Replace or Keep both [REQ IM-06], Replace only while the library skill has no evidence (OD-13 open). The primary reads Add skill for Keep both and Replace skill for Replace; with Skip chosen Add skill is disabled, the line beside the choice says nothing is added, and Cancel closes (it asks first only if more than the repeated name was typed [INFER]). Open it asks "Discard your changes?" on a changed sheet, and, like Cancel, not when only the repeated name was typed (2026-11-05). Replace reads Updated in a Just updated group, not New (2026-11-05). The sheet is modal, and a tag's suggestion list closes on Enter, since while it is open the sheet's focus trap is paused (2026-11-05): focus opens in Name and returns to the button that opened it. A second press after the sheet closes does nothing.

**Add several.** `FloatingSheetPanel`.
```
Add several                                 [x]
Names, one per line
[ Blood pressure                             ]
[ Oral temperature                           ]
148 new, 3 repeated, 1 not read  [Show]
Category for all   [Optional             v]
Tags for all       [_____________________]
                     [Cancel] [Add 151 skills]
```
Primary: Add N skills. Task: paste from Excel -> line check -> optional category and tags -> Add -> banner "151 skills added." with Show them -> Library filtered to this add [CALL 11-04 pre L779-785]. States: lines not read stay in the box with their text and a reason [REQ IM-08].
Built, 2026-11-05: a name in the library defaults to Skip and is not added until the program chooses [REQ IM-06]; a line repeated inside the paste defaults to Keep both and is added under a "(2)" name [INFER], so "4 new, 1 repeated" reads Add 5 skills. The summary counts both as repeated; "N will be added" says what the button will do. An empty box leaves Add enabled and shows the reason on press (rule E4). Every line a repeat on Skip: Add skills is disabled and the summary says what would change that. Only replaces: Replace N skills. Never a bare Skip. A first line reading Name, Skill, Skills or similar, and a line of only digits, stay in the box with their reason [INFER]. Show them is a new history entry and takes the banner with it: Back returns to the whole list. Beside "Set how skills are judged" it is a second banner action in the same style, the one place rule E10's single action is exceeded [INFER]. The sheet is modal, and Close, Esc, a click on the page behind and browser Back all ask first while changed.

*2026-11-05:* with two or more repeats, one choice above them sets all: Skip all, Keep both for all, Replace where allowed. The list has no height of its own; the sheet scrolls. After an add, the sentence under the box says what was not read, and the summary does not say it again.

**Bulk upload (Later).** Focus workflow: own route, no sidebar, Cancel in the header [LEDGER D-L44].
```
Bulk upload              Upload > Review > Done                 [Cancel]
Review  Skills 142 | Possible duplicates 3 | Not read 2
[] Name          Description     Category (from heading)    ...
                                     [Back]  [Add 142 skills]
```
Primary: Add N skills. Task: drop a file -> reading -> Review: edit, rename, merge, split, discard, add [REQ IM-05]; decide skip, replace or keep both [REQ IM-06]; see lines not read with original text [REQ IM-08] -> Add -> Library filtered to this import [REQ IM-11]. OD-12 and OD-13 open: stops at skills, descriptions and headings. Labelled Later on the entry [CALL 10-26 L67]. Must not: shipped template, model proposal, anything created before confirm.

**Starting points (Later).** Focus workflow. Choose a list -> preview names and categories -> Copy N skills -> Library, now the program's own, editable. See B8. Must not: load by default, say "standard" or name an accreditation body as the source.

### D3. Evaluation settings

Requirements: SC-02 to SC-09, SC-13 to SC-19, AE-02, AE-06, AE-07 as defaults for every skill.
**Job:** say once how this program judges its skills.

*Layout rewritten 2026-11-05 (designer asked for a better UI). Supersedes the "one flat list, no aside" part of D-L80; words below are proposals [INFER] until the designer accepts them.*

```
Skills > Evaluation settings
Evaluation settings                                                [Save changes]
(one banner at a time)
How skills are judged                          |  What they will see
[o Independence level ][  Approved or not ]    |  Student needs 1 evaluation at any level.
[  Questions          ][  Score on a scale]    |  [Student] [Evaluator]
  (each: name + one example line)              |  Example: IV catheter insertion v
What counts as achieved                        |  +-------------------------------+
Levels        Level              Counts        |  | the form, live, read only     |
              1 [Needs coaching] [x]  ^ v x    |  |                               |
              2 [With assistance][x]  ^ v x    |  +-------------------------------+
              3 [Works alone]    [x]  ^ v x    |  (sticky; a long form scrolls inside)
              Add a level   Use a starting set v
Times needed  [ 3 ]  31 skills use a different number
What the student does
What the student fills in  Date performed, required   [Edit fields]
Student rates themselves first                              (switch)
Who evaluates
Who can sign off   [x] Preceptor [x] Clinical faculty [ ] Lab instructor
Feedback is required                                        (switch)
Faculty can check off a group                               (switch)
    Level students get [Works alone v]
Approval before it counts                                   (switch)
```

Two columns from 1100 px wide: settings about 60 percent, the panel about 40 percent, which replaces the blank width [D-L5]. Below 1100 px the page stacks, Preview returns to the header as a dialog, and the rule sentence closes "What counts as achieved". Each section has a heading naming its purpose; rows are single column, one label column, thin dividers, switches at the end of their row. No cards inside cards. A new program shows the first section only, nothing selected [REQ SC-02].

The tiles are `RadioGroup` with tile chrome, not `SelectionTileGrid`: the grid does not render an option's description, forces square tiles and requires a selected value [DS 1.6.5 source]. Arrow keys select.

| Model | Rows in "What counts as achieved" |
|---|---|
| Approved or not approved | Labels [First label] [Second label]; Which one qualifies; Times needed [REQ SC-03] |
| Questions | Questions, the program's set, with Paste a list [REQ SC-04]; Counts when: All Yes, At least N of M, Named questions [REQ SC-05]; Times needed. Skills take the set per D0 note 2026-11-05 (D-L96) |
| Score on a scale | Questions, as above; Scale; Counts when: Average, Minimum on every question, Total, with Value [REQ SC-07]; Times needed. No final outcome anywhere: the result comes from the scores [CALL 11-04 Granola 365abc25 chunk 15] |
| Independence level | Levels, one list with Counts on each row (links per D-L74, D-L95); Times needed [REQ SC-08] [LEDGER D-L51] |

**Primary:** Save changes ("Save settings" before the first save). The rule sentence leads the panel: "Student needs 3 evaluations rated developed." [REQ SC-17]. A value that cannot be met says nothing in the sentence (never "9 or more out of 5"); the row says what is wrong.

| Other action | Where | Why |
|---|---|---|
| What they will see | Sticky panel from 1100 px, `Tabs` Student and Evaluator, the Preview dialog's own forms, live from the draft, read only [REQ SC-19] | Fills the width with what the settings produce. Tabs show one form at a time; "together" in SC-19 is the panel as one place [INFER] |
| Preview | Header, outline, below 1100 px only | The same forms in a `Dialog` |
| Skills with a different number | Link in the Times needed row | Goes to Library filtered. Exceptions are edited in one place, replacing the list and dialog here |
| Edit fields | In What the student fills in row | Opens a `Dialog` with the same title, label, type, mandatory [REQ SC-13] |

**How skills inherit and override, on one screen.** Save opens this:
```
Apply to 166 skills?
  Default        166   will change
  Custom                        12   keep their settings and number
  Default with their own number 27   keep their number
  Students whose progress changes  9  [Show names]
                   [Cancel]  [Apply to 166 skills]
```
Rules: D0. Label names and level renames skip the students line and read "N show the new names" [REQ AE-06]. Inactive skills count in these figures as Default or Custom, like any other [INFER]. Other rows only when they apply: Questions on this page, N use them; Own questions, N keep their own; each reason a skill becomes Not configured, named (never "No questions yet" for a role problem); Group check-off, Turns off or Turns on; Cleared, what leaving the model removes [REQ SC-09]; Already on these settings, only for skills no other row names. *2026-11-05:* the Times needed link counts every skill with a different number, Custom ones too, as the Library filter does (31 on the seed); the dialog's row counts Default skills only (27). The words carry the difference; the two counts stay different [INFER]. Which label qualifies re-applies to evidence held, so changing it names the students [REQ SC-03, AE-02].

**Tasks**
- **First setup:** open -> only "How skills are judged" shows -> pick -> the rest appears -> fill -> Save -> dialog -> Apply -> banner with "Open the library" -> stays here. *Amended 2026-11-05:* no path reaches "Saved for 178 skills": a new program holds no skills and the seeded program has already saved. On a program with no skills: dialog "Apply these settings?", one line "New skills take these settings when they are added.", button "Apply settings", banner "Settings saved." With skills: "Apply to N skills?", "Saved for N skills."
- **Change one thing:** edit a row -> Save -> dialog -> Apply -> banner -> stays here.
- **Change the model:** pick another -> dependent rows reset, nothing preselected -> Save -> dialog also lists what is cleared [REQ SC-09].
- **Leave with unsaved changes:** any link or panel row -> "Discard your changes?".

**States:** Empty: one section, no Save enabled; the panel says "Choose how skills are judged first." Invalid: Save stays enabled; pressing it lists the problems under this page's section names and focuses the first [REQ SC-18] [LEDGER D-L56]. Times needed over 50 or not a whole number: "Enter 1 to 50.", the same as the panel and the table. Only what is on this page is reported: minimums and different evaluators are per skill. One banner at a time [E10]: an edit clears Saved, a failed Save replaces it. Focus returns to the opener when Apply, Preview, Edit fields or the switch dialog close; after Apply Save is disabled, so focus goes to the page title. Role with nobody recorded: amber note on that row [INFER] [REQ ST-08]. Error on save: "Settings were not saved. Try again.", edits kept. Loading: Skeleton. Inactive: not applicable.

*Added 2026-11-05 after the independent review, words [INFER]:* the problems banner stays in view above the settings while the focused field is low on the page. Use a starting set asks first when levels exist, naming what is replaced and whether the Counts boxes clear. Moving a level keeps each level's Counts box; when the move crosses the line between counted and not counted, the moved level keeps its box, the level it passed changes, and that row says so (every box is never cleared, D-L95). Which label qualifies decides what the evaluator is told after submit, on the real form and in the preview. The second press of a double click on a dialog's button does nothing.

**Built 2026-11-05 (T7, then the layout above).** Preview covers what SC-19 asks: where, the program's fields, self-evaluation by model, who signs off, the note; for the evaluator, what the student supplied, their own answers, and what they are told after submit.

**Not on the page:** skill names, table of times, per-skill list, summary card (the panel shows the forms, not a summary), steps illustration, setting minimums, level minimums, distinct evaluators (those are per skill), helper lines (the tile examples are the one exception, E14), Check step, patient-log option. *2026-11-05: "Prism-suggested values" is off this list. Met and Unmet stay prefilled for Approved or not approved, because REQ 4.1 says "Met/Unmet by default" and the labels are editable; which one qualifies is still not preselected [REQ SC-03]. E16 reads the same way for these two labels.*

### D4. Configure several skills (bulk)

Bulk only since 2026-11-05 (D-L91). *Amended 2026-11-06 (D-L115):* one skill has its own page, D1c, and this page shares its sections, Edit levels and Add minimum, with Start from, Mixed and Preview as a Dialog on top, and no Default or Custom switch. It stays for one set of changes across many selected skills [REQ IM-14] [LEDGER D-L48]. No panel button leads here and the panel never lands back from here.
Requirements: SC-02 to SC-19, IM-14, AE-02.
**Job:** change evaluation settings on several selected skills at once.
Entry only from the Library selection bar, "Configure N skills", with two or more rows selected. Route, because it is long and has a URL [LEDGER D-L47 B, D-L52].

```
Skills > Library > 12 skills
12 skills [Show skills, below 1100 px]       [Preview] [Cancel] [...] [Save 12 skills]
----------------------------------------------------------------------------------
Start from          [Each skill as it is v]
> How this skill is judged                                                   Mixed
v What counts as achieved
    Levels  Mixed [Set for all]
    Times needed  [Mixed]
    Minimums      None                                                [Add minimum]
> What the student does                                         1 field, rates first
> Who evaluates                                                              Mixed
```
The sections of D1c, one open at a time, with no switch. Steps panel [Steps, Evaluator, Student] moves into Preview (amends D-L52).

**Width (2026-11-06, brief section 0, D-L5).** From 1100 px two columns as on D1c, equal at 1600 and up: Start from and the sections left, the selected skills right as a plain list titled with the count, a badge only for Custom and Not configured, scrolling in its own box for 100+. No Show skills at those widths. Below 1100 px one column, with Show skills beside the title. Preview stays a Dialog.

**Primary:** "Save 12 skills", verb plus count per E4 (2026-11-06).

| Other action | Where | Why |
|---|---|---|
| Cancel | Header, outline | Back where the admin came from: search, tab, filters and scroll, selection kept; dirty guard, the one wording |
| Preview | Header, outline | [REQ SC-19]; includes the rule sentence and steps |
| Use default configuration | Header "..." (E5 allows three actions, 2026-11-06) | Drops edits on the selected skills; Custom ones become Default [INFER]. The dialog opens only when progress moves or something is cleared; else it applies with the banner "3 skills use the default configuration." With no program settings the item is disabled and says why |
| Start from | Top row | A skill, or the default, as the values to begin from [REQ IM-14]. Searchable (`Popover` plus `Command`, E16, as Category); same-name skills read with their category |
| Show skills | Beside the title, below 1100 px | Names the selection [LEDGER D-L48]; from 1100 px the list beside the sections does it |
| Add minimum | Minimums row | [REQ SC-10, SC-11]; lab and simulation not offered [REQ SC-12] |

**Tasks:** Set a minimum: Configure N -> Add minimum, setting and number -> Save -> blocked with reason if minimums exceed the total [REQ SC-18], otherwise Library with a banner. Change one setting: Configure N -> change the row, a field left alone stays as each skill has it -> Save, impact dialog when progress changes -> Library, those skills read Custom, selection cleared.

**States:** No evaluation settings yet: "Your program has not set how skills are judged." with Set how skills are judged; fields are still offered with nothing preselected. Mixed model: What counts as achieved and Group check-off read Mixed with the link "Choose how these skills are judged first", which opens How this skill is judged; no lone chip (2026-11-06). Mixed minimums: Add minimum adds to each skill and keeps what each has; the same setting takes the new number; a skill that then fails is named in the problem list; no "None" under Mixed. Problems: one line per field, in the page's words, and the banner's count equals the sections' "N to fix". Has evidence: the impact dialog only when progress moves or something is cleared, naming the skills that move and how many others save, never a table of zeros; otherwise it saves with the banner (2026-11-06). Inactive: left out of the count, named on the page ("Left out, Inactive: ...") and in the result; with only Inactive rows selected the bar says why there are no actions. One valid id goes to D1c; bad ids are ignored. A result is said once: `saved=` leaves the URL.

**Not on the page:** a single-skill mode, the replaced "Use own settings" switch, read-only values, numbered steps, "Check and save" as a section, a footer, Next, Continue configuring wording ("Configure now" when nothing is set [CALL 11-04 pre L107]).

### D5. Categories and tags

Requirements: SL-03 to SL-06, RP-04. **Job:** tidy the program's own categories and tags.

```
Skills > Categories and tags
Categories and tags                                     [Add a category]
[Categories 45] [Tags 12]                     Search
| Name              Skills   Status    ...  |
| Airway               5     Active    ...  |
| Old module           0     Inactive  ...  |
```
*Note added 2026-11-05 (build T9).* Add sits at the right end of the tab row in the primary style, and search on its own row below. Status is a `ToggleSwitch` with the word beside it, acting at once with no dialog and no banner; the page announces the change to screen readers. This replaces the Deactivate dialog below and rule E11 on this page only; [REQ SL-06] asks for the outcome, not a dialog. The row menu holds Rename and Delete. Rename stays a dialog, not inline on the name. Inactive rows sort last when the list opens; a row switched during the visit holds its place until then, so it does not jump away from the switch [INFER]. Skills count follows this section: it filters the Library, and no count sheet opens for categories or tags. The Tags tab's "Across categories" reads "Categories" [INFER]. No Status filter, since this section does not ask for one. The DS has no way to remove the column menu from an unpinned column: Status and the row menu, pinned right, lose it, and Name and the count columns keep it. Below 768 px the DS turns pins off, so the counts move under the name and Status and the row menu stay on screen. The same Status switch and Rename are on Settings > Clinical settings [REQ SL-07] [INFER on the switch], where the list persists in the program and refuses a name with lab or simulation in it [REQ SC-12] [INFER on refusing the name].

*Note added 2026-11-05 (recommendation; Romit may overrule).* **The Add form.** Add a category opens a form in the tab row, beside the button, which does not move: the field, then Cancel and Add a category. A repeated name shows its error directly under the field and nothing moves. A result banner sits under the form, the new row comes first, and the page does not scroll, so an admin adding ten names keeps the field and sees each result. It is not a table row: a row would scroll away with the table, sort among 45 others, and sit under the sticky head. **This bends rule E10 on this page:** the banner is under the form rather than above all the content, because the form is the work in progress. Dismissing the banner returns focus to the field, or to Add a category when the form is closed.

*Note added 2026-11-05 (recommendation; Romit may overrule).* **Search during add (D-L111).** The search stays as it is. A new row the search matches comes first, with the plain banner. One it hides reads "{name} added. Your search hides it." with Clear search; Clear search empties the search, shows the row first, leaves "{name} added." and returns focus to the field. **An error holds the banner's room (D-L111).** With a banner showing, a repeated name's error takes the banner's place, so nothing on the page moves when it comes, when typing clears it, or at the next add.

*Note added 2026-11-05 (recommendation; Romit may overrule).* **Rename dialog.** Title "Rename {name}", one name field holding focus, no description, Save name, the same structure as Rename on Skill lists. Back on a dirty rename asks "Discard your changes?".

**Primary:** Add a category, or Add a tag on the Tags tab.

| Other action | Where | Why |
|---|---|---|
| Rename | Row menu, dialog with one name field and Save name, the same as Rename on Skill lists (2026-11-05: was inline on the name) | Small, single field |
| Row menu: Rename, Delete (only when unused) | Row "..." | Consistent row actions (2026-11-05: Deactivate and Reactivate became the Status switch) |
| Status switch | Status column | Acts at once [REQ SL-06] (2026-11-05) |
| Skills count | Link, opens Library filtered | Count is a link to the list of equal length |

**Tasks:** Add -> inline row, name, Enter -> row added. Rename -> row menu, dialog, Save name (Enter works; disabled until changed) -> every skill follows (2026-11-05). Deactivate -> Status switch off -> row reads Inactive at once; skills keep it, marked inactive, until removed [REQ SL-06] (2026-11-05: was a dialog). Delete used: disabled with reason.
**States:** Empty: "Categories are optional. They group skills in the library." [INFER, kept short]. Duplicate: inline error. Inactive: sorted last.
**Not on the page:** skills editing, Tag input for mapping, step language, clinical settings or evaluators.

### D6. Skill lists

Requirements: CALL only, [CALL 11-04 rev L99-136, L172, L186] [Granola 365abc25 ch 9-11] [655e2cbd ch 1-2] [205da2dd ch 8-9] [e72ea925 ch 8-9]. **Job:** keep the named lists of skills students must achieve, and say who each one applies to. A list is like a shared document or an HR time-off policy: you make it, then choose who it applies to, and one is what newcomers get by default.

*Rewritten 2026-11-05 (D-L106), because the designer said Skill lists and Assign to students were "super confusing with a lot of text, toggles, tabs" and asked for a simple design from product analogies. One page, one table, one panel. D7 is merged here. References: Dropbox Dash share (one search box to add, then a who has access list), Toggl member picker (search, grouped results, All or None), Uxcel (one line, automatically assign to new team members).*

```
Skills > Skill lists
Skill lists                                                 [New skill list]
| Name                               Skills  Assigned to                 ...  |
| Clinical skills checklist Default    154   BSN 2027, ABSN 2027 + 1 more group (full list in a Tip)
| Core clinical skills                  52   BSN 2026, BSN 2028 + 3 students
| Revised clinical skills checklist    154   Not assigned (muted)

Panel (FloatingSheetPanel, the Library's close behaviour, no tabs)
Core clinical skills                                       ...  x
52 skills  [Edit skills]                 (or [View skills] when assigned)
Assigned to                                        [Add students]
BSN 2026          38 students    x
Abigail Yarborough   BSN 2028    x
(more than 5 named students: one row, "42 students", that opens to the names, each with x; groups stay listed)
New student groups get this list                         (toggle)
New groups get Clinical skills checklist now.

Add students (Dialog, one job, like a share dialog)
Add students to Core clinical skills                             x
[Search groups or students                        ] [Filters]
[Cohort: BSN 2028 x] Clear all
Groups
[ ] BSN 2028        42 students
[x] BSN 2027        29 students     Also on Clinical skills checklist and Practicum competencies   (only once ticked)
[x] BSN 2026 (disabled) 38 students                            Has it
Students                                               [Select all]
[ ] Abigail Yarborough  BSN 2028
Manage student groups                   Cancel  [Add 42 students]
```
**Primary:** New skill list on the page. In the panel, Add students is filled only while the list has no one on it; everything else there is outline. No Save on the page: adding, removing and the toggle act at once, each with a result banner and Undo. Save list exists only in the picker.

| Other action | Where | Why |
|---|---|---|
| Open the list | Click anywhere on the row; the name is a button for the keyboard | One door, same as Library. E1. Carried in the URL as `?list=` |
| Row menu | Row "..." and panel "...": Rename; New version where someone is on the list; Delete where no one is and it is not the default. Nothing else | E8. [INFER] A list on no one is edited in place, so it needs no version; deleting the default would leave new groups with nothing |
| Edit skills | Panel, when no one is on the list | Opens the picker in the same panel, wider. [205da2dd ch 9] |
| View skills | Panel, when someone is on the list | Same panel, read only, with one line and one action: New version. No state words [205da2dd ch 9, D-L104] |
| Add students | Panel, in the Assigned to row, or under "Not assigned yet." | One search box finds groups and students; Filters narrow Students; Select all takes what is shown. Sankalp's three ways with no segmented control [365abc25 ch 9] |
| Remove | x on the row in the panel | At once with Undo. If it leaves anyone on no list, an alertdialog first: "Remove BSN 2026 from Core clinical skills? 38 students will have no skill list. Their evaluations are kept." |
| New student groups get this list | Toggle at the foot of the panel | The default new groups get [205da2dd ch 9]. One at a time: on takes it from the other list, and a line names who holds it. Off on the default is not offered; another list takes it [INFER, the simplest]. Disabled with "Add skills first." on a list with no skills. An unassigned list can be the default, which reverses D-L60's delegated limit |
| Manage student groups | Quiet link, Add students footer left | Opens Settings, Student groups, and its breadcrumb returns to this list's panel [D-L79] (365abc25 ch 10-11; 655e2cbd ch 2) |
| Copy from another list | Picker, one quiet menu | Fills the selection, replacing it. Replaces "Start from" in the New skill list dialog |
| Mapping or reports links | Not here | One reason per page [CALL 11-04 pre L443] |

**Tasks**
- **Create:** New skill list -> `Dialog`: Name only, Create -> panel opens wide on the picker (search, Category filter, Select all shown, Copy from another list; Not configured marked) -> Save list -> the panel shows the list with Add students as its filled button, the next step in place [365abc25 ch 9]. Cancel removes a list that was never saved.
- **Add students:** Add students -> search, tick groups or students, or Filters and Select all -> the button names the count ("Add 42 students") -> added at once, the dialog closes, the panel shows the new rows, banner "BSN 2028 added to Core clinical skills." with Undo. Anyone already on the list is ticked and disabled, "Has it"; a student a ticked group brings reads "In BSN 2028". Someone on another list gets a muted "Also on {list}" and no choice: adding keeps other lists, and taking someone off another list is done on that list.
- **Change an assigned list:** panel View skills, or row menu -> New version -> "{name} v2", Not assigned, same skills, its panel opens -> Edit skills -> Save list -> Add students. Old groups stay [CALL 11-04 rev L109, L123].
- **Change the default:** open the list -> read who has it now -> toggle on -> Default badge moves, banner with Undo [CALL 11-04 rev L131-133]. A new student group made in Settings gets it (`defaultForNewGroup`).

**Filter** (Add students): cohort, track, term (a cohort with an offering in that term), enrollment type, enrolled in, with removable chips. Groups hide while a filter is on, since a filter is about students [INFER]. **Snapshot** [INFER, chosen for simplicity]: the students found when Add is pressed go on by name; nobody joins later by matching.
**Data:** `SkillList.groupIds` and `studentIds`. `exceptStudentIds` is gone from the UI and the data path; saved data that holds exceptions is made plain on load with the same people on the list (a group holding an excepted student becomes its other students, named), so no figure moves [INFER] (`plainLists` in `lib/lab/list-core.ts`).
*Note added 2026-11-05 (fix round).* **Picker footer:** a clean picker has no footer, no Save list and no Cancel. A tick brings "Unsaved changes", Cancel and Save list, the one filled button in the panel; unticking it takes them away again (rule E3). **Step-back doors:** X and Esc go back one level, from the picker to the list's panel with focus on the button that opened it, and from the panel to the table. A dirty picker asks on X, Esc and Cancel; Keep editing stays in the picker; Discard lands on the list's panel. A fresh list that was never saved leaves no row on any way out. A press outside the panel leaves it at either level. A result banner stays on the panel: none in the picker, and none on return from it.

**States:** Empty: "Make a list of the skills a group of students must achieve." with New skill list. First list becomes default. A list with no skills: Edit skills filled, Add students disabled with "Add skills first." No one on it: "Not assigned yet." with Add students filled. Assigned to is a plain list, about 8 rows, then scrolls. Inactive skill in a list: size shows "154, 2 inactive". Search with no match or filter with no match: a line with Clear. A dirty picker or a typed New skill list dialog asks "Discard your changes?" on every way out (E6). Add students holds only ticks, so it closes without asking [INFER]. A group or student with no list reads "Not assigned" on Skill lists and Coverage, and Reports and the dashboard name them in a banner and count them in no figure (D-L103). Evidence on removal: kept, one record per skill [REQ CM-07]. Old URLs: `?view=assign` opens this page on that list's panel; `?focus={group}` opens the list that group uses, else the default, and when the group is not on it, Add students searching for that group; `/lab/flow/{flow}/assign` redirects to the Skill lists step.
**Not on the page:** a separate Assign page or walkthrough stop, "Assign to students" as nav or label, "Who gets this list", the segmented routes, "Which students...", a summary beside Save, a page-level Save, Keep both, Move off, Leave out, "except N students", Assign buttons in cells, a Status column or the words Live and Draft (D-L104), Make default in a menu, Start from in the New skill list dialog, Map to courses, Create a group, students or completion columns, individual-skill mode [LEDGER D-L59], editing an assigned list in place, optional tag on the stop.

### D7. Assign

**Merged into D6 on 2026-11-05 (D-L106).** Assign is no longer a page or a stop. Who a list is assigned to is in its panel, and Add students is a dialog. Task scripts N1 to N9 now sit with T1 to T9 under F, Skill lists.

### D8. Course mapping

Requirements: CM-01 to CM-08, IM-09. **Job:** say where skills are expected, per offering. *Rebuilt 2026-11-05 as two panes (D-L100); the designer asked for this page to be better. Setup summary's group table moved here as Coverage.*

```
Skills > Course mapping
Course mapping                                         3 changes not saved yet.  [Save changes]
[By skill | By course | Coverage]

By skill
[Search skills ][filter]  | Blood pressure
Blood pressure         9  | [Search][Current and upcoming v][Cohort v][Academic year v][Professional year v]
Basic skills              | | [ ] Offering                          Level               |
Oral temperature       -  | | [ ] NUR 220 Family-Centered Nursing Care · BSN 2026   2 |
Basic skills              | | [ ]   Fall 2026 · 2026-27 · Year 4   [Mandatory v] .    |
                          | | [ ]   Spring 2027 · 2026-27 · Year 4    Not mapped v    |
                          Rows selected: [ 3 selected  Set level v  x ]

By course
[Search courses][filter]  | NUR 220 Family-Centered Nursing Care
NUR 220 Family-Cen... 12  | BSN 2026 · Fall 2026 · 2026-27 · Year 4
BSN 2026 · Fall 2026 ...  | 12 Mapped   3 Mandatory   9 Recommended
                          | [Search skills][All skills v]
                          | | [ ] Basic Skills                     5 |
                          | | [ ]   Blood pressure   [Mandatory v]   |

Coverage (end state)
| Student group  Skill lists               Assigned  In a course  In no course |
| BSN 2026       Core clinical skills · 52    52          6           46       |
```
**Primary:** Save changes, disabled until changed. Levels are a draft, because Sankalp looks for a Save and today changes write silently [CALL 11-04 pre L377].

| Other action | Where | Why |
|---|---|---|
| View toggle | Directly under the title, left | Both ways are required [CALL 11-04 pre L755], By skill opens first in first setup [CALL 11-02 L455] |
| Coverage | Same toggle | Restores the good graph as the end state [CALL 11-04 pre L775]; B9 |
| Mapped only | By course, the existing All skills select. The list opens with categories holding a mapped skill first, mapped first within each [INFER] (2026-11-05) | The first screen shows what the program decided |
| Filters: term, cohort, academic year, professional year | On one line beside the table they filter (By skill); in the left pane's filter, with chips (By course). Default current and upcoming | [REQ CM-02] |
| Clinical or didactic | Left pane's filter; a select on Coverage | [CALL 10-26] |
| Category, In a course, In no course | Left pane's small filter (By skill), chips below it | One phrase for "no course" |
| Set level | Selection bar: choosing a level applies to the draft, no second button. A group row's checkbox selects its offerings | Many rows |
| Figure in Coverage | Link to By skill filtered to that student group, clearing any filter that would contradict it | Figure opens a list of equal length |

**Tasks**
- **By skill:** pick skill -> set level on each offering -> Save changes -> banner "Blood pressure saved on 3 offerings." -> stays.
- **By course:** pick offering -> levels -> Save changes -> counts update [REQ CM-04].
- **Differ by offering:** same skill, different level per row [REQ CM-06].
- **Unmapped:** default for a list's skill on a cohort's offering; shows "Not mapped"; the student can still submit [REQ CM-05].

*Note added 2026-11-05 (fix round).* **What the Show filter means.** With no student group chosen: In no course plus In a course equals all on the list, and each option shows its count, following the search and category. With a group chosen the figures are group-scoped: In no course and In a course equal that group's Coverage figures and add up to its Assigned. Clear all and Clear filters clear every filter at once. A fresh URL opens what it says, with nothing remembered, and an explicit offering beats a filter on the same URL.

*Note added 2026-11-05 (recommendation; Romit may overrule).* **Column menus removed (D-L112).** The tables on this page offer no column menu: nothing here needs sorting, grouping or pinning, the group rows hold the order, and the first screen stays one job. **Save stays in view (D-L113).** Save changes stays in the page header (E3). While there is a draft and the header's Save is not wholly on screen, the same action sits under the table, right-aligned, with the line that says what is not saved: the DS table's sticky foot stack, under the bulk bar when rows are selected, so it covers neither the bulk bar nor the stuck head. This bends rule E3 on this page: one filled button shows at a time, and there is no bar with nothing to save. On a focus, the page moves the control clear of the stack, so a focused control is never under it [WCAG 2.4.11]. Saved from the bar, the page stays where it is and focus stays on the level last changed. **Coverage at 1920.** Six rows leave empty space under the table. The table already uses the full width and the only cause is short data, so nothing changes: a taller row or a stretched table would be filler (G5 judged as for D5 and D6).

**States:** No configured skills: "Set how skills are judged first." with link [REQ IM-09]. No offerings: "Offerings appear when courses are set up." Not configured skills: absent from pickers; a note with the count and a link. Offering with no mapping: Not mapped. An unsaved level: a small dot with a text alternative, and the line beside Save. Past offerings: shown only under the term or academic year filter; a skill mapped only on past offerings says so with Show all terms. A student group with no list: its Coverage row reads "Not assigned" and links to Assign (2026-11-05, D-L103). A student group with no offerings: "No courses".
**At 375:** one pane at a time, list then detail with a way back; filters behind one button with chips; Level on screen with no sideways scroll.
**Not on the page:** clone button [CALL 11-04 rev L160], term columns [CALL 11-04 rev L137], "From list" or level source per row, "Changed here", "Copied from" (OD-01 is open, 2026-11-05), a level writing across offerings (B6), Setup summary link, Optional level (B7, D-L76). No "required", "eligible" or blocking wording [REQ CM-05]. No amber on Coverage.

### D9. Competency mapping (Later, placeholder)

Requirements: REQ 1.4, OD-02, [CALL 11-04 pre L261-265, L639] [CALL 11-04 rev L172-179]. **Job:** optionally link skills to competencies as evidence. One panel row labelled Later and a one-line empty page. Not designed further until OD-02 moves.

---

## E. Interaction rules for all pages

Checked with `node tools/ds/source.mjs` against `@exxatdesignux/ui@1.5.1`. The package exports no `Combobox`, `Switch`, `EmptyState` or `SelectionBar`; use the named alternatives. `Popover` plus `Command` for type-to-search; `ToggleSwitch`; lab `EmptyBlock`; `DataTable` `bulkActionsSlot`.

1. **Edit lives on the row.** Click a row in any list: Library, Skill lists. One panel opens. `DataTable`, `FloatingSheetPanel`. There is no separate read view of a record that can be edited.
2. **Inline edit only for one value.** Times needed (2026-11-05: a category name is renamed in a dialog, D5). Saves on Enter or blur, shows "Saved" in place; a Times needed number that changes students' progress names them in a dialog first [REQ AE-02]. `InlineInputEdit` or `Input`. Any page where the admin makes several choices has a Save.
3. **Save lives in one of two places.** Page: top right in the page header. Panel, sheet, dialog: bottom right in the footer. *Amended 2026-11-05 (D-L97): a side panel that edits a record shows its footer only while there is something to save, holding "Unsaved changes", Cancel and Save changes; with nothing to save there is no footer and X is the way out. The footer must not shift the scroll position.* `PageHeader` via `PageFrame`, `FloatingSheetPanelWorkflowFooter`, `DialogFooter`. Never both on one surface; never a floating or sticky page footer on hub pages [LEDGER D-L42].
4. **Save label is verb plus object or count,** disabled until something changed. *Amended 2026-11-05 (D-L97): in a side panel it is absent until something changed, per rule 3. Amended 2026-11-06 (D-L115): so it is on the Configure one skill page, with Cancel, top right (D1c), since a disabled control fails the gate.* Exception: an invalid form keeps Save enabled and shows problems. `Button` variant default, size sm.
5. **One filled button per surface.** Everything else outline or ghost. No icons on text buttons. Max three header actions; more go under More. `DropdownMenu`, `ButtonGroup`.
6. **Cancel returns to where the admin came from** with state preserved. Close (x) and Esc do the same. Dirty: `AlertDialog` "Discard your changes?" with Keep editing, Discard. Link away from a dirty page: same. A side panel's X and Esc act on the first press, with no wait (D-L98). *Recommendation, 2026-11-06, Romit may overrule: Esc acts on panels and dialogs only, not on full pages. D1c has no Close to mirror, and Esc on a form should not throw a page away.*
7. **After Save,** a panel stays open on that record, a page stays on that page, a sheet that creates closes. The list behind has updated. *Amended 2026-11-06 (D-L115): the Configure one skill page lands in the Library with the same filters and scroll, the panel open on the skill and focus on Configure (D1c).*
8. **Row actions, same order everywhere:** Edit (when a row click is not enough), lifecycle (New version), Deactivate or Reactivate, Replace, then a separator, then Delete in destructive style. `DropdownMenu`, trigger `Button` ghost icon-sm with aria-label. The same verbs, in the same order, in panel "...", except that status is the panel's Active switch (D-L97).
9. **Bulk bar appears only with a selection,** at most three actions and clear, first action is the most common. Bulk changes use "Keep current" fields. Result banner lists rows that could not be changed and why. `DataTable` `bulkActionsSlot`.
10. **One `LocalBanner` at a time, above the content.** Result: "{Object} {past verb}." Optional one action: the next job or undo. Warning: one, states count plus link. Never `toast`. Never a banner and a sentence saying the same. *Amended 2026-11-05 (D-L106): on Skill lists the result sits in the open panel, at every width, because the panel loops Tab and an Undo on the page could not be reached by keyboard; a second press of a double click is dropped across the page, so a row going or a banner arriving cannot make it hit something else.*
11. **Destructive and deactivate:** `AlertDialog`, title names the object, body gives counts of what happens, button repeats verb and scope ("Deactivate 3 skills"). Deactivate is reversible; banner offers Reactivate. Delete only while nothing is tracked. Amber for shortfall and warnings, red only for a hard block.
12. **Breadcrumbs reflect the structure,** in the shell slot, never in the body. No Back control on a page with breadcrumbs [LEDGER D-L42]. `Breadcrumb`.
13. **What comes next is said once:** a result banner's single action. Pages carry no Next, no step rail, no checklist. Lab Next lives only in the path bar [LEDGER D-L64]. Focus workflows (Bulk upload, Starting points) have Back and primary in a footer, and one exit.
14. **One title, no subtitle, no helper line** unless a control is ambiguous [LEDGER D-L34]. `TYPE` scale only. `Field`, `FieldLabel`, `FieldError`; `FieldDescription` is the exception, not the default.
15. **Status and Configuration words** come from D0, in separate fields: plain text for Default and Active, `StatusBadge` with glyph, word and tone for the exceptions (D-L97). Never `Badge` for state. Filters: one Filters button with removable chips. Views: `ViewSegmentedControl`. Tabs carry counts: `Tabs`, `TabsCountBadge`.
16. **Choices:** `RadioGroup` for one of few; `ViewSegmentedControl` for the two-way Default or Custom on the Configure one skill page (D-L97, D-L115); `Checkbox` for many; `ToggleSwitch` for on or off, Status in a panel header included; `Select` for one of up to seven, `Popover` plus `Command` above seven (the list select this rule forced on Assign is gone, D-L106). Nothing preselected where the requirement says explicit [REQ SC-02].

---

## F. Task scripts (acceptance tests)

Setup for every script: open the site. On the path bar choose Exit, then Start again, to reset data; off the path, the lab bar's Scenario, Reset all edits does the same and stays on the page (both clear every edit in this browser, added skills and the new program included, 2026-11-05). URLs are relative to the site root. Mark pass only if the whole result happens. Figures are the seed as of 2026-11-04; re-check after the build.

**Global checks on every page** (fail any, the page fails)
- G1. One filled button. Exactly one title. No line of text under the title.
- G2. Save, Cancel and Close behave per E3 and E6.
- G3. Change something, click a Skills panel row: asked to discard.
- G4. No em dash, no "items", no "tick", no requirement ID.
- G5. Width 375, 1440, 1920: no horizontal page scroll, no large empty area at 1920.

### Walkthrough
| # | Start | Do | Result |
|---|---|---|---|
| W1 | `/` | Press Next three times | Stops read, in order: Library, Evaluation settings, Skill lists, Course mapping. Path bar says "1 of 4" to "4 of 4" |
| W2 | stop 4 | Press Next | Student path stop 1 opens |

Note, 2026-11-05: W1 and W2 once read five stops, with Assign fourth and the student path after stop 5. D-L106 merged Assign into Skill lists, so the path is four stops; `lab-task-tests.mjs` W1 and W2 test four. The student path bar reads "of 7" (D-L67, `fulfillment-walkthrough`), a separate path.

| W3 | stop 1 | Add a skill menu, Add several | Add several opens as a sheet on Library. The path bar stays on Library |
| W4 | anywhere on the path | Search the page for "Setup summary" and "Configure the skill" in the path bar | Neither appears |
| W5 | student path stop 1 | NURS 350, then Next | Bar reads Skills by course, 2 of 7, then Self-evaluation, 3 of 7, on Nasogastric tube care. Next on stop 1 still names that skill |
| W6 | student path stop 1 | Do this next: Fix and send, then Make a further attempt; Back each time | Bar stays, reading Fix or further attempt, 1 of 7; Back returns to My progress |

### Library
| # | Start | Do | Result |
|---|---|---|---|
| L1 | `/lab/admin/skills-library` | Note All count. Search "blood" | Rows narrow to matches; Clear restores count |
| L2 | same | Filters, choose one category, one tag | Chips appear; each removes alone; tab counts follow |
| L3 | same | Row Blood Pressure, Times needed cell, type 5, Enter | Dialog names the students whose progress changes, if any; confirm. Cell shows 5 and Saved. Status and Configuration unchanged. Reload: still 5 |
| L4 | same | Filters: Different number | Blood Pressure is listed |
| L5 | same | Select 3 rows | Bar: 3 selected, Configure 3 skills, Edit 3 skills, Deactivate 3, clear. Nothing else |
| L6 | same | Clear selection | Bar gone |
| L7 | `?state=empty` | Read the page | Message, Add a skill, Add several, Bulk upload. No table |
| L8 | same as L1 | Row menu | Exactly: Edit, Deactivate, Delete (2026-11-05, D-L105) |
| L9 | same as L1 | Read the tabs and columns | Tabs: All, Active, Inactive. A Status column reads only Active or Inactive, with a badge only on Inactive. A separate Configuration column reads only Default, Custom or Not configured, with Default plain and a badge on the other two. The replaced words Program default, Own settings, Custom and Default appear nowhere in the table |
| L10 | same as L1 | Filters: Configuration, Custom | Options read Default, Custom, Not configured. About 12 rows, the same count as "keep their settings" in the Evaluation settings dialog; chip removes alone |
| L11 | same as L3 | Times needed cell, type a new number, Enter, then Cancel in the dialog | Cell returns to the old number, nothing saved |
| L12 | `?program=new` | Read the banner, press its action; then a seeded program with no question-less skill | Banner gives the count and Set how skills are judged. Seeded: no banner, Configuration filter on Not configured finds 0 |
| L13 | same as L1 | Search "blood"; then a word nothing has | All reads the rows shown; "No skills match" sits beside All 0. Clear restores it (2026-11-05) |
| L14 | same as L1 | Filters: On no list, and a Came from choice | Both become chips, each removes alone (2026-11-05) |
| L15 | same as L1 | Header More; View; Columns; reload | More has Categories and tags and Export. View offers By category and Plain list. Columns adds a column. The choices survive a reload. No column menu in the header (2026-11-05) |
| L16 | same as L3 | Times needed, type a number, Enter, confirm the dialog | Focus is on the next row's cell (2026-11-05) |
| L17 | Inactive tab, then Library | Select only inactive; then Space on a row, Tab, Enter; then width 375 | Bar has no actions and no zero. Tab offers Go to selection actions, Enter lands in the bar. At 375 every action is on screen (2026-11-05) |
| L18 | `?program=new` | Read the page with no skills | The same message and three ways as L7. No Set up skills, Setup paused or Continue setup (2026-11-05) |
| L19 | `?program=new`, one skill added with no category | Read the page | Plain list, no No category row, no Category column. One banner, under the title (2026-11-05) |
| L20 | Library, a skill added; `?program=new`, a skill added | Scenario, Reset all edits; then on `/`, add one and Exit, Start again | Both programs are back to their seed (2026-11-05) |
| L21 | `?program=new` | Add a skill, dismiss the banner | "1 skill not configured." at once; same after dismissing a panel "saved" banner |
| L22 | Library | Select 1, bar clear | Focus on that row's skill link |
| L23 | Library | Row menu Deactivate, confirm, banner Reactivate | Focus on that row's skill link |
| L24 | Library | Times needed cell, Tab, confirm or Cancel | Focus on Configuration in the same row |
| L25 | Library | Row menu Deactivate, Esc | Focus on the row's "..." |
| L26 | `?state=loading` | 1440, 375, 1920 | The table's heads, a group row, row skeletons; no sideways scroll |
| L27 | Library | Columns, Tags on, off | On: no tags line, chips in the column. Off: the line is back |

### Edit a skill
| # | Start | Do | Result |
|---|---|---|---|
| E1 | Library | Click Blood Pressure row | Panel opens on Details, tabs Details and Used in. Library still visible. No footer. Active switch on in the header, named "Skill is active". No Status row, no Deactivate button. Times needed and the rule sentence on Details. Evaluation settings reads Default, with Configure to the full page (D-L115) |
| E2 | E1 | Change the name, Save changes | Banner names it. Panel stays. Row in the list shows new name. Configuration unchanged |
| E3 | E1 | Change description, category and add a new tag typed in the tags box, Save changes | All show on the row and after reload. New tag appears on Categories and tags. Configuration unchanged |
| E4 | E1 | Change name, press Cancel in the footer | Asked to discard. Discard: name reverts. Keep editing: stays |
| E5 | E1 | Change name, click another row | Asked to discard before switching |
| E6 | E1 | Turn the Active switch off | Dialog with counts for courses, students, evaluations. Keep active: switch stays on. Confirm: switch off, row Inactive, Configuration unchanged, banner has Reactivate, row muted |
| E7 | E6 | Open Course mapping By skill | The skill is not in the picker |
| E8 | E6 | Turn the switch on | Dialog names the students holding evidence (2026-11-05, D0 rule 9); confirm. Status Active. Configuration as it was before E6 |
| E9 | Library, the Configuration word | The page; choose Custom; open each section | Under Default: rule sentence atop the preview, Times needed, the read-out, From Evaluation settings, Add minimum. Under Custom: What counts as achieved open; the other three closed, each stating its values; one open at a time; every field live. Default again with nothing changed: no Save changes |
| E10 | E1 | Header "..." | Delete. No Replace with a new version, no Configure (2026-11-05, D-L105) |
| E11 | E9 | Who evaluates, flip Feedback is required | Cancel and Save changes appear in the header. Discard: the table row has not changed |
| E12 | E11 | Save changes | Lands in the Library, panel open on the skill, banner names it, focus in the panel. Table row reads Custom; Status still Active. Reload: Feedback still flipped, still Custom. Configuration filter Custom count is one higher |
| E13 | E12, the page | Choose Default, then Cancel | The page reads Default, then asked to discard; Discard: skill still Custom, Feedback as saved |
| E14 | E12, the page | Choose Default, Save changes | Configuration Default. Feedback follows the program. No impact dialog, since no progress changes. Times needed untouched |
| E15 | Custom skill whose edit changes who has achieved it, the page | Choose Default, Save changes | Dialog counts the students first, with Show names. Cancel changes nothing; confirm applies |
| E16 | E9 | How this skill is judged, choose Approved or not approved; open What counts as achieved | Levels and Counts gone from the form; Labels and Which one qualifies appear, nothing preselected unless the program uses this model |
| E17 | E16 | Save changes without filling them | Problems listed; focus on the first; dialog does not open [REQ SC-18] |
| E18 | E16 | Fill both, Save changes | Dialog lists what is cleared (Levels that count, Minimum at each level) and counts students who change. Confirm: Configuration Custom |
| E19 | E9 | Choose Questions, Save changes, confirm | Saved with no questions. Table reads Not configured. On the page: No questions yet with Add questions as its one action; the switch still offers Default; the preview line. Skill absent from the Course mapping picker |
| E20 | E19, the panel it lands on | Times needed: type 4, Save changes | Saved. Configuration still Not configured. Also works from the table cell. Reload: 4 |
| E21 | E19, the page | Add questions, write 3, Counts when: All Yes, Save changes | Configuration Custom. Skill back in the Course mapping picker. Rule sentence states the count |
| E22 | E1 | Times needed: raise it, Save changes | If progress changes, dialog names the students first. Configuration stays Default; the Different number filter lists the skill |
| E23 | E6 | In the panel change description and Times needed, Save changes; Configure; under Custom flip Feedback, Save changes | All saved, no impact dialog, Status still Inactive, Configuration Custom, switch still off. Skill still absent from Course mapping |
| E24 | E23 | Turn the switch on | If the edits change progress, dialog names the students first. Status Active, Configuration Custom |
| E25 | E12 | Evaluation settings, change Feedback required, Apply | Dialog counts this skill under "keep their settings". Skill unchanged |
| E26 | The page, Default | Add minimum: read the menu; choose a setting, enter more than Times needed; Save changes | At a level, From a clinical setting, Different evaluators; clinical settings only, no lab or simulation. Blocked with the reason, listed, focus on the field. It stays Default |
| E27 | The page, Custom | Add a bad minimum, Save changes, open another section, Save changes | The closed section reads 1 to fix, and reopens on the problem |
| E28 | The page | Read What they will see at 1440; Preview at 1000 | Student and Evaluator tabs for this draft beside the form; below 1100 px a Dialog; closing it keeps the draft |
| E29 | `?program=new`, any row | Read, then type Times needed, Save changes; Configure | Panel reads Not configured, with Configure; Times needed saved, stays Not configured. The page has Set how skills are judged and no switch |
| E30 | Library at 1440 and 375 | Open the panel, change Times needed | No horizontal scroll inside the panel. Header and tabs stay in view while the body scrolls. Footer in view with Cancel and Save changes |
| E31 | E1 | Press X; again from the row, press Esc; again, hover X then Esc; again, change nothing and click the page; 10 times each | Closes on the first press, within a frame or two, at `/` and at the Library, at 1280, 1440, 1920. Measured from the press to the first painted frame, opening as well (2026-11-05): under 100 ms on an unloaded build is the target; the script's limit on the dev server under load is 600 |
| E32 | Library at 1440 | Collapse to icons; open and close the panel; go to the next stop; reload | The menu stays collapsed throughout. Show labels with the panel open: the menu expands, the panel stays, and closing the panel leaves it expanded |
| E33 | E1 | Configuration cell's word | A link to the full page. The rest of the row opens the panel on Details. Plain Default, a badge on Custom |
| E34 | E1, a short window | Scroll the panel body, change Times needed | The footer appears and the scroll position does not move |
| E35 | The page | Choose Custom, Save changes; the page again, choose Default, Save changes; press X on the panel | Row reads Default, no footer on landing, X closes with no question (2026-11-05) |
| E36 | Categories and tags, then Library | Open Height, change its name, Cancel, Discard; open another, Next; browser Back; Forward | Back reaches Categories and tags. Forward never opens Height (2026-11-05) |
| E37 | E19 | Read the panel and the page | "Student needs N evaluations." in both (2026-11-05) |
| ER1 | Library, a name typed in the panel, not saved | Click the Inactive tab; Keep editing; click it again; Discard | Asked first, URL and tab unchanged under the question. Keep editing: list as it was, typed name kept, focus back in the field. Discard: Inactive tab selected, panel closed, typed name never reached the list |
| ER2 | ER1 start | Click the Skill column header; Keep editing; tick a row checkbox | Sort asks first and the list does not change. The checkbox does not ask, rows and URL stay, typed name kept |
| ER4 | Panel on Sitz Bath, which nobody has progress on | Times needed 4, Save changes | No dialog. Banner names it. The table reads 4 |
| ER5 | Panel on Blood Pressure, then its row | Open the panel header menu; open the row menu | Delete disabled in both, with "Has N evaluations, so it cannot be deleted" visible in the menu |
| ER6 | Library, Inactive tab | Open the first row; Configure; choose Custom | Active switch off. Name editable, Times needed and the row cell inputs present. The page has an Inactive badge and model radios |
| ER7 | Library, grouped view | Open the first row, press Next through 7 rows; then on the Inactive tab press Next to the last row | Previous disabled on the first row. Next follows the rows on screen, current row in view. Next disabled on the last row |
| ER8 | Library | Add a skill, Delete it from its row; then open `?skill=does-not-exist` | Dialog says it is in no course. Banner names it deleted. No `?skill=` left in the URL, nor from the bad link |
| ER9 | Library | Search Sitz Bath, row menu, Delete | Dialog lists the courses, and its "leaves N course" count equals the list |
| ER10 | ER1 start | Change Times needed, turn the Active switch off, Deactivate | No discard question, the Deactivate dialog instead. Row Inactive. Typed name and number kept |
| ER11 | Old link `/lab/admin/configure-skill?skill=hgtc-basic-skills-11` | Open it | The full page for Blood Pressure (D-L115) |
| E38 | Skill lists, Library | One Esc with hover or focus on Close or Panel size; Esc on the Panel size menu | Panel closes on one Esc; on the menu, only the menu closes |
| E39 | Panel | Type in Name, hover Close, Esc | Asked to discard on the first press |
| E40 | Panel | Rename, Save changes, change a field | "saved" banner gone; a "deactivated" banner stays |
| E41 | Panel, Details | Times needed 999, empty, 3 | No sentence at 999 or empty; "Student needs 3 evaluations..." at 3 |
| E42 | 375 | Skill with a 90-character unbroken name | Title wraps; no sideways scroll |
| E43 | Add a skill, Add several, Edit 3 skills | Clean, hover then focus Close, Esc | One Esc closes; focus on the opener |
| E44 | The same three | Dirty, hover then focus Close, Esc; Keep editing | Asks on one Esc; the sheet stays; the tooltip has gone; Keep editing returns |
| E45 | Add a skill | Tag suggestions open, Esc | The suggestions close; the sheet stays, with no question |
| E46 | Source | Read `lists-panel.tsx`, `skill-panel.tsx` and admin sheets | No keydown listener on the two panels; `FloatingSheetPanel` comes from `shared/sheet` |

### Configure one skill
Added 2026-11-06 (D1c, D-L115). Group CFG in `scripts/lab-task-tests.mjs`.
| # | Start | Do | Result |
|---|---|---|---|
| CFG1 | The page, each model, Default and Custom, at 1440 x 900 | Measure | Every number in the D1c budget holds |
| CFG2 | Library | Open by the panel's Configure, the Configuration cell, the selection bar with 1 row, an old `?section=evaluation` link | Each lands on the page for that skill |
| CFG3 | A skill on each model, Default | Read | Read-out shows only rows that apply, including Student fills in and Group check-off |
| CFG4 | New program, a skill | Read, then choose a tile | No switch, line and filled action, no tile chosen, preview line; choosing starts Custom and the other sections appear |
| CFG5 | A skill whose model needs questions and has none | Read, Add questions | No questions yet with Add questions; preview line; after adding, the evaluator's form |
| CFG6 | The page, clean | Change a value, change it back | No Save or Cancel, then both, then neither |
| CFG7 | Custom, a closed section holding a bad value | Save | Problems listed, section opens, field focused; closed sections with a problem read "1 to fix" |
| CFG8 | Library filtered and scrolled | Configure, change, Save | Library, same filters and scroll, panel open, banner "{Skill} saved.", focus on Configure |
| CFG9 | The page with a change | Each way off: Cancel, crumb, Skills panel row, sidebar, From Evaluation settings, walkthrough bar, Back, reload | Each asks "Discard your changes?"; Keep editing stays with the change; Discard leaves |
| CFG9b | Not configured (a) and the walkthrough, with a change | Set how skills are judged; the path bar | Each asks "Discard your changes?" |
| CFG10 | Custom, How this skill is judged open | Arrow keys on the model | Model changes, the section stays open, focus stays on the tiles |
| CFG11 | The page at 375 and 1920 | Read each state | No sideways scroll; 375 has Preview as a header Dialog; 1920 has two equal columns |
| CFG12 | Custom, change Feedback, switch to Default and back | Read | The Custom draft is still there |
| CFG13 | Each model, each section | Change a value, Save, reload | It stuck; the student and evaluator views changed |
| CFG14 | Library filtered, the page | Change, Cancel, Discard | Back at the origin with filters and scroll; nothing saved |
| CFG15 | Library, select 2 | Configure 2 skills, at 1440 and 1000 | D4 with the same sections, Edit levels, Add minimum, no switch; the selection beside them titled with the count at 1440, Show skills at 1000 |
| CFG16 | 120 skills selected | Read at 1440 | The list scrolls in its own box, on screen |
| CFG18 | Panel, name with stray spaces | Save changes | Field shows it trimmed; footer gone |
| CFG19 | Walkthrough, the page opened directly | Save; Cancel, Discard | Both land on the path's Library stop |
| CFG20 | The page, no signers | Read Evaluator | "Who can sign off is not chosen"; read-out "On, students get works alone" |
| CFG21 | D4, Mixed model | The way forward | Mixed plus the link, which opens How this skill is judged, on What counts and Group check-off |
| CFG22 | `?program=new`, D4 | Read | Message and link; crumb as title; no stay line; "..." item disabled with its reason |
| CFG23 | Library with search, tab, scroll, D4 | Cancel | All three back |
| CFG24 | Inactive selected | Bar; D4; Save | Bar says why or how many left out; page and result name them |
| CFG25 | D4, minimums differ | Add minimum, too many, then a good number, Save | Failing skill named; each keeps its own and gets the new one; no None under Mixed |
| CFG26 | D4 | Raise Times needed; change Feedback | Dialog names who moves, no table; no dialog when nobody moves |
| CFG27 | D4 and D1c | Close Preview, Keep editing, Discard, leave | Focus on the trigger, or the next page's title |
| CFG28 | D4, Approved with blanks | Save | No line repeats; count equals the sections' to fix |
| CFG29 | D4 | Start from, search Irrigation | Searchable; same names carry a category |
| CFG30 | D4 | Read the header | Save 3 skills; Use default configuration under "..." |
| CFG31 | D4, URLs | Save, reload; odd links; 375 | Said once; one valid id goes to D1c; no stray skill; Mixed not clipped; one discard wording |
| CFG17 | The page, Custom, change, Default | Each way off; Keep editing; Discard; Custom then Default with no change | Each asks; Discard leaves; with no change nothing asks |

### Bulk edit
| # | Start | Do | Result |
|---|---|---|---|
| B1 | Library | Select 3, Edit 3 skills | Panel: every field reads Keep current. Update disabled |
| B2 | B1 | Category: pick one, Update | Banner "3 skills updated". All 3 moved. Selection cleared |
| B3 | Library | Select 3, Configure 3 skills | Title "3 skills". Differing field reads Mixed. Save with no change disabled |
| B4 | Library | Select 3 with one inactive, Edit | Panel says one inactive left out, names it |
| B5 | Library | Select 3, Deactivate 3: Keep active; again, Esc; again, double click Deactivate 3 skills; Reactivate on the banner | Dialog shows three figures. Selection kept after Keep active and Esc. Banner "3 skills deactivated"; its Reactivate restores all 3 (2026-11-05) |
| B6 | B1 | Esc; Edit again, set a category, double click Update | Selection kept and focus on Edit after Esc. The second press opens no row, and focus is not on the body (2026-11-05) |
| B7 | Library | Blood Pressure and 2 others, Times needed 1 | "2 skills updated. Not updated: Blood Pressure. 2 different evaluators cannot sign 1 evaluation." |
| B8 | Library | 2 already at 1, Times needed 1 | "No skills changed. All 2 already have these values." Info |
| B9 | Library | 1 at 1, 1 at 3, Times needed 1 | "1 skill updated. 1 already has these values." |
| B10 | Library | Blood Pressure, tag and Times needed 1 | "1 skill updated. Times needed not changed: Blood Pressure..." The tag is on the row |
| B11 | Library | Select 3, search nothing | "3 selected, 3 not shown", Deactivate 3; clear: "3 selected" |
| B12 | Library | Select 3, Inactive tab | Bar as B11; Deactivate 3 asks for 3; Keep active keeps it; All: same 3 ticked |
| B13 | Library | Select 3, Inactive tab, header box twice | Adds only that tab's rows, takes away only those |
| B14 | Library | Edit N, set a field, Back | Asked to discard; Keep editing keeps value and URL; Discard goes back |
| B15 | Library | One tag in Add tags and Remove tags, Update | Inline message; nothing written; focus on Remove tags |

### Add
| # | Start | Do | Result |
|---|---|---|---|
| A1 | Library | Add a skill, leave name empty, Add skill | Error on the name, focus there |
| A2 | Library | Add a skill "Test skill", category typed new, Add skill | Sheet closes, row at top, Status Active, Configuration Default, banner says it uses the default. No configure page opens |
| A3 | Library | Add a skill "Blood Pressure" | Duplicate warning with Open it. Skip chosen, Add skill disabled (changed 2026-11-05: D2 default) |
| A4 | Library | Chevron, Add several, paste 5 lines with one repeat | Line says 4 new, 1 repeated. Add 5 skills. Banner, Show them filters to them |
| A5 | Library | Chevron | Add a skill, Add several, Bulk upload and Starting points both marked Later |
| A6 | Reset, no settings saved `?program=new` | Add several, 3 names | Configuration Not configured, Status Active, banner with Set how skills are judged. Course mapping cannot offer them |
| A7 | Add a skill and Add several | Type a tag, Enter, Tab 12 times | Suggestions closed. Focus never leaves the sheet (2026-11-05) |
| A8 | Add several | Paste 20 names already in the library, All 20 repeated names: Keep both for all | Add 20 skills. The list is not capped (2026-11-05) |
| A9 | A skill added in this session | Add a skill, the same name: Open it; again, Replace | Open it asks nothing. The row reads Updated, not New, and not under Just added (2026-11-05) |
| A11 | Add a skill | Tags: "Pa" Enter; "patient safety" Enter; "Pa" ArrowDown Enter | Chip "Pa"; chip "Patient safety"; the highlighted suggestion |
| A12 | Add several | One new, one Sitz Bath on Replace | "Add 1, replace 1"; Show them; both persist under their categories |
| A13 | Add several | 4 repeated lines at 1440 | Selects share a left edge; Category and Tags one height |

### Evaluation settings
| # | Start | Do | Result |
|---|---|---|---|
| S1 | `?program=new` version of `/lab/admin/evaluation-settings` | Read | Only "How skills are judged" and an empty panel. No option selected. Save disabled |
| S2 | S1 | Independence level | Levels with a Counts box on each row, Times needed, and the two sections below appear. No Counts box selected (2026-11-05) |
| S3 | S2 | Save without filling | Problems listed; focus on the first |
| S4 | S2 | Fill all, Save settings | No skills (S4a): "Apply these settings?", "New skills take these settings when they are added.", no number, Apply settings; banner "Settings saved." with Open the library. One skill (S4b): "Apply to 1 skill?"; banner "Saved for 1 skill." |
| S5 | S4 | Open the library | Configuration reads Default on all; no banner; Configuration filter on Not configured finds 0 |
| S6 | Seeded page | Select Counts on Developing | Developed also selected. Unselect Developed: Developing clears |
| S7 | S6 | Rename a level, Save | No students line in the dialog. Evidence counts unchanged on Reports |
| S8 | Seeded page | Change Times needed from program number, Save | Dialog shows how many follow and how many keep their own. Library: followers changed, Blood Pressure stays at 5 |
| S9 | Seeded page | Link "skills use a different number" | Library filtered; count matches |
| S10 | Seeded page | Switch model to Questions | Rows change. Final result absent anywhere. Counts when: All Yes, At least N of M, Named questions |
| S11 | Seeded page | From 1100 px read the panel, both tabs; below 1100 px press Preview | Rule sentence, then Student and Evaluator forms; no Preview button beside the panel. Below 1100 px the dialog shows both. No Summary card (2026-11-05) |
| S12 | Seeded page | At 1920, look for an empty right-hand area | Settings and the panel fill the width (2026-11-05) |
| S13 | Seeded page | Questions, write 3, Counts when, Save, Apply | Dialog: "N use them", no "not configured". Library: Not configured finds 0. Skill's panel shows the 3 and reads Default |
| S14 | S13 | Panel of one skill: change its questions, Save. Back here: add a fourth, Save | Dialog: "1 keep their own". That skill keeps its own and still reads Default; others have 4 |
| S15 | Seeded page | Score on a scale, top 7, write questions, rule. Read the panel's Evaluator tab; Save, Apply. Open the evaluator form, then the student request | No Outcome on either. Scores run 1 to 7. The student scores each question. A low score reads Did not meet criteria after submit |
| S16 | Seeded page | Approved or not approved: nothing selected under Which one qualifies. Choose the second label, Save | Dialog names students. An evaluator choosing the second label reads Counts now; the first label does not count |
| S17 | Seeded page | Who can sign off: Lab instructor only, Save | Dialog names the reason for each group, never "No questions yet" |
| S18 | Seeded page | Type 51 in Times needed, Save; then -3 | "Enter 1 to 50." under the section name What counts as achieved, no dialog, no message about other minimums (2026-11-05) |
| S19 | Seeded page | Save, Apply, then edit any row | The Saved banner clears. Save with a bad value: only the problems banner shows (2026-11-05) |
| S20 | Keyboard only | Tiles with arrow keys, Tab through level rows, Space on Counts, Enter on Move, Space on a switch; Save, Esc | Arrows select; focus stays on the row being moved or removed; focus returns to Save on Esc or Cancel, to the choice that holds after the switch dialog (2026-11-05) |
| S21 | Seeded | Edit fields; Edit field | Save fields and Save field, disabled until changed |
| S22 | Seeded | Paste a list; Add a field: Esc, Cancel, Add | Focus on the opener, never the page |
| S23 | Seeded | Untick every level | No rule sentence; tick one: it returns |
| S24 | Questions | 1 question, At least 9, Save | "Enter 1. There is 1 question." |
| S25 | Questions | Paste A, A, a, B; then B | "Add 2 questions", "2 repeats are left out."; then disabled, "These questions are already on the list." |
| S26 | Seeded | Group check-off off, then on | Save changes disabled again |
| S27 | Seeded; `?program=new` | Switch that moves nobody; first save | No students row; no zero |
| S28 | 1920 | Preview panel | Artifact reaches the panel's right edge |
| S29 | 375, 1440, 1920 | Model tiles | At most 3 lines; 2 by 2 on desktop; full words |
| S30 | Form C on `sub-maya-1` | Labels differing; then shared | "Mark all as counting"; then "Mark all met" |

### Per-skill settings
Bulk only since 2026-11-05 (D4). The single-skill versions of these tasks are E11 to E26 and group CFG.
| # | Start | Do | Result |
|---|---|---|---|
| K1 | Library, select 3, Configure 3 skills | Read | Title "3 skills", crumb Skills > Library > 3 skills. Rows as D3, live, no switch. A field they differ on reads Mixed |
| K2 | K1 | Add minimum larger than Times needed, Save | Blocked, reason shown, focus on field |
| K3 | K1 | Change Feedback required, Save 3 skills | No dialog, since nobody's progress moves (2026-11-06). Back in Library, banner "3 skills saved.", selection cleared. The 3 rows read Custom; others unchanged |
| K4 | K3 | Evaluation settings, change Feedback required, Apply | Dialog counts these 3 under "keep their settings". They are unchanged |
| K5 | K3 | Select the same 3, Configure 3 skills, "...", Use default configuration | No dialog when nobody moves; banner says it. Configuration Default on all 3, feedback follows the program |
| K6 | K1 | Add minimum: setting list | Clinical settings only, no lab or simulation |
| K7 | Library, select 1 | Configure 1 skill | That skill's full page opens (D1c). The bulk page does not. Reverses the earlier K7 (D-L115) |

### Categories and tags
| # | Start | Do | Result |
|---|---|---|---|
| C1 | `/lab/admin/categories-tags` | Add a category "Airway test", Enter | Row added, Add button still the one filled |
| C2 | same | Count in Skills column of a row, click | Library filtered, row count equal |
| C3 | same | Status switch off on a used category (2026-11-05: was Deactivate with a dialog) | No dialog. Row reads Inactive at once, and sorts last after reload. Skills keep it marked Inactive. Absent from the Add a skill picker |
| C4 | same | Row with skills, menu | Delete disabled with a reason |
| C5 | `?state=error` | Try again | Tabs with no numbers; no icon on Try again; counts return |
| C6 | Row menu | Rename | Title "Rename Airway", no description, focus in the field |
| C7 | 1440, 1920 | Add a category | Button holds its box; one filled; focus in the field |
| C8 | Form open | Repeated name, Enter | Error under the field; nothing moves |
| C9 | 1440, 1920, 375 | New name, Enter | Field still; new row first; no scroll; focus stays |
| C10 | 375 | Open the form | Cancel and Add on one line |
| C11 | 1440 | Form open, scroll 600 | Field in view; head under the tabs |
| C12 | Form open | Add, scroll, Dismiss | Focus in the field |
| C13 | Form closed | Rename, Dismiss | Focus on Add a category |
| C14 | Rename | Change, Back | Asked to discard; Keep editing returns; Discard leaves |
| C15 | Search "a" | Far row's Skills count, Back | Search, rows and scroll kept |
| C16 | Long name | Tab onto it | Tooltip with the whole name; a short name is no Tab stop |
| C17 | Status switch | Double click | Changes once |
| C18 | Add a category | Double click | Form opens, no error |
| C8b | 1440, 1920, 375 | Repeated name, Enter, then type | Field, search, table and Add do not move |
| C8c | Same, banner showing | Repeated name, type, another name | Nothing moves at any step: the error holds the banner's room |
| C8d | 1440, 1920, 375 | Repeated name, Enter | Error within 8 px of the field |
| C9b | Form open | Zeta, Alpha, Mid | First rows read Mid, Alpha, Zeta |
| C9c | Scrolled 400, banner showing | Add a name | Scroll, field and focus unchanged |
| C9d | Scrolled 120, no banner | Add a name | Field holds on screen; a row moves by the new row at most |
| C18b | Add a category | Double click, type | The text is in the field |
| C19 | Search "air" | Add "Hidden x"; Clear search | "Hidden x added. Your search hides it."; search and `?q=` kept. Clear search: row first, "Hidden x added.", focus in the field |
| C20 | Search "air" | Add "Airfield x" | Row first, search kept, no action on the banner |

### Skill lists
*T and N are one group since 2026-11-05 (D-L106): the page, the panel and Add students. The IDs stay.*
| # | Start | Do | Result |
|---|---|---|---|
| T1 | `/lab/admin/lists-cohorts` | New skill list, name "Test list", Create | Name is the only field. Picker opens with search, Select all shown and Copy from another list |
| T2 | T1 | Select 5 skills, Save list | Banner names it. Table shows Test list, 5 skills, a muted Not assigned, no button in the cell. Same after reload |
| T3 | T2 | Read the panel | It shows the list, "Not assigned yet.", and Add students as the one filled button |
| T4 | Table | Open an assigned list, View skills | Read only, no checkboxes; one line and New version. No state word |
| T5 | Table | Assigned row menu | Rename, New version. Nothing else |
| T6 | Table | New version | "{name} v2", Not assigned, same skills, its panel opens with Edit skills; original unchanged; same after reload |
| T7 | Table | Open a list that is not the default, turn on New student groups get this list | A line names the holder first. Default badge moves; only one list has it, after reload. The toggle cannot be turned off on the default. The old default's line names the new one |
| T8 | Table | Look for Map to courses and Create a group, menus too | Neither present |
| T9 | Table | Read the page; open an unassigned row's menu; open it, Edit skills | No Status column, no Live or Draft. Menu: Rename, Delete. The picker opens |
| N1 | `/lab/admin/lists-cohorts?view=assign&list=list-core` | Read, Add students | Skill lists, that list's panel, `view=assign` gone. No Save, no list select, no routes. The dialog has one search box, Filters, Groups, Students, Manage student groups, no radio |
| N2 | Core clinical skills, Add students | Tick a group on no list, Add | The button names the count. Added at once; the dialog closes, the panel has the row, banner with Undo, no Map to courses. Table shows the group after reload |
| N3 | N2 | Tick a group on another list | Nothing beside it until ticked, then a muted Also on, no radio, no question |
| N4 | Core clinical skills panel | x on BSN 2026 | Alertdialog: "Remove BSN 2026 from Core clinical skills? 38 students will have no skill list. Their evaluations are kept." Remove: "Not assigned yet.", banner, Undo restores |
| N5 | Practicum competencies panel | x on BSN 2027 | At once, no question, banner with Undo |
| N6 | Add students | Manage student groups | Opens Settings, Student groups, with Create a group. Breadcrumb returns to Skill lists on the same list |
| N7 | Add students | Read; search a name; tick; Add | All 123 student rows. "Add 1 student". Skill lists reads "BSN 2026 + 1 student" after a reload |
| N8 | Add students | Filters, Cohort BSN 2028, Select all, Add | A removable chip, groups hidden, 42 rows, "Add 42 students". Skill lists reads "+ 42 students" after a reload |
| N9 | Add students | Read BSN 2026 and its students | Ticked, disabled, "Has it" |
| T10 | `?state=empty`, `?program=new` | Look | One filled button: New skill list |
| T11 | `?list=list-core` | View skills, X; again, Esc; Esc | Back to the panel, focus on View skills; then no panel |
| T12 | `?list=list-clinical-2027` | Edit skills, Esc, X | The panel, no question |
| T13 | Same | Tick, Esc, X, Cancel | Asks each time; Discard lands on the panel |
| T14 | New skill list | Create, leave three ways | No panel, no row |
| T15 | `?list=list-clinical-2027` | Edit skills, tick, untick | No footer; footer with Save list filled; none |
| T16 | New skill list | Create, tick | Close and no footer; then the footer |
| T17 | `?list=list-core` | Add students, Undo, View skills | No banner in the picker |
| T18 | New list | Save list, Edit skills, X | Banner on the panel; none in the picker or after |
| T19 | Picker | Press outside | No panel |
| N10 | `?list=list-core` | Add students, tick Enrolled in 2025 | "33 already have it"; "Add 12 students"; untick: gone |
| N11 | Same | Tick BSN 2027 | "Also on", no "already"; "Add 29 students" |
| N12 | Same | One student named, tick the group | "1 already has it" |
| T20 | Table | Row menu Rename on Core clinical skills, then open Practicum, Esc | No banner in that panel; none on the page after |
| T21 | Practicum | Toggle on, Esc, open another list, Esc | No banner and no Undo there; none after |
| T22 | Practicum | Toggle on, click another row | No banner there |
| T23 | Practicum | Toggle on, Esc, reopen, Undo | Banner and Undo are there; Undo reverts |
| T24 | 1440, 1280 | Read the table, sideways wheel | No sideways scroll; the table does not move |
| T25 | Picker, Add students | Search with no match | The action reads Clear, not Clear filters |
| T26 | Row menu, panel menu | Delete | Focus on New skill list, 1.5 s later still |
| T27 | Lab batch grid B | Read the column action | "Mark the rest {label}", no capital mid-sentence |

### Course mapping
| # | Start | Do | Result |
|---|---|---|---|
| M1 | `/lab/admin/course-mapping` | Toggle By skill, By course, Coverage | Same page, URL keeps view, no route change |
| M2 | By skill | Set a level on one row | Save changes enables. Reload without saving: discard prompt, unchanged |
| M3 | M2 | Save changes | Banner names skill and count. Only that offering changed |
| M4 | By skill | Same skill, different level on another offering, Save changes | Both kept [CM-06] |
| M5 | By course | Pick an offering | Mapped and mandatory figures shown; they change after M3 |
| M6 | By course | Left filter: cohort, term, academic year, professional year; search a course code | Offering list narrows; chips removable |
| M7 | Any | Look for a clone button, term columns, an Optional level | None. Levels read Mandatory, Recommended, Not mapped |
| M8 | Coverage | Click an In no course figure | By skill filtered to that student group, count equal, chips say so. Neutral, no amber |
| M9 | Not configured skill | Search the skill picker | Absent; note with count links to Library |
| M10 | Any offering | Read By course and By skill | No "Copied from": OD-01 is open (rewritten 2026-11-05) |
| M11 | NUR 220, Fall 2026 | Read the admin figure, then the student course page. Set a level, Save changes, read both and Reports, then Undo | 12 mapped on both. Both move by one, Reports moves, Undo restores |
| M12 | By skill | Filters, Show | "In a course (T-N)", "In no course (N)"; each lists that many; M12b, M12c follow the category and the group |
| M13 | By course with filters | Fresh URL on an offering | Nothing remembered; M13b: an explicit link beats a filter |
| M14 | By skill | Load, toggle, save, reload | Same order; selected row in view |
| M15 | 1440, 1100 | Focus a cut name | Tooltip with the whole name |
| M16 | Both views | Change a level | The select holds its box |
| M17 | Library, then By course | Change a level, Coverage, Back three times | Draft kept between views; leaving asks; clean Back leaves at one press |
| M18 | 1920 | Both views | Level within 640 px of the name; no sideways scroll |
| M7b | All views | Look for column menus; group by level from the table's state | None offered. Group rows read Mandatory, Not mapped, Recommended |
| M19 | 375, 1440, 1920 | All views, with searches | No more than 40 px of blank scroll under the last pane |
| M20 | 375, 1440, 1920 | Scroll 420 | The stuck head lines up with the body within 1 px |
| M21 | By course | Scroll 500 | The pinned group row has no line at its bottom edge |
| M22 | By course | Set a level, then Save changes | No figure moves on the draft; the list and the pane move together on Save |
| M23 | 375 | Pick far down the list, then the way back | Detail opens at the top; back returns to the row |
| M24 | By course | Mapped only, reload | `lv=mapped` in the URL; rows and select unchanged |
| M25 | Both views | Search each, toggle back and forth | Each view keeps its own searches |
| M26 | Both views | Select a row, Esc from the bulk bar | Focus on that row's box |
| M27 | 375, 1440, 1920, both views | Scroll, set a level far down, Save from the bar; set again, scroll to the top | No bar clean. Save in view, one filled, not over the stuck head or the select just changed. Saved: page stays, banner in view, focus on screen. At the top only the header's Save |
| M28 | 375, 1440 | Bar showing, Tab through the table | No focused control under the bar [WCAG 2.4.11] |
| M29 | 1440 | Draft, select a row, choose a level in the bulk bar | The two bars stack, no overlap, focus kept |

---

## G. Change list, in dependency order

**Before building:** B1, B4, B6, B7, B9 from Romit, or take the recommendations. Record each in ledger 3b the same day.

| # | Change | Touches | Depends on |
|---|---|---|---|
| 1 | **Status, configuration and inheritance.** Status Active or Inactive only; a separate Configuration of Default, Custom or Not configured; resolve rule per D0; new skills inherit once settings exist; follow-or-own Times needed; the three exception skills lose any special case; about 12 skills seeded Custom. Stops "Apply the settings" | `lib/lab/program-settings.ts`, `lib/lab/library.ts`, `lib/lab/configure.ts`, `lib/v2/labels.ts`, glossary, `LibraryStatusBadge` | B1 |
| 2 | **Question model.** Label "Questions", no final result, derive from answers. Student rating and evaluator form follow | `lib/lab/configure.ts:104`, `components/lab/student2/log-parts.tsx:261`, evaluator form, seed check | B3 |
| 3 | **Shared rules.** Banner one-at-a-time helper, Discard guard shared by panel, Assign, mapping; row-menu order; Save placement | `components/lab/admin-a/assign-draft.tsx` (generalise), `lab-banner.tsx` | none |
| 4 | **Edit panel.** One panel replacing read-only panel, edit sheet mode and description inline. Every evaluation field of D1a live, in an `Accordion`, on one draft and one Save changes; impact dialog; Default or Custom (rebuilt 2026-11-05, D-L97); Preview. Row menu trimmed | `components/lab/library/skill-panel.tsx`, `skill-sheet.tsx` (drop edit mode), `row-actions.tsx`, `times-needed.tsx`, `admin-skills-library-a.tsx`, reuse from `configure/fields.tsx`, `configure/impact.tsx`, `configure/program-preview.tsx` | 1, 3 |
| 5 | **Add sheets.** Remove Save and configure and Save for later; Add skill, Add another; banners by status; Show them filter | `skill-sheet.tsx`, `add-several-sheet.tsx`, `use-library.tsx` | 1 |
| 6 | **Library.** Tabs All, Active, Inactive; Configuration column; filters Configuration, Different number and On no list; Times needed cell names students first, plain list without categories, Bulk bar: Configure, Edit, Deactivate; More for Categories and tags | `library-table.tsx`, `library-chrome.tsx`, `library-filter.tsx` | 1, 4 |
| 7 | **Bulk edit panel.** New sheet, Keep current. Set times and Copy settings move in; Start from on many-page | new `components/lab/library/bulk-edit-sheet.tsx`, `configure/many-page.tsx`, `configure/bulk-apply.tsx` | 4, 6 |
| 8 | **Evaluation settings.** New plain rows layout as the recommended variant; no summary; Preview dialog; dialog counts; links to Library for different numbers; remove different-number list | new variant in `components/lab/screens/`, `configure/program-parts.tsx`, `program-layout.tsx`, `program-preview.tsx`, `impact.tsx`, `lib/lab/screens.json` | 1, 3, B15 |
| 9 | **Configure pages (amended 2026-11-06, D-L115).** One skill: the full page, D1c. Bulk: the same sections, Edit levels and Add minimum; Preview holds Steps; header Cancel and Save; landing back to Library | `admin-configure-skill-b.tsx`, `configure/one-skill-page.tsx`, `configure/skill-sections.tsx`, `configure/settings-rows.tsx`, `configure/many-page.tsx`, `configure/steps-panel.tsx`, `shell.tsx`, `lib/lab/configure-origin.ts` | 1, 8 |
| 10 | **Categories and tags.** Header primary per tab; no Settings residue | `admin-b/settings-page.tsx`, `admin-categories-tags-a.tsx` | 3 |
| 11 | **Skill lists.** Create flow ends on the table with banner action; row menu order | `admin-a/lists-groups-table.tsx`, `lists-parts.tsx`, `lists-skills-sheet.tsx`, `lib/lab/lists.ts` | 3 |
| 12 | **Assign.** Remove Create a group; Manage student groups link; add Settings section | `admin-a/lists-parts.tsx`, `admin-b/settings-page.tsx`, `lib/lab/admin-ia.ts` | B12, 11 |
| 13 | **Course mapping.** One row per offering, default term filter, Save with draft, Coverage view; two levels if B7 agreed | `admin-a/mapping-views.tsx`, `mapping-parts.tsx`, `mapping-frame.tsx`, `lib/lab/mapping.ts`, reuse from `lib/lab/setup-result.ts` | B6, B7, B9 |
| 14 | **Navigation and path.** Five stops, side steps, remove Setup summary from path and panel, Competency mapping Later row, Prism names in notes | `lib/lab/flows.json`, `lib/lab/admin-ia.ts`, `components/lab/lab-frame.tsx`, `lib/lab/walkthrough.ts` | 8, 11, 12, 13 |
| 15 | **Tests.** Encode section F for each page; update tests that assert old labels, Save and configure, Setup summary and offering write-across | `admin/tests/lab/*`, `lab-nav-crawl`, consistency facts | all |
| 16 | **Docs.** Ledger 3b, brief section 0, glossary (status, levels, final result), `flows` notes. Fix brief on Scored (B18) | `docs/knowledge/*` | all |

Variants stay registered at `/lab`; this changes which is recommended and which the path uses, not whether others exist.
