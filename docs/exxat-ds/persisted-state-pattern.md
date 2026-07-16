# Persisted state pattern

> Where it lives: `@exxatdesignux/ui/lib/persisted-state` and
> `@exxatdesignux/ui/lib/table-state-lifecycle` (lifted in v0.5.18).
> Storage is **localStorage**, **device-local**, **SSR-safe**, **debounced
> 400ms**, and **namespaced** under `exxat-ds:` so every DS-owned key is
> greppable in DevTools.

## What gets persisted (the inventory)

| Slice | Where | Key shape |
|---|---|---|
| **Per hub × per view tab (table lifecycle)** | | |
| Sort rules | `<HubTable persistKey>` | `exxat-ds:<key>:lifecycle:v1:<tabId>` |
| Active filters + AND/OR connectors | same | same |
| Group-by column | same | same |
| Column order, hidden, widths, pins, wrap | same | same |
| Column-menu search strings | same | same |
| Row height (compact / cozy / comfortable) | same | same |
| Show gridlines | same | same |
| Search-bar open, filter-bar visible | same | same |
| Conditional rules | same (via `extras`) | same |
| Pagination on/off + page + page size | same (via `extras`) | same |
| **Per hub (page level)** | | |
| View tabs (id, label, type, icon, filterId) | `<ListPageTemplate persistKey>` | `exxat-ds:<key>:listpage:tabs:v1` |
| Active tab id | same | `exxat-ds:<key>:listpage:active-tab:v1` |
| **Shell / global** | | |
| Sidebar collapsed | `<SidebarProvider>` | cookie `sidebar_state_v2` (kept — SSR cookie initial render) |
| App theme: brand / contrast / text-size | `useAppTheme()` | `exxat-ds:exxat-brand`, `exxat-ds:exxat-contrast`, `exxat-ds:exxat-text-size` |
| Coach-mark dismissed | `useCoachMark()` | `exxat-ds:coach-mark:<flowId>` |

> **Migration path:** existing scattered storage helpers (`useAppTheme`,
> `useCoachMark`, dashboard layout, dedicated-search recents, banner
> dismissals) keep their current keys for back-compat but should be
> re-routed through `getStorageItem` / `scheduleStorageWrite` from
> `lib/persisted-state` so quota guards and debounce live in one place.
> Tracked separately — not a v0.5.18 hard requirement.

## The two layers

### 1. Low-level — `usePersistedState` and storage helpers

```tsx
import {
  usePersistedState,
  getStorageItem,
  setStorageItem,
  scheduleStorageWrite,
  clearAllPersistedState,
  listPersistedKeys,
  EXXAT_STORAGE_PREFIX,           // "exxat-ds:"
} from "@exxatdesignux/ui"

// Drop-in useState replacement.
const [collapsed, setCollapsed] = usePersistedState("nav:collapsed", false)

// One-shot writes (no debounce overhead).
const [theme, setTheme] = usePersistedState("theme", "light", { debounceMs: 0 })

// Schema versioning for future shape changes.
const [columns, setColumns] = usePersistedState("hub:columns", DEFAULTS, {
  version: 2,
  migrate: (raw, fromVersion) => migrateV1ToV2(raw),
})

// Settings → "Reset preferences"
clearAllPersistedState()
```

#### When to use which

| Situation | Use |
|---|---|
| Component-local state that should survive reloads | `usePersistedState` |
| Imperative read on mount before any state | `getStorageItem` |
| Queue writes outside React (e.g. `beforeunload`) | `scheduleStorageWrite` + `flushPendingStorageWrites()` |
| Cross-tab listener for a custom key | `subscribeToStorageKey` |
| Settings UI that lists or wipes user prefs | `listPersistedKeys`, `clearAllPersistedState` |

### 2. High-level — `<HubTable persistKey>` / `<ListPageTemplate persistKey>`

```tsx
// All in.
<ListPageTemplate
  defaultTabs={DEFAULT_TABS}
  persistKey="library"
  renderContent={(tab, updateTab) => (
    <HubTable<LibraryItem>
      rows={rows}
      columns={columns}
      view={tab.viewType}
      onViewChange={(v) => updateTab({ viewType: v })}
      hubLabel="Library"
      persistKey="library"
      persistTabId={tab.id}
    />
  )}
/>
```

The two `persistKey` props **can be the same string** — they write to
distinct sub-keys (`<key>:lifecycle:v1:<tabId>` vs
`<key>:listpage:tabs:v1`).

#### Multiple consumers, same component

`LibraryTable` is reused by both Library (`library-client.tsx`) and the
Columns showcase (`columns-showcase.tsx`). They MUST use **distinct**
`persistKey` values:

| Consumer | `persistKey` |
|---|---|
| `library-client.tsx` (main) | `"library"` |
| `library-client.tsx` (search-landing route) | `"library:search"` |
| `columns-showcase.tsx` | `"columns-showcase"` |
| `tokens-themes-client.tsx` | `"tokens"` |

Same key = same storage slot = users see one hub's columns leaking into
the other.

#### Controlled tabs disable `persistKey`

`ListPageTemplate` **ignores** `persistKey` when the parent passes controlled tab props (`tabs`, `onTabsChange`, `activeTabId`, `onActiveTabChange`). If view tabs should survive reload, use **uncontrolled** tabs with **`persistKey`** only — or **`productPersistKey(product, hubKey)`** in multi-product apps.

```tsx
// ✅ View tabs persist on reload
<ListPageTemplate persistKey={productPersistKey(product, "tokens")} ... />

// ⛔ persistKey is ignored — tabs reset every reload
const [tabs, setTabs] = useState(DEFAULT_TABS)
<ListPageTemplate tabs={tabs} onTabsChange={setTabs} persistKey="tokens" ... />
```

Reference fix: `tokens-themes-client.tsx` (removed controlled tab state).

#### Multiple products, same hub key — namespace under the active product

Exxat ships four apps (Prism, One — Schools, One — Sites, Custom — see
[`multi-product-routing-pattern.md`](./multi-product-routing-pattern.md)).
A hub that exists in more than one product (e.g. a Library in Prism, in
One — Schools, and in Custom) MUST namespace its `persistKey` under the
active product so filters, column layout, and conditional rules don't
leak across apps:

```tsx
import { productPersistKey } from "@/stores/app-store"
import { useProduct } from "@/contexts/product-context"

const { product } = useProduct()

<HubTable
  persistKey={productPersistKey(product, "library")}
  // → "prism:library"      when product === "exxat-prism"
  // → "one-schools:library" when product === "exxat-one-schools"
/>
```

`productPersistKey` lives in
[`apps/web/stores/app-store.ts`](../stores/app-store.ts) — the `Product`
union is an app-domain concept (different consumer apps can have different
unions), so the typed helper sits next to the union, not in the UI package.
The localStorage key the persistence layer writes ends up
`exxat-ds:prism:library` (DS prefix from `namespacedKey()` + product slug
+ hub key — three levels, leaf is the hub).

The full rule is in
[`.cursor/rules/exxat-product-routing.mdc`](../../../.cursor/rules/exxat-product-routing.mdc)
(rule 4). State is preserved **within a product** across product switches;
state never crosses products.

The only `persistKey` values that legally stay unnamespaced are the
**shell-global** entries already listed in the inventory at the top of
this doc (theme, sidebar collapsed, coach-mark dismissals) — those belong
to the user, not to a product. **DS demo routes** (`/columns`,
`/tokens-themes`) also use unnamespaced keys (`"columns-showcase"`,
`"tokens"`) per the routing rule's "When this rule does not apply"
exception — they're development surfaces, not product hubs.

## Behaviour rules

1. **SSR-safe.** All reads and writes are guarded by `typeof window`. On
   the server, `usePersistedState(key, default)` simply returns `default`
   and the value re-hydrates on first paint via `useLayoutEffect`. No
   hydration mismatch.
2. **Debounced 400ms by default.** Column resize fires per pixel;
   `usePersistedState` collapses repeated writes to the same key. For
   one-shot toggles (theme switch, sidebar collapsed) pass
   `debounceMs: 0`.
3. **Quota safe.** `setItem` throws in private mode / when quota is full
   / when storage is disabled. The wrapper swallows the error so the
   in-memory state still works; the value just won't survive a refresh.
4. **Cross-tab sync.** Default `syncAcrossTabs: true` listens for the
   browser `storage` event. Two tabs of the same hub stay aligned on
   filter / sort / column changes.
5. **Schema versioning.** Bump `version` when the shape of `T` changes;
   provide `migrate(raw, fromVersion)` to convert old payloads. If
   migration returns `undefined`, the persisted record is dropped and
   `defaultValue` applies.
6. **Disabled at runtime.** Pass `key = ""` (empty string) and the hook
   degrades to plain `useState` — useful when a parent prop conditionally
   enables persistence without breaking the rules of hooks.

## What is _not_ persisted (and why)

| Not persisted | Reason |
|---|---|
| Active filters in URL | Different concern — URL is for **shareable** state. Follow-up PR layers URL params on top of the same hooks. |
| Search query in URL | Same. Library already syncs `?q=` separately. |
| Detail-panel open state | Already encoded in the URL via row id. |
| Per-user server-side preferences | Needs an API. Out of scope for v0.5.18. |
| Real-time multi-tab UI mirroring | The `storage` event fires, but no surface re-mirrors selection / scroll position yet. Add only when there's a real flow that needs it. |

## Migration to the new primitive (existing storage helpers)

Existing localStorage callers should move from raw `localStorage` to
`getStorageItem` / `scheduleStorageWrite` over time so quota errors and
namespace prefixing stop being per-file concerns. The keys stay the same
(prefix already matches `exxat-ds:`), so this is a refactor with no
user-visible change.

| Today | Target |
|---|---|
| `localStorage.getItem(\`exxat-ds:exxat-brand\`)` (in `useAppTheme`) | `getStorageItem("exxat-brand", "local")` |
| `localStorage.setItem(\`exxat-ds:coach-mark:${id}\`, "dismissed")` (in `useCoachMark`) | `setStorageItem(\`coach-mark:${id}\`, "dismissed")` |
| `apps/web/lib/data-view-dashboard-storage.ts` | wrap with `usePersistedState` |
| `apps/web/lib/dedicated-search-recents.ts` | wrap with `usePersistedState` |
| `apps/web/components/dashboard-promo-banner.tsx` etc. | `usePersistedState("banner:<id>:dismissed", false, { debounceMs: 0 })` |

Tracked as a follow-up; not blocking v0.5.18.

## See also

- `.cursor/rules/exxat-persisted-state.mdc` — binding rule + checklist
- `.cursor/rules/exxat-product-routing.mdc` — product-namespaced `persistKey` rule
- `apps/web/docs/multi-product-routing-pattern.md` — four-app routing model
- `apps/web/docs/migrations/0004-persisted-state-lift.md`
- `apps/web/docs/data-views-pattern.md` — table state architecture
- `packages/ui/src/lib/persisted-state.ts` — implementation
- `packages/ui/src/lib/table-state-lifecycle.ts` — implementation
