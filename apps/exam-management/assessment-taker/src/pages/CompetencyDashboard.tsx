/**
 * COMPETENCY DASHBOARD — Cross-assessment analytics
 *
 * Per Aarti (Granola sessions):
 *   - "Key differentiator from ExamSoft — cumulative competency insights"
 *   - Three-tier structure: assessment → course → program
 *   - Program-level deferred to 2027; assessment + course active now
 *   - Shows aggregated content area scores across all assessments in a course
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_COURSE_COMPETENCIES, MOCK_ASSESSMENTS, CourseCompetency } from '../data/assessments';

const t = {
  bg: 'var(--background)',
  card: 'var(--card)',
  muted: 'var(--muted)',
  brand: 'var(--brand-color)',
  brandDark: 'var(--brand-color-dark)',
  brandSurface: 'var(--brand-tint-light, #F5F3FF)',
  brandBorder: 'var(--brand-tint, #EDE9FE)',
  fg: 'var(--foreground)',
  fgMuted: 'var(--muted-foreground)',
  border: 'var(--border)',
  borderControl: 'var(--border-control)',
};

function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ height: 8, background: t.muted, borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${Math.min(100, (value / max) * 100)}%`,
        background: color, borderRadius: 99,
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

function ScoreColor(score: number): string {
  if (score >= 85) return '#15803D';
  if (score >= 75) return '#D97706';
  if (score >= 60) return '#EF4444';
  return '#B91C1C';
}

function BarColor(score: number): string {
  if (score >= 85) return '#4ADE80';
  if (score >= 75) return '#FACC15';
  return '#F87171';
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
              <p style={{ fontSize: 26, fontWeight: 800, color: ScoreColor(avg), lineHeight: 1 }}>{avg}%</p>
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
          color={t.brand}
        />

        {/* Expand toggle */}
        {haData && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              marginTop: 14, background: 'none', border: 'none', cursor: 'pointer',
              color: t.brand, fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5, padding: 0,
            }}
            aria-expanded={expanded}
          >
            <i className={`fa-light ${expanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
            {expanded ? 'Hide' : 'Show'} content area breakdown
          </button>
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
                <span style={{ fontSize: 13, fontWeight: 700, color: ScoreColor(ca.score) }}>
                  {ca.score}%
                </span>
              </div>
              <ProgressBar value={ca.score} color={BarColor(ca.score)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompetencyDashboard() {
  const navigate = useNavigate();

  const published = MOCK_ASSESSMENTS.filter(a => a.status === 'results_published');
  const overallScores = published.map(a => a.score ?? 0).filter(s => s > 0);
  const overallAvg = overallScores.length > 0
    ? Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length)
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: t.card, borderBottom: `1px solid ${t.border}`,
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.fgMuted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
            Dashboard
          </button>
          <span style={{ color: t.border }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.fg }}>Competency Progress</span>
        </div>
        <span style={{ fontSize: 12, color: t.fgMuted, background: '#FEF3C7', padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>
          <i className="fa-light fa-flask" aria-hidden="true" style={{ marginRight: 4 }} />
          Program-level view coming 2027
        </span>
      </header>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px 60px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.fg, marginBottom: 4 }}>Competency Progress</h1>
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
              color: overallAvg > 0 ? ScoreColor(overallAvg) : t.fgMuted,
              bg: overallAvg >= 75 ? '#DCFCE7' : overallAvg > 0 ? '#FEF3C7' : t.muted,
            },
            {
              icon: 'fa-clipboard-check',
              label: 'Assessments Taken',
              value: `${published.length}`,
              color: t.brand, bg: t.brandSurface,
            },
            {
              icon: 'fa-graduation-cap',
              label: 'Courses Active',
              value: `${MOCK_COURSE_COMPETENCIES.length}`,
              color: '#2563EB', bg: '#EFF6FF',
            },
            {
              icon: 'fa-bullseye-arrow',
              label: 'Content Areas Tracked',
              value: `${MOCK_COURSE_COMPETENCIES.reduce((n, c) => n + c.contentAreas.length, 0)}`,
              color: '#7C3AED', bg: '#F5F3FF',
            },
          ].map(item => (
            <div key={item.label} style={{
              background: t.card, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: '16px', textAlign: 'center',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: item.bg, margin: '0 auto 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`fa-light ${item.icon}`} aria-hidden="true" style={{ color: item.color, fontSize: 16 }} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</p>
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
          background: '#FFFBEB', border: '1px dashed #FDE68A', borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <i className="fa-light fa-map-location-dot" aria-hidden="true" style={{ color: '#D97706', fontSize: 28, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Program-Level View — Coming 2027</p>
            <p style={{ fontSize: 13, color: '#D97706', lineHeight: 1.5 }}>
              Cross-course competency aggregation across your full program (PT, OT, PA, Nursing, Social Work) is in development. This view will map your cumulative performance against CAPTE, ACOTE, CCNE, and CAAHEP accreditation standards.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
