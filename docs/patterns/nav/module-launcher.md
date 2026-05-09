# Module Launcher

**Question answered:** Which Exxat module is the user in, and how do they switch?

**Pattern ID:** `NAV-001`
**Binds rules:** workspace ADR-003 (module sellability + Prism launcher), D34 (Aarti audit)

---

## When to use

This is the Prism shell's main landing page. Replaces the current Prism dashboard (which combines students + faculty + courses across modules — assumes the customer bought the full suite).

After ADR-003, each customer sees only the modules they purchased; each opens in a new tab.

## Anatomy

```
┌─ Prism shell ───────────────────────────────────────────┐
│  [Logo]  School name              [User] [Settings]    │
│  ──────────────────────────────────────────────────    │
│                                                         │
│   Welcome back, Romit                                   │
│   Here are your modules.                                │
│                                                         │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│   │ 🎓           │  │ 📋           │  │ 📊           │ │
│   │ Exam         │  │ Patient Log  │  │ PCE          │ │
│   │ Management   │  │              │  │              │ │
│   │              │  │              │  │              │ │
│   │ 12 active    │  │ 3 reviews    │  │ 2 surveys    │ │
│   │ assessments  │  │ pending      │  │ open         │ │
│   │              │  │              │  │              │ │
│   │ [Open ↗]     │  │ [Open ↗]     │  │ [Open ↗]     │ │
│   └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│   ┌──────────────┐                                      │
│   │ ✓            │                                      │
│   │ Skills       │   (Modules not purchased            │
│   │ Checklist    │    appear faded with                │
│   │              │    "Request demo" CTA)              │
│   │ Not active   │                                      │
│   │              │                                      │
│   │ [Request ↗]  │                                      │
│   └──────────────┘                                      │
└─────────────────────────────────────────────────────────┘
```

## Per-module-tile spec

| Element | Spec |
|---|---|
| Tile size | ~240px × ~200px (admin) — fits 4 across at 1024px+, 2 across at tablet, 1 at mobile |
| Icon | Per-module recognizable mark; never use the same shape across modules |
| Title | Module name, 18px semibold |
| Status line | One pulled metric ("12 active assessments") — comes from the module's API. Pluralize correctly. Empty modules show "No activity" not "0" |
| Primary CTA | "Open ↗" — opens in new tab via `target="_blank" rel="noopener noreferrer"` |
| Not-purchased state | Tile faded (~50% opacity); CTA = "Request demo ↗" → marketing site |

## URL contract

Each module exposes a stable landing URL:

| Module | URL |
|---|---|
| Exam Management | `/exam-management` |
| PCE / CFE | `/pce` |
| Patient Log | `/patient-log` |
| Skills Checklist | `/skills-checklist` |
| Learning Contracts | `/learning-contracts` |

The launcher links to these via `<a href={url} target="_blank">`. URLs work without coming from the launcher (module sellability — ADR-003).

## A11y notes

- Each tile is a `<a>` (not a `<button>`) — semantic for navigation
- `aria-label` on the tile combines title + status ("Open Exam Management — 12 active assessments")
- Disabled / not-purchased tiles use `aria-disabled="true"` + `tabindex="-1"`; CTA goes to a separate "request demo" link with its own aria-label
- Keyboard: tab traverses tiles in document order; arrow keys NOT bound (no grid-nav semantics)

## Code recipe — Prism shell (Angular host)

The launcher itself lives in Prism (Angular). React module landing pages don't need to implement this. But the contract from React to launcher:

```tsx
// Each React module exposes /api/launcher-status returning:
type LauncherStatus = {
  module: 'exam-management' | 'pce' | 'patient-log' | 'skills-checklist' | 'learning-contracts'
  isActive: boolean
  pulledMetric: { count: number; label: string } | null
  // Examples:
  // { count: 12, label: 'active assessments' }
  // { count: 0, label: null } → renders "No activity"
}
```

Prism polls each module's launcher-status endpoint at launcher load. Polling cadence: on visit, not background.

## Anti-patterns

- ❌ Modules opening in same tab (defeats ADR-003 — Angular Prism + React modules can't share state cleanly)
- ❌ Tiles for modules the customer didn't purchase, without "request demo" CTA — wasted screen real estate
- ❌ Inline rich previews (charts, recent items) on the launcher — that belongs to the module's own landing
- ❌ Custom nav within tiles — the tile is one click; the landing inside the module is where deeper nav happens
- ❌ Animations on tile hover beyond DS default — distracts from the decision
