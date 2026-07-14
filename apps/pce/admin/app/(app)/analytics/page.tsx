'use client'

import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Button, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  ToggleGroup, ToggleGroupItem,
  Tabs, TabsList, TabsTrigger, TabsContent,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
  Avatar, AvatarFallback,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { EvaluationCardSheet } from '@/components/pce/evaluation-card-sheet'
import { usePce } from '@/components/pce/pce-state'
import { MOCK_TERMS, MOCK_COHORTS, MOCK_FACULTY, MOCK_FACULTY_OFFERINGS } from '@/lib/pce-mock-data'
import { ByTermPanel, ByFacultyPanel, ByCoursePanel, type NudgeTarget } from '@/components/pce/analytics-panels'
import { AnalyticsOverviewPanel } from '@/components/pce/analytics-overview-panel'
import { FacultyLeaderboardSection } from '@/components/pce/faculty-leaderboard-section'
import { FacultyPortfolioCharts } from '@/components/pce/faculty-portfolio-charts'
import { facultyStats } from '@/lib/pce-analytics'

type Axis = 'term' | 'cohort'
/**
 * 'overview' was retired Jul 2026 on the premise that "the monitoring layer moved to the
 * Dashboard home" — but it never did: `dashboard-home.tsx` is a response-collection ops
 * surface with no charts, so 8 of the 20 ADMIN analytics stories had no home at all.
 * Restored 2026-07-14 per Monil's accepted model (2026-07-13): "three tabs, in fact four:
 * overview, by faculty, by course and by term", tabs on top rather than in the sidebar.
 */
type AnalyticsTab = 'overview' | 'term' | 'faculty' | 'course'

function AnalyticsInner() {
  const searchParams = useSearchParams()
  const { sendSurveyReminder } = usePce()

  const [activeTab, setActiveTab]                   = useState<AnalyticsTab>(() => {
    const requested = searchParams?.get('tab')
    return requested === 'faculty' || requested === 'course' || requested === 'term'
      ? requested
      : 'overview'
  })
  const [axis, setAxis]                             = useState<Axis>('term')
  const [term, setTerm]                             = useState(
    searchParams?.get('term') || 'Spring 2026'
  )
  const [cohort, setCohort]                         = useState('Class of 2026')
  const [nudgeTarget, setNudgeTarget]               = useState<NudgeTarget | null>(null)
  const [selectedSurveyId, setSelectedSurveyId]     = useState<string | null>(null)
  const [selectedFacultyId, setSelectedFacultyId]   = useState<string>(
    searchParams?.get('facultyId') || (MOCK_FACULTY[0]?.id ?? '')
  )
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    searchParams?.get('courseCode') || ''
  )
  /** Global term scope for the By Faculty tables — undefined = all terms (Monil). */
  const [facultyTerm, setFacultyTerm]               = useState<string | undefined>(undefined)

  const scopeLabel = axis === 'term' ? term : cohort
  const selectedFaculty = useMemo(() => MOCK_FACULTY.find(f => f.id === selectedFacultyId) ?? null, [selectedFacultyId])

  /** The selected faculty member's class-size-weighted mean — the portfolio's anchor value.
   *  Derived from the canonical dataset so it cannot drift from the leaderboard above. */
  const selectedFacultyAvg = useMemo(() => {
    const stat = facultyStats().find(f => f.facultyId === selectedFacultyId)
    return stat ? stat.score.weighted : null
  }, [selectedFacultyId])

  const distinctCourses = useMemo(() => {
    const seen = new Set<string>()
    const list: { code: string; name: string }[] = []
    MOCK_FACULTY_OFFERINGS.forEach(o => {
      if (!seen.has(o.courseCode)) { seen.add(o.courseCode); list.push({ code: o.courseCode, name: o.courseName }) }
    })
    return list.sort((a, b) => a.code.localeCompare(b.code))
  }, [])
  const effectiveCourseCode = selectedCourseCode || distinctCourses[0]?.code || ''

  return (
    <>
      <SiteHeader title="Analytics" />

      <div className="flex items-center gap-2 shrink-0" style={{ padding: '14px 28px 0' }}>
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>Analytics</h1>
        <Button variant="outline" size="sm">
          <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
          Export
        </Button>
        <Button size="sm" asChild>
          <Link href="/surveys/push">
            <i className="fa-light fa-paper-plane" aria-hidden="true" />
            Set up Evaluations
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnalyticsTab)} className="flex flex-col flex-1 min-h-0">
        <div className="border-b border-border shrink-0" style={{ padding: '0 28px' }}>
          <TabsList variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="faculty">By Faculty</TabsTrigger>
            <TabsTrigger value="course">By Course</TabsTrigger>
            <TabsTrigger value="term">By Term</TabsTrigger>
          </TabsList>
        </div>

        {/* ───── Overview — the program brief. No entity selector by design: this is the
                 one tab whose scope is "everything", so a filter here would be a
                 different question. ───── */}
        <TabsContent value="overview" className="flex-1 overflow-auto m-0" style={{ padding: '20px 28px 28px' }}>
          <div className="flex flex-col gap-6 max-w-5xl">
            <AnalyticsOverviewPanel />
          </div>
        </TabsContent>

        {/* ───── By Term ───── */}
        <TabsContent value="term" className="flex-1 overflow-auto m-0" style={{ padding: '20px 28px 28px' }}>
          <div className="flex flex-col gap-6 max-w-4xl">
            <div className="flex items-center gap-3">
              <ToggleGroup type="single" value={axis} onValueChange={(v) => v && setAxis(v as Axis)} variant="outline" size="sm">
                <ToggleGroupItem value="term"   aria-label="View by term">Term</ToggleGroupItem>
                <ToggleGroupItem value="cohort" aria-label="View by cohort">Cohort</ToggleGroupItem>
              </ToggleGroup>

              {axis === 'term' ? (
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger className="h-8 w-36 text-sm" aria-label="Select term"><SelectValue /></SelectTrigger>
                  <SelectContent>{MOCK_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Select value={cohort} onValueChange={setCohort}>
                  <SelectTrigger className="h-8 w-44 text-sm" aria-label="Select cohort"><SelectValue /></SelectTrigger>
                  <SelectContent>{MOCK_COHORTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>

            <ByTermPanel axis={axis} value={scopeLabel} onOpenSurvey={setSelectedSurveyId} onNudge={setNudgeTarget} />
          </div>
        </TabsContent>

        {/* ───── By Faculty — the most important tab (accepted 2026-07-13).
                 Order follows the flow Monil described: land on the leaderboard of all
                 faculty, then drill into one. The selector below is the drill-down, which
                 is also what VIZ-007 asks for — the all-faculty view is the default and the
                 dropdown is the optional narrowing, not the other way round. ───── */}
        <TabsContent value="faculty" className="flex-1 overflow-auto m-0" style={{ padding: '20px 28px 28px' }}>
          <div className="flex flex-col gap-6 max-w-5xl">
            {/* ADMIN-ONLY. Never move this into ByFacultyPanel — that panel is shared with
                /my-dashboard, the faculty self-view, where §7.3 bans peer leaderboards. */}
            <FacultyLeaderboardSection
              term={facultyTerm}
              onTermChange={setFacultyTerm}
              onSelectFaculty={(id) => {
                // "view insights → the entire view opens only for Dr. Sandra" (Monil). The
                // drill-down is the same tab scrolled to the portfolio, not a new route —
                // the portfolio is a filtered state of By Faculty, not a surface of its own.
                setSelectedFacultyId(id)
                requestAnimationFrame(() =>
                  document.getElementById('individual-faculty')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                )
              }}
            />

            <div id="individual-faculty" className="border-t border-border pt-6">
              <h2 className="text-sm font-semibold">Individual faculty</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Their portfolio: how they perform per term and per course, and every survey behind it.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground shrink-0" htmlFor="faculty-select">Faculty</label>
              <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                <SelectTrigger id="faculty-select" className="h-8 w-56 text-sm" aria-label="Select faculty"><SelectValue /></SelectTrigger>
                <SelectContent>{MOCK_FACULTY.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {selectedFaculty && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0" aria-hidden="true">
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
                  >
                    {selectedFaculty.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{selectedFaculty.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedFaculty.department}</p>
                </div>
              </div>
            )}

            {/* extraCharts is what makes this tab's "their portfolio" copy true. Without it
                the tab rendered a KPI strip and a table while /admin/faculty/[id] showed the
                full portfolio — two doors to the same faculty member, different contents.
                lens="admin": this tab is admin-only, so the peer distribution is allowed. */}
            <ByFacultyPanel
              facultyId={selectedFacultyId}
              onOpenSurvey={setSelectedSurveyId}
              extraCharts={
                selectedFacultyId ? (
                  <FacultyPortfolioCharts
                    facultyId={selectedFacultyId}
                    avgRating={selectedFacultyAvg}
                    lens="admin"
                  />
                ) : null
              }
            />
          </div>
        </TabsContent>

        {/* ───── By Course ───── */}
        <TabsContent value="course" className="flex-1 overflow-auto m-0" style={{ padding: '20px 28px 28px' }}>
          <div className="flex flex-col gap-6 max-w-4xl">
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground shrink-0" htmlFor="course-select">Course</label>
              <Select value={effectiveCourseCode} onValueChange={setSelectedCourseCode}>
                <SelectTrigger id="course-select" className="h-8 w-64 text-sm" aria-label="Select course"><SelectValue /></SelectTrigger>
                <SelectContent>{distinctCourses.map(c => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <ByCoursePanel courseCode={effectiveCourseCode} onOpenSurvey={setSelectedSurveyId} />
          </div>
        </TabsContent>
      </Tabs>

      {/* ───── Evaluation Card ───── */}
      <EvaluationCardSheet surveyId={selectedSurveyId} onClose={() => setSelectedSurveyId(null)} />

      {/* ───── Nudge confirmation ───── */}
      <AlertDialog open={!!nudgeTarget} onOpenChange={(open) => !open && setNudgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send ad-hoc reminder</AlertDialogTitle>
            <AlertDialogDescription>
              {nudgeTarget && (
                <>
                  Send an immediate reminder to{' '}
                  <strong>{nudgeTarget.nonResponders} non-responder{nudgeTarget.nonResponders !== 1 ? 's' : ''}</strong>{' '}
                  in <strong>{nudgeTarget.courseCode} — {nudgeTarget.courseName}</strong>. This is an out-of-schedule nudge.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (nudgeTarget) sendSurveyReminder([nudgeTarget.id])
                setNudgeTarget(null)
              }}
            >
              Send reminder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense>
      <AnalyticsInner />
    </Suspense>
  )
}
