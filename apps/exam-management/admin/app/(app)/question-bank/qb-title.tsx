'use client'
import type { ReactNode } from 'react'
import { useQB } from './qb-state'
import {
  Button, Badge,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@exxat/ds/packages/ui/src'

export function QBTitle() {
  const { selectedFolder, visibleQuestions, currentPersona, navView } = useQB()

  const isAdmin = currentPersona.role === 'Admin'
  const title = selectedFolder?.name ?? (navView === 'my' ? 'My Questions' : 'All Questions')
  const count = visibleQuestions.length

  // Folder type badge
  let folderTypeBadge: ReactNode = null
  if (selectedFolder?.locked) {
    folderTypeBadge = (
      <Badge
        variant="secondary"
        className="rounded-full ml-2"
        style={{
          fontSize: 9, fontWeight: 600, padding: '2px 7px',
          backgroundColor: 'color-mix(in oklch, var(--qb-locked) 15%, var(--background))',
          color: 'var(--qb-locked)',
        }}
      >
        <i className="fa-light fa-lock" aria-hidden="true" style={{ fontSize: 8 }} /> Locked
      </Badge>
    )
  } else if (selectedFolder?.isPrivateSpace) {
    folderTypeBadge = (
      <Badge
        variant="secondary"
        className="rounded-full ml-2"
        style={{
          fontSize: 9, fontWeight: 600, padding: '2px 7px',
          backgroundColor: 'color-mix(in oklch, var(--qb-private) 12%, var(--background))',
          color: 'var(--qb-private)',
        }}
      >
        <i className="fa-light fa-lock-keyhole" aria-hidden="true" style={{ fontSize: 8 }} /> Private Space
      </Badge>
    )
  } else if (selectedFolder?.isQuestionSet) {
    folderTypeBadge = (
      <Badge
        variant="secondary"
        className="rounded-full ml-2"
        style={{
          fontSize: 9, fontWeight: 600, padding: '2px 7px',
          backgroundColor: 'color-mix(in oklch, var(--qb-question-set) 12%, var(--background))',
          color: 'var(--qb-question-set)',
        }}
      >
        <i className="fa-light fa-rectangle-list" aria-hidden="true" style={{ fontSize: 8 }} /> Question Set
      </Badge>
    )
  }

  return (
    <div style={{
      padding: '10px 16px 8px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      {/* Left: title + subtitle */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 22, fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--foreground)',
            margin: 0,
          }}>
            {title}
          </h1>
          {folderTypeBadge}
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
          {count} questions · Last updated now
        </p>
      </div>

      {/* Right: Write split button + ⋯ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* New question button */}
        <Button variant="default" size="lg" onClick={() => {}}>
          <i className="fa-light fa-plus" aria-hidden="true" />
          New question
        </Button>

        {/* ⋯ overflow button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label="More options">
              <i className="fa-regular fa-ellipsis" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {isAdmin && (
              <>
                <DropdownMenuItem onClick={() => {}}>
                  <i className="fa-regular fa-user-plus" aria-hidden="true" />
                  Assign Faculty
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => {}}>
              <i className="fa-regular fa-arrow-up-from-bracket" aria-hidden="true" />
              Import Questions
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              <i className="fa-regular fa-arrow-down-to-line" aria-hidden="true" />
              Export Questions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {}}>
              <i className="fa-regular fa-gear" aria-hidden="true" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
