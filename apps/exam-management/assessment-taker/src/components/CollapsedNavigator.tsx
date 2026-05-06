
import { tokens } from '../tokens/design-tokens';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';
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
        <span className="font-bold text-base" style={{
        color: tokens.text.primary
      }}>
          Q{currentIndex + 1} of {totalQuestions}
        </span>

        <div className="w-px h-4" style={{
        backgroundColor: tokens.border.medium
      }} />

        <span className="text-sm" style={{
        color: tokens.text.secondary
      }}>
          Answered: <span className="font-bold">{answeredCount}</span>
        </span>

        <div className="w-px h-4" style={{
        backgroundColor: tokens.border.medium
      }} />

        <span className="text-sm" style={{
        color: tokens.text.secondary
      }}>
          Flagged: <span className="font-bold">{flaggedCount}</span>
        </span>
      </div>

      <DSButton
        variant="outline"
        size="sm"
        onClick={onExpand}
        aria-label="Expand Question Navigator"
        className="shrink-0 ml-4"
      >
        <i className="fa-light fa-bars" aria-hidden="true" style={{ fontSize: 14 }} />
        <span className="font-semibold hidden sm:inline">Navigator</span>
        <i className="fa-light fa-chevron-up" aria-hidden="true" style={{ fontSize: 14 }} />
      </DSButton>
    </div>;
}