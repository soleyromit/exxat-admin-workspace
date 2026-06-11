/**
 * POST-EXAM — Submission confirmation + publication status
 *
 * Per Aarti (Granola sessions):
 *   - Low-stakes / quiz: results available immediately → button to view
 *   - High-stakes exam: results withheld during 3–4 day faculty review period
 *     (curving, chair consultation) → show estimated release date
 *   - Comment/flag review note for faculty (if allowComments was enabled)
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@exxatdesignux/ui';
import { MOCK_ASSESSMENTS } from '../data/assessments';

const t = {
  bg: 'var(--background)',
  card: 'var(--card)',
  muted: 'var(--muted)',
  brand: 'var(--brand-color)',
  brandDark: 'var(--brand-color-dark)',
  brandSurface: 'var(--brand-tint)',
  brandBorder: 'var(--brand-tint)',
  fg: 'var(--foreground)',
  fgMuted: 'var(--muted-foreground)',
  border: 'var(--border)',
};

export function PostExam() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Vishaka May 14: "after they submit, a green screen should come — the upload is successful"
  // Simulate the upload handshake before showing the final confirmation.
  const [uploadStage, setUploadStage] = useState<'uploading' | 'uploaded'>('uploading');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 20;
      });
    }, 240);
    const done = setTimeout(() => {
      // Clear saved responses from localStorage after successful "upload"
      try { localStorage.removeItem(`exam-response-${id ?? 'demo'}`); } catch { /* ignore */ }
      setUploadStage('uploaded');
    }, 1500);
    return () => { clearInterval(interval); clearTimeout(done); };
  }, [id]);

  // For demo: default to the results_pending exam
  const exam = MOCK_ASSESSMENTS.find(a => a.id === id) ?? MOCK_ASSESSMENTS.find(a => a.status === 'results_pending')!;
  const isHighStakes = exam?.isHighStakes ?? true;
  const isPending = isHighStakes;

  // Upload progress screen
  if (uploadStage === 'uploading') {
    return (
      <div style={{ background: 'var(--state-success-bg)', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--state-success-bg-soft)', border: '3px solid var(--state-success-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <i className="fa-light fa-cloud-arrow-up" aria-hidden="true" style={{ fontSize: 36, color: 'var(--state-success-dark)' }} />
          </div>
          <h1 className="font-heading" style={{ fontSize: 26, fontWeight: 700, color: 'var(--state-success-dark)', marginBottom: 8 }}>
            Uploading your responses…
          </h1>
          <p style={{ fontSize: 14, color: 'var(--state-success-dark)', marginBottom: 28 }}>
            Please do not close this window.
          </p>
          <div style={{ width: '100%', height: 8, borderRadius: 99, background: 'rgba(0,0,0,0.1)' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'var(--state-success-accent)',
              width: `${uploadProgress}%`,
              transition: 'width 0.25s ease',
            }} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--state-success-dark)', marginTop: 12 }}>
            {uploadProgress}% uploaded
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: t.bg, fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>

          {/* Upload successful + exam submitted */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--state-success-bg-soft)', border: '3px solid var(--state-success-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 36, color: 'var(--state-success-dark)' }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--state-success-dark)', background: 'var(--state-success-bg)', padding: '3px 10px', borderRadius: 99 }}>
              <i className="fa-light fa-cloud-check" aria-hidden="true" style={{ marginRight: 5 }} />
              Upload successful
            </span>
          </div>

          <h1 className="font-heading" style={{ fontSize: 28, fontWeight: 700, color: t.fg, marginBottom: 8, lineHeight: 1.2 }}>Exam Submitted</h1>
          <p style={{ fontSize: 16, color: t.fgMuted, marginBottom: 32 }}>
            Your responses for <strong style={{ color: t.fg }}>{exam?.title}</strong> have been recorded.
          </p>

          {/* Publication status card */}
          <div style={{
            background: isPending ? 'var(--state-warning-bg)' : 'var(--state-success-bg)',
            border: `1.5px solid ${isPending ? 'var(--state-warning-border)' : 'var(--state-success-accent)'}`,
            borderRadius: 14, padding: 24, marginBottom: 28, textAlign: 'left',
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: isPending ? 'var(--state-warning-bg-soft)' : 'var(--state-success-bg-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i
                  className={`fa-light ${isPending ? 'fa-hourglass-half' : 'fa-chart-bar'}`}
                  aria-hidden="true"
                  style={{ color: isPending ? 'var(--state-warning-dark)' : 'var(--state-success-dark)', fontSize: 20 }}
                />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: isPending ? 'var(--foreground)' : 'var(--state-success-dark)', marginBottom: 6 }}>
                  {isPending ? 'Results Pending Faculty Review' : 'Results Available Now'}
                </p>
                <p style={{ fontSize: 14, color: t.fg, lineHeight: 1.6, marginBottom: isPending ? 12 : 0 }}>
                  {isPending
                    ? 'This is a high-stakes exam. Your faculty will review submissions before releasing results — this typically takes 3–4 business days. You will receive a notification when results are published.'
                    : 'Your results are ready. You can view your score and performance breakdown now.'
                  }
                </p>
                {isPending && exam?.resultsHoldUntil && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'var(--state-warning-bg-soft)', border: '1px solid var(--state-warning-border)',
                    borderRadius: 8, padding: '6px 12px',
                    fontSize: 13, color: 'var(--foreground)', fontWeight: 600,
                  }}>
                    <i className="fa-light fa-calendar-check" aria-hidden="true" />
                    Estimated release: {exam.resultsHoldUntil.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comment note (if exam had comment boxes) */}
          {exam?.allowComments && (
            <div style={{
              background: t.brandSurface, border: `1px solid ${t.brandBorder}`,
              borderRadius: 10, padding: '12px 16px', marginBottom: 24,
              display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left',
            }}>
              <i className="fa-light fa-message-exclamation" aria-hidden="true" style={{ color: t.brand, fontSize: 16, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: t.fg, lineHeight: 1.5 }}>
                Question comments you submitted will be reviewed by your faculty. You won't receive a response in real-time — faculty may address flagged items during result publication or review session.
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!isPending && (
              <Button
                size="lg"
                onClick={() => navigate(`/exam/${id ?? exam?.id}/results`)}
                className="w-full"
              >
                <i className="fa-light fa-chart-bar" aria-hidden="true" />
                View My Results
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/')}
              className="w-full"
            >
              <i className="fa-light fa-house" aria-hidden="true" />
              Back to Dashboard
            </Button>
          </div>
        </div>
    </div>
  );
}
