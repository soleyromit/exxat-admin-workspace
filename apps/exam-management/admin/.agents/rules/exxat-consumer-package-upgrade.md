---
description: Consumer apps — bump @exxatdesignux/ui without wiping product work; never blind-run exxat-ui upgrade or copy generated-starter wholesale. Load on install, update, upgrade, bump, or sync-extras.
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-consumer-package-upgrade.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — consumer package upgrade (preserve app work)

**Applies when:** installing, bumping, upgrading, or syncing `@exxatdesignux/ui` in a **consumer / customer app** (npm/`pnpm` dependency — not the DS monorepo `workspace:*`).

**Procedure skill:** `.agents/skills/exxat-package-upgrade/SKILL.md` (Claude / Antigravity mirrors after sync).

**Checklist pattern:** `docs/exxat-ds/consumer-upgrade-checklist.md` (after `sync-extras`).

## Pick the command deliberately

| Command | Touches app source? | Use when |
|---------|---------------------|----------|
| `pnpm add @exxatdesignux/ui@…` / `npm install @exxatdesignux/ui@…` | **No** — only `node_modules` + lockfile | You need new primitives / bugfixes only |
| `npx exxat-ui sync-extras` | Docs/rules, **plus safe shell ports** — it escalates to `upgrade` when there is portable drift | Refresh agent context; never product pages |
| `npx exxat-ui upgrade` | **Yes** — brings **framework wiring** current and creates missing shims; leaves demo pages, hubs, and mocks alone entirely | Align shell chrome after a release that ships shell changes |
| `npx exxat-ui upgrade --only <path>` | **Yes, one file** — fetches a single reference file from `generated-starter/` | You want a fix to a demo page or mock module you never customised |
| `npx exxat-ui eject <path>` | **Yes** — forks one package file into the app and declares it app-owned | You must change a package file and no token / slot / wrapper will do |
| `npx exxat-ui codemod nav-specs` | **Yes** — rewrites the app's own nav files, opt-in only | `upgrade` reported nav rows still carrying JSX icons |
| `npx --yes --package=@exxatdesignux/ui@<target-version> exxat-ui migrate plan` | **No** unless `--output` is given | Detect legacy bootstrap versus a managed upgrade and produce a checksummed plan |
| `npx --yes --package=@exxatdesignux/ui@<target-version> exxat-ui migrate apply --plan <file>` | **Yes, transactionally** | Apply a reviewed plan in an isolated Git worktree, validate it, then promote one patch |
| `npx exxat-ui upgrade --force` | **Yes, destructively** — also overwrites declared app-owned files | **Only** on explicit user request, after showing them the kept-file list |

`upgrade` also writes backups under `.exxat-ui/backups/<timestamp>/`. Prefer **git commit** before any upgrade.

## What `upgrade` will and will not overwrite

Three sets, and most of the starter is in none of them:

| Set | Behaviour | Contents |
|---|---|---|
| Framework wiring (33) | **Overwritten**, with a backup | Product identity, routing, scope, shell layout, switcher chrome — has to match the installed package or the app gates the wrong products |
| Seams (~85) | **Created if missing, never overwritten** | Import-closed one-line re-export shims, generic fills, `globals.css`, `vite.config.ts`; product-specific `app-shell-wiring.tsx` and `panel-bridges.tsx` remain reference files |
| Manual review (7) | **Reported, never written** | Files where both sides have real content |

Everything else — demo hubs, pages, `components/design-system/`, most of `lib/mock/` — is **reference only**. It becomes the app's product on day one, so `upgrade` does not write it at any version. Fetch one deliberately:

```bash
npx exxat-ui upgrade --only src/pages/library/index.tsx
```

`--only` copies that one file, backs up what was there, and names any `@/` imports the app does not have yet. It refuses a declared path unless you add `--force`, and it does nothing else: no sync-extras, no wiring port.

Every `upgrade` reports **how many** reference files differ from the release, and nothing more: from outside the repo a file the app rewrote and a file it never touched are the same diff, and dozens differing is the normal state. **When `tsc` fails after an upgrade inside a demo hub nobody customised, reach for `--only` on that file** rather than porting it in the manifest. A package type change reaches a handful of stale copies (0.11.0's generic `HubTableHandle` broke three), and porting them drags their import closure — page headers, list templates, mocks — into the write surface.

Within the two written sets, ownership is **declared**, in `.exxat-ui/ejected.json` (committed):

- path **listed** in the ledger → **kept as-is**, listed under *"Your version kept"*, with the package copy's path for merging
- path **not listed** → kept current with the package, with a backup

`.exxat-ui/shell-baseline.json` used to answer this by hashing what the upgrader
last wrote. It could tell whether a file had changed but never whether that was
deliberate, so an incidental edit froze a file forever and an intentional one
looked identical to a stale copy.

The first `upgrade` after the switch converts existing drift into declarations
**only when a trustworthy baseline is there to read**, then deletes it. An app
with no `shell-baseline.json` has nothing to separate a consumer edit from an
untouched old package copy, so `upgrade` **fails closed**: it writes nothing,
lists the unresolved paths, and waits for an explicit choice —
`--declare-existing-owned` to preserve and record them, or `--force` to take the
package copies with backups. Review the list per file; the two flags are
per-run, not per-file, and a wholesale answer freezes stale copies or drops
tenant work. A malformed ledger stops the run the same way.

`upgrade --check` exit codes: **10** = portable work exists (what `sync-extras`
acts on) · **11** = nothing portable, but this app owns package files ·
**1** = unresolved ownership or malformed ledger, nothing written ·
**0** = nothing to do.

Current `postinstall` keeps the agent-context sync fail-open but lets `upgrade`
exit 1 fail visibly, so unresolved ownership cannot masquerade as a successful
install. `sync-extras` also prints the underlying error when its dry run sees
exit 1. Older apps may still end their wired script with
`exxat-ui upgrade --quiet || true`; `sync-extras` removes that terminal mask.
It warns and leaves a custom chain untouched when another command follows the
mask. After any major bump, run `upgrade --check` by hand and review its exit
code.

The starter's `predev` runs a cached npm version check at most once per day. A
newer release prints the exact package update and `upgrade --check` commands.
Run `exxat-ui check-update` to check immediately;
`EXXAT_UI_SKIP_UPDATE_CHECK=1` is the explicit opt-out for offline or centrally
managed environments.

## Architecture migration: legacy bootstrap versus managed upgrade

Use the migration workflow when the app predates `.exxat-ui/architecture.json`
or when a release changes architecture, routes, flow contracts, or persisted
state. Do not substitute `upgrade --force`.

1. Pin the destination CLI and run
   `npx --yes --package=@exxatdesignux/ui@<target-version> exxat-ui migrate plan --output .exxat-ui/plans/<name>.json`.
2. If mode is `legacy-bootstrap`, run `exxat-ui migrate legacy inspect`.
3. Review every route, navigation, authorization, mutation, draft, and storage
   finding. Give every disposition a reason and connect routes to reviewed
   flows. Resolve skipped implementation files or add a reasoned
   `coverageAcknowledgements` entry for each one.
4. Run `exxat-ui migrate legacy verify`, commit the inventory, review,
   compatibility manifest, and ownership ledger, then generate a fresh plan.
5. Run
   `npx --yes --package=@exxatdesignux/ui@<target-version> exxat-ui migrate apply --plan <file>`
   only from a clean Git root and with the same target version used for plan.

Apply installs with lifecycle scripts disabled inside a detached worktree,
runs the app's typecheck, test, or build gates, verifies framework idempotence,
records a checksummed receipt chain, and then promotes one binary-safe patch.
Any stale plan, changed `HEAD`, unresolved ownership, incomplete review, storage
collision, or non-preserving behavior stops before the checkout changes.

Automatic legacy bootstrap is preservation-only. Alias, redirect, replace,
facade, copy, transform, migrate, remove, or retire dispositions require an
app-owned adapter and contract test. Never change a disposition to `preserve`
merely to clear a blocker.

For prepublish customer testing, bind the exact tarball:

```bash
UI_TARBALL=file:/absolute/path/to/exxatdesignux-ui-x.y.z.tgz
npx --yes --package="$UI_TARBALL" exxat-ui migrate plan \
  --package-spec file:/absolute/path/to/exxatdesignux-ui-x.y.z.tgz \
  --framework-package-spec file:/absolute/path/to/exxatdesignux-product-framework-x.y.z.tgz \
  --output .exxat-ui/plans/local-tarball.json
npx --yes --package="$UI_TARBALL" exxat-ui migrate apply \
  --plan .exxat-ui/plans/local-tarball.json
```

The plan records both tarball checksums. Apply refuses if either artifact
changes and verifies the installed package versions before recording a receipt.
Both commands must use the destination tarball's CLI so its recipes and target
architecture match the package being tested.

## Nav rows carry a class string, not a node

A nav row's icon is data: `iconClass: "fa-light fa-books"`, not
`icon: <i className="fa-light fa-books" />`. The JSX form still renders — by
reading the class back off the node — which works for a bare `<i>` and silently
yields a grey circle for a wrapper component, a conditional, or an icon with a
sibling badge. Nothing throws, so `upgrade` counts the remaining rows and names
the fix; it never rewrites the file, because the app's nav is app-owned.

```bash
npx exxat-ui codemod nav-specs --dry-run   # every change, and every refusal
npx exxat-ui codemod nav-specs
```

It converts the icons and retypes the builders it can prove, transitively. It
stops at two things and reports them by file, line, and name:

- **An exported registry** that now receives specs. Retype it to `NavLayoutSpec`
  / `NavLinkSpec[]` and let callers render, **or** wrap the value in
  `navLayoutToJsx()` / `navToJsx()` from `@exxatdesignux/product-framework`.
  Both are correct; they differ in who owns the seam, so this is the user's call.
- **Rows it cannot read**: icon from a wrapper component, a row with no type
  annotation, a `sectionRouteMatch` function with no data form.

Re-running is a no-op and reports the same outstanding list. Secondary nav
(`NavSecondaryItem`) still takes nodes and is left alone.

## Customising a package component (cheapest rung first)

1. **Override a token** in `src/styles/globals.css`
2. **Fill a named slot** the component already exposes
3. **Wrap it** in an app component
4. **`npx exxat-ui eject <path>`** — last resort; that file stops receiving fixes

`npx exxat-ui eject --list` reports every fork and flags the ones whose package
version has moved since. `npx exxat-ui eject --adopt <path>` hands a file back.

## MUST

1. **Confirm the command before running it.** If the user said "update the package" / "bump the DS", default to **install only**. Note that a wired `postinstall` may run `sync-extras` and a content-safe `upgrade` for you; report what it did rather than assuming nothing moved.
2. **Dry-run first** when shell sync is intended:
   ```bash
   npx exxat-ui upgrade --check
   ```
3. **Preserve builder-owned / tenant work:** custom products, domain hubs, mock/API modules, column defs, tenant nav labels/URLs, custom pages, `.env*`.
4. **Port shell only** when release notes or a chrome bug require it — merge against `node_modules/@exxatdesignux/ui/generated-starter/` using the skill **port-map**; keep app content.
5. **Report** what was installed vs what was ported vs what was left alone (skill Phase 6 handoff).
6. **Run `codemod nav-specs --dry-run` and report it** when the upgrade receipt counts JSX nav rows. Write only after the user says so, and hand back the refusals verbatim — they are decisions, not failures.

## MUST NOT

1. **MUST NOT** run `exxat-ui upgrade --force` as a follow-up to `pnpm add` / `npm install`, or to clear a *"Your version kept"* list. Plain `upgrade` is content-safe; `--force` needs the user's explicit yes.
2. **MUST NOT** copy the entire `generated-starter/` tree into the customer app.
3. **MUST NOT** overwrite or delete tenant routes, hubs, mocks, API clients, or product copy "to match the starter".
4. **MUST NOT** put durable product IA in a framework-wiring path without a merge plan — `upgrade` replaces those (product identity, routing, scope, switcher chrome) with the dogfood starter's version. Product IA belongs in pages, hubs, and mock modules, which `upgrade` never writes.
5. **MUST NOT** edit a package-owned file without declaring it first. Run `exxat-ui eject <path>`, then edit. An undeclared edit is indistinguishable from a stale copy, so the next `upgrade` replaces it (backup only).
6. **MUST NOT** hand-copy a package component into the app to fork it. `exxat-ui eject` writes the same file *and* records it, points its imports back at the package, and keeps `--list` able to tell you when upstream moves.
7. **MUST NOT** pick the render boundary for the user when `codemod nav-specs` reports an exported registry, and MUST NOT hand-convert nav icons row by row instead of running the codemod. Retyping the export and wrapping it in `navLayoutToJsx()` change who renders; guessing moves a seam the app depends on.

## Recovering wiped files

1. `git checkout -- <path>` or `git restore <path>` from the pre-upgrade commit.
2. Or copy from `.exxat-ui/backups/<timestamp>/`.
3. Re-apply tenant changes in **app-owned** files so the next `upgrade` does not erase them again.

## See also

- Skill: `exxat-package-upgrade` (+ `port-map.md`)
- Maintainer publish gate: `exxat-package-publish-validation.md` (monorepo only)
- CLI: `exxat-ui doctor` · `exxat-ui changelog` · `exxat-ui upgrade --check`
