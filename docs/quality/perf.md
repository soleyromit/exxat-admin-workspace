# Performance Budgets — Quality Layer

> L4 (Quality Gates) layer of DESIGN.md. Per-app-type budgets for Core Web Vitals, bundle size, and runtime performance. Binds DESIGN.md §4 PERF-001..006.

---

## Per-app-type targets

Three app types in the workspace have distinct performance contexts:

| App type | Audience context | Network assumption | Device assumption |
|---|---|---|---|
| **Admin** (Next.js, port 3001/3003/3005/...) | Faculty/admin in office | Broadband | Modern desktop |
| **Student** (Next.js, port 3002/3004/...) | Students on campus / mobile | Mixed (cellular spikes) | Mid-range mobile + desktop |
| **Assessment Taker** (Vite, port 5174) | Students mid-exam, possibly proctored | Stable required for exam delivery | Lab/proctor-set machines + own laptops |

Budgets reflect those contexts.

## Core Web Vitals (PERF-001)

Targets at p75 of real-user metrics:

| Metric | Admin | Student | Assessment Taker |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | ≤ 2.5s | ≤ 1.5s (exam start must be fast) |
| **INP** (Interaction to Next Paint) | ≤ 200ms | ≤ 200ms | ≤ 100ms (every click during exam matters) |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.1 | ≤ 0.05 (zero-tolerance — students mid-exam) |

Lighthouse runs in CI per PR (see `.github/workflows/lighthouse.yml` — when wired).

## Bundle size (PERF-002)

Initial JS bundle (uncompressed, after tree-shake):

| App type | Budget | Hard limit |
|---|---|---|
| Admin | ≤ 250 KB | 350 KB |
| Student | ≤ 200 KB | 280 KB |
| Assessment Taker | ≤ 150 KB | 220 KB |

Routes can lazy-load chunks beyond initial bundle. Use `next/dynamic` (admin/student) or React.lazy (assessment-taker).

Measurement: `pnpm build` then sum the `_app` chunk + first-route chunk.

## Image rendering (PERF-003)

| Rule | What |
|---|---|
| Use `next/image` for layout-impacting images (admin/student) | Auto WebP, lazy-load, dimension reservation prevents CLS |
| Raw `<img>` only for decorative + tiny (e.g., logo) | Or images that don't trigger CLS |
| Assessment-taker: lazy-load image-heavy questions | Hotspot question images load on question entry, not exam start |

## Font loading (PERF-004)

Per workspace CLAUDE.md font-loading section:
- Admin: Typekit `wuk5wqn.css` + Font Awesome `d9bd5774e0.js` — loaded async in `<head>`
- Student: Typekit `kmo8bbz.css` + Font Awesome `bff072b36d.css` — loaded via studentUX/src/styles/globals.css

Don't double-import. Don't add new font sources without an ADR (the typography system is one of the load-bearing visual identities).

## Server components default (PERF-005)

Per Next.js App Router conventions:
- Default to RSC (server components) for static + data-fetching surfaces
- `'use client'` only when interactivity, browser APIs, or React hooks are needed
- Push the client boundary as deep into the tree as possible

This is documented architecture; enforcement is at code review.

## Sub-bundle hot-paths (PERF-006)

Surfaces with strict perf requirements:
- Assessment Taker exam delivery: must ship < 100KB to first paint
- Student mobile evaluation form: must ship < 60KB to first paint
- Module launcher (Prism shell): must load each tile-status endpoint in <500ms

## Measurement + governance

- **CI:** Lighthouse runs per PR (workflow at `.github/workflows/lighthouse.yml`). Fails on regression > 5pts in any CWV metric.
- **Monthly:** review real-user metrics from Vercel Analytics (when wired) or Web Vitals reporting endpoint.
- **Quarterly:** review against budgets; raise budgets only if user research justifies the cost.

## Anti-patterns

- ❌ Importing the full Recharts/D3 bundle when only one chart is used → tree-shake or lazy-load
- ❌ Loading every locale's messages upfront → split per locale (see i18n.md)
- ❌ Inline base64 images > 4KB → host as static file
- ❌ Synchronous third-party scripts (analytics, ads) in `<head>` → async or defer
- ❌ Non-`next/image` for above-the-fold imagery → CLS risk

## Rules summary (DESIGN.md §4 PERF)

| ID | Rule | Gate |
|---|---|---|
| PERF-001 | Core Web Vitals budgets per app type | Lighthouse CI |
| PERF-002 | Initial bundle size budget | CI bundle-size check |
| PERF-003 | next/image for layout-impacting imagery | Code review + lint |
| PERF-004 | Font loading via documented Typekit + FA references; no new sources without ADR | Code review |
| PERF-005 | Server components by default; `'use client'` opt-in | Code review |
| PERF-006 | Hot-path sub-bundle budgets (Assessment Taker exam, mobile eval, module launcher) | Per-app build report |
