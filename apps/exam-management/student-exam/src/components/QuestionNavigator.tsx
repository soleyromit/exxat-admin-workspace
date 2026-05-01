import React from 'react';
/**
 * QuestionNavigator — Exxat Exam Management
 *
 * FIGMA LAYER GUIDE
 * ─────────────────
 * QuestionNavigator           [Frame, Auto Layout vertical, 322px×fill, bg=Surface/White]
 *   ├── Nav/Header            [Frame, Auto Layout vertical, fill×hug, p=12px, gap=2px]
 *   │     ├── Nav/Title       [Text, 16px Bold, Text/Primary]
 *   │     └── Nav/Subtitle    [Text, 14px, Text/Subtle]
 *   ├── Nav/Grid              [Frame, p=12px]
 *   │     └── GridItem ×N     [Frame, 40×40, rounded-8px] — see VARIANT STATES below
 *   ├── Nav/Legend            [Frame, Auto Layout vertical, p=12px, gap=8px]
 *   │     ├── Legend/Row1     [Frame, Auto Layout horizontal, wrap, gap=7px]
 *   │     │     ├── LegendDot + "Current"
 *   │     │     ├── LegendDot + "Answered"
 *   │     │     ├── LegendDot + "Skipped"
 *   │     │     └── LegendDot + "Flagged"
 *   │     └── Legend/Row2     [Frame, centered]
 *   │           └── RequiredBadge + "Required"
 *   ├── Nav/Actions           [Frame, Auto Layout vertical, p=12px, gap=8px]
 *   │     ├── Button/Flag     [Instance: Button, variant=secondary, full-width]
 *   │     └── Button/Submit   [Instance: Button, variant=primary, full-width]
 *   └── Nav/ProgressFooter    [Frame, p=12px, border-t=Border/Default]
 *         ├── StatsRow        [Frame, space-between]
 *         │     ├── "Answered: N" [Text, 14px, Text/Muted]
 *         │     ├── "Flagged: N"  [Text, 14px, Text/Muted]
 *         │     └── "Skipped: N"  [Text, 14px, Text/Muted]
 *         └── ProgressBar     [Frame, fill×4px, bg=Border/Default, radius=999px]
 *               └── ProgressFill [Frame, {%}×4px, bg=Brand/Primary, radius=999px]
 *
 * GRID ITEM VARIANT STATES
 *   current  → bg=Brand/Primary, text=Text/Inverse, border=Brand/Primary
 *   answered → bg=State/AnsweredBg, text=State/AnsweredText, border=State/AnsweredBorder
 *   flagged  → bg=State/FlaggedBg, text=State/FlaggedText, border=State/FlaggedBorder
 *   required → bg=Surface/White, text=Text/Muted, border=Semantic/ErrorDot (2px), outer glow
 *   default  → bg=Surface/White, text=Text/Muted, border=Border/Medium
 *
 * TOKEN USAGE
 *   See VARIANT STATES above — all from tokens/design-tokens.ts
 */
import { FlagIcon } from 'lucide-react';
import { Button } from './Button';
import { questions } from '../data/questions';
import { tokens } from '../tokens/design-tokens';
export interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredSet: Set<number>;
  flaggedSet: Set<number>;
  onNavigate: (index: number) => void;
  onToggleFlag: () => void;
  onSubmit: () => void;
  isFlaggedCurrent: boolean;
}
/** Returns the style for a GridItem based on its state. All values from tokens. */
function getGridItemStyle(index: number, currentIndex: number, answeredSet: Set<number>, flaggedSet: Set<number>): React.CSSProperties {
  const isCurrent = index === currentIndex;
  const isAnswered = answeredSet.has(index);
  const isFlagged = flaggedSet.has(index);
  const isRequired = questions[index]?.required && !isAnswered;
  if (isCurrent) return {
    backgroundColor: tokens.state.currentBg,
    color: tokens.text.inverse,
    border: `1px solid ${tokens.state.currentBg}`,
    boxShadow: '0px 2px 4px -2px rgba(0,0,0,0.1)'
  };
  if (isFlagged) return {
    backgroundColor: tokens.state.flaggedBg,
    color: tokens.state.flaggedText,
    border: `1px solid ${tokens.state.flaggedBorder}`
  };
  if (isAnswered) return {
    backgroundColor: tokens.state.answeredBg,
    color: tokens.state.answeredText,
    border: `1px solid ${tokens.state.answeredBorder}`
  };
  if (isRequired) return {
    backgroundColor: tokens.state.requiredBg,
    color: tokens.text.muted,
    border: `2px solid ${tokens.semantic.errorDot}`,
    boxShadow: `0px 0px 0px 2px ${tokens.state.requiredShadow}`
  };
  return {
    backgroundColor: tokens.surface.white,
    color: tokens.text.muted,
    border: `1px solid ${tokens.border.medium}`
  };
}
export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answeredSet,
  flaggedSet,
  onNavigate,
  onToggleFlag,
  onSubmit,
  isFlaggedCurrent
}: QuestionNavigatorProps) {
  const answeredCount = answeredSet.size;
  const flaggedCount = flaggedSet.size;
  const skippedCount = totalQuestions - answeredCount;
  const progressPercent = totalQuestions > 0 ? answeredCount / totalQuestions * 100 : 0;
  return (
    // Figma layer: "QuestionNavigator"
    <div style={{
      width: '322px',
      flexShrink: 0
    }}>
      <div className="flex flex-col" style={{
        backgroundColor: tokens.surface.white,
        borderRadius: '8px',
        boxShadow: '0px 1px 2px rgba(0,0,0,0.05)'
      }}>
        {/* Figma layer: "Nav/Header" */}
        <div style={{
          padding: '12px 12px 0 12px'
        }}>
          <div className="flex flex-col" style={{
            gap: '2px'
          }}>
            {/* Figma layer: "Nav/Title" */}
            <h3 className="font-heading font-bold" style={{
              fontSize: '16px',
              lineHeight: '24px',
              color: tokens.text.primary
            }}>
              Question Navigator
            </h3>
            {/* Figma layer: "Nav/Subtitle" */}
            <p className="font-heading" style={{
              fontSize: '14px',
              lineHeight: '24px',
              color: tokens.text.subtle
            }}>
              Introduction to Pathology
            </p>
          </div>
        </div>

        {/* Figma layer: "Nav/Grid" */}
        <div style={{
          padding: '12px 12px 0 12px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 40px)',
            gap: '8px',
            justifyContent: 'center'
          }}>
            {Array.from({
              length: totalQuestions
            }, (_, i) =>
            // Figma layer: "GridItem" (variant state applied via getGridItemStyle)
            <div key={i} className="relative">
                  <button onClick={() => onNavigate(i)} className="font-heading font-semibold transition-all hover:opacity-80" style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                ...getGridItemStyle(i, currentIndex, answeredSet, flaggedSet)
              }} aria-label={`Go to question ${i + 1}`} aria-current={i === currentIndex ? 'true' : undefined}>
                    {i + 1}
                  </button>

                  {/* Figma layer: "RequiredBadge" — visible only on required+unanswered+non-current */}
                  {questions[i]?.required && !answeredSet.has(i) && i !== currentIndex && <span className="absolute flex items-center justify-center" style={{
                width: '12px',
                height: '14px',
                borderRadius: '9999px',
                backgroundColor: tokens.semantic.errorDot,
                border: `1px solid ${tokens.surface.white}`,
                bottom: '-3px',
                right: '-2px'
              }}>
                        <span className="font-heading font-bold" style={{
                  fontSize: '8px',
                  color: tokens.text.inverse
                }}>
                          !
                        </span>
                      </span>}
                </div>)}
          </div>
        </div>

        {/* Figma layer: "Nav/Legend" */}
        <div style={{
          padding: '12px 12px 0 12px'
        }}>
          {/* Figma layer: "Legend/Row1" */}
          <div className="flex items-center justify-center flex-wrap" style={{
            gap: '7px'
          }}>
            {[{
              label: 'Current',
              bg: tokens.state.currentBg,
              border: tokens.state.currentBg
            }, {
              label: 'Answered',
              bg: tokens.state.answeredBg,
              border: tokens.state.answeredBorder
            }, {
              label: 'Skipped',
              bg: tokens.surface.white,
              border: tokens.border.medium
            }, {
              label: 'Flagged',
              bg: tokens.state.flaggedBg,
              border: tokens.state.flaggedBorder
            }].map(({
              label,
              bg,
              border
            }) =>
            // Figma layer: "LegendItem/{label}"
            <div key={label} className="flex items-center" style={{
              gap: '4px'
            }}>
                <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '9999px',
                backgroundColor: bg,
                border: `1px solid ${border}`,
                display: 'inline-block'
              }} />
                <span className="font-heading" style={{
                fontSize: '12px',
                lineHeight: '16px',
                color: tokens.text.muted
              }}>
                  {label}
                </span>
              </div>)}
          </div>

          {/* Figma layer: "Legend/Row2" — Required badge legend */}
          <div className="flex items-center justify-center" style={{
            marginTop: '8px'
          }}>
            <div className="flex items-center" style={{
              gap: '4px'
            }}>
              <span className="flex items-center justify-center" style={{
                width: '12px',
                height: '14px',
                borderRadius: '9999px',
                backgroundColor: tokens.semantic.errorDot,
                border: `1px solid ${tokens.surface.white}`,
                boxShadow: '0px 1px 2px rgba(0,0,0,0.05)',
                display: 'inline-flex'
              }}>
                <span className="font-heading font-bold" style={{
                  fontSize: '8px',
                  color: tokens.text.inverse
                }}>
                  !
                </span>
              </span>
              <span className="font-heading" style={{
                fontSize: '12px',
                lineHeight: '16px',
                color: tokens.text.muted
              }}>
                Required
              </span>
            </div>
          </div>
        </div>

        {/* Figma layer: "Nav/Actions" */}
        <div style={{
          padding: '12px 12px 0 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <Button label={isFlaggedCurrent ? 'Unflag Question' : 'Flag for Review'} variant="secondary" icon={<FlagIcon style={{
            width: '14px',
            height: '14px'
          }} />} onClick={onToggleFlag} className={`w-full ${isFlaggedCurrent ? '!border-amber-400 !text-amber-600 !bg-amber-50' : ''}`} />
          <Button label="Submit Exam" variant="primary" onClick={onSubmit} className="w-full" />
        </div>

        {/* Figma layer: "Nav/ProgressFooter" */}
        <div style={{
          padding: '12px',
          marginTop: '4px',
          borderTop: `1px solid ${tokens.border.default}`
        }}>
          {/* Figma layer: "StatsRow" */}
          <div className="flex items-center justify-between" style={{
            marginBottom: '8px'
          }}>
            {[`Answered: ${answeredCount}`, `Flagged: ${flaggedCount}`, `Skipped: ${skippedCount}`].map((label) => <span key={label} className="font-heading" style={{
              fontSize: '14px',
              lineHeight: '20px',
              color: tokens.text.muted
            }}>
                {label}
              </span>)}
          </div>

          {/* Figma layer: "ProgressBar" */}
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: tokens.border.default,
            borderRadius: '9999px',
            overflow: 'hidden'
          }}>
            {/* Figma layer: "ProgressFill" */}
            <div className="transition-all duration-300" style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: tokens.brand.primary,
              borderRadius: '9999px'
            }} />
          </div>
        </div>
      </div>
    </div>);

}