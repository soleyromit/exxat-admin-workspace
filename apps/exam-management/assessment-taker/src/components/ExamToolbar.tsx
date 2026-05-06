import { useState } from 'react';
import { SettingsPanel } from './SettingsPanel';
import { QuestionJumpPopover } from './QuestionJumpPopover';
import { Question } from '../data/questions';
import { Tooltip } from './Tooltip';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';
export interface ExamToolbarProps {
  timerFormatted: string;
  answeredCount: number;
  flaggedCount: number;
  unansweredCount: number;
  totalQuestions: number;
  currentIndex: number;
  zoomPercent: number;
  questions: Question[];
  answeredSet: Set<number>;
  flaggedSet: Set<number>;
  onNavigate: (index: number) => void;
  onToggleCalculator: () => void;
  onToggleKeyboard: () => void;
  onToggleAccessibility: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  onSubmit: () => void;
  theme: 'light' | 'dark' | 'high-contrast';
  onThemeChange: (theme: 'light' | 'dark' | 'high-contrast') => void;
  showQuestionNavInToolbar: boolean;
  onToggleNavInToolbar: () => void;
  showQuestionNavInHamburger: boolean;
  onToggleNavInHamburger: () => void;
  isFlaggedCurrent: boolean;
  onToggleFlag: () => void;
  isLastFiveMinutes: boolean;
  voiceNarrator: boolean;
  onToggleVoiceNarrator: () => void;
  colorBlindMode?:
  'none' |
  'protanopia' |
  'deuteranopia' |
  'tritanopia' |
  'achromatopsia';
  onColorBlindModeChange?: (
  mode:
  'none' |
  'protanopia' |
  'deuteranopia' |
  'tritanopia' |
  'achromatopsia')
  => void;
  onExit?: () => void;
}
export function ExamToolbar({
  timerFormatted,
  answeredCount,
  flaggedCount,
  totalQuestions,
  currentIndex,
  zoomPercent,
  questions,
  answeredSet,
  flaggedSet,
  onNavigate,
  onToggleCalculator,
  onToggleKeyboard,
  onToggleAccessibility,
  zoomIn,
  zoomOut,
  onSubmit,
  theme,
  onThemeChange,
  showQuestionNavInToolbar,
  onToggleNavInToolbar,
  showQuestionNavInHamburger,
  onToggleNavInHamburger,
  isFlaggedCurrent,
  onToggleFlag,
  isLastFiveMinutes,
  voiceNarrator,
  onToggleVoiceNarrator,
  colorBlindMode,
  onColorBlindModeChange,
  onExit
}: ExamToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showJumpPopover, setShowJumpPopover] = useState(false);
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const progressPercent =
  totalQuestions > 0 ? answeredCount / totalQuestions * 100 : 0;
  return (
    <header
      className="border-b flex flex-col shrink-0 z-40 relative transition-colors"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)'
      }}>
      
      <div className="h-14 flex items-center justify-between px-4">
        {/* Left: Logo, Title, Quick Jump */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <img
            src="/exxat_header_logo.svg"
            alt="Exxat Logo"
            className="h-5 hidden sm:block shrink-0" />
          
          <div
            className="w-px h-5 hidden sm:block shrink-0"
            style={{
              backgroundColor: 'var(--border)'
            }} />
          
          <h1
            className="font-bold text-sm truncate max-w-[200px]"
            style={{
              color: 'var(--foreground)'
            }}>
            Introduction to Pathology
          </h1>

          {showQuestionNavInToolbar &&
          <div className="relative ml-2">
              <Tooltip content="Jump to a specific question" position="bottom">
                <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setShowJumpPopover(!showJumpPopover)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--muted)',
                  borderColor: 'var(--border)',
                  color: 'var(--muted-foreground)'
                }}
                aria-label="Jump to a specific question">
                
                  Q{currentIndex + 1} of {totalQuestions}
                  {flaggedCount > 0 &&
                <span
                  className="flex items-center gap-1"
                  style={{
                    color: 'var(--state-flagged-text)'
                  }}>
                      · <i className="fa-solid fa-flag" aria-hidden="true" style={{ fontSize: 11 }} />{' '}
                      {flaggedCount}
                    </span>
                }
                  <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 14 }} />
                </button>
              </Tooltip>
              <QuestionJumpPopover
              questions={questions}
              currentIndex={currentIndex}
              answeredSet={answeredSet}
              flaggedSet={flaggedSet}
              onNavigate={onNavigate}
              isOpen={showJumpPopover}
              onClose={() => setShowJumpPopover(false)} />
            
            </div>
          }
        </div>

        {/* Center: Timer */}
        <Tooltip content="Time remaining in this exam" position="bottom">
          <div className="flex items-center justify-center">
            <div
              className={`px-3 py-1.5 rounded-md border font-timer font-bold text-sm tracking-wider ${isLastFiveMinutes ? 'animate-pulse' : ''}`}
              style={{
                backgroundColor: isLastFiveMinutes ?
                'var(--semantic-error-bg)' :
                'var(--muted)',
                borderColor: isLastFiveMinutes ?
                'var(--semantic-error-border)' :
                'var(--border)',
                color: isLastFiveMinutes ?
                'var(--semantic-error-text)' :
                'var(--foreground)'
              }}
              aria-label={`Time remaining: ${timerFormatted}`}>
              
              {timerFormatted}
            </div>
          </div>
        </Tooltip>

        {/* Right: Narrator chip, Previous, Flag, Next, Settings, Submit */}
        <div className="flex items-center justify-end gap-2 flex-1">
          {/* Quick narrator toggle — visible only when narrator is ON */}
          {voiceNarrator &&
          <Tooltip content="Turn off voice narrator" position="bottom">
              <DSButton
                variant="outline"
                size="sm"
                onClick={onToggleVoiceNarrator}
                aria-label="Voice narrator is on — click to turn off"
                className="animate-pulse shrink-0"
                style={{
                  backgroundColor: 'var(--exam-accent-light)',
                  color: 'var(--exam-accent)',
                  borderColor: 'var(--exam-accent-border)',
                }}
              >
                <i className="fa-light fa-volume" aria-hidden="true" style={{ fontSize: 14 }} />
                <span className="hidden sm:inline">Narrator On</span>
              </DSButton>
            </Tooltip>
          }

          {/* Previous button */}
          {currentIndex > 0 &&
          <Tooltip content="Go to the previous question (←)" position="bottom">
              <DSButton
                variant="outline"
                size="sm"
                onClick={() => onNavigate(currentIndex - 1)}
                aria-label="Previous question"
                className="shrink-0"
              >
                <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 14 }} />
                <span className="hidden sm:inline">Previous</span>
              </DSButton>
            </Tooltip>
          }

          {/* Flag button */}
          <Tooltip content="Flag this question for review later" position="bottom">
            <DSButton
              variant="outline"
              size="sm"
              onClick={onToggleFlag}
              aria-label={isFlaggedCurrent ? 'Unflag Question' : 'Flag Question'}
              className="shrink-0"
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
              <i className={`${isFlaggedCurrent ? 'fa-solid' : 'fa-light'} fa-flag`} aria-hidden="true" style={{ fontSize: 14 }} />
              <span className="hidden sm:inline">
                {isFlaggedCurrent ? 'Flagged' : 'Flag'}
              </span>
            </DSButton>
          </Tooltip>

          {/* Next button */}
          {!isLastQuestion &&
          <Tooltip content="Go to the next question (Enter or →)" position="bottom">
              <DSButton
                variant="default"
                size="sm"
                onClick={() => onNavigate(currentIndex + 1)}
                aria-label="Next question"
                className="shrink-0"
                style={{
                  backgroundColor: 'var(--exam-accent)',
                  color: 'var(--exam-accent-text)',
                }}
              >
                <span className="hidden sm:inline">Next</span>
                <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 14 }} />
              </DSButton>
            </Tooltip>
          }

          {/* Submit — always visible */}
          <Tooltip content="Submit your exam for grading" position="bottom">
            <DSButton
              variant="default"
              size="sm"
              onClick={onSubmit}
              aria-label="Submit exam"
              className="ml-1 shrink-0 font-bold shadow-sm"
              style={{
                backgroundColor: 'var(--brand-color)',
                color: 'var(--brand-foreground)',
              }}
            >
              Submit
            </DSButton>
          </Tooltip>

          {/* Settings — last in order */}
          <div className="relative">
            <Tooltip content="Open exam settings" position="bottom">
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setShowSettings(!showSettings)}
                className="w-9 h-9 flex items-center justify-center rounded-md transition-colors hover:opacity-80 exam-focus shrink-0"
                style={{
                  color: showSettings ?
                  'var(--exam-accent)' :
                  'var(--muted-foreground)',
                  backgroundColor: showSettings ?
                  'var(--exam-accent-light)' :
                  'transparent'
                }}
                aria-label="Settings">
                
                <i className="fa-light fa-gear" aria-hidden="true" style={{ fontSize: 18 }} />
              </button>
            </Tooltip>

            <SettingsPanel
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              theme={theme}
              onThemeChange={onThemeChange}
              showQuestionNavInToolbar={showQuestionNavInToolbar}
              onToggleNavInToolbar={onToggleNavInToolbar}
              showQuestionNavInHamburger={showQuestionNavInHamburger}
              onToggleNavInHamburger={onToggleNavInHamburger}
              onToggleCalculator={onToggleCalculator}
              onToggleKeyboard={onToggleKeyboard}
              onToggleAccessibility={onToggleAccessibility}
              zoomPercent={zoomPercent}
              zoomIn={zoomIn}
              zoomOut={zoomOut}
              voiceNarrator={voiceNarrator}
              onToggleVoiceNarrator={onToggleVoiceNarrator}
              onSubmit={onSubmit}
              colorBlindMode={colorBlindMode}
              onColorBlindModeChange={onColorBlindModeChange}
              onExit={onExit} />
            
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '3px',
          backgroundColor: 'var(--border)'
        }}>
        
        <div
          className="transition-all duration-300"
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: 'var(--exam-accent)',
            borderRadius: '0 2px 2px 0'
          }} />
        
      </div>
    </header>);

}