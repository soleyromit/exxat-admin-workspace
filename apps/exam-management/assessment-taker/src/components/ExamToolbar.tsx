import React, { useState } from 'react';
import { SettingsPanel } from './SettingsPanel';
import { Tooltip } from './Tooltip';
import { Badge, Button as DSButton, Separator, Popover, PopoverContent, PopoverTrigger } from '@exxatdesignux/ui';
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
  sections,
  onShowKeyboardShortcuts,
  onToggleNav,
  isNavOpen,
  onReportIssue,
}: ExamToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  // Progress fill and the section boundary ticks must share one denominator or
  // they end up on different scales (fill on the count of loaded questions, ticks
  // on the declared section total) and stop corresponding. When the exam declares
  // sections, the authoritative total is the sum of section question counts — the
  // size the student actually sees ("75 questions") — not questions.length.
  const sectionTotal = sections?.length
  ? sections.reduce((sum, s) => sum + s.questionCount, 0) || totalQuestions
  : totalQuestions;
  const progressPercent =
  sectionTotal > 0 ? (currentIndex + 1) / sectionTotal * 100 : 0;
  const currentSection = sections?.length ? getCurrentSection(sections, currentIndex) : null;
  return (
    <header
      aria-label="Exam toolbar"
      className="border-b border-border bg-card flex flex-col shrink-0 z-40 relative transition-colors"
    >
      <div className="h-14 flex items-center justify-between px-4">
        {/* Left: Logo, separator, Questions toggle, Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src="/exxat-logo.svg"
            alt=""
            aria-hidden="true"
            className="hidden sm:block shrink-0"
            style={{ height: '1.5em' }} />

          <Separator
            orientation="vertical"
            decorative
            className="h-5 hidden sm:block shrink-0" />

          <div className="flex flex-col min-w-0">
            <span
              className="font-bold text-sm truncate text-foreground"
              style={{ lineHeight: 1.3 }}
              title={assessmentTitle ?? 'Assessment'}
            >
              {assessmentTitle ?? 'Assessment'}
            </span>
            {/* Aarti May 14: course name is mandatory in the header. Combined
                with the current-section indicator on one secondary line so the
                fixed-height header stays a clean two-row block. */}
            {(courseLabel || currentSection) && (() => {
              const subtitle = [
                courseLabel,
                currentSection ? `Section ${currentSection.number} · ${currentSection.title}` : null,
              ].filter(Boolean).join('  ·  ');
              return (
                <span
                  className="text-xs truncate text-muted-foreground"
                  style={{ lineHeight: 1.2 }}
                  title={subtitle}
                >
                  {subtitle}
                </span>
              );
            })()}
          </div>

        </div>

        {/* Center: Timer */}
        <span role="status" aria-live="polite" className="sr-only">
          {isLastFiveMinutes ? 'Warning: less than 5 minutes remaining.' : ''}
        </span>
        <Badge
          role="timer"
          aria-live="off"
          variant="outline"
          className={`font-mono font-bold text-sm tabular-nums${isLastFiveMinutes ? ' animate-pulse' : ''}`}
          aria-label={`Time remaining: ${timerFormatted}`}
          style={isLastFiveMinutes ? { color: 'var(--chart-4)', borderColor: 'var(--chart-4)' } : undefined}
        >
          {timerFormatted}
        </Badge>

        {/* Right: Narrator chip, Previous, Flag, Next, Settings, Submit */}
        <div role="toolbar" aria-label="Exam tools" className="flex items-center justify-end gap-2 flex-1">
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
                <i className="fa-light fa-volume text-sm" aria-hidden="true" />
                <span className="hidden sm:inline">Narrator On</span>
              </DSButton>
            </Tooltip>
          }

          {/* Global Reference button — shown when exam has formula/reference sheets */}
          {hasGlobalRef && (
            <Tooltip content="Open exam reference materials" position="bottom">
              <DSButton
                variant={isGlobalRefOpen ? 'secondary' : 'outline'}
                size="sm"
                onClick={onToggleGlobalRef}
                aria-label={isGlobalRefOpen ? 'Reference — close panel' : 'Reference — open materials'}
                aria-expanded={isGlobalRefOpen}
                className="shrink-0"
              >
                <i className="fa-light fa-file-lines fa-fw" aria-hidden="true" />
                <span className="hidden sm:inline">Reference</span>
              </DSButton>
            </Tooltip>
          )}

          {/* Questions navigator button */}
          {onToggleNav && (
            <Tooltip content="Open question navigator" position="bottom">
              <DSButton
                variant={isNavOpen ? 'secondary' : 'outline'}
                size="sm"
                onClick={onToggleNav}
                aria-label={isNavOpen ? 'Questions — close navigator' : 'Questions — open navigator'}
                aria-expanded={isNavOpen}
                className="shrink-0"
              >
                <i className="fa-light fa-list-ul fa-fw" aria-hidden="true" />
                <span className="hidden sm:inline">Questions</span>
              </DSButton>
            </Tooltip>
          )}

          {/* Settings — last in order */}
          <Popover open={showSettings} onOpenChange={setShowSettings}>
            <Tooltip content="Open exam settings" position="bottom" disabled={showSettings}>
              <PopoverTrigger asChild>
                <DSButton
                  variant={showSettings ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  aria-label="Settings"
                  className={`shrink-0 text-lg${showSettings ? '' : ' text-muted-foreground'}`}
                >
                  <i className="fa-light fa-gear" aria-hidden="true" />
                </DSButton>
              </PopoverTrigger>
            </Tooltip>
            <PopoverContent side="bottom" align="end" className="w-[300px] p-0" aria-label="Exam settings">
              <SettingsPanel
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
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Progress bar with section markers */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Exam progress: question ${currentIndex + 1} of ${sectionTotal}`}
        style={{ width: '100%', height: '4px', backgroundColor: 'var(--muted)', position: 'relative' }}
      >
        {/* Filled progress */}
        <div
          className="transition-all duration-300"
          style={{
            position: 'absolute', top: 0, left: 0,
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: 'var(--primary)',
            borderRadius: '0 2px 2px 0',
          }}
        />
        {/* Section boundary ticks — white notches at each section boundary.
            Placed against the exam's declared section total (not the count of
            currently-loaded questions) so boundaries sit at their true
            proportional position regardless of how many questions are mounted. */}
        {sections && (() => {
          let cum = 0;
          return sections.slice(0, -1).map((s) => {
            cum += s.questionCount;
            const pct = Math.min(99, (cum / sectionTotal) * 100);
            return (
              <div
                key={s.id}
                aria-hidden="true"
                style={{
                  position: 'absolute', top: 0, bottom: 0,
                  width: 2, left: `${pct}%`,
                  backgroundColor: 'var(--background)',
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