# WCAG 2.1 AA Accessibility Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Tasks A–D are PARALLEL (different files). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fix all 30 WCAG 2.1 AA violations found in the compliance audit across 7 files.

**Architecture:** Four parallel tasks touching non-overlapping files. DS components (Input, Textarea, Dialog, Button) already carry correct focus rings, label slots, and dialog semantics — the fix pattern is always "replace raw element with DS component."

**Tech Stack:** Next.js 15, Exxat DS (`@exxat/ds/packages/ui/src`), Tailwind focus-visible utilities.

**DS import:** `import { Input, Textarea, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@exxat/ds/packages/ui/src'`

---

## ROOT CAUSE PATTERNS (apply to all tasks)

```
PATTERN 1 — Unlabelled input (fix: add aria-label OR use DS Label + htmlFor)
  BAD:  <p className="text-xs ...">Duration</p>
        <input style={{ outline: 'none' }} ... />
  GOOD: <label htmlFor="duration-input" className="text-xs ...">Duration</label>
        <Input id="duration-input" ... />
  OR:   <input aria-label="Duration in minutes" ... />

PATTERN 2 — No focus ring (fix: add focus-visible classes OR use DS Button)
  BAD:  <button style={{ background: 'none', border: 'none' }}>
  GOOD: <Button variant="ghost" size="sm">
  OR:   <button style={...} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">

PATTERN 3 — State not communicated (fix: aria-pressed or role=radio)
  BAD:  <Button onClick={() => setMode('blank')} style={{ borderColor: active ? '...' : '...' }}>
  GOOD: <Button aria-pressed={mode === 'blank'} onClick={() => setMode('blank')} ...>
  OR:   <div role="radiogroup" aria-label="Assessment creation mode">
          <button role="radio" aria-checked={mode === 'blank'} ...>

PATTERN 4 — Custom modal (fix: DS Dialog)
  BAD:  <div style={{ position: 'fixed', inset: 0 }}><div style={{ background: ... }}>
  GOOD: <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader><DialogTitle>...</DialogTitle></DialogHeader>
            ...
          </DialogContent>
        </Dialog>

PATTERN 5 — Hover-only actions (fix: focus-within CSS or onFocus/onBlur)
  BAD:  onMouseEnter={() => setHovered(true)} — buttons only visible on hover
  GOOD: add onFocus={() => setHovered(true)} onBlur={() => setHovered(false)}
        to the container div (focus of any child inside reveals buttons)

PATTERN 6 — Color-only information (fix: sr-only text or aria-label on icon)
  BAD:  <i className="fa-circle-check" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
  GOOD: <i className="fa-circle-check" role="img" aria-label="Covered" style={{ color: 'var(--brand-color)' }} />

PATTERN 7 — Dynamic status not announced (fix: aria-live region)
  BAD:  {loading && <div>Parsing…</div>}
  GOOD: <div role="status" aria-live="polite">{loading ? 'Parsing…' : ''}</div>
```

---

## TASK A: `assessment-builder-client.tsx` — Form Labels, Focus Rings, ARIA State

**File:** `app/(app)/assessment-builder/assessment-builder-client.tsx`

All fixes in this one file. The patterns repeat — apply systematically.

### A1: Fix `DetailsStep` — Assessment name input (line ~2227)

- [ ] Find the assessment name `<input>` in `DetailsStep`. It has `aria-label="Assessment name"` already from a prior edit. Verify it. If missing, add `aria-label="Assessment name"`.
- [ ] The input has `style={{ outline: 'none', ... }}`. Add focus ring via onFocus/onBlur:
  ```tsx
  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px color-mix(in oklch, var(--brand-color) 25%, transparent)' }}
  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
  ```

### A2: Fix `DetailsStep` — Description textarea (line ~2246)

- [ ] Add `aria-label="Description"` to the description `<textarea>` element.
- [ ] Add the same focus ring onFocus/onBlur pattern as A1.

### A3: Fix `DetailsStep` — Duration input (line ~2296)

- [ ] Add `aria-label="Duration in minutes"` to the duration `<input type="number">`.
- [ ] Add focus ring onFocus/onBlur pattern.

### A4: Fix `DetailsStep` — Opens/Closes datetime inputs (line ~2425)

- [ ] Add `aria-label="Opens"` to the first `<input type="datetime-local">`.
- [ ] Add `aria-label="Closes"` to the second `<input type="datetime-local">`.
- [ ] Add focus ring onFocus/onBlur to both.

### A5: Fix `DetailsStep` — Download window hours input (line ~2449)

- [ ] Add `aria-label="Download window in hours"` to the `<input type="number">` for download window.
- [ ] Add focus ring onFocus/onBlur.

### A6: Fix `DetailsStep` — Pre-exam instructions textarea (line ~2477)

- [ ] Find the `<textarea>` for pre-exam instructions.
- [ ] Add `aria-label="Pre-exam instructions"`.
- [ ] Add focus ring onFocus/onBlur.

### A7: Fix `DetailsStep` — Section name inline input (line ~2332)

- [ ] Find the `<input>` for new section title (used in the addingSec flow).
- [ ] Add `aria-label="Section name"` to it.
- [ ] It already has `autoFocus` and a border-bottom pattern — ensure the `style` includes a visible focus state:
  ```tsx
  style={{
    ...existingStyles,
    // keep existing border: '1px solid var(--brand-color)' — this IS the focus ring since it autofocuses
  }}
  ```
  This one is acceptable as-is since it auto-focuses and has a brand-color border. Just add aria-label.

### A8: Fix `DetailsStep` — Type buttons aria-pressed (line ~2270)

- [ ] Find the 4 type buttons in DetailsStep (`Exam`, `Quiz`, `Pop Quiz`, `Assignment`).
- [ ] They use DS `Button` already. Verify they have `aria-pressed={settings.type === type}`. If not, add it.
- [ ] Wrap the button group in `<div role="radiogroup" aria-label="Assessment type">`.

### A9: Fix `InstructionsPreview` — Collapse button focus ring (line ~1734)

- [ ] Find the `InstructionsPreview` collapse `<button>` element (raw `<button style={{ background: 'none', border: 'none' }}`).
- [ ] Add `className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"` to it.

### A10: Fix `WizardHeader` — Step buttons focus ring (line ~2583)

- [ ] Find the step indicator `<button>` elements in `WizardHeader`.
- [ ] Add `className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-full"` to each.

### A11: Fix `AssessmentSettingsSheet` — Type buttons aria-pressed + focus ring (line ~2673)

- [ ] Find the Exam/Quiz/Assignment type `<button>` elements inside `AssessmentSettingsSheet`.
- [ ] Add `aria-pressed={local.type === t}` to each.
- [ ] Add `className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"` to each.

### A12: Fix `ABQuestionPicker` — Assessment name rename input focus ring (line ~883)

- [ ] Find the assessment name rename `<input>` inside `ABQuestionPicker`'s context header.
- [ ] It already has `aria-label="Assessment name"`. Verify.
- [ ] Add focus ring pattern: `onFocus`/`onBlur` border-color + box-shadow swap.

### A13: Fix `NewQuestionEditorPanel` — Confirmation banner aria-live

- [ ] Find the `confirmation` state banner (a `LocalBanner` that auto-dismisses after 2 seconds).
- [ ] Wrap it in a persistent `<div role="status" aria-live="polite">` that stays in the DOM even when `confirmation` is null:
  ```tsx
  <div role="status" aria-live="polite">
    {confirmation && (
      <LocalBanner variant="success" ...>{confirmation}</LocalBanner>
    )}
  </div>
  ```

### A14: Fix `CreateAssessmentModal` — Mode selector ARIA state

- [ ] Find the 4 mode selector `<button>` or card elements in `CreateAssessmentModal` (blank / QB / copy / import PDF).
- [ ] Add `role="radiogroup" aria-label="Assessment creation mode"` to the wrapper div containing them.
- [ ] Add `role="radio" aria-checked={mode === m.id}` (or `aria-pressed={mode === m.id}`) to each mode button.

### A15: TypeScript check + commit

```bash
pnpm tsc --noEmit 2>&1 | grep -v WARN
git add "app/(app)/assessment-builder/assessment-builder-client.tsx"
git commit -m "fix(a11y): form labels, focus rings, aria-pressed — assessment builder WCAG 2.1 AA"
```

---

## TASK B: Step 2 Components — Hover Actions, Coverage Icons, Labels, Touch Targets

**Files:**
- `components/assessment-builder/step2-sections-outline.tsx`
- `components/assessment-builder/step2-health-panel.tsx`
- `components/assessment-builder/step2-inline-editor.tsx`

### B1: Fix `step2-sections-outline.tsx` — SectionGroup collapse button focus ring

- [ ] Find the raw `<button>` in `SectionGroup` (the collapse chevron toggle).
- [ ] Add `className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded w-full text-left"` to it.

### B2: Fix `step2-sections-outline.tsx` — QuestionRow hover-only edit/remove buttons

- [ ] Find the `QuestionRow` component. It shows edit/remove only when `hovered === true`, driven by `onMouseEnter`/`onMouseLeave`.
- [ ] Add `onFocus={() => setHovered(true)}` and `onBlur={() => setHovered(false)}` to the outer row `<div>`. This means any child receiving focus (tab into the row) also reveals the buttons.
- [ ] Ensure the row `<div>` has `tabIndex={-1}` (so it doesn't itself receive focus, but children do).

### B3: Fix `step2-sections-outline.tsx` — Warning icons role="img"

- [ ] Find the `fa-triangle-exclamation` warning icon (aria-label="Missing rationale") in `QuestionRow`.
- [ ] Change from:
  ```tsx
  <i className="fa-light fa-triangle-exclamation" aria-label="Missing rationale" style={...} />
  ```
  To:
  ```tsx
  <i className="fa-light fa-triangle-exclamation" role="img" aria-label="Missing rationale" style={...} />
  ```
- [ ] Same fix for `fa-chart-line-down` with `aria-label="Low point-biserial"`.

### B4: Fix `step2-sections-outline.tsx` — Touch targets for edit/remove buttons

- [ ] Find the edit and remove buttons in `QuestionRow`. They are `h-5 w-5` (20px).
- [ ] Change to `h-7 w-7` (28px) minimum. Update the style: `className="h-7 w-7 p-0 shrink-0"`.
- [ ] Note: In an outlined row that is 32px tall, 28px is the max that fits. Add padding to the row to give more breathing room if possible.

### B5: Fix `step2-health-panel.tsx` — Coverage icons ARIA

- [ ] Find the topic coverage section. Icons are `aria-hidden="true"`.
- [ ] Change covered icon from:
  ```tsx
  <i className="fa-light fa-circle-check" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
  ```
  To:
  ```tsx
  <i className="fa-light fa-circle-check" role="img" aria-label="Covered" style={{ color: 'var(--brand-color)' }} />
  ```
- [ ] Change uncovered icon from:
  ```tsx
  <i className="fa-light fa-circle-xmark" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
  ```
  To:
  ```tsx
  <i className="fa-light fa-circle-xmark" role="img" aria-label="Not covered" style={{ color: 'var(--muted-foreground)' }} />
  ```

### B6: Fix `step2-inline-editor.tsx` — Unlabelled textareas

- [ ] Find the question stem `Textarea`. Add `aria-label="Question stem"` directly on it.
- [ ] Find the rationale `Textarea`. Add `aria-label="Rationale"` directly on it.
- [ ] Both already use DS `Textarea` — just add the `aria-label` prop.

### B7: TypeScript check + commit

```bash
pnpm tsc --noEmit 2>&1 | grep -v WARN
git add components/assessment-builder/
git commit -m "fix(a11y): hover keyboard access, coverage icons, touch targets, labels — step2 components WCAG 2.1 AA"
```

---

## TASK C: `import-assessment-modal.tsx` — Replace Raw Modal with DS Dialog

**File:** `components/import-assessment-modal.tsx`

The entire modal shell must be replaced with DS `Dialog`. This gives focus trap, Escape handling, `role="dialog"`, `aria-modal`, and `aria-labelledby` automatically.

### C1: Replace modal shell with DS Dialog

- [ ] Add `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose` to the DS import at the top.

- [ ] Replace the outer overlay div + inner panel div with:
  ```tsx
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[560px] max-h-[85vh] flex flex-col overflow-hidden p-0">
      {/* Header */}
      <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
        <DialogTitle className="text-base font-semibold">Import from PDF</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          {courseCode} · We match to your question bank automatically
        </DialogDescription>
      </DialogHeader>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* ... existing step content unchanged ... */}
      </div>

      {/* Footer — only in review step */}
      {step === 'review' && (
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          {/* ... existing footer content unchanged ... */}
        </div>
      )}
    </DialogContent>
  </Dialog>
  ```
- [ ] Remove the manual `onClick` backdrop handler (DS DialogContent handles Escape and backdrop click internally via `onOpenChange`).
- [ ] Remove the manual close `<Button>` in the header — DS `DialogContent` renders its own close button, or use `<DialogClose asChild>`.

### C2: Fix parsing status aria-live

- [ ] Find the `{fileName && <div>Parsing {fileName}…</div>}` block in the upload step.
- [ ] Replace with a persistent live region:
  ```tsx
  <div role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-muted-foreground" style={{ minHeight: 20 }}>
    {fileName && (
      <>
        <i className="fa-light fa-spinner fa-spin" aria-hidden="true" />
        Parsing {fileName}…
      </>
    )}
  </div>
  ```

### C3: TypeScript check + commit

```bash
pnpm tsc --noEmit 2>&1 | grep -v WARN
git add components/import-assessment-modal.tsx
git commit -m "fix(a11y): replace raw modal with DS Dialog — focus trap, Escape, role=dialog WCAG 2.1 AA"
```

---

## TASK D: `live-monitor-client.tsx` + `course-offering-detail-client.tsx` — Color, Live Regions, Focus

**Files:**
- `app/(app)/assessments/[id]/monitor/live-monitor-client.tsx`
- `app/(app)/courses/offerings/[id]/course-offering-detail-client.tsx`

### D1: Fix `live-monitor-client.tsx` — Low-time color-only warning

- [ ] Search for `isLowTime` in the file. It changes text color to `var(--chart-4)` (amber).
- [ ] Find where the time remaining text renders and add a visually-hidden companion:
  ```tsx
  {isLowTime && <span className="sr-only"> (low time remaining)</span>}
  ```
  Place this immediately after the time value text, inside the same element.

### D2: Fix `live-monitor-client.tsx` — aria-live for status updates

- [ ] Find the `inProgress`, `submitted`, `notStarted` count variables (derived from `snapshot`).
- [ ] Add an offscreen summary that updates on tick (do NOT add aria-live to the entire board — that would be too noisy):
  ```tsx
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="sr-only"
  >
    {`${submitted} submitted, ${inProgress} in progress, ${notStarted} not started`}
  </div>
  ```
  Place this once, anywhere in the JSX (the DOM position doesn't matter for `sr-only` + `aria-live`).

### D3: Fix `course-offering-detail-client.tsx` — Student name button focus ring (line ~804)

- [ ] Find the student name `<button>` in `AccommodationsTab` (has `className="text-sm font-medium hover:underline text-left"`).
- [ ] Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded` to its className.

### D4: Fix `course-offering-detail-client.tsx` — CreateAssessmentModal mode selector ARIA

- [ ] Find the mode selector in `CreateAssessmentModal`. It should have 4 mode cards (after Task 6 added Import PDF).
- [ ] Add `role="radiogroup" aria-label="Assessment creation mode"` to the wrapper div containing the 4 mode cards.
- [ ] Add `role="radio" aria-checked={mode === m.id}` to each mode card `<button>`.
- [ ] Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1` to each mode card's className.

### D5: TypeScript check + commit

```bash
pnpm tsc --noEmit 2>&1 | grep -v WARN
git add "app/(app)/assessments/[id]/monitor/live-monitor-client.tsx" "app/(app)/courses/offerings/[id]/course-offering-detail-client.tsx"
git commit -m "fix(a11y): low-time sr-only, aria-live tick updates, focus rings, radiogroup — WCAG 2.1 AA"
```
