# Build notes B1: import (sets 1, 2, 3) and starting points

**Written:** 2026-10-26 by builder B1. **Spec:** `02-skill-setup-content-and-ui-strategy.md` section 3, `01-layout-patterns.md` (T1, T2, T4, L1 to L12), `03-lab-architecture.md` sections 3, 5, 7. **Consulted:** `../../00-design-brief.md`, `../../glossary.md`, `../../02-decisions-ledger.md` (3c), `../../strategy/02` (text budget), `../../strategy/07`.

## What was built

| Screen / variant | File | Template | What it is now |
|---|---|---|---|
| import A (set 1, Guided) | `admin/components/lab/screens/admin-import-a.tsx` | T2 wizard, 960 px, `WizardPage` + `StickyFooter` | Four one-word steps: Upload, Review, Fix, Confirm. No visible "Step n of m", no visible step heading. One filled primary per step, always in the sticky footer |
| import B (file beside the list) | `admin-import-b.tsx` | T4 split, full width | Dropzone hero before the drop; after it one summary sentence, then one card with two resizable panes: the file as written (read only, 40 percent) and only the lines that need a decision (same fix rows as A). "Show all lines" switch swaps in everything read, by category. Footer: destination, "Name this import", Create |
| import C (new, many at once) | `admin-import-c.tsx` | wizard width, one page, no stepper | "Paste the list" textarea read as you type (250 ms), files can be dropped on it (several files read the larger sample), the same fix list below, footer with destination and Create. Draft kept in `sessionStorage["lab:import:paste"]` |
| starting points A | `admin-starter-library-a.tsx` | T1 list | Title, ownership fact as subtitle, one outline header action (Import skills), table; row click opens the preview panel; one ghost "Copy" per row; the panel's "Use as a starting point" is the only filled button |
| starting points B | `admin-starter-library-b.tsx` | T1 list | Discipline switch plus cards; card title is a plain link that opens the preview (`?preview=id`), no button per card; "Decision pending" pill removed (now `labNotes`) |

Shared pieces: `components/lab/import/import-parts.tsx` (rewritten: `Dropzone`, `TargetLine`, `FileStatus`, `ReadingState`, `FailedState`, `ReviewSummary`, `CategoryList`, `FixList`, `FixIntro`, `FixErrorSummary`, `ConfirmPanel`, `NotCreatedList`, `DoneBanner`, `DiscardDialog`, `useCancel`), `use-import-session.ts` (default list, paste hand-off, `lab:reset`, `readFiles`, `readText`, `groups`, `left`), `starter-copy.tsx` (default list preselected, says what is and is not copied). Engine additions in `lib/lab/import.ts`: `IMPORT_GROUPING` (the Category and tag words behind one constant), `FIX_ORDER`, `DEFAULT_LIST`, `NO_CATEGORY`, `readableText`, `primaryKind`, `fixGroups`, `linesLeft`, `fixContext`, `categoriesOf`, `notCreated`, `confirmSentence`, `pasteToText`, `PASTE_KEY`, `parsePastePayload`; `CONFIDENCE_WORD.look` is now "Needs a decision" (J11); `EXCEPTION_LABEL.section` reads "Category unclear". 9 new unit tests in `tests/lab/import.test.ts`.

## Engine figures the screens render (standard sample, default list)

156 skills read, 10 categories, 16 lines need a decision, 4 repeats (2 in the library, 2 twice in the file), 2 lines could not be read; after suggestions 153 skills are created (3 left out, 2 joined). Large sample (several files): 624 read, 490 need a decision. The unreadable line 41 shows "Text could not be read" in muted italic; line 218 shows its readable text. No replacement glyphs anywhere (tested: `readableText`).

## Deviations from the spec, and why

1. **Option set mapping.** My brief said set 2 = B (two panes) and set 3 = new C (bulk paste). Spec 03 says set 2 = C "one page, one decision at a time" and set 3 = B. I built C as the brief describes (paste or drop several, same fix list), not the spec's one-at-a-time decision card. The lab bar (B4) currently maps set 2 to C and set 3 to B, as spec 03 says. Romit or B4 should confirm which C is wanted; the decision-card idea (spec 3.5) is not built.
2. **Counts are lines, not decisions.** Line 194 has two exceptions (library repeat and lost category). Every count says lines (16), and the line is listed once under its first kind with two selects. Saying "17 decisions" in one place and "16 need a decision" in another would contradict itself.
3. **Review keeps rename.** "No inline fixes" in Review is kept (decisions only in Fix), but renaming stays inside an expanded category via `InlineInputEdit` because REQ IM-05 needs edit before confirm. Collapsed by default, so it adds no visible control.
4. **Review lists categories in file order**, with the "{n} to decide" amber badge on the categories that hold decisions, and those lines first inside each category. Reordering the categories themselves would break "I recognise my own list" (J2).
5. **Fix rows show the reader's name** (bullets, numbers, marks removed), with a one-line context under it ("Same as ... in the library", "Also line 10", "Would read ...", "After a page break, below Nutrition"). Showing the raw line put "• *Sterile dressing" in front of the admin.
6. **Upload footer has no primary until a file is read** (spec 3.1: render only when done). Context line "Nothing is created until you confirm." stays.
7. **B file pane is read only.** Selecting a row on the right (focus or click) scrolls the file pane to that line and marks it. The built B made every line a ghost button; in this DS ghost buttons carry a fill, so the file pane read as a striped list of buttons.
8. **Starting points B preview opens from the card title link** (`?preview=id`) instead of a "Preview" button per card: 5 buttons put the page over the list controls budget (7 of 6).
9. **Gate path.** Variants import `@/components/lab/layout/sticky-footer` and `.../wizard-page` directly, not the `layout` barrel: the DS gate does not follow relative re-exports in `index.ts`, so through the barrel it reported PageHeader missing. B4 may want the gate to follow `export ... from "./x"`.
10. **Density script `wizard` type** uses spec 01 section 3 exactly: regions 4, figures 1, charts 1, controls 7 fields (counted like a form; Cancel, Back and primary are reported as actions), words 30, primary 1. My brief quoted "controls 6, words 40"; spec 01 says 7 fields and 30 words, and I followed spec 01. Import B is mapped to `split` in `VARIANT_TYPE`.

## Density (script output, 1440 x 900, default URL)

```
| admin/import-ai-review | A | 1440 | wizard | 4/4 | 0/1 | 0/1 | 0/7 fields | 25/30 | 1/2 | PASS |
| admin/import-ai-review | B | 1440 | split  | 3/5 | 0/3 | 0/0 | 3/8        | 23/40 | 0/2 | PASS |
| admin/import-ai-review | C | 1440 | wizard | 3/4 | 0/1 | 0/1 | 1/7 fields | 26/30 | 0/2 | PASS |
| admin/starter-library  | A | 1440 | list   | 3/4 | 0/3 | 0/0 | 4/6        | 11/40 | 0/2 | PASS |
| admin/starter-library  | B | 1440 | list   | 2/4 | 0/3 | 0/0 | 2/6        | 11/40 | 0/2 | PASS |
```

The script only opens the default URL (step 1 of A, the empty B and C). Later steps, counted by hand from the 1440 shots (not script output):

| Step | Regions | Fields above the fold | Words (approx.) | Primary | Note |
|---|---|---|---|---|---|
| A Review | 4 | 0 (11 accordion triggers are actions) | 25 | 1 | 11 category triggers exceed a cluster of 7; accepted in spec 3.2 because they mirror the file |
| A Fix | 4 (5 after a failed Continue: error summary) | 7 selects | 16 | 1 | plus 3 group triggers and 3 "Accept" buttons; spec 3.3 flags this as a decision list |
| A Confirm | 4 | 1 | 30 | 1 | |
| B review | 4 | 7 selects in the right pane | 23 | 1 | |
| C review | 5 (textarea, summary, fix list) | 1 textarea + selects below the fold | 26 | 1 | |

## Screenshots (looked at every one)

`../lab-shots/b1-import-a-1-upload`, `-1-reading`, `-1-read`, `-1-failed`, `-2-review`, `-3-fix`, `-3-fix-error`, `-3-fix-large`, `-4-confirm`, `-4-done`, `b1-import-a-paste-handoff`, `b1-import-b-empty`, `-review`, `-review-linked`, `-show-all`, `-clear`, `-done`, `b1-import-c-empty`, `-review`, `-pasted`, `-large`, `-done`, `b1-starter-a`, `-a-copy`, `-a-preview`, `b1-starter-b`, `-b-preview`, `-b-empty`; each at `-1440.png` and `-375.png` (B's linked and show-all only at 1440: below 768 px B shows the decisions only).

## Open points

1. Category and tag wording stays behind `IMPORT_GROUPING` (PENDING-ROMIT, J9).
2. Which variant C is wanted (paste and fix, built; or one decision at a time, spec 3.5, not built).
3. Demo controls ("Use the sample file", "Use the large sample") are gone from the page; the lab bar Scenario menu (B4) should list import scenarios `state=review|large|failed|clear|done|empty` (spec 03 section 5.2). Dropping any file on A or B reads the sample.
4. On short steps (Upload, Confirm, Done) the sticky footer sits under the content, not at the viewport bottom: `StickyFooter` is `sticky bottom-0` and the page column does not stretch. That is the B0 layout's call; a `min-h` on the wizard column would pin it.
5. The `/lab/admin/import` alias was not added (needs a route or `next.config` entry; B4's files).
6. axe was not run. Keyboard: Fix error summary takes focus and each link focuses the first open select of its group (checked in a probe); Done banner takes focus.
7. Line numbers key the decisions, so editing the pasted text in C above a decided line can move a decision to another line. Acceptable for the lab; a real reader would key by content.
