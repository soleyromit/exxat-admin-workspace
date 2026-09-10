/**
 * Detect stale module / chunk failures across bundlers.
 *
 * Catches:
 *   - Webpack / Turbopack: "ChunkLoadError", "Failed to load chunk",
 *     "Loading chunk".
 *   - Vite: "Failed to fetch dynamically imported module",
 *     "Importing binding name", "does not provide an export named",
 *     "Outdated Optimize Dep".
 *
 * Used by `DevChunkLoadRecovery` to auto-reload on stale chunks after a
 * dev-server rebuild, instead of stranding the user on a blank shell.
 */

export const DEV_CHUNK_RELOAD_FLAG = "exxat-ds:chunk-reload-attempted"
export const DEV_CHUNK_RELOAD_COOLDOWN_MS = 4000

function errorText(error: unknown): { name: string; message: string } {
  if (typeof error === "string") {
    return { name: "", message: error }
  }
  if (!error || typeof error !== "object") {
    return { name: "", message: "" }
  }
  const err = error as { name?: string; message?: string }
  return { name: err.name ?? "", message: err.message ?? "" }
}

export function isChunkLoadError(error: unknown): boolean {
  const { name, message: msg } = errorText(error)
  if (!name && !msg) return false
  return (
    // Webpack / Turbopack
    name === "ChunkLoadError" ||
    msg.includes("Failed to load chunk") ||
    msg.includes("Loading chunk") ||
    msg.includes("ChunkLoadError") ||
    // Vite
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing binding name") ||
    msg.includes("does not provide an export named") ||
    msg.includes("Outdated Optimize Dep")
  )
}

export function clearDevChunkReloadFlag(): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(DEV_CHUNK_RELOAD_FLAG)
  } catch {
    /* private mode / quota */
  }
}

/** Reload once per cooldown window. Returns false when a reload was just attempted. */
export function reloadOnStaleDevChunk(): boolean {
  if (typeof window === "undefined") return false
  const now = Date.now()
  try {
    const last = Number(window.sessionStorage.getItem(DEV_CHUNK_RELOAD_FLAG) ?? "0")
    if (Number.isFinite(last) && last > 0 && now - last < DEV_CHUNK_RELOAD_COOLDOWN_MS) {
      return false
    }
    window.sessionStorage.setItem(DEV_CHUNK_RELOAD_FLAG, String(now))
  } catch {
    /* continue — a reload is still better than a blank shell */
  }
  window.location.reload()
  return true
}
