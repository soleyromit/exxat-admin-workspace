---
description: Exxat DS — a product's program is licensed, never defaulted. Load when touching scope, useActiveScope, scope switchers, or a product route gate.
activation: glob
globs: apps/web/hooks/use-active-scope.ts,lib/scope-switcher.ts,lib/mock/scope-entitlement.ts,components/scope-*.tsx,components/product-switch-dialog.tsx,components/product-switcher*.tsx,components/utility-bar-school-switcher.tsx,components/sidebar/app-sidebar.tsx,apps/web/src/routes.tsx
---

<!-- Synced from .agents/rules/exxat-product-scope.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — product scope is licensed, not defaulted

Products are licensed **per program** (`lib/mock/scope-entitlement.ts`), so the
program someone is in can be one the product they are opening does not serve.

**Authoritative:** [`docs/exxat-ds/handoff/product-scope.md`](mdc:docs/exxat-ds/handoff/product-scope.md)
(case matrix S1 to S27) · [`hooks/use-active-scope.ts`](mdc:hooks/use-active-scope.ts)

## The rule

**The program never changes without an explicit press.**

## Where the question gets asked

Two surfaces, and which one depends on how the person arrived:

| Arrival | Surface | Why |
|---|---|---|
| Switcher press | `ProductSwitchDialog` | The press is in the shell, so the question belongs there. When the program cannot carry, ask with a blocking `ScopeSwitcherPanel` (utility-bar school selector, inline) before navigating. When it carries, Opening names the scope for a held beat (`MIN_OPENING_MS`). Outside click does not dismiss; Esc / close leaves you where you were |
| Typed or pasted URL, notification, bookmark | `ScopeChooser` under `RequireProductScope` | There is no press to hang a dialog on, and it renders in place at the URL asked for, so a reload keeps it |

## MUST

1. **Read `status`, not just `parent` / `child`.** `useActiveScope` returns
   `"open" | "choose" | "none"`, and `parent` / `child` are `null` in the last
   two. A surface that renders records must not render on anything but `"open"`.
2. **Take the selectable set from `config.parents` / `config.childrenOf`.** Both
   are already licence-filtered. Never read `NAV_SCHOOLS` or `NAV_SITES` directly
   for anything a user can pick.
3. **Ask even when there is one option.** One licensed program that differs from
   the one on record is still a change (S3).
3a. **Ask when the program you left cannot carry**, even if the destination still
   remembers a different licensed program (S5b / S11). Restoring that memory would
   move them without a press. Use a blocking `ScopeSwitcherPanel` in the switcher
   dialog (same school selector as the utility bar — school header + Change +
   program glyphs, inline). Do not nest a dropdown under the overlay.
3b. **Do not auto-pick on `"choose"`.** Never flash Opening / loading while
   silently selecting a fallback program. Auto Opening is only for `"open"`
   (carry). Home cards keep recent program display.
4. **Write a licence restriction in `scope-entitlement.ts`**, not on the nav data
   and not as a second product list somewhere.
5. **New product-owned routes go under the existing `RequireProductScope`
   subtree.** A route mounted outside it renders a program nobody chose.
6. **A new switcher-like surface calls `useRequestProductSwitch`**, not
   `useProductSwitch`. Same signature; it is the one that asks first. `useProductSwitch`
   is for entries that have already resolved a scope, such as a products home card
   whose picker made the choice on the card.

## MUST NOT

1. **Do NOT fall back to `config.defaultParent` / `defaultChild` to resolve an
   active scope.** They name the workspace for display, and can name a school the
   product is not licensed for. `useActiveScope` is the only caller that may use
   them, and only for a session that has never chosen anything.
2. **Do NOT compare a config by identity** (`config === SCHOOL_PROGRAM_SCOPE`).
   Licensed products get a derived object. Read `config.family`.
3. **Do NOT show a student a chooser.** `isScopeFixed` sessions have one scope, so
   an unlicensed program is `"none"`, never a list of other people's programs.
4. **Do NOT redirect to a chooser route.** It renders in place at the URL the
   person asked for, so a reload keeps it. A switcher press does not navigate at
   all until the question is answered.
5. **Do NOT render a disabled or empty scope trigger** when nothing is licensed.
   Remove it, and let the page say why.
6. **Do NOT write `scope-last:<family>` on arrival.** Only a press writes it;
   that is what makes it safe for the next product to inherit from.

## Docs

- [`docs/exxat-ds/handoff/product-scope.md`](mdc:docs/exxat-ds/handoff/product-scope.md)
- [`.agents/rules/exxat-persisted-state.md`](mdc:.agents/rules/exxat-persisted-state.md)
- [`.agents/rules/exxat-product-routing.md`](mdc:.agents/rules/exxat-product-routing.md)
