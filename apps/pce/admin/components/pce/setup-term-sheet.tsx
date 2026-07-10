'use client'

// ============================================================================
// Setup Term + data-readiness audit — spec ① (priority-1 capability)
// Source: Granola "Course Eval sync up" Jun 25 2026
//   → docs/specs/2026-06-28-course-eval-design-updates-spec.md §2①
//   → Design Contract (in-session) — Apollo Data Health Center analogy
//
// Two phases inside one right Sheet:
//   1. config     — name + academic year + start/end (end-after-start)
//   2. readiness  — discovered offerings audited for evaluated roles; each gap
//                   routes to "Add data"; push gate with soft-warning override.
//                   Evaluation window is DERIVED (term-end ±7d), not asked here.
//
// V0 data: the audited term is seeded from the next configurable term Prism
// already has offerings for (SEED_TERM), so the term label always matches the
// audited offerings. When wired to Prism, runAudit() calls the real discovery
// endpoint for the term the admin creates/selects, and the loading/error states
// below become live.
// ============================================================================

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  Input,
  Badge,
  Calendar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  LocalBanner,
  Separator,
  Skeleton,
  Field,
  FieldLabel,
  FieldError,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  localDateToYmd,
  ymdToLocalDate,
  formatYmdForDisplay,
} from '@exxatdesignux/ui'
import { MOCK_PROGRAM_TERMS } from '@/lib/pce-mock-data'
import {
  auditTerm,
  type OfferingReadiness,
  type TermReadiness,
} from '@/lib/pce-term-readiness'

type Phase = 'config' | 'readiness'
type AuditStatus = 'loading' | 'ready' | 'error'

// Evaluation window opens 7d before term end, closes 7d after (REQ-07).
const EVAL_WINDOW_OFFSET_DAYS = 7

// The upcoming term Prism already has offerings for. Pre-filled so the term the
// admin configures matches the offerings we audit (one — Pediatric PT — has no
// coordinator, surfacing the "needs data" path).
const SEED_TERM = MOCK_PROGRAM_TERMS.find((t) => t.id === 'pt5')!

function addDays(ymd: string, days: number): string {
  const d = ymdToLocalDate(ymd)
  if (!d) return ymd
  d.setDate(d.getDate() + days)
  return localDateToYmd(d)
}

const formatYmd = (ymd: string): string => formatYmdForDisplay(ymd)

export function SetupTermSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('config')

  // Phase 1 — term config (seeded from the discovered upcoming term)
  const [name, setName] = useState(SEED_TERM.name)
  const [academicYear, setAcademicYear] = useState(SEED_TERM.academicYear)
  const [startYmd, setStartYmd] = useState<string | undefined>(SEED_TERM.startDate)
  const [endYmd, setEndYmd] = useState<string | undefined>(SEED_TERM.endDate)
  const [nameTouched, setNameTouched] = useState(false)

  // Phase 2 — readiness audit + push gate
  const [auditStatus, setAuditStatus] = useState<AuditStatus>('ready')
  const [overrideOpen, setOverrideOpen] = useState(false)

  const endsAfterStart = !!startYmd && !!endYmd && endYmd > startYmd
  const dateError = !!startYmd && !!endYmd && !endsAfterStart
  const nameError = nameTouched && name.trim().length === 0
  const configValid = name.trim().length > 0 && !!startYmd && endsAfterStart

  const readiness: TermReadiness = useMemo(() => auditTerm(SEED_TERM.id), [])
  const needsData = readiness.offerings.filter((o) => o.gaps.length > 0)
  const allReady = readiness.needsData === 0

  const evalWindow =
    endYmd != null
      ? {
          open: addDays(endYmd, -EVAL_WINDOW_OFFSET_DAYS),
          close: addDays(endYmd, EVAL_WINDOW_OFFSET_DAYS),
        }
      : null

  function reset() {
    setPhase('config')
    setName(SEED_TERM.name)
    setAcademicYear(SEED_TERM.academicYear)
    setStartYmd(SEED_TERM.startDate)
    setEndYmd(SEED_TERM.endDate)
    setNameTouched(false)
    setAuditStatus('ready')
    setOverrideOpen(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  // Discover + audit the term's offerings. V0 resolves from mock after a short
  // delay; swap the timeout for the Prism fetch (with a catch → 'error').
  function runAudit() {
    setAuditStatus('loading')
    window.setTimeout(() => setAuditStatus('ready'), 550)
  }

  function goToReadiness() {
    setPhase('readiness')
    runAudit()
  }

  function goToPush() {
    handleOpenChange(false)
    router.push('/surveys/push')
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showOverlay={false}
        showCloseButton={false}
        className="flex flex-col gap-0 p-0"
        style={{ width: 600, maxWidth: '100vw' }}
      >
        <SheetHeader className="px-7 pt-6 pb-4 gap-1">
          <SheetTitle>
            {phase === 'config' ? 'Set up term' : 'Term readiness'}
          </SheetTitle>
          <SheetDescription>
            {phase === 'config'
              ? 'Name the term and set its dates. The evaluation window is derived from the term end date.'
              : 'We checked each course offering for the faculty roles your program evaluates. Add any missing data, then push the survey.'}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-auto px-7 py-6">
          {phase === 'config' ? (
            <div className="flex flex-col gap-5">
              <div
                className="flex items-start gap-2 text-xs text-muted-foreground"
                role="note"
              >
                <i
                  className="fa-light fa-wand-magic-sparkles mt-0.5 shrink-0 text-foreground"
                  aria-hidden="true"
                />
                <span>
                  Detected from your academic calendar — review and confirm. Terms
                  roll forward each cycle, so the next one is pre-filled.
                </span>
              </div>

              <Field data-invalid={nameError || undefined}>
                <FieldLabel htmlFor="term-name">Term name</FieldLabel>
                <Input
                  id="term-name"
                  placeholder="e.g. Summer 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  aria-invalid={nameError || undefined}
                  autoFocus
                />
                {nameError && <FieldError>Term name is required.</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="term-year">Academic year</FieldLabel>
                <Input
                  id="term-year"
                  placeholder="e.g. 2025–2026"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <DateField label="Start date" valueYmd={startYmd} onChange={setStartYmd} />
                <DateField
                  label="End date"
                  valueYmd={endYmd}
                  onChange={setEndYmd}
                  errorMessage={dateError ? 'End date must be after the start date.' : undefined}
                />
              </div>

              {endsAfterStart && evalWindow && (
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium text-foreground">
                    Evaluation window (derived)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Opens {formatYmd(evalWindow.open)} · closes{' '}
                    {formatYmd(evalWindow.close)} — {EVAL_WINDOW_OFFSET_DAYS} days
                    around the term end. Change the rule in Settings.
                  </p>
                </div>
              )}
            </div>
          ) : auditStatus === 'loading' ? (
            <div
              aria-busy="true"
              aria-label="Checking term readiness"
              className="flex flex-col gap-5"
            >
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : auditStatus === 'error' ? (
            <div className="flex flex-col gap-3">
              <LocalBanner variant="error">
                Couldn&apos;t load this term&apos;s offerings from Prism. Try again.
              </LocalBanner>
              <div>
                <Button variant="outline" size="sm" onClick={runAudit}>
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="text-sm">
                <span className="font-medium text-foreground">{name || 'New term'}</span>
                {academicYear && (
                  <span className="text-muted-foreground"> · {academicYear}</span>
                )}
              </div>

              {allReady ? (
                <LocalBanner variant="success">
                  All {readiness.total} offerings have the data needed to push.
                </LocalBanner>
              ) : (
                <LocalBanner variant="warning">
                  {readiness.needsData} of {readiness.total} offerings are missing
                  data. Add it so students can evaluate every role — or push anyway
                  and those sections will be skipped.
                </LocalBanner>
              )}

              {!allReady && (
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-muted-foreground pb-2">
                    Needs data ({needsData.length})
                  </p>
                  <div className="rounded-lg border border-border overflow-hidden">
                    {needsData.map((o, i) => (
                      <NeedsDataRow
                        key={o.offeringId}
                        offering={o}
                        last={i === needsData.length - 1}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        <SheetFooter className="px-7 py-4 flex-row justify-end gap-2">
          {phase === 'config' ? (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={!configValid} onClick={goToReadiness}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setPhase('config')}>
                Back
              </Button>
              {/* Push stays enabled even with gaps — REQ-06 lets the admin push
                  with a soft-warning override; the AlertDialog carries the warning. */}
              <Button
                disabled={auditStatus !== 'ready'}
                onClick={allReady ? goToPush : () => setOverrideOpen(true)}
              >
                Push survey
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>

      {/* Soft-warning override — push despite missing data (REQ-06) */}
      <AlertDialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Push with missing data?</AlertDialogTitle>
            <AlertDialogDescription>
              {readiness.needsData} offering
              {readiness.needsData === 1 ? '' : 's'} are missing a coordinator,
              instructor, or roster. Students won&apos;t see the affected sections.
              You can add the data now and push a complete survey instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Add data first</AlertDialogCancel>
            <AlertDialogAction onClick={goToPush}>Push anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}

function DateField({
  label,
  valueYmd,
  onChange,
  errorMessage,
}: {
  label: string
  valueYmd: string | undefined
  onChange: (ymd: string | undefined) => void
  errorMessage?: string
}) {
  const [open, setOpen] = useState(false)
  const invalid = !!errorMessage
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            aria-label={valueYmd ? `${label}: ${formatYmd(valueYmd)}` : `${label}: choose a date`}
            aria-invalid={invalid || undefined}
            className="justify-start font-normal"
          >
            <i className="fa-light fa-calendar text-muted-foreground" aria-hidden="true" />
            <span className={valueYmd ? '' : 'text-muted-foreground'}>
              {valueYmd ? formatYmd(valueYmd) : 'Choose a date'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={valueYmd ? ymdToLocalDate(valueYmd) : undefined}
            onSelect={(d) => {
              onChange(d ? localDateToYmd(d) : undefined)
              setOpen(false)
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </Field>
  )
}

function NeedsDataRow({
  offering,
  last,
}: {
  offering: OfferingReadiness
  last: boolean
}) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 ${last ? '' : 'border-b border-border'}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          <span className="font-mono tabular-nums text-xs text-muted-foreground mr-2">
            {offering.courseCode}
          </span>
          {offering.courseName}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {offering.cohort} · {offering.enrolledCount} students
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {offering.gaps.map((g) => (
          <Badge
            key={g.type}
            variant="outline"
            className="border-transparent"
            style={{
              background: 'var(--insight-severity-warning-bg)',
              color: 'var(--insight-severity-warning-fg)',
            }}
          >
            No {g.label.toLowerCase()}
          </Badge>
        ))}
      </div>

      <Button asChild variant="outline" size="sm" className="shrink-0">
        <a
          href={`/admin/offerings?fix=${offering.offeringId}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Add data for ${offering.courseCode} ${offering.courseName} in Prism`}
        >
          Add data
        </a>
      </Button>
    </div>
  )
}
