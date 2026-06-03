import { useEffect } from 'react';
import { Button } from '@exxatdesignux/ui';

interface KeyboardShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['→', 'Enter'], description: 'Next question' },
  { keys: ['←'], description: 'Previous question' },
  { keys: ['Z'], description: 'Bookmark / unbookmark question' },
  { keys: ['A – H'], description: 'Select answer option A through H' },
  { keys: ['Esc'], description: 'Close panels and overlays' },
];

export function KeyboardShortcutModal({ isOpen, onClose }: KeyboardShortcutModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        width: 'min(420px, calc(100vw - 32px))',
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="fa-regular fa-keyboard" aria-hidden="true" style={{ fontSize: 16, color: 'var(--muted-foreground)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', flex: 1 }}>
            Keyboard shortcuts
          </span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close keyboard shortcuts">
            <i className="fa-regular fa-xmark" aria-hidden="true" style={{ fontSize: 16 }} />
          </Button>
        </div>

        {/* Shortcut list */}
        <div style={{ padding: '8px 0' }}>
          {SHORTCUTS.map(({ keys, description }) => (
            <div
              key={description}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{description}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {keys.map(k => (
                  <kbd
                    key={k}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 28, height: 24, padding: '0 6px',
                      borderRadius: 5,
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--muted)',
                      color: 'var(--foreground)',
                      fontSize: 12, fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
