import React, { useState } from 'react';
import {
  SettingsIcon,
  FlagIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Volume2Icon } from
'lucide-react';
import { SettingsPanel } from './SettingsPanel';
import { QuestionJumpPopover } from './QuestionJumpPopover';
import { Question } from '../data/questions';
import { Tooltip } from './Tooltip';
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
        backgroundColor: 'var(--surface-white)',
        borderColor: 'var(--border-default)'
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
              backgroundColor: 'var(--border-medium)'
            }} />
          
          <h1
            className="font-heading font-bold text-sm truncate max-w-[200px]"
            style={{
              color: 'var(--text-primary)'
            }}>
            
            Introduction to Pathology
          </h1>

          {showQuestionNavInToolbar &&
          <div className="relative ml-2">
              <Tooltip content="Jump to a specific question" position="bottom">
                <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setShowJumpPopover(!showJumpPopover)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-heading font-semibold transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--surface-subtle)',
                  borderColor: 'var(--border-medium)',
                  color: 'var(--text-secondary)'
                }}
                aria-label="Jump to a specific question">
                
                  Q{currentIndex + 1} of {totalQuestions}
                  {flaggedCount > 0 &&
                <span
                  className="flex items-center gap-1"
                  style={{
                    color: 'var(--state-flagged-text)'
                  }}>
                  
                      · <FlagIcon size={11} fill="currentColor" />{' '}
                      {flaggedCount}
                    </span>
                }
                  <ChevronDownIcon size={14} />
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
                'var(--surface-subtle)',
                borderColor: isLastFiveMinutes ?
                'var(--semantic-error-border)' :
                'var(--border-medium)',
                color: isLastFiveMinutes ?
                'var(--semantic-error-text)' :
                'var(--text-primary)'
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
              <button
              onClick={onToggleVoiceNarrator}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-heading font-semibold transition-all exam-focus shrink-0 animate-pulse"
              style={{
                backgroundColor: 'var(--exam-accent-light)',
                color: 'var(--exam-accent)',
                border: '1px solid var(--exam-accent-border)'
              }}
              aria-label="Voice narrator is on — click to turn off">
              
                <Volume2Icon size={14} />
                <span className="hidden sm:inline">Narrator On</span>
              </button>
            </Tooltip>
          }

          {/* Previous button */}
          {currentIndex > 0 &&
          <Tooltip
            content="Go to the previous question (←)"
            position="bottom">
            
              <button
              onClick={() => onNavigate(currentIndex - 1)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md border text-sm font-heading font-normal transition-all hover:opacity-80 exam-focus shrink-0"
              style={{
                borderColor: 'var(--border-medium)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface-white)'
              }}
              aria-label="Previous question">
              
                <ArrowLeftIcon size={14} />
                <span className="hidden sm:inline">Previous</span>
              </button>
            </Tooltip>
          }

          {/* Flag button */}
          <Tooltip
            content="Flag this question for review later"
            position="bottom">
            
            <button
              onClick={onToggleFlag}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md border text-sm font-heading font-normal transition-all exam-focus shrink-0"
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
              aria-label={
              isFlaggedCurrent ? 'Unflag Question' : 'Flag Question'
              }>
              
              <FlagIcon
                size={14}
                fill={isFlaggedCurrent ? 'currentColor' : 'none'} />
              
              <span className="hidden sm:inline">
                {isFlaggedCurrent ? 'Flagged' : 'Flag'}
              </span>
            </button>
          </Tooltip>

          {/* Next button */}
          {!isLastQuestion &&
          <Tooltip
            content="Go to the next question (Enter or →)"
            position="bottom">
            
              <button
              onClick={() => onNavigate(currentIndex + 1)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-heading font-normal transition-all hover:opacity-90 exam-focus shrink-0"
              style={{
                backgroundColor: 'var(--exam-accent)',
                color: 'var(--exam-accent-text)'
              }}
              aria-label="Next question">
              
                <span className="hidden sm:inline">Next</span>
                <ArrowRightIcon size={14} />
              </button>
            </Tooltip>
          }

          {/* Submit — always visible */}
          <Tooltip content="Submit your exam for grading" position="bottom">
            <button
              onClick={onSubmit}
              className="ml-1 px-4 py-1.5 rounded-md font-heading text-sm font-bold transition-all hover:opacity-90 exam-focus shrink-0 shadow-sm"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--brand-primary-text)'
              }}
              aria-label="Submit exam">
              
              Submit
            </button>
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
                  'var(--text-secondary)',
                  backgroundColor: showSettings ?
                  'var(--exam-accent-light)' :
                  'transparent'
                }}
                aria-label="Settings">
                
                <SettingsIcon size={18} />
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
          backgroundColor: 'var(--border-default)'
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