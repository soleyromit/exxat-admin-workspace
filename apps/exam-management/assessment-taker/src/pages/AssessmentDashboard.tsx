/**
 * ASSESSMENT DASHBOARD — Student entry point
 *
 * Per Aarti (Apr 29–30 Granola sessions):
 *   "Active assessments must be prominently surfaced when students log in —
 *    whether they arrive via an email link or direct login."
 *
 * Priority order:
 *   1. Action Required — active / in_progress (hero)
 *   2. Coming Up — upcoming exams (compact rows)
 *   3. Results — past assessments (compact rows)
 *   4. System Messages — collapsed by default
 *
 * Entry points supported:
 *   - Via Exxat One / Prism tile (breadcrumb shown in header)
 *   - Standalone assessment login (header shows standalone mode)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '@exxatdesignux/ui';
import { ExamBadge } from '../components/ExamBadge';
import {
  MOCK_ASSESSMENTS,
  Assessment,
  AssessmentStatus,
  formatDuration,
  formatCountdown,
  getEffectiveDuration,
  getTimeRemaining,
  MOCK_NOTIFICATIONS,
  SystemNotification,
} from '../data/assessments';

// ─── Token aliases (CSS custom properties from studentUX globals.css) ─────────
const t = {
  bg: 'var(--background)',
  card: 'var(--card)',
  muted: 'var(--muted)',
  brand: 'var(--brand-color)',
  fg: 'var(--foreground)',
  fgMuted: 'var(--muted-foreground)',
  border: 'var(--border)',
  borderControl: 'var(--border)',
  ring: 'var(--ring)',
  destructive: 'var(--destructive)',
};

// ─── Section label class (shared across all four dashboard sections) ──────────
const sectionLabelClass = 'text-xs font-semibold text-muted-foreground mb-2.5';

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<AssessmentStatus, string> = {
  active:            'Ready to Start',
  in_progress:       'In Progress',
  upcoming:          'Upcoming',
  submitted:         'Submitted',
  results_pending:   'Results Pending',
  results_published: 'Results Available',
  review_available:  'Review Open',
  review_complete:   'Review Complete',
};
function StatusBadge({ status }: { status: AssessmentStatus }) {
  return <ExamBadge>{STATUS_LABELS[status] ?? status}</ExamBadge>;
}

// ─── Accommodation chip ───────────────────────────────────────────────────────
function AccommodationChip({ timeMultiplier }: { timeMultiplier: number }) {
  return (
    <Badge variant="secondary" className="rounded-full text-xs font-semibold" title="Time accommodation approved by Student Services">
      <i className="fa-light fa-clock" aria-hidden="true" />
      {timeMultiplier}× Time
    </Badge>
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


// ─── ActionRow — compact table row for active/in-progress exams ──────────────
function ActionRow({ exam, onNavigate }: { exam: Assessment; onNavigate: (path: string) => void }) {
  const effectiveMins = getEffectiveDuration(exam);
  const remainingSecs = getTimeRemaining(exam);
  const countdown = useCountdown(exam.status === 'in_progress' ? remainingSecs : 0);
  const isInProgress = exam.status === 'in_progress';
  const isWarning = isInProgress && countdown < 15 * 60;

  const typeLabel: Record<string, string> = {
    quiz: 'Quiz', midterm: 'Midterm', final: 'Final Exam',
    practical: 'Practical', review: 'Review',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: `1px solid ${t.border}`,
      gap: 12,
    }}>
      {/* Left: title + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: t.fg, marginBottom: 3 }}>{exam.title}</p>
        <p style={{ fontSize: 12, color: t.fgMuted }}>
          {exam.courseCode} · {formatDuration(effectiveMins)} · {exam.questionCount} Q
          {exam.allowedAttempts ? ` · ${exam.allowedAttempts} attempt${exam.allowedAttempts > 1 ? 's' : ''}` : ''}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 5 }}>
          <Badge variant="secondary">{typeLabel[exam.type] ?? exam.type}</Badge>
          {exam.isHighStakes && <Badge variant="outline">High Stakes</Badge>}
          {exam.accommodation && <AccommodationChip timeMultiplier={exam.accommodation.timeMultiplier} />}
        </div>
      </div>

      {/* Right: time indicator + action */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        {isInProgress ? (
          <span
            aria-live="polite"
            style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: isWarning ? t.destructive : t.brand }}
          >
            {formatCountdown(countdown)} left
          </span>
        ) : (
          <span style={{ fontSize: 12, color: t.fgMuted }}>
            Closes {exam.windowEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
        <Button
          variant="default"
          size="sm"
          onClick={() => onNavigate(`/exam/${exam.id}/setup`)}
          aria-label={isInProgress ? `Continue ${exam.title}` : `Start ${exam.title}`}
        >
          {isInProgress ? 'Continue' : 'Start Exam'}
        </Button>
      </div>
    </div>
  );
}

// ─── UpcomingRow — compact list row (no card) ─────────────────────────────────
function UpcomingRow({ exam }: { exam: Assessment }) {
  const dayLabel = (() => {
    const diff = Math.ceil((exam.windowStart.getTime() - Date.now()) / 86_400_000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return exam.windowStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  })();

  const time = exam.windowStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const effectiveMins = getEffectiveDuration(exam);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: `1px solid ${t.border}`,
      gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: t.fg, marginBottom: 2 }}>{exam.title}</p>
        <p style={{ fontSize: 12, color: t.fgMuted }}>
          {exam.courseCode} · {dayLabel} at {time} · {effectiveMins} min · {exam.questionCount} Q
        </p>
      </div>
      <StatusBadge status={exam.status} />
    </div>
  );
}

// ─── ResultRow — compact list row for past assessments ───────────────────────
function ResultRow({ exam, onView }: { exam: Assessment; onView: () => void }) {
  const isPending = exam.status === 'results_pending' || exam.status === 'submitted';
  const isPublished = exam.status === 'results_published';
  const hasReview = exam.status === 'review_available';
  const date = exam.windowStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: `1px solid ${t.border}`,
      gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: t.fg, marginBottom: 2 }}>{exam.title}</p>
        <p style={{ fontSize: 12, color: t.fgMuted }}>{exam.courseCode} · {date}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <StatusBadge status={exam.status} />
        {isPublished && exam.score !== undefined && (
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: t.fg,
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
          <Button variant="outline" size="sm" onClick={onView}>
            {hasReview ? 'Enter Review' : 'View Results'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── System notifications audit log ──────────────────────────────────────────
// Per Aarti + Vishaka (May 14): students can see every email the platform sent
// them; faculty can verify delivery ("you got it at 9AM Monday morning").
function SystemNotificationsSection() {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? MOCK_NOTIFICATIONS : MOCK_NOTIFICATIONS.slice(0, 3)

  const KIND_CONFIG: Record<SystemNotification['kind'], { icon: string; label: string }> = {
    results_published: { icon: 'fa-file-chart-column',   label: 'Results Published' },
    review_open:       { icon: 'fa-book-open',           label: 'Review Open' },
  }

  function relativeDate(d: Date): string {
    const diffMs = Date.now() - d.getTime()
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <section aria-labelledby="sys-notif-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2
          id="sys-notif-heading"
          className={sectionLabelClass}
        >
          System Messages
        </h2>
        {MOCK_NOTIFICATIONS.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
            style={{ color: t.brand, padding: '0 4px', height: 'auto' }}
          >
            {expanded ? 'Show less' : `View all ${MOCK_NOTIFICATIONS.length}`}
          </Button>
        )}
      </div>
      <Card className="overflow-hidden">
        {visible.map((n, idx) => {
          const cfg = KIND_CONFIG[n.kind]
          return (
            <div
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderBottom: idx < visible.length - 1 ? `1px solid ${t.border}` : 'none',
              }}
            >
              {/* Icon */}
              <div className="flex w-8 h-8 shrink-0 items-center justify-center rounded" style={{ background: t.muted }}>
                <i className={`fa-light ${cfg.icon} text-[13px] text-muted-foreground`} aria-hidden="true" />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: t.fg, margin: 0, lineHeight: 1.3 }}>
                  {cfg.label}
                </p>
                <p style={{ fontSize: 12, color: t.fgMuted, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.assessmentTitle} · {n.courseCode}
                </p>
              </div>

              {/* Date + channel */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: t.fgMuted }}>{relativeDate(n.sentAt)}</span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: t.fgMuted,
                  display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  <i className="fa-light fa-envelope" aria-hidden="true" style={{ fontSize: 12 }} />
                  Email
                </span>
              </div>
            </div>
          )
        })}
      </Card>
    </section>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function AssessmentDashboard() {
  const navigate = useNavigate();

  const active = MOCK_ASSESSMENTS.filter(a => a.status === 'active' || a.status === 'in_progress');
  const upcoming = MOCK_ASSESSMENTS.filter(a => a.status === 'upcoming');
  const past = MOCK_ASSESSMENTS.filter(a =>
    ['submitted', 'results_pending', 'results_published', 'review_available', 'review_complete'].includes(a.status)
  );

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hasActionItems = active.length > 0;

  return (
    <div style={{ background: t.bg, minHeight: '100%' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: t.fg, marginBottom: 2 }}>My Assessments</h1>
          <p style={{ fontSize: 13, color: t.fgMuted }}>{today}</p>
        </div>

        {/* ── 1. Action Required — active + download queue together ────────── */}
        {hasActionItems && (
          <section aria-labelledby="section-action" style={{ marginBottom: 24 }}>
            <h2 id="section-action" className={sectionLabelClass}>Action Required</h2>
            <div style={{ borderTop: `1px solid ${t.border}` }}>
              {active.map(e => (
                <ActionRow key={e.id} exam={e} onNavigate={navigate} />
              ))}
            </div>
          </section>
        )}

        {/* ── 2. Coming Up ─────────────────────────────────────────────────── */}
        {upcoming.length > 0 && (
          <section aria-labelledby="section-coming-up" style={{ marginBottom: 24 }}>
            <h2 id="section-coming-up" className={sectionLabelClass}>Coming Up</h2>
            <div style={{ borderTop: `1px solid ${t.border}` }}>
              {upcoming.map(e => (
                <UpcomingRow key={e.id} exam={e} />
              ))}
            </div>
          </section>
        )}

        {/* ── 3. Results — grouped by term ─────────────────────────────────── */}
        {past.length > 0 && (() => {
          // Group past results by term label; ungrouped entries fall under "Current Term"
          const grouped = past.reduce<Record<string, typeof past>>((acc, e) => {
            const key = e.term ?? 'Current Term';
            (acc[key] ??= []).push(e);
            return acc;
          }, {});
          const termOrder = Object.keys(grouped);
          return (
            <section aria-labelledby="section-results" style={{ marginBottom: 24 }}>
              <h2 id="section-results" className={sectionLabelClass}>Results</h2>
              {termOrder.map(term => (
                <div key={term} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: t.fgMuted, marginBottom: 0 }}>{term}</p>
                  <div style={{ borderTop: `1px solid ${t.border}` }}>
                    {grouped[term].map(e => (
                      <ResultRow key={e.id} exam={e} onView={() => navigate(`/exam/${e.id}/results`)} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          );
        })()}

        {/* ── 4. System Messages — collapsed by default ────────────────────── */}
        {/* SystemNotificationsSection renders its own labeled <section>; no
            outer landmark wrapper (avoids a redundant nested region — axe
            landmark-unique). Spacing applied via wrapper div, not <section>. */}
        <div style={{ marginBottom: 24 }}>
          <SystemNotificationsSection />
        </div>

        {/* Empty state */}
        {!hasActionItems && upcoming.length === 0 && past.length === 0 && (
          <Card className="text-center px-5 py-16">
            <i className="fa-light fa-graduation-cap block mb-4 text-5xl text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-bold text-foreground mb-2">No assessments yet</h2>
            <p className="text-sm text-muted-foreground">Your scheduled exams will appear here. Check back closer to your exam date.</p>
          </Card>
        )}

      </div>
    </div>
  );
}
