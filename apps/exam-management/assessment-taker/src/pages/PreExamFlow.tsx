/**
 * PRE-EXAM FLOW — 5-step setup before entering the exam engine
 *
 * Per Aarti + Darshan (Granola sessions) + Vishaka (May 14):
 *   Step 0: Password — faculty-announced class password (second-level auth)
 *   Step 1: System Check — browser, connectivity, storage
 *   Step 2: Instructions & Academic Integrity — exam-specific + e-signature
 *   Step 3: Accommodation Confirmation — confirm what's applied before starting
 *   Step 4: Ready — exam summary + "Start Exam" CTA
 *
 * Lockdown browser enforcement is deferred to Q4 2026 (vendor evaluation:
 * Respondus vs HonorLock). Step 1 shows it as informational only.
 *
 * Audio/video pre-check (Darshan's item) is shown as pending/TBD.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge, Button, Input } from '@exxat/ds/packages/ui/src';
import { MOCK_ASSESSMENTS, getEffectiveDuration, formatDuration, Assessment } from '../data/assessments';

const t = {
  bg: 'var(--background)',
  card: 'var(--card)',
  muted: 'var(--muted)',
  brand: 'var(--brand-color)',
  fg: 'var(--foreground)',
  fgMuted: 'var(--muted-foreground)',
  border: 'var(--border)',
  borderControl: 'var(--border)',
};

const STEPS = [
  { id: 'password',      label: 'Enter Password',        icon: 'fa-lock' },
  { id: 'system',        label: 'System Check',          icon: 'fa-display-code' },
  { id: 'instructions',  label: 'Instructions',          icon: 'fa-file-lines' },
  { id: 'accommodation', label: 'Accommodations',        icon: 'fa-universal-access' },
  { id: 'ready',         label: 'Ready to Start',        icon: 'fa-circle-check' },
];

// ─── Step 0: Password ────────────────────────────────────────────────────────
function ExamPassword({ onNext }: { onNext: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  // Mock password for prototype — real implementation validates against server
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
      <h2 style={{ fontSize: 22, fontWeight: 700, color: t.fg, marginBottom: 6, lineHeight: 1.2 }}>
        Enter Exam Password
      </h2>
      <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 28 }}>
        Your faculty will display or announce the password when the exam begins. This confirms you are taking the exam at the scheduled time and location.
      </p>

      <div style={{
        background: t.muted, border: `1px solid ${t.border}`,
        borderRadius: 10, padding: '14px 18px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <i className="fa-light fa-circle-info" aria-hidden="true" style={{ color: t.brand, fontSize: 16, flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: t.fg }}>
          The password is given verbally in class — do not share it with anyone who is not present.
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label htmlFor="exam-password" style={{ fontSize: 13, fontWeight: 600, color: t.fg, display: 'block', marginBottom: 6 }}>
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
          <p id="pw-error" role="alert" style={{ fontSize: 13, color: 'var(--destructive)', marginTop: 6 }}>
            <i className="fa-light fa-circle-xmark" aria-hidden="true" style={{ marginRight: 5 }} />
            Incorrect password. Ask your faculty to confirm.
          </p>
        )}
      </div>

      <Button
        size="lg"
        onClick={handleSubmit}
        disabled={!password || checking}
        className="w-full"
        aria-disabled={!password || checking}
      >
        <i className={`fa-light ${checking ? 'fa-spinner-third fa-spin' : 'fa-arrow-right'}`} aria-hidden="true" />
        {checking ? 'Verifying…' : 'Continue'}
      </Button>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Pre-exam steps" style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step.id}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 80 }}>
              <div
                aria-current={active ? 'step' : undefined}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: done || active ? t.brand : t.muted,
                  color: done || active ? 'var(--primary-foreground)' : t.fgMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: done ? 14 : 13,
                  fontWeight: 700,
                  border: active ? `2px solid ${t.brand}` : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {done
                  ? <i className="fa-solid fa-check" aria-hidden="true" />
                  : <i className={`fa-light ${step.icon}`} aria-hidden="true" />
                }
              </div>
              <span style={{
                fontSize: 11, fontWeight: active ? 700 : 500,
                color: active ? t.brand : done ? t.brand : t.fgMuted,
                textAlign: 'center', lineHeight: 1.3, maxWidth: 72,
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < current ? t.brand : t.border, marginBottom: 20, transition: 'background 0.3s ease' }} />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── Step 1: System Check ─────────────────────────────────────────────────────
function SystemCheck({ onNext }: { onNext: () => void }) {
  const [checks, setChecks] = useState({
    browser: false,
    connection: false,
    storage: false,
  });

  useEffect(() => {
    // Simulate progressive checks
    setTimeout(() => setChecks(c => ({ ...c, browser: true })), 600);
    setTimeout(() => setChecks(c => ({ ...c, connection: true })), 1200);
    setTimeout(() => setChecks(c => ({ ...c, storage: true })), 1800);
  }, []);

  const allPassed = Object.values(checks).every(Boolean);

  const checkItems = [
    {
      key: 'browser' as const,
      label: 'Browser Compatibility',
      detail: 'Chrome 120+ / Edge 118+ / Firefox 121+ detected',
      icon: 'fa-browser',
    },
    {
      key: 'connection' as const,
      label: 'Internet Connection',
      detail: 'Connected · Signal strength: Strong',
      icon: 'fa-wifi',
    },
    {
      key: 'storage' as const,
      label: 'Available Storage',
      detail: '4.2 GB free — sufficient for exam session',
      icon: 'fa-hard-drive',
    },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: t.fg, marginBottom: 6, lineHeight: 1.2 }}>System Check</h2>
      <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 28 }}>
        We're verifying your setup before the exam begins. This takes a few seconds.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {checkItems.map(item => (
          <div key={item.key} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '14px 18px', borderRadius: 10,
            background: t.muted,
            border: `1px solid ${t.border}`,
            transition: 'all 0.3s ease',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: t.card,
              border: `1.5px solid ${t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {checks[item.key]
                ? <i className="fa-solid fa-check" aria-hidden="true" style={{ color: t.fg, fontSize: 14 }} />
                : <i className={`fa-light ${item.icon}`} aria-hidden="true" style={{ color: t.fgMuted, fontSize: 14, animation: 'spin 1s linear infinite' }} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: t.fg }}>{item.label}</p>
              <p style={{ fontSize: 13, color: t.fgMuted }}>
                {checks[item.key] ? item.detail : 'Checking…'}
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full text-xs font-semibold">
              {checks[item.key] ? 'Passed' : '…'}
            </Badge>
          </div>
        ))}

        {/* Lockdown browser — deferred / informational */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 18px', borderRadius: 10,
          background: t.muted, border: `1px solid ${t.border}`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: t.card, border: `1.5px solid ${t.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="fa-light fa-lock-open" aria-hidden="true" style={{ color: t.fgMuted, fontSize: 14 }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.fg }}>Lockdown Browser</p>
            <p style={{ fontSize: 13, color: t.fgMuted }}>
              Not required for this exam
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full text-xs font-semibold">
            Not Required
          </Badge>
        </div>
      </div>

      <Button
        size="lg"
        onClick={onNext}
        disabled={!allPassed}
        className="w-full"
        aria-disabled={!allPassed}
      >
        <i className="fa-light fa-arrow-right" aria-hidden="true" />
        {allPassed ? 'Continue to Instructions' : 'Running checks…'}
      </Button>
    </div>
  );
}

// ─── Step 2: Instructions ─────────────────────────────────────────────────────
function Instructions({ exam, onNext }: { exam: Assessment; onNext: () => void }) {
  const [attested, setAttested] = React.useState(false);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: t.fg, marginBottom: 6, lineHeight: 1.2 }}>Instructions</h2>
      <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 24 }}>
        Read the following carefully before you begin.
      </p>

      {/* Exam summary strip */}
      <div style={{
        background: t.muted, border: `1px solid ${t.border}`,
        borderRadius: 10, padding: 16, marginBottom: 20,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
      }}>
        {[
          { icon: 'fa-list-check', label: 'Questions', value: `${exam.questionCount}` },
          { icon: 'fa-clock', label: 'Time Allowed', value: formatDuration(getEffectiveDuration(exam)) },
          { icon: 'fa-shield-check', label: 'Passing Score', value: `${exam.passingScore}%` },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <i className={`fa-light ${item.icon}`} aria-hidden="true" style={{ color: t.fgMuted, fontSize: 18, marginBottom: 4, display: 'block' }} />
            <p style={{ fontSize: 18, fontWeight: 800, color: t.fg }}>{item.value}</p>
            <p style={{ fontSize: 12, color: t.fgMuted }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Faculty Instructions */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: t.fg, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
            Faculty Instructions
          </p>
          <Badge variant="secondary" className="text-xs">From your instructor</Badge>
        </div>
        <div style={{
          background: t.card, border: `1px solid ${t.border}`,
          borderRadius: 10, padding: 16, fontSize: 14, color: t.fg,
          lineHeight: 1.7, maxHeight: 160, overflowY: 'auto',
        }}>
          {exam.instructions || 'No specific instructions provided for this exam.'}
          {exam.referenceMaterials && exam.referenceMaterials.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>Reference Materials Available:</p>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {exam.referenceMaterials.map(m => (
                  <li key={m} style={{ marginBottom: 4 }}>
                    <i className="fa-light fa-file-pdf" aria-hidden="true" style={{ color: t.fgMuted, marginRight: 6 }} />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Exxat Platform Instructions */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: t.fg, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
            Exxat Platform Instructions
          </p>
          <Badge variant="secondary" className="text-xs">Academic Integrity</Badge>
        </div>
        <div style={{
          background: t.card, border: `1px solid ${t.border}`,
          borderRadius: 10, padding: 16, fontSize: 13, color: t.fgMuted,
          lineHeight: 1.7, maxHeight: 120, overflowY: 'auto',
        }}>
          By starting this exam, you confirm that you will complete all questions independently without the assistance of any unauthorized resources, other students, or external parties. You understand that any form of academic dishonesty may result in a failing grade, academic probation, or dismissal from the program in accordance with your institution's code of conduct.
        </div>
      </div>

      {/* Attestation — optional, does not gate Continue */}
      <label
        htmlFor="attestation"
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px 16px', borderRadius: 10, marginBottom: 24, cursor: 'pointer',
          background: t.muted,
          border: `1px solid ${t.border}`,
          transition: 'all 0.2s ease',
        }}
      >
        <input
          id="attestation"
          type="checkbox"
          checked={attested}
          onChange={e => setAttested(e.target.checked)}
          style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--brand-color)', cursor: 'pointer', flexShrink: 0 }}
          aria-label="I have read and understood the instructions"
        />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: t.fg, margin: 0, marginBottom: 2 }}>
            I have read and understood all instructions
          </p>
          <p style={{ fontSize: 12, color: t.fgMuted, margin: 0 }}>
            Optional — you can proceed without checking this.
          </p>
        </div>
        {attested && (
          <i className="fa-solid fa-circle-check" aria-hidden="true" style={{ color: t.fg, fontSize: 18, flexShrink: 0, marginTop: 1 }} />
        )}
      </label>

      <Button size="lg" onClick={onNext} className="w-full">
        <i className="fa-light fa-arrow-right" aria-hidden="true" />
        Continue
      </Button>
    </div>
  );
}

// ─── Step 3: Accommodation Confirmation ──────────────────────────────────────
function AccommodationConfirmation({ exam, onNext }: { exam: Assessment; onNext: () => void }) {
  const acc = exam.accommodation;
  const effectiveMins = getEffectiveDuration(exam);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: t.fg, marginBottom: 6, lineHeight: 1.2 }}>Accommodation Confirmation</h2>
      <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 24 }}>
        Review your approved accommodations before the exam begins. If anything is incorrect, contact Student Services — do not start the exam.
      </p>

      {acc ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
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
            <div key={item.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 18px', borderRadius: 10,
              background: t.muted, border: `1px solid ${t.border}`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: t.card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <i className={`fa-light ${item.icon}`} aria-hidden="true" style={{ color: t.fgMuted, fontSize: 16 }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: t.fg, marginBottom: 2 }}>{item.label}</p>
                <p style={{ fontSize: 13, color: t.fg }}>{item.value}</p>
              </div>
            </div>
          ))}

          {/* Approver attribution */}
          <div style={{
            padding: '12px 16px', borderRadius: 8,
            background: t.muted, border: `1px solid ${t.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <i className="fa-light fa-circle-info" aria-hidden="true" style={{ color: t.fgMuted }} />
            <p style={{ fontSize: 13, color: t.fgMuted }}>
              Accommodations approved by <strong style={{ color: t.fg }}>{acc.approvedBy}</strong>. Faculty cannot modify accommodations.
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '24px', borderRadius: 12,
          background: t.muted, border: `1px solid ${t.border}`,
          textAlign: 'center', marginBottom: 24,
        }}>
          <i className="fa-light fa-universal-access" aria-hidden="true" style={{ fontSize: 32, color: t.fgMuted, marginBottom: 8, display: 'block' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: t.fg, marginBottom: 4 }}>No accommodations on record</p>
          <p style={{ fontSize: 13, color: t.fgMuted }}>
            If you have an approved accommodation that isn't showing, contact Student Services before starting.
          </p>
        </div>
      )}

      <a
        href="mailto:studentservices@exxat.edu"
        style={{ display: 'block', textAlign: 'center', fontSize: 13, color: t.brand, marginBottom: 20, textDecoration: 'none' }}
      >
        <i className="fa-light fa-envelope" aria-hidden="true" style={{ marginRight: 5 }} />
        Contact Student Services if accommodations are incorrect
      </a>

      <Button size="lg" onClick={onNext} className="w-full">
        <i className="fa-light fa-arrow-right" aria-hidden="true" />
        Accommodations are correct — Continue
      </Button>
    </div>
  );
}

// ─── Step 4: Ready ────────────────────────────────────────────────────────────
function ReadyToStart({ exam, onStart }: { exam: Assessment; onStart: () => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: t.muted, border: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <i className="fa-solid fa-circle-check" aria-hidden="true" style={{ color: t.fg, fontSize: 32 }} />
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 700, color: t.fg, marginBottom: 8, lineHeight: 1.2 }}>You're Ready</h2>
      <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 28 }}>
        All checks passed. Your exam is ready to begin. The timer starts when you click Start.
      </p>

      {/* Final summary */}
      <div style={{
        background: t.muted, border: `1px solid ${t.border}`,
        borderRadius: 12, padding: 20, marginBottom: 28, textAlign: 'left',
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
          Exam Summary
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Exam', value: exam.title },
            { label: 'Course', value: `${exam.courseCode} · ${exam.courseName}` },
            { label: 'Questions', value: `${exam.questionCount}` },
            { label: 'Time Allowed', value: formatDuration(getEffectiveDuration(exam)) },
            { label: 'Passing Score', value: `${exam.passingScore}%` },
            { label: 'Results', value: exam.isHighStakes ? 'Available after faculty review' : 'Available immediately after submission' },
          ].map(item => (
            <div key={item.label}>
              <p style={{ fontSize: 11, fontWeight: 700, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 }}>{item.label}</p>
              <p style={{ fontSize: 13, color: t.fg, fontWeight: 500 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Button
        size="lg"
        onClick={onStart}
        className="w-full font-extrabold"
      >
        <i className="fa-solid fa-play" aria-hidden="true" />
        Start Exam — Timer Begins Now
      </Button>

      <p style={{ fontSize: 12, color: t.fgMuted, marginTop: 12 }}>
        <i className="fa-light fa-circle-info" aria-hidden="true" style={{ marginRight: 4 }} />
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

  const exam = MOCK_ASSESSMENTS.find(a => a.id === id);

  if (!exam) {
    return (
      <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, color: t.fg }}>Assessment not found.</p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mt-4" style={{ color: t.brand }}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Skip accommodation step if no accommodation on record
  const hasAccommodation = Boolean(exam.accommodation);

  const handleNext = () => {
    if (step === 2 && !hasAccommodation) {
      setStep(4); // skip accommodation
    } else {
      setStep(s => s + 1);
    }
  };

  const handleStart = () => navigate(`/exam/${id}/take`);

  return (
    <div style={{ background: t.bg, fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100%' }}>
      {/* Step breadcrumb bar */}
      <div style={{
        background: t.card, borderBottom: `1px solid ${t.border}`,
        padding: '0 24px', height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => step === 0 ? navigate('/') : setStep(s => s - 1)}
          className="h-auto py-1 px-2 text-xs"
          style={{ color: t.fgMuted }}
        >
          <i className="fa-light fa-arrow-left" aria-hidden="true" />
          {step === 0 ? 'Back to Dashboard' : 'Previous Step'}
        </Button>
        <span style={{ fontSize: 13, color: t.fgMuted }}>Step {step + 1} of {STEPS.length}</span>
      </div>

      <div style={{ maxWidth: 580, margin: '0 auto', padding: '36px 24px 60px' }}>
        <StepIndicator current={step} />

        {step === 0 && <ExamPassword onNext={() => setStep(1)} />}
        {step === 1 && <SystemCheck onNext={() => setStep(2)} />}
        {step === 2 && <Instructions exam={exam} onNext={handleNext} />}
        {step === 3 && <AccommodationConfirmation exam={exam} onNext={() => setStep(4)} />}
        {step === 4 && <ReadyToStart exam={exam} onStart={handleStart} />}
      </div>
    </div>
  );
}
