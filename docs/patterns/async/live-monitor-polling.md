# Live Monitor — Polling

**Question answered:** How do we surface in-progress assessment state to faculty/admin without a real-time push channel?

**Pattern ID:** `ASYNC-001`
**Binds rules:** D6 (Aarti audit — student-centric counts), states/RUBRIC.md, DS-005

---

## When to use

Live monitoring of an assessment that's currently being taken (Exam Management). The assessment is "ongoing" (per Aarti — replaces "live" status). Faculty/admin needs to see student progress in near-real-time without leaving the surface.

## The shape (from Aarti audit D6)

```
┌─ PHARM 101 — Midterm  (ongoing)  ──────────────────────┐
│   Time elapsed: 47:12   ·  Closes 11:45 AM             │
│                                                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Not started│  │ In progress│  │  Submitted │        │
│  │            │  │            │  │            │        │
│  │     2      │  │     34     │  │     9      │        │
│  │            │  │            │  │            │        │
│  │  of 45     │  │  of 45     │  │  of 45     │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                         │
│  ⏵ Flagged questions (3 pending review)                │
│                                                         │
│  ─────────  Last updated 4s ago  ●                     │
│                                                         │
│  Tabs:  [ Live monitor ]   Question analysis           │
│                            (post-close)                 │
└─────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Three count cards | Not started / In progress / Submitted — large numerals, "of N" subtext |
| Time elapsed + close time | Always visible in header; updates every second |
| Flagged questions section | Collapsed by default; expands inline. Statuses: addressed / dismissed / acknowledged. NO real-time student↔faculty messaging during exam |
| Last-updated indicator | "Xs ago" + a pulsing dot when polling is active; turns gray + "Paused" when tab loses focus |
| Tab structure | Live monitor (active) + Question analysis (disabled until exam closes — see CONTENT rule below) |

## Polling discipline

| Rule | Spec |
|---|---|
| Interval | 5s |
| Pause | When tab loses focus (`document.visibilitychange`) |
| Resume | On tab focus, immediate poll then 5s interval |
| Error | Stop polling on first error; show "Couldn't refresh" inline; require user "Retry" |
| Animation | Number transitions use a subtle count-up over ~400ms — not a snap |
| `aria-live` | Container is `aria-live="polite"` so screen readers hear count changes |

## Locked state — Question analysis tab

While exam is ongoing, the "Question analysis" tab is visible but locked:

```
Question analysis  (unlocks when exam closes)
```

DON'T hide it; show + disable. CONTENT-003 applies — explain why it's locked.

## Code recipe — admin profile (React)

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { Card, Tabs, TabsList, TabsTrigger, TabsContent, Button } from '@exxat/ds/packages/ui/src'

type LiveStatus = {
  notStarted: number
  inProgress: number
  submitted: number
  total: number
  elapsedSec: number
  closesAt: string
  flaggedPending: number
}

export function LiveMonitor({ assessmentId }: { assessmentId: string }) {
  const [status, setStatus] = useState<LiveStatus | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<number | null>(null)

  async function poll() {
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/live-status`)
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      setStatus(await res.json())
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError(e as Error)
      setIsPolling(false)  // stop polling on error
    }
  }

  useEffect(() => {
    if (!isPolling) return
    poll()
    intervalRef.current = window.setInterval(poll, 5000)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [isPolling, assessmentId])

  useEffect(() => {
    function onVisibility() {
      if (document.hidden) {
        setIsPolling(false)
      } else {
        setIsPolling(true)  // resume on focus
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // … render: 3 count cards + flagged section + last-updated indicator
}
```

(Truncated to keep this pattern file focused. Full reference impl lives wherever the live-monitor component is built; this code is illustrative of the polling discipline only.)

## A11y notes

- Counts wrapped in `aria-live="polite"` so screen readers announce changes (but NOT every poll — the polite level batches)
- Last-updated indicator has `role="status"` and `aria-label="Live status, last updated 4 seconds ago"`
- Pulsing dot is `aria-hidden="true"` (decorative)
- "Paused" state announces once via `aria-live`
- Question analysis (locked) tab uses `aria-disabled="true"` and explains the unlock condition in `aria-describedby`

## Anti-patterns

- ❌ Polling without "last updated" indicator — user can't tell if data is stale (or if their connection died)
- ❌ Polling a hidden tab — battery drain
- ❌ Toast on count change ("3 students submitted!") — DS-005 violation; the count change IS the signal
- ❌ Replacing entire surface on each poll — flicker; update in place
- ❌ Question-level live monitor (Aarti D6: "While the exam is on, like, who cares?") — student-level only during ongoing
- ❌ Real-time messaging affordance during the exam — not in scope; flag has 3 statuses (addressed / dismissed / acknowledged) and faculty acts on them post-flag, not chats
- ❌ Infinite retry on poll failure — back off; require user retry
