# Shell utility bar

**Code:** `components/utility-bar-slot.tsx`, `contexts/shell-layout-context.tsx`, wired in `src/App.tsx`. Catalog doc: `lib/design-system/component-docs/utility-bar.tsx`.

## Role

One persistent row for **global** actions — Search (⌘K), Notifications, Help, Onboarding, Ask Leo (⌘⌥K, labeled), Profile — so product surfaces do not duplicate triggers in the sidebar or page header.

**Workspace settings** live in the profile menu (same destination the old gear used). The bar does not mount a Settings icon.

## Compact is the only shell

This package ships **`compact` only**. Legacy persisted values (`sidebar-classic`, `utility-sidebar`, `utility-bar`, `sidebar`) normalize to `compact` via `normalizeShellLayoutVariant` and persist key `shell:layout-variant:v3`.

| Consumer situation | Behavior |
|--------------------|----------|
| Stays on an older `@exxatdesignux/ui` | Multi-layout shell still works; nothing changes until upgrade. |
| Bumps package, no shell port | App-owned shell files may still offer old pickers until ported. |
| Ports shell / runs `exxat-ui upgrade` for shell paths | Compact only; picker removed; prefs map to compact. |

Chrome shape:

```
toggle · product │ house · More · leaf │ search · bell · what's new · help · onboarding · Ask Leo │ school · profile
```

- **One chrome row** — breadcrumb portals onto the bar; `SiteHeader` draws no second row.
- **Bar height** — `--shell-utility-bar-height: 2.625rem` (42px); rail `top` and compact `--header-height` read the same token.
- **Back mode** — `siteHeader.back` or record-detail trails (derived parent crumb): same leading geometry as hubs (`back icon` · full-height rule · label); **Ask Leo** stays on the trailing edge (rightmost). Hide other actions, school, profile, and `trailing`.
- **Icon hit shape** — every bar icon (toggle, Back, Search, …) is `Button` ghost `icon-sm` + `utilityBarActionButtonClass` (`rounded-md` + sidebar-accent). Bare links without that class produce a sharp-square hover next to the rounded toggle — ban that.
- **Flush sidebar** — `variant="sidebar"`, square density tokens via `html[data-shell-density="compact"]`.
- **School avatar on the bar** — avatar only (`showProgram={false}`); program name stays in the tooltip and menu.

## Responsive framework (Comfort / Dense)

Driven by `useUtilityBarCompact()` = mobile (≤767px) **or** reflow zoom.

| Tier | When | Leading | Center | Actions | Identity |
|------|------|---------|--------|---------|----------|
| **Comfort** | ≥768px and not reflow | Toggle · product | Icon · More · leaf | Search, bell, What’s new, Help, Onboarding, **Ask Leo** (labeled) | School avatar + profile (`size-8`), no program name |
| **Dense** | ≤767px or reflow | Toggle · product **mark only** (equal `px-1.5` around product; crumb rule after product) | Parent · leaf **text labels** (`flex-1` truncates; never a house icon) | Bell, **More** (Search / What’s new / Help / Onboarding), **Ask Leo** icon-only | School avatar + profile (`size-8`), no program name |

**Spacing:** `gap-1` between clusters; product sits in equal `px-1.5` between the rail rule and the crumb rule (rule is drawn in the leading cluster); identity rule `mx-1`; Dense trailing `pe-2`.

**Trailing edge:** actions + identity always sit in one `ms-auto` cluster. Do **not** cap breadcrumb `max-width` to “save room for actions” — that leaves a hole after profile at reflow / 200% zoom.

**Yield order:** identity never collapses → Ask Leo / Notifications stay before Search/Help → breadcrumb truncates → product wordmark truncates (or mark-only on Dense).

## Onboarding

Comfort: icon-only control → `/builder/onboarding`. Dense: same link under **More**. Suppressed on that route (bar not mounted).

## Ask Leo

**Comfort:** icon + label. **Dense:** icon-only. Last primary action before the identity separator. Glow intro remains decorative.

## How the breadcrumb gets onto the bar

`components/compact-header-slot.tsx` holds a portal target. `UtilityBarBreadcrumbSlot` registers a slot; `SiteHeader` portals into it when present.

Header trails use **text labels** for every segment (never a generic house icon — the first crumb is often Library / Dashboard, not Home). Long trails collapse middle segments into More; Comfort and Dense truncate.

## Tabs on compact pages

`TabsList` overflow region is `w-full` so the fit ladder measures against real surplus width. Inactive labels collapse only when the row actually overflows; labels return when the viewport can hold the last expanded width again (probe-once-per-width — do not compare to pre-collapse `scrollWidth`).

### Sticky stack

```
Utility bar (outside scroll)
        ↓
[data-slot="tabs-sticky-subheader"]     ← module Tabs
  or [data-slot="list-views-sticky-subheader"]  ← hub views
        ↓
DataTable floating column header        ← getStickyTableHeaderOffset()
```

Height of layer 2 = `--shell-utility-bar-height`. Full-width `border-b` on the sticky strip.

## See also

- `lib/shell-layout.ts` — helpers + persist key
- `components/utility-bar-page-chrome.tsx` — Back mode bridge
- `components/utility-user-menu.tsx` — Profile settings + Workspace settings
- `apps/web/docs/tabs-pattern.md` — sticky subheaders + overflow ladder
- `apps/web/docs/record-detail-chrome-pattern.md` — Back mode + peer jump
- `apps/web/docs/INDEX.yaml`
