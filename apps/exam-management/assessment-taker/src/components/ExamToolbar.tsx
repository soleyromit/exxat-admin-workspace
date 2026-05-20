import React, { useState } from 'react';
import { SettingsPanel } from './SettingsPanel';
import { Tooltip } from './Tooltip';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';
export interface ExamToolbarProps {
  timerFormatted: string;
  /** Aarti May 14: "assessment name has to be part of the header. It cannot not be part of the header." */
  assessmentTitle?: string;
  /** Aarti May 14: "course name is also mandatory" */
  courseLabel?: string;
  totalQuestions: number;
  currentIndex: number;
  zoomPercent: number;
  onToggleCalculator: () => void;
  onToggleKeyboard: () => void;
  onToggleAccessibility: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  onSubmit: () => void;
  theme: 'light' | 'dark' | 'high-contrast';
  onThemeChange: (theme: 'light' | 'dark' | 'high-contrast') => void;
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
  hasGlobalRef?: boolean;
  onToggleGlobalRef?: () => void;
  isGlobalRefOpen?: boolean;
}
export function ExamToolbar({
  timerFormatted,
  assessmentTitle,
  courseLabel,
  totalQuestions,
  currentIndex,
  zoomPercent,
  onToggleCalculator,
  onToggleKeyboard,
  onToggleAccessibility,
  zoomIn,
  zoomOut,
  onSubmit,
  theme,
  onThemeChange,
  isLastFiveMinutes,
  voiceNarrator,
  onToggleVoiceNarrator,
  colorBlindMode,
  onColorBlindModeChange,
  onExit,
  hasGlobalRef,
  onToggleGlobalRef,
  isGlobalRefOpen,
}: ExamToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const progressPercent =
  totalQuestions > 0 ? (currentIndex + 1) / totalQuestions * 100 : 0;
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
          
          {/* Aarti May 14: both course name AND assessment name must be in the header */}
          <div className="flex flex-col min-w-0">
            {courseLabel && (
              <span className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)', lineHeight: 1.2 }}>
                {courseLabel}
              </span>
            )}
            <h1
              className="font-bold text-sm truncate max-w-[240px]"
              style={{ color: 'var(--foreground)', lineHeight: 1.3 }}>
              {assessmentTitle ?? 'Assessment'}
            </h1>
          </div>

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

          {/* Global Reference button — shown when exam has formula/reference sheets */}
          {hasGlobalRef && (
            <Tooltip content="Open exam reference materials" position="bottom">
              <DSButton
                variant="outline"
                size="sm"
                onClick={onToggleGlobalRef}
                aria-label={isGlobalRefOpen ? 'Close reference panel' : 'Open reference materials'}
                className="shrink-0"
                style={
                  isGlobalRefOpen
                    ? {
                        backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))',
                        borderColor: 'var(--brand-color)',
                        color: 'var(--brand-color)',
                      }
                    : undefined
                }
              >
                <i className="fa-light fa-file-lines" aria-hidden="true" style={{ fontSize: 14 }} />
                <span className="hidden sm:inline">Reference</span>
              </DSButton>
            </Tooltip>
          )}

          {/* Submit — always visible */}
          <Tooltip content="Submit your exam for grading" position="bottom">
            <DSButton
              variant="default"
              size="sm"
              onClick={onSubmit}
              aria-label="Submit exam"
              className="ml-1 shrink-0 font-bold"
            >
              Submit
            </DSButton>
          </Tooltip>

          {/* Settings — last in order */}
          <div className="relative">
            <Tooltip content="Open exam settings" position="bottom">
              <DSButton
                variant="ghost"
                size="icon-sm"
                onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Settings"
                className="shrink-0"
                style={showSettings ? { color: 'var(--foreground)', backgroundColor: 'var(--muted)' } : { color: 'var(--muted-foreground)' }}
              >
                <i className="fa-light fa-gear" aria-hidden="true" style={{ fontSize: 18 }} />
              </DSButton>
            </Tooltip>

            <SettingsPanel
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              theme={theme}
              onThemeChange={onThemeChange}
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