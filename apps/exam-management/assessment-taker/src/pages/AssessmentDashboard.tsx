/**
 * ASSESSMENT DASHBOARD — Student entry point
 *
 * Per Aarti (Apr 29–30 Granola sessions):
 *   "Active assessments must be prominently surfaced when students log in —
 *    whether they arrive via an email link or direct login."
 *
 * Priority order:
 *   1. Active / In-Progress (hero treatment — cannot miss this)
 *   2. Upcoming (scheduled, not yet open)
 *   3. Review Sessions (open lockdown review windows)
 *   4. Past Assessments (results published or pending)
 *   5. Competency summary strip (entry to full competency dashboard)
 *
 * Entry points supported:
 *   - Via Exxat One / Prism tile (breadcrumb shown in header)
 *   - Standalone assessment login (header shows standalone mode)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@exxat/ds/packages/ui/src';
import { ExamBadge } from '../components/ExamBadge';
import {
  MOCK_ASSESSMENTS,
  Assessment,
  AssessmentStatus,
  formatDuration,
  formatCountdown,
  getEffectiveDuration,
  getTimeRemaining,
  MOCK_COURSE_COMPETENCIES,
} from '../data/assessments';

// ─── Token aliases (CSS custom properties from studentUX globals.css) ─────────
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
  ring: 'var(--ring)',
  destructive: 'var(--destructive)',
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AssessmentStatus }) {
  const config: Record<string, { label: string; bg: string; text: string; dot?: string }> = {
    active:            { label: 'Ready to Start', bg: 'var(--state-success-bg-soft)', text: 'var(--state-success-dark)', dot: 'var(--state-success-accent)' },
    in_progress:       { label: 'In Progress',    bg: t.brandSurface, text: 'var(--brand-color-dark)', dot: t.brand },
    upcoming:          { label: 'Upcoming',        bg: 'var(--muted)', text: 'var(--muted-foreground)' },
    submitted:         { label: 'Submitted',       bg: 'var(--state-warning-bg)', text: 'var(--state-warning-darkest)', dot: 'var(--state-warning-accent)' },
    results_pending:   { label: 'Results Pending', bg: 'var(--state-warning-bg)', text: 'var(--state-warning-darkest)', dot: 'var(--state-warning-text)' },
    results_published: { label: 'Results Available', bg: 'var(--state-success-bg-soft)', text: 'var(--state-success-dark)', dot: 'var(--state-success-accent)' },
    review_available:  { label: 'Review Open',    bg: 'var(--state-info-blue-bg)', text: 'var(--state-info-blue-dark)', dot: 'var(--state-info-blue-mid)' },
    review_complete:   { label: 'Review Complete', bg: 'var(--muted)', text: 'var(--muted-foreground)' },
  };
  const c = config[status] ?? config.upcoming;
  return <ExamBadge bg={c.bg} fg={c.text} dot={c.dot}>{c.label}</ExamBadge>;
}

// ─── Accommodation chip ───────────────────────────────────────────────────────
function AccommodationChip({ timeMultiplier }: { timeMultiplier: number }) {
  return (
    <ExamBadge bg="var(--state-info-blue-bg)" fg="var(--state-info-blue-dark)" title="Time accommodation approved by Student Services">
      <i className="fa-light fa-clock" aria-hidden="true" />
      {timeMultiplier}× Time
    </ExamBadge>
  );
}

// ─── Countdown timer hook ─────────────────────────────────────────────────────
function useCountdown(totalSeconds: number) {
  const [seconds, setSeconds] = useState(totalSeconds);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return seconds;
}

// ─── Active / Hero exam card ──────────────────────────────────────────────────
function ActiveExamCard({ exam }: { exam: Assessment }) {
  const navigate = useNavigate();
  const effectiveMins = getEffectiveDuration(exam);
  const remainingSecs = getTimeRemaining(exam);
  const countdown = useCountdown(remainingSecs);
  const isInProgress = exam.status === 'in_progress';

  const pct = Math.round(((effectiveMins * 60 - countdown) / (effectiveMins * 60)) * 100);
  const isWarning = countdown < 15 * 60;  // < 15 min remaining

  return (
    <div
      role="region"
      aria-label={`Active exam: ${exam.title}`}
      style={{
        background: t.card,
        border: `2px solid ${t.brand}`,
        borderRadius: 16,
        padding: 28,
        boxShadow: '0 4px 24px var(--shadow-brand)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Purple top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: t.brand, borderRadius: '16px 16px 0 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        {/* Left: exam info */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <StatusBadge status={exam.status} />
            {exam.accommodation && <AccommodationChip timeMultiplier={exam.accommodation.timeMultiplier} />}
            {exam.isHighStakes && (
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--state-warning-darkest)', background: 'var(--state-warning-bg)', padding: '3px 10px', borderRadius: 99 }}>
                High-Stakes
              </span>
            )}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: t.fg, marginBottom: 4, lineHeight: 1.3 }}>
            {exam.title}
          </h2>
          <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 12 }}>
            {exam.courseCode} · {exam.courseName} · {exam.facultyName}
          </p>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: t.fgMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-light fa-list-check" aria-hidden="true" style={{ color: t.brand }} />
              {exam.questionCount} questions
            </span>
            <span style={{ fontSize: 13, color: t.fgMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-light fa-clock" aria-hidden="true" style={{ color: t.brand }} />
              {formatDuration(getEffectiveDuration(exam))} total
              {exam.accommodation && (
                <span style={{ color: 'var(--state-info-blue-dark)', fontSize: 12 }}>
                  ({formatDuration(exam.durationMinutes)} + {((exam.accommodation.timeMultiplier - 1) * 100).toFixed(0)}% accommodation)
                </span>
              )}
            </span>
            <span style={{ fontSize: 13, color: t.fgMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-light fa-shield-check" aria-hidden="true" style={{ color: t.brand }} />
              Passing: {exam.passingScore}%
            </span>
          </div>
        </div>

        {/* Right: timer + CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          {isInProgress && (
            <div
              style={{
                textAlign: 'center',
                background: isWarning ? 'var(--state-error-bg-soft)' : t.brandSurface,
                border: `1px solid ${isWarning ? 'var(--state-error-border-soft)' : t.brandBorder}`,
                borderRadius: 12, padding: '10px 20px',
              }}
              aria-live="polite"
              aria-label={`Time remaining: ${formatCountdown(countdown)}`}
            >
              <p style={{ fontSize: 11, fontWeight: 600, color: isWarning ? 'var(--state-error-text-dark)' : t.fgMuted, marginBottom: 2 }}>TIME REMAINING</p>
              <p style={{ fontFamily: 'Menlo, Monaco, monospace', fontSize: 26, fontWeight: 700, color: isWarning ? 'var(--state-error-text-dark)' : t.brand, letterSpacing: 2 }}>
                {formatCountdown(countdown)}
              </p>
              {/* Progress bar */}
              <div style={{ marginTop: 6, height: 3, background: t.muted, borderRadius: 99, width: 120, margin: '6px auto 0' }}>
                <div style={{ height: '100%', background: isWarning ? 'var(--state-error-accent)' : t.brand, borderRadius: 99, width: `${Math.min(100, pct)}%`, transition: 'width 1s linear' }} />
              </div>
            </div>
          )}

          <Button
            size="lg"
            onClick={() => navigate(isInProgress ? `/exam/${exam.id}/take` : `/exam/${exam.id}/setup`)}
            aria-label={isInProgress ? `Continue ${exam.title}` : `Start ${exam.title}`}
          >
            <i className={`fa-solid ${isInProgress ? 'fa-play' : 'fa-arrow-right'}`} aria-hidden="true" />
            {isInProgress ? 'Continue Exam' : 'Start Exam'}
          </Button>
        </div>
      </div>

      {/* Content areas strip */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.borderControl}` }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: t.fgMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Content Areas
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {exam.contentAreas.map(ca => (
            <span key={ca.id} style={{
              fontSize: 12, color: t.fgMuted,
              background: t.muted, borderRadius: 6, padding: '4px 10px',
            }}>
              {ca.name} <span style={{ color: t.fg, fontWeight: 600 }}>{ca.weight}%</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Upcoming exam card ───────────────────────────────────────────────────────
function UpcomingCard({ exam }: { exam: Assessment }) {
  const dayLabel = (() => {
    const diff = Math.ceil((exam.windowStart.getTime() - Date.now()) / 86_400_000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return exam.windowStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  })();

  return (
    <div style={{
      background: t.card, border: `1px solid ${t.border}`,
      borderRadius: 12, padding: 20,
      transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 16px var(--shadow-card)';
        e.currentTarget.style.borderColor = t.borderControl;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = t.border;
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <StatusBadge status={exam.status} />
        {exam.accommodation && <AccommodationChip timeMultiplier={exam.accommodation.timeMultiplier} />}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: t.fg, marginBottom: 4 }}>{exam.title}</h3>
      <p style={{ fontSize: 13, color: t.fgMuted, marginBottom: 12 }}>{exam.courseCode} · {exam.courseName}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: t.fgMuted }}>
          <i className="fa-light fa-calendar" aria-hidden="true" style={{ color: t.brand, width: 14 }} />
          {dayLabel}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: t.fgMuted }}>
          <i className="fa-light fa-clock" aria-hidden="true" style={{ color: t.brand, width: 14 }} />
          {formatDuration(getEffectiveDuration(exam))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: t.fgMuted }}>
          <i className="fa-light fa-list-check" aria-hidden="true" style={{ color: t.brand, width: 14 }} />
          {exam.questionCount} questions
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: t.fgMuted }}>
          <i className="fa-light fa-shield-check" aria-hidden="true" style={{ color: t.brand, width: 14 }} />
          Pass: {exam.passingScore}%
        </div>
      </div>
    </div>
  );
}

// ─── Past assessment row ──────────────────────────────────────────────────────
function PastAssessmentRow({ exam, onView }: { exam: Assessment; onView: () => void }) {
  const isPending = exam.status === 'results_pending' || exam.status === 'submitted';
  const isPublished = exam.status === 'results_published';
  const hasReview = exam.status === 'review_available';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 0', borderBottom: `1px solid ${t.border}`,
        gap: 12, flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: t.fg, marginBottom: 2 }}>{exam.title}</p>
        <p style={{ fontSize: 12, color: t.fgMuted }}>{exam.courseCode} · {exam.windowStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StatusBadge status={exam.status} />
        {isPublished && exam.score !== undefined && (
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: exam.score >= exam.passingScore ? 'var(--state-success-dark)' : 'var(--state-error-text-dark)',
          }}>
            {exam.score}%
          </span>
        )}
        {isPending && exam.resultsHoldUntil && (
          <span style={{ fontSize: 12, color: t.fgMuted }}>
            Est. {exam.resultsHoldUntil.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {(isPublished || hasReview) && (
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
          >
            {hasReview ? 'Enter Review' : 'View Results'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Competency summary strip ─────────────────────────────────────────────────
function CompetencySummaryStrip({ onViewAll }: { onViewAll: () => void }) {
  const published = MOCK_COURSE_COMPETENCIES.filter(c => c.averageScore > 0);
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: t.fg }}>Competency Progress</h3>
          <p style={{ fontSize: 13, color: t.fgMuted }}>Cross-assessment performance by content area</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="font-semibold"
          style={{ color: t.brand }}
        >
          View full dashboard <i className="fa-light fa-arrow-right" aria-hidden="true" />
        </Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {published.map(course =>
          course.contentAreas.map(ca => (
            <div key={`${course.courseCode}-${ca.name}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: t.fgMuted, flex: 1, paddingRight: 8 }}>{ca.name}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: ca.score >= 75 ? 'var(--state-success-dark)' : ca.score >= 60 ? 'var(--state-warning-dark)' : 'var(--state-error-text-dark)',
                }}>
                  {ca.score}%
                </span>
              </div>
              <div style={{ height: 5, background: t.muted, borderRadius: 99 }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: `${ca.score}%`,
                  background: ca.score >= 75 ? 'var(--state-success-accent)' : ca.score >= 60 ? 'var(--state-warning-accent)' : 'var(--state-bar-fail)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function AssessmentDashboard() {
  const navigate = useNavigate();

  const active = MOCK_ASSESSMENTS.filter(a => a.status === 'active' || a.status === 'in_progress');
  const upcoming = MOCK_ASSESSMENTS.filter(a => a.status === 'upcoming');
  const reviewOpen = MOCK_ASSESSMENTS.filter(a => a.status === 'review_available');
  const past = MOCK_ASSESSMENTS.filter(a =>
    ['submitted', 'results_pending', 'results_published', 'review_complete'].includes(a.status)
  );

  return (
    <div style={{ background: t.bg, fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100%' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px 60px' }}>

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.fg, marginBottom: 4 }}>My Assessments</h1>
          <p style={{ fontSize: 14, color: t.fgMuted }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* ─── ACTIVE EXAMS — hero section ──────────────────────────────────── */}
        {active.length > 0 && (
          <section aria-label="Active exams" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--state-success-accent)', flexShrink: 0 }} />
              <h2 style={{ fontSize: 12, fontWeight: 700, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Active Now
              </h2>
            </div>
            {active.map(exam => <ActiveExamCard key={exam.id} exam={exam} />)}
          </section>
        )}

        {/* ─── REVIEW SESSIONS ──────────────────────────────────────────────── */}
        {reviewOpen.length > 0 && (
          <section aria-label="Open review sessions" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <i className="fa-light fa-eye" aria-hidden="true" style={{ color: 'var(--state-info-blue-dark)', fontSize: 13 }} />
              <h2 style={{ fontSize: 12, fontWeight: 700, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Review Sessions Open
              </h2>
            </div>
            {reviewOpen.map(exam => (
              <div key={exam.id} style={{
                background: 'var(--state-info-blue-bg)', border: '1.5px solid var(--state-info-blue-border)', borderRadius: 12, padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--state-info-blue-dark)' }}>{exam.title}</p>
                  <p style={{ fontSize: 13, color: 'var(--state-info-blue-mid)' }}>
                    <i className="fa-light fa-lock" aria-hidden="true" style={{ marginRight: 5 }} />
                    Lockdown review · Correct answers + rationale visible ·{' '}
                    {exam.reviewSessionEnd && `Closes ${exam.reviewSessionEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/exam/${exam.id}/results`)}
                  style={{ background: 'var(--state-info-blue-dark)' }}
                >
                  Enter Review <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </section>
        )}

        {/* ─── UPCOMING ─────────────────────────────────────────────────────── */}
        {upcoming.length > 0 && (
          <section aria-label="Upcoming assessments" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <i className="fa-light fa-calendar" aria-hidden="true" style={{ color: t.fgMuted, fontSize: 13 }} />
              <h2 style={{ fontSize: 12, fontWeight: 700, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Upcoming ({upcoming.length})
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {upcoming.map(exam => <UpcomingCard key={exam.id} exam={exam} />)}
            </div>
          </section>
        )}

        {/* ─── PAST ASSESSMENTS ─────────────────────────────────────────────── */}
        {past.length > 0 && (
          <section aria-label="Past assessments" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <i className="fa-light fa-file-check" aria-hidden="true" style={{ color: t.fgMuted, fontSize: 13 }} />
              <h2 style={{ fontSize: 12, fontWeight: 700, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Past Assessments
              </h2>
            </div>
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: '4px 20px' }}>
              {past.map(exam => (
                <PastAssessmentRow
                  key={exam.id}
                  exam={exam}
                  onView={() => navigate(`/exam/${exam.id}/results`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── COMPETENCY STRIP ─────────────────────────────────────────────── */}
        {active.length === 0 && upcoming.length === 0 && past.length === 0 ? (
          // Empty state
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: t.card, border: `1px solid ${t.border}`, borderRadius: 16,
          }}>
            <i className="fa-light fa-graduation-cap" aria-hidden="true" style={{ fontSize: 48, color: t.fgMuted, marginBottom: 16, display: 'block' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: t.fg, marginBottom: 8 }}>No assessments yet</h2>
            <p style={{ fontSize: 14, color: t.fgMuted }}>Your scheduled exams will appear here. Check back closer to your exam date.</p>
          </div>
        ) : (
          <CompetencySummaryStrip onViewAll={() => navigate('/competency')} />
        )}
      </div>
    </div>
  );
}
