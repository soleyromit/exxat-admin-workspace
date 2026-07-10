'use client'

/* Review & Publish — full lifecycle state machine + 2-level review workflow.
   Models the complete PRD §4.6 journey with NO dead ends:
   delegated authoring → partial submission → Level 1 (owner) sign-off (with a
   per-section request-changes loop) → Level 2 (chairperson) validation (with a
   whole-exam send-back loop) → Ready → Published.

   You "act as" any of the real collaborators (ActorBar), so every action is
   reachable. A "Guide me" walkthrough (GuideRail) steps through the entire flow,
   switching personas for you. Built on @exxatdesignux/ui DS components. */

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Button, Card, CardContent, Badge, Textarea, AvatarInitials, LocalBanner } from '@exxatdesignux/ui'
import { Icon } from '../icons'
import { useApp } from '../primitives'
import { AssessmentStatusBadge } from '../assessment-status-badge'
import {
  FACULTY,
  STATES,
  totalQuestions,
  totalPoints,
  flaggedCount,
  type BuilderMeta,
  type Section,
  type FacultyId,
} from '../data'

const LIFECYCLE: Array<keyof typeof STATES> = ['planned', 'draft', 'review', 'ready', 'completed', 'archived']

const shortName = (id: string) => (FACULTY[id as FacultyId] ? FACULTY[id as FacultyId].name : id)
const secLabel = (s: Section) => (s.name.split('—')[0] || s.name).trim()

// Tinted-Badge tones (mirror AssessmentStatusBadge's hue-at-alpha pattern).
const GREEN = { backgroundColor: 'oklch(from var(--chart-2) l c h / 0.14)', color: 'var(--chip-2)' }
const AMBER = { backgroundColor: 'oklch(from var(--chart-4) l c h / 0.14)', color: 'var(--chip-4)' }
const BLUE = { backgroundColor: 'oklch(from var(--chart-1) l c h / 0.12)', color: 'var(--chip-1)' }

// Section state machine: not-started → drafting → submitted → approved,
// with submitted → changes → drafting (the rework loop).
const SEC_STATE: Record<string, { label: string; dot: string; style?: CSSProperties }> = {
  'not-started': { label: 'Not started', dot: 'var(--muted-foreground)' },
  drafting: { label: 'Drafting', dot: 'var(--chip-4)', style: AMBER },
  submitted: { label: 'Submitted', dot: 'var(--chip-1)', style: BLUE },
  changes: { label: 'Changes requested', dot: 'var(--destructive)', style: { backgroundColor: 'oklch(from var(--destructive) l c h / 0.12)', color: 'var(--destructive)' } },
  approved: { label: 'Approved', dot: 'var(--chip-2)', style: GREEN },
}

// Lifecycle stage of the whole exam through review (labels only — no sub copy).
const STAGE_ORDER = ['authoring', 'l1', 'l2', 'ready', 'published']
const STAGE_META: Record<string, { icon: string; label: string }> = {
  authoring: { icon: 'pen-line', label: 'Authoring' },
  l1: { icon: 'clipboard-check', label: 'Level 1 · Owner' },
  l2: { icon: 'scale-balanced', label: 'Level 2 · Chair' },
  ready: { icon: 'circle-check', label: 'Ready' },
  published: { icon: 'paper-plane', label: 'Published' },
}

// ── types for the local state machine ──
type Stage = 'l1' | 'l2' | 'ready' | 'published'
interface LogEntry {
  t: string
  who: string
  icon: string
  text: string
}
interface JourneyStep {
  key: string
  actor: FacultyId
  kind: string
  secId?: string
  branch?: boolean
  doLabel: string
  doIcon: string
  title: string
}

const Avi = ({ id, size = 'sm' }: { id: FacultyId; size?: 'sm' | 'default' | 'lg' }) => (
  <AvatarInitials size={size} initials={FACULTY[id]?.initials ?? '?'} role="img" aria-label={shortName(id)} />
)

export function ReviewPublish({
  meta,
  setMeta,
  sections,
  persona,
  onBack,
  onList,
}: {
  meta: BuilderMeta
  setMeta: (fn: (m: BuilderMeta) => BuilderMeta) => void
  sections: Section[]
  persona: string
  onBack: () => void
  onList: () => void
}) {
  const { notify } = useApp()
  const ownerId: FacultyId = meta.owner || 'schen'
  const chairId: FacultyId = 'reyes'

  // The real people in this workflow → drives the "act as" model.
  const actors = useMemo(() => {
    const seen = new Set<FacultyId>()
    const list: { id: FacultyId; role: string }[] = []
    const add = (id: FacultyId, role: string) => {
      if (id && !seen.has(id)) {
        seen.add(id)
        list.push({ id, role })
      }
    }
    add(ownerId, 'Assessment owner')
    sections.forEach((s) => {
      if (s.owner !== ownerId) add(s.owner, `Section author · ${secLabel(s).replace('Section ', '')}`)
    })
    add(chairId, 'Chairperson — final review')
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, ownerId])

  const personaToActor = (p: string): FacultyId =>
    p === 'chairperson'
      ? chairId
      : p === 'instructor'
        ? (actors.find((a) => a.id !== ownerId && a.id !== chairId) || ({} as { id?: FacultyId })).id || ownerId
        : ownerId

  const [actor, setActor] = useState<FacultyId>(() => personaToActor(persona))
  const [stage, setStage] = useState<Stage>('l1') // l1 (authoring + owner) | l2 | ready | published
  const [secState, setSecState] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {}
    sections.forEach((s) => {
      o[s.id] =
        s.reviewStatus === 'submitted'
          ? 'submitted'
          : s.reviewStatus === 'approved'
            ? 'approved'
            : s.reviewStatus === 'not-started'
              ? 'not-started'
              : 'drafting'
    })
    return o
  })
  const [bounce, setBounce] = useState<{ who: string; text: string } | null>(null)
  const [changeFor, setChangeFor] = useState<string | null>(null) // section id | "l2"
  const [changeText, setChangeText] = useState('')
  const [guide, setGuide] = useState<{ on: boolean; i: number }>({ on: false, i: 0 })
  const [log, setLog] = useState<LogEntry[]>([
    { t: '10/21/2026 02:40 PM EST', who: 'okafor', icon: 'paper-plane', text: 'submitted Section B — Antiarrhythmics & Heart Failure for review' },
    { t: '10/21/2026 11:18 AM EST', who: 'schen', icon: 'users', text: 'delegated Section C to Dr. Priya Nair' },
    { t: '10/20/2026 09:14 AM EST', who: 'schen', icon: 'hammer', text: 'created the assessment from the Fall 2025 blueprint' },
  ])
  const addLog = (who: string, icon: string, text: string) =>
    setLog((l) => [{ t: 'Just now', who, icon, text }, ...l])

  // entering this screen means the exam is in the review pipeline
  useEffect(() => {
    if (meta.state === 'draft') setMeta((m) => ({ ...m, state: 'review' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // keep the acting actor in step with the topbar persona (unless the guide owns it)
  useEffect(() => {
    if (!guide.on) setActor(personaToActor(persona))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona])

  const isOwner = actor === ownerId
  const isChair = actor === chairId
  const flags = flaggedCount(sections)
  const vals = Object.values(secState)
  const approvedN = vals.filter((v) => v === 'approved').length
  const submittedN = vals.filter((v) => v === 'submitted').length
  const allApproved = vals.length > 0 && vals.every((v) => v === 'approved')

  function setSec(id: string, v: string) {
    setSecState((r) => ({ ...r, [id]: v }))
  }

  // ── workflow actions (each logs as the acting person) ──
  function submitSection(s: Section, who: FacultyId = actor) {
    setSec(s.id, 'submitted')
    addLog(who, 'paper-plane', `submitted ${secLabel(s)} for review`)
    notify('Section submitted for review')
  }
  function resubmitSection(s: Section, who: FacultyId = actor) {
    setSec(s.id, 'submitted')
    addLog(who, 'rotate', `addressed the changes and re-submitted ${secLabel(s)}`)
    notify('Section re-submitted for review')
  }
  function approveSection(s: Section, who: FacultyId = ownerId) {
    setSec(s.id, 'approved')
    addLog(who, 'circle-check', `approved ${secLabel(s)} at Level 1`)
    notify('Section approved')
  }
  function requestSectionChanges(s: Section, note: string, who: FacultyId = ownerId) {
    setSec(s.id, 'changes')
    addLog(who, 'rotate', `requested changes on ${secLabel(s)}${note ? `: “${note}”` : ''}`)
    notify('Changes requested — author notified', 'warn')
  }
  function completeL1(who: FacultyId = ownerId) {
    const wasBounced = !!bounce
    setStage('l2')
    setBounce(null)
    setMeta((m) => ({ ...m, state: 'review' }))
    addLog(
      who,
      'check-double',
      wasBounced
        ? "resolved the Chairperson's note and resent the exam to Level 2"
        : 'completed Level 1 review and sent the exam to the Chairperson',
    )
    notify(wasBounced ? 'Resent to the Chairperson' : 'Approved — sent to Chairperson for final validation')
  }
  function chairBounce(note: string, who: FacultyId = chairId) {
    setStage('l1')
    setBounce({ who, text: note || 'Please revisit before final sign-off.' })
    setMeta((m) => ({ ...m, state: 'review' }))
    addLog(who, 'rotate', `returned the exam to the owner${note ? `: “${note}”` : ''}`)
    notify('Sent back to the owner for rework', 'warn')
  }
  function chairApprove(who: FacultyId = chairId) {
    setStage('ready')
    setBounce(null)
    setMeta((m) => ({ ...m, state: 'ready' }))
    addLog(who, 'shield-check', 'completed Level 2 validation — the exam is Ready')
    notify('Chairperson approved — assessment is Ready')
  }
  function publish(who: FacultyId = ownerId) {
    setStage('published')
    setMeta((m) => ({ ...m, state: 'ready' }))
    addLog(who, 'paper-plane', 'published the exam — students gain access at the scheduled time')
    notify('Published — students gain access at the scheduled time')
  }

  function sendChange() {
    if (changeFor === 'l2') chairBounce(changeText)
    else {
      const s = sections.find((x) => x.id === changeFor)
      if (s) requestSectionChanges(s, changeText)
    }
    setChangeFor(null)
    setChangeText('')
  }

  // ── guided walkthrough ──
  const journey = useMemo(
    () => buildJourney(sections, ownerId, chairId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sections, ownerId],
  )
  const gStep = guide.on ? journey[guide.i] : null
  useEffect(() => {
    if (guide.on && gStep) setActor(gStep.actor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide.on, guide.i])

  function startGuide() {
    const fresh: Record<string, string> = {}
    sections.forEach((s) => (fresh[s.id] = 'drafting'))
    setSecState(fresh)
    setStage('l1')
    setBounce(null)
    setChangeFor(null)
    setGuide({ on: true, i: 0 })
    setActor(journey[0].actor)
  }
  function guideDo() {
    const st = journey[guide.i]
    const s = st.secId ? sections.find((x) => x.id === st.secId) : null
    const sampleNote =
      st.kind === 'changes'
        ? 'Distractor (B) overlaps with the key — please reword or replace.'
        : st.kind === 'bounce'
          ? 'Tighten the Heart-Failure section to the blueprint before we finalize.'
          : ''
    if (st.kind === 'submit' && s) submitSection(s, st.actor)
    else if (st.kind === 'resubmit' && s) resubmitSection(s, st.actor)
    else if (st.kind === 'approve' && s) approveSection(s, st.actor)
    else if (st.kind === 'changes' && s) requestSectionChanges(s, sampleNote, st.actor)
    else if (st.kind === 'l1' || st.kind === 'resend') completeL1(st.actor)
    else if (st.kind === 'bounce') chairBounce(sampleNote, st.actor)
    else if (st.kind === 'l2') chairApprove(st.actor)
    else if (st.kind === 'publish') publish(st.actor)
    setGuide((g) => ({ ...g, i: g.i + 1 }))
  }
  const guideFinished = guide.on && guide.i >= journey.length

  // pre-publish checklist
  const checklist = [
    {
      ok: flags === 0,
      label: `Resolve ${flags} flagged outlier question${flags !== 1 ? 's' : ''}`,
      hint: 'Negative point-biserial / near-zero discrimination',
      okLabel: 'All questions within range',
    },
    { ok: true, label: 'Topic & difficulty distribution within target', hint: 'Tracked against the blueprint' },
    { ok: true, label: 'Security & delivery configured', hint: `${meta.security} mode · availability window set` },
    { ok: true, label: 'Schedule set', hint: 'Openable 10/24/2026 08:00 AM EST' },
    {
      ok: allApproved,
      label: `${approvedN} of ${vals.length} sections approved`,
      hint: 'Partial section submissions allowed',
      okLabel: 'All sections submitted & approved',
    },
  ]
  const allChecks = checklist.every((c) => c.ok)

  // "what's next" — plain language, from the acting person's POV
  const nextUp = (() => {
    if (stage === 'published')
      return {
        ic: 'circle-check',
        tone: 'ok',
        text: 'Published. The exam is sealed until the Openable date — nothing further is required.',
      }
    if (stage === 'ready')
      return {
        ic: 'paper-plane',
        tone: 'ok',
        text: isOwner
          ? 'Both reviews are complete. Publish now — students gain access at the scheduled time.'
          : `Both reviews are complete. The owner (${shortName(ownerId)}) will publish.`,
      }
    if (stage === 'l2')
      return {
        ic: 'scale-balanced',
        tone: 'info',
        text: isChair
          ? 'Your turn: validate the full exam, then approve to Ready or send it back with a note.'
          : `Awaiting the Chairperson (${shortName(chairId)}) for final Level 2 validation.`,
      }
    if (bounce)
      return {
        ic: 'rotate',
        tone: 'warn',
        text: isOwner
          ? `The Chairperson sent the exam back. Address the note, then resend to Level 2.`
          : `The owner (${shortName(ownerId)}) is addressing the Chairperson's note before resending.`,
      }
    if (allApproved)
      return {
        ic: 'check-double',
        tone: 'info',
        text: isOwner
          ? 'Every section is approved — send the exam to the Chairperson for final validation.'
          : `All sections approved. The owner (${shortName(ownerId)}) will send it to the Chairperson.`,
      }
    const waiting = sections.filter((s) => secState[s.id] !== 'approved')
    const acting = waiting.find((s) => s.owner === actor)
    if (acting && (secState[acting.id] === 'drafting' || secState[acting.id] === 'not-started'))
      return {
        ic: 'pen-line',
        tone: 'info',
        text: `Your section "${secLabel(acting)}" is still drafting — submit it for the owner to review.`,
      }
    if (acting && secState[acting.id] === 'changes')
      return {
        ic: 'rotate',
        tone: 'warn',
        text: `The owner asked for changes on your "${secLabel(acting)}". Revise, then re-submit.`,
      }
    if (isOwner && submittedN)
      return {
        ic: 'clipboard-check',
        tone: 'info',
        text: `${submittedN} section${submittedN > 1 ? 's are' : ' is'} waiting on your Level 1 sign-off below.`,
      }
    return {
      ic: 'clock',
      tone: 'info',
      text: `Level 1 in progress — ${approvedN} of ${vals.length} sections approved, ${submittedN} awaiting owner sign-off.`,
    }
  })()

  const reviewers = [
    { key: 'l1', level: 'Review 1', who: ownerId, role: 'Assessment owner' },
    { key: 'l2', level: 'Review 2', who: chairId, role: 'Chairperson' },
  ]
  const l1Done = stage === 'l2' || stage === 'ready' || stage === 'published'

  return (
    <div className="content" style={{ maxWidth: 1120, paddingBottom: guide.on ? 96 : 24 }}>
      <div className="page-head" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <Icon name="arrow-left" />
              Back to builder
            </Button>
            <AssessmentStatusBadge state={meta.state} />
          </div>
          <h1 className="page-title">Review &amp; publish</h1>
          <p className="page-sub">
            {meta.name} · {totalQuestions(sections)} questions · {totalPoints(sections)} points
          </p>
        </div>
        <div className="actions">
          {!guide.on && (
            <Button variant="outline" onClick={startGuide}>
              <Icon name="play" />
              Guide me through the flow
            </Button>
          )}
          {stage === 'published' ? (
            <Button variant="outline" onClick={onList}>
              <Icon name="check" />
              Done
            </Button>
          ) : (
            <Button disabled={stage !== 'ready' || !allChecks || !isOwner} onClick={() => publish()}>
              <Icon name="paper-plane" />
              Publish assessment
            </Button>
          )}
        </div>
      </div>

      {/* lifecycle stepper */}
      <Card className="mb-3.5">
        <CardContent className="p-5">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {LIFECYCLE.map((st, i) => {
              const cur = LIFECYCLE.indexOf(meta.state)
              const done = i < cur
              const active = i === cur
              return (
                <div
                  key={st}
                  style={{ display: 'flex', alignItems: 'center', flex: i < LIFECYCLE.length - 1 ? 1 : '0 0 auto' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div
                      className="text-xs font-semibold"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 9999,
                        display: 'grid',
                        placeItems: 'center',
                        background: done ? 'var(--chip-2)' : active ? 'var(--brand-color)' : 'var(--muted)',
                        color: done || active ? 'white' : 'var(--muted-foreground)',
                      }}
                    >
                      {done ? <Icon name="check" /> : i + 1}
                    </div>
                    <span
                      className="text-xs"
                      style={{
                        fontWeight: active ? 600 : 500,
                        color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                      }}
                    >
                      {STATES[st].label}
                    </span>
                  </div>
                  {i < LIFECYCLE.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: i < cur ? 'var(--chip-2)' : 'var(--border)',
                        margin: '0 10px',
                        marginBottom: 22,
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* acting-as + what's next */}
      <ActorBar actors={actors} actor={actor} onActor={setActor} locked={guide.on} />

      <Card className="mb-3.5">
        <CardContent className="p-5" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon
            name={nextUp.ic}
            style={{
              fontSize: 17,
              color: nextUp.tone === 'ok' ? 'var(--chip-2)' : nextUp.tone === 'warn' ? 'var(--chart-4)' : 'var(--chip-1)',
              flexShrink: 0,
            }}
          />
          <div className="text-sm" style={{ fontWeight: 500, lineHeight: 1.45 }}>
            <span style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>
              What's next for {shortName(actor)} —{' '}
            </span>
            {nextUp.text}
          </div>
        </CardContent>
      </Card>

      {/* journey map with both loopback branches */}
      <JourneyMap stage={stage} secState={secState} bounced={!!bounce} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* left: review gates + sections + activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 2-level review gates */}
          <Card>
            <CardContent className="p-5">
              <div className="text-base font-semibold mb-3">Two-level review</div>

              {bounce && (
                <LocalBanner variant="error" className="mb-3.5">
                  <b>The Chairperson sent this back.</b> {shortName(bounce.who)}: &ldquo;{bounce.text}&rdquo; — address the note,
                  then resend to Level 2.
                </LocalBanner>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reviewers.map((r) => {
                  const rDone = r.key === 'l1' ? l1Done : stage === 'ready' || stage === 'published'
                  const rCurrent = (r.key === 'l1' && stage === 'l1') || (r.key === 'l2' && stage === 'l2')
                  return (
                    <div
                      key={r.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 13,
                        padding: '12px 14px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        background: rCurrent ? 'oklch(from var(--brand-color) l c h / 0.05)' : 'transparent',
                        borderColor: rCurrent ? 'var(--brand-color)' : 'var(--border)',
                      }}
                    >
                      <Avi id={r.who} size="default" />
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="text-sm font-semibold">{r.level}</span>
                        <span className="hint">· {shortName(r.who)}</span>
                        <Badge variant="secondary">{r.role}</Badge>
                      </div>
                      {rDone ? (
                        <Badge variant="secondary" style={GREEN}>
                          Approved
                        </Badge>
                      ) : rCurrent ? (
                        <Badge variant="secondary" style={BLUE}>
                          {r.key === 'l1' ? `${approvedN}/${vals.length} sections` : 'Awaiting'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* L1 owner gate */}
              {stage === 'l1' &&
                (isOwner ? (
                  <Button className="w-full mt-3.5" disabled={!allApproved} onClick={() => completeL1()}>
                    <Icon name="check-double" />
                    {!allApproved
                      ? `Approve all sections first (${approvedN}/${vals.length})`
                      : bounce
                        ? 'Resend exam to Chairperson'
                        : 'Complete Level 1 — send to Chairperson'}
                  </Button>
                ) : (
                  <LocalBanner variant="info" className="mt-3.5">
                    Level 1 sign-off is the owner's gate.{' '}
                    {actor !== chairId
                      ? 'Submit your delegated section below — the owner reviews it.'
                      : "You'll act once the owner releases the exam to Level 2."}
                  </LocalBanner>
                ))}

              {/* L2 chairperson gate */}
              {stage === 'l2' &&
                (isChair ? (
                  changeFor === 'l2' ? (
                    <ChangeComposer
                      label="Note for the owner"
                      value={changeText}
                      onChange={setChangeText}
                      onSend={sendChange}
                      onCancel={() => setChangeFor(null)}
                      sendLabel="Send back to owner"
                    />
                  ) : (
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      <Button className="flex-1" onClick={() => chairApprove()}>
                        <Icon name="shield-check" />
                        Approve — mark Ready
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setChangeFor('l2')
                          setChangeText('')
                        }}
                      >
                        <Icon name="rotate" />
                        Send back
                      </Button>
                    </div>
                  )
                ) : (
                  <LocalBanner variant="info" className="mt-3.5">
                    Sent to the Chairperson ({shortName(chairId)}) for final validation. Act as the Chairperson to
                    approve or send it back.
                  </LocalBanner>
                ))}

              {stage === 'ready' && (
                <LocalBanner variant="success" className="mt-3.5">
                  Approved by both reviewers.{' '}
                  {isOwner ? 'Publish to schedule student access.' : `The owner (${shortName(ownerId)}) can now publish.`}
                </LocalBanner>
              )}
              {stage === 'published' && (
                <LocalBanner variant="success" className="mt-3.5">
                  Published. Inaccessible to students until 10/24/2026 09:00 AM EST.
                </LocalBanner>
              )}
            </CardContent>
          </Card>

          {/* per-section partial submissions */}
          <Card>
            <CardContent className="p-5">
              <div className="text-base font-semibold mb-3">Section status</div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginBottom: 16 }}>
                {Object.entries(SEC_STATE).map(([k, v], i) => (
                  <div style={{ display: 'contents' }} key={k}>
                    <span
                      className="text-xs"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)' }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: 9999, background: v.dot }} />
                      {v.label}
                    </span>
                    {i < 4 && <Icon name="arrow-right" style={{ color: 'var(--border-control-3)' }} />}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sections.map((s) => {
                  const st = secState[s.id]
                  const m2 = SEC_STATE[st]
                  const mine = actor === s.owner
                  const composing = changeFor === s.id
                  return (
                    <div
                      key={s.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        borderColor: st === 'changes' ? 'oklch(from var(--destructive) l c h / 0.35)' : 'var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avi id={s.owner} size="sm" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            className="text-sm font-semibold"
                            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {s.name}
                          </div>
                          <div className="hint">
                            {shortName(s.owner)} · {s.questions.length} questions{mine ? ' · your section' : ''}
                          </div>
                        </div>
                        <Badge variant="secondary" style={m2.style}>
                          {m2.label}
                        </Badge>

                        {/* author actions on their own section */}
                        {mine && (st === 'drafting' || st === 'not-started') && (
                          <Button variant="outline" size="sm" onClick={() => submitSection(s)}>
                            <Icon name="paper-plane" />
                            Submit
                          </Button>
                        )}
                        {mine && st === 'changes' && (
                          <Button size="sm" onClick={() => resubmitSection(s)}>
                            <Icon name="rotate" />
                            Re-submit
                          </Button>
                        )}

                        {/* owner Level 1 review actions */}
                        {isOwner && stage === 'l1' && st === 'submitted' && !composing && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Button variant="outline" size="sm" onClick={() => approveSection(s)}>
                              <Icon name="check" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ color: 'var(--destructive)' }}
                              onClick={() => {
                                setChangeFor(s.id)
                                setChangeText('')
                              }}
                            >
                              <Icon name="rotate" />
                              Changes
                            </Button>
                          </div>
                        )}
                      </div>

                      {composing && (
                        <div style={{ marginTop: 10 }}>
                          <ChangeComposer
                            label={`What should ${shortName(s.owner)} revise?`}
                            value={changeText}
                            onChange={setChangeText}
                            onSend={sendChange}
                            onCancel={() => setChangeFor(null)}
                            sendLabel="Request changes"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* activity timeline */}
          <Card>
            <CardContent className="p-5">
              <div className="text-base font-semibold mb-3">Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {log.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 9999,
                          display: 'grid',
                          placeItems: 'center',
                          background: i === 0 ? 'oklch(from var(--brand-color) l c h / 0.12)' : 'var(--muted)',
                          color: i === 0 ? 'var(--brand-color-dark)' : 'var(--muted-foreground)',
                          flexShrink: 0,
                        }}
                      >
                        <Icon name={e.icon} className="text-xs" />
                      </span>
                      {i < log.length - 1 && (
                        <span style={{ flex: 1, width: 2, background: 'var(--border)', minHeight: 12 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 16, flex: 1 }}>
                      <div className="text-sm" style={{ lineHeight: 1.45 }}>
                        <b>{shortName(e.who)}</b> {e.text}
                      </div>
                      <div className="hint" style={{ marginTop: 2 }}>
                        {e.t}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* right: checklist + roles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 76 }}>
          <Card>
            <CardContent className="p-5">
              <div className="text-sm font-semibold mb-3.5">Pre-publish checklist</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {checklist.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 11 }}>
                    <Icon
                      name={c.ok ? 'circle-check' : 'circle-exclamation'}
                      style={{ color: c.ok ? 'var(--chip-2)' : 'var(--chart-4)', fontSize: 17, marginTop: 1, flexShrink: 0 }}
                    />
                    <div>
                      <div className="text-sm" style={{ fontWeight: 500 }}>
                        {c.ok && c.okLabel ? c.okLabel : c.label}
                      </div>
                      <div className="hint" style={{ marginTop: 2 }}>
                        {c.hint}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="text-sm font-semibold mb-3.5">Who can do what</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { id: 'okafor' as FacultyId, role: 'Course Instructor / TA', can: 'Drafts & submits their delegated section only' },
                  { id: ownerId, role: 'Course Coordinator (Owner)', can: 'Reviews sections, runs Level 1, publishes' },
                  { id: chairId, role: 'Chairperson', can: 'Final Level 2 validation — cannot author or publish' },
                ].map((r) => {
                  const here = actor === r.id
                  return (
                    <div
                      key={r.role}
                      style={{
                        display: 'flex',
                        gap: 11,
                        alignItems: 'flex-start',
                        padding: here ? '8px 10px' : '0',
                        margin: here ? '-8px -10px' : 0,
                        borderRadius: 'var(--radius)',
                        background: here ? 'oklch(from var(--brand-color) l c h / 0.06)' : 'transparent',
                      }}
                    >
                      <Avi id={r.id} size="sm" />
                      <div style={{ flex: 1 }}>
                        <div className="text-sm font-semibold" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          {r.role}
                          {here && (
                            <Badge variant="secondary" style={{ backgroundColor: 'oklch(from var(--brand-color) l c h / 0.14)', color: 'var(--brand-color-dark)' }}>
                              acting
                            </Badge>
                          )}
                        </div>
                        <div className="hint" style={{ marginTop: 2, lineHeight: 1.4 }}>
                          {r.can}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {flags > 0 && (
            <LocalBanner variant="error">
              <b>
                {flags} flagged question{flags !== 1 ? 's' : ''}
              </b>{' '}
              still in the exam. Resolve in the builder before publishing high-stakes exams.
            </LocalBanner>
          )}
        </div>
      </div>

      {guide.on && (
        <GuideRail
          step={gStep}
          idx={guide.i}
          total={journey.length}
          finished={guideFinished}
          onDo={guideDo}
          onBack={() => setGuide((g) => ({ ...g, i: Math.max(0, g.i - 1) }))}
          onSkip={() => setGuide((g) => ({ ...g, i: g.i + 1 }))}
          onRestart={startGuide}
          onClose={() => setGuide({ on: false, i: 0 })}
        />
      )}
    </div>
  )
}

/* Build the guided journey from the actual sections. Demonstrates a section-level
   rework loop on the first delegated section, then the Chairperson send-back loop. */
function buildJourney(sections: Section[], ownerId: FacultyId, chairId: FacultyId): JourneyStep[] {
  const steps: JourneyStep[] = []
  const delegated = sections.filter((s) => s.owner !== ownerId)
  const loopId = (delegated[0] || sections[0] || ({} as Section)).id
  sections.forEach((s) => {
    const who = shortName(s.owner)
    const lbl = secLabel(s)
    steps.push({
      key: `submit-${s.id}`,
      actor: s.owner,
      kind: 'submit',
      secId: s.id,
      doLabel: 'Submit section',
      doIcon: 'paper-plane',
      title: `${who} submits ${lbl}`,
    })
    if (s.id === loopId) {
      steps.push({
        key: `changes-${s.id}`,
        actor: ownerId,
        kind: 'changes',
        secId: s.id,
        branch: true,
        doLabel: 'Request changes',
        doIcon: 'rotate',
        title: `${shortName(ownerId)} requests changes on ${lbl}`,
      })
      steps.push({
        key: `resubmit-${s.id}`,
        actor: s.owner,
        kind: 'resubmit',
        secId: s.id,
        doLabel: 'Re-submit section',
        doIcon: 'rotate',
        title: `${who} fixes it and re-submits ${lbl}`,
      })
    }
    steps.push({
      key: `approve-${s.id}`,
      actor: ownerId,
      kind: 'approve',
      secId: s.id,
      doLabel: 'Approve section',
      doIcon: 'check',
      title: `${shortName(ownerId)} approves ${lbl}`,
    })
  })
  steps.push({
    key: 'l1',
    actor: ownerId,
    kind: 'l1',
    doLabel: 'Send to Chairperson',
    doIcon: 'check-double',
    title: `${shortName(ownerId)} completes Level 1`,
  })
  steps.push({
    key: 'bounce',
    actor: chairId,
    kind: 'bounce',
    branch: true,
    doLabel: 'Send back to owner',
    doIcon: 'rotate',
    title: `${shortName(chairId)} sends the exam back`,
  })
  steps.push({
    key: 'resend',
    actor: ownerId,
    kind: 'resend',
    doLabel: 'Resend to Level 2',
    doIcon: 'paper-plane',
    title: `${shortName(ownerId)} resolves it and resends`,
  })
  steps.push({
    key: 'l2',
    actor: chairId,
    kind: 'l2',
    doLabel: 'Approve — mark Ready',
    doIcon: 'shield-check',
    title: `${shortName(chairId)} gives final approval`,
  })
  steps.push({
    key: 'publish',
    actor: ownerId,
    kind: 'publish',
    doLabel: 'Publish exam',
    doIcon: 'paper-plane',
    title: `${shortName(ownerId)} publishes`,
  })
  return steps
}

/* Inline composer for a request-changes note */
function ChangeComposer({
  label,
  value,
  onChange,
  onSend,
  onCancel,
  sendLabel,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onCancel: () => void
  sendLabel: string
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 'var(--radius)',
        background: 'oklch(from var(--destructive) l c h / 0.05)',
        border: '1px solid oklch(from var(--destructive) l c h / 0.22)',
      }}
    >
      <div className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
        {label}
      </div>
      <Textarea
        aria-label={label}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add a clear, actionable note for the author…"
        className="mb-2.5"
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="destructive" size="sm" onClick={onSend}>
          <Icon name="paper-plane" />
          {sendLabel}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

/* ── Acting-as bar ──────────────────────────────────────────────
   The review screen is collaborative — step into each person to make every
   action performable, so the flow never dead-ends. */
function ActorBar({
  actors,
  actor,
  onActor,
  locked,
}: {
  actors: { id: FacultyId; role: string }[]
  actor: FacultyId
  onActor: (id: FacultyId) => void
  locked: boolean
}) {
  return (
    <Card className="mb-3.5">
      <CardContent className="p-5">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div className="text-sm font-semibold">You're acting as</div>
          {locked && (
            <Badge variant="outline">
              <Icon name="lock" /> Guided — actor follows the walkthrough
            </Badge>
          )}
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          {actors.map((a) => {
            const on = a.id === actor
            return (
              <Button
                key={a.id}
                variant="outline"
                onClick={() => !locked && onActor(a.id)}
                disabled={locked}
                aria-pressed={on}
                style={{
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 13px 9px 9px',
                  borderRadius: 'var(--radius)',
                  textAlign: 'left',
                  opacity: locked && !on ? 0.5 : 1,
                  borderColor: on ? 'var(--brand-color)' : 'var(--border)',
                  background: on ? 'oklch(from var(--brand-color) l c h / 0.05)' : 'var(--card)',
                }}
              >
                <Avi id={a.id} size="sm" />
                <div style={{ lineHeight: 1.25 }}>
                  <div className="text-sm font-semibold" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {FACULTY[a.id].name}
                    {on && (
                      <Badge variant="secondary" style={{ backgroundColor: 'oklch(from var(--brand-color) l c h / 0.14)', color: 'var(--brand-color-dark)' }}>
                        you
                      </Badge>
                    )}
                  </div>
                  <div className="hint text-xs">{a.role}</div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Journey map ────────────────────────────────────────────────
   The complete path drawn once, with the two ways work loops BACK:
   1) a section bounced at Level 1 returns to its author
   2) the exam bounced at Level 2 returns to the owner */
function JourneyMap({ stage, secState, bounced }: { stage: Stage; secState: Record<string, string>; bounced: boolean }) {
  const vals = Object.values(secState)
  const allApproved = vals.length > 0 && vals.every((v) => v === 'approved')
  const curIdx = stage === 'l1' ? (allApproved ? 1 : 0) : STAGE_ORDER.indexOf(stage)
  const changeN = vals.filter((v) => v === 'changes').length

  return (
    <Card className="mb-3.5">
      <CardContent className="p-5">
        <div className="text-base font-semibold mb-4">The journey, end to end</div>

        {/* forward path */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, position: 'relative' }}>
          {STAGE_ORDER.map((st, i) => {
            const m = STAGE_META[st]
            const done = i < curIdx
            const active = i === curIdx
            return (
              <div
                key={st}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '0 6px',
                }}
              >
                {i < STAGE_ORDER.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 22,
                      left: 'calc(50% + 24px)',
                      right: 'calc(-50% + 24px)',
                      height: 2,
                      background: i < curIdx ? 'var(--chip-2)' : 'var(--border)',
                    }}
                  />
                )}
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 9999,
                    display: 'grid',
                    placeItems: 'center',
                    background: done ? 'var(--chip-2)' : active ? 'var(--brand-color)' : 'var(--muted)',
                    color: done || active ? 'white' : 'var(--muted-foreground)',
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: active ? '0 0 0 5px oklch(from var(--brand-color) l c h / 0.14)' : 'none',
                  }}
                >
                  <Icon name={done ? 'check' : m.icon} style={{ fontSize: 19 }} />
                </div>
                <div
                  className="text-xs"
                  style={{
                    fontWeight: active || done ? 700 : 600,
                    marginTop: 10,
                    color: active || done ? 'var(--foreground)' : 'var(--muted-foreground)',
                  }}
                >
                  {m.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* loopback branches — condensed to one line each */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
          <BranchCard
            active={changeN > 0}
            from="Level 1"
            to="author"
            title="Request changes (section)"
          />
          <BranchCard active={!!bounced} from="Level 2" to="owner" title="Send back (whole exam)" />
        </div>
      </CardContent>
    </Card>
  )
}

function BranchCard({ from, to, title, active }: { from: string; to: string; title: string; active: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '11px 13px',
        borderRadius: 'var(--radius)',
        border: `1px dashed oklch(from var(--destructive) l c h / ${active ? 0.45 : 0.3})`,
        background: active ? 'oklch(from var(--destructive) l c h / 0.06)' : 'oklch(from var(--destructive) l c h / 0.03)',
      }}
    >
      <Icon name="rotate" style={{ fontSize: 16, color: 'var(--destructive)', flexShrink: 0 }} />
      <div className="text-sm font-semibold" style={{ color: 'var(--destructive)', display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
        {title}
        <span className="hint text-xs" style={{ fontWeight: 500 }}>
          {from} <Icon name="arrow-right" /> {to}
        </span>
      </div>
    </div>
  )
}

/* ── Guide rail — draggable bottom walkthrough player ──────────────
   Drives the whole flow one step at a time. Drag the grip handle to
   reposition so it never blocks other controls. */
function GuideRail({
  step,
  idx,
  total,
  onDo,
  onBack,
  onSkip,
  onClose,
  finished,
  onRestart,
}: {
  step: JourneyStep | null
  idx: number
  total: number
  onDo: () => void
  onBack: () => void
  onSkip: () => void
  onClose: () => void
  finished: boolean
  onRestart: () => void
}) {
  // null = default (bottom-center via CSS); once dragged, stores {x,y} from top-left
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null)

  function onGripDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.closest('[data-guide-rail]')!.getBoundingClientRect()
    dragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
  }
  function onGripMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragOffset.current) return
    setPos({ x: e.clientX - dragOffset.current.dx, y: e.clientY - dragOffset.current.dy })
  }
  function onGripUp() { dragOffset.current = null }

  const dynamicStyle: CSSProperties = pos
    ? { ...guideRailStyle, left: pos.x, top: pos.y, bottom: 'auto', transform: 'none' }
    : guideRailStyle
  const gripHandle = (
    <div
      onPointerDown={onGripDown}
      onPointerMove={onGripMove}
      onPointerUp={onGripUp}
      title="Drag to move"
      aria-label="Drag guide rail"
      style={{ cursor: 'grab', flexShrink: 0, padding: '4px 6px', color: 'var(--muted-foreground)', display: 'grid', placeItems: 'center' }}
    >
      <Icon name="grip-dots-vertical" style={{ fontSize: 13 }} />
    </div>
  )

  if (finished || !step) {
    return (
      <div data-guide-rail style={dynamicStyle}>
        {gripHandle}
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: 9999,
            display: 'grid',
            placeItems: 'center',
            background: 'oklch(from var(--chart-2) l c h / 0.14)',
            color: 'var(--chip-2)',
            flexShrink: 0,
          }}
        >
          <Icon name="circle-check" style={{ fontSize: 19 }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="text-sm font-semibold">You walked the full journey 🎉</div>
          <div className="hint" style={{ lineHeight: 1.4 }}>
            Authoring → Level 1 (with a rework loop) → Level 2 (with a send-back) → Ready → Published.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={onRestart}>
            <Icon name="rotate" />
            Replay
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Exit guide
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div data-guide-rail style={dynamicStyle}>
      {gripHandle}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <Avi id={step.actor} size="default" />
        <span className="hint text-xs" style={{ fontWeight: 600 }}>
          {idx + 1}/{total}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-sm font-semibold" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {step.branch && (
            <Badge variant="secondary" style={{ backgroundColor: 'oklch(from var(--destructive) l c h / 0.12)', color: 'var(--destructive)' }}>
              branch
            </Badge>
          )}
          {step.title}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
        <Button variant="ghost" size="icon-sm" onClick={onBack} disabled={idx === 0} aria-label="Previous step">
          <Icon name="arrow-left" />
        </Button>
        <Button size="sm" onClick={onDo} style={{ whiteSpace: 'nowrap' }}>
          <Icon name={step.doIcon || 'check'} />
          {step.doLabel}
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip} title="Skip this step">
          Skip
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onClose} title="Exit guide" aria-label="Exit guide">
          <Icon name="xmark" />
        </Button>
      </div>
    </div>
  )
}
const guideRailStyle: CSSProperties = {
  position: 'fixed',
  left: '50%',
  bottom: 20,
  transform: 'translateX(-50%)',
  zIndex: 250,
  width: 'min(880px, calc(100vw - 40px))',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg, 15px)',
  boxShadow: 'var(--shadow-lg, 0 16px 40px rgba(0,0,0,.18))',
  padding: '12px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
}
