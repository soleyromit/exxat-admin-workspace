'use client'

import { useState } from 'react'
import { Button } from '@exxat/ds/packages/ui/src'

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
        <Button
          key={r}
          variant="ghost"
          size="sm"
          aria-pressed={role === r}
          onClick={() => handleSelect(r)}
          className={`px-4 rounded-none capitalize font-medium${role === r ? ' text-primary-foreground' : ''}`}
          style={{
            backgroundColor: role === r ? 'var(--primary)' : 'transparent',
          }}
        >
          {r === 'admin' ? 'Admin' : 'Faculty'}
        </Button>
      ))}
    </div>
  )
}
