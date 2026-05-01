/**
 * PRE-EXAM FLOW — 4-step setup before entering the exam engine
 *
 * Per Aarti + Darshan (Granola sessions):
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
import { MOCK_ASSESSMENTS, getEffectiveDuration, formatDuration, Assessment } from '../data/assessments';

const t = {
  bg: 'var(--background)',
  card: 'var(--card)',
  muted: 'var(--muted)',
  brand: 'var(--brand-color)',
  brandDark: 'var(--brand-color-dark)',
  brandSurface: 'var(--brand-tint-light, #F5F3FF)',
  brandBorder: 'var(--brand-tint, #EDE9FE)',
  fg: 'var(--foreground)',
  fgMuted: 'var(--muted-foreground)',
  border: 'var(--border)',
  borderControl: 'var(--border-control)',
};

const STEPS = [
  { id: 'system',       label: 'System Check',          icon: 'fa-display-code' },
  { id: 'instructions', label: 'Instructions',           icon: 'fa-file-lines' },
  { id: 'accommodation',label: 'Accommodations',         icon: 'fa-universal-access' },
  { id: 'ready',        label: 'Ready to Start',         icon: 'fa-circle-check' },
];

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
                  background: done ? '#4ADE80' : active ? t.brand : t.muted,
                  color: done || active ? '#FFF' : t.fgMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: done ? 14 : 13,
                  fontWeight: 700,
                  border: active ? `2px solid ${t.brandDark}` : 'none',
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
                color: active ? t.brand : done ? '#15803D' : t.fgMuted,
                textAlign: 'center', lineHeight: 1.3, maxWidth: 72,
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < current ? '#4ADE80' : t.border, marginBottom: 20, transition: 'background 0.3s ease' }} />
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
      <h2 style={{ fontSize: 20, fontWeight: 800, color: t.fg, marginBottom: 6 }}>System Check</h2>
      <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 28 }}>
        We're verifying your setup before the exam begins. This takes a few seconds.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {checkItems.map(item => (
          <div key={item.key} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '14px 18px', borderRadius: 10,
            background: checks[item.key] ? '#F0FDF4' : t.muted,
            border: `1px solid ${checks[item.key] ? '#4ADE80' : t.border}`,
            transition: 'all 0.3s ease',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: checks[item.key] ? '#DCFCE7' : t.card,
              border: `1.5px solid ${checks[item.key] ? '#4ADE80' : t.borderControl}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {checks[item.key]
                ? <i className="fa-solid fa-check" aria-hidden="true" style={{ color: '#15803D', fontSize: 14 }} />
                : <i className={`fa-light ${item.icon}`} aria-hidden="true" style={{ color: t.fgMuted, fontSize: 14, animation: 'spin 1s linear infinite' }} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: t.fg }}>{item.label}</p>
              <p style={{ fontSize: 13, color: checks[item.key] ? '#15803D' : t.fgMuted }}>
                {checks[item.key] ? item.detail : 'Checking…'}
              </p>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
              background: checks[item.key] ? '#DCFCE7' : t.muted,
              color: checks[item.key] ? '#15803D' : t.fgMuted,
            }}>
              {checks[item.key] ? 'Passed' : '…'}
            </span>
          </div>
        ))}

        {/* Lockdown browser — deferred / informational */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 18px', borderRadius: 10,
          background: '#FFFBEB', border: '1px solid #FDE68A',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#FEF3C7', border: '1.5px solid #FACC15',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="fa-light fa-lock-open" aria-hidden="true" style={{ color: '#D97706', fontSize: 14 }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#92400E' }}>Lockdown Browser</p>
            <p style={{ fontSize: 13, color: '#D97706' }}>
              Not required for this exam · Lockdown enforcement scheduled Q4 2026
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#FEF3C7', color: '#D97706' }}>
            Not Required
          </span>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!allPassed}
        style={{
          width: '100%', padding: '14px', borderRadius: 10,
          background: allPassed ? t.brand : t.muted,
          color: allPassed ? '#FFF' : t.fgMuted,
          border: 'none', fontSize: 15, fontWeight: 700, cursor: allPassed ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        aria-disabled={!allPassed}
      >
        <i className="fa-light fa-arrow-right" aria-hidden="true" />
        {allPassed ? 'Continue to Instructions' : 'Running checks…'}
      </button>
    </div>
  );
}

// ─── Step 2: Instructions + Academic Integrity ────────────────────────────────
function Instructions({ exam, onNext }: { exam: Assessment; onNext: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');

  const canContinue = agreed && signature.trim().length > 0;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: t.fg, marginBottom: 6 }}>Instructions & Academic Integrity</h2>
      <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 24 }}>
        Read the following carefully before you begin.
      </p>

      {/* Exam summary */}
      <div style={{
        background: t.brandSurface, border: `1px solid ${t.brandBorder}`,
        borderRadius: 10, padding: 16, marginBottom: 20,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
      }}>
        {[
          { icon: 'fa-list-check', label: 'Questions', value: `${exam.questionCount}` },
          { icon: 'fa-clock', label: 'Time Allowed', value: formatDuration(getEffectiveDuration(exam)) },
          { icon: 'fa-shield-check', label: 'Passing Score', value: `${exam.passingScore}%` },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <i className={`fa-light ${item.icon}`} aria-hidden="true" style={{ color: t.brand, fontSize: 18, marginBottom: 4, display: 'block' }} />
            <p style={{ fontSize: 18, fontWeight: 800, color: t.fg }}>{item.value}</p>
            <p style={{ fontSize: 12, color: t.fgMuted }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Exam instructions */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.fg, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Exam Instructions
        </p>
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
                    <i className="fa-light fa-file-pdf" aria-hidden="true" style={{ color: '#EF4444', marginRight: 6 }} />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Academic integrity policy */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.fg, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Academic Integrity Policy
        </p>
        <div style={{
          background: t.card, border: `1px solid ${t.border}`,
          borderRadius: 10, padding: 16, fontSize: 13, color: t.fgMuted,
          lineHeight: 1.7, maxHeight: 120, overflowY: 'auto',
        }}>
          By starting this exam, you confirm that you will complete all questions independently without the assistance of any unauthorized resources, other students, or external parties. You understand that any form of academic dishonesty may result in a failing grade, academic probation, or dismissal from the program in accordance with your institution's code of conduct.
        </div>
      </div>

      {/* Agreement checkbox */}
      <label style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        marginBottom: 16, cursor: 'pointer', userSelect: 'none',
      }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          style={{ width: 18, height: 18, marginTop: 1, accentColor: t.brand, flexShrink: 0 }}
          aria-label="I have read and agree to the academic integrity policy"
        />
        <span style={{ fontSize: 14, color: t.fg, lineHeight: 1.5 }}>
          I have read and agree to the{' '}
          <strong>Academic Integrity Policy</strong> and the exam instructions above.
        </span>
      </label>

      {/* E-signature */}
      <div style={{ marginBottom: 24 }}>
        <label htmlFor="esig" style={{ fontSize: 13, fontWeight: 600, color: t.fg, display: 'block', marginBottom: 6 }}>
          Type your full name as an electronic signature
        </label>
        <input
          id="esig"
          type="text"
          placeholder="e.g. Ramona Sanchez"
          value={signature}
          onChange={e => setSignature(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            border: `1.5px solid ${signature ? t.brand : t.borderControl}`,
            fontSize: 14, color: t.fg, background: t.card,
            outline: 'none', boxSizing: 'border-box',
            fontFamily: 'cursive',
          }}
        />
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        style={{
          width: '100%', padding: '14px', borderRadius: 10,
          background: canContinue ? t.brand : t.muted,
          color: canContinue ? '#FFF' : t.fgMuted,
          border: 'none', fontSize: 15, fontWeight: 700,
          cursor: canContinue ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        aria-disabled={!canContinue}
      >
        <i className="fa-light fa-arrow-right" aria-hidden="true" />
        Continue
      </button>
    </div>
  );
}

// ─── Step 3: Accommodation Confirmation ──────────────────────────────────────
function AccommodationConfirmation({ exam, onNext }: { exam: Assessment; onNext: () => void }) {
  const acc = exam.accommodation;
  const effectiveMins = getEffectiveDuration(exam);

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: t.fg, marginBottom: 6 }}>Accommodation Confirmation</h2>
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
              color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE',
            },
            acc.separateRoom && {
              icon: 'fa-door-open',
              label: 'Separate Testing Room',
              value: 'You will take this exam in a private, distraction-free environment',
              color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE',
            },
            acc.extendedBreaks && {
              icon: 'fa-mug-hot',
              label: 'Extended Breaks',
              value: acc.additionalNotes ?? 'Scheduled breaks during the exam',
              color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC',
            },
          ].filter(Boolean).map((item: any) => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 18px', borderRadius: 10,
              background: item.bg, border: `1px solid ${item.border}`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <i className={`fa-light ${item.icon}`} aria-hidden="true" style={{ color: item.color, fontSize: 16 }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: item.color, marginBottom: 2 }}>{item.label}</p>
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

      <button
        onClick={onNext}
        style={{
          width: '100%', padding: '14px', borderRadius: 10,
          background: t.brand, color: '#FFF',
          border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <i className="fa-light fa-arrow-right" aria-hidden="true" />
        Accommodations are correct — Continue
      </button>
    </div>
  );
}

// ─── Step 4: Ready ────────────────────────────────────────────────────────────
function ReadyToStart({ exam, onStart }: { exam: Assessment; onStart: () => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: '#DCFCE7', border: '3px solid #4ADE80',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <i className="fa-solid fa-circle-check" aria-hidden="true" style={{ color: '#15803D', fontSize: 32 }} />
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 800, color: t.fg, marginBottom: 8 }}>You're Ready</h2>
      <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 28 }}>
        All checks passed. Your exam is ready to begin. The timer starts when you click Start.
      </p>

      {/* Final summary */}
      <div style={{
        background: t.brandSurface, border: `1px solid ${t.brandBorder}`,
        borderRadius: 12, padding: 20, marginBottom: 28, textAlign: 'left',
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.brand, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
          Exam Summary
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Exam', value: exam.title },
            { label: 'Course', value: `${exam.courseCode} · ${exam.courseName}` },
            { label: 'Questions', value: `${exam.questionCount}` },
            { label: 'Time Allowed', value: formatDuration(getEffectiveDuration(exam)) },
            { label: 'Passing Score', value: `${exam.passingScore}%` },
            { label: 'Stakes', value: exam.isHighStakes ? 'High-stakes — results reviewed by faculty before release' : 'Low-stakes — results available immediately' },
          ].map(item => (
            <div key={item.label}>
              <p style={{ fontSize: 11, fontWeight: 700, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 }}>{item.label}</p>
              <p style={{ fontSize: 13, color: t.fg, fontWeight: 500 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onStart}
        style={{
          width: '100%', padding: '16px', borderRadius: 12,
          background: t.brand, color: '#FFF',
          border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = t.brandDark)}
        onMouseLeave={e => (e.currentTarget.style.background = t.brand)}
      >
        <i className="fa-solid fa-play" aria-hidden="true" />
        Start Exam — Timer Begins Now
      </button>

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
          <button onClick={() => navigate('/')} style={{ marginTop: 16, color: t.brand, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Skip accommodation step if no accommodation on record
  const hasAccommodation = Boolean(exam.accommodation);

  const handleNext = () => {
    if (step === 1 && !hasAccommodation) {
      // Skip accommodation step
      setStep(3);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleStart = () => navigate(`/exam/${id}/take`);

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: t.card, borderBottom: `1px solid ${t.border}`,
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => step === 0 ? navigate('/') : setStep(s => s - 1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.fgMuted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
            {step === 0 ? 'Back to Dashboard' : 'Previous Step'}
          </button>
          <span style={{ color: t.border }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.fg }}>{exam.title}</span>
        </div>
        <span style={{ fontSize: 13, color: t.fgMuted }}>Step {step + 1} of {STEPS.length}</span>
      </header>

      <main style={{ maxWidth: 580, margin: '0 auto', padding: '36px 24px 60px' }}>
        <StepIndicator current={step} />

        {step === 0 && <SystemCheck onNext={() => setStep(1)} />}
        {step === 1 && <Instructions exam={exam} onNext={handleNext} />}
        {step === 2 && <AccommodationConfirmation exam={exam} onNext={() => setStep(3)} />}
        {step === 3 && <ReadyToStart exam={exam} onStart={handleStart} />}
      </main>
    </div>
  );
}
