import React from 'react';
/**
 * NextButton — Exxat Exam Management
 *
 * FIGMA LAYER GUIDE
 * ─────────────────
 * NextButton                  [Frame, Auto Layout horizontal, hug×hug]
 *   ├── Label                 [Text, Source Sans 3 SemiBold 14px]
 *   └── TrailingIcon          [Instance: Icon/ChevronRight, 14×14]
 *
 * FIGMA VARIANTS
 *   state: default | hover | disabled
 *
 * TOKEN USAGE
 *   bg        → Brand/Primary (#E4077D)
 *   bg hover  → Brand/PrimaryHover (#C9026D)
 *   text      → Text/Inverse (#FFFFFF)
 *   border    → Brand/Primary (#E4077D)
 */
import { ChevronRightIcon } from 'lucide-react';
import { tokens } from '../tokens/design-tokens';
export interface NextButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}
export function NextButton({
  label = 'Next',
  onClick,
  disabled = false,
  className = ''
}: NextButtonProps) {
  return (
    // Figma layer: "NextButton"
    <button type="button" onClick={onClick} disabled={disabled} className={`
        inline-flex items-center justify-center
        font-heading font-semibold rounded-lg
        transition-all duration-150 select-none
        hover:opacity-90 active:opacity-80
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${className}
      `} style={{
      height: '40px',
      padding: '0 18px',
      fontSize: '14px',
      gap: '6px',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      backgroundColor: tokens.brand.primary,
      color: tokens.text.inverse,
      border: `1px solid ${tokens.brand.primary}`
    }}>
      {/* Figma layer: "Label" */}
      {label}

      {/* Figma layer: "TrailingIcon" */}
      <ChevronRightIcon style={{
        width: '14px',
        height: '14px',
        flexShrink: 0
      }} />
    </button>);

}