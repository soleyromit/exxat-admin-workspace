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
        {/* Track */}
        <circle cx={70} cy={70} r={radius} fill="none" stroke="var(--muted)" strokeWidth={10} />
        {/* Progress */}
        <circle
          cx={70} cy={70} r={radius} fill="none"
          stroke={passed ? 'var(--state-success-accent)' : 'var(--state-bar-fail)'}
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
        <span style={{ fontSize: 28, fontWeight: 800, color: passed ? 'var(--state-success-dark)' : 'var(--state-error-text-dark)', lineHeight: 1 }}>{score}%</span>
        <ExamBadge
          bg={passed ? 'var(--state-success-bg-soft)' : 'var(--state-error-bg-soft)'}
          fg={passed ? 'var(--state-success-dark)' : 'var(--state-error-text-dark)'}
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
        <span style={{
          fontSize: 15, fontWeight: 800,
          color: score >= 80 ? 'var(--state-success-dark)' : score >= 70 ? 'var(--state-warning-dark)' : 'var(--state-error-text-dark)',
        }}>
          {score}%
        </span>
      </div>
      <div style={{ height: 8, background: t.muted, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${(score / maxScore) * 100}%`,
          borderRadius: 99,
          background: score >= 80 ? 'var(--state-success-accent)' : score >= 70 ? 'var(--state-warning-accent)' : 'var(--state-bar-fail)',
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
    <div style={{ background: t.bg, fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100%' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* Score hero */}
        <div style={{
          background: t.card, border: `1px solid ${t.border}`,
          borderRadius: 16, padding: 28, marginBottom: 24,
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
                { label: 'Your Score', value: `${score}%`, color: passed ? 'var(--state-success-dark)' : 'var(--state-error-text-dark)' },
                { label: 'Passing Score', value: `${passing}%`, color: t.fg },
                { label: 'Percentile', value: `${percentile}th`, color: 'var(--state-info-blue-dark)' },
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
            background: 'var(--state-info-blue-bg)', border: '1.5px solid var(--state-info-blue-border)',
            borderRadius: 12, padding: '14px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="fa-light fa-calendar-check" aria-hidden="true" style={{ color: 'var(--state-info-blue-dark)', fontSize: 20 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--state-info-blue-dark)' }}>Review Session Available</p>
                <p style={{ fontSize: 13, color: 'var(--state-info-blue-mid)' }}>
                  View correct answers and rationale in a lockdown environment ·{' '}
                  {exam?.reviewSessionEnd && `Closes ${exam.reviewSessionEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/exam/${id ?? exam?.id}/review`)}
              style={{ background: 'var(--state-info-blue-dark)' }}
            >
              Enter Review <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* Faculty Q&A banner — gated by institution + course chat capability.
            For the demo this is always visible; in production check the
            institution + course flags before rendering. */}
        <div style={{
          background: 'color-mix(in oklch, var(--brand-color) 6%, var(--card))',
          border: '1px solid color-mix(in oklch, var(--brand-color) 18%, var(--border))',
          borderLeft: '4px solid var(--brand-color)',
          borderRadius: 12, padding: '14px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fa-duotone fa-solid fa-comments" aria-hidden="true" style={{ color: 'var(--brand-color)', fontSize: 20 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>Faculty Q&amp;A is open for this assessment</p>
              <p style={{ fontSize: 13, color: t.fgMuted }}>
                Have a question on a specific item or your performance? Message your course coordinator. Replies typically within 24 hours.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(`/exam/${id ?? exam?.id}/chat`)}
            style={{ background: 'var(--brand-color)', color: 'var(--brand-foreground)' }}
          >
            <i className="fa-light fa-paper-plane" aria-hidden="true" />
            Message faculty
          </Button>
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
                borderBottom: activeTab === tab ? `2px solid ${t.brand}` : '2px solid transparent',
                color: activeTab === tab ? t.brand : t.fgMuted,
                fontWeight: activeTab === tab ? 700 : 500,
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
                { icon: 'fa-check-circle', label: 'Correct', value: `${Math.round(score / 100 * (exam?.questionCount ?? 50))}`, color: 'var(--state-success-dark)', bg: 'var(--state-success-bg-soft)' },
                { icon: 'fa-times-circle', label: 'Incorrect', value: `${Math.round((100 - score) / 100 * (exam?.questionCount ?? 50))}`, color: 'var(--state-error-text-dark)', bg: 'var(--state-error-bg-soft)' },
                { icon: 'fa-flag', label: 'Flagged', value: '3', color: 'var(--state-warning-dark)', bg: 'var(--state-warning-bg-soft)' },
                { icon: 'fa-message-lines', label: 'Comments', value: exam?.allowComments ? '2' : '—', color: 'var(--state-purple-dark)', bg: 'var(--state-purple-bg)' },
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
              background: passed ? 'var(--state-success-bg)' : 'var(--state-error-bg-soft)',
              border: `1px solid ${passed ? 'var(--state-success-accent)' : 'var(--state-error-border-soft)'}`,
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <i
                className={`fa-light ${passed ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}
                aria-hidden="true"
                style={{ color: passed ? 'var(--state-success-dark)' : 'var(--state-error-text-dark)', fontSize: 20, marginTop: 1 }}
              />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: passed ? 'var(--state-success-dark)' : 'var(--state-error-text-dark)', marginBottom: 4 }}>
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
                    { color: 'var(--state-success-accent)', label: '≥80% Strong' },
                    { color: 'var(--state-warning-accent)', label: '70–79% Passing' },
                    { color: 'var(--state-bar-fail)', label: '<70% Below' },
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
              <Button size="sm" onClick={() => navigate('/competency')} className="whitespace-nowrap">
                Course Dashboard <i className="fa-light fa-arrow-right" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
