
import React, { useState } from 'react';
import { Tooltip } from './Tooltip';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';
import { Question } from '../data/questions';
import type { ExamSection } from '../data/assessments';
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
  sections?: ExamSection[];
}

function getCurrentSection(sections: ExamSection[], index: number) {
  let cum = 0;
  for (let i = 0; i < sections.length; i++) {
    if (index < cum + sections[i].questionCount) {
      return { title: sections[i].title, number: i + 1, total: sections.length };
    }
    cum += sections[i].questionCount;
  }
  return null;
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
  sections,
}: StickyFooterProps) {
  const currentSection = sections?.length ? getCurrentSection(sections, currentIndex) : null;
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

      {/* Center: Q pill + section label → opens question list upward */}
      <div className="relative flex flex-col items-center gap-0.5">
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

        {/* Current section indicator */}
        {currentSection && (
          <span
            className="truncate max-w-[180px]"
            style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1, pointerEvents: 'none' }}
            aria-label={`Section ${currentSection.number} of ${currentSection.total}: ${currentSection.title}`}
          >
            §{currentSection.number} · {currentSection.title}
          </span>
        )}

        <QuestionJumpPopover
          questions={questions}
          currentIndex={currentIndex}
          answeredSet={answeredSet}
          flaggedSet={flaggedSet}
          onNavigate={onNavigate}
          isOpen={showNavigator}
          onClose={() => setShowNavigator(false)}
          sections={sections}
        />
      </div>

      {/* Right: Mark for review + Next */}
      <div className="flex items-center gap-2">
        <Tooltip content="Mark for review (F)" position="top">
          <DSButton
            variant="outline"
            size="lg"
            onClick={onToggleFlag}
            aria-label={isFlaggedCurrent ? 'Remove mark' : 'Mark for review'}
            style={
              isFlaggedCurrent
                ? { backgroundColor: 'var(--state-flagged-bg)', borderColor: 'var(--state-flagged-border)', color: 'var(--state-flagged-text)' }
                : undefined
            }
          >
            <i className={`${isFlaggedCurrent ? 'fa-solid' : 'fa-light'} fa-flag`} aria-hidden="true" style={{ fontSize: 16 }} />
            <span className="hidden sm:inline">{isFlaggedCurrent ? 'Marked' : 'Mark'}</span>
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
