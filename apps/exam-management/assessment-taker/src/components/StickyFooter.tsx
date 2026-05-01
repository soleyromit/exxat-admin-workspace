import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon, FlagIcon } from 'lucide-react';
import { Tooltip } from './Tooltip';
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
        backgroundColor: 'var(--surface-white)',
        borderColor: 'var(--border-default)'
      }}>
      
      <Tooltip content="Go to the previous question (←)" position="top">
        <button
          onClick={() => currentIndex > 0 && onNavigate(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border font-heading text-sm font-semibold transition-all hover:opacity-80 exam-focus disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            borderColor: 'var(--border-medium)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--surface-white)'
          }}
          aria-label="Previous question">
          
          <ArrowLeftIcon size={16} />
          Previous
        </button>
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
          <button
            onClick={onToggleFlag}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border font-heading text-sm font-semibold transition-all exam-focus"
            style={{
              backgroundColor: isFlaggedCurrent ?
              'var(--state-flagged-bg)' :
              'var(--surface-white)',
              borderColor: isFlaggedCurrent ?
              'var(--state-flagged-border)' :
              'var(--border-medium)',
              color: isFlaggedCurrent ?
              'var(--state-flagged-text)' :
              'var(--text-secondary)'
            }}
            aria-label={isFlaggedCurrent ? 'Unflag Question' : 'Flag Question'}>
            
            <FlagIcon
              size={16}
              fill={isFlaggedCurrent ? 'currentColor' : 'none'} />
            
            {isFlaggedCurrent ? 'Flagged' : 'Flag'}
          </button>
        </Tooltip>

        <Tooltip content="Go to the next question (Enter or →)" position="top">
          <button
            onClick={() =>
            currentIndex < totalQuestions - 1 && onNavigate(currentIndex + 1)
            }
            disabled={currentIndex === totalQuestions - 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-heading text-sm font-semibold transition-all hover:opacity-90 exam-focus disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--exam-accent)',
              color: 'var(--exam-accent-text)'
            }}
            aria-label="Next question">
            
            Next
            <ArrowRightIcon size={16} />
          </button>
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
            color: 'var(--text-muted)',
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--surface-subtle)'
          }}>
          
            {k}
          </kbd>
        )}
      </div>
      <span
        className="text-xs font-heading font-medium"
        style={{
          color: 'var(--text-subtle)'
        }}>
        
        {label}
      </span>
    </div>);

}