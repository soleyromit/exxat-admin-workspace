# Question Bank Updates — Design Spec
**Date:** 2026-04-20  **Author:** Romit Soley  **Status:** Approved

---

## Section 1 — Data Model

### Status: Before → After

```
BEFORE (7 values)                    AFTER (2 values)
─────────────────                    ────────────────
Active                           ──► Saved
Ready                            ──► Saved
Approved                         ──► Saved
Locked                           ──► Saved
In Review                        ──► Saved
Draft                            ──► Draft
Flagged                          ──► Saved
```

### Question type — field changes

| Field | Before | After |
|---|---|---|
| `shortlisted` | `boolean` | renamed → `favorited: boolean` |
| `folderPath` | (missing) | **added** `string` — `"PHAR101 QB / Cardiology / Week 3"` |
| `status` | 7-value union | `'Saved' \| 'Draft'` |

### FolderNode — fields removed

| Field | Reason |
|---|---|
| `isCourseOffering` | Offerings removed from QB tree |
| `courseYear` | Offerings removed from QB tree |
| `isQuestionSet` | Question Sets removed from QB |
| `isLifetimeRepo` | No longer applicable |

### New types (scaffolded pages)

```ts
Course          { id, code, name, offerings[] }
CourseOffering  { id, courseId, semester, year, studentCount }
Assessment      { id, courseOfferingId, title, questionCount, questions[{ id, difficulty }] }
```

### Mock data changes summary

```
mockCourses[]         ← new
mockCourseOfferings[] ← new
mockAssessments[]     ← new

All questions:  status Active/Ready/Approved/Locked → 'Saved'
                status Draft                         → 'Draft'
                shortlisted                          → favorited
                folderPath                           → added per question

Folder tree:    offering nodes removed
                child folders move up one level under course
                course names → "PHAR101 Question Bank (QB)"
                qs-midterm-2024 (question set) → removed
```

---

## Section 2 — State & Role Logic

### Visibility matrix

```
                     Admin's    Faculty's   Faculty's   Admin's
                     Saved Qs   Saved Qs   Draft Qs    Draft Qs
                     ─────────  ─────────  ─────────   ─────────
Admin sees:            ✓          ✓           ✗           ✓
Faculty sees:          ✓          ✓           ✓ (own)     ✗
```

### Faculty empty states

```
NO FOLDERS ASSIGNED                  FOLDERS ASSIGNED
───────────────────────────          ───────────────────
                                     → Auto-select first course on mount
   fa-folder-open (56px muted)       → No empty state shown
   fa-lock-keyhole (20px brand)
                                     
   No question banks yet
   
   You haven't been added to         (removed — "select a course"
   any courses yet. Once your         empty state eliminated entirely)
   administrator assigns you,
   it will appear here.
   
   [ Request Access ]
```

### New state fields

| Field | Type | Purpose |
|---|---|---|
| `highlightedFolderId` | `string \| null` | Triggers 1500ms flash on sidebar folder row |
| `columnOrder` | `string[]` | Tracks drag-to-reorder column sequence |
| `favoritesFilter` | `boolean` | Toolbar favorites filter toggle |

---

## Section 3 — QB Sidebar

### Tree structure: Before → After

```
BEFORE                               AFTER
──────────────────────               ──────────────────────────────────
🎓 PHAR101                           🎓 PHAR101 Question Bank (QB)
  📅 Fall 2026          ──removed      📁 Cardiology
    📁 Cardiology                        📁 Pharmacokinetics
    📁 Pharmacokinetics               📁 Drug Interactions
  📅 Spring 2026        ──removed
    📁 Drug Interactions             🎓 BIOL201 Question Bank (QB)
🎓 BIOL201                             📁 Cell Biology
  📅 Fall 2026          ──removed
    📁 Cell Biology                  🎓 SKEL101 Question Bank (QB)
📋 qs-midterm-2024      ──removed      📁 Bones & Joints
  (Question Set)
```

### Context menu — removals

```
REMOVED FROM ALL CONTEXT MENUS       KEPT
──────────────────────────────       ──────────────────────────
New Question Set                     Rename
Lock / Unlock Folder                 Add Subfolder
[all offering-level items]           Manage Collaborators
                                     Share / Access
                                     Archive
                                     Delete
```

### Sidebar header — removed element

```
BEFORE                               AFTER
─────────────────────────            ─────────────────
Library              [+]             Library
                      ↑ removed
```

### Folder row highlight flash (on subfolder/breadcrumb click)

```
t=0ms    → background: var(--brand-tint)   [highlighted]
t=1500ms → background: transparent         [faded out]
           CSS transition: background 1500ms ease
```

---

## Section 4 — QB Table

### Column definitions

```
┌──────────────┬─────────────────────────┬───────────────────────────────────┐
│ Key          │ Header                  │ Change                            │
├──────────────┼─────────────────────────┼───────────────────────────────────┤
│ question     │ Question                │ Remove control type pill from cell │
│ status       │ Status                  │ Saved / Draft only                 │
│ type         │ Type          ★ NEW     │ Neutral text + fa-light icon       │
│ difficulty   │ Difficulty              │ Plain --muted-foreground text only  │
│ subfolder    │ Location      ★ NEW     │ Full path, each segment clickable  │
│ lastEditedBy │ Last Edited By          │ Renamed from creator/edited        │
│ favorited    │ ★ (star icon)           │ Replaces shortlisted/bookmark      │
│ blooms       │ Bloom's                 │ Unchanged                          │
│ usage        │ Usage                   │ Unchanged                          │
│ pbis         │ P-Bis                   │ Unchanged                          │
│ version      │ Version                 │ Unchanged                          │
└──────────────┴─────────────────────────┴───────────────────────────────────┘
```

### Question cell: Before → After

```
BEFORE                               AFTER
─────────────────────────────        ─────────────────────────────
📌 Drug Metabolism Basics            📌 Drug Metabolism Basics
   PH-MET-001 · v2  [MCQ]              PH-MET-001 · v2
                        ↑ removed
```

### Favorites: Before → After

```
BEFORE (bookmark)                    AFTER (favorites)
─────────────────────────────        ─────────────────────────────
Toolbar: [🔖 Shortlisted]            Toolbar: [☆ Favorites]  ← --chart-4 amber when active
Row:     🔖 icon                     Row:     ☆ fa-light fa-star (off)
                                              ★ fa-solid fa-star --chart-4 (on)
```

### Difficulty: Before → After

```
BEFORE                               AFTER
─────────────────────────────        ─────────────────────────────
Easy    weight 500, base color       Easy    --muted-foreground plain text
Medium  weight 600, mid color        Medium  --muted-foreground plain text
Hard    weight 700, hard color       Hard    --muted-foreground plain text
```

### Subfolder column interaction

```
Cell content:   PHAR101 QB  /  Cardiology  /  Week 3
                ──────────     ─────────     ──────
                    │              │             │
               hover = popover  hover = popover  hover = popover
               click = navigate to PHAR101 QB in sidebar

On click → sets selectedFolderId
         → expands + scrolls sidebar tree
         → sets highlightedFolderId (1500ms flash)
```

### Folder snapshot popover (hover any path segment)

```
┌─────────────────────────────────┐
│ 📁 Cardiology                   │
│ ─────────────────────────────── │
│ [DT][SC]  Dr. Thompson, Dr. Chen│
│ 📋  14 questions                │
│ 🕐  Last updated 2 days ago     │
│ ─────────────────────────────── │
│ [████Easy████|████████Med|██Hrd]│
│   6 (43%)      5 (36%)   3 (21%)│
└─────────────────────────────────┘
```

### Difficulty column header popover (hover column header)

```
┌─────────────────────────────────────┐
│ Difficulty Distribution             │
│ ─────────────────────────────────── │
│ [████████████░░░░░░░░]  Easy   6 43%│  ← --chart-2 teal
│ [████████░░░░░░░░░░░░]  Medium 5 36%│  ← --chart-4 amber
│ [████░░░░░░░░░░░░░░░░]  Hard   3 21%│  ← --chart-1 indigo
└─────────────────────────────────────┘
Updates live as filters change
```

### Column header context menu

```
┌────────────────────────┐
│ ↑  Sort Ascending      │
│ ↓  Sort Descending     │
│ ─────────────────────  │
│ ≡  Filter by [Column]  │  → opens inline column filter Popover
│ ─────────────────────  │
│ ⊘  Hide Column         │  (disabled on question column)
└────────────────────────┘
```

### Inline column filter popover

```
┌──────────────────┐
│ Filter by Type   │
│ ──────────────── │
│ ☑ MCQ            │
│ ☑ Fill blank     │
│ ☐ Hotspot        │
│ ☐ Ordering       │
│ ☐ Matching       │
│ ──────────────── │
│ Clear            │
└──────────────────┘
Synced with FilterSheet — reads/writes same state
```

### Column drag-to-reorder

```
User drags "Type" header left past "Status":

[Question][Status][Type][Difficulty]...
                ↕ drag
[Question][Type][Status][Difficulty]...

Rules:
- question column pinned left — never draggable
- columnOrder[] in state tracks sequence
- onDragStart → store dragged col key
- onDragOver → show drop indicator line
- onDrop    → splice columnOrder[]
```

---

## Section 5 — Header, Title & Badges

### Header: Before → After

```
BEFORE
────────────────────────────────────────────────────────────────────
[≡] Question Bank › PHAR101 QB › Cardiology    [Dr. Thompson ▾] [Ask Leo]

AFTER
────────────────────────────────────────────────────────────────────
[≡]                                            [Dr. Thompson ▾] [Ask Leo]
```

### Title: Before → After

```
BEFORE
────────────────────────────────────────────────────────────────────
Cardiology                                      [New Question ▾] [⋯]
14 questions · Last updated now

AFTER (Google Drive-style breadcrumb title)
────────────────────────────────────────────────────────────────────
Question Bank › [PHAR101 QB ▾] › [Cardiology ▾]  [New Question ▾] [⋯]
14 questions · Last updated now
```

### Breadcrumb segment interactions

```
Segment:   [PHAR101 QB]  [▾]
              │             │
         hover text      click chevron
              │             │
         Folder snapshot   Sibling switcher dropdown
         popover           ─────────────────────────
                           ● PHAR101 Question Bank (QB) ✓
                             BIOL201 Question Bank (QB)
                             SKEL101 Question Bank (QB)

         click text
              │
         Navigate directly to that folder
```

### Special title states

```
navView = 'all'   →   Question Bank › All Questions      (no chevron)
navView = 'my'    →   Question Bank › My Questions       (no chevron)
navView = 'folder'→   Question Bank › [Course ▾] › [Folder ▾]
root click        →   resets to All Questions view
```

### StatusBadge: Before → After

```
BEFORE (7 variants)                  AFTER (2 variants)
─────────────────────────────        ─────────────────────────────
● Active     green                   ✓ Saved   --chart-2 teal tint
● Ready      blue                    ⏳ Draft   --chart-4 amber tint
● In Review  orange
● Flagged    red                     All others: removed
● Approved   green
● Locked     grey
● Draft      amber
```

### DiffBadge & TypeBadge: Before → After

```
BEFORE                               AFTER
─────────────────────────────        ─────────────────────────────
DiffBadge:                           DiffBadge:
  Easy   weight 500, base color        Easy/Medium/Hard
  Hard   weight 700, hard color        all → --muted-foreground plain text

TypeBadge:                           TypeBadge:
  Colored background per type          --muted-foreground text + fa-light icon
                                       no background color
```

### New CSS tokens (`app/globals.css`)

```css
--qb-status-saved-bg:  color-mix(in oklch, var(--chart-2) 15%, transparent);
--qb-status-saved-fg:  color-mix(in oklch, var(--chart-2) 80%, var(--foreground));
--qb-status-draft-bg:  color-mix(in oklch, var(--chart-4) 15%, transparent);
--qb-status-draft-fg:  color-mix(in oklch, var(--chart-4) 75%, var(--foreground));

/* Sidebar folder highlight flash */
@keyframes folder-highlight {
  0%   { background-color: var(--brand-tint); }
  100% { background-color: transparent; }
}
.folder-highlight { animation: folder-highlight 1500ms ease forwards; }
```

---

## Section 6 — Modals & Filter Sheet

### ManageCollaboratorsModal: Before → After

```
BEFORE                               AFTER
─────────────────────────────        ──────────────────────────────────────
[Collaborators] [Folder Visibility]  Manage Access
                 ↑ tab removed       PHAR101 QB › Cardiology
                                     ──────────────────────────────────────
Basic list:                          People with access
  Name  Role  [Remove]
                                     [DT] Dr. Thompson      Admin · Owner
                                     [SC] Dr. Sarah Chen    [Can Edit ▾]  [×]
                                     [JP] Dr. James Patel   [View Only ▾] [×]
                                     ──────────────────────────────────────
                                     Add people
                                     [🔍 Search faculty by name...        ]
                                                            [Can Edit ▾]
                                                               [Invite]
```

**Interaction details:**
```
Role change  → Select inline, updates immediately
Remove       → inline "Remove Sarah Chen? [Undo]" — auto-dismisses 3s
Search       → filters available faculty (excludes already-added)
Invite       → disabled until faculty selected from search
```

### FilterSheet — changes

```
BEFORE sections                      AFTER sections
─────────────────────────────        ─────────────────────────────
Type                                 ★ Favorites (new — top)
Status (7 checkboxes)                   ○ Show favorites only
Difficulty (colored labels)
Bloom's                              Type (unchanged)

                                     Status (2 checkboxes only)
                                        ☑ Saved
                                        ☑ Draft

                                     Difficulty (neutral labels)

                                     Bloom's (unchanged)
```

### SmartPopulateModal — status language update

```
BEFORE                               AFTER
─────────────────────────────        ─────────────────────────────
"Promote Drafts to Active"           "Promote Drafts to Saved"
Step 1: filter by any status         Step 1: shows Draft questions only
Success: "Questions are now Active"  Success: "Questions are now Saved"
```

---

## Section 7 — New Nav Pages

### App Sidebar — new items

```
┌─────────────────────────────┐
│  [logo]                     │
│  ─────────────────────────  │
│  🎓  Courses          ← new │
│  📋  Assessment Builder← new│
│  📁  Question Bank          │
│  ...                        │
└─────────────────────────────┘
```

### Courses Page (`/courses`)

```
┌──────────────────────────────────────────────────┐
│ Courses                              [+ New] ⓘ   │
│ 3 courses                                        │
├──────────────────────────────────────────────────┤
│ ▼ PHAR101 · Pharmacology                         │
│   │                                              │
│   ├─ 👥 Fall 2026    32 students  [View QB →]    │
│   └─ 👥 Spring 2026  28 students  [View QB →]    │
│                                                  │
│ ▼ BIOL201 · Biology                              │
│   └─ 👥 Fall 2026    41 students  [View QB →]    │
│                                                  │
│ ▶ SKEL101 · Skeletal Anatomy                     │
└──────────────────────────────────────────────────┘

[+ New]   → disabled, Tooltip "Coming soon"
[View QB] → navigates to /question-bank with course pre-selected
▼ / ▶     → DS Collapsible expand/collapse
```

### Assessment Builder Page (`/assessment-builder`)

```
┌──────────────────────┬───────────────────────────────────────────┐
│ Courses              │ PHAR101 · Fall 2026    3 Assessments       │
│ ────────────────     │ ─────────────────────────────────────────  │
│ ● PHAR101            │ [All] [High Difficulty] [Unbalanced]       │
│   ● Fall 2026        │                          ← Tabs line style │
│     Spring 2026      │ ┌─────────────────────────────────────┐   │
│   BIOL201            │ │ Midterm Exam                        │   │
│     Fall 2026        │ │ 40 questions                        │   │
│   SKEL101            │ │ [████Easy████|████████Med|████Hard] │   │
│     Fall 2026        │ │                       [View Questions]│  │
│                      │ └─────────────────────────────────────┘   │
│                      │ ┌─────────────────────────────────────┐   │
│                      │ │ Final Exam                          │   │
│                      │ │ 60 questions                        │   │
│                      │ │ [███Easy███|██████████Med|████Hard] │   │
│                      │ │                       [View Questions]│  │
│                      │ └─────────────────────────────────────┘   │
└──────────────────────┴───────────────────────────────────────────┘

Left panel (240px):   course + offering tree, first offering auto-selected
Assessment cards:     DS Card component
Difficulty bar:       --chart-2 teal / --chart-4 amber / --chart-1 indigo
[View Questions]:     Button variant="ghost" size="sm" — placeholder, no nav yet
Smart views tabs:     Tabs variant="line"
```

---

## Section 8 — Toolbar, Navigation Defaults & Sidebar Search

### Default view

```
navView initializes to 'my'  ←  My Questions is the default
```

### Toolbar — updated layout

```
BEFORE                               AFTER
─────────────────────────────        ─────────────────────────────────────────
[count]    [🔍] [🔖] [≡]            [count]    [🔍 Search folders...] [👤] [⭐] [≡]
                                                  sidebar search    my  fav  props
```

**Toolbar icon buttons (right of search):**

| Button | Icon | Active state | Aria label |
|---|---|---|---|
| My Questions | `fa-user` | `--brand-color` border + tint bg | "Show my questions only" |
| Favorites | `fa-star` | `--chart-4` amber border + tint bg | "Show favorites only" |
| Properties | `fa-sliders` | `--brand-color` + count badge | "Table properties" |

**My Questions toggle logic:**
```
myQuestionsOnly = true  →  table shows only questions where creator === currentPersona.id
                           works as intersection with active folder selection
                           i.e. My Questions + Cardiology folder = my questions IN Cardiology
myQuestionsOnly = false →  all role-visible questions in current folder/view
```

**Sidebar folder search:**
```
┌──────────────────────────────┐
│ Library                      │
│ [🔍 Search folders...      ] │  ← InputGroup, compact (h-7), full-width
│──────────────────────────────│    clears on Escape, autofocuses on click
│ All Questions  My Questions  │    filters tree nodes in real-time
│──────────────────────────────│    matching nodes stay, non-matching hidden
│ ▼ PHAR101 Question Bank (QB)│    parent nodes stay open if child matches
│   📁 Cardio [filtered]       │
│   📁 Pharmaco [filtered]     │
│ ▼ BIOL201 Question Bank (QB)│
│   📁 Cell Bio [filtered]     │
└──────────────────────────────┘
```

---

## Section 9 — Collaborator Avatars in Main Area

### Placement — `qb-title.tsx` subtitle row

```
Question Bank › [PHAR101 QB ▾] › [Cardiology ▾]      [New Question ▾] [⋯]
14 questions · Last updated 2 days ago  ·  [DT][SC][JP]+1  [+ Add]
                                            ↑ avatar stack (Figma-style)
```

**Avatar stack:**
- DS `Avatar` + `AvatarFallback` per collaborator
- Stacked with `ml-[-8px]` overlap, max 3 shown
- `+N` DS `Badge variant="secondary"` for overflow
- `[+ Add]` → `Button variant="ghost" size="icon-xs"` `fa-user-plus` — admin only

**Hover popover (DS `Popover`):**
```
┌──────────────────────────────────────┐
│ Shared with                          │
│ ──────────────────────────────────── │
│ [DT] Dr. Thompson      Owner         │
│ [SC] Dr. Sarah Chen    [Can Edit ▾]  │  ← Select (admin only)
│ [JP] Dr. James Patel   [View Only ▾] │
│ [+1] Show all (4 people)             │
│ ──────────────────────────────────── │
│ [+ Add people]   Button outline sm   │  ← admin only, opens ManageCollaboratorsModal
└──────────────────────────────────────┘
```

**Role rules:**
- Admin: sees role `Select` per row + `[+ Add people]` button
- Faculty: sees names + roles as read-only text only, no Select, no Add

---

## Section 10 — Smart Views: Removed Entirely

### What's removed

```
BEFORE                               AFTER
─────────────────────────────        ─────────────────────────────
QB tab strip:                        QB tab strip: GONE
  [All Questions] [My Questions]
  [Pending Review] [Low Discrim.]    Navigation lives in sidebar only:
  [Never Used] [High Difficulty]       • All Questions  (quick nav)
  [My MCQs] [+ Add view]              • My Questions   (quick nav)
  ↑ entire strip removed

Filter sheet smart views:            Filter sheet: column types only
  Saved views, smart criteria          • Status (Saved / Draft)
  ↑ removed                           • Type
                                       • Difficulty
                                       • Bloom's
                                       • Favorites toggle
```

### Files affected

| File | Change |
|---|---|
| `qb-tabs.tsx` | **Deleted** — entire file removed |
| `qb-state.tsx` | Remove `smartViews[]`, `activeTabId`, `SVItem` type references |
| `qb-types.ts` | Remove `SVItem` type |
| `qb-mock-data.ts` | Remove `mockSmartViews[]` array |
| `question-bank-client.tsx` | Remove `<QBTabs />` render |

---

## Section 11 — Product Reference & Interaction Standards

> These are the design quality benchmarks. Every QB component is measured against them.

### Reference products → QB mapping

```
LINEAR               → Question table, filters, keyboard nav, bulk actions
FIGMA                → Collaborator avatars, hover popovers, access control
NOTION               → Breadcrumb nav, folder dropdown pickers, property sidebar
GITHUB               → Version history timeline, review workflows
VERCEL               → Status badges, activity feed, clean typography hierarchy
CURSOR / CLAUDE      → Ask Leo integration, contextual AI suggestions
PERPLEXITY           → Search UX, result hierarchy, instant feedback
```

---

### Table (Linear-inspired)

```
WHAT LINEAR DOES                     QB EQUIVALENT
─────────────────────────────        ─────────────────────────────
⌘K command palette                   ⌘K opens expandable search (already in toolbar)
Keyboard row navigation              ↑ ↓ arrows navigate rows, Enter opens detail
Shift+click range select             Shift+click selects question range
Row hover reveals actions smoothly   ⋯ + star + shortlist appear on hover with opacity transition
Active filters = inline chips        Filter chips appear below toolbar when active
Count updates live                   "14 of 47 questions" updates as filters change
Bulk action bar slides up            Animate-in from bottom when rows selected
Empty state is friendly              fa-inbox + copy + single CTA, never a blank screen
```

**Active filter chips (Linear-style):**
```
[count]  [Status: Draft ×] [Type: MCQ ×] [Clear all]    [🔍][👤][⭐][≡]
         ↑ chips appear inline below toolbar when any filter is active
         × on each chip clears that specific filter
         "Clear all" clears everything
```

---

### Collaborator avatars (Figma-inspired)

```
WHAT FIGMA DOES                      QB EQUIVALENT
─────────────────────────────        ─────────────────────────────
Avatar stack in header               Avatar stack in title subtitle row
Hover = names + presence             Hover = names + roles + quick access edit
Click avatar = profile card          Hover popover = role Select + Add people
+N overflow badge                    +N DS Badge → "Show all N people" link
Share button always visible          [+ Add] icon always visible (admin only)
```

---

### Version history (GitHub-inspired)

```
WHAT GITHUB DOES                     QB EQUIVALENT
─────────────────────────────        ─────────────────────────────
Timeline list (newest first)         V3 at top, V1 at bottom
Each commit = author + time + msg    Each version = author + age + title snippet
SHA badge                            V3 badge with brand-tint bg (latest)
Restore button per commit            "Use this version" button per row (owner only)
No "current" label                   No "current" — any version is equally valid ✓
```

**Version history popover (updated):**
```
┌────────────────────────────────────────┐
│ Version History                        │
│ ──────────────────────────────────── │
│ [V3] Drug Metabolism Basics            │  ← brand-tint bg (latest, not "current")
│      Dr. Thompson · 2 days ago         │
│                         [Use this ▾]  │
│ [V2] Revision 2                        │
│      Dr. Thompson · 3 weeks ago        │
│                         [Use this ▾]  │
│ [V1] Revision 1                        │
│      Dr. Thompson · 2 months ago       │
│                         [Use this ▾]  │
│ ──────────────────────────────────── │
│  fa-lock  Only creator can restore    │  ← shown for non-owners only
└────────────────────────────────────────┘
```

---

### Breadcrumb navigation (Notion-inspired)

```
WHAT NOTION DOES                     QB EQUIVALENT
─────────────────────────────        ─────────────────────────────
Page title = breadcrumb              qb-title h1 = breadcrumb ✓
Click segment = sibling picker       Chevron ▾ = sibling DropdownMenu ✓
Hover = page preview card            Hover = folder snapshot Popover ✓
Smooth open/close transitions        Popover/Dropdown uses DS animation defaults
Escape closes all open overlays      closeAllOverlays() already in qb-state ✓
```

---

### Search UX (Perplexity-inspired)

```
WHAT PERPLEXITY DOES                 QB EQUIVALENT
─────────────────────────────        ─────────────────────────────
Search is always primary             Toolbar search is always accessible (icon expands)
Instant results, no submit           Table filters live as you type, 0ms debounce
Clear search = instant reset         Escape clears + collapses search
Result count feedback                "14 of 47 questions" updates live
Empty state is helpful               "No questions match" + "Clear filters" link
```

---

### Micro-interactions (across all components)

```
INTERACTION              ANIMATION                          DURATION
──────────────────────   ──────────────────────────────────  ──────────
Bulk action bar appears  slide-in-from-bottom + fade-in       150ms
Bulk action bar leaves   slide-out-to-bottom + fade-out       100ms
Folder highlight flash   background brand-tint → transparent  1500ms ease
Filter chip appears      fade-in + scale-in                    100ms
Filter chip dismisses    fade-out + scale-out                  80ms
Row hover actions        opacity 0 → 1                         120ms
Popover opens            DS default (zoom + fade)             150ms
Sidebar tree expand      height 0 → auto                      200ms ease
Avatar hover popover     DS default delay 300ms               150ms open
Search expand            width 0 → 220px                      200ms ease
Sidebar search filter    tree nodes fade non-matching         100ms
```

---

### Content hierarchy (Vercel-inspired)

```
HIERARCHY                VISUAL TREATMENT
──────────────────────   ─────────────────────────────────────────────────────
Question title           text-sm font-medium --foreground    ← primary, dominant
Code badge               font-mono text-[10px] --muted-fg    ← secondary, quiet
Status badge             Saved/Draft with tint bg + icon     ← semantic, not loud
Type                     --muted-foreground plain text        ← metadata, recedes
Difficulty               --muted-foreground plain text        ← metadata, recedes
Creator                  Avatar + name, trust badge small     ← identity, supports
Version                  V3 pill, brand-tint bg              ← utility, on-demand
Actions (⋯ ★)            opacity-0 → revealed on hover       ← progressive disclosure
```

---

### End-to-end workflows

**Question lifecycle:**
```
Create → [New Question] → Draft (private, owner only)
Edit   → Edit in place or full page → still Draft
Share  → Promote Draft → Saved (visible to collaborators)
Use    → Assessment Builder pulls Saved questions
Revise → Creates new version → old versions preserved
Retire → Archive (removes from active views, not deleted)
```

**Folder access workflow:**
```
Admin creates folder
  → Sets collaborators via [+ Add] or ManageCollaboratorsModal
  → Faculty gains access (folder appears in their sidebar)
  → Faculty sees Saved questions + own Drafts inside
  → Faculty can promote their Drafts to Saved
  → Admin sees all Saved (not faculty Drafts)
```

**Favorites workflow:**
```
Any user → click ★ on any visible question → toggled instantly (optimistic)
         → toolbar [⭐] active → shows only favorited questions
         → works as intersection with folder + My Questions filters
         → favoritesFilter persists across folder navigation (session only)
```

**Version restore workflow:**
```
Open version popover → see all versions newest-first
Owner only → [Use this ▾] per version → DropdownMenu:
  "Use as new version" → creates V4 with V2 content
  "Preview"            → read-only preview modal (future)
Non-owner → versions visible but no restore action shown
```

---

## Section 13 — DS Compliance Audit

All violations found in the current codebase. Every item below is a **hard requirement** for implementation — no exceptions.

### `qb-table.tsx` violations

```
LINE    VIOLATION                              FIX
──────  ─────────────────────────────────     ────────────────────────────────────
103     Raw <button> in menuItem()             DS DropdownMenuItem
163-190 Portal + <div> for row context menu   DS DropdownMenu + DropdownMenuItem
37-86   Portal + <div> for version popover    DS Popover + PopoverContent
224     Raw <button> as custom checkbox        DS Checkbox
428     Raw <button> for column toggle        DS Button + Checkbox
507     Raw <button> as DropdownMenuTrigger   DS Button asChild
763     Raw <button> "Clear filters"           DS Button variant="ghost"
1011    Raw <button> for version cell         DS Button variant="ghost"
709     color-mix(..., white)                  color-mix(..., var(--background))
721     color-mix(..., white)                  color-mix(..., var(--background))
737     color-mix(..., white)                  color-mix(..., var(--background))
970     Raw <span> for avatar initials        DS Avatar + AvatarFallback
487-488 Nested <DropdownMenu> inside          Remove outer wrapper
        <DropdownMenu> (bug)
148,158 question.shortlisted                  question.favorited
602,883 question.shortlisted                  question.favorited
```

### `questions/[id]/page.tsx` violations

```
LINE    VIOLATION                              FIX
──────  ─────────────────────────────────     ────────────────────────────────────
51-68   Raw <span> for type + scope badges    DS Badge variant="secondary"
92-104  Raw <span> for tags                   DS Badge variant="outline"
```

### Version history — "current" word

```
BEFORE                               AFTER
─────────────────────────────        ─────────────────────────────
V3  Current version                  V3  Drug Metabolism Basics (title)
V2  Previous revision 2              V2  Revision 2
V1  Previous revision 1              V1  Revision 1

isCurrent flag → renamed isLatest
Styling: isLatest row gets brand-tint bg (latest is still visually
distinct — just not labeled "current" since all versions are usable)
```

---

## Implementation Order

```
1.  lib/qb-types.ts               ← status simplification, remove SVItem, rename shortlisted→favorited
2.  lib/qb-mock-data.ts           ← updated questions, remove smart views + offerings, new mock arrays
3.  qb-state.tsx                  ← role logic, remove smartViews/activeTabId, navView default='my',
                                     myQuestionsOnly toggle, new fields, auto-select
4.  qb-tabs.tsx                   ← DELETE entire file
5.  qb-sidebar.tsx                ← tree restructure, folder search bar, context menu removals,
                                     remove add-course btn, highlight flash on folder rows
6.  app/globals.css               ← new CSS tokens + highlight flash animation + filter chip styles
7.  components/qb/badges.tsx      ← StatusBadge (Saved/Draft), DiffBadge neutral, TypeBadge neutral
8.  qb-table.tsx                  ← DS compliance (all violations fixed) + new columns (subfolder,
                                     type, lastEditedBy, favorited) + drag-reorder + column header
                                     menus + difficulty popover + active filter chips + My Qs +
                                     Favorites toolbar icons + version history DS Popover
9.  qb-header.tsx                 ← simplified (breadcrumb removed)
10. qb-title.tsx                  ← Google Drive breadcrumb + collaborator avatar stack +
                                     hover access popover + sibling switcher
11. qb-modals.tsx                 ← ManageCollaborators redesign, SmartPopulate update, FilterSheet
12. app/(app)/questions/[id]/     ← DS Badge compliance fix
13. question-bank-client.tsx      ← remove QBTabs render, update empty states
14. components/app-sidebar.tsx    ← add Courses + Assessment Builder nav items
15. app/(app)/courses/            ← new Courses page (scaffolded)
16. app/(app)/assessment-builder/ ← new Assessment Builder page (scaffolded)
```

---

## DS Rules (apply throughout)

```
✓  All colors via var(--token) — never hardcode oklch/hex/rgb
✓  Every button → DS Button with explicit variant + size
✓  No raw <button>, <table>, or third-party grids
✓  No toast — use banners or inline status
✓  'use client' on every interactive component
✓  Font Awesome Pro: fa-light default, fa-solid active/selected
✓  All DS imports from @exxat/ds/packages/ui/src
✗  Never edit exxat-ds/ or studentUX/ (read-only submodules)
```
