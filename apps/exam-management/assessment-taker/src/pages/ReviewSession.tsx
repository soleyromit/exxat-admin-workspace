/**
 * REVIEW SESSION — Lockdown post-publication review
 *
 * Per Aarti's email (May 2026):
 *   "Scheduled review sessions, where students log back in under lockdown
 *    conditions to view the exam with correct answers and rationales — without
 *    being able to copy or screenshot anything."
 *
 * Lockdown vendor (Respondus / HonorLock) is deferred to Jan 2027. This page
 * applies the UI-level lockdown affordances (no copy, no right-click, no
 * select) and surfaces the lockdown banner so the student knows they're in
 * the restricted environment. Real OS-level lockdown is added later without
 * changing this surface.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@exxat/ds/packages/ui/src';
import { ExamBadge } from '../components/ExamBadge';
import { questions } from '../data/questions';
import { MOCK_ASSESSMENTS } from '../data/assessments';

const t = {
  bg: 'var(--background)',
  card: 'var(--card)',
  muted: 'var(--muted)',
  brand: 'var(--brand-color)',
  fg: 'var(--foreground)',
  fgMuted: 'var(--muted-foreground)',
  border: 'var(--border)',
};

// Mock layer — questions data doesn't carry correct answers; for demo we
// treat options[0] as canonical correct and provide a placeholder rationale.
function getCorrectAnswer(q: typeof questions[number]): string {
  if (q.options && q.options.length > 0) return q.options[0];
  return '—';
}
function getRationale(q: typeof questions[number]): string {
  return (
    `Option "${getCorrectAnswer(q)}" is correct because it directly addresses ` +
    `the clinical scenario described. Distractors test common misconceptions — ` +
    `confer with the related content area for the full reasoning.`
  );
}
function getStudentAnswer(q: typeof questions[number], i: number): string {
  // For demo: simulate ~80% accuracy
  const isCorrect = i % 5 !== 0;
  if (isCorrect) return getCorrectAnswer(q);
  return q.options?.[1] ?? '—';
}

export function ReviewSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const exam = MOCK_ASSESSMENTS.find(a => a.id === id) ?? MOCK_ASSESSMENTS[0];
  const question = questions[currentIndex];
  const total = questions.length;
  const correctAnswer = getCorrectAnswer(question);
  const studentAnswer = getStudentAnswer(question, currentIndex);
  const isCorrect = studentAnswer === correctAnswer;

  // UI-level lockdown affordances. OS-level lockdown ships in 2027.
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('contextmenu', block);
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('contextmenu', block);
      document.body.style.userSelect = '';
    };
  }, []);

  const handlePrev = () => setCurrentIndex(i => Math.max(0, i - 1));
  const handleNext = () => setCurrentIndex(i => Math.min(total - 1, i + 1));
  const handleExit = () => navigate(`/exam/${id ?? exam?.id}/results`);

  return (
    <div
      style={{ background: t.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      className="select-none"
    >
      {/* ─── Lockdown header ────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between sticky top-0 z-50"
        style={{
          height: 56,
          background: 'var(--state-warning-bg)',
          borderBottom: '2px solid var(--state-warning-accent)',
          padding: '0 24px',
        }}
      >
        <div className="flex items-center gap-3">
          <i
            className="fa-solid fa-lock"
            aria-hidden="true"
            style={{ fontSize: 18, color: 'var(--state-warning-darkest)' }}
          />
          <div>
            <p className="text-xs font-bold leading-tight" style={{ color: 'var(--state-warning-darkest)' }}>
              Lockdown Review Session
            </p>
            <p style={{ fontSize: 11, color: 'var(--state-warning-dark)' }}>
              Copy, screenshot, and right-click are disabled · {exam?.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: 'var(--state-warning-darkest)' }}>
            Question {currentIndex + 1} of {total}
          </span>
          <Button variant="outline" size="sm" onClick={handleExit}>
            <i className="fa-light fa-arrow-right-from-bracket" aria-hidden="true" />
            Exit Review
          </Button>
        </div>
      </header>

      {/* ─── Main review surface ────────────────────────────────────────── */}
      <main
        id="main-content"
        className="flex-1 overflow-y-auto"
        style={{ padding: '32px 24px 80px' }}
      >
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          {/* Status badge */}
          <div className="mb-4">
            <ExamBadge
              bg={isCorrect ? 'var(--state-success-bg-soft)' : 'var(--state-error-bg-soft)'}
              fg={isCorrect ? 'var(--state-success-dark)' : 'var(--state-error-text-dark)'}
              dot={isCorrect ? 'var(--state-success-accent)' : 'var(--state-error-accent)'}
            >
              {isCorrect ? 'Your answer was correct' : 'Your answer was incorrect'}
            </ExamBadge>
          </div>

          {/* Question */}
          <div
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: 28,
              marginBottom: 20,
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: t.fgMuted }}
            >
              Question {currentIndex + 1}
            </p>
            <h2
              className="font-heading"
              style={{ fontSize: 22, fontWeight: 700, color: t.fg, lineHeight: 1.35, marginBottom: 20 }}
            >
              {question.text}
            </h2>

            {/* Options with correct/incorrect annotations */}
            {question.options && question.options.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {question.options.map((opt, idx) => {
                  const isOptCorrect = opt === correctAnswer;
                  const isOptStudent = opt === studentAnswer;
                  const isOptStudentWrong = isOptStudent && !isCorrect;

                  let bg = t.card;
                  let border = t.border;
                  let label: string | null = null;
                  let labelBg = 'transparent';
                  let labelFg = t.fgMuted;

                  if (isOptCorrect) {
                    bg = 'var(--state-success-bg)';
                    border = 'var(--state-success-accent)';
                    label = 'Correct answer';
                    labelBg = 'var(--state-success-bg-soft)';
                    labelFg = 'var(--state-success-dark)';
                  } else if (isOptStudentWrong) {
                    bg = 'var(--state-error-bg-soft)';
                    border = 'var(--state-error-border-soft)';
                    label = 'Your answer';
                    labelBg = 'var(--state-error-bg-soft)';
                    labelFg = 'var(--state-error-text-dark)';
                  }

                  return (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3"
                      style={{
                        padding: '14px 18px',
                        borderRadius: 10,
                        background: bg,
                        border: `1.5px solid ${border}`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: isOptCorrect
                              ? 'var(--state-success-accent)'
                              : isOptStudentWrong
                              ? 'var(--state-error-accent)'
                              : t.muted,
                            color: isOptCorrect || isOptStudentWrong ? 'var(--primary-foreground)' : t.fgMuted,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span style={{ fontSize: 14, color: t.fg, lineHeight: 1.5 }}>{opt}</span>
                      </div>
                      {label && (
                        <ExamBadge bg={labelBg} fg={labelFg}>
                          <i
                            className={`fa-light ${isOptCorrect ? 'fa-check' : 'fa-xmark'}`}
                            aria-hidden="true"
                          />
                          {label}
                        </ExamBadge>
                      )}
                      {isOptStudent && isOptCorrect && (
                        <ExamBadge bg="var(--state-success-bg-soft)" fg="var(--state-success-dark)">
                          <i className="fa-light fa-check" aria-hidden="true" />
                          Correct · Your answer
                        </ExamBadge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rationale */}
          <div
            style={{
              background: 'var(--brand-color-light, var(--card))',
              border: `1px solid var(--brand-tint, ${t.border})`,
              borderRadius: 12,
              padding: '18px 22px',
              marginBottom: 24,
            }}
          >
            <div className="flex items-start gap-3">
              <i
                className="fa-light fa-book-open"
                aria-hidden="true"
                style={{ color: t.brand, fontSize: 18, marginTop: 2 }}
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: t.brand }}>
                  Rationale
                </p>
                <p style={{ fontSize: 14, color: t.fg, lineHeight: 1.6 }}>{getRationale(question)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer navigation ──────────────────────────────────────────── */}
      <footer
        className="sticky bottom-0 flex items-center justify-between gap-3"
        style={{
          height: 64,
          background: t.card,
          borderTop: `1px solid ${t.border}`,
          padding: '0 24px',
          flexShrink: 0,
        }}
      >
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Previous question"
        >
          <i className="fa-light fa-arrow-left" aria-hidden="true" />
          Previous
        </Button>

        <span className="text-xs" style={{ color: t.fgMuted }}>
          Question <strong style={{ color: t.fg }}>{currentIndex + 1}</strong> of {total}
        </span>

        <Button onClick={handleNext} disabled={currentIndex === total - 1} aria-label="Next question">
          Next
          <i className="fa-light fa-arrow-right" aria-hidden="true" />
        </Button>
      </footer>
    </div>
  );
}
