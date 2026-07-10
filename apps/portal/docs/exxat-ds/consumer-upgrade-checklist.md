# Upgrading `@exxatdesignux/ui` (human + AI checklist)

Use this after **`npm install @exxatdesignux/ui@…`** / **`pnpm add @exxatdesignux/ui@…`**. It is copied into **`docs/exxat-ds/`** when you run **`exxat-ui sync-extras`**, so Cursor and other tools can find it beside other DS pattern docs.

## 1. See what changed

| Source | Purpose |
|--------|---------|
| **`node_modules/@exxatdesignux/ui/CHANGELOG.md`** | Release notes for the installed version (and peers). |
| **`npx --package=@exxatdesignux/ui@latest exxat-ui changelog`** | Print the changelog from the package on disk / npx extract. |

## 2. Refresh playbook + shell (recommended)

```bash
npx --package=@exxatdesignux/ui@latest exxat-ui upgrade
```

Runs **`sync-extras`** (Cursor/Claude skills, rules, hooks, **`docs/exxat-ds/`**) and ports safe package-owned shell files from **`generated-starter/`** in one install-like pass. Does **not** overwrite your product routes, mock data, or hub content.

Legacy (playbook only — shell port still auto-runs when needed):

```bash
npx --package=@exxatdesignux/ui@latest exxat-ui sync-extras
```

## 3. Align app code with the reference template

The npm package includes a full Vite + React + react-router-dom reference under:

**`node_modules/@exxatdesignux/ui/generated-starter/`**

Use it when you need to know **what files exist**, **how shims re-export** `@exxatdesignux/ui`, or **what AGENTS / layout** patterns look for the current release. Porting is manual: diff template vs your repo and apply intentional changes (imports, new components, CSS entrypoints).

> See **`perf-memory-pattern.md`** for Vite dev tuning after upgrading `@exxatdesignux/ui`.

## 4. Dependencies

- Keep **`@exxatdesignux/ui`** on the same semver your team tested; prefer explicit **`^x.y.z`** or pinned **`x.y.z`**.
- Match the runtime version in **`.nvmrc`** / **`engines`** declared in **`node_modules/@exxatdesignux/ui/package.json`** (see CHANGELOG if it changed).
- **≥ 0.5.3:** Remove **`vaul`** from your app `package.json` and delete any `components/ui/drawer.tsx` shim — side panels use **`Sheet`** only (**`.cursor/rules/exxat-no-vaul.mdc`**).

## 5. Consumer UI audit (after sync-extras)

If the app was built before current agent rules, verify:

| Symptom | Fix |
|---------|-----|
| Full-width tab bar on list hub | Use **`ListPageTemplate`** view toolbar — **`exxat-tabs-chrome.mdc`** |
| Full-width Overview / Academics tabs | **`TabsList`** must stay **`w-fit`** — no `w-full` / `flex-1` stretch |
| Grey custom header buttons | **`PageHeader`** + **`Button`** variants — **`exxat-page-header-actions.mdc`** |
| Bespoke student popover in table | **`HoverCard`** + shared cells/badges — **`exxat-table-row-preview.mdc`** |
| Custom hub table / trimmed Add view | **`HubTable`** + **`FULL_HUB_SUPPORTED_VIEWS`** — **`exxat-hub-supported-views.mdc`** |
| Agent copied uploaded screenshots pixel-for-pixel | **`exxat-no-image-pixel-copy.mdc`** — images = IA only; map to blueprints + reference hubs |

## 6. Agent context (after changing `.cursor/` or jobs)

- [ ] Only **4** `alwaysApply: true` rules — see **`docs/exxat-ds/agent-context-architecture.md`**
- [ ] **Cursor + Claude parity** — `.cursor/rules/` and `.claude/rules/` both have constitution + exxat rules; `.claude/skills/exxat-*` matches Cursor
- [ ] Run **`npx exxat-ui sync-extras`** (or maintainer **`vendor:consumer-extras`** before publish)
- [ ] **`npx exxat-ui doctor`** — confirms brief-gate, rules, skills, and job docs for both clients

## 7. Still stuck?

- **`npx --package=@exxatdesignux/ui@latest exxat-ui doctor`** — compares local CLI version vs npm **`latest`**.
- **`npx --package=@exxatdesignux/ui@latest exxat-ui update`** — install commands and reminders.

Maintainers publish from the design-system monorepo with git tags **`ui-v<version>`**; registry **`latest`** follows those tags.
