'use client'

import { Card, CardContent, Input, ToggleSwitch } from '@exxatdesignux/ui'
import type { AssessmentSettings } from '@/lib/qb-types'

interface Props {
  settings: AssessmentSettings
  onPatch: (patch: Partial<AssessmentSettings>) => void
}

function toLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const dateCls = 'h-9 w-full rounded-lg border border-border bg-muted px-2.5 text-[13px] text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

/**
 * Delivery & Security tab — availability window, exam passwords, pre-flight
 * cache, mirroring the Claude Design assessment-builder Delivery & Security tab.
 */
export function DeliverySecurityPanel({ settings, onPatch }: Props) {
  return (
    <div className="flex-1 overflow-auto px-6 py-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">

        {/* Availability window */}
        <Card size="sm">
          <CardContent className="p-5">
            <h3 className="mb-1 text-sm font-semibold text-foreground">Availability window</h3>
            <p className="mb-4 text-xs text-muted-foreground">When students can see and enter the exam.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Opens">
                <input type="datetime-local" aria-label="Opens" className={dateCls}
                  value={toLocal(settings.openDate)} onChange={e => onPatch({ openDate: e.target.value ? new Date(e.target.value).toISOString() : null })} />
              </Field>
              <Field label="Closes (hard cutoff)">
                <input type="datetime-local" aria-label="Closes" className={dateCls}
                  value={toLocal(settings.closeDate)} onChange={e => onPatch({ closeDate: e.target.value ? new Date(e.target.value).toISOString() : null })} />
              </Field>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Pre-flight cache window</p>
                <p className="text-xs text-muted-foreground">Hours before open that students can pre-download the exam.</p>
              </div>
              <Input type="number" min={0} aria-label="Pre-flight cache window (hours)" className="h-9 w-20 text-sm"
                value={settings.downloadWindowHours} onChange={e => onPatch({ downloadWindowHours: parseInt(e.target.value) || 0 })} />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card size="sm">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Security</h3>
            <Row label="Exam start password" desc="Students must enter a password to begin the exam.">
              <ToggleSwitch id="ds-pw" checked={settings.passwordRequired} onChange={v => onPatch({ passwordRequired: v })} />
            </Row>
            {settings.passwordRequired && (
              <div className="mt-3">
                <label htmlFor="ds-pw-val" className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
                <Input id="ds-pw-val" className="h-9 max-w-xs text-sm bg-muted" placeholder="e.g. CARDIO-2026"
                  value={settings.password} onChange={e => onPatch({ password: e.target.value })} />
              </div>
            )}
            <div className="mt-4 border-t border-border pt-4">
              <Row label="Forward-only section navigation" desc="Students can't return to a previous section once they advance.">
                <ToggleSwitch id="ds-fwd" checked={settings.forwardOnlySections} onChange={v => onPatch({ forwardOnlySections: v })} />
              </Row>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  )
}
