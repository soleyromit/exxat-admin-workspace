/**
 * EXAM RESULTS — Score + competency breakdown
 *
 * Per Aarti (Granola sessions):
 *   - Assessment-level summary: total score, performance by content area/competency
 *   - Content area / competency mapping — key differentiator vs ExamSoft
 *   - Correct answers + rationale (faculty-configured)
 *   - Scheduled review session entry point (if window is open)
 *   - Three-tier architecture: assessment → course → program (program deferred 2027)
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_ASSESSMENTS, ContentArea } from '../data/assessments';

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

function ScoreRing({ score, passing }: { score: number; passing: number }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const pct = score / 100;
  const passed = score >= passing;

  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width={140} height={140} viewBox="0 0 140 140" aria-hidden="true">
        {/* Track */}
        <circle cx={70} cy={70} r={radius} fill="none" stroke="var(--muted)" strokeWidth={10} />
        {/* Progress */}
        <circle
          cx={70} cy={70} r={radius} fill="none"
          stroke={passed ? '#4ADE80' : '#F87171'}
          strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: passed ? '#15803D' : '#B91C1C', lineHeight: 1 }}>{score}%</span>
        <span style={{
          fontSize: 11, fontWeight: 700, marginTop: 4, padding: '2px 8px', borderRadius: 99,
          background: passed ? '#DCFCE7' : '#FEE2E2', color: passed ? '#15803D' : '#B91C1C',
        }}>
          {passed ? 'PASSED' : 'BELOW PASSING'}
        </span>
      </div>
    </div>
  );
}

function ContentAreaBar({ ca, maxScore = 100 }: { ca: ContentArea; maxScore?: number }) {
  const score = ca.score ?? 0;
  const passed = score >= 70;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.fg }}>{ca.name}</span>
          <span style={{ fontSize: 12, color: t.fgMuted, marginLeft: 8 }}>{ca.questionCount} questions · {ca.weight}% of grade</span>
        </div>
        <span style={{
          fontSize: 15, fontWeight: 800,
          color: score >= 80 ? '#15803D' : score >= 70 ? '#D97706' : '#B91C1C',
        }}>
          {score}%
        </span>
      </div>
      <div style={{ height: 8, background: t.muted, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${(score / maxScore) * 100}%`,
          borderRadius: 99,
          background: score >= 80 ? '#4ADE80' : score >= 70 ? '#FACC15' : '#F87171',
          transition: 'width 0.7s ease',
        }} />
      </div>
      {/* Passing line indicator */}
      <div style={{ position: 'relative', height: 0 }}>
        <div style={{
          position: 'absolute',
          left: '70%', top: -8, width: 1, height: 8,
          background: t.fgMuted, opacity: 0.5,
        }} />
      </div>
    </div>
  );
}

export function ExamResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'by-area'>('overview');

  // Default to the published results exam for demo
  const exam = MOCK_ASSESSMENTS.find(a => a.id === id)
    ?? MOCK_ASSESSMENTS.find(a => a.status === 'results_published')!;

  const score = exam?.score ?? 84;
  const percentile = exam?.percentile ?? 72;
  const passing = exam?.passingScore ?? 75;
  const passed = score >= passing;
  const hasReview = exam?.status === 'review_available' || Boolean(exam?.reviewSessionStart);

  const tabs = ['overview', 'by-area'] as const;
  const tabLabels: Record<typeof tabs[number], string> = {
    overview: 'Overview',
    'by-area': 'Content Area Breakdown',
  };

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: t.card, borderBottom: `1px solid ${t.border}`,
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
          <span style={{ fontSize: 14, fontWeight: 600, color: t.fg, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {exam?.title}
          </span>
        </div>
        {hasReview && (
          <button
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: '#2563EB', color: '#FFF',
              border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <i className="fa-light fa-lock" aria-hidden="true" />
            Enter Review Session
          </button>
        )}
      </header>

      <main style={{ maxWidth: 780, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* Score hero */}
        <div style={{
          background: t.card, border: `1px solid ${t.border}`,
          borderRadius: 16, padding: 28, marginBottom: 24,
          display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <ScoreRing score={score} passing={passing} />

          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: t.fg, marginBottom: 4 }}>{exam?.title}</h1>
            <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 16 }}>
              {exam?.courseCode} · {exam?.courseName}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Your Score', value: `${score}%`, color: passed ? '#15803D' : '#B91C1C' },
                { label: 'Passing Score', value: `${passing}%`, color: t.fg },
                { label: 'Percentile', value: `${percentile}th`, color: '#2563EB' },
              ].map(item => (
                <div key={item.label} style={{
                  background: t.muted, borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</p>
                  <p style={{ fontSize: 11, color: t.fgMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Review session banner */}
        {hasReview && (
          <div style={{
            background: '#EFF6FF', border: '1.5px solid #BFDBFE',
            borderRadius: 12, padding: '14px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="fa-light fa-calendar-check" aria-hidden="true" style={{ color: '#2563EB', fontSize: 20 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF' }}>Review Session Available</p>
                <p style={{ fontSize: 13, color: '#3B82F6' }}>
                  View correct answers and rationale in a lockdown environment ·{' '}
                  {exam?.reviewSessionEnd && `Closes ${exam.reviewSessionEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </p>
              </div>
            </div>
            <button style={{
              padding: '8px 18px', borderRadius: 8,
              background: '#2563EB', color: '#FFF',
              border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              Enter Review <i className="fa-solid fa-arrow-right" aria-hidden="true" style={{ marginLeft: 4 }} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: `1px solid ${t.border}`, marginBottom: 24, gap: 0,
        }} role="tablist">
          {tabs.map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px', background: 'none',
                border: 'none', borderBottom: activeTab === tab ? `2px solid ${t.brand}` : '2px solid transparent',
                color: activeTab === tab ? t.brand : t.fgMuted,
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: 14, cursor: 'pointer',
                marginBottom: -1,
                transition: 'all 0.15s ease',
              }}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12, marginBottom: 24,
            }}>
              {[
                { icon: 'fa-check-circle', label: 'Correct', value: `${Math.round(score / 100 * (exam?.questionCount ?? 50))}`, color: '#15803D', bg: '#DCFCE7' },
                { icon: 'fa-times-circle', label: 'Incorrect', value: `${Math.round((100 - score) / 100 * (exam?.questionCount ?? 50))}`, color: '#B91C1C', bg: '#FEE2E2' },
                { icon: 'fa-flag', label: 'Flagged', value: '3', color: '#D97706', bg: '#FEF3C7' },
                { icon: 'fa-message-lines', label: 'Comments', value: exam?.allowComments ? '2' : '—', color: '#7C3AED', bg: '#F5F3FF' },
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
                  <p style={{ fontSize: 12, color: t.fgMuted, fontWeight: 600 }}>{item.label}</p>
                </div>
              ))}
            </div>

            {/* Performance insight */}
            <div style={{
              background: passed ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${passed ? '#4ADE80' : '#FECACA'}`,
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <i
                className={`fa-light ${passed ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}
                aria-hidden="true"
                style={{ color: passed ? '#15803D' : '#B91C1C', fontSize: 20, marginTop: 1 }}
              />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: passed ? '#15803D' : '#B91C1C', marginBottom: 4 }}>
                  {passed ? `Strong performance — you cleared the ${passing}% threshold` : `Score below the ${passing}% passing threshold`}
                </p>
                <p style={{ fontSize: 13, color: t.fg, lineHeight: 1.6 }}>
                  {passed
                    ? `You scored in the ${percentile}th percentile. Review your weakest content area to strengthen that competency before the next assessment.`
                    : 'Review the content area breakdown below to identify where to focus remediation. Contact your faculty to discuss next steps.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content area tab */}
        {activeTab === 'by-area' && (
          <div>
            <div style={{
              background: t.card, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: '20px 24px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: t.fg }}>Performance by Content Area</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: t.fgMuted }}>
                  {[
                    { color: '#4ADE80', label: '≥80% Strong' },
                    { color: '#FACC15', label: '70–79% Passing' },
                    { color: '#F87171', label: '<70% Below' },
                  ].map(l => (
                    <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>

              {exam?.contentAreas.filter(ca => ca.score !== undefined).map(ca => (
                <ContentAreaBar key={ca.id} ca={ca} />
              ))}

              {exam?.contentAreas.every(ca => ca.score === undefined) && (
                <p style={{ fontSize: 14, color: t.fgMuted, textAlign: 'center', padding: '20px 0' }}>
                  Content area breakdown not available for this assessment.
                </p>
              )}
            </div>

            {/* Competency link */}
            <div style={{
              background: t.brandSurface, border: `1px solid ${t.brandBorder}`,
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: t.brand }}>See how this maps to your course competencies</p>
                <p style={{ fontSize: 13, color: t.fgMuted }}>View aggregated performance across all {exam?.courseName} assessments</p>
              </div>
              <button
                onClick={() => navigate('/competency')}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: t.brand, color: '#FFF',
                  border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Course Dashboard <i className="fa-light fa-arrow-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
