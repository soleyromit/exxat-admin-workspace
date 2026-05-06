/**
 * NextButton — Exxat Exam Management (DS-wrapped).
 *
 * Brand-pink "Next" CTA used during exam navigation. Wraps DS `Button` and
 * overrides bg/color to use `--brand-color` because the DS `default` token
 * resolves to dark gray in theme-prism — we keep the original brand-filled
 * intent of this CTA.
 */

import { Button as DSButton } from '@exxat/ds/packages/ui/src'

export interface NextButtonProps {
  label?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function NextButton({
  label = 'Next',
  onClick,
  disabled = false,
  className,
}: NextButtonProps) {
  return (
    <DSButton
      type="button"
      variant="default"
      size="default"
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{
        backgroundColor: 'var(--brand-color)',
        color: 'var(--brand-foreground)',
        borderColor: 'var(--brand-color)',
      }}
    >
      {label}
      <i
        className="fa-light fa-chevron-right"
        aria-hidden="true"
        style={{ fontSize: 14, flexShrink: 0 }}
      />
    </DSButton>
  )
}
