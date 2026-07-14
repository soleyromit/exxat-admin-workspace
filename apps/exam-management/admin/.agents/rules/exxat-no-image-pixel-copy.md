---
description: Uploaded screenshots/mockups are IA reference only — map to Exxat DS patterns; never pixel-copy
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-no-image-pixel-copy.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — uploaded images are not the implementation spec

When the user attaches a **screenshot**, **mockup**, **Figma export**, **legacy app capture**, or any **reference image**, treat it as **product intent** — **not** as code to transcribe.

**Exxat DS rules, blueprints, and reference hubs always win** over what the image shows.

## STOP — image attached

If the user's message includes an **image attachment** and asks to **build**, **rebuild**, **redesign**, **match**, or **make it like this**:

1. **Load `exxat-senior-ux` FIRST** — post the design brief; **wait** for user go-ahead (`exxat-ux-discovery-protocol.md`).
2. **Extract IA only** from the image (labels, routes, fields, workflows) — **never** layout chrome, colors, density, or component shapes.
3. **Map to DS** — name a **reference hub file** + DS primitives before writing code.
4. **Do NOT** invoke generic aesthetic skills (`frontend-design`, "make it match the screenshot", visual parity tools) to reproduce pixels. Those skills are **subordinate** to this rule when working in Exxat DS or a consumer app on `@exxatdesignux/ui`.

### Forbidden agent reasoning (never say or plan this)

These phrases mean you are **violating P4** and this rule — stop and remap to DS:

- "match the screenshot" / "match the reference" / "match the image"
- "to look like the upload" / "pixel-perfect" / "visual parity with the mockup"
- "simpler header **to match**" / "lighter footer **to match**" / "flatter nav **to match**"
- "the current sidebar is richer than the reference, so I'm narrowing it down"
- "I'll patch layout/components to match what the user uploaded"

**Say instead:** *"Image → IA: [nav labels, fields, actions]. DS mapping: [reference hub + primitives]. Shell chrome unchanged."*

## Allowed to take from an image (content / IA)

- **Screen purpose** — list hub, detail record, settings, search, etc.
- **Nav labels**, **section grouping**, **route slugs**, **field names**, **column headers**
- **Data the user cares about** — which KPIs, filters, actions, statuses exist
- **Icon choice** (Font Awesome suffix) when obvious — still use **`fa-light` / `fa-solid`** DS pairing
- **Workflow** — e.g. "export from ⋯", "row opens profile", "invite from header"

## MUST NOT copy from an image (visual / stack)

- **Hex / RGB colors**, per-section rainbow text, custom sidebar washes, one-off pill shapes
- **Layout chrome** that duplicates DS shell — sidebar, **`SiteHeader`**, **`PageHeader`**, **`ListPageTemplate`** toolbar, tab bars
- **Simplifying or flattening DS chrome** because the legacy screenshot looks sparser (e.g. fewer footer blocks, one school card, custom Prism header)
- **Bespoke components** when a DS primitive exists — raw `<table>`, custom popovers, hand-built buttons, full-width tabs, Vaul drawers
- **Forking shared files** (`app-sidebar.tsx`, `sidebar.tsx`, `globals.css`) to match a legacy product
- **Implementing "because it's in the picture"** without naming the **DS pattern + reference file** you are using

## REQUIRED workflow (before writing UI code)

1. **Classify the screen** — use **`docs/component-selection-guide.md`** + **`docs/blueprints/`** (list page, page header, data table, dedicated search, …).
2. **Pick a reference hub** — **`docs/reference-implementations.md`** (Placements, Team, Library, Compliance, …).
3. **State the mapping** (in the design brief): e.g. "Students roster → **`ListPageTemplate`** + **`HubTable`** like Team; nav rows → **`lib/mock/navigation.tsx`** only; **sidebar / header chrome unchanged**."
4. **Implement with DS components + tokens** — **`AGENTS.md`**, **`exxat-ds-agents.md`**, topic rules (`exxat-tabs-chrome`, `exxat-page-header-actions`, `exxat-sidebar-shell`, …).
5. **If the image conflicts with DS** — follow DS; ask **one** clarifying question only when the **business requirement** (not pixels) cannot be met with existing patterns.

### Brief fields when an image is attached

Add these lines to the design brief (`exxat-senior-ux` template):

```
Image reference (IA only):  <nav labels, fields, actions extracted — not visual chrome>
DS mapping:                 <reference hub + primitives; what stays unchanged>
Visual chrome:              unchanged from DS (sidebar, SiteHeader, tokens) | <exception + P4 reason>
```

## Wrong vs right (sidebar example)

| Wrong (pixel-copy) | Right (IA + DS) |
|---|---|
| Replace DS sidebar with simpler legacy header "to match screenshot" | Keep **`AppSidebar`** + **`SidebarMenuButton`**; add/update rows in **`navigation.tsx`** only |
| One school card + flat footer because image shows that | Keep DS scope chrome + footer; image informed **which links exist**, not shell density |
| Custom colors / pills per nav section from legacy Prism | **`text-sidebar-foreground`**, **`data-active`** pill from DS — see **`exxat-sidebar-shell.md`** |

## Consumer apps

- Product UI lives in the customer repo with **`@exxatdesignux/ui`** — not by restyling to match uploads.
- Run **`npx --package=@exxatdesignux/ui@latest exxat-ui sync-extras`** after upgrade so this rule + **`exxat-senior-ux`** skill land in **`.agents/rules/`** and **`.agents/skills/`**.
- If the agent still "matches the screenshot", verify **`exxat-no-image-pixel-copy.md`** is present and **`alwaysApply: true`** in the customer repo.

## See also

- **`exxat-reuse-before-custom.md`** — compose before inventing
- **`exxat-sidebar-shell.md`** — sidebar-specific anti-patterns
- **`exxat-ux-principles.md`** — **P4. Don't pixel-copy**
- **`.agents/skills/exxat-senior-ux/SKILL.md`** — brief-before-code when images attached
- **`exxat-token-economy`** skill §2 — pre-flight includes image discipline
