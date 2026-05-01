'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@exxat/ds/packages/ui/src'
import { mockCourses, mockCourseOfferings, mockAssessments } from '@/lib/qb-mock-data'

export default function CoursesClient() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([mockCourses[0]?.id ?? '']))
  const router = useRouter()

  function toggle(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const totalStudents = (courseId: string) =>
    mockCourseOfferings
      .filter(o => o.courseId === courseId)
      .reduce((sum, o) => sum + o.studentCount, 0)

  const isActiveOffering = (semester: string) =>
    semester.includes('2026')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '18px 28px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <h1 className="text-[22px] font-normal text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Courses</h1>
          <p className="text-sm text-muted-foreground" style={{ marginTop: 2 }}>
            {mockCourses.length} courses · {mockCourseOfferings.length} offerings
          </p>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 28px' }}>
        <Table style={{ width: '100%' }}>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 36 }}></TableHead>
              <TableHead style={{ width: 110 }}>Code</TableHead>
              <TableHead style={{ width: 220 }}>Course name</TableHead>
              <TableHead style={{ width: 150 }}>Offering / Semester</TableHead>
              <TableHead style={{ width: 110 }}>Students</TableHead>
              <TableHead style={{ width: 90 }}>Status</TableHead>
              <TableHead style={{ width: 130 }}>Assessments</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCourses.map(course => {
              const offerings = mockCourseOfferings.filter(o => o.courseId === course.id)
              const isOpen = expandedIds.has(course.id)

              return (
                <React.Fragment key={course.id}>
                  <TableRow
                    onClick={() => toggle(course.id)}
                    style={{ cursor: 'pointer', background: isOpen ? 'var(--courses-row-open-bg)' : undefined }}
                  >
                    <TableCell>
                      <i
                        className="fa-light fa-chevron-right"
                        aria-hidden="true"
                        style={{ fontSize: 11, color: 'var(--muted-foreground)', transition: 'transform .15s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded font-mono text-[11px]"
                        style={{ background: 'var(--brand-tint)', color: 'var(--brand-color)', border: '1px solid color-mix(in oklch, var(--brand-color) 20%, transparent)' }}>
                        {course.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{course.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{offerings.length} offering{offerings.length !== 1 ? 's' : ''}</TableCell>
                    <TableCell className="text-sm text-foreground font-medium">{totalStudents(course.id)} total</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1"
                        style={{ color: 'var(--brand-color)' }}
                        onClick={(e) => { e.stopPropagation(); router.push(`/question-bank`) }}>
                        View QB
                        <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 10 }} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1"
                        style={{ color: 'var(--brand-color)' }}
                        onClick={(e) => { e.stopPropagation(); router.push(`/assessment-builder`) }}>
                        Assessment Builder
                        <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 10 }} />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {isOpen && offerings.map(o => {
                    const active = isActiveOffering(o.semester)
                    return (
                      <TableRow key={o.id} style={{ background: 'var(--courses-offering-row-bg)' }}>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell style={{ paddingLeft: 28 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: active ? 'var(--brand-color)' : 'var(--muted-foreground)', flexShrink: 0 }} />
                            <span className="text-sm font-medium">{o.semester}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{active ? 'Active offering' : 'Past offering'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded text-[11px]"
                            style={active ? { background: 'var(--brand-tint)', color: 'var(--brand-color)' } : {}}>
                            {o.studentCount} students
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded text-[10px]"
                            style={active ? { background: 'var(--qb-status-saved-bg)', color: 'var(--qb-status-saved-fg)' } : {}}>
                            {active ? '● Active' : 'Past'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {mockAssessments.filter(a => a.offeringId === o.id).length} assessments
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1"
                            style={{ color: 'var(--brand-color)' }}
                            onClick={() => router.push('/assessment-builder')}>
                            View assessments
                            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 10 }} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground" style={{ padding: '10px 28px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
        {mockCourses.length} courses · {mockCourseOfferings.length} offerings
      </div>
    </div>
  )
}
