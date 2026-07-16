---
description: Exxat DS — every route + persisted-state slot lives under exactly one product. Four products (Prism, One Schools, One Sites, Custom — Prism IA with tenant branding); Exxat One is two siblings, not one. URL = subpath per product; switching = hard redirect to /<root>/dashboard; persistKey is product-namespaced.
activation: always_on
---

<!-- Synced from .agents/rules/exxat-product-routing.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — multi-product routing & state isolation

**Authoritative narrative:** [`docs/exxat-ds/multi-product-routing-pattern.md`](mdc:docs/exxat-ds/multi-product-routing-pattern.md).

Exxat ships **four apps** under one shell:

| Switcher entry | Product id | URL root | Scope chrome | Primary persona |
|---|---|---|---|---|
| Exxat Prism | `exxat-prism` | `/prism` | School > Program | DCE / Placement Coordinator |
| Exxat One — Schools | `exxat-one-schools` | `/one-schools` | School > Program | DCE (school side) |
| Exxat One — Sites | `exxat-one-sites` | `/one-sites` | Brand > Site > Location | Site Coordinator |
| Exxat Custom (tenant-branded Prism) | `exxat-custom` | `/custom` | School > Program | Same as Prism — tenant-configured branding only |

Exxat One is **two product entries**, not one with a sub-toggle — School-side
and Site-side have different navs, different scope chromes, and different
primary personas, so the routing layer treats them as siblings. **Custom** is
a tenant-configurable fourth entry that inherits Prism's IA wholesale (same
routes, same nav, school > program scope) and only differs in chrome — the
brand colour + wordmark suffix are configured per workspace in Settings →
Appearance → Add product.

## MUST

1. **Every product-owned route lives under that product's URL root.**
   Hubs, detail pages, settings, search-landing pages, etc. all sit under
   `/prism/...`, `/one-schools/...`, `/one-sites/...`, or `/custom/...`. The only routes
   allowed at the workspace root are **product-agnostic shell routes**
   (e.g. `/login`, `/logout`, `/oauth/*`, `/`).
2. **Switching products in the switcher MUST hard-redirect to `/<root>/dashboard`.**
   Use `react-router-dom`'s `navigate(target)` (not `replace: true`, so the
   user can `Back` to where they were). No semantic mapping; no "stay on
   the same path"; no confirm dialog.
3. **Direct URL visits adopt the product implied by the URL.** When the
   user lands on `/one-sites/locations/loc_42` while the store says
   `exxat-prism`, the route layer MUST call `setProduct("exxat-one-sites")`
   so the theme class, scope chrome, and persona context all align with
   the URL. The URL is the source of truth; the switcher follows.
4. **`persistKey` MUST be product-namespaced** for any state that belongs to
   a product (hub filters, table column layout, dashboard layout, dedicated
   search recents, etc.). Compose with the helper, not by hand:

   ```tsx
   import { productPersistKey } from "@/stores/app-store"

   <HubTable persistKey={productPersistKey(product, "library")} />
   //  → "prism:library"      when product === "exxat-prism"
   //  → "one-sites:library"  when product === "exxat-one-sites"
   //  → "custom:library"     when product === "exxat-custom"
   ```

   The helper lives in `stores/app-store.ts` (next to the
   `Product` union). The full localStorage key after the DS prefix is
   `exxat-ds:<slug>:<hubKey>`.

5. **Each product registers its own nav** in
   [`lib/mock/navigation.tsx`](mdc:lib/mock/navigation.tsx)
   under `NAV_BY_PRODUCT[productId]`. `AppSidebar` reads `useProduct()` and
   renders the matching tree. When two products share an IA structurally
   the shared structure is expressed by calling the same factory
   (`buildSchoolFamilyPrimary`) with each product's slug, not by sharing
   an array reference — so each product's URLs stay anchored to its own
   root. **Custom** is the canonical example: it calls
   `buildSchoolFamilyPrimary(productSlug("exxat-custom"))` so its hubs
   land under `/custom/*` rather than under `/prism/*`.
6. **Cross-product surfaces** (e.g. a Prism slot offer that lands in a
   One — Sites coordinator's inbox) MUST:
   - Name **both** products in the brief's `Product:` / `Scope:` lines
     (per [`exxat-product-context.md`](mdc:.agents/rules/exxat-product-context.md)).
   - Live in the URL of the **owning** product; the other product appears
     as read-only context with a clearly labelled affordance
     (`View in Exxat One — Sites →`) that triggers a hard product switch.
   - Namespace any `persistKey` under the owning product. Shared
     cross-product state lives server-side, not in `localStorage`.

## MUST NOT

1. **Do NOT ship product routes at the workspace root.** No `/library`,
   `/placements`, `/dashboard` — those are ambiguous. Always
   `/<product-root>/<route>`.
2. **Do NOT add a sub-switcher inside Exxat One** for School vs Site. The
   four-app model already encodes that as two switcher entries; an
   in-product toggle would create two sources of truth (URL + sub-toggle
   state).
3. **Do NOT introduce nested URL roots like `/one/schools` or `/one/sites`.**
   They imply Exxat One is a single app with sub-modes — it isn't.
   Kebab-case sibling slugs (`/one-schools`, `/one-sites`) make the
   sibling model legible in the URL bar.
4. **Do NOT share an unnamespaced `persistKey` across products** (e.g.
   `persistKey="library"`). Product A's filters will leak into product B.
   The only legal unnamespaced keys are **shell-global** state documented
   in [`persisted-state-pattern.md`](mdc:docs/exxat-ds/persisted-state-pattern.md)
   (theme, sidebar collapsed, coach-mark dismissals).
5. **Do NOT add semantic-mapping logic** that tries to translate a Prism
   route into its One equivalent on switch. The two apps are deliberately
   different; mapping is a wishful abstraction that breaks the moment the
   IAs diverge (which they will).
6. **Do NOT pull the user back to the root after a switch with `replace: true`.**
   The user's previous product page should remain in browser history so
   `Back` returns them there. The store change is the only side effect of
   `navigate()` that they shouldn't be able to undo with `Back`.

## When this rule does not apply

- **Shell routes** (`/login`, `/logout`, `/oauth/*`, `/`, `/settings/profile`
  — anything that exists per *user* not per *product*). These can live at
  the root and don't need a `Product:` declaration in their brief.
- **Component-local UI state** (popover open, hover, focus). `usePersistedState`
  isn't involved; product namespacing isn't either.
- **DS demo / showcase routes** in the `apps/web` workspace itself
  (`/columns-showcase`, `/tokens`, `/dashboard-gallery` while it's still a
  development surface). Once a demo is promoted into a real product hub,
  it adopts the product subpath.

## See also

- [`docs/exxat-ds/multi-product-routing-pattern.md`](mdc:docs/exxat-ds/multi-product-routing-pattern.md) — narrative + diagram + four binding rules
- [`docs/exxat-ds/agent-context/README.md`](mdc:docs/exxat-ds/agent-context/README.md) — product → scope → persona table
- [`.agents/rules/exxat-product-context.md`](mdc:.agents/rules/exxat-product-context.md) — `Product:` / `Scope:` / `Persona:` brief lines
- [`.agents/rules/exxat-persisted-state.md`](mdc:.agents/rules/exxat-persisted-state.md) — `persistKey` rules
- [`components/product-switcher.tsx`](mdc:components/product-switcher.tsx) — runtime entry point
- [`stores/app-store.ts`](mdc:stores/app-store.ts) — `Product` union (four ids)
