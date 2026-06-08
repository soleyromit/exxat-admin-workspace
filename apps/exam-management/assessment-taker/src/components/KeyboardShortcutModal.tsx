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
      { description: 'Next question',           win: ['→'],           mac: ['→'] },
      { description: 'Previous question',       win: ['←'],           mac: ['←'] },
    ],
  },
  {
    label: 'Actions',
    items: [
      { description: 'Flag for review',         win: ['Alt', 'F'],    mac: ['⌥', 'F'] },
      { description: 'Scratch an option',       win: ['Alt', 'W'],    mac: ['⌥', 'W'] },
      { description: 'Bookmark question',       win: ['Z'],           mac: ['Z'] },
      { description: 'Select option A–H',       win: ['A–H'],         mac: ['A–H'] },
    ],
  },
  {
    label: 'Tools',
    items: [
      { description: 'Calculator',              win: ['Alt', 'C'],    mac: ['⌥', 'C'] },
      { description: 'Adjust font size',        win: ['Ctrl', '+/−'], mac: ['⌘', '+/−'] },
      { description: 'View keyboard shortcuts', win: ['Ctrl', '/'],   mac: ['⌘', '/'] },
      { description: 'Close panels',            win: ['Esc'],         mac: ['Esc'] },
    ],
  },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

const ARROW_ICONS: Record<string, string> = {
  '→': 'fa-arrow-right',
  '←': 'fa-arrow-left',
  '↑': 'fa-arrow-up',
  '↓': 'fa-arrow-down',
};

function KeyGroup({ keys }: { keys: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
      {keys.map((k, i) => (
        <span key={i} style={{ display: 'contents' }}>
          <kbd style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 26, height: 22, padding: '0 6px',
            borderRadius: 5,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            boxShadow: '0 1px 0 0 var(--border)',
            color: 'var(--foreground)',
            fontSize: 11, fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {ARROW_ICONS[k]
              ? <i className={`fa-solid ${ARROW_ICONS[k]}`} aria-hidden="true" style={{ fontSize: 10 }} />
              : k}
          </kbd>
          {i < keys.length - 1 && (
            <span style={{ fontSize: 10, color: 'var(--muted-foreground)', lineHeight: 1 }}>+</span>
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
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        width: 'min(480px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 48px)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.16)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <i className="fa-regular fa-keyboard" aria-hidden="true" style={{ fontSize: 15, color: 'var(--muted-foreground)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', flex: 1 }}>
            Keyboard shortcuts
          </span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close keyboard shortcuts">
            <i className="fa-regular fa-xmark" aria-hidden="true" style={{ fontSize: 15 }} />
          </Button>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 110px',
          padding: '8px 20px 6px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Shortcut</span>
        </div>

        {/* Groups */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {SHORTCUT_GROUPS.map(({ label, items }, gi) => (
            <div key={label}>
              {/* Section label */}
              <div style={{
                padding: `${gi === 0 ? 12 : 16}px 20px 4px`,
                fontSize: 12, fontWeight: 600,
                color: 'var(--foreground)',
              }}>
                {label}
              </div>

              {/* Rows */}
              {items.map(({ description, win, mac }) => (
                <div
                  key={description}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 110px',
                    alignItems: 'center',
                    padding: '8px 20px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{description}</span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <KeyGroup keys={isMac ? mac : win} />
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
