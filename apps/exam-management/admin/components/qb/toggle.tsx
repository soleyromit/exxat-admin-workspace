'use client'

/**
 * QBToggle — product-level toggle switch replacing DS ToggleSwitch.
 *
 * WHY: DS ToggleSwitch renders `border-2 border-input` which produces a large
 * gray ring around the track on white and brand-tinted surfaces. This component
 * uses DS tokens directly (--brand-color track, neutral OFF track, --background
 * thumb) with no border ring.
 *
 * Documented hand-roll: docs/governance/ds-adoption.md → QB ToggleSwitch exception.
 */

export function QBToggle({
  checked,
  onChange,
  id,
  disabled = false,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  id?: string
  disabled?: boolean
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 36,
        height: 20,
        borderRadius: 99,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        padding: 2,
        backgroundColor: checked
          ? 'var(--brand-color)'
          : 'oklch(0.78 0 0)',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color 150ms ease',
        outline: 'none',
        boxSizing: 'border-box',
      }}
      onFocus={e => {
        if (!disabled) e.currentTarget.style.outline = '2px solid var(--ring)'
      }}
      onBlur={e => { e.currentTarget.style.outline = 'none' }}
    >
      <span style={{
        display: 'block',
        width: 16,
        height: 16,
        borderRadius: '50%',
        backgroundColor: 'oklch(1 0 0)',
        boxShadow: '0 1px 2px oklch(0 0 0 / 0.2)',
        transform: checked ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform 150ms ease',
        flexShrink: 0,
      }} />
    </button>
  )
}
