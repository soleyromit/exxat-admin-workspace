'use client'

/**
 * COURSE DETAIL — Aarti's "four main sections per course" + the curricular loop.
 *
 * Follows canonical admin shell: SiteHeader → main → PageHeader → tabs region → content.
 * Breadcrumbs surface in SiteHeader; PageHeader provides the title + actions row.
 * Tabs sit between PageHeader and the scrollable tab-content region.
 *
 * Tabs:
 *   1. Overview (default)  — KPI strip + Course Objectives (curricular loop)
 *   2. Questions           — filtered question list with embedded psychometrics
 *   3. Assessments         — list with approval-workflow states + reviewer panel
 *   4. Students            — roster with per-course performance + bottom-20% flag
 *   5. Accommodations      — read-only, approver attribution
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent,
  Tip,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { mockCourses, mockCourseOfferings, mockAssessments } from '@/lib/qb-mock-data'
import {
  facultyStudents, facultyAccommodations, courseObjectives,
  facultyExtraAssessments,
} from '@/lib/faculty-mock-data'
import { useFacultySession } from '@/lib/faculty-session'
import { useAssessmentReviews } from '@/lib/assessment-review-store'
import { AccessLevelChip, StatusPill } from '@/components/faculty-ui-kit'

import { CreateAssessmentModal } from '@/components/create-assessment-modal'
import { OverviewTab } from './tabs/overview-tab'
import { AssessmentsTab } from './tabs/assessments-tab'
import { StudentsTab } from './tabs/students-tab'
import { AccommodationsTab } from './tabs/accommodations-tab'
import { FacultyTab } from './tabs/faculty-tab'
import { QuestionBankTab } from './tabs/question-bank-tab'

const ALL_ASSESSMENTS = [...mockAssessments, ...facultyExtraAssessments]

const IS_LMS_ACTIVE = false

export default function CourseDetailClient({ courseId }: { courseId: string }) {
  const router = useRouter()
  const { role, faculty, accessFor, hydrated } = useFacultySession()
  const { reviewByAssessment } = useAssessmentReviews()
  // Default landing = the assessment list, per Aarti's May 7 directive.
  // Curricular matrix moves to the secondary "Mapping" tab.
  const [activeTab, setActiveTab] = useState('assessments')
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false)

  const course = useMemo(() => mockCourses.find(c => c.id === courseId), [courseId])
  const offerings = useMemo(
    () => mockCourseOfferings.filter(o => o.courseId === courseId),
    [courseId]
  )
  const activeOffering = useMemo(
    () => offerings.find(o => o.semester.includes('2026')) ?? offerings[0],
    [offerings]
  )
  const courseAssessments = useMemo(
    () => ALL_ASSESSMENTS.filter(a => a.courseId === courseId),
    [courseId]
  )
  const courseStudents = useMemo(
    () => facultyStudents.filter(s => s.enrolledCourseIds.includes(courseId)),
    [courseId]
  )
  const courseAccommodations = useMemo(
    () => facultyAccommodations.filter(a => a.courseId === courseId),
    [courseId]
  )
  const courseObjectivesList = useMemo(
    () => courseObjectives.filter(o => o.courseId === courseId),
    [courseId]
  )

  // Tab count badges — Aarti May 19
  const studentsCount = facultyStudents.filter(s => s.enrolledCourseIds?.includes(courseId)).length
  const assessmentsCount = ALL_ASSESSMENTS.filter(a => a.courseId === courseId).length
  // facultyListRows is not in scope here; FacultyTab manages its own data internally.
  // Real count would come from a shared faculty-by-course query. Using 0 until that data is lifted.
  const facultyCount = 0

  if (!hydrated) return null

  if (!course) {
    return (
      <>
        <SiteHeader title="Courses" />
        <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col items-center justify-center text-center px-6 outline-none">
          <i className="fa-light fa-circle-exclamation text-muted-foreground text-4xl mb-4" aria-hidden="true" />
          <h2 className="font-heading text-xl font-semibold text-foreground">Course not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The course you&apos;re trying to open doesn&apos;t exist or you don&apos;t have access.</p>
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => router.push('/courses')}>
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
            Back to courses
          </Button>
        </div>
      </>
    )
  }

  const accessLevel = accessFor(courseId)
  if (role === 'faculty' && !accessLevel) {
    return (
      <>
        <SiteHeader title="Courses" breadcrumbs={[{ label: 'My courses', href: '/courses' }, { label: course.name }]} />
        <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col items-center justify-center text-center px-6 outline-none">
          <div className="flex size-14 items-center justify-center rounded-full mb-3 bg-muted">
            <i className="fa-light fa-lock text-muted-foreground text-xl" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            You don&apos;t have access to this course
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Your faculty account isn&apos;t associated with {course.name}. Contact your program administrator to request access.
          </p>
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => router.push('/courses')}>
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
            Back to my courses
          </Button>
        </div>
      </>
    )
  }

  const isViewer = accessLevel === 'viewer'

  const liveCount = courseAssessments.filter(a => reviewByAssessment.get(a.id)?.state === 'in-progress').length
  const pendingReview = courseAssessments.filter(a => {
    const s = reviewByAssessment.get(a.id)?.state
    return s === 'pending-chair' || s === 'changes-requested'
  }).length

  const breadcrumbs = [
    { label: role === 'faculty' ? 'My courses' : 'Courses', href: '/courses' },
    { label: course.name },
  ]

  const subtitle = [
    activeOffering?.semester ?? '—',
    `${courseStudents.length || activeOffering?.studentCount || 0} students`,
    role === 'faculty' && faculty ? `${faculty.title} ${faculty.name}` : null,
  ].filter(Boolean).join(' · ')

  const headerActions = (
    <div className="flex items-center gap-2">
      {/* LMS integration chip — Vishaka May 19 */}
      {IS_LMS_ACTIVE ? (
        <Badge
          variant="secondary"
          className="rounded-full gap-1.5 text-xs shrink-0"
          style={{
            backgroundColor: 'var(--brand-tint)',
            color: 'var(--brand-color)',
          }}
        >
          <i className="fa-light fa-link" aria-hidden="true" />
          Linked to Canvas
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="rounded-full gap-1.5 text-xs shrink-0"
          style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
        >
          <i className="fa-light fa-unlink" aria-hidden="true" />
          No LMS linked
        </Badge>
      )}
      {accessLevel && <AccessLevelChip level={accessLevel} />}
      {liveCount > 0 && (
        <Tip label={`${liveCount} ${liveCount === 1 ? 'assessment' : 'assessments'} in progress now`}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const id = courseAssessments.find(a => reviewByAssessment.get(a.id)?.state === 'in-progress')?.id
              if (id) router.push(`/assessments/${id}/monitor`)
            }}
          >
            <span className="inline-block size-1.5 rounded-full bg-chart-1 [animation:pulse-soft_1.6s_ease-in-out_infinite]" aria-hidden="true" />
            <span>Live monitor</span>
            <StatusPill tone="info" label={String(liveCount)} />
          </Button>
        </Tip>
      )}
      <PrimaryAction isViewer={isViewer} courseId={courseId} modalOpen={assessmentModalOpen} setModalOpen={setAssessmentModalOpen} />
    </div>
  )

  return (
    <>
      <SiteHeader title={course.name} breadcrumbs={breadcrumbs} />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none overflow-hidden">
        <PageHeader
          title={course.name}
          subtitle={subtitle}
          actions={headerActions}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
          <div className="px-6 border-b border-border shrink-0">
            <TabsList variant="line" className="gap-0">
              {/* Assessments is the primary landing per Aarti (May 7).
                  Faculty come to a course to manage their assessments;
                  curriculum mapping is a secondary diagnostic. */}
              <TabsTrigger value="assessments" className="gap-2">
                <i className="fa-light fa-clipboard-list text-xs" aria-hidden="true" />
                Assessments
                {assessmentsCount > 0 && (
                  <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
                    {assessmentsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="students" className="gap-2">
                <i className="fa-light fa-users text-xs" aria-hidden="true" />
                Students
                {studentsCount > 0 && (
                  <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
                    {studentsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="accommodations" className="gap-2">
                <i className="fa-light fa-universal-access text-xs" aria-hidden="true" />
                Accommodations
                {courseAccommodations.length > 0 && (
                  <span className="text-muted-foreground text-xs font-normal">{courseAccommodations.length}</span>
                )}
              </TabsTrigger>
              {/* Mapping with outcomes — secondary diagnostic surface.
                  Houses the curricular matrix (objectives × assessments).
                  Aarti: "Mapping with outcomes is good. But it is a
                  secondary point of view." */}
              <TabsTrigger value="mapping" className="gap-2">
                <i className="fa-light fa-grid-2 text-xs" aria-hidden="true" />
                Mapping
              </TabsTrigger>
              <TabsTrigger value="faculty" className="gap-2">
                <i className="fa-light fa-chalkboard-user text-xs" aria-hidden="true" />
                Faculty
                {facultyCount > 0 && (
                  <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
                    {facultyCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="question-bank" className="gap-2">
                <i className="fa-light fa-books" aria-hidden="true" style={{ fontSize: 13 }} />
                Question Bank
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <TabsContent value="assessments" className="m-0">
              <AssessmentsTab
                assessments={courseAssessments}
                reviewByAssessment={reviewByAssessment}
                isViewer={isViewer}
                courseId={courseId}
                onNewAssessment={() => setAssessmentModalOpen(true)}
              />
            </TabsContent>
            <TabsContent value="students" className="m-0">
              <StudentsTab
                students={courseStudents}
                courseId={courseId}
                accommodations={courseAccommodations}
              />
            </TabsContent>
            <TabsContent value="accommodations" className="m-0">
              <AccommodationsTab
                accommodations={courseAccommodations}
                students={courseStudents}
              />
            </TabsContent>
            <TabsContent value="mapping" className="m-0">
              <OverviewTab
                course={course}
                students={courseStudents}
                assessments={courseAssessments}
                objectives={courseObjectivesList}
                reviewByAssessment={reviewByAssessment}
                onJumpToTab={setActiveTab}
              />
            </TabsContent>
            <TabsContent value="faculty" className="m-0">
              <FacultyTab courseId={courseId} />
            </TabsContent>
            <TabsContent value="question-bank" className="mt-0 outline-none">
              <QuestionBankTab courseId={courseId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  )
}

function PrimaryAction({
  isViewer, courseId, modalOpen, setModalOpen,
}: {
  isViewer: boolean
  courseId: string
  modalOpen: boolean
  setModalOpen: (open: boolean) => void
}) {
  if (isViewer) {
    return (
      <Tip label="Read-only access — you can't create assessments in this course.">
        <Button variant="outline" size="sm" disabled className="gap-2">
          <i className="fa-light fa-lock" aria-hidden="true" />
          View-only
        </Button>
      </Tip>
    )
  }

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setModalOpen(true)}>
        <i className="fa-light fa-plus" aria-hidden="true" />
        New assessment
      </Button>
      <CreateAssessmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        courseId={courseId}
      />
    </>
  )
}
