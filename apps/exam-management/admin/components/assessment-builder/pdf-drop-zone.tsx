// components/assessment-builder/pdf-drop-zone.tsx
'use client'

import { useRef, useState } from 'react'
import { Button } from '@exxatdesignux/ui'

interface PdfDropZoneProps {
  onFile: (file: File) => void
  onCancel: () => void
}

export function PdfDropZone({ onFile, onCancel }: PdfDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div className="border-b border-[var(--border)] bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <span className="text-xs font-medium text-[var(--foreground)]">
          Import from PDF
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label="Cancel PDF import"
          className="w-6 h-6"
        >
          <i className="fa-regular fa-xmark text-xs" aria-hidden="true" />
        </Button>
      </div>

      {/* Drop area */}
      <div className="px-4 py-4">
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={[
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 transition-colors cursor-pointer',
            isDragging
              ? 'border-[var(--brand-color)] bg-[var(--brand-tint)]'
              : 'border-[var(--border)] hover:border-[var(--brand-color)]',
          ].join(' ')}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Drop PDF here or click to browse"
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        >
          <i
            className="fa-regular fa-file-pdf text-3xl text-[var(--muted-foreground)]"
            aria-hidden="true"
          />
          <div className="text-center">
            <p className="text-sm text-[var(--foreground)]">
              Drop lecture slides or exam doc
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              PDF · DOCX · PPTX — 50 MB max
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs mt-1"
            onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
          >
            Browse files
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx"
          className="sr-only"
          aria-label="Select file to import"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  )
}
