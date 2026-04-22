# WCAG 2.1 AA Compliance Audit — Exxat One

**Audit date:** March 2025  
**Last updated:** March 2026 (fixes applied)  
**Standards:** [docs/design-system/accessibility.md](./accessibility.md)

---

## Summary

| Category | Compliant | Violations |
|----------|-----------|------------|
| Icon-only buttons (aria-label + Tooltip) | Improved | 5+ remaining |
| Decorative icons (aria-hidden) | Improved | 2+ remaining |
| Regions (role="region" + aria-label) | Partial | 2 |
| Sheet/Dialog close | ✓ Fixed | — |
| Form inputs (Label/aria-label) | Improved | 3+ remaining |

### Fixes applied (March 2026)

- **Sheet close:** Added Tooltip + aria-label + aria-hidden
- **Inbox close:** Added Tooltip + aria-hidden
- **Table properties:** Tooltips for Back, Get Started close, Remove sort, Pin column, Group remove; aria-hidden on icons
- **Filter clause:** Tooltips for More actions, Remove clause; aria-hidden on expand/collapse and remove-value icons
- **Floating action bar:** Tooltip for Clear selection
- **Pagination:** Tooltips for Prev/Next; aria-label on Rows per page Select
- **Primary page template:** Tooltip for filter toggle
- **View manager:** aria-label + aria-hidden on Settings and Add view (Tooltip omitted for Radix trigger compatibility)

---

## 1. Icon-only buttons — Missing Tooltip

**AA requirement:** Icon-only buttons need BOTH `aria-label` AND `Tooltip`.

### High priority (frequently used)

| File | Location | Issue |
|------|----------|-------|
| `table-properties.tsx` | View settings trigger (line ~695) | Has sr-only, no Tooltip |
| `table-properties.tsx` | Back button (line ~704) | Has aria-label, no Tooltip |
| `table-properties.tsx` | Close Get Started (line ~509) | Has aria-label, no Tooltip |
| `table-properties.tsx` | Remove sort (line ~612) | Has aria-label, no Tooltip |
| `filter-clause.tsx` | More actions, Remove clause (396, 403) | Has aria-label, no Tooltip |
| `inbox-panel.tsx` | Close inbox (line 70) | Has aria-label, no Tooltip |
| `view-manager.tsx` | View settings trigger (line ~449) | Has sr-only, no Tooltip |
| `primary-page-template.tsx` | Filter toggle (line ~340) | Uses Button, needs Tooltip |
| `requested-slots-page.tsx` | Filter toggle (line 252) | Has aria-label, no Tooltip |
| `approved-slots-page.tsx` | Filter toggle (line 131) | Has aria-label, no Tooltip |
| `floating-action-bar.tsx` | Clear selection (line ~143) | Has aria-label, no Tooltip |
| `pagination.tsx` | Prev/Next (lines 99, 111, 122) | Has aria-label, no Tooltip |

### Medium priority

| File | Location | Issue |
|------|----------|-------|
| `schedule-page.tsx` | Icon buttons | Check for Tooltip |
| `schedule-detail-page.tsx` | Icon buttons | Check for Tooltip |
| `job-detail-page.tsx` | Multiple size="icon" | No Tooltip |
| `apply-job-modal.tsx` | Icon buttons | No Tooltip |
| `top-nav-profile.tsx` | Icon button | No Tooltip |
| `submit-preferences-flow.tsx` | Back buttons | Has aria-label, no Tooltip |
| `internship-card.tsx` | Icon button | No Tooltip |
| `top-sidebar.tsx` | Icon buttons | No Tooltip |
| `jobs-page.tsx` | Search, filter icons | No Tooltip |
| `job-list-page.tsx` | Icon buttons | No Tooltip |
| `profile-settings-modal.tsx` | Icon buttons | No Tooltip |
| `rich-text-editor.tsx` | Icon button | No Tooltip |
| `schedule-calendar-view.tsx` | Prev/Next | No Tooltip |
| `product-switcher.tsx` | Icon button | No Tooltip |
| `scroll-carousel.tsx` | Prev/Next | No Tooltip |
| `top-nav.tsx` | Menu, icon buttons | No Tooltip |
| `jobs-list-modal.tsx` | Icon button | No Tooltip |
| `sidebar.tsx` | SidebarTrigger | sr-only, no Tooltip |
| `leo-panel.tsx` | Close, Send | sr-only, no Tooltip |
| `leo-ai-page.tsx` | Attach, Send | aria-label, no Tooltip |

### Low priority (design system demos)

| File | Location | Issue |
|------|----------|-------|
| `design-system/components-tab.tsx` | Icon button demos | No Tooltip |

---

## 2. Decorative icons — Missing aria-hidden

| File | Location | Icon |
|------|----------|------|
| `filter-clause.tsx` | 397, 404 | MoreHorizontal, Trash2 |
| `table-properties.tsx` | 696, 705, 510 | Settings, ChevronLeft, X |
| `view-manager.tsx` | 450 | Settings |
| `data-table.tsx` | Column headers, pagination | ChevronDown, ChevronLeft/Right |
| `select.tsx` | ChevronDown in trigger | ChevronDown |

---

## 3. Sheet close button — Missing Tooltip

| File | Location | Issue |
|------|----------|-------|
| `sheet.tsx` | Close button (line ~79) | Has sr-only, no Tooltip, no aria-label on element |

---

## 4. Regions — Missing role="region" + aria-label

| File | Location | Issue |
|------|----------|-------|
| `leo-panel.tsx` | Chat input area | No role="region" |
| `primary-page-template.tsx` | Bulk bar | Verify role + aria-label |

---

## 5. Form inputs — Missing Label or aria-label

| File | Location | Issue |
|------|----------|-------|
| `filter-bar.tsx` | Search options input | No aria-label |
| `leo-panel.tsx` | Textarea | No aria-label |
| `key-metrics-showcase.tsx` | SelectTrigger | No aria-label |
| `data-table.tsx` | Rows per page Select | No aria-label |
| `filter-clause.tsx` | Date SelectTrigger | No aria-label |
| `table-properties.tsx` | SelectTriggers | No aria-label |

---

## 6. Custom tabs — Arrow key support

| File | Location | Status |
|------|----------|--------|
| `student-schedule-detail-v2.tsx` | Overview/Compliance tabs | Has Arrow handlers ✓ |

---

## Remediation order

1. **Sheet/Dialog** — Add Tooltip to Sheet close (Dialog already has it)
2. **table-properties.tsx** — Add Tooltips to all icon-only buttons
3. **filter-clause.tsx** — Add Tooltips + aria-hidden to icons
4. **inbox-panel.tsx** — Add Tooltip to close
5. **view-manager.tsx** — Add Tooltip to view settings
6. **floating-action-bar.tsx** — Add Tooltip to clear
7. **pagination.tsx** — Add Tooltips to prev/next
8. **primary-page-template.tsx** — Add Tooltip to filter (or use IconButton)
9. **requested-slots-page.tsx**, **approved-slots-page.tsx** — Add Tooltip to filter
10. **leo-panel.tsx**, **leo-ai-page.tsx** — Add Tooltips to close/send/attach
11. **Remaining pages** — Add Tooltips to icon-only buttons as encountered
