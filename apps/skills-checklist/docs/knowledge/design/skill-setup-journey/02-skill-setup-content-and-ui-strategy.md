# 02 Skill setup journey: content and UI strategy, with build specs per screen

**Written:** 2026-10-26. **Status:** implementation spec for the lab builders (Romit's scope change: build in the lab with real DS components, no HTML mockups). Nothing here decides an `OD-*`; anything marked `[PENDING-ROMIT]` stays open.
**Consulted:** `../../00-design-brief.md`, `../../glossary.md`, `../../02-decisions-ledger.md` (D-X1 to D-X24), `../../strategy/01` to `07`, `../../ds-usage-map.md`, the three design docs (`../import-and-starter-library.md`, `../configure-skill.md`, `../skills-library-and-add-skill.md`), REQ SL, IM, SC, CM, AE-02, `docs/v2/audit/T1-admin.md`, `../../01-competitive-digest.md` (recs 3, 4, 6, 12), the shots in `../lab-shots/` and `evidence/`, Mobbin references cited inline.
**Read with:** `01-layout-patterns.md` (templates T1 to T5, shared rules L1 to L12), `03-lab-architecture.md` (option sets, lab chrome, work split).
**DS APIs verified** from `@exxatdesignux/ui@1.6.5` dist types in `apps/skills-checklist/admin/node_modules` (the CLI `node tools/ds/source.mjs` prints the root 1.5.1 types; props below were checked against 1.6.5 `dist/components/**.d.ts`): `Wizard` (`orientation`, `variant: numbered|icons|compact`, `linear`, `onStepClick`), `WizardNav`, `WizardPanel`, `WizardStepHeading`, `WizardProgress` (`formatLabel`), `WizardFooter` (`showBack`, `backLabel`, `nextLabel`, `submitLabel`, `submitting`, `onBack`, `onNext`, `onSubmit`), `PageHeader` (`title`, `subtitle: ReactNode`, `actions`, `actionItems`), `SelectionTileGrid` (`options[{value,label,icon,description}]`, `value`, `onValueChange`, `interaction: radio|button`, `columns 2..7`, `density: default|compact`, `labelPlacement`), `LocalBanner` (`variant`, `title`, `action{label,href,onClick}`, `retry{label,onClick}`, `dismissible`), `StatusBadge` (`label`, `tone`, `icon`, `size: sm|md`), `Tabs` + `TabsList` (`variant: line|default`) + `TabsTrigger` + `TabsCountBadge` (`count`), `DataTable` (`searchable`, `showQueryControls`, `selectable`, `groupable`, `getRowId`, `emptyState`, `toolbarSlot`, `bulkActionsSlot`, `lazyLoading`), `KeyMetrics` (`variant: card|cards|flat|compact`), `FloatingSheetPanel` + `FloatingSheetPanelContent` (`side`, `size: sm|md|lg`, `resizable`) + `FloatingSheetPanelHeader` (`title`, `subtitle`, `onClose`) + `FloatingSheetPanelBody` + `FloatingSheetPanelFooter` + `FloatingSheetPanelWorkflowFooter` (`cancelLabel`, `onCancel`, `primaryLabel`, `onPrimary`, `primaryDisabled`), `Attachment` (`state: idle|uploading|processing|error|done`, `size`, `orientation`) with `AttachmentMedia/Content/Title/Description/Actions/Action`, `InlineInputEdit`, `InlineSelectEdit`, `Field`, `FieldSet`, `FieldLegend`, `FieldGroup`, `FieldLabel`, `FieldDescription`, `FieldError`, `ToggleSwitch` (`checked`, `onChange`, `id`, `aria-labelledby`), `Sheet` (`size: sm|md|lg|xl|full`), `Collapsible`, `Accordion`, `AlertDialog`, `Dialog`, `Popover`, `Command`, `Select`, `RadioGroup` (`orientation`, `itemVariant`), `Checkbox`, `Input`, `Textarea`, `Tooltip`, `Tip`, `Kbd`, `Badge`, `Button` (variants `default|outline|secondary|ghost|link|destructive*`, sizes `default|xs|sm|lg|icon|icon-xs|icon-sm|icon-lg`). The DS has no dropzone and no combobox (compose `Popover` + `Command`).

---

## 1. The journey and the admin's job at each step

```
 Skills library ──> Add a skill ──> Import ──────────────────────────> Configure ─────────────────> Impact and publish ──> Map to courses
 "what do I have,    "one skill I      upload > review > fix > confirm   model > outcomes > rule >    "who changes if I       (existing screen;
  what is left"       forgot"          "bring my list in, fix what       evidence and sign-off        publish, and what will   journey bar link)
                                        the machine misread"              "how is it judged"           they see"
```

| Step | Job (admin voice) | Moment of truth | One primary action | Source |
|---|---|---|---|---|
| Library | "Show me what is not set up and let me work through it" | Is a part-configured library a visible state of progress? | Add a skill (header) | [REQ IM-10, SL-10] |
| Add a skill | "Let me add the one I forgot without losing my place" | Saved, clearly not configured, next step offered | Add skill | [REQ IM-12, SL-05, SC-01] |
| Import: upload | "Take my file as it is" | The drop works first time, any layout | Review {n} lines | [REQ IM-01..03] |
| Import: review | "Did it understand my list?" | I recognise my own categories and counts | Fix {n} decisions | [REQ IM-04, IM-07, IM-08] |
| Import: fix | "Show me only what needs me" | 16 decisions, not 158 rows | Continue | [REQ IM-05, IM-06, IM-13] |
| Import: confirm | "Tell me exactly what will be created" | One plan sentence before the irreversible step | Create {n} skills | [REQ IM-05, IM-09, IM-11, IM-13] |
| Configure | "Set how this skill is judged, once, correctly" | Will this ever be achievable? | Next (per step) | [REQ SC-01..18] |
| Impact and publish | "Tell me what changes for students before I commit" | Who flips, and what each role will see | Publish | [REQ SC-19, AE-02; S03 section 9] |
| Map to courses | "Put it where students will be expected to do it" | Mapping is expectation, not eligibility | (course mapping screen) | [REQ CM-01..06] |

**Content strategy in one paragraph.** Each screen asks one question and offers one primary action; everything secondary sits one click away (L-K5); every count is a figure the engine computed, never typed; every sentence is said once; the nouns are the glossary's ("skill" via `skillNoun()`, "category", "tag", "evaluation", "outcome", "achievement rule" shown as "What achievement requires", "Check and publish", "not configured", "In progress", "Evidence does not qualify"). Lab notes ("Decision pending", "Sample data", the question a variant tests) are lab chrome and live in the lab bar (03), never in page content.

---

## 2. Decisions that cut across the journey (with WHY and what was rejected)

| # | Decision | WHY | Rejected |
|---|---|---|---|
| J1 | **The dropzone is the hero of import step 1; the target list never blocks the drop.** The file goes to the program's default list (one default list at a time, D-X17), shown as one line under the dropzone: "Adds to Medical-surgical nursing. [Change]". With no list yet, it reads "Adds to a new list" and the name is asked at Confirm | Observed: dropzone disabled until a Select is used [SHOT]; Hick and recognition: a required pre-choice before the main act [S07]; Databricks, Airwallex, Pipedrive make the drop target the whole step [MOBBIN https://mobbin.com/screens/fe1eaa0c-025e-469d-a116-81f84099ebfe, https://mobbin.com/screens/1c78aace-47ce-4ae8-b267-f55ca24a7992, https://mobbin.com/screens/3eedf784-de2e-42c0-b9d6-a768348986dd]. The library choice still exists because repeats are checked against it [REQ IM-06] | Required Select first (built); asking for the list in a dialog before the picker |
| J2 | **Review and fix are two different jobs.** Review shows what was read, chunked by the file's own categories (10 groups, collapsed, with counts). Fix shows only the lines that need a decision, grouped by kind, each with one choice and a group "Accept {n} suggestions" | Chunking [LAW chunking]; observed 9 regions and a 158-row table with an inline select in every exception row [SHOT evidence]; Fresha and Remote split "errors" from "ready" [MOBBIN https://mobbin.com/screens/2d5e41af-fe36-493e-a2e3-0e1b0306d8a0, https://mobbin.com/screens/3a5decfb-5aa1-4283-a804-2c9d9866d852]; Attio groups "Needs review" with the raw value beside the mapped value [MOBBIN https://mobbin.com/screens/743c9394-4846-4d21-a8ab-c9ac8729ce60] | One table with confidence column, KPI cards, tabs and inline fixes on every row (built) |
| J3 | **No KPI cards in import.** The summary is one sentence with the figures inline ("156 skills in 10 categories. 16 need a decision.") | List and wizard budgets allow 0 to 1 figure [01 section 3]; the 4 cards repeated the tab counts below them [SHOT evidence] | KeyMetrics cards (built) |
| J4 | **Configure is five steps, not six**: Model, Outcomes, Rule, Evidence and sign-off, Check and publish. Setting minimums move into Rule because they are achievement criteria [REQ SC-11, AE-03]; student fields, feedback, self-evaluation, approval and signer roles are what an evaluation must carry, so they share a step [REQ SC-13..16] | Five fits the DS horizontal threshold (`WIZARD_SCROLL_THRESHOLD = 5`) and strategy 04 5.5 (up to 5 steps take a horizontal indicator); removes the vertical stepper column | Six steps with a left list (built); seven (v2) |
| J5 | **The live rule sentence is a sticky summary in the footer, not a third column.** Left of the footer: the rule sentence (one line, truncates with a `Tooltip` holding the full text) and, when evidence exists, "Today 113 of 123 achieved". Right: Back and Next | Observed three equal columns with the form narrowest [SHOT]; ClickUp keeps the readable "When ... and ... then ..." sentence along the bottom of the builder [MOBBIN https://mobbin.com/screens/a33570e2-4678-4ec4-ba92-431683678c53]; SC-17 asks for the dependency to be apparent, which a persistent line satisfies without a column | Right live panel (built A, B); sentence only on the last step |
| J6 | **Preview as student and evaluator lives in Check and publish**, as tabs beside "What changes", not as a dropdown on every step | SC-19 asks to review everything together before use; on every step it competed with the form [SHOT] | Preview dropdown in the live panel (built) |
| J7 | **Ties are stated in words.** When every changing student fails for the same reason, say "All 15 need 1 more evaluation in Inpatient" once and keep the names behind "Show the 15 students" | Von Restorff [S07]; observed 8 identical rows [SHOT evidence] | Listing the same reason per row (built) |
| J8 | **Add a skill asks for 3 fields**: Name, Category, Description; Tags under "More details". The evaluation model is not in the add sheet | Creating and configuring are separate [REQ SC-01, IM-09 text "created unconfigured"]; the sheet with four tall model cards was the crowded part [SHOT]; Stripe "Add a product" asks for the name first and folds the rest [MOBBIN https://mobbin.com/screens/f0721d55-7d3c-4827-ba9e-e6bcbdfe9c2d] | Model choice in the sheet (built A, argued from SC-02; configure is the only place SC-02 needs to hold) |
| J9 | **Section and group from the file become Category and a tag** in UI copy (glossary: category is the REQ word; "section" and "group" are banned synonyms for it) `[PENDING-ROMIT]` | Glossary row "category"; REQ SL-03, IM-07 | Showing Section, Group and Category as three fields (built; the library doc's own open point 2) |
| J10 | **Lab demo controls leave the page**: "Load a sample rule change", "Open an unconfigured skill", "Reset edits", "Use the sample file", "Use the large sample" become entries in the lab bar's Scenario menu (03 section 2) | L12; Romit's named problem | Dashed demo toolbar inside the page (built) |
| J11 | **"Needs a look" becomes "Needs a decision"** | It names what the admin must do; strategy 07 already uses "Needs a decision" | "Needs a look" (built) |

---

## 3. Import (four steps), option set 1 recommended (replaces `admin-import-a.tsx`)

**Template:** T2 wizard, `PageFrame width="wizard"` (960 px). **Route:** `/lab/admin/import-ai-review?variant=A` (kept), flow URL `/lab/flow/set-up-skills/import?set=1`. **Data:** existing `use-import-session.ts` and `lib/lab/import.ts`; no engine change except the default target list and the "Needs a decision" label.

### 3.0 Frame shared by the four steps

```
Import skills                                                            [Cancel]
(1) Upload ── (2) Review ── (3) Fix ── (4) Confirm                        Wizard compact, 40 px row
                                                                          gap-6
[step panel]
───────────────────────────────────────────────────────────────────────────────────
[Back]                                   <context, 10 words>   [Primary]   sticky footer 64 px
```

| Region | DS component and props | Spacing | Copy |
|---|---|---|---|
| Title zone | `PageFrame title="Import skills" width="wizard" actions={<Button variant="outline" size="sm">Cancel</Button>}` (no subtitle; the target list is in the panel) | PageFrame `gap-4`, `py-5` | Title "Import {skills}" from `skillNounPlural()` |
| Stepper | `Wizard steps={[{id:"upload",label:"Upload"},{id:"review",label:"Review"},{id:"fix",label:"Fix"},{id:"confirm",label:"Confirm"}]} current={step} orientation="horizontal" variant="compact" linear onStepClick={goBackOnly}`; `WizardNav`; `WizardProgress className="sr-only" formatLabel={(c,t)=>\`Step ${c} of ${t}, ${label}\`}` | Row height 40 px; `gap-6` below | Labels one word each. Fix shows `error: true` while decisions are left and the step was visited |
| Panel | `WizardContent` > `WizardPanel step="..."` > `WizardStepHeading id className="sr-only"` then the step's content | Panel `flex flex-col gap-6` | No visible heading; the first line is the step question |
| Footer | Sticky footer component from builder 4 (`components/lab/layout/sticky-footer.tsx`, API in 03 section 6): `back`, `context`, `primary {label, onClick, disabled, disabledReason}` | `py-3`, `border-t`, `bg-background` | Per step below |
| Cancel | `AlertDialog` when a file was read: title "Discard this import?", description "Nothing has been created. The file and your decisions will be lost.", actions "Keep working" (default focus) and "Discard" (`destructive-outline`) | n/a | as written |

### 3.1 Step 1 Upload

```
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │                         (file icon, 24 px, muted)                            │  dropzone, min-h 280 px,
 │                       Drop your skills list here                             │  dashed 1 px --border-control-3,
 │               PDF, Word or Excel. Any layout, no template.                   │  radius var(--radius)
 │                             [Choose a file]                                  │
 └──────────────────────────────────────────────────────────────────────────────┘
 Adds to Medical-surgical nursing.  Change                                         text-sm, muted, link Button
──────────────────────────────────────────────────────────────────────────────────
                                   Nothing is created until you confirm.  [Review lines] (disabled)
```

| Region | Build | Copy (exact) | WHY |
|---|---|---|---|
| Dropzone | Composed: `label` element wrapping a hidden `input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"`; `onDragOver`/`onDrop` handlers; visible `Button variant="outline" size="default"` "Choose a file" triggers the input. Styles: `min-h-[17.5rem] flex flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--border-control-3)] bg-[var(--background)]`; drag-over adds `bg-[var(--brand-tint)]` and `border-[var(--brand-color)]`. Icon `fa-light fa-file-arrow-up` `aria-hidden="true"` `text-2xl text-muted-foreground`. Region `role="group" aria-label="Upload a skills list"` | "Drop your {skills} list here" (`text-base font-medium`), "PDF, Word or Excel. Any layout, no template." (`text-sm text-muted-foreground`) | J1. No DS dropzone exists (gap noted in the import doc section 7) |
| Target list | One line under the dropzone, `text-sm text-muted-foreground`: list name in `text-foreground`, then `Button variant="link" size="sm"` "Change" opening a `Popover` with a `RadioGroup` of lists plus "A new list" | "Adds to {list name}." / "Adds to a new list." | J1 |
| Reading | Dropzone is replaced by `Attachment state="processing" size="default"` (`AttachmentMedia variant="icon"`, title = file name, description "Reading the file") plus a `Skeleton` block 120 px tall in the shape of the review summary | Footer context "Reading the file" | Doherty; no bare progress bar [S05 P3] |
| Read | `Attachment state="done"`: title file name, description "156 lines read"; `AttachmentAction` "Choose another file" (`variant="ghost" size="sm"`) | Footer primary "Review 156 lines" enabled | Peak: confirm it worked |
| Failed | `Attachment state="error"` + `LocalBanner variant="error" title="We could not read ADN_Clinical_Checklist.pdf" retry={{label:"Choose another file", onClick}}`: "It may be a scanned image. A Word or Excel copy usually works." | as written | Error formula: what failed, what to do [S02 7.1] |
| Nothing found | `LocalBanner variant="warning" title="No skills found in this file"`: "We read 12 lines but none looked like a skill. Check the lines below, or try another file." + the lines in a `Collapsible` | as written | REQ IM-08, failure mode "zero found" [S03 4.5] |

Density at 1440 x 900: regions 4 (title, stepper, panel, footer); figures 0; controls 4 (Cancel, Choose a file, Change, disabled primary: allowed because the reason "Nothing is created until you confirm" is not a disabled reason; the primary is hidden until a file is read to keep L9: render the primary only when `state === "done"`); words 21; primary 1. Passes the wizard budget.

### 3.2 Step 2 Review

```
 156 skills in 10 categories. 16 need a decision.                         text-base font-medium
 The file marks some skills with * ("must be validated before graduation"). It is kept as a note.   text-sm muted (only if the file has a legend)

 ▸ Basic Skills                                                    23     Accordion type="multiple",
 ▸ Safety                                                          30     rows 48 px, count right,
 ▸ Medications                                                     13     tabular-nums
 ▸ ... (10 categories)
 ▸ Lines left out (page titles, legend, page numbers)               9
──────────────────────────────────────────────────────────────────────────────────
[Back]                                         142 ready.        [Fix 16 decisions]
```

| Region | Build | Copy | Notes |
|---|---|---|---|
| Summary | `p` `text-base font-medium` with figures from `summarize(review, resolve(review, decisions))` (fields `read`, `look`, `ready`, `leftOut`, `duplicates`) | "{read} {skills} in {sections} categories. {look} need a decision." If `look === 0`: "{read} {skills} in {sections} categories. Nothing needs a decision." | Figures inline, not cards (J3) |
| Legend | `p` `text-sm text-muted-foreground`, rendered only when `review.legend` exists, said once | "The file marks some {skills} with {mark} (\"{legend text}\"). It is kept as a note for course mapping." | Mandatory is per offering [REQ CM-03] `[INFER]` |
| Categories | `Accordion type="multiple"`; `AccordionTrigger` = category name (left) + count (right, `tabular-nums text-muted-foreground`) + amber `StatusBadge size="sm" tone="warning" icon="fa-triangle-exclamation" label="{n} to decide"` only when that category holds decisions; `AccordionContent` = `ul` with one row per skill: `InlineInputEdit` for the name (rename in place, REQ IM-05), muted "as written" text only when it differs | Category header copy from the file | 10 groups instead of 158 rows (Miller, chunking) |
| Left out | Last accordion row "Lines left out (page titles, legend, page numbers)" with the original text of each line, line number in `font-mono tabular-nums` | as written | REQ IM-08 |
| Footer | `back` "Back"; `context` "{ready} ready."; primary "Fix {look} decisions" (or "Continue" when 0) | as written | |

Density: regions 4; figures 0 (inline figures are prose data); controls above the fold: 10 accordion triggers (cluster of 10 is above 7: accepted because each is a category the program itself defined, and they are collapsed; [INFER], flag in acceptance) plus Back and primary; words about 25; primary 1.

### 3.3 Step 3 Fix

```
 16 lines need a decision. Suggestions are filled in; nothing changes until you continue.      text-base font-medium + muted

 Could not read (2)                                            [Accept 2 suggestions]   group header, 40 px
   41  ⟨original text could not be read⟩                         [ Leave out        v]  row 48 px
   177 (1000mL)                                                  [ Add as a skill   v]
 Already in the library (2)                                    [Accept 2 suggestions]
   62  Sterile dressing      Like "Sterile dressing change"     [ Keep both        v]
 Twice in this file (2)
   78  ORAL                  Also line 10                        [ Merge into first v]
 Category unclear (4) · May continue the line above (2) · Mark unclear (5) ... (collapsed groups beyond the first 3)
──────────────────────────────────────────────────────────────────────────────────
[Back]                                        5 decisions left.   [Continue] (disabled after first try)
```

| Region | Build | Copy | Notes |
|---|---|---|---|
| Intro | `p` `text-base font-medium` + `p` `text-sm text-muted-foreground` | "{n} lines need a decision." / "A suggestion is filled in for each. Nothing is created until you confirm." | IM-13: suggestions are a draft |
| Groups | One `Collapsible` per exception kind, open for the first 3 kinds with decisions, closed beyond (cluster limit); header row: kind label + count (`TabsCountBadge`-style plain count text) + `Button variant="ghost" size="sm"` "Accept {n} suggestions" (sets every row in the group to its suggestion and marks them decided) | Kind labels: "Could not read", "Already in the library", "Twice in this file", "Category unclear", "May continue the line above", "Mark unclear" | Order: blocking kinds first (repeats and unreadable) |
| Row | `li` in a `ul` (one list per group, `aria-labelledby` the group header), grid `grid-cols-[3rem_1fr_14rem] items-center gap-4 min-h-12`: line number (`font-mono text-xs text-muted-foreground tabular-nums`), the text as written (`text-sm`, the system's reading below in muted when it differs, and the context: "Like {library skill}", "Also line {n}"), `Select` (trigger 32 px, `aria-label="What happens to line {n}"`) whose options come from `fixOptions(review, row, kind, library)` and whose placeholder is "Suggested: {label}" (label from `suggestedFix`); choosing a value marks it decided. The group button calls `applySuggestions(review, decisions, library, { kind })`. Rename stays possible via `InlineInputEdit` on the text | Option labels as in `lib/lab/import.ts:441-456` | One control per row (Fitts) |
| Unreadable text | Render the original as the reader returned it; if it contains no printable letters, show "Text could not be read" in muted italic instead of replacement glyphs | as written | Fixes the tofu glyph defect [SHOT evidence] |
| Done group | A group whose rows are all decided collapses to its header with a `StatusBadge tone="neutral" icon="fa-check" label="Decided"` | n/a | Zeigarnik: open work stays visible |
| Error summary | After a Continue press with decisions left: `LocalBanner variant="error" title="{n} lines still need a decision"` with one link `Button variant="link" size="sm"` per open group ("Twice in this file, 2") that expands and focuses its first row | as written | L9 |
| Footer | `back` "Back"; `context` "{left} decisions left." or "All decided."; primary "Continue" | as written | |

Density: regions 4; figures 0; controls: 3 group buttons + about 6 row selects visible + Back + primary = 11 (above the 7-field budget: accepted as a review table step, list rule "1 row control per row"; flag); words about 22; primary 1.

### 3.4 Step 4 Confirm

```
 152 skills will be added to Medical-surgical nursing, in 10 categories.        text-base font-medium
 Each starts not configured, so students cannot send it until you configure it.  text-sm muted

 Import name                                                                     Field, Input 40 px, max-w 28rem
 [ ADN clinical checklist, Oct 26                         ]
 Shown in the library so you can tell which skills came from this file.

 ▸ Not created: 4 left out, 2 merged                                              Collapsible
──────────────────────────────────────────────────────────────────────────────────
[Back]                                                         [Create 152 skills]
```

| Region | Build | Copy |
|---|---|---|
| Plan sentence | `p` `text-base font-medium` + `p` `text-sm text-muted-foreground` | "{created} {skills} will be added to {list}, in {categories} categories." / "Each starts not configured, so students cannot send it until you configure it." |
| Import name | `Field` > `FieldLabel htmlFor` "Import name", `Input` default `{file stem}, {Mon D}`, `FieldDescription` "Shown in the library so you can tell which {skills} came from this file." | REQ IM-11 |
| New list name | Only when the target is a new list: `Field` "List name" (required) | |
| Not created | `Collapsible` trigger "Not created: {left out} left out, {merged} merged" listing names | REQ IM-08 |
| Footer | `back` "Back"; primary "Create {created} {skills}" | |
| Done | Panel replaced by `LocalBanner variant="success" title="{created} {skills} added"` "They are not configured yet. Students cannot send them until they are." `action={{label:"Configure them", href: library ?tab=not-configured&import={batchId}}}`; footer primary becomes "Open the library"; outline "Import another file". Focus moves to the banner (`tabIndex=-1`, `focus()`), `role="status"` | Peak-end: the next step is named [LAW peak-end-rule]; REQ IM-10 |

Density: regions 4; figures 0; controls 4; words about 35; primary 1.

### 3.5 Option set 2: one page, one decision at a time (new file `admin-import-c.tsx`, variant C)

Question it tests: "Does a single page that turns into a one-at-a-time decision queue after the drop get a 154-line import to Create faster than a stepper?"

```
Import skills                                                               [Cancel]
[dropzone hero as 3.1]                       (before the drop)
──── after the drop ───────────────────────────────────────────────────────────────
 156 skills in 10 categories. 16 need a decision.
 ┌ Decision 3 of 16 · Twice in this file ─────────────────────────────────────────┐   Card size="default"
 │ Line 78   ORAL                                                                 │
 │ Also line 10: Oral                                                             │
 │ (•) Merge into the first   Suggested                                           │   RadioGroup vertical
 │ ( ) Keep both                                                                  │
 │ ( ) Skip this one                                                              │
 │                                                [Previous]  [Next decision]     │   outline sm, default sm
 └────────────────────────────────────────────────────────────────────────────────┘
 ▸ 142 ready to create                                                             Collapsible > DataTable compact
 ▸ Lines left out (9)
──────────────────────────────────────────────────────────────────────────────────
 Adds to Medical-surgical nursing. Change           13 decisions left   [Create 152 skills]
```

Build notes: `Card` holds exactly one exception; keyboard: `1` to `3` choose, `Enter` next, `Shift+Enter` previous (show `Kbd` hints in a `Tooltip` on the card title, not inline); the `RadioGroup` is focused on arrival. "Accept all suggestions" is an overflow item in the title zone (`DropdownMenu`, label "Accept all 16 suggestions"). Width `wizard` (960). No stepper. Footer primary disabled until 0 left (reason in context). References: Attio needs-review list with raw beside mapped value [MOBBIN https://mobbin.com/screens/743c9394-4846-4d21-a8ab-c9ac8729ce60]; Clay review step as a short checklist of file checks [MOBBIN https://mobbin.com/screens/f2f126f6-d9c1-47e6-a801-39b1b67c5f11]. Density after the drop: regions 4 (title, summary plus card, collapsibles, footer); figures 0; controls 3 radios + 2 buttons + 2 collapsible triggers + Cancel + overflow + primary = 10 (flag: within list 6 if radios count as one group, [INFER]); words about 30.

### 3.6 Option set 3: file beside the list (rebuild `admin-import-b.tsx`, variant B)

Question it tests (kept): "Is the file beside the parsed skills faster than a stepper for 154 rows?" Changes from the built B: remove the 4 KPI cards, the warning banner and the legend paragraph (summary sentence carries them); left pane "As written" 40 percent, right pane shows only lines needing a decision by default with a `ToggleSwitch` "Show all lines" in its header; decisions use the same row as 3.3; sticky footer as 3.4 with the import name in a `Popover` from "Name this import" (`Button variant="link"`). Template: T4 split, width full. `ResizablePanelGroup` stays (its inline height lives on the wrapper, import doc section 7).

### 3.7 Import acceptance checks (all sets)

1. Drop a file without touching anything else: the read starts. (No control blocks the drop.)
2. "Step n of m" text is not visible; each step label appears once on screen.
3. Footer with Back and the primary is visible at 1440 x 900 on every step without scrolling.
4. Density script page type `wizard` (set 1, 2) or `split` (set 3): regions 4 or 5, figures 0, words 40 or fewer, primary 1, repeats 0.
5. The 2 unreadable lines show readable text or "Text could not be read", never replacement glyphs.
6. Create is impossible with decisions left; the reason is in the footer and, after one press, in an error summary with focus links.
7. After Create, focus is on the success banner and "Configure them" opens the library filtered to this import's skills.
8. axe: no violations on each step (run with transitions frozen, memory feedback_axe_phantom_midtransition).

---

## 4. Configure (five steps), option set 1 recommended (replaces `admin-configure-skill-a.tsx`)

**Template:** T2 wizard at form width: `PageFrame width="form"` (720 px; the steps are forms). **Route kept:** `/lab/admin/configure-skill?variant=A&skill=...`; flow URL `/lab/flow/set-up-skills/configure?set=1`. **Data:** `use-configure.tsx`, `lib/lab/configure.ts` (no engine change; the six-entry `SECTIONS` array at `configure.ts:275` becomes five; `ruleSentence`, `validateRule`, `computeImpact`, `bulkImpact` and `components/lab/configure/impact.tsx` `ImpactTable`/`ImpactBody` are reused).

```
Oral medication administration                                      [Cancel] [...]
In use · Medication · 121 students have evidence                                     subtitle (StatusBadge + facts)
(1) Model ── (2) Outcomes ── (3) Rule ── (4) Evidence and sign-off ── (5) Check and publish
                                                                                     gap-6
[step panel, 720 px, fields only]
─────────────────────────────────────────────────────────────────────────────────────
Get 3 evaluations rated Met. Today 113 of 123 achieved.        [Back]   [Next]       sticky footer
```

| Region | Build | Copy |
|---|---|---|
| Title | `PageFrame title={skill.name} width="form" subtitle={<><StatusBadge size="sm" .../> {category}. {n} students have evidence.</>}` (builder 4 widens `PageFrame.subtitle` to `ReactNode`). Actions: `Button variant="outline" size="sm"` "Cancel" and an overflow `DropdownMenu` (`Button variant="ghost" size="icon-sm" aria-label="More actions"`) with "Copy from another skill" (opens `Dialog` + `Popover`/`Command` search of configured skills; replaces the current draft after confirm) | Status labels: "Not configured", "Configured", "In use" (published with evidence), "Published" |
| Stepper | `Wizard orientation="horizontal" variant="compact" linear={!model}` with 5 steps: `model` "Model", `outcomes` label by model ("Outcomes" binary, "Questions" question and scored, "Levels" demonstration), `rule` "Rule", `evidence` "Evidence and sign-off", `check` "Check and publish"; visited steps with errors get `error: true` | as written |
| Footer left | Rule sentence from `ruleSentence(draft)`, `text-sm text-foreground truncate`, wrapped in `Tooltip` with the full sentence; then, if the skill has evidence, "Today {achieved} of {students} achieved" in `text-muted-foreground`; when the draft changes achievement, an amber `StatusBadge tone="warning" icon="fa-triangle-exclamation" label="{n} students change"` that jumps to step 5. `aria-live="polite"` on the sentence | Sentence examples: "Get 3 evaluations rated Met." / "Get 3 evaluations rated Met, from 2 different evaluators, with 1 in Inpatient." Before a model: "Choose a model to build the rule." |
| Footer right | `Button variant="outline" size="default"` "Back" (hidden on step 1), `Button variant="default" size="default"` "Next" ("Publish" on step 5) | |

### 4.1 Step 1 Model

| Element | Build | Copy |
|---|---|---|
| Question | `FieldSet` + `FieldLegend` `text-base font-medium` | "How is this {skill} evaluated?" |
| Choice | `SelectionTileGrid interaction="radio" columns={2} density="compact" labelPlacement="inside" value={model ?? ""} options=[...]` with `icon` (`fa-circle-half-stroke`, `fa-list-check`, `fa-star`, `fa-stairs`) and `description`. No default [REQ SC-02] | "Overall outcome" / "One outcome for the whole performance, with two labels you name." · "Question by question" / "A Yes or No against each question you write." · "Scored" / "A score for each question on a scale you set." · "Demonstration level" / "A level of supervision for each demonstration, on levels you name." |
| Change model with a rule | `AlertDialog` "Change the model?" "The rule is rebuilt for the new model. Outcomes and the rule you set are cleared." actions "Keep {current}" / "Change model" | [REQ SC-09] |
| Unconfigured info | Only for a not-configured skill, under the grid: `LocalBanner variant="info" emphasis="subtle"` "Students cannot send this {skill} and it cannot be mapped until it is published." | [REQ IM-09]; said once (not also in the subtitle) |

Why 2 columns compact: 4 tiles at 175 px tall with one word each [SHOT C] waste the first viewport; 2 x 2 tiles with the consequence line read as a choice with consequences (Hick: each option shows one consequence line [S07 laws table]).

### 4.2 Step 2 Outcomes / Questions / Levels

| Model | Fields (7 or fewer) | Copy |
|---|---|---|
| Overall outcome | `FieldGroup` with two `Field`s side by side (`grid grid-cols-2 gap-4`): "First outcome" `Input` default "Met", "Second outcome" default "Unmet"; `RadioGroup orientation="horizontal"` "Which outcome qualifies?" | Errors: "Both outcomes need a label." / "The two labels must differ." [REQ SC-03] |
| Question by question, Scored | A sortable list (rows `h-12`, `DragHandleGrip`, `Input` per question, row kebab with Remove); "Add a question" `Button variant="outline" size="sm"`; Scored adds "Scale" `Select` (1 to 4, 1 to 5, custom) | "Questions" legend; error "Question {n} needs text." / "Two questions are the same." [REQ SC-04, SC-18] |
| Demonstration level | Ordered list of levels as above; "Add a level" | "Levels, lowest to highest" [REQ SC-08] |

A list past 7 questions scrolls inside the step (the panel grows; the footer stays sticky). Large question sets stay usable [REQ SC-06].

### 4.3 Step 3 Rule

```
An evaluation qualifies when                        (question and scored models only)
( ) every question is Yes  ( ) at least [ 8 ] of 10 are Yes  ( ) these questions are Yes [choose]

What achievement requires
Qualifying evaluations needed      [ 3 ]
Level minimums (demonstration)     Independent [ 1 ]  Assisted [ 0 ]
Setting minimums                   Inpatient [ 1 ]  [+ Add a setting]
                                   Lab and simulation never count toward a setting minimum.
▸ More rule options                (Collapsible: Different evaluators [ 2 ]  Proposed)
```

| Element | Build | Copy |
|---|---|---|
| Qualification (Q and scored) | `FieldSet` "An evaluation qualifies when"; `RadioGroup` with inline `Input type="number"` (w 4rem) or a `Popover`+`Command` multi-select "Choose questions" | [REQ SC-05, SC-07]; scored: "the average is at least", "every question scores at least", "the total is at least" |
| Count | `Field` horizontal (`FieldLabel` left, `Input type="number" className="w-20"`) | "Qualifying evaluations needed" |
| Level minimums | One row of number inputs per level (demonstration only) | [REQ SC-10] |
| Setting minimums | Repeating rows `Select` (program settings list) + number; "Add a setting" `Button variant="outline" size="sm"`; `FieldDescription` "Lab and simulation never count toward a setting minimum." | [REQ SC-11, SC-12] |
| More rule options | `Collapsible` "More rule options" with "Different evaluators" number + `Badge variant="outline"` "Proposed" (D-X6). The v2 kept-from-current-rule clause stays here read-only with Remove | [LEDGER D-X6]; disclosure level 1 |
| Errors | `FieldError` per field: "Minimums add up to 4, more than the 3 needed." [REQ SC-18] | |

### 4.4 Step 4 Evidence and sign-off

| Element | Build | Copy |
|---|---|---|
| Who can sign off | `FieldSet` "Who can sign off"; `Checkbox` per evaluator role from program data (Preceptor, Clinical faculty, Lab instructor) | Error "Choose at least one role." [REQ SC-16] |
| Student adds | `FieldSet` "What the student adds"; rows (label, type, required) in a `ul` with dividers; "Add a field" opens `Dialog` (Label `Input`, Type `Select`: Date, Short text, Long text, Number, Choice list; Required `Checkbox`) | [REQ SC-13] |
| Toggles | Three rows, each `ToggleSwitch` + title + one detail line (`FieldDescription`): "Feedback is required" / "Evaluators must write feedback on every evaluation."; "Student rates themselves first" / "The evaluator sees it after their own answers." `[INFER order]`; "Approval before it counts" / "A reviewer approves each evaluation before it counts." | [REQ SC-14, SC-15] |

7 fields maximum visible: 3 roles + student fields list (1 control) + 3 toggles = 7.

### 4.5 Step 5 Check and publish (replaces `admin-rule-impact-a.tsx` as a separate screen in set 1)

```
Tabs (line): What changes | Student sees | Evaluator sees

15 of 121 students with evidence change status.                      text-base font-medium
                       Now    After                                  DS Table, 4 rows, numbers right
Achieved               113    98     15 fewer   (amber glyph)
In progress              6    21     15 more
Evidence does not qualify 0    0
No evidence yet          4     4
All 15 need 1 more evaluation in Inpatient.   ▸ Show the 15 students

Evidence already held
( ) Re-evaluate it now        Status is recalculated with the new rule.
( ) Apply to new evidence only Current status stays; later evaluations use the new rule.
──────────────────────────────────────────────────────────────────────────────────────
Get 3 evaluations rated Met, from 2 different evaluators...     [Back]  [Publish] (disabled: "Choose how evidence already held is treated")
```

| Element | Build | Copy |
|---|---|---|
| Tabs | `Tabs` + `TabsList variant="line"`; "What changes" default | Evaluator tab follows EV-03 (form only, no rule) |
| Headline | One figure only (wizard budget): `p text-base font-medium` | "{n} of {withEvidence} students with evidence change status." / no change: "Nobody's status changes." / no evidence: "No evidence recorded yet, so publishing changes nobody's status." |
| Table | DS `Table` primitives (4 rows; not DataTable): State (`StatusBadge` per state: Achieved success, In progress neutral, Evidence does not qualify warning, No evidence yet neutral), Now, After, Change (amber glyph `fa-triangle-exclamation` only on a loss) | Counts from `computeImpact` |
| Tie | If all changed students share one still-needed reason: one sentence; else top 3 reasons with counts. `Collapsible` "Show the {n} students" > `DataTable` (Student link, cohort, Still needed) | J7 |
| Evidence choice | `RadioGroup` no default [PENDING-ROMIT AE-02 vs option B]; hidden when nobody has evidence or the change is wording only [REQ AE-06] | as drawn |
| Publish | Primary "Publish", disabled with context reason until the choice is made | |
| After publish | `LocalBanner variant="success" title="{skill} is published"` "15 students now see what is left on this {skill}." `action={{label:"Map to courses", href: course-mapping ?skill=}}`; banner focused, scrolled into view; footer resets to "No unpublished changes" | Handoff H11 [S03]; next flow step |

Density: regions 4 (title, stepper, panel, footer); figures 1; controls: 3 tabs + collapsible + 2 radios + Back + Publish + Cancel + overflow = 10 (flag: tabs and radio count as 2 groups [INFER]); words about 38; primary 1.

### 4.6 Option set 2: one page of collapsing sections (rebuild `admin-configure-skill-b.tsx`, variant B)

Question: "Does one page of five sections that fold to a summary once done let an expert re-configure faster than steps?"

```
Oral medication administration                                   [Cancel] [...]
In use · Medication · 121 students have evidence
┌ Model ─────────────────────────── Overall outcome      [Change] ┐   Card, collapsed summary row 56 px
┌ Outcomes ──────────────────────── Met qualifies, Unmet [Change] ┐
┌ Rule (open) ───────────────────────────────────────────────────┐   Card expanded, fields as 4.3
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘
┌ Evidence and sign-off ─────────── Not set                [Set]  ┐
┌ Check and publish ─────────────── 15 students change     [Open] ┐
───────────────────────────────────────────────────────────────────
Get 3 evaluations rated Met...                      [Check and publish]
```

Build: 720 column; five `Card`s (no card inside a card), each a `Collapsible` whose trigger row shows the section name, a one-line summary from the draft (or amber "Not set") and a `Button variant="ghost" size="sm"` "Change"/"Set"; only one section open at a time (`Accordion type="single" collapsible`). Footer primary "Check and publish" opens section 5; inside it the primary becomes "Publish". The "Copy configuration from" Select and "Apply to other skills" move to the title overflow menu. References: Plane automation single column with IF/THEN sections [MOBBIN https://mobbin.com/screens/68c84e24-ebfa-4d7e-ad62-c999eb899a34]; Clerk plan settings as stacked section cards with a floating save bar [MOBBIN https://mobbin.com/screens/5fcadf3b-ace8-4161-a761-bff11b623aa1]. Density: regions 4; figures 0 until section 5; controls 5 section triggers + fields of the open section (7 or fewer) + footer.

### 4.7 Option set 3: rule as a sentence, applied to many (rebuild `admin-configure-skill-c.tsx`, variant C)

Question: "Does writing the rule as one sentence and applying it to several skills at once get 16 unconfigured skills live fastest?" [REQ IM-14]

```
Configure 4 skills in Nutrition                                     [Cancel]
Gastric Lavage, D/C Central Line, and 2 more   [Change]                         subtitle + link
Model   (•) Overall outcome ( ) Question by question ( ) Scored ( ) Demonstration level     RadioGroup horizontal
Get [ 3 ] evaluations rated [ Met v ],                                          sentence builder (built C)
with [ 1 ] in [ Inpatient v ].   x
[Add a level minimum] [Add different evaluators] [Add a setting minimum]        outline xs
▸ Outcomes, student fields and who can sign off                                  Collapsible
──────────────────────────────────────────────────────────────────────────────
Applies to 4 skills. None has evidence yet.               [Publish 4 skills]
```

Build: reached from the library bulk bar "Configure together" (`?skills=a,b,c`) or for one skill. Model as `RadioGroup orientation="horizontal"` (4 options, 32 px) instead of 175 px tiles. Impact for many: when any selected skill has evidence, primary becomes "Check impact" opening a `Dialog` with a per-skill table (Skill, students who change) and the evidence choice once for all (flag: per-skill choice is not offered; configure doc open point 6). References: Devin inline value chips [MOBBIN https://mobbin.com/screens/a1236205-86f2-49f9-88bc-126448454481]; ClickUp sentence summary [MOBBIN https://mobbin.com/screens/a33570e2-4678-4ec4-ba92-431683678c53].

### 4.8 Configure acceptance checks (all sets)

1. No model preselected; Next disabled with the reason "Choose a model to continue" until one is chosen [REQ SC-02].
2. The rule sentence is visible on every step (set 1 footer, set 2 footer, set 3 is the sentence) and updates within 400 ms of a field change.
3. Only two columns of content anywhere: none. One working column at 720 px (set 3 may use 720 too).
4. Unsatisfiable drafts cannot publish; error summary links focus fields [REQ SC-18].
5. Publish on a skill with evidence shows before and after counts and, when one reason explains all changes, one tie sentence [J7].
6. After publish, focus lands on the success banner; its action opens course mapping for this skill.
7. No lab controls in the page (Scenario menu in the lab bar owns sample rule change, unconfigured skill, reset).
8. Density script page type `wizard` (set 1) or `form` (2, 3): regions 4, figures 1 or fewer, primary 1, repeats 0, words 40 or fewer.

---

## 5. Skills library, option set 1 recommended (rebuild `admin-skills-library-a.tsx`)

**Template:** T1. **Route kept:** `/lab/admin/skills-library?variant=A`.

```
Skills                                                       [Import]  [Add a skill]  [...]
⚠ 16 skills are not configured. Students cannot send them and they cannot be mapped.  [Configure next]
All 178 | Not configured 16 | Not published 15 | Published 145 | Inactive 2      [Search] [Filter] [Group]
DataTable grouped by category (collapsed groups show "Nutrition 25 · 4 not configured")
  [ ] Skill (link)                 Status            Model                 Courses        Evaluations  ...
```

| Region | Build | Copy |
|---|---|---|
| Header | `PageFrame title="{Skills}"`, actions: `Button variant="outline" size="sm"` "Import" (links to import), `Button variant="default" size="sm"` "Add a skill" (opens the add sheet), overflow `DropdownMenu` "More actions": "Start from an example list" (starting points, D-X5 flagged), "Export the list" | |
| Banner | `LocalBanner variant="warning" title="{n} {skills} are not configured"` body "Students cannot send them and they cannot be mapped." `action={{label:"Configure next", href: configure first unconfigured}}`; hidden on the Not configured tab and when n = 0 | [REQ IM-09, IM-10]; said once |
| Tabs | `Tabs` > `TabsList variant="line"` with `TabsTrigger` + `TabsCountBadge count`; the KPI strip is removed (tabs are the counts, S07 list budget) | "All", "Not configured", "Not published", "Published", "Inactive" |
| Toolbar | `DataTable searchable showQueryControls toolbarSlot` aligned right on the tab row: search (expands from an icon, DS table search pattern), Filter (category, tag, model, course, import batch), Group (category default) | Search placeholder "Search {skills}" |
| Table | `DataTable groupable selectable getRowId lazyLoading={{initial:80, chunk:40}} emptyState` columns: Skill (name link to configure; tags as muted text under the name only when present), Status (`StatusBadge size="sm"`: Not configured `tone="warning" icon="fa-triangle-exclamation"`, others neutral), Model, Courses (link to mapping; "Cannot map yet" muted for not configured), Evaluations (number, `tabular-nums`), kebab (`Button variant="ghost" size="icon-sm" aria-label="Actions for {name}"`) | Status words from `STATUS_META` |
| Bulk | `bulkActionsSlot`: "Configure together" (default sm; opens configure set 3 with `?skills=`), "Copy settings from" (outline sm), "Deactivate" (outline sm) | [REQ IM-14, SL-11] |
| Empty library | `emptyState`: "Your {skills} library is empty. Import your list or add one {skill}." + `Button variant="default" size="sm"` "Import skills" | [S02 7.3] |
| Empty filter | "No {skills} match Not configured and Medication. All Medication {skills} are configured." + "Clear filters" | explains, not empty [REQ RP-09] |
| Loading | `Skeleton`: tab row, 8 rows at 48 px | |

Density: regions 4 (header, banner, tabs plus toolbar, table); figures 0; controls 6 (Import, Add, overflow, search, Filter, Group) plus 5 tabs (tabs are the view control: accepted as list "3 to 5 tabs"); words 15; primary 1.

**Option set 2 (rebuild `-b.tsx`): category tree with a detail panel.** `Accordion type="multiple"` per category; trigger shows "Nutrition", "21 of 25 configured", amber `StatusBadge` "4 not configured"; one kebab per category ("Configure the 4 not configured", "Add a {skill} here"). Clicking a skill opens `FloatingSheetPanel size="md"` with its summary (model, rule sentence, courses, evaluations) and `FloatingSheetPanelWorkflowFooter primaryLabel="Configure"`. Template T4. Drops the per-section outline buttons and the "Most to set up first" toggle (moves into Filter as a sort). Question: "Does the program's own category structure with roll-ups and a peek panel make setup progress easier to work through?"

**Option set 3 (rebuild `-c.tsx`): setup board.** Kept as built (4 status columns), with: column header action "Configure {n} together" (`outline sm`) on Not configured only; no DS panel; view switch Board/List as `ViewSegmentedControl` in the toolbar. Question kept.

---

## 6. Add a skill, option set 1 recommended (rebuild `admin-add-skill-a.tsx`)

```
                                  ┌ Add a skill ──────────────────── x ┐  FloatingSheetPanelContent side="right" size="sm" (24 rem)
  library stays visible           │ Name                               │
  and clickable (non-modal)       │ [                              ]   │  Input 40 px, autofocus
                                  │ Category                           │
                                  │ [ Choose or create            v ]  │  Popover + Command, "Create {typed}"
                                  │ Description (optional)             │
                                  │ [                              ]   │  Textarea rows 3
                                  │ ▸ More details (tags)              │  Collapsible
                                  │────────────────────────────────────│
                                  │                 [Cancel] [Add skill]│  FloatingSheetPanelWorkflowFooter
                                  └────────────────────────────────────┘
```

| Element | Build | Copy |
|---|---|---|
| Panel | `FloatingSheetPanel open` + `FloatingSheetPanelContent side="right" size="sm"` + `FloatingSheetPanelHeader title="Add a {skill}" onClose` (no subtitle) + `FloatingSheetPanelBody` + `FloatingSheetPanelWorkflowFooter cancelLabel="Cancel" primaryLabel="Add {skill}" onPrimary primaryDisabled={!name}` | |
| Name | `Field` `FieldLabel` "Name", `Input` autofocus; duplicate check case and space insensitive: `FieldError` "{Name} is already in the library." with `Button variant="link"` "Open it" | [REQ IM-12] |
| Category | `Popover` + `Command` (search; last item "Create \"{typed}\"") showing only active categories; an assigned inactive category stays visible as "{name} (inactive)" | [REQ SL-03, SL-05, SL-06] |
| Description | `Textarea rows={3}`, label "Description (optional)" | [REQ SL-02] |
| More details | `Collapsible` "More details" > Tags multi-select (`Popover` + `Command`, create at point of need) | [REQ SL-04, SL-05] |
| After add | Panel stays open, form resets, focus returns to Name, and a `LocalBanner variant="success"` at the top of the body: title "{Name} added", body "Not configured yet.", `action={{label:"Configure it", href: configure ?skill=}}`; the library row appears and is highlighted for 2 s | Supports "add several" and "configure now" with one primary (L2) |
| Unsaved | Close or Escape with a typed name opens `AlertDialog` "Discard this {skill}?" (focus on "Keep editing") | |

Density (panel plus visible list): regions 5 as a split; controls in panel 5 (Name, Category, Description, More details, Add) + Cancel; words 6; primary 1 (the header "Add a skill" button is hidden while the panel is open, so only one filled primary shows).

**Option set 2 (rebuild `-b.tsx`): inline row inside a category** (pairs with library set 2). At the end of each expanded category: a ghost row "Add a {skill} to Nutrition"; pressing it turns the row into an `Input` (Enter adds and opens the next empty row; Escape closes). Category is implied; tags and description are added later from the skill panel. The header "Add a skill" button is hidden while a row is open. Question kept from the built B.

**Option set 3 (new `admin-add-skill-c.tsx`, variant C): paste several.** `FloatingSheetPanelContent size="lg"`: `Textarea rows={10}` "One {skill} per line", Category (applies to all), primary "Review {n} {skills}" which runs the same reader as import and opens import step 3 (Fix) with only repeats and unclear lines, then Confirm. Question: "When a coordinator has 5 to 30 names in an email, is pasting them into the import review faster than adding one at a time?" It joins add and import (REQ IM-05, IM-12) without a second review UI.

---

## 7. Map to courses (handoff only)

After publish, the success banner's action and the journey bar's "Next" both open `/lab/admin/course-mapping?variant=A&skill={id}` (offering first) [REQ CM-01..06]. No redesign in this pass; the mapping screen must accept `skill` and show that skill preselected (owner: whoever next touches course mapping; not one of the four builders).

---

## 8. Text budget and density count per screen (set 1)

Counted from the specs above with the strategy 07 method (words exclude data, labels, buttons; shell and lab chrome excluded). These are targets; the builder pastes the script output.

| Screen | Page type | Regions | Figures | Controls above table or panel | Words | Primary | Fails or flags |
|---|---|---|---|---|---|---|---|
| Library | list | 4 | 0 | 6 + 5 tabs | 15 | 1 | Tabs counted as one view control [INFER] |
| Add a skill | split | 5 | 0 | 6 | 6 | 1 | none |
| Import upload | wizard | 4 | 0 | 3 | 21 | 1 (after read) | none |
| Import review | wizard | 4 | 0 | 12 | 25 | 1 | 10 category triggers exceed cluster 7: accepted because they mirror the file [INFER, flag] |
| Import fix | wizard | 4 | 0 | 11 | 22 | 1 | Row selects exceed 7 fields: it is a decision list, one control per row [flag] |
| Import confirm | wizard | 4 | 0 | 4 | 35 | 1 | none |
| Configure model | wizard | 4 | 0 | 4 tiles + footer 2 + header 2 | 18 | 1 | none |
| Configure outcomes | wizard | 4 | 0 | 3 | 8 | 1 | none |
| Configure rule | wizard | 4 | 0 | 5 to 7 | 20 | 1 | none |
| Configure evidence and sign-off | wizard | 4 | 0 | 7 | 30 | 1 | none |
| Check and publish | wizard | 4 | 1 | 10 | 38 | 1 | Tabs plus radios: 2 groups [flag] |

Before (measured on shots): import step 2 had 9 regions, 4 figures, about 40 words, 2 filled buttons in the file; configure A had 6 regions including the lab toolbar and a 3-column body.

---

## 9. Rejected alternatives (journey level)

| Alternative | Why rejected |
|---|---|
| Keep per-screen A/B/C and polish each | Romit's complaint is structural (no shared frame, no walkable journey); polish leaves 5 different frames |
| One giant "setup" page (library, import, configure in tabs) | Configure needs its own URL [S01 4.2]; tabs would mix list and form templates |
| Vendor-built setup (Trajecsys, CORE, Medtrics build the list for the client) | REQ is self-serve; the competitive digest says self-serve AI import wins only if review is fast [COMP rec 6]: the fix step is the answer |
| AI proposes a model and rule during import | OD-12 open [REQ IM-15]; nothing here proposes a model |
| Elentra-style rules engine page per skill | Version-by-cohort is option B, not built (D-X7) |
