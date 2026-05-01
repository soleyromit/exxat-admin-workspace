'use client'

import { useParams } from 'next/navigation'
import { Badge, Button, Separator, SidebarTrigger } from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { MOCK_RESPONSES, FACULTY_SECTION_LABELS, SECTION_LABELS } from '@/lib/pce-mock-data'
import type { TemplateSection, ResponseComment } from '@/lib/pce-mock-data'
import Link from 'next/link'

type Sentiment = 'positive' | 'neutral' | 'concern'

const SENTIMENT_CONFIG: Record<Sentiment, {
  icon: string
  label: string
  countSuffix: string
  containerBorder: string
  headerBg: string
  labelColor: string
  countBg: string
  quotesBg: string
  quotesBorder: string
  quoteDivider: string
}> = {
  positive: {
    icon: 'fa-light fa-face-smile',
    label: 'What students appreciated',
    countSuffix: 'highlight',
    containerBorder: 'color-mix(in oklch, var(--chart-2) 30%, transparent)',
    headerBg:       'color-mix(in oklch, var(--chart-2) 12%, transparent)',
    labelColor:     'color-mix(in oklch, var(--chart-2) 80%, var(--foreground))',
    countBg:        'color-mix(in oklch, var(--chart-2) 20%, transparent)',
    quotesBg:       'color-mix(in oklch, var(--chart-2) 8%, transparent)',
    quotesBorder:   'color-mix(in oklch, var(--chart-2) 25%, transparent)',
    quoteDivider:   'color-mix(in oklch, var(--chart-2) 20%, transparent)',
  },
  neutral: {
    icon: 'fa-light fa-face-meh',
    label: 'Students also noted',
    countSuffix: 'observation',
    containerBorder: 'var(--border)',
    headerBg:        'var(--muted)',
    labelColor:      'var(--muted-foreground)',
    countBg:         'var(--border)',
    quotesBg:        'var(--muted)',
    quotesBorder:    'var(--border)',
    quoteDivider:    'var(--border-control)',
  },
  concern: {
    icon: 'fa-light fa-thumbtack',
    label: 'Areas for consideration',
    countSuffix: 'consideration',
    containerBorder: 'color-mix(in oklch, var(--chart-4) 30%, transparent)',
    headerBg:        'var(--insight-severity-warning-bg)',
    labelColor:      'var(--insight-severity-warning-fg)',
    countBg:         'color-mix(in oklch, var(--chart-4) 20%, transparent)',
    quotesBg:        'var(--insight-severity-warning-bg)',
    quotesBorder:    'color-mix(in oklch, var(--chart-4) 25%, transparent)',
    quoteDivider:    'color-mix(in oklch, var(--chart-4) 20%, transparent)',
  },
}

function CommentGroup({
  sentiment,
  comments,
}: {
  sentiment: Sentiment
  comments: Pick<ResponseComment, 'text'>[]
}) {
  if (comments.length === 0) return null
  const cfg = SENTIMENT_CONFIG[sentiment]
  const countLabel = `${comments.length} ${cfg.countSuffix}${comments.length !== 1 ? 's' : ''}`

  return (
    <div style={{ border: `1px solid ${cfg.containerBorder}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ background: cfg.headerBg, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 7 }}>
        <i className={cfg.icon} aria-hidden="true" style={{ fontSize: 13, color: cfg.labelColor }} />
        <span className="text-xs font-bold flex-1" style={{ color: cfg.labelColor }}>{cfg.label}</span>
        <span className="text-[10px] font-semibold" style={{
          padding: '1px 6px', borderRadius: 10,
          background: cfg.countBg, color: cfg.labelColor,
        }}>
          {countLabel}
        </span>
      </div>
      <div style={{ background: cfg.quotesBg, borderTop: `1px solid ${cfg.quotesBorder}`, padding: '2px 10px 7px' }}>
        {comments.map((comment, i) => (
          <div
            key={i}
            className="text-foreground"
            style={{
              fontSize: 11,
              fontStyle: 'italic',
              padding: '5px 0',
              borderBottom: i < comments.length - 1 ? `1px dashed ${cfg.quoteDivider}` : 'none',
              lineHeight: 1.5,
            }}
          >
            &ldquo;{comment.text}&rdquo;
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FacultyResultsPage() {
  const { id } = useParams<{ id: string }>()
  const { surveys, templates, hiddenComments } = usePce()

  const survey = surveys.find(s => s.id === id)
  const template = survey ? templates.find(t => t.id === survey.templateId) : null
  const isReleased = survey?.status === 'released' || survey?.status === 'closed'
  const responses = isReleased ? MOCK_RESPONSES.find(r => r.surveyId === id) : null
  const hidden = hiddenComments[id] ?? []

  if (!survey) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
        <p className="text-sm font-medium">Survey not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/my-surveys">Back to My Surveys</Link>
        </Button>
      </div>
    )
  }

  const sharedDate = survey.status === 'released' && survey.releasedAt
    ? `Shared ${survey.releasedAt}`
    : null

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/my-surveys" className="text-sm text-muted-foreground">My Surveys</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold flex-1 truncate">
          {survey.courseCode} — {survey.courseName}
        </span>
        {sharedDate ? (
          <Badge variant="secondary" className="rounded-full font-medium">{sharedDate}</Badge>
        ) : (
          <SurveyStatusBadge status={survey.status} />
        )}
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        {!isReleased ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              <i className="fa-light fa-lock-keyhole text-muted-foreground" aria-hidden="true"
                style={{ fontSize: 28 }} />
            </div>
            <div className="flex flex-col gap-2 max-w-sm">
              <p className="text-base font-semibold">Results aren&apos;t available yet</p>
              <p className="text-sm text-muted-foreground">
                The program administrator reviews all responses before sharing them with instructors.
                You&apos;ll be notified when your results are ready.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/my-surveys">Back to My Surveys</Link>
            </Button>
          </div>
        ) : !responses ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <i className="fa-light fa-chart-bar text-4xl text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">No responses were collected for this survey.</p>
          </div>
        ) : (
          <div className="max-w-2xl flex flex-col gap-6">
            {template?.sections.map((section: TemplateSection) => {
              const sectionScore = responses.sectionScores.find(s => s.section === section)
              if (!sectionScore) return null

              const sectionComments = responses.comments
                .map((c, i) => ({ ...c, globalIndex: i }))
                .filter(c => c.section === section && !hidden.includes(c.globalIndex))

              const positive = sectionComments.filter(c => c.sentiment === 'positive').slice(0, 3)
              const neutral  = sectionComments.filter(c => c.sentiment === 'neutral').slice(0, 3)
              const concern  = sectionComments.filter(c => c.sentiment === 'concern').slice(0, 3)
              const hasAnyComments = positive.length + neutral.length + concern.length > 0

              const sectionLabel = FACULTY_SECTION_LABELS[section] ?? SECTION_LABELS[section]

              return (
                <div key={section} className="border border-border rounded-lg overflow-hidden">
                  {/* Section header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="text-sm font-semibold">{sectionLabel}</h2>
                    <span className="text-sm font-bold tabular-nums">avg {sectionScore.avg}/5</span>
                  </div>

                  {/* Score bar */}
                  <div className="px-4 py-4 border-b border-border flex flex-col gap-2">
                    <div style={{ height: 8, borderRadius: 4, backgroundColor: 'var(--muted)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(sectionScore.avg / 5) * 100}%`,
                          borderRadius: 4,
                          backgroundColor: 'var(--brand-color)',
                          transition: 'width 600ms ease',
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Based on {sectionScore.count} responses
                    </p>
                  </div>

                  {/* Three sentiment groups */}
                  {hasAnyComments && (
                    <div className="px-3 py-3 flex flex-col gap-2">
                      <CommentGroup sentiment="positive" comments={positive} />
                      <CommentGroup sentiment="neutral"  comments={neutral}  />
                      <CommentGroup sentiment="concern"  comments={concern}  />
                    </div>
                  )}

                  {/* Attribution */}
                  {hasAnyComments && (
                    <div
                      className="px-4 py-2.5 text-center"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <span className="text-xs text-muted-foreground">
                        Highlights selected by your program administrator
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
