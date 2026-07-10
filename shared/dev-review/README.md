# shared/dev-review — the live review HUD (canonical source)

`DevReviewHUD.tsx` is the **canonical, framework-agnostic** live-review overlay
(WCAG + DS detection, drag, fix-progress, talks to the review-bridge). It works
in Vite (react-router) and Next.js (App Router) — it has **no router dependency**
(uses the History API), is **SSR-safe** (mounted guard → no hydration mismatch),
and is **local-only** (renders only on a localhost origin).

## Why each app keeps a *copy* (not a shared import)

There is no pnpm workspace linking these apps, and `shared/` sits at the repo
root. Importing the file across packages makes **`tsc` / `next build` resolve
`react` + `axe-core` from the wrong `node_modules`** (the home dir / root), which
breaks type-checking even though dev-runtime transpiling works. So each app holds
an **in-project copy** synced from this canonical. Edit here, then re-copy.

```bash
# sync the canonical into an app after editing it here
cp shared/dev-review/DevReviewHUD.tsx apps/<product>/<app>/<dev-dir>/DevReviewHUD.tsx
```

## Add the HUD to an app (3 steps)

1. **Dependency:** `pnpm add -D axe-core` in that app.
2. **Copy** this file into the app (e.g. `src/dev/` for Vite, `app/` for Next).
3. **Mount it once, dev + local only:**

   **Vite (react-router)** — in the root layout, gated so it's tree-shaken from builds:
   ```tsx
   {import.meta.env.DEV && <DevReviewHUD product="apps/<product>/<app>" />}
   ```

   **Next.js (App Router)** — from a `'use client'` component rendered in `app/layout.tsx`
   behind `{process.env.NODE_ENV === 'development' && ...}` (e.g. the existing `DevInit`):
   ```tsx
   'use client'
   import { DevReviewHUD } from './dev-review-hud'
   export function DevInit() {
     return <DevReviewHUD product="apps/<product>/<app>" />
   }
   ```

The `isLocalHost()` guard inside the component is the universal safety net — it
never renders on a deployed (Vercel) origin even if a dev server is exposed.

## Rollout status

| App | Framework | HUD |
|---|---|---|
| exam-management/assessment-taker | Vite | ✅ done |
| exam-management/admin | Next.js | ✅ done (verified: mounts, detects, bridge, 0 hydration errors) |
| pce/admin | Next.js | ⬜ copy + mount (same 3 steps) |
| pce/student | Next.js | ⬜ |
| patient-log/admin | Next.js | ⬜ |

The review-bridge (`tools/review-bridge`) and audit-server (`tools/visual-check`)
are already monorepo-wide — one of each serves every app.
