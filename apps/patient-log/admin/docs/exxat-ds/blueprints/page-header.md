# Blueprint: Page Header

> **Status:** Stable. **Owner:** Exxat DS core. **Implements:** WCAG 2.1 AA.

## 1. Intent

A page header **names the route** the user is on, communicates **freshness**
of the underlying data, and gives the user the **primary action** for that
route (and any secondary actions behind a `⋯` overflow). It is the visual
anchor of every primary hub.

**Use when:**
- The user lands on a primary nav destination (Placements, Team, Question
  bank, Compliance, Settings, Dashboard).
- The user opens a detail/record view that should advertise its own identity
  (placement record, question detail).

**Do NOT use when:**
- The surface is already inside a hub's view body (sub-sections never get
  their own page header — they get a `DashboardSectionHeading` or similar).
- The surface is an overlay (drawer / dialog / sheet) — those use their own
  `*Title` slots.

## 2. Anatomy

```
┌──────────────────────────────────────────────────────────────────────┐
│ [icon]  Title                              [face-rail] [primary] [⋯] │  ← title-row (required)
│         Subtitle · ID · count · freshness                            │  ← meta       (optional)
└──────────────────────────────────────────────────────────────────────┘
```

| Slot | Required? | What it carries |
|---|---|---|
| `icon` | optional | Product mark (`ExxatProductLogo`) or FA glyph |
| `title` | **required** | One H1 — the route name (e.g. "Placements") |
| `subtitle` | optional | One line: short context, ID, count, freshness |
| `face-rail` | optional | `+N collaborators` stack (variant `collaboration`) |
| `actions/primary` | optional | One filled `Button` (e.g. "New placement") |
| `actions/overflow` | optional | One outline icon `Button` opening a dropdown menu |
| `breadcrumb` | optional | Above title; never alongside it |

The header **never** carries search, filters, view-tabs, or KPIs — those belong
to `ListPageTemplate` / `KeyMetrics` / `DataTable`. The header is the route
identity, nothing more.

## 3. States

| State | Visual / behavior |
|---|---|
| Default | Title + subtitle + actions; primary CTA filled. |
| Collaboration empty | Outline "Add collaborator" replaces face rail. |
| Collaboration populated | Face rail with `+N` opens `InviteCollaboratorsDrawer`. |
| Loading | Title skeleton (60% width), meta skeleton (30% width). |
| Error | The header still renders; errors land in the body's `LocalBanner`. |
| RTL | Slots mirror; FA glyphs auto-mirror via Tailwind's `rtl:`. |

## 4. Tokens consumed

| Token | Used for |
|---|---|
| `--background` / `--foreground` | Surface + ink |
| `--muted-foreground` | Subtitle / meta line |
| `--brand-color` | Product mark fills (when icon is a product logo) |
| `--ring` | Focus ring on actions + face rail buttons |
| `--font-heading` | Title font family (Ivy Presto) — **not** body Inter |
| `--text-xs` | Meta line at min 11px (SC 1.4.3) |
| `--radius-md` | Action button corners |

For monospace IDs in the subtitle, see
[`exxat-mono-ids.mdc`](../../../.cursor/rules/exxat-mono-ids.mdc): only the
ID token gets `font-mono tabular-nums`, the rest of the line stays sans.

## 5. Accessibility

| WCAG SC | How this blueprint complies |
|---|---|
| 1.1.1 Non-text content | Product icon decorative (Case A — title sits beside it). If a header icon must stand alone, follow Case B (label + tooltip). |
| 1.3.1 Info & relationships | Title is exactly one `<h1>` — every route has one and only one. |
| 1.4.3 Contrast (text) | `--muted-foreground` is ≥ 5.5:1 on `--background`. |
| 2.1.1 Keyboard | Tab order: breadcrumb → title link (if any) → face rail → primary → overflow trigger. |
| 2.4.6 Headings / labels | Title strings match `<title>` (document title) where they describe the same route. |
| 2.4.11 Focus visible | All interactive slots inherit `:focus-visible` ring from `--ring`. |

## 6. Variants

| Variant | When to use | Differences |
|---|---|---|
| `base` | Default — most routes | Title + actions only |
| `object-home` | Lists / hubs with optional metrics + tabs **below** the header | Adds a count/freshness slot under the title |
| `record-home` | Detail / record views | May expose a small detail row (label/value pairs) — keep ≤ 5 pairs |
| `collaboration` | Shared hubs (Library, future) | Adds face rail + invite entry — see [`exxat-collaboration-access.mdc`](../../../.cursor/rules/exxat-collaboration-access.mdc) |

Pick **one** variant per header. Combining `collaboration` with
`record-home` is allowed only when the record itself is a shareable
artifact (e.g. a question).

## 7. Implementation

| Framework | Component(s) | File |
|---|---|---|
| **React (this app)** | `PageHeader` (shell) + per-hub headers (composition) | [`apps/web/components/page-header.tsx`](../../components/page-header.tsx), [`apps/web/components/library-page-header.tsx`](../../components/library-page-header.tsx) |
| Mobile | — | — |
| Figma | — | — |

Reference hub-level compositions:

- **Placements** — filled primary CTA `New placement` + `⋯` (Export, Customize…)
- **Team** — same shape, count + freshness in subtitle
- **Library** — `variant="collaboration"` + folder-scoped customize entry

## 8. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Render exactly one `<h1>` per route | Render two H1s (e.g. one in header + one in body) |
| Put the primary CTA inside the header — filled, often `size="lg"` | Use `variant="outline"` for the sole primary action on an exportable page |
| Put **Export** under `⋯` → `ExportDrawer` | Put Export as a second primary button beside New |
| Use `ExxatProductLogo` for product marks | Substitute a logo.dev raster for the product mark |
| Keep subtitle to **one line**; truncate long meta | Stack two meta lines below the title |
| Show keyboard shortcuts via `Kbd` in tooltips on primary/overflow | Hard-code shortcut hints in the visible button label |

## 9. References

- [`apps/web/docs/data-views-pattern.md`](../data-views-pattern.md) — `PageHeader` in context of `ListPageTemplate`
- [`apps/web/docs/collaboration-access-pattern.md`](../collaboration-access-pattern.md) — `variant="collaboration"`
- [`apps/web/docs/library-hub-header-pattern.md`](../library-hub-header-pattern.md) — folder-scoped header
- [`.cursor/rules/exxat-collaboration-access.mdc`](../../../.cursor/rules/exxat-collaboration-access.mdc)
- [`.cursor/rules/exxat-mono-ids.mdc`](../../../.cursor/rules/exxat-mono-ids.mdc)
- [`apps/web/AGENTS.md`](../../AGENTS.md) §4.7, §6.2, §9
