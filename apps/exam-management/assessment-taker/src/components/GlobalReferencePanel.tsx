/**
 * GlobalReferencePanel — formula/reference sheet accessible throughout the exam.
 *
 * Vishaka May 14: "Some formulas the instructor wants to upload which can be for
 * multiple questions... always available. Just like the calculator — open the resource
 * document. It is behind a click."
 *
 * Per-question reference material still shows in the split panel. This panel is for
 * exam-wide material (formula sheets, reference tables) accessible at any question.
 */

import { Button } from '@exxat/ds/packages/ui/src';

interface GlobalReferencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  materials: string[];
}

export function GlobalReferencePanel({ isOpen, onClose, materials }: GlobalReferencePanelProps) {
  if (!isOpen || materials.length === 0) return null;

  return (
    <div
      role="complementary"
      aria-label="Exam reference materials"
      style={{
        position: 'fixed',
        top: 72,
        right: 16,
        width: 320,
        zIndex: 45,
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-light fa-file-lines" aria-hidden="true" style={{ color: 'var(--brand-color)', fontSize: 14 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>
            Reference Materials
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close reference panel">
          <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 14 }} />
        </Button>
      </div>

      {/* Materials list */}
      <div style={{ padding: '8px 0' }}>
        {materials.map((material, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: i < materials.length - 1 ? '1px solid var(--border)' : undefined,
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: 'var(--brand-tint)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fa-light fa-file-pdf" aria-hidden="true" style={{ color: 'var(--brand-color)', fontSize: 16 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 2 }}>
                {material}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                Available for all questions in this exam
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Open ${material}`}
              style={{ color: 'var(--brand-color)', flexShrink: 0 }}
            >
              <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 13 }} />
            </Button>
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 16px 12px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="fa-light fa-circle-info" aria-hidden="true" />
          These materials are available throughout the exam.
        </p>
      </div>
    </div>
  );
}
