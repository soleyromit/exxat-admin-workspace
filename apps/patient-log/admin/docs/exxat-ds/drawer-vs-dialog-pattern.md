# Sheet panel vs dialog vs route

> **Related:** `docs/data-views-pattern.md` (Page vs drawer), **`AGENTS.md` §6.4**, **`.cursor/rules/exxat-page-vs-drawer.mdc`**. **This doc** splits **floating `Sheet` panels** vs **modal dialog** when both stay on the same route.

## Sheet (side panel — product “drawers”)

**Use when:**

- The **list or hub behind the panel** still matters (user compares, copies, or dismisses and continues browsing).
- The flow is **medium length** — export options, table/column properties, invite collaborators, filters that mirror the grid.
- **Width** helps — tables of options, multi-field forms that would feel cramped in a narrow dialog.

**Implementation:** **`Sheet`** from `@exxatdesignux/ui/components/sheet` with the floating inset pattern (`showOverlay={false}`, `getFloatingSheetInsetProps`) — see `ExportDrawer`, `TablePropertiesDrawer`, `InviteCollaboratorsDrawer`, `LibraryNewFolderSheet`.

**Width:** pick a **`size`** on `SheetContent` instead of hand-rolling a `max-w-*` class. Sizes apply to `left` / `right` sheets from the `sm` breakpoint up; below that every sheet stays at 3/4 of the viewport so the dismiss target beside it stays visible. `top` / `bottom` sheets span the viewport width and ignore `size`.

| `size` | Width | Use for |
|---|---|---|
| `sm` | 20rem | Rail beside a hub: filters, properties, a short option list |
| `md` (default) | 24rem | Single-column forms, export options |
| `lg` | 32rem | Two-column forms, option tables, record summaries |
| `xl` | 40rem | Dense tables, side-by-side comparison |
| `full` | Viewport | Mobile-style takeover |

If the content needs more room than `xl`, that is the signal to promote it to a **route** rather than widen the sheet.

**Anatomy.** A rail is four stacked regions, in this order: **toolbar**, **header**, **body**, **footer**. Header and footer MUST NOT live inside `FloatingSheetPanelBody`.

**Toolbar.** Every rail gets a `FloatingSheetPanelToolbar`. It owns every control that acts on the rail itself: dismissal, the **size menu**, **back** out of a sub-panel (`onBack`), and record stepping.

**Back on the left, everything else on the right.** Set `onBack` while a sub-panel is showing and it takes the one leading-slot position. The size menu, record stepping, the consumer `actions` slot, and Close all live in a single right-aligned cluster instead, in that fixed order — size, then stepping, then `actions`, then Close last, at the panel's outer corner. Close renders whether or not `onBack` or `actions` are set: it is the one control every rail carries, so it gets the one position that stays the same corner no matter how many other controls a given panel happens to add, mirroring the common back-top-left / close-top-right convention. A user two levels into Properties (Filter, then a field's operator picker) can still leave the rail in one action, not N presses of Back. Escape also closes the rail outright from any level, but a keyboard-only exit is not a substitute for a visible one. Pass `onPrevious` / `onNext` only when the rail is showing one of an ordered set, such as a table row detail; leave them off for Export or Properties. The `actions` slot takes share, favourite, and overflow, rendered just before Close. Every icon-only control needs a label and a `Tip`, and every item in a rail's menus needs a leading `fa-light` icon like any other DS menu.

**Header variants.** Title alone; title with `description` for a rule the user needs before acting; or title with `subtitle` for one line of meta (a count, a state, a record ID, never a sentence). The header carries no navigation: a sub-panel keeps the same title row and gets its back button from the toolbar, so drilling in does not reshape the top of the rail. The header grows a bottom border once the body has scrolled, so the title stays separated from content moving under it. Pass `onClose` **only** on a rail with no toolbar.

**Tooltips and menus inside a rail.** A rail sits at `z-[80]`, above the default tooltip layer, so anything a rail opens must clear it. `FloatingSheetPanelContent` publishes that elevation as context and `Tip` reads it, which means a `Tip` anywhere inside a rail (including one you drop into `actions`) is lifted without being told. Popovers and select menus still need `z-properties-sheet-portal` on their content.

**Rail width:** `FloatingSheetPanelContent` takes its own `size` — `sm` 24rem (default), `md` 32rem, `lg` 40rem — set at the rail, not on `SheetContent`. Pick the smallest that fits: `sm` for filters, properties, and short option lists; `md` for single-column forms past a handful of fields; `lg` for dense tables or side-by-side comparison. Past `lg`, use a route. The user can change size from the toolbar menu or drag to a width in between; both are remembered per `contentSlot`, and a size chosen from the menu clears a previously dragged width. The width is applied inline rather than as a class because `SheetContent`'s `data-[side=right]:w-3/4` outranks a plain `w-[…]` utility.

**The page behind stays live.** Rails are **non-modal**: no focus trap, no scroll lock, no `pointer-events: none` on the body. The user can scroll the hub, expand a folder, or click another row with the rail open. A rail is an inspector beside the work, not a door in front of it. A surface that genuinely must block the page is a **dialog**, not a sheet with `modal`.

**Dismissal: the hub closes the rail, the rail's own triggers retarget it.** A click on the page behind closes the rail, on `SheetContent`'s `dismissOnOutsideClick` (default `true`), alongside **Escape** and the close button. The exception is the control that put something *into* the rail: pressing **Properties** while Properties is open is a request to go back to its index, and choosing **Filter by this column** from a column menu is a request to change what the rail is showing. Neither is a request to close it, and Radix sees the same pointerdown either way, so those controls carry `railTriggerProps()` and `FloatingSheetPanelContent` skips the dismissal for them. Without it the sequence is dismiss-then-reopen: the rail blinks, and its scroll position, its current sub-panel, and any half-filled field are gone.

Mark the **trigger**, and also the **menu content** when the control is a menu item — a portalled menu is outside the rail too, so the press that chooses "Filter" would otherwise dismiss the panel it is about to fill. Marked today: the Properties toolbar button and the `DataTable` column-header menu (trigger and content). Radix already excludes anything the click *opens from inside* the rail — a `Select` / `Popover` / `DropdownMenu` mounted within it is the same dismissable branch — so a rail's own menus need no mark. Do **not** hand-roll `onPointerDownOutside` / `onInteractOutside` guards; the primitive owns this.

**A click closes a rail. Focus landing outside never does.** `FloatingSheetPanelContent` prevents Radix's `onFocusOutside`. The rail is non-modal on purpose, so the page behind stays workable and focus leaving the rail is ordinary rather than a dismissal. It is also the only way a rail opened from a **menu item** can survive: the menu restores focus to its trigger as it unmounts, a few milliseconds after the rail it just opened has mounted, and Radix reads that focus restore as an interaction outside. Radix exempts a `DialogTrigger` from this, but rails are controlled through `open` / `onOpenChange` and have no trigger, so the exemption never applies. Left unguarded, every rail reachable from a kebab menu (**Export**, **Invite people**) closed the instant it appeared, while rails opened from a plain button (**New folder**) were fine.

**Escape belongs to the rail.** Because a rail is non-modal, the page's own keyboard bindings stay mounted underneath it, and a page-level Escape (the sidebar drill-in's exit, for one) would otherwise run on the same keystroke that dismisses the rail: the user closes an inspector and lands on another route. `useShortcut` therefore parks every **page-scoped** `<Shortcut>` while any dialog, alert dialog, or sheet is open. Bindings rendered **inside** the overlay still fire, because `SheetContent` / `DialogContent` / `AlertDialogContent` mark their children as overlay-scoped. Nothing to wire per rail. Do **not** re-add a manual "is a dialog open" test in a shortcut handler: the check has to happen before Radix dismisses on keydown capture, which is why it lives in the hook.

**Opening a rail focuses the panel, not its first button.** `FloatingSheetPanelContent` overrides Radix's auto-focus to land on the panel element. Focusing the toolbar's leading button instead would open that button's tooltip the moment the rail appears, and the tooltip would swallow the first Escape.

**One rail at a time:** every `FloatingSheetPanel` joins a single-rail group, so opening Export while Properties is open closes Properties instead of stacking two rails at the same `z-[80]`. Each drawer still owns its own `open` boolean; the group only asks the previous one to close. Two rails pinned to opposite edges that genuinely belong on screen together opt out with `exclusive={false}`.

Prefer swapping content **inside** an open sheet over closing and reopening one. `TablePropertiesDrawer` is the reference: it keeps one panel mounted and moves between `main` and its sub-panels with local `navPanel` state plus an `initialPanel` deep link.

**Resizing:** rails of every `size` are drag-resizable from their inner edge by default, clamped between 280px and 960px and never wider than the viewport less 48px. Width is remembered per drawer under `shell:sheet:<contentSlot>:width`, the same shell-preference family as the secondary panel and Ask Leo rail widths. Opt out with `resizable={false}`. Resizing is off on compact and mobile layouts, where the rail is already near full-bleed. The handle is pointer-only, matching every other resize handle in the app; see the keyboard note in `.cursor/rules/exxat-accessibility.mdc` §15.

**Avoid when:** The task is the **only** thing the user should focus on and the parent would distract (prefer **dialog** for a sharp confirm, or **route** for a full wizard).

### Record rail: reading one row without leaving the hub

Scanning a hub asks "is this the record I want?" far more often than "let me edit this record". A route answers the second question and charges the first one a page load plus a way back; a rail answers the first one with the list still on screen to compare against. Editing stays on the record's own page, reached from the rail's footer. `LibraryRecordRail` is the reference.

**Rules for a record rail:**

- **The open record lives in the URL**, as a search param (`?record=<id>`), written with `replace: true`. A rail the user can reload into or paste to a colleague is worth the param; a rail that evaporates on refresh is not. History stays clean because stepping through twenty records should not cost twenty **Back** presses.
- **Rows are rail triggers.** Give each row `railTriggerProps()` so clicking a second row retargets the rail instead of dismissing and reopening it. `HubTable` does this for you whenever `openRowId` is passed, including `null`.
- **Step within what the hub is showing**, not the raw dataset: read `HubTableHandle.visibleRows` so previous / next follow the user's own filters, sort, and page, and disable the ends rather than wrapping.
- **Keep the body host-agnostic.** The fields belong in one component (`LibraryQuestionDetailBody`) that returns the stack of sections and nothing else; each host supplies the frame and the scrolling. The tree view's right pane and the rail describe the same record, and they must not drift.

**Mark the open row.** A rail beside a hub is useless if the user cannot tell which of two dozen rows it is describing. The grid draws a leading bar on the open row; the list view rings the card. Both also set `aria-current`, because a colour on one edge says nothing to a screen reader.

`--dt-row-open-marker` is a **separate token from selection** on purpose. Selection tints the whole row and feeds bulk actions; open marks one edge and answers "which one am I reading?". A row can be both at once, so neither signal may be drawn as the other. The token takes `--brand-ink` normally and plain `--foreground` in the high-contrast themes, which flatten brand hues.

## Dialog (modal)

**Use when:**

- You need a **hard stop** — user must answer or dismiss before interacting with the page again (confirm delete, acknowledge legal, pick a single blocking choice).
- The content is **short and focused** — one decision, one form step, or a compact message with primary/secondary actions.
- **Destructive or irreversible** actions — pair with clear copy; **Esc** / Cancel returns safely.

**Examples:** `AlertDialog`, confirm-before-remove, “Save changes?” when navigating away.

**Avoid when:** Users need to **reference** the grid or copy values from the page while the panel is open — use a **sheet panel** or **inline** pattern instead.

## Route (new page)

Use when the work is **primary**, **long**, **multi-step**, or deserves its **own URL** — see **`exxat-page-vs-drawer.mdc`** and **`AGENTS.md` §6.4**.

## Quick matrix

| Need | Sheet panel | Dialog | Route |
| --- | --- | --- | --- |
| Keep hub visible | Yes | No (blocks) | No |
| Short confirm / alert | Rare | Yes | Overkill |
| Long form / wizard | Cramped | No | Yes |
| Properties tied to a table | Yes | Too small | Optional |

## Accessibility

- **Dialog / sheet:** Must expose a **title** (`DialogTitle`, `SheetTitle`) — use `sr-only` if visually hidden.
- **Focus trap** is expected in dialogs; sheet panels should still **restore focus** on close to the invoking control.

## See also

- **`.cursor/rules/exxat-drawer-vs-dialog.mdc`**, **`.cursor/skills/exxat-drawer-vs-dialog/SKILL.md`**
- **`exxat-no-toast.mdc`** — use dialog/banner/inline, not toasts, for outcomes that need acknowledgment.
