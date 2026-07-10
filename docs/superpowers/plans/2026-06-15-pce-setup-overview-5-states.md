# PCE Setup Overview — 5-State Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the 1169-line `/apps/pce/admin/app/(app)/admin/setup/page.tsx` into 6 files — one orchestrator + five state-view components — each rendering a different story depending on which phase the selected term's evaluations are in.

**Architecture:** `page.tsx` keeps all hooks/useMemo/column-defs/Zone A stepper/Zone E directory and delegates the middle content (Zones B–D) to one of five view components selected by a `getOverviewState()` function driven by `MOCK_TODAY = new Date('2026-05-01')`. Each view receives a typed `OverviewViewProps` object so it owns only rendering logic with no duplicate state. Files live in the same directory: `app/(app)/admin/setup/`.

**Tech Stack:** Next.js 14 App Router, TypeScript, `@exxatdesignux/ui` (Button, Badge, Card, Avatar, KeyMetrics), `@/lib/pce-mock-data`, inline SVG for arcs + slope chart, inline CSS grid for heatmap, no raw `<button>`, no `toast()`, no hardcoded hex — `var(--token)` throughout.

---

## File map

| File | Status | Responsibility |
|---|---|---|
| `app/(app)/admin/setup/page.tsx` | **Modify** | Keep everything except current Zones B–D; add `MOCK_TODAY`, `OverviewState`, `getOverviewState()`, `OverviewViewProps`, state dispatch |
| `app/(app)/admin/setup/_view-setup.tsx` | **Create** | SetupView — readiness hero, config cards 2×2, offerings preview, analytics placeholder |
| `app/(app)/admin/setup/_view-collecting.tsx` | **Create** | CollectingView — faculty×course heatmap, nudge list, swim lane, KeyMetrics compact |
| `app/(app)/admin/setup/_view-countdown.tsx` | **Create** | CountdownView — countdown + arc hero, projected impact table, dot grid, mini Gantt |
| `app/(app)/admin/setup/_view-release-room.tsx` | **Create** | ReleaseRoomView — release readiness ring, decision table, low-n guidance, faculty note |
| `app/(app)/admin/setup/_view-retrospective.tsx` | **Create** | RetrospectiveView — term hero stats, faculty slope chart, carry-forward insights, next-term prompt |

---

## Task 1: Add state machine to page.tsx

**Files:**
- Modify: `app/(app)/admin/setup/page.tsx` lines 1–166 (before `SetupOverviewPage`)

- [ ] **Step 1: Add MOCK_TODAY and type/function after the existing color helpers (~line 122)**

```typescript
// Frozen reference date — aligns Spring 2026 mock data to "4 days before May 05 close"
const MOCK_TODAY = new Date('2026-05-01')

type OverviewState = 'setup' | 'collecting' | 'countdown' | 'release-room' | 'retrospective'

function getOverviewState(termSurveys: PceSurvey[]): OverviewState {
  const ce = termSurveys.filter(s => s.surveyType === 'course_evaluation')
  if (ce.length === 0) return 'setup'
  if (ce.every(s => s.status === 'released')) return 'retrospective'
  const collecting = ce.filter(s => s.status === 'collecting')
  if (collecting.length === 0 && ce.some(s => ['pending_review', 'closed'].includes(s.status))) return 'release-room'
  if (collecting.length > 0) {
    const deadlines = collecting.map(s => new Date(s.deadline ?? '2099-01-01'))
    const minDl = deadlines.reduce((a, b) => a < b ? a : b)
    const daysLeft = Math.ceil((minDl.getTime() - MOCK_TODAY.getTime()) / 86_400_000)
    return daysLeft <= 5 ? 'countdown' : 'collecting'
  }
  return 'setup'
}
```

- [ ] **Step 2: Add the shared prop type above the `SetupOverviewPage` function declaration**

```typescript
interface OverviewViewProps {
  selectedTermName: string
  termSurveys: PceSurvey[]
  termFacOffs: typeof MOCK_FACULTY_OFFERINGS
  priorFacOffs: typeof MOCK_FACULTY_OFFERINGS
  facultyForTerm: Array<{
    id: string; name: string; initials: string
    avgCompletion: number; delta: number | null; courses: string[]
    courseOffs: { code: string; rate: number; surveyId?: string }[]; needsAttention: boolean
  }>
  avgCompletion: number
  completionDelta: number | null
  priorTermName: string | null
  statusCounts: { collecting: number; scheduled: number; pending: number; released: number; closed: number }
  attentionCount: number
  isTermEnabled: boolean
  canActivate: boolean
  termsReady: boolean; templatesReady: boolean; emailReady: boolean; reminderReady: boolean
  enabledTerms: typeof MOCK_PROGRAM_TERMS
  activeTemplates: Array<{ name: string; status: string }>
  setupDefaults: { activeReminderIntervals: number[]; initialEmailBody: string }
  trendData: Array<{ term: string; rate: number; termFull: string }>
  onNudge: (target: { id: string; name: string; courses: string[] }) => void
  onOpenSurvey: (surveyId: string) => void
}
```

- [ ] **Step 3: Verify no TypeScript errors in the additions (no JSX yet)**

Run: `npx tsc --noEmit 2>&1 | grep "setup/page"` from `/Users/romitsoley/Work/apps/pce/admin`

Expected: no output (no errors)

- [ ] **Step 4: Commit**

```bash
git add apps/pce/admin/app/\(app\)/admin/setup/page.tsx
git commit -m "feat(pce): add state machine constants and OverviewViewProps to setup page"
```

---

## Task 2: Wire state dispatch into page.tsx render

**Files:**
- Modify: `app/(app)/admin/setup/page.tsx` — the render block (currently lines 536–1169)

- [ ] **Step 1: Add import stubs at top of file (placeholder — real imports added after view files exist)**

Add after the existing imports block:

```typescript
// State view components — created in subsequent tasks
// import { SetupView }        from './_view-setup'
// import { CollectingView }   from './_view-collecting'
// import { CountdownView }    from './_view-countdown'
// import { ReleaseRoomView }  from './_view-release-room'
// import { RetrospectiveView } from './_view-retrospective'
```

- [ ] **Step 2: Inside `SetupOverviewPage`, derive `state` from `termSurveys` using `getOverviewState`**

Add after the `attentionCount` line (~line 253):

```typescript
const state = useMemo(
  () => getOverviewState(termSurveys),
  [termSurveys],
)
```

- [ ] **Step 3: Build the `viewProps` object** — add after the `state` derivation:

```typescript
const viewProps: OverviewViewProps = {
  selectedTermName,
  termSurveys,
  termFacOffs,
  priorFacOffs,
  facultyForTerm,
  avgCompletion,
  completionDelta,
  priorTermName,
  statusCounts,
  attentionCount,
  isTermEnabled,
  canActivate,
  termsReady, templatesReady, emailReady, reminderReady,
  enabledTerms,
  activeTemplates,
  setupDefaults,
  trendData,
  onNudge: (target) => setNudgeTarget(target),
  onOpenSurvey: (surveyId) => setSelectedSurveyId(surveyId),
}
```

- [ ] **Step 4: Replace the `flex-1 overflow-auto` div's middle content (current Zones B–D, lines 671–999) with the state dispatch block**

Remove the existing Zone B (Program Pulse), Zone C (Current Term Snapshot), and Zone D (Setup Configuration Cards) JSX blocks and replace with:

```tsx
{/* ── State-driven middle content (Zones B–D) ── */}
{/* Uncomment imports above as each view file is created */}
{state === 'setup'          && <div className="px-4 lg:px-6 pt-5 pb-4 text-sm text-muted-foreground">Setup view (placeholder)</div>}
{state === 'collecting'     && <div className="px-4 lg:px-6 pt-5 pb-4 text-sm text-muted-foreground">Collecting view (placeholder)</div>}
{state === 'countdown'      && <div className="px-4 lg:px-6 pt-5 pb-4 text-sm text-muted-foreground">Countdown view (placeholder)</div>}
{state === 'release-room'   && <div className="px-4 lg:px-6 pt-5 pb-4 text-sm text-muted-foreground">Release Room view (placeholder)</div>}
{state === 'retrospective'  && <div className="px-4 lg:px-6 pt-5 pb-4 text-sm text-muted-foreground">Retrospective view (placeholder)</div>}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep "setup/"` from `/Users/romitsoley/Work/apps/pce/admin`

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add apps/pce/admin/app/\(app\)/admin/setup/page.tsx
git commit -m "feat(pce): wire state machine into setup page render — placeholder dispatch"
```

---

## Task 3: Create `_view-setup.tsx`

**Story:** "I haven't launched yet. What do I need to do, and what am I about to evaluate?"

**Files:**
- Create: `app/(app)/admin/setup/_view-setup.tsx`

- [ ] **Step 1: Write the file**

```tsx
'use client'

import Link from 'next/link'
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge,
} from '@exxatdesignux/ui'
import {
  MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_FACULTY, MOCK_PROGRAM_TERMS,
} from '@/lib/pce-mock-data'
import type { OverviewViewProps } from './page'

const _masterCourseById = new Map(MOCK_MASTER_COURSES.map(c => [c.id, c]))
const _facultyById      = new Map(MOCK_FACULTY.map(f => [f.id, f]))
const _termById         = new Map(MOCK_PROGRAM_TERMS.map(t => [t.id, t]))

export function SetupView({
  selectedTermName,
  canActivate,
  termsReady, templatesReady, emailReady, reminderReady,
  enabledTerms,
  activeTemplates,
  setupDefaults,
  termSurveys,
}: OverviewViewProps) {
  const allReady = termsReady && templatesReady && emailReady && reminderReady

  // Course offerings for the selected term — preview "what will be evaluated"
  const offeringsPreview = MOCK_COURSE_OFFERINGS.filter(o => {
    const t = _termById.get(o.termId)
    return t?.name === selectedTermName
  }).slice(0, 8)

  const configCards = [
    {
      key: 'terms', label: 'Terms', done: termsReady, href: '/admin/terms',
      value: enabledTerms.length > 0
        ? `${enabledTerms.length} enabled`
        : '0 enabled',
      sub: enabledTerms.length > 0
        ? enabledTerms.slice(0, 2).map(t => t.name).join(', ') + (enabledTerms.length > 2 ? ` +${enabledTerms.length - 2}` : '')
        : 'No terms enabled for eval',
      icon: 'fa-calendar',
    },
    {
      key: 'templates', label: 'Survey Templates', done: templatesReady, href: '/templates',
      value: activeTemplates.length > 0 ? `${activeTemplates.length} active` : 'None active',
      sub: activeTemplates.length > 0
        ? activeTemplates.slice(0, 2).map(t => t.name).join(', ') + (activeTemplates.length > 2 ? ` +${activeTemplates.length - 2}` : '')
        : 'Add a template to continue',
      icon: 'fa-file-lines',
    },
    {
      key: 'email', label: 'Email Templates', done: emailReady, href: '/admin/email-templates',
      value: emailReady ? 'Configured' : 'Incomplete',
      sub: emailReady ? 'Survey link included' : 'Missing {{survey_link}} in body',
      icon: 'fa-envelope',
    },
    {
      key: 'schedule', label: 'Reminder Schedule', done: reminderReady, href: '/admin/reminder-schedule',
      value: reminderReady ? `${setupDefaults.activeReminderIntervals.length} reminders set` : 'Not configured',
      sub: reminderReady
        ? `${setupDefaults.activeReminderIntervals.join(', ')} days before close`
        : 'No reminder intervals defined',
      icon: 'fa-clock',
    },
  ]

  return (
    <div className="px-4 lg:px-6 pt-5 pb-8 flex flex-col gap-6">

      {/* Readiness hero */}
      {canActivate ? (
        <div
          className="rounded-lg border flex items-center gap-4 px-5 py-4"
          style={{ borderColor: 'var(--chart-2)', backgroundColor: 'rgba(22,163,74,0.05)' }}
          role="status"
        >
          <i className="fa-light fa-circle-check text-xl" aria-hidden="true" style={{ color: 'var(--chart-2)' }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              You&apos;re ready to activate {selectedTermName} evaluations
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              All setup steps are complete. Activate to start collecting faculty evaluation responses.
            </p>
          </div>
          <Button variant="default" size="sm" className="shrink-0" asChild>
            <Link href="/surveys/activate">Activate {selectedTermName}</Link>
          </Button>
        </div>
      ) : (
        <div
          className="rounded-lg border flex items-start gap-4 px-5 py-4"
          style={{ borderColor: 'var(--chart-4)', backgroundColor: 'rgba(217,119,6,0.05)' }}
          role="status"
        >
          <i className="fa-light fa-circle-exclamation text-xl mt-0.5" aria-hidden="true" style={{ color: 'var(--chart-4)' }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Complete setup before activating {selectedTermName}
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {!termsReady    && <li className="text-xs" style={{ color: 'var(--chart-4)' }}>Enable at least one term for evaluation</li>}
              {!templatesReady && <li className="text-xs" style={{ color: 'var(--chart-4)' }}>Add an active survey template</li>}
              {!emailReady    && <li className="text-xs" style={{ color: 'var(--chart-4)' }}>Add &#123;&#123;survey_link&#125;&#125; to your email template</li>}
              {!reminderReady && <li className="text-xs" style={{ color: 'var(--chart-4)' }}>Configure at least one reminder interval</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Config cards 2×2 */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>Setup checklist</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {configCards.map(card => (
            <Card key={card.key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2">
                    <i
                      className={`fa-light ${card.done ? 'fa-circle-check' : 'fa-circle-exclamation'} text-xs`}
                      aria-hidden="true"
                      style={{ color: card.done ? 'var(--chart-2)' : 'var(--chart-4)' }}
                    />
                    {card.label}
                  </CardTitle>
                  <Link href={card.href} className="text-xs hover:underline" style={{ color: 'var(--brand-color)' }}>
                    Edit
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <p className="text-sm font-semibold tabular-nums">{card.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{card.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* What will be evaluated preview */}
      {offeringsPreview.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
            What {selectedTermName} includes
          </p>
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            {offeringsPreview.map((off, i) => {
              const course  = _masterCourseById.get(off.masterCourseId)
              const faculty = _facultyById.get(off.primaryFacultyId)
              return (
                <div
                  key={off.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
                >
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--muted-foreground)', width: 72 }}>
                    {course?.code ?? '—'}
                  </span>
                  <span className="text-sm flex-1 truncate">{course?.name ?? '—'}</span>
                  <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                    {faculty?.name ?? '—'}
                  </span>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {off.enrolledCount} students
                  </Badge>
                </div>
              )
            })}
          </div>
          {MOCK_COURSE_OFFERINGS.filter(o => _termById.get(o.termId)?.name === selectedTermName).length > 8 && (
            <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
              +{MOCK_COURSE_OFFERINGS.filter(o => _termById.get(o.termId)?.name === selectedTermName).length - 8} more offerings — see Directory below
            </p>
          )}
        </div>
      )}

      {/* Empty analytics placeholder */}
      <div
        className="rounded-lg border px-5 py-6 text-center"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}
        aria-label="Analytics not yet available"
      >
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Response rates will appear here once evaluations are active
        </p>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Export `OverviewViewProps` from page.tsx so the view can import it**

In `page.tsx`, add `export` keyword to the `OverviewViewProps` interface:

Change:
```typescript
interface OverviewViewProps {
```
To:
```typescript
export interface OverviewViewProps {
```

- [ ] **Step 3: Uncomment SetupView import in page.tsx and swap placeholder**

In `page.tsx`, replace:
```tsx
// import { SetupView }        from './_view-setup'
```
with:
```tsx
import { SetupView }        from './_view-setup'
```

And replace:
```tsx
{state === 'setup'          && <div className="px-4 lg:px-6 pt-5 pb-4 text-sm text-muted-foreground">Setup view (placeholder)</div>}
```
with:
```tsx
{state === 'setup'          && <SetupView {...viewProps} />}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep "setup/"` from `/Users/romitsoley/Work/apps/pce/admin`

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add apps/pce/admin/app/\(app\)/admin/setup/_view-setup.tsx apps/pce/admin/app/\(app\)/admin/setup/page.tsx
git commit -m "feat(pce): add SetupView — readiness hero, config cards, offerings preview"
```

---

## Task 4: Create `_view-collecting.tsx`

**Story:** "Evaluations are running. Where are we, and who needs a nudge?"

**Files:**
- Create: `app/(app)/admin/setup/_view-collecting.tsx`

- [ ] **Step 1: Write the file**

```tsx
'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, Button, KeyMetrics } from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import type { OverviewViewProps } from './page'

const THRESHOLD = 60

function rateColor(rate: number) {
  if (rate >= 80) return '#16a34a'
  if (rate >= 60) return '#d97706'
  return 'var(--brand-color)'
}
function rateBg(rate: number) {
  if (rate >= 80) return 'rgba(22,163,74,0.12)'
  if (rate >= 60) return 'rgba(217,119,6,0.10)'
  return 'rgba(198,42,91,0.10)'
}

export function CollectingView({
  facultyForTerm,
  termSurveys,
  avgCompletion,
  completionDelta,
  attentionCount,
  statusCounts,
  onNudge,
}: OverviewViewProps) {

  // Unique course codes across all faculty in this term
  const allCodes = Array.from(
    new Set(facultyForTerm.flatMap(f => f.courses))
  ).sort()

  const kpis: MetricItem[] = [
    {
      id: 'evaluations',
      label: 'Total evaluations',
      value: String(termSurveys.length),
      delta: statusCounts.collecting > 0 ? `${statusCounts.collecting} collecting` : '',
      trend: 'neutral' as const,
    },
    {
      id: 'completion',
      label: 'Avg completion',
      value: `${avgCompletion}%`,
      delta: completionDelta !== null
        ? `${completionDelta >= 0 ? '+' : ''}${completionDelta}% vs last term`
        : '',
      trend: completionDelta !== null ? (completionDelta >= 0 ? 'up' as const : 'down' as const) : 'neutral' as const,
    },
    {
      id: 'attention',
      label: 'Need nudging',
      value: String(attentionCount),
      delta: attentionCount > 0 ? `Below ${THRESHOLD}% threshold` : '',
      trend: attentionCount > 0 ? 'down' as const : 'up' as const,
    },
  ]

  const swimStages = [
    { label: 'Scheduled',      count: statusCounts.scheduled, color: 'var(--muted-foreground)' },
    { label: 'Collecting',     count: statusCounts.collecting, color: 'var(--brand-color)' },
    { label: 'Closed',         count: statusCounts.closed,    color: '#64748b' },
    { label: 'Pending review', count: statusCounts.pending,   color: 'var(--chart-4)' },
    { label: 'Released',       count: statusCounts.released,  color: 'var(--chart-2)' },
  ]

  return (
    <div className="px-4 lg:px-6 pt-5 pb-8 flex flex-col gap-6">

      {/* ── Heatmap ── */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Faculty × course completion
        </p>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${allCodes.length}, 56px)`, gap: 4, marginBottom: 4 }}>
          <div />
          {allCodes.map(code => (
            <div key={code} className="text-center" style={{ fontSize: 10, color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
              {code.replace('DPT-', '')}
            </div>
          ))}
        </div>

        {/* Faculty rows */}
        {facultyForTerm.slice(0, 6).map(f => {
          const rateMap = new Map(f.courseOffs.map(c => [c.code, c.rate]))
          return (
            <div
              key={f.id}
              style={{ display: 'grid', gridTemplateColumns: `200px repeat(${allCodes.length}, 56px)`, gap: 4, marginBottom: 4 }}
            >
              {/* Faculty label */}
              <div className="flex items-center gap-2 pr-2">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)', fontSize: 11 }}
                  >
                    {f.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{f.name}</p>
                  <p className="text-xs font-bold tabular-nums" style={{ color: rateColor(f.avgCompletion) }}>
                    {f.avgCompletion}%
                  </p>
                </div>
              </div>
              {/* Course cells */}
              {allCodes.map(code => {
                const rate = rateMap.get(code)
                if (rate === undefined) {
                  return (
                    <div
                      key={code}
                      style={{
                        width: 56, height: 36, borderRadius: 4,
                        backgroundColor: 'var(--muted)',
                        border: '1px dashed var(--border)',
                      }}
                    />
                  )
                }
                return (
                  <div
                    key={code}
                    style={{
                      width: 56, height: 36, borderRadius: 4,
                      backgroundColor: rateBg(rate),
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 1,
                    }}
                  >
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--muted-foreground)' }}>
                      {code.replace('DPT-', '')}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: rateColor(rate) }}>
                      {rate}%
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
          <span style={{ color: '#16a34a' }}>■ ≥80% on track</span>
          <span style={{ color: '#d97706' }}>■ 60–79% watch</span>
          <span style={{ color: 'var(--brand-color)' }}>■ &lt;60% nudge needed</span>
        </div>
      </div>

      {/* ── Who needs a nudge ── */}
      {attentionCount > 0 && (
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Who needs a nudge
          </p>
          <div className="flex flex-col gap-1">
            {facultyForTerm.filter(f => f.needsAttention).slice(0, 3).map((f, i) => (
              <div
                key={f.id}
                className="flex items-center gap-3 py-2 px-3 rounded"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
                  >
                    {f.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  {f.delta !== null && (
                    <p className="text-xs" style={{ color: f.delta < 0 ? 'var(--chart-4)' : 'var(--muted-foreground)' }}>
                      {f.delta > 0 ? '+' : ''}{f.delta}% vs last term
                    </p>
                  )}
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: '#d97706' }}>
                  {f.avgCompletion}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  aria-label={`Send reminder to ${f.name}`}
                  onClick={() => onNudge({ id: f.id, name: f.name, courses: f.courses })}
                >
                  Send reminder
                </Button>
              </div>
            ))}
          </div>
          {attentionCount > 3 && (
            <Link href="/analytics" className="text-xs mt-2 block hover:underline" style={{ color: 'var(--brand-color)' }}>
              View all in Analytics →
            </Link>
          )}
        </div>
      )}

      {/* ── Swim lane ── */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Evaluation lifecycle
        </p>
        <div className="flex items-center">
          {swimStages.map((stage, i) => (
            <div key={stage.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: stage.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11, fontWeight: 700,
                  }}
                  aria-label={`${stage.label}: ${stage.count}`}
                >
                  {stage.count}
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                  {stage.label}
                </span>
              </div>
              {i < swimStages.length - 1 && (
                <div
                  style={{ width: 28, height: 1, backgroundColor: 'var(--border)', margin: '0 4px', marginBottom: 18 }}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── KeyMetrics compact ── */}
      <KeyMetrics
        variant="compact"
        showHeader={false}
        metricsSingleRow
        metrics={kpis}
      />

    </div>
  )
}
```

- [ ] **Step 2: Uncomment CollectingView import and swap placeholder in page.tsx**

Replace:
```tsx
// import { CollectingView }   from './_view-collecting'
```
with:
```tsx
import { CollectingView }   from './_view-collecting'
```

Replace:
```tsx
{state === 'collecting'     && <div className="px-4 lg:px-6 pt-5 pb-4 text-sm text-muted-foreground">Collecting view (placeholder)</div>}
```
with:
```tsx
{state === 'collecting'     && <CollectingView {...viewProps} />}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep "setup/"` from `/Users/romitsoley/Work/apps/pce/admin`

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/pce/admin/app/\(app\)/admin/setup/_view-collecting.tsx apps/pce/admin/app/\(app\)/admin/setup/page.tsx
git commit -m "feat(pce): add CollectingView — heatmap, nudge list, swim lane, KeyMetrics"
```

---

## Task 5: Create `_view-countdown.tsx`

**Story:** "The window closes in N days. If I send reminders today, can we hit 70%?"

**Files:**
- Create: `app/(app)/admin/setup/_view-countdown.tsx`

- [ ] **Step 1: Write the file**

```tsx
'use client'

import { Button, Card, CardContent } from '@exxatdesignux/ui'
import type { OverviewViewProps } from './page'

// Frozen reference — same as page.tsx
const MOCK_TODAY = new Date('2026-05-01')
const NUDGE_LIFT = 9

export function CountdownView({
  termSurveys,
  facultyForTerm,
  avgCompletion,
  selectedTermName,
  onNudge,
}: OverviewViewProps) {
  const collectingSurveys = termSurveys.filter(
    s => s.status === 'collecting' && s.surveyType === 'course_evaluation'
  )

  const closestDeadline = collectingSurveys.reduce<Date | null>((min, s) => {
    if (!s.deadline) return min
    const d = new Date(s.deadline)
    return min === null || d < min ? d : min
  }, null)

  const daysLeft = closestDeadline
    ? Math.max(0, Math.ceil((closestDeadline.getTime() - MOCK_TODAY.getTime()) / 86_400_000))
    : 0

  const projectedWithNudge = Math.min(100, avgCompletion + NUDGE_LIFT)

  // SVG arc helpers
  const cx = 50, cy = 50, r = 34, rProjected = 40
  function arcPath(radius: number, progress: number) {
    const angle = (progress / 100) * 180 - 90
    const rad   = (angle * Math.PI) / 180
    const x     = cx + radius * Math.cos(rad)
    const y     = cy + radius * Math.sin(rad)
    const largeArc = progress > 50 ? 1 : 0
    return `M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}`
  }

  // Dot grid: total enrolled vs responded (approximate from avgCompletion)
  const totalEnrolled    = collectingSurveys.reduce((s, c) => s + (c.enrollmentCount ?? 0), 0)
  const totalResponded   = Math.round(totalEnrolled * avgCompletion / 100)
  const totalPending     = totalEnrolled - totalResponded
  const dotCount         = Math.min(totalEnrolled, 80)
  const respondedDots    = Math.round(dotCount * avgCompletion / 100)
  const showPlusMore     = totalEnrolled > 80

  // Mini Gantt: per collecting survey
  const ganttRows = collectingSurveys.map(s => {
    const d    = s.deadline ? new Date(s.deadline) : null
    const days = d ? Math.max(0, Math.ceil((d.getTime() - MOCK_TODAY.getTime()) / 86_400_000)) : 0
    const color = days <= 2 ? '#d97706' : days <= 4 ? 'var(--brand-color)' : 'var(--muted-foreground)'
    const barWidth = Math.min(100, days * 20)
    return { id: s.id, label: `${s.courseCode} — ${s.instructors?.[0]?.name ?? '—'}`, days, color, barWidth }
  })

  return (
    <div className="px-4 lg:px-6 pt-5 pb-8 flex flex-col gap-6">

      {/* ── Countdown + arc hero ── */}
      <Card style={{ borderLeft: '4px solid #d97706' }}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-6">
            {/* Left: text */}
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold tabular-nums" style={{ color: '#d97706' }}>
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--foreground)' }}>
                {selectedTermName} · Window closes {closestDeadline?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? '—'}
              </p>
              <p className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
                Historical nudge lift: +{NUDGE_LIFT} points avg
              </p>
            </div>

            {/* Right: twin SVG arcs */}
            <div className="shrink-0 flex flex-col items-center gap-1">
              <svg viewBox="0 0 100 60" width={160} height={96} aria-label={`${avgCompletion}% current completion, ${projectedWithNudge}% projected with nudge`}>
                {/* Base rail */}
                <path
                  d={`M ${cx - rProjected} ${cy} A ${rProjected} ${rProjected} 0 0 1 ${cx + rProjected} ${cy}`}
                  fill="none" stroke="var(--muted)" strokeWidth={6}
                />
                {/* Projected arc (outer, dashed green) */}
                <path
                  d={arcPath(rProjected, projectedWithNudge)}
                  fill="none" stroke="#16a34a" strokeWidth={4}
                  strokeDasharray="4 3" strokeLinecap="round"
                />
                {/* Current arc (inner, solid amber) */}
                <path
                  d={arcPath(r, avgCompletion)}
                  fill="none" stroke="#d97706" strokeWidth={8}
                  strokeLinecap="round"
                />
                {/* Center text */}
                <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: 'var(--foreground)' }}>
                  {avgCompletion}% now
                </text>
                <text x={cx} y={cy + 9} textAnchor="middle" style={{ fontSize: 10, fill: '#16a34a' }}>
                  {projectedWithNudge}% projected
                </text>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Projected impact table ── */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Projected impact per faculty
        </p>
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* Header */}
          <div
            className="grid px-4 py-2"
            style={{ gridTemplateColumns: '1fr 72px 24px 80px', gap: 8, borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Faculty</span>
            <span className="text-xs text-right" style={{ color: 'var(--muted-foreground)' }}>Without action</span>
            <span />
            <span className="text-xs text-right" style={{ color: '#16a34a' }}>After reminder</span>
          </div>
          {facultyForTerm.map((f, i) => {
            const projected = Math.min(100, f.avgCompletion + NUDGE_LIFT)
            return (
              <div
                key={f.id}
                className="grid items-center px-4 py-2.5"
                style={{ gridTemplateColumns: '1fr 72px 24px 80px', gap: 8, borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
              >
                <span className="text-sm truncate">{f.name}</span>
                <span className="text-sm text-right tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                  {f.avgCompletion}%
                </span>
                <span className="text-center" style={{ color: '#16a34a', fontSize: 12 }}>↑</span>
                <span className="text-sm text-right tabular-nums font-medium" style={{ color: '#16a34a' }}>
                  {projected}%
                </span>
              </div>
            )
          })}
          {/* Program average footer */}
          <div
            className="grid items-center px-4 py-2.5"
            style={{ gridTemplateColumns: '1fr 72px 24px 80px', gap: 8, borderTop: '2px solid var(--border)', backgroundColor: 'var(--muted)' }}
          >
            <span className="text-sm font-bold">Program average</span>
            <span className="text-sm text-right tabular-nums font-bold" style={{ color: 'var(--muted-foreground)' }}>
              {avgCompletion}%
            </span>
            <span className="text-center" style={{ color: '#16a34a', fontSize: 12 }}>↑</span>
            <span className="text-sm text-right tabular-nums font-bold" style={{ color: '#16a34a' }}>
              {projectedWithNudge}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Students not yet responded ── */}
      {totalEnrolled > 0 && (
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Students not yet responded
          </p>
          {/* Dot grid */}
          <div className="flex flex-wrap gap-1 mb-3" aria-label={`${totalResponded} responded, ${totalPending} pending`}>
            {Array.from({ length: dotCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  backgroundColor: i < respondedDots ? '#16a34a' : 'var(--muted)',
                  border: `1px solid ${i < respondedDots ? '#16a34a' : 'var(--border)'}`,
                }}
                aria-hidden="true"
              />
            ))}
            {showPlusMore && (
              <span className="text-xs" style={{ color: 'var(--muted-foreground)', lineHeight: '10px' }}>
                +{totalEnrolled - 80} more
              </span>
            )}
          </div>
          <p className="text-sm mb-3" style={{ color: 'var(--foreground)' }}>
            <span className="font-semibold">{totalPending}</span> students haven&apos;t responded yet
          </p>
          <Button
            variant="default"
            size="sm"
            aria-label="Send reminder to all non-responding students"
            onClick={() => {
              facultyForTerm.forEach(f =>
                f.needsAttention && onNudge({ id: f.id, name: f.name, courses: f.courses })
              )
            }}
          >
            Send to all
          </Button>
        </div>
      )}

      {/* ── What closes when (mini Gantt) ── */}
      {ganttRows.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
            What closes when
          </p>
          <div className="flex flex-col gap-2">
            {ganttRows.map(row => (
              <div key={row.id} className="flex items-center gap-3">
                <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)', width: 200, flexShrink: 0 }}>
                  {row.label}
                </span>
                <div
                  className="flex-1 rounded-full overflow-hidden"
                  style={{ height: 8, backgroundColor: 'var(--muted)' }}
                >
                  <div
                    style={{ height: '100%', width: `${row.barWidth}%`, backgroundColor: row.color, borderRadius: '9999px' }}
                  />
                </div>
                <span className="text-xs shrink-0 tabular-nums" style={{ color: row.color, width: 64, textAlign: 'right' }}>
                  {row.days} day{row.days !== 1 ? 's' : ''} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
```

- [ ] **Step 2: Uncomment CountdownView import and swap placeholder in page.tsx**

Replace:
```tsx
// import { CountdownView }    from './_view-countdown'
```
with:
```tsx
import { CountdownView }    from './_view-countdown'
```

Replace:
```tsx
{state === 'countdown'      && <div className="px-4 lg:px-6 pt-5 pb-4 text-sm text-muted-foreground">Countdown view (placeholder)</div>}
```
with:
```tsx
{state === 'countdown'      && <CountdownView {...viewProps} />}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep "setup/"` from `/Users/romitsoley/Work/apps/pce/admin`

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/pce/admin/app/\(app\)/admin/setup/_view-countdown.tsx apps/pce/admin/app/\(app\)/admin/setup/page.tsx
git commit -m "feat(pce): add CountdownView — arc hero, impact table, dot grid, mini Gantt"
```

---

## Task 6: Create `_view-release-room.tsx`

**Story:** "Collection closed. What's safe to release to faculty?"

**Files:**
- Create: `app/(app)/admin/setup/_view-release-room.tsx`

- [ ] **Step 1: Write the file**

```tsx
'use client'

import { Button, Badge, Card, CardContent } from '@exxatdesignux/ui'
import type { OverviewViewProps } from './page'

const LOW_N_THRESHOLD = 8

type ReleaseDecision = 'ready' | 'low-n' | 'pending'

interface SurveyDecisionRow {
  id: string
  label: string
  faculty: string
  rate: number
  responseCount: number
  decision: ReleaseDecision
}

export function ReleaseRoomView({
  termSurveys,
  onOpenSurvey,
}: OverviewViewProps) {
  const ceSurveys = termSurveys.filter(s => s.surveyType === 'course_evaluation')

  const rows: SurveyDecisionRow[] = ceSurveys.map(s => {
    let decision: ReleaseDecision = 'pending'
    if (s.status === 'pending_review' || s.status === 'closed') {
      decision = s.responseCount < LOW_N_THRESHOLD ? 'low-n' : 'ready'
    } else if (s.status === 'released') {
      decision = 'ready'
    }
    return {
      id: s.id,
      label: `${s.courseCode} — ${s.courseName}`,
      faculty: s.instructors?.[0]?.name ?? '—',
      rate: s.responseRate,
      responseCount: s.responseCount,
      decision,
    }
  })

  const readyCount   = rows.filter(r => r.decision === 'ready').length
  const lowNCount    = rows.filter(r => r.decision === 'low-n').length
  const pendingCount = rows.filter(r => r.decision === 'pending').length
  const total        = rows.length || 1

  // SVG ring: 12 segments proportional
  const SEGMENTS = 12
  const readySegs   = Math.round((readyCount / total) * SEGMENTS)
  const lowNSegs    = Math.round((lowNCount / total) * SEGMENTS)
  const pendingSegs = SEGMENTS - readySegs - lowNSegs
  const segColors = [
    ...Array(readySegs).fill('#16a34a'),
    ...Array(Math.max(0, lowNSegs)).fill('#d97706'),
    ...Array(Math.max(0, pendingSegs)).fill('var(--muted-foreground)'),
  ]

  function segmentPath(i: number, total: number, r: number, cx: number, cy: number) {
    const startAngle = ((i / total) * 2 * Math.PI) - Math.PI / 2
    const endAngle   = (((i + 0.85) / total) * 2 * Math.PI) - Math.PI / 2
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
  }

  function decisionBorderColor(d: ReleaseDecision) {
    return d === 'ready' ? '#16a34a' : d === 'low-n' ? '#d97706' : 'var(--muted-foreground)'
  }

  function decisionPill(d: ReleaseDecision) {
    if (d === 'ready') return <span style={{ fontSize: 11, color: '#16a34a', backgroundColor: 'rgba(22,163,74,0.1)', padding: '2px 8px', borderRadius: 999 }}>Ready to release</span>
    if (d === 'low-n') return <span style={{ fontSize: 11, color: '#d97706', backgroundColor: 'rgba(217,119,6,0.1)', padding: '2px 8px', borderRadius: 999 }}>Low n — hold?</span>
    return <span style={{ fontSize: 11, color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)', padding: '2px 8px', borderRadius: 999 }}>Pending review</span>
  }

  return (
    <div className="px-4 lg:px-6 pt-5 pb-8 flex flex-col gap-6">

      {/* ── Release readiness ring ── */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-6">
            {/* SVG ring */}
            <svg viewBox="0 0 100 100" width={100} height={100} aria-label={`${readyCount} of ${rows.length} ready to release`}>
              {segColors.map((color, i) => (
                <path
                  key={i}
                  d={segmentPath(i, SEGMENTS, 38, 50, 50)}
                  fill="none"
                  stroke={color}
                  strokeWidth={10}
                  strokeLinecap="round"
                />
              ))}
              <text x={50} y={46} textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: 'var(--foreground)' }}>
                {readyCount}/{rows.length}
              </text>
              <text x={50} y={60} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--muted-foreground)' }}>
                ready
              </text>
            </svg>

            {/* Stats */}
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: '#16a34a', border: 'none' }}>
                  {readyCount} ready to release
                </Badge>
              </div>
              {lowNCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge style={{ backgroundColor: 'rgba(217,119,6,0.1)', color: '#d97706', border: 'none' }}>
                    {lowNCount} low response count
                  </Badge>
                </div>
              )}
              {pendingCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', border: 'none' }}>
                    {pendingCount} pending review
                  </Badge>
                </div>
              )}
            </div>

            {readyCount > 0 && (
              <Button variant="default" size="sm" className="shrink-0" aria-label={`Release all ${readyCount} ready evaluations`}>
                Release all ready ({readyCount})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Decision table ── */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Release decisions
        </p>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {rows.map((row, i) => (
            <div
              key={row.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                borderLeft: `3px solid ${decisionBorderColor(row.decision)}`,
              }}
            >
              {/* Course + faculty */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{row.label}</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{row.faculty}</p>
              </div>

              {/* Rate bar */}
              <div className="shrink-0 flex flex-col items-center gap-1" style={{ width: 80 }}>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: 'var(--muted)' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${row.rate}%`,
                      backgroundColor: row.rate >= 80 ? '#16a34a' : row.rate >= 60 ? '#d97706' : 'var(--brand-color)',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
                <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{row.rate}%</span>
              </div>

              {/* Response count */}
              <div className="shrink-0 text-center" style={{ width: 56 }}>
                <p className="text-sm font-bold tabular-nums">{row.responseCount}</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>responses</p>
              </div>

              {/* Confidence */}
              <div className="shrink-0" style={{ width: 120 }}>
                {row.responseCount >= LOW_N_THRESHOLD
                  ? <span style={{ fontSize: 11, color: '#16a34a' }}>✓ Reliable (n={row.responseCount})</span>
                  : <span style={{ fontSize: 11, color: '#d97706' }}>⚠ Low n={row.responseCount}</span>
                }
              </div>

              {/* Status pill */}
              <div className="shrink-0">{decisionPill(row.decision)}</div>

              {/* Action */}
              <div className="shrink-0">
                {row.decision === 'ready' && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenSurvey(row.id)}>
                    Release
                  </Button>
                )}
                {row.decision === 'low-n' && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" style={{ color: '#d97706' }}>
                    Hold
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Low-n guidance ── */}
      {lowNCount > 0 && (
        <details className="rounded-lg border px-4 py-3" style={{ borderColor: '#d97706', backgroundColor: 'rgba(217,119,6,0.04)' }}>
          <summary className="text-sm font-medium cursor-pointer" style={{ color: '#d97706' }}>
            {lowNCount} evaluation{lowNCount > 1 ? 's have' : ' has'} fewer than {LOW_N_THRESHOLD} responses
          </summary>
          <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
            Releasing may not fairly represent the faculty member&apos;s performance. Options: wait for pending responses, or mark as insufficient data.
          </p>
        </details>
      )}

      {/* ── What faculty will see ── */}
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        When released, faculty receive an email with their results summary. Student responses remain anonymous.
      </p>

    </div>
  )
}
```

- [ ] **Step 2: Uncomment ReleaseRoomView import and swap placeholder in page.tsx**

Replace:
```tsx
// import { ReleaseRoomView }  from './_view-release-room'
```
with:
```tsx
import { ReleaseRoomView }  from './_view-release-room'
```

Replace:
```tsx
{state === 'release-room'   && <div className="px-4 lg:px-6 pt-5 pb-4 text-sm text-muted-foreground">Release Room view (placeholder)</div>}
```
with:
```tsx
{state === 'release-room'   && <ReleaseRoomView {...viewProps} />}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep "setup/"` from `/Users/romitsoley/Work/apps/pce/admin`

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/pce/admin/app/\(app\)/admin/setup/_view-release-room.tsx apps/pce/admin/app/\(app\)/admin/setup/page.tsx
git commit -m "feat(pce): add ReleaseRoomView — readiness ring, decision table, low-n guidance"
```

---

## Task 7: Create `_view-retrospective.tsx`

**Story:** "Term is done. How did we do, and what should we carry forward?"

**Files:**
- Create: `app/(app)/admin/setup/_view-retrospective.tsx`

- [ ] **Step 1: Write the file**

```tsx
'use client'

import Link from 'next/link'
import { Button } from '@exxatdesignux/ui'
import type { OverviewViewProps } from './page'

const SVG_W = 400, SVG_H = 200
const MARGIN = { left: 80, right: 100, top: 20, bottom: 20 }
const INNER_H = SVG_H - MARGIN.top - MARGIN.bottom
const X_LEFT  = MARGIN.left
const X_RIGHT = SVG_W - MARGIN.right

function rateY(rate: number): number {
  return MARGIN.top + ((100 - rate) / 100) * INNER_H
}

export function RetrospectiveView({
  avgCompletion,
  completionDelta,
  priorTermName,
  selectedTermName,
  facultyForTerm,
  statusCounts,
  attentionCount,
}: OverviewViewProps) {

  const deltaDisplay = completionDelta !== null
    ? `${completionDelta > 0 ? '+' : ''}${completionDelta}%`
    : '—'
  const deltaColor = completionDelta !== null
    ? completionDelta >= 0 ? '#16a34a' : '#d97706'
    : 'var(--muted-foreground)'

  // Slope chart: each faculty has a synthetic prior rate = avgCompletion - delta (or avg-5 if no delta)
  const slopeLines = facultyForTerm.map(f => {
    const priorRate  = f.delta !== null ? f.avgCompletion - f.delta : Math.max(0, f.avgCompletion - 5)
    const currentRate = f.avgCompletion
    const isAbove    = priorRate >= 60 && currentRate >= 60
    const color      = isAbove ? '#16a34a' : '#d97706'
    return { id: f.id, name: f.name, priorRate, currentRate, color }
  })

  // Carry-forward insights
  const topFaculty = facultyForTerm.reduce<typeof facultyForTerm[0] | null>(
    (best, f) => (!best || f.avgCompletion > best.avgCompletion) ? f : best, null
  )
  const insights = [
    topFaculty
      ? `${topFaculty.courses[0] ?? 'Top course'} achieved ${topFaculty.avgCompletion}% — highest this program. Consider as benchmark.`
      : null,
    attentionCount > 0
      ? `${attentionCount} faculty below 60% this term — prioritize early nudge next term.`
      : 'All faculty above 60% — strong completion across the board.',
    completionDelta !== null && completionDelta > 0
      ? `Response rate improved ${Math.abs(completionDelta)}% from ${priorTermName ?? 'last term'} — trend is positive.`
      : `Response rate ${completionDelta !== null && completionDelta < 0 ? `declined ${Math.abs(completionDelta)}%` : 'held steady'} vs ${priorTermName ?? 'last term'}.`,
  ].filter(Boolean) as string[]

  const insightColors = [
    '#16a34a',
    attentionCount > 0 ? '#d97706' : '#16a34a',
    completionDelta !== null && completionDelta >= 0 ? '#16a34a' : '#d97706',
  ]

  return (
    <div className="px-4 lg:px-6 pt-5 pb-8 flex flex-col gap-6">

      {/* ── Term summary hero ── */}
      <div className="flex items-stretch gap-0 rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {[
          {
            value: `${avgCompletion}%`,
            label: 'avg completion',
            size: 28,
            color: 'var(--foreground)',
          },
          {
            value: deltaDisplay,
            label: `vs ${priorTermName ?? 'last term'}`,
            size: 20,
            color: deltaColor,
          },
          {
            value: String(statusCounts.released),
            label: 'evaluations released',
            size: 28,
            color: 'var(--foreground)',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-center py-5"
            style={{ borderLeft: i > 0 ? '1px solid var(--border)' : undefined }}
          >
            <p style={{ fontSize: stat.size, fontWeight: 700, color: stat.color, lineHeight: 1.1 }} className="tabular-nums">
              {stat.value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Faculty slope chart ── */}
      {slopeLines.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Faculty response rate: {priorTermName ?? 'prior term'} → {selectedTermName}
          </p>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ maxWidth: SVG_W, display: 'block' }}
            aria-label="Faculty slope chart showing response rate change between terms"
          >
            {/* Threshold line at 60% */}
            <line
              x1={X_LEFT} y1={rateY(60)}
              x2={X_RIGHT} y2={rateY(60)}
              stroke="var(--border)" strokeWidth={1} strokeDasharray="4 3"
            />
            <text x={X_LEFT - 4} y={rateY(60) + 4} textAnchor="end" style={{ fontSize: 9, fill: 'var(--muted-foreground)' }}>60%</text>

            {/* Column labels */}
            <text x={X_LEFT} y={MARGIN.top - 6} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--muted-foreground)' }}>
              {priorTermName ?? 'Prior'}
            </text>
            <text x={X_RIGHT} y={MARGIN.top - 6} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--foreground)', fontWeight: 600 }}>
              {selectedTermName}
            </text>

            {/* Faculty lines */}
            {slopeLines.map(f => (
              <g key={f.id}>
                <line
                  x1={X_LEFT} y1={rateY(f.priorRate)}
                  x2={X_RIGHT} y2={rateY(f.currentRate)}
                  stroke={f.color} strokeWidth={1.5}
                />
                <circle cx={X_LEFT} cy={rateY(f.priorRate)} r={3} fill={f.color} />
                <circle cx={X_RIGHT} cy={rateY(f.currentRate)} r={4} fill={f.color} />
                <text
                  x={X_RIGHT + 6} y={rateY(f.currentRate) + 4}
                  style={{ fontSize: 10, fill: f.color }}
                >
                  {f.name.split(' ').pop()} {f.currentRate}%
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* ── What to carry forward ── */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
          What to carry forward
        </p>
        <div className="flex flex-col">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="py-2.5 px-3"
              style={{
                borderBottom: '1px solid var(--border)',
                borderLeft: `3px solid ${insightColors[i]}`,
                marginBottom: i < insights.length - 1 ? 0 : undefined,
              }}
            >
              <p className="text-sm">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Next term prompt ── */}
      <div
        className="flex items-center gap-4 rounded-lg border px-4 py-3"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}
      >
        <div className="flex-1">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Fall 2026 is next. Setup is ready — activate when your scheduling is confirmed.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link href="/admin/terms">Set up Fall 2026</Link>
        </Button>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Uncomment RetrospectiveView import and swap placeholder in page.tsx**

Replace:
```tsx
// import { RetrospectiveView } from './_view-retrospective'
```
with:
```tsx
import { RetrospectiveView } from './_view-retrospective'
```

Replace:
```tsx
{state === 'retrospective'  && <div className="px-4 lg:px-6 pt-5 pb-4 text-sm text-muted-foreground">Retrospective view (placeholder)</div>}
```
with:
```tsx
{state === 'retrospective'  && <RetrospectiveView {...viewProps} />}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep "setup/"` from `/Users/romitsoley/Work/apps/pce/admin`

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/pce/admin/app/\(app\)/admin/setup/_view-retrospective.tsx apps/pce/admin/app/\(app\)/admin/setup/page.tsx
git commit -m "feat(pce): add RetrospectiveView — term hero, slope chart, insights, next-term prompt"
```

---

## Task 8: Final type-check, state verification, and line count report

**Files:**
- Read: `app/(app)/admin/setup/page.tsx` (to confirm Zones B–D removed, imports wired)

- [ ] **Step 1: Full type-check across all setup/ files**

Run: `npx tsc --noEmit 2>&1 | grep "setup/"` from `/Users/romitsoley/Work/apps/pce/admin`

Expected: no output (zero errors). If errors appear, fix them before continuing.

- [ ] **Step 2: Verify Spring 2026 state resolution**

Spring 2026 CE surveys (from mock data): `s1` (pending_review), `s2` (collecting, deadline May 05 2026), `s3` (released), `s5` (active).

With `MOCK_TODAY = 2026-05-01` and filtering `surveyType === 'course_evaluation'`:
- `ce` = [s1, s2, s3, s5] (4 surveys)
- Not all released (s2 is collecting) → not retrospective
- `collecting` = [s2]
- s2 deadline = 'May 05, 2026' → `new Date('May 05, 2026')` = May 5
- `daysLeft` = ceil((May5 - May1) / 86400000) = 4
- 4 ≤ 5 → **state = 'countdown'**

Expected output of `getOverviewState(termSurveys)` for Spring 2026: `'countdown'`

- [ ] **Step 3: Count lines per file**

Run:
```bash
wc -l \
  /Users/romitsoley/Work/apps/pce/admin/app/\(app\)/admin/setup/page.tsx \
  /Users/romitsoley/Work/apps/pce/admin/app/\(app\)/admin/setup/_view-setup.tsx \
  /Users/romitsoley/Work/apps/pce/admin/app/\(app\)/admin/setup/_view-collecting.tsx \
  /Users/romitsoley/Work/apps/pce/admin/app/\(app\)/admin/setup/_view-countdown.tsx \
  /Users/romitsoley/Work/apps/pce/admin/app/\(app\)/admin/setup/_view-release-room.tsx \
  /Users/romitsoley/Work/apps/pce/admin/app/\(app\)/admin/setup/_view-retrospective.tsx
```

- [ ] **Step 4: Final commit if any post-fix changes**

```bash
git add apps/pce/admin/app/\(app\)/admin/setup/
git commit -m "feat(pce): finalize setup overview 5-state restructure — all views wired, tsc clean"
```

---

## Self-review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| `MOCK_TODAY` constant | Task 1 |
| `getOverviewState()` function | Task 1 |
| `OverviewViewProps` shared type | Task 1 |
| `state` derived in component via `useMemo` | Task 2 |
| `viewProps` object built in component | Task 2 |
| State dispatch block replacing Zones B–D | Task 2 |
| `_view-setup.tsx` — readiness hero, config cards, offerings preview, analytics placeholder | Task 3 |
| `_view-collecting.tsx` — heatmap (grid), nudge list, swim lane, KeyMetrics compact | Task 4 |
| `_view-countdown.tsx` — arc hero, impact table, dot grid, mini Gantt | Task 5 |
| `_view-release-room.tsx` — ring, decision table, low-n guidance, faculty note | Task 6 |
| `_view-retrospective.tsx` — hero stats, slope chart, insights, next-term prompt | Task 7 |
| `OverviewViewProps` exported from `page.tsx` | Task 3, step 2 |
| Zone A stepper kept in page.tsx | Verified (not modified) |
| Zone E directory kept in page.tsx | Verified (not modified) |
| tsc clean | Task 8 |
| State resolution report | Task 8 |
| Line count report | Task 8 |

**Placeholder scan:** No TBD, TODO, or "similar to Task N" references. All code blocks are complete.

**Type consistency:** `OverviewViewProps` defined once in `page.tsx` (exported), imported identically in all 5 view files. `courseOffs` field includes optional `surveyId?: string` matching the facultyForTerm derivation in `page.tsx`.

**Note on mock deadline parsing:** `new Date('May 05, 2026')` parses correctly in V8. `new Date(s.deadline ?? '2099-01-01')` in `getOverviewState` will produce a valid date for all Spring 2026 surveys that have string deadlines in this format. The deadline field is typed as `string` in `PceSurvey` — no change needed to mock data.
