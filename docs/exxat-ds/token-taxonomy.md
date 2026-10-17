# Exxat DS — Token Taxonomy

**Status:** Authoritative · **Audience:** humans + AI agents · **Standard:** WCAG 2.1 AA
**Machine-readable index:** [`packages/ui/tokens/hooks-index.json`](../../packages/ui/tokens/hooks-index.json) (generated)
**Defining file (canonical):** [`packages/ui/src/globals.css`](../../packages/ui/src/globals.css). Consumer apps (`apps/web/src/styles/globals.css`, the `create-exxat-app` starter at `packages/ui/generated-starter/src/styles/globals.css`) are thin shells that `@import "@exxatdesignux/ui/globals.css"` and only declare their own `@source` directive. The dedicated `packages/ui/src/theme.css` file has been **retired** — see [`docs/migrations/0003-globals-css-canonical.md`](./migrations/0003-globals-css-canonical.md).

This document formalizes the **naming, layering, and ownership** of every CSS
custom property the design system ships. It is the answer to "what do I name a
new token?" and "is there already a token for this?". If something here
disagrees with the CSS, the CSS wins — and this file needs an edit.

---

## 1. Layering — where a token lives

Tokens are declared in **four** layers. Higher layers may consume lower ones;
they MUST NOT redefine names from a higher layer with a different meaning.

| Layer | File | Purpose | Edit when |
|---|---|---|---|
| **L0 — Exxat canonical** | `packages/ui/src/globals.css` `:root` (block tagged `Exxat L0 — canonical namespace`) | SLDS-style flat namespace (`--exxat-color-surface-1`, `--exxat-radius-2`, …). The **official** names the DS scales on. Today these are `var()` aliases of L1; the canonical OKLCH will move here over time. | New product surface tokens, broader brand picker, anything you would otherwise put under "L1 with an Exxat brand prefix" |
| **L1 — shadcn semantic** | `packages/ui/src/globals.css` `:root`/`.dark` | OKLCH literals + back-compat vocabulary (`--background`, `--foreground`, `--brand-color`, …). Required for the upstream shadcn primitives in `components/ui/*`. **Frozen** — do not extend; new tokens go to L0. | Brand color changes, accessibility-driven contrast lifts, new chip/chart slot tied to shadcn names |
| **L2 — Tailwind bridge** | `packages/ui/src/globals.css` `@theme inline` block | Maps primitives to `--color-*` and `--radius-*` so Tailwind v4 emits utility classes (`bg-brand`, `bg-surface-1`, `text-chip-3`, `rounded-2`, …) | Whenever an L0/L1 token needs a Tailwind utility class |
| **L3 — Surface override** | Theme blocks (`.theme-one`, `.theme-prism`, `[data-contrast="high"]`, `[data-text-size]`) | Per-brand / per-mode rebindings of L1 names — never new names | New brand, new contrast mode, new density step |

> **Rules:**
> 1. A token is **introduced exactly once**. New product tokens land in **L0**.
> 2. L1 (shadcn names) is **frozen** — keep working, do not extend.
> 3. L2 bridges L0/L1 → Tailwind utilities, exactly once per name.
> 4. L3 re-binds existing L1 OKLCH values per theme. L0 inherits via `var(L1)` automatically.

---

## 2. Namespace map (all current prefixes)

Every prefix below has a clear role. **New tokens MUST land in one of these
prefixes** — if you cannot place a token, the design system is missing a
prefix; propose one in a PR and document it here first.

### 2.0 Exxat L0 — canonical namespace (`--exxat-*`)

The **official** name layer. Mirrors the SLDS `--slds-g-*` pattern but flat
(no `-g-` for "global" yet, since we have a single product namespace). Today
these resolve to L1 via `var(...)` so every existing theme override flows
through automatically. New components SHOULD prefer L0 names; the linter will
not yet *force* this, but `apps/web/docs/migrations/0002-exxat-token-namespace.md`
tracks the rollout.

| Category | L0 token | Resolves to L1 |
|---|---|---|
| Surface | `--exxat-color-surface-1` … `-3` | `--background` / `--card` / `--popover` |
| Surface | `--exxat-color-surface-muted` / `-accent` / `-secondary` / `-sidebar` / `-input` | `--muted` / `--accent` / `--secondary` / `--sidebar` / `--input-background` |
| Ink | `--exxat-color-ink-1` / `-2` | `--foreground` / `--muted-foreground` |
| Ink | `--exxat-color-ink-on-surface-2` / `-on-surface-3` | `--card-foreground` / `--popover-foreground` |
| Ink | `--exxat-color-ink-on-brand` / `-on-primary` / `-on-secondary` / `-on-accent` / `-on-destructive` / `-on-slab` | foreground tokens |
| Ink | `--exxat-color-ink-danger` | `--destructive-ink` — danger as text, not the ink on a red fill |
| Surface | `--exxat-color-surface-slab` | `--slab` — inverse band (bulk selection bar) |
| Brand | `--exxat-color-brand-1` / `-2` / `-3` / `-deep` | `--brand-color` / `-dark` / `-light` / `-deep` |
| Ink | `--exxat-color-ink-brand` | `--brand-ink` — brand as text, not the ink on a brand fill |
| Brand | `--exxat-color-brand-tint-1` / `-2` / `-3` | `--brand-tint` / `-subtle` / `-light` |
| Action | `--exxat-color-action-primary` / `-secondary` / `-destructive` | `--primary` / `--secondary` / `--destructive` |
| Border | `--exxat-color-border-1` / `-control-subtle` / `-control-1` / `-control-2` | `--border` ladder (see §6) |
| Focus | `--exxat-color-focus-ring` | `--ring` |
| Overlay | `--exxat-color-overlay` | `--overlay` |
| Chart | `--exxat-color-chart-1` … `-5` | `--chart-1` … `-5` |
| Chip | `--exxat-color-chip-1` … `-5` / `-destructive` | `--chip-1` … `-5` / `-destructive` |
| Status badge | `--exxat-color-status-badge-{tone}-fill` / `-fg` | `--status-badge-{tone}-fill` / `-fg` |
| Radius | `--exxat-radius-1` … `-6` | `4px` / `8px` / `12px` / `16px` / `20px` / `24px` |
| Spacing | `--exxat-spacing-1` / `-2` / `-3` / `-4` / `-5` / `-6` / `-8` / `-12` | Tailwind base scale |
| Control | `--exxat-control-height-1` / `-2` / `-3` | `--control-height-sm` / `-` / `-touch` |

**Tailwind utilities** are emitted via L2 bridges in `@theme inline`:

| L0 token | Tailwind utility |
|---|---|
| `--exxat-color-surface-1` | `bg-surface-1`, `text-surface-1`, `border-surface-1`, … |
| `--exxat-color-ink-1` / `-2` | `text-ink-1`, `text-ink-2` |
| `--exxat-color-brand-1` … `-3` | `bg-brand-1`, `bg-brand-2`, `bg-brand-3` |
| `--exxat-color-brand-tint-1` … `-3` | `bg-brand-tint-1`, … |
| `--exxat-color-border-1` | `border-1` |
| `--exxat-color-focus-ring` | `ring-focus-ring` |
| `--exxat-radius-1` … `-6` | `rounded-1` … `rounded-6` |

> The existing `bg-background`, `bg-brand`, `rounded-md`, etc. are not going
> away — they alias to the same OKLCH. Both forms work side-by-side; **new code**
> should reach for the L0 form for clarity and grep-ability (`grep --exxat-`
> finds every product token without false positives from shadcn names).

### 2.1 Semantic surface (shadcn core, L1 — frozen)

Inherited from shadcn / Radix and treated as the **stable** semantic vocabulary
across every shadcn component. Do not rename — downstream `components/ui/*`
expects these.

| Token | Role |
|---|---|
| `--background` / `--foreground` | Page canvas + ink |
| `--card` / `--card-foreground` | Raised card surfaces |
| `--popover` / `--popover-foreground` | Floating menus, tooltips, dropdowns |
| `--primary` / `--primary-foreground` | Default CTA color (neutral charcoal, **not** brand — see §3) |
| `--secondary` / `--secondary-foreground` | Secondary button + de-emphasized surface |
| `--muted` / `--muted-foreground` | Muted body copy, subtle backgrounds |
| `--accent` / `--accent-foreground` | Hovered list rows, low-contrast chips |
| `--destructive` / `--destructive-foreground` | Red **fill** and the ink on it. `bg-destructive text-destructive-foreground`, always white ink |
| `--destructive-ink` | Red **text on the canvas**: error copy, destructive menu items, danger hovers. `text-destructive-ink` |
| `--brand-ink` | Brand **text on the canvas**: accented links, brand labels, brand hovers. `text-brand-ink`. Lifts to the light step of the ramp in dark mode, so use it instead of `text-brand` any time brand is the ink rather than the fill |
| `--slab` / `--slab-foreground` / `--slab-border` | Inverse band that must not be missed and must host accents of any hue (bulk selection bar). Near-black on light, near-white on dark |
| `--border` | Decorative dividers (no AA requirement) |
| `--border-control` / `--border-control-3` / `--border-control-35` / `--control-border` | Form-field borders — see §6 for the contrast ladder |
| `--input` / `--input-background` | Input outline + fill |
| `--ring` | Focus ring (≥ 3:1, SC 2.4.11) |
| `--overlay` | Modal / sheet / drawer scrim |

### 2.2 Brand (`--brand-*`)

The **product accent** — different from `--primary` (which is neutral). Exxat
ships **two** brand themes (Exxat One = lavender 286.1, Exxat Prism = rose 343)
plus user-picked custom brand.

| Token | Role |
|---|---|
| `--brand-color` | Solid brand fill (used on chips, links, charts when product) |
| `--brand-color-light` / `--brand-color-dark` / `--brand-color-deep` | Brand scale (light / dark / deepest) |
| `--brand-foreground` | Ink on a solid brand fill |
| `--brand-tint` / `--brand-tint-light` / `--brand-tint-subtle` | Wash surfaces (sidebar, secondary panel) |
| `--brand-preview-one` / `--brand-preview-prism` | Fixed swatches for the brand picker — **never change with the active theme** |

### 2.3 Sidebar + secondary panel (`--sidebar-*`, `--secondary-panel-bg`)

Three-level brand chrome stack. See `docs/shell-surface-elevation-pattern.md`.

| Token | Role |
|---|---|
| `--sidebar` / `--sidebar-foreground` | Primary sidebar (= `--brand-tint` on product themes) |
| `--sidebar-primary` / `--sidebar-primary-foreground` | Solid pill / active hint on sidebar |
| `--sidebar-accent` / `--sidebar-accent-foreground` | Hovered/active row in sidebar |
| `--sidebar-border` | Inner divider |
| `--sidebar-ring` | Focus ring inside sidebar |
| `--sidebar-section-label-foreground` | Section title — mixed against real `--sidebar`, not `--background` |
| `--secondary-panel-bg` | Nested panel (Library) — level 1 between sidebar and canvas |

### 2.4 Chips / badges (`--chip-*`)

A five-slot **AA-compliant** palette for tags, kanban badges, and small status
chips. All slots maintain ≥ 4.5:1 against `--background`.

| Token | Hue (light) |
|---|---|
| `--chip-1` | indigo (264) |
| `--chip-2` | teal (184) |
| `--chip-3` | slate (227) |
| `--chip-4` | amber (84) |
| `--chip-5` | orange (70) |
| `--chip-destructive` | red (25) |

`--chip-*` is for **generic** chips, icon-disc ink, and chart-adjacent accents.
**Entity workflow status** (`StatusBadge` / `StatusCell`) does **not** tint from
these — it uses the locked-lightness pairs below.

### 2.4.1 Semantic status badges (`--status-badge-*-fill` / `-fg`)

Enterprise DS cadence: **success · info · caution (warning) · danger · neutral**.
Fill L ≈ **0.95**, text L ≈ **0.385** on light — only hue + chroma change, so
every tone has equal perceived weight. Neutral (Draft) is chroma **0**.

| Tone | Domain examples | Fill hue | Text hue |
|---|---|---|---|
| `success` | Compliant, Approved, Cleared | 126 | 135.9 |
| `info` | In review | 245.4 | 253.2 |
| `warning` | Due soon, Needs update | 80.7 | 62.5 |
| `danger` | Non-compliant | 17.5 | 25.1 |
| `neutral` | Draft | 0 (achromatic) | 0 |

Wire through `STATUS_BADGE_TONE_CLASS` (`status-badge-tints.ts`) /
`lib/list-status-badges.ts`. Do not invent a sixth tone without design review.

### 2.5 Charts (`--chart-*`)

Five slots scoped for `recharts` series. They are **darker** than chip slots
because chart areas are larger and need denser pigment.

| Token | Hue |
|---|---|
| `--chart-1` | blue (264) |
| `--chart-2` | green-teal (184) |
| `--chart-3` | slate (227) |
| `--chart-4` | amber (84) |
| `--chart-5` | orange (70) |

Insights derived from charts use `--insight-severity-*-bg` / `-fg` (KPI strip).

### 2.6 Interactive hover (`--interactive-hover-*`)

Single source for ghost-button hover, list-row hover, table chrome hover.
Replaces ad-hoc `hover:bg-muted` so theming + dark mode flip together.

| Token | Role |
|---|---|
| `--interactive-hover` | Default opaque hover fill |
| `--interactive-hover-foreground` | Ink on hover |
| `--interactive-hover-subtle` / `-soft` / `-medium` / `-strong` | Opacity ladder (50 / 40 / 60 / 70 mix) |
| `--interactive-hover-row` | List/table row hover (accent-mixed) |

### 2.7 DataTable (`--dt-*`)

Pinned cells must be **opaque** so they sit above scrolled rows. These tokens
exist because `var(--muted)` alone gives translucent surfaces in dark mode.

| Token | Role |
|---|---|
| `--dt-row-bg` | Base row fill (opaque) |
| `--dt-row-hover` | Hovered row |
| `--dt-row-selected` / `--dt-row-selected-fg` | Selection state |
| `--dt-header-bg` | Header row |
| `--dt-group-bg` | Group / divider row |
| `--dt-new-row-bg` / `--dt-new-row-border` | "Just created" highlight |

### 2.8 KPI strip (`--key-metrics-*`, `--insight-severity-*`)

Used by `KeyMetrics` (both `variant="flat"` and `variant="card"`). See
`docs/kpi-flat-band-pattern.md`.

| Token | Role |
|---|---|
| `--key-metrics-flat-cell-bg` | Transparent on `variant="flat"` |
| `--key-metrics-flat-divider` | Cell-border hairline |
| `--key-metrics-flat-band-radial` | OKLCH brand glow at bottom |
| `--key-metrics-flat-band-shadow` | `none` on flat |
| `--key-metrics-card-glow-radial` | Card-variant glow |
| `--insight-severity-warning-bg` / `-fg` | Yellow severity (chart-4 mix) |
| `--insight-severity-info-bg` / `-fg` | Blue severity (chart-1 mix) |

### 2.9 Conditional formatting (`--conditional-rule-*`)

Row backgrounds for table conditional-format rules. Already six slots — adding
more requires expanding the rule type in `lib/table-conditional-format.ts`.

### 2.10 Icon discs (`--icon-disc-*`)

Soft tinted backgrounds for icon "discs" (KPI cards, banner avatars).
Bg ≈ 14% mix, fg from `--chip-*` / `--brand-color-dark`.

### 2.11 Avatar (`--avatar-initials-*`)

Bg + fg for initials avatars in `DataTable` cells. Pair brand wash with deep
brand ink for ≥ 4.5:1 on white rows.

### 2.12 Leo (Ask Leo) (`--leo-*`)

| Token | Role |
|---|---|
| `--leo-surface-tint-a` / `-b` | Top / bottom of the AI panel wash |
| `--leo-surface-gradient` | Full linear wash |

### 2.13 Layout + density (`--header-height`, `--control-*`, `--table-row-height`, `--scaling`)

Sized in **px** so JS can `parseFloat` them. Multiply by `--scaling` for future
density modes.

### 2.14 Border radius (`--radius`, `--radius-sm`/`-md`/`-lg`/`-xl`/`-2xl`/`-3xl`)

`--radius` is the **base** (8px). The named scale lives at L2 (`@theme inline`)
so Tailwind emits `rounded-sm`, `rounded-md`, etc.

### 2.15 Shadows + transitions (`--shadow-*`, `--transition-*`)

| Token | Role |
|---|---|
| `--shadow-sm` / `-md` / `-lg` | Three-step elevation |
| `--transition-fast` / `-normal` / `-colors` | Standard durations |
| `--sticky-edge-fade` | Edge-of-pinned-column gradient |

### 2.16 Promo / banner (`--banner-prism-bg`)

Rose hue 343, used **universally** as the Exxat Prism promo highlight — does
not flip with the active theme.

### 2.17 OS chrome (`--theme-color-chrome`)

Mirrored into `<meta name="theme-color">` so the browser titlebar matches the
sidebar. Hex literal here is **intentional** — it is consumed by the browser
parser, not CSS.

---

## 3. Color identity rules

1. **`--primary` is neutral**, not brand. The product accent is `--brand-color`.
   This matches Exxat's design language (neutral charcoal CTAs, lavender/rose
   reserved for surfaces and chips). When a button **must** carry the brand,
   use `bg-brand-color text-brand-foreground` — not `bg-primary`.
2. **Brand washes (`--brand-tint*`) are surfaces; brand colors
   (`--brand-color*`) are ink/fills.** Mixing the roles produces low-contrast
   chips and washed-out sidebars.
3. **Chip ≠ chart.** Chip tokens are sized for inline chips; chart tokens are
   sized for filled SVG areas. Re-use a chip color on a chart fill (or vice
   versa) only when the design explicitly calls for it.
4. **Every theme MUST keep `--brand-preview-one` and `--brand-preview-prism`
   fixed.** They drive the brand picker swatch — flipping them with the
   selected theme defeats the picker.

---

## 4. Naming a new token — checklist

Run this list **before** opening `globals.css`:

- [ ] **Does an L0 alias already exist?** (`--exxat-color-surface-1`,
      `--exxat-color-brand-1`, `--exxat-radius-2`, …) — prefer L0 for new
      consumers; the L1 shadcn name is the back-compat alias.
- [ ] If the token is new, **name it at L0 first** (`--exxat-<category>-<slot>`).
      Add an L1 mirror **only** if a shadcn primitive in `components/ui/*`
      needs it — that's the only place L1 is still required.
- [ ] Can it be expressed with an existing semantic token? (`--exxat-color-surface-muted`
      instead of `--exxat-color-surface-4`, `--brand-color-dark` instead of
      `--brand-deeper`)
- [ ] Does it belong to a **scoped surface** (`KeyMetrics`, `DataTable`, Leo,
      sidebar, secondary panel)? If yes, **prefix with that surface**, e.g.
      `--key-metrics-*`, `--dt-*`, `--leo-*`. Do **not** drop scoped tokens at
      the top level.
- [ ] Is it a **decoration** or a **decision**? Decorations (gradients, fades,
      shadows) live alongside the surface tokens they decorate. Decisions
      (semantic intent: warning, info, success) live with chips / charts /
      insight tokens.
- [ ] Does it need a Tailwind utility (`bg-*`, `text-*`, `border-*`)? If yes,
      add the `--color-<name>` bridge in `@theme inline` in **both** globals
      files.
- [ ] Does dark mode / high contrast / Prism need different OKLCH? Override at
      L3 — never branch by emitting a new token name.
- [ ] Is it derived (e.g. 14% mix of `--brand-color`)? Use `color-mix(in oklch,
      …)` so theme overrides cascade automatically.
- [ ] Add the bridge in `packages/ui/src/globals.css` `@theme inline`. App
      consumers @import that file, so a single edit is enough — no manual
      mirroring across `apps/web/src/styles/globals.css` /
      `generated-starter/src/styles/globals.css`.

If you tick all the boxes, also:

1. Add an entry to this file (the right §).
2. Re-run `pnpm --filter @exxatdesignux/ui tokens:index` (see §7) to refresh
   `packages/ui/tokens/hooks-index.json`.

---

## 5. Deprecation policy

Tokens follow the same **add → mark deprecated → remove** lifecycle as code:

1. **Add** the new token; switch components to consume it.
2. **Mark deprecated** in `packages/ui/src/globals.css` with a comment:
   ```css
   /* @deprecated v0.2.18 — use --brand-color-dark; remove in v0.4.0 */
   --brand-deep: var(--brand-color-dark);
   ```
3. **Migrate** consumers (script + grep + manual review). Document in
   `docs/migrations/<NNNN>-<slug>.md`.
4. **Remove** in the version named in the deprecation comment. Bump
   `@exxatdesignux/ui` major or document in `CHANGELOG.md`.

Active deprecations are listed in `docs/migrations/README.md`.

---

## 6. Form-field border contrast ladder

Form-field borders are a recurring source of WCAG SC 1.4.11 (3:1 UI contrast)
failures. Use the right rung — do not guess:

| Token | OKLCH L | Contrast vs `oklch(1 0 0)` | When to use |
|---|---|---|---|
| `--border` | 0.92 | < 3:1 | **Decorative only** — card dividers, list separators |
| `--border-control` | 0.82 | < 3:1 | Layout chrome where contrast is not required |
| `--border-control-3` | 0.653 | ≈ lighter field outline (`#8E9095` → OKLCH) | Form-field border **default** |
| `--border-control-35` | 0.653 | same rung | Inputs / chips that use the stronger control slot |
| `--control-border` (alias of `--border-control-3`) | — | — | Default form-field border slot |
| `--icon-button-foreground` | (via `--muted-foreground`) | ≥3:1 on canvas | Ghost/outline **icon-only** `Button` + `.icon-button-chrome` |
| `--icon-button-foreground-on-sidebar` | mixed on `--sidebar` | ≥3:1 on sidebar | Ask Leo rail, sidebar icon controls — **not** `/70` opacity |

If you find yourself reaching for `--border` on an `<input>`, stop — use
`--control-border`.

---

## 7. Machine-readable hooks index

Tooling (linters, codegens, design-tool sync) needs to discover tokens
programmatically. Run:

```bash
pnpm --filter @exxatdesignux/ui tokens:index
```

This regenerates [`packages/ui/tokens/hooks-index.json`](../../packages/ui/tokens/hooks-index.json),
which mirrors SLDS's `hooks-index.json` shape. The current index contains
**195 tokens** across **41 namespaces** (including the 12 Exxat L0 sub-namespaces
`exxat-surface`, `exxat-ink`, `exxat-brand`, `exxat-action`, `exxat-border`,
`exxat-focus`, `exxat-overlay`, `exxat-chart`, `exxat-chip`, `exxat-radius`,
`exxat-spacing`, `exxat-control`):

```jsonc
{
  "version": "0.2.18",
  "source": "packages/ui/src/globals.css",
  "generatedAt": "ISO-8601",
  "tokens": {
    "--exxat-color-brand-1": {
      "namespace": "exxat-brand",
      "category": "color",
      "values": { "light": "var(--brand-color)" },
      "tailwindUtilities": ["bg-brand-1", "text-brand-1", "border-brand-1", "ring-brand-1"],
      "deprecated": false
    },
    "--brand-color": {
      "namespace": "brand",
      "category": "color",
      "values": {
        "light":           "oklch(0.50 0.14 286.1)",
        "dark":            "oklch(0.50 0.14 286.1)",
        "theme-one":       "oklch(0.50 0.14 286.1)",
        "theme-prism":     "oklch(0.57 0.24 342)",
        "high-contrast":   "oklch(0.06 0 0)"
      },
      "tailwindUtilities": ["bg-brand", "text-brand", "border-brand", "ring-brand"],
      "deprecated": false
    }
  }
}
```

CI runs `tokens:index` and fails if the committed JSON is stale.

---

## 8. References

- `packages/ui/src/globals.css` — **single source of truth** for L1 / L2 / L3 primitives + Tailwind bridges
- `apps/web/src/styles/globals.css`, `packages/ui/generated-starter/src/styles/globals.css` — thin shells (`@import` + `@source`)
- `apps/web/docs/shell-surface-elevation-pattern.md` — sidebar / secondary panel
- `apps/web/docs/kpi-flat-band-pattern.md` — `--key-metrics-flat-*`
- `apps/web/docs/kpi-trend-pattern.md` — `--insight-severity-*` polarity
- `.cursor/rules/exxat-token-discipline.mdc` — enforcement rule (don't ship hex
  literals, don't use deprecated tokens)
- `docs/migrations/` — token rename + removal history
