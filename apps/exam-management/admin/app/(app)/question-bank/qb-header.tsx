'use client'
import { useQB } from './qb-state'
import {
  Button, Badge, useSidebar,
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuItem,
  Tooltip, TooltipContent, TooltipTrigger,
  Avatar, AvatarFallback,
} from '@exxat/ds/packages/ui/src'
import type { Persona } from '@/lib/qb-types'

export function QBHeader() {
  const { currentPersona, setCurrentPersona, personas } = useQB()
  const { toggleSidebar, state: sidebarState } = useSidebar()

  return (
    <header style={{
      height: 44,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px',
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--background)',
      flexShrink: 0,
      gap: 8,
    }}>
      {/* Left: sidebar toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              aria-label={sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}
              style={{ color: sidebarState !== 'collapsed' ? 'var(--foreground)' : 'var(--muted-foreground)', flexShrink: 0 }}
            >
              <i className="fa-light fa-sidebar" aria-hidden="true" style={{ fontSize: 16 }} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}</TooltipContent>
        </Tooltip>

        <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} />
      </div>

      {/* Right: persona switcher + Ask Leo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Persona switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 h-8 px-2"
              aria-label="Switch persona"
            >
              <Avatar style={{ width: 24, height: 24 }}>
                <AvatarFallback style={{ backgroundColor: currentPersona.color, color: 'var(--primary-foreground)', fontSize: 9, fontWeight: 700 }}>
                  {currentPersona.initials}
                </AvatarFallback>
              </Avatar>
              <span style={{ fontSize: 12, fontWeight: 500 }}>
                {currentPersona.name}
              </span>
              <Badge variant="secondary" className="rounded" style={{ fontSize: 10 }}>
                {currentPersona.role}
              </Badge>
              <i className="fa-light fa-chevron-down" aria-hidden="true"
                style={{ fontSize: 10, color: 'var(--muted-foreground)' }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch Persona</DropdownMenuLabel>
            {personas.map(p => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => setCurrentPersona(p)}
              >
                <Avatar style={{ width: 24, height: 24 }}>
                  <AvatarFallback style={{ backgroundColor: p.color, color: 'var(--primary-foreground)', fontSize: 9, fontWeight: 700 }}>
                    {p.initials}
                  </AvatarFallback>
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{p.role}</div>
                </div>
                {p.id === currentPersona.id && (
                  <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 11, color: 'var(--brand-color)' }} />
                )}
              </DropdownMenuItem>
            ))}
            <div style={{ margin: '4px 12px 4px', padding: '8px 0 0', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
                Trust level determines auto-approval behavior for new questions.
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Ask Leo — outline sm, star-christmas icon, brand-color */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-medium"
          aria-label="Ask Leo AI"
        >
          <i className="fa-duotone fa-solid fa-star-christmas text-xs" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
          Ask Leo
        </Button>
      </div>
    </header>
  )
}
