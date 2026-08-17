# KPI cards + grouped strip (`KeyMetrics`)

> **Component:** `packages/ui/src/components/ui/key-metrics.tsx` — `variant`, `size`.  
> **Tokens:** `globals.css` — `--key-metrics-*` (glow tokens are **`none`**).  
> **Cursor:** `.cursor/rules/exxat-kpi-flat-band.mdc` · `.cursor/skills/exxat-kpi/SKILL.md`  
> **Related:** `docs/kpi-strip-max-four-pattern.md`, `docs/kpi-trend-pattern.md`

## Intent

List hubs use **`KeyMetrics variant="cards" size="sm"`**.  
**`variant="flat"`** is only for a **grouped** KPI strip (one hairline band). Flat has the **same MetricItem features** as cards: size, alert, chart (`md`/`lg`), click.

## MUST

1. **Hubs** — `variant="cards"` + `size="sm"` + `showHeader={false}`.
2. **Dashboard key-metrics tile** — `variant="card"` + `size="md"` (default) inside the Data-tab canvas.
3. **Grouped strip** — `variant="flat"` when KPIs must read as one band (not separate cards). Prefer `metricsSingleRow`.
4. **Feature parity** — `chart`, `alert`, `progress`, `href` / `onClick` work on both `cards` and `flat` (including compact charts on `sm`).
5. **No glow** — do not reintroduce KPI glow washes.
6. **Cap at four tiles** — See **`docs/kpi-strip-max-four-pattern.md`**.

## MUST NOT

- Use glow under KPI strips or KPI cards.
- Use `flat` as the default list-hub strip when `cards` is required.
- Embed pie / donut / radar / legends / axes inside KeyMetrics.
- Ship a fifth strip KPI.

## Tokens (`globals.css`)

| Token | Role |
|--------|------|
| `--key-metrics-flat-band-radial` | **`none`** (legacy references stay safe) |
| `--key-metrics-card-glow-radial` | **`none`** |
| `--key-metrics-flat-divider` | Hairlines for `flat` / strip cells |
| `--key-metrics-flat-cell-bg` | **`transparent`** |

## References

- Library hub: `library-client.tsx`
- Admin / One hubs: `admin-hub-client.tsx`, `one-hub-client.tsx`
- Catalog preview: `catalog-live-previews.tsx`
