/**
 * Button — Exxat Exam Management (DS-wrapped).
 *
 * Wraps the DS `Button` from @exxat/ds while preserving the engine-local API
 * (`label`, `icon`, `leadingIcon`, etc.) so every existing consumer in the
 * exam engine picks up DS styling without touching a single callsite.
 *
 * Variant mapping (engine → DS):
 *   primary   → DS `default`  (dark primary — standard DS treatment)
 *   secondary → DS `outline`  (bordered, neutral)
 *   ghost     → DS `ghost`
 *   danger    → DS `destructive`
 *
 * Size mapping (engine → DS):
 *   sm → sm  ·  md → default (h-9)  ·  lg → lg (h-10)
 */

import React from 'react'
import { Button as DSButton } from '@exxatdesignux/ui'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize    = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode    // trailing icon
  leadingIcon?: boolean      // chevron-left (Previous nav)
  disabled?: boolean
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
  'aria-label'?: string
}

const VARIANT_MAP: Record<ButtonVariant, React.ComponentProps<typeof DSButton>['variant']> = {
  primary:   'default',
  secondary: 'outline',
  ghost:     'ghost',
  danger:    'destructive',
}

const SIZE_MAP: Record<ButtonSize, React.ComponentProps<typeof DSButton>['size']> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  label,
  variant = 'secondary',
  size = 'md',
  icon,
  leadingIcon = false,
  disabled = false,
  onClick,
  className,
  type = 'button',
  'aria-label': ariaLabel,
}, ref) {
  return (
    <DSButton
      ref={ref}
      type={type}
      variant={VARIANT_MAP[variant]}
      size={SIZE_MAP[size]}
      disabled={disabled}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
    >
      {leadingIcon && (
        <i
          className="fa-light fa-chevron-left"
          aria-hidden="true"
          style={{ fontSize: 14, flexShrink: 0 }}
        />
      )}
      {label}
      {icon && !leadingIcon && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>
      )}
    </DSButton>
  )
})
