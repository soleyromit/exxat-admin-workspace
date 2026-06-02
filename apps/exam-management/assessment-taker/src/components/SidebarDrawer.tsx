import React, { useEffect } from 'react';
import { Question } from '../data/questions';
import { ExamSection } from '../data/assessments';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';

export interface SidebarDrawerProps {
  onClose: () => void;
  questions: Question[];
  currentIndex: number;
  highestReachedIndex: number;
  answeredSet: Set<number>;
  flaggedSet: Set<number>;
  sections?: ExamSection[];
  onNavigate: (index: number) => void;
}

export function SidebarDrawer({
  onClose,
  questions,
  currentIndex,
  highestReachedIndex,
  answeredSet,
  flaggedSet,
  sections,
  onNavigate,
}: SidebarDrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const bookmarkedIndices = questions.map((_, i) => i).filter(i => flaggedSet.has(i));
  const bookmarkedIdxSet = new Set(bookmarkedIndices);
  const otherIndices = questions.map((_, i) => i).filter(i => !bookmarkedIdxSet.has(i));

  return (
    <div
      role="complementary"
      aria-label="Question navigator"
      className="animate-slide-in-left"
      style={{
        width: 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        backgroundColor: 'var(--card)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '12px 10px 12px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', flex: 1 }}>
          Questions
        </span>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500 }}>
          {answeredSet.size}<span style={{ opacity: 0.5 }}>/{questions.length}</span>
        </span>
        {flaggedSet.size > 0 && (
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
            · <i className="fa-solid fa-bookmark" aria-hidden="true" style={{ fontSize: 10 }} />{flaggedSet.size}
          </span>
        )}
        <DSButton
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close question navigator"
          style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}
        >
          <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 14 }} />
        </DSButton>
      </div>

      {/* Scrollable grid area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Bookmarked group */}
        {bookmarkedIndices.length > 0 && (
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600,
              color: 'var(--muted-foreground)',
              marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 4,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              <i className="fa-solid fa-bookmark" aria-hidden="true" style={{ fontSize: 9 }} />
              Bookmarked
            </div>
            <TileGrid>
              {bookmarkedIndices.map(i => (
                <Tile
                  key={i}
                  index={i}
                  status={getTileStatus(i, currentIndex, highestReachedIndex, flaggedSet, answeredSet, sections)}
                  onNavigate={onNavigate}
                />
              ))}
            </TileGrid>
          </div>
        )}

        {/* Divider */}
        {bookmarkedIndices.length > 0 && otherIndices.length > 0 && (
          <div style={{ height: 1, backgroundColor: 'var(--border)', marginBlock: -4 }} />
        )}

        {/* All others — answered + unanswered combined */}
        {otherIndices.length > 0 && (
          <TileGrid>
            {otherIndices.map(i => (
              <Tile
                key={i}
                index={i}
                status={getTileStatus(i, currentIndex, highestReachedIndex, flaggedSet, answeredSet, sections)}
                onNavigate={onNavigate}
              />
            ))}
          </TileGrid>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px',
        padding: '10px 14px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {([
          { swatch: 'filled', bg: 'var(--brand-color)', label: 'Current' },
          { swatch: 'filled', bg: 'var(--foreground)', label: 'Answered' },
          { swatch: 'border', borderColor: 'var(--state-flagged-text)', label: 'Bookmarked' },
          { swatch: 'border', borderColor: 'var(--border)', label: 'Unanswered' },
        ] as { swatch: 'filled' | 'border'; bg?: string; borderColor?: string; label: string }[]).map(({ swatch, bg, borderColor, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 2, flexShrink: 0,
              backgroundColor: swatch === 'filled' ? bg : 'transparent',
              border: swatch === 'border' ? `1.5px solid ${borderColor}` : undefined,
            }} />
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type TileStatus = 'current' | 'current-bookmarked' | 'bookmarked' | 'answered' | 'unanswered' | 'locked';

function getTileStatus(
  index: number,
  currentIndex: number,
  highestReachedIndex: number,
  flaggedSet: Set<number>,
  answeredSet: Set<number>,
  sections?: ExamSection[],
): TileStatus {
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

function tileStyle(status: TileStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 7,
    fontSize: 12, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    border: '1.5px solid transparent',
    transition: 'opacity 80ms',
    background: 'none',
    padding: 0,
  };
  switch (status) {
    case 'current':
      return { ...base, background: 'var(--brand-color)', color: 'var(--brand-foreground)', border: '1.5px solid transparent' };
    case 'current-bookmarked':
      return { ...base, background: 'var(--brand-color)', color: 'var(--brand-foreground)', border: '1.5px solid var(--state-flagged-text)' };
    case 'bookmarked':
      return { ...base, background: 'transparent', color: 'var(--state-flagged-text)', border: '1.5px solid var(--state-flagged-text)' };
    case 'answered':
      return { ...base, background: 'var(--foreground)', color: 'var(--background)', border: '1.5px solid transparent' };
    case 'locked':
      return { ...base, background: 'transparent', color: 'var(--muted-foreground)', border: '1.5px solid var(--border)', opacity: 0.35, cursor: 'not-allowed' };
    default: // unanswered
      return { ...base, background: 'transparent', color: 'var(--muted-foreground)', border: '1.5px solid var(--border)' };
  }
}

function TileGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 36px)', gap: 6 }}>
      {children}
    </div>
  );
}

function Tile({
  index,
  status,
  onNavigate,
}: {
  index: number;
  status: TileStatus;
  onNavigate: (i: number) => void;
}) {
  const isLocked = status === 'locked';
  return (
    <button
      onClick={() => { if (!isLocked) onNavigate(index); }}
      disabled={isLocked}
      aria-label={`Question ${index + 1}`}
      aria-current={status === 'current' || status === 'current-bookmarked' ? 'true' : undefined}
      style={tileStyle(status)}
    >
      {index + 1}
    </button>
  );
}
