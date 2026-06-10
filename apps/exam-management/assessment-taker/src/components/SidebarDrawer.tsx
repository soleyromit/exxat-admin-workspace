import React, { useEffect } from 'react';
import { Question } from '../data/questions';
import { ExamSection } from '../data/assessments';
import { Button as DSButton } from '@exxatdesignux/ui';

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
      className="animate-slide-in-right w-60 shrink-0 flex flex-col rounded-2xl border border-border shadow-sm bg-card overflow-hidden"
      style={{  }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 ps-3.5 pe-2.5 py-3 border-b border-border shrink-0">
        <span className="text-sm font-bold text-foreground flex-1">Questions</span>
        <span className="text-[12px] text-muted-foreground font-medium tabular-nums">
          {answeredSet.size}/{questions.length}
        </span>
        {flaggedSet.size > 0 && (
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            · <i className="fa-solid fa-bookmark text-[9px]" aria-hidden="true" />{flaggedSet.size}
          </span>
        )}
        <DSButton
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close question navigator"
          className="text-muted-foreground shrink-0"
        >
          <i className="fa-light fa-xmark text-sm" aria-hidden="true" />
        </DSButton>
      </div>

      {/* Scrollable grid area */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3.5">

        {/* Bookmarked group */}
        {bookmarkedIndices.length > 0 && (
          <div>
            <div className="text-[12px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <i className="fa-solid fa-bookmark text-[9px]" aria-hidden="true" />
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
          <div className="h-px bg-border -my-1" />
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
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 px-3.5 py-2.5 border-t border-border shrink-0">
        {([
          { swatch: 'filled', bg: 'var(--brand-color)', label: 'Current' },
          { swatch: 'filled', bg: 'var(--foreground)', label: 'Answered' },
          { swatch: 'border', borderColor: 'var(--state-flagged-text)', label: 'Bookmarked' },
          { swatch: 'border', borderColor: 'var(--muted-foreground)', label: 'Unanswered' },
        ] as { swatch: 'filled' | 'border'; bg?: string; borderColor?: string; label: string }[]).map(({ swatch, bg, borderColor, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="size-2.5 rounded-sm shrink-0"
              style={{
                backgroundColor: swatch === 'filled' ? bg : 'transparent',
                border: swatch === 'border' ? `1.5px solid ${borderColor}` : undefined,
              }}
            />
            <span className="text-[12px] text-muted-foreground">{label}</span>
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

function TileGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, 36px)' }}>
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

  const tileColors: React.CSSProperties = (() => {
    switch (status) {
      case 'current':
        return { backgroundColor: 'var(--brand-color)', color: 'var(--brand-foreground)', borderColor: 'transparent' };
      case 'current-bookmarked':
        return { backgroundColor: 'var(--brand-color)', color: 'var(--brand-foreground)', borderColor: 'var(--state-flagged-text)' };
      case 'bookmarked':
        return { color: 'var(--state-flagged-text)', borderColor: 'var(--state-flagged-text)' };
      case 'answered':
        return { backgroundColor: 'var(--foreground)', color: 'var(--background)', borderColor: 'transparent' };
      case 'locked':
        return { color: 'var(--muted-foreground)', borderColor: 'var(--border)', opacity: 0.35 };
      default:
        return { color: 'var(--foreground)', borderColor: 'var(--border)' };
    }
  })();

  return (
    <DSButton
      variant="ghost"
      onClick={() => { if (!isLocked) onNavigate(index); }}
      disabled={isLocked}
      aria-label={`Question ${index + 1}`}
      aria-current={status === 'current' || status === 'current-bookmarked' ? 'true' : undefined}
      className="size-9 rounded-[7px] text-[12px] font-semibold p-0 border [border-width:1.5px] hover:opacity-80 transition-opacity"
      style={tileColors}
    >
      {index + 1}
    </DSButton>
  );
}
