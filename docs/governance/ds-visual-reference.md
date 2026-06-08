# DS Visual Reference — how @exxatdesignux/ui actually *looks*

> The missing layer. `ds-adoption.md` documents **rules** (don't do X) and `ds-snapshot.json` documents **APIs** (component props). Neither tells you what the DS looks like when applied well. This doc does — values extracted directly from `@exxatdesignux/ui/src/globals.css` (v0.6.28), the live viewer at `localhost:4000`, and the Claude Design HTML (which is built with these same tokens).
>
> **Rule of thumb:** the Claude Design HTML *is* the DS applied well. If your build looks worse, you're under-using the tokens below — not escaping the DS.

---

## 0. The workflow (do this FIRST, before writing JSX)

1. Open the matching screen in the **live DS** (`localhost:4000` — has `/dashboard`, `/examples` Patterns, `/data-list`, `/settings`, **Tokens & themes**) or the shared **Claude Design HTML**.
2. Extract its computed styles: `tools/visual-check/extract-wizard-styles.mjs` pattern — `getComputedStyle` on headings/inputs/buttons + `:root` custom properties.
3. Reproduce those exact tokens. Do **not** approximate with generic Tailwind utilities.

---

## 1. Typography — the #1 fidelity lever

| Token | Value | Use |
|---|---|---|
| `--font-heading` | **`ivypresto-text`** (serif, via Typekit) → Tailwind `font-heading` | **ALL page/detail titles, hero numbers, KPI numerals** |
| `--font-sans` | `Inter` | body, labels, controls, table cells |

**THE rule (now enforced by hook DS-013):** any display heading (`h1`/`h2` at `text-2xl`+ / `text-[24px]`+) **must** use `font-heading`. A serif title is the single biggest reason the DS looks polished. `text-2xl font-semibold` sans-serif = generic = blocked.

```tsx
// ✗ generic (blocked by DS-013)
<h1 className="text-2xl font-semibold">New assessment</h1>
// ✓ DS display font
<h1 className="font-heading text-[32px] font-light leading-tight">New assessment</h1>
```

**Type scale** (`--fs-*`): hero 40 · page-title 32 · page-title-sm / 3xl 24 · 2xl 21 · xl 18 · lg 16 · base 14 · sm 12 · xs 12.
**Weights** (`--fw-*`): light 300 · regular 400 · medium 500 · semibold 600 · bold 700.
Display titles are typically `font-light` (300) or `font-normal` (400) — serif looks elegant light, NOT bold.

**Small-text floor (measured from the live DS, not a memory):** the DS overrides Tailwind so **`text-xs` renders 11px** (not 12px) at the 16px root. The `--fs-xs` *token* nominally says 12px, but the `text-xs` *utility* does not use it — `text-xs` = 11px is the DS's standard small text. Tiny tags/badges go to **10px**. So: standard small text = `text-xs` (11px); never write normal body/label text below 11px; reserve 10px for chips/badges only. (Conformance checker flags rendered text < 10px.)

---

## 2. Surfaces — radius & shadow (never inline)

| Token | Value |
|---|---|
| `--radius-sm` / `md` / `lg` / `xl` / `2xl` | 4 / 8 / 12 / 16 / 20 px |
| `--shadow-sm` | `oklch(0 0 0 / 0.08) 0 1px 2px` → class `shadow-sm` |
| `--shadow-md` | `oklch(0 0 0 / 0.08) 0 2px 4px -1px, …` → class `shadow-md` |

Cards: DS `Card` (radius-lg/xl + shadow-sm). **Never** inline `box-shadow` or `rgba()` — use the `shadow-sm`/`shadow-md` classes (hooks block the inline form).

---

## 3. Spacing rhythm

`--space-1..12` = 4 · 8 · 12 · 16 · 24 · 32 · 48 px. Section gaps are usually `--space-5/6` (20/24); field gaps `--space-4` (16); inline `--space-2` (8). Use the 4px grid — not arbitrary values.

---

## 4. Color (rose brand)

| Token | Value |
|---|---|
| `--brand-color` | `oklch(0.57 0.24 342)` (rose/pink — never violet) |
| `--brand-color-dark` | `oklch(0.42 0.24 342)` (AA text on tint) |
| `--brand-tint` / `--banner-prism-tint` | `oklch(0.98 0.012 343)` |
| `--input-background` | `oklch(0.97 0.002 270)` (inputs are light-grey, not white) — DS `Input` applies it |
| `--foreground` / `--muted-foreground` | `oklch(0.145 0 0)` / `oklch(0.55 0.012 270)` |

Brand reserved for primary CTAs + active states. Score/rating viz: no red — amber `--chart-4` for below-threshold.

---

## 5. Why this doc exists

The recurring "designs don't match the DS" failure was never an access or tooling gap — it was building from text API docs/memory instead of the rendered reference, and skipping the DS's display font. This doc + DS-013 close that loop: the values are written down, and the worst offender (sans titles) is enforced.
