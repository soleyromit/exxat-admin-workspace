"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { DialogDescription, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { SkillsFileUpload, readTextFile } from "@/components/skills"
import { fetchImportStatus, extractFileOnServer } from "@/lib/import-ai/client-api"
import { importAiCopy, surface } from "@/lib/copy"
import { r2i, SAMPLE_LIST } from "@/lib/copy/r2-import"

/** What the review step needs to propose a list. The interpretation itself is the store's proposeImport. */
export interface ImportSource {
  text: string
  sourceName: string
  sourceKind: "paste" | "file"
  columns?: boolean
  skipHeader?: boolean
  /** The admin turned on the optional AI reading for this import (default off; shown only when the server says it is available). */
  useAi?: boolean
}

/** Missing from docs/ux/09 S-08 (flagged in the contract): empty-submit message. [INFER] */
export const CHOOSE_SOURCE = "Choose a file or paste a list."

export interface ImportInputStepProps {
  onRead: (source: ImportSource) => void
  onCancel: () => void
  /** Externally supplied error (for example a parse failure reported by the caller). */
  error?: string | null
  /** The caller is reading the list (the AI reading can take a moment). Cancel aborts it. */
  reading?: boolean
}

/**
 * Pasted comma-separated text (a header row such as "Skill,Description,Category") is read as columns and the header line is skipped
 * by the store (`columns` and `skipHeader`); line numbers still count it, so "Line 9" means line 9 of what was pasted (IM-08).
 */
export function preparePaste(text: string): Pick<ImportSource, "text" | "sourceName" | "columns" | "skipHeader"> {
  const first = text.split(/\r?\n/).find((l) => l.trim().length > 0)
  if (first !== undefined && /^(skill|name)\s*,/i.test(first.trim())) return { text, sourceName: "pasted list", columns: true, skipHeader: true }
  return { text, sourceName: "pasted list" }
}

/**
 * P-06 step 1, inside the 1024px import dialog: the info bar, the "Upload a file" card and the "Or paste the list" card
 * (IM-01, IM-02, IM-03). No template or column order is asked for. Exactly one filled primary: "Read the list". Spreadsheets,
 * documents and PDFs are accepted as sources; the browser can only read text formats today, so any other file shows the
 * "could not be read" state and the pasted text is kept (nothing is faked, IM-13).
 */
export function ImportInputStep({ onRead, onCancel, error, reading = false }: ImportInputStepProps) {
  const [text, setText] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [extracting, setExtracting] = React.useState(false)
  const busy = extracting || reading
  const [aiOffered, setAiOffered] = React.useState(false)
  const [useAi, setUseAi] = React.useState(false)
  const shown = message ?? error ?? null

  // The AI switch exists only when the server reports the assist available (a key is configured). Failure means "not offered".
  React.useEffect(() => {
    const ctl = new AbortController()
    fetchImportStatus(ctl.signal).then((st) => setAiOffered(st.ai))
    return () => ctl.abort()
  }, [])

  const read = async () => {
    setMessage(null)
    if (file) {
      const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? ""
      setExtracting(true)
      try {
        // Spreadsheets, documents and PDFs are read on the server by code (no AI, no key needed). Text files stay in the browser.
        if (["xlsx", "docx", "pdf", "xls", "doc"].includes(ext)) {
          if (ext === "xls" || ext === "doc") {
            setMessage(importAiCopy.fileTypeUnsupported)
            return
          }
          const r = await extractFileOnServer(file)
          if (!r.ok) {
            setMessage(
              r.error === "unsupported" ? importAiCopy.fileTypeUnsupported : r.error === "too_large" ? importAiCopy.fileTooLarge : r.error === "unreadable" ? importAiCopy.fileNoText : r.error === "empty" ? surface.s08.errorNothing : importAiCopy.fileReaderUnavailable,
            )
            return
          }
          onRead({ text: r.text, sourceName: r.sourceName, sourceKind: "file", columns: r.columns, skipHeader: r.skipHeader, useAi: aiOffered && useAi })
          return
        }
        const content = await readTextFile(file)
        if (content === null) {
          setMessage(surface.s08.errorUnreadable)
          return
        }
        if (!content.trim()) {
          setMessage(surface.s08.errorNothing)
          return
        }
        onRead({ text: content, sourceName: file.name, sourceKind: "file", useAi: aiOffered && useAi })
      } catch {
        setMessage(surface.s08.errorUnreadable)
      } finally {
        setExtracting(false)
      }
      return
    }
    if (!text.trim()) {
      setMessage(CHOOSE_SOURCE)
      return
    }
    onRead({ ...preparePaste(text), sourceKind: "paste", useAi: aiOffered && useAi })
  }

  return (
    <>
      <DialogHeader className="shrink-0 border-b border-border p-4 pe-12">
        <DialogTitle className="text-base font-semibold">{r2i.title}</DialogTitle>
        <DialogDescription>{r2i.subtitle}</DialogDescription>
      </DialogHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <LocalBanner variant="info">{r2i.info}</LocalBanner>
        {shown ? <LocalBanner variant="error" retry={{ label: "Try again", onClick: read }}>{shown}</LocalBanner> : null}
        <Card size="sm" aria-labelledby="import-upload-title">
          <CardHeader>
            <CardTitle asChild className="text-sm font-semibold">
              <h3 id="import-upload-title">
                <i className="fa-light fa-arrow-up-from-bracket mr-2" aria-hidden="true" />
                {r2i.upload.title}
              </h3>
            </CardTitle>
            <CardDescription>{r2i.upload.body}</CardDescription>
          </CardHeader>
          <CardContent>
            <SkillsFileUpload
              id="import-file"
              label={r2i.upload.choose}
              fileName={file?.name ?? null}
              onFile={(f) => {
                setFile(f)
                setMessage(null)
              }}
              disabled={busy}
            />
          </CardContent>
        </Card>
        <Card size="sm" aria-labelledby="import-paste-title">
          <CardHeader>
            <CardTitle asChild className="text-sm font-semibold">
              <h3 id="import-paste-title">
                <i className="fa-light fa-file-lines mr-2" aria-hidden="true" />
                {r2i.paste.title}
              </h3>
            </CardTitle>
            <CardDescription>{r2i.paste.body}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Field>
              <FieldLabel htmlFor="import-paste" className="sr-only">
                Pasted skills list
              </FieldLabel>
              <Textarea id="import-paste" rows={7} value={text} placeholder={r2i.paste.placeholder} onChange={(e) => setText(e.target.value)} />
            </Field>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setText(SAMPLE_LIST)
                  setFile(null)
                  setMessage(null)
                }}
              >
                {r2i.paste.sample}
              </Button>
            </div>
          </CardContent>
        </Card>
        {aiOffered ? (
          <Card size="sm" aria-labelledby="import-ai-title">
            <CardContent className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h3 id="import-ai-title" className="text-sm font-semibold text-foreground">
                  {importAiCopy.switchLabel}
                </h3>
                <p id="import-ai-help" className="text-sm text-muted-foreground">
                  {importAiCopy.switchHelp}
                </p>
              </div>
              <ToggleSwitch id="import-ai" checked={useAi} onChange={setUseAi} disabled={busy} aria-labelledby="import-ai-title import-ai-help" />
            </CardContent>
          </Card>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border p-4">
        <Button type="button" variant="outline" size="default" onClick={onCancel}>
          {r2i.cancel}
        </Button>
        <Button type="button" variant="default" size="default" onClick={read} aria-busy={busy} disabled={busy}>
          {reading ? importAiCopy.reading : r2i.read}
        </Button>
      </div>
    </>
  )
}
