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

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@exxat/ds/packages/ui/src';
import { ExamBadge } from '../components/ExamBadge';
import { MOCK_ASSESSMENTS, ContentArea } from '../data/assessments';

const t = {
  bg: 'var(--background)',
  card: 'var(--card)',
  muted: 'var(--muted)',
  brand: 'var(--brand-color)',
  brandDark: 'var(--brand-color-dark)',
  brandSurface: 'var(--brand-color-light, #F5F3FF)',
  brandBorder: 'var(--brand-tint, #EDE9FE)',
  fg: 'var(--foreground)',
  fgMuted: 'var(--muted-foreground)',
  border: 'var(--border)',
  borderControl: 'var(--border)',
};

function ScoreRing({ score, passing }: { score: number; passing: number }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const pct = score / 100;
  const passed = score >= passing;

  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width={140} height={140} viewBox="0 0 140 140" aria-hidden="true">
        <circle cx={70} cy={70} r={radius} fill="none" stroke={t.muted} strokeWidth={10} />
        <circle
          cx={70} cy={70} r={radius} fill="none"
          stroke={t.fg}
          strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.8s ease', opacity: 0.85 }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: t.fg, lineHeight: 1 }}>{score}%</span>
        <ExamBadge
          bg={t.muted}
          fg={t.fgMuted}
          className="mt-1"
        >
          {passed ? 'PASSED' : 'BELOW PASSING'}
        </ExamBadge>
      </div>
    </div>
  );
}

function ContentAreaBar({ ca, maxScore = 100 }: { ca: ContentArea; maxScore?: number }) {
  const score = ca.score ?? 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.fg }}>{ca.name}</span>
          <span style={{ fontSize: 12, color: t.fgMuted, marginLeft: 8 }}>{ca.questionCount} questions · {ca.weight}% of grade</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: t.fg }}>
          {score}%
        </span>
      </div>
      <div style={{ height: 6, background: t.muted, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${(score / maxScore) * 100}%`,
          borderRadius: 99,
          background: t.fg, opacity: 0.85,
          transition: 'width 0.7s ease',
        }} />
      </div>
      {/* Passing line indicator */}
      <div style={{ position: 'relative', height: 0 }}>
        <div style={{
          position: 'absolute',
          left: '70%', top: -6, width: 1, height: 6,
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
    <div style={{ background: t.bg, fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100%' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* Score hero — single connected block: score + KPIs + actions */}
        <div style={{
          background: t.card, border: `1px solid ${t.border}`,
          borderRadius: 16, marginBottom: 24, overflow: 'hidden',
        }}>
          <div style={{
            padding: 28,
            display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <ScoreRing score={score} passing={passing} />

            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 className="font-heading" style={{ fontSize: 24, fontWeight: 700, color: t.fg, marginBottom: 4, lineHeight: 1.2 }}>{exam?.title}</h1>
              <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 16 }}>
                {exam?.courseCode} · {exam?.courseName}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Your Score',    value: `${score}%` },
                  { label: 'Passing Score', value: `${passing}%` },
                  { label: 'Percentile',    value: `${percentile}th` },
                ].map(item => (
                  <div key={item.label} style={{
                    background: t.muted, borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                  }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: t.fg }}>{item.value}</p>
                    <p style={{ fontSize: 11, color: t.fgMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Connected action row inside the hero — review + faculty live here,
              not as separate colored banners that interrupt the flow. */}
          <div style={{
            borderTop: `1px solid ${t.border}`,
            padding: '12px 28px',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            {hasReview && (
              <Button
                size="sm"
                variant="default"
                onClick={() => navigate(`/exam/${id ?? exam?.id}/review`)}
                className="gap-1.5"
              >
                <i className="fa-light fa-calendar-check" aria-hidden="true" />
                Enter review
                {exam?.reviewSessionEnd && (
                  <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 400 }}>
                    · closes {exam.reviewSessionEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/exam/${id ?? exam?.id}/chat`)}
              className="gap-1.5"
            >
              <i className="fa-light fa-paper-plane" aria-hidden="true" />
              Message faculty
            </Button>
            <span style={{ fontSize: 12, color: t.fgMuted, marginLeft: 'auto' }}>
              Replies typically within 24 hours
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: `1px solid ${t.border}`, marginBottom: 24, gap: 0,
        }} role="tablist">
          {tabs.map(tab => (
            <Button
              key={tab}
              variant="ghost"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className="rounded-none px-5 py-2.5 h-auto -mb-px text-sm"
              style={{
                borderBottom: activeTab === tab ? `2px solid ${t.fg}` : '2px solid transparent',
                color: activeTab === tab ? t.fg : t.fgMuted,
                fontWeight: activeTab === tab ? 600 : 500,
              }}
            >
              {tabLabels[tab]}
            </Button>
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
                { icon: 'fa-check-circle',  label: 'Correct',   value: `${Math.round(score / 100 * (exam?.questionCount ?? 50))}` },
                { icon: 'fa-times-circle',  label: 'Incorrect', value: `${Math.round((100 - score) / 100 * (exam?.questionCount ?? 50))}` },
                { icon: 'fa-flag',          label: 'Flagged',   value: '3' },
                { icon: 'fa-message-lines', label: 'Comments',  value: exam?.allowComments ? '2' : '—' },
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
                  <p style={{ fontSize: 12, color: t.fgMuted, fontWeight: 600 }}>{item.label}</p>
                </div>
              ))}
            </div>

            {/* Performance insight — neutral, not red */}
            <div style={{
              background: t.muted, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <i
                className={`fa-light ${passed ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}
                aria-hidden="true"
                style={{ color: t.fgMuted, fontSize: 20, marginTop: 1 }}
              />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: t.fg, marginBottom: 4 }}>
                  {passed ? `Strong performance — you cleared the ${passing}% threshold` : `Score below the ${passing}% passing threshold`}
                </p>
                <p style={{ fontSize: 13, color: t.fgMuted, lineHeight: 1.6 }}>
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
                <p style={{ fontSize: 13, fontWeight: 600, color: t.fg }}>Performance by Content Area</p>
                <span style={{ fontSize: 11, color: t.fgMuted }}>
                  Marker shows the {passing}% passing threshold
                </span>
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

            {/* Competency link — neutral, low-emphasis */}
            <div style={{
              background: t.muted, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: t.fg }}>See how this maps to your course competencies</p>
                <p style={{ fontSize: 13, color: t.fgMuted }}>View aggregated performance across all {exam?.courseName} assessments</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/competency')} className="whitespace-nowrap">
                Course Dashboard <i className="fa-light fa-arrow-right" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
