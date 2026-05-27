# Dev memory tuning for Vite + Node 24

> **Audience:** humans + AI agents.
> **Companion to:** [`HANDBOOK.md`](./HANDBOOK.md). Read this when `pnpm dev`
> RSS climbs past ~1.5 GB or when two designers are running dev servers on
> one machine.

A fresh `pnpm dev` against this app stabilizes around **~250–500 MB RSS**
with the settings below. Without them — or running multiple Vite
instances against the same monorepo — total system memory drifts to
1.5 GB+ per process and designers' laptops start to swap.

> **History:** before PR-6 (May 2026) `apps/web` ran on Next.js + Turbopack
> with a 1.4–4 GB baseline per dev server. Migrating to Vite + react-router
> dropped the steady-state RSS by **8×** and cold start from 8–12 s to
> 150–300 ms. The full migration story is in commits `49e9adf` (PR-1) →
> `d16ec77` (PR-6).

## 1. The four knobs that matter

| # | Knob | Why it matters | Where it lives |
|---|------|----------------|----------------|
| 1 | `dev-guard` predev hook | Blocks a second `pnpm dev` from booting against the same checkout. The #1 source of memory inflation in practice — two parallel Vite servers double total system RSS for zero throughput. | `package.json` `predev*` scripts → `exxat-ui dev-guard` (in `packages/ui/consumer-extras/scripts/dev-guard.mjs`) |
| 2 | `optimizeDeps.include` for hot deps | Pre-bundles `react`, `react-dom`, `react-router-dom` so the first request doesn't trigger a 600+ ms esbuild dep-scan. Drops first-paint TTFB by ~30%. | `vite.config.ts` |
| 3 | `optimizeDeps.exclude: ["@exxatdesignux/ui"]` | The shared UI package is a pnpm workspace package. Eager pre-bundling fights pnpm's strict node_modules layout (esbuild can't resolve `radix-ui`, `cmdk`, etc. when crawling the package's own `dist/`). Excluding it lets Vite resolve through the consumer's module resolver — which sees peer deps correctly. | `vite.config.ts` |
| 4 | `resolve.dedupe: ["react", "react-dom", "react-router-dom"]` | Prevents two React instances from being bundled when `apps/web` and `packages/ui` resolve different versions in pnpm. The classic "Invalid hook call" runtime error and a hidden 30+ MB heap duplicate. | `vite.config.ts` |

`NODE_OPTIONS` is **not** required under Vite — V8's default heap is fine
for a 250–500 MB process. The Next-era `--max-old-space-size=6144` was
fighting Turbopack's mmap'd FS cache; that whole class of problem is gone.

## 2. Don't run two Vite servers against the same checkout

A single `vite` process (Vite + the React plugin + Tailwind plugin)
stabilizes at ~280 MB RSS once the route tree is warm. Two parallel
servers stabilize at ~560 MB, three at ~840 MB — they don't share dep
caches across processes.

The `predev` hook (`exxat-ui dev-guard`) detects an already-running
`vite` instance under the same checkout and exits with a friendly
message instead of starting a second one. Unconditionally honour it —
do not bypass with `--no-predev` unless you've explicitly killed the
other server.

To check what's running:

```bash
ps aux | grep -E "vite/bin/vite" | grep -v grep
```

If you legitimately need two designer servers (e.g. comparing two
branches side-by-side), use the dedicated alternate ports:

```bash
pnpm dev          # http://localhost:3000
pnpm dev:3001     # http://localhost:3001
pnpm dev:3005     # http://localhost:3005
```

These all share the same `dev-guard` so a third can't sneak in.

## 3. Clearing the dep cache

Vite caches pre-bundled deps under `node_modules/.vite/`. The cache is
small (10–50 MB typical) but can grow stale after major dependency
changes:

```bash
pnpm clean:cache    # removes node_modules/.vite
pnpm dev:fresh      # clean + restart
```

Bust the cache when:

- A `pnpm install` changed `@exxatdesignux/ui` or any framework dep.
- HMR starts skipping updates.
- The browser console shows `[vite] (client) Re-optimizing dependencies` looping repeatedly.

For a full nuke (build artefacts too):

```bash
pnpm clean
```

## 4. Diagnose a memory regression

When dev RSS climbs past 1 GB and stays there:

```bash
# Check the boring stuff first
ps aux | grep -E "vite" | grep -v grep | wc -l    # > 1 = duplicate dev servers
du -sh node_modules/.vite                          # > 200 MB = bust the cache

# Then check the active dep graph
# Vite ships a built-in module-graph endpoint at /__inspect/ when
# `vite-plugin-inspect` is installed; not currently wired in apps/web,
# but a one-line `pnpm add -D vite-plugin-inspect` plus the plugin
# import gives instant visibility for one-off investigations.
```

Common culprits:

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Two or more `vite` processes in `ps` | Dual dev server across checkouts | Stop the duplicate (see §2) |
| `[vite] (client) Re-optimizing dependencies` looping every save | Dep cache invalidated on every change | `pnpm clean:cache && pnpm dev` |
| Initial paint + first navigation feel slow but steady-state is fine | `optimizeDeps.include` is missing a hot dep | Add it to the list (knob 2) |
| `Invalid hook call` runtime error | Two React copies in the bundle | Verify `dedupe` (knob 4) is set |
| Heap grows on every HMR cycle, never shrinks | Module-level `Map` / `Set` that never gets cleared | Move to request-scoped storage |
| tsserver alone is > 1.5 GB | TS strict + large lib check | `skipLibCheck: true` is already on; drop `allowJs` if not needed |

## 5. Node 24 features we leverage

Node 24 (LTS-track) is required by `engines.node` in `package.json` and
pinned in `.nvmrc`. Specifically:

- **V8 13.6 with Maglev JIT default-on** — faster startup, lower base
  heap. Steady-state RSS for the Vite parent is ~12% lower vs Node 22.
- **Improved incremental marking GC** — fewer long pauses during HMR;
  the perceived "stutter" when saving a large file is gone.
- **`node --run <script>`** — replaces `npm run` for one-off scripts
  with ~30 ms less per-invocation overhead. Use it in any CI step that
  runs a workspace script directly: `node --run typecheck`.
- **Smaller initial heap allocations** — V8 13.6 starts with ~50 MB
  less reserved arena vs V8 12.x. Most visible in fast CI test runs.

## 6. Anti-patterns

| Anti-pattern | Why it's wrong |
|--------------|----------------|
| Bypassing `dev-guard` with `npm run dev --ignore-scripts` | Defeats the only protection against parallel servers. The `predev` hook is the cheapest possible safety net. |
| Adding `nodemon` on top of `vite` | Vite has its own watcher; nodemon doubles the file-system event handlers. |
| Importing `@exxatdesignux/ui` from the package root for every icon | Bypasses tree-shaking. Always import from the leaf path the DS exposes (e.g. `@exxatdesignux/ui/components/button`). |
| Two checkouts of the same monorepo both running dev | Caches don't share — 2× total RSS. Pin to one checkout per machine. |
| Running `vite dev` with `--inspect` in normal dev | Allocates an extra inspector arena per process (~200 MB). Use only when actively debugging. |

## 7. Upgrading an existing customer app to the Vite stack

If your customer repo was scaffolded before `@exxatdesignux/ui@0.5.10`
on the legacy Next stack, the migration path is the one this repo took
in PR-1 → PR-6:

1. **PR-1**: add `dev-guard` predev hook + bump Node engines to 24.
2. **PR-2**: scaffold `template-vite/` alongside Next; designers move first.
3. **PR-3**: set up `vite.config.ts` with `next/*` aliases pointing at
   shims so existing component code keeps compiling.
4. **PR-4**: smoke `pnpm build:vite` and fix any cross-stack env vars
   (`process.env.NEXT_PUBLIC_*` ⇄ `import.meta.env.VITE_*`).
5. **PR-5**: flip `pnpm dev` from Next to Vite; demote Next variants to `:next` slot.
6. **PR-6**: codemod all `next/*` imports to `react-router-dom` direct,
   delete `app/`, `next.config.mjs`, `next-env.d.ts`, the shim directory,
   and remove `next` + `eslint-config-next` + `@next/bundle-analyzer`
   from `package.json`.

A reusable codemod for step 6 lives in commit `d16ec77` under
`apps/web/scripts/codemod-next-to-rr.mjs` (deleted in the same commit
to keep the tree clean — pull it from git history if you need it).

The full sequence took roughly an afternoon of focused work end-to-end
on the canonical app. For repos with significant Next-only surfaces
(RSC server actions, `next/image` heavy use, custom Next middleware),
expect to spend additional time on those specific subsystems — they
were not present in `apps/web`.

## See also

- [`HANDBOOK.md`](./HANDBOOK.md) — workspace orientation
- [`consumer-upgrade-checklist.md`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/packages/ui/consumer-extras/patterns/consumer-upgrade-checklist.md) — what to do after `pnpm add @exxatdesignux/ui@latest`
- [Vite — Performance](https://vite.dev/guide/performance.html)
- [Node.js — Diagnostics](https://nodejs.org/api/cli.html#--heap-profheap_dir)
- [V8 — Maglev](https://v8.dev/blog/maglev)
