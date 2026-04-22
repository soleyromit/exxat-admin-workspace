# Button Radius Audit

## Design System Standards (button.tsx)

| Size | Radius | Class |
|------|--------|-------|
| **default** | 8px | rounded-lg |
| **sm** | 4px | rounded-sm |
| **lg** | 12px | rounded-xl |
| **icon** | 4px | rounded-sm |

---

## Cards & Rows — Button Usage

### ✅ Following design system (no custom radius)

| Component | Buttons | Size | Radius |
|-----------|---------|------|--------|
| **todo-task-card** | Add Email, Share Preferences, View Instructions, Complete Requirements | default | 8px ✓ |
| **data-table** | Scroll left/right, pagination prev/next | sm | 4px ✓ |
| **pagination** | Prev, page numbers, Next | sm | 4px ✓ |
| **filter-bar** | Add filter | icon | 4px ✓ |
| **table-properties** | Add filter, Add sort, Settings | sm | 4px ✓ |
| **internship-page** | Back to Home | default | 8px ✓ |
| **apply-job-modal** | View My Jobs, Explore More Jobs | default | 8px ✓ |
| **partner-site-performance-card** | Action button | sm | 4px ✓ |
| **calendar-view** | Prev/Next month, Today, Month/Week | sm | 4px ✓ |
| **AskLeoButton** | Ask Leo (text + icon) | sm | 4px ✓ |
| **AskLeoButton** (iconOnly) | Top nav | icon | 4px ✓ |

### ❌ Custom radius overrides (inconsistent)

| Component | Location | Override | Should be |
|-----------|----------|----------|-----------|
| **schedule-card** | Pay & Unlock, Pay And Unlock, Complete Requirements | `rounded-md` (6px) | sm → 4px (rounded-sm) |
| **wishlist-card** | CTA button | `rounded-md` (6px) | sm → 4px (rounded-sm) |
| **leo-panel** | Send message button | `rounded-md` (6px) | sm → 4px (rounded-sm) |

### ⚪ Intentional custom shapes (not standard buttons)

| Component | Usage | Reason |
|-----------|-------|--------|
| **submit-preferences-flow** | Close on map cards, filter chips | `rounded-full` — pill/circular for compact UI |
| **job-list-page** | Avatar-style icon buttons | `rounded-full` — circular avatar pattern |
| **organisation-card** | Save button | `rounded-full` — circular icon |
| **job-card** | Save button | `rounded-full` — circular icon |

---

## Why custom radii exist

1. **Legacy / pre-design-system** — `rounded-md` was used before the 8/12/4px standard.
2. **Copy-paste** — Some components copied from others without updating to design tokens.
3. **Intentional** — `rounded-full` for circular/pill buttons (avatar close, filter chips) is a different pattern.

---

## Recommendation

Remove `rounded-md` overrides from schedule-card, wishlist-card, and leo-panel so they inherit from the Button size prop (sm → 4px).
