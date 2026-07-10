# DS bug report — `exxat-ui upgrade` ports the shell without its `components/ui/` dependencies

> **For:** Himanshu (DS / `@exxatdesignux/ui` maintainer)
> **From:** Romit's workspace, 2026-06-22
> **Severity:** High — breaks `next build` for consumer apps on `@exxatdesignux/ui@0.6.49`
> **Filed:** https://github.com/ExxatDesign/Exxat-DS-Workspace/issues/79
> **Affected consumer apps:** `apps/exam-management/admin`, `apps/portal`, `apps/patient-log/admin` (Next.js 15.5, app-router). `apps/pce/admin` is NOT affected (still on 0.6.48; see why below).

## Summary

`npx exxat-ui upgrade` (run from each app's `postinstall`) regenerates the app shell — including `components/site-header.tsx` and the library-authoring chrome (`components/library-*`, `components/sidebar/secondary-panel.tsx`) — but it does **not** port the `components/ui/*` primitive library those files import. The 0.6.49 `generated-starter/` payload **does** contain a full 53-file `components/ui/` (sheet, kbd, button, tooltip, separator, sidebar, …), so the dependency exists in the package; the upgrade's port manifest just doesn't emit it into consumer apps. Result: the generated `site-header.tsx` has dangling imports and `next build` fails with webpack `Module not found`.

## Reproduction

1. Consumer Next app on `@exxatdesignux/ui@0.6.49`, app-router, that imports `@/components/site-header` from `app/`.
2. `pnpm install` → `postinstall` runs `exxat-ui upgrade --quiet`.
3. `next build`.

### Observed errors

```
./components/site-header.tsx
Module not found: Can't resolve '@/components/ui/sidebar'
Module not found: Can't resolve '@/components/ui/kbd'
Module not found: Can't resolve '@/components/ui/tooltip'
Module not found: Can't resolve '@/components/ui/sheet'   (via library-new-folder-sheet)
```

`components/site-header.tsx` (as emitted by the upgrade) imports:
```ts
import { Separator }           from "@/components/ui/separator"
import { SidebarTrigger }      from "@/components/ui/sidebar"
import { Kbd, KbdGroup }       from "@/components/ui/kbd"
import { useModKeyLabel }      from "@/hooks/use-mod-key-label"
import { cn }                  from "@/lib/utils"
// + transitive: components/sidebar/secondary-panel → library-secondary-nav → library-new-folder-sheet → @/components/ui/sheet
```
None of `@/components/ui/{separator,sidebar,kbd,sheet,tooltip}` are present in the app (these apps have ~4 files in `components/ui/`, not the 53 the shell needs).

## Why PCE is unaffected

- PCE is on **0.6.48**, whose sync manifest emits a *lighter* `site-header` that does not reach the library-authoring `components/ui/*` chain.
- PCE's `components/site-header.tsx` is **not in the upgrade's port manifest** (its `.exxat-ui/backups/` never contains site-header), so the upgrade leaves PCE's custom, package-importing site-header alone.

## Second, smaller issue (0.6.49-only): `src/pages/_not-found.tsx` conflict

0.6.49's manifest also emits `src/pages/_not-found.tsx`, which collides with Next 15.5's `global-not-found` builtin:
```
⨯ Conflicting app and page file was found: "pages/_not-found.tsx" - .../next/dist/.../global-not-found.js
```
0.6.48 did not emit `_not-found`, so PCE avoids it. The upgrade regenerates `_not-found` on every run even when the app already has `app/not-found.tsx`.

## Third issue — HIGHEST severity: upgrade strips `'use client'` from context shims (breaks PCE, the live app)

The generated-starter ships `contexts/product-context.tsx` and `contexts/product-route-sync.tsx` **without** a `'use client'` directive:

```ts
// generated-starter/contexts/product-context.tsx  — NO 'use client'
/** Shim — re-exports ProductProvider + useProduct from `@exxatdesignux/ui`. */
export { ProductProvider, useProduct, type Product } from "@exxatdesignux/ui/components/shell"
```

`ProductProvider` calls `createContext`. `apps/pce/admin/app/(app)/layout.tsx` (a server component) imports it via `@/contexts/product-context`. With no `'use client'` on the shim, Next throws at runtime:

```
createContext only works in Client Components. Add the "use client" directive…
  at app/(app)/layout.tsx:4  → import { ProductProvider } from "@/contexts/product-context"
```

PCE had manually added `'use client'` to its committed shim. **`exxat-ui upgrade` overwrote that committed file and stripped the directive**, breaking the running app. This fires on every install for PCE (which IS deployed), so it's the highest-severity instance of "upgrade overwrites a consumer's working file with a broken generated one."

**Fix:** add `'use client'` to the top of the generated `contexts/product-context.tsx` and `contexts/product-route-sync.tsx` shims in the payload (any shim that re-exports a component using `createContext`/hooks).

## Suggested fixes (DS side)

0. **(highest)** Add `'use client'` to the generated context/provider shims (`contexts/product-context.tsx`, `contexts/product-route-sync.tsx`) — see "Third issue".

1. **Primary:** when the upgrade ports any shell file that imports `@/components/ui/*`, also port the `components/ui/*` files it transitively requires (or the whole `components/ui/` set). The dependency closure should travel with the shell.
2. Make the upgrade **skip `src/pages/_not-found.tsx`** when the consumer is an app-router app / already has `app/not-found.tsx`, to avoid the Next 15.5 conflict.

## Workspace-side status (no action needed from DS)

- All four lagging apps bumped to `@exxatdesignux/ui@0.6.49` in `package.json` (currency).
- EM admin carries the partial not-found mitigation (`app/not-found.tsx`, `next.config` `ignoreBuildErrors`/`ignoreDuringBuilds`, postinstall `rm -f src/pages/_not-found.tsx`).
- Decision (Romit, 2026-06-22): do NOT do per-app `components/ui/` ports; fix belongs in the DS upgrade tool. These three apps are not currently deployed.
- Full diagnosis: memory `project_next_apps_generated_shell_build`.
