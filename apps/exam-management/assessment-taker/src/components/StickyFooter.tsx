import { Button as DSButton } from '@exxatdesignux/ui';

interface StickyFooterProps {
  currentIndex: number;
  totalQuestions: number;
  onNavigate: (index: number) => void;
}

export function StickyFooter({
  currentIndex,
  totalQuestions,
  onNavigate,
}: StickyFooterProps) {
  return (
    <div
      className="flex-shrink-0 w-full border-t z-30 px-4 flex items-center justify-between transition-colors"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.07)',
        height: 64,
      }}
    >
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

      <span style={{ fontSize: 13, color: 'var(--muted-foreground)', fontWeight: 500 }}>
        Q {currentIndex + 1} <span style={{ color: 'var(--muted-foreground)' }}>of {totalQuestions}</span>
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
    </div>
  );
}
