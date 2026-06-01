// src/components/QuestionNavPanel.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Question } from '../data/questions';
import { ExamSection } from '../data/assessments';

export interface QuestionNavPanelProps {
  questions: Question[];
  currentIndex: number;
  answeredSet: Set<number>;
  flaggedSet: Set<number>;
  sections?: ExamSection[];
  highestReachedIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

type TileStatus = 'current' | 'flagged' | 'current-flagged' | 'answered' | 'unanswered' | 'locked';

interface TipState {
  visible: boolean;
  left: number;
  top: number;
  qnum: number;
  title: string;
  status: TileStatus;
  sectionLabel: string;
}

const TIP_WIDTH = 240;
const TIP_GAP = 10;

function getSectionIndex(sections: ExamSection[], index: number): number {
  let cum = 0;
  for (let i = 0; i < sections.length; i++) {
    cum += sections[i].questionCount;
    if (index < cum) return i;
  }
  return sections.length - 1;
}

function truncate(text: string, max = 120): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

export function QuestionNavPanel({
  questions,
  currentIndex,
  answeredSet,
  flaggedSet,
  sections,
  highestReachedIndex,
  onNavigate,
  onClose,
}: QuestionNavPanelProps) {
  const [focusedTileIndex, setFocusedTileIndex] = useState(currentIndex);
  const [tip, setTip] = useState<TipState>({
    visible: false, left: 0, top: 0,
    qnum: 0, title: '', status: 'unanswered', sectionLabel: '',
  });
  const tileRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const tipRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Locked detection ─────────────────────────────────────────────────────────
  const isLocked = useCallback((index: number): boolean => {
    if (!sections?.length) return false;
    return getSectionIndex(sections, index) > getSectionIndex(sections, highestReachedIndex);
  }, [sections, highestReachedIndex]);

  // ── Tile status ───────────────────────────────────────────────────────────────
  const getTileStatus = useCallback((index: number): TileStatus => {
    if (isLocked(index)) return 'locked';
    if (index === currentIndex && flaggedSet.has(index)) return 'current-flagged';
    if (index === currentIndex) return 'current';
    if (flaggedSet.has(index)) return 'flagged';
    if (answeredSet.has(index)) return 'answered';
    return 'unanswered';
  }, [isLocked, currentIndex, flaggedSet, answeredSet]);

  // ── Groups — flat across all sections (single pass) ─────────────────────────
  const { flaggedGroup, unansweredGroup, answeredGroup } = useMemo(() => {
    const flagged: number[] = [], unanswered: number[] = [], answered: number[] = [];
    questions.forEach((_, i) => {
      if (isLocked(i))          { unanswered.push(i); return; }
      if (flaggedSet.has(i))    { flagged.push(i);    return; }
      if (answeredSet.has(i))   { answered.push(i);   return; }
      unanswered.push(i);
    });
    return { flaggedGroup: flagged, unansweredGroup: unanswered, answeredGroup: answered };
  }, [questions, flaggedSet, answeredSet, isLocked]);

  // ── Keyboard: Escape closes ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Sync roving focus when current question changes externally
  useEffect(() => { setFocusedTileIndex(currentIndex); }, [currentIndex]);

  // ── Tooltip helpers ───────────────────────────────────────────────────────────
  const showTip = useCallback((tile: HTMLButtonElement, index: number) => {
    clearTimeout(hideTimer.current);
    const status = getTileStatus(index);
    const sectionLabel =
      sections?.length
        ? `Section ${getSectionIndex(sections, index) + 1}`
        : '';
    // Two-pass: render offscreen to measure height, then position to the left of the tile
    setTip({ visible: true, left: -9999, top: -9999, qnum: index + 1, title: truncate(questions[index].text), status, sectionLabel });
    requestAnimationFrame(() => {
      const rect = tile.getBoundingClientRect();
      const tipH = tipRef.current?.offsetHeight ?? 80;
      // Always to the left of the tile — panel is on the right edge, so this points into content area
      const left = Math.min(rect.right + TIP_GAP, window.innerWidth - TIP_WIDTH - 8);
      // Vertically centered with the tile, clamped to viewport
      const top = Math.max(8, Math.min(rect.top + rect.height / 2 - tipH / 2, window.innerHeight - tipH - 8));
      setTip(prev => ({ ...prev, left, top }));
    });
  }, [getTileStatus, sections, questions]);

  const hideTip = useCallback(() => {
    hideTimer.current = setTimeout(() => setTip(prev => ({ ...prev, visible: false })), 80);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // ── Tile style ────────────────────────────────────────────────────────────────
  function tileStyle(status: TileStatus): React.CSSProperties {
    const base: React.CSSProperties = {
      width: 28, height: 28, borderRadius: 6,
      fontSize: 12, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
      transition: 'transform 0.1s',
      userSelect: 'none',
    };
    switch (status) {
      case 'current':
        return { ...base, background: 'var(--brand-color)', color: '#fff', boxShadow: '0 0 0 3px var(--brand-tint)', border: '2px solid transparent' };
      case 'current-flagged':
        // Flagged amber fill + brand ring — signals both "viewing now" and "marked for review"
        return { ...base, background: 'var(--state-flagged-bg)', color: 'var(--state-flagged-text)', boxShadow: '0 0 0 3px var(--brand-tint)', border: '2px solid var(--brand-color)' };
      case 'flagged':
        return { ...base, background: 'var(--state-flagged-bg)', color: 'var(--state-flagged-text)', border: '2px solid transparent' };
      case 'answered':
        return { ...base, background: 'transparent', border: '2px solid var(--border)', color: 'var(--muted-foreground)' };
      case 'locked':
        return {
          ...base,
          background: 'repeating-linear-gradient(45deg, var(--muted) 0px 3px, var(--border) 3px 5px)',
          border: '2px solid var(--border)',
          color: 'var(--muted-foreground)',
          cursor: 'not-allowed',
          opacity: 0.4,
        };
      default: // unanswered
        return { ...base, background: 'var(--muted)', color: 'var(--muted-foreground)', border: '2px solid transparent' };
    }
  }

  // ── Arrow-key nav within a group ──────────────────────────────────────────────
  function handleGroupKeyDown(e: React.KeyboardEvent, group: number[], index: number) {
    const pos = group.indexOf(index);
    if (pos === -1) return;
    let next: number | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = group[pos + 1];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = group[pos - 1];
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isLocked(index)) onNavigate(index);
      return;
    } else {
      return;
    }
    if (next !== undefined) {
      e.preventDefault();
      setFocusedTileIndex(next);
      tileRefs.current.get(next)?.focus();
    }
  }

  // ── Tooltip badge label ───────────────────────────────────────────────────────
  function badgeLabel(status: TileStatus, sectionLabel: string): string {
    switch (status) {
      case 'flagged':          return '⚑ Flagged for review';
      case 'current-flagged':  return '● Viewing now · ⚑ Flagged';
      case 'answered':         return '✓ Answered';
      case 'current':          return '● Viewing now';
      case 'locked':           return `🔒 Locked · ${sectionLabel}`;
      default:                 return '○ Not answered';
    }
  }

  function badgeStyle(status: TileStatus): React.CSSProperties {
    const base: React.CSSProperties = {
      fontSize: 12, fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: 3,
      borderRadius: 4, padding: '2px 6px', marginTop: 4,
    };
    switch (status) {
      case 'flagged':         return { ...base, background: 'var(--state-flagged-bg)', color: 'var(--state-flagged-text)' };
      case 'current-flagged': return { ...base, background: 'var(--state-flagged-bg)', color: 'var(--state-flagged-text)' };
      case 'answered':        return { ...base, background: 'var(--muted)', color: 'var(--foreground)' };
      case 'current':         return { ...base, background: 'var(--brand-color)', color: '#fff' };
      case 'locked':          return { ...base, background: 'var(--muted)', color: 'var(--muted-foreground)' };
      default:                return { ...base, background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' };
    }
  }

  // ── Render tile ───────────────────────────────────────────────────────────────
  function renderTile(index: number, group: number[]) {
    const status = getTileStatus(index);
    const isFocused = focusedTileIndex === index;
    const label = `Question ${index + 1}, ${
      status === 'current-flagged' ? 'current question, flagged for review' :
      status === 'current' ? 'current question' : status
    }`;
    return (
      <button
        key={index}
        ref={el => { if (el) tileRefs.current.set(index, el); else tileRefs.current.delete(index); }}
        tabIndex={isFocused ? 0 : -1}
        aria-label={label}
        aria-disabled={status === 'locked' ? true : undefined}
        disabled={status === 'locked'}
        className="exam-focus"
        style={tileStyle(status)}
        onClick={() => { if (!isLocked(index)) onNavigate(index); }}
        onFocus={() => setFocusedTileIndex(index)}
        onMouseEnter={e => showTip(e.currentTarget, index)}
        onMouseLeave={hideTip}
        onBlur={hideTip}
        onKeyDown={e => handleGroupKeyDown(e, group, index)}
      >
        {index + 1}
      </button>
    );
  }

  // ── Render group ──────────────────────────────────────────────────────────────
  function renderGroup(
    title: string,
    icon: string | null,
    group: number[],
  ) {
    if (group.length === 0) return null;
    const groupId = `nav-group-${title.replace(/\s+/g, '-').toLowerCase()}`;
    return (
      <div role="group" aria-labelledby={groupId} style={{ marginBottom: 14 }}>
        <div
          id={groupId}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 12px 6px',
          }}
        >
          {icon && <span aria-hidden="true" style={{ fontSize: 11 }}>{icon}</span>}
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)' }}>{title}</span>
          <span style={{
            marginLeft: 'auto', fontSize: 11, fontWeight: 600,
            color: 'var(--muted-foreground)',
            background: 'var(--muted)', borderRadius: 10, padding: '1px 6px',
          }}>{group.length}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 12px' }}>
          {group.map(i => renderTile(i, group))}
        </div>
      </div>
    );
  }

  // ── Portal tooltip ────────────────────────────────────────────────────────────
  const tooltip = tip.visible ? ReactDOM.createPortal(
    <div
      ref={tipRef}
      style={{
        position: 'fixed',
        left: tip.left,
        top: tip.top,
        width: TIP_WIDTH,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        background: 'var(--foreground)',
        color: 'var(--background)',
        borderRadius: 8, padding: '9px 11px',
        fontSize: 12, lineHeight: 1.45,
        boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--background)', opacity: 0.65, marginBottom: 4 }}>
          {tip.status === 'current'
            ? `Question ${tip.qnum} — Current`
            : tip.sectionLabel && tip.status === 'locked'
            ? `Question ${tip.qnum} · ${tip.sectionLabel}`
            : `Question ${tip.qnum}`}
        </div>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{tip.title}</div>
        <div style={badgeStyle(tip.status)}>{badgeLabel(tip.status, tip.sectionLabel)}</div>
      </div>
      <div style={{
        position: 'absolute',
        left: -6, top: '50%', transform: 'translateY(-50%)',
        width: 6, height: 10,
        background: 'var(--foreground)',
        clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
      }} />
    </div>,
    document.body
  ) : null;

  // ── Panel ─────────────────────────────────────────────────────────────────────
  return (
    <>
      {tooltip}
      <nav
        aria-label="Question navigator"
        style={{
          width: 192, flexShrink: 0,
          background: 'var(--card)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          height: 44, background: 'var(--muted)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 12px', gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)', flex: 1 }}>
            Questions
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500 }}>
            {currentIndex + 1} / {questions.length}
          </span>
          <button
            onClick={onClose}
            aria-label="Close question navigator"
            className="exam-focus"
            style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'transparent', border: 'none',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: 'var(--muted-foreground)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0 12px' }}>
          {renderGroup('Flagged', '⚑', flaggedGroup)}
          {renderGroup('Unanswered', null, unansweredGroup)}
          {renderGroup('Answered', null, answeredGroup)}
        </div>
      </nav>
    </>
  );
}
