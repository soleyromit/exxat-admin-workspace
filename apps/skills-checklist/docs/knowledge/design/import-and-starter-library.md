# Import and review, and starting points (design lab)

Written 2026-10-26. Status: design proposal built in the lab, for Romit's review. Consulted: `00-design-brief.md`, `glossary.md`, `02-decisions-ledger.md`, `strategy/01` to `06`, `ds-usage-map.md`, `ds-conformance-v2.md`, `docs/v2/audit/T1-admin.md`, REQ sections 2 and 3 (`/tmp/sc-audit/requirements.txt`), `01-competitive-digest.md` (recs 6, 12), `skills-library-hgtc.json`.

Tags: `[REQ id]` `[AUDIT T1]` `[COMP]` `[INFER]` `[PENDING-ROMIT]`. Nothing here decides an `OD-*`.

| Screen | Lab URL | Tier | Files |
|---|---|---|---|
| Import and review, A (recommended) | `/lab/admin/import-ai-review?variant=A` | 2 | `admin/components/lab/screens/admin-import-a.tsx` |
| Import and review, B (named alternative) | `/lab/admin/import-ai-review?variant=B` | 2 | `admin/components/lab/screens/admin-import-b.tsx` |
| Starting points (v2 "starter libraries") | `/lab/admin/starter-library` | 3 | `admin/components/lab/screens/admin-starter-library-a.tsx` |
| Shared parts and state | | | `admin/components/lab/import/{import-parts.tsx,use-import-session.ts,sample-badge.tsx}` |
| Pure logic and sample | | | `admin/lib/lab/import.ts`, tests `admin/tests/lab/import.test.ts` (21) |

Demo states (both import variants): `?state=empty | reading | failed | review | clear | large | done`. Starting points: `?state=empty`.

Slug note: the registry already had `import-ai-review`, and `lib/lab/library.ts` (another worker) links to it, so the slug was kept. The brief asked for `/lab/admin/import`; renaming is two edits (`screens.json` slug, `library.ts` `importHref`) plus `scripts/lab-gen-registry.mjs`.

---

## 1. The job and what v2 lost

Job: "When I hold a spreadsheet of 150 skills, let me bring it in, fix what the machine misread, and configure in bulk" [REQ IM-01, IM-05, IM-14]. Competitors do this for the client (Trajecsys, CORE, Medtrics build the list) [COMP]. Self-serve AI import only wins if the review is fast: hours, not days [COMP rec 6; brief section 3].

| v2 defect [AUDIT T1] | Fix in the lab |
|---|---|
| Rows without a number or dash returned "Add a number or a dash in front of each skill" (asks the client to reformat) [IM-03] | Reader takes plain lines like numbered ones. Sample file mixes numbered, bulleted and plain sections. Test: `reads plain lines with no number or dash as skills` |
| File imports always stamped `bsn-med-surg` | Target library is a required choice (Select, nothing preselected, "A new library" option). Upload is disabled until chosen |
| Accepting a repeat silently created a second skill [IM-06] | Repeats against the target library and inside the file are exceptions that block confirm until decided: skip, keep both (renamed), replace (only for a library skill that is not configured), merge (file repeats) |
| "Add any skill you need after you create the others" pointed at nothing [IM-12] | Every unreadable line has "Add as a skill" inline; the starting-points page and done state link to Add a skill |
| Four starter cards filled the first screen | Starting points are their own page, a table, with the copy rules in one band |
| Same sentence on page, banner and button | Said once: the plan sentence before Confirm |

---

## 2. Sample data (HGTC, `lib/lab/import.ts`)

`buildSampleText("standard")` renders the 154 HGTC skills (`lib/v2/hgtc-library.json`, read-only) as the text a PDF reader returns. Invented, marked Sample data: page furniture, two wrapped lines, two unreadable lines, the "(continued)" page header.

| What the file contains | Count | Reader result |
|---|---|---|
| Skills | 154 | 156 rows (two wrapped) plus 2 unreadable rows = 158 |
| Composed names ("Urine: Mid-stream urine", "Rate Calculation: Manual") | 6 | "Check: Name joins a sub-heading and a line" |
| Ambiguous asterisk (lone "*" line) | 5 | Exception "Mark unclear" |
| Mark on a group heading (O2 Administration) | 3 | "Check: Mark is on the group heading" |
| Rows after a repeated page header with no section | 4 | Exception "Section unclear", suggestion = section before the break |
| Wrapped lines | 2 | Exception "May continue the line above", suggestion = join |
| Unreadable lines | 2 | Exception "Could not read", original text kept [IM-08] |
| Same name twice in file (Oral / ORAL; Irrigation twice) | 2 | Exception "Twice in this file" |
| Repeats against Medical-surgical library | 2 | "Central line dressing change" same, "Sterile dressing change" similar |
| Page furniture (title, legend, signatures, page numbers) | 9 | Listed in a collapsible "page lines left out" [IM-08] |

The legend line ("* = must be validated before graduation") is read and shown once. The mark is kept as a note for course mapping; it does not make a skill mandatory, because mandatory is per course offering [REQ CM-03] `[INFER]`, flagged for Romit.

`buildSampleText("large")` repeats the checklist for four course levels: 624 lines read, 466 repeats, 490 need a look. Bulk "Apply to 466" resolves them in one press (test `holds about 600 skill rows and resolves after bulk suggestions`).

No evaluation model is proposed or set. Every created skill is "not configured" [REQ SC-02, IM-09, IM-15 / OD-12 open]. The plan sentence says so.

---

## 3. Variant A (recommended): wizard

Question it tests: does Upload, Review, Fix exceptions, Confirm keep a 154-line import fast and safe?

```
PageHeader  Import skills            Into Medical-surgical nursing
WizardNav   (1 Upload)-(2 Review what the system read)-(3 Fix exceptions)-(4 Confirm and create)
WizardProgress  Step 2 of 4
--------------------------------------------------------------------------
[Attachment  ADN_Clinical_Checklist.pdf  156 lines read as skills] [Sample data]
LocalBanner(warning)  2 lines could not be read ...
KeyMetrics(4)  Read 156 | Ready 142 | Needs a look 16 | Repeats 4
Legend line (once)
Tabs  Needs a look (16) | Ready (142) | Left out (0) | All lines (158)
DataTable  Line | Confidence | Skill name (inline edit) | What happens (inline fix) | Section | Group | As written | File mark | Leave out
Collapsible  9 page lines left out
Footer  Back   "142 ready, 16 need a look. Nothing is created until you confirm."   [Fix 16 exceptions]
```

| Region | DS component | Why | Mobbin |
|---|---|---|---|
| Stepper | `Wizard`, `WizardNav`, `WizardProgress`, `WizardPanel`, `WizardStepHeading` | Four named steps; the step names tell the coordinator nothing is created before step 4 | Remote stepper Upload, Map, Review, Confirm [mobbin](https://mobbin.com/screens/3a5decfb-5aa1-4283-a804-2c9d9866d852); Attio 4-step header [mobbin](https://mobbin.com/screens/60a1cfe5-3788-49e3-b3ae-3da62a33f7ee) |
| Target library | `Select`, `Label`, `Input` (new library) | Required choice, fixes the hard-coded specialty | Snowflake load dialog picks schema and table before upload [mobbin](https://mobbin.com/flows/4aa8b01b-3571-4280-a910-88446b43e3a8) |
| File | `Attachment` (states processing, error, done) | DS file pattern, carries reading and failed state | Airtable upload [mobbin](https://mobbin.com/flows/dce9a53c-788e-4821-bd15-08cd2b9c6529) |
| Reading | `Skeleton` in the shape of the review, `role=status` | Not a bare progress bar [strategy/05 P3] | |
| Summary | `KeyMetrics variant=cards`, 4 tiles | Max four [exxat-kpi-max-four] | |
| Filter | `Tabs` + `TabsCountBadge`, "Needs a look" first | Work first; counts not interpolated [ds-usage-map] | Fresha "To be imported / Errors" tabs [mobbin](https://mobbin.com/screens/2d5e41af-fe36-493e-a2e3-0e1b0306d8a0); Remote "Show only rows with errors" [mobbin](https://mobbin.com/screens/3a5decfb-5aa1-4283-a804-2c9d9866d852) |
| Rows | `DataTable` with query controls, search, column filters, selection, lazy loading over 200 rows | 154 and 600 rows | |
| Confidence | `StatusBadge`: icon plus word (Clear, Check, Needs a look) plus one reason line | Never colour alone; words, not percentages (no accuracy claims [strategy/02]) | Elicit shows a score; rejected for a word [mobbin](https://mobbin.com/screens/b39fb4bf-8ff8-49cc-b59d-13b3f16033cc) |
| Rename | `InlineInputEdit` | Rename in place [REQ IM-05] | |
| Fix | `InlineSelectEdit` per exception, label states the exception and its context ("Same as Central line dressing change", "Also line 10", "Would read ...") | Inline, no dialog per row | Attio per-row fix in "Needs review" [mobbin](https://mobbin.com/flows/535a7828-5915-47a2-b782-c6bfd708adc0); 7shifts quick fix in cell [mobbin](https://mobbin.com/screens/6b45f042-7f89-46f1-b46f-8270604842b8) |
| Bulk | DataTable bulk bar: Apply suggestions, Leave out. Step 3: one card per exception kind with "Show n" and "Apply to n"; "Apply all suggestions" | Bulk by default for 100+ [strategy/03] | Attio "Create 3 missing select options" [mobbin](https://mobbin.com/screens/60a1cfe5-3788-49e3-b3ae-3da62a33f7ee) |
| Duplicate choice | Options in the inline select: skip, keep both, replace, merge | REQ wording skip / replace / keep both [IM-06]; merge is IM-05 | Calendly duplicate choice [mobbin](https://mobbin.com/screens/13df76e6-5cfa-426a-bb79-c65a8117153e); Pipedrive merge vs create [mobbin](https://mobbin.com/screens/a3854ba6-58df-4bed-bef3-571ef7c369ca) |
| What will happen | Sentence above Confirm plus four figures in a `Card`; Confirm disabled with a `LocalBanner variant=error` naming the blocker | One sentence before the irreversible step; hard block distinct from warning | Airtable "You're importing 4 new records from X to Projects" [mobbin](https://mobbin.com/flows/dce9a53c-788e-4821-bd15-08cd2b9c6529) |
| Import name | `Input` | Which skills came from which import [REQ IM-11] | |
| Done | `LocalBanner variant=success`, then Configure, Open the library, Import another file | Never a toast; next step is configuration [REQ IM-10] | Featurebase toast "Import started" with no review: the anti-pattern [mobbin](https://mobbin.com/flows/d6b13408-74e2-4282-a8d6-be90657de06e) |
| Failed read | `LocalBanner variant=error` with retry "Choose another file" | States the likely cause and the next step | Square sends you to download an error report and re-upload: rejected [mobbin](https://mobbin.com/screens/2bf8396f-b5eb-4c32-ad6e-ee71118f27ae) |

Exception suggestions (one line each, on the Fix cards): leave out unreadable; join wrapped; skip exact library repeats, keep similar; keep both when the group differs, otherwise merge; use the section before the page break; the mark belongs to the skill below it.

---

## 4. Variant B (named alternative): two panes

Question it tests: is the file beside the parsed skills faster than a stepper for 154 rows?

```
PageHeader, Attachment, LocalBanner, KeyMetrics(4), legend line
Card (36rem) ResizablePanelGroup
 ┌ As written (32%) ──────────────┐┌ Tabs Needs a look | Ready | Left out | All   [Apply all suggestions] ┐
 │ 1  -  Associate Degree ...     ││ DataTable (compact): Line | Confidence | Skill name | What happens | ⋯ │
 │ 8  ✓  1. CPR (Independent ...  ││ row 177 marked open                                                   │
 │177 !      (1000mL)   <selected>││                                                                       │
 └────────────────────────────────┘└───────────────────────────────────────────────────────────────────────┘
Card  plan sentence, Import name, [Create 153 skills]
```

Each source line carries a glyph and a screen-reader word (Ready, Needs a look, Left out, Page line, Heading). Clicking a line opens the matching row (`openRowId`); if the row is filtered out the table switches to All. Clicking a row scrolls the source pane to its line.

References: Mistral Document AI, original left and extracted text right [mobbin](https://mobbin.com/screens/9d1334ff-fc93-4b2a-99b3-f16e2deedd10); QuickBooks receipt review, document left, fields right [mobbin](https://mobbin.com/screens/66740512-e367-476d-93a7-ea701554e76b).

What it should win: checking a "did it read my list" doubt against the original without leaving the row. What it risks: at 1024 px the right pane is narrow and the table scrolls sideways; at 375 px two panes do not work (web-first admin surface [brief 5.5]). Test both variants with the same 16 exceptions and time to Confirm.

---

## 5. Starting points (v2 "starter libraries")

**Conflict, PENDING-ROMIT.** REQ SL-01 and section 1.6: "Prism ships no skills, no categories and no taxonomy." v2 ships four invented libraries [AUDIT T1 SL-01; ledger Q5]. The competitive digest recommends editable specialty starter libraries [COMP rec 12]. Built only as editable starting points the program must adopt, labelled Sample data, and never as a default: the page is reachable but nothing on the import or library pages assumes it. If Romit drops the feature, delete the screen and its registry entry; the import screen does not depend on it.

```
PageHeader  Starting points
"Example lists to copy and edit. Your program owns every skill it copies."   [Sample data]
Card  What is copied: names, sections, groups | What is not: models, rules, evidence, versions | After copying: later changes never reach your library
DataTable  Starting point (+summary) | Discipline | Skills | Sections | [Preview] [Use as a starting point]
"Already have a list? Import skills or add one skill."
FloatingSheetPanel  preview: skills grouped by section, group on the right; footer Use as a starting point
Dialog  Copy into (Select) -> "148 of these match names already in this library" Skip them / Keep both, marked as a copy -> "6 skills will be added ..., each not configured" [Copy 6 skills]
LocalBanner success + Open the library
```

| Region | DS component | Mobbin |
|---|---|---|
| Catalog | `DataTable` (search, discipline filter); a table, not cards, so the first screen is not filled by four big cards [AUDIT T1] | Notion template catalog [mobbin](https://mobbin.com/screens/74b3a02c-d1f3-4631-9bcf-593c8f4c44fe); Kajabi install template [mobbin](https://mobbin.com/screens/80cc78da-517b-46b6-b175-741efbd0aa5a) |
| Preview | `FloatingSheetPanel` (DS sheet convention) | Deel template preview with "Hire using template" [mobbin](https://mobbin.com/screens/e7999723-f5ed-4ffb-b291-dc54e9ee82bd) |
| Copy | `Dialog`, `Select`, `RadioGroup` | Dropbox Dash "use this template now" confirm [mobbin](https://mobbin.com/screens/d6b936cf-3120-4fc5-ba5c-f9b23996e094) |
| Ownership note | `Card` with three facts, said once | |

Content: the HGTC list as "Two-year nursing checklist" (154) plus the four v2 samples (`lib/v2/starter-libraries.ts`). Repeats are checked against the chosen library before copying (v2 never checked [AUDIT T1]).

---

## 6. States covered

| State | Import A | Import B | Starting points |
|---|---|---|---|
| Empty (no file / no library chosen) | Upload card, actions disabled until a library is chosen, "Choose a library first." | same | `?state=empty`: table empty state with Import link |
| Uploading / reading | `Attachment` processing + Skeleton shape | same | n/a |
| Failed read | `LocalBanner` error + Choose another file (a zero-byte file also fails) | same | n/a |
| Partial success | Warning banner for unreadable lines, rows kept with original text | same | n/a |
| All clear | `?state=clear` jumps to Confirm with suggestions applied; Fix step says "Nothing to fix" when there are no exceptions | Plan sentence ready | n/a |
| Large file | `?state=large`, 624 lines, lazy loading | same | n/a |
| Done | Success banner + Configure | same | Success banner + Open the library |
| Blocked confirm | Error banner and disabled button with count | Badge "n decisions left" and disabled button | Copy disabled until a library is chosen |
| Rename clash or empty name | Row returns to Needs a look ("Same name as another skill here") | same | n/a |

---

## 7. DS used and missing

Used: PageHeader (via PageFrame), Wizard, WizardNav, WizardProgress, WizardPanel, WizardStepHeading, KeyMetrics, DataTable, StatusBadge, Tabs, TabsCountBadge, InlineInputEdit, InlineSelectEdit, Attachment, Skeleton, LocalBanner, Card, Badge, Button, Select, Input, Label, Collapsible, ResizablePanelGroup, FloatingSheetPanel, Dialog, RadioGroup. Gate: `node scripts/lab-ds-gate.mjs` PASS for all three variants.

Missing or worked around:
- No file drop zone in the DS. `Attachment` covers the file; the picker is a hidden `input type=file` triggered by a DS `Button`.
- `ScrollArea` viewport grows to its widest line (Radix table display), which pushed the source pane sideways; replaced with a plain overflow container.
- `ResizablePanelGroup` sets `height: 100%` inline, so the height lives on the wrapping Card.
- `DataTable` has no `searchAriaLabel` prop (only the toolbar does).

---

## 8. Open questions for Romit

1. Keep starting points at all (SL-01 hard stop vs COMP rec 12)? [PENDING-ROMIT, ledger Q5]
2. Where does the file's mandatory mark land: a note for course mapping (built), a tag, or nothing? Mandatory is per course offering [REQ CM-03] `[INFER]`.
3. Two levels in files (section and group) versus one category plus tags in REQ [SL-03, SL-04]: built as section = category, group shown as read; the mapping is `[INFER]`.
4. Replace on re-import is offered only for a library skill that is not configured, so no evidence or configuration is overwritten. OD-13 (re-import of a skill with evidence) stays open.
5. Slug `import-ai-review` versus `/lab/admin/import` (see top).
