# Blueprint: <Name>

> **Status:** Draft / Stable. **Owner:** <team or person>. **Implements:** <SC refs>.

## 1. Intent

What user need does this pattern solve? In one paragraph.

**Use when:**
- Bullet
- Bullet

**Do NOT use when:**
- Bullet

## 2. Anatomy

ASCII / markdown sketch with labelled slots. List every named slot and whether
it is required, optional, or conditional.

```
┌──────────────────────────────────────────┐
│ [icon]  Title                  [actions] │  ← slot: title-row (required)
│ ───────────────────────────────────────  │
│ subtitle · ID · meta                     │  ← slot: meta (optional)
└──────────────────────────────────────────┘
```

| Slot | Required? | What it carries |
|---|---|---|
| `title` | required | Single H1 string |
| `icon` | optional | FA glyph or product mark |
| `actions` | optional | Primary CTA + optional `⋯` overflow |
| `meta` | optional | Count · freshness · sort summary |

## 3. States

| State | Visual / behavior |
|---|---|
| Default | … |
| Loading | … |
| Empty | … |
| Error | … |
| RTL | … |

## 4. Tokens consumed

List every token the blueprint references from
[`docs/token-taxonomy.md`](../token-taxonomy.md). Be precise — no "a brand
color"; name `--brand-color`.

| Token | Used for |
|---|---|
| `--background` / `--foreground` | Surface + ink |
| … | … |

## 5. Accessibility

| WCAG SC | How this blueprint complies |
|---|---|
| 1.1.1 Non-text content | Icons are decorative (Case A) when adjacent to text; standalone icons follow Case B (label + tooltip) |
| 1.3.1 Info & relationships | … |
| 2.1.1 Keyboard | Tab order: … |
| 2.4.6 Headings / labels | The title slot is the `<h1>` for the route |
| 2.4.11 Focus visible | Inherits `:focus-visible` ring (≥ 3:1) |

## 6. Variants

| Variant | When to use | Differences from default |
|---|---|---|
| `base` | … | — |

## 7. Implementation

| Framework | Component(s) | File |
|---|---|---|
| **React (this app)** | `PrimaryComponent` + `RelatedComponent` | `apps/web/components/<file>.tsx` |
| Mobile | — | — |
| Figma | — | — |

## 8. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Bullet | Bullet |

## 9. References

- `apps/web/docs/<related-narrative>.md`
- `.cursor/rules/<related-rule>.mdc`
- `apps/web/AGENTS.md` §<section>
