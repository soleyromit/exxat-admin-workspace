# PCE UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 UX failures across PCE admin and student apps — status-grouped dashboard, student progress pip bar, re-edit after submission, faculty three-sentiment results view, and copy/DS violations.

**Architecture:** All changes are purely UI — no new backend, no new routes, no new components beyond what's modified in existing files. Mock data updated in place. Admin app uses Admin DS (`@exxat/ds/packages/ui/src`), student app uses Student DS (`@exxat/student/components/ui/*`).

**Tech Stack:** Next.js App Router, React 19, Admin DS (`@exxat-ds/ui`), Student DS (`studentUX`), localStorage for student progress persistence.

---

## File Map

**Admin — modified:**
- `apps/pce/admin/lib/pce-mock-data.ts` — add `FACULTY_SECTION_LABELS`, richer s3 comments
- `apps/pce/admin/app/(app)/surveys/page.tsx` — status-grouped layout, InputGroup search, remove status filter
- `apps/pce/admin/app/(app)/surveys/[id]/page.tsx` — "Share with Faculty" copy, destructive button fix, avatar tokens
- `apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx` — DS Badge for hidden count
- `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx` — three sentiment groups, FACULTY_SECTION_LABELS
- `apps/pce/admin/components/pce/pce-modals.tsx` — "Share with Faculty" in ReleaseSheet title + CTA, avatar tokens
- `apps/pce/admin/app/(app)/templates/page.tsx` — InputGroup search, Button link for "Used by"

**Student — modified:**
- `apps/pce/student/lib/mock-surveys.ts` — section title renames
- `apps/pce/student/app/surveys/[id]/page.tsx` — gate fix, editing banner, pip bar, DS Button replacements
- `apps/pce/student/app/surveys/[id]/submitted/page.tsx` — info banner + "Edit my responses" CTA

---

## Task 1: Admin mock data — FACULTY_SECTION_LABELS + richer s3 comments

**Files:**
- Modify: `apps/pce/admin/lib/pce-mock-data.ts`

Context: `SECTION_LABELS` is used by admin pages (responses, detail). Faculty self-view needs different labels ("About Your Teaching" instead of "Faculty Performance"). s3 needs more comment variety to demonstrate all three sentiment groups in faculty results.

- [ ] **Step 1: Add FACULTY_SECTION_LABELS export and enrich s3 comments**

Open `apps/pce/admin/lib/pce-mock-data.ts`. Find the `SECTION_LABELS` export near the bottom (line 259) and add `FACULTY_SECTION_LABELS` after it. Also update the s3 comments array.

Replace the s3 comments block (currently lines 238–242) with:

```ts
    comments: [
      { section: 'faculty_performance', text: 'Dr. Williams is an excellent communicator.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Office hours were very helpful.', sentiment: 'positive' },
      { section: 'faculty_performance', text: 'Pace of lectures was sometimes too fast to follow.', sentiment: 'neutral' },
      { section: 'course_content', text: 'Some topics could be covered in more depth.', sentiment: 'neutral' },
      { section: 'course_content', text: 'More worked examples in assessments would help.', sentiment: 'concern' },
    ],
```

Then add after the existing `SECTION_LABELS` export (after line 263):

```ts
export const FACULTY_SECTION_LABELS: Record<TemplateSection, string> = {
  course_content:      'About the Course',
  faculty_performance: 'About Your Teaching',
  course_director:     'About the Course Director',
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
cd /Users/romitsoley/Work/apps/pce/admin && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors (existing `ignoreBuildErrors` suppresses student app issues; admin should be clean).

- [ ] **Step 3: Commit**

```bash
git add apps/pce/admin/lib/pce-mock-data.ts
git commit -m "feat(pce): add FACULTY_SECTION_LABELS, enrich s3 comments with all three sentiments"
```

---

## Task 2: Student mock data — section title renames

**Files:**
- Modify: `apps/pce/student/lib/mock-surveys.ts`

Context: Section titles in student mock data use admin taxonomy ("Faculty Performance — Dr. Anita Patel"). Replace with natural language ("About Dr. Anita Patel"). The breadcrumb code `s.title.split(' — ')[0]` already returns the full title when there's no ` — `, so no breadcrumb logic changes needed.

- [ ] **Step 1: Rename section titles in mock-surveys.ts**

In `apps/pce/student/lib/mock-surveys.ts`, make these exact replacements:

```ts
// Survey ps1 — BIO 201
// Section 'cc':
title: 'Course Content',          →  title: 'About the Course',
description: 'Help us understand how well the course content supported your learning.',
// (description unchanged)

// Section 'fp-patel':
title: 'Faculty Performance — Dr. Anita Patel',  →  title: 'About Dr. Anita Patel',
description: 'Share your experience with Dr. Patel as an instructor.',  →  description: 'Share your experience with Dr. Patel as your instructor.',

// Section 'fp-chen':
title: 'Faculty Performance — Dr. Kevin Chen',  →  title: 'About Dr. Kevin Chen',
description: 'Share your experience with Dr. Chen as a guest lecturer.',  →  description: 'Share your experience with Dr. Chen as your guest lecturer.',

// Survey ps2 — NURS 310, section 'fp-williams':
title: 'Faculty Performance — Dr. Maria Williams',  →  title: 'About Dr. Maria Williams',
description: 'Share your experience with Dr. Williams as an instructor.',  →  description: 'Share your experience with Dr. Williams as your instructor.',

// Survey ps3 — MED 410, section 'cc':
title: 'Course Content',  →  title: 'About the Course',

// Survey ps3, section 'fp-williams':
// Same as ps2 fp-williams above

// Survey ps4 — PHYS 101, section 'cc':
title: 'Course Content',  →  title: 'About the Course',

// Survey ps4, section 'fp-kim':
title: 'Faculty Performance — Dr. James Kim',  →  title: 'About Dr. James Kim',
description: 'Share your experience with Dr. Kim as an instructor.',  →  description: 'Share your experience with Dr. Kim as your instructor.',
```

The full updated `MOCK_STUDENT_SURVEYS` sections block for ps1:

```ts
    sections: [
      {
        id: 'cc',
        title: 'About the Course',
        description: 'Help us understand how well the course content supported your learning.',
        questions: COURSE_CONTENT_QUESTIONS,
      },
      {
        id: 'fp-patel',
        title: 'About Dr. Anita Patel',
        description: 'Share your experience with Dr. Patel as your instructor.',
        questions: FACULTY_PERFORMANCE_QUESTIONS,
      },
      {
        id: 'fp-chen',
        title: 'About Dr. Kevin Chen',
        description: 'Share your experience with Dr. Chen as your guest lecturer.',
        questions: FACULTY_PERFORMANCE_QUESTIONS,
      },
    ],
```

ps2 sections:
```ts
    sections: [
      {
        id: 'cc',
        title: 'About the Course',
        description: 'Help us understand how well the course content supported your learning.',
        questions: COURSE_CONTENT_QUESTIONS,
      },
      {
        id: 'fp-williams',
        title: 'About Dr. Maria Williams',
        description: 'Share your experience with Dr. Williams as your instructor.',
        questions: FACULTY_PERFORMANCE_QUESTIONS,
      },
    ],
```

ps3 sections (same structure as ps2):
```ts
    sections: [
      {
        id: 'cc',
        title: 'About the Course',
        description: 'Help us understand how well the course content supported your learning.',
        questions: COURSE_CONTENT_QUESTIONS,
      },
      {
        id: 'fp-williams',
        title: 'About Dr. Maria Williams',
        description: 'Share your experience with Dr. Williams as your instructor.',
        questions: FACULTY_PERFORMANCE_QUESTIONS,
      },
    ],
```

ps4 sections:
```ts
    sections: [
      {
        id: 'cc',
        title: 'About the Course',
        description: 'Help us understand how well the course content supported your learning.',
        questions: COURSE_CONTENT_QUESTIONS,
      },
      {
        id: 'fp-kim',
        title: 'About Dr. James Kim',
        description: 'Share your experience with Dr. Kim as your instructor.',
        questions: FACULTY_PERFORMANCE_QUESTIONS,
      },
    ],
```

- [ ] **Step 2: Start student dev server and verify**

```bash
kill $(lsof -ti :3006) 2>/dev/null
nohup bash -c 'cd /Users/romitsoley/Work/apps/pce/student && pnpm dev' > /tmp/pce-student-dev.log 2>&1 &
sleep 8 && tail -5 /tmp/pce-student-dev.log
```

Open http://localhost:3006/surveys and click into BIO 201. Section breadcrumb should read "About the Course › About Dr. Anita Patel › About Dr. Kevin Chen". Section header should say "About the Course" (not "Course Content").

- [ ] **Step 3: Commit**

```bash
git add apps/pce/student/lib/mock-surveys.ts
git commit -m "feat(pce/student): rename section titles to natural language"
```

---

## Task 3: Admin copy — "Share with Faculty" in 4 places

**Files:**
- Modify: `apps/pce/admin/app/(app)/surveys/[id]/page.tsx`
- Modify: `apps/pce/admin/components/pce/pce-modals.tsx`

- [ ] **Step 1: Fix surveys/[id]/page.tsx — banner button and overview button**

In `apps/pce/admin/app/(app)/surveys/[id]/page.tsx`:

Find line ~65 (pending review banner button):
```tsx
          <Button size="sm" onClick={() => setReleaseOpen(true)}>
            Review & Release
            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
          </Button>
```
Change to:
```tsx
          <Button size="sm" onClick={() => setReleaseOpen(true)}>
            Share with Faculty
            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
          </Button>
```

Find line ~115 (overview card button):
```tsx
              {isPendingReview && (
                <Button size="sm" onClick={() => setReleaseOpen(true)}>
                  Release to Faculty
                </Button>
              )}
```
Change to:
```tsx
              {isPendingReview && (
                <Button size="sm" onClick={() => setReleaseOpen(true)}>
                  Share with Faculty
                </Button>
              )}
```

Also fix the Close Survey button (line ~109). Change:
```tsx
                <Button variant="outline" size="sm" onClick={() => setCloseOpen(true)}
                  style={{ color: 'var(--destructive)', borderColor: 'var(--destructive)' }}>
                  Close Survey
                </Button>
```
To:
```tsx
                <Button variant="destructive" size="sm" onClick={() => setCloseOpen(true)}>
                  Close Survey
                </Button>
```

Also fix both avatar token violations. Find all occurrences of `className="text-xs bg-primary text-primary-foreground"` in this file and change to:
```tsx
className="text-xs" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
```

- [ ] **Step 2: Fix pce-modals.tsx — ReleaseSheet title and confirm button**

In `apps/pce/admin/components/pce/pce-modals.tsx`:

Find line ~444 (SheetTitle in ReleaseSheet):
```tsx
          <SheetTitle>Release to Faculty</SheetTitle>
```
Change to:
```tsx
          <SheetTitle>Share with Faculty</SheetTitle>
```

Find line ~505 (footer confirm button):
```tsx
            Release to Faculty
```
Change to:
```tsx
            Share with Faculty
```

Also fix the avatar on line ~487:
```tsx
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">{i.initials}</AvatarFallback>
```
Change to:
```tsx
                    <AvatarFallback className="text-xs" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>{i.initials}</AvatarFallback>
```

- [ ] **Step 3: Start admin dev server and verify copy**

```bash
kill $(lsof -ti :3005) 2>/dev/null
nohup bash -c 'cd /Users/romitsoley/Work/apps/pce/admin && pnpm dev' > /tmp/pce-admin-dev.log 2>&1 &
sleep 8 && tail -5 /tmp/pce-admin-dev.log
```

Navigate to http://localhost:3005/surveys/s1 (pending_review survey). Verify:
- Pending review banner button says "Share with Faculty" (not "Review & Release")
- Overview card button says "Share with Faculty" (not "Release to Faculty")
- Close Survey button has red background (destructive variant)
- Click "Share with Faculty" to open the sheet — title should say "Share with Faculty", footer button should say "Share with Faculty"
- Avatar fallbacks should use brand lavender (not dark primary blue)

- [ ] **Step 4: Commit**

```bash
git add apps/pce/admin/app/\(app\)/surveys/\[id\]/page.tsx apps/pce/admin/components/pce/pce-modals.tsx
git commit -m "fix(pce/admin): Share with Faculty copy, destructive close button, avatar tokens"
```

---

## Task 4: Admin DS violation fixes — Badge, Input, Button link, avatars

**Files:**
- Modify: `apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx`
- Modify: `apps/pce/admin/app/(app)/surveys/page.tsx` (search input only — full layout change in Task 5)
- Modify: `apps/pce/admin/app/(app)/templates/page.tsx`

- [ ] **Step 1: Fix responses/page.tsx — Badge for hidden count**

In `apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx`:

Add `Badge` to the DS import on line 4:
```tsx
import { Button, Separator, SidebarTrigger, Tooltip, TooltipTrigger, TooltipContent, Badge } from '@exxat/ds/packages/ui/src'
```

Find lines 72–74 (the hand-rolled hidden count span):
```tsx
        {hiddenCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            {hiddenCount} hidden from faculty
          </span>
        )}
```

Replace with:
```tsx
        {hiddenCount > 0 && (
          <Badge variant="secondary">
            {hiddenCount} hidden from faculty
          </Badge>
        )}
```

- [ ] **Step 2: Fix templates/page.tsx — InputGroup search + Button link for "Used by"**

In `apps/pce/admin/app/(app)/templates/page.tsx`:

Add to the DS imports at the top of the file — add `Input`, `InputGroup`, `InputGroupAddon`:
```tsx
import {
  Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  SidebarTrigger, Separator, Input, InputGroup, InputGroupAddon,
} from '@exxat/ds/packages/ui/src'
```

Find the raw `<input>` block in the toolbar (lines ~41–54):
```tsx
        <div className="relative">
          <i
            className="fa-light fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
            style={{ fontSize: 12, color: 'var(--muted-foreground)' }}
          />
          <input
            className="h-8 rounded-md border border-border bg-background pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
            style={{ width: 220 }}
            placeholder="Search templates…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
```

Replace with:
```tsx
        <InputGroup className="w-56">
          <InputGroupAddon align="start">
            <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
          </InputGroupAddon>
          <Input
            placeholder="Search templates…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </InputGroup>
```

Find the raw `<button>` for "Used by" count (lines ~139–144):
```tsx
          {template.usedBySurveyCount > 0 ? (
            <button
              className="text-sm tabular-nums underline"
              style={{ color: 'var(--brand-color)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {template.usedBySurveyCount}
            </button>
          ) : (
```

Replace with:
```tsx
          {template.usedBySurveyCount > 0 ? (
            <Button variant="link" size="sm" className="h-auto p-0 text-sm tabular-nums">
              {template.usedBySurveyCount}
            </Button>
          ) : (
```

- [ ] **Step 3: Verify admin dev server**

With the admin dev server still running (or restart with `kill $(lsof -ti :3005) 2>/dev/null && nohup bash -c 'cd /Users/romitsoley/Work/apps/pce/admin && pnpm dev' > /tmp/pce-admin-dev.log 2>&1 &`):

Navigate to http://localhost:3005/surveys/s3/responses (s3 has hiddenComments). If hiddenComments is empty, toggle one comment to hidden first. Verify the hidden count shows as a DS Badge (rounded, muted background).

Navigate to http://localhost:3005/templates. Verify search input uses DS Input style (proper border, focus ring). "Used by" count column shows as a link-styled button.

- [ ] **Step 4: Commit**

```bash
git add apps/pce/admin/app/\(app\)/surveys/\[id\]/responses/page.tsx apps/pce/admin/app/\(app\)/templates/page.tsx
git commit -m "fix(pce/admin): DS Badge for hidden count, InputGroup search and Button link in templates"
```

---

## Task 5: Admin surveys dashboard — status-grouped layout

**Files:**
- Modify: `apps/pce/admin/app/(app)/surveys/page.tsx` — full rewrite

Context: Replace the flat `<Table>` with status-grouped collapsible sections. Five groups in fixed priority order: Needs Action (pending_review) → Collecting → Draft → Shared with Faculty (released) → Closed. First 3 default open, last 2 default collapsed. Status filter Select removed (redundant with grouping). InputGroup search replaces raw input.

- [ ] **Step 1: Rewrite surveys/page.tsx**

Replace the entire content of `apps/pce/admin/app/(app)/surveys/page.tsx` with:

```tsx
'use client'

import { useState } from 'react'
import {
  Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Tooltip, TooltipTrigger, TooltipContent,
  SidebarTrigger, Separator, Avatar, AvatarFallback, Badge,
  Input, InputGroup, InputGroupAddon,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { ResponseGauge } from '@/components/pce/response-gauge'
import { CreateSurveySheet, CloseSurveyDialog } from '@/components/pce/pce-modals'
import { MOCK_TERMS } from '@/lib/pce-mock-data'
import type { PceSurvey, SurveyStatus } from '@/lib/pce-mock-data'
import Link from 'next/link'

type GroupConfig = { status: SurveyStatus; label: string; defaultOpen: boolean }

const GROUP_CONFIG: GroupConfig[] = [
  { status: 'pending_review', label: 'Needs Action',        defaultOpen: true  },
  { status: 'collecting',     label: 'Collecting',          defaultOpen: true  },
  { status: 'draft',          label: 'Draft',               defaultOpen: true  },
  { status: 'released',       label: 'Shared with Faculty', defaultOpen: false },
  { status: 'closed',         label: 'Closed',              defaultOpen: false },
]

export default function SurveysPage() {
  const { surveys } = usePce()
  const [createOpen, setCreateOpen] = useState(false)
  const [closeSurvey, setCloseSurvey] = useState<PceSurvey | null>(null)
  const [termFilter, setTermFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(GROUP_CONFIG.map(g => [g.status, g.defaultOpen]))
  )

  const filtered = surveys.filter(s => {
    if (termFilter !== 'all' && s.term !== termFilter) return false
    if (search && !`${s.courseCode} ${s.courseName}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const hasResults = filtered.length > 0

  return (
    <>
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-semibold flex-1">Surveys</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          Create Survey
        </Button>
      </header>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0 flex-wrap">
        <InputGroup className="w-56">
          <InputGroupAddon align="start">
            <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
          </InputGroupAddon>
          <Input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </InputGroup>

        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="All terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All terms</SelectItem>
            {MOCK_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <main className="flex-1 overflow-auto px-4 pb-4">
        {!hasResults ? (
          <EmptySurveys
            onCreate={() => setCreateOpen(true)}
            hasFilters={termFilter !== 'all' || search.length > 0}
          />
        ) : (
          <div className="flex flex-col">
            {GROUP_CONFIG.map(group => {
              const groupSurveys = filtered.filter(s => s.status === group.status)
              if (groupSurveys.length === 0) return null
              const isOpen = openGroups[group.status]

              return (
                <Collapsible
                  key={group.status}
                  open={isOpen}
                  onOpenChange={() => setOpenGroups(prev => ({ ...prev, [group.status]: !prev[group.status] }))}
                >
                  <div
                    className="flex items-center gap-2 py-2.5 px-1"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <span
                      className="text-xs font-semibold uppercase tracking-wide flex-1"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {group.label}
                    </span>
                    <Badge variant="secondary">{groupSurveys.length}</Badge>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon-xs" aria-label={isOpen ? 'Collapse group' : 'Expand group'}>
                        <i
                          className={`fa-light ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}
                          aria-hidden="true"
                          style={{ fontSize: 10 }}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div className="border border-border rounded-lg overflow-hidden mb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead>Instructor(s)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Response rate</TableHead>
                            <TableHead>Deadline</TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupSurveys.map(s => (
                            <SurveyRow key={s.id} survey={s} onClose={() => setCloseSurvey(s)} />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        )}
      </main>

      <CreateSurveySheet open={createOpen} onOpenChange={setCreateOpen} />
      <CloseSurveyDialog
        open={!!closeSurvey}
        onOpenChange={v => { if (!v) setCloseSurvey(null) }}
        survey={closeSurvey}
      />
    </>
  )
}

function SurveyRow({ survey, onClose }: { survey: PceSurvey; onClose: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  const primary = survey.instructors.find(i => i.role === 'primary')
  const extraCount = survey.instructors.length - 1

  return (
    <TableRow
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <TableCell>
        <Link href={`/surveys/${survey.id}`} className="flex flex-col gap-0.5 hover:underline">
          <span className="font-medium text-sm">{survey.courseCode}</span>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{survey.courseName}</span>
        </Link>
      </TableCell>
      <TableCell>
        {primary && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 w-fit">
                <Avatar className="h-6 w-6">
                  <AvatarFallback
                    className="text-xs"
                    style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
                  >
                    {primary.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm truncate max-w-32">{primary.name}</span>
                {extraCount > 0 && (
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    +{extraCount}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            {extraCount > 0 && (
              <TooltipContent>
                <div className="flex flex-col gap-0.5">
                  {survey.instructors.map(i => (
                    <span key={i.id} className="text-xs">{i.name} ({i.role})</span>
                  ))}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </TableCell>
      <TableCell><SurveyStatusBadge status={survey.status} /></TableCell>
      <TableCell>
        <ResponseGauge
          rate={survey.responseRate}
          responseCount={survey.responseCount}
          enrollmentCount={survey.enrollmentCount}
          showBar={survey.responseRate > 0}
        />
      </TableCell>
      <TableCell className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {survey.deadline}
      </TableCell>
      <TableCell>
        <div style={{ opacity: hovered || menuOpen ? 1 : 0, transition: 'opacity 100ms' }}>
          <DropdownMenu onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Survey actions">
                <i className="fa-regular fa-ellipsis" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/surveys/${survey.id}`}>
                  <i className="fa-light fa-eye" aria-hidden="true" />
                  View
                </Link>
              </DropdownMenuItem>
              {(survey.status === 'collecting' || survey.status === 'active') && (
                <DropdownMenuItem>
                  <i className="fa-light fa-bell" aria-hidden="true" />
                  Send Reminder
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {(survey.status === 'collecting' || survey.status === 'active') && (
                <DropdownMenuItem variant="destructive" onClick={onClose}>
                  <i className="fa-light fa-xmark" aria-hidden="true" />
                  Close Survey
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

function EmptySurveys({ onCreate, hasFilters }: { onCreate: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 40, color: 'var(--muted-foreground)' }} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          {hasFilters ? 'No surveys match these filters' : 'No surveys yet'}
        </p>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 320 }}>
          {hasFilters
            ? 'Try adjusting your filters.'
            : 'Create a survey from a template to start collecting responses.'}
        </p>
      </div>
      {!hasFilters && (
        <Button size="sm" onClick={onCreate}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          Create Survey
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

With admin dev server running, open http://localhost:3005/surveys. Verify:
- Three groups are visible and expanded: "Needs Action" (3 surveys), "Collecting" (1), "Draft" (1)
- Two groups are collapsed: "Shared with Faculty" (1), "Closed" (1)
- Clicking a chevron collapses/expands its group
- Search for "bio" — only BIO 201 shows, in its correct group
- Term filter "Fall 2025" — only PHYS 101 shows in "Closed"
- Row shows course name below code (e.g., "BIO 201" / "Cellular Biology")
- Avatar fallbacks use brand lavender tint (not dark blue)
- Status filter dropdown is gone from the toolbar

- [ ] **Step 3: Commit**

```bash
git add apps/pce/admin/app/\(app\)/surveys/page.tsx
git commit -m "feat(pce/admin): status-grouped surveys dashboard with collapsible sections"
```

---

## Task 6: Admin faculty results — three sentiment groups

**Files:**
- Modify: `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx`

Context: Replace the flat raw comment list with three curated groups: "What students appreciated" (positive, green), "Students also noted" (neutral, slate), "Areas for consideration" (concern, amber). Each group only renders if it has comments. Max 3 comments per group. Attribution footer.

- [ ] **Step 1: Add CommentGroup component and rewrite results page**

Replace the entire content of `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx` with:

```tsx
'use client'

import { useParams } from 'next/navigation'
import { Button, Separator, SidebarTrigger } from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { MOCK_RESPONSES, FACULTY_SECTION_LABELS, SECTION_LABELS } from '@/lib/pce-mock-data'
import type { TemplateSection, ResponseComment } from '@/lib/pce-mock-data'
import Link from 'next/link'

type Sentiment = 'positive' | 'neutral' | 'concern'

const SENTIMENT_CONFIG: Record<Sentiment, {
  icon: string
  label: string
  countSuffix: string
  containerBorder: string
  headerBg: string
  labelColor: string
  countBg: string
  quotesBg: string
  quotesBorder: string
  quoteDivider: string
}> = {
  positive: {
    icon: '😊',
    label: 'What students appreciated',
    countSuffix: 'highlight',
    containerBorder: 'color-mix(in oklch, var(--chart-2) 30%, transparent)',
    headerBg:       'color-mix(in oklch, var(--chart-2) 12%, transparent)',
    labelColor:     'color-mix(in oklch, var(--chart-2) 80%, var(--foreground))',
    countBg:        'color-mix(in oklch, var(--chart-2) 20%, transparent)',
    quotesBg:       'color-mix(in oklch, var(--chart-2) 8%, transparent)',
    quotesBorder:   'color-mix(in oklch, var(--chart-2) 25%, transparent)',
    quoteDivider:   'color-mix(in oklch, var(--chart-2) 20%, transparent)',
  },
  neutral: {
    icon: '💭',
    label: 'Students also noted',
    countSuffix: 'observation',
    containerBorder: 'var(--border)',
    headerBg:        'var(--muted)',
    labelColor:      'var(--muted-foreground)',
    countBg:         'var(--border)',
    quotesBg:        'var(--muted)',
    quotesBorder:    'var(--border)',
    quoteDivider:    'var(--border-control)',
  },
  concern: {
    icon: '📌',
    label: 'Areas for consideration',
    countSuffix: 'highlight',
    containerBorder: 'color-mix(in oklch, var(--chart-4) 30%, transparent)',
    headerBg:        'var(--insight-severity-warning-bg)',
    labelColor:      'var(--insight-severity-warning-fg)',
    countBg:         'color-mix(in oklch, var(--chart-4) 20%, transparent)',
    quotesBg:        'var(--insight-severity-warning-bg)',
    quotesBorder:    'color-mix(in oklch, var(--chart-4) 25%, transparent)',
    quoteDivider:    'color-mix(in oklch, var(--chart-4) 20%, transparent)',
  },
}

function CommentGroup({
  sentiment,
  comments,
}: {
  sentiment: Sentiment
  comments: Pick<ResponseComment, 'text'>[]
}) {
  if (comments.length === 0) return null
  const cfg = SENTIMENT_CONFIG[sentiment]
  const countLabel = `${comments.length} ${cfg.countSuffix}${comments.length !== 1 ? 's' : ''}`

  return (
    <div style={{ border: `1px solid ${cfg.containerBorder}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ background: cfg.headerBg, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 13 }}>{cfg.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, flex: 1, color: cfg.labelColor }}>{cfg.label}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
          background: cfg.countBg, color: cfg.labelColor,
        }}>
          {countLabel}
        </span>
      </div>
      <div style={{ background: cfg.quotesBg, borderTop: `1px solid ${cfg.quotesBorder}`, padding: '2px 10px 7px' }}>
        {comments.map((comment, i) => (
          <div
            key={i}
            style={{
              fontSize: 11,
              fontStyle: 'italic',
              color: 'var(--foreground)',
              padding: '5px 0',
              borderBottom: i < comments.length - 1 ? `1px dashed ${cfg.quoteDivider}` : 'none',
              lineHeight: 1.5,
            }}
          >
            &ldquo;{comment.text}&rdquo;
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FacultyResultsPage() {
  const { id } = useParams<{ id: string }>()
  const { surveys, templates, hiddenComments } = usePce()

  const survey = surveys.find(s => s.id === id)
  const template = survey ? templates.find(t => t.id === survey.templateId) : null
  const isReleased = survey?.status === 'released' || survey?.status === 'closed'
  const responses = isReleased ? MOCK_RESPONSES.find(r => r.surveyId === id) : null
  const hidden = hiddenComments[id] ?? []

  if (!survey) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
        <p className="text-sm font-medium">Survey not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/my-surveys">Back to My Surveys</Link>
        </Button>
      </div>
    )
  }

  const sharedDate = survey.releasedAt
    ? `Shared ${survey.releasedAt}`
    : null

  return (
    <>
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/my-surveys" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>My Surveys</Link>
        <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <span className="text-sm font-semibold flex-1 truncate">
          {survey.courseCode} — {survey.courseName}
        </span>
        {sharedDate ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            {sharedDate}
          </span>
        ) : (
          <SurveyStatusBadge status={survey.status} />
        )}
      </header>

      <main className="flex-1 overflow-auto p-6">
        {!isReleased ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              <i className="fa-light fa-lock-keyhole" aria-hidden="true"
                style={{ fontSize: 28, color: 'var(--muted-foreground)' }} />
            </div>
            <div className="flex flex-col gap-2 max-w-sm">
              <p className="text-base font-semibold">Results aren&apos;t available yet</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                The program administrator reviews all responses before sharing them with instructors.
                You&apos;ll be notified when your results are ready.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/my-surveys">Back to My Surveys</Link>
            </Button>
          </div>
        ) : !responses ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <i className="fa-light fa-chart-bar text-4xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm font-medium">No responses were collected for this survey.</p>
          </div>
        ) : (
          <div className="max-w-2xl flex flex-col gap-6">
            {template?.sections.map((section: TemplateSection) => {
              const sectionScore = responses.sectionScores.find(s => s.section === section)
              if (!sectionScore) return null

              const sectionComments = responses.comments
                .map((c, i) => ({ ...c, globalIndex: i }))
                .filter(c => c.section === section && !hidden.includes(c.globalIndex))

              const positive = sectionComments.filter(c => c.sentiment === 'positive').slice(0, 3)
              const neutral  = sectionComments.filter(c => c.sentiment === 'neutral').slice(0, 3)
              const concern  = sectionComments.filter(c => c.sentiment === 'concern').slice(0, 3)
              const hasAnyComments = positive.length + neutral.length + concern.length > 0

              const sectionLabel = FACULTY_SECTION_LABELS[section] ?? SECTION_LABELS[section]

              return (
                <div key={section} className="border border-border rounded-lg overflow-hidden">
                  {/* Section header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="text-sm font-semibold">{sectionLabel}</h2>
                    <span className="text-sm font-bold tabular-nums">avg {sectionScore.avg}/5</span>
                  </div>

                  {/* Score bar */}
                  <div className="px-4 py-4 border-b border-border flex flex-col gap-2">
                    <div style={{ height: 8, borderRadius: 4, backgroundColor: 'var(--muted)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(sectionScore.avg / 5) * 100}%`,
                          borderRadius: 4,
                          backgroundColor: 'var(--brand-color)',
                          transition: 'width 600ms ease',
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Based on {sectionScore.count} responses
                    </p>
                  </div>

                  {/* Three sentiment groups */}
                  {hasAnyComments && (
                    <div className="px-3 py-3 flex flex-col gap-2">
                      <CommentGroup sentiment="positive" comments={positive} />
                      <CommentGroup sentiment="neutral"  comments={neutral}  />
                      <CommentGroup sentiment="concern"  comments={concern}  />
                    </div>
                  )}

                  {/* Attribution */}
                  {hasAnyComments && (
                    <div
                      className="px-4 py-2.5 text-center"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        Highlights selected by your program administrator
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
```

- [ ] **Step 2: Verify in browser**

Switch role to Faculty in the app sidebar (role toggle). Navigate to http://localhost:3005/my-surveys and click into MED 410 (s3, released). Verify:
- Section header says "About Your Teaching" (not "Faculty Performance")
- Score bar renders for each section
- Three groups appear: "What students appreciated" (green), "Students also noted" (slate), "Areas for consideration" (amber)
- "Highlights selected by your program administrator" attribution footer appears
- Switch back to Admin, go to /surveys/s3/responses, hide a comment. Switch to Faculty. Verify the hidden comment no longer appears in any group.
- s4 (PHYS 101, closed) has only positive comments — verify "Students also noted" and "Areas for consideration" groups are absent
- Header badge for released surveys shows "Shared Apr 17" text (not the SurveyStatusBadge pill)

- [ ] **Step 3: Commit**

```bash
git add apps/pce/admin/app/\(app\)/my-surveys/\[id\]/results/page.tsx
git commit -m "feat(pce/admin): faculty results three-sentiment groups with attribution footer"
```

---

## Task 7: Student survey — gate fix, editing banner, pip bar, DS Buttons

**Files:**
- Modify: `apps/pce/student/app/surveys/[id]/page.tsx`

Context: Four changes to this file:
1. Gate fix: allow `status === 'submitted'` through (currently shows locked state)
2. Editing banner: amber info strip shown when re-entering a submitted survey
3. Pip progress bar: segmented dots in section header (one per required question, fills as answered)
4. DS Button replacements: breadcrumb `<button>`, Previous `<button>`, Next/Submit `<button>`, rating pill `<button>` elements

- [ ] **Step 1: Update imports**

In `apps/pce/student/app/surveys/[id]/page.tsx`, line 5, change:
```tsx
import { buttonVariants } from '@exxat/student/components/ui/button'
```
To:
```tsx
import { Button, buttonVariants } from '@exxat/student/components/ui/button'
```

- [ ] **Step 2: Fix the locked gate (line 96)**

Find:
```tsx
  if (survey.status !== 'open') {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-3 text-center px-6">
        <i className="fa-light fa-lock-keyhole" aria-hidden="true" style={{ fontSize: 40, color: 'var(--muted-foreground)' }} />
        <p className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          {survey.status === 'submitted' ? 'Already submitted' : 'This survey is closed'}
        </p>
        <Link href="/surveys" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Back to Surveys
        </Link>
      </div>
    )
  }
```

Replace with:
```tsx
  if (survey.status !== 'open' && survey.status !== 'submitted') {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-3 text-center px-6">
        <i className="fa-light fa-lock-keyhole" aria-hidden="true" style={{ fontSize: 40, color: 'var(--muted-foreground)' }} />
        <p className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          This survey is closed
        </p>
        <Link href="/surveys" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Back to Surveys
        </Link>
      </div>
    )
  }
```

- [ ] **Step 3: Add editing banner after the resume banner block**

Find the closing `)}` of the resume banner (after line 176 `Resumed where you left off`). Add the editing banner immediately after it:

```tsx
      {/* Editing banner — shown when re-entering a submitted survey */}
      {survey.status === 'submitted' && (
        <div
          className="flex items-center gap-2 px-6 py-3 text-sm border-b"
          style={{
            backgroundColor: 'var(--insight-severity-warning-bg)',
            borderColor: 'var(--border)',
            color: 'var(--insight-severity-warning-fg)',
          }}
        >
          <i className="fa-light fa-pen-to-square shrink-0" aria-hidden="true" style={{ fontSize: 13 }} />
          <span>
            You&apos;re editing your previous submission. Re-submitting will replace your earlier answers.
          </span>
        </div>
      )}
```

- [ ] **Step 4: Replace breadcrumb raw buttons**

Find the breadcrumb section (lines ~199–228). The `<button>` elements inside `survey.sections.map` need to become DS `Button`. Replace:

```tsx
            <button
              onClick={() => i < currentSection && setCurrentSection(i)}
              className="text-xs px-2 py-1 rounded-full transition-colors"
              style={{
                backgroundColor: i === currentSection
                  ? 'var(--brand-color)'
                  : i < currentSection
                    ? 'var(--brand-color-soft)'
                    : 'transparent',
                color: i === currentSection
                  ? 'white'
                  : i < currentSection
                    ? 'var(--brand-color-dark)'
                    : 'var(--muted-foreground)',
                cursor: i < currentSection ? 'pointer' : 'default',
              }}
            >
              {i < currentSection && (
                <i className="fa-solid fa-check me-1 text-xs" aria-hidden="true" />
              )}
              {s.title.split(' — ')[0]}
            </button>
```

With:
```tsx
            <Button
              variant="ghost"
              size="sm"
              onClick={() => i < currentSection && setCurrentSection(i)}
              className="text-xs h-auto px-2 py-1 rounded-full"
              style={{
                backgroundColor: i === currentSection
                  ? 'var(--brand-color)'
                  : i < currentSection
                    ? 'var(--brand-color-soft)'
                    : 'transparent',
                color: i === currentSection
                  ? 'white'
                  : i < currentSection
                    ? 'var(--brand-color-dark)'
                    : 'var(--muted-foreground)',
                cursor: i < currentSection ? 'pointer' : 'default',
              }}
            >
              {i < currentSection && (
                <i className="fa-solid fa-check me-1 text-xs" aria-hidden="true" />
              )}
              {s.title.split(' — ')[0]}
            </Button>
```

- [ ] **Step 5: Replace Previous and Next/Submit raw buttons**

Find the footer `<button>` for Previous (lines ~244–258):
```tsx
        <button
          onClick={() => setCurrentSection(c => c - 1)}
          disabled={currentSection === 0}
          className="text-sm"
          style={{
            color: currentSection === 0 ? 'var(--muted-foreground)' : 'var(--brand-color)',
            background: 'none',
            border: 'none',
            cursor: currentSection === 0 ? 'default' : 'pointer',
            padding: 0,
          }}
        >
          <i className="fa-light fa-arrow-left me-1" aria-hidden="true" style={{ fontSize: 12 }} />
          Previous
        </button>
```

Replace with:
```tsx
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentSection(c => c - 1)}
          disabled={currentSection === 0}
        >
          <i className="fa-light fa-arrow-left me-1" aria-hidden="true" style={{ fontSize: 12 }} />
          Previous
        </Button>
```

Find the footer `<button>` for Next/Submit (lines ~275–303):
```tsx
        <button
          onClick={handleNext}
          disabled={!sectionAnswered || submitting}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
          style={{
            backgroundColor: sectionAnswered && !submitting ? 'var(--brand-color)' : 'var(--muted)',
            color: sectionAnswered && !submitting ? 'white' : 'var(--muted-foreground)',
            border: 'none',
            cursor: sectionAnswered && !submitting ? 'pointer' : 'default',
          }}
        >
          {submitting ? (
            <>
              <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" style={{ fontSize: 12 }} />
              Submitting…
            </>
          ) : isLastSection ? (
            <>
              Submit
              <i className="fa-light fa-check ms-1" aria-hidden="true" style={{ fontSize: 12 }} />
            </>
          ) : (
            <>
              Next
              <i className="fa-light fa-arrow-right ms-1" aria-hidden="true" style={{ fontSize: 12 }} />
            </>
          )}
        </button>
```

Replace with:
```tsx
        <Button
          variant={sectionAnswered && !submitting ? 'default' : 'secondary'}
          size="sm"
          onClick={handleNext}
          disabled={!sectionAnswered || submitting}
        >
          {submitting ? (
            <>
              <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" style={{ fontSize: 12 }} />
              Submitting…
            </>
          ) : isLastSection ? (
            <>
              Submit
              <i className="fa-light fa-check ms-1" aria-hidden="true" style={{ fontSize: 12 }} />
            </>
          ) : (
            <>
              Next
              <i className="fa-light fa-arrow-right ms-1" aria-hidden="true" style={{ fontSize: 12 }} />
            </>
          )}
        </Button>
```

- [ ] **Step 6: Replace rating pill raw buttons**

The `RatingInput` component has two `<button>` patterns: mobile (vertical list) and desktop (horizontal pills). Replace both.

Find the mobile rating buttons (inside `sm:hidden` div, lines ~408–430):
```tsx
          <div className="flex flex-col gap-1.5 sm:hidden">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => onChange(n)}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors"
                style={{
                  borderColor: value === n ? 'var(--brand-color)' : 'var(--border)',
                  backgroundColor: value === n ? 'var(--brand-color-surface)' : 'var(--background)',
                  color: 'var(--foreground)',
                }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: value === n ? 'var(--brand-color)' : 'var(--muted)',
                    color: value === n ? 'white' : 'var(--muted-foreground)',
                  }}
                >
                  {n}
                </span>
                {RATING_LABELS[n]}
              </button>
            ))}
          </div>
```

Replace with:
```tsx
          <div className="flex flex-col gap-1.5 sm:hidden">
            {[1, 2, 3, 4, 5].map(n => (
              <Button
                key={n}
                variant="outline"
                onClick={() => onChange(n)}
                className="flex items-center gap-3 rounded-lg px-4 py-3 h-auto justify-start text-sm"
                style={{
                  borderColor: value === n ? 'var(--brand-color)' : 'var(--border)',
                  backgroundColor: value === n ? 'var(--brand-color-surface)' : 'var(--background)',
                  color: 'var(--foreground)',
                }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: value === n ? 'var(--brand-color)' : 'var(--muted)',
                    color: value === n ? 'white' : 'var(--muted-foreground)',
                  }}
                >
                  {n}
                </span>
                {RATING_LABELS[n]}
              </Button>
            ))}
          </div>
```

Find the desktop rating buttons (inside `hidden sm:flex flex-col gap-2` div):
```tsx
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 transition-all"
              style={{
                borderColor: value === n ? 'var(--brand-color)' : 'var(--border)',
                backgroundColor: value === n ? 'var(--brand-color-surface)' : 'var(--background)',
              }}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  backgroundColor: value === n ? 'var(--brand-color)' : 'var(--muted)',
                  color: value === n ? 'white' : 'var(--muted-foreground)',
                }}
              >
                {n}
              </span>
              <span className="text-xs text-center px-1 leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                {RATING_LABELS[n]}
              </span>
            </button>
          ))}
        </div>
```

Replace with:
```tsx
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <Button
              key={n}
              variant="outline"
              onClick={() => onChange(n)}
              className="flex flex-1 flex-col items-center gap-1.5 rounded-xl h-auto py-3"
              style={{
                borderColor: value === n ? 'var(--brand-color)' : 'var(--border)',
                backgroundColor: value === n ? 'var(--brand-color-surface)' : 'var(--background)',
              }}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  backgroundColor: value === n ? 'var(--brand-color)' : 'var(--muted)',
                  color: value === n ? 'white' : 'var(--muted-foreground)',
                }}
              >
                {n}
              </span>
              <span className="text-xs text-center px-1 leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                {RATING_LABELS[n]}
              </span>
            </Button>
          ))}
        </div>
```

- [ ] **Step 7: Add pip progress bar to SectionForm**

Find the `SectionForm` component (line ~308). It currently renders a `<div className="flex flex-col gap-8">` with a section header block and questions. Add the pip bar to the section header block.

Find:
```tsx
      {/* Section header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          {section.title}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {section.description}
        </p>
      </div>
```

Replace with:
```tsx
      {/* Section header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          {section.title}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {section.description}
        </p>
        {/* Pip progress bar — one dot per required question */}
        {(() => {
          const requiredQs = section.questions.filter(q => q.type === 'rating')
          if (requiredQs.length === 0) return null
          const answeredCount = requiredQs.filter(q => answers[q.id] !== undefined).length
          return (
            <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
              {requiredQs.map((q, i) => (
                <div
                  key={q.id}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: i < answeredCount ? 'var(--brand-color)' : 'var(--border)',
                    transition: 'background-color 0.15s ease',
                  }}
                />
              ))}
            </div>
          )
        })()}
      </div>
```

Note: `SectionForm` needs access to `answers`. The component currently receives `answers` as a prop (line ~309: `answers: Answers`). This is already available — no prop changes needed.

- [ ] **Step 8: Update section counter label in header**

Find in the header (line ~162):
```tsx
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {currentSection + 1} of {totalSections}
          </span>
```

Replace with:
```tsx
          <span className="text-sm font-medium" style={{ color: 'var(--brand-color)' }}>
            Section {currentSection + 1} of {totalSections}
          </span>
```

- [ ] **Step 9: Verify in student browser**

With student dev server running, open http://localhost:3006/surveys/ps1 (BIO 201, open). Verify:
- Section header says "About the Course" (first section)
- 5 gray dots appear below the description (5 required rating questions)
- Clicking a rating option fills one dot (turns brand-color purple)
- All 5 dots filled → Next button activates
- Breadcrumb items render without visual regression
- Previous/Next/Submit use DS Button styling
- Rating pills (desktop) render correctly with brand-color border/bg when selected
- Header shows "Section 1 of 3" in brand color

Navigate to http://localhost:3006/surveys/ps3 (MED 410, submitted). Verify:
- Survey opens (no longer shows "locked" state)
- Amber "You're editing your previous submission" banner appears below header
- Survey is pre-fillable (progress may be empty since ps3 was never interacted with in this session)

- [ ] **Step 10: Commit**

```bash
git add apps/pce/student/app/surveys/\[id\]/page.tsx
git commit -m "feat(pce/student): gate fix for re-edit, editing banner, pip bar, DS Button replacements"
```

---

## Task 8: Student submitted page — re-edit CTA

**Files:**
- Modify: `apps/pce/student/app/surveys/[id]/submitted/page.tsx`

Context: Add two elements below the "Back to Surveys" CTA: an amber info banner explaining the deadline, and an "Edit my responses" link styled as an outline button. Both only render when `survey.status === 'submitted'` (not when `'closed'`).

- [ ] **Step 1: Add re-edit banner and CTA**

In `apps/pce/student/app/surveys/[id]/submitted/page.tsx`, find the CTA block (lines ~118–129):

```tsx
          {/* CTA */}
          <Link
            href="/surveys"
            className={buttonVariants({ variant: 'default', size: 'default' })}
            style={{ width: '100%' }}
          >
            Back to Surveys
            <i className="fa-light fa-arrow-right ms-1.5" aria-hidden="true" style={{ fontSize: 12 }} />
          </Link>

          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Questions? Contact your program coordinator.
          </p>
```

Replace with:
```tsx
          {/* CTA */}
          <Link
            href="/surveys"
            className={buttonVariants({ variant: 'default', size: 'default' })}
            style={{ width: '100%' }}
          >
            Back to Surveys
            <i className="fa-light fa-arrow-right ms-1.5" aria-hidden="true" style={{ fontSize: 12 }} />
          </Link>

          {/* Re-edit path — only while survey is still editable */}
          {survey?.status === 'submitted' && (
            <>
              <div
                className="w-full rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm"
                style={{
                  backgroundColor: 'var(--insight-severity-warning-bg)',
                  color: 'var(--insight-severity-warning-fg)',
                }}
              >
                <i className="fa-light fa-pen-to-square shrink-0 mt-0.5" aria-hidden="true" style={{ fontSize: 13 }} />
                <span>
                  Changed your mind? You can edit your responses until this survey closes
                  {survey.deadline ? ` on ${survey.deadline}` : ''}.
                </span>
              </div>
              <Link
                href={`/surveys/${id}`}
                className={buttonVariants({ variant: 'outline', size: 'default' })}
                style={{ width: '100%' }}
              >
                <i className="fa-light fa-pen me-1.5" aria-hidden="true" style={{ fontSize: 12 }} />
                Edit my responses
              </Link>
            </>
          )}

          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Questions? Contact your program coordinator.
          </p>
```

- [ ] **Step 2: Verify re-edit flow end-to-end**

With student dev server running:

1. Navigate to http://localhost:3006/surveys/ps1 (BIO 201, open). Answer all questions in section 1. Click Next. Answer section 2 questions. Continue to Submit.
2. After submitting, you land on `/surveys/ps1/submitted`. Verify amber banner and "Edit my responses" button appear.
3. Click "Edit my responses". Verify you land on `/surveys/ps1` with the amber editing banner visible at top.
4. Verify progress is pre-filled from localStorage (answers from step 1 should still be there).
5. Change one answer. Click through to Submit again.
6. Verify redirect back to `/surveys/ps1/submitted`.

Navigate to http://localhost:3006/surveys/ps3/submitted (ps3 has `status: 'submitted'`). Verify amber banner and "Edit my responses" appear. Click "Edit my responses" — verify editing banner shows in the survey form.

Navigate to http://localhost:3006/surveys/ps4/submitted (ps4 has `status: 'closed'`). Verify NO amber banner and NO "Edit my responses" button appear.

- [ ] **Step 3: Commit**

```bash
git add apps/pce/student/app/surveys/\[id\]/submitted/page.tsx
git commit -m "feat(pce/student): re-edit CTA on submitted page with deadline banner"
```

---

## Final verification

- [ ] **Admin app full smoke test**

With admin dev server running at http://localhost:3005:

1. `/surveys` — status groups, collapse/expand, search, term filter
2. `/surveys/s1` — "Share with Faculty" buttons, destructive Close Survey, avatar lavender tint
3. `/surveys/s1` — click "Share with Faculty" sheet → title "Share with Faculty", footer "Share with Faculty"
4. `/surveys/s3/responses` — hidden count as DS Badge, comment hide/restore toggle
5. `/my-surveys/s3/results` (faculty role) — three groups, slate neutral, attribution footer, "Shared Apr 17" header badge
6. `/templates` — DS InputGroup search, "Used by" as Button link

- [ ] **Student app full smoke test**

With student dev server running at http://localhost:3006:

1. `/surveys/ps1` — natural section titles, "Section 1 of 3" brand-color label, pip bar, DS buttons throughout
2. `/surveys/ps1` — answer questions, watch pip bar fill
3. Full submit flow — amber info banner + edit CTA on submitted page
4. Re-edit flow — editing banner, pre-filled answers, re-submit works

- [ ] **Final commit**

```bash
git add -A
git status
# Confirm no unintended files staged
git commit -m "chore(pce): final smoke-test verified — all 5 UX fixes complete"
```
