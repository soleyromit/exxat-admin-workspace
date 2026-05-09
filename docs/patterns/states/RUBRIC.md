# State Pattern Rubric

> Required reading before designing any data-bearing surface.
> Empty / loading / error / success / partial / locked are NOT optional — every screen has them.
> Binds DESIGN.md rules CONTENT-002 (no "no data"), CONTENT-003 (error explains), DS-005 (no toast).

---

## The six states

| State | Surface signal | When |
|---|---|---|
| **Loading** | Skeleton (preferred) > spinner | Data fetching; should be <300ms or skeleton must match final layout |
| **Empty** | Inline propose-action message | Query returned zero rows; user has done nothing yet |
| **Error** | Inline banner + retry | Fetch failed; partial data possible |
| **Success / populated** | The actual content | Default state |
| **Partial / degraded** | Banner + working content | Some data loaded, some failed (e.g., 4 of 5 charts rendered) |
| **Locked / gated** | Inline lock message + unlock condition | Permission, time, or workflow gate (e.g., grade-lock in Exam Mgmt, accommodation read-only for faculty) |

---

## Decision flow

```
What is the cause of the empty surface?
├─ Still fetching                   → loading (skeleton)
├─ Fetch failed                     → error (banner + retry)
├─ Some succeeded, some failed      → partial (banner + working content)
├─ Fetch succeeded, no rows         → empty (propose-action)
├─ Fetch succeeded, gated           → locked (lock message + unlock condition)
└─ User has not asked for anything  → empty (default state per persona)
```

---

## CONTENT rules (binds CONTENT-002, CONTENT-003)

| Rule | Right | Wrong |
|---|---|---|
| Empty proposes action | "Configure templates and bind to course types — `/templates →`" | "No data" |
| Error explains | "Couldn't save — your section names match an existing draft. Rename and try again." | "Error saving" |
| Locked explains the unlock | "Faculty results unlock 24 hours after grades are submitted. Coordinator can confirm grade post status." | "Locked" |

## Visual discipline

- **Skeleton** matches final layout shape and dimensions; no spinner over a blank rectangle.
- **Empty / error / locked** use DS `LocalBanner` or `SystemBanner`, NOT `Sheet`/`Dialog` interruptions for non-blocking states.
- **NO toast / Sonner for product feedback** — DS-005 violation. Use banners.
- **Locked surfaces** show the gate condition + who/what unlocks it. Never just "Locked".

## Anti-patterns

- ❌ Big spinner over the whole page when one card is loading
- ❌ "No data" / "Nothing here" / "Empty" — none of these propose action
- ❌ Toast notification for a loading-failed state — use inline banner
- ❌ Hiding the surface entirely while loading — user loses spatial context
- ❌ Generic "Try again" CTA without explaining what went wrong

## Pattern catalogue (this folder)

P3 (this round):
- `loading-empty-error-states.md` — the trio used 80% of the time

P4+ (later): `partial-degraded.md`, `locked-gated.md`, `success-confirmation.md`, `optimistic-update.md`
