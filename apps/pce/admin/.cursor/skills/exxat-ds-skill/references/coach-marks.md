# Coach Marks — Implementation Guide

> **Use coach marks for onboarding flows and feature discovery.** Every tour is defined once, targets elements by CSS selector, and is managed centrally from the Settings page.

---

## Architecture

| Component | Location | Purpose |
|-----------|----------|---------|
| `CoachMark` | `@/components/ui/coach-mark` | Selector-targeted popover with spotlight overlay, brand-colored background |
| `useCoachMark` | `@/hooks/use-coach-mark` | Flow state manager — step navigation, localStorage persistence, element targeting |
| `CoachMarkStep` | `@/hooks/use-coach-mark` (type) | Step definition — target selector, side, align, title, description, optional image |
| Coach mark registry | `@/lib/coach-mark-registry` | Central definition of all flows for the Settings page |
| Settings page | `@/components/settings-client` + `app/(app)/settings/page.tsx` | UI to view, reset, and preview all coach mark flows |

---

## How It Works

1. **Selector-based targeting** — each step has a `target` CSS selector (e.g. `[aria-label='Properties']`). The coach mark finds the element, scrolls it into view, and positions a popover next to it.
2. **Spotlight overlay** — a semi-transparent backdrop with an SVG mask cutout highlights the target element with a ring.
3. **Brand background** — the popover uses `bg-brand-deep text-white` for high visibility. Buttons are white/inverted.
4. **localStorage persistence** — once completed or skipped, a flow is marked as dismissed and won't show again unless reset from Settings.
5. **Per-step positioning** — each step can specify its own `side` and `align` for optimal placement relative to the target.

---

## Adding a New Coach Mark Flow

### Step 1 — Define the steps

```tsx
import type { CoachMarkStep } from "@/hooks/use-coach-mark"

const MY_TOUR_STEPS: CoachMarkStep[] = [
  {
    id: "step-1",
    target: "[aria-label='My Widget']",   // CSS selector for the target element
    side: "bottom",                        // popover side: top | bottom | left | right
    align: "start",                        // popover alignment: start | center | end
    title: "Meet My Widget",
    description: "This widget helps you do X. Click to explore.",
  },
  {
    id: "step-2",
    target: "button[aria-label='Settings']",
    side: "left",
    align: "center",
    title: "Customise Settings",
    description: "Open settings to configure Y and Z.",
    image: "https://example.com/screenshot.jpg",   // optional hero image
    imageAlt: "Settings panel screenshot",          // required when image is provided
  },
]
```

### Step 2 — Wire the hook and component

```tsx
import { CoachMark } from "@/components/ui/coach-mark"
import { useCoachMark } from "@/hooks/use-coach-mark"

function MyPageClient() {
  const tour = useCoachMark({
    flowId: "my-feature-tour",    // unique ID — used as localStorage key
    steps: MY_TOUR_STEPS,
    delay: 1200,                  // ms before first appearance
  })

  return (
    <>
      <CoachMark state={tour} />
      {/* rest of your page */}
    </>
  )
}
```

**Key points:**
- `CoachMark` renders via portal — place it anywhere, it does NOT wrap children
- The component handles element lookup, scrolling, spotlight overlay, and positioning
- On flow completion, `localStorage` marks the flow as dismissed

### Step 3 — Register in the coach mark registry

Add your flow to `lib/coach-mark-registry.ts`:

```ts
{
  id: "my-feature-tour",
  name: "My Feature Tour",
  description: "Introduces the main controls and settings for My Feature.",
  page: "My Feature",
  pageUrl: "/my-feature",
  stepCount: 2,
}
```

This makes it appear in the Settings page where users can reset or preview it.

---

## Variants

| Variant | How to use |
|---------|-----------|
| **Single step** | Pass a 1-item array to `steps` — no step indicator shown, button says "Got it" |
| **Multi-step flow** | Pass 2+ items — shows step dots, Skip, Back, Next buttons |
| **With image** | Set `image` + `imageAlt` on the step — hero image appears above the content |
| **Without image** | Omit `image` — text-only popover |

---

## Target Selector Best Practices

Use stable, semantic selectors that survive refactors:

| Prefer | Avoid |
|--------|-------|
| `[aria-label='Properties']` | `.css-class-name` |
| `[role='toolbar'][aria-label='Views']` | `div:nth-child(3)` |
| `button[aria-label='Search']` | `#auto-generated-id` |
| `h1` | `.page-header > div > h1` |

If no stable selector exists, add a `data-coach-mark="step-name"` attribute to the target element.

---

## Existing Flows

| Flow ID | Page | Steps | What it covers |
|---------|------|-------|---------------|
| `dashboard-tour` | Dashboard | 4 | Welcome, Key Metrics, AI Insights, Ask Leo |
| `placements-views-tour` | Placements | 6 | View tabs, view settings, add view, search, filter, Properties |

---

## Settings Page

The Settings page at `/settings` (`components/settings-client.tsx`) provides:

- **List of all registered flows** from `lib/coach-mark-registry.ts`
- **Status** — Completed vs Active per flow
- **Reset** — clears localStorage so the tour replays on next visit
- **Preview** — resets the flow and navigates to its page
- **Reset all** — clears all coach mark dismissals

---

## Utilities (exported from `use-coach-mark`)

| Function | Purpose |
|----------|---------|
| `getAllCoachMarkKeys()` | List all dismissed coach mark flow IDs |
| `resetCoachMarkFlow(flowId)` | Clear dismissal for one flow |
| `resetAllCoachMarks()` | Clear all dismissals |

---

## Rules

1. **Always register new flows** in `lib/coach-mark-registry.ts` so they appear in Settings
2. **Use CSS selectors based on ARIA attributes** — they're stable and semantic
3. **Brand background is mandatory** — coach marks use `bg-brand-deep text-white`, not `bg-popover`
4. **No wrapping children** — `CoachMark` targets elements by selector, never wraps them
5. **Keep flows short** — 3–6 steps per flow is ideal; split longer tours into separate flows
6. **Add `data-coach-mark` attributes** if no stable selector exists on the target element
7. **Set appropriate `delay`** — 800–1200ms gives the page time to render before the first step appears
