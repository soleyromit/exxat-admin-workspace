'use client'

import { useState } from 'react'
import {
  Button, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { MOCK_RESPONSES, MOCK_TERMS, SECTION_LABELS } from '@/lib/pce-mock-data'

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        style={{
          height: 6,
          width: 80,
          borderRadius: 3,
          backgroundColor: 'var(--pce-rate-bar-track)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(score / max) * 100}%`,
            borderRadius: 3,
            backgroundColor: 'var(--pce-rate-bar-fill)',
          }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums">{score}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const { surveys } = usePce()
  const [term, setTerm] = useState('Spring 2026')

  const termSurveys = surveys.filter(s => s.term === term)
  const releasedSurveys = termSurveys.filter(s => s.status === 'released' || s.status === 'closed')

  const totalRate = termSurveys.length > 0
    ? Math.round(termSurveys.reduce((acc, s) => acc + s.responseRate, 0) / termSurveys.length)
    : 0

  const completedCount = releasedSurveys.length

  // Aggregate section scores across all responses for this term
  const termResponses = MOCK_RESPONSES.filter(r =>
    termSurveys.some(s => s.id === r.surveyId)
  )

  const sectionAvgs: Record<string, number[]> = {}
  termResponses.forEach(r => {
    r.sectionScores.forEach(s => {
      if (!sectionAvgs[s.section]) sectionAvgs[s.section] = []
      sectionAvgs[s.section].push(s.avg)
    })
  })

  const sectionSummary = Object.entries(sectionAvgs).map(([section, avgs]) => ({
    section,
    avg: Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10,
  }))

  // Per-course breakdown
  const courseBreakdown = termSurveys.map(survey => {
    const resp = MOCK_RESPONSES.find(r => r.surveyId === survey.id)
    return {
      survey,
      scores: resp?.sectionScores ?? [],
    }
  })

  const hasData = termSurveys.length > 0

  return (
    <>
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-semibold flex-1">Analytics</h1>
        <Select value={term} onValueChange={setTerm}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOCK_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" style={{ fontSize: 12 }} />
          Export
        </Button>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <i className="fa-light fa-chart-mixed" aria-hidden="true" style={{ fontSize: 40, color: 'var(--muted-foreground)' }} />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">No analytics data for {term}</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 320 }}>
                Release surveys to faculty to see aggregated results here.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-4xl">

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Response rates card */}
              <div className="border border-border rounded-lg p-5 flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                  Response Rates
                </p>
                <div className="flex flex-col gap-1">
                  <p className="text-2xl font-bold tabular-nums">{totalRate}%</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    overall average
                  </p>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'var(--pce-rate-bar-track)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${totalRate}%`,
                      borderRadius: 4,
                      backgroundColor: 'var(--pce-rate-bar-fill)',
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {completedCount} of {termSurveys.length} surveys complete
                </p>
              </div>

              {/* Avg scores card */}
              <div className="border border-border rounded-lg p-5 flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                  Avg Scores by Section
                </p>
                {sectionSummary.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {sectionSummary.map(({ section, avg }) => (
                      <div key={section} className="flex items-center justify-between gap-3">
                        <span className="text-sm flex-1" style={{ color: 'var(--muted-foreground)' }}>
                          {SECTION_LABELS[section as keyof typeof SECTION_LABELS] ?? section}
                        </span>
                        <ScoreBar score={avg} />
                        <span className="text-xs w-6 text-right" style={{ color: 'var(--muted-foreground)' }}>/5</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No released data yet.</p>
                )}
              </div>
            </div>

            {/* By course table */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold">By Course</h2>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>CC</TableHead>
                      <TableHead>FP</TableHead>
                      <TableHead>CD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseBreakdown.map(({ survey, scores }) => {
                      const cc = scores.find(s => s.section === 'course_content')
                      const fp = scores.find(s => s.section === 'faculty_performance')
                      const cd = scores.find(s => s.section === 'course_director')
                      const primary = survey.instructors.find(i => i.role === 'primary')
                      return (
                        <TableRow key={survey.id}>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-sm">{survey.courseCode}</span>
                              <span className="text-xs truncate max-w-32" style={{ color: 'var(--muted-foreground)' }}>
                                {survey.courseName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{primary?.name ?? '—'}</TableCell>
                          <TableCell>
                            <span className="text-sm tabular-nums font-medium">{survey.responseRate}%</span>
                          </TableCell>
                          <TableCell>
                            {cc ? <span className="text-sm tabular-nums">{cc.avg}</span> : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                          </TableCell>
                          <TableCell>
                            {fp ? <span className="text-sm tabular-nums">{fp.avg}</span> : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                          </TableCell>
                          <TableCell>
                            {cd ? <span className="text-sm tabular-nums">{cd.avg}</span> : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

          </div>
        )}
      </main>
    </>
  )
}
