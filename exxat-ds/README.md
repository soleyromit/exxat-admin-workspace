# Exxat DS Workspace

A **pnpm + Turborepo monorepo** containing the Exxat Design System and reference application.

### Who can use this repo

| Goal | What you need |
|------|----------------|
| **Clone, install, run locally** | Read access to [ExxatDesign/Exxat-DS-Workspace](https://github.com/ExxatDesign/Exxat-DS-Workspace) (org member or collaborator). |
| **Push branches / merge to `main`** | **Write** access on the repo — an **org owner or repo admin** must grant it. If you cannot push, use a **fork** and open a **Pull Request** into this repo. |
| **Add a new app under `apps/`** | Same as push: your branch must land via PR or direct push per team policy. The steps are in [Creating a new app in this monorepo](#creating-a-new-app-in-this-monorepo). |

---

## Quick Start

> **This is a private repo.** You must be added as a collaborator on GitHub and authenticate before cloning. See [Authentication](#authentication) below.

### What you need

- **Node.js 20+** — [nodejs.org](https://nodejs.org) or `brew install node` (macOS).  
- **Git** — to clone this repository.  
- **pnpm** — use **Corepack** (bundled with Node) or **`npx`** (see below). You do **not** need to install pnpm globally if you use those.

### One command: install tools, auth, clone, install, run (private repo)

This repo is **private**, so **`curl` → `raw.githubusercontent.com` returns 404** (no anonymous access). Use **`gh api`** so GitHub sees your login.

You need: **[Node.js 20+](https://nodejs.org)**, **[GitHub CLI `gh`](https://cli.github.com/)**, and **read access** to this repo. **`pnpm`** is installed by the script via **Corepack** (ships with Node).

---

#### macOS (Homebrew) — **one line** (installs **node** + **gh**, then runs bootstrap + dev)

Requires **[Homebrew](https://brew.sh)** (`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` if you don’t have it yet).

```bash
brew install node gh && gh api -H "Accept: application/vnd.github.raw" "/repos/ExxatDesign/Exxat-DS-Workspace/contents/scripts/bootstrap.sh?ref=main" | bash && cd Exxat-DS-Workspace && pnpm dev:web
```

If **node** / **gh** are already installed, `brew install` is quick and leaves them as-is.

---

#### Already have Node + `gh`? — shorter line

From the folder where you want the project (creates **`./Exxat-DS-Workspace`**):

```bash
gh api -H "Accept: application/vnd.github.raw" "/repos/ExxatDesign/Exxat-DS-Workspace/contents/scripts/bootstrap.sh?ref=main" | bash && cd Exxat-DS-Workspace && pnpm dev:web
```

---

#### Windows

Install **Node 20+** ([nodejs.org](https://nodejs.org)) and **`gh`** ([GitHub CLI for Windows](https://cli.github.com/) or `winget install --id GitHub.cli`), open a new terminal, then use the **shorter line** above (same `gh api …` command).

#### Linux

Install **Node 20+** (e.g. your distro, [NodeSource](https://github.com/nodesource/distributions), or [nvm](https://github.com/nvm-sh/nvm)) and **`gh`** ([install instructions](https://github.com/cli/cli#linux--bsd)), then use the **shorter line** above.

---

**What the pipeline does**

1. **`brew install node gh`** (macOS one-liner only) — ensures **`node`** and **`gh`** exist.  
2. **`gh api … | bash`** — downloads `scripts/bootstrap.sh` with your **`gh`** session; the script may run **`gh auth login`** once (browser), then **`gh repo clone`**, **Corepack**, **`pnpm install`**.  
3. **`cd … && pnpm dev:web`** — **http://localhost:3000**

**Alternative (no `gh api` pipe — clone from disk):**

```bash
brew install node gh   # if needed
gh repo clone ExxatDesign/Exxat-DS-Workspace && cd Exxat-DS-Workspace && bash scripts/bootstrap.sh && pnpm dev:web
```

**Already cloned?** From the repo root: **`pnpm bootstrap`** then **`pnpm dev:web`**. (**`pnpm bootstrap`** = **`bash scripts/bootstrap.sh`**.)

**No `git` / `gh`?** Install **`gh`** (or clone with HTTPS + credentials), then **`pnpm bootstrap`** inside the repo, or follow the manual steps below.

### Clone, install, run (works for any teammate)

From an empty directory:

```bash
git clone https://github.com/ExxatDesign/Exxat-DS-Workspace.git
cd Exxat-DS-Workspace
corepack enable && corepack prepare pnpm@10.33.0 --activate
pnpm install
pnpm dev:web
```

- **Main app:** **`pnpm dev:web`** → **http://localhost:3000**

Run **all** workspace apps’ dev servers at once (if you add more under `apps/`): **`pnpm dev`**

### If you see `command not found: pnpm`

Use the same pinned version via **npx** (no global install):

```bash
cd Exxat-DS-Workspace
npx -y pnpm@10.33.0 install
npx -y pnpm@10.33.0 dev:web
```

Or install pnpm once: `npm install -g pnpm` then `pnpm install` as usual.

### Git auth (before `git clone`)

```bash
# Recommended — one-time
gh auth login
```

Then clone over HTTPS or SSH as in [Authentication](#authentication) below.

---

## Authentication

This repo is **private** under the [ExxatDesign](https://github.com/ExxatDesign) org. You need collaborator access **and** an authenticated Git session to clone/pull/push.

### Option A — GitHub CLI (recommended)

```bash
# Install the GitHub CLI if you don't have it
# macOS:  brew install gh
# Windows: winget install --id GitHub.cli
# Linux:  https://github.com/cli/cli/blob/trunk/docs/install_linux.md

gh auth login
# Follow the prompts (browser-based OAuth — no token to manage)
```

After `gh auth login`, standard `git clone https://...` commands work automatically.

### Option B — SSH

```bash
# If you already have SSH keys linked to your GitHub account:
git clone git@github.com:ExxatDesign/Exxat-DS-Workspace.git
```

Set up SSH keys: [GitHub docs → Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).

### Option C — Personal Access Token (PAT)

```bash
git clone https://<YOUR_TOKEN>@github.com/ExxatDesign/Exxat-DS-Workspace.git
```

Generate a token at [github.com/settings/tokens](https://github.com/settings/tokens) with `repo` scope. Not recommended for shared machines — prefer SSH or `gh auth login`.

---

## Prerequisites

| Tool | Minimum | Recommended |
|------|---------|-------------|
| **Node.js** | 20+ | Latest LTS (`nvm install` reads `.nvmrc`) |
| **pnpm** | 10+ | `corepack enable` auto-installs the pinned version |

If you use **nvm**, **fnm**, or **Volta**, the `.nvmrc` picks up the correct Node version automatically:

```bash
nvm use    # or: fnm use
```

> **Don't have pnpm?** After `corepack enable`, the `packageManager` field in the root `package.json` tells corepack which version to use. Alternatively: `npm install -g pnpm@latest`.

---

## Monorepo Structure

```
Exxat-DS-Workspace/
├── apps/
│   ├── web/                     # @exxat-ds/web — Main Next.js app (localhost:3000)
│   │   ├── app/                 # Next.js App Router (routes, layouts, pages)
│   │   ├── components/          # App-level components (DataTable, ListPage, etc.)
│   │   ├── contexts/            # React contexts (theme, sidebar, etc.)
│   │   ├── hooks/               # App-level hooks
│   │   ├── lib/                 # App-level utilities and mock data
│   │   ├── AGENTS.md            # Authoritative product handbook for AI/contributors
│   │   └── package.json
│
├── packages/
│   └── ui/                      # @exxat-ds/ui — Shared design system package
│       └── src/
│           ├── components/ui/   # 40+ UI primitives (Button, Card, Dialog, etc.)
│           ├── hooks/           # Shared hooks (useAppTheme, useMobile, etc.)
│           ├── lib/             # Shared utilities (cn, date-filter, etc.)
│           └── globals.css      # Design tokens + theme variants + HC/forced-colors
│
├── .cursor/rules/               # Cursor AI rules (auto-applied)
├── .cursor/skills/              # Cursor AI skills (DS guide, accessibility, board cards, shadcn)
├── .claude/skills/              # Claude AI skills (same DS guide + board cards, shadcn)
├── AGENTS.md                    # Workspace-level AI handbook
├── turbo.json                   # Turborepo task pipeline config
├── pnpm-workspace.yaml          # pnpm workspace declaration
└── package.json                 # Root scripts and shared dev dependencies
```

### How workspaces connect

```
@exxat-ds/web (apps/web)
  └─ depends on → @exxat-ds/ui (packages/ui)   via "workspace:*"
```

When you run `pnpm install`, pnpm symlinks `packages/ui` into `apps/web/node_modules/@exxat-ds/ui`. Changes in `packages/ui` are reflected immediately — no build step needed during development.

## Changelog

Notable changes are recorded in [CHANGELOG.md](./CHANGELOG.md).

---

## Available Scripts

Run these from the **workspace root**:

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies across every workspace |
| `pnpm dev` | Start **all** apps under `apps/*` in dev mode (multiple processes / ports) |
| `pnpm dev:web` | Main Next.js app only → **http://localhost:3000** (easiest for most people) |
| `pnpm build` | Production build for all apps |
| `pnpm lint` | Run ESLint across all apps |
| `pnpm typecheck` | TypeScript type checking across all apps |
| `pnpm format` | Format all files with Prettier |

### Running a specific workspace

From the repo root you can use **`pnpm dev:web`** or **`pnpm --filter`**:

```bash
# Run only the web app (same as pnpm dev:web)
pnpm --filter @exxat-ds/web dev

# Type-check only the UI package
pnpm --filter @exxat-ds/ui typecheck

# Add a dependency to the web app
pnpm --filter @exxat-ds/web add lodash

# Add a dev dependency to the UI package
pnpm --filter @exxat-ds/ui add -D @types/lodash
```

### Alternative ports

```bash
pnpm --filter @exxat-ds/web dev:3001   # port 3001
pnpm --filter @exxat-ds/web dev:3005   # port 3005
```

### Keep the dev server running (PM2)

Use **[PM2](https://pm2.keymetrics.io/)** so `next dev` stays up when you close the terminal:

```bash
pnpm --filter @exxat-ds/web dev:daemon          # start
pnpm --filter @exxat-ds/web dev:daemon:logs      # tail logs
pnpm --filter @exxat-ds/web dev:daemon:stop      # stop
pnpm --filter @exxat-ds/web dev:daemon:delete     # remove from PM2
```

---

## Working with the Monorepo

### Day-to-day workflow

1. **Always run `pnpm install` from the root** — never `cd` into a sub-package and run `npm install` or `pnpm install` there.
2. **Use `pnpm --filter <name>` to scope commands** — avoids running scripts in packages that don't need them.
3. **Import from `@exxat-ds/ui`** in app code — not from relative paths like `../../packages/ui`.
4. **Hot reload works across packages** — edit a component in `packages/ui`, save, and the Next.js app reloads instantly.

### Adding a dependency

```bash
# To the web app
pnpm --filter @exxat-ds/web add <package>

# To the UI package
pnpm --filter @exxat-ds/ui add <package>

# To the workspace root (shared dev tooling)
pnpm add -w -D <package>
```

### Turborepo caching

Turborepo caches `build`, `lint`, and `typecheck` outputs. If nothing changed in a package, re-running the same task finishes instantly. To clear the cache:

```bash
rm -rf .turbo
pnpm build
```

---

## Creating a new app in this monorepo

Use this when you want **another installable package under `apps/`** (for example a second Next.js site or a small tool), **inside the same Git repository**.

> **Monorepo vs separate repo:** Anything under `apps/<name>` that you push to **this** GitHub repo **is part of the monorepo** (one git history).  
> If you need a **standalone** product repo, create a **new GitHub repository** instead of a folder under `apps/`.

> **Workspace discovery:** `pnpm-workspace.yaml` already includes `apps/*`. Every new app is a **pnpm package** with its own `package.json`.

### Checklist (everyone with a clone)

1. From the repo root: `pnpm install` (once, and again after you add or change workspace packages).
2. Create **`apps/<your-app-folder>/`** (use **kebab-case**, e.g. `my-admin`, `storybook-web`).
3. Add **`apps/<your-app-folder>/package.json`** with a unique **`"name": "@exxat-ds/<your-app-folder>"`** and `"private": true`.
4. Add **`scripts`** your app needs at minimum **`dev`**, **`build`**, **`lint`** (and **`typecheck`** if TypeScript) so root `pnpm build` / Turbo can run them.
5. If the app uses the design system: add **`"@exxat-ds/ui": "workspace:*"`** to `dependencies`.
6. From the **repository root** run **`pnpm install`** again to link workspaces.
7. Run the app: **`pnpm --filter @exxat-ds/<your-app-folder> dev`** (or `pnpm -C apps/<your-app-folder> dev`).
8. **Commit on a branch** and open a **PR** (or push if you have rights). See [Who can use this repo](#who-can-use-this-repo) if push fails.

### Minimal `package.json` example (new app)

Adjust `scripts` to match your stack (Next.js, Vite, Node, etc.). This matches how the root runs all apps (`pnpm --filter apps/* …`).

```json
{
  "name": "@exxat-ds/my-app",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@exxat-ds/ui": "workspace:*"
  }
}
```

Use a **free port** if `@exxat-ds/web` already uses `3000`.

### Scaffold commands (starting from repo root)

```bash
mkdir -p apps/my-app
cd apps/my-app
pnpm init
# Edit package.json: set name to @exxat-ds/my-app, add scripts and dependencies as above
cd ../..
pnpm install
pnpm --filter @exxat-ds/my-app dev
```

### Using `@exxat-ds/ui` in the new app

**Import components** (paths follow the UI package exports):

```tsx
import { Button } from "@exxat-ds/ui/components/button.tsx"
import { Card } from "@exxat-ds/ui/components/card.tsx"
import { useAppTheme } from "@exxat-ds/ui/hooks/use-app-theme.ts"
import { cn } from "@exxat-ds/ui/lib/utils.ts"
```

**CSS / tokens** (before Tailwind in your global CSS):

```css
@import "@exxat-ds/ui/globals.css";
@import "tailwindcss";
```

**Next.js:** add `transpilePackages` so the workspace package is compiled:

```ts
const nextConfig = {
  transpilePackages: ["@exxat-ds/ui"],
}
export default nextConfig
```

**Faster start:** copy **`apps/web`** as a template (rename package `name`, paths, port) instead of an empty `pnpm init`.

### For AI assistants (Cursor, Claude, Copilot)

When the user asks to **“create a new app”** or **“add an app to the monorepo”**, do **not** use `npm`/`yarn` inside `apps/<name>` for installs. Instead:

1. Create **`apps/<kebab-name>/`** with **`package.json`** (`name`: `@exxat-ds/<kebab-name>`, `private`: true).
2. Add **`@exxat-ds/ui`: `workspace:*`** if they need the design system.
3. Run **`pnpm install` from the repository root** after creating or editing the package.
4. Use **`pnpm --filter @exxat-ds/<kebab-name> <script>`** to run commands.
5. Point humans to this section and [`AGENTS.md`](AGENTS.md) / [`apps/web/AGENTS.md`](apps/web/AGENTS.md) for product UI patterns.

Root **`package.json`** `description` / `keywords` document that new apps live under **`apps/*`**.

### Turborepo

New apps under `apps/*` are picked up by **`pnpm-workspace.yaml`**. Add the usual **`dev` / `build` / `lint`** scripts so `turbo run` from the root can include the new package when configured.

---

## Creating a New Shared Package

1. **Scaffold the directory:**

```bash
mkdir -p packages/my-lib/src
cd packages/my-lib
pnpm init
```

2. **Configure `package.json`:**

```json
{
  "name": "@exxat-ds/my-lib",
  "version": "0.0.1",
  "type": "module",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  },
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

3. **Consume it from any app:**

```bash
cd ../..
pnpm --filter @exxat-ds/web add @exxat-ds/my-lib@workspace:*
pnpm install
```

```tsx
import { myHelper } from "@exxat-ds/my-lib"
```

---

## Shared UI Package (`@exxat-ds/ui`)

The `packages/ui` package exports:

- **40+ Components** — Button, Card, Dialog, Sheet, Drawer, Checkbox, Badge, Calendar, Chart, CoachMark, Tabs, Tooltip, and more
- **Hooks** — `useAppTheme` (brand + contrast + system detection), `useMobile`, `useModKeyLabel`, `useCoachMark`
- **Utilities** — `cn()` (clsx + tailwind-merge), `date-filter`
- **Design Tokens** — `globals.css` with:
  - Light / Dark base themes
  - Brand variants (Exxat One / Prism)
  - High Contrast mode (light HC, dark HC)
  - Windows Forced Colors (`@media (forced-colors: active)`)
  - DataTable tokens (`--dt-row-bg`, `--dt-row-hover`, `--dt-row-selected`, etc.)

### High Contrast Mode

Three contrast preferences:

| Setting | Behavior |
|---------|----------|
| **System** (default) | Follows OS `prefers-contrast: more` |
| **Normal** | Standard AA contrast |
| **High** | AAA-adjacent: 7:1+ text, pure black/white borders, 3px focus ring |

Windows Forced Colors (`prefers-contrast: forced`) maps all tokens to `SystemColors` keywords automatically.

### Using the design system outside this monorepo (npm / “like shadcn”)

**What is portable today:** **`packages/ui`** is published as the **`@exxat-ds/ui`** package (source in-repo). **App-specific** UI (e.g. `DataTable`, `ListPageTemplate`, full flows) lives in **`apps/web`** and is meant to be **copied or reused as patterns**, not necessarily shipped as one npm package.

**How this differs from shadcn/ui:** shadcn’s CLI **copies component source** into *your* repo from a **registry**. This repo instead ships a **real package** you install as a dependency (closer to a typical component library). You *can* add a **custom shadcn registry** later so `npx shadcn add` pulls Exxat primitives from your hosted `registry.json`—that is extra tooling on top of `@exxat-ds/ui`.

| Approach | Best for | Summary |
|----------|----------|---------|
| **Clone this monorepo** | Teams that own the full workspace | `git clone` → `pnpm install` → add apps under `apps/*` ([checklist](#creating-a-new-app-in-this-monorepo)). Same repo, shared `workspace:*` links. |
| **Publish `@exxat-ds/ui` to a registry** | **Anyone** with install access (public npm or private/GitHub Packages) | In `packages/ui`: clear **`"private": true`** when you are ready, bump **`version`**, then **`pnpm publish`** (usually from CI with an npm token). Consumers run `pnpm add @exxat-ds/ui` and follow the [import / CSS / Next.js](#using-exxat-dsui-in-the-new-app) notes in this README. |
| **Install from Git (no npm org yet)** | Internal pilots | Point `dependencies` at this repo’s **`packages/ui`** path using your package manager’s **git + subdirectory** syntax (see [pnpm `git` dependencies](https://pnpm.io/git)). Example shape: `git+https://github.com/ExxatDesign/Exxat-DS-Workspace.git` with a **`path:`** to `packages/ui`—confirm the exact field with the current pnpm version. |
| **Template / starter** | New teams, fast onboarding | Maintain a **template repository** (or branch) that is “monorepo + one app + docs” so `gh repo create --template` gives a working install in one step. |

**Publish `@exxat-ds/ui` to npm (implemented in this repo):**

1. On npmjs.com, ensure the **`@exxat-ds` scope** exists and your automation token can **publish** to it (org settings / granular token).
2. In GitHub (**repo → Settings → Secrets and variables → Actions**), add **`NPM_TOKEN`** with that publish token.
3. On `main`, bump **`"version"`** in [`packages/ui/package.json`](packages/ui/package.json) (e.g. `0.0.2`) and merge.
4. Create and push a git tag **`ui-v<version>`** that matches that file exactly, e.g.:
   ```bash
   git tag ui-v0.0.2
   git push origin ui-v0.0.2
   ```
5. The workflow [`.github/workflows/publish-ui.yml`](.github/workflows/publish-ui.yml) runs and runs **`pnpm --filter @exxat-ds/ui publish`**. Consumers can then:
   ```bash
   pnpm add @exxat-ds/ui
   ```
   (They get **one package** in `node_modules`—no shadcn-style copy of every source file into their app.)

**Still recommended:** document **peer deps**, **CHANGELOG**, and a short **consumer** snippet (`pnpm add`, CSS import, `transpilePackages` for Next.js)—see [Using `@exxat-ds/ui` in the new app](#using-exxat-dsui-in-the-new-app).

---

## Key Patterns

| Pattern | Where | Description |
|---------|-------|-------------|
| **Data tables** | `apps/web/components/data-table/` | `DataTable` + search + filters + `TablePropertiesDrawer` |
| **List pages** | `apps/web/components/` | `ListPageTemplate` with view tabs (table/list/board/dashboard) |
| **Board cards** | `packages/ui` + `apps/web` | `ListPageBoardCard` + `ListHubStatusBadge` |
| **Charts** | `apps/web/components/` | `ChartCard` + `ChartFigure` with keyboard navigation |
| **Notifications** | — | Banners + inline status (**no toasts**) |
| **Navigation** | `apps/web/components/` | `CommandMenu` (⌘K) + Ask Leo sidebar (⌘⌥K) |

See [`apps/web/AGENTS.md`](apps/web/AGENTS.md) for the full pattern reference.

---

## AI / Cursor Integration

This repo ships with rules, skills, and guidelines for AI-assisted development:

- **`.cursor/rules/`** — 11 auto-applied rules covering data tables, board cards, accessibility, keyboard shortcuts, toasts, navigation, and more.
- **`.cursor/skills/`** — Skills for the full DS guide (duplicate of `.claude`), accessibility audits, board card patterns, and shadcn.
- **`.claude/skills/`** — Same DS guide, board cards, and shadcn integration (keep in sync with `.cursor/skills/exxat-ds-skill/`).
- **`AGENTS.md`** — Top-level AI handbook pointing to `apps/web/AGENTS.md`.
- **[`apps/web/AGENTS.md`](apps/web/AGENTS.md)** — Authoritative reference: MUST/MUST NOT rules, component checklist, list page patterns, chart patterns, page vs drawer, and more.
- **New workspace apps** — [Creating a new app in this monorepo](#creating-a-new-app-in-this-monorepo) (checklist + “For AI assistants” contract).

When any contributor opens this repo in Cursor, the rules activate automatically.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `command not found: pnpm` | Run `corepack enable` (Node ≥ 16) or `npm i -g pnpm` |
| Wrong Node version | Run `nvm use` (reads `.nvmrc`) |
| Stale dependencies | Delete `node_modules` in root + all workspaces: `pnpm store prune && rm -rf node_modules apps/*/node_modules packages/*/node_modules && pnpm install` |
| Port 3000 in use | `pnpm --filter @exxat-ds/web dev:3001` |
| Turborepo cache stale | `rm -rf .turbo && pnpm build` |
| "Module not found" for `@exxat-ds/ui` | Run `pnpm install` from the workspace root |
| `ERR_PNPM_PEER_DEP_ISSUES` | Already handled — `.npmrc` has `strict-peer-dependencies=false` |
