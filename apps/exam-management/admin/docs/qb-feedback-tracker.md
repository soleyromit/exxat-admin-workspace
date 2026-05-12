# QB Product Team Feedback — Work Tracker
> Updated live during sessions. Read this file to restore context after compaction.

## Source: Product team feedback (2026-05-12)

---

## Item 1 — Faculty shell: 15 courses (5 active, 10 inactive)
**Status: DONE**
Fix: Active/Inactive grouping in sidebar tree. Active section always visible (green count badge), Inactive collapsed by default (chevron toggle). Search reverts to flat list.
File: `app/(app)/question-bank/qb-sidebar.tsx`
Revert path: replace grouped render with `filteredRoots.map(...)` flat list (marked with comment).

---

## Item 2 — Admin shell: 100 courses
**Status: DONE (same fix as Item 1)**
Same Active/Inactive grouping handles admin scale. Search + grouping together address 100-course scenario.

---

## Item 3 — Filter: multi-select "Last Edited By" (e.g. Dr. Sarah AND Dr. Marcus)
**Status: DONE**
Fix: Column filter for `creator` / `lastEditedBy` switched from text-match to toggleable checkbox list. Each name shows count. Pill label shows "Name +N" for multi-select.
File: `app/(app)/question-bank/qb-table.tsx` — `ColHeader` component, `getColFilterOptionCounts`.

---

## Item 4 — "All Questions" subfolder for consistency
**Status: REVERTED — user rejected**
Decision: Selecting the course folder already means "all questions". Explicit "All Questions" child node is redundant noise.

---

## Item 5 — Location column: unclickable for restricted folders
**Status: DONE (base) + refinement DONE**
Fix: `LocationCell` checks `accessibleFolderIds.has(loc.folder)` per entry. Inaccessible = lock icon + muted span, no onClick. Applied to both primary cell and +N popover list.
File: `app/(app)/question-bank/qb-table.tsx` — `LocationCell`.

Additional: Multi-folder location data populated in `lib/qb-mock-data.ts` (5 questions with `extraFolders`).

---

## Item 6 — WCAG 200% zoom
**Status: DONE + deferred remainder confirmed**
Done: Title bar hidden at ≤768px, compact toolbar (title + avatars + Add Question) shown.
Confirmed defer: keyboard shortcuts, high contrast, focus order — pending dedicated a11y sprint.

---

## Item 7 — Deep subfolder UX breaking at 5+ levels
**Status: NOT DONE — needs user's QB v10/v2 design**

What was tried and rejected:
- ❌ Ancestor path text in hover popover — user did not ask for this, REVERTED
- ❌ Two-column flyout overlay — concept was wrong (hover-column pattern doesn't handle deep trees), REVERTED
- ✅ Indent clamp at depth 3 (max 56px) — shipped, still in place

What the user asked for: "easier to ACCESS deeply nested folders" — not just visibility. User referenced their original QB v10 / QB v2 HTML design as the solution.

**Next action: User needs to share QB v10/v2 HTML design before implementing.**

---

## Sidebar Issues (raised 2026-05-12)

### Black right border on navbar
**Status: DONE**
Root cause: DS sidebar uses Tailwind `border-e` (width-only, no color class) → defaults to `currentColor` → near-black.
Fix: `globals.css` — `[data-slot="sidebar-container"] { border-inline-end-color: var(--sidebar-border); border-inline-start-color: var(--sidebar-border); }`

### Sticky footer at 200% zoom
**Status: Noted, not a code bug**
DS `SidebarFooter` IS outside `SidebarContent` — structure correct. The dropdown items (Roles & Access, Settings, Get Help) render via Radix portal so they're viewport-positioned. At 200% zoom they can overflow the viewport — Radix positioning issue, not a scroll/sticky bug. Cannot override without patching the DS.

---

## Toggle Component — DS ToggleSwitch replaced everywhere
**Status: DONE**
Root cause: DS `ToggleSwitch` renders `border-2 border-input` gray ring halo on all surfaces.
Fix: `QBToggle` promoted to shared component at `components/qb/toggle.tsx`.
Replaced in:
- `app/(app)/question-bank/qb-table.tsx` (was local, now imported)
- `components/question-editor/question-editor.tsx` (via `ToggleSwitchRow`)
- `app/(app)/settings/page.tsx` (5 toggles)
- `app/(app)/courses/[id]/tabs/overview-tab.tsx` (chat policy toggle)

---

## Things that were PROPOSED but NOT built (conceptual only)
- Flyout column-view folder browser (reverted after Mobbin research showed wrong pattern)
- Ancestor path breadcrumb in hover popover (reverted — user didn't ask for it)
- "All Questions" virtual tree node (reverted — redundant with course selection)

---

## Pending decisions needed from user / Vishaka
- Item 7: Share QB v10/v2 HTML design for deep folder navigation
- Item 1/2: Confirm semester label ("Spring 2026") for Active/Inactive split — currently hardcoded as `ACTIVE_SEMESTER = 'Spring 2026'` in `qb-sidebar.tsx`
- Item 7 (alt): Depth limit at 4 levels — check with Vishaka before enforcing
