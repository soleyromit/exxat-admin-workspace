/**
 * Pre-submit review screen — shown when student clicks Submit.
 *
 * Aarti May 14: Students should see answered/skipped/flagged before final submit.
 * Students can click a question cell to jump back to it (and close the overlay).
 */

import { Button } from '@exxat/ds/packages/ui/src';
import { Question } from '../data/questions';

interface SubmitReviewOverlayProps {
  questions: Question[];
  currentIndex: number;
  answeredSet: Set<number>;
  flaggedSet: Set<number>;
  highestReachedIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
  onConfirmSubmit: () => void;
}

export function SubmitReviewOverlay({
  questions,
  answeredSet,
  flaggedSet,
  highestReachedIndex,
  onNavigate,
  onClose,
  onConfirmSubmit,
}: SubmitReviewOverlayProps) {
  const answeredCount = answeredSet.size;
  const flaggedCount = flaggedSet.size;
  const skippedCount = Array.from({ length: highestReachedIndex + 1 }, (_, i) => i)
    .filter(i => !answeredSet.has(i)).length;
  const unansweredCount = questions.length - answeredCount;

  function getCellStatus(index: number): 'answered' | 'flagged' | 'skipped' | 'unreached' {
    const isAnswered = answeredSet.has(index);
    const isFlagged = flaggedSet.has(index);
    if (isAnswered && isFlagged) return 'flagged';
    if (isAnswered) return 'answered';
    if (index <= highestReachedIndex) return 'skipped';
    return 'unreached';
  }

  const STATUS = {
    answered:  { bg: 'var(--state-success-bg)',  border: 'var(--state-success-accent)',  text: 'var(--state-success-dark)',     label: 'Answered' },
    flagged:   { bg: 'var(--state-warning-bg)',   border: 'var(--state-warning-border)',  text: 'var(--state-warning-darkest)',  label: 'Flagged' },
    skipped:   { bg: 'var(--muted)',              border: 'var(--border)',                text: 'var(--muted-foreground)',       label: 'Skipped' },
    unreached: { bg: 'var(--background)',         border: 'var(--border)',                text: 'var(--muted-foreground)',       label: 'Not reached' },
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review before submitting"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          maxWidth: 560,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>
              Ready to submit?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
              Review your progress before submitting. Click any question to go back to it.
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Go back to exam">
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 16 }} />
          </Button>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {[
            { count: answeredCount,    label: 'Answered',    color: 'var(--state-success-dark)',    bg: 'var(--state-success-bg)',  icon: 'fa-circle-check' },
            { count: flaggedCount,     label: 'Flagged',     color: 'var(--state-warning-darkest)', bg: 'var(--state-warning-bg)',  icon: 'fa-flag' },
            { count: skippedCount,     label: 'Skipped',     color: 'var(--foreground)',             bg: 'var(--muted)',             icon: 'fa-forward' },
            { count: unansweredCount,  label: 'Unanswered',  color: 'var(--muted-foreground)',       bg: 'var(--background)',        icon: 'fa-circle-dashed' },
          ].map(({ count, label, color, bg, icon }) => (
            <div
              key={label}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '12px 8px',
                backgroundColor: bg,
                borderRight: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 2 }}>
                <i className={`fa-light ${icon}`} aria-hidden="true" style={{ fontSize: 12, color }} />
                <span style={{ fontSize: 20, fontWeight: 700, color }}>{count}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Question grid */}
        <div style={{ overflowY: 'auto', padding: '16px 24px', flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
            gap: 6,
          }}>
            {questions.map((_, index) => {
              const status = getCellStatus(index);
              const s = STATUS[status];
              const isClickable = status !== 'unreached';
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (isClickable) {
                      onNavigate(index);
                      onClose();
                    }
                  }}
                  disabled={!isClickable}
                  aria-label={`Question ${index + 1} — ${s.label}${isClickable ? ', click to go back' : ''}`}
                  style={{
                    height: 44,
                    borderRadius: 8,
                    border: `1.5px solid ${s.border}`,
                    backgroundColor: s.bg,
                    color: s.text,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isClickable ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 100ms',
                    opacity: status === 'unreached' ? 0.45 : 1,
                    position: 'relative',
                  }}
                >
                  {index + 1}
                  {flaggedSet.has(index) && (
                    <i
                      className="fa-solid fa-flag"
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: 3,
                        right: 4,
                        fontSize: 8,
                        color: 'var(--state-warning-darkest)',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {Object.entries(STATUS).map(([key, s]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: 4,
                  backgroundColor: s.bg,
                  border: `1.5px solid ${s.border}`,
                }} />
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
        }}>
          <Button variant="outline" size="lg" onClick={onClose}>
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
            Go back to exam
          </Button>
          <Button
            size="lg"
            onClick={onConfirmSubmit}
            style={{ backgroundColor: 'var(--brand-color)', color: 'var(--brand-foreground)' }}
          >
            <i className="fa-light fa-paper-plane" aria-hidden="true" />
            Submit exam
          </Button>
        </div>
      </div>
    </div>
  );
}
