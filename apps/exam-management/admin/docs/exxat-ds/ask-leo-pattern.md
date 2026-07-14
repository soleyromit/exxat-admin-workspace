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
       ├ MessageAvatar (user Avatar | AvatarLeoAssistant)
       └ MessageContent
            ├ Bubble variant="default" (user)
            ├ Bubble variant="ghost" (assistant)
            └ Marker role="status" + shimmer (thinking)
```

Product wrapper: **`LeoThreadMessages`** — used by `AskLeoSidebar` and `leo-landing-client.tsx`.

## Primitives

| Component | Use |
|-----------|-----|
| `Message` | Turn row — `align="end"` for user |
| `Bubble` / `BubbleContent` | Message body chrome |
| `Marker` / `MarkerContent` | Streaming / thinking status |
| `MessageScroller` | Stick-to-bottom transcript |

Registry + catalog: slug **`message`** (`component-docs/message.tsx`).

## Shell entry points

| Trigger | Location |
|---------|----------|
| Utility bar icon | `UtilityBarSlot` → `AskLeoToggle` |
| Sidebar (classic only) | `AppSidebar` quick actions |
| KPI insight CTA | `KeyMetricsAskLeoBridge` |
| Chart header / plot | `ChartCard` + `ChartLeoPlotInsightOverlay` |

## MUST

1. Reuse **`LeoThreadMessages`** for transcript markup — no bespoke div stacks per surface.
2. User bubbles: `Bubble variant="default"`; assistant: `variant="ghost"`.
3. Thinking: `Marker role="status"` + `.shimmer` — not toast/snackbar.
4. Font Awesome only — no Lucide on Leo chrome.

## MUST NOT

- Duplicate scroll-stick logic — `MessageScroller` owns it.
- Use toast for Leo status (`exxat-no-toast.mdc`).

## See also

- `docs/command-menu-pattern.md`
- `docs/shell-utility-bar-pattern.md`
- `.cursor/rules/exxat-kbd-shortcuts.mdc` (⌘⌥K)
- `task_router.ask_leo` in `apps/web/docs/INDEX.yaml`
