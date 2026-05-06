/**
 * POST-RESULTS CHAT — Aarti's "configurable communication channel".
 *
 * Per Aarti's email: "Post-results communication, such as a chat feature
 * between students and faculty, should be configurable at the institution
 * or course level, given that direct communication is typically discouraged
 * in academic settings."
 *
 * This surface is reachable only when:
 *   1. Institution has chat capability ON (admin Settings · Communication)
 *   2. Course has chat ON (or default carries through)
 *   3. The specific assessment has chat enabled
 *
 * For the demo we mock the gate as "ON" and show the canonical layout:
 *   - Header with assessment context
 *   - Threaded message list (student/faculty bubbles)
 *   - Compose box with character count + send
 *
 * Real backend will add: read receipts, typing, attachments, faculty
 * office-hours window, profanity/escalation flagging.
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Avatar, AvatarFallback,
  Badge, Button,
  Textarea,
} from '@exxat/ds/packages/ui/src'
import { tokens } from '../tokens/design-tokens'

interface Message {
  id: string
  from: 'student' | 'faculty'
  authorName: string
  authorInitials: string
  text: string
  timestamp: string
  isQuestionRef?: { questionNumber: number; topic: string }
}

const MOCK_THREAD: Message[] = [
  {
    id: '1',
    from: 'faculty',
    authorName: 'Dr. James Patel',
    authorInitials: 'JP',
    text: 'Hi Ramona — your results are now published. If you have any questions about specific items or your overall performance, this is the channel to use.',
    timestamp: '2026-05-04T15:30:00',
  },
  {
    id: '2',
    from: 'student',
    authorName: 'Ramona Sanchez',
    authorInitials: 'RS',
    text: 'Thank you. I had a question about Q14 — I selected B but the rationale shows D as correct. Could you clarify?',
    timestamp: '2026-05-04T16:12:00',
    isQuestionRef: { questionNumber: 14, topic: 'Pharmacokinetics — half-life' },
  },
  {
    id: '3',
    from: 'faculty',
    authorName: 'Dr. James Patel',
    authorInitials: 'JP',
    text: 'Good catch — that question came up in my review queue. The chair and I are reviewing whether to credit B as also correct. I\'ll update you by Friday.',
    timestamp: '2026-05-04T17:05:00',
  },
]

export function ResultsChat() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<Message[]>(MOCK_THREAD)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest on mount and when a new message lands
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length])

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setMessages(prev => [
      ...prev,
      {
        id: String(Date.now()),
        from: 'student',
        authorName: 'Ramona Sanchez',
        authorInitials: 'RS',
        text,
        timestamp: new Date().toISOString(),
      },
    ])
    setDraft('')
  }

  const charCount = draft.length
  const charLimit = 1000

  return (
    <div className="flex flex-col h-full">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between flex-shrink-0 border-b border-border px-6 py-4"
        style={{ background: 'var(--card)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/exam/${id}/results`)}
            aria-label="Back to results"
          >
            <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 16 }} />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate font-heading">
              Pharmacokinetics Final · Faculty Q&amp;A
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              Channel open until 2026-05-11 · Replies typically within 24 hours
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="rounded-full gap-1.5"
          style={{
            backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))',
            color: 'var(--brand-color)',
          }}
        >
          <i className="fa-light fa-shield-check" aria-hidden="true" style={{ fontSize: 11 }} />
          Course-approved
        </Badge>
      </header>

      {/* ─── Thread ─────────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6" style={{ background: 'var(--background)' }}>
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <FacultyOfficeNotice />
          {messages.map(m => <MessageBubble key={m.id} m={m} />)}
        </div>
      </div>

      {/* ─── Compose ─────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 border-t border-border px-6 py-4"
        style={{ background: 'var(--card)' }}
      >
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <div className="flex-1">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, charLimit))}
              placeholder="Ask about a question, your performance, or follow-up steps…"
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  send()
                }
              }}
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-muted-foreground">
                <i className="fa-light fa-circle-info me-1" aria-hidden="true" />
                Faculty review messages post-exam · keep it constructive
              </span>
              <span className={`text-[11px] tabular-nums ${charCount > charLimit * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {charCount}/{charLimit}
              </span>
            </div>
          </div>
          <Button onClick={send} disabled={!draft.trim()} className="gap-2">
            <i className="fa-light fa-paper-plane" aria-hidden="true" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

function FacultyOfficeNotice() {
  return (
    <div
      className="rounded-xl border-l-4 px-4 py-3 flex items-start gap-3"
      style={{
        background: 'color-mix(in oklch, var(--brand-color) 6%, var(--card))',
        borderLeftColor: 'var(--brand-color)',
        border: '1px solid var(--border)',
      }}
    >
      <i className="fa-duotone fa-solid fa-circle-info" style={{ color: 'var(--brand-color)', fontSize: 16, marginTop: 2 }} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Course-level Q&amp;A is enabled for this assessment</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Your institution has opted in to post-results faculty Q&amp;A for this course.
          Messages are reviewed by your course coordinator. For grade disputes, please follow the formal academic appeals process via the registrar.
        </p>
      </div>
    </div>
  )
}

function MessageBubble({ m }: { m: Message }) {
  const isStudent = m.from === 'student'
  const time = new Date(m.timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className={`flex gap-3 ${isStudent ? 'flex-row-reverse' : ''}`}>
      <Avatar className="size-8 shrink-0">
        <AvatarFallback
          className="text-[10px] font-bold"
          style={
            isStudent
              ? { background: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }
              : { background: 'var(--foreground)', color: 'var(--background)' }
          }
        >
          {m.authorInitials}
        </AvatarFallback>
      </Avatar>

      <div className={`flex flex-col gap-1 max-w-[75%] ${isStudent ? 'items-end' : 'items-start'}`}>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-foreground">{m.authorName}</span>
          {!isStudent && (
            <Badge
              variant="secondary"
              className="rounded font-mono text-[9px] uppercase tracking-wider"
              style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              Faculty
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">{time}</span>
        </div>

        {m.isQuestionRef && (
          <div
            className="text-[11px] rounded-md px-2 py-1 flex items-center gap-1.5"
            style={{
              background: 'color-mix(in oklch, var(--chart-1) 8%, var(--card))',
              border: '1px solid color-mix(in oklch, var(--chart-1) 20%, transparent)',
            }}
          >
            <i className="fa-light fa-link-simple" aria-hidden="true" style={{ fontSize: 10, color: 'var(--chart-1)' }} />
            <span className="font-medium text-foreground">Question {m.isQuestionRef.questionNumber}</span>
            <span className="text-muted-foreground">· {m.isQuestionRef.topic}</span>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isStudent ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
          style={
            isStudent
              ? { background: 'var(--brand-color)', color: 'var(--brand-foreground)' }
              : { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }
          }
        >
          {m.text}
        </div>
      </div>
    </div>
  )
}
