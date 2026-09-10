# Ask Leo — AI chat surface

**Code:** `components/ask-leo-sidebar.tsx`, `components/leo-thread-messages.tsx`, `components/ask-leo-composer.tsx`, `lib/use-leo-thread.ts`. Primitives: `@exxatdesignux/ui/components/ui/{message,bubble,marker,message-scroller}`.

## Role

**Long-form AI** beside the hub — multi-turn Q&A, reasoning, and help that does not fit the ⌘K command palette. Short lookups stay in **CommandMenu**; plot insights on charts use **ChartLeoPlotInsightOverlay** (`exxat-chart-leo-spotting` skill).

## User model

| Need | Surface |
|------|---------|
| Jump to route / pattern / row | ⌘K command palette |
| Chart anomaly / trend callout | Leo plot pill on chart |
| Conversation, long answer, follow-ups | Ask Leo sidebar (`⌘⌥K`) |

## Thread stack (compose, do not fork)

```
MessageScroller
  └ Message (align start | end)
       ├ MessageAvatar — user turns only
       └ MessageContent
            ├ Bubble variant="default" (user)
            ├ Bubble variant="ghost" (assistant, full width)
            └ Marker role="status" + shimmer (thinking)
```

**No avatar on Leo's turns.** There is one assistant in the thread and its turns
are already unmistakable — plain text, left-aligned, against the user's filled
right-aligned bubbles. The avatar column cost every answer 32px of width, which
in a 420px window is the difference between a table that fits and one that wraps.

Product wrapper: **`LeoThreadMessages`** — used by `AskLeoThreadBody` (panel + window) and `leo-landing-client.tsx`.

## View modes

Three shells, one switch (`AskLeoViewToggle`). Panel and window share the
conversation itself (**`AskLeoThreadBody`**); full screen lays its own canvas
out, because a route has a hero and a page-width transcript that a 400px rail
does not. What all three share is the **ambience** — **`LeoAmbientSurface`** —
so the frame around Leo is one implementation, not three.

| Mode | Shell | Chosen by | State |
|------|-------|-----------|-------|
| **Panel** (default) | `AskLeoSidebar` → `NestedSecondaryPanelShell`, width-resizable | preference | `shell:ask-leo-dock` |
| **Window** | `AskLeoWindow` — floating, movable, 2D-resizable, `rounded-2xl`, minimises to the FAB | preference | `shell:ask-leo-dock` + `shell:ask-leo-window-rect` |
| **Full screen** | `/<product>/leo` route (`leo-landing-client.tsx`) | URL | route |

**Window specifics** (`components/ask-leo-window.tsx`, `lib/ask-leo-view.ts`):

- Non-modal — no overlay, no focus trap, no scroll lock. `Esc` closes only when
  focus is inside it.
- Chrome is `FLOATING_SHEET_CHROME_CLASS` at **`z-40`** — with the sticky page
  chrome, **below the `z-50` Radix overlay layer**. Every portal (Tooltip,
  Popover, DropdownMenu, Select, Sheet) lands on `body` at `z-50`, so a window
  above that line covers its own menus and tooltips. The window is a surface,
  not an overlay; page content tops out at `z-30`. Same reasoning as
  `site-header.tsx`.
- Geometry is clamped inside a 0.5rem viewport inset on every render, so a rect
  saved on a larger monitor can never strand the window off-screen.
- **Keyboard parity:** the title-bar grip is a real button — click or Enter parks
  the window in the next corner, arrows nudge 16px (Shift 48px), Alt+arrows
  resize. Edge handles are pointer-only (`tabIndex={-1}`, `role="separator"`
  with aria values), matching the DS panel rail.
- Minimise keeps the window mounted but `hidden`, so the conversation survives;
  **close** ends it. The parked state lives on `LeoLauncherFab`.
- Below `md` (and at reflow zoom) window mode falls back to the panel.

## Thinking state

Two layers, both inside `LeoAmbientSurface`, both mounted **only while Leo is
composing** — permanent ambient motion behind text people are reading is noise,
not feedback. Idle pointer ambience is different: soft brand dots bloom only
**around the cursor** (`LeoCursorDots` → `DotPattern cursorSpotlight`) so the
field stays quiet until the user moves.

| Layer | Component | Notes |
|-------|-----------|-------|
| Status line | `Marker role="status"` + shimmer | The accessible announcement. Always present. Its icon is `LeoIcon state="working"`, not a spinner. |
| Cursor dots (idle) | `LeoCursorDots` | Soft radial reveal of the brand grid that follows the pointer. Same in all three shells. Skipped under reduced motion. |
| Backdrop (thinking) | `LeoThinkingBackdrop` | Brand blob glow + drifting dot cloud (`AiThinkingOverlay` → `DotPattern`). |

**No spinners in Leo's chrome.** A `fa-spin` circle says "a process is running";
the star's `working` gesture says *Leo* is the one working — and it is the same
motion the launcher FAB and the utility-bar toggle show while busy, so one shape
carries the state everywhere. `working` pulses the four sparkles on a 900ms beat
and turns the whole glyph 90° every 2.7s; the star is 4-fold symmetric, so the
quarter-turn lands on itself and the loop never snaps back.

**One wash geometry, every shell.** Three ~480px blobs overlap completely in a
400px rail and blur into a single flat wash, so the layer runs at 85% opacity
with one hue at three depths (`.leo-ai-blob-layer--panel`) and **fades its top
out with a mask**, reading as a glow rising from the composer. That geometry
holds on a 1440px canvas too. There was briefly a second `landing` variant for
the route; nothing ever selected it, and the route shipped with no wash at all
— which is exactly what a per-surface variant buys you.

Mask, not a clipped box. Anchoring the layer to the bottom third instead cut
through three circles that are taller than the box, and the wrapper's
`overflow-hidden` turned the softest part of the glow into a hard horizontal
line with saturated blob interior directly beneath it — the wash read upside
down. Keep the layer full height and fade it; never clip it.

**Reduced motion:** the whole backdrop is skipped when `useReducedMotion()` is
true (checked once, in `LeoAmbientSurface`, for all three shells) — the Marker already says "Leo is thinking…" without moving (WCAG 2.3.3).
The blob keyframes also self-disable in CSS, but the drifting dot cloud does not,
so gating at the mount is what actually covers it.

## Composer edge

No border between transcript and composer. A hairline cuts the conversation in
two, and in the window it drew a visible band where the rail's
`--secondary-panel-bg` met the window's white. Instead the transcript runs under
a veil: one absolutely positioned box that overlaps the last 40px of the
transcript, fading in both a `backdrop-blur-md` (via `mask-image`) and the
surface colour (via a background gradient), so neither has an edge to see.

One component, **`LeoComposerVeil`**, wherever a composer sits over moving
content. Each shell declares what it fades into with **`--leo-thread-surface`**:
the rail defaults to `--secondary-panel-bg`, `AskLeoWindow` and the full-screen
canvas both set `var(--background)`. The full-screen **empty hero** has no veil,
because a composer floating mid-canvas has nothing passing behind it. The transcript carries `pb-8` so
autoscroll does not park the newest turn under the blur.

## New chat

`AskLeoNewChatButton` (exported from `ask-leo-thread-body.tsx`) sits in both
shell headers and is **hidden until there is a thread to clear**. It dispatches
`dispatchLeoNewChat()` from `lib/leo-new-chat.ts`; whichever shell is mounted
listens with `useLeoNewChat()` and resets its own thread plus composer. Same
event the sidebar drill-in's New chat has always fired, and the same
`fa-pen-to-square` icon.

## Primitives

| Component | Use |
|-----------|-----|
| `Message` | Turn row — `align="end"` for user |
| `Bubble` / `BubbleContent` | Message body chrome |
| `Marker` / `MarkerContent` | Streaming / thinking status |
| `MessageScroller` | Stick-to-bottom transcript |

Registry + catalog: slug **`message`** (`component-docs/message.tsx`).

## Mounting

The app shell mounts **one** component — `AskLeoShell` (`components/ask-leo-shell.tsx`).
It reads `open` / `dock` / `minimized` from `AskLeoContext`, checks touch and
reflow zoom, and decides which of the three shells renders:

| Condition | Renders |
|---|---|
| `open` + `dock === "window"` + not touch / reflow | `AskLeoWindow` (lazy) |
| `open`, otherwise | `AskLeoSidebar` (lazy) |
| Products home, or window minimised | `LeoLauncherFab` |

Hosts must not re-implement that policy — mount `<AskLeoShell />` and nothing else.

## Shell entry points

| Trigger | Location |
|---------|----------|
| Utility bar chip | `UtilityBarSlot` → `AskLeoLauncher` (`@exxatdesignux/ui/components/shell/ask-leo-launcher`) |
| Corner FAB | `LeoLauncherFab` — products home, and a minimised window |
| Sidebar (classic only) | `AppSidebar` quick actions |
| KPI insight CTA | `KeyMetricsAskLeoBridge` |
| Chart header / plot | `ChartCard` + `ChartLeoPlotInsightOverlay` |

## MUST

1. Reuse **`LeoThreadMessages`** for transcript markup — no bespoke div stacks per surface.
2. User bubbles: `Bubble variant="default"`; assistant: `variant="ghost"`.
3. Thinking: `Marker role="status"` + `.shimmer` — not toast/snackbar.
4. Font Awesome only — no Lucide on Leo chrome.
5. New Leo chrome composes **`AskLeoThreadBody`** — a docked shell must not fork
   the empty state, the starter cards, or the composer.
6. Any Leo conversation surface wraps its content in **`LeoAmbientSurface`** and
   puts **`LeoComposerVeil`** under its composer. Ambience is never re-derived
   from prefs at the surface, or full screen goes dark again.
7. Starters render as stacked cards (one per row, full-width hit target), not
   centred wrapping chips.
8. Assistant turns render **without** `MessageAvatar` — full width.
9. The thinking backdrop mounts only while `isThinking` and only when
   `useReducedMotion()` is false.
10. The utility bar mounts **`AskLeoLauncher`** and passes `open`, `busy`,
    `onToggle`, and the chord. Everything the arrival animates is inside that
    component.

## MUST NOT

- Duplicate scroll-stick logic — `MessageScroller` owns it.
- Use toast for Leo status (`exxat-no-toast.mdc`).
- Rebuild the launcher chip from `Button` + `LeoIcon` + the wash. The arrival is
  a package stylesheet selecting `data-ask-leo-utility-*`; a hand-assembled chip
  keeps rendering while releases update the CSS around it, which is a release
  that changes nothing on screen.

## See also

- `docs/command-menu-pattern.md`
- `docs/shell-utility-bar-pattern.md`
- `.cursor/rules/exxat-kbd-shortcuts.mdc` (⌘⌥K)
- `task_router.ask_leo` in `apps/web/docs/INDEX.yaml`
