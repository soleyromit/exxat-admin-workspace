# QB Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply five UI/UX spec decisions to the Question Bank prototype, plus a DS compliance audit pass.

**Architecture:** Targeted edits across `qb-title.tsx`, `qb-table.tsx`, `qb-tabs.tsx`, `qb-header.tsx`, `qb-modals.tsx`, and `qb-state.tsx`. No new files except the Request Edit Access modal wired into the existing modal layer. No changes to shared state shape except adding `requestEditAccessQuestionId`.

**Tech Stack:** Next.js App Router, React 18, TypeScript, `@exxat/ds/packages/ui/src` (Admin DS), Font Awesome Pro, Tailwind CSS via DS theme tokens, `apps/exam-management/admin/`

---

## File Map

| File | What changes |
|---|---|
| `app/(app)/question-bank/qb-title.tsx` | Remove split button → single Button; remove Smart Populate + Import items; fix folderTypeBadge DS Badge + color-mix |
| `app/(app)/question-bank/qb-table.tsx` | Remove Mine pill; remove Flag for Review × 3; fix color-mix × 3; fix version `<button>` → DS Button; wire Request Edit Access |
| `app/(app)/question-bank/qb-tabs.tsx` | Remove smart view tabs; remove Add view button; fix color-mix |
| `app/(app)/question-bank/qb-header.tsx` | Fix sidebar toggle raw `<button>` → DS Button; fix persona items raw `<button>` → DropdownMenuItem |
| `app/(app)/question-bank/qb-modals.tsx` | Add `RequestEditAccessModal`; fix color-mix violations |
| `app/(app)/question-bank/qb-state.tsx` | Add `requestEditAccessQuestionId` + setter |
| `app/(app)/question-bank/question-bank-client.tsx` | Mount `<RequestEditAccessModal />` |

---

## Task 1: Remove Smart Populate + Import from Add button

**Files:**
- Modify: `app/(app)/question-bank/qb-title.tsx`

The "New question" split button currently has a dropdown with Write / Smart Populate / ─── / Import. Remove Smart Populate and Import — leaving only Write. Since there's now only one add-question action, the split button becomes a plain single Button. Also fix the `folderTypeBadge` raw `<span>` elements: replace them with DS `Badge` and replace `color-mix(... white)` with `color-mix(... var(--background))`.

- [ ] **Step 1: Replace split button with single Button**

In `qb-title.tsx`, locate the `{/* Write split button */}` block (lines 67–108). Replace the entire outer `<div style={{ display: 'flex' }}>` containing the two Buttons + DropdownMenu with a single Button. The `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuItem` imports in this file become unused — remove them from the import.

Replace:
```tsx
{/* Write split button */}
<div style={{ display: 'flex' }}>
  <Button size="lg" onClick={() => {}} style={{ borderRadius: '7px 0 0 7px' }}>
    <i className="fa-light fa-plus" aria-hidden="true" />
    New question
  </Button>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        aria-label="More write options"
        size="lg"
        style={{ borderRadius: '0 7px 7px 0', borderLeft: '1px solid var(--qb-split-divider)', paddingLeft: 8, paddingRight: 8 }}
      >
        <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 10 }} />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-60">
      <DropdownMenuLabel>Add question</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => {}}>
        <i className="fa-regular fa-pen" aria-hidden="true" />
        <div>
          <div style={{ fontWeight: 500 }}>Write</div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Start with a blank question editor</div>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setSmartPopulateOpen(true)}>
        <i className="fa-regular fa-sparkles" aria-hidden="true" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500 }}>Smart Populate</div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Promote drafts or auto-collect questions</div>
          </div>
          <Badge variant="secondary" style={{ fontSize: 9, padding: '1px 5px' }}>AI</Badge>
        </div>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => {}}>
        <i className="fa-regular fa-arrow-up-from-bracket" aria-hidden="true" />
        Import
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

With:
```tsx
{/* New question button */}
<Button size="lg" onClick={() => {}}>
  <i className="fa-light fa-plus" aria-hidden="true" />
  New question
</Button>
```

- [ ] **Step 2: Remove unused destructure and imports**

In `qb-title.tsx`, remove `setSmartPopulateOpen` from the `useQB()` destructure:

```tsx
// Before
const { selectedFolder, visibleQuestions, currentPersona, setSmartPopulateOpen, navView } = useQB()
// After
const { selectedFolder, visibleQuestions, currentPersona, navView } = useQB()
```

Remove the `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator` named imports from the DS import line. Keep `Button` and `Badge`.

- [ ] **Step 3: Fix folderTypeBadge — replace raw span with DS Badge, fix color-mix**

The three `folderTypeBadge` spans (locked, private space, question set) use raw `<span>` and `color-mix(... white)`. Replace all three with DS `Badge`:

```tsx
// Locked
folderTypeBadge = (
  <Badge
    variant="secondary"
    className="rounded-full ml-2"
    style={{
      fontSize: 9, fontWeight: 600, padding: '2px 7px',
      backgroundColor: 'color-mix(in oklch, var(--qb-locked) 15%, var(--background))',
      color: 'var(--qb-locked)',
    }}
  >
    <i className="fa-solid fa-lock" aria-hidden="true" style={{ fontSize: 8 }} /> Locked
  </Badge>
)

// Private Space
folderTypeBadge = (
  <Badge
    variant="secondary"
    className="rounded-full ml-2"
    style={{
      fontSize: 9, fontWeight: 600, padding: '2px 7px',
      backgroundColor: 'color-mix(in oklch, var(--qb-private) 12%, var(--background))',
      color: 'var(--qb-private)',
    }}
  >
    <i className="fa-solid fa-lock-keyhole" aria-hidden="true" style={{ fontSize: 8 }} /> Private Space
  </Badge>
)

// Question Set
folderTypeBadge = (
  <Badge
    variant="secondary"
    className="rounded-full ml-2"
    style={{
      fontSize: 9, fontWeight: 600, padding: '2px 7px',
      backgroundColor: 'color-mix(in oklch, var(--qb-question-set) 12%, var(--background))',
      color: 'var(--qb-question-set)',
    }}
  >
    <i className="fa-solid fa-rectangle-list" aria-hidden="true" style={{ fontSize: 8 }} /> Question Set
  </Badge>
)
```

- [ ] **Step 4: Verify in browser**

Start dev server: `cd apps/exam-management/admin && pnpm dev`
Navigate to `/question-bank`. Confirm:
- "New question" is a single button (no chevron dropdown arrow)
- Folder type badges render correctly in the title area
- No console errors

---

## Task 2: Remove "Mine" pill; keep "View only"

**Files:**
- Modify: `app/(app)/question-bank/qb-table.tsx`

The sub-row in the question cell shows `{isOwner ? 'Mine' : 'View only'}` on hover for faculty. Remove the Mine variant — only show "View only" for non-owner rows.

- [ ] **Step 1: Edit the ownership pill logic**

In `qb-table.tsx`, find the ownership pill block (inside the question `<td>`, in the sub-row div):

```tsx
{!isAdmin && isHovered && (
  <Badge
    variant="secondary"
    className="rounded"
    style={{
      fontSize: 10, padding: '1px 5px',
      backgroundColor: isOwner ? 'var(--brand-tint)' : 'var(--muted)',
      color: isOwner ? 'var(--brand-color-dark)' : 'var(--muted-foreground)',
    }}
  >
    {isOwner ? 'Mine' : 'View only'}
  </Badge>
)}
```

Replace with:
```tsx
{!isAdmin && !isOwner && isHovered && (
  <Badge
    variant="secondary"
    className="rounded"
    style={{
      fontSize: 10, padding: '1px 5px',
      backgroundColor: 'var(--muted)',
      color: 'var(--muted-foreground)',
    }}
  >
    View only
  </Badge>
)}
```

- [ ] **Step 2: Verify**

Switch to a Faculty persona in the header. Hover over a row where you are the owner — no pill. Hover over a row you don't own — "View only" pill appears. No console errors.

---

## Task 3: Remove "Flag for Review" from all context menus

**Files:**
- Modify: `app/(app)/question-bank/qb-table.tsx`

"Flag for Review" appears in all three context menu item arrays. Remove it from each.

- [ ] **Step 1: Remove from adminItems**

Find the `adminItems` array (starts around line 122). Remove this entry:
```tsx
menuItem('fa-flag', 'Flag for Review'),
```

- [ ] **Step 2: Remove from facultyOwnItems**

Find the `facultyOwnItems` array. Remove:
```tsx
menuItem('fa-flag', 'Flag for Review'),
```

- [ ] **Step 3: Remove from facultyViewOnlyItems**

Find the `facultyViewOnlyItems` array. Remove:
```tsx
menuItem('fa-flag', 'Flag for Review'),
```

- [ ] **Step 4: Verify**

Right-click (or ⋯) a question row as Admin, Faculty Own, and Faculty View Only. Confirm "Flag for Review" does not appear in any menu. All separators still make sense contextually.

---

## Task 4: Add "Request Edit Access" dialog

**Files:**
- Modify: `app/(app)/question-bank/qb-state.tsx`
- Modify: `app/(app)/question-bank/qb-modals.tsx`
- Modify: `app/(app)/question-bank/question-bank-client.tsx`
- Modify: `app/(app)/question-bank/qb-table.tsx`

Currently "Request Edit Access" in the faculty view-only context menu is a no-op menu item. Replace with a Dialog that shows the question title and a textarea for a reason message.

- [ ] **Step 1: Add state to qb-state.tsx**

In the `QBState` interface, add after `filterSheetOpen: boolean`:
```ts
requestEditAccessQuestionId: string | null
setRequestEditAccessQuestionId: (id: string | null) => void
```

In `QBProvider`, add state after `filterSheetOpen`:
```ts
const [requestEditAccessQuestionId, setRequestEditAccessQuestionId] = useState<string | null>(null)
```

Add to the `value` object:
```ts
requestEditAccessQuestionId, setRequestEditAccessQuestionId,
```

- [ ] **Step 2: Add RequestEditAccessModal to qb-modals.tsx**

Add this component at the bottom of `qb-modals.tsx` (after the `FilterSheet` export):

```tsx
// ── Request Edit Access Modal ─────────────────────────────────────────────────
export function RequestEditAccessModal() {
  const { requestEditAccessQuestionId, setRequestEditAccessQuestionId, questions } = useQB()
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)

  const question = questions.find(q => q.id === requestEditAccessQuestionId)

  function close() {
    setRequestEditAccessQuestionId(null)
    setReason('')
    setSent(false)
  }

  return (
    <Dialog open={!!requestEditAccessQuestionId} onOpenChange={(v) => { if (!v) close() }}>
      <DialogContent showCloseButton style={{ maxWidth: 440 }}>
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fa-regular fa-key" aria-hidden="true" style={{ color: 'var(--brand-color)', fontSize: 15 }} />
            </div>
            <div>
              <DialogTitle style={{ fontSize: 15 }}>Request Edit Access</DialogTitle>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                The question owner will be notified.
              </p>
            </div>
          </div>
        </DialogHeader>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto 12px',
              backgroundColor: 'color-mix(in oklch, var(--qb-trust-senior-color) 12%, var(--background))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fa-solid fa-circle-check" aria-hidden="true"
                style={{ fontSize: 24, color: 'var(--qb-trust-senior-color)' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 6 }}>
              Request sent
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
              The question owner will review your request and grant access if approved.
            </p>
          </div>
        ) : (
          <div style={{ padding: '4px 0 8px' }}>
            {question && (
              <div style={{
                padding: '10px 12px', borderRadius: 8, marginBottom: 14,
                backgroundColor: 'var(--muted)', border: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Question
                </p>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', margin: 0 }}>
                  {question.title}
                </p>
              </div>
            )}
            <div>
              <label
                htmlFor="edit-access-reason"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 6 }}
              >
                Reason <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                id="edit-access-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Briefly explain why you need edit access…"
                rows={3}
                style={{
                  width: '100%', fontSize: 13, resize: 'vertical',
                  border: '1px solid var(--border-control-3)',
                  borderRadius: 8, padding: '8px 10px',
                  backgroundColor: 'var(--input-background)',
                  color: 'var(--foreground)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {sent ? (
            <Button variant="outline" onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button onClick={() => setSent(true)}>Send Request</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

Also add `useState` to the imports in `qb-modals.tsx` if not already present (it is — line 2).

- [ ] **Step 3: Mount in question-bank-client.tsx**

In `question-bank-client.tsx`, add the import:
```tsx
import { SmartPopulateModal, ManageCollaboratorsModal, FilterSheet, RequestEditAccessModal } from './qb-modals'
```

Inside `QBInner`, add after `<FilterSheet />`:
```tsx
<RequestEditAccessModal />
```

- [ ] **Step 4: Wire from row context menu in qb-table.tsx**

In `qb-table.tsx`, add `setRequestEditAccessQuestionId` to the `useQB()` destructure inside `RowContextMenu`:
```tsx
const { currentPersona, setRequestEditAccessQuestionId } = useQB()
```

In the `facultyViewOnlyItems` array, update "Request Edit Access":
```tsx
// Before
menuItem('fa-key', 'Request Edit Access'),

// After
menuItem('fa-key', 'Request Edit Access', undefined, false, () => setRequestEditAccessQuestionId(question.id)),
```

- [ ] **Step 5: Verify**

Switch to a Faculty persona. Open the ⋯ menu on a question you don't own. Click "Request Edit Access". Confirm the dialog opens with the question title shown. Type a reason. Click "Send Request" — confirm the success state. Click Done to close.

---

## Task 5: Remove smart view tabs

**Files:**
- Modify: `app/(app)/question-bank/qb-tabs.tsx`

The tabs currently show All Questions + My Questions + dynamic smart view tabs from `MOCK_QB_SMART_VIEWS`. Remove the smart view tabs and the "Add view" button. Keep only the two system tabs. Also fix the `color-mix(... white)` violation.

- [ ] **Step 1: Rewrite QBTabs to remove smart views**

Replace the entire `QBTabs` function body with:

```tsx
export function QBTabs() {
  const { activeTabId, setActiveTabId, currentPersona, visibleQuestions } = useQB()

  const tabs = [
    {
      id: 'all',
      label: 'All Questions',
      icon: 'fa-book-open',
      count: visibleQuestions.length,
      countColor: 'var(--muted-foreground)',
    },
    {
      id: 'my',
      label: 'My Questions',
      icon: 'fa-user',
      count: visibleQuestions.filter(q => q.creator === currentPersona.id).length,
      countColor: 'var(--qb-trust-mid-color)',
    },
  ]

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '6px 12px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 1,
        backgroundColor: 'var(--muted)',
        borderRadius: 8, padding: 3,
      }}>
        {tabs.map(tab => {
          const isActive = activeTabId === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTabId(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 6,
                border: 'none', cursor: 'pointer',
                backgroundColor: isActive ? 'var(--background)' : 'transparent',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: isActive ? 600 : 400,
                fontSize: 12,
                whiteSpace: 'nowrap',
                transition: 'background-color 100ms',
              }}
            >
              <i
                className={isActive ? `fa-solid ${tab.icon}` : `fa-regular ${tab.icon}`}
                aria-hidden="true"
                style={{ fontSize: 11, color: isActive ? (tab.countColor ?? 'var(--foreground)') : 'var(--muted-foreground)' }}
              />
              {tab.label}
              <span style={{
                fontSize: 10, fontWeight: 600,
                padding: '1px 6px', borderRadius: 20, minWidth: 18, textAlign: 'center',
                backgroundColor: isActive
                  ? `color-mix(in oklch, ${tab.countColor} 15%, var(--background))`
                  : 'transparent',
                color: isActive ? (tab.countColor ?? 'var(--muted-foreground)') : 'var(--muted-foreground)',
              }}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

Also remove `useState` from the import (no longer needed) and remove the `Portal` import.

- [ ] **Step 2: Verify**

Confirm only two tabs render: "All Questions" and "My Questions". No "Add view" button. No smart view tabs. Switching tabs still filters the question list correctly.

---

## Task 6: Fix color-mix(... white) violations

**Files:**
- Modify: `app/(app)/question-bank/qb-modals.tsx`
- Modify: `app/(app)/question-bank/qb-table.tsx`

Any remaining `color-mix(... white)` or `color-mix(in oklch, ... white)` → replace `white` with `var(--background)`.

- [ ] **Step 1: Fix qb-modals.tsx**

Search for all occurrences of `, white)` in `qb-modals.tsx`. Replace each one:

Line 165 (SmartPopulateModal success icon bg for auto-collect):
```tsx
// Before
backgroundColor: mode === 'promote' ? 'var(--qb-trust-senior-bg)' : 'color-mix(in oklch, var(--qb-locked) 10%, white)',

// After
backgroundColor: mode === 'promote' ? 'var(--qb-trust-senior-bg)' : 'color-mix(in oklch, var(--qb-locked) 10%, var(--background))',
```

Line 241 (promote step 3, target folder summary card):
```tsx
// Before
<div style={{ padding: 12, borderRadius: 8, backgroundColor: 'color-mix(in oklch, var(--qb-locked) 10%, white)' }}>

// After
<div style={{ padding: 12, borderRadius: 8, backgroundColor: 'color-mix(in oklch, var(--qb-locked) 10%, var(--background))' }}>
```

Line 330 (ManageCollaboratorsModal icon bg):
```tsx
// Before
backgroundColor: 'color-mix(in oklch, var(--qb-question-set) 15%, white)',

// After
backgroundColor: 'color-mix(in oklch, var(--qb-question-set) 15%, var(--background))',
```

- [ ] **Step 2: Fix qb-table.tsx toolbar active states**

Three buttons in the toolbar use `color-mix(... white)`:

Search button active state (line ~708):
```tsx
// Before
style={search ? { borderColor: 'var(--brand-color)', color: 'var(--brand-color)', backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, white)' } : {}}

// After
style={search ? { borderColor: 'var(--brand-color)', color: 'var(--brand-color)', backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))' } : {}}
```

Bookmark button active state (line ~721):
```tsx
// Before
style={bookmarkOnly ? { borderColor: 'var(--qb-locked)', color: 'var(--qb-locked)', backgroundColor: 'color-mix(in oklch, var(--qb-locked) 10%, white)' } : {}}

// After
style={bookmarkOnly ? { borderColor: 'var(--qb-locked)', color: 'var(--qb-locked)', backgroundColor: 'color-mix(in oklch, var(--qb-locked) 10%, var(--background))' } : {}}
```

Properties button active state (line ~737):
```tsx
// Before
style={activeFilterCount > 0 || hiddenCols.size > 0 ? { borderColor: 'var(--brand-color)', color: 'var(--brand-color)', backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, white)' } : {}}

// After
style={activeFilterCount > 0 || hiddenCols.size > 0 ? { borderColor: 'var(--brand-color)', color: 'var(--brand-color)', backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))' } : {}}
```

- [ ] **Step 3: Verify**

Run `grep -rn ", white)" apps/exam-management/admin/app/\(app\)/question-bank/` and confirm zero results. Visually check the toolbar active states look correct in the browser.

---

## Task 7: Fix raw button violations in qb-header.tsx

**Files:**
- Modify: `app/(app)/question-bank/qb-header.tsx`

Two violations: (1) the sidebar toggle is a raw `<button>`, (2) the persona switcher dropdown items are raw `<button>` with `role="option"` instead of DS `DropdownMenuItem`.

- [ ] **Step 1: Fix sidebar toggle**

Add `Tooltip, TooltipContent, TooltipTrigger` to the DS import. Replace the raw sidebar toggle `<button>` with DS Button inside a Tooltip:

```tsx
// Before
<button
  onClick={toggleSidebar}
  aria-label={sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}
  style={{
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 5, borderRadius: 6,
    color: sidebarState !== 'collapsed' ? 'var(--foreground)' : 'var(--muted-foreground)',
    flexShrink: 0,
  }}
>
  <i className="fa-light fa-sidebar" aria-hidden="true" style={{ fontSize: 16 }} />
</button>

// After
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleSidebar}
      aria-label={sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}
      style={{ color: sidebarState !== 'collapsed' ? 'var(--foreground)' : 'var(--muted-foreground)', flexShrink: 0 }}
    >
      <i className="fa-light fa-sidebar" aria-hidden="true" style={{ fontSize: 16 }} />
    </Button>
  </TooltipTrigger>
  <TooltipContent>{sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}</TooltipContent>
</Tooltip>
```

- [ ] **Step 2: Fix persona switcher trigger**

The `DropdownMenuTrigger asChild` wraps a raw `<button>`. Replace with DS `Button variant="ghost"`:

```tsx
// Before
<DropdownMenuTrigger asChild>
  <button
    style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: 'none', cursor: 'pointer',
      padding: '4px 8px', borderRadius: 7,
      border: '1px solid var(--border)',
    }}
  >

// After
<DropdownMenuTrigger asChild>
  <Button
    variant="ghost"
    className="gap-1.5 h-auto px-2 py-1 border border-border rounded-lg"
    style={{ display: 'flex', alignItems: 'center', gap: 7 }}
  >
```

Close the tag correspondingly: `</Button>` instead of `</button>`.

- [ ] **Step 3: Fix persona dropdown items**

The persona list inside `DropdownMenuContent` uses raw `<button role="option">` elements. Replace with DS `DropdownMenuItem`. Add `DropdownMenuItem` to the DS import.

```tsx
// Before (for each persona p)
<button
  key={p.id}
  role="option"
  aria-selected={p.id === currentPersona.id}
  onClick={() => setCurrentPersona(p)}
  style={{
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', background: p.id === currentPersona.id ? 'var(--accent)' : 'none',
    border: 'none', cursor: 'pointer',
    padding: '8px 12px', textAlign: 'left',
  }}
>
  {/* … avatar, name, trust badge … */}
</button>

// After
<DropdownMenuItem
  key={p.id}
  aria-selected={p.id === currentPersona.id}
  onClick={() => setCurrentPersona(p)}
  style={{ backgroundColor: p.id === currentPersona.id ? 'var(--accent)' : undefined }}
>
  {/* … same avatar, name, trust badge … */}
</DropdownMenuItem>
```

The inner content (avatar circle, name div, trust badge, check icon) stays identical — only the wrapper element changes.

- [ ] **Step 4: Verify**

Sidebar toggle button renders as a proper DS ghost icon button with a tooltip. Persona switcher opens correctly. Selecting a persona highlights correctly using DS DropdownMenuItem styles.

---

## Task 8: Fix version button in qb-table.tsx

**Files:**
- Modify: `app/(app)/question-bank/qb-table.tsx`

The version badge in each row is a raw `<button>` (line ~1011). Replace with DS `Button`.

- [ ] **Step 1: Replace version raw button**

Find the version `<button>` inside the version `<td>`:

```tsx
// Before
<button
  onClick={(e) => openVersionPopover(e, q)}
  aria-label={`Version history for ${q.title}`}
  style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, fontWeight: 600, borderRadius: 4,
    padding: '2px 6px', cursor: 'pointer', border: 'none',
    backgroundColor: openVersionPopoverId === q.id ? 'var(--brand-tint)' : 'var(--muted)',
    color: openVersionPopoverId === q.id ? 'var(--brand-color-dark)' : 'var(--muted-foreground)',
  }}
>
  <i
    className={openVersionPopoverId === q.id ? 'fa-solid fa-clock-rotate-left' : 'fa-regular fa-clock-rotate-left'}
    aria-hidden="true"
    style={{ fontSize: 9 }}
  />
  V{q.version}
</button>

// After
<Button
  variant="ghost"
  size="xs"
  onClick={(e) => openVersionPopover(e, q)}
  aria-label={`Version history for ${q.title}`}
  style={{
    fontSize: 10, fontWeight: 600, gap: 4,
    backgroundColor: openVersionPopoverId === q.id ? 'var(--brand-tint)' : 'var(--muted)',
    color: openVersionPopoverId === q.id ? 'var(--brand-color-dark)' : 'var(--muted-foreground)',
  }}
>
  <i
    className={openVersionPopoverId === q.id ? 'fa-solid fa-clock-rotate-left' : 'fa-regular fa-clock-rotate-left'}
    aria-hidden="true"
    style={{ fontSize: 9 }}
  />
  V{q.version}
</Button>
```

- [ ] **Step 2: Verify**

Version badge in each row renders with correct DS Button appearance. Clicking it still opens the version popover. Active state (brand tint) still works.

---

## Self-Review Checklist

| Requirement | Covered by |
|---|---|
| Remove Smart Populate from Add button | Task 1 |
| Remove Import from Add button | Task 1 |
| Fix folderTypeBadge raw span → DS Badge | Task 1, Step 3 |
| Remove Mine pill (keep View only) | Task 2 |
| Remove Flag for Review × 3 context menus | Task 3 |
| Request Edit Access dialog (proper UI) | Task 4 |
| Remove smart view tabs | Task 5 |
| Remove Add view button | Task 5 |
| Fix color-mix(... white) in qb-modals.tsx | Task 6, Step 1 |
| Fix color-mix(... white) in qb-table.tsx toolbar | Task 6, Step 2 |
| Fix sidebar toggle raw button → DS Button | Task 7, Step 1 |
| Fix persona trigger raw button → DS Button | Task 7, Step 2 |
| Fix persona items raw button → DropdownMenuItem | Task 7, Step 3 |
| Fix version raw button → DS Button | Task 8 |
