import { Tooltip } from './Tooltip';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';

interface StickyFooterProps {
  currentIndex: number;
  totalQuestions: number;
  onNavigate: (index: number) => void;
  flaggedSet: Set<number>;
  showNavPanel: boolean;
  onToggleNavPanel: () => void;
}

export function StickyFooter({
  currentIndex,
  totalQuestions,
  onNavigate,
  flaggedSet,
  showNavPanel,
  onToggleNavPanel,
}: StickyFooterProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t z-30 px-4 flex items-center justify-between transition-colors"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.07)',
        height: 64,
      }}
    >
      {/* Previous */}
      <DSButton
        variant="outline"
        size="lg"
        onClick={() => currentIndex > 0 && onNavigate(currentIndex - 1)}
        disabled={currentIndex === 0}
        aria-label="Previous question"
      >
        <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 16 }} />
        <span className="hidden sm:inline">Previous</span>
      </DSButton>

      {/* Center: Q pill — toggles right panel */}
      <Tooltip content="View all questions" position="top" disabled={showNavPanel}>
        <DSButton
          variant="outline"
          size="sm"
          onClick={onToggleNavPanel}
          aria-label="Toggle question navigator"
          aria-expanded={showNavPanel}
          aria-controls="question-nav-panel"
          className="rounded-full gap-2 font-semibold"
          style={showNavPanel ? {
            backgroundColor: 'var(--brand-color)',
            borderColor: 'var(--brand-color)',
            color: '#fff',
          } : undefined}
        >
          <span>Q {currentIndex + 1}</span>
          <span style={{ color: showNavPanel ? 'rgba(255,255,255,0.7)' : 'var(--muted-foreground)', fontWeight: 400 }}>
            of {totalQuestions}
          </span>
          {flaggedSet.size > 0 && (
            <span
              className="flex items-center gap-1"
              style={{ color: showNavPanel ? 'rgba(255,255,255,0.85)' : 'var(--state-flagged-text)', fontSize: 12 }}
            >
              · <i className="fa-solid fa-flag" aria-hidden="true" style={{ fontSize: 10 }} />
              {flaggedSet.size}
            </span>
          )}
        </DSButton>
      </Tooltip>

      {/* Right: Next */}
      <DSButton
        variant="default"
        size="lg"
        onClick={() => currentIndex < totalQuestions - 1 && onNavigate(currentIndex + 1)}
        disabled={currentIndex === totalQuestions - 1}
        aria-label="Next question"
      >
        <span className="hidden sm:inline">Next</span>
        <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 16 }} />
      </DSButton>
    </div>
  );
}
