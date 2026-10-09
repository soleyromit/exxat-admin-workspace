# Exxat DS: Tabs (peer view switcher)

**Audience:** engineers + AI agents. **Binding rule:** [`.cursor/rules/exxat-tabs-chrome.mdc`](../../.cursor/rules/exxat-tabs-chrome.mdc).

`Tabs` switch between **peer views** on one record or surface. They are **not** sequential steps (use `Wizard`) and **not** hub view switching (use `ViewSegmentedControl`).

**Job doc:** [`jobs/record-detail.md`](./jobs/record-detail.md). **Primitive:** `packages/ui/src/components/ui/tabs.tsx`.

---

## When to use

| Surface | Use |
|---------|-----|
| Record detail sections | Overview, Academics, Placements under one H1 |
| Token doc namespaces | Primary pill tabs + optional count badge |
| In-card panels | `variant="line"` for chart vs trend inside ChartCard |
| Related peer content | Sections users compare without changing URL |

**Modern analogues:** Height view tabs (M1, M4); Linear issue detail (M1, M4). **Principles:** P1, P2, P3, P6, P13.

---

## When NOT to use

| Job | Use instead |
|-----|-------------|
| Hub table / board / dashboard views | `ViewSegmentedControl` on `ListPageTemplate` |
| Sequential create with completed steps | `Wizard` |
| Theme or 2-5 mode chips | `ButtonSegmentedControl` |
| Six or more infrequent filters | `DropdownMenu` icon trigger |

---

## Every navigational tab carries an icon

**MUST:** a tab that names a destination (a record's modules, a settings section, a panel) is built from `TabsTriggerIcon` + `TabsTriggerLabel`, never a bare text child.

This is not decoration, it is what buys the row its first and cheapest rung of degradation. Rung 1 below trades inactive labels for their glyphs and keeps the selected tab reading as icon **plus** label, so a narrow row still shows every destination and still says where you are. A row of label-only tabs cannot take that rung, so the first thing it does under pressure is hide whole destinations in a menu.

Keep the glyph honest: it has to be recognisable **alone**, because that is how it will be read. Reuse the icon the sidebar or hub already gives that concept rather than picking a second one for the same thing.

**The exception is a tab whose label is a value, not a place** — a chart's data slice ("By status" vs "By facility"), a period picker, a metric switcher showing a number. No glyph tells those apart, so an icon-only row would be unreadable and shedding whole tabs to the menu is the better degradation. Omit the icon there and let rung 2 do the work. `ChartCard`'s `tabOptions` takes an optional `icon` for the slices that do have one.

### Pass the light cut; selection makes it solid

Write the glyph as `fa-light` and stop there. The selected tab's glyph is drawn solid for you, the same way the sidebar marks its active row, and it is the signal that survives rung 1: when inactive labels collapse to `sr-only`, weight is what still says which of six glyphs you are on.

The promotion is a stylesheet rule in `globals.css`, keyed on how each surface reports selection (`data-state` on Radix tabs, `aria-pressed` on the hub view rail, `aria-checked` on `ViewSegmentedControl`), so it also reaches the icon strings consumers hand to `ViewSegmentedControl` and `ViewTab`. **Do not** branch on the active state to pass `fa-solid` yourself: two mechanisms for one signal, and the hard-coded one wins in the wrong places. Brands and duotone are left alone, since each ships a single weight.

---

## Overflow

**You do not opt into this.** Every `TabsList` handles its own overflow, because whether a row runs out of room is a property of the space it is given, not a decision a call site can make in advance: the same tab row fits on a dashboard and clips in a side panel. Requiring a wrapper meant the rows nobody thought about were exactly the rows that broke.

## Sticky subheader

Horizontal `TabsList` rows (default overflow path) pin as a **sticky subheader** inside `[data-page-scroll]`:

- `sticky top-0` — utility bar sits outside the page scrollport, so the strip lands directly under it
- Height = `--shell-utility-bar-height` (same as the utility bar)
- Full-width `border-b` on `[data-slot="tabs-sticky-subheader"]` (line lists drop their short track border so the rule spans the canvas)
- `bg-background` so scrolling content does not show through

**Hub view toolbars** use the same contract via `[data-slot="list-views-sticky-subheader"]` on `ListPageTemplate`.

### Three-layer sticky stack (hubs)

| Layer | Chrome | Notes |
|-------|--------|--------|
| 1 | Utility bar | Outside `[data-page-scroll]` |
| 2 | View tabs **or** module `Tabs` | Sticky strip, utility-bar height, full-width rule |
| 3 | DataTable column header | `getStickyTableHeaderOffset()` uses live bottom of layer 2 when stuck (`STICKY_SUBHEADER_SLOTS` in `page-scroll-port.ts`) |

Vertical tabs and `overflow={false}` rows do not use the tabs sticky strip.

## Each tab keeps its own scroll position (`rememberScroll`)

Tab panels share the page scrollport, and swapping the panel does not move it, so the offset from the tab you left carries into the tab you asked for. Nothing good comes of that. A panel tall enough to hold the offset opens halfway down content you have never seen; a panel too short gets clamped, so the same click throws you back past the page title to the top. On a course record that is Patient Log at 8,000px next to Gradebook at one screen, and every switch between them moves the page.

Pass **`rememberScroll`** on `Tabs` and each tab gets its own place:

- **Visited before** — reopens exactly where you left it, re-applied for up to half a second while the panel grows (lazy chunk, table measuring its columns, images settling), and abandoned the moment you touch the wheel, a key, or the screen.
- **Not visited** — opens at the top of **its own panel**, not the top of the page: the tab row stays pinned exactly where it is and the new panel's first row lands under it. Never scrolls *down*, so clicking a tab while reading the page header leaves the header alone.
- **Too short to hold it** — lands wherever it clamps, because there is nowhere else to be. A view whose whole page fits (a four-card dashboard under a tall KPI band) will sit at the top; the fix for that is layout, not scroll.

`ListPageTemplate` does this for hub views already, keyed on the active view id, so hubs need no prop.

**When not to pass it:** a tab row that is not the page's navigation. Tabs inside a card or a panel (Chart / Trend on one chart) must not move the page under the reader, and without the prop they do not.

A row gives up space in a fixed order, measured rather than at breakpoints, so it degrades identically in a narrow panel and at 200 percent zoom:

1. **Labels drop to icons** for inactive tabs. Only triggers built from `TabsTriggerIcon` + `TabsTriggerLabel` can do this, because a label-only tab would collapse into nothing. The label becomes `sr-only`, so the tab keeps its accessible name, and it gains a tooltip.
2. **Tabs move into an overflow menu** at the end of the row, one at a time, as `menuitemradio` entries. The trigger looks like the last thing inside the track, but it is a sibling of the tablist rather than a child, because a `tablist` may only contain tabs. To square those two, `TabsList` hands its track (background, padding, radius, the line variant's bottom border) to a shell wrapping both, so the row still reads as one control.
3. **The row scrolls**, which in practice is one tab plus the menu.

Two rules the row depends on:

- **The selected tab is never in the menu.** If it would have been, it trades places with the last tab still on the row. That means row order can differ from source order at narrow widths, which is the price of always showing the user where they are.
- **Each step only ever shrinks the row.** Widening resets to step 1 and re-derives, because a collapsed row fits, so re-deciding from the collapsed measurement would expand, overflow, and oscillate.

Scroll arrows stay hidden while the menu is doing the work. Two arrows cost about as much width as two tabs, and they would only scroll to content the menu already lists. Set `overflowMenu={false}` to opt out and scroll instead. See [`horizontal-scroll-pattern.md`](./horizontal-scroll-pattern.md).

Settings live on `TabsList` (`ariaLabel`, `collapseLabels`, `overflowMenu`, `overflowLabel`, and `overflow={false}` to switch the whole thing off). `TabsListScrollRegion` still works and passes the same settings down, which is worth reaching for in one case: a class that belongs on the scroll region rather than the tablist, such as the page gutters a full-bleed tab row needs.

Two consequences of the row measuring itself. A vertical `Tabs` skips all of it, since the ladder measures width. And the row now clips at its parent's width instead of overflowing past it, which is what lets it notice it is too wide in the first place.

---

## Composition example

```tsx
<Tabs defaultValue="overview" className="w-full">
  <TabsList variant="line" ariaLabel="Student sections">
    <TabsTrigger value="overview">
      <TabsTriggerIcon>
        <i className="fa-light fa-grid-2" aria-hidden="true" />
      </TabsTriggerIcon>
      <TabsTriggerLabel>Overview</TabsTriggerLabel>
    </TabsTrigger>
    <TabsTrigger value="placements">
      <TabsTriggerIcon>
        <i className="fa-light fa-hospital" aria-hidden="true" />
      </TabsTriggerIcon>
      <TabsTriggerLabel>Placements</TabsTriggerLabel>
    </TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="placements">...</TabsContent>
</Tabs>
```

Driving the row from a map keeps the label and its glyph in one place, which is how `learning-activities-course-detail-client.tsx` does it (`COURSE_DETAIL_MODULE_LABELS` + `COURSE_DETAIL_MODULE_ICONS`).

---

## See also

- [`wizard-pattern.md`](./wizard-pattern.md)
- [`horizontal-scroll-pattern.md`](./horizontal-scroll-pattern.md)
- [`jobs/record-detail.md`](./jobs/record-detail.md)
