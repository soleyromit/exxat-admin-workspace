'use client'

import { useState } from 'react'

type Role = 'admin' | 'faculty'

export interface RoleToggleProps {
  onChange?: (role: Role) => void
}

export function RoleToggle({ onChange }: RoleToggleProps) {
  const [role, setRole] = useState<Role>('admin')

  function handleSelect(selected: Role) {
    setRole(selected)
    onChange?.(selected)
  }

  return (
    <div
      className="flex overflow-hidden rounded-md"
      style={{ border: '1px solid var(--border)' }}
      role="group"
      aria-label="Role switcher"
    >
      {(['admin', 'faculty'] as const).map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={role === r}
          onClick={() => handleSelect(r)}
          className="px-4 py-1.5 text-sm font-medium capitalize transition-colors"
          style={{
            backgroundColor:
              role === r ? 'var(--primary)' : 'transparent',
            color:
              role === r ? 'var(--primary-foreground)' : 'var(--foreground)',
          }}
        >
          {r === 'admin' ? 'Admin' : 'Faculty'}
        </button>
      ))}
    </div>
  )
}
