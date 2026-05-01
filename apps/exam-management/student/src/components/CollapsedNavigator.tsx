import React from 'react';
import { MenuIcon, ChevronUpIcon } from 'lucide-react';
import { tokens } from '../tokens/design-tokens';
export interface CollapsedNavigatorProps {
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
  onExpand: () => void;
}
export function CollapsedNavigator({
  currentIndex,
  totalQuestions,
  answeredCount,
  flaggedCount,
  onExpand
}: CollapsedNavigatorProps) {
  return <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]" style={{
    backgroundColor: tokens.surface.white,
    borderTop: `1px solid ${tokens.border.default}`
  }}>
      <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <span className="font-heading font-bold" style={{
        fontSize: '16px',
        color: tokens.text.primary
      }}>
          Q{currentIndex + 1} of {totalQuestions}
        </span>

        <div className="w-px h-4" style={{
        backgroundColor: tokens.border.medium
      }} />

        <span className="font-heading" style={{
        fontSize: '14px',
        color: tokens.text.secondary
      }}>
          Answered: <span className="font-bold">{answeredCount}</span>
        </span>

        <div className="w-px h-4" style={{
        backgroundColor: tokens.border.medium
      }} />

        <span className="font-heading" style={{
        fontSize: '14px',
        color: tokens.text.secondary
      }}>
          Flagged: <span className="font-bold">{flaggedCount}</span>
        </span>
      </div>

      <button onClick={onExpand} className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shrink-0 ml-4" style={{
      border: `1px solid ${tokens.border.medium}`,
      color: tokens.text.primary,
      outlineColor: tokens.brand.primary
    }} aria-label="Expand Question Navigator">
        <MenuIcon style={{
        width: '16px',
        height: '16px'
      }} />
        <span className="font-heading font-semibold hidden sm:inline" style={{
        fontSize: '14px'
      }}>
          Navigator
        </span>
        <ChevronUpIcon style={{
        width: '16px',
        height: '16px'
      }} />
      </button>
    </div>;
}