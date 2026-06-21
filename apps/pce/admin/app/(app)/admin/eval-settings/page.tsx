'use client'

import { useState } from 'react'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
  Input, Textarea, ToggleSwitch, Button, LocalBanner,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'

/* Titled section + label/control rows — mirrors exam-management's settings layout. */
function SettingGroup({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border" style={{ background: 'var(--card)' }}>
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">{description}</p>}
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-3.5 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 max-w-md">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const DAYS = [0, 1, 2, 3, 5, 7, 10, 14]
function DayOffsetSelect({ value, onChange, ariaLabel }: { value: number; onChange: (n: number) => void; ariaLabel: string }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-28 h-8 text-sm" aria-label={ariaLabel}><SelectValue /></SelectTrigger>
      <SelectContent>
        {DAYS.map(d => <SelectItem key={d} value={String(d)}>{d} day{d !== 1 ? 's' : ''}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export default function EvalSettingsPage() {
  // Communication — eval window anchored to term start/end
  const [openBefore, setOpenBefore]   = useState(7)   // open N days before term end
  const [closeAfter, setCloseAfter]   = useState(14)  // close N days after term end
  const [releaseAfter, setReleaseAfter] = useState(1) // release N days after close
  const [emailSubject, setEmailSubject] = useState('Your {course} evaluation is open')
  const [emailBody, setEmailBody]       = useState('Hi {student}, your feedback on {course} is open until {close_date}. It takes ~5 minutes and is anonymous.')
  const [reminderBody, setReminderBody] = useState('Reminder: your {course} evaluation closes {close_date}. Please share your feedback.')
  const [cadence, setCadence]           = useState<number[]>([7, 3, 1])

  // Evaluation rules
  const [likertN, setLikertN]               = useState('5')
  const [commentModeration, setCommentMod]  = useState(true)
  const [releaseThreshold, setReleaseThreshold] = useState(60)

  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); window.setTimeout(() => setSaved(false), 3000) }

  const toggleCadence = (d: number) =>
    setCadence(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => b - a))

  return (
    <>
      <SiteHeader breadcrumbs={[{ label: 'Setup', href: '/admin' }]} title="Evaluation settings" />
      <PageHeader
        title="Evaluation settings"
        subtitle="Communication and rules applied to every course evaluation"
        actions={<Button size="lg" onClick={save}>Save changes</Button>}
      />

      <div className="flex-1 overflow-auto" style={{ padding: '8px 28px 28px' }}>
        <div className="max-w-3xl flex flex-col gap-4">
          {saved && (
            <LocalBanner variant="success" title="Settings saved" description="Your evaluation settings have been updated." />
          )}

          <Tabs defaultValue="communication" className="flex flex-col gap-4">
            <TabsList variant="line">
              <TabsTrigger value="communication">Communication</TabsTrigger>
              <TabsTrigger value="rules">Evaluation rules</TabsTrigger>
            </TabsList>

            {/* ── Communication ── */}
            <TabsContent value="communication" className="flex flex-col gap-4 m-0">
              <SettingGroup
                title="Evaluation window"
                description="Survey open, close, and release dates are derived automatically from each term's start and end date."
              >
                <SettingRow label="Open the survey before the term ends" hint="Anchored to the term end date.">
                  <DayOffsetSelect value={openBefore} onChange={setOpenBefore} ariaLabel="Open days before term end" />
                </SettingRow>
                <SettingRow label="Close the survey after the term ends" hint="Anchored to the term end date.">
                  <DayOffsetSelect value={closeAfter} onChange={setCloseAfter} ariaLabel="Close days after term end" />
                </SettingRow>
                <SettingRow label="Release results after close" hint="When moderation is complete, results auto-release after this delay.">
                  <DayOffsetSelect value={releaseAfter} onChange={setReleaseAfter} ariaLabel="Release days after close" />
                </SettingRow>
              </SettingGroup>

              <SettingGroup title="Email template" description="Invitation sent when a survey opens. Use {student}, {course}, {close_date} tokens.">
                <SettingRow label="Subject">
                  <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-80 h-8 text-sm" aria-label="Email subject" />
                </SettingRow>
                <div className="px-5 py-3.5 border-b border-border last:border-0">
                  <p className="text-sm font-medium mb-1.5">Body</p>
                  <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={3} className="text-sm" aria-label="Email body" />
                </div>
              </SettingGroup>

              <SettingGroup title="Reminder template" description="Sent on the cadence below to students who haven't responded.">
                <div className="px-5 py-3.5 border-b border-border">
                  <p className="text-sm font-medium mb-1.5">Reminder body</p>
                  <Textarea value={reminderBody} onChange={(e) => setReminderBody(e.target.value)} rows={2} className="text-sm" aria-label="Reminder body" />
                </div>
                <SettingRow label="Reminder cadence" hint="Days before close to send a reminder.">
                  <div className="flex items-center gap-1.5">
                    {[10, 7, 3, 1].map(d => (
                      <Button
                        key={d}
                        variant={cadence.includes(d) ? 'default' : 'outline'}
                        size="sm" className="h-8 w-12 px-0"
                        aria-pressed={cadence.includes(d)}
                        onClick={() => toggleCadence(d)}
                      >
                        {d}d
                      </Button>
                    ))}
                  </div>
                </SettingRow>
              </SettingGroup>
            </TabsContent>

            {/* ── Evaluation rules ── */}
            <TabsContent value="rules" className="flex flex-col gap-4 m-0">
              <SettingGroup title="Scale & moderation">
                <SettingRow label="Likert scale points" hint="Number of points on rating questions.">
                  <Select value={likertN} onValueChange={setLikertN}>
                    <SelectTrigger className="w-36 h-8 text-sm" aria-label="Likert scale points"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3-point</SelectItem>
                      <SelectItem value="5">5-point</SelectItem>
                      <SelectItem value="7">7-point</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow label="Comment moderation" hint="When on, free-text comments are held for admin review before release.">
                  <ToggleSwitch checked={commentModeration} onChange={setCommentMod} aria-label="Comment moderation" />
                </SettingRow>
              </SettingGroup>

              <SettingGroup title="Results release">
                <SettingRow label="Minimum response rate to release" hint="Results are withheld until this share of students has responded — protects anonymity for small classes.">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" min={0} max={100} value={releaseThreshold}
                      onChange={(e) => setReleaseThreshold(Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="w-20 h-8 text-sm tabular-nums text-right" aria-label="Minimum response rate to release results"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </SettingRow>
              </SettingGroup>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
