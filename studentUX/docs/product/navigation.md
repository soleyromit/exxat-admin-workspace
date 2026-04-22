# Navigation

The left sidebar is the single entry point for all navigation. It uses `collapsible="icon"` mode and follows strict UX hierarchy rules.

---

## Sidebar Structure

```
┌─────────────────────────┐
│  Logo / Brand           │  ← Clickable → Home
│  Team Switcher          │  ← Program selector
├─────────────────────────┤
│  PRIMARY NAV            │  ← Core daily-driver pages
│  ● Home                 │
│  ● Leo AI          Beta │
│  ● Inbox           (15) │
├─────── separator ───────┤
│  PIPELINE               │  ← Placement workflow
│  ● Explore              │
│    ├ Browse Sites        │
│    └ Saved Searches      │
│  ● Wishlist        New  │
│    ├ Overview            │
│    ├ Pipeline            │
│    └ Reports             │
│  ● Slots           (24) │
│    ├ Overview            │
│    ├ Pipeline            │
│    └ Reports             │
│  ● Student Schedule(12) │
│    ├ Overview            │
│    ├ Pipeline            │
│    └ Reports             │
├─────── separator ───────┤
│  SUPPORTING             │  ← Reference & analytics
│  ○ Reports              │
│  ○ My Students          │
│  ○ Site Partner         │
├─────── separator ───────┤
│  UTILITY                │  ← Footer
│  ○ Resources & Help     │
│  ○ Settings             │
│  ─── User Avatar ───    │
└─────────────────────────┘
```

---

## Primary vs Secondary Classification

**Primary** (top section):
- Used nearly every session (daily driver).
- Represents a core entity or workflow.
- Has its own full-page view with tables, filters, detail pages.

**Secondary / Supporting** (middle section):
- Supports primary work but is not the work itself.
- Used periodically; reference or cross-cutting.

**Utility** (footer):
- Help, settings, user profile.

---

## Workflow Order

The pipeline section follows the school's natural placement workflow:

1. **Explore** → Browse available internship sites, request slots.
2. **Wishlist** → Define criteria; students share preferences.
3. **Slots** → Track all requested slots.
4. **Student Schedule** → Manage approved placements, compliance.

---

## Sidebar Sub-Items vs In-Page Tabs

| Sidebar Sub-Items | In-Page Tabs |
|--------------------|--------------|
| Different section types: Overview, Pipeline, Reports | Same content type with different filters: Requested, Approved, Completed |
| Each has a distinct layout | Same layout, different data lens |
| Separate URLs | No separate URLs |
| Hidden when sidebar collapsed | Always visible |

**Decision:**
1. Different content types? → Sidebar sub-items.
2. Same content type, different filters/stages? → In-page tabs.
3. Sidebar often collapsed? → Prefer in-page tabs.

---

## Sub-Item Rules

- Use `SidebarMenuSub` + `SidebarMenuSubItem`.
- Parent shows chevron; rotates when expanded.
- Clicking parent navigates to default view AND expands sub-items.
- Only one parent expanded at a time (accordion).
- Sub-items hidden in collapsed (icon) mode.
- Sub-items: `font-normal` (13px); parents: `font-medium`.

---

## Active State

- Current page: `isActive=true` → `bg-sidebar-accent`, `font-semibold`, solid icon.
- Detail pages: parent nav stays active (e.g., Schedule Detail → "Student Schedule" highlighted).
- Only one item active at any time.

---

## Collapsed (Icon) Mode

- Icons only + tooltip on hover.
- Notification dots for items with unread counts.
- No group labels or separators.
- Logo switches to compact mark.
- Tooltips show full label + badge (e.g., "Slots (24)").

---

## Badge Rules

| Type | Component | Usage |
|------|-----------|-------|
| Count | `CountBadge` | Actionable item counts (Slots 24) |
| Feature | `NewBadge`, `BetaBadge` | New/beta features |

- At most one badge per nav item.
- Badges align right (`ml-auto`).
- In collapsed mode: notification dot replaces badge.

---

## Icon Rules

| Aspect | Primary Nav | Secondary Nav | Utility |
|--------|-------------|---------------|---------|
| Active icon weight | `solid` | `solid` | `regular` |
| Inactive icon weight | `regular` | `regular` | `regular` |
| Font weight | `font-medium` | `font-medium` | `font-normal` |

---

## Breadcrumbs

| Page Level | Breadcrumb |
|------------|------------|
| Primary | None |
| Secondary | `Home > Parent Page` + page title |
| Tertiary | `Home > Parent Page` + deeper context |

- Use static descriptive names ("Schedule Details", "School Profile").
- Each segment is clickable.

---

## Notifications

- **Not** primary nav — it's a utility item.
- Opens a slide-out panel within the sidebar (second column).
- Main nav collapses to icon mode when notification panel is open.
- Unread count: `CountBadge`; red dot in collapsed mode.

---

## Adding a New Nav Item — Checklist

1. Classify: Primary, Secondary, or Utility.
2. Position within the correct group.
3. Choose a Font Awesome icon.
4. Decide badge type (count, feature, or none).
5. Wire active state: `currentPage === item.title`.
6. Set tooltip text for collapsed mode.
7. Add navigation action in `app-store.ts`.
8. Define breadcrumb config in `App.tsx` if detail views exist.

---

## Implementation Reference

- **Component:** `AppSidebar` → `src/components/layout/app-sidebar.tsx`
- **State:** Zustand `useAppStore` for `currentPage` and navigation actions.
- **Collapsible:** `collapsible="icon"` on `<Sidebar>`.
- **Width:** Expanded = 240px, Collapsed = 48px.
