/**
 * Logs only in development. Use for mock flows (export, submit) instead of raw console.log.
 */
export function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === "development") {
    console.log(...args)
  }
}
