# audit-server — exhaustive, parallel, auto-fixing review with a live dashboard

A background agent that crawls every route of a product, finds all WCAG + DS
gaps, fixes them with **headless Claude Code (Opus 4.8)**, and shows the whole
thing on a **live dashboard** — in a separate tab, never interrupting your work.

It complements the in-app `DevReviewHUD` (which reviews the single page you're on
via the `review-bridge`). This one sweeps the *whole app*.

## Run

```bash
# Playwright + chromium live here, so run from this dir's deps
node tools/visual-check/audit-server.mjs
# open the dashboard (separate tab):
open http://127.0.0.1:7332
```

Make sure the product's dev server is running (e.g. assessment-taker on :5174),
and — for fixes — keep it running so Vite HMR reloads as Opus edits files.

On the dashboard:
- **Start audit** — detect-only: crawl every route, screenshot each, list
  WCAG (with code) + DS issues (with component · which DS).
- Tick **auto-fix with Opus 4.8** before Start — each issue streams
  `Opus fixing… → fixed ✓ / already ok / failed`, and each route gets a
  **before → after** screenshot.

It also captures a **DS reference screenshot from localhost:4000** (if running).

## What you see live

- Header totals: scanned · found · fixed · already-ok · failed.
- One card per route: before (and after) screenshot + every issue with its
  code/selector and a live status chip.
- `already ok` = Opus located the source and correctly judged the finding a
  false positive (e.g. the `<h1>` already exists) — not a failure.

## Architecture

```
Dashboard (browser, SSE)  ──/start──▶  audit-server (:7332)
        ▲                                   │ Playwright crawl per route
        └────────── SSE /events ────────────┤ axe-core + in-DOM DS scan + screenshots
                                            │ localhost:4000 DS reference shot
                                            └ claude -p --model claude-opus-4-8  (per issue)
```

- Routes per product are in the `PRODUCTS` manifest at the top of
  `audit-server.mjs` — add an entry for each app you want auditable.
- Fixes apply to your **current git branch** (reversible). Sequential per route;
  4-min timeout per issue.

Env: `AUDIT_PORT` (7332), `AUDIT_BASE` (http://localhost:5174),
`AUDIT_MODEL` (claude-opus-4-8), `DS_VIEWER` (http://localhost:4000).

## Local-only

Both this and the `review-bridge` are local dev tools. The in-app HUD is stripped
from every production build (`import.meta.env.DEV` gate, verified 0 refs in
`dist/`). These servers are never deployed.

## Safety

Auto-fix edits source files unattended. Work on a feature branch so a full-app
run is easy to review (`git diff`) and revert. Start with a detect-only run, then
auto-fix once the findings look right.
