---
name: ds-release
description: >
  Cut / publish / ship a new @exxatdesignux/ui release from the DS monorepo
  (the PRODUCER side). Use when Romit says "cut a DS release", "publish ui vX",
  "ship the design system", "release the package", "bump and publish
  @exxatdesignux/ui", or "tag a new ui version". This is the maintainer /
  changeset → npm publish workflow, NOT installing or upgrading the package in a
  consumer app — for that use `exxat-package-upgrade`.
---

# Exxat DS — cut a release (`@exxatdesignux/ui`)

**Producer side.** This skill publishes a new version of the DS package to npm.
The **consumer** side (install / bump / port shell into an app) is a different
skill: **`exxat-package-upgrade`** — link consumers there after you publish.

## Where this runs

The DS package source is **NOT** in the `~/Work` monorepo. It lives in a
**separate repo**:

```
~/Exxat-DS-Workspace          # remote: github.com/ExxatDesign/Exxat-DS-Workspace
├─ packages/ui/               # @exxatdesignux/ui — the package you publish
├─ apps/…  (@exxat-ds/reference-app) # the :4000 builder / dogfood app
├─ .changeset/config.json     # changesets: baseBranch main, changelog-github, access public
└─ scripts/{release,preflight-publish,release-gates}.mjs  # the real wrappers
```

Run every command below **from `~/Exxat-DS-Workspace`** (repo root), never from
`~/Work`. All scripts are `pnpm` scripts defined in that repo's root
`package.json` — verified against the real `scripts` block (see “Real scripts”
at the bottom). **Do not invent commands; use only these.**

## Branch discipline (non-negotiable)

- **`baseBranch` is `main`** (`.changeset/config.json`). Releases publish from `main`.
- **Never publish from a dirty tree** — `preflight` and `release` both refuse
  `ERR_PNPM_GIT_UNCLEAN`. Commit or stash first.
- **Never push a version bump straight to `main` without Himanshu Suthar's
  review** (repo owns the same main-branch rule as `~/Work`). Open a PR / get
  sign-off before `git push origin main`. Publishing is downstream of a
  reviewed, merged version bump.
- **`"commit": false`** in changeset config → changesets never auto-commit; you
  commit the version bump explicitly.

---

## Pre-flight checklist (before touching anything)

- [ ] In `~/Exxat-DS-Workspace`, on `main`, `git pull` up to date.
- [ ] `git status` clean (no uncommitted work).
- [ ] `npm whoami` succeeds (npm auth token present — else 401 on publish).
- [ ] The apps/web shell changes are already synced into the package payload
      (`pnpm sync-ui-template` + `:check` — see Step 4). A version bump alone is
      NOT a release.
- [ ] Run the diagnostic: **`pnpm preflight`** (see table below — catches stray
      `.npmrc`, leaked `NPM_CONFIG_*`, missing auth token, already-published
      version, unclean tree, missing `packages/ui/dist/index.js`).

---

## Ordered release workflow

```bash
cd ~/Exxat-DS-Workspace          # ALWAYS — this is the producer repo, not ~/Work

# 0. Diagnose the release environment first (auth, version, tree, dist/, env)
pnpm preflight

# 1. Sync the builder shell into the package payload (if apps/web changed)
pnpm builder:contract            # verify apps/web ↔ generated-starter contract
pnpm sync-ui-template            # apply: apps/web shell → packages/ui/generated-starter
pnpm sync-ui-template:check      # must report in-sync

# 2. Author the changeset (choose patch / minor / major + summary)
pnpm changeset                   # writes a .changeset/*.md entry

# 3. Bump version + regenerate lockfile from the changeset(s)
pnpm changeset:version           # = `changeset version && pnpm install --lockfile-only`
                                 # bumps packages/ui/package.json + CHANGELOG.md

# 4. Typecheck the package before committing the bump
pnpm typecheck                   # root → filters @exxat-ds/reference-app tsc --noEmit
                                 # (package-level: pnpm --filter @exxatdesignux/ui typecheck)

# 5. Commit the version bump — get Himanshu review before merging to main
git add -A
git commit -m "release: @exxatdesignux/ui@<new-version>"
#   → open PR / obtain review, then:
git push origin main

# 6. (Optional but recommended) full gates + dry-run before the real upload
pnpm release:gates               # product-framework typecheck + smoke-test:publish, etc.
pnpm release:dry                 # tokens:check → build → publish --dry-run (no upload)

# 7. Publish for real
pnpm release                     # THE wrapper: strips pnpm NPM_CONFIG_* noise, then
                                 # tokens:check → build (tsup) → publish --access public

# 8. Tag + GitHub release (tag convention is `ui-v<version>`, confirmed by history)
git tag ui-v<new-version>
git push origin ui-v<new-version>
gh release create ui-v<new-version> --notes-from-tag
#   (repo: ExxatDesign/Exxat-DS-Workspace; changelog is changelog-github generated)
```

**Always use `pnpm release` — never `pnpm changeset publish` or `npm publish`
directly.** The wrapper (`scripts/release.mjs`) sanitises the pnpm-leaked
`NPM_CONFIG_*` env vars before spawning the npm child, so contributors don't get
`npm warn Unknown env config "…"` noise, refuses to re-publish an existing
version, and runs `tokens:check → build → publish` in order, aborting on any
non-zero exit.

---

## Post-release verification (required)

```bash
# 1. Confirm npm has the new version
npm view @exxatdesignux/ui version           # must equal <new-version>
npm view @exxatdesignux/ui dist-tags.latest

# 2. Confirm the git tag + GitHub release exist
git tag --list 'ui-v<new-version>'
gh release view ui-v<new-version>
```

Then **hand off to consumers**: the install/upgrade in every product app
(`apps/<product>/{admin,student}` in `~/Work`, plus external scaffolds) is the
**`exxat-package-upgrade`** skill — its Phase 1–6 read the release notes, bump
the dep, `sync-extras`, and port only the shell. Point the consumer sync there;
do NOT do consumer-app edits from this skill.

---

## `pnpm preflight` — what it catches

| Check | Failure mode caught |
|---|---|
| No stray `.npmrc` in the repo | `Unknown project config "strict-peer-dependencies"` |
| Shell has no leaked `NPM_CONFIG_*` env vars | `Unknown env config "<key>"` warnings |
| `~/.npmrc` has a `//registry.npmjs.org/:_authToken` | 401 Unauthorized on publish |
| `packages/ui` version is not already on npm | `ERR_PNPM_PUBLISH_VERSION_EXISTS` |
| Working tree is clean | `ERR_PNPM_GIT_UNCLEAN` |
| `packages/ui/dist/index.js` exists | First publish from a fresh clone hangs on tsup |

## Common failure → fix

| Symptom | Fix |
|---|---|
| `npm warn Unknown env config "auto-install-peers"` (or any `NPM_CONFIG_*`) | Use `pnpm release`, NOT `pnpm changeset publish`. The wrapper strips these. |
| `🦋 warn … version X is already published` | You skipped the bump: `pnpm changeset && pnpm changeset:version`, commit, retry. |
| `ERR_PNPM_GIT_UNCLEAN` | Commit/stash + `git push` first. `pnpm preflight` flags this pre-emptively. |
| `401 Unauthorized` from npm | `npm login` — token expired or never set. |
| `sync-ui-template:check` reports drift | Re-run `pnpm sync-ui-template`; the apps/web shell wasn't synced into the payload. |

---

## Real scripts (anchored — nothing invented)

Verified in `~/Exxat-DS-Workspace/package.json` (root) and
`packages/ui/package.json`:

**Root:**
- `preflight`: `node ./scripts/preflight-publish.mjs`
- `changeset`: `changeset`
- `changeset:version`: `changeset version && pnpm install --lockfile-only`
- `changeset:publish`: `node ./scripts/release.mjs`
- `release`: `node ./scripts/release.mjs`
- `release:dry`: `node ./scripts/release.mjs --dry-run`
- `release:gates`: `node ./scripts/release-gates.mjs`
- `typecheck`: `pnpm --filter @exxat-ds/reference-app typecheck`
- `builder:contract`: `node ./scripts/verify-builder-contract.mjs`
- `sync-ui-template`: `pnpm --filter @exxatdesignux/ui sync-template`
- `sync-ui-template:check`: `pnpm --filter @exxatdesignux/ui sync-template:check`

**`packages/ui` (name `@exxatdesignux/ui`):**
- `build`: `tsup`
- `typecheck`: `tsc --noEmit`
- `tokens:check`: `node ./scripts/build-tokens-index.mjs --check`
- `smoke-test:publish`: `node ./scripts/smoke-test-publish.mjs`
- `prepack`: `sync-template-from-reference-app.mjs && vendor-consumer-extras.mjs && tsup`

`.changeset/config.json`: `baseBranch: main`, `access: public`,
`changelog: @changesets/changelog-github` (repo `ExxatDesign/Exxat-DS-Workspace`),
`commit: false`, `reference-app` + eslint packages ignored.

> History cross-check: the session-history commands `pnpm changeset`,
> `pnpm release`, `pnpm typecheck`, `pnpm preflight`, `pnpm install`,
> `gh release create ui-vX`, `git push origin main` all map to the real scripts
> above. `gh release create ui-vX` matches the existing `ui-v0.6.48` tag
> convention.

---

## See also

- **`exxat-package-upgrade`** — the CONSUMER side (install / upgrade / port shell
  into a product app). Its Phase 7 also documents publish, but this `ds-release`
  skill is the canonical producer entry point.
- Wrappers (in `~/Exxat-DS-Workspace`): `scripts/release.mjs`,
  `scripts/preflight-publish.mjs`, `scripts/release-gates.mjs`.
