# Course Shell UI Design — Scroll, Search, and Accessibility
**Date:** May 12, 2026 · **Meeting ID:** aa9de72a · **Participants:** Romit, Ripon (dev)

---

## Scroll behavior (15+ courses)

- Single scroll bar beneath the search folder input (like email client sidebar)
- NO multiple scroll bars for nested subfolders
- Lazy loading decision deferred to Darshan for performance optimization

## Search functionality

- Shows proper folder paths in search results (parent path as subtitle)  ✅ already implemented
- Click in search navigates to the exact folder in the tree ✅ already implemented

## Accessibility standards

- Admin side: **200% magnification target** (WCAG double-A)
- Student side: **400% magnification required** (WCAG triple-A)
  - Recent tenant requests driving the 400% requirement
  - Company-wide goal: minimum 200% compliance
- Dark mode + high contrast themes: implemented
- Tab navigation: complete
- Keyboard shortcuts: pending global requirements definition
- **Ask Vishaka on 400% magnification** — feasibility and requirements

## QB-specific items from private notes

- **Remove ascending/descending from the column context menu** — ✅ APPLIED (2026-05-18 weekly assessment)
- Multiple column values can be searched via filter options on right side
- Subfolder indentation works properly up to 5 levels; beyond 5 may require limits
- **Question: Can we limit the number of subfolders in QB structure?** — decision pending

## Sorting indicators

- Add ability to show multiple active sorts ✅ already implemented in filter panel
- Remove Ascending/Descending from the column header context menu (see above — applied)
- Add ability to remove filters by clicking selected options

## Design system flexibility

- Custom features can be built and potentially upstreamed to the main DS
- No hard limitations from existing component constraints
