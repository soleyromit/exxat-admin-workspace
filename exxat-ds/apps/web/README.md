# @exxat-ds/web

Main Next.js application for the Exxat Design System — part of the [Exxat DS Workspace](../../README.md) monorepo.

## AI / Contributors

- **Handbook:** [`AGENTS.md`](./AGENTS.md) — MUST/MUST NOT rules, list pages, accessibility, checklist.
- **Cursor rules:** [`../../.cursor/rules/`](../../.cursor/rules/) — data tables, list-page views, table properties, keyboard hints, accessibility.
- **Claude skill:** [`.claude/skills/exxat-ds-skill/SKILL.md`](./.claude/skills/exxat-ds-skill/SKILL.md) — patterns for this codebase.

## Development

Run from the **workspace root** (not this directory):

```bash
# Install all workspace dependencies
pnpm install

# Start the dev server (Next.js + Turbopack)
pnpm dev
```

Open **http://localhost:3000**. Alternative ports:

```bash
pnpm --filter @exxat-ds/web dev:3001
pnpm --filter @exxat-ds/web dev:3005
```

### PM2 (keep dev server running)

```bash
pnpm --filter @exxat-ds/web dev:daemon        # start
pnpm --filter @exxat-ds/web dev:daemon:logs    # tail logs
pnpm --filter @exxat-ds/web dev:daemon:stop    # stop
pnpm --filter @exxat-ds/web dev:daemon:delete  # remove from PM2
```

Config: [`ecosystem.config.cjs`](./ecosystem.config.cjs).

## Importing from the shared UI package

```tsx
import { Button } from "@exxat-ds/ui/components/button.tsx"
import { useAppTheme } from "@exxat-ds/ui/hooks/use-app-theme.ts"
import { cn } from "@exxat-ds/ui/lib/utils.ts"
```

The `@exxat-ds/ui` package is linked via pnpm workspace — changes to `packages/ui` are reflected instantly during dev.

## Adding components (shadcn)

```bash
cd apps/web
npx shadcn@latest add button
```

Components land in `packages/ui/src/components/ui/` (configured in `components.json`).
