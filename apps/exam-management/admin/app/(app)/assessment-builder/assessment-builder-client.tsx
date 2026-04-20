'use client'
import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@exxat/ds/packages/ui/src'
import { mockCourses, mockCourseOfferings, mockAssessments } from '@/lib/qb-mock-data'

function DiffBar({ Easy, Medium, Hard }: { Easy: number; Medium: number; Hard: number }) {
  return (
    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1 }}>
      <div style={{ flex: Easy, backgroundColor: 'var(--chart-2)' }} title={`Easy: ${Easy}`} />
      <div style={{ flex: Medium, backgroundColor: 'var(--chart-4)' }} title={`Medium: ${Medium}`} />
      <div style={{ flex: Hard, backgroundColor: 'var(--chart-1)' }} title={`Hard: ${Hard}`} />
    </div>
  )
}

export default function AssessmentBuilderClient() {
  const [selectedCourseId, setSelectedCourseId] = useState(mockCourses[0].id)
  const [selectedOfferingId, setSelectedOfferingId] = useState(mockCourseOfferings[0].id)

  const offerings = mockCourseOfferings.filter(o => o.courseId === selectedCourseId)
  const assessments = mockAssessments.filter(a => a.courseId === selectedCourseId && a.offeringId === selectedOfferingId)

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left panel — course + offering nav */}
      <aside style={{ width: 240, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0, padding: '16px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', padding: '0 8px', marginBottom: 8 }}>Courses</div>
        {mockCourses.map(course => {
          const courseOfferings = mockCourseOfferings.filter(o => o.courseId === course.id)
          const isSelected = selectedCourseId === course.id
          return (
            <div key={course.id}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 mb-0.5"
                style={isSelected ? { backgroundColor: 'var(--accent)', fontWeight: 600 } : {}}
                onClick={() => {
                  setSelectedCourseId(course.id)
                  if (courseOfferings.length) setSelectedOfferingId(courseOfferings[0].id)
                }}
              >
                <i className="fa-light fa-graduation-cap" aria-hidden="true" style={{ fontSize: 13, color: isSelected ? 'var(--brand-color)' : 'var(--muted-foreground)' }} />
                <span style={{ fontSize: 13 }}>{course.code}</span>
              </Button>
              {isSelected && courseOfferings.map(o => (
                <Button
                  key={o.id}
                  variant="ghost"
                  className="w-full justify-start gap-2 pl-7 mb-0.5"
                  style={selectedOfferingId === o.id ? { backgroundColor: 'var(--brand-tint)', fontWeight: 500 } : {}}
                  onClick={() => setSelectedOfferingId(o.id)}
                >
                  <i className="fa-light fa-calendar-days" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
                  <span style={{ fontSize: 12 }}>{o.semester}</span>
                </Button>
              ))}
            </div>
          )
        })}
      </aside>

      {/* Right panel — assessment cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, margin: 0 }}>
              {mockCourses.find(c => c.id === selectedCourseId)?.code} Assessments
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
              {mockCourseOfferings.find(o => o.id === selectedOfferingId)?.semester}
            </p>
          </div>
          <Button>
            <i className="fa-light fa-plus" aria-hidden="true" />
            New Assessment
          </Button>
        </div>

        <Tabs defaultValue="all">
          <TabsList variant="line">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="hard">High Difficulty</TabsTrigger>
            <TabsTrigger value="unbalanced">Unbalanced</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 16 }}>
              {assessments.map(a => (
                <Card key={a.id}>
                  <CardHeader style={{ paddingBottom: 8 }}>
                    <CardTitle style={{ fontSize: 15 }}>{a.title}</CardTitle>
                    <Badge variant="secondary" className="rounded w-fit text-xs">{a.questionCount} questions</Badge>
                  </CardHeader>
                  <CardContent>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 6 }}>Difficulty distribution</div>
                    <DiffBar Easy={a.diffDistribution.Easy} Medium={a.diffDistribution.Medium} Hard={a.diffDistribution.Hard} />
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--muted-foreground)' }}>
                      <span><span style={{ color: 'var(--chart-2)' }}>●</span> Easy {a.diffDistribution.Easy}</span>
                      <span><span style={{ color: 'var(--chart-4)' }}>●</span> Medium {a.diffDistribution.Medium}</span>
                      <span><span style={{ color: 'var(--chart-1)' }}>●</span> Hard {a.diffDistribution.Hard}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3 text-xs h-7">Open Builder</Button>
                  </CardContent>
                </Card>
              ))}
              {assessments.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--muted-foreground)', fontSize: 13 }}>
                  No assessments for this offering yet.
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="hard">
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>High difficulty filter — coming soon.</div>
          </TabsContent>
          <TabsContent value="unbalanced">
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>Unbalanced filter — coming soon.</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
