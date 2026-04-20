'use client'
import { useState } from 'react'
import { Button, Badge, Collapsible, CollapsibleTrigger, CollapsibleContent, Tooltip, TooltipTrigger, TooltipContent } from '@exxat/ds/packages/ui/src'
import { mockCourses, mockCourseOfferings } from '@/lib/qb-mock-data'
import { useRouter } from 'next/navigation'

export default function CoursesClient() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['course-phar101']))
  const router = useRouter()

  function toggle(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Courses</h1>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>{mockCourses.length} courses · {mockCourseOfferings.length} offerings</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button disabled>
              <i className="fa-light fa-plus" aria-hidden="true" />
              New Course
            </Button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mockCourses.map(course => {
          const offerings = mockCourseOfferings.filter(o => o.courseId === course.id)
          const isOpen = expandedIds.has(course.id)
          return (
            <Collapsible key={course.id} open={isOpen} onOpenChange={() => toggle(course.id)}>
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', backgroundColor: 'var(--card)' }}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full h-auto px-4 py-3.5 justify-start gap-3 rounded-none"
                    style={{ textAlign: 'left' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fa-light fa-graduation-cap" aria-hidden="true" style={{ fontSize: 16, color: 'var(--brand-color)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)' }}>{course.code} — {course.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>{offerings.length} offering{offerings.length !== 1 ? 's' : ''}</div>
                    </div>
                    <i className={`fa-light ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {offerings.map(o => (
                      <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px 10px 64px', borderBottom: '1px solid var(--border)' }}>
                        <i className="fa-light fa-calendar-days" aria-hidden="true" style={{ fontSize: 13, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{o.semester}</span>
                        <Badge variant="secondary" className="rounded text-xs">{o.studentCount} students</Badge>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => router.push('/question-bank')}>
                          View QB
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
