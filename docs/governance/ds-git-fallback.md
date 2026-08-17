# DS Git Fallback — when `@exxatdesignux/ui` npm install is blocked

> Use when `pnpm install` for `@exxatdesignux/ui` or `@exxatdesignux/product-framework` fails due to npm registry / org-scoped access being unavailable — not for routine DS work.
> **Tool:** `node tools/ds/git-fallback.mjs` · **Pairs with:** `node tools/ds/source.mjs`, `exxat-package-upgrade` skill

---

## What this is

Both packages are published from one repo — `github.com/ExxatDesign/Exxat-DS-Workspace`, directories `packages/ui` and `packages/product-framework`. When npm access to `@exxatdesignux/ui` is broken, `tools/ds/git-fallback.mjs` points pnpm at that repo directly over git instead of npmjs.org, scoped per consuming app so products that don't need the fallback keep resolving from npm untouched.

This is **not** the `exxat-ds/` git submodule already vendored in this workspace — that copy is legacy/stale (see [[feedback_ds_source_vendored_vs_package]] in project memory: it diverged from real DS defaults as of June 2026) and should never be used as a DS source.

## Status as of 2026-08-13

`@exxatdesignux/ui` is genuinely public on npmjs.org (`publishConfig.access: "public"`) — `npm view @exxatdesignux/ui` resolves anonymously with no auth configured anywhere in this workspace (`~/.npmrc`, root `.npmrc`, per-app `.npmrc` are all clean of `@exxatdesignux` scoping). There is no active blocker today. This doc exists for the day that changes (registry outage, org lockdown, network policy).

## How it works

Each product app's `package.json` pins `@exxatdesignux/ui` to an npm semver range (`^0.10.0`, `0.6.57`, etc). pnpm supports a workspace-root-level `pnpm.overrides` field that can force a different resolution for that package name — including a git URL — scoped to a specific consuming project via `"<app-name>>@exxatdesignux/ui": "<override>"`. The override value used here is:

```
git+https://github.com/ExxatDesign/Exxat-DS-Workspace.git#<ref>&path:/packages/ui
```

`<ref>` is a git tag/branch/commit. The repo tags releases as `ui-v<version>` (e.g. `ui-v0.10.0`) — when an exact tag matches the app's currently pinned version, the tool uses it, so the fallback is version-identical to what npm would have served. When no exact tag exists (not every npm release got tagged — several `0.6.x` releases didn't), it defaults to `main` and prints a warning: that pulls current DS source, not the exact pinned snapshot.

`packages/ui`'s own `package.json` depends on `@exxatdesignux/product-framework` via `workspace:` protocol, which cannot resolve outside the DS repo's own workspace. Fetching only the `ui` subdirectory over git breaks that internal reference, so `product-framework` needs the same git-fallback treatment. pnpm does not support scoping an override through a two-level dependency chain (`app>ui>product-framework` — confirmed by test, `ERR_PNPM_INVALID_SELECTOR`), so **`product-framework`'s override is global**, not scoped per app: enabling the fallback for any single product also switches `product-framework` resolution workspace-wide. In the realistic trigger scenario (registry/org access broken) this doesn't matter — every product needs the fallback simultaneously anyway. If you only enable it for one product, verify siblings still install cleanly afterward.

Both packages ship a `prepare`/`prepack` script (`tsup` build) that pnpm runs automatically after a git-hosted fetch, per pnpm's `onlyBuiltDependencies` allowlist (the tool adds `@exxatdesignux/ui` and `@exxatdesignux/product-framework` to `pnpm-workspace.yaml` automatically on first `enable`). No manual build step is required.

## Verified 2026-08-13

Live-tested end to end before writing this doc (not just read from pnpm docs):

- `pnpm add "github:ExxatDesign/Exxat-DS-Workspace#path:/packages/ui"` in an isolated scratch project → failed with `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` until `onlyBuiltDependencies` listed the package; then built successfully via `tsup` (dist/index.js, full type defs).
- Failed a second way until `@exxatdesignux/product-framework` was *also* overridden (`ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` — the internal `workspace:` dependency).
- With both overrides + `onlyBuiltDependencies` set: install succeeded, `dist/index.js` exports `Button`/`KeyMetrics` etc., version pinned exactly to the requested tag (`ui-v0.10.0` → resolved `0.10.0`, not the newer `0.10.2` HEAD).
- Confirmed per-app scoping (`"app-a>@exxatdesignux/ui"`) isolates the effect — a sibling app in the same workspace with no override kept resolving its normal npm version, untouched.
- Raw `node -e "import('@exxatdesignux/ui')"` throws a `Directory import '.../react-payment-inputs/images' is not supported` ESM error on **both** the git-built package and the currently-installed npm package — a pre-existing characteristic of consuming this package outside a bundler (Next.js/webpack/Vite resolve it fine), not a fallback-specific defect.
- `tools/ds/git-fallback.mjs enable apps/pce/admin` (real repo, dry-run) correctly auto-detected the `ui-v0.10.0` tag matching PCE's pinned `^0.10.0` and wrote valid `pnpm.overrides`; `disable` cleanly removed it.

What was **not** verified: an actual `pnpm install` + running dev server against a git-fallback-resolved DS inside one of this workspace's real apps (only the isolated scratch-project mechanism and the real repo's dry JSON-writing were exercised). Run that once, deliberately, before trusting this under real pressure — see Dry Run below.

## Usage

```bash
# see current state of every product that depends on the DS
node tools/ds/git-fallback.mjs status

# turn on the fallback for one app
node tools/ds/git-fallback.mjs enable apps/pce/admin
cd apps/pce/admin && pnpm install

# turn it on everywhere at once (the realistic disaster-recovery path)
node tools/ds/git-fallback.mjs enable --all
# then, per app:
cd apps/portal && pnpm install
cd apps/exam-management/admin && pnpm install
cd apps/exam-management/assessment-taker && pnpm install
cd apps/pce/admin && pnpm install
cd apps/patient-log/admin && pnpm install

# pin to a specific ref instead of auto-detected tag / main
node tools/ds/git-fallback.mjs enable apps/pce/admin --ref ui-v0.10.2

# revert to npm once access is restored
node tools/ds/git-fallback.mjs disable apps/pce/admin
node tools/ds/git-fallback.mjs disable --all
cd <app> && pnpm install   # per affected app, to re-lock to npm
```

The tool discovers apps by scanning `apps/**/package.json` for a `@exxatdesignux/ui` dependency — it doesn't need a hardcoded product list, so new products are picked up automatically.

## Dry run before you actually need it

Do this once, not under pressure, to build confidence the mechanism works end to end in a real app (not just the scratch project above):

1. `node tools/ds/git-fallback.mjs enable apps/pce/admin`
2. `cd apps/pce/admin && pnpm install` — first run rebuilds DS from source via `tsup`, expect it to take noticeably longer than a normal npm install.
3. `pnpm dev` and click through a few screens — confirm nothing is visually broken (git ref should match the app's current pin, so it should be indistinguishable from the npm-resolved version).
4. `node tools/ds/git-fallback.mjs disable apps/pce/admin && cd apps/pce/admin && pnpm install` to restore npm resolution.

## Requirements

- Git read access to `github.com/ExxatDesign/Exxat-DS-Workspace` (HTTPS or SSH, whatever this machine already uses for `git clone`/`git fetch` on that repo). This bypasses **npmjs.org** specifically — it does not help if GitHub itself is unreachable.
- Node ≥22 and the DS repo's build toolchain resolve automatically via the git-fetched package's own `devDependencies` (`tsup`, `typescript`, etc.) — no local `~/Exxat-DS-Workspace` clone is required, pnpm fetches its own copy.

## Reverting

Once npm access is restored, `disable` + `pnpm install` per app returns every product to its pinned npm semver range exactly as declared in that app's own `package.json` — the override is additive workspace-root config, not a change to any app's own dependency declaration.
