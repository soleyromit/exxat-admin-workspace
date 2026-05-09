# Async Pattern Rubric

> Long-running operations, polling, real-time updates.
> Binds states/RUBRIC.md (loading / partial / error states), DS-005 (no toast).

---

## The four async shapes

| Shape | When | Pattern |
|---|---|---|
| **Foreground request/response** | <1s expected; user waits | Standard loading pattern — skeleton or spinner |
| **Polling for state change** | Periodic check for an updating remote state (live monitor, autopilot status) | (P3) `live-monitor-polling.md` |
| **Long-running job (foreground)** | User initiated; minutes to complete; user benefits from progress | (P4) `long-running-foreground.md` — progress + cancel |
| **Background job (fire-and-forget)** | User initiated; user doesn't need to wait; result delivered via notification or surfaced on next visit | (P4) `background-job-with-notification.md` |

---

## Polling discipline

For periodic state checks (live monitor, autopilot dashboard):

| Rule | Why |
|---|---|
| Default interval: **5s** for active surfaces | Balances freshness vs request volume |
| Pause polling when tab loses focus | Battery + server load |
| Stop polling on first error; require user retry | Avoid hammering a failing endpoint |
| Surface "last updated Xs ago" indicator | Trust — user knows the data isn't stale |
| Animate state changes (counts, progress) | Updates without animation feel like page reloads |

---

## Real-time updates

WebSockets / Server-Sent Events are NOT in scope for Phase 1. Polling is the default. If real-time becomes needed, surface as a separate ADR.

---

## Anti-patterns

- ❌ Polling without a visible "last updated" indicator — user can't tell if data is stale
- ❌ Polling a hidden tab — battery drain
- ❌ Toast notification for a successful polled update — DS-005, plus the visual count change is the signal
- ❌ Replacing the entire surface on each poll — flickers; update in place
- ❌ Infinite retry on poll failure — back off and require user action

## Pattern catalogue (this folder)

P3 (this round):
- `live-monitor-polling.md` — student-centric live monitor (D6 / Exam Mgmt ADR pending)

P4+ (later): `long-running-foreground.md`, `background-job-with-notification.md`, `optimistic-update.md`
