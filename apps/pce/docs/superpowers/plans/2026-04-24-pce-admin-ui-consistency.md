# PCE Admin — UI Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring all PCE admin pages into visual alignment with exam-management admin: Ivypresto H1, 28px spacing, `theme-one`, correct DS tokens, and a courseName subtitle fix.

**Architecture:** Pure visual/style pass — no logic changes, no new components, no new files. Each task modifies one existing file. Theme change in `layout.tsx` propagates immediately to all pages. Typography and spacing changes are inline style/className edits only.

**Tech Stack:** Next.js, React, Admin DS (`@exxat/ds/packages/ui/src`), Tailwind, CSS custom properties

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/pce/admin/app/layout.tsx` | `theme-prism` → `theme-one` |
| `apps/pce/admin/app/(app)/surveys/page.tsx` | H1 + header padding + toolbar padding + content padding + cell typography |
| `apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx` | Header padding + content padding + `pce-rate-bar` token fix + cell typography |
| `apps/pce/admin/app/(app)/templates/page.tsx` | H1 + header padding + toolbar padding + content padding + cell typography |
| `apps/pce/admin/app/(app)/templates/[id]/page.tsx` | Header padding + content padding + title typography |
| `apps/pce/admin/app/(app)/moderation/page.tsx` | H1 + header/sub-bar padding + content padding + cell typography + avatar token fix |
| `apps/pce/admin/app/(app)/analytics/page.tsx` | H1 + header padding + content padding + cell typography + `pce-rate-bar` token fix |
| `apps/pce/admin/app/(app)/my-surveys/page.tsx` | H1 + header padding + content padding + cell typography + `survey.term` → `survey.courseName` |
| `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx` | Header padding + content padding |

---

## Uniform Pattern (reference — applied per task below)

```tsx
// Page header (flex row with SidebarTrigger + H1 + actions)
<header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>

// H1 on top-level list pages
<h1 className="flex-1" style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>Page Title</h1>

// Toolbar sub-row (search bar, filters)
<div className="flex items-center gap-2 py-2 border-b border-border shrink-0" style={{ paddingInline: 28 }}>

// Main content area — with toolbar above
<main className="flex-1 overflow-auto" style={{ padding: '0 28px 28px' }}>

// Main content area — no toolbar (starts directly after header)
<main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>

// Primary cell text
<span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>

// Primary cell text — bold (IDs, codes)
<span style={{ fontSize: 13, fontWeight: 600 }}>{code}</span>

// Secondary / subtitle cell
<span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{subtitle}</span>

// Avatar (correct token)
<AvatarFallback style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)', fontSize: 11 }}>
  {initials}
</AvatarFallback>

// Score bar (replacing pce-rate-bar-* tokens)
<div style={{ height: 8, borderRadius: 4, backgroundColor: 'var(--muted)', overflow: 'hidden' }}>
  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, backgroundColor: 'var(--brand-color)' }} />
</div>
```

---

### Task 1: layout.tsx — switch to theme-one

**Files:**
- Modify: `apps/pce/admin/app/layout.tsx:14`

- [ ] **Step 1: Apply change**

  In `apps/pce/admin/app/layout.tsx` line 14, change:
  ```tsx
  <html lang="en" className="theme-prism">
  ```
  to:
  ```tsx
  <html lang="en" className="theme-one">
  ```

- [ ] **Step 2: Verify**

  Run from `apps/pce/admin/`:
  ```bash
  pnpm typecheck
  ```
  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/pce/admin/app/layout.tsx
  git commit -m "fix: PCE admin — switch to theme-one"
  ```

---

### Task 2: surveys/page.tsx — header, spacing, typography

**Files:**
- Modify: `apps/pce/admin/app/(app)/surveys/page.tsx`

- [ ] **Step 1: Update page header (line 51)**

  Change:
  ```tsx
  <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
  ```
  to:
  ```tsx
  <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
  ```

- [ ] **Step 2: Update H1 (line 54)**

  Change:
  ```tsx
  <h1 className="text-sm font-semibold flex-1">Surveys</h1>
  ```
  to:
  ```tsx
  <h1 className="flex-1" style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>Surveys</h1>
  ```

- [ ] **Step 3: Update toolbar row (line 61)**

  Change:
  ```tsx
  <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0 flex-wrap">
  ```
  to:
  ```tsx
  <div className="flex items-center gap-2 py-2 border-b border-border shrink-0 flex-wrap" style={{ paddingInline: 28 }}>
  ```

- [ ] **Step 4: Update main content padding (line 85)**

  Change:
  ```tsx
  <main className="flex-1 overflow-auto px-4 pb-4">
  ```
  to:
  ```tsx
  <main className="flex-1 overflow-auto" style={{ padding: '0 28px 28px' }}>
  ```

- [ ] **Step 5: Update SurveyRow cell typography (lines 179–180, 196, 225)**

  In the `SurveyRow` function, change the course code/name cells:
  ```tsx
  <Link href={`/surveys/${survey.id}`} className="flex flex-col gap-0.5 hover:underline">
    <span style={{ fontSize: 13, fontWeight: 600 }}>{survey.courseCode}</span>
    <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{survey.courseName}</span>
  </Link>
  ```

  Change the instructor name span:
  ```tsx
  <span style={{ fontSize: 13 }} className="truncate max-w-32">{primary.name}</span>
  ```

  Change the deadline cell:
  ```tsx
  <TableCell style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
    {survey.deadline}
  </TableCell>
  ```

- [ ] **Step 6: Verify**

  ```bash
  pnpm typecheck
  ```
  Expected: no errors.

- [ ] **Step 7: Commit**

  ```bash
  git add apps/pce/admin/app/\(app\)/surveys/page.tsx
  git commit -m "fix: surveys page — Ivypresto H1, 28px spacing, cell typography"
  ```

---

### Task 3: surveys/[id]/responses/page.tsx — spacing, tokens, typography

**Files:**
- Modify: `apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx`

- [ ] **Step 1: Update both header instances**

  There are two `<header>` elements — one in the early-return (no-responses, line ~39) and one in the main return (line ~63). Update both:

  Change:
  ```tsx
  <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
  ```
  to:
  ```tsx
  <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
  ```

- [ ] **Step 2: Update main content padding (line ~79)**

  Change:
  ```tsx
  <main className="flex-1 overflow-auto p-6">
  ```
  to:
  ```tsx
  <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
  ```

- [ ] **Step 3: Fix pce-rate-bar tokens in score bar (line ~134)**

  Change:
  ```tsx
  <div style={{ height: 8, borderRadius: 4, backgroundColor: 'var(--pce-rate-bar-track)', overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${(sectionScore.avg / 5) * 100}%`, borderRadius: 4, backgroundColor: 'var(--pce-rate-bar-fill)' }} />
  </div>
  ```
  to:
  ```tsx
  <div style={{ height: 8, borderRadius: 4, backgroundColor: 'var(--muted)', overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${(sectionScore.avg / 5) * 100}%`, borderRadius: 4, backgroundColor: 'var(--brand-color)' }} />
  </div>
  ```

- [ ] **Step 4: Update comment text typography (line ~168)**

  Change:
  ```tsx
  className="flex-1 text-sm"
  ```
  to (removing the className text-sm and using style):
  ```tsx
  style={{
    flex: 1,
    fontSize: 13,
    color: isHidden ? 'var(--muted-foreground)' : 'var(--foreground)',
    textDecoration: isHidden ? 'line-through' : 'none',
    fontStyle: 'italic',
  }}
  ```
  And remove the separate color/textDecoration/fontStyle style lines that were already there (merge them into one style object). The full span becomes:
  ```tsx
  <span
    style={{
      flex: 1,
      fontSize: 13,
      color: isHidden ? 'var(--muted-foreground)' : 'var(--foreground)',
      textDecoration: isHidden ? 'line-through' : 'none',
      fontStyle: 'italic',
    }}
  >
    &ldquo;{comment.text}&rdquo;
  </span>
  ```

- [ ] **Step 5: Verify**

  ```bash
  pnpm typecheck
  ```
  Expected: no errors.

- [ ] **Step 6: Commit**

  ```bash
  git add "apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx"
  git commit -m "fix: responses page — 28px spacing, pce-rate-bar tokens, comment typography"
  ```

---

### Task 4: templates/page.tsx — header, spacing, typography

**Files:**
- Modify: `apps/pce/admin/app/(app)/templates/page.tsx`

- [ ] **Step 1: Update page header (line 29)**

  Change:
  ```tsx
  <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
  ```
  to:
  ```tsx
  <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
  ```

- [ ] **Step 2: Update H1 (line 32)**

  Change:
  ```tsx
  <h1 className="text-sm font-semibold flex-1">Templates</h1>
  ```
  to:
  ```tsx
  <h1 className="flex-1" style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>Templates</h1>
  ```

- [ ] **Step 3: Update toolbar row (line 40)**

  Change:
  ```tsx
  <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
  ```
  to:
  ```tsx
  <div className="flex items-center gap-2 py-2 border-b border-border shrink-0" style={{ paddingInline: 28 }}>
  ```

- [ ] **Step 4: Update main content padding (line 55)**

  Change:
  ```tsx
  <main className="flex-1 overflow-auto p-4">
  ```
  to:
  ```tsx
  <main className="flex-1 overflow-auto" style={{ padding: '0 28px 28px' }}>
  ```

- [ ] **Step 5: Update TemplateRow cell typography**

  Template name link (line ~128) — add `style={{ fontSize: 13 }}`:
  ```tsx
  <Link
    href={`/templates/${template.id}`}
    className="font-medium hover:underline"
    style={{ color: 'var(--foreground)', fontSize: 13 }}
  >
    {template.name}
  </Link>
  ```

  Question count cell (line ~133):
  ```tsx
  <TableCell className="text-right tabular-nums" style={{ fontSize: 13 }}>{template.questionCount}</TableCell>
  ```

  Used-by button (line ~136):
  ```tsx
  <Button variant="link" size="sm" className="h-auto p-0 tabular-nums" style={{ fontSize: 13 }}>
    {template.usedBySurveyCount}
  </Button>
  ```

  Used-by zero (line ~140):
  ```tsx
  <span className="tabular-nums" style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>0</span>
  ```

  Date cell (line ~146):
  ```tsx
  <TableCell style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
    {template.lastModified}
  </TableCell>
  ```

- [ ] **Step 6: Verify**

  ```bash
  pnpm typecheck
  ```
  Expected: no errors.

- [ ] **Step 7: Commit**

  ```bash
  git add apps/pce/admin/app/\(app\)/templates/page.tsx
  git commit -m "fix: templates page — Ivypresto H1, 28px spacing, cell typography"
  ```

---

### Task 5: templates/[id]/page.tsx — header spacing, title typography

**Files:**
- Modify: `apps/pce/admin/app/(app)/templates/[id]/page.tsx`

- [ ] **Step 1: Update page header (line 59)**

  Change:
  ```tsx
  <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
  ```
  to:
  ```tsx
  <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
  ```

- [ ] **Step 2: Update main content padding (line 73)**

  Change:
  ```tsx
  <main className="flex-1 overflow-auto p-6">
  ```
  to:
  ```tsx
  <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
  ```

- [ ] **Step 3: Update template name heading (line 82)**

  This `<h2>` is the template name — the primary title in the content area for this detail page.

  Change:
  ```tsx
  <h2 className="text-lg font-semibold">{template.name}</h2>
  ```
  to:
  ```tsx
  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>{template.name}</h2>
  ```

- [ ] **Step 4: Update meta text (line 83)**

  Change:
  ```tsx
  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
  ```
  to:
  ```tsx
  <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
  ```

- [ ] **Step 5: Update section header (line 119)**

  Change:
  ```tsx
  <h3 className="text-sm font-semibold">{SECTION_LABELS[section]}</h3>
  ```
  to:
  ```tsx
  <h3 style={{ fontSize: 13, fontWeight: 600 }}>{SECTION_LABELS[section]}</h3>
  ```

- [ ] **Step 6: Update question item text (line 140)**

  Change:
  ```tsx
  <span style={{ color: 'var(--foreground)' }}>{q}</span>
  ```
  to:
  ```tsx
  <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{q}</span>
  ```

- [ ] **Step 7: Verify**

  ```bash
  pnpm typecheck
  ```
  Expected: no errors.

- [ ] **Step 8: Commit**

  ```bash
  git add "apps/pce/admin/app/(app)/templates/[id]/page.tsx"
  git commit -m "fix: template detail page — 28px spacing, Ivypresto title, content typography"
  ```

---

### Task 6: moderation/page.tsx — header, spacing, avatar token fix

**Files:**
- Modify: `apps/pce/admin/app/(app)/moderation/page.tsx`

- [ ] **Step 1: Update both header instances**

  There are two `<header>` elements — the empty-state return (line ~37) and the main return (line ~62). Update both:

  Change:
  ```tsx
  <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
  ```
  to:
  ```tsx
  <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
  ```

- [ ] **Step 2: Update both H1 instances**

  Lines ~40 and ~65. Change both:
  ```tsx
  <h1 className="text-sm font-semibold">Review & Moderation</h1>
  ```
  and:
  ```tsx
  <h1 className="text-sm font-semibold flex-1">Review & Moderation</h1>
  ```
  to (keep `flex-1` only on the main-return instance):
  ```tsx
  <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>Review & Moderation</h1>
  ```
  and:
  ```tsx
  <h1 className="flex-1" style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>Review & Moderation</h1>
  ```

- [ ] **Step 3: Update sub-bar padding (line ~73)**

  Change:
  ```tsx
  <div className="px-4 py-2 border-b border-border shrink-0">
  ```
  to:
  ```tsx
  <div className="py-2 border-b border-border shrink-0" style={{ paddingInline: 28 }}>
  ```

- [ ] **Step 4: Update main content padding (line ~79)**

  Change:
  ```tsx
  <main className="flex-1 overflow-auto p-4">
  ```
  to:
  ```tsx
  <main className="flex-1 overflow-auto" style={{ padding: '0 28px 28px' }}>
  ```

- [ ] **Step 5: Fix AvatarFallback token (line ~167)**

  Change:
  ```tsx
  <AvatarFallback className="text-xs bg-primary text-primary-foreground">{i.initials}</AvatarFallback>
  ```
  to:
  ```tsx
  <AvatarFallback style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)', fontSize: 11 }}>{i.initials}</AvatarFallback>
  ```

- [ ] **Step 6: Update ModerationRow cell typography**

  Course code (line ~148):
  ```tsx
  <span style={{ fontSize: 13, fontWeight: 500 }}>{survey.courseCode}</span>
  ```

  Term subtitle (line ~149):
  ```tsx
  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{survey.term}</span>
  ```

  Deadline cell (line ~152):
  ```tsx
  <TableCell style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
    {survey.deadline}
  </TableCell>
  ```

- [ ] **Step 7: Verify**

  ```bash
  pnpm typecheck
  ```
  Expected: no errors.

- [ ] **Step 8: Commit**

  ```bash
  git add apps/pce/admin/app/\(app\)/moderation/page.tsx
  git commit -m "fix: moderation page — Ivypresto H1, 28px spacing, avatar token, cell typography"
  ```

---

### Task 7: analytics/page.tsx — header, spacing, tokens, typography

**Files:**
- Modify: `apps/pce/admin/app/(app)/analytics/page.tsx`

- [ ] **Step 1: Update page header (line ~83)**

  Change:
  ```tsx
  <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
  ```
  to:
  ```tsx
  <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
  ```

- [ ] **Step 2: Update H1 (line ~87)**

  Change:
  ```tsx
  <h1 className="text-sm font-semibold flex-1">Analytics</h1>
  ```
  to:
  ```tsx
  <h1 className="flex-1" style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>Analytics</h1>
  ```

- [ ] **Step 3: Update main content padding (line ~101)**

  Change:
  ```tsx
  <main className="flex-1 overflow-auto p-6">
  ```
  to:
  ```tsx
  <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
  ```

- [ ] **Step 4: Fix pce-rate-bar tokens in ScoreBar component (lines ~18, ~27)**

  Change:
  ```tsx
  backgroundColor: 'var(--pce-rate-bar-track)',
  ```
  to:
  ```tsx
  backgroundColor: 'var(--muted)',
  ```

  Change:
  ```tsx
  backgroundColor: 'var(--pce-rate-bar-fill)',
  ```
  to:
  ```tsx
  backgroundColor: 'var(--brand-color)',
  ```

- [ ] **Step 5: Fix pce-rate-bar tokens in Response Rates summary card (lines ~130, ~140)**

  Same replacements — `var(--pce-rate-bar-track)` → `var(--muted)`, `var(--pce-rate-bar-fill)` → `var(--brand-color)`.

  After all replacements, `var(--pce-rate-bar-track)` and `var(--pce-rate-bar-fill)` must no longer appear anywhere in the file.

- [ ] **Step 6: Update section labels and score text in Avg Scores card (lines ~159–163)**

  Change:
  ```tsx
  <span className="text-sm flex-1" style={{ color: 'var(--muted-foreground)' }}>
  ```
  to:
  ```tsx
  <span className="flex-1" style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
  ```

  The `ScoreBar` component already uses inline styles for the score number; change its `<span>` (line ~34):
  ```tsx
  <span className="text-sm font-semibold tabular-nums">{score}</span>
  ```
  to:
  ```tsx
  <span style={{ fontSize: 13, fontWeight: 600 }} className="tabular-nums">{score}</span>
  ```

- [ ] **Step 7: Update By Course table cell typography**

  Course code (line ~198):
  ```tsx
  <span className="font-medium text-sm">{survey.courseCode}</span>
  ```
  →
  ```tsx
  <span style={{ fontSize: 13, fontWeight: 500 }}>{survey.courseCode}</span>
  ```

  Course name (line ~200):
  ```tsx
  <span className="text-xs truncate max-w-32" style={{ color: 'var(--muted-foreground)' }}>
  ```
  →
  ```tsx
  <span className="truncate max-w-32" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
  ```

  Response rate (line ~203):
  ```tsx
  <span className="text-sm tabular-nums font-medium">{survey.responseRate}%</span>
  ```
  →
  ```tsx
  <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 500 }}>{survey.responseRate}%</span>
  ```

  Score values in CC/FP/CD cells (lines ~208–215):
  ```tsx
  <span className="text-sm tabular-nums">{cc.avg}</span>
  ```
  →
  ```tsx
  <span className="tabular-nums" style={{ fontSize: 13 }}>{cc.avg}</span>
  ```
  Apply same change to fp and cd cells.

- [ ] **Step 8: Verify**

  ```bash
  pnpm typecheck
  ```
  Also run a quick grep to confirm no `pce-rate-bar` tokens remain:
  ```bash
  grep -n "pce-rate-bar" apps/pce/admin/app/\(app\)/analytics/page.tsx
  ```
  Expected: no output.

- [ ] **Step 9: Commit**

  ```bash
  git add apps/pce/admin/app/\(app\)/analytics/page.tsx
  git commit -m "fix: analytics page — Ivypresto H1, 28px spacing, pce-rate-bar tokens, cell typography"
  ```

---

### Task 8: my-surveys/page.tsx — header, spacing, courseName fix

**Files:**
- Modify: `apps/pce/admin/app/(app)/my-surveys/page.tsx`

- [ ] **Step 1: Update page header (line ~43)**

  Change:
  ```tsx
  <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
  ```
  to:
  ```tsx
  <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
  ```

- [ ] **Step 2: Update H1 (line ~46)**

  Change:
  ```tsx
  <h1 className="text-sm font-semibold flex-1">
    {filterParam === 'released' ? 'Results' : 'My Surveys'}
  </h1>
  ```
  to:
  ```tsx
  <h1 className="flex-1" style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>
    {filterParam === 'released' ? 'Results' : 'My Surveys'}
  </h1>
  ```

- [ ] **Step 3: Update main content padding (line ~59)**

  Change:
  ```tsx
  <main className="flex-1 overflow-auto p-4">
  ```
  to:
  ```tsx
  <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
  ```

- [ ] **Step 4: Fix courseName subtitle (line ~82)**

  In the table row, find:
  ```tsx
  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{survey.term}</span>
  ```
  Change to:
  ```tsx
  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{survey.courseName}</span>
  ```

- [ ] **Step 5: Update course code cell (line ~81)**

  Change:
  ```tsx
  <span className="font-medium text-sm">{survey.courseCode}</span>
  ```
  to:
  ```tsx
  <span style={{ fontSize: 13, fontWeight: 500 }}>{survey.courseCode}</span>
  ```

- [ ] **Step 6: Update deadline cell (line ~95)**

  Change:
  ```tsx
  <TableCell className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
  ```
  to:
  ```tsx
  <TableCell style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
  ```

- [ ] **Step 7: Update MySurveySkeleton H1 (line ~128)**

  The skeleton header has a placeholder for the title area. No text change needed there since it's a skeleton. Leave as-is.

- [ ] **Step 8: Verify**

  ```bash
  pnpm typecheck
  ```
  Expected: no errors.

- [ ] **Step 9: Commit**

  ```bash
  git add apps/pce/admin/app/\(app\)/my-surveys/page.tsx
  git commit -m "fix: my-surveys page — Ivypresto H1, 28px spacing, courseName subtitle"
  ```

---

### Task 9: my-surveys/[id]/results/page.tsx — header and content spacing

**Files:**
- Modify: `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx`

- [ ] **Step 1: Update page header (line ~134)**

  Change:
  ```tsx
  <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
  ```
  to:
  ```tsx
  <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
  ```

- [ ] **Step 2: Update main content padding (line ~149)**

  Change:
  ```tsx
  <main className="flex-1 overflow-auto p-6">
  ```
  to:
  ```tsx
  <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
  ```

- [ ] **Step 3: Verify**

  ```bash
  pnpm typecheck
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add "apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx"
  git commit -m "fix: faculty results page — 28px spacing"
  ```
