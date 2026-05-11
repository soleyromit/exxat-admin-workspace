# Modal Deep Study (Sheets / Dialogs / Popovers / DropdownMenus)

> Per Romit's directive 2026-05-11: "study all the minute details when sheets,
> dialogs open." Beyond the interaction-state runner's axe-rule pass, this is
> the per-modal visual + UX + semantic audit.
>
> Read-only. No code changed. File:line citations throughout. Cross-referenced
> against `/tmp/visual-check/interactions/` PNG captures and
> `docs/governance/component-state-catalog.md`.

---

## Coverage

| Product surface | Sheets | Dialogs | Popovers | DropdownMenus | Files |
|---|---:|---:|---:|---:|---|
| PCE admin | 4 | 11 | 2 | 9 | 14 |
| PCE student | 0 | 0 | 0 | 0 | n/a |
| exam-mgmt admin | 2 | 18 | 5 | 11 | 26 |
| assessment-taker | 0 | 0 | 0 | 1 | 1 |
| **Total** | **6** | **29** | **7** | **21** | — |

> "Files" = source files that contain at least one modal instance. A file can
> contain multiple modals (e.g. `qb-table.tsx` has 3 dialogs + 2 popovers + 1 dropdown).

### File-level inventory (every file)

**PCE admin (14 files):**
1. `apps/pce/admin/components/pce/pce-modals.tsx` — 4 Sheets, 3 Dialogs, 1 Popover (8 modals in one file)
2. `apps/pce/admin/components/table-properties/drawer.tsx` — 1 Sheet (floating), 2 DropdownMenus
3. `apps/pce/admin/app/(app)/admin/accommodations/page.tsx` — 1 Dialog
4. `apps/pce/admin/app/(app)/admin/competencies/page.tsx` — 1 Dialog, 1 DropdownMenu (in `RowActions`)
5. `apps/pce/admin/app/(app)/admin/content-areas/page.tsx` — 1 Dialog, 1 DropdownMenu
6. `apps/pce/admin/app/(app)/admin/courses/page.tsx` — 1 Dialog, 1 DropdownMenu
7. `apps/pce/admin/app/(app)/admin/offerings/page.tsx` — 1 Dialog
8. `apps/pce/admin/app/(app)/admin/permissions/page.tsx` — 1 Dialog
9. `apps/pce/admin/app/(app)/admin/standards/page.tsx` — 1 Dialog, 1 DropdownMenu
10. `apps/pce/admin/app/(app)/admin/students/page.tsx` — 1 Dialog
11. `apps/pce/admin/app/(app)/admin/terms/page.tsx` — 1 Dialog
12. `apps/pce/admin/app/(app)/surveys/page.tsx` — 1 DropdownMenu (RowActions)
13. `apps/pce/admin/app/(app)/templates/page.tsx` — 1 DropdownMenu
14. `apps/pce/admin/components/app-sidebar.tsx` — 1 DropdownMenu
15. (Data-table internals — `data-table/index.tsx`, `pagination.tsx`, `row-actions.tsx` — DS-adjacent infrastructure, not counted as product modals)

**exam-mgmt admin (26 files):**
1. `apps/exam-management/admin/app/(app)/question-bank/qb-modals.tsx` — 2 Dialogs (ManageCollaborators, RequestEditAccess)
2. `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` — 4 Dialogs (MoveFolder shell, MoveQuestion, BulkMove, DeleteQuestion) + 1 Sheet + 2 Popovers + 2 DropdownMenus
3. `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx` — 2 Dialogs (DeleteFolder, MoveFolder) + 2 Popovers (FolderDiff hover, in FolderRow) + 1 DropdownMenu
4. `apps/exam-management/admin/app/(app)/question-bank/qb-manage-access.tsx` — 1 Dialog
5. `apps/exam-management/admin/app/(app)/question-bank/qb-header.tsx` — 2 DropdownMenus (breadcrumb ellipsis, persona switcher)
6. `apps/exam-management/admin/app/(app)/question-bank/qb-title.tsx` — 2 Popovers (collaborator avatars, sibling switcher)
7. `apps/exam-management/admin/components/objective-deep-dive-sheet.tsx` — 1 Sheet (floating)
8. `apps/exam-management/admin/components/add-accommodation-modal.tsx` — 1 Dialog (3-step)
9. `apps/exam-management/admin/components/ai-generate-modal.tsx` — 1 Dialog (3-state)
10. `apps/exam-management/admin/components/assign-practice-dialog.tsx` — 1 Dialog
11. `apps/exam-management/admin/components/create-assessment-modal.tsx` — 1 Dialog (3-step)
12. `apps/exam-management/admin/components/intervention-dialog.tsx` — 1 Dialog
13. `apps/exam-management/admin/app/(app)/access/page.tsx` — 2 Dialogs (remove confirm, InviteDialog)
14. `apps/exam-management/admin/app/(app)/assessment-builder/assessment-builder-client.tsx` — 1 Dialog (save smart view)
15. `apps/exam-management/admin/app/(app)/assessments/[id]/assessment-landing-client.tsx` — 1 Dialog (SendToChair)
16. `apps/exam-management/admin/app/(app)/assessments/[id]/monitor/live-monitor-client.tsx` — 2 Dialogs (Alert, Pause/resume)
17. `apps/exam-management/admin/components/persona-switcher.tsx`, `entry-path-chip.tsx`, `app-sidebar.tsx` — DropdownMenus
18. `apps/exam-management/assessment-taker/src/components/NavShell.tsx` — 1 DropdownMenu

---

## Findings — by criterion

### 1. Footer convention violations (ghost Cancel + primary right; NOT `flex-1` on both)

The 6f180c1 fix established `ReleaseSheet` as the canonical model: `<SheetFooter className="px-6 py-4 border-t border-border flex flex-row justify-end gap-2"> <Button variant="ghost">Cancel</Button> <Button variant="default">…</Button></SheetFooter>`. Modals still violating:

| Modal | File:line | Current | Recommended |
|---|---|---|---|
| `CreateTemplateSheet` | `apps/pce/admin/components/pce/pce-modals.tsx:116-121` | `<Button variant="outline" className="flex-1">Cancel</Button> <Button variant="default" className="flex-1">…</Button>` | ghost Cancel + remove `flex-1` on both; `justify-end` |
| `CreateSurveySheet` | `apps/pce/admin/components/pce/pce-modals.tsx:282-292` | same `flex-1`/`flex-1` `outline`+`default` pattern | same |
| `AddGuestSheet` | `apps/pce/admin/components/pce/pce-modals.tsx:341-344` | same pattern | same |
| `SendReminderPopover` (Cancel/Send footer) | `apps/pce/admin/components/pce/pce-modals.tsx:412-415` | `flex-1` `outline`+`default` (popover scale, but principle holds) | ghost Cancel; primary right; drop `flex-1` |
| `AddAccommodationModal` (exam-mgmt) | `apps/exam-management/admin/components/add-accommodation-modal.tsx:459-490` | `flex-row justify-between` with Back-on-left + Cancel+Next on right; uses `outline` for Cancel | acceptable variant (3-step wizard); but use `ghost` for Cancel for consistency |
| `CreateAssessmentModal` (exam-mgmt) | `apps/exam-management/admin/components/create-assessment-modal.tsx:466-496` | same Back-Cancel-Next pattern with `outline` Cancel | same |

**Overall:** 4 PCE-admin modals + 1 popover footer use the deprecated `flex-1`/`flex-1` pattern. That's the entire `pce-modals.tsx` cluster except `ReleaseSheet`. Easy sweep fix.

> exam-mgmt admin already conforms via outline-Cancel-left+primary-right in nearly every dialog (`accommodations`, `competencies`, `content-areas`, `courses`, `offerings`, `permissions`, `standards`, `students`, `terms`, `access`, `qb-modals`, `qb-sidebar`, etc.). The PCE-modals cluster is the outlier.

### 2. Validation surface gaps

| Modal | File:line | Missing | Recommended |
|---|---|---|---|
| `CreateTemplateSheet` | `apps/pce/admin/components/pce/pce-modals.tsx:54-125` | No `errors` state. `Save` button silent-disabled (`disabled={!name.trim()}`) — no `aria-invalid` / `FieldError` / no `LocalBanner` | Adopt the `accommodations/page.tsx:96-126` pattern: validate(), errors state, FieldError, LocalBanner summary if 2+ errors |
| `CreateSurveySheet` | `apps/pce/admin/components/pce/pce-modals.tsx:175-296` | 3 required fields silent-disable submit (`disabled={!templateId || !courseCode || !primaryInstructorId}`). No aria-invalid wiring. | same |
| `AddGuestSheet` | `apps/pce/admin/components/pce/pce-modals.tsx:300-348` | silent-disable; single field but no FieldError surface | same |
| `MasterCoursesPage Add` dialog | `apps/pce/admin/app/(app)/admin/courses/page.tsx:234-290` | Silent-disable on submit (`disabled={!draft.code.trim() || !draft.name.trim()}`). No `errors` state. No aria-invalid on Inputs. No `FieldError`. No `LocalBanner`. | Same FieldError+LocalBanner pattern used by the other 7 PCE entity pages |
| `MoveFolderDialog` (qb-table) | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:279-351` | "Move here" silent-disabled (`disabled={!targetId}`) — no error surface for "pick a destination" | Surface inline FieldError under tree picker when user clicks without selecting |
| `MoveFolderDialog` (qb-sidebar) | `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx:110-289` | "Move here" silent-disabled (`disabled={!canMoveHere}`) | same |
| `RequestEditAccessModal` | `apps/exam-management/admin/app/(app)/question-bank/qb-modals.tsx:180-268` | Submit button has no validation (message is optional). OK but worth noting message is unconstrained — no char counter unlike `AssignPracticeDialog` |
| `ManageCollaboratorsModal` (legacy qb-modals) | `apps/exam-management/admin/app/(app)/question-bank/qb-modals.tsx:14-177` | Search input — no error state; suggestions popover overlaps content. Minor. |
| `Live-monitor Alert dialog` | `apps/exam-management/admin/app/(app)/assessments/[id]/monitor/live-monitor-client.tsx:225-254` | `Send alert` silent-disabled (`disabled={!alertText.trim()}`). No aria-invalid. No FieldError. | Surface inline "Add a message" hint or wire FieldError |
| `Save smart view dialog` | `apps/exam-management/admin/app/(app)/assessment-builder/assessment-builder-client.tsx:797-836` | OK — has aria-invalid+FieldError. This is the migrated case (good). | (no change) |

**Pattern hierarchy:** The "good" pattern (validate(), errors state, aria-invalid, FieldError, LocalBanner summary on 2+ errors) is implemented in 8 PCE admin pages (accommodations, competencies, content-areas, offerings, permissions, standards, students, terms) and the 4 exam-mgmt wizards (add-accommodation, ai-generate, assign-practice, create-assessment) — plus `access/page.tsx:264-281`. The non-conformant set are exclusively in `pce-modals.tsx` and `courses/page.tsx` and the QB move dialogs.

### 3. Title / body hierarchy issues

DS Sheet/Dialog convention: short label title (1-3 words), explanatory `DialogDescription`, no footnote-as-body.

| Modal | File:line | Issue |
|---|---|---|
| `DeleteTemplateDialog` | `apps/pce/admin/components/pce/pce-modals.tsx:135-171` | Title literally embeds the template name with curly quotes: `Delete "{template.name}"?` — at long names this overflows. Best: title `Delete template?`; description carries `"{name}" — N surveys use this template.` |
| `DeleteFolderDialog` (QB sidebar) | `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx:62-107` | Same pattern: `Delete "{node.name}"?` — folders with course-prefixes can be long; risks line-wrap in 380px sm:max-w-md dialog |
| `Delete dialog` (qb-table) | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:384-403` | Title `Delete question?` (good), but body is the only content — no DialogDescription. Title says nothing about the question; user sees a quote of the question stem in `<p>` body. Acceptable but could promote stem to DialogDescription. |
| `MoveFolderDialog` (qb-sidebar) | `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx:175` | `Move "{node.name}"` — same long-name risk. No DialogDescription at all. |
| `MoveFolderDialog` (qb-table) | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:307-313` | Subtitle is a `<p>` not a `DialogDescription` — accessibility regression (no a11y description wiring) |
| `RequestEditAccessModal` | `apps/exam-management/admin/app/(app)/question-bank/qb-modals.tsx:206-218` | DialogTitle wrapped in custom-built icon container; bypasses canonical `<DialogHeader><DialogTitle><DialogDescription>` shape. Functional but inconsistent. |
| `ObjectiveDeepDiveSheet` | `apps/exam-management/admin/components/objective-deep-dive-sheet.tsx:109,129` | `SheetTitle` is `sr-only`; visible title is a custom `<h2>` at line 129. Acceptable accessibility but breaks DS contract. |
| `TablePropertiesDrawer` | `apps/pce/admin/components/table-properties/drawer.tsx:218-393` | `SheetTitle` rendered with custom styles (`text-base font-semibold`) outside `SheetHeader`. Custom header construction. |
| `Live-monitor Pause dialog` | `apps/exam-management/admin/app/(app)/assessments/[id]/monitor/live-monitor-client.tsx:257-282` | Title and description are well-balanced — good model: `Pause the exam?` / "All in-progress students will see…" |
| `AccessPage Remove dialog` | `apps/exam-management/admin/app/(app)/access/page.tsx:194-218` | Good: short title `Remove access?` + description naming the user. Model citizen. |

### 4. Content density issues (sparse mid-region)

| Modal | File:line | Body LoC vs height | Suggested content additions |
|---|---|---|---|
| `AddGuestSheet` | `apps/pce/admin/components/pce/pce-modals.tsx:319-346` | One Select with one Label in a w-80 sheet. ~70% empty whitespace below the select. | Either narrow to a Dialog OR add: (a) preview of already-added guests, (b) "Why am I adding a guest?" inline copy, (c) recent-faculty quick-pick chips |
| `DeleteQuestion` (qb-table) | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:384-403` | One-line title + one-line p tag + 2 buttons. sm:max-w-sm so OK. | Could add: was-this-used-in-assessments warning à la qb-sidebar DeleteFolder |
| `RequestEditAccessModal` | `apps/exam-management/admin/app/(app)/question-bank/qb-modals.tsx:180-268` | sm:max-w-sm but body has a 36px header decoration + 1 context strip + 1 textarea + footer = roomy | OK |
| `MasterCourses Add` | `apps/pce/admin/app/(app)/admin/courses/page.tsx:234-290` | 3 fields; sm:max-w-md default. OK density. | Acceptable. |
| `AccessPage Remove` | `apps/exam-management/admin/app/(app)/access/page.tsx:194-218` | sm:max-w-md with only title+description+footer. Sparse but appropriate for a confirm dialog. | OK |
| `Save smart view` | `apps/exam-management/admin/app/(app)/assessment-builder/assessment-builder-client.tsx:797-836` | sm:max-w-sm with 1 field. Appropriately sized. | OK |
| `MoveFolderDialog` (qb-sidebar) | `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx:169-289` | Fixed `width: 480, height: 500` — when current folder has 0 subfolders, the body shows a 64px icon + text. ~75% empty. | Show pinned/recent folders OR "All folders" flat list when current dir is empty |

### 5. Sheet width mismatch

| Sheet | File:line | Current width | Content type | Suggested |
|---|---|---|---|---|
| `ObjectiveDeepDiveSheet` | `apps/exam-management/admin/components/objective-deep-dive-sheet.tsx:106` | `w-[28rem] sm:max-w-[28rem]` (448px) | Per-assessment list + bottom-5 students | OK |
| `TablePropertiesDrawer` | `apps/pce/admin/components/table-properties/drawer.tsx:223` | `w-80 sm:max-w-80` (320px) | Filter/sort/columns nested panels | OK for nested panels |
| `CreateTemplateSheet` | `apps/pce/admin/components/pce/pce-modals.tsx:56` | `w-96 sm:max-w-96` (384px) | Form with checkboxes + select | OK |
| `CreateSurveySheet` | `apps/pce/admin/components/pce/pce-modals.tsx:212` | `w-96 sm:max-w-96` (384px) | 5 selects + DatePicker | OK — calendar may clip; verify |
| `AddGuestSheet` | `apps/pce/admin/components/pce/pce-modals.tsx:320` | `w-80 sm:max-w-80` (320px) | 1 select | Too wide for content (see density §4) — consider Dialog instead |
| `ReleaseSheet` | `apps/pce/admin/components/pce/pce-modals.tsx:445` | `w-96 sm:max-w-96` (384px) | Summary card + gauge + instructor list | OK |

### 6. Semantic conflicts inside modals (data ≠ label adjacency)

| Modal | File:line | The conflict |
|---|---|---|
| `ReleaseSheet` summary card | `apps/pce/admin/components/pce/pce-modals.tsx:460-464` | Title reads `"{responseCount} of {enrollmentCount} responded ({responseRate}%)"` while CardDescription above just says `SUMMARY PREVIEW`. The percentage rendering trusts that `responseRate` was derived from the same `responseCount` / `enrollmentCount`. If mock data drifts (eg in `pce-mock-data`), the parenthetical can disagree with the fraction. Inspect when seed data is updated. |
| `AssignPracticeDialog` student list | `apps/exam-management/admin/components/assign-practice-dialog.tsx:152-184` | Each row shows `s.weakArea` as a free-form string but the dialog's `contentAreaId` Select is a separate pick. A user can pick "Pharmacology" in the Select while a row says "Weak in Anatomy" — no enforced relationship between the displayed weakness and the chosen pack content area. Potentially confusing for the bottom-20% workflow Aarti described. |
| `InterventionDialog` weak-area + score | `apps/exam-management/admin/components/intervention-dialog.tsx:103,109-110` | "Course avg %" (large) and "Weakest area %" (small below name) are both displayed. The visual hierarchy (`text-lg` vs `text-[10px]`) suggests the course avg dominates, but the weakest-area is the actionable number. Inversion risk per Romit's viz-first principle. |
| `AddAccommodationModal` student row | `apps/exam-management/admin/components/add-accommodation-modal.tsx:259-269` | Shows `⚠ {existing} existing` count next to student name in result list. The `⚠` glyph + amber color suggests a problem; semantically it's neutral information ("this student already has accommodations"). Use `fa-light fa-info-circle` instead. |
| `MoveFolderDialog` (qb-sidebar) | `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx:158` | `canMoveHere = currentId !== null && currentId !== node.parentId` — silent-disabled "Move here" when destination equals the source parent. No tooltip explaining why disabled. Users could read this as a bug. |
| `Live-monitor Alert dialog` | `apps/exam-management/admin/app/(app)/assessments/[id]/monitor/live-monitor-client.tsx:240-242` | `Sending to {snapshot.students.length} students` — this counts ALL students in the snapshot, not "currently in-progress" students. The dialog title says "Alert all students" so it's consistent, but the helper copy elsewhere often distinguishes in-progress vs submitted — minor wording trap. |

### 7. Sheet side mismatch

| Sheet | File:line | Current side | Notes |
|---|---|---|---|
| `CreateTemplateSheet`, `CreateSurveySheet`, `AddGuestSheet`, `ReleaseSheet` | `pce-modals.tsx` | `right` | Form-style sheets — appropriate |
| `ObjectiveDeepDiveSheet` | `objective-deep-dive-sheet.tsx:104` | `right` with `showOverlay={false}` floating + inset top/bottom 0.5rem | Floating-sheet pattern — appropriate; intentional non-modal so user can scroll matrix behind |
| `TablePropertiesDrawer` | `table-properties/drawer.tsx:220-225` | `right`, floating | Same floating pattern as Objective sheet — appropriate |
| `SheetContent` in qb-table (`qb-table.tsx`) | Sheet import used in qb-table but not for a top-level sheet shell — checked, appears in DataTable internal | n/a |

No side mismatches found. Floating-sheet pattern (`showOverlay={false}`) correctly suppresses overlay so the page behind remains interactive — matches DS guidance in `component-state-catalog.md:483`.

### 8. Focus trap / Escape / Click-outside

All Sheets and Dialogs in this codebase use Radix UI under `@exxat-ds/ui`, so:

- **Escape**: works (Radix wires `onOpenChange(false)` to ESC by default). Verified — every modal wires `onOpenChange` to a setter. ✓
- **Focus trap**: enforced by Radix `<DialogContent>` / `<SheetContent>`. ✓
- **Click-outside**: enforced unless `showOverlay={false}` (floating-sheet pattern). Verified:
  - `ObjectiveDeepDiveSheet` (objective-deep-dive-sheet.tsx:105) — `showOverlay={false}` — click-outside should NOT close. Confirmed: `onOpenChange` fires when overlay is clicked even without overlay, BUT since there's no overlay, the user clicks the page behind which doesn't fire the close. Behavior matches floating-sheet expectations.
  - `TablePropertiesDrawer` (drawer.tsx:222) — same. Verified.
- **`onOpenAutoFocus={e => e.preventDefault()}`** is used on `qb-manage-access.tsx:104` to prevent Radix from auto-focusing the first focusable when the dialog opens. Intentional — keeps focus on the trigger person row.

**One concern:** `AddAccommodationModal` (line 188) doesn't reset its `step` state when closed without `reset()` being called. The `handleClose` (line 95-98) only calls `reset()` if `!next`, but if the user navigates away while step=3 then re-opens via parent, the dialog briefly flashes step 3 before reset. Minor visual glitch.

### 9. Inspect-only audit items

**Hand-rolled checkboxes in `TablePropertiesDrawer`:**
- `apps/pce/admin/components/table-properties/drawer.tsx:632-642` — uses a `<span aria-hidden="true" data-slot="checkbox">…</span>` instead of importing DS `Checkbox`. Reason: the filter-option row needs the whole row to be clickable and DS Checkbox click can interfere with role=option keyboard handling. Documented in the vendor strip rationale (lines 6-23). Acceptable per the vendor-when-extending convention but worth flagging — if DS `Checkbox` is ever extended with a `data-noninteractive` prop, this should re-import the canonical.

**Raw `<input type="checkbox">` in `InterventionDialog`:**
- `apps/exam-management/admin/components/intervention-dialog.tsx:152-157, 167-172` — two raw checkboxes used inside `<label>` rows. Violates workspace rule "NEVER use a raw `<button>` — every button must be DS Button" (the spirit of which applies to form controls). Should be DS `Checkbox`.

**Raw `<input type="checkbox">` in `AddAccommodationModal`:**
- `apps/exam-management/admin/components/add-accommodation-modal.tsx:429-433` — "Never expires" checkbox is raw. Same violation as above.

---

## Per-modal walkthrough — 7 highest-value modals

### M1. `ReleaseSheet` — `apps/pce/admin/components/pce/pce-modals.tsx:431-536`

The reference implementation post-commit 6f180c1.

- **Footer**: ghost Cancel + default Share — correct pattern. (line 522-532)
- **Validation**: no inputs to validate. Empty error surface — appropriate.
- **Title/body**: Title "Share with Faculty" + subtitle `{courseCode} — {term}`. Good hierarchy. (line 447-450)
- **Density**: Card preview (gauge + section-avg list) + instructor list. Body fills sheet appropriately. (line 453-518)
- **Sheet width**: w-96 — OK for narrow summary.
- **Focus/escape/click-outside**: standard Radix. ✓
- **Semantic conflicts**: see §6 entry — the parenthetical `({responseRate}%)` trusts mock data integrity.
- **Side**: right. ✓
- **Screenshot reference**: `/tmp/visual-check/interactions/surveys.open-dialog.png` (sheet captured during open-dialog test). The instructor avatar list uses the canonical `--avatar-initials-bg` token; good.

**Verdict:** model citizen. Could promote section-avg list to `Tip` to explain "avg X/5" reads.

### M2. `CreateTemplateSheet` — `apps/pce/admin/components/pce/pce-modals.tsx:30-125`

Pre-fix pattern still in this file.

- **Footer**: `flex-1` outline + `flex-1` default — VIOLATION. (line 117-118)
- **Validation**: silent-disabled submit (`disabled={!name.trim()}`); no aria-invalid wiring on Input.
- **Title/body**: Title "New Template" or "Edit Template" — good. No DialogDescription.
- **Density**: Name + Sections (checkboxes) + Status — appropriate, ~80% used.
- **Sheet width**: w-96. OK.
- **Focus/escape/click-outside**: standard. ✓
- **Semantic conflicts**: none.
- **Side**: right. ✓

**Verdict:** apply 6f180c1's fix here (and to the rest of `pce-modals.tsx`).

### M3. `AddAccommodationModal` — `apps/exam-management/admin/components/add-accommodation-modal.tsx`

3-step wizard. Largest single dialog in the codebase.

- **Footer**: Back / Cancel / Next pattern with `outline` Cancel, `default` Next. (line 459-490) Footer split: `flex-row justify-between` so Back is left-isolated. Variant of the standard pattern — acceptable for wizards.
- **Validation**: validateStep2() + validateStep3() called on `handleSubmit`; errors state mirrors students/page.tsx. aria-invalid on Input (line 339); FieldError surfaces (line 343-345); see also line 405 on Select. ✓
- **Title/body**: DialogTitle "Add accommodation" + a `<Stepper step={step}/>` rendered inside DialogHeader (line 192-193). Stepper renders icons + labels inside DialogHeader — atypical but not wrong.
- **Density**: 3 steps × ~5 components each. Always uses ~60vh. ✓
- **Sheet width**: dialog, sm:max-w-md (line 189).
- **Focus/escape/click-outside**: standard. ✓
- **Semantic conflicts**: see §6 — the `⚠ {existing} existing` glyph is misleading (it's informational, not warning).
- **Side**: n/a (Dialog).
- **Raw checkbox**: line 429 — `<input type="checkbox">` for "Never expires" — violates DS-only-controls rule. Should be DS Checkbox.

**Verdict:** otherwise solid; two clean-ups needed (glyph + raw checkbox).

### M4. `AiGenerateModal` — `apps/exam-management/admin/components/ai-generate-modal.tsx`

Aarti's central differentiator. 3-state machine (setup → generating → results).

- **Footer**: changes per state (setup: Cancel + Generate; generating: Generating…; results: Adjust prompt + selected-count + Add). All use `outline` Cancel + `default` primary. (line 157-208) ✓
- **Validation**: setup has no required fields, generate button disabled when `objectives.length === 0` — silent-disable acceptable here because empty state is set by parent. No aria-invalid needed.
- **Title/body**: Title "Generate questions with AI" + DialogDescription explaining drafts scope. (line 124-134) ✓
- **Density**: Each view fills the modal appropriately. Generating view (line 299-322) uses ~250px height with the pulse animation centered — good.
- **Sheet width**: dialog sm:max-w-xl + max-h-[85vh].
- **Focus/escape/click-outside**: standard. ✓
- **Semantic conflicts**: none in modal itself.
- **Side**: n/a.
- **Animation**: uses `@keyframes ai-progress` inline (line 313-318) — should be promoted to a DS animation token or `--animate-*` variable for reuse.
- **Brand icon**: `fa-duotone fa-solid fa-star-christmas` correctly tagged as Leo AI per `--brand-color` rule. ✓

**Verdict:** model implementation. Animation hardcoding is the only nit.

### M5. `InterventionDialog` — `apps/exam-management/admin/components/intervention-dialog.tsx`

At-risk student loop — bottom-20% workflow.

- **Footer**: `outline` Cancel + `default` Assign primary. (line 200-208) ✓
- **Validation**: no required fields.
- **Title/body**: Title "Intervention plan" + DialogDescription. (line 73-77) ✓
- **Density**: rich — student snapshot + suggestions + intervention options + note. Uses 85vh well. ✓
- **Sheet width**: dialog sm:max-w-xl.
- **Focus/escape/click-outside**: standard. ✓
- **Semantic conflicts**: see §6 — course-avg vs weakest-area visual hierarchy is inverted relative to the action.
- **Raw checkbox**: lines 152-157, 167-172 — TWO raw `<input type="checkbox">` controls. Should be DS Checkbox per the same rule that flags `<button>` violations.
- **Brand**: uses `text-chart-4` for life-ring icon — note Aarti's "no red in viz" applies to scores not icons, but the warning-orange color is fine.
- **Auto-dismiss `done` overlay** (line 81-83) — closes the dialog 1.6s after `done` state. Acceptable for a success affordance but check that auto-dismiss respects `prefers-reduced-motion`.

**Verdict:** good shape, fix raw checkboxes.

### M6. `MoveFolderDialog` (qb-sidebar) — `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx:110-289`

Largest in-folder navigator dialog.

- **Footer**: Custom — "New folder" ghost left, then `outline` Cancel + `default` Move here right. Uses `disabled={!canMoveHere}` silent-disable. (line 269-285)
- **Validation**: silent-disable Move here when destination is invalid. No tooltip. See §6 semantic conflict.
- **Title/body**: Title `Move "{node.name}"` — embeds name in title (see §3). No DialogDescription. (line 175-177)
- **Density**: 500px height. Empty state (line 209-214) shows folder-open icon + "No subfolders here" — sparse. Suggestion: show pinned/recent folders in empty state.
- **Sheet width**: width: 480, height: 500 — fixed via inline style. Atypical (most dialogs use sm:max-w-md).
- **Focus/escape/click-outside**: standard. ✓
- **Semantic conflicts**: silent-disable without reason.
- **Inline folder creation**: lines 240-263 — `Input` + Confirm + Cancel buttons. autoFocus + ESC/Enter handlers. Good.

**Verdict:** functional but needs (a) a hover-tooltip on disabled Move here, (b) DialogDescription, (c) better empty-state.

### M7. `SendToChairDialog` — `apps/exam-management/admin/app/(app)/assessments/[id]/assessment-landing-client.tsx:338-505`

The migration-of-the-month: `flex-1` silent-disable was removed; now uses `role=group` + `aria-errormessage` + `FieldError` (line 466-468).

- **Footer**: DialogClose+outline Cancel + default Send. ✓ (line 488-501)
- **Validation**: clicks button → if 0 reviewers, sets reviewerError → renders FieldError + sets `aria-invalid` on group + `borderColor: var(--destructive)` on group div. (line 369-376, 410-415) ✓ Reference implementation.
- **Title/body**: Title is conditional `Resubmit to chair` vs `Send for chair review` + DialogDescription. ✓ (line 381-389)
- **Density**: Reviewers checklist + note textarea + previous-note LocalBanner if resubmit. Full. ✓
- **Sheet width**: sm:max-w-lg.
- **Focus/escape/click-outside**: standard. ✓
- **Semantic conflicts**: none.
- **Submit button label changes dynamically** (line 495-499) based on selection count — good UX.

**Verdict:** the new gold standard for validation surface. Use as template for the other silent-disable cases.

---

## Recommended fix priority (top 10)

| # | Fix | Modals affected | Severity | Effort |
|---|---|---|---|---|
| 1 | Apply 6f180c1 footer convention (ghost left, default right, no `flex-1`/`flex-1`) to `pce-modals.tsx` cluster | 4 sheets + 1 popover | High visibility | XS — copy-paste from `ReleaseSheet` |
| 2 | Add validation surface (FieldError + LocalBanner + aria-invalid) to `MasterCoursesPage` Add dialog | 1 dialog | Med — only PCE entity page missing it | S |
| 3 | Add validation surface to `CreateTemplateSheet`, `CreateSurveySheet`, `AddGuestSheet` in `pce-modals.tsx` | 3 sheets | Med — silent-disable is everywhere here | S each |
| 4 | Replace raw `<input type="checkbox">` in `InterventionDialog` + `AddAccommodationModal` | 3 instances | Low cosmetic, DS-rule violation | XS |
| 5 | Add hover-tooltip on disabled "Move here" in both `MoveFolderDialog` instances (qb-table + qb-sidebar) | 2 dialogs | Med UX — silent-disable confuses users | XS |
| 6 | Move long folder/template/question names out of DialogTitle and into DialogDescription | 4 dialogs | Low cosmetic | XS |
| 7 | Promote `MoveFolderDialog` (qb-table) subtitle from `<p>` to `DialogDescription` for a11y wiring | 1 dialog | Low a11y | XS |
| 8 | Wire FieldError to `Live-monitor Alert dialog` Send button + the QB Move dialogs | 3 dialogs | Med — silent-disable without surface | S |
| 9 | Use `fa-info-circle` (neutral) instead of `⚠` glyph for "N existing accommodations" in AddAccommodationModal student row | 1 modal | Low semantic | XS |
| 10 | Improve empty-state in `MoveFolderDialog` (qb-sidebar) — show recents or pinned folders when no subfolders | 1 modal | Low UX | S |

---

## DS gaps surfaced (escalate to library)

1. **`/library/dialog` route mislabel.** Per `docs/governance/component-state-catalog.md:505`, the canonical Dialog preview at `/library/dialog` actually renders `FloatingSheetAllSidesPreview` — a Sheet, not a Dialog. The mislabel cascades: developers don't see a canonical Dialog footer pattern in the library, which is why some adopt `flex-1`/`flex-1` from other shadcn defaults. **Fix the case label in `exxat-ds/.../component-preview.tsx:965-966`** so the route shows a real Dialog with the canonical footer.

2. **No canonical footer demo for the Cancel-left-ghost / primary-right pattern.** None of the DS demos show this explicitly. The 6f180c1 commit (`ReleaseSheet`) is the only working example. **Recommend:** add an `Acceptable footer patterns` section to the Sheet demo at `/library/sheet` showing:
   - ghost Cancel / default primary (canonical for forms)
   - destructive footer (Cancel + destructive)
   - 3-button wizard footer (Back / Cancel / Next)

3. **No canonical demo of validation surface on dialog inputs.** The DS Form / Field / FieldError / LocalBanner exists, but no canonical Dialog demo shows the pattern of validate() → setErrors → re-render aria-invalid + FieldError + LocalBanner summary. **Recommend:** add a `Dialog with form validation` demo showing the pattern used in `pce/admin/app/(app)/admin/accommodations/page.tsx:96-126` + `LocalBanner` pre-footer.

4. **Floating-sheet pattern (showOverlay={false}) not documented in the demo.** Currently the floating-sheet logic lives in the `FloatingSheetAllSidesPreview` (which is mistakenly served under `/library/dialog`). When developers copy from `ObjectiveDeepDiveSheet` or `TablePropertiesDrawer`, they duplicate the inline `style={{top, bottom, right, height}}` math each time. **Recommend:** a `FloatingSheet` wrapper or a documented snippet that codifies the inset math + `showOverlay={false}` + `showCloseButton={false}` triplet.

5. **`Checkbox` may not be usable in `role=option` rows.** The vendor-stripped `TablePropertiesDrawer` (lines 632-642) had to hand-roll a checkbox-glyph because DS `Checkbox`'s internal click handling can conflict with the wrapping div's keyboard handling. **Recommend:** add `data-prevent-click` or `aria-decorative` prop on DS `Checkbox` so it can render visually inside a row without intercepting events.

---

## What this audit doesn't see

- Whether focus-trap actually works under keyboard-only navigation — would need keyboard-driven Playwright test
- Whether content density "feels right" — design-taste judgment
- Whether Aarti/Vishaka have feedback on specific modal copy
- Animation smoothness (the `@keyframes ai-progress` in AiGenerateModal could feel janky on slow CPUs)
- Color-contrast at the dialog-content level (axe runs at page level, but specific token combinations inside open dialogs may not always be measured)
- Whether `onOpenAutoFocus` is correctly preventing focus-jump in cases where the dialog opens via a button that itself should retain focus
- Whether escape-key handling has any modifier-collision issues (e.g. `cmd+esc` in macOS shortcuts)
- RTL behavior — no RTL test pass against any modal in this codebase

---

## Surprising findings (5 subtle bugs)

1. **`pce-modals.tsx` is the entire silent-disable cluster.** Every other PCE admin page already migrated to `validate()` + `FieldError` + `LocalBanner`. The `pce-modals.tsx` cluster (template, survey, guest, release, delete-template, release-bulk, send-reminder) is one isolated holdout — likely because it predates the migration. Cleanup is one file, one PR.

2. **The `MoveFolderDialog` "canMoveHere" silent-disable hides a destination-equal-source rule** that users will read as a bug. `canMoveHere = currentId !== null && currentId !== node.parentId` — without a tooltip, the user clicks the button and nothing happens, repeatedly, until they navigate away. A tiny `Tip` on the disabled state would change support load.

3. **`AddAccommodationModal` uses `⚠` (warning glyph) for informational data** ("N existing accommodations"). Reading this row makes the user think "this student has a problem" when the truth is "this student has documentation on file" — exactly the opposite signal. Single-character change but high cognitive impact.

4. **`AssignPracticeDialog` decouples the per-row "weak in X" label from the pack's content-area Select**, so a user can pick a content area that doesn't match the displayed weakness. Aarti's workflow assumes they match. There's no validation or sync logic — the row labels are display-only mock data. Worth checking with Aarti whether the labels should drive the Select default.

5. **`DialogDescription` is missing on every QB modal except the top-level access dialogs.** `MoveFolderDialog` (both versions), `DeleteFolderDialog`, `DeleteQuestionDialog`, `RequestEditAccessModal` either use a `<p>` instead of `DialogDescription`, embed everything in DialogTitle, or skip the description entirely. This is an a11y regression cluster — screen readers don't get the modal's purpose announced as part of the dialog landmark, only the title.

---

## Cross-product summary

- **PCE admin:** the entity-list dialogs (8 pages) are uniformly excellent. `pce-modals.tsx` cluster (8 modals) is a single legacy holdout; one PR fixes them all. `TablePropertiesDrawer` is a careful vendor-strip with documented rationale.
- **exam-mgmt admin:** dialogs vary widely. The "high-touch" ones (AiGenerate, SendToChair, Intervention, AddAccommodation, AssignPractice, CreateAssessment) are mostly good. The QB cluster (qb-modals + qb-sidebar + qb-table) shares 4-5 patterns of silent-disable, missing DialogDescription, and long-name-in-title that should be cleaned up together.
- **assessment-taker:** only NavShell DropdownMenu — out of scope for modal-deep-study.
- **No Sheets/Dialogs/Popovers in PCE student app** — student app uses the studentUX DataTable and page-based flows. Nothing to audit.

---

## Cross-reference: catalog file mapping

For each modal in this audit, the corresponding component-state-catalog entry:

| Catalog entry | Location | Coverage |
|---|---|---|
| Dialog | `component-state-catalog.md:491-505` | Lists 9 sub-exports; describes the route-mislabel gap |
| Sheet | `component-state-catalog.md:474-488` | Documents floating-sheet pattern; required SheetTitle |
| Popover | `component-state-catalog.md:612` | Only line — minimal canonical state docs |
| DropdownMenu | `component-state-catalog.md:85-100` | Comprehensive — items, destructive, checkbox, radio, disabled, submenus all canonically demoed |

Popover is under-documented in the catalog. With 7 Popover instances surveyed here (and at least 5 patterns: confirmation popover for SendReminder, filter-pill editor for QB, hover-diff for QB folders, sibling-switcher for QB title, collaborator-avatars for QB title), there's an opportunity to upgrade Popover documentation in the catalog.
