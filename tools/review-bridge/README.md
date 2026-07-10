# review-bridge

Local companion server for the in-app **DevReviewHUD**. The browser HUD detects
WCAG + DS issues on whatever page you're on; this bridge spawns **headless
Claude Code (Opus 4.8)** to fix the source, and streams progress back so you
watch the fixes land live via Vite HMR.

**Local-only. Never deploy this.** One bridge serves every product in the monorepo.

## Run

```bash
# from anywhere in the monorepo
node tools/review-bridge/server.mjs
```

Then start any product's dev server (`pnpm dev`). Open a page → the HUD pill
(bottom-right) shows live counts → expand it → **Fix page (N) with Opus 4.8**.
Each issue shows `locating… → Opus fixing… → fixed ✓` with the file it changed.

Env overrides: `REVIEW_BRIDGE_PORT` (7331), `REVIEW_BRIDGE_MODEL` (claude-opus-4-8).

## API

| Method | Path      | Purpose |
|--------|-----------|---------|
| GET    | `/health` | `{ ok, model, root }` — HUD polls this to show the Fix button |
| POST   | `/fix`    | body `{ product, route, issues[] }` → NDJSON stream of `{ phase }` events |

`phase`: `start → (locating, fixing, fixed\|failed)* → done`.

Each issue is fixed sequentially via:
`claude -p "<issue prompt>" --model claude-opus-4-8 --permission-mode acceptEdits --add-dir <root>`
with `cwd` = monorepo root, so Claude has full repo + DS + CLAUDE.md context and
edits the right product's files. Edits apply to your **current git branch**
(reversible). Max 10 issues/request, 4-min timeout per issue.

## Enable the HUD in another product

The HUD is local-dev-only and self-contained (no DS imports). To add it to e.g.
`apps/pce/admin`:

1. `pnpm add -D axe-core` in that product.
2. Copy `apps/exam-management/assessment-taker/src/dev/DevReviewHUD.tsx` into the
   product's `src/dev/` (and `src/vite-env.d.ts` if missing).
3. Mount it once behind the dev gate, e.g. in the root layout / app shell:
   ```tsx
   {import.meta.env.DEV && <DevReviewHUD product="apps/pce/admin" />}
   ```
   The `product` hint tells Claude which app the issue belongs to.

The `import.meta.env.DEV` gate strips the HUD + axe-core from every production
build (verified: 0 refs in `dist/`), and a localhost hostname guard inside the
component keeps it hidden on any exposed/previewed dev server.
