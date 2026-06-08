/**
 * PRE-EXAM FLOW — 4-step setup before entering the exam engine
 *
 * Per Aarti + Darshan (Granola sessions) + Vishaka (May 14):
 *   Step 0: Password — faculty-announced class password (second-level auth)
 *   Step 1: Instructions & Academic Integrity — exam-specific + e-signature
 *   Step 2: Accommodation Confirmation — confirm what's applied before starting
 *   Step 3: Ready — exam summary + "Start Exam" CTA
 *
 * System check runs silently in the background (useEffect on mount).
 * If it detects issues, a dismissible warning strip appears — it does NOT
 * block the student from proceeding.
 *
 * Lockdown browser enforcement is deferred to Q4 2026 (vendor evaluation:
 * Respondus vs HonorLock).
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge, Button, Checkbox, Input } from '@exxatdesignux/ui';
import { MOCK_ASSESSMENTS, getEffectiveDuration, formatDuration, Assessment } from '../data/assessments';

const STEPS = [
  { id: 'password',      label: 'Enter Password',  icon: 'fa-lock' },
  { id: 'instructions',  label: 'Instructions',    icon: 'fa-file-lines' },
  { id: 'accommodation', label: 'Accommodations',  icon: 'fa-universal-access' },
  { id: 'ready',         label: 'Ready to Start',  icon: 'fa-circle-check' },
];

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Pre-exam steps" className="flex items-center gap-0 mb-9">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 80 }}>
              <div
                aria-current={active ? 'step' : undefined}
                className="flex items-center justify-center w-9 h-9 rounded-full font-bold transition-all duration-200"
                style={{
                  background: done || active ? 'var(--brand-color)' : 'var(--muted)',
                  color: done || active ? 'var(--brand-foreground)' : 'var(--muted-foreground)',
                  fontSize: done ? 14 : 13,
                  border: active ? '2px solid var(--brand-color)' : 'none',
                }}
              >
                {done
                  ? <i className="fa-solid fa-check" aria-hidden="true" />
                  : <i className={`fa-light ${step.icon}`} aria-hidden="true" />
                }
              </div>
              <span
                className="text-center leading-tight"
                style={{
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: active || done ? 'var(--brand-color)' : 'var(--muted-foreground)',
                  maxWidth: 72,
                }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mb-5 transition-colors duration-300"
                style={{ background: i < current ? 'var(--brand-color)' : 'var(--border)' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── Step 0: Password ────────────────────────────────────────────────────────
function ExamPassword({ onNext }: { onNext: () => void }) {
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
    <div>
      <h2 className="text-xl font-bold mb-1.5 leading-tight" style={{ color: 'var(--foreground)' }}>
        Enter Exam Password
      </h2>
      <p className="text-sm mb-7" style={{ color: 'var(--muted-foreground)' }}>
        Your faculty will display or announce the password when the exam begins. This confirms you are taking the exam at the scheduled time and location.
      </p>

      <div className="flex items-center gap-2.5 rounded-xl px-4 py-3.5 mb-6 border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
        <i className="fa-light fa-circle-info fa-fw shrink-0" aria-hidden="true" style={{ color: 'var(--brand-color)', fontSize: 16 }} />
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          The password is given verbally in class — do not share it with anyone who is not present.
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="exam-password" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
          Exam Password
        </label>
        <Input
          id="exam-password"
          type="text"
          placeholder="Enter password given by your faculty"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false); }}
          onKeyDown={e => { if (e.key === 'Enter' && password) handleSubmit(); }}
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={error}
          aria-describedby={error ? 'pw-error' : undefined}
          className="w-full"
        />
        {error && (
          <p id="pw-error" role="alert" className="flex items-center gap-1.5 text-sm mt-1.5" style={{ color: 'var(--destructive)' }}>
            <i className="fa-light fa-circle-xmark" aria-hidden="true" />
            Incorrect password. Ask your faculty to confirm.
          </p>
        )}
      </div>

      <Button size="lg" onClick={handleSubmit} disabled={!password || checking} className="w-full">
        <i className={`fa-light ${checking ? 'fa-spinner-third fa-spin' : 'fa-arrow-right'}`} aria-hidden="true" />
        {checking ? 'Verifying…' : 'Continue'}
      </Button>
    </div>
  );
}

// ─── Step 1: Instructions ─────────────────────────────────────────────────────
function Instructions({ exam, onNext }: { exam: Assessment; onNext: () => void }) {
  const [attested, setAttested] = React.useState(false);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1.5 leading-tight" style={{ color: 'var(--foreground)' }}>
        Instructions
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        Read the following carefully before you begin.
      </p>

      {/* Exam summary strip */}
      <div className="grid grid-cols-3 gap-3 rounded-xl p-4 mb-5 border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
        {[
          { icon: 'fa-list-check', label: 'Questions',    value: `${exam.questionCount}` },
          { icon: 'fa-clock',      label: 'Time Allowed', value: formatDuration(getEffectiveDuration(exam)) },
          { icon: 'fa-shield-check', label: 'Passing Score', value: `${exam.passingScore}%` },
        ].map(item => (
          <div key={item.label} className="text-center">
            <i className={`fa-light ${item.icon} fa-fw block mb-1`} aria-hidden="true" style={{ color: 'var(--muted-foreground)', fontSize: 18 }} />
            <p className="text-lg font-extrabold" style={{ color: 'var(--foreground)' }}>{item.value}</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Faculty Instructions */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Faculty Instructions</p>
          <Badge variant="secondary" className="text-xs">From your instructor</Badge>
        </div>
        <div
          className="rounded-xl p-4 text-sm border overflow-y-auto"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', lineHeight: 1.7, maxHeight: 160 }}
        >
          {exam.instructions || 'No specific instructions provided for this exam.'}
          {exam.assessmentReferences && exam.assessmentReferences.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="font-semibold mb-1.5">Reference Materials Available:</p>
              <ul className="ps-4 m-0 space-y-1">
                {exam.assessmentReferences.map(m => (
                  <li key={m.id}>
                    <i className={`fa-light ${m.icon} fa-fw me-1.5`} aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                    {m.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Academic Integrity */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Exxat Platform Instructions</p>
          <Badge variant="secondary" className="text-xs">Academic Integrity</Badge>
        </div>
        <div
          className="rounded-xl p-4 text-sm border overflow-y-auto"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)', lineHeight: 1.7, maxHeight: 120 }}
        >
          By starting this exam, you confirm that you will complete all questions independently without the assistance of any unauthorized resources, other students, or external parties. You understand that any form of academic dishonesty may result in a failing grade, academic probation, or dismissal from the program in accordance with your institution's code of conduct.
        </div>
      </div>

      {/* Attestation — optional, does not gate Continue */}
      <label
        htmlFor="attestation"
        className="flex items-start gap-3 rounded-xl p-4 mb-6 cursor-pointer border"
        style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
      >
        <Checkbox
          id="attestation"
          checked={attested}
          onCheckedChange={v => setAttested(Boolean(v))}
          className="mt-0.5 shrink-0"
        />
        <div className="flex-1">
          <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--foreground)' }}>
            I have read and understood all instructions
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Optional — you can proceed without checking this.
          </p>
        </div>
        {attested && (
          <i className="fa-solid fa-circle-check shrink-0 mt-0.5" aria-hidden="true" style={{ color: 'var(--foreground)', fontSize: 18 }} />
        )}
      </label>

      <Button size="lg" onClick={onNext} className="w-full">
        <i className="fa-light fa-arrow-right" aria-hidden="true" />
        Continue
      </Button>
    </div>
  );
}

// ─── Step 2: Accommodation Confirmation ──────────────────────────────────────
function AccommodationConfirmation({ exam, onNext }: { exam: Assessment; onNext: () => void }) {
  const acc = exam.accommodation;
  const effectiveMins = getEffectiveDuration(exam);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1.5 leading-tight" style={{ color: 'var(--foreground)' }}>
        Accommodation Confirmation
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        Review your approved accommodations before the exam begins. If anything is incorrect, contact Student Services — do not start the exam.
      </p>

      {acc ? (
        <div className="flex flex-col gap-3 mb-6">
          {[
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
          ].filter(Boolean).map((item: any) => (
            <div key={item.label} className="flex items-start gap-3.5 rounded-xl px-4 py-3.5 border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <i className={`fa-light ${item.icon} fa-fw`} aria-hidden="true" style={{ color: 'var(--muted-foreground)', fontSize: 16 }} />
              </div>
              <div>
                <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--foreground)' }}>{item.label}</p>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>{item.value}</p>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 rounded-lg px-4 py-3 border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
            <i className="fa-light fa-circle-info fa-fw shrink-0" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Accommodations approved by <strong style={{ color: 'var(--foreground)' }}>{acc.approvedBy}</strong>. Faculty cannot modify accommodations.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-6 text-center mb-6 border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
          <i className="fa-light fa-universal-access fa-fw block mb-2" aria-hidden="true" style={{ fontSize: 32, color: 'var(--muted-foreground)' }} />
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>No accommodations on record</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            If you have an approved accommodation that isn't showing, contact Student Services before starting.
          </p>
        </div>
      )}

      <a
        href="mailto:studentservices@exxat.edu"
        className="block text-center text-sm mb-5 no-underline"
        style={{ color: 'var(--brand-color)' }}
      >
        <i className="fa-light fa-envelope fa-fw me-1" aria-hidden="true" />
        Contact Student Services if accommodations are incorrect
      </a>

      <Button size="lg" onClick={onNext} className="w-full">
        <i className="fa-light fa-arrow-right" aria-hidden="true" />
        Accommodations are correct — Continue
      </Button>
    </div>
  );
}

// ─── Step 3: Ready ────────────────────────────────────────────────────────────
function ReadyToStart({ exam, onStart }: { exam: Assessment; onStart: () => void }) {
  return (
    <div className="text-center">
      <div
        className="flex items-center justify-center w-18 h-18 rounded-full mx-auto mb-5 border"
        style={{ width: 72, height: 72, background: 'var(--muted)', borderColor: 'var(--border)' }}
      >
        <i className="fa-solid fa-circle-check" aria-hidden="true" style={{ color: 'var(--foreground)', fontSize: 32 }} />
      </div>

      <h2 className="text-2xl font-bold mb-2 leading-tight" style={{ color: 'var(--foreground)' }}>You're Ready</h2>
      <p className="text-sm mb-7" style={{ color: 'var(--muted-foreground)' }}>
        All checks passed. Your exam is ready to begin. The timer starts when you click Start.
      </p>

      <div className="rounded-xl p-5 mb-7 text-left border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
        <p className="text-xs font-bold mb-3.5" style={{ color: 'var(--muted-foreground)' }}>Exam Summary</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Exam',         value: exam.title },
            { label: 'Course',       value: `${exam.courseCode} · ${exam.courseName}` },
            { label: 'Questions',    value: `${exam.questionCount}` },
            { label: 'Time Allowed', value: formatDuration(getEffectiveDuration(exam)) },
            { label: 'Passing Score', value: `${exam.passingScore}%` },
            { label: 'Results',      value: exam.isHighStakes ? 'Available after faculty review' : 'Available immediately after submission' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{item.label}</p>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Button size="lg" onClick={onStart} className="w-full font-extrabold">
        <i className="fa-solid fa-play" aria-hidden="true" />
        Start Exam — Timer Begins Now
      </Button>

      <p className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
        <i className="fa-light fa-circle-info fa-fw me-1" aria-hidden="true" />
        Once started, the exam session cannot be paused.
      </p>
    </div>
  );
}

// ─── Pre-Exam Flow orchestrator ───────────────────────────────────────────────
export function PreExamFlow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [compatWarning, setCompatWarning] = useState<string | null>(null);

  // Background system check — runs silently on mount.
  // Does NOT block the student; a dismissible strip appears only on failure.
  useEffect(() => {
    const timer = setTimeout(() => {
      setCompatWarning(null); // Prototype: always pass
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const exam = MOCK_ASSESSMENTS.find(a => a.id === id);

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-full" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: 'var(--foreground)' }}>Assessment not found.</p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} style={{ color: 'var(--brand-color)' }}>
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const hasAccommodation = Boolean(exam.accommodation);

  const handleNext = () => {
    if (step === 1 && !hasAccommodation) {
      setStep(3);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step === 0) {
      navigate('/');
    } else if (step === 3 && !hasAccommodation) {
      setStep(1);
    } else {
      setStep(s => s - 1);
    }
  };

  const handleStart = () => navigate(`/exam/${id}/take`);

  return (
    <div className="min-h-full" style={{ background: 'var(--background)' }}>
      {/* Step breadcrumb bar */}
      <div className="flex items-center justify-between px-6 h-11 border-b" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <Button variant="ghost" size="sm" onClick={handleBack} style={{ color: 'var(--muted-foreground)' }}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" />
          {step === 0 ? 'Back to Dashboard' : 'Previous Step'}
        </Button>
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Step {step + 1} of {STEPS.length}</span>
      </div>

      <div className="max-w-xl mx-auto px-6 py-9 pb-16">
        <StepIndicator current={step} />

        {/* Background compat warning strip — dismissible, does not block */}
        {compatWarning && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 mb-5 text-sm border"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)', lineHeight: 1.4 }}
          >
            <i className="fa-light fa-triangle-exclamation fa-fw shrink-0" aria-hidden="true" style={{ fontSize: 15 }} />
            <span className="flex-1">{compatWarning}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCompatWarning(null)}
              aria-label="Dismiss compatibility warning"
              style={{ flexShrink: 0, color: 'var(--foreground)' }}
            >
              <i className="fa-light fa-xmark" aria-hidden="true" />
            </Button>
          </div>
        )}

        {step === 0 && <ExamPassword onNext={() => setStep(1)} />}
        {step === 1 && <Instructions exam={exam} onNext={handleNext} />}
        {step === 2 && <AccommodationConfirmation exam={exam} onNext={() => setStep(3)} />}
        {step === 3 && <ReadyToStart exam={exam} onStart={handleStart} />}
      </div>
    </div>
  );
}
