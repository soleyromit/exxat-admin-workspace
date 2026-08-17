---
name: exxat-package-upgrade
description: >
  Install or upgrade @exxatdesignux/ui in consumer apps — read release notes,
  sync Cursor extras, diff generated-starter for shell/UI fixes, port only chrome
  and composition files. Never change product content, mock data, API wiring,
  or tenant copy. Use when the user asks to install, update, upgrade, bump,
  or sync the Exxat DS package, exxat-ui CLI, generated-starter, or fix a bug after
  a package release (e.g. custom product theme, store migration).
---

# Exxat DS — install & upgrade (`@exxatdesignux/ui`)

**Binding rule (read first):** `.cursor/rules/exxat-consumer-package-upgrade.mdc`
(Claude: `.claude/rules/…` · Antigravity: `.agents/rules/exxat-consumer-package-upgrade.md`).

**Default when the user says "update / bump the package":** install only
(`pnpm add` / `npm install`). Do **not** run `exxat-ui upgrade` unless they
explicitly asked to sync shell chrome. Preview with `exxat-ui upgrade --check`.

Use this skill for **consumer repos** (Assessment_V1, customer scaffolds) — not
the DS monorepo (`apps/web` uses `workspace:*`).

**Goal:** Ship the new package version + any required **shell/UI port** from
`generated-starter`. **Do not** rewrite product content, data, or business logic.

---

## Non‑negotiable boundary

| **In scope (chrome / composition)** | **Out of scope (content / data)** |
|-------------------------------------|-----------------------------------|
| `stores/app-store.ts` migrations & product chrome state | Mock arrays (`lib/mock/*` domain rows) |
| `contexts/product-*.tsx`, theme sync | API clients, fetchers, server actions |
| `lib/product-brand.ts`, `product-routing.ts`, `product-ref.ts`, `brand-accent-color.ts` | Entity types, DTOs, validation rules |
| Settings appearance / product switcher / sidebar **structure** | Tenant labels, help copy, accreditation text |
| Re-exports from `@exxatdesignux/ui`, CSS entry (`globals.css` `@import`) | Hub column defs tied to product domain |
| `package.json` deps, engines, dev scripts per release notes | `persistKey` values for product hubs (keep names) |
| `.cursor/skills` + `docs/exxat-ds/*` via `sync-extras` | User filters, saved views, row data in localStorage |
| Import path / shim fixes after template diff | Feature routes unless release notes say otherwise |

**Rule:** If a file defines **what the product shows** (students, placements,
questions, sites), treat it as **read-only** during upgrade unless the release
note explicitly requires a mechanical import/API rename.

---

## Phase 0 — Detect context

```bash
# Monorepo contributor?
grep '"@exxatdesignux/ui".*workspace' package.json 2>/dev/null && echo MONOREPO

# Consumer app?
grep '@exxatdesignux/ui' package.json
```

- **Monorepo:** `pnpm install` at root; edit `packages/ui` + `apps/web`; **publish via `pnpm release`** (NOT `pnpm changeset publish` directly — see Phase 7).
- **Consumer:** follow phases 1–6 below.

---

## Zero-warning install command (consumer side)

Use this **exact** invocation for the cleanest output. It suppresses npm's noisy update notice and silences cosmetic env-config warnings without hiding real errors:

```bash
NPM_CONFIG_LOGLEVEL=warn NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false \
  npm install @exxatdesignux/ui@latest --save --prefer-online

# pnpm
NPM_CONFIG_LOGLEVEL=warn pnpm add @exxatdesignux/ui@latest
```

If the user's terminal still shows `npm warn Unknown env config "auto-install-peers"` (or `_jsr-registry`, `verify-deps-before-run`, `npm-globalconfig`), those come from **`NPM_CONFIG_*` env vars exported by their shell** — usually leaked by an old pnpm session or a previous `nvm`/`volta` install. To clear them in a single session:

```bash
unset $(env | grep -oE '^NPM_CONFIG_[A-Z_]+' | grep -E '_(REGISTRY|AUTO_INSTALL_PEERS|VERIFY_DEPS_BEFORE_RUN|NPM_GLOBALCONFIG)$')
```

The expected output of a clean install is exactly two lines:

```
added 150 packages in 4s
(no warnings, no notices)
```

---

## Phase 1 — See what changed (before editing anything)

Run and **summarize for the user** before any file edits:

```bash
npx --package=@exxatdesignux/ui@latest exxat-ui doctor
npx --package=@exxatdesignux/ui@latest exxat-ui changelog
# Or open node_modules/@exxatdesignux/ui/RELEASE_NOTES.md (≥ 0.8.8)
```

Also open:

- Release notes via `exxat-ui changelog` (bundled `RELEASE_NOTES.md`, latest 5 versions)
- `docs/exxat-ds/latest-release.md` after `sync-extras` (same content in the app tree)
- `docs/exxat-ds/consumer-upgrade-checklist.md` (after sync-extras)
- Full history only if needed: GitHub `packages/ui/RELEASES.md`

**Output a short upgrade brief:**

```
From: <current> → To: <target>
Release highlights: (3 bullets max)
Shell files likely affected: (from port-map below)
Content/data files: none (unless release note says otherwise)
```

**Wait for user confirmation** before porting if the release touches routing,
store version, or product chrome.

---

## Phase 1b — Choose the migration mode

Run a read-only architecture plan when the customer app predates the managed
architecture marker or the release changes routes, flows, shell architecture,
or persisted state:

```bash
TARGET_VERSION=x.y.z
npx --yes --package="@exxatdesignux/ui@$TARGET_VERSION" \
  exxat-ui migrate plan
```

### Managed upgrade

If mode is `managed-upgrade`, write the plan and apply it from a clean Git root:

```bash
npx --yes --package="@exxatdesignux/ui@$TARGET_VERSION" \
  exxat-ui migrate plan \
  --output .exxat-ui/plans/package-upgrade.json
npx --yes --package="@exxatdesignux/ui@$TARGET_VERSION" \
  exxat-ui migrate apply \
  --plan .exxat-ui/plans/package-upgrade.json
```

### Legacy bootstrap

If mode is `legacy-bootstrap`, do not force the shell upgrader. Build and review
the legacy contract first:

```bash
npx --yes --package="@exxatdesignux/ui@$TARGET_VERSION" \
  exxat-ui migrate legacy inspect
# Human review:
# .exxat-ui/migrations/legacy-inventory.json
# .exxat-ui/migrations/legacy-review.json
npx --yes --package="@exxatdesignux/ui@$TARGET_VERSION" \
  exxat-ui migrate legacy verify
git add .exxat-ui/migrations .exxat-ui/ejected.json
git commit -m "review legacy migration contract"
npx --yes --package="@exxatdesignux/ui@$TARGET_VERSION" \
  exxat-ui migrate plan \
  --output .exxat-ui/plans/legacy-bootstrap.json
npx --yes --package="@exxatdesignux/ui@$TARGET_VERSION" \
  exxat-ui migrate apply \
  --plan .exxat-ui/plans/legacy-bootstrap.json
```

Every finding needs a reason. Every discovered route needs a reviewed flow.
Every skipped implementation path must be resolved or explicitly acknowledged
with a reason in `coverageAcknowledgements`.
Automatic bootstrap accepts preservation-only reviews. If an item needs an
alias, redirect, replacement, facade, copy, transform, migration, removal, or
retirement, stop and add an app-owned adapter plus a contract test. Never label
changed behavior as preserved to make the plan apply.

To test an unpublished tarball in a customer-app clone, bind its exact bytes:

```bash
UI_TARBALL=file:/absolute/path/to/exxatdesignux-ui-x.y.z.tgz
npx --yes --package="$UI_TARBALL" exxat-ui migrate plan \
  --package-spec file:/absolute/path/to/exxatdesignux-ui-x.y.z.tgz \
  --framework-package-spec file:/absolute/path/to/exxatdesignux-product-framework-x.y.z.tgz \
  --output .exxat-ui/plans/local-tarball.json
npx --yes --package="$UI_TARBALL" exxat-ui migrate apply \
  --plan .exxat-ui/plans/local-tarball.json
```

The plan stores both tarball checksums. Apply refuses a replaced or repacked
artifact and verifies both installed versions. The staged install disables
package lifecycle scripts, validates in a detached worktree, and promotes one
patch only after every gate passes. Plan and apply must both run through the
destination tarball's CLI.

---

## Phase 2 — Install or bump the package

```bash
# pnpm (preferred)
pnpm add @exxatdesignux/ui@<target>

# npm
npm install @exxatdesignux/ui@<target> --save --prefer-online

# yarn
yarn add @exxatdesignux/ui@<target>
```

Fresh scaffold:

```bash
npx --package=@exxatdesignux/ui@latest create-exxat-app my-app
# or
npx --package=@exxatdesignux/ui@latest exxat-ui init ./my-app
```

Verify:

```bash
node -p "require('./node_modules/@exxatdesignux/ui/package.json').version"
npx --package=@exxatdesignux/ui@latest exxat-ui doctor
```

Default next step is a read-only ownership and port check:

```bash
npx --package=@exxatdesignux/ui@latest exxat-ui upgrade --check
```

Read the exit code: **10** means portable framework work exists, **11** means
only declared app-owned files differ, **1** means ownership is unresolved or
the ledger is malformed, and **0** means nothing is pending.

`.exxat-ui/ejected.json` is the committed ownership ledger. On the first
declarative run, a trustworthy old baseline can distinguish edits from stale
package copies. Without one, exit 1 is intentional: review every path before
choosing `--declare-existing-owned` to preserve it or `--force` to take the
package copy with a backup. Both flags apply to the whole run, so do not use
either wholesale on a mixed list.

Only run `upgrade` after the check is understood. It ports package-owned
framework wiring and creates missing import-closed shims. Tenant catalogs, data
modules, mock/API wiring, custom pages, and declared paths are preserved.

---

## Phase 3 — Refresh agent context and re-check framework wiring

```bash
npx --package=@exxatdesignux/ui@latest exxat-ui sync-extras
```

This refreshes `.cursor/`, `.claude/`, `.agents/`, and `docs/exxat-ds/`.
It can also auto-run the content-safe framework upgrade when `upgrade --check`
returns 10. It never ports reference hubs, product pages, mocks, or API modules,
but it can update undeclared framework wiring under `src/`, `components/`,
`contexts/`, `lib/`, and `stores/`.

If ownership is unresolved, stop. Do not trust a quiet install from an older
postinstall that ended `upgrade` with `|| true`; run `upgrade --check` directly.

Re-open the agent chat after sync so rules reload.

---

## Phase 4 — Diff template vs app (shell port)

Reference tree:

`node_modules/@exxatdesignux/ui/generated-starter/`

Fast path:

```bash
npx --package=@exxatdesignux/ui@latest exxat-ui upgrade
```

If `upgrade` reports manual merges, compare **your app** against the generated
starter for those files in [port-map.md](./port-map.md). Use `diff -ru` or the
IDE diff — **do not** blind-copy the whole generated starter.

### Port decision tree

1. **Release note names the file** → port that file (mechanical merge).
2. **Bug in product chrome** (theme, switcher, settings color, routing gate) →
   port the matching file from port-map **§ Product chrome**.
3. **New DS primitive** (component in package) → update imports only; no fork.
4. **Hub looks wrong** → check rules via `exxat-ui audit <file>`; fix
   composition, not mock data.
5. **Unrelated to release** → skip.

### Merge rules when porting

- Keep **your** route paths, nav labels, and mock **content**.
- Take **template** store migrations, theme sync, and product routing logic.
- Preserve **your** `persistKey` strings and hub-specific column definitions.
- After store version bump, tell users: **one hard refresh** clears stale
  localStorage (migrations run automatically).

---

## Phase 5 — Validate (required)

```bash
pnpm install          # or npm install
pnpm typecheck        # or npm run typecheck
pnpm lint             # if present
pnpm dev              # smoke: product switch, settings color, one hub
```

Checklist:

- [ ] Product switcher + sidebar tint match active product
- [ ] Settings → Products color picker updates **active** product chrome
- [ ] No edits to mock entity arrays or API modules in the diff
- [ ] `sync-extras` ran; no accidental changes under `docs/` product copy
- [ ] Custom product (`exxat-custom`): color from `customProducts[]`, not stale
      `productBrandColors["exxat-custom"]`

---

## Phase 6 — Report to user

Use this handoff block:

```markdown
## @exxatdesignux/ui upgrade — <old> → <new>

### Release notes applied
- …

### Files ported (shell only)
- `stores/app-store.ts` — …
- …

### Explicitly not changed (content / data)
- `lib/mock/…`
- …

### User action
- Hard refresh once (store migration vN)
- Re-test: …
```

---

## Common release-triggered ports

| Symptom after upgrade | Port from generated starter |
|-----------------------|-------------------------|
| Custom product color stuck / pink sidebar | `lib/product-brand.ts`, `stores/app-store.ts`, `contexts/product-context.tsx`, `components/settings-appearance-card.tsx` |
| `/custom/*` vs suffix slug (`/assessment/*`) | `exxat-ui upgrade` should auto-port `lib/product-routing.ts`, route sync/gates, and `src/routes.tsx`; if still stale, verify package version and rerun upgrade |
| Multi-custom products collide on hide | `stores/app-store.ts`, `lib/product-ref.ts`, settings + switcher |
| Add product UI overlap | `components/settings-appearance-card.tsx`, `components/brand-color-picker.tsx` |

Full file list: [port-map.md](./port-map.md).

---

## CLI quick reference

| Command | Purpose |
|---------|---------|
| `exxat-ui doctor` | Installed vs npm `latest` |
| `exxat-ui changelog` | Bundled upgrade notes (`RELEASE_NOTES.md`) |
| `exxat-ui update` | Install commands + reminders |
| `exxat-ui sync-extras` | Cursor skills + `docs/exxat-ds/` |
| `exxat-ui audit <file>` | Prompt for UX/a11y audit skill |
| `exxat-ui dev-guard` | Predev hook — one Vite server |

---

---

## Phase 7 — Publish (maintainers, monorepo only)

Run from `apps/web` root or repo root. **Use the wrappers — never `pnpm changeset publish` or `npm publish` directly.** The wrappers strip pnpm-injected `NPM_CONFIG_*` env vars before they reach the npm child process, eliminating the `npm warn Unknown env config "<key>"` noise that pnpm/npm interop produces by default.

### MUST — sync builder + consumer simulation before upload (agents)

**Do not publish after a version bump only.**

Two surfaces must match before npm:

1. **Builder dogfood** — `apps/web` (`pnpm dev`, port 4000). Edit shell here.
2. **Generated starter payload** — `packages/ui/generated-starter/`. Updated only via sync; not a second app.

```bash
# After any apps/web shell change:
pnpm builder:contract
pnpm sync-ui-template
pnpm sync-ui-template:check

# Full pre-publish proof:
pnpm release:gates
# or: pnpm --filter @exxatdesignux/ui smoke-test:publish
```

Gates run **sync (apply) + check**, then publish smoke: tarballs in **`../123_Testing/tarballs/`** (canonical `/Users/himanshusuthar/Exxat Projects/Design System/123_Testing`), scaffolds in **`123_Testing/apps/`**, `exxat-ui upgrade`, dev boot.

Agents **MUST** confirm logs:

- `builder shell synced: apps/web → generated starter payload`
- `builder-owned data/content survived package upgrade`
- `external workspace (outside monorepo):` → `123_Testing`

Rule: **`.cursor/rules/exxat-package-publish-validation.mdc`**

```bash
# 1. Diagnose before release (auth, version, working tree, dist/, polluted env)
pnpm preflight

# 2. Author the changeset(s)
pnpm changeset

# 3. Bump versions + regenerate lockfile
pnpm changeset:version

# 4. Commit (release script enforces clean working tree)
git add -A && git commit -m "release: @exxatdesignux/ui@<new>"
git push origin main

# 5. Optional: dry-run the upload
pnpm release:dry

# 6. Publish for real
pnpm release

# 7. Tag + GitHub release (the wrapper prints these commands at the end)
git tag ui-v<new> && git push origin ui-v<new>
gh release create ui-v<new> --notes-from-tag
```

### What `pnpm release` guarantees

- Strips known pnpm-leaked `NPM_CONFIG_*` env vars (`auto-install-peers`, `verify-deps-before-run`, `npm-globalconfig`, scoped registry env vars, `devdir`) before spawning the publish child process — so the user never sees those warnings.
- Pins `NPM_CONFIG_LOGLEVEL=error` + disables fund/audit/update-notice chatter for the npm child only.
- Belt-and-suspenders stderr filter that drops any residual `npm warn Unknown (env|project) config "…"` lines and the "New minor version of npm available" notice.
- Refuses to re-publish a version that already exists on npm (clear error → `pnpm changeset:version` first).
- Runs `release:gates` (includes `smoke-test:publish`) → `tokens:check` → `build` → `publish`; aborts on any non-zero exit.

### What `pnpm preflight` checks

| Check | Failure mode caught |
|---|---|
| No stray `.npmrc` inside the repo | `Unknown project config "strict-peer-dependencies"` |
| Shell has no leaked `NPM_CONFIG_*` env vars | `Unknown env config "<key>"` warnings |
| `~/.npmrc` has an `//registry.npmjs.org/:_authToken` | 401 Unauthorized on publish |
| Current `packages/ui` version is unpublished | `ERR_PNPM_PUBLISH_VERSION_EXISTS` |
| Working tree is clean | `ERR_PNPM_GIT_UNCLEAN` |
| `packages/ui/dist/index.js` exists | First publish from a fresh clone hangs on tsup |

### Common publish failure → fix

| Symptom | Fix |
|---------|-----|
| `npm warn Unknown env config "auto-install-peers"` (or any other `NPM_CONFIG_*` key) | Use `pnpm release`, NOT `pnpm changeset publish`. The wrapper strips these. |
| `🦋 warn @exxatdesignux/ui is not being published because version X is already published` | Bump version: `pnpm changeset && pnpm changeset:version` then commit. |
| `ERR_PNPM_GIT_UNCLEAN` | Commit + push first: `git add -A && git commit -m '...' && git push`. The wrapper uses `--no-git-checks` only after preflight passes, so this is rare. |
| `401 Unauthorized` from npm | `npm login`. Token expired or never set. |
| Recharts deprecation warning in consumer install | Ensure `recharts: "^3.8.1"` + `react-is` in both `packages/ui/package.json` and root `pnpm.overrides`. |

---

## See also

- `docs/exxat-ds/consumer-upgrade-checklist.md`
- Skill: `exxat-ds` (patterns after upgrade)
- Skill: `exxat-ux-audit` (regression audit on touched surfaces)
- Wrappers: `scripts/release.mjs` + `scripts/preflight-publish.mjs` (this monorepo only)
