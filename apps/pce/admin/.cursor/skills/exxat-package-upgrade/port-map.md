# generated-starter port map (consumer upgrades)

Diff **your app file** ↔ **`node_modules/@exxatdesignux/ui/generated-starter/<same path>`**.

Only port when release notes or a chrome bug require it. **Never** copy mock data or domain hubs wholesale.

## § Product chrome (theme, switcher, settings)

| Path | Why it exists |
|------|----------------|
| `stores/app-store.ts` | Product state, migrations (`STORE_VERSION`), `customProducts[]`, `productBrandColors` guards |
| `contexts/product-context.tsx` | `<html>` theme class + `--custom-product-brand-color` sync |
| `contexts/product-route-sync.tsx` | URL ↔ store product sync |
| `contexts/product-root-gate.tsx` | Dynamic product root segment validation |
| `contexts/default-product-redirect.tsx` | Cold-start default product |
| `lib/product-brand.ts` | `brandForProduct`, custom wordmark vs chrome color |
| `lib/product-routing.ts` | Custom suffix slugs (`/assessment/…`) |
| `lib/product-ref.ts` | `ProductRef`, startup/hidden product helpers |
| `lib/brand-accent-color.ts` | Palette + hue normalization |
| `lib/brand-color-match.ts` | OKLCH/hex equivalence for migrations |
| `components/product-switcher.tsx` | Multi-custom switcher entries |
| `components/product-switch-overlay.tsx` | Switch loading overlay |
| `components/settings-appearance-card.tsx` | Products list + color picker |
| `components/brand-color-picker.tsx` | Brand color popover |
| `components/exxat-product-logo.tsx` | Wordmark (pink) vs preview custom |
| `components/sidebar/app-sidebar.tsx` | Product logo button + nav slug |
| `lib/mock/navigation.tsx` | **Structure only** — keep your URLs/labels; port routing helpers |
| `src/routes.tsx` | Product root routing shape |
| `src/App.tsx` | Provider mount order + overlay |
| `src/pages/settings.tsx` | Breadcrumb href helpers |
| `src/pages/_product-dashboard.tsx` | Per-product dashboard gate |

## § Package wiring (usually low churn)

| Path | Why |
|------|-----|
| `src/styles/globals.css` | `@import "@exxatdesignux/ui/globals.css"` + `@source` |
| `src/main.tsx` | CSS import order |
| `components/ui/*` shims | Re-exports from package (diff when CLI notes new primitives) |
| `package.json` | `engines`, `pnpm.onlyBuiltDependencies`, dev scripts |

## § Do NOT port (content / data)

| Path | Reason |
|------|--------|
| `lib/mock/*.ts` (placements, team, library rows, KPIs) | Tenant/domain data |
| `*-client.tsx` column defs & row actions | Product IA |
| `lib/*-kpi.ts`, hub-specific filters | Business metrics |
| API / server modules | Backend contract |
| `docs/` product copy (except `docs/exxat-ds/` from sync-extras) | Content |
| `.env*` | Secrets |

## § Merge tip

When both sides changed the same file:

1. Take template **imports + types + migration blocks**.
2. Keep app **nav labels, mock imports, hub-specific props**.
3. Run `typecheck` — fix import paths (`./pages/` vs `./views/`).
