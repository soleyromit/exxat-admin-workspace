---
description: Exxat DS — monospace typography for record IDs, question IDs, and other system identifiers
activation: glob
globs: {components,lib,src}/**/*.{tsx,ts}
---

<!-- Synced from .agents/rules/exxat-mono-ids.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — monospace IDs

Use this when rendering **system identifiers** — values a user copies, searches, or matches in APIs and tables (not human-readable names or prose).

## MUST

1. **Class** — Wrap identifier text in **`font-mono tabular-nums`**. Add size/color from context: typically **`text-xs text-muted-foreground`** (secondary line, table meta) or **`text-sm`** when the ID is the primary label in a narrow cell.
2. **What counts as an ID** — Question IDs (`questionId`, `Q-YYMM-XXXX`), record/entity keys shown in UI, folder/surface technical keys when displayed as identifiers, hex tokens in pickers, audit/log principals, site/row **`id`** columns meant for lookup.
3. **Mixed lines** — When an ID sits beside prose (e.g. page subtitle), only the ID segment is mono; keep separators and labels in the default sans stack.

## SHOULD

- Match existing hubs: **`library-table.tsx`**, **`columns-showcase.tsx`** (mono record IDs in the showcase row), **`new-library-item-form.tsx`** (header subtitle).
- Prefer **`truncate`** / **`min-w-0`** on mono IDs in tight layouts so long tokens do not blow out columns.

## MUST NOT

- Apply **`font-mono`** to **person names**, **folder display names**, **status labels**, **dates**, **counts**, **currency**, or **body copy** — only the identifier token.
- Use mono for **option letters** (A/B/C) or **step numbers** unless they are literal system IDs.

## See also

- **`.agents/skills/exxat-mono-ids/SKILL.md`**
- **`./AGENTS.md`** — §1 item on IDs, §13 checklist
