import React from 'react';
/**
 * Button — Exxat Exam Management
 *
 * FIGMA LAYER GUIDE
 * ─────────────────
 * Button                      [Frame, Auto Layout horizontal, hug×hug]
 *   ├── LeadingIcon?          [Instance: Icon/ChevronLeft, 14×14]
 *   ├── Label                 [Text, Source Sans 3 SemiBold]
 *   └── TrailingIcon?         [Instance: any Lucide icon, 14×14]
 *
 * FIGMA VARIANTS
 *   variant:  primary | secondary | ghost | danger
 *   size:     sm | md | lg
 *   state:    default | hover | disabled
 *   hasLeadingIcon:  true | false
 *   hasTrailingIcon: true | false
 *
 * TOKEN USAGE
 *   primary bg      → Brand/Primary (#E4077D)
 *   primary hover   → Brand/PrimaryHover (#C9026D)
 *   secondary bg    → Surface/White (#FFFFFF)
 *   secondary border→ Border/Medium (#CBD5E1)
 *   text on primary → Text/Inverse (#FFFFFF)
 *   text on secondary → Text/Secondary (#334155)
 */
import { ChevronLeftIcon } from 'lucide-react';
import { tokens } from '../tokens/design-tokens';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode; // trailing icon
  leadingIcon?: boolean; // chevron-left (Previous nav)
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}
// ─── Size scale ───────────────────────────────────────────────────────────────
const SIZE: Record<ButtonSize, {
  height: string;
  px: string;
  fontSize: string;
  gap: string;
}> = {
  sm: {
    height: '34px',
    px: '14px',
    fontSize: '13px',
    gap: '6px'
  },
  md: {
    height: '40px',
    px: '18px',
    fontSize: '14px',
    gap: '7px'
  },
  lg: {
    height: '46px',
    px: '22px',
    fontSize: '15px',
    gap: '8px'
  }
};
// ─── Variant styles (all values from design-tokens.ts) ───────────────────────
const VARIANT_STYLE: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: tokens.brand.primary,
    color: tokens.text.inverse,
    border: `1px solid ${tokens.brand.primary}`
  },
  secondary: {
    backgroundColor: tokens.surface.white,
    color: tokens.text.secondary,
    border: `1px solid ${tokens.border.medium}`
  },
  ghost: {
    backgroundColor: 'transparent',
    color: tokens.text.muted,
    border: '1px solid transparent'
  },
  danger: {
    backgroundColor: tokens.semantic.errorBg,
    color: tokens.semantic.errorText,
    border: `1px solid ${tokens.semantic.errorBorder}`
  }
};
// Tailwind hover classes (can't use CSS vars in tw arbitrary directly)
const VARIANT_HOVER: Record<ButtonVariant, string> = {
  primary: 'hover:opacity-90',
  secondary: 'hover:bg-slate-50 hover:border-slate-300',
  ghost: 'hover:bg-slate-100',
  danger: 'hover:bg-red-100'
};
export function Button({
  label,
  variant = 'secondary',
  size = 'md',
  icon,
  leadingIcon = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button'
}: ButtonProps) {
  const sz = SIZE[size];
  return (
    // Figma layer: "Button"
    <button type={type} onClick={onClick} disabled={disabled} className={`
        inline-flex items-center justify-center
        font-heading font-semibold rounded-lg
        transition-all duration-150 select-none cursor-pointer
        ${VARIANT_HOVER[variant]}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `} style={{
      height: sz.height,
      padding: `0 ${sz.px}`,
      fontSize: sz.fontSize,
      gap: sz.gap,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      ...VARIANT_STYLE[variant]
    }}>
      {/* Figma layer: "LeadingIcon" — present only when leadingIcon=true */}
      {leadingIcon && <ChevronLeftIcon style={{
        width: '14px',
        height: '14px',
        flexShrink: 0
      }} />}

      {/* Figma layer: "Label" */}
      {label}

      {/* Figma layer: "TrailingIcon" — present only when icon is passed */}
      {icon && !leadingIcon && <span style={{
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0
      }}>
          {icon}
        </span>}
    </button>);

}