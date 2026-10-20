/** Hands bytes to the browser as a file the person can save. Client only. */
export function downloadBytes(name: string, mime: string, bytes: Uint8Array | string): void {
  const blob = new Blob([typeof bytes === "string" ? bytes : (bytes as BlobPart)], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** A file name that is safe on every system: lower case words joined by hyphens. */
export function fileSlug(...parts: string[]): string {
  return parts
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
