
import React, { useState } from 'react';
import { Tooltip } from './Tooltip';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';
import { Question } from '../data/questions';
import { QuestionJumpPopover } from './QuestionJumpPopover';

interface StickyFooterProps {
  currentIndex: number;
  totalQuestions: number;
  onNavigate: (index: number) => void;
  isFlaggedCurrent: boolean;
  onToggleFlag: () => void;
  questions: Question[];
  answeredSet: Set<number>;
  flaggedSet: Set<number>;
}
export function StickyFooter({
  currentIndex,
  totalQuestions,
  onNavigate,
  isFlaggedCurrent,
  onToggleFlag,
  questions,
  answeredSet,
  flaggedSet,
}: StickyFooterProps) {
  const [showNavigator, setShowNavigator] = useState(false);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t z-30 px-4 flex items-center justify-between transition-colors"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.07)',
        height: 64,
      }}>

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

      {/* Center: Q pill → opens question list upward */}
      <div className="relative flex items-center">
        <Tooltip content="View all questions and jump to any" position="top">
          <DSButton
            variant="outline"
            size="sm"
            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
            onClick={() => setShowNavigator(v => !v)}
            aria-label="Open question list"
            aria-expanded={showNavigator}
            className="rounded-full gap-2 font-semibold"
            style={showNavigator ? {
              backgroundColor: 'var(--muted)',
              borderColor: 'var(--foreground)',
              color: 'var(--foreground)',
            } : undefined}
          >
            <span>Q {currentIndex + 1}</span>
            <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>of {totalQuestions}</span>
            {flaggedSet.size > 0 && (
              <span className="flex items-center gap-1" style={{ color: 'var(--state-flagged-text)', fontSize: 12 }}>
                · <i className="fa-solid fa-flag" aria-hidden="true" style={{ fontSize: 10 }} />
                {flaggedSet.size}
              </span>
            )}
            <i
              className={`fa-light ${showNavigator ? 'fa-chevron-down' : 'fa-chevron-up'}`}
              aria-hidden="true"
              style={{ fontSize: 12 }}
            />
          </DSButton>
        </Tooltip>

        <QuestionJumpPopover
          questions={questions}
          currentIndex={currentIndex}
          answeredSet={answeredSet}
          flaggedSet={flaggedSet}
          onNavigate={onNavigate}
          isOpen={showNavigator}
          onClose={() => setShowNavigator(false)}
        />
      </div>

      {/* Right: Flag + Next */}
      <div className="flex items-center gap-2">
        <Tooltip content="Flag this question for review (F)" position="top">
          <DSButton
            variant="outline"
            size="lg"
            onClick={onToggleFlag}
            aria-label={isFlaggedCurrent ? 'Unflag Question' : 'Flag Question'}
            style={
              isFlaggedCurrent
                ? { backgroundColor: 'var(--state-flagged-bg)', borderColor: 'var(--state-flagged-border)', color: 'var(--state-flagged-text)' }
                : undefined
            }
          >
            <i className={`${isFlaggedCurrent ? 'fa-solid' : 'fa-light'} fa-flag`} aria-hidden="true" style={{ fontSize: 16 }} />
            <span className="hidden sm:inline">{isFlaggedCurrent ? 'Flagged' : 'Flag'}</span>
          </DSButton>
        </Tooltip>

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
    </div>);

}
