'use client'

/* Configuration panels: Configure tab + Delivery & Security tab (full depth).
   Faithful 1:1 port of the Claude Design assessment/config.jsx —
   CfgSection, TRow, SRow, useCfg, ConfigureTab, DeliveryTab.
   Component-substitution pass: scoped .card/.seg/.input/.tag/.chip/.info-banner
   + local Toggle/Check/Avatar primitives → @exxatdesignux/ui components. */

import { useState, type ReactNode } from 'react'
import { Card, CardContent, Badge, Button, Input, Checkbox, ToggleSwitch, AvatarInitials } from '@exxatdesignux/ui'
import { Icon } from '../icons'
import { FACULTY, type FacultyId, type BuilderMeta } from '../data'

// ───────────────────────── shared bits ─────────────────────────

const INFO_BANNER_STYLE = {
  marginTop: 12,
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  padding: '10px 12px',
  borderRadius: 12,
  background: 'oklch(from var(--chart-1) l c h / 0.08)',
  border: '1px solid oklch(from var(--chart-1) l c h / 0.28)',
  color: 'var(--chip-1)',
  fontSize: 13,
  lineHeight: 1.4,
} as const

/** Bordered inline-flex segmented control built from DS Buttons. */
function Seg<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { v: T; label: ReactNode; disabled?: boolean }[]
}) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, padding: 2, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)' }}>
      {options.map(o => {
        const sel = value === o.v
        return (
          <Button
            key={o.v}
            type="button"
            variant={sel ? 'default' : 'ghost'}
            size="sm"
            aria-pressed={sel}
            disabled={o.disabled}
            onClick={() => onChange(o.v)}
          >
            {o.label}
          </Button>
        )
      })}
    </div>
  )
}

// ───────────────────────── section + row primitives ─────────────────────────

function CfgSection({
  icon,
  title,
  sub,
  badge,
  children,
}: {
  icon: string
  title: string
  sub?: string
  badge?: string
  children: ReactNode
}) {
  return (
    <Card style={{ borderRadius: 16, marginBottom: 16 }}>
      <CardContent style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--muted)', display: 'grid', placeItems: 'center', color: 'var(--brand-color-dark)', flexShrink: 0 }}><Icon name={icon} style={{ fontSize: 15 }} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
              {badge && <Badge variant="secondary">{badge}</Badge>}
            </div>
            {sub && <div className="hint" style={{ marginTop: 2 }}>{sub}</div>}
          </div>
        </div>
        <div>{children}</div>
      </CardContent>
    </Card>
  )
}

function TRow({
  label,
  hint,
  on,
  onToggle,
  disabled,
  last,
}: {
  label: string
  hint?: string
  on: boolean
  onToggle: () => void
  disabled?: boolean
  last?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: last ? 'none' : '1px solid var(--border)', opacity: disabled ? 0.5 : 1 }}>
      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>{hint && <div className="hint" style={{ marginTop: 2, maxWidth: 560 }}>{hint}</div>}</div>
      <ToggleSwitch checked={on} onChange={() => { if (!disabled) onToggle() }} />
    </div>
  )
}

function SRow({
  label,
  hint,
  children,
  last,
}: {
  label: string
  hint?: string
  children: ReactNode
  last?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>{hint && <div className="hint" style={{ marginTop: 2, maxWidth: 520 }}>{hint}</div>}</div>
      {children}
    </div>
  )
}

/** DS Checkbox + label (replaces the scoped .chk primitive). */
function CfgCheck({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
      <Checkbox checked={on} onCheckedChange={onToggle} />
      {label}
    </label>
  )
}

// ───────────────────────── configure state ─────────────────────────

function useCfg() {
  return useState({
    fwdOnly: true, reqAdvance: true, forcedTimer: true, blockBackWithin: false, reqAnswerGlobal: true,
    ordering: 'fixed', breaksAllowed: true, warnAlarm: true,
    calc: 'scientific', highlight: true, notes: true, notesFeedback: true, copyPaste: false, spellCheck: true, findReplace: true,
    distribution: 'question', autoScore: true, blindScore: true, perfFlag: true,
    resultDisplay: 'delayed', scoreRaw: true, scorePct: true, earlySubmit: false,
    reviewAccess: 'scheduled', reviewLockdown: true, reviewPw: true, reviewTimed: true, reviewIncorrectOnly: false, reviewRationale: true,
  })
}

// ───────────────────────── Configure tab ─────────────────────────

export function ConfigureTab({ meta }: { meta: BuilderMeta }) {
  void meta
  const [c, setC] = useCfg()
  const t = (k: keyof typeof c) => setC(s => ({ ...s, [k]: !s[k] }))
  const set = (k: keyof typeof c, v: string) => setC(s => ({ ...s, [k]: v }))
  return (
    <div className="exam-creation" style={{ maxWidth: 880 }}>
      <CfgSection icon="diagram-project" title="Navigation & progression" sub="Clinical-exam section transition rules (ExamSoft parity)" badge="On par">
        <TRow label="Forward-only section navigation" hint="Once a student advances past a section they cannot return to it." on={c.fwdOnly} onToggle={() => t('fwdOnly')} />
        <TRow label="Require answer to advance section" hint="All questions in the active section must be answered before transition." on={c.reqAdvance} onToggle={() => t('reqAdvance')} />
        <TRow label="Forced timer transitions" hint="When a section timer expires, the student is advanced and unanswered items auto-submit." on={c.forcedTimer} onToggle={() => t('forcedTimer')} />
        <TRow label="Block backward navigation within a section" hint="Prevent changing earlier answers in the active section. Pair with assessment-level Require Answer." on={c.blockBackWithin} onToggle={() => t('blockBackWithin')} />
        <TRow label="Require answer (assessment-level)" hint="Force an answer before moving to the next question, globally." on={c.reqAnswerGlobal} onToggle={() => t('reqAnswerGlobal')} last />
      </CfgSection>

      <CfgSection icon="right-left" title="Question ordering & randomization" sub="Randomization is constrained within each section to preserve structure">
        <SRow label="Question order" hint="Random shuffles per student — within each section only, never across the exam." last>
          <Seg
            value={c.ordering}
            onChange={v => set('ordering', v)}
            options={[
              { v: 'fixed', label: 'Fixed' },
              { v: 'random', label: 'Random (within section)' },
            ]}
          />
        </SRow>
      </CfgSection>

      <CfgSection icon="calculator" title="Digital tools" sub="Cascading override: Assessment → Question → Student/Accessibility" badge="On par">
        <SRow label="Calculator">
          <Seg
            value={c.calc}
            onChange={v => set('calc', v)}
            options={[
              { v: 'off', label: 'Off' },
              { v: 'basic', label: 'Basic' },
              { v: 'scientific', label: 'Scientific' },
            ]}
          />
        </SRow>
        <TRow label="Text highlighter" hint="Highlight text within questions or reading passages." on={c.highlight} onToggle={() => t('highlight')} />
        <TRow label="Notes / scratchpad" hint="Digital scratchpad for rough work." on={c.notes} onToggle={() => t('notes')} />
        <TRow label="Allow feedback within notes" hint="Students can flag or submit notes for faculty reviewer feedback." on={c.notesFeedback} onToggle={() => t('notesFeedback')} />
        <TRow label="Allow copy / paste" hint="Permit or block external clipboard copy/paste." on={c.copyPaste} onToggle={() => t('copyPaste')} />
        <TRow label="Spell check (essay)" hint="Integrated spell checking on long-form responses." on={c.spellCheck} onToggle={() => t('spellCheck')} />
        <TRow label="Find & replace (essay)" hint="Editing utility for long essay responses." on={c.findReplace} onToggle={() => t('findReplace')} />
        <TRow label="Warning alarms" hint="Visual warning before the timer expires (defaults to 5-minute warning)." on={c.warnAlarm} onToggle={() => t('warnAlarm')} last />
      </CfgSection>

      <CfgSection icon="scale-balanced" title="Weightage & grading" sub="Assessment-level scoring configuration">
        <SRow label="Weightage distribution">
          <Seg
            value={c.distribution}
            onChange={v => set('distribution', v)}
            options={[
              { v: 'section', label: 'Section-wise' },
              { v: 'question', label: 'Question-wise' },
            ]}
          />
        </SRow>
        <TRow label="Auto-scoring" hint="Auto-score objective items on submission." on={c.autoScore} onToggle={() => t('autoScore')} />
        <TRow label="Blind scoring" hint="Hide student names during manual scoring." on={c.blindScore} onToggle={() => t('blindScore')} />
        <TRow label="Student performance flagging" hint="Define score thresholds to flag categories for teachers only — never shown to students." on={c.perfFlag} onToggle={() => t('perfFlag')} last />
      </CfgSection>

      <CfgSection icon="graduation-cap" title="Exam-end settings">
        <SRow label="Display results / rationale">
          <Seg
            value={c.resultDisplay}
            onChange={v => set('resultDisplay', v)}
            options={[
              { v: 'immediate', label: 'Immediate' },
              { v: 'delayed', label: 'Delayed' },
              { v: 'off', label: 'Hidden' },
            ]}
          />
        </SRow>
        <SRow label="Score display to students" hint="Pass/fail labels & advanced indicators are never shown — institutions derive grades via LMS.">
          <div style={{ display: 'flex', gap: 16 }}>
            <CfgCheck on={c.scoreRaw} onToggle={() => t('scoreRaw')} label="Raw score" />
            <CfgCheck on={c.scorePct} onToggle={() => t('scorePct')} label="Percentage" />
          </div>
        </SRow>
        <TRow label="Allow early submission" on={c.earlySubmit} onToggle={() => t('earlySubmit')} last />
      </CfgSection>

      <CfgSection icon="eye" title="Post-exam review engine" sub="Secure, granular student review of results" badge="On par">
        <SRow label="Access timeline">
          <Seg
            value={c.reviewAccess}
            onChange={v => set('reviewAccess', v)}
            options={[
              { v: 'immediate', label: 'Immediate' },
              { v: 'scheduled', label: 'Scheduled' },
            ]}
          />
        </SRow>
        {c.reviewAccess === 'scheduled' && (
          <SRow label="Review window opens"><Input style={{ width: 220 }} defaultValue="10/27/2026 09:00 AM EST" aria-label="Review window opens" /></SRow>
        )}
        <TRow label="Lockdown browser enforcement" hint="Force a secure Respondus session — blocks screenshots, copy, and other apps during review." on={c.reviewLockdown} onToggle={() => t('reviewLockdown')} />
        <TRow label="Access password" hint="Custom password required to unlock the review screen." on={c.reviewPw} onToggle={() => t('reviewPw')} />
        <TRow label="Time-limited review" hint="Auto-closes after a maximum duration (e.g. 15 minutes)." on={c.reviewTimed} onToggle={() => t('reviewTimed')} />
        <TRow label="Incorrect answers only" hint="Limit review to questions the student missed." on={c.reviewIncorrectOnly} onToggle={() => t('reviewIncorrectOnly')} />
        <TRow label="Show rationale & explanations" hint="Display pedagogical rationale alongside questions." on={c.reviewRationale} onToggle={() => t('reviewRationale')} last />
      </CfgSection>
    </div>
  )
}

// ───────────────────────── Delivery & Security tab ─────────────────────────

interface AccommodationRow {
  id: FacultyId
  acc: string[]
  type: 'Permanent' | 'Temporary'
  student?: string
}

export function DeliveryTab({ meta, setMeta: _setMeta }: { meta: BuilderMeta; setMeta: (fn: (m: BuilderMeta) => BuilderMeta) => void }) {
  void meta
  const [d, setD] = useState({
    secure: true, startPw: true, resumePw: true, cacheWindow: 60, audience: 'all',
    breaks: 'defined', maxBreaks: 1, paradigm: 'web', prohibitLate: true,
    pPrint: true, pKey: true, pEnd: true, pInval: true,
  })
  const t = (k: keyof typeof d) => setD(s => ({ ...s, [k]: !s[k] }))
  const set = (k: keyof typeof d, v: string | number | boolean) => setD(s => ({ ...s, [k]: v }))

  const accommodations: AccommodationRow[] = [
    { id: 'ta', acc: ['+50% time', 'Text-to-speech'], type: 'Permanent' },
    { id: 'okafor', acc: ['+25% time', 'Extra breaks'], type: 'Temporary', student: 'Jordan Miller' },
  ]

  return (
    <div className="exam-creation" style={{ maxWidth: 880 }}>
      <CfgSection icon="shield-halved" title="Security environment" sub="Toggle the integrity model for this assessment" badge="On par">
        <SRow label="Testing mode" hint={d.secure ? 'Secure: Respondus lockdown blocks other apps, VMs, and screen capture.' : 'Unsecure: any standard browser. No lockdown — but start/resume passwords still apply.'}>
          <Seg
            value={d.secure ? 'secure' : 'unsecure'}
            onChange={v => set('secure', v === 'secure')}
            options={[
              { v: 'secure', label: <><Icon name="lock" />Secure</> },
              { v: 'unsecure', label: <><Icon name="lock-open" />Unsecure</> },
            ]}
          />
        </SRow>
        <TRow label="Exam start password" hint="Cryptographic key that decrypts the locally cached exam before the timer begins." on={d.startPw} onToggle={() => t('startPw')} />
        <TRow label="Resume password" hint="Required to unlock the interface after an authorized break." on={d.resumePw} onToggle={() => t('resumePw')} last />
        <div style={INFO_BANNER_STYLE}><Icon name="circle-info" style={{ marginTop: 1 }} /><div>Device and IP restrictions are <b>not supported</b> in this scope.</div></div>
      </CfgSection>

      <CfgSection icon="calendar-days" title="Availability window" sub="Three-stage delivery timeline">
        <SRow label="Visible date" hint="Card appears on the student dashboard; pre-reads & instructions viewable, but cannot launch."><Input style={{ width: 220 }} defaultValue="10/20/2026 08:00 AM EST" aria-label="Visible date" /></SRow>
        <SRow label="Openable date (pre-flight)" hint="Students can launch the interface and cache the exam data before starting the timer."><Input style={{ width: 220 }} defaultValue="10/24/2026 08:00 AM EST" aria-label="Openable date (pre-flight)" /></SRow>
        <SRow label="Cutoff date (available until)" hint="Final submission deadline." last><Input style={{ width: 220 }} defaultValue="10/24/2026 11:00 AM EST" aria-label="Cutoff date (available until)" /></SRow>
      </CfgSection>

      <CfgSection icon="house" title="Resilient browser delivery" sub="Offline-tolerant web delivery — no software install (Exxat architectural shift)" badge="Differentiator">
        <SRow label="Pre-flight cache window" hint="How early students can enter the placeholder screen so the cache fully downloads ahead of start.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Input type="number" style={{ width: 80 }} value={d.cacheWindow} onChange={e => set('cacheWindow', +e.target.value)} aria-label="Pre-flight cache window (minutes before start)" /><span className="hint">min before start</span></div>
        </SRow>
        <SRow label="Prohibit late submission" hint="Auto-submit the active exam when the cutoff is reached." last><ToggleSwitch checked={d.prohibitLate} onChange={() => t('prohibitLate')} /></SRow>
        <div style={INFO_BANNER_STYLE}><Icon name="circle-info" style={{ marginTop: 1 }} /><div>Internet required only for <b>login</b> and <b>submission</b>. Once cached, the exam runs offline or on unstable connections — no data loss on reboot.</div></div>
      </CfgSection>

      <CfgSection icon="users" title="Target audience & breaks">
        <SRow label="Publish to">
          <Seg
            value={d.audience}
            onChange={v => set('audience', v)}
            options={[
              { v: 'all', label: 'All students' },
              { v: 'subset', label: 'Specific groups' },
            ]}
          />
        </SRow>
        <SRow label="Breaks between sections" last>
          <Seg
            value={d.breaks}
            onChange={v => set('breaks', v)}
            options={[
              { v: 'none', label: 'None' },
              { v: 'defined', label: 'Defined max' },
              { v: 'open', label: 'Unlimited' },
            ]}
          />
        </SRow>
      </CfgSection>

      <CfgSection icon="user-plus" title="Accommodations" sub="Student-level overrides bypass assessment & question restrictions" badge="Differentiator">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {accommodations.map((a, i) => (
            <Card key={i} style={{ borderRadius: 12 }}>
              <CardContent style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <AvatarInitials size="sm" initials={FACULTY[a.id].initials} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{a.student || FACULTY[a.id].name}</div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>{a.acc.map(x => <Badge key={x} variant="outline">{x}</Badge>)}</div>
                </div>
                <Badge variant="secondary">{a.type}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="hint" style={{ marginTop: 10 }}>Permanent accommodations come from the student&apos;s global profile; temporary ones are requested via the student dashboard.</div>
      </CfgSection>

      <CfgSection icon="shield-check" title="Proctor controls">
        <TRow label="Allow proctor to enable print / offline testing" on={d.pPrint} onToggle={() => t('pPrint')} />
        <TRow label="Allow proctor printout with answer keys" on={d.pKey} onToggle={() => t('pKey')} />
        <TRow label="Allow proctor to end exam early for a student" on={d.pEnd} onToggle={() => t('pEnd')} />
        <TRow label="Allow proctor to invalidate a student's exam" on={d.pInval} onToggle={() => t('pInval')} last />
      </CfgSection>

      <CfgSection icon="circle-question" title="Delivery paradigm" sub="Architectural decision pending — Option 1 vs Option 2">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { id: 'web', t: 'Option 1 · Web / Respondus', pros: 'High security · zero install · offline-tolerant once cached', cons: 'No download days in advance (1–2h pre-flight only)' },
            { id: 'client', t: 'Option 2 · Installed client', pros: 'Download exam days in advance', cons: 'Basic security · requires desktop app install' },
          ].map(o => {
            const sel = d.paradigm === o.id
            return (
              <Card
                key={o.id}
                onClick={() => set('paradigm', o.id)}
                style={{ borderRadius: 12, cursor: 'pointer', borderColor: sel ? 'var(--brand-color)' : 'var(--border)', boxShadow: sel ? '0 0 0 3px oklch(from var(--brand-color) l c h / 0.14)' : 'none' }}
              >
                <CardContent style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Icon name={sel ? 'circle-check' : 'circle'} style={{ color: sel ? 'var(--brand-color)' : 'var(--muted-foreground)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{o.t}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--chip-2)', marginBottom: 4 }}><Icon name="check" /> {o.pros}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}><Icon name="minus" /> {o.cons}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CfgSection>
    </div>
  )
}
