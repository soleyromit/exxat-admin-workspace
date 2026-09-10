# Pattern: One filled primary on a detail page

**Job:** [`jobs/record-detail.md`](./jobs/record-detail.md). **Rule:** P3 + `exxat-page-header-actions.mdc`.

## MUST

1. **One** `Button variant="default"` filled primary in the page viewport.
2. PageHeader overflow (`⋯`) holds Export / Configure / long-tail — not a second filled CTA.
3. Toolbars **below the module tab bar** use `size="sm"`. Header actions stay `size="lg"` / `icon-lg`.
4. Sibling actions under the tab bar are `outline` or `ghost` — never a second filled default.

## Placement

| Zone | Size | Filled primary? |
|------|------|-----------------|
| `PageHeader` actions | `lg` / `icon-lg` | At most one, or none if primary lives under tabs |
| Module toolbar (below tabs) | `sm` | At most one for that module |

## Reference

- `components/learning-activities-course-detail-client.tsx` — Forms / Reports / Gradebook toolbars
