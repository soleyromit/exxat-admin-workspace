import { Button as DSButton } from '@exxatdesignux/ui';

interface StickyFooterProps {
  currentIndex: number;
  totalQuestions: number;
  onNavigate: (index: number) => void;
  /** When false (forward-only exams), the Previous control is hidden. */
  allowBack?: boolean;
}

export function StickyFooter({
  currentIndex,
  totalQuestions,
  onNavigate,
  allowBack = true,
}: StickyFooterProps) {
  return (
    <nav
      aria-label="Question navigation"
      className="flex-shrink-0 w-full border-t z-30 px-4 flex items-center justify-between transition-colors"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        height: 64,
      }}
    >
      {allowBack ? (
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
      ) : (
        // Forward-only exam — keep the layout balanced with an inert spacer.
        <span aria-hidden="true" style={{ display: 'inline-block', minWidth: 96 }} />
      )}

      <span className="text-sm font-medium text-muted-foreground">
        Q {currentIndex + 1} of {totalQuestions}
      </span>

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
    </nav>
  );
}
