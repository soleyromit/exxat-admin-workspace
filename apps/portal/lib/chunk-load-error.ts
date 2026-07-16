/**
 * Detects a webpack / Next.js dynamic-chunk load failure (typically a stale
 * deploy or flaky network dropping a lazily-loaded bundle), so the error
 * boundary can offer a hard reload instead of a generic crash.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const { name, message } = error as { name?: string; message?: string }
  if (name === "ChunkLoadError") return true
  return typeof message === "string" && /Loading chunk [\w-]+ failed/i.test(message)
}
