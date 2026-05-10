---
type: decision
date: 2026-05-10
status: Accepted
source: adversarial-review-2026-05-10
session: blind-spots-fix
related: [DS-019]
---

# Workspace ADR-007 — Brand assignment per admin app

## Status

Accepted (Romit, 2026-05-10)

## Context

Each admin app declares a brand class on `<html>` in `app/layout.tsx`:
- `theme-one` → Exxat One Lavender (hue 286.1) — workspace default per CLAUDE.md
- `theme-prism` → Exxat Prism Rose (hue 342) — alternate

As of 2026-05-10:
- `apps/exam-management/admin` uses `theme-prism`
- `apps/pce/admin` uses `theme-one`

This split is **unintentional drift, not designed variation**.

History:
- PCE was originally scaffolded with `theme-prism`.
- April 2026: spec at `apps/pce/docs/superpowers/specs/2026-04-24-pce-admin-ui-consistency.md` proposed *"PCE should use theme-one — same as exam-management. One change in app/layout.tsx."*
- The premise was wrong. Exam-mgmt was on `theme-prism` then and remains on `theme-prism` now.
- The migration was applied anyway. Nothing in the harness verified the cross-product claim.
- Result: PCE on lavender, exam-mgmt on rose, no documented rationale for the split.

The drift surfaced 2026-05-10 when Romit asked *"why lavender, when prism is pink?"* — implying he expected PCE on prism (pink), matching the original scaffold and matching exam-mgmt.

## Decision

**All currently-active admin apps use `theme-prism`.** PCE switches FROM `theme-one` BACK TO `theme-prism` (reversing the April 2026 unilateral change).

Going forward:
- New admin apps inherit workspace default `theme-one` initially.
- Switching to `theme-prism` requires a per-product ADR amendment to this file.
- A cross-product claim in any spec (*"same as product X"*) MUST be verified against the cited product's `app/layout.tsx` before action.

## Brand-by-product table

| Product | Brand class | Status | Rationale |
|---|---|---|---|
| `exam-management` | `theme-prism` | Production | Original scaffold; unchanged |
| `pce` | `theme-prism` | Production (2026-05-10) | Reverts April 2026 false-premise switch; restores original scaffold; matches exam-mgmt for workspace coherence |
| `patient-log` | `theme-one` (planned) | Scoped, not scaffolded | Inherits workspace default; revisit at scaffold |
| `skills-checklist` | `theme-one` (planned) | Scoped | Same |
| `learning-contracts` | `theme-one` (planned) | Scoped | Same |
| `faas` | `theme-one` (planned) | Planned | Same |

## Consequences

- PCE rebrands from lavender to rose. All `--brand-*` token resolutions shift hue (286.1 → 342). Pages that hardcoded lavender colors would break — but per CLAUDE.md absolute rules no hex/rgb literals exist; everything routes through tokens. So the rebrand is safe at the code level.
- Per-product variance becomes a gated decision (ADR amendment), not an undocumented `app/layout.tsx` edit.
- New rule **DS-019** enforces this — `architecture-audit.py` checks every admin app's brand class is declared in this ADR's brand-by-product table.

## What this DOESN'T decide

- Whether the workspace default should change from `theme-one` to `theme-prism`. Left as `theme-one` for new products until product-team direction.
- Per-product dark-mode policy. Separate decision.
- Student app brand alignment. Separate decision (student apps use a different DS).

## How to amend

1. Edit the brand-by-product table above.
2. If switching an active product, also update its `app/layout.tsx` `<html className="...">`.
3. Run `python3 scripts/brand-presence-audit.py --product <name>` and `python3 scripts/architecture-audit.py` to confirm.
4. Commit with reference to this ADR.

## Source verification (per DS-019)

This ADR was written after directly reading both apps' `app/layout.tsx` files at HEAD. Quotes:

```tsx
// apps/exam-management/admin/app/layout.tsx
<html lang="en" className="theme-prism" suppressHydrationWarning>

// apps/pce/admin/app/layout.tsx (BEFORE this ADR)
<html lang="en" className="theme-one">
```

After this ADR ships, PCE's class becomes `theme-prism`.
