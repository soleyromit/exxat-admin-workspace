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

// Mock answer-key — real impl will read graded responses from the backend.
// Mapping below picks a deterministic "correct" answer per type so review
// always has something to render.
type Q = typeof questions[number];

function getCorrectAnswer(q: Q): string {
  if (q.options && q.options.length > 0) return q.options[0];
  if (q.type === 'fill-blank' && q.blanks) {
    return Object.values(q.blanks).map(opts => opts[0]).join(' → ');
  }
  if (q.type === 'highlight' && q.sentenceGroups) {
    // Demo: 3rd sentence contains the contraindication
    return q.sentenceGroups[2] ?? q.sentenceGroups[0];
  }
  if (q.type === 'matching' && q.matchPairs) {
    return q.matchPairs.map(p => `${p.left} → ${p.rightOptions[0]}`).join('; ');
  }
  if (q.type === 'anatomy' && q.hotspots) {
    const mitral = q.hotspots.find(h => h.label.toLowerCase().includes('mitral'));
    return mitral?.label ?? q.hotspots[0]?.label ?? '—';
  }
  if (q.type === 'short-answer' || q.type === 'essay') return 'Free-response — see your submission.';
  return '—';
}

function getRationale(q: Q): string {
  const ans = getCorrectAnswer(q);
  if (q.type === 'short-answer' || q.type === 'essay') {
    return 'Free-response questions are reviewed by your instructor. Your submission and instructor feedback (if posted) appear above.';
  }
  if (q.type === 'fill-blank') {
    return `The pathway resolves to ${ans} based on the standard physiological mechanism. Distractors are common terminology confusions.`;
  }
  if (q.type === 'matching') {
    return 'Each pairing maps to the standard anatomical/functional relationship. Review the related content area for any pairings you missed.';
  }
  if (q.type === 'highlight') {
    return 'The highlighted clause is the clinical signal that drives the answer. Other clauses provide context but do not change the decision.';
  }
  if (q.type === 'anatomy') {
    return `The correct hotspot is ${ans}. Common confusions in this region are usually neighboring structures with similar landmarks.`;
  }
  return `"${ans}" is correct because it directly addresses the clinical scenario described. Distractors test common misconceptions — confer with the related content area for the full reasoning.`;
}

function getStudentAnswer(q: Q, i: number): string {
  // For demo: simulate ~80% accuracy
  const isCorrect = i % 5 !== 0;
  if (isCorrect) return getCorrectAnswer(q);
  return q.options?.[1] ?? getCorrectAnswer(q);
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
      <h1 className="sr-only">Lockdown Review Session — {exam?.title}</h1>
      {/* ─── Lockdown header ────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between sticky top-0 z-50"
        style={{
          height: 56,
          background: t.card,
          borderBottom: `1px solid ${t.border}`,
          padding: '0 24px',
        }}
      >
        <div className="flex items-center gap-3">
          <i
            className="fa-solid fa-lock"
            aria-hidden="true"
            style={{ fontSize: 16, color: t.fgMuted }}
          />
          <div>
            <p className="text-xs font-semibold leading-tight" style={{ color: t.fg }}>
              Lockdown Review Session
            </p>
            <p style={{ fontSize: 12, color: t.fgMuted }}>
              Copy, screenshot, and right-click are disabled · {exam?.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: t.fgMuted }}>
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
          {/* Status badge — neutral, signal carried by icon, not color */}
          <div className="mb-4">
            <ExamBadge bg={t.muted} fg={t.fg}>
              <i className={`fa-solid ${isCorrect ? 'fa-check' : 'fa-xmark'}`} aria-hidden="true" />
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
              className="text-xs font-bold mb-2"
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

            {/* Type-aware body — MCQ-style options, plus review renderers
                for fill-blank, highlight, matching, anatomy, short-answer,
                and table so non-MCQ questions don't render empty. */}
            <ReviewQuestionBody
              question={question}
              correctAnswer={correctAnswer}
              studentAnswer={studentAnswer}
              isCorrect={isCorrect}
            />
          </div>

          {/* Rationale — neutral, low-emphasis */}
          <div
            style={{
              background: t.muted,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: '18px 22px',
              marginBottom: 24,
            }}
          >
            <div className="flex items-start gap-3">
              <i
                className="fa-light fa-book-open"
                aria-hidden="true"
                style={{ color: t.fgMuted, fontSize: 18, marginTop: 2 }}
              />
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: t.fgMuted }}>
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

// ─── Type-aware review body ────────────────────────────────────────────────
// One renderer per question type. All neutral-only — same palette as the
// rest of the page. The "correct" signal is a thin foreground left-rail +
// a check icon; the "your answer" signal is muted bg + an x icon.

function ReviewQuestionBody({
  question, correctAnswer, studentAnswer, isCorrect,
}: {
  question: Q; correctAnswer: string; studentAnswer: string; isCorrect: boolean;
}) {
  // MCQ-style: anything with options[] renders as a tile list
  if (question.options && question.options.length > 0) {
    return (
      <div className="flex flex-col gap-2.5">
        {question.options.map((opt, idx) => {
          const isOptCorrect = opt === correctAnswer;
          const isOptStudent = opt === studentAnswer;
          const isOptStudentWrong = isOptStudent && !isCorrect;

          let bg = t.card;
          let border = t.border;
          let borderWidth = 1;
          let leftRail = 'transparent';
          let label: string | null = null;

          if (isOptCorrect) {
            border = t.fg; borderWidth = 1.5; leftRail = t.fg; label = 'Correct answer';
          } else if (isOptStudentWrong) {
            bg = t.muted; label = 'Your answer';
          }

          return (
            <div
              key={idx}
              className="flex items-start justify-between gap-3"
              style={{
                padding: '14px 18px', borderRadius: 10,
                background: bg,
                border: `${borderWidth}px solid ${border}`,
                borderLeft: leftRail !== 'transparent' ? `3px solid ${leftRail}` : `${borderWidth}px solid ${border}`,
              }}
            >
              <div className="flex items-start gap-3">
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: t.muted, color: t.fgMuted,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
                }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ fontSize: 14, color: t.fg, lineHeight: 1.5 }}>{opt}</span>
              </div>
              {label && (
                <ExamBadge bg="transparent" fg={t.fgMuted}>
                  <i className={`fa-light ${isOptCorrect ? 'fa-check' : 'fa-xmark'}`} aria-hidden="true" />
                  {label}
                </ExamBadge>
              )}
              {isOptStudent && isOptCorrect && (
                <ExamBadge bg="transparent" fg={t.fgMuted}>
                  <i className="fa-light fa-check" aria-hidden="true" />
                  Correct · Your answer
                </ExamBadge>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Fill-blank: render the passage with each blank's correct answer inline
  if (question.type === 'fill-blank' && question.passageTemplate && question.blanks) {
    const blankNames = Object.keys(question.blanks);
    const parts = question.passageTemplate.split(/\{\{(blank\d+)\}\}/g);
    return (
      <div>
        <p style={{ fontSize: 15, color: t.fg, lineHeight: 1.7, marginBottom: 14 }}>
          {parts.map((part, i) =>
            blankNames.includes(part) ? (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '2px 10px', margin: '0 2px',
                borderRadius: 6, fontWeight: 600,
                background: t.card, border: `1.5px solid ${t.fg}`,
                borderLeft: `3px solid ${t.fg}`,
              }}>
                {question.blanks![part][0]}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
        <p className="text-xs" style={{ color: t.fgMuted }}>
          <i className="fa-light fa-check me-1.5" aria-hidden="true" />
          Highlighted terms are the correct fills.
        </p>
      </div>
    );
  }

  // Highlight: list sentences; mark the correct one with the foreground rail
  if (question.type === 'highlight' && question.sentenceGroups) {
    const correctIdx = question.sentenceGroups.findIndex(s => s === correctAnswer);
    return (
      <div className="flex flex-col gap-2">
        {question.sentenceGroups.map((s, idx) => {
          const isCorrectS = idx === correctIdx;
          return (
            <div key={idx} style={{
              padding: '12px 16px', borderRadius: 8,
              background: t.card,
              border: `1px solid ${t.border}`,
              borderLeft: isCorrectS ? `3px solid ${t.fg}` : `1px solid ${t.border}`,
              fontSize: 14, color: t.fg, lineHeight: 1.55,
              opacity: isCorrectS ? 1 : 0.7,
            }}>
              {s}
              {isCorrectS && (
                <span style={{ marginLeft: 10, fontSize: 12, color: t.fgMuted, fontWeight: 600 }}>
                  <i className="fa-light fa-check me-1" aria-hidden="true" />Correct highlight
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Matching: 2-column pairs with the correct right-option called out
  if (question.type === 'matching' && question.matchPairs) {
    return (
      <div className="flex flex-col gap-2">
        {question.matchPairs.map((pair, idx) => (
          <div key={idx} style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12,
            alignItems: 'center', padding: '12px 16px',
            background: t.card, border: `1px solid ${t.border}`, borderRadius: 8,
            borderLeft: `3px solid ${t.fg}`,
          }}>
            <span style={{ fontSize: 14, color: t.fg, fontWeight: 500 }}>{pair.left}</span>
            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ color: t.fgMuted }} />
            <span style={{ fontSize: 14, color: t.fg }}>{pair.rightOptions[0]}</span>
          </div>
        ))}
        <p className="text-xs mt-1" style={{ color: t.fgMuted }}>
          <i className="fa-light fa-check me-1.5" aria-hidden="true" />
          Pairs above are the correct mapping.
        </p>
      </div>
    );
  }

  // Anatomy: diagram + correct hotspot label
  if (question.type === 'anatomy' && question.hotspots) {
    return (
      <div>
        {question.diagramUrl && (
          <div style={{
            position: 'relative', borderRadius: 10, overflow: 'hidden',
            border: `1px solid ${t.border}`, background: t.muted,
            marginBottom: 14, aspectRatio: '16 / 9',
          }}>
            <img src={question.diagramUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        )}
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: t.card, border: `1.5px solid ${t.fg}`,
          borderLeft: `3px solid ${t.fg}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <i className="fa-light fa-crosshairs" aria-hidden="true" style={{ color: t.fgMuted }} />
          <span style={{ fontSize: 14, color: t.fg, fontWeight: 600 }}>Correct hotspot:</span>
          <span style={{ fontSize: 14, color: t.fg }}>{correctAnswer}</span>
        </div>
      </div>
    );
  }

  // Short-answer / essay: free-response — show "instructor reviewed" placeholder
  if (question.type === 'short-answer' || question.type === 'essay') {
    return (
      <div style={{
        padding: '14px 18px', borderRadius: 10,
        background: t.muted, border: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <i className="fa-light fa-feather-pointed" aria-hidden="true" style={{ color: t.fgMuted, fontSize: 16, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: t.fg, marginBottom: 4 }}>
            Free-response question
          </p>
          <p style={{ fontSize: 13, color: t.fgMuted, lineHeight: 1.55 }}>
            Your submission and any instructor feedback will appear here once grading is complete.
          </p>
        </div>
      </div>
    );
  }

  // Table: render the table as-is — no answer key in mock
  if (question.type === 'table' && question.tableData) {
    return (
      <div style={{ overflowX: 'auto', border: `1px solid ${t.border}`, borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: t.muted }}>
              {question.tableData.headers.map((h, i) => (
                <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: t.fg, fontWeight: 600, borderBottom: `1px solid ${t.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {question.tableData.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} style={{ padding: '10px 14px', color: t.fg, borderBottom: `1px solid ${t.border}` }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Fallback for any remaining type
  return (
    <div style={{
      padding: '14px 18px', borderRadius: 10,
      background: t.muted, border: `1px solid ${t.border}`,
      fontSize: 13, color: t.fgMuted,
    }}>
      <i className="fa-light fa-circle-info me-2" aria-hidden="true" />
      Detailed review for this question type isn&apos;t available yet.
    </div>
  );
}
