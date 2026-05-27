# Upgrading `@exxatdesignux/ui` (human + AI checklist)

Use this after **`npm install @exxatdesignux/ui@…`** / **`pnpm add @exxatdesignux/ui@…`**. It is copied into **`docs/exxat-ds/`** when you run **`exxat-ui sync-extras`**, so Cursor and other tools can find it beside other DS pattern docs.

## 1. See what changed

| Source | Purpose |
|--------|---------|
| **`npx --package=@exxatdesignux/ui@latest exxat-ui changelog`** | Release notes for the installed version (and peers). |
| **`node_modules/@exxatdesignux/ui/RELEASES.md`** | Same notes when bundled (tarballs ≤ 0.5.21 used **`CHANGELOG.md`**). |
| **Agent skill `exxat-package-upgrade`** | Full install/upgrade workflow — review changes, port shell files from `template-vite`, **do not** edit content or mock data. Load via `/skill exxat-package-upgrade` or ask the agent to upgrade the package. |

## 2. Refresh AI / pattern docs (optional but recommended)

```bash
npx --package=@exxatdesignux/ui@latest exxat-ui sync-extras
```

Overwrites only **`.cursor/skills/exxat-*`** and **`docs/exxat-ds/*.md`** (including this file). Does **not** change your app routes or product code.

## 3. Align app code with the reference template

The npm package includes a full Next.js reference under:

**`node_modules/@exxatdesignux/ui/template-vite/`**

Use it when you need to know **what files exist**, **how shims re-export** `@exxatdesignux/ui`, or **what AGENTS / layout** patterns look like for the current release. Porting is manual: diff template vs your repo and apply intentional changes (imports, new components, CSS entrypoints).

## 4. Dependency and Node

- Keep **`@exxatdesignux/ui`** on the same semver your team tested; prefer explicit **`^x.y.z`** or pinned **`x.y.z`**.
- Match **`engines.node`** in your app to the value declared in **`node_modules/@exxatdesignux/ui/package.json`** (see CHANGELOG if it changed).
- **≥ 0.5.3:** Remove **`vaul`** from your app `package.json` and delete any `components/ui/drawer.tsx` shim — side panels use **`Sheet`** only (**`.cursor/rules/exxat-no-vaul.mdc`**).
- **≥ 0.5.9:** Bump to **Node 24** (LTS-track) and apply the dev-memory tuning. The template ships these by default; existing apps need a one-time copy. *(0.5.10 adds the Turbopack cap below; apply both together.)*

  | What | Where | Effect |
  |------|-------|--------|
  | `engines.node: ">=24.0.0"` + `.nvmrc: 24` | `package.json`, `.nvmrc` | Pins to V8 13.6 + Maglev JIT default-on |
  | `NODE_OPTIONS="--max-old-space-size=6144 --max-semi-space-size=64"` prefix on every `dev*` script | `package.json` `scripts` | Caps V8 old-space; forces GC pressure earlier |
  | `NEXT_TELEMETRY_DISABLED=1` prefix | same | Skips telemetry's per-process arena (~50 MB) |
  | `experimental.preloadEntriesOnStart: false` | `next.config.mjs` | Compiles routes on first visit; ~30% lower steady-state heap |
  | `experimental.webpackMemoryOptimizations: true` | `next.config.mjs` | Lower webpack-fallback heap (Turbopack ignores) |
  | Expanded `experimental.optimizePackageImports` (`@tabler/icons-react`, `motion`, `@dnd-kit/*`) | `next.config.mjs` | Tree-shakes barrel re-exports |
  | `target: "ES2022"` + `assumeChangesOnlyAffectDirectDependencies: true` | `tsconfig.json` | Smaller tsserver AST, faster rebuilds |
  | `env: { NODE_OPTIONS, NEXT_TELEMETRY_DISABLED }` + `max_memory_restart: "7G"` | `ecosystem.config.cjs` (if using pm2) | Daemon recycles before macOS swaps |
  | New `pnpm dev:profile` script | `package.json` | `--heap-prof` + `--cpu-prof` snapshots dropped into `.next/diagnostics/` |

- **≥ 0.5.10:** Cap Turbopack and add cache-bust scripts. The dev FS cache is enabled by default in Next 16.1 — without these knobs it grows to 2–3 GB on disk and mmaps the same back into RSS:

  | What | Where | Effect |
  |------|-------|--------|
  | `turbopack: { memoryLimit: 4 * 1024 * 1024 * 1024 }` | `next.config.mjs` (top-level, **not** under `experimental`) | Hard 4 GiB cap on the Turbopack worker — prevents the unbounded cache → RSS growth |
  | New `pnpm clean` (`rm -rf .next`) and `pnpm clean:cache` (`rm -rf .next/dev/cache .next/dev/trace .next/diagnostics`) | `package.json` `scripts` | One-command cache bust when `.next` > 2 GB |
  | New `pnpm dev:fresh` (`pnpm clean:cache && pnpm dev`) | `package.json` `scripts` | Bust + restart in one shot |

  **Run `pnpm clean && pnpm dev` once after the upgrade.** Pre-0.5.10 cache files were written without the memory cap and may carry stale mmap layouts.

  Full rationale + diagnostics in **`docs/exxat-ds/perf-memory-pattern.md`** (after `sync-extras`) or **[`apps/web/docs/perf-memory-pattern.md`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/perf-memory-pattern.md)** — especially §3 (Turbopack FS cache) and §4 (don't run two dev servers).

- **≥ 0.5.22:** `@exxatdesignux/ui` no longer ships **`shadcn`** as a **runtime** dependency (CLI-only; lives in the DS monorepo's `devDependencies`). If your app still lists **`shadcn`** under **`dependencies`**, move it to **`devDependencies`** — it is only needed when adding components from the registry, not at runtime.

### Expected `pnpm install` warnings (usually safe to ignore)

These come from **your app's dev toolchain** (Vite, Vitest, ESLint, optional `shadcn` CLI) — **not** from `@exxatdesignux/ui`'s published runtime graph after **0.5.22**.

| Message | Cause | Action |
|---------|-------|--------|
| **`WARN … deprecated subdependencies found: node-domexception@1.0.0`** | Transitive of **`shadcn` CLI** → `node-fetch` → `fetch-blob`. Harmless; upstream hasn't removed it yet. | Move **`shadcn`** to **`devDependencies`** (see above). Warning may persist until `shadcn` updates — **does not affect production bundles**. |
| **`WARN … deprecated subdependencies found: whatwg-encoding@3.1.1`** | Transitive of **`jsdom`** (Vitest / Testing Library). Dev-only. | No action required unless you drop **`jsdom`**. |
| **`Ignored build scripts: esbuild … msw … sharp … unrs-resolver`** | **pnpm 10+** blocks lifecycle scripts until you allowlist them (supply-chain hardening). | Add to **`package.json`** → **`pnpm.onlyBuiltDependencies`** (single-package app) or root **`pnpm-workspace.yaml`**, matching the template: `esbuild`, `msw`, `sharp`, `unrs-resolver`. Or run **`pnpm approve-builds`** once interactively. |

Example for a **single-package** consumer app (`package.json`):

```json
{
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild", "msw", "sharp", "unrs-resolver"]
  }
}
```

After adding the allowlist, re-run **`pnpm install`** — the yellow **Ignored build scripts** box should disappear. **`deprecated subdependencies`** may still show once; that is informational, not a failed install.

## 5. Consumer UI audit (after sync-extras)

If the app was built before current agent rules, verify:

| Symptom | Fix |
|---------|-----|
| Full-width tab bar on list hub | Use **`ListPageTemplate`** view toolbar — **`exxat-tabs-chrome.mdc`** |
| Full-width Overview / Academics tabs | **`TabsList`** must stay **`w-fit`** — no `w-full` / `flex-1` stretch |
| Grey custom header buttons | **`PageHeader`** + **`Button`** variants — **`exxat-page-header-actions.mdc`** |
| Bespoke student popover in table | **`HoverCard`** + shared cells/badges — **`exxat-table-row-preview.mdc`** |
| Custom hub table / trimmed Add view | **`HubTable`** + **`FULL_HUB_SUPPORTED_VIEWS`** — **`exxat-hub-supported-views.mdc`** |
| Agent copied uploaded screenshots pixel-for-pixel | Run **`exxat-ui sync-extras`** — ensures **`exxat-no-image-pixel-copy.mdc`** + **`exxat-senior-ux`** skill. Images = **IA only** (nav labels, fields, routes); map to DS reference hubs; **never** "match the screenshot" or invoke **`frontend-design`** to mimic pixels. Re-open the chat after sync so Cursor reloads rules. |

## 6. Still stuck?

- **`npx --package=@exxatdesignux/ui@latest exxat-ui doctor`** — compares local CLI version vs npm **`latest`**.
- **`npx --package=@exxatdesignux/ui@latest exxat-ui update`** — install commands and reminders.

Maintainers publish from the design-system monorepo with git tags **`ui-v<version>`**; registry **`latest`** follows those tags.
