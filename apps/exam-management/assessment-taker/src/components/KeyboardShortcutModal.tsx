'use client';
import { useEffect } from 'react';
import { Button } from '@exxatdesignux/ui';

interface KeyboardShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  description: string;
  win: string[];
  mac: string[];
}

const SHORTCUT_GROUPS: { label: string; items: Shortcut[] }[] = [
  {
    label: 'Navigation',
    items: [
      { description: 'Next question',         win: ['→', '↵'],        mac: ['→', '↵'] },
      { description: 'Previous question',     win: ['←'],             mac: ['←'] },
      { description: 'Forward navigation',    win: ['Alt', 'N'],      mac: ['⌥', 'N'] },
      { description: 'Backward navigation',   win: ['Alt', 'P'],      mac: ['⌥', 'P'] },
    ],
  },
  {
    label: 'Actions',
    items: [
      { description: 'Flag for review',       win: ['Alt', 'F'],      mac: ['⌥', 'F'] },
      { description: 'Scratch an option',     win: ['Alt', 'W'],      mac: ['⌥', 'W'] },
      { description: 'Bookmark question',     win: ['Z'],             mac: ['Z'] },
      { description: 'Select option A–H',     win: ['A–H'],           mac: ['A–H'] },
    ],
  },
  {
    label: 'Tools',
    items: [
      { description: 'Calculator',            win: ['Alt', 'C'],      mac: ['⌥', 'C'] },
      { description: 'Adjust font size',      win: ['Ctrl', '+/−'],   mac: ['⌘', '+/−'] },
      { description: 'View shortcuts',        win: ['Ctrl', '/'],     mac: ['⌘', '/'] },
      { description: 'Close panels',          win: ['Esc'],           mac: ['Esc'] },
    ],
  },
];

function KeyGroup({ keys }: { keys: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
      {keys.map((k, i) => (
        <span key={i} style={{ display: 'contents' }}>
          <kbd style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 28, height: 24, padding: '0 7px',
            borderRadius: 5,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--muted)',
            color: 'var(--foreground)',
            fontSize: 12, fontWeight: 600,
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {k}
          </kbd>
          {i < keys.length - 1 && (
            <span style={{ fontSize: 10, color: 'var(--muted-foreground)', lineHeight: 1, flexShrink: 0 }}>+</span>
          )}
        </span>
      ))}
    </div>
  );
}

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
        width: 'min(520px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 48px)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <i className="fa-regular fa-keyboard" aria-hidden="true" style={{ fontSize: 16, color: 'var(--muted-foreground)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', flex: 1 }}>
            Keyboard shortcuts
          </span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close keyboard shortcuts">
            <i className="fa-regular fa-xmark" aria-hidden="true" style={{ fontSize: 16 }} />
          </Button>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 120px 100px',
          padding: '8px 20px 6px',
          gap: 0,
          flexShrink: 0,
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Action</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right', paddingRight: 12 }}>Windows</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Mac</span>
        </div>

        {/* Shortcut groups */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {SHORTCUT_GROUPS.map(({ label, items }) => (
            <div key={label}>
              <div style={{
                padding: '8px 20px 4px',
                fontSize: 11, fontWeight: 700,
                color: 'var(--muted-foreground)',
                backgroundColor: 'var(--muted)',
                letterSpacing: '0.03em',
              }}>
                {label}
              </div>
              {items.map(({ description, win, mac }) => (
                <div
                  key={description}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 100px',
                    alignItems: 'center',
                    padding: '9px 20px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{description}</span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 12, borderRight: '1px solid var(--border)' }}>
                    <KeyGroup keys={win} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <KeyGroup keys={mac} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
