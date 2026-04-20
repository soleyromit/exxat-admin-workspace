'use client'
import { useQB } from './qb-state'
import {
  Button, Badge, useSidebar,
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuItem,
  Tooltip, TooltipContent, TooltipTrigger,
} from '@exxat/ds/packages/ui/src'
import type { Persona } from '@/lib/qb-types'

const TRUST_COLORS = { senior: 'var(--qb-trust-senior-color)', mid: 'var(--qb-trust-mid-color)', junior: 'var(--qb-trust-junior-color)' }
const TRUST_LABELS = { senior: 'Senior', mid: 'Mid', junior: 'Junior' }
const TRUST_BG = { senior: 'var(--qb-trust-senior-bg)', mid: 'var(--qb-trust-mid-bg)', junior: 'var(--muted)' }

export function QBHeader() {
  const { selectedFolder, currentPersona, setCurrentPersona, personas } = useQB()
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
      {/* Left: sidebar toggle + breadcrumb */}
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

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
            Question Bank
          </span>
          {selectedFolder && (
            <>
              <i className="fa-light fa-chevron-right" aria-hidden="true"
                style={{ fontSize: 10, color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <span style={{
                fontSize: 13, fontWeight: 500, color: 'var(--foreground)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {selectedFolder.name}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right: persona switcher + Ask Leo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Persona switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-1.5 h-auto px-2 py-1 border border-border rounded-lg"
            >
              <span style={{
                width: 26, height: 26, borderRadius: '50%',
                backgroundColor: currentPersona.color,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: 'var(--primary-foreground)', flexShrink: 0,
              }}>
                {currentPersona.initials}
              </span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }}>
                {currentPersona.name}
              </span>
              <Badge variant="secondary">{currentPersona.role}</Badge>
              <i className="fa-light fa-chevron-down" aria-hidden="true"
                style={{ fontSize: 10, color: 'var(--muted-foreground)' }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch Persona</DropdownMenuLabel>
            {personas.map(p => (
              <DropdownMenuItem
                key={p.id}
                aria-selected={p.id === currentPersona.id}
                onClick={() => setCurrentPersona(p)}
                style={{ backgroundColor: p.id === currentPersona.id ? 'var(--accent)' : undefined }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  backgroundColor: p.color,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--primary-foreground)', flexShrink: 0,
                }}>
                  {p.initials}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{p.role}</span>
                    {p.trustLevel && (
                      <Badge variant="secondary" style={{
                        fontSize: 9, padding: '1px 5px',
                        backgroundColor: TRUST_BG[p.trustLevel],
                        color: TRUST_COLORS[p.trustLevel],
                      }}>
                        {TRUST_LABELS[p.trustLevel]}
                      </Badge>
                    )}
                  </div>
                </div>
                {p.id === currentPersona.id && (
                  <i className="fa-solid fa-check" aria-hidden="true"
                    style={{ fontSize: 12, color: 'var(--brand-color)' }} />
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
