'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  SidebarTrigger, Separator, Skeleton,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { ResponseGauge } from '@/components/pce/response-gauge'
import { MOCK_TERMS } from '@/lib/pce-mock-data'
import { useState } from 'react'
import Link from 'next/link'

const FACULTY_ID = 'f1'

export default function MySurveysPage() {
  return (
    <Suspense fallback={<MySurveysSkeleton />}>
      <MySurveysContent />
    </Suspense>
  )
}

function MySurveysContent() {
  const { surveys } = usePce()
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter')
  const [term, setTerm] = useState('Spring 2026')

  const mySurveys = surveys.filter(s =>
    s.instructors.some(i => i.id === FACULTY_ID) && s.term === term
  )

  const displayed = filterParam === 'released'
    ? mySurveys.filter(s => s.status === 'released' || s.status === 'closed')
    : mySurveys

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="flex-1" style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>
          {filterParam === 'released' ? 'Results' : 'My Surveys'}
        </h1>
        <Select value={term} onValueChange={setTerm}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOCK_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '0 28px 28px' }}>
        {displayed.length === 0 ? (
          <EmptyFaculty filterParam={filterParam} term={term} />
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response rate</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Results</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map(survey => {
                  const isReleased = survey.status === 'released' || survey.status === 'closed'
                  return (
                    <TableRow key={survey.id}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{survey.courseCode}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{survey.courseName}</span>
                        </div>
                      </TableCell>
                      <TableCell><SurveyStatusBadge status={survey.status} /></TableCell>
                      <TableCell>
                        <ResponseGauge
                          rate={survey.responseRate}
                          responseCount={survey.responseCount}
                          enrollmentCount={survey.enrollmentCount}
                          showBar={survey.responseRate > 0}
                        />
                      </TableCell>
                      <TableCell style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)' }}>
                        {survey.deadline}
                      </TableCell>
                      <TableCell>
                        {isReleased ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/my-surveys/${survey.id}/results`}>
                              View Results
                              <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 11 }} />
                            </Link>
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1.5" style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                            <i className="fa-light fa-lock-keyhole" aria-hidden="true" style={{ fontSize: 12 }} />
                            Pending review
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </>
  )
}

function MySurveysSkeleton() {
  return (
    <>
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-4 w-24" />
      </header>
      <main className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      </main>
    </>
  )
}

function EmptyFaculty({ filterParam, term }: { filterParam: string | null; term: string }) {
  if (filterParam === 'released') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <i className="fa-light fa-chart-bar" aria-hidden="true" style={{ fontSize: 40, color: 'var(--muted-foreground)' }} />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">No results available for {term}</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 320 }}>
            Results will appear here once your surveys are released by the program administrator.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 40, color: 'var(--muted-foreground)' }} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">No surveys assigned to you for {term}</p>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 360 }}>
          Contact your program administrator if you expected to see surveys here.
        </p>
      </div>
    </div>
  )
}
