# Exxat DS workspace

This is a **pnpm monorepo** with the following structure:

- **`packages/ui`** — shared design system (`@exxat-ds/ui`): UI components, hooks, utilities, design tokens
- **`apps/web`** — main Next.js application (formerly `exxat-ds/`)

**Authoritative handbook (read this for Cursor / AI / contributors):** [apps/web/AGENTS.md](apps/web/AGENTS.md)

**Adding another workspace app:** follow [README.md — Creating a new app in this monorepo](README.md#creating-a-new-app-in-this-monorepo) (clone → root `pnpm install` → `apps/<name>` + `package.json` → root `pnpm install` again).

Repo-level Cursor rules in **`.cursor/rules/`** (`exxat-data-tables`, `exxat-list-page-connected-views`, `exxat-table-properties-drawer`, `exxat-board-cards`, `exxat-page-vs-drawer`, `exxat-no-toast`, `exxat-kbd-shortcuts`, `exxat-accessibility`, `exxat-ds-agents`) apply workspace-wide and are referenced from that handbook.
