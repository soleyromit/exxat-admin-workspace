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
  const bookmarkedCount = flaggedSet.size;
  const unansweredCount = questions.length - answeredCount;

  function getCellStatus(index: number): 'answered' | 'bookmarked' | 'skipped' | 'unreached' {
    const isAnswered = answeredSet.has(index);
    if (isAnswered && flaggedSet.has(index)) return 'bookmarked';
    if (isAnswered) return 'answered';
    if (index <= highestReachedIndex) return 'skipped';
    return 'unreached';
  }

  const STATUS = {
    answered:  { bg: 'var(--state-answered-bg)',  border: 'var(--state-answered-border)', text: 'var(--state-answered-text)',    label: 'Answered' },
    bookmarked:{ bg: 'var(--state-flagged-bg)',   border: 'var(--state-flagged-border)',  text: 'var(--state-flagged-text)',    label: 'Bookmarked' },
    skipped:   { bg: 'var(--muted)',              border: 'var(--border)',                text: 'var(--muted-foreground)',      label: 'Skipped' },
    unreached: { bg: 'var(--card)',               border: 'var(--border)',                text: 'var(--muted-foreground)',      label: 'Not reached' },
  };

  const hasUnanswered = unansweredCount > 0;

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
          maxWidth: 540,
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
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>
              Ready to submit?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
              Click any question to go back to it.
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Go back to exam">
            <i className="fa-regular fa-xmark" aria-hidden="true" style={{ fontSize: 16 }} />
          </Button>
        </div>

        {/* Summary strip — 3 inline stats, no tinted boxes */}
        <div style={{
          display: 'flex',
          gap: 20,
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <i className="fa-regular fa-circle-check" aria-hidden="true"
              style={{ fontSize: 13, color: 'var(--state-answered-text)' }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--state-answered-text)', lineHeight: 1 }}>
              {answeredCount}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>answered</span>
          </div>

          {bookmarkedCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <i className="fa-regular fa-bookmark" aria-hidden="true"
                style={{ fontSize: 13, color: 'var(--state-flagged-text)' }} />
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--state-flagged-text)', lineHeight: 1 }}>
                {bookmarkedCount}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>bookmarked</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginLeft: 'auto' }}>
            {hasUnanswered && (
              <>
                <i className="fa-regular fa-circle-exclamation" aria-hidden="true"
                  style={{ fontSize: 13, color: 'var(--semantic-error-text, var(--muted-foreground))' }} />
                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
                  {unansweredCount}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>unanswered</span>
              </>
            )}
            {!hasUnanswered && (
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--state-answered-text)' }}>
                <i className="fa-regular fa-party-horn" aria-hidden="true" style={{ marginRight: 4 }} />
                All questions answered
              </span>
            )}
          </div>
        </div>

        {/* Question grid */}
        <div style={{ overflowY: 'auto', padding: '16px 24px', flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: 4,
          }}>
            {questions.map((_, index) => {
              const status = getCellStatus(index);
              const s = STATUS[status];
              const isClickable = status !== 'unreached';
              const isBookmarked = flaggedSet.has(index);
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
                  aria-label={`Question ${index + 1} — ${s.label}${isClickable ? ', click to return' : ''}`}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 6,
                    border: `1px solid ${s.border}`,
                    backgroundColor: s.bg,
                    color: s.text,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isClickable ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 80ms',
                    opacity: status === 'unreached' ? 0.35 : 1,
                    position: 'relative',
                  }}
                >
                  {index + 1}
                  {isBookmarked && (
                    <i
                      className="fa-solid fa-bookmark"
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 3,
                        fontSize: 12,
                        color: 'var(--state-flagged-text)',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 10,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <Button variant="ghost" onClick={onClose}>
            <i className="fa-regular fa-arrow-left" aria-hidden="true" />
            Cancel
          </Button>
          <Button variant="default" onClick={onConfirmSubmit}>
            <i className="fa-regular fa-paper-plane" aria-hidden="true" />
            Submit exam
          </Button>
        </div>
      </div>
    </div>
  );
}
