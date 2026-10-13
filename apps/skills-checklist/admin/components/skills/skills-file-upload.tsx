"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"

/**
 * One-file hand-roll (the DS has no FileUpload or Dropzone; PCE only has inline inputs). A hidden native input is
 * triggered by a DS Button, which keeps keyboard and screen reader behaviour native. IM-02: spreadsheets, documents
 * and PDFs; no template or column order is required (IM-03).
 */
export const IMPORT_ACCEPT = ".csv,.xlsx,.xls,.docx,.doc,.pdf,.txt,.md"

export interface SkillsFileUploadProps {
  onFile: (file: File) => void
  label: string
  description?: string
  accept?: string
  disabled?: boolean
  id?: string
  /** Name of the chosen file, shown after selection. */
  fileName?: string | null
}

export function SkillsFileUpload({ onFile, label, description, accept = IMPORT_ACCEPT, disabled, id, fileName }: SkillsFileUploadProps) {
  const ref = React.useRef<HTMLInputElement>(null)
  const descId = description ? `${id ?? "file"}-desc` : undefined
  return (
    <div className="flex flex-col items-start gap-2">
      <input
        ref={ref}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        aria-label={label}
        aria-describedby={descId}
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = "" // allow choosing the same file again
        }}
      />
      <Button type="button" variant="outline" size="default" disabled={disabled} onClick={() => ref.current?.click()}>
        {label}
      </Button>
      {description ? (
        <p id={descId} className="text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {fileName ? <p className="text-sm text-foreground">{fileName}</p> : null}
    </div>
  )
}

/**
 * Text formats can be read in the browser. Spreadsheets, documents and PDFs return null: parsing them needs a server
 * or a parser dependency that is out of scope here, and the surface must show the "could not be read" error (S-08).
 */
export async function readTextFile(file: File): Promise<string | null> {
  if (!/\.(csv|txt|md)$/i.test(file.name) && !file.type.startsWith("text/")) return null
  if (typeof file.text === "function") return file.text()
  // FileReader fallback for environments without Blob.text (older browsers, jsdom).
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result ?? ""))
    r.onerror = () => reject(r.error)
    r.readAsText(file)
  })
}
