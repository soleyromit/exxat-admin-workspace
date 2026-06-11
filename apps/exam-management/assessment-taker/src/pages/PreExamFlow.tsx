/**
 * PRE-EXAM FLOW — two focused screens before entering the exam engine.
 *
 *   1. Password   — faculty-announced class password (a deliberate, supervised
 *                   gate). Narrow centered form (Mobbin verification pattern).
 *   2. Before you begin — everything to review on one screen: instructions,
 *                   reference materials, and accommodations (if any), with the
 *                   attestation + "Start exam" pinned in a footer so they stay
 *                   visible while long instructions scroll.
 *
 * No multi-step wizard / stepper — the flow is short enough that progress
 * chrome adds friction rather than clarity.
 *
 * Per Aarti + Darshan (Granola sessions) + Vishaka (May 14).
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge, Button, Checkbox, Input } from '@exxatdesignux/ui';
import { MOCK_ASSESSMENTS, getEffectiveDuration, formatDuration, Assessment } from '../data/assessments';

const typeLabel: Record<string, string> = {
  quiz: 'Quiz', midterm: 'Midterm', final: 'Final Exam',
  practical: 'Practical', review: 'Review',
};

// ─── Reusable: irreversibility note shown beside the "Start exam" action ──────
function StartNote() {
  return (
    <p className="flex items-center justify-center gap-1.5 mt-2.5 text-center" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
      <i className="fa-light fa-circle-info fa-fw" aria-hidden="true" />
      The timer starts the moment you begin — the session cannot be paused once started.
    </p>
  );
}

// ─── Screen 1: Password ───────────────────────────────────────────────────────
function ExamPassword({ exam, onNext }: { exam: Assessment; onNext: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const MOCK_PASSWORD = 'EXAM2026';

  function handleSubmit() {
    setChecking(true);
    setTimeout(() => {
      if (password.toUpperCase() === MOCK_PASSWORD) {
        setError(false);
        onNext();
      } else {
        setError(true);
        setChecking(false);
      }
    }, 600);
  }

  return (
    // Narrow, vertically-centered form — Mobbin verification-screen pattern.
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
      <div className="w-full" style={{ maxWidth: 380 }}>
        <div className="text-center mb-7">
          <div
            className="flex items-center justify-center rounded-full mx-auto mb-4"
            style={{ width: 52, height: 52, background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <i className="fa-light fa-lock" aria-hidden="true" style={{ fontSize: 20, color: 'var(--brand-color)' }} />
          </div>
          <h2 className="font-heading font-bold leading-tight text-2xl text-foreground">
            Enter exam password
          </h2>
          <p className="mt-1.5" style={{ fontSize: 14, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
            {exam.title}
          </p>
        </div>

        <Input
          id="exam-password"
          type="text"
          placeholder="Enter password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false); }}
          onKeyDown={e => { if (e.key === 'Enter' && password) handleSubmit(); }}
          autoComplete="off"
          autoCapitalize="characters"
          aria-label="Exam password"
          aria-invalid={error}
          aria-describedby={error ? 'pw-error' : 'pw-hint'}
          className="w-full"
        />

        <Button
          variant="default"
          size="lg"
          onClick={handleSubmit}
          disabled={!password || checking}
          className="w-full mt-3"
        >
          {checking ? 'Verifying…' : 'Continue'}
        </Button>

        {error ? (
          <p id="pw-error" role="alert" className="flex items-center justify-center gap-1.5 mt-3 text-center" style={{ fontSize: 13, color: 'var(--destructive)' }}>
            <i className="fa-light fa-circle-xmark" aria-hidden="true" />
            Incorrect password. Ask your faculty to confirm.
          </p>
        ) : (
          <p id="pw-hint" className="mt-3 text-center" style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
            The password is announced verbally in class — do not share it with anyone who is not present.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Screen 2: Before you begin (instructions + accommodations + attestation) ──
function BeforeYouBegin({ exam, onStart }: { exam: Assessment; onStart: () => void }) {
  const [attested, setAttested] = useState(false);
  const acc = exam.accommodation;
  const effectiveMins = getEffectiveDuration(exam);

  const meta = [
    `${exam.questionCount} questions`,
    formatDuration(effectiveMins),
    exam.allowedAttempts ? `${exam.allowedAttempts} attempt${exam.allowedAttempts > 1 ? 's' : ''}` : 'Unlimited attempts',
    `Pass ${exam.passingScore}%`,
  ];

  const accItems = acc ? [
    acc.timeMultiplier > 1 && {
      icon: 'fa-clock',
      label: 'Extended Time',
      value: `${acc.timeMultiplier}× — ${formatDuration(effectiveMins)} total (standard: ${formatDuration(exam.durationMinutes)})`,
    },
    acc.separateRoom && {
      icon: 'fa-door-open',
      label: 'Separate Testing Room',
      value: 'You will take this exam in a private, distraction-free environment',
    },
    acc.extendedBreaks && {
      icon: 'fa-mug-hot',
      label: 'Extended Breaks',
      value: acc.additionalNotes ?? 'Scheduled breaks during the exam',
    },
  ].filter(Boolean) as { icon: string; label: string; value: string }[] : [];

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Scrollable body — instructions can be long; footer stays pinned */}
      <div className="flex-1 min-h-0 overflow-y-auto" tabIndex={0} role="group" aria-label="Exam details, instructions, and accommodations">
        {/* Title + identity */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant="secondary">{typeLabel[exam.type] ?? exam.type}</Badge>
            {exam.isHighStakes && <Badge variant="outline">High Stakes</Badge>}
          </div>
          <h2 className="font-heading font-bold leading-tight text-2xl text-foreground">
            {exam.title}
          </h2>
          <p className="mt-1" style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
            {exam.courseCode} · {exam.courseName} · {exam.facultyName}
          </p>
        </div>

        {/* One inline meta row — single source of these facts */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-6 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          {meta.map((m, i) => (
            <React.Fragment key={m}>
              {i > 0 && <span aria-hidden="true" style={{ color: 'var(--border)' }}>·</span>}
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{m}</span>
            </React.Fragment>
          ))}
        </div>

        {/* Instructions — primary content */}
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', marginBottom: 10 }}>
          Instructions
        </h2>
        <p style={{ fontSize: 16, color: 'var(--foreground)', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
          {exam.instructions || 'No specific instructions provided for this exam.'}
        </p>

        {/* Reference materials */}
        {exam.assessmentReferences && exam.assessmentReferences.length > 0 && (
          <div className="mt-6">
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>
              Reference materials
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 10 }}>
              Available from the toolbar throughout the exam.
            </p>
            <div className="flex flex-wrap gap-2">
              {exam.assessmentReferences.map(m => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-2"
                  style={{ fontSize: 13, color: 'var(--foreground)', padding: '5px 12px', borderRadius: 8, background: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  <i className={`fa-light ${m.icon} fa-fw`} aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Accommodations — only when the student has any */}
        {acc && accItems.length > 0 && (
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>
              Your accommodations
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 12, lineHeight: 1.5 }}>
              Applied to your exam. If anything is incorrect, contact Student Services before starting.
            </p>
            <div className="flex flex-col gap-2.5">
              {accItems.map(item => (
                <div key={item.label} className="flex items-start gap-3 rounded-xl px-4 py-3.5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-center shrink-0 rounded-lg border" style={{ width: 36, height: 36, background: 'var(--muted)', borderColor: 'var(--border)' }}>
                    <i className={`fa-light ${item.icon} fa-fw`} aria-hidden="true" style={{ color: 'var(--muted-foreground)', fontSize: 16 }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, color: 'var(--foreground)' }}>{item.label}</p>
                    <p style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5, marginTop: 10 }}>
              Approved by <strong style={{ color: 'var(--foreground)', fontWeight: 600 }}>{acc.approvedBy}</strong>.{' '}
              <a href="mailto:studentservices@exxat.edu" className="no-underline" style={{ color: 'var(--brand-color)' }}>
                Something looks wrong?
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Pinned footer — attestation + Start always visible while body scrolls */}
      <div className="shrink-0 pt-4 mt-1 border-t" style={{ borderColor: 'var(--border)' }}>
        <label htmlFor="attestation" className="flex items-start gap-2.5 mb-3 cursor-pointer">
          <Checkbox
            id="attestation"
            checked={attested}
            onCheckedChange={v => setAttested(Boolean(v))}
            className="mt-0.5 shrink-0"
            aria-required="true"
          />
          <span style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.5 }}>
            I agree to the academic integrity policy and will complete this assessment independently, without unauthorized resources.
          </span>
        </label>
        <Button
          variant="default"
          size="lg"
          onClick={onStart}
          disabled={!attested}
          className="w-full"
        >
          I agree, start exam
        </Button>
        <StartNote />
      </div>
    </div>
  );
}

// ─── Pre-Exam Flow orchestrator ───────────────────────────────────────────────
export function PreExamFlow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<'password' | 'review'>('password');
  const [compatWarning, setCompatWarning] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCompatWarning(null); // Prototype: always pass
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const exam = MOCK_ASSESSMENTS.find(a => a.id === id);

  if (!exam) {
    return (
      <main className="flex items-center justify-center min-h-svh" style={{ background: 'var(--background)' }} aria-label="Assessment not found">
        <div className="text-center">
          <h1 className="text-lg mb-4 font-bold" style={{ color: 'var(--foreground)' }}>Assessment not found.</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} style={{ color: 'var(--brand-color)' }}>
            Back to Dashboard
          </Button>
        </div>
      </main>
    );
  }

  const handleStart = () => navigate(`/exam/${id}/take`);
  const handleBack = () => {
    if (screen === 'password') navigate('/');
    else setScreen('password');
  };

  return (
    <div className="h-svh flex flex-col overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Top bar */}
      <header
        className="flex items-center px-6 h-12 border-b shrink-0"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <Button variant="ghost" size="sm" onClick={handleBack} style={{ color: 'var(--muted-foreground)' }}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" />
          {screen === 'password' ? 'Back to Dashboard' : 'Back'}
        </Button>
      </header>

      {/* Single centered column */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden" aria-label="Pre-exam setup">
        {/* Visually-hidden page heading — guarantees a single, stable <h1> for
            screen readers + axe page-has-heading-one regardless of which screen
            renders. Visible section titles below are <h2>. */}
        <h1 className="sr-only">
          {screen === 'password' ? 'Enter exam password' : 'Before you begin'} — {exam.title}
        </h1>
        {compatWarning && (
          <div className="shrink-0 w-full px-6 pt-6" style={{ maxWidth: 560, marginInline: 'auto' }}>
            <div
              role="alert"
              className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 border"
              style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)', fontSize: 14, lineHeight: 1.4 }}
            >
              <i className="fa-light fa-triangle-exclamation fa-fw shrink-0" aria-hidden="true" style={{ fontSize: 15 }} />
              <span className="flex-1">{compatWarning}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setCompatWarning(null)}
                aria-label="Dismiss compatibility warning"
                style={{ flexShrink: 0, color: 'var(--foreground)' }}
              >
                <i className="fa-light fa-xmark" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 w-full px-6 py-8 flex flex-col" style={{ maxWidth: 560, marginInline: 'auto' }}>
          {screen === 'password'
            ? <ExamPassword exam={exam} onNext={() => setScreen('review')} />
            : <BeforeYouBegin exam={exam} onStart={handleStart} />
          }
        </div>
      </main>
    </div>
  );
}
