# Question Navigator Panel — Design Spec

## Goal

Replace the current `QuestionJumpPopover` (a small popover above the sticky footer) with a compact right-side split panel that groups questions by status and surfaces a full-context hover tooltip. Removes the segmented filter dropdown — grouping is the filter.

## Architecture

The panel renders as a fixed-width (192px) right column inside the exam layout. When open, the question content area shrinks left (`flex: 1` minus panel width). The panel is toggled by the Q-pill button in the sticky footer. A single `position: fixed` tooltip div is portalled to `document.body` to avoid clipping by the panel's `overflow-y: auto`.

**Tech stack:** React, TypeScript, inline styles + `var(--token)` DS tokens, `ReactDOM.createPortal` for tooltip, Prism theme (`theme-prism`).

---

## Design Decisions

### 1. Layout — Split panel (content shifts left)

- Panel width: **192px**, fixed
- Content area: `flex: 1`, shrinks when panel is open
- No overlay, no dimming — both question and panel visible simultaneously
- Transition: `width` animates from `0` → `192px` over `250ms ease`
- Panel trigger: the **Q N/M pill** in `StickyFooter` — fills `var(--brand-color)` when active

### 2. Grouping — Status-first, flat across all sections

Three groups, in priority order:

| Group | Color | Label |
|---|---|---|
| Flagged | `var(--state-flagged-bg)` / `var(--state-flagged-text)` | ⚑ Flagged · N |
| Unanswered | `var(--muted)` / `var(--muted-foreground)` | Unanswered · N |
| Answered | `var(--state-answered-bg)` / `var(--state-answered-text)` | Answered · N |

- Questions from all sections are pooled into each group (not separated per section)
- **Locked future-section tiles** appear in Unanswered but are greyed (`var(--muted)`, `opacity: 0.4`) with a lock icon — `aria-disabled`, cursor `not-allowed`
- Locked tile tooltip explains: "Available after you complete Section N"

### 3. Tiles — WCAG-compliant grid

- Size: **28×28px** (above WCAG 2.5.5 AA minimum of 24px)
- Border radius: `6px`
- Font: `12px`, `font-weight: 700`
- Gap: `4px` between tiles, `flex-wrap: wrap`
- **Current tile**: `var(--brand-color)` fill + white text + `0 0 0 3px var(--brand-tint)` ring
- **Focus ring**: `exam-focus` class — `0 0 0 3px var(--brand-tint)` on `:focus-visible`
- **Keyboard**: roving tabindex within each group, `ArrowRight/Left/Up/Down` navigation, `Enter`/`Space` to navigate, `Escape` to close panel

### 4. Hover tooltip — Full context, position: fixed

**Content:**
- Line 1: `Question N` (10px, uppercase, muted) — or `Question N — Current` / `Question N · Section 2` for special states
- Line 2: Truncated question stem (max ~120 chars, 12px)
- Line 3: Status badge (colored pill — Flagged / Answered / Not answered / Viewing now / Locked)

**Positioning:**
- Single `div` with `position: fixed` rendered via `ReactDOM.createPortal` into `document.body`
- `getBoundingClientRect()` on `mouseenter` → center above tile, clamped to viewport edges
- `display: none` by default; shown on `mouseenter` + `focus`, hidden on `mouseleave` + `blur` with 80ms delay

**Tooltip visual:**
- Background: `var(--foreground)` (dark)
- Text: `var(--background)` (light)
- Border radius: `8px`
- Width: `200px`
- Arrow: CSS `clip-path` triangle below

### 5. Accessibility

| Requirement | Implementation |
|---|---|
| WCAG 2.5.5 — Touch target | 28×28px tiles |
| WCAG 1.4.1 — Color not sole encoding | Group header text carries status; tile color is redundant |
| WCAG 1.4.3 — Contrast | Amber `#92400e` on `#fef3c7` = 5.1:1 · Green `#15803d` on `#dcfce7` = 4.6:1 · Both pass AA |
| WCAG 2.4.11 — Focus ring | `exam-focus` class, 3px ring at 4.5:1 contrast |
| Screen reader | `aria-label="Question N, flagged"` per tile · `role="group"` + `aria-labelledby` per section · `role="complementary"` on panel · `aria-disabled` on locked tiles |
| Keyboard navigation | Roving tabindex + arrow keys within groups · `Escape` closes panel |

### 6. Panel stays open on navigate

Clicking a tile calls `onNavigate(index)` without closing the panel. Students can step through all flagged questions in sequence without reopening. Panel closes via: close button (✕), `Escape` key, or clicking the Q pill again.

### 7. Section handling

- Multi-section exams: all sections pooled flat into each status group
- Locked tiles (future sections that require sequential unlock): visible in Unanswered, greyed + lock icon
- No section-pager within the panel (removed from current `QuestionJumpPopover`)

---

## Component Structure

```
QuestionNavPanel (new)
  ├── PanelHeader        — "Questions" label · N/M count · close button
  ├── PanelBody          — overflow-y: auto scroll container
  │   ├── NavGroup (×3)  — Flagged / Unanswered / Answered
  │   │   ├── GroupHeader — icon + title + count badge
  │   │   └── TileGrid   — flex-wrap grid of NavTile
  │   │       └── NavTile — 28×28 button, roving tabindex
  └── NavTooltip         — ReactDOM.createPortal → document.body
```

**Files to create:**
- `src/components/QuestionNavPanel.tsx` — replaces `QuestionJumpPopover.tsx`
- `src/components/NavTooltip.tsx` — portal-based fixed tooltip

**Files to modify:**
- `src/App.tsx` — add panel open state, wire panel alongside question content
- `src/components/StickyFooter.tsx` — lift `showNavigator` state to App, remove popover

**Files to delete:**
- `src/components/QuestionJumpPopover.tsx` — replaced by `QuestionNavPanel`

---

## Token Map

| Element | Token |
|---|---|
| Panel background | `var(--card)` |
| Panel border | `var(--border)` |
| Panel header bg | `var(--muted)` |
| Group title | `var(--muted-foreground)` |
| Flagged tile bg | `var(--state-flagged-bg)` |
| Flagged tile text | `var(--state-flagged-text)` |
| Answered tile bg | `var(--state-answered-bg)` |
| Answered tile text | `var(--state-answered-text)` |
| Current tile bg | `var(--brand-color)` |
| Current tile text | `#fff` |
| Unanswered tile bg | `var(--muted)` |
| Unanswered tile text | `var(--muted-foreground)` |
| Focus ring | `var(--brand-tint)` |
| Tooltip bg | `var(--foreground)` |
| Tooltip text | `var(--background)` |

---

## Out of scope

- Student notes / text annotations on questions (future)
- Section-pager within panel (removed — status grouping replaces it)
- Panel resize / drag handle (fixed 192px)
- Offline / exam lockdown mode changes
