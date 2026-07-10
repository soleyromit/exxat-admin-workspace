import React, { useEffect, useRef } from 'react';
import { Button, Separator } from '@exxatdesignux/ui';
import { Question } from '../data/questions';
import { ExamSection } from '../data/assessments';

export interface QuestionNavigatorPopoverProps {
  questions: Question[];
  currentIndex: number;
  highestReachedIndex: number;
  answeredSet: Set<number>;
  flaggedSet: Set<number>;
  sections?: ExamSection[];
  onNavigate: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function QuestionNavigatorPopover({
  questions,
  currentIndex,
  highestReachedIndex,
  answeredSet,
  flaggedSet,
  sections,
  onNavigate,
  isOpen,
  onClose,
}: QuestionNavigatorPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function getTileStatus(index: number): 'current' | 'bookmarked' | 'current-bookmarked' | 'answered' | 'unanswered' | 'locked' {
    // Locked = belongs to a section beyond current progress
    if (sections?.length) {
      let cum = 0;
      let questionSection = 0;
      let highestSection = 0;
      for (let i = 0; i < sections.length; i++) {
        if (index < cum + sections[i].questionCount) questionSection = i;
        if (highestReachedIndex < cum + sections[i].questionCount) { highestSection = i; break; }
        cum += sections[i].questionCount;
      }
      if (questionSection > highestSection) return 'locked';
    }
    const isCurrent = index === currentIndex;
    const isBookmarked = flaggedSet.has(index);
    if (isCurrent && isBookmarked) return 'current-bookmarked';
    if (isCurrent) return 'current';
    if (isBookmarked) return 'bookmarked';
    if (answeredSet.has(index)) return 'answered';
    return 'unanswered';
  }

  function tileStyle(status: ReturnType<typeof getTileStatus>): React.CSSProperties {
    const base: React.CSSProperties = {
      width: 34, height: 34, borderRadius: 6,
      fontSize: 12, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
      border: '2px solid transparent',
      transition: 'opacity 80ms',
      position: 'relative',
    };
    switch (status) {
      case 'current':
        return { ...base, background: 'var(--brand-color)', color: 'var(--brand-foreground)', boxShadow: '0 0 0 3px var(--brand-tint)' };
      case 'current-bookmarked':
        return { ...base, background: 'var(--state-flagged-bg)', color: 'var(--state-flagged-text)', border: '2px solid var(--brand-color)', boxShadow: '0 0 0 3px var(--brand-tint)' };
      case 'bookmarked':
        return { ...base, background: 'var(--state-flagged-bg)', color: 'var(--state-flagged-text)' };
      case 'answered':
        return { ...base, background: 'var(--state-answered-bg)', color: 'var(--state-answered-text)' };
      case 'locked':
        return { ...base, background: 'var(--muted)', color: 'var(--muted-foreground)', opacity: 0.35, cursor: 'not-allowed' };
      default: // unanswered
        return { ...base, background: 'var(--muted)', color: 'var(--muted-foreground)', border: '2px solid var(--border)' };
    }
  }

  // Build ordered list: bookmarked first, then all others in numeric order
  const bookmarkedIndices = questions.map((_, i) => i).filter(i => flaggedSet.has(i) && i !== currentIndex && getTileStatus(i) !== 'locked');
  // Include current if bookmarked in the bookmarked group
  if (flaggedSet.has(currentIndex)) bookmarkedIndices.unshift(currentIndex);
  const bookmarkedSet = new Set(bookmarkedIndices);
  const otherIndices = questions.map((_, i) => i).filter(i => !bookmarkedSet.has(i));

  const bookmarkedCount = flaggedSet.size;
  const answeredCount = answeredSet.size;
  const unansweredCount = questions.length - answeredCount;

  return (
    <>
      {/* Backdrop — semi-transparent to indicate modal context */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 49,
          backgroundColor: 'rgba(0,0,0,0.25)',
        }}
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Popover — centered, above footer */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Question navigator"
        style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(520px, calc(100vw - 32px))',
          maxHeight: '65vh',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', flex: 1 }}>
            Questions
          </span>
          {/* Inline stats */}
          <span style={{ fontSize: 12, color: 'var(--state-answered-text)', fontWeight: 600 }}>
            {answeredCount} answered
          </span>
          {bookmarkedCount > 0 && (
            <span style={{ fontSize: 12, color: 'var(--state-flagged-text)', fontWeight: 600 }}>
              · {bookmarkedCount} bookmarked
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            · {unansweredCount} left
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close question navigator"
            className="ml-1 text-muted-foreground shrink-0"
          >
            <i className="fa-regular fa-xmark" aria-hidden="true" />
          </Button>
        </div>

        {/* Grid body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
          {/* Bookmarked group — only shown if any exist */}
          {bookmarkedIndices.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: 'var(--state-flagged-text)',
                marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <i className="fa-regular fa-bookmark" aria-hidden="true" style={{ fontSize: 11 }} />
                Bookmarked
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {bookmarkedIndices.map(i => {
                  const status = getTileStatus(i);
                  return (
                    <button
                      key={i}
                      onClick={() => { onNavigate(i); onClose(); }}
                      aria-label={`Question ${i + 1}, bookmarked`}
                      aria-current={i === currentIndex ? 'true' : undefined}
                      style={tileStyle(status)}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All other questions — unified grid, numeric order */}
          {bookmarkedIndices.length > 0 && otherIndices.length > 0 && (
            <Separator className="mb-3" />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 34px)', gap: 4 }}>
            {otherIndices.map(i => {
              const status = getTileStatus(i);
              const isLocked = status === 'locked';
              return (
                <button
                  key={i}
                  onClick={() => { if (!isLocked) { onNavigate(i); onClose(); } }}
                  disabled={isLocked}
                  aria-label={`Question ${i + 1}${answeredSet.has(i) ? ', answered' : ', not answered'}${i === currentIndex ? ', current' : ''}`}
                  aria-current={i === currentIndex ? 'true' : undefined}
                  style={tileStyle(status)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer legend */}
        <div style={{
          display: 'flex', gap: 16, padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0, flexWrap: 'wrap',
        }}>
          {[
            { bg: 'var(--brand-color)', label: 'Current' },
            { bg: 'var(--state-answered-bg)', border: 'var(--state-answered-border)', label: 'Answered' },
            { bg: 'var(--state-flagged-bg)', label: 'Bookmarked' },
            { bg: 'var(--muted)', border: 'var(--border)', label: 'Unanswered' },
          ].map(({ bg, border, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 12, height: 12, borderRadius: 3,
                backgroundColor: bg,
                border: border ? `1.5px solid ${border}` : undefined,
              }} />
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
