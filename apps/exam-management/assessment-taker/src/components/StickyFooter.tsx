
import { Tooltip } from './Tooltip';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';
interface StickyFooterProps {
  currentIndex: number;
  totalQuestions: number;
  onNavigate: (index: number) => void;
  isFlaggedCurrent: boolean;
  onToggleFlag: () => void;
  questionType: string;
}
export function StickyFooter({
  currentIndex,
  totalQuestions,
  onNavigate,
  isFlaggedCurrent,
  onToggleFlag,
  questionType
}: StickyFooterProps) {
  const showAnswerKeys = [
  'mcq',
  'checkbox',
  'cross-out',
  'image-mcq',
  'video-mcq',
  'audio',
  'case-study',
  'combined',
  'passage',
  'table',
  'pdf',
  'chart'].
  includes(questionType);
  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t backdrop-blur-sm z-30 px-6 py-4 flex items-center justify-between transition-colors"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)'
      }}>
      
      <Tooltip content="Go to the previous question (←)" position="top">
        <DSButton
          variant="outline"
          size="lg"
          onClick={() => currentIndex > 0 && onNavigate(currentIndex - 1)}
          disabled={currentIndex === 0}
          aria-label="Previous question"
        >
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 16 }} />
          Previous
        </DSButton>
      </Tooltip>

      {/* Contextual shortcut legend */}
      <div className="hidden md:flex items-center gap-6">
        {showAnswerKeys &&
        <ShortcutLegend keys={['A', 'B', 'C', 'D']} label="Select answer" />
        }
        <ShortcutLegend keys={['←', '→']} label="Navigate" />
        <ShortcutLegend keys={['Enter']} label="Next question" />
        <ShortcutLegend keys={['F']} label="Flag question" />
      </div>

      <div className="flex items-center gap-3">
        <Tooltip content="Flag this question for review (F)" position="top">
          <DSButton
            variant="outline"
            size="lg"
            onClick={onToggleFlag}
            aria-label={isFlaggedCurrent ? 'Unflag Question' : 'Flag Question'}
            style={
              isFlaggedCurrent
                ? {
                    backgroundColor: 'var(--state-flagged-bg)',
                    borderColor: 'var(--state-flagged-border)',
                    color: 'var(--state-flagged-text)',
                  }
                : undefined
            }
          >
            <i className={`${isFlaggedCurrent ? 'fa-solid' : 'fa-light'} fa-flag`} aria-hidden="true" style={{ fontSize: 16 }} />
            {isFlaggedCurrent ? 'Flagged' : 'Flag'}
          </DSButton>
        </Tooltip>

        <Tooltip content="Go to the next question (Enter or →)" position="top">
          <DSButton
            variant="default"
            size="lg"
            onClick={() => currentIndex < totalQuestions - 1 && onNavigate(currentIndex + 1)}
            disabled={currentIndex === totalQuestions - 1}
            aria-label="Next question"
          >
            Next
            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 16 }} />
          </DSButton>
        </Tooltip>
      </div>
    </div>);

}
function ShortcutLegend({ keys, label }: {keys: string[];label: string;}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {keys.map((k, i) =>
        <kbd
          key={i}
          className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border"
          style={{
            color: 'var(--muted-foreground)',
            borderColor: 'var(--border)',
            backgroundColor: 'var(--muted)'
          }}>
          
            {k}
          </kbd>
        )}
      </div>
      <span
        className="text-xs font-medium"
        style={{
          color: 'var(--muted-foreground)'
        }}>
        
        {label}
      </span>
    </div>);

}