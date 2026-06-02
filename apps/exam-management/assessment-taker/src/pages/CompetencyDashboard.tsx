/**
 * COMPETENCY DASHBOARD — Cross-assessment analytics
 *
 * Per Aarti (Granola sessions):
 *   - "Key differentiator from ExamSoft — cumulative competency insights"
 *   - Three-tier structure: assessment → course → program
 *   - Program-level deferred to 2027; assessment + course active now
 *   - Shows aggregated content area scores across all assessments in a course
 */

import { useState } from 'react';
import { Button } from '@exxat/ds/packages/ui/src';
import { MOCK_COURSE_COMPETENCIES, MOCK_ASSESSMENTS, CourseCompetency } from '../data/assessments';

const t = {
  bg: 'var(--background)',
  card: 'var(--card)',
  muted: 'var(--muted)',
  brand: 'var(--brand-color)',
  brandDark: 'var(--brand-color-dark)',
  brandSurface: 'var(--brand-tint)',
  brandBorder: 'var(--brand-tint)',
  fg: 'var(--foreground)',
  fgMuted: 'var(--muted-foreground)',
  border: 'var(--border)',
  borderControl: 'var(--border)',
};

function ProgressBar({ value, max = 100, color = t.fg }: { value: number; max?: number; color?: string }) {
  return (
    <div style={{ height: 6, background: t.muted, borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${Math.min(100, (value / max) * 100)}%`,
        background: color, borderRadius: 99, opacity: 0.85,
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

function CourseCard({ course }: { course: CourseCompetency }) {
  const [expanded, setExpanded] = useState(false);
  const haData = course.contentAreas.length > 0;
  const avg = course.averageScore;

  return (
    <div style={{
      background: t.card, border: `1px solid ${t.border}`,
      borderRadius: 14, overflow: 'hidden',
      transition: 'box-shadow 0.2s ease',
    }}>
      {/* Card header */}
      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
              {course.courseCode}
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: t.fg }}>{course.courseName}</h3>
          </div>
          {haData ? (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 26, fontWeight: 700, color: t.fg, lineHeight: 1 }}>{avg}%</p>
              <p style={{ fontSize: 11, color: t.fgMuted }}>avg score</p>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: t.fgMuted, background: t.muted, padding: '4px 10px', borderRadius: 99 }}>
              Results pending
            </span>
          )}
        </div>

        {/* Assessment progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: t.fgMuted }}>
            {course.assessmentsCompleted} of {course.assessmentsTotal} assessments complete
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: t.fg }}>
            {Math.round((course.assessmentsCompleted / course.assessmentsTotal) * 100)}%
          </span>
        </div>
        <ProgressBar
          value={course.assessmentsCompleted}
          max={course.assessmentsTotal}
        />

        {/* Expand toggle */}
        {haData && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(e => !e)}
            aria-expanded={expanded}
            className="mt-3.5 px-0 h-auto"
            style={{ color: t.fgMuted }}
          >
            <i className={`fa-light ${expanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
            {expanded ? 'Hide' : 'Show'} content area breakdown
          </Button>
        )}
      </div>

      {/* Expanded: content areas */}
      {expanded && haData && (
        <div style={{
          padding: '0 22px 20px',
          borderTop: `1px solid ${t.border}`,
          paddingTop: 16,
        }}>
          {course.contentAreas.map(ca => (
            <div key={ca.name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: t.fg }}>{ca.name}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: t.fg }}>
                  {ca.score}%
                </span>
              </div>
              <ProgressBar value={ca.score} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompetencyDashboard() {
  const published = MOCK_ASSESSMENTS.filter(a => a.status === 'results_published');
  const overallScores = published.map(a => a.score ?? 0).filter(s => s > 0);
  const overallAvg = overallScores.length > 0
    ? Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length)
    : 0;

  return (
    <div style={{ background: t.bg, fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100%' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px 60px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="font-heading" style={{ fontSize: 26, fontWeight: 700, color: t.fg, marginBottom: 4, lineHeight: 1.2 }}>Competency Progress</h1>
          <p style={{ fontSize: 14, color: t.fgMuted }}>
            Your cumulative performance across assessments and content areas — by course.
          </p>
        </div>

        {/* Summary strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12, marginBottom: 28,
        }}>
          {[
            {
              icon: 'fa-chart-line',
              label: 'Overall Average',
              value: overallAvg > 0 ? `${overallAvg}%` : '—',
            },
            {
              icon: 'fa-clipboard-check',
              label: 'Assessments Taken',
              value: `${published.length}`,
            },
            {
              icon: 'fa-graduation-cap',
              label: 'Courses Active',
              value: `${MOCK_COURSE_COMPETENCIES.length}`,
            },
            {
              icon: 'fa-bullseye-arrow',
              label: 'Content Areas Tracked',
              value: `${MOCK_COURSE_COMPETENCIES.reduce((n, c) => n + c.contentAreas.length, 0)}`,
            },
          ].map(item => (
            <div key={item.label} style={{
              background: t.card, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: '16px', textAlign: 'center',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: t.muted, margin: '0 auto 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`fa-light ${item.icon}`} aria-hidden="true" style={{ color: t.fgMuted, fontSize: 16 }} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: t.fg }}>{item.value}</p>
              <p style={{ fontSize: 11, color: t.fgMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Section: course-level */}
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>
            <i className="fa-light fa-book" aria-hidden="true" style={{ marginRight: 6 }} />
            Course-Level Breakdown
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {MOCK_COURSE_COMPETENCIES.map(course => (
              <CourseCard key={course.courseCode} course={course} />
            ))}
          </div>
        </div>

        {/* Program tier placeholder */}
        <div style={{
          marginTop: 32, padding: '20px 24px',
          background: t.muted, border: `1px solid ${t.border}`, borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <i className="fa-light fa-map-location-dot" aria-hidden="true" style={{ color: t.fgMuted, fontSize: 24, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.fg, marginBottom: 4 }}>Program-Level View — Coming 2027</p>
            <p style={{ fontSize: 13, color: t.fgMuted, lineHeight: 1.5 }}>
              Cross-course competency aggregation across your full program (PT, OT, PA, Nursing, Social Work) is in development. This view will map your cumulative performance against CAPTE, ACOTE, CCNE, and CAAHEP accreditation standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
