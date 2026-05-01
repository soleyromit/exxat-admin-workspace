import React, { useEffect, useState, useRef } from 'react';
/**
 * QuestionCard — Exxat Exam Management
 *
 * FIGMA LAYER GUIDE
 * ─────────────────
 * QuestionCard                [Frame, Auto Layout vertical, fill×fill, bg=Surface/White, border=Border/Default, rounded-12]
 *   ├── Card/ScrollArea       [Frame, fill×fill, overflow=scroll — ⚠️ not directly representable in Figma]
 *   │     └── Card/Content   [Frame, Auto Layout vertical, fill×hug, p=33px]
 *   │           ├── Card/QuestionHeader  [Frame, Auto Layout vertical, fill×hug, border-b=Border/Default, pb=12px, mb=12px]
 *   │           │     ├── Card/MetaRow  [Frame, Auto Layout horizontal, space-between, fill×hug]
 *   │           │     │     ├── QuestionLabel  [Text, 0.875em SemiBold, Brand/Primary, uppercase]
 *   │           │     │     ├── RequiredBadge? [Frame, pill, bg=Semantic/ErrorBg, text=Semantic/ErrorText]
 *   │           │     │     └── PointsBadge    [Frame, pill, bg=Brand/PrimaryMidBg, text=Brand/PrimaryMid]
 *   │           │     └── Card/QuestionText [Frame, Auto Layout horizontal]
 *   │           │           ├── QuestionH2 [Text, 1.5em, Text/Primary, Source Sans 3]
 *   │           │           └── RequiredAsterisk? [Text, 1.5em, Semantic/ErrorDot]
 *   │           └── Card/AnswerArea  [Frame, bg=Surface/Muted, border=Border/Default, rounded-12, p=25px]
 *   │                 — MCQ:       OptionButton ×N  [Frame, 60px, border=Border/Default or Border/Focus]
 *   │                 — Dropdown:  DropdownTrigger + DropdownList
 *   │                 — TextArea:  TextAreaInput + DictateButton + WordCount
 *   └── Card/NavFooter       [Frame, Auto Layout horizontal, space-between, fill×75px, border-t=Border/Default, px=33px]
 *         ├── PreviousButton?  [Instance: Button, variant=secondary, size=sm, leadingIcon=true]
 *         └── NextButton?      [Instance: NextButton]
 *
 * ⚠️ FIGMA EXPORT FLAGS
 *   1. Card/ScrollArea uses CSS overflow-y: auto. In Figma, mark as scrollable
 *      vertical frame. Content inside will overflow — use "Clip content".
 *   2. Font scaling (scaleValue / transform: scale) is a runtime behavior.
 *      In Figma, create separate frames for each font size variant (100%, 118%, 136%).
 *   3. DropdownList is absolutely positioned — in Figma, place as a separate
 *      overlay/component and document the z-index behavior.
 *   4. DictateButton has a live/active state (red bg, pulsing dot). Create as
 *      a variant: state=idle | state=recording.
 *
 * TOKEN USAGE (all colors from tokens/design-tokens.ts)
 *   Card bg           → Surface/White
 *   Card border       → Border/Default
 *   Answer area bg    → Surface/Muted
 *   Option default    → bg Surface/White, border Border/Default
 *   Option selected   → bg Brand/PrimaryBg, border Border/Focus
 *   Checkbox selected → Brand/Primary fill, Text/Inverse check
 *   Question label    → Brand/Primary
 *   Points badge      → Brand/PrimaryMidBg / Brand/PrimaryMid
 *   Required badge    → Semantic/ErrorBg / Semantic/ErrorText / Semantic/ErrorBorder
 */
import { MicIcon, MicOffIcon, ChevronDownIcon } from 'lucide-react';
import { Question } from '../data/questions';
import { Button } from './Button';
import { NextButton } from './NextButton';
import { tokens } from '../tokens/design-tokens';
export type FontSizeLevel = 'normal' | 'large' | 'xlarge';
export interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | undefined;
  onSelectAnswer: (questionId: number, answer: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  speechToTextEnabled: boolean;
  speechTranscript: string;
  isSpeechListening: boolean;
  onStartSpeech: () => void;
  onStopSpeech: () => void;
  isSpeechSupported: boolean;
  zoomPercent: number;
}
export function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  onNext,
  onPrevious,
  isSpeechListening,
  onStartSpeech,
  onStopSpeech,
  isSpeechSupported,
  zoomPercent
}: QuestionCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Apply prefers-reduced-motion to scaling if needed, but the prompt says
  // "reduced motion: zoom transition should be instant" which we handle by not adding transition on scale
  const scaleValue = zoomPercent / 100;
  const displayValue = question.type === 'short-answer' ? selectedAnswer || '' : '';
  const wordCount = displayValue.trim() ? displayValue.trim().split(/\s+/).length : 0;
  const charCount = displayValue.length;
  const maxChars = question.maxChars || 5000;
  const handleOptionSelect = (option: string) => onSelectAnswer(question.id, option);
  const handleTextChange = (value: string) => {
    if (value.length <= maxChars) onSelectAnswer(question.id, value);
  };
  const handleDropdownSelect = (option: string) => {
    onSelectAnswer(question.id, option);
    setDropdownOpen(false);
  };
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => {
    setDropdownOpen(false);
  }, [questionIndex]);
  return (
    // Figma layer: "QuestionCard"
    <div className="flex-1 flex flex-col min-h-0" style={{
      backgroundColor: tokens.surface.white,
      border: `1px solid ${tokens.border.default}`,
      borderRadius: '12px',
      boxShadow: '0px 1px 2px rgba(0,0,0,0.05)'
    }}>
      {/* Figma layer: "Card/ScrollArea"
                       ⚠️ Mark as vertically scrollable in Figma — use "Clip content" */}
      <div className="flex-1 overflow-y-auto">
        {/* Figma layer: "Card/Content" */}
        <div className="origin-top-left" style={{
          fontSize: `${scaleValue}em`,
          padding: '33px'
          // Only apply transition if not reduced motion, but for simplicity and compliance we can just make it instant
          // or use Tailwind's motion-safe:transition-all
        }}>
          {/* Figma layer: "Card/QuestionHeader" */}
          <div style={{
            paddingBottom: '12px',
            marginBottom: '12px',
            borderBottom: `1px solid ${tokens.border.default}`
          }}>
            {/* Figma layer: "Card/MetaRow" */}
            <div className="flex items-center justify-between" style={{
              marginBottom: '12px'
            }}>
              <div className="flex items-center" style={{
                gap: '12px'
              }}>
                {/* Figma layer: "QuestionLabel" */}
                <span className="font-heading font-semibold" style={{
                  fontSize: '0.875em',
                  lineHeight: 1.43,
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  color: tokens.brand.primary
                }}>
                  QUESTION {questionIndex + 1} OF {totalQuestions}
                </span>
                {/* Figma layer: "RequiredBadge" */}
                {question.required && <span className="font-heading font-medium" style={{
                  fontSize: '0.75em',
                  lineHeight: 1.33,
                  color: tokens.semantic.errorText,
                  backgroundColor: tokens.semantic.errorBg,
                  border: `1px solid ${tokens.semantic.errorBorder}`,
                  borderRadius: '4px',
                  padding: '3px 9px'
                }}>
                    Required
                  </span>}
              </div>
              {/* Figma layer: "PointsBadge" */}
              <span className="font-heading font-medium" style={{
                fontSize: '0.875em',
                lineHeight: 1.43,
                color: tokens.brand.primaryMid,
                backgroundColor: tokens.brand.primaryMidBg,
                borderRadius: '9999px',
                padding: '6px 12px'
              }}>
                {question.points} points
              </span>
            </div>

            {/* Figma layer: "Card/QuestionText" */}
            <div className="flex items-start" style={{
              gap: '4px'
            }}>
              {/* Figma layer: "QuestionH2" */}
              <h2 className="font-heading font-normal" style={{
                fontSize: '1.5em',
                lineHeight: 1.25,
                color: tokens.text.primary
              }}>
                {question.text}
              </h2>
              {/* Figma layer: "RequiredAsterisk" */}
              {question.required && <span className="font-heading shrink-0" style={{
                fontSize: '1.5em',
                lineHeight: 1.25,
                color: tokens.semantic.errorDot
              }}>
                  *
                </span>}
            </div>
          </div>

          {/* ─── Figma layer: "Card/AnswerArea" — MCQ ──────────────────────── */}
          {question.type === 'mcq' && question.options && <div style={{
            backgroundColor: tokens.surface.muted,
            border: `1px solid ${tokens.border.default}`,
            borderRadius: '12px',
            padding: '25px',
            marginTop: '24px'
          }}>
              <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
                {question.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                return (
                  // Figma layer: "OptionButton" (variant: selected | default)
                  <button key={idx} onClick={() => handleOptionSelect(option)} className="w-full flex items-center text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{
                    minHeight: '48px',
                    height: 'auto',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? tokens.border.focus : tokens.border.default}`,
                    backgroundColor: isSelected ? tokens.brand.primaryBg : tokens.surface.white,
                    boxShadow: isSelected ? '0px 1px 2px rgba(0,0,0,0.05)' : 'none',
                    paddingLeft: '18px',
                    paddingRight: '18px',
                    outlineColor: tokens.brand.primary
                  }} aria-pressed={isSelected}>
                      {/* Figma layer: "OptionCheckbox" (variant: checked | unchecked) */}
                      <div className="shrink-0 flex items-center justify-center" style={{
                      width: '1.25em',
                      height: '1.25em',
                      minWidth: '20px',
                      minHeight: '20px'
                    }}>
                        {isSelected ? <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none">
                            <rect width="20" height="20" rx="4" fill={tokens.brand.primary} />
                            <path d="M14.5 7L8.5 13L5.5 10" stroke={tokens.text.inverse} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg> : <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '4px',
                        border: `1px solid ${tokens.border.medium}`,
                        backgroundColor: tokens.surface.white
                      }} />}
                      </div>
                      {/* Figma layer: "OptionLabel" */}
                      <span className="font-heading" style={{
                      fontSize: '1em',
                      lineHeight: 1.5,
                      color: isSelected ? tokens.text.primary : tokens.text.secondary,
                      marginLeft: '16px'
                    }}>
                        {option}
                      </span>
                    </button>);

              })}
              </div>
            </div>}

          {/* ─── Figma layer: "Card/AnswerArea" — Dropdown ─────────────────── */}
          {question.type === 'dropdown' && question.options && <div style={{
            backgroundColor: tokens.surface.muted,
            border: `1px solid ${tokens.border.default}`,
            borderRadius: '12px',
            padding: '25px',
            marginTop: '24px'
          }}>
              {/* Figma layer: "DropdownTrigger"
              ⚠️ Dropdown open/close is absolute-positioned — document as overlay in Figma */}
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-full flex items-center justify-between text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{
                minHeight: '48px',
                height: 'auto',
                paddingTop: '12px',
                paddingBottom: '12px',
                borderRadius: '12px',
                border: `2px solid ${dropdownOpen ? tokens.border.focus : tokens.border.default}`,
                backgroundColor: tokens.surface.white,
                paddingLeft: '18px',
                paddingRight: '18px',
                outlineColor: tokens.brand.primary
              }} aria-expanded={dropdownOpen} aria-haspopup="listbox">
                  <span className="font-heading" style={{
                  fontSize: '1em',
                  lineHeight: 1.5,
                  color: selectedAnswer ? tokens.text.primary : tokens.text.subtle
                }}>
                    {selectedAnswer || 'Select an option...'}
                  </span>
                  <ChevronDownIcon className={`w-5 h-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} style={{
                  color: tokens.text.subtle
                }} />
                </button>

                {/* Figma layer: "DropdownList" — absolutely positioned overlay */}
                {dropdownOpen && <div className="absolute z-10 mt-1 w-full overflow-hidden" style={{
                backgroundColor: tokens.surface.white,
                border: `1px solid ${tokens.border.default}`,
                borderRadius: '12px',
                boxShadow: '0px 4px 12px rgba(0,0,0,0.1)'
              }}>
                    {question.options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  return (
                    // Figma layer: "DropdownOption" (variant: selected | default)
                    <button key={idx} onClick={() => handleDropdownSelect(option)} className="w-full text-left font-heading transition-colors" style={{
                      fontSize: '1em',
                      lineHeight: 1.5,
                      padding: '14px 18px',
                      color: isSelected ? tokens.brand.primary : tokens.text.secondary,
                      backgroundColor: isSelected ? tokens.brand.primaryBg : tokens.surface.white,
                      fontWeight: isSelected ? 500 : 400
                    }} role="option" aria-selected={isSelected}>
                          {option}
                        </button>);

                })}
                  </div>}
              </div>
            </div>}

          {/* ─── Figma layer: "Card/AnswerArea" — Short Answer ─────────────── */}
          {question.type === 'short-answer' && <div style={{
            backgroundColor: tokens.surface.muted,
            border: `1px solid ${tokens.border.default}`,
            borderRadius: '12px',
            padding: '25px',
            marginTop: '24px'
          }}>
              <div className="relative">
                {/* Figma layer: "TextAreaInput"
                ⚠️ Textarea is a form element — use a Figma text area placeholder component */}
                <textarea value={displayValue} onChange={(e) => handleTextChange(e.target.value)} placeholder="Write your detailed explanation here..." className="w-full font-heading resize-none focus:outline-none transition-colors" style={{
                fontSize: '1em',
                lineHeight: 1.5,
                height: '200px',
                padding: '16px',
                borderRadius: '12px',
                border: `2px solid ${tokens.border.default}`,
                color: tokens.text.primary,
                backgroundColor: tokens.surface.white
              }} onFocus={(e) => {
                e.currentTarget.style.borderColor = tokens.border.focus;
              }} onBlur={(e) => {
                e.currentTarget.style.borderColor = tokens.border.default;
              }} aria-label="Short answer input" maxLength={maxChars} />

                {/* Figma layer: "DictateButton"
                ⚠️ Create as variant: state=idle | state=recording */}
                {isSpeechSupported && <button onClick={isSpeechListening ? onStopSpeech : onStartSpeech} className={`absolute top-3 right-3 flex items-center rounded-lg font-heading font-medium transition-all ${isSpeechListening ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200'}`} style={{
                fontSize: '0.8125em',
                gap: '6px',
                padding: '6px 12px',
                color: isSpeechListening ? tokens.text.inverse : tokens.text.secondary
              }} aria-label={isSpeechListening ? 'Stop dictation' : 'Start dictation'}>
                    {isSpeechListening ? <>
                        <MicOffIcon style={{
                    width: '14px',
                    height: '14px'
                  }} />
                        <span>Stop</span>
                        <span className="relative flex" style={{
                    width: '8px',
                    height: '8px',
                    marginLeft: '2px'
                  }}>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full bg-white" style={{
                      width: '8px',
                      height: '8px'
                    }} />
                        </span>
                      </> : <>
                        <MicIcon style={{
                    width: '14px',
                    height: '14px'
                  }} />
                        <span>Dictate</span>
                      </>}
                  </button>}
              </div>

              {/* Figma layer: "WordCharCount" */}
              <div className="flex items-center justify-between" style={{
              marginTop: '12px'
            }}>
                <span className="font-heading" style={{
                fontSize: '0.8125em',
                color: tokens.text.muted
              }}>
                  Words: {wordCount}
                </span>
                <span className="font-heading" style={{
                fontSize: '0.8125em',
                color: tokens.text.muted
              }}>
                  Characters: {charCount}/{maxChars}
                </span>
              </div>

              {!isSpeechSupported && <p className="font-heading" style={{
              marginTop: '8px',
              fontSize: '0.75em',
              color: tokens.semantic.warningText
            }}>
                  Speech-to-text not supported. Use Chrome for best results.
                </p>}
            </div>}
        </div>
        {/* /Card/Content */}
      </div>
      {/* /Card/ScrollArea */}

      {/* Figma layer: "Card/NavFooter" */}
      <div className="flex items-center shrink-0" style={{
        height: '75px',
        padding: '0 33px',
        borderTop: `1px solid ${tokens.border.default}`
      }}>
        <div className="flex items-center justify-between w-full">
          {/* Figma layer: "PreviousButton" — visible only when questionIndex > 0 */}
          <div>
            {questionIndex > 0 && <Button label="Previous" variant="secondary" size="sm" leadingIcon onClick={onPrevious} />}
          </div>
          {/* Figma layer: "NextButton" — visible only when not on last question */}
          <div>
            {questionIndex < totalQuestions - 1 && <NextButton label="Next" onClick={onNext} />}
          </div>
        </div>
      </div>
    </div>);

}