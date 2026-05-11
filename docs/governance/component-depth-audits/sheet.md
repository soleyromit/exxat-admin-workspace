# Sheet — Depth audit (2026-05-11)

> Retroactively written from conversation 2026-05-11. Sheet was discussed
> in-thread during the share-with-faculty bug fix but the audit didn't get
> committed to disk until now.

## Library reality

- Exports: `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`, `SheetClose`
- Source: `/Users/romitsoley/Work/exxat-ds/packages/ui/src/components/ui/sheet.tsx`
- Library demo: `http://localhost:4000/library/sheet` (also "Floating sheet (all sides)" demo at `/library/dialog`)
- Sides: `top` / `right` / `bottom` / `left` via `<SheetContent side="...">`
- Optional props: `showCloseButton`, `showOverlay`
- Floating-sheet pattern: `showOverlay={false}` + `getFloatingSheetInsetProps(side)` for rounded, inset, no-dim panels (used by ExportDrawer + TablePropertiesDrawer)

## Adoption snapshot

| Workspace | Files using Sheet | Floating-pattern uses | Hand-roll sheet substitutes |
|---|---|---|---|
| PCE admin | 2 (`pce-modals.tsx`, surveys/[id]/page.tsx) | 0 | 0 — no custom slide-overs found |
| PCE student | 0 | 0 | 0 |
| exam-mgmt admin | (per ds-adoption registry — verify) | 0 (drawers but check) | (verify) |

## PCE admin — current usage

### `apps/pce/admin/components/pce/pce-modals.tsx`
- `CreateTemplateSheet` (l.26-119) — Sheet right side, width-96, full slot composition (SheetHeader + SheetTitle + form body + SheetFooter). Correct shape.
- `CreateSurveySheet` (l.~213) — same pattern.
- `ReleaseSheet` (l.428-535) — **rewritten 2026-05-11** as part of the bug Romit caught:
  - Fixed semantic data conflict (`if (response)` → `if (survey.responseCount > 0)`)
  - Refactored Card-imposter `<div>` into proper `Card` + `CardHeader > CardTitle + CardDescription` + `CardContent`
  - Footer convention: was two `flex-1` buttons; now Cancel `variant="ghost"` + primary `variant="default"` right-aligned
  - Added `overflow-y-auto` on body region for long content

### `apps/pce/admin/app/(app)/surveys/[id]/page.tsx`
- `<ReleaseSheet>` wired with `releaseOpen` state (l.21, l.222). Correct usage.

## What Sheet does that PCE often skips

Per library demo "Floating sheet (all sides)" at `/library/dialog`:

1. **Floating-sheet pattern** — `showOverlay={false}` + `getFloatingSheetInsetProps(side)` produces a rounded, inset panel that doesn't dim the underlying page. Used by `ExportDrawer` + `TablePropertiesDrawer`. **PCE has 0 uses of this pattern** — every sheet is full-overlay slide-over. When you wire TablePropertiesDrawer (after vendor), this pattern becomes the default.

2. **`showCloseButton={false}`** — for sheets with custom close affordance in the body (e.g., explicit "Save" + "Cancel" in footer). PCE doesn't use this; default close button works for current modals.

3. **Side variants beyond `right`** — top/bottom/left rarely used but valid for: mobile bottom sheets, side-rail panels for filter pickers. PCE has no such surface currently.

## Footer convention (caught and fixed 2026-05-11)

The DS Sheet footer convention from the library demos:
- Cancel: `variant="ghost"` or `variant="text"` — visually de-emphasized, left or just inline
- Primary action: `variant="default"` (solid) — right-aligned
- Layout: `flex flex-row justify-end gap-2`, no `flex-1` on either button

PCE's `ReleaseSheet` had `<Button variant="outline" className="flex-1">Cancel</Button>` + `<Button variant="default" className="flex-1">Share</Button>` — both equal-weight, both full-width. Fixed to ghost + primary right-aligned. **Other PCE sheets** (`CreateTemplateSheet`, `CreateSurveySheet`) should be re-audited for the same pattern.

## Bug class

| Pattern | Where seen |
|---|---|
| Sheet's body Card-imposter (`<div className="rounded-lg border border-border p-4">` instead of Card slot composition) | `pce-modals.tsx:71` (CreateTemplateSheet — flagged as audit warn but legitimate checkbox-group wrapper, see registry); `pce-modals.tsx:453` (was ReleaseSheet — fixed) |
| Footer `flex-1` on both buttons (equal-weight Cancel + primary) | `pce-modals.tsx:500-509` (was ReleaseSheet — fixed); verify `CreateTemplateSheet` + `CreateSurveySheet` |
| Sheet body sparse / empty mid-region (UX issue, not API issue) | `ReleaseSheet` had this — content was ~250px tall in a ~700px sheet. Needs more content OR sheet should size to content. Not in scope for the bug fix; tracked. |

## Bigger gaps the audit can't see

- **Whether sheet width-96 is appropriate** — `CreateSurveySheet`, `CreateTemplateSheet`, `ReleaseSheet` all use `w-96 sm:max-w-96`. If form content needs wider, this is too narrow.
- **Whether sheets close on backdrop click consistently** — DS Sheet's default behavior; PCE relies on it. Audit doesn't verify.
- **Whether the floating-sheet pattern would replace some existing sheets** for less intrusive UX (e.g., a sheet that opens with no overlay so user can still see the row context behind).
- **Body content density** — semantic-eye check. Audit can't see "this sheet has a tall empty middle."

## Recommended next 3 fixes

1. **Re-audit `CreateTemplateSheet` and `CreateSurveySheet` footers** for the same Cancel-as-`outline-flex-1` vs Cancel-as-`ghost-right-aligned` pattern Romit caught in ReleaseSheet. ~30min total.

2. **Verify the `pce-modals.tsx:71` Card-imposter** stays documented as legitimate (it's a Checkbox group wrapper, not a Card). Currently in registry's "Legitimate non-Card divs (known audit false positives)". Audit will keep warning on it; that's acceptable.

3. **When `TablePropertiesDrawer` is vendored** (organisms audit, separate session), use it as the first floating-sheet pattern example in PCE. This unlocks the no-overlay UX for any subsequent properties / settings panels.

## What audit can't see (Sheet-specific)

- Footer button convention (`flex-1` vs `ghost+right`)
- Body density / empty whitespace
- Sheet width-96 vs needed content width
- Floating vs full-overlay pattern fitness for the context

These join the workspace-wide gaps tracked in `docs/governance/blind-spots.md` row #12.
