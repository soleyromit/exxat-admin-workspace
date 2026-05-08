# LMS Toggle — First-Run

**Question answered:** How does a school admin make the load-bearing setup decision (LMS-on vs manual)?

**Pattern ID:** `ONBOARDING-001`
**Binds rules:** workspace ADR-002 (LMS-integration-first default)

---

## When to use

Once per school instance, on the very first admin login. This is the highest-leverage onboarding decision in the system — it determines the default behavior of every master-list screen across every module.

## The decision

The admin chooses one of:

1. **LMS integration enabled** (default — recommended) — Canvas / Blackboard / D2L sync owns courses, terms, course offerings, students, faculty.
2. **Manual entry** — admin imports / types data themselves.

This isn't a screen the admin returns to; it's a contract the admin signs.

## Anatomy

```
┌─ Welcome to Exxat ─────────────────────────────────────┐
│                                                         │
│   How does <School name> manage course rosters?        │
│                                                         │
│   ┌─────────────────────────────┐  ← preferred         │
│   │  ●  Connect to our LMS       │     (default)       │
│   │     (Canvas / Blackboard /   │                     │
│   │      D2L)                    │                     │
│   │                              │                     │
│   │     Recommended. Most schools│                     │
│   │     use this. Rosters,       │                     │
│   │     courses, and terms sync  │                     │
│   │     automatically.           │                     │
│   └─────────────────────────────┘                     │
│                                                         │
│   ┌─────────────────────────────┐                     │
│   │  ○  Manage rosters manually  │                     │
│   │                              │                     │
│   │     We'll show you how to    │                     │
│   │     import your data, or     │                     │
│   │     type it in.              │                     │
│   └─────────────────────────────┘                     │
│                                                         │
│   You can change this later in Settings.                │
│                                                         │
│                              [ Continue ]               │
└─────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Layout | Full-screen on first run (admin's first login); smaller modal if changed in Settings later |
| Default | LMS-on selected (per ADR-002) |
| Continue button | DS `Button variant="default"`, disabled until selection |
| Reassurance line | "You can change this later in Settings" — softens the decision |
| LMS-on follow-up | Continue → OAuth flow with the LMS provider (separate spec) |
| Manual follow-up | Continue → first master-list screen (Master Courses) with "Import CSV" CTA prominent |

## Down-stream behavior

Once LMS-on is selected, every master-list screen across every module:

- Disables manual add controls (Add Course / Add Term / Add Student / etc.)
- Shows a "Synced from LMS" indicator in the screen header
- Routes "Add new" attempts to a "This is managed by your LMS" tooltip

If LMS-off is selected, every master-list screen shows full CRUD as the current state.

## A11y notes

- Use DS `RadioGroup` for the two options (NOT a custom radio component)
- Each option is a `<label>` containing a `<RadioGroupItem>` so the entire card is clickable
- `aria-describedby` ties the explanation text to its radio
- "Continue" button is disabled until selection; disabled state is announced by screen reader

## Code recipe — Prism shell

This pattern lives in Prism (Angular) since it's the school-level setup. React module shells don't implement this; they read the LMS-on/off flag from a school-config endpoint:

```ts
type SchoolConfig = {
  lmsIntegrationEnabled: boolean
  lmsProvider: 'canvas' | 'blackboard' | 'd2l' | null
  syncedAt: string | null  // last successful sync
}
```

Each React module reads this and conditionally renders LMS-on vs manual UI per master-list screen.

## Anti-patterns

- ❌ Multi-step onboarding wizard — this is ONE decision; don't pad it
- ❌ Skip-able first-run — the decision must be made; defaulting to LMS-on without confirmation breaks the manual path for existing customers
- ❌ Sales copy about LMS benefits — be honest, "Recommended" is enough
- ❌ Forcing the choice mid-product use — the admin makes this in Settings, not a popup that interrupts the next sprint
- ❌ Per-module LMS toggle — the decision is school-wide (ADR-002)
