// components/assessment-builder/add-questions-input.tsx
'use client'

import { useRef, useState } from 'react'
import { Button } from '@exxatdesignux/ui'
import type { AddMode } from '@/lib/add-questions-types'

export interface AddQuestionsInputProps {
  mode: AddMode
  query: string
  onModeChange: (mode: AddMode) => void
  onQueryChange: (query: string) => void
  /** Called when user is in AI mode and clicks Generate */
  onAiGenerate: (prompt: string, pdfFile?: File) => void
}

export function AddQuestionsInput({
  mode,
  query,
  onModeChange,
  onQueryChange,
  onAiGenerate,
}: AddQuestionsInputProps) {
  const [aiFile, setAiFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const isAiMode = mode === 'ai'
  const isQbMode = mode === 'qb'
  const sendDisabled = !query.trim()

  const placeholder = isAiMode
    ? 'Describe what to test — topics, cases, concepts…'
    : 'Search or generate questions…'

  const activeBorder =
    isAiMode || isQbMode
      ? 'border-[var(--brand-color)]'
      : 'border-[var(--border)]'

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    onQueryChange(val)
    if (!isAiMode) {
      onModeChange(val.trim() ? 'qb' : 'resting')
    }
  }

  function handleSparkClick() {
    onModeChange(isAiMode ? 'resting' : 'ai')
    onQueryChange('')
    setAiFile(null)
  }

  function handleSend() {
    if (!sendDisabled && isAiMode) {
      onAiGenerate(query, aiFile ?? undefined)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && isAiMode && !sendDisabled) {
      handleSend()
    }
    if (e.key === 'Escape') {
      onModeChange('resting')
      onQueryChange('')
    }
  }

  return (
    <div className="px-3 py-2 border-b border-[var(--border)]">
      {/* Input row */}
      <div
        className={`flex items-center gap-2 rounded-md border ${activeBorder} px-2 h-9 bg-[var(--background)] transition-colors`}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSparkClick}
          aria-label={isAiMode ? 'Exit AI mode' : 'Switch to AI generate mode'}
          className="shrink-0 w-5 h-5 p-0"
          style={{ color: isAiMode ? 'var(--brand-color)' : 'var(--muted-foreground)' }}
        >
          <i className="fa-regular fa-sparkles text-xs" aria-hidden="true" />
        </Button>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
          aria-label={isAiMode ? 'AI generate prompt' : 'Search question bank'}
          autoComplete="off"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSend}
          disabled={sendDisabled || !isAiMode}
          aria-label="Generate questions"
          className="shrink-0 w-5 h-5 p-0 disabled:opacity-30"
          style={{ color: (sendDisabled || !isAiMode) ? 'var(--muted-foreground)' : 'var(--brand-color)' }}
        >
          <i className="fa-regular fa-arrow-right text-xs" aria-hidden="true" />
        </Button>
      </div>

      {/* AI toolbar — only in AI mode */}
      {isAiMode && (
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs gap-1 px-2"
              onClick={() => fileRef.current?.click()}
            >
              <i className="fa-regular fa-paperclip text-xs" aria-hidden="true" />
              {aiFile
                ? aiFile.name.length > 18
                  ? aiFile.name.slice(0, 18) + '…'
                  : aiFile.name
                : 'Attach'}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="sr-only"
              aria-label="Attach PDF as AI context"
              onChange={e => setAiFile(e.target.files?.[0] ?? null)}
            />
            <span className="text-xs text-[var(--muted-foreground)]">
              AI infers count, type &amp; difficulty
            </span>
          </div>
          <Button
            variant="default"
            size="sm"
            className="h-6 text-xs px-2 gap-1"
            disabled={sendDisabled}
            onClick={handleSend}
          >
            <i className="fa-regular fa-sparkles text-xs" aria-hidden="true" />
            Generate
          </Button>
        </div>
      )}
    </div>
  )
}
