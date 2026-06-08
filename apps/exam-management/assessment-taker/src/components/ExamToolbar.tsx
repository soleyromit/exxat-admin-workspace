import React, { useState } from 'react';
import { SettingsPanel } from './SettingsPanel';
import { Tooltip } from './Tooltip';
import { Button as DSButton } from '@exxatdesignux/ui';
import type { ExamSection } from '../data/assessments';

function getCurrentSection(sections: ExamSection[], index: number) {
  let cum = 0;
  for (let i = 0; i < sections.length; i++) {
    if (index < cum + sections[i].questionCount) {
      return { title: sections[i].title, number: i + 1 };
    }
    cum += sections[i].questionCount;
  }
  return null;
}
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
  sections?: ExamSection[];
  onShowKeyboardShortcuts?: () => void;
  onToggleNav?: () => void;
  isNavOpen?: boolean;
  onReportIssue?: () => void;
}
export function ExamToolbar({
  timerFormatted,
  assessmentTitle,
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
  sections,
  onShowKeyboardShortcuts,
  onToggleNav,
  isNavOpen,
  onReportIssue,
}: ExamToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const progressPercent =
  totalQuestions > 0 ? (currentIndex + 1) / totalQuestions * 100 : 0;
  const currentSection = sections?.length ? getCurrentSection(sections, currentIndex) : null;
  return (
    <header
      className="border-b flex flex-col shrink-0 z-40 relative transition-colors"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)'
      }}>
      
      <div className="h-14 flex items-center justify-between px-4">
        {/* Left: Logo, separator, Questions toggle, Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src="/exxat-logo.svg"
            alt="Exxat"
            className="hidden sm:block shrink-0"
            style={{ height: '1.5em' }} />

          <div
            className="w-px h-5 hidden sm:block shrink-0"
            style={{ backgroundColor: 'var(--border)' }} />

          <div className="flex flex-col min-w-0">
            <Tooltip content={assessmentTitle ?? 'Assessment'} position="bottom">
              <h1
                className="font-bold text-sm truncate"
                style={{ color: 'var(--foreground)', lineHeight: 1.3 }}>
                {assessmentTitle ?? 'Assessment'}
              </h1>
            </Tooltip>
            {currentSection && (
              <Tooltip content={`Section ${currentSection.number} · ${currentSection.title}`} position="bottom">
                <span
                  className="text-[12px] truncate"
                  style={{ color: 'var(--muted-foreground)', lineHeight: 1.2 }}
                  aria-label={`Current section: ${currentSection.title}`}
                >
                  Section {currentSection.number} · {currentSection.title}
                </span>
              </Tooltip>
            )}
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
                variant={isGlobalRefOpen ? 'default' : 'outline'}
                size="sm"
                onClick={onToggleGlobalRef}
                aria-label={isGlobalRefOpen ? 'Close reference panel' : 'Open reference materials'}
                aria-pressed={isGlobalRefOpen}
                className="shrink-0"
              >
                <i className="fa-light fa-file-lines text-sm" aria-hidden="true" />
                <span className="hidden sm:inline">Reference</span>
              </DSButton>
            </Tooltip>
          )}

          {/* Questions navigator button */}
          {onToggleNav && (
            <DSButton
              variant="outline"
              size="sm"
              onClick={onToggleNav}
              aria-label={isNavOpen ? 'Close question navigator' : 'Open question navigator'}
              aria-expanded={isNavOpen}
              className="shrink-0"
            >
              <i className="fa-light fa-list-ul" aria-hidden="true" />
              Questions
            </DSButton>
          )}

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
              onExit={onExit}
              onShowKeyboardShortcuts={onShowKeyboardShortcuts}
              onReportIssue={onReportIssue} />
            
          </div>
        </div>
      </div>

      {/* Progress bar with section markers */}
      <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border)', position: 'relative' }}>
        {/* Filled progress */}
        <div
          className="transition-all duration-300"
          style={{
            position: 'absolute', top: 0, left: 0,
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: 'var(--exam-accent)',
            borderRadius: '0 2px 2px 0',
          }}
        />
        {/* Section boundary ticks — white notches at each section boundary */}
        {sections && (() => {
          let cum = 0;
          return sections.slice(0, -1).map((s) => {
            cum += s.questionCount;
            const pct = Math.min(99, (cum / totalQuestions) * 100);
            return (
              <div
                key={s.id}
                aria-hidden="true"
                style={{
                  position: 'absolute', top: 0, bottom: 0,
                  width: 2, left: `${pct}%`,
                  backgroundColor: 'var(--card)',
                  transform: 'translateX(-50%)',
                  zIndex: 1,
                }}
              />
            );
          });
        })()}
      </div>
    </header>);

}