'use client'

/* Distribute tab — audience, availability window, security, tools, and publish.
   Consolidates the former Configure + Delivery inner tabs (now removed from the builder)
   into this single outer-tab screen. Placed at the outer lifecycle level so it is
   always accessible from Edit → Distribute without going through inner tabs. */

import { useState, type ReactNode } from 'react'
import { Card, CardContent, Button, Badge, Input, ToggleSwitch, Checkbox, LocalBanner } from '@exxatdesignux/ui'
import { Icon } from '../icons'
import { useApp } from '../primitives'
import { FACULTY, totalQuestions, type BuilderMeta, type Section } from '../data'

interface Props {
  meta: BuilderMeta
  setMeta: (fn: (m: BuilderMeta) => BuilderMeta) => void
  sections: Section[]
  persona: string
  onBack: () => void
  onList: () => void
}

// ── shared primitives ───────────────────────────────────────────────

function CfgCard({ icon, title, sub, badge, children }: { icon: string; title: string; sub?: string; badge?: string; children: ReactNode }) {
  return (
    <Card style={{ borderRadius: 16, marginBottom: 16 }}>
      <CardContent style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--muted)', display: 'grid', placeItems: 'center', color: 'var(--brand-color-dark)', flexShrink: 0 }}>
            <Icon name={icon} style={{ fontSize: 15 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
              {badge && <Badge variant="secondary">{badge}</Badge>}
            </div>
            {sub && <div className="hint" style={{ marginTop: 2 }}>{sub}</div>}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function Row({ label, hint, children, last }: { label: string; hint?: string; children: ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {hint && <div className="hint" style={{ marginTop: 2, maxWidth: 520 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function TogRow({ label, hint, on, onToggle, last }: { label: string; hint?: string; on: boolean; onToggle: () => void; last?: boolean }) {
  return (
    <Row label={label} hint={hint} last={last}>
      <ToggleSwitch checked={on} onChange={onToggle} />
    </Row>
  )
}

function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: ReactNode }[] }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, padding: 2, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)' }}>
      {options.map(o => (
        <Button key={String(o.v)} type="button" variant={value === o.v ? 'default' : 'ghost'} size="sm" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {o.label}
        </Button>
      ))}
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────

export function DistributeTab({ meta, setMeta, sections, persona, onBack, onList }: Props) {
  void persona
  const { notify } = useApp()
  const nQ = totalQuestions(sections)
  const nPts = sections.reduce((s, sec) => s + sec.questions.reduce((a, q) => a + (q.bonus ? 0 : q.points), 0), 0)
  const enrolledCount = 32 // mock — would come from course entity
  const isPublished = meta.state === 'ready' || meta.state === 'completed'

  // availability state
  const [avail, setAvail] = useState({
    visibleDate: '10/20/2026 08:00 AM EST',
    openableDate: '10/24/2026 08:00 AM EST',
    cutoffDate: '10/24/2026 11:00 AM EST',
    cacheWindow: 60,
  })

  // security state
  const [sec, setSec] = useState({
    secure: meta.security === 'Secure',
    startPw: true,
    resumePw: true,
  })

  // tools state
  const [tools, setTools] = useState({
    calc: 'scientific' as 'off' | 'basic' | 'scientific',
    highlight: true,
    notes: true,
    copyPaste: false,
    spellCheck: true,
    warnAlarm: true,
  })

  // nav/grading state
  const [nav, setNav] = useState({
    fwdOnly: true,
    reqAdvance: true,
    ordering: 'fixed' as 'fixed' | 'random',
    autoScore: true,
    blindScore: false,
    perfFlag: true,
    resultDisplay: 'delayed' as 'immediate' | 'delayed' | 'off',
    earlySubmit: false,
  })

  // review state
  const [showReviewDialog, setShowReviewDialog] = useState(false)

  function handlePublish() {
    if (nQ === 0) return
    setMeta(m => ({ ...m, state: 'ready' }))
    notify('Assessment published — students can now access it', 'success')
  }

  function handleUnpublish() {
    setMeta(m => ({ ...m, state: 'draft' }))
    notify('Assessment unpublished and returned to draft', 'warn')
  }

  return (
    <div className="content" style={{ maxWidth: 920, paddingBottom: 40 }}>
      <h2 className="sr-only">Distribute</h2>

      {nQ === 0 && (
        <LocalBanner variant="warning" className="mb-5">
          <strong>No questions yet.</strong> Add at least one question before publishing.
          <Button type="button" variant="ghost" size="sm" className="ml-2" onClick={onBack}>Go to Edit</Button>
        </LocalBanner>
      )}

      {isPublished && (
        <LocalBanner variant="info" className="mb-5">
          <strong>Published.</strong> Students can access this assessment now. Changes to scheduling or security still apply without unpublishing.
        </LocalBanner>
      )}

      {/* Audience */}
      <CfgCard icon="users" title="Audience" sub="Who will receive this assessment">
        <Row label="Course" hint={meta.course}>
          <Badge variant="outline">{meta.course}</Badge>
        </Row>
        <Row label="Enrolled students">
          <span style={{ fontSize: 13, fontWeight: 600 }}>{enrolledCount}</span>
        </Row>
        <Row label="Assessment" hint={`${nQ} questions · ${nPts} pts`}>
          <div style={{ display: 'flex', gap: 6 }}>
            {meta.graded && <Badge variant="secondary"><Icon name="star" />Graded</Badge>}
            {sections.some(s => s.questions.some(q => q.type === 'mcq' || q.type === 'msq' || q.type === 'tf' || q.type === 'fitb')) && (
              <Badge variant="secondary"><Icon name="clock" />Auto-scored</Badge>
            )}
          </div>
        </Row>
        <Row label="Team" last>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[meta.owner, ...meta.collaborators].map(id => (
              <Badge key={id} variant="outline">{FACULTY[id]?.name ?? id}</Badge>
            ))}
          </div>
        </Row>
      </CfgCard>

      {/* Availability window */}
      <CfgCard icon="calendar-days" title="Availability window" sub="Three-stage delivery timeline" badge="On par">
        <Row label="Visible date" hint="Card appears on the student dashboard; pre-reads viewable but cannot launch.">
          <Input value={avail.visibleDate} onChange={e => setAvail(a => ({ ...a, visibleDate: e.target.value }))} style={{ width: 240 }} aria-label="Visible date" />
        </Row>
        <Row label="Openable date (pre-flight)" hint="Students can launch and cache the exam before starting the timer.">
          <Input value={avail.openableDate} onChange={e => setAvail(a => ({ ...a, openableDate: e.target.value }))} style={{ width: 240 }} aria-label="Openable date" />
        </Row>
        <Row label="Cutoff date (available until)" hint="Final submission deadline.">
          <Input value={avail.cutoffDate} onChange={e => setAvail(a => ({ ...a, cutoffDate: e.target.value }))} style={{ width: 240 }} aria-label="Cutoff date" />
        </Row>
        <Row label="Pre-flight cache window" hint="How early students can enter so the exam fully downloads ahead of start." last>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Input type="number" value={avail.cacheWindow} onChange={e => setAvail(a => ({ ...a, cacheWindow: +e.target.value }))} style={{ width: 80 }} aria-label="Cache window minutes" />
            <span className="hint">min before start</span>
          </div>
        </Row>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 12, background: 'oklch(from var(--chart-1) l c h / 0.08)', border: '1px solid oklch(from var(--chart-1) l c h / 0.28)', fontSize: 13, lineHeight: 1.4 }}>
          <Icon name="circle-info" style={{ marginTop: 1, flexShrink: 0 }} />
          <div>Internet required only for <strong>login</strong> and <strong>submission</strong>. Once cached, the exam runs offline — no data loss on reboot.</div>
        </div>
      </CfgCard>

      {/* Security */}
      <CfgCard icon="shield-halved" title="Security environment" sub="Integrity model for this assessment" badge="On par">
        <Row label="Testing mode" hint={sec.secure ? 'Secure: Respondus lockdown blocks other apps, VMs, and screen capture.' : 'Standard browser — no lockdown.'}>
          <Seg
            value={sec.secure ? 'secure' : 'standard'}
            onChange={v => setSec(s => ({ ...s, secure: v === 'secure' }))}
            options={[
              { v: 'secure', label: <><Icon name="lock" />Secure</> },
              { v: 'standard', label: <><Icon name="lock-open" />Standard</> },
            ]}
          />
        </Row>
        <TogRow label="Exam start password" hint="Cryptographic key that decrypts the locally cached exam." on={sec.startPw} onToggle={() => setSec(s => ({ ...s, startPw: !s.startPw }))} />
        <TogRow label="Resume password" hint="Required to unlock after an authorized break." on={sec.resumePw} onToggle={() => setSec(s => ({ ...s, resumePw: !s.resumePw }))} last />
      </CfgCard>

      {/* Digital tools */}
      <CfgCard icon="calculator" title="Digital tools" sub="Cascading override: Assessment → Question → Student/Accessibility" badge="On par">
        <Row label="Calculator">
          <Seg value={tools.calc} onChange={v => setTools(t => ({ ...t, calc: v }))} options={[{ v: 'off', label: 'Off' }, { v: 'basic', label: 'Basic' }, { v: 'scientific', label: 'Scientific' }]} />
        </Row>
        <TogRow label="Text highlighter" on={tools.highlight} onToggle={() => setTools(t => ({ ...t, highlight: !t.highlight }))} />
        <TogRow label="Notes / scratchpad" on={tools.notes} onToggle={() => setTools(t => ({ ...t, notes: !t.notes }))} />
        <TogRow label="Allow copy / paste" on={tools.copyPaste} onToggle={() => setTools(t => ({ ...t, copyPaste: !t.copyPaste }))} />
        <TogRow label="Spell check (essay)" on={tools.spellCheck} onToggle={() => setTools(t => ({ ...t, spellCheck: !t.spellCheck }))} />
        <TogRow label="Warning alarms" hint="Visual warning before timer expires (defaults to 5-minute warning)." on={tools.warnAlarm} onToggle={() => setTools(t => ({ ...t, warnAlarm: !t.warnAlarm }))} last />
      </CfgCard>

      {/* Navigation & grading */}
      <CfgCard icon="diagram-project" title="Navigation & grading">
        <Row label="Forward-only section navigation" hint="Students cannot return to a previous section.">
          <ToggleSwitch checked={nav.fwdOnly} onChange={() => setNav(n => ({ ...n, fwdOnly: !n.fwdOnly }))} />
        </Row>
        <Row label="Require answer to advance" hint="All questions must be answered before the next section.">
          <ToggleSwitch checked={nav.reqAdvance} onChange={() => setNav(n => ({ ...n, reqAdvance: !n.reqAdvance }))} />
        </Row>
        <Row label="Question order">
          <Seg value={nav.ordering} onChange={v => setNav(n => ({ ...n, ordering: v }))} options={[{ v: 'fixed', label: 'Fixed' }, { v: 'random', label: 'Random (within section)' }]} />
        </Row>
        <Row label="Auto-scoring" hint="Scores objective items immediately on submission.">
          <ToggleSwitch checked={nav.autoScore} onChange={() => setNav(n => ({ ...n, autoScore: !n.autoScore }))} />
        </Row>
        <Row label="Blind scoring" hint="Hides student names during manual scoring.">
          <ToggleSwitch checked={nav.blindScore} onChange={() => setNav(n => ({ ...n, blindScore: !n.blindScore }))} />
        </Row>
        <Row label="Display results to students">
          <Seg value={nav.resultDisplay} onChange={v => setNav(n => ({ ...n, resultDisplay: v }))} options={[{ v: 'immediate', label: 'Immediate' }, { v: 'delayed', label: 'Delayed' }, { v: 'off', label: 'Hidden' }]} />
        </Row>
        <Row label="Allow early submission" last>
          <ToggleSwitch checked={nav.earlySubmit} onChange={() => setNav(n => ({ ...n, earlySubmit: !n.earlySubmit }))} />
        </Row>
      </CfgCard>

      {/* Publish action */}
      <Card style={{ borderRadius: 16 }}>
        <CardContent style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {isPublished ? 'Assessment is published' : 'Ready to publish?'}
              </div>
              <div className="hint">
                {isPublished
                  ? `Students can access this assessment. ${enrolledCount} students enrolled.`
                  : `Publishes to ${enrolledCount} enrolled students. You can still edit configuration after publishing.`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {isPublished ? (
                <Button type="button" variant="outline" onClick={handleUnpublish}>
                  <Icon name="arrow-rotate-left" />Unpublish
                </Button>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={() => setShowReviewDialog(true)}>
                    <Icon name="paper-plane" />Send for review
                  </Button>
                  <Button type="button" variant="default" disabled={nQ === 0} onClick={handlePublish}>
                    <Icon name="share" />Publish assessment
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informal review dialog */}
      {showReviewDialog && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'oklch(0.1 0 0 / 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowReviewDialog(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--background)', borderRadius: 16, padding: 28, maxWidth: 440, width: '90vw', boxShadow: 'var(--shadow-lg)' }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Send for informal review</div>
            <div className="hint" style={{ marginBottom: 18 }}>
              Sends a notification to all collaborators with a read-only preview link. This does not lock the assessment.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button type="button" variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
              <Button type="button" variant="default" onClick={() => { setShowReviewDialog(false); notify('Review request sent to collaborators', 'success') }}>
                <Icon name="paper-plane" />Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
