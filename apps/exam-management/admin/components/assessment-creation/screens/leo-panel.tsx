'use client'

/* Leo AI assistant — slide-in panel opened by every "Ask Leo" entry point */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, Button, Card, Input } from '@exxatdesignux/ui'
import { Icon, LeoStar } from '../icons'
import {
  QTYPE,
  aggregatePsy,
  fmt2,
  diffColor,
  discColor,
  pbiColor,
  type Section,
  type Question,
  type PsyAgg,
} from '../data'

interface FlagPayload {
  stem: string
  reason: string
  id: string
}

type Block =
  | { t: 'text'; v: string }
  | { t: 'stats'; v: { l: string; v: string | number; c?: string }[] }
  | { t: 'flag'; v: FlagPayload }

type Msg = { who: 'me'; text: string } | { who: 'leo'; blocks: Block[] }

interface Analysis {
  psy: PsyAgg
  flags: Question[]
  mix: string
  n: number
}

function leoAnalysis(sections: Section[]): Analysis {
  const all: Question[] = ([] as Question[]).concat(...sections.map(s => s.questions))
  const psy = aggregatePsy(all)
  const flags = all.filter(q => q.flagged)
  const typeCount: Record<string, number> = {}
  all.forEach(q => {
    const short = QTYPE[q.type].short
    typeCount[short] = (typeCount[short] || 0) + 1
  })
  const mix = Object.entries(typeCount)
    .map(([k, v]) => `${v} ${k}`)
    .join(' · ')
  return { psy, flags, mix, n: all.length }
}

export function LeoPanel({
  open,
  ctx,
  sections,
  onClose,
  onReplace,
}: {
  open: boolean
  ctx: { title?: string; intro?: string; suggestions?: string[] } | null
  sections: Section[]
  onClose: () => void
  onReplace: (q: Question) => void
}) {
  const a = useMemo(() => leoAnalysis(sections || []), [sections, open])
  const [thread, setThread] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    // seed the opening analysis based on context
    const intro = ctx?.intro || `Here's a read on **${ctx?.title || 'this assessment'}**.`
    setThread([{ who: 'leo', blocks: buildIntro(a, intro) }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ctx])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [thread])

  function send(q: string) {
    if (!q.trim()) return
    const reply = cannedReply(q, a)
    setThread(t => [...t, { who: 'me', text: q }, { who: 'leo', blocks: reply }])
    setInput('')
  }

  const suggestions = ctx?.suggestions || [
    'Which questions should I replace?',
    'Is the difficulty balanced?',
    'Summarize this exam for the reviewer',
  ]

  if (!open) return null
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="right" className="w-[440px] p-0 flex flex-col gap-0">
        <SheetHeader className="flex-row items-center gap-3 px-4 py-3 border-b border-border space-y-0">
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: 'var(--leo-gradient)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <LeoStar style={{ color: 'white', fontSize: 16, filter: 'brightness(3)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <SheetTitle style={{ fontSize: 15, fontWeight: 600 }}>Leo</SheetTitle>
            <div className="hint">AI authoring assistant</div>
          </div>
        </SheetHeader>
        <div
          ref={bodyRef}
          style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'oklch(from var(--brand-rose-500) l c h / 0.025)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {thread.map((m, i) =>
              m.who === 'me' ? (
                <div
                  key={i}
                  style={{
                    alignSelf: 'flex-end',
                    maxWidth: '85%',
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: '14px 14px 4px 14px',
                    padding: '9px 13px',
                    fontSize: 13,
                  }}
                >
                  {m.text}
                </div>
              ) : (
                <div key={i} style={{ display: 'flex', gap: 9 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: 'var(--leo-gradient)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <LeoStar style={{ color: 'white', fontSize: 12, filter: 'brightness(3)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    {m.blocks.map((b, j) => (
                      <LeoBlock key={j} b={b} onReplace={onReplace} />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
        <div style={{ padding: '10px 16px 6px', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {suggestions.map(s => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => send(s)}
            >
              {s}
            </Button>
          ))}
        </div>
        <div style={{ padding: '6px 16px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input
            placeholder="Ask Leo anything…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') send(input)
            }}
          />
          <Button variant="default" aria-label="Send message to Leo" onClick={() => send(input)}>
            <LeoStar style={{ filter: 'brightness(3)' }} />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function LeoBlock({ b, onReplace }: { b: Block; onReplace: (q: Question) => void }) {
  if (b.t === 'text')
    return (
      <div
        style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}
        dangerouslySetInnerHTML={{ __html: mdBold(b.v) }}
      />
    )
  if (b.t === 'stats')
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '4px 0 10px' }}>
        {b.v.map(s => (
          <Card key={s.l} style={{ padding: '8px 11px', borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{s.l}</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                fontSize: 18,
                color: s.c || 'var(--foreground)',
              }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>
    )
  if (b.t === 'flag')
    return (
      <Card
        style={{
          padding: '11px 13px',
          borderRadius: 12,
          marginBottom: 8,
          borderColor: 'oklch(from var(--destructive) l c h / 0.3)',
        }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
          <Icon name="triangle-exclamation" style={{ color: 'var(--destructive)', fontSize: 13, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>{b.v.stem}</div>
        </div>
        <div className="hint" style={{ marginBottom: 9 }}>
          {b.v.reason}
        </div>
        {onReplace && (
          <Button
            variant="default"
            size="sm"
            onClick={() =>
              onReplace({ id: b.v.id, stem: b.v.stem, flagged: { reason: b.v.reason } } as Question)
            }
          >
            <LeoStar style={{ filter: 'brightness(3)' }} />
            Suggest replacement
          </Button>
        )}
      </Card>
    )
  return null
}

function buildIntro(a: Analysis, intro: string): Block[] {
  const blocks: Block[] = [{ t: 'text', v: intro }]
  blocks.push({
    t: 'stats',
    v: [
      { l: 'Questions', v: a.n },
      { l: 'Difficulty index', v: fmt2(a.psy.p), c: diffColor(a.psy.p) },
      { l: 'Discrimination', v: fmt2(a.psy.disc), c: discColor(a.psy.disc) },
      { l: 'Avg. pt-biserial', v: fmt2(a.psy.pbi), c: pbiColor(a.psy.pbi) },
    ],
  })
  blocks.push({ t: 'text', v: `Question mix: ${a.mix}.` })
  if (a.flags.length) {
    blocks.push({
      t: 'text',
      v: `**${a.flags.length} question${
        a.flags.length > 1 ? 's are' : ' is'
      } pulling your psychometric profile out of range.** I'd review or replace ${
        a.flags.length > 1 ? 'these' : 'this'
      }:`,
    })
    a.flags.forEach(f =>
      blocks.push({ t: 'flag', v: { stem: f.stem, reason: f.flagged!.reason, id: f.id } })
    )
  } else {
    blocks.push({
      t: 'text',
      v: 'No outlier questions — the exam is within a healthy psychometric range.',
    })
  }
  return blocks
}

function cannedReply(q: string, a: Analysis): Block[] {
  const s = q.toLowerCase()
  if (s.includes('replace') || s.includes('which question')) {
    if (!a.flags.length)
      return [
        {
          t: 'text',
          v: "Nothing needs replacing right now — every item discriminates well. I'll flag anything that drifts as you keep editing.",
        },
      ]
    return [
      {
        t: 'text',
        v: `I'd prioritize ${a.flags.length} item${
          a.flags.length > 1 ? 's' : ''
        }. Each has an equally-relevant, previously-unused alternate in the bank:`,
      },
      ...a.flags.map(
        f => ({ t: 'flag', v: { stem: f.stem, reason: f.flagged!.reason, id: f.id } }) as Block
      ),
    ]
  }
  if (s.includes('difficulty') || s.includes('balance'))
    return [
      {
        t: 'text',
        v: `Average difficulty index is **${fmt2(a.psy.p)}** — ${
          a.psy.p > 0.8
            ? 'on the easy side; consider adding harder application items.'
            : a.psy.p < 0.4
              ? 'quite hard; a few recall items would balance it.'
              : 'right in the target 0.4–0.8 band.'
        }`,
      },
      {
        t: 'stats',
        v: [
          { l: 'Difficulty', v: fmt2(a.psy.p), c: diffColor(a.psy.p) },
          { l: 'Discrimination', v: fmt2(a.psy.disc), c: discColor(a.psy.disc) },
        ],
      },
    ]
  if (s.includes('summar'))
    return [
      {
        t: 'text',
        v: `**Reviewer summary.** ${a.n} questions (${a.mix}). Difficulty index ${fmt2(
          a.psy.p
        )}, discrimination ${fmt2(a.psy.disc)}, average point-biserial ${fmt2(a.psy.pbi)}. ${
          a.flags.length ? a.flags.length + ' item(s) flagged for review.' : 'No psychometric outliers.'
        } Topic coverage spans antihypertensives, antiarrhythmics, heart failure, and anticoagulation.`,
      },
    ]
  return [
    {
      t: 'text',
      v: 'I can generate questions, replace weak items, run semantic bank searches, or summarize the exam for your reviewer. Try one of the suggestions above.',
    },
  ]
}

function mdBold(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
}
