# Upgrading `@exxatdesignux/ui` (human + AI checklist)

Use this after **`npm install @exxatdesignux/ui@…`** / **`pnpm add @exxatdesignux/ui@…`**. It is copied into **`docs/exxat-ds/`** when you run **`exxat-ui sync-extras`**, so Cursor and other tools can find it beside other DS pattern docs.

**Binding rule:** `.cursor/rules/exxat-consumer-package-upgrade.mdc` — agents **MUST NOT** wipe product work. Procedure skill: `exxat-package-upgrade`.

## 0. Pick the right command (prevents wiped customer work)

| Goal | Command | Overwrites app source? |
|------|---------|------------------------|
| New UI primitives / bugfixes only | `pnpm add @exxatdesignux/ui@…` | **No** |
| Refresh AI rules / skills / `docs/exxat-ds` | `npx exxat-ui sync-extras` | Docs/rules, plus shell files you have not claimed |
| Align **framework wiring** with this release | `npx exxat-ui upgrade --check` then `upgrade` | **Yes** — wiring files you have not claimed |
| Fetch one reference file (a demo page, a mock module) | `npx exxat-ui upgrade --only <path>` | **Yes, that one file** — backs up first |
| Fork one package file you must change | `npx exxat-ui eject <path>` | **Yes** — writes that one file and stops updating it |
| Move your nav rows onto the current shape | `npx exxat-ui codemod nav-specs` | **Yes** — your nav files, and only if you ask |
| Take the package copy of files you *did* claim | `npx exxat-ui upgrade --force` | **Yes, destructively** — backs up first |

**Default for "update the package":** install only. Note that `sync-extras` escalates to a content-safe `upgrade` when a release ships shell changes: files you claimed are kept and listed under *"Your version kept"*, never replaced. Only `--force` overwrites them. Commit first; backups land in `.exxat-ui/backups/`.

### What `upgrade` actually writes

About 120 files, of which ~36 can overwrite anything:

- **Framework wiring (~36, overwritten):** product identity, routing, scope, shell layout, switcher chrome. These have to match the installed package — an app on an older copy gates the wrong products rather than merely looking dated.
- **Seams (~84, created once, never overwritten):** the one-line re-export shims in `components/ui/`, the slot fills in `components/app-shell-wiring.tsx` and `components/panel-bridges.tsx`, `src/styles/globals.css`, `vite.config.ts`.
- **Manual review (7, reported only):** files where both sides have real content.

**Everything else in the starter is reference, not payload.** Demo hubs, pages, `components/design-system/`, most of `lib/mock/` — those become your product the day you scaffold, so `upgrade` leaves them alone at every version. When a release fixes one you never customised, ask for it by name:

```bash
npx exxat-ui upgrade --only src/pages/library/index.tsx
```

That copies the one file, backs up what was there, and names any `@/` imports your app does not have yet, so a page that needs three siblings tells you rather than failing at build.

Every run tells you how many reference files differ from the release, without listing them: dozens is the normal state of a customised app, and from outside your repo a file you rewrote and a file you never touched are the same diff. **If `tsc` fails after an upgrade in a demo hub you never customised, that is what `--only` is for.** A package type change can reach a stale copy: 0.11.0 made `HubTableHandle` generic, so pre-0.11 copies of `components/library-table.tsx`, `components/columns-showcase.tsx`, and `components/columns-client.tsx` stop compiling until you refresh them.

### Ownership is a declaration, not a guess

`.exxat-ui/ejected.json` lists the package-owned paths this app has claimed. `upgrade` keeps every listed path exactly as it is and brings everything else current. Commit the ledger; it is the only record of which files stopped receiving fixes and why.

Claim a file **before** you edit it:

```bash
npx exxat-ui eject components/sidebar/app-sidebar   # fork + record
npx exxat-ui eject --list                            # every fork, and which ones upstream has moved past
npx exxat-ui eject --adopt components/sidebar/app-sidebar.tsx  # hand it back
```

Eject is the **last** rung. Try these first, because each one keeps taking fixes: override a token in `src/styles/globals.css`, fill a slot the component already exposes, then wrap the component in one of your own. Fork only when none of those reach the thing you need to change.

The first `upgrade` after installing 1.0 converts edits you already made into ledger rows rather than overwriting them, marks each `declaredBy: "upgrade-migration"`, and deletes the old `.exxat-ui/shell-baseline.json`. Read that list once: prune any row you did not mean to own with `eject --adopt`.

### Nav rows are data now: `codemod nav-specs`

A nav row carries its icon as a Font Awesome class string, not a node:

```diff
-  icon: <i className="fa-light fa-books" aria-hidden="true" />,
+  iconClass: "fa-light fa-books",
```

The JSX form still renders, by reading the class name back off the node. That only works for a bare `<i>` — a wrapper component, a conditional, or an icon with a sibling badge falls back to a grey circle, and nothing throws. `upgrade` counts the rows still in the old shape; convert them when you are ready:

```bash
npx exxat-ui codemod nav-specs --dry-run   # what it would change, and what it will not
npx exxat-ui codemod nav-specs             # write it
```

It converts the icons and retypes the builders it can prove, and then stops at the two things that are your call:

- **An exported registry** that now gets specs from your builders. Either retype it to `NavLayoutSpec` / `NavLinkSpec[]` and let callers render, or wrap the value in `navLayoutToJsx()` / `navToJsx()` from `@exxatdesignux/product-framework` to keep handing back nodes. It names the export and leaves your annotation alone.
- **Rows it cannot read**: an icon built by a wrapper component, a row with no type annotation, a `sectionRouteMatch` function. Each comes back with a file and line.

Re-running is safe, and reports the same outstanding list until you place those boundaries. Secondary nav rows keep taking nodes and are left alone.

## 1. See what changed

| Source | Purpose |
|--------|---------|
| **`npx --package=@exxatdesignux/ui@latest exxat-ui changelog`** | Slim upgrade notes from the installed package (`RELEASE_NOTES.md`, latest 5 versions). |
| **`docs/exxat-ds/latest-release.md`** | Same notes after `sync-extras` — agents can open this in the app tree. |
| **`node_modules/@exxatdesignux/ui/RELEASE_NOTES.md`** | Same file on disk (≥ 0.8.8). Full history stays on GitHub `RELEASES.md`. |

## 2. Refresh AI / pattern docs (optional but recommended)

```bash
npx --package=@exxatdesignux/ui@latest exxat-ui sync-extras
```

Overwrites only **`.cursor/skills/exxat-*`**, **`.claude/skills/exxat-*`**, **`.agents/`** (Google Antigravity), **`.cursor/rules/exxat-*`**, and **`docs/exxat-ds/*.md`** (including this file). Does **not** change your app routes or product code.

**Parity with dogfood:** `sync-extras` is the consumer equivalent of `pnpm sync-agent-context` in the DS monorepo — same rules, skills, patterns, and Antigravity workflows, rewritten for your app root (`./` not `apps/web/`).

## 3. Align app code with the reference template (optional — shell only)

The npm package includes a full Vite + React + react-router reference under:

**`node_modules/@exxatdesignux/ui/generated-starter/`**

Use it when you need to know **what files exist**, **how shims re-export** `@exxatdesignux/ui`, or **what AGENTS / layout** patterns look like for the current release.

**Preferred:** `npx exxat-ui upgrade --check` then `npx exxat-ui upgrade` — ports **framework wiring** only; preserves builder-owned tenant catalog, data modules, mock/API wiring, and custom pages.

**Never** blind-copy the whole `generated-starter/` tree. For a specific file, `upgrade --only <path>` does the copy with a backup and an import check. For everything else, diff template vs your repo and keep tenant content (skill **port-map**).

> **Consumer on an older stack?** See `apps/web/docs/perf-memory-pattern.md` for Vite dev tuning after upgrading `@exxatdesignux/ui`.

## 4. Dependencies

- Keep **`@exxatdesignux/ui`** on the same semver your team tested; prefer explicit **`^x.y.z`** or pinned **`x.y.z`**.
- Match the runtime version in **`.nvmrc`** / **`engines`** declared in **`node_modules/@exxatdesignux/ui/package.json`** (see `exxat-ui changelog` if it changed).
- **≥ 0.5.3:** Remove **`vaul`** from your app `package.json` and delete any `components/ui/drawer.tsx` shim — side panels use **`Sheet`** only (**`.cursor/rules/exxat-no-vaul.mdc`**).

## 5. Consumer UI audit (after sync-extras)

If the app was built before current agent rules, verify:

| Symptom | Fix |
|---------|-----|
| Full-width tab bar on list hub | Use **`ListPageTemplate`** view toolbar — **`exxat-tabs-chrome.mdc`** |
| Full-width Overview / Academics tabs | **`TabsList`** must stay **`w-fit`** — no `w-full` / `flex-1` stretch |
| Module / hub tabs scroll away; table head overlaps views | Port shell so sticky strips exist (`tabs-sticky-subheader` / `list-views-sticky-subheader`) + `getStickyTableHeaderOffset` — **`shell-utility-bar-pattern.md`**, **`tabs-pattern.md`** |
| Utility bar height / Back chrome drift | Port `utility-bar-slot.tsx` + `--shell-utility-bar-height`; Back mode + Ask Leo rightmost — **`exxat-utility-bar.mdc`** |
| Grey custom header buttons | **`PageHeader`** + **`Button`** variants — **`exxat-page-header-actions.mdc`** |
| Bespoke student popover in table | **`HoverCard`** + shared cells/badges — **`exxat-table-row-preview.mdc`** |
| Custom hub table / trimmed Add view | **`HubTable`** + **`FULL_HUB_SUPPORTED_VIEWS`** — **`exxat-hub-supported-views.mdc`** |
| Agent copied uploaded screenshots pixel-for-pixel | **`exxat-no-image-pixel-copy.mdc`** — images = IA only; map to blueprints + reference hubs |
| Package bump wiped nav / hubs / mocks | **`exxat-consumer-package-upgrade.mdc`** — restore from git or `.exxat-ui/backups/`; next time install-only unless shell sync was requested |

## 6. Still stuck?

- **`npx --package=@exxatdesignux/ui@latest exxat-ui doctor`** — compares local CLI version vs npm **`latest`**.
- **`npx --package=@exxatdesignux/ui@latest exxat-ui update`** — install commands and reminders.

Maintainers publish from the design-system monorepo with git tags **`ui-v<version>`**; registry **`latest`** follows those tags.
