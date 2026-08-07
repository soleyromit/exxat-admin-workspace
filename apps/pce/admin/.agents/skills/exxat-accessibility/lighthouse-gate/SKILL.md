---
name: exxat-accessibility-lighthouse-gate
description: Axe + Lighthouse accessibility fix loop — run scans, read reports, fix failures until pass. Use when the user wants a11y verification, axe clean runs, or Lighthouse a11y score 100.
user-invocable: true
---

# Exxat DS — accessibility fix loop (axe + Lighthouse)

**Parent skill:** `.agents/skills/exxat-accessibility/SKILL.md`  
**Goal:** Zero axe WCAG 2.x AA violations on target routes; optional Lighthouse accessibility **100**.

Run this workflow **inline** in the main agent — do not spawn a sub-agent.

---

## Preconditions

1. **Dev server running** — `pnpm dev:web` → `http://127.0.0.1:4000` (default).
2. **UI package built** when touching `packages/ui/**` — `pnpm --filter @exxatdesignux/ui build`.
3. Load **`.agents/skills/exxat-accessibility/SKILL.md`** for Exxat-specific fix patterns (icon rail, resize handles, contrast tokens).

---

## Step 1 — Run the gate (prefer axe for bulk)

**While iterating:** smoke scan (~15 routes, ~30–60s):

```bash
pnpm a11y:setup          # once: install Chromium
pnpm a11y:axe            # default smoke tier
pnpm a11y:axe /design-os/design-system/wizard   # route you changed
```

**Before shipping a new pattern / screen / hub:** full catalog (163 routes, ~4 min):

```bash
pnpm a11y:axe:all
pnpm a11y:axe:all --variants ship   # pre-release matrix
```

**Read reports** (written automatically after each gate run):

- `.axe-reports/<run>/axe-a11y-summary.json` — machine-readable
- `.axe-reports/<run>/axe-a11y-report.md` — human-readable summary

Regenerate markdown for an older run:

```bash
pnpm a11y:axe:report --dir .axe-reports/<run>
pnpm a11y:axe:report --list
```

**Pass condition:** `summary.allPassed === true` (zero WCAG 2.x AA axe violations per scan).

**Spot-check / Lighthouse score parity** (slow, ~1 min/route):

```bash
pnpm a11y:lighthouse
node scripts/lighthouse-a11y-gate.mjs /design-os/design-system/button
```

**Read** `.lighthouse-reports/lighthouse-a11y-summary.json` when using Lighthouse.

**Pass condition (Lighthouse):** accessibility category `score === 1` (100).

---

## Step 2 — Fix loop (MUST)

Repeat until **pass** or **5 rounds** (whichever comes first):

| Round | Action |
|-------|--------|
| 1 | Run gate → read `axe-a11y-report.md` or `axe-a11y-summary.json` |
| 2 | Map each violation `id` to fix playbook below |
| 3 | Apply **minimal** fixes at **component level** (`packages/ui` primitives first) |
| 4 | Rebuild UI if needed → re-run gate on **same URLs** |

**Stop early** when all routes pass.  
**If still failing after 5 rounds:** report remaining rule IDs + selectors from the markdown report.

---

## Step 3 — Report back

Return a short summary:

| Metric | Value |
|--------|-------|
| Run dir | `.axe-reports/<run>/` |
| Scans | passed / total |
| Remaining violations | rule IDs or — |

Attach path to **`axe-a11y-report.md`**.

---

## Fix playbook (audits → Exxat DS)

Fix at **shared components** when possible — not one-off doc previews.

| Rule / audit | Typical cause | Fix location |
|--------------|---------------|--------------|
| **`scrollable-region-focusable`** | Horizontal scroll, tables, card scroll | `ScrollRegion`, `HorizontalScrollViewport`, `Table`, `DataTable`, `CardScrollRegion` |
| **`color-contrast`** | Brand/muted on dark or HC; inherited text on buttons | Tokens in `globals.css`; `Badge` variants; `MarketingBanner` on-brand CTA |
| **`target-size`** | Icon buttons < 24px; flyout footer clipped | `SidebarMenuButton` `size-8`; `SidebarFooter` flyout padding |
| **`label-content-name-mismatch`** | `aria-label` ≠ visible text | Remove redundant label or match exactly |
| **`link-name`** | Icon rail collapsed links | Conditional `aria-label` spread — parent skill § Sidebar icon rail |
| **`button-name`** | Icon-only without name | `aria-label` + `Tip` |
| **`list`** | Invalid children in `SidebarMenu` | `SidebarMenuItem` / `SidebarMenuSubItem` |
| **`aria-*`** on separators | Missing `aria-valuenow` | `verticalResizeSeparatorAria()` |
| **`skip-link`**, **`landmark-one-main`** | Shell / render failures | `PrimaryPageTemplate` `id="main-content"`; fix build errors first |

**Ignore for Lighthouse accessibility score** (best-practices category): `errors-in-console`, `charset`, `inspector-issues` — unless they prevent render.

---

## Default scan routes

When the user does not specify URLs:

- `/design-os/library/all` — hub shell, sidebar, table, views toolbar
- `/design-os/design-system/button` — component doc + catalog drill-in
- `/design-os/design-system/tokens-colors` — token doc + nested nav lists

Add **`/prism/library/all`** when validating product-scoped chrome.

---

## See also

- `.agents/skills/exxat-accessibility/SKILL.md` — WCAG checklist + Exxat patterns
- `docs/exxat-ds/accessibility-ship-checklist.md` — manual ship gate (axe + reflow)
- `scripts/axe-a11y-report.mjs` — markdown report generator
