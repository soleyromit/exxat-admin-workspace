'use client'

import * as React from 'react'

interface OsFolderGlyphProps {
  colorClass?: string
  className?: string
  [key: string]: unknown
}

export function OsFolderGlyph({ colorClass, className, ...props }: OsFolderGlyphProps) {
  return (
    <span
      className={[colorClass, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      {...(props as React.HTMLAttributes<HTMLSpanElement>)}
    >
      <i className="fa-light fa-folder" />
    </span>
  )
}
