'use client'

import { useState } from 'react'
import {
  Button, Badge, Checkbox, LocalBanner,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'

/* Reminder intervals available — days before term end date. */
const AVAILABLE_INTERVALS = [21, 14, 10, 7, 5, 3, 1]

const DEFAULT_ACTIVE = new Set([14, 7, 3])

function daysBefore(n: number) {
  return n === 1 ? '1 day before term ends' : `${n} days before term ends`
}

/* Inline term-end example preview. */
function exampleDate(daysBefore: number): string {
  /* Static example: "May 8" = Spring 2026 end, computed offset */
  const termEnd = new Date('2026-05-08T00:00:00')
  const d = new Date(termEnd.getTime() - daysBefore * 86400_000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ReminderSchedulePage() {
  const { setupDefaults, saveSetupDefaults } = usePce()

  const [activeIntervals, setActiveIntervals] = useState<Set<number>>(
    () => new Set(setupDefaults.activeReminderIntervals.length > 0
      ? setupDefaults.activeReminderIntervals
      : [...DEFAULT_ACTIVE]),
  )
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  function toggle(n: number) {
    setActiveIntervals(prev => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n); else next.add(n)
      return next
    })
    setDirty(true)
    setSaved(false)
  }

  function handleSave() {
    saveSetupDefaults({
      ...setupDefaults,
      activeReminderIntervals: [...activeIntervals],
    })
    setSaved(true)
    setDirty(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const sorted = [...activeIntervals].sort((a, b) => b - a)

  return (
    <>
      <SiteHeader title="Reminder Schedule" />

      <div className="flex-1 overflow-auto" style={{ padding: '28px' }}>
        <div className="max-w-lg flex flex-col gap-8">

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>
                Reminder Schedule
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choose which reminders fire automatically each cycle. All intervals are anchored to the
                term end date — not the survey close date. These become the default for every
                term activation.
              </p>
            </div>
            <Button variant="default" size="sm" onClick={handleSave} disabled={!dirty}>
              Save
            </Button>
          </div>

          {saved && (
            <LocalBanner variant="success" title="Schedule saved">
              This will pre-fill the next term activation wizard.
            </LocalBanner>
          )}

          {/* Interval toggles */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Reminder intervals
            </p>
            <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
              {AVAILABLE_INTERVALS.map(n => {
                const on = activeIntervals.has(n)
                return (
                  <label
                    key={n}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors text-left cursor-pointer"
                  >
                    <Checkbox
                      checked={on}
                      onCheckedChange={() => toggle(n)}
                      aria-label={daysBefore(n)}
                      className="shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{daysBefore(n)}</p>
                      <p className="text-xs text-muted-foreground">
                        e.g. {exampleDate(n)} for Spring 2026
                      </p>
                    </div>

                    {on && (
                      <Badge variant="secondary" className="text-xs font-normal shrink-0">
                        Active
                      </Badge>
                    )}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Active schedule preview */}
          {sorted.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Schedule preview — Spring 2026 (ends May 8)
              </p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 py-2 border-b border-dashed border-border">
                  <i className="fa-light fa-envelope text-muted-foreground text-xs w-3 shrink-0" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground w-20 shrink-0 tabular-nums">
                    Open date
                  </span>
                  <span className="text-sm">Initial invitation sent</span>
                </div>
                {sorted.map(n => (
                  <div key={n} className="flex items-center gap-3 py-2">
                    <i className="fa-light fa-bell text-xs shrink-0 w-3" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
                    <span className="text-xs text-muted-foreground w-20 shrink-0 tabular-nums">
                      {exampleDate(n)}
                    </span>
                    <span className="text-sm">Reminder — {n} day{n !== 1 ? 's' : ''} before term ends</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 py-2 border-t border-dashed border-border mt-1">
                  <i className="fa-light fa-flag text-xs text-muted-foreground shrink-0 w-3" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground w-20 shrink-0 tabular-nums">
                    May 8
                  </span>
                  <span className="text-sm text-muted-foreground">Term ends · survey closes</span>
                </div>
              </div>
            </div>
          )}

          {sorted.length === 0 && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-5 text-center">
              <p className="text-sm text-muted-foreground">
                No reminders selected. Students will only receive the initial invitation.
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
