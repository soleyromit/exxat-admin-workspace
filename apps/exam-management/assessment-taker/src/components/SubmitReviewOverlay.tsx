import { useState } from 'react';
import { Button } from '@exxatdesignux/ui';
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
  const [phase, setPhase] = useState<'review' | 'confirm'>('review');

  const answeredCount = answeredSet.size;
  const bookmarkedCount = flaggedSet.size;
  const unansweredCount = questions.length - answeredCount;
  const hasUnanswered = unansweredCount > 0;
  const hasBookmarked = bookmarkedCount > 0;

  function getCellStatus(index: number): 'answered' | 'bookmarked' | 'skipped' | 'unreached' {
    const isAnswered = answeredSet.has(index);
    if (isAnswered && flaggedSet.has(index)) return 'bookmarked';
    if (isAnswered) return 'answered';
    if (index <= highestReachedIndex) return 'skipped';
    return 'unreached';
  }

  const STATUS = {
    answered:  { bg: 'var(--state-answered-bg)',  border: 'var(--state-answered-border)', text: 'var(--state-answered-text)',  label: 'Answered' },
    bookmarked:{ bg: 'var(--state-flagged-bg)',   border: 'var(--state-flagged-border)',  text: 'var(--state-flagged-text)',  label: 'Bookmarked' },
    skipped:   { bg: 'var(--muted)',              border: 'var(--border)',                text: 'var(--muted-foreground)',    label: 'Skipped' },
    unreached: { bg: 'var(--card)',               border: 'var(--border)',                text: 'var(--muted-foreground)',    label: 'Not reached' },
  };

  // Context-aware confirmation copy
  const getConfirmBody = () => {
    if (hasUnanswered && hasBookmarked) {
      return {
        icon: 'fa-triangle-exclamation',
        iconColor: 'var(--state-warning-text)',
        headline: 'You still have unanswered questions',
        detail: `${unansweredCount} question${unansweredCount !== 1 ? 's' : ''} left unanswered and ${bookmarkedCount} bookmarked for review.`,
      };
    }
    if (hasUnanswered) {
      return {
        icon: 'fa-triangle-exclamation',
        iconColor: 'var(--state-warning-text)',
        headline: 'You still have unanswered questions',
        detail: `${unansweredCount} question${unansweredCount !== 1 ? 's' : ''} left unanswered.`,
      };
    }
    if (hasBookmarked) {
      return {
        icon: 'fa-bookmark',
        iconColor: 'var(--state-flagged-text)',
        headline: 'You have bookmarked questions',
        detail: `${bookmarkedCount} question${bookmarkedCount !== 1 ? 's' : ''} marked for review.`,
      };
    }
    return {
      icon: 'fa-circle-check',
      iconColor: 'var(--state-answered-text)',
      headline: 'All questions answered',
      detail: `You've completed all ${questions.length} questions.`,
    };
  };

  const confirmBody = getConfirmBody();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={phase === 'review' ? 'Review before submitting' : 'Confirm submission'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        backgroundColor: phase === 'confirm' ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        transition: 'background-color 200ms',
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

        {phase === 'review' && (
          <>
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

            {/* Summary strip */}
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
                {hasUnanswered ? (
                  <>
                    <i className="fa-regular fa-circle-exclamation" aria-hidden="true"
                      style={{ fontSize: 13, color: 'var(--muted-foreground)' }} />
                    <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
                      {unansweredCount}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>unanswered</span>
                  </>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--state-answered-text)' }}>
                    <i className="fa-regular fa-party-horn" aria-hidden="true" style={{ marginRight: 4 }} />
                    All questions answered
                  </span>
                )}
              </div>
            </div>

            {/* Question grid */}
            <div style={{ overflowY: 'auto', padding: '16px 24px', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
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
                          style={{ position: 'absolute', top: 2, right: 3, fontSize: 12, color: 'var(--state-flagged-text)' }}
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
              <Button variant="default" onClick={() => setPhase('confirm')}>
                <i className="fa-regular fa-paper-plane" aria-hidden="true" />
                Submit exam
              </Button>
            </div>
          </>
        )}

        {phase === 'confirm' && (
          <>
            {/* Confirmation header */}
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>
                Confirm submission
              </h2>
            </div>

            {/* Context-aware body */}
            <div style={{ padding: '28px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: `color-mix(in srgb, ${confirmBody.iconColor} 12%, var(--background))`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i
                  className={`fa-regular ${confirmBody.icon}`}
                  aria-hidden="true"
                  style={{ fontSize: 24, color: confirmBody.iconColor }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
                  {confirmBody.headline}
                </p>
                <p style={{ fontSize: 14, color: 'var(--muted-foreground)', margin: 0 }}>
                  {confirmBody.detail}
                </p>
              </div>

              <div
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  backgroundColor: 'var(--muted)',
                  border: '1px solid var(--border)',
                  maxWidth: 380,
                  width: '100%',
                }}
              >
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
                  <i className="fa-regular fa-lock" aria-hidden="true" style={{ marginRight: 6 }} />
                  This action is <strong>irreversible</strong>. Once submitted, you cannot change your answers.
                </p>
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
              <Button variant="ghost" onClick={() => setPhase('review')}>
                <i className="fa-regular fa-arrow-left" aria-hidden="true" />
                Go back
              </Button>
              <Button variant="default" onClick={onConfirmSubmit}>
                <i className="fa-regular fa-check" aria-hidden="true" />
                Confirm &amp; submit
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
